import { useEffect, useRef, useState } from "react";
import { S, on } from "../engine/state.js";
import { MIDI } from "../engine/midi/midi.js";
import { store, saveStore } from "../engine/core/store.js";
import { useForceRender } from "../hooks/useBus.js";

const pct = (ms) => Math.max(-50, Math.min(50, ms)) + 50;   // -50..50ms → 0..100%

export default function MidiPanel() {
  const rerender = useForceRender();
  const ticksRef = useRef(null);
  const needleRef = useRef(null);
  const [on_, setOn] = useState(S.midiOn);
  const [inputs, setInputs] = useState([]);
  const [status, setStatus] = useState(
    MIDI.supported ? "Connect an electronic kit to grade your timing in real time."
                   : "Web MIDI isn't available in this browser — try Chrome or Edge.");
  const [stats, setStats] = useState({ samples: 0 });

  useEffect(() => {
    const offState = on("midiState", (d) => {
      setOn(d.on); setInputs(d.inputs || []);
      setStatus(d.on
        ? (d.inputs.length ? "Listening: " + d.inputs.join(", ") : "Connected — waiting for a device…")
        : (MIDI.supported ? "Connect an electronic kit to grade your timing in real time."
                          : "Web MIDI isn't available in this browser — try Chrome or Edge."));
    });
    const offStats = on("timingStats", (d) => {
      setStats(d);
      const needle = needleRef.current;
      if (needle) {
        needle.style.left = pct(d.mean) + "%";
        needle.classList.toggle("good", d.samples > 0 && Math.abs(d.mean) <= 20);
      }
    });
    const offHit = on("midiHit", (d) => {
      if (!d.matched || d.deltaMs == null || !ticksRef.current) return;
      const t = document.createElement("div");
      t.className = "tick " + d.rating + (d.dynOk === false ? " dynbad" : "");
      t.style.left = pct(d.deltaMs) + "%";
      ticksRef.current.appendChild(t);
      setTimeout(() => t.remove(), 1400);
    });
    return () => { offState(); offStats(); offHit(); };
  }, []);

  const connect = async () => {
    if (S.midiOn) { MIDI.disable(); return; }
    setStatus("Requesting MIDI access…");
    try { await MIDI.enable(); }
    catch (err) { setStatus(err.message); }
  };

  const tendency = !stats.samples ? "—"
    : Math.abs(Math.round(stats.mean)) <= 5 ? "Locked in"
    : (stats.mean < 0 ? "−" + Math.abs(Math.round(stats.mean)) + "ms" : "+" + Math.round(stats.mean) + "ms");
  const tendencyTag = !stats.samples ? "" : stats.mean < -5 ? "rushing" : stats.mean > 5 ? "dragging" : "";

  return (
    <section className={"midi-panel" + (on_ ? " active" : "")}>
      <div className="midi-head">
        <div className="midi-title"><span className="midi-ico">🎛️</span><span>E-Drum Timing Coach</span></div>
        <button className={"midi-enable" + (on_ ? " on" : "")} onClick={connect}>
          {on_ ? "Disconnect" : "Connect MIDI"}
        </button>
      </div>
      <div className="midi-status">{status}</div>

      <div className="meter-wrap">
        <div className="meter-scale"><span>RUSH</span><span className="meter-zero">ON TIME</span><span>DRAG</span></div>
        <div className="meter-track">
          <div className="meter-good" />
          <div className="meter-ticks" ref={ticksRef} />
          <div className="meter-needle" ref={needleRef} style={{ left: "50%" }} />
        </div>
      </div>

      <div className="midi-reads">
        <Readout val={stats.samples ? stats.acc + "%" : "—"} lbl="Timing accuracy" />
        <Readout val={tendency} sub={tendencyTag} lbl="Tendency" />
        <Readout val={stats.samples ? "±" + Math.round(stats.spread) + "ms" : "—"} lbl="Consistency" />
        <Readout val={stats.samples ? (stats.dynAcc ?? 0) + "%" : "—"} lbl="Dynamics" />
      </div>

      <div className="midi-ctrls">
        <button className={"mini" + (S.midiMonitor ? " on" : "")}
          onClick={() => { S.midiMonitor = !S.midiMonitor; store.midiMonitor = S.midiMonitor; saveStore(); rerender(); }}>
          🔈 Hear my hits
        </button>
        <button className={"mini" + (S.gradeDynamics ? " on" : "")}
          onClick={() => { S.gradeDynamics = !S.gradeDynamics; rerender(); }} title="Grade accent / ghost velocity">
          🎚 Grade dynamics
        </button>
        <button className="mini" onClick={() => { MIDI.reset(); if (ticksRef.current) ticksRef.current.replaceChildren(); }}>
          ↺ Reset
        </button>
      </div>
    </section>
  );
}

function Readout({ val, lbl, sub }) {
  return (
    <div className="readout">
      <div className="readout-val">{val}{sub && <span className="readout-sub"> {sub}</span>}</div>
      <div className="readout-lbl">{lbl}</div>
    </div>
  );
}
