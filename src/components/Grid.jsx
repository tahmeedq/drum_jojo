import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { S, COUNT, on, emit } from "../engine/state.js";
import "../styles/loop-section.css";
import { activeRows, cycleCell, tracksToStrings, blankPattern } from "../engine/core/patterns.js";
import { ROWS } from "../engine/data/index.js";
import { store, saveStore } from "../engine/core/store.js";
import { setEditMode, loadCustom, selectSection } from "../engine/controller.js";
import { useBus, useForceRender, useRenderOn } from "../hooks/useBus.js";

// Heavy/secondary views are code-split so the app (and the default Grid view)
// loads light — VexFlow only downloads when Notation is first opened.
const Notation = lazy(() => import("./Notation.jsx"));
const KitView = lazy(() => import("./KitView.jsx"));
const Highway = lazy(() => import("./Highway.jsx"));

const labelFor = (id) => (ROWS.find(r => r.id === id) || {}).label || id;

// Per-instrument colors so a pattern reads at a glance (piano-roll style).
const COLORS = {
  crash: "#ff4d6d", ride: "#ff9e3d", openhat: "#ffe14d", hat: "#ffce3a",
  tom1: "#b07bff", tom2: "#8b8bff", floor: "#6e7bff",
  snare: "#36d0ff", rim: "#ff8ab0", kick: "#ff7a3d",
};
const colorFor = (id) => COLORS[id] || "#36d0ff";

