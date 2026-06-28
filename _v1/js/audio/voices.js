/* ============================================================
   Voices — real sampled one-shots when available, synthesized
   fallbacks otherwise. Exposes trigger(id, time, velocity).
   ============================================================ */
import { Audio } from "./engine.js";
import { DRUM_SAMPLES } from "./samples.js";

const BUFFERS = {};        // decoded real samples by voice id
let samplesReady = false, noiseBuf = null;

function getNoise() {
  if (!noiseBuf) {
    const ctx = Audio.ctx, len = ctx.sampleRate;
    const b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = b;
  }
  return noiseBuf;
}

function b64ToBuf(uri) {
  const b = atob(uri.split(",")[1]);
  const a = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a.buffer;
}

export function loadSamples() {
  Audio.init();
  const ids = Object.keys(DRUM_SAMPLES);
  return Promise.all(ids.map(id => new Promise(res => {
    try { Audio.ctx.decodeAudioData(b64ToBuf(DRUM_SAMPLES[id]), buf => { BUFFERS[id] = buf; res(); }, () => res()); }
    catch (e) { res(); }
  }))).then(() => { samplesReady = true; return kitInfo(); });
}

export const isSamplesReady = () => samplesReady;
export function kitInfo() {
  const n = Object.keys(BUFFERS).length;
  return { sampled: n, label: n > 0 ? `Acoustic kit · ${n} sampled voices` : "Synth kit" };
}

/* ---- synthesis helpers (fallback voices + cymbals) ---- */
function env(g, t, a, d, peak) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function tone(type, f, t, dur, peak, glide, gt) {
  const ctx = Audio.ctx, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + (gt || dur));
  env(g, t, 0.001, dur, peak); o.connect(g); g.connect(Audio.bus);
  o.start(t); o.stop(t + dur + 0.05);
}
function nz(t, dur, peak, type, freq, q) {
  const ctx = Audio.ctx, n = ctx.createBufferSource(); n.buffer = getNoise();
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
  const g = ctx.createGain(); env(g, t, 0.001, dur, peak);
  n.connect(f); f.connect(g); g.connect(Audio.bus); n.start(t); n.stop(t + dur + 0.05);
}

const Synth = {
  kick(t, v = 1) { tone("sine", 125, t, 0.34, v, 48, 0.10); tone("sine", 60, t, 0.30, v * 0.7, 40, 0.18); nz(t, 0.012, v * 0.5, "highpass", 3500); },
  snare(t, v = 1) { tone("triangle", 185, t, 0.13, v * 0.45); tone("triangle", 330, t, 0.10, v * 0.3); nz(t, 0.20, v * 0.7, "highpass", 1500); nz(t, 0.16, v * 0.5, "bandpass", 3200, 1.2); nz(t, 0.025, v * 0.55, "highpass", 6500); },
  hat(t, v = 1) { nz(t, 0.045, v * 0.5, "highpass", 8000); nz(t, 0.03, v * 0.35, "bandpass", 11000, 2); },
  openhat(t, v = 1) { nz(t, 0.38, v * 0.42, "highpass", 7500); nz(t, 0.3, v * 0.28, "bandpass", 10000, 2); },
  ride(t, v = 1) { tone("triangle", 820, t, 0.4, v * 0.18); tone("triangle", 1180, t, 0.35, v * 0.12); nz(t, 0.5, v * 0.16, "highpass", 5500); },
  crash(t, v = 1) { nz(t, 1.3, v * 0.5, "highpass", 3500); nz(t, 1.1, v * 0.3, "bandpass", 7000, 1); tone("triangle", 520, t, 0.5, v * 0.1); },
  rim(t, v = 1) { tone("square", 420, t, 0.025, v * 0.5); tone("triangle", 1700, t, 0.03, v * 0.35); nz(t, 0.02, v * 0.3, "highpass", 2500); },
  tom(t, v, f) { tone("sine", f, t, 0.34, v * 0.9, f * 0.55, 0.22); nz(t, 0.02, v * 0.3, "bandpass", f * 2.5, 1); },
  tom1(t, v = 1) { Synth.tom(t, v, 220); }, tom2(t, v = 1) { Synth.tom(t, v, 165); }, floor(t, v = 1) { Synth.tom(t, v, 110); },
  click(t, accent) { tone("square", accent ? 2000 : 1300, t, 0.03, 0.32); },
};

export function trigger(id, t, vel) {
  if (id === "click") { Synth.click(t, vel); return; }
  if (BUFFERS[id]) {
    const s = Audio.ctx.createBufferSource(); s.buffer = BUFFERS[id];
    s.playbackRate.value = 1 + (Math.random() * 0.03 - 0.015);
    const g = Audio.ctx.createGain(); g.gain.value = Math.min(1.6, vel);
    s.connect(g); g.connect(Audio.bus); s.start(t);
  } else (Synth[id] || Synth.snare)(t, vel);
}
