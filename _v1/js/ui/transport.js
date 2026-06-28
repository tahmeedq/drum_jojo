/* ============================================================
   Transport — play/stop, tempo, metronome, practice toggles,
   volume, the "play these yourself" mute row, and the
   trade-mode coach banner. Driven by scheduler events.
   ============================================================ */
import { $, el } from "./dom.js";
import { S, on } from "../state.js";
import { Audio } from "../audio/engine.js";
import { toggle, setBpm, tap } from "../core/scheduler.js";
import { activeRows } from "../core/patterns.js";
import { ROWS } from "../data/index.js";
import { store, saveStore } from "../core/store.js";

const labelFor = (id) => (ROWS.find(r => r.id === id) || {}).label || id;

export function buildVoices() {
  const v = $("voices"); v.replaceChildren();
  v.appendChild(el("span", "lbl", "Mute / un-mute (play these yourself):"));
  activeRows().forEach(row => {
    const b = el("button", null, labelFor(row.id));
    if (S.muted[row.id]) b.classList.add("muted");
    b.onclick = () => { S.muted[row.id] = !S.muted[row.id]; b.classList.toggle("muted", S.muted[row.id]); };
    v.appendChild(b);
  });
}

function setBanner() {
  const b = $("coachBanner");
  if (!S.trade) { b.style.display = "none"; return; }
  b.style.display = "flex"; b.replaceChildren();
  const big = el("span", "big");
  if (S.barCount % 2 === 0) {
    b.className = "demo"; big.textContent = "🔊";
    b.append(big, document.createTextNode(" LISTEN — watch the pattern"));
  } else {
    b.className = "you"; big.textContent = "🥁";
    b.append(big, document.createTextNode(" YOUR TURN — play it!"));
  }
}

function toggleBtn(id, key, after) {
  $(id).onclick = (e) => {
    S[key] = !S[key];
    e.currentTarget.classList.toggle("on", S[key]);
    if (after) after();
  };
}

export function wireTransport() {
  $("playBtn").onclick = toggle;
  $("bpmNum").oninput = (e) => setBpm(e.target.value);
  $("bpmRange").oninput = (e) => setBpm(e.target.value);
  $("tapBtn").onclick = tap;
  document.querySelectorAll(".presets button").forEach(b => (b.onclick = () => setBpm(+b.dataset.bpm)));

  $("clickBtn").onclick = (e) => { S.click = !S.click; e.currentTarget.classList.toggle("on", S.click); };
  $("clickRes").onchange = (e) => { S.clickRes = e.target.value; };
  toggleBtn("countBtn", "countIn");
  toggleBtn("trainBtn", "trainer");
  toggleBtn("guideBtn", "guideMute");
  $("tradeBtn").onclick = (e) => {
    S.trade = !S.trade; e.currentTarget.classList.toggle("on", S.trade);
    if (!S.trade) $("coachBanner").style.display = "none"; else setBanner();
  };

  $("vol").value = store.vol;
  $("vol").oninput = (e) => { store.vol = +e.target.value; Audio.setVolume(store.vol); saveStore(); };
}

on("bpm", d => { $("bpmNum").value = d.bpm; $("bpmRange").value = d.bpm; });
on("transport", d => {
  const b = $("playBtn");
  if (d.playing) { b.classList.add("on"); b.textContent = d.countIn ? "4" : "■"; Audio.setVolume(store.vol); }
  else { b.classList.remove("on"); b.textContent = "▶"; if (!S.trade) $("coachBanner").style.display = "none"; }
});
on("count", d => { $("playBtn").textContent = d.n > 0 ? String(d.n) : "■"; });
on("banner", setBanner);