export default function Grid() {
  useRenderOn(["view", "partChanged"]);
  const rerender = useForceRender();
  const tableRef = useRef(null);
  const [scoreView, setScoreView] = useState(store.scoreView === "notation" ? "notation" : "grid");
  const p = S.current;
  const setView = (v) => { setScoreView(v); store.scoreView = v; saveStore(); };

  // Real-time playhead + MIDI flashes via direct DOM (kept out of React's
  // render path so fast events never trigger reconciliation).
  useEffect(() => {
    const clear = () => {
      const t = tableRef.current; if (!t) return;
      t.querySelectorAll(".playcol,.flash").forEach(c => c.classList.remove("playcol", "flash"));
    };
    const offTick = on("tick", ({ step }) => {
      const table = tableRef.current;
      if (!S.playing || !table) return;
      clear();
      table.querySelectorAll(`[data-step="${step}"]`).forEach(c => {
        c.classList.add("playcol");
        if (c.classList.contains("on")) c.classList.add("flash");
      });
    });
    const offStop = on("transport", (d) => { if (!d.playing) clear(); });
    const offHit = on("midiHit", ({ id, step, rating, dynOk, matched }) => {
      const table = tableRef.current;
      if (!matched || step == null || !table) return;
      const cell = table.querySelector(`td.cell[data-step="${step}"][data-row="${id}"]`);
      if (!cell) return;
      const cls = "hit-" + rating + (dynOk === false ? " hit-dyn" : "");
      cell.classList.remove("hit-perfect", "hit-good", "hit-off", "hit-dyn");
      void cell.offsetWidth;
      cls.split(" ").forEach(c => cell.classList.add(c));
      setTimeout(() => cell.classList.remove("hit-perfect", "hit-good", "hit-off", "hit-dyn"), 380);
    });
    return () => { offTick(); offStop(); offHit(); };
  }, []);

  // ── Loop-section selection ──────────────────────────────────────────────
  // Hooks must be called unconditionally (before any early return), so these
  // live above the `if (!p)` guard. Effects guard themselves with `if (!p)`.
  //
  // S.loopSel is { start, end } (inclusive step indices) or null.
  // Local state mirrors S.loopSel so the grid re-renders on changes.
  const [loopSel, setLoopSel] = useState(() => S.loopSel || null);
  // dragRef holds the anchor step index while the user is dragging.
  const dragRef = useRef(null);

  // Clamp or clear a stale selection whenever the pattern's step count changes.
  // Depends on p?._steps so it re-runs when the pattern is resized or swapped.
  useEffect(() => {
    if (!p || !S.loopSel) { if (!p) return; setLoopSel(null); return; }
    const maxStep = p._steps - 1;
    if (S.loopSel.start > maxStep) {
      // Entire selection is beyond the new end — clear it.
      S.loopSel = null; setLoopSel(null); emit("loopsel", null);
    } else if (S.loopSel.end > maxStep) {
      // Clamp the end to the last valid step.
      const clamped = { start: S.loopSel.start, end: maxStep };
      S.loopSel = clamped; setLoopSel(clamped); emit("loopsel", clamped);
    } else {
      setLoopSel({ ...S.loopSel }); // sync local state in case S was mutated externally
    }
  }, [p?._steps]); // eslint-disable-line react-hooks/exhaustive-deps

  // Release drag tracking when the mouse button goes up anywhere on the page.
  useEffect(() => {
    const onUp = () => { dragRef.current = null; };
    document.addEventListener("mouseup", onUp);
    return () => document.removeEventListener("mouseup", onUp);
  }, []);

  /** Begin a drag-select from a beat-header cell. */
  const startLoopDrag = (step) => {
    dragRef.current = step;
    const sel = { start: step, end: step };
    S.loopSel = sel; setLoopSel(sel); emit("loopsel", sel);
  };

  /** Extend the current drag as the pointer enters adjacent header cells. */
  const extendLoopDrag = (step) => {
    if (dragRef.current === null) return;
    const anchor = dragRef.current;
    const sel = anchor <= step
      ? { start: anchor, end: step }
      : { start: step, end: anchor };
    S.loopSel = sel; setLoopSel(sel); emit("loopsel", sel);
  };

  /** Clear the loop selection entirely. */
  const clearLoopSel = () => {
    S.loopSel = null; setLoopSel(null); emit("loopsel", null);
  };
  // ───────────────────────────────────────────────────────────────────────

  if (!p) return null;
  const { _steps: steps, sub } = p;
  const cmap = COUNT[sub] || null;
  const rows = S.editMode ? ROWS : activeRows();

  const onCell = (rowId, step) => {
    if (!S.editMode) return;
    cycleCell(p, rowId, step);
    rerender();
  };

  return (
    <div className="gridzone">
      <div className="scorehead">
        <div className="seg viewtoggle">
          <button className={"mini" + (scoreView === "grid" ? " on" : "")} onClick={() => setView("grid")}>▦ Grid</button>
          <button className={"mini" + (scoreView === "notation" ? " on" : "")} onClick={() => setView("notation")}>♪ Notation</button>
          <button className={"mini" + (scoreView === "kit" ? " on" : "")} onClick={() => setView("kit")}>🥁 Kit</button>
          <button className={"mini" + (scoreView === "highway" ? " on" : "")} onClick={() => setView("highway")}>🛣 Highway</button>
        </div>
        {scoreView === "grid" && <EditBar />}
      </div>
      <CoachBanner />
      <Toasts />

      {scoreView !== "grid" ? (
        <Suspense fallback={<div className="view-loading">Loading view…</div>}>
          {scoreView === "highway" ? <Highway /> : scoreView === "kit" ? <KitView /> : <Notation />}
        </Suspense>
      ) : (
      <div className="gridwrap">
        <table className="grid" ref={tableRef}>
          <tbody>
            <tr>
              <th className="rowlabel beatnum">Beat</th>
              {Array.from({ length: steps }, (_, s) => {
                const within = s % sub;
                const alt = Math.floor(s / sub) % 2 === 1 ? " bg-alt" : "";
                const inLoop = loopSel && s >= loopSel.start && s <= loopSel.end;
                return (
                  <th key={s} data-step={s}
                    className={"beatnum" + (within === 0 ? " beatstart" : "") + alt + (inLoop ? " loop-col" : "")}
                    onMouseDown={(e) => { e.preventDefault(); startLoopDrag(s); }}
                    onMouseEnter={() => extendLoopDrag(s)}>
                    {within === 0 ? Math.floor(s / sub) + 1 : ""}
                  </th>
                );
              })}
            </tr>

            {/* Loop-section indicator strip — drag the beat header above to set the loop range */}
            <tr className="loop-sel-row">
              <td className="rowlabel loop-sel-label">
                {loopSel
                  ? <button className="loop-clear" onClick={clearLoopSel}>⟲ Clear</button>
                  : <span className="loop-sel-hint">drag beats↑ to loop</span>}
              </td>
              {Array.from({ length: steps }, (_, s) => {
                const active = loopSel && s >= loopSel.start && s <= loopSel.end;
                const capL   = active && s === loopSel.start;
                const capR   = active && s === loopSel.end;
                return (
                  <td key={s}
                    className={"loop-sel-cell"
                      + (active ? " loop-active" : "")
                      + (capL ? " loop-cap-l" : "")
                      + (capR ? " loop-cap-r" : "")} />
                );
              })}
            </tr>

            {cmap && (
              <tr>
                <td className="rowlabel countcell">Count</td>
                {Array.from({ length: steps }, (_, s) => {
                  const within = s % sub;
                  const alt = Math.floor(s / sub) % 2 === 1 ? " bg-alt" : "";
                  const lbl = within === 0 ? Math.floor(s / sub) + 1 : (cmap[within] || "");
                  return <td key={s} data-step={s} className={"countcell" + (within === 0 ? " beathead beatstart" : "") + alt}>{lbl}</td>;
                })}
              </tr>
            )}

            {p._stick && (
              <tr className="sticking">
                <td className="rowlabel">Sticking</td>
                {Array.from({ length: steps }, (_, s) => {
                  const ch = p._stick[s];
                  const isLR = ch === "R" || ch === "L";
                  const alt = Math.floor(s / sub) % 2 === 1 ? " bg-alt" : "";
                  return <td key={s} data-step={s} className={(isLR ? ch : "") + (s % sub === 0 ? " beatstart" : "") + alt}>{isLR ? ch : ""}</td>;
                })}
              </tr>
            )}

            {rows.map(row => {
              const arr = p._t[row.id] || [];
              return (
                <tr key={row.id} style={{ "--c": colorFor(row.id) }}>
                  <td className="rowlabel">
                    <span className="rl-swatch" />
                    <span className="rl-text">{labelFor(row.id)}</span>
                  </td>
                  {Array.from({ length: steps }, (_, s) => {
                    const v = arr[s] || 0;
                    const alt = Math.floor(s / sub) % 2 === 1 ? " bg-alt" : "";
                    const inLoop = loopSel && s >= loopSel.start && s <= loopSel.end;
                    const cls = ["cell",
                      s % sub === 0 ? "beatstart" : "",
                      v === 1 ? "on" : v === 2 ? "on accent" : v === 3 ? "on ghost" : "",
                      S.editMode ? "editable" : "",
                      inLoop ? "loop-col" : "",
                      alt].join(" ").replace(/\s+/g, " ").trim();
                    const orn = row.id === "snare" && p._orn ? p._orn[s] : null;
                    return (
                      <td key={s} data-step={s} data-row={row.id} className={cls}
                        onClick={() => onCell(row.id, s)}>
                        <div className="dot" />
                        {orn && orn !== "." ? <span className="orn">{orn}</span> : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="legend">
      <span><i className="lg lg-accent" /> accent (loud)</span>
      <span><i className="lg lg-hit" /> hit</span>
      <span><i className="lg lg-ghost" /> ghost (quiet)</span>
      <span><i className="lg lg-play" /> playing now</span>
      <span className="lg-note">each row is color-coded by drum</span>
      <span>f = flam · d = drag · z = buzz</span>
      {S.editMode && <span className="edithint">Click a cell: rest → hit → accent → ghost</span>}
    </div>
  );
}

function EditBar() {
  useRenderOn(["view"]);
  const rerender = useForceRender();
  const p = S.current;
  const isCustom = !!p._custom;

  const save = () => {
    const tracks = tracksToStrings(p);
    const saved = {
      _id: p._id || ("custom-" + Date.now()),
      name: p.name || "Untitled groove",
      meter: p.meter || "4/4", sub: p.sub, bpm: S.bpm,
      beats: p.beats || 4, bars: p.bars || 1,
      style: "My Patterns", diff: 1,
      desc: "Your custom pattern.",
      tip: "Click cells to add notes — tap again to cycle hit → accent → ghost.",
      tracks,
    };
    p._id = saved._id;
    const i = store.custom.findIndex(c => c._id === saved._id);
    if (i >= 0) store.custom[i] = saved; else store.custom.unshift(saved);
    saveStore();
    if (S.sec !== "create") { S.sec = "create"; }
    loadCustom(saved);
  };

  const resize = (key, val) => {
    const beats = key === "beats" ? val : (p.beats || 4);
    const sub = key === "sub" ? val : p.sub;
    const bars = key === "bars" ? val : (p.bars || 1);
    const np = blankPattern({ name: p.name, meter: p.meter, sub, beats, bars, bpm: S.bpm });
    np._id = p._id;
    // keep existing notes where they still fit
    for (const id in p._t) {
      np._t[id] = np._t[id] || new Array(np._steps).fill(0);
      for (let s = 0; s < Math.min(p._steps, np._steps); s++) np._t[id][s] = p._t[id][s];
    }
    S.current = np; rerender();
  };

  return (
    <div className="editbar">
      <button className={"mini" + (S.editMode ? " on" : "")} onClick={() => setEditMode(!S.editMode)}>
        ✎ {S.editMode ? "Editing" : "Edit grid"}
      </button>

      {S.editMode && (
        <>
          <input className="nameinput" value={p.name}
            onChange={(e) => { p.name = e.target.value; rerender(); }} placeholder="Pattern name" />
          <label className="editsel">Beats
            <select defaultValue={p.beats || 4} onChange={(e) => resize("beats", +e.target.value)}>
              {[2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="editsel">Subdiv
            <select defaultValue={p.sub} onChange={(e) => resize("sub", +e.target.value)}>
              <option value={2}>8th</option>
              <option value={4}>16th</option>
              <option value={3}>triplet</option>
              <option value={6}>6/8</option>
            </select>
          </label>
          <label className="editsel">Bars
            <select defaultValue={p.bars || 1} onChange={(e) => resize("bars", +e.target.value)}>
              {[1, 2, 4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button className="btn primary sm" onClick={save}>💾 Save{isCustom ? "" : " as new"}</button>
        </>
      )}
    </div>
  );
}

function CoachBanner() {
  const [state, setState] = useState(null);
  useBus("banner", () => {
    if (!S.trade || !S.playing) { setState(null); return; }
    setState(S.barCount % 2 === 0 ? "demo" : "you");
  });
  useBus("transport", (d) => { if (!d.playing) setState(null); });
  if (!state) return null;
  return (
    <div className={"coach " + state}>
      <span className="big">{state === "demo" ? "🔊" : "🥁"}</span>
      {state === "demo" ? "LISTEN — watch the pattern" : "YOUR TURN — play it!"}
    </div>
  );
}

function Toasts() {
  const [toast, setToast] = useState(null);
  useBus("trainerTarget", () => {
    setToast(`🎯 Target tempo reached — ${S.bpm} bpm!`);
    setTimeout(() => setToast(null), 2600);
  });
  if (!toast) return null;
  return <div className="toast">{toast}</div>;
}
