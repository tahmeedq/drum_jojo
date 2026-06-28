/* ============================================================
   Pattern parsing & preparation.
     X = accent(2)  x = hit(1)  o = ghost(3)  . = rest(0)
   ============================================================ */
import { ROWS } from "../data/index.js";
import { S } from "../state.js";

const r = (s) => s.split("").map(c => c === "X" ? 2 : c === "x" ? 1 : c === "o" ? 3 : 0);
const CHAR = { 0: ".", 1: "x", 2: "X", 3: "o" };
const pad = (s, n) => { s = s || ""; while (s.length < n) s += "."; return s; };

export function prep(p) {
  if (p._ready) return p;
  if (p.hits) { p.tracks = p.tracks || {}; p.tracks.snare = p.hits; }
  const t = {}; let steps = 0; const tr = p.tracks || {};
  for (const id in tr) { t[id] = r(tr[id]); steps = Math.max(steps, t[id].length); }
  for (const id in t) { while (t[id].length < steps) t[id].push(0); }
  p._t = t; p._steps = steps;
  p._stick = p.stick ? pad(p.stick, steps) : null;
  p._orn = p.orn ? pad(p.orn, steps) : null;
  p._ready = true;
  return p;
}

// Rows actually present in the current pattern, in display order.
export const activeRows = () => ROWS.filter(row => S.current && S.current._t[row.id]);

/* ---- Editing support (custom pattern editor) ---- */

// Cycle a cell through rest → hit → accent → ghost → rest.
export function cycleCell(p, rowId, step) {
  if (!p._t[rowId]) p._t[rowId] = new Array(p._steps).fill(0);
  const cur = p._t[rowId][step] || 0;
  p._t[rowId][step] = cur === 0 ? 1 : cur === 1 ? 2 : cur === 2 ? 3 : 0;
  return p._t[rowId][step];
}

// Serialize the live _t arrays back into compact track strings for saving.
export function tracksToStrings(p) {
  const tracks = {};
  for (const id in p._t) {
    if (p._t[id].some(v => v > 0)) tracks[id] = p._t[id].map(v => CHAR[v] || ".").join("");
  }
  return tracks;
}

// Build a blank, ready-to-edit pattern.
let customSeq = 0;
export function blankPattern({ name, meter = "4/4", sub = 4, bars = 1, bpm = 90, beats = 4 } = {}) {
  const steps = beats * sub * bars;
  const tracks = {};
  ["hat", "snare", "kick"].forEach(id => (tracks[id] = ".".repeat(steps)));
  return prep({
    _custom: true, _id: "custom-" + Date.now() + "-" + (customSeq++),
    name: name || "Untitled groove", meter, sub, bpm, beats, bars,
    style: "My Patterns", diff: 1, desc: "Your custom pattern.",
    tip: "Click cells to add notes — tap again to cycle hit → accent → ghost.",
    tracks,
  });
}

// Rebuild a saved custom pattern object from storage (forces a fresh prep).
export function fromSaved(saved) {
  return prep({ ...saved, _custom: true, _ready: false, _t: undefined });
}
