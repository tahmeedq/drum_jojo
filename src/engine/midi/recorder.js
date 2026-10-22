/* ============================================================
   MIDI take recorder — captures e-kit hits while the transport
   runs and exports them as a Standard MIDI File (channel 10)
   with every note at its absolute song position, so a take of
   bars 19–26 lands on bars 19–26 when dropped at bar 1 in a DAW.

   Time base: the scheduler emits "gridStep" {time, beat, stepBeats,
   stepSec, rep} for every step it schedules (ctx seconds ↔ song
   beats), ~120ms ahead of the audio. A hit at ctx time t is placed
   at the latest grid step ≤ t plus the fractional distance into
   that step.

   Takes: every play, and every loop pass, is a take. A pass starts
   where the grid jumps (song loop wrap) or, for a looped pattern,
   where the rep counter rolls. The cut sits half a step before the
   pass's first step, so a downbeat played a hair early opens the
   new take instead of trailing the old one.
   ============================================================ */
import { S, emit, on } from "../state.js";
import { store } from "../core/store.js";
import { Audio } from "../audio/engine.js";
import { trigger } from "../audio/voices.js";
import { GM_DRUM_MAP } from "../data/index.js";

const TPQ = 480, NOTE_LEN = TPQ / 8;
// E-kit notes a GM kit won't sound as the pad that sent them → the GM note for the same voice,
// so DAW kits like GarageBand's play them. Roland defaults: hi-hat edge 22/26, floor-tom rim 58,
// crash edges 55/52 (GM splash/china, missing from most kits), ride edge 59; 31 is a snare alias.
const GM_EXPORT = { 22: 42, 26: 46, 31: 38, 58: 43, 55: 49, 52: 57, 59: 51 };
const grid = [];                 // ring of recent grid steps, each tagged with its segment
let seg = 0, lastStep = null;    // segment = one unbroken run of the grid (a pass)
let armed = false, take = null;  // the take being recorded
let closing = null;              // the previous pass, still open to hits that arrive late
let pv = null;                   // listen-back: {take, q:[{time,id,vel}], i, end, timer}
export const takes = [];         // {n, hits:[{note,vel,beat}], startBeat, endBeat, bpm, beats, name}

// Beats per bar — one pattern cycle, as the scheduler counts it (custom patterns can hold several bars).
const beatsPerBar = () => (S.current && S.current._steps ? S.current._steps / S.current.sub / (S.current.bars || 1) : 4);
const itemName = () => (S.mode === "song" && S.song ? S.song.name : (S.current && S.current.name) || "pattern");

// Start a take. With no time yet (count-in, or armed mid-play) the next grid step sets it.
function begin(time = null, beat = null, tol = 0) {
  take = { n: 0, hits: [], seg, startTime: time, startBeat: beat, endBeat: beat, tol,
           bpm: S.bpm, beats: beatsPerBar(), name: itemName() };
}
function keep(t) {
  if (!t.hits.length) return;
  t.n = takes.length + 1;
  takes.push(t);
  emit("recTake", { takes: takes.length, last: t });
}
// Song beat at ctx time t, read off segment s's grid.
function beatAt(s, t) {
  let g = null;
  for (let i = grid.length - 1; i >= 0; i--) {
    const e = grid[i];
    if (e.seg > s) continue;
    if (e.seg < s) break;
    g = e;
    if (e.time <= t) break;
  }
  return g ? g.beat + ((t - g.time) / g.stepSec) * g.stepBeats : null;
}
// Close out on stop/disarm. A take that never got past its first half-step (a stop right on
// a pass boundary) only holds an early downbeat, so it is dropped.
function endTakes() {
  if (closing) { keep(closing); closing = null; }
  if (take && take.startTime !== null) {
    const now = Audio.now();
    if (now >= take.startTime + take.tol) {
      const b = beatAt(take.seg, now);
      if (b !== null) take.endBeat = Math.min(take.endBeat, b);
      keep(take);
    }
  }
  take = null;
}

