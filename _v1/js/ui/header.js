/* ============================================================
   Pattern / lesson / song header + description + tip.
   ============================================================ */
import { $, el } from "./dom.js";
import { S } from "../state.js";

const badge = (cls, txt) => el("span", "badge " + cls, txt);

export function renderHeader(p, opt = {}) {
  const nameEl = $("ptnName"), badgesEl = $("badges"), descEl = $("ptnDesc");
  nameEl.replaceChildren(); badgesEl.replaceChildren();

  if (opt.song) {
    nameEl.textContent = opt.song.name;
    badgesEl.appendChild(badge("meter", "Song"));
    badgesEl.appendChild(badge("tempo", opt.song.bpm + " bpm"));
    descEl.textContent = opt.song.desc;
  } else if (opt.lesson) {
    const les = opt.lesson;
    nameEl.appendChild(el("span", "lesson-kicker", "Lesson"));
    nameEl.appendChild(document.createTextNode(" " + les.title));
    badgesEl.appendChild(badge("meter", (S.current && S.current.meter) || "4/4"));
    badgesEl.appendChild(badge("tempo", "target " + les.target + " bpm"));
    descEl.textContent = S.mode === "song" ? S.song.desc : (S.current.desc || "");
  } else {
    nameEl.textContent = p.name;
    badgesEl.appendChild(badge("style", p.style || p.fam || ""));
    badgesEl.appendChild(badge("meter", p.meter));
    badgesEl.appendChild(badge("tempo", p.bpm + " bpm"));
    if (p.diff) badgesEl.appendChild(el("span", "stars", "★".repeat(p.diff)));
    descEl.textContent = p.desc || "";
  }

  const tipText = (S.current && S.current.tip) ||
    (opt.song ? "Use the section timeline above — it highlights the part playing now." : "");
  $("tip").textContent = "💡 " + tipText;
}
