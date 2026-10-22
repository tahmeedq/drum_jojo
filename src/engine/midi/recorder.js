/* ============================================================
   MIDI take recorder — captures e-kit hits while the transport
   runs and exports them as a Standard MIDI File (type 0, channel
   10) with every note at its absolute song position, so a take of
   bars 19–26 lands on bars 19–26 when dropped at bar 1 in a DAW.

   Time base: the scheduler emits "gridStep" {time, beat, stepBeats,
   stepSec} for every step it schedules (ctx seconds ↔ song beats).
   A hit at ctx time t is placed at the latest grid step ≤ t plus the
   fractional distance into that step. Loop passes become takes.
   ============================================================ */
import { S, emit, on } from "../state.js";
import { store } from "../core/store.js";

const TPQ = 480, NOTE_LEN = TPQ / 8;
const grid = [];                 // ring of recent grid steps
let armed = false, take = null;
export const takes = [];         // {n, hits:[{note,vel,beat}], startBeat, endBeat, bpm, label}

const beatsPerBar = () => (S.current && S.current.beats) || 4;

function startTake(label) {
  console.log("[rec] startTake", (new Error().stack || "").split("\n").slice(1,5).join(" | "));
  take = { n: takes.length + 1, hits: [], startBeat: null, endBeat: null, bpm: S.bpm, label: label || "" };
}
function closeTake() {
  console.log("[rec] closeTake", take ? take.hits.length : null, (new Error().stack || "").split("\n").slice(1,4).join(" | "));
  if (take && take.hits.length) {
    takes.push(take);
    emit("recTake", { takes: takes.length, last: take });
  }
  take = null;
}

on("gridStep", (g) => {
  grid.push(g); if (grid.length > 128) grid.shift();
  if (take) {
    if (take.startBeat === null) take.startBeat = g.beat;
    take.endBeat = g.beat + g.stepBeats;
  }
});
on("transport", (d) => {
  if (d.playing) { grid.length = 0; if (armed) startTake(); }
  else closeTake();
  emit("recState", Recorder.state());
});
// A loop pass completed (song loop or pattern loop): roll to the next take.
on("rep", () => { if (armed && take) { closeTake(); startTake(); emit("recState", Recorder.state()); } });

export const Recorder = {
  get armed() { return armed; },
  arm(v) { armed = !!v; if (armed && S.playing && !take) startTake(); if (!armed) closeTake(); emit("recState", this.state()); },
  state() { return { armed, live: !!take, hits: take ? take.hits.length : 0, takes: takes.length }; },

  // Called by the MIDI engine for every note-on.
  hit(note, vel, tC) {
    if (!take || !grid.length) return;
    const t = tC - (store.midiOffset || 0) / 1000;     // same latency correction as the grader
    let g = grid[0];
    for (let i = grid.length - 1; i >= 0; i--) if (grid[i].time <= t) { g = grid[i]; break; }
    const beat = g.beat + ((t - g.time) / g.stepSec) * g.stepBeats;
    take.hits.push({ note, vel, beat: Math.max(0, beat) });
    emit("recState", this.state());
  },

  clear() { takes.length = 0; closeTake(); emit("recTake", { takes: 0 }); emit("recState", this.state()); },

  // Bars covered by a take (1-based, inclusive) for labels/filenames.
  barsOf(t) {
    const b = beatsPerBar();
    return [Math.floor((t.startBeat || 0) / b) + 1, Math.max(1, Math.ceil((t.endBeat || 0) / b))];
  },

  /* ---- Standard MIDI File writer ---- */
  smf(selected, { quantize = 0 } = {}) {
    const hits = [];
    for (const t of selected) for (const h of t.hits) {
      let beat = h.beat;
      if (quantize) beat = Math.round(beat * quantize) / quantize;
      hits.push({ ...h, tick: Math.round(beat * TPQ) });
    }
    hits.sort((a, b) => a.tick - b.tick || a.note - b.note);
    const bpm = selected.length ? selected[0].bpm : S.bpm;
    const ev = [];                                   // [tick, bytes]
    const txt = `Drum Dojo take${selected.length > 1 ? "s" : ""} — ${S.song ? S.song.name : (S.current && S.current.name) || "pattern"}`;
    ev.push([0, [0xff, 0x03, ...vlqBytes(txt.length), ...strBytes(txt)]]);
    ev.push([0, [0xff, 0x51, 0x03, ...int24(Math.round(60e6 / bpm))]]);
    ev.push([0, [0xff, 0x58, 0x04, beatsPerBar(), 2, 24, 8]]);
    for (const h of hits) {
      ev.push([h.tick, [0x99, h.note & 127, Math.max(1, Math.min(127, h.vel))]]);
      ev.push([h.tick + NOTE_LEN, [0x89, h.note & 127, 0]]);
    }
    const lastTick = hits.length ? hits[hits.length - 1].tick + NOTE_LEN : 0;
    // Pad to the end of the last bar so the region length is whole bars.
    const barTicks = beatsPerBar() * TPQ;
    ev.push([Math.ceil((lastTick + 1) / barTicks) * barTicks, [0xff, 0x2f, 0x00]]);
    ev.sort((a, b) => a[0] - b[0]);
    const body = []; let last = 0;
    for (const [tick, bytes] of ev) { body.push(...vlqBytes(tick - last), ...bytes); last = tick; }
    const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (TPQ >> 8) & 255, TPQ & 255];
    const trk = [0x4d, 0x54, 0x72, 0x6b, ...int32(body.length), ...body];
    return new Uint8Array([...header, ...trk]);
  },

  filename(selected) {
    const song = (S.song ? S.song.name : (S.current && S.current.name) || "pattern").replace(/[^\w]+/g, "-");
    if (selected.length === 1) { const [a, b] = this.barsOf(selected[0]); return `${song}-take${selected[0].n}-bars${a}-${b}.mid`; }
    return `${song}-${selected.length}takes.mid`;
  },

  download(selected, opts) {
    if (!selected.length) return;
    const bytes = this.smf(selected, opts);
    const url = URL.createObjectURL(new Blob([bytes], { type: "audio/midi" }));
    const a = document.createElement("a"); a.href = url; a.download = this.filename(selected);
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
};

function vlqBytes(n) { const out = [n & 0x7f]; while ((n >>= 7) > 0) out.unshift((n & 0x7f) | 0x80); return out; }
function int24(n) { return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function int32(n) { return [(n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function strBytes(s) { return Array.from(s).map(c => c.charCodeAt(0) & 127); }
