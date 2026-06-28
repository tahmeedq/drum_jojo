/* ============================================================
   Selection controller — mutates the authoritative engine state
   (S) for section / lesson / pattern / song / custom changes and
   broadcasts a "view" event so the React tree re-renders.
   ============================================================ */
import { S, emit } from "./state.js";
import { LIB, SONGS, COURSE, findPattern, findSong } from "./data/index.js";
import { prep, blankPattern, fromSaved } from "./core/patterns.js";
import { stop, setBpm, setSongPart } from "./core/scheduler.js";
import { store, saveStore } from "./core/store.js";
import { loadKit } from "./audio/voices.js";

const view = () => emit("view", { sec: S.sec, key: S.itemKey });

export function selectSection(sec) {
  stop();
  S.sec = sec;
  S.mode = sec === "song" ? "song" : "pattern";
  S.activeLesson = null;
  S.editMode = false;
  if (sec === "course") return selectLesson(0, 0);
  if (sec === "song") return selectSong(SONGS[0]);
  if (sec === "create") {
    const saved = store.custom;
    if (saved.length) return loadCustom(saved[0]);
    return newCustom();
  }
  selectPattern(LIB[sec][0]);
}

export function selectPattern(p) {
  stop(); prep(p); S.current = p; S.mode = "pattern"; S.muted = {};
  S.activeLesson = null; S.editMode = false;
  S.itemKey = `${S.sec}:${p.name}`;
  setBpm(p.bpm);
  view();
}

export function selectLesson(li, ii) {
  stop();
  const les = COURSE[li].lessons[ii];
  S.activeLesson = { l: li, i: ii }; S.editMode = false;
  if (les.song) {
    S.mode = "song"; S.song = findSong(les.song); S.songIdx = 0; S.barsPlayed = 0;
    setSongPart(0);
  } else {
    S.mode = "pattern";
    const p = les.pattern ? les.pattern : findPattern(les.ref[0], les.ref[1]);
    prep(p); S.current = p; S.muted = {};
  }
  S.itemKey = `lesson:${li}:${ii}`;
  setBpm(les.bpm || S.current.bpm || 90);
  view();
}

export function selectSong(s) {
  stop(); S.mode = "song"; S.song = s; S.songIdx = 0; S.barsPlayed = 0;
  S.activeLesson = null; S.editMode = false;
  setSongPart(0); setBpm(s.bpm);
  S.itemKey = `song:${s.name}`;
  view();
}

export function newCustom() {
  stop();
  const p = blankPattern({ bpm: S.bpm || 90 });
  S.current = p; S.mode = "pattern"; S.muted = {}; S.activeLesson = null; S.editMode = true;
  S.itemKey = `custom:${p._id}`;
  setBpm(p.bpm);
  view();
}

export function loadCustom(saved) {
  stop();
  const p = fromSaved(saved);
  S.current = p; S.mode = "pattern"; S.muted = {}; S.activeLesson = null; S.editMode = true;
  S.itemKey = `custom:${p._id || saved._id}`;
  setBpm(p.bpm);
  view();
}

export function setEditMode(on) { S.editMode = on; view(); }

export async function setKit(id) {
  store.kit = id; saveStore();
  emit("kit", { ready: false, label: "Loading kit…", kit: id, loading: true });
  const info = await loadKit(id);
  emit("kit", { ready: info.sampled > 0, label: info.label, kit: info.kit });
}
