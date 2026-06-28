import { useState } from "react";
import { S, emit } from "../engine/state.js";
import { LIB } from "../engine/data/index.js";
import { store, saveStore } from "../engine/core/store.js";
import { setSongPart, setBpm } from "../engine/core/scheduler.js";
import { refreshSong } from "../engine/controller.js";
import { useBus, useForceRender, useRenderOn } from "../hooks/useBus.js";

// All patterns a section can reference: grooves, fills, and saved customs.
function patternOptions() {
  const out = [];
  LIB.groove.forEach(p => out.push(["groove:" + p.name, "Groove · " + p.name]));
  LIB.fill.forEach(p => out.push(["fill:" + p.name, "Fill · " + p.name]));
  store.custom.forEach(p => out.push(["custom:" + p._id, "Mine · " + p.name]));
  return out;
}

export default function SongBuilder() {
  useRenderOn(["view"]);
  const rerender = useForceRender();
  const [now, setNow] = useState(0);
  useBus("partChanged", (d) => setNow(d.idx));
  useBus("transport", (d) => { if (!d.playing) setNow(S.songIdx || 0); });

  const song = S.song;
  if (!song || !S.editSong) return null;
  const opts = patternOptions();

  const update = (i, key, val) => { song.parts[i][key] = val; refreshSong(); };
  const addPart = () => {
    song.parts.push({ label: "Part " + (song.parts.length + 1), src: opts[0][0], bars: 4 });
    refreshSong();
  };
  const del = (i) => { if (song.parts.length <= 1) return; song.parts.splice(i, 1); refreshSong(); };
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= song.parts.length) return;
    [song.parts[i], song.parts[j]] = [song.parts[j], song.parts[i]];
    refreshSong();
  };
  const preview = (i) => { S.songIdx = i; S.barsPlayed = 0; setSongPart(i); setNow(i); emit("partChanged", { idx: i, live: S.playing }); };

  return (
    <div className="songbuilder">
      <div className="sb-head">
        <input className="nameinput" value={song.name}
          onChange={(e) => { song.name = e.target.value; saveStore(); rerender(); }} placeholder="Song name" />
        <label className="editsel">BPM
          <input type="number" min="30" max="280" value={song.bpm} className="sb-bpm"
            onChange={(e) => { song.bpm = +e.target.value; setBpm(song.bpm); saveStore(); rerender(); }} />
        </label>
        <span className="sb-hint">Pick a pattern + bar count per section, then press ▶ to play the whole arrangement.</span>
      </div>

      <div className="sb-parts">
        {song.parts.map((pt, i) => (
          <div className={"sb-part" + (i === now ? " now" : "")} key={i}>
            <button className="sb-go" title="Preview this section" onClick={() => preview(i)}>{i + 1}</button>
            <input className="sb-label" value={pt.label} onChange={(e) => update(i, "label", e.target.value)} />
            <select className="dropdown sb-src" value={pt.src} onChange={(e) => update(i, "src", e.target.value)}>
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className="dropdown" value={pt.bars} onChange={(e) => update(i, "bars", +e.target.value)}>
              {[1, 2, 4, 8, 16].map(n => <option key={n} value={n}>{n} bar{n > 1 ? "s" : ""}</option>)}
            </select>
            <button className="sb-btn" onClick={() => move(i, -1)} title="Move up">↑</button>
            <button className="sb-btn" onClick={() => move(i, 1)} title="Move down">↓</button>
            <button className="sb-btn del" onClick={() => del(i)} title="Delete section">✕</button>
          </div>
        ))}
      </div>

      <button className="btn primary sm" onClick={addPart}>＋ Add section</button>
    </div>
  );
}