on("gridStep", (g) => {
  const jump = lastStep && Math.abs(g.beat - (lastStep.beat + lastStep.stepBeats)) > 1e-6;
  const pass = lastStep && g.rep !== lastStep.rep && S.mode !== "song" && S.loop;
  if (jump || pass) seg++;
  lastStep = g;
  grid.push({ ...g, seg }); if (grid.length > 128) grid.shift();
  // Hits for the closing pass are all in once the audio is well past its end.
  if (closing && g.time > closing.endTime + 0.3) { keep(closing); closing = null; }
  if (!take) return;
  if (take.startTime === null) {
    Object.assign(take, { seg, startTime: g.time, startBeat: g.beat, tol: g.stepSec / 2 });
  } else if (take.seg !== seg) {            // a new pass: roll to the next take
    if (closing) keep(closing);
    closing = take; closing.endTime = g.time;
    begin(g.time, g.beat, g.stepSec / 2);
    emit("recState", Recorder.state());
  }
  take.endBeat = g.beat + g.stepBeats;
});
// Feed the listen-back queue to the audio clock, 120ms ahead.
function pump() {
  const horizon = Audio.now() + 0.12;
  while (pv.i < pv.q.length && pv.q[pv.i].time < horizon) { const e = pv.q[pv.i++]; trigger(e.id, e.time, e.vel, "monitor"); }
  if (Audio.now() > pv.end) Recorder.stopPreview();
}

on("transport", (d) => {
  if (d.playing) Recorder.stopPreview();
  endTakes();
  if (d.playing) { grid.length = 0; lastStep = null; seg++; if (armed) begin(); }
  emit("recState", Recorder.state());
});

