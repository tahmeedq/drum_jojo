/* ============================================================
   MIDI-in timing engine for electronic kits.

   Web MIDI delivers note-on events from the e-drum module with a
   high-resolution timeStamp. We convert that to AudioContext time
   (via engine.perfToCtx), match each hit to the nearest scheduled
   note of the same voice, and grade its offset in milliseconds.
   Negative = ahead of the click (rushing), positive = behind
   (dragging).
   ============================================================ */
import { Audio } from "../audio/engine.js";
import { trigger } from "../audio/voices.js";
import { GM_DRUM_MAP } from "../data/index.js";
import { S, emit, on } from "../state.js";

const WINDOW = 0.18;          // max match distance, seconds
const PERFECT = 18, GOOD = 45; // ms thresholds

let access = null, inputs = [];
let expected = [];            // {id, time, step, used}
const recent = [];           // last N signed ms offsets
let totalMatched = 0, totalInGood = 0;

// Collect scheduled notes to grade against.
on("expectHit", e => expected.push({ id: e.id, time: e.time, step: e.step, used: false }));
on("transport", d => { if (d.playing) MIDI.reset(); });

function prune(nowC) {
  for (let i = expected.length - 1; i >= 0; i--) {
    if (nowC - expected[i].time > WINDOW) expected.splice(i, 1);
  }
}

export const MIDI = {
  get supported() { return !!navigator.requestMIDIAccess; },
  inputNames() { return inputs.map(i => i.name); },

  async enable() {
    if (!this.supported) throw new Error("Web MIDI is not supported in this browser (try Chrome/Edge).");
    Audio.init();
    access = await navigator.requestMIDIAccess({ sysex: false });
    access.onstatechange = () => this._bind();
    this._bind();
    S.midiOn = true;
    emit("midiState", { on: true, inputs: this.inputNames() });
    return this.inputNames();
  },

  disable() {
    inputs.forEach(i => (i.onmidimessage = null));
    S.midiOn = false;
    emit("midiState", { on: false, inputs: [] });
  },

  _bind() {
    if (!access) return;
    inputs.forEach(i => (i.onmidimessage = null));
    inputs = Array.from(access.inputs.values());
    inputs.forEach(inp => (inp.onmidimessage = m => this._msg(m)));
    emit("midiState", { on: S.midiOn, inputs: this.inputNames() });
  },

  _msg(msg) {
    const [status, note, vel] = msg.data;
    if ((status & 0xf0) !== 0x90 || vel === 0) return;   // note-on only
    const id = GM_DRUM_MAP[note];
    const tC = Audio.perfToCtx(msg.timeStamp || performance.now());
    if (S.midiMonitor && id) trigger(id, Audio.now() + 0.001, Math.min(1.4, vel / 100));
    this._grade(id, tC);
  },

  _grade(id, tC) {
    prune(tC);
    let best = null, bestDist = WINDOW;
    for (const ex of expected) {
      if (ex.used || (id && ex.id !== id)) continue;
      const d = Math.abs(tC - ex.time);
      if (d < bestDist) { bestDist = d; best = ex; }
    }
    if (!best) { emit("midiHit", { id, deltaMs: null, rating: "extra", matched: false }); return; }

    best.used = true;
    const deltaMs = (tC - best.time) * 1000, aMs = Math.abs(deltaMs);
    const rating = aMs <= PERFECT ? "perfect" : aMs <= GOOD ? "good" : "off";
    totalMatched++; if (rating !== "off") totalInGood++;
    recent.push(deltaMs); if (recent.length > 24) recent.shift();
    emit("midiHit", { id, step: best.step, deltaMs, rating, matched: true });
    this._emitStats();
  },

  _emitStats() {
    const n = recent.length;
    const mean = n ? recent.reduce((a, b) => a + b, 0) / n : 0;
    const variance = n ? recent.reduce((a, b) => a + (b - mean) ** 2, 0) / n : 0;
    const acc = totalMatched ? Math.round(totalInGood / totalMatched * 100) : 0;
    emit("timingStats", { mean, spread: Math.sqrt(variance), acc, samples: totalMatched });
  },

  reset() {
    expected = []; recent.length = 0; totalMatched = 0; totalInGood = 0;
    emit("timingStats", { mean: 0, spread: 0, acc: 0, samples: 0 });
  },
};
