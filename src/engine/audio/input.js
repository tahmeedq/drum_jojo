/* ============================================================
   Audio input — captures an interface's sound (e.g. a V-Drums
   module's USB audio) inside the shared AudioContext, so every
   recorded sample sits on the scheduler's clock.

   A tiny AudioWorklet taps the input and posts blocks of PCM
   stamped with their context frame ("audioChunk"), plus a peak
   level for the meter ("audioLevel"). Nothing is routed to the
   speakers: you hear your kit through the module.
   ============================================================ */
import { Audio } from "./engine.js";
import { emit } from "../state.js";
import { store, saveStore } from "../core/store.js";

const TAP = `class Tap extends AudioWorkletProcessor {
  constructor() { super(); this.peak = 0; this.since = 0; this.buf = null; this.n = 0; this.frame = 0; }
  flush() {
    if (this.buf && this.n) this.port.postMessage({ frame: this.frame, chans: this.buf.map((b) => b.slice(0, this.n)) });
    this.buf = null; this.n = 0;
  }
  process(inputs) {
    const ch = inputs[0];
    if (!ch || !ch.length) return true;
    const len = ch[0].length;
    for (const c of ch) for (let i = 0; i < len; i++) { const a = c[i] < 0 ? -c[i] : c[i]; if (a > this.peak) this.peak = a; }
    if ((this.since += len) >= 2400) { this.port.postMessage({ peak: this.peak }); this.peak = 0; this.since = 0; }
    if (!this.buf) { this.buf = ch.slice(0, 2).map(() => new Float32Array(8192)); this.frame = currentFrame; }
    for (let k = 0; k < this.buf.length; k++) this.buf[k].set(ch[k], this.n);
    if ((this.n += len) + len > 8192) this.flush();
    return true;
  }
}
registerProcessor("dojo-tap", Tap);`;

let stream = null, src = null, tap = null, sink = null, label = "", loaded = false;

export const AudioIn = {
  get on() { return !!tap; },
  get label() { return label; },

  // Audio inputs, labelled once the browser has granted access.
  async devices() {
    const all = await navigator.mediaDevices.enumerateDevices();
    return all.filter((d) => d.kind === "audioinput" && d.deviceId !== "default" && d.deviceId !== "communications")
      .map((d) => ({ id: d.deviceId, label: d.label || "Audio input" }));
  },

  // Open an input (by id, or the saved one). Raw signal: no echo cancel, noise gate or AGC.
  async open(id = store.audioIn) {
    this.close();
    Audio.init(); Audio.resume();
    const ctx = Audio.ctx;
    stream = await navigator.mediaDevices.getUserMedia({ audio: {
      deviceId: id ? { exact: id } : undefined, channelCount: { ideal: 2 },
      echoCancellation: false, noiseSuppression: false, autoGainControl: false,
    } });
    if (!loaded) {
      const url = URL.createObjectURL(new Blob([TAP], { type: "application/javascript" }));
      await ctx.audioWorklet.addModule(url); loaded = true;
    }
    const track = stream.getAudioTracks()[0];
    label = track.label || "Audio input";
    store.audioIn = id || track.getSettings().deviceId || null; saveStore();
    src = ctx.createMediaStreamSource(stream);
    // Two channels: a mono input is spread to both, a many-channel interface gives its first pair.
    tap = new AudioWorkletNode(ctx, "dojo-tap", { channelCount: 2, channelCountMode: "explicit", channelInterpretation: "speakers" });
    tap.port.onmessage = (e) => {
      const d = e.data;
      if (d.peak !== undefined) emit("audioLevel", { peak: d.peak });
      else emit("audioChunk", { t0: d.frame / ctx.sampleRate, rate: ctx.sampleRate, chans: d.chans });
    };
    sink = ctx.createGain(); sink.gain.value = 0;          // keeps the tap pulled, silently
    src.connect(tap); tap.connect(sink); sink.connect(ctx.destination);
    emit("audioIn", { on: true, label, id: store.audioIn });
    return label;
  },

  close() {
    if (!tap) return;
    src.disconnect(); tap.disconnect(); sink.disconnect(); tap.port.onmessage = null;
    stream.getTracks().forEach((t) => t.stop());
    stream = src = tap = sink = null;
    emit("audioIn", { on: false, label: "" });
  },
};

// 24-bit PCM WAV, with 2ms fades so a cut mid-ring doesn't click.
export function wavBytes(chans, rate) {
  const nCh = chans.length, n = chans[0].length, block = nCh * 3, fade = Math.min(n >> 1, Math.round(rate / 500));
  const v = new DataView(new ArrayBuffer(44 + n * block));
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + n * block, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nCh, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * block, true); v.setUint16(32, block, true); v.setUint16(34, 24, true);
  str(36, "data"); v.setUint32(40, n * block, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    const g = i < fade ? i / fade : i >= n - fade ? (n - 1 - i) / fade : 1;
    for (let c = 0; c < nCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i] * g)), q = Math.round(s < 0 ? s * 0x800000 : s * 0x7fffff);
      v.setUint8(o, q & 255); v.setUint8(o + 1, (q >> 8) & 255); v.setUint8(o + 2, (q >> 16) & 255); o += 3;
    }
  }
  return new Uint8Array(v.buffer);
}
