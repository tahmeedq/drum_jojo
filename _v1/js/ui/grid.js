/* ============================================================
   Notation grid — renders the current pattern as a step grid
   and handles the moving playhead + MIDI hit flashes.
   ============================================================ */
import { $, $$, el } from "./dom.js";
import { S, COUNT, on } from "../state.js";
import { activeRows } from "../core/patterns.js";
import { ROWS } from "../data/index.js";

const labelFor = (id) => (ROWS.find(r => r.id === id) || {}).label || id;

export function buildGrid() {
  const g = $("grid"); g.replaceChildren();
  const p = S.current; if (!p) return;
  const steps = p._steps, sub = p.sub, cmap = COUNT[sub] || null;

  // Beat-number header.
  const head = el("tr"); head.appendChild(el("th", "rowlabel beatnum", "Beat"));
  for (let s = 0; s < steps; s++) {
    const within = s % sub;
    const th = el("th", "beatnum" + (within === 0 ? " beatstart" : ""), within === 0 ? (Math.floor(s / sub) + 1) : "");
    th.dataset.step = s; head.appendChild(th);
  }
  g.appendChild(head);

  // Counting row.
  if (cmap) {
    const tr = el("tr"); tr.appendChild(el("td", "rowlabel countcell", "Count"));
    for (let s = 0; s < steps; s++) {
      const within = s % sub;
      const lbl = within === 0 ? (Math.floor(s / sub) + 1) : (cmap[within] || "");
      const td = el("td", "countcell" + (within === 0 ? " beathead beatstart" : ""), lbl);
      td.dataset.step = s; tr.appendChild(td);
    }
    g.appendChild(tr);
  }

  // Sticking row (rudiments).
  if (p._stick) {
    const tr = el("tr"); tr.className = "sticking";
    tr.appendChild(el("td", "rowlabel", "Sticking"));
    for (let s = 0; s < steps; s++) {
      const ch = p._stick[s];
      const td = el("td", (ch === "R" || ch === "L") ? ch : "", (ch === "R" || ch === "L") ? ch : "");
      if (s % sub === 0) td.classList.add("beatstart");
      tr.appendChild(td);
    }
    g.appendChild(tr);
  }

  // Instrument rows.
  activeRows().forEach(row => {
    const tr = el("tr"); tr.appendChild(el("td", "rowlabel", labelFor(row.id)));
    const arr = p._t[row.id];
    for (let s = 0; s < steps; s++) {
      const td = el("td", "cell" + (s % sub === 0 ? " beatstart" : ""));
      td.dataset.step = s; td.dataset.row = row.id;
      const v = arr[s] || 0;
      if (v === 1) td.classList.add("on");
      else if (v === 2) td.classList.add("on", "accent");
      else if (v === 3) td.classList.add("on", "ghost");
      td.appendChild(el("div", "dot", ""));
      if (row.id === "snare" && p._orn) {
        const o = p._orn[s];
        if (o && o !== ".") td.appendChild(el("span", "orn", o));
      }
      tr.appendChild(td);
    }
    g.appendChild(tr);
  });
}

function highlight(step) {
  $$(".playcol").forEach(c => c.classList.remove("playcol"));
  $$(".flash").forEach(c => c.classList.remove("flash"));
  $$(`[data-step="${step}"]`).forEach(c => {
    c.classList.add("playcol");
    if (c.classList.contains("on")) c.classList.add("flash");
  });
}
function clearHL() { $$(".playcol,.flash").forEach(c => c.classList.remove("playcol", "flash")); }

// Flash a specific cell when a MIDI hit is graded.
function flashHit({ id, step, rating, matched }) {
  if (!matched || step == null) return;
  const cell = document.querySelector(`td.cell[data-step="${step}"][data-row="${id}"]`);
  if (!cell) return;
  cell.classList.remove("hit-perfect", "hit-good", "hit-off");
  void cell.offsetWidth;                     // restart the animation
  cell.classList.add("hit-" + rating);
  setTimeout(() => cell.classList.remove("hit-" + rating), 360);
}

on("tick", d => { if (S.playing) highlight(d.step); });
on("transport", d => { if (!d.playing) clearHL(); });
on("midiHit", flashHit);
