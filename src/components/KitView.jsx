import { useEffect, useRef } from "react";
import { S, on } from "../engine/state.js";
import { useRenderOn } from "../hooks/useBus.js";

const COLORS = {
  crash: "#ff4d6d", ride: "#ff9e3d", openhat: "#ffe14d", hat: "#ffce3a",
  tom1: "#b07bff", tom2: "#8b8bff", floor: "#6e7bff",
  snare: "#36d0ff", rim: "#ff8ab0", kick: "#ff7a3d",
};
// voices without their own drawn piece flash a related piece
const ALIAS = { openhat: "hat", rim: "snare" };

// drawn pieces (top-down kit), back-to-front
const PIECES = [
  { id: "crash", kind: "cym",  cx: 92,  cy: 56,  rx: 50, ry: 18, label: "Crash" },
  { id: "ride",  kind: "cym",  cx: 322, cy: 52,  rx: 57, ry: 20, label: "Ride" },
  { id: "hat",   kind: "cym",  cx: 52,  cy: 152, rx: 45, ry: 16, label: "Hi-Hat" },
  { id: "tom1",  kind: "drum", cx: 172, cy: 104, r: 35,  label: "Tom 1" },
  { id: "tom2",  kind: "drum", cx: 250, cy: 104, r: 37,  label: "Tom 2" },
  { id: "snare", kind: "drum", cx: 120, cy: 200, r: 42,  label: "Snare" },
  { id: "floor", kind: "drum", cx: 336, cy: 190, r: 48,  label: "Floor" },
  { id: "kick",  kind: "kick", cx: 214, cy: 258, r: 60,  label: "Kick" },
];

export default function KitView() {
  useRenderOn(["view", "partChanged"]);
  const root = useRef(null);
  const p = S.current;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const flash = (id) => {
      const target = ALIAS[id] || id;
      const g = el.querySelector(`[data-piece="${target}"]`);
      if (!g) return;
      g.classList.remove("hit"); void g.getBoundingClientRect(); g.classList.add("hit");
      clearTimeout(g._t); g._t = setTimeout(() => g.classList.remove("hit"), 170);
    };
    const offTick = on("tick", ({ step }) => {
      if (!S.playing || !S.current) return;
      const t = S.current._t;
      for (const id in t) if ((t[id][step] || 0) > 0) flash(id);
    });
    const offHit = on("midiHit", ({ id, matched }) => { if (id) flash(id); });
    const offStop = on("transport", (d) => {
      if (!d.playing) el.querySelectorAll(".hit").forEach(g => g.classList.remove("hit"));
    });
    return () => { offTick(); offHit(); offStop(); };
  }, []);

  if (!p) return null;
  const present = (id) => !!(p._t[id] || p._t[ALIAS[id]] ||
    (id === "hat" && p._t.openhat) || (id === "snare" && p._t.rim));

  return (
    <div className="kitview">
      <svg viewBox="0 0 430 320" ref={root} className="kit-svg">
        {PIECES.map(pc => {
          const dim = present(pc.id) ? "" : " dim";
          const c = COLORS[pc.id];
          return (
            <g key={pc.id} data-piece={pc.id} className={"kit-piece" + dim} style={{ "--c": c }}>
              {pc.kind === "cym" ? (
                <>
                  <ellipse className="shape" cx={pc.cx} cy={pc.cy} rx={pc.rx} ry={pc.ry} />
                  <circle className="bell" cx={pc.cx} cy={pc.cy} r="5" />
                </>
              ) : (
                <>
                  <circle className="shape" cx={pc.cx} cy={pc.cy} r={pc.r} />
                  <circle className="rim" cx={pc.cx} cy={pc.cy} r={pc.r - 7} />
                </>
              )}
              <text className="lbl" x={pc.cx} y={pc.cy + (pc.kind === "cym" ? pc.ry + 15 : pc.r + 15)}>{pc.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="kit-hint">Each piece lights up as it's played — and flashes your live MIDI hits.</div>
    </div>
  );
}
