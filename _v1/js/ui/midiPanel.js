/* ============================================================
   E-Drum Timing Coach panel — connect button, live meter,
   accuracy / tendency / consistency readouts, hit ticks.
   ============================================================ */
import { $, el } from "./dom.js";
import { S, on } from "../state.js";
import { MIDI } from "../midi/midi.js";
import { store, saveStore } from "../core/store.js";

const pct = (ms) => (Math.max(-50, Math.min(50, ms)) + 50);   // -50..50 ms → 0..100 %
let built = false;

function readout(id, lbl) {
  const d = el("div", "readout");
  const v = el("div", "readout-val", "—"); v.id = "ro-" + id;
  d.append(v, el("div", "readout-lbl", lbl));
  return d;
}

export function buildMidiPanel() {
  if (built) return; built = true;
  const root = $("midiPanel"); root.replaceChildren();

  const head = el("div", "midi-head");
  const title = el("div", "midi-title");
  title.append(el("span", "midi-ico", "🎛️"), el("span", null, "E-Drum Timing Coach"));
  const enableBtn = el("button", "midi-enable", "Connect MIDI"); enableBtn.id = "midiEnable";
  head.append(title, enableBtn);

  const status = el("div", "midi-status",
    MIDI.supported ? "Connect an electronic kit to grade your timing in real time."
                   : "Web MIDI isn't available in this browser — try Chrome or Edge.");
  status.id = "midiStatus";

  // Meter: a −50…+50 ms track with an on-target zone, ticks and a needle.
  const meterWrap = el("div", "meter-wrap");
  const scale = el("div", "meter-scale");
  scale.append(el("span", null, "RUSH"), el("span", "meter-zero", "ON TIME"), el("span", null, "DRAG"));
  const track = el("div", "meter-track");
  const ticks = el("div", "meter-ticks"); ticks.id = "meterTicks";
  const needle = el("div", "meter-needle"); needle.id = "meterNeedle"; needle.style.left = "50%";
  track.append(el("div", "meter-good"), ticks, needle);
  meterWrap.append(scale, track);

  const reads = el("div", "midi-reads");
  reads.append(readout("acc", "Accuracy"), readout("off", "Tendency"), readout("spr", "Consistency"));

  const ctrls = el("div", "midi-ctrls");
  const mon = el("button", "mini" + (store.midiMonitor !== false ? " on" : ""), "🔈 Hear my hits"); mon.id = "midiMon";
  const reset = el("button", "mini", "↺ Reset"); reset.id = "midiReset";
  ctrls.append(mon, reset);

  root.append(head, status, meterWrap, reads, ctrls);
  wire();
}

function wire() {
  S.midiMonitor = store.midiMonitor !== false;
  $("midiEnable").onclick = async () => {
    if (S.midiOn) { MIDI.disable(); return; }
    $("midiStatus").textContent = "Requesting MIDI access…";
    try { await MIDI.enable(); }
    catch (err) { $("midiStatus").textContent = err.message; }
  };
  $("midiMon").onclick = (e) => {
    S.midiMonitor = !S.midiMonitor; store.midiMonitor = S.midiMonitor; saveStore();
    e.currentTarget.classList.toggle("on", S.midiMonitor);
  };
  $("midiReset").onclick = () => { MIDI.reset(); $("meterTicks").replaceChildren(); };
}

on("midiState", d => {
  const btn = $("midiEnable"); if (!btn) return;
  btn.textContent = d.on ? "Disconnect" : "Connect MIDI";
  btn.classList.toggle("on", d.on);
  $("midiPanel").classList.toggle("active", d.on);
  $("midiStatus").textContent = d.on
    ? (d.inputs.length ? "Listening: " + d.inputs.join(", ") : "Connected — waiting for a device…")
    : (MIDI.supported ? "Connect an electronic kit to grade your timing in real time."
                      : "Web MIDI isn't available in this browser — try Chrome or Edge.");
});

on("timingStats", d => {
  if (!$("ro-acc")) return;
  $("ro-acc").textContent = d.samples ? d.acc + "%" : "—";
  const off = $("ro-off");
  if (!d.samples) off.textContent = "—";
  else {
    const m = Math.round(d.mean);
    off.textContent = Math.abs(m) <= 5 ? "Locked in"
      : (m < 0 ? "−" + Math.abs(m) + "ms rushing" : "+" + m + "ms dragging");
  }
  $("ro-spr").textContent = d.samples ? "±" + Math.round(d.spread) + "ms" : "—";

  const needle = $("meterNeedle");
  needle.style.left = pct(d.mean) + "%";
  needle.classList.toggle("good", d.samples > 0 && Math.abs(d.mean) <= 20);
});

on("midiHit", d => {
  if (!d.matched || d.deltaMs == null) return;
  const ticks = $("meterTicks"); if (!ticks) return;
  const t = el("div", "tick " + d.rating);
  t.style.left = pct(d.deltaMs) + "%";
  ticks.appendChild(t);
  setTimeout(() => t.remove(), 1400);
});
