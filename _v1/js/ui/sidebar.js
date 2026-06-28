/* ============================================================
   Library sidebar — curriculum, grooves, rudiments, fills, songs.
   App passes in selection handlers to avoid circular imports.
   ============================================================ */
import { $, el } from "./dom.js";
import { LIB, SONGS, COURSE, SECTION_TITLES } from "../data/index.js";
import { store, lessonKey } from "../core/store.js";

let activeBtn = null;
export function setActive(btn) {
  if (activeBtn) activeBtn.classList.remove("active");
  activeBtn = btn;
  if (btn) btn.classList.add("active");
}

function itemBtn(main, meta, { num, right } = {}) {
  const b = el("button", "item");
  const left = el("span");
  if (num) { left.appendChild(el("span", "num", num)); left.appendChild(document.createTextNode(" ")); }
  left.appendChild(document.createTextNode(main));
  if (meta) left.appendChild(el("span", "meta", meta));
  b.appendChild(left);
  if (right) b.appendChild(right);
  return b;
}
const stars = (n) => el("span", "stars", "★".repeat(n || 1));

export function buildSidebar(sec, h) {
  const lib = $("lib"); lib.replaceChildren();
  $("libTitle").textContent = SECTION_TITLES[sec] || "Library";

  if (sec === "course") {
    COURSE.forEach((lvl, li) => {
      const hdr = el("div", "lvlhdr");
      hdr.appendChild(el("b", null, lvl.level));
      hdr.appendChild(el("div", "bar"));
      lib.appendChild(hdr);
      lvl.lessons.forEach((les, ii) => {
        const done = store.done[lessonKey(li, ii)];
        const b = itemBtn(les.title, `target ${les.target} bpm`,
          { num: `${ii + 1}.`, right: done ? el("span", "check", "✓") : null });
        b.onclick = () => h.selectLesson(li, ii, b);
        lib.appendChild(b);
      });
    });
    return;
  }

  if (sec === "song") {
    SONGS.forEach(s => {
      const b = itemBtn(s.name, `${s.parts.length} sections · ${s.bpm} bpm`);
      b.onclick = () => h.selectSong(s, b);
      lib.appendChild(b);
    });
    return;
  }

  // grooves / rudiments / fills — grouped by style or family
  let lastFam = null;
  LIB[sec].forEach(p => {
    const fam = p.style || p.fam;
    if (fam && fam !== lastFam) { lib.appendChild(el("div", "famhdr", fam)); lastFam = fam; }
    const b = itemBtn(p.name, `${p.meter} · ${p.bpm} bpm`, { right: stars(p.diff) });
    b.onclick = () => h.selectPattern(p, b);
    lib.appendChild(b);
  });
}

export const firstItem = () => $("lib").querySelector(".item");
