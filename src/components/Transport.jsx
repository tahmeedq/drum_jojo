import { useState } from "react";
import { S } from "../engine/state.js";
import { Audio } from "../engine/audio/engine.js";
import { toggle, setBpm, tap } from "../engine/core/scheduler.js";
import { activeRows } from "../engine/core/patterns.js";
import { ROWS } from "../engine/data/index.js";
import { store, saveStore } from "../engine/core/store.js";
import { useBus, useForceRender, useRenderOn } from "../hooks/useBus.js";

const labelFor = (id) => (ROWS.find(r => r.id === id) || {}).label || id;
const PRESETS = [60, 80, 100, 120, 140, 160];

// Push every stored volume into its gain stage (called on play + slider edits).
function applyMix() {
  Audio.setVolume(store.vol);
  Audio.setKitVolume(store.volKit);
  Audio.setClickVolume(store.volClick);
  Audio.setMonitorVolume(store.volMidi);
}

export default function Transport() {
  useRenderOn(["view"]);
  const rerender = useForceRender();
  const [bpm, setBpmState] = useState(S.bpm);
  const [play, setPlay] = useState({ playing: false, label: "▶" });
  const [rep, setRep] = useState(0);
  const [more, setMore] = useState(false);   // secondary-tools drawer

  useBus("bpm", (d) => setBpmState(d.bpm));
  useBus("transport", (d) => {
    if (d.playing) { setPlay({ playing: true, label: S.countIn ? "4" : "■" }); applyMix(); setRep(0); }
    else setPlay({ playing: false, label: "▶" });
  });
  useBus("count", (d) => setPlay(p => ({ ...p, label: d.n > 0 ? String(d.n) : "■" })));
  useBus("rep", (d) => setRep(d.rep));

  const toggleS = (key, persistKey) => {
    S[key] = !S[key];
    if (persistKey) { store[persistKey] = S[key]; saveStore(); }
    rerender();
  };

  return (
    <section className="transport">
      {/* Secondary practice tools live in an expandable drawer above the slim bar. */}
      {more && (
        <div className="transport-drawer">
          <div className="toolgroup">
            <span className="toollabel">Speed Trainer</span>
            <button className={"mini" + (S.trainer ? " on" : "")} onClick={() => toggleS("trainer")} title="Raise tempo each loop">Auto-tempo</button>
            <select className="dropdown" defaultValue={S.trainerInc} onChange={(e) => { S.trainerInc = +e.target.value; }}>
              {[2, 4, 6, 10].map(n => <option key={n} value={n}>+{n} bpm</option>)}
            </select>
            <select className="dropdown" defaultValue={S.trainerTarget} onChange={(e) => { S.trainerTarget = +e.target.value; }}>
              <option value="0">no target</option>
              {[100, 120, 140, 160, 180, 200].map(n => <option key={n} value={n}>→ {n} bpm</option>)}
            </select>
          </div>

          <div className="toolgroup">
            <span className="toollabel">Practice</span>
            <button className={"mini amber" + (S.guideMute ? " on" : "")} onClick={() => toggleS("guideMute")} title="Mute the kit, keep the click">Metronome Only</button>
            <button className={"mini blue" + (S.trade ? " on" : "")} onClick={() => toggleS("trade")} title="Alternate demo bar / your bar">Trade: Demo↔You</button>
          </div>
        </div>
      )}

      <div className="transport-bar">
        <button className={"play" + (play.playing ? " on" : "")} onClick={toggle} title="Play / Stop (Space)">
          {play.label}
        </button>

        <div className="ctl tempo-ctl">
          <label>BPM</label>
          <div className="bpmrow">
            <input type="number" min="30" max="280" value={bpm}
              onChange={(e) => setBpm(e.target.value)} />
            <input type="range" min="30" max="280" value={bpm}
              onChange={(e) => setBpm(e.target.value)} />
          </div>
          <div className="presets">
            {PRESETS.map(b => <button key={b} onClick={() => setBpm(b)}>{b}</button>)}
            <button className="tap" onClick={tap} title="Tap tempo (T)">👆</button>
          </div>
        </div>

        <div className="tp-sep" />

        <div className="tp-group">
          <span className="tp-label">Metro</span>
          <button className={"mini" + (S.click ? " on" : "")} onClick={() => toggleS("click")}>Click</button>
          <select className="dropdown" defaultValue={S.clickRes} onChange={(e) => { S.clickRes = e.target.value; }}>
            <option value="beat">Beats</option>
            <option value="all">Subdiv</option>
          </select>
          <button className={"mini" + (S.countIn ? " on" : "")} onClick={() => toggleS("countIn")} title="Count-in">Count-in</button>
        </div>

        <div className="tp-sep" />

        <div className="tp-group">
          <span className="tp-label">Loop</span>
          <button className={"mini" + (S.loop ? " on" : "")} onClick={() => toggleS("loop")}>Loop</button>
          <select className="dropdown" defaultValue={S.loopBars} onChange={(e) => { S.loopBars = +e.target.value; }}>
            {[1, 2, 4, 8].map(n => <option key={n} value={n}>{n} bar{n > 1 ? "s" : ""}</option>)}
          </select>
          <select className="dropdown" defaultValue={S.repTarget} onChange={(e) => { S.repTarget = +e.target.value; }} title="Stop after N reps">
            <option value="0">∞ reps</option>
            {[4, 8, 16, 32].map(n => <option key={n} value={n}>{n} reps</option>)}
          </select>
          {play.playing && <span className="repcount">rep {rep}</span>}
        </div>

        <div className="tp-sep" />

        <div className="tp-group swingrow">
          <span className="tp-label">Swing</span>
          <input type="range" min="0" max="60" value={Math.round(S.swing * 100)}
            onChange={(e) => { S.swing = +e.target.value / 100; store.swing = S.swing; saveStore(); rerender(); }} />
          <span className="swingval">{Math.round(S.swing * 100)}%</span>
        </div>

        <div className="tp-sep" />

        <div className="ctl mixer-ctl">
          <span className="tp-label">Mix</span>
          <div className="mixer">
            <MixSlider lbl="Mst" k="vol" apply={(v) => Audio.setVolume(v)} />
            <MixSlider lbl="Kit" k="volKit" apply={(v) => Audio.setKitVolume(v)} />
            <MixSlider lbl="Clk" k="volClick" apply={(v) => Audio.setClickVolume(v)} />
          </div>
        </div>

        <button className={"tp-more" + (more ? " on" : "")} onClick={() => setMore(m => !m)}
          title="More practice tools" aria-label="Toggle practice tools">⋯</button>
      </div>

      {/* Per-voice mute is a high-frequency practice action — always visible. */}
      <MuteRow />
    </section>
  );
}

function MixSlider({ lbl, k, apply }) {
  const [v, setV] = useState(store[k]);
  return (
    <div className="mixrow">
      <span className="mixlbl">{lbl}</span>
      <input type="range" min="0" max="100" value={v}
        onChange={(e) => { const n = +e.target.value; setV(n); store[k] = n; apply(n); saveStore(); }} />
      <span className="mixval">{v}</span>
    </div>
  );
}

function MuteRow() {
  useRenderOn(["view", "partChanged"]);
  const rerender = useForceRender();
  const rows = activeRows();
  return (
    <div className="voices">
      <span className="lbl">Mute (play these yourself):</span>
      {rows.map(row => (
        <button key={row.id} className={S.muted[row.id] ? "muted" : ""}
          onClick={() => { S.muted[row.id] = !S.muted[row.id]; rerender(); }}>
          {labelFor(row.id)}
        </button>
      ))}
    </div>
  );
}
