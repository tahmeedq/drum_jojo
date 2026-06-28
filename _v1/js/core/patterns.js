/* ============================================================
   Pattern parsing & preparation.
     X = accent(2)  x = hit(1)  o = ghost(3)  . = rest(0)
   ============================================================ */
import { ROWS } from "../data/index.js";
import { S } from "../state.js";

const r = (s) => s.split("").map(c => c === "X" ? 2 : c === "x" ? 1 : c === "o" ? 3 : 0);
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
