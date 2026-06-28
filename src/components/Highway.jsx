import { useEffect, useRef } from "react";
import { S, on } from "../engine/state.js";
import { Audio } from "../engine/audio/engine.js";
import { activeRows } from "../engine/core/patterns.js";
import { ROWS } from "../engine/data/index.js";
import { useRenderOn } from "../hooks/useBus.js";

const COLORS = {
  crash: "#ff4d6d", ride: "#ff9e3d", openhat: "#ffe14d", hat: "#ffce3a",
  tom1: "#b07bff", tom2: "#8b8bff", floor: "#6e7bff",
  snare: "#36d0ff", rim: "#ff8ab0", kick: "#ff7a3d",
};
const labelFor = (id) => (ROWS.find(r => r.id === id) || {}).label || id;
const RATING_COL = { perfect: "#3ddc84", good: "#ffce3a", off: "#ff4d6d" };

export default function Highway() {
  useRenderOn(["view", "partChanged"]);
  const ref = useRef(null);
  const p = S.current;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !S.current) return;
    const ctx = canvas.getContext("2d");
    const pat = S.current;
    const lanes = activeRows().map(r => r.id);
    const steps = pat._steps;
    const flashes = {};                 // laneId -> { t, rating }
    let anchor = { step: 0, time: Audio.now() };
    let raf = 0;

    const offTick = on("tick", ({ step }) => {
      anchor = { step, time: Audio.now() };
      lanes.forEach(id => { if ((pat._t[id] && pat._t[id][step]) > 0) flashes[id] = { t: performance.now(), rating: null }; });
    });
    const offHit = on("midiHit", ({ id, rating, matched }) => {
      if (id && lanes.includes(id)) flashes[id] = { t: performance.now(), rating: matched ? rating : "off" };
    });
    const offStop = on("transport", (d) => { if (!d.playing) anchor = { step: 0, time: Audio.now() }; });

    const note = (x, y, laneW, col, v) => {
      const w = v === 2 ? laneW * 0.62 : v === 3 ? laneW * 0.3 : laneW * 0.46;
      const h = v === 2 ? 18 : v === 3 ? 9 : 13;
      ctx.save();
      ctx.globalAlpha = v === 3 ? 0.55 : 1;
      ctx.shadowColor = col; ctx.shadowBlur = 12;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 6); ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      const cssW = canvas.clientWidth || 600, cssH = 380;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
        canvas.width = cssW * dpr; canvas.height = cssH * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const n = lanes.length || 1;
      const laneW = cssW / n;
      const hitY = cssH - 56;
      const windowSteps = Math.max(8, steps);
      const pxPerStep = (hitY - 6) / windowSteps;

      const sd = (60 / S.bpm) / pat.sub;
      const cp = S.playing ? anchor.step + (Audio.now() - anchor.time) / sd : 0;
      const cpMod = ((cp % steps) + steps) % steps;
      const now = performance.now();

      for (let li = 0; li < n; li++) {
        const id = lanes[li], x = li * laneW, col = COLORS[id] || "#36d0ff";
        ctx.fillStyle = li % 2 ? "rgba(255,255,255,0.018)" : "rgba(255,255,255,0)";
        ctx.fillRect(x, 0, laneW, cssH);
        ctx.strokeStyle = "rgba(120,140,170,0.12)";
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cssH); ctx.stroke();

        const arr = pat._t[id] || [];
        for (let i = 0; i < steps; i++) {
          const v = arr[i] || 0; if (v <= 0) continue;
          for (let rep = 0; rep < 2; rep++) {
            const d = ((i - cpMod + steps) % steps) + rep * steps;
            const y = hitY - d * pxPerStep;
            if (y < -18 || y > hitY + 6) continue;
            note(x + laneW / 2, y, laneW, col, v);
          }
        }

        const f = flashes[id];
        if (f) {
          const age = now - f.t;
          if (age < 220) {
            ctx.save();
            ctx.globalAlpha = (1 - age / 220) * 0.6;
            ctx.fillStyle = f.rating ? (RATING_COL[f.rating] || col) : col;
            ctx.fillRect(x, hitY - 16, laneW, 32);
            ctx.restore();
          }
        }

        ctx.fillStyle = "rgba(190,200,214,.8)"; ctx.font = "700 11px Inter,system-ui,sans-serif";
        ctx.textAlign = "center"; ctx.fillText(labelFor(id), x + laneW / 2, cssH - 14);
      }

      // strike line
      ctx.strokeStyle = "rgba(255,210,63,.85)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, hitY); ctx.lineTo(cssW, hitY); ctx.stroke();
      ctx.fillStyle = "rgba(255,210,63,.10)"; ctx.fillRect(0, hitY - 2, cssW, 4);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); offTick(); offHit(); offStop(); };
  });

  if (!p) return null;
  return (
    <div className="highway">
      <canvas ref={ref} className="highway-canvas" />
      <div className="kit-hint">Notes fall to the gold line — play each drum the instant it lands. With MIDI, hits grade green / amber / red.</div>
    </div>
  );
}
