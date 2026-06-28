/* ============================================================
   App orchestration — section/lesson/pattern/song selection,
   song timeline, lesson completion, global wiring.
   ============================================================ */
import { $, $$, el } from "./dom.js";
import { S, on } from "../state.js";
import { LIB, SONGS, COURSE, findPattern, findSong } from "../data/index.js";
import { prep } from "../core/patterns.js";
import { stop, toggle, setBpm, tap, setSongPart } from "../core/scheduler.js";
import { store, saveStore, lessonKey } from "../core/store.js";
import { buildSidebar, setActive, firstItem } from "./sidebar.js";
import { buildGrid } from "./grid.js";
import { renderHeader } from "./header.js";
import { wireTransport, buildVoices } from "./transport.js";
import { buildMidiPanel } from "./midiPanel.js";

const show = (id, disp = "block") => { $(id).style.display = disp; };
const hide = (id) => { $(id).style.display = "none"; };

let handlers;   // selection callbacks passed to the sidebar

function selectSection(sec) {
  stop(); S.sec = sec; S.mode = sec === "song" ? "song" : "pattern";
  $$(".nav button").forEach(b => b.classList.toggle("active", b.dataset.sec === sec));
  hide("lessonBox"); hide("lessonBar"); hide("songStruct"); hide("coachBanner");
  S.activeLesson = null;
  buildSidebar(sec, handlers);
  if (sec === "course") selectLesson(0, 0, firstItem());
  else if (sec === "song") selectSong(SONGS[0], firstItem());
  else selectPattern(LIB[sec][0], firstItem());
}

function selectPattern(p, btn) {
  stop(); prep(p); S.current = p; S.mode = "pattern"; S.muted = {};
  setActive(btn);
  hide("lessonBox"); hide("lessonBar"); hide("songStruct");
  renderHeader(p, {});
  setBpm(p.bpm); buildGrid(); buildVoices();
}

function selectLesson(li, ii, btn) {
  stop(); const les = COURSE[li].lessons[ii]; S.activeLesson = { l: li, i: ii }; setActive(btn);
  if (les.song) {
    S.mode = "song"; S.song = findSong(les.song); S.songIdx = 0; S.barsPlayed = 0;
    setSongPart(0); show("songStruct", "flex"); buildSongStruct();
  } else {
    S.mode = "pattern";
    const p = les.pattern ? les.pattern : findPattern(les.ref[0], les.ref[1]);
    prep(p); S.current = p; S.muted = {}; hide("songStruct");
  }
  buildGrid(); buildVoices();
  setBpm(les.bpm || S.current.bpm || 90);
  renderHeader(S.current, { lesson: les });

  show("lessonBox");
  $("lessonGoal").textContent = les.goal;
  const f = $("lessonFocus"); f.replaceChildren();
  f.appendChild(document.createTextNode(les.focus));
  if (les.tips) { const ul = el("ul"); les.tips.forEach(t => ul.appendChild(el("li", null, t))); f.appendChild(ul); }

  show("lessonBar", "flex");
  const done = store.done[lessonKey(li, ii)];
  $("markBtn").textContent = done ? "✓ Completed — Replay next" : "Mark complete & next ▶";
  updateProgress();
}

function selectSong(s, btn) {
  stop(); S.mode = "song"; S.song = s; S.songIdx = 0; S.barsPlayed = 0; setActive(btn);
  setSongPart(0); setBpm(s.bpm);
  buildGrid(); buildVoices();
  renderHeader(S.current, { song: s });
  hide("lessonBox"); hide("lessonBar"); show("songStruct", "flex"); buildSongStruct();
}

function buildSongStruct() {
  const elS = $("songStruct"); elS.replaceChildren();
  S.song.parts.forEach((p, i) => {
    const c = el("div", "chip"); c.dataset.i = i;
    c.append(el("b", null, p.label), el("small", null, p.bars + " bar" + (p.bars > 1 ? "s" : "")));
    elS.appendChild(c);
  });
  highlightPart(0);
}
const highlightPart = (i) => $$("#songStruct .chip").forEach(c => c.classList.toggle("now", +c.dataset.i === i));

function markComplete() {
  if (!S.activeLesson) return;
  store.done[lessonKey(S.activeLesson.l, S.activeLesson.i)] = 1; saveStore();
  let l = S.activeLesson.l, i = S.activeLesson.i + 1;
  if (i >= COURSE[l].lessons.length) { l++; i = 0; }
  if (l >= COURSE.length) { l = S.activeLesson.l; i = S.activeLesson.i; }   // already at the end
  buildSidebar("course", handlers);
  const btns = $$("#lib .item");
  let idx = 0; for (let a = 0; a < l; a++) idx += COURSE[a].lessons.length; idx += i;
  selectLesson(l, i, btns[idx]);
}

function updateProgress() {
  const total = COURSE.reduce((a, l) => a + l.lessons.length, 0);
  const doneN = Object.keys(store.done).length;
  $("progress").textContent = `Progress: ${doneN}/${total} lessons`;
}

on("partChanged", d => { buildGrid(); buildVoices(); highlightPart(d.idx); });

export function boot() {
  handlers = { selectLesson, selectSong, selectPattern };
  buildMidiPanel();
  wireTransport();
  $("nav").addEventListener("click", e => {
    const b = e.target.closest("button[data-sec]"); if (b) selectSection(b.dataset.sec);
  });
  $("markBtn").onclick = markComplete;
  document.addEventListener("keydown", e => {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT") return;
    if (e.code === "Space") { e.preventDefault(); toggle(); }
    else if (e.key === "t" || e.key === "T") tap();
    else if (e.key === "ArrowUp") setBpm(S.bpm + 1);
    else if (e.key === "ArrowDown") setBpm(S.bpm - 1);
  });
  selectSection("course");
}