export const Recorder = {
  get armed() { return armed; },
  arm(v) { armed = !!v; if (armed && S.playing && !take) begin(); if (!armed) endTakes(); emit("recState", this.state()); },
  state() {
    return { armed, live: !!take, hits: take ? take.hits.length : 0,
             takes: takes.length + (closing && closing.hits.length ? 1 : 0) };
  },

  // Called by the MIDI engine for every note-on.
  hit(note, vel, tC) {
    const t = tC - (store.midiOffset || 0) / 1000;     // same latency correction as the grader
    const into = take && take.startTime !== null && t >= take.startTime - take.tol ? take
      : closing && t >= closing.startTime - closing.tol ? closing : null;
    if (!into) return;                                  // count-in, or before recording began
    const beat = beatAt(into.seg, t);
    if (beat === null) return;
    into.hits.push({ note, vel, beat: Math.max(0, beat) });
    emit("recState", this.state());
  },

  // Drop every take; a take in progress starts over from the next step.
  clear() {
    this.stopPreview();
    takes.length = 0; closing = null;
    if (take) begin();
    emit("recTake", { takes: 0 }); emit("recState", this.state());
  },

  // Listen back to a take through the kit at its recorded tempo, with the click if it's on.
  // Quantize matches the export, so you hear what the .mid will hold.
  preview(t, { quantize = 0 } = {}) {
    this.stopPreview();
    if (!t || S.playing) return;
    Audio.init(); Audio.resume();
    const t0 = Audio.now() + 0.15, at = (beat) => t0 + (beat - t.startBeat) * 60 / t.bpm;
    const q = [];
    for (const h of t.hits) {
      const id = GM_DRUM_MAP[h.note];
      if (id) q.push({ time: at(quantize ? Math.round(h.beat * quantize) / quantize : h.beat), id, vel: Math.min(1.4, h.vel / 100) });
    }
    if (S.click) for (let b = Math.ceil(t.startBeat); b < t.endBeat; b++) q.push({ time: at(b), id: "click", vel: b % t.beats === 0 });
    q.sort((a, b) => a.time - b.time);
    pv = { take: t, q, i: 0, end: at(t.endBeat) + 0.3, timer: setInterval(pump, 25) };
    pump();
    emit("recPreview", { n: t.n });
  },
  stopPreview() {
    if (!pv) return;
    clearInterval(pv.timer); pv = null;
    emit("recPreview", { n: 0 });
  },

  // Bars covered by a take (1-based, inclusive) for labels/filenames.
  barsOf(t) {
    const b = t.beats || 4;
    const a = Math.floor((t.startBeat || 0) / b) + 1;
    return [a, Math.max(a, Math.ceil((t.endBeat || 0) / b))];
  },

  /* ---- Standard MIDI File writer ----
     One take → type 0. Several takes → type 1, a track per take, so loop
     passes over the same bars import as separate DAW tracks to comp from. */
  smf(selected, { quantize = 0 } = {}) {
    const first = selected[0] || {};
    const beats = first.beats || beatsPerBar(), bpm = first.bpm || S.bpm;
    const tracks = selected.map((t) => noteEvents(t, quantize));
    // Pad to the end of the last bar so the region length is whole bars.
    const barTicks = beats * TPQ;
    const end = Math.ceil((Math.max(0, ...tracks.map((tr) => tr.end)) + 1) / barTicks) * barTicks;
    const meta = [
      [0, metaText(0x03, `Drum Dojo take${selected.length > 1 ? "s" : ""} - ${first.name || itemName()}`)],
      [0, [0xff, 0x51, 0x03, ...int24(Math.round(60e6 / bpm))]],
      [0, [0xff, 0x58, 0x04, ...timeSig(beats), 24, 8]],
    ];
    const chunks = selected.length === 1
      ? [trackChunk([...meta, ...tracks[0].ev], end)]
      : [trackChunk(meta, end), ...tracks.map((tr, i) => trackChunk([[0, metaText(0x03, `Take ${selected[i].n}`)], ...tr.ev], end))];
    const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, chunks.length > 1 ? 1 : 0,
                    (chunks.length >> 8) & 255, chunks.length & 255, (TPQ >> 8) & 255, TPQ & 255];
    return new Uint8Array([...header, ...chunks.flat()]);
  },

  filename(selected) {
    const song = (selected[0].name || itemName()).replace(/[^\w]+/g, "-");
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

// Note on/off events for one take. A note-off is cut short by the next hit on the same
// note (flams, rolls) and same-tick doubles from quantizing merge, so DAWs keep every stroke.
function noteEvents(t, quantize) {
  const hits = t.hits.map((h) => {
    const beat = quantize ? Math.round(h.beat * quantize) / quantize : h.beat;
    return { note: (GM_EXPORT[h.note] ?? h.note) & 127, vel: Math.max(1, Math.min(127, h.vel)), tick: Math.round(beat * TPQ) };
  }).sort((a, b) => a.tick - b.tick || a.note - b.note);
  const next = {};
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i], j = next[h.note];
    if (j !== undefined && hits[j].tick === h.tick) { hits[j].vel = Math.max(hits[j].vel, h.vel); h.skip = true; continue; }
    h.len = j === undefined ? NOTE_LEN : Math.min(NOTE_LEN, hits[j].tick - h.tick);
    next[h.note] = i;
  }
  const ev = []; let end = 0;
  for (const h of hits) {
    if (h.skip) continue;
    ev.push([h.tick, [0x99, h.note, h.vel]], [h.tick + h.len, [0x89, h.note, 0]]);
    end = Math.max(end, h.tick + h.len);
  }
  return { ev, end };
}
function trackChunk(ev, end) {
  ev.sort((a, b) => a[0] - b[0]);                  // stable: an off stays ahead of a re-hit on its tick
  const body = []; let last = 0;
  for (const [tick, bytes] of ev) { body.push(...vlqBytes(tick - last), ...bytes); last = tick; }
  body.push(...vlqBytes(end - last), 0xff, 0x2f, 0x00);
  return [0x4d, 0x54, 0x72, 0x6b, ...int32(body.length), ...body];
}
// [numerator, log2 denominator] for a bar of `beats` quarters: 4 → 4/4, 3.5 → 7/8, 1.25 → 5/16.
function timeSig(beats) {
  for (const d of [4, 8, 16]) { const n = beats * d / 4; if (Number.isInteger(n)) return [n, Math.log2(d)]; }
  return [4, 2];
}
function metaText(type, s) { const b = new TextEncoder().encode(s); return [0xff, type, ...vlqBytes(b.length), ...b]; }
function vlqBytes(n) { const out = [n & 0x7f]; while ((n >>= 7) > 0) out.unshift((n & 0x7f) | 0x80); return out; }
function int24(n) { return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function int32(n) { return [(n >>> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255]; }
