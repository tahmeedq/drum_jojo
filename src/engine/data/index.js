/* ============================================================
   Content aggregation + lookup helpers.
   ============================================================ */
import { GROOVES } from "./grooves.js";
import { RUDIMENTS } from "./rudiments.js";
import { FILLS } from "./fills.js";
import { SONGS } from "./songs.js";
import { COURSE } from "./course.js";

export { ROWS, GM_DRUM_MAP } from "./kit.js";
export { SONGS, COURSE };

export const LIB = {
  groove: GROOVES,
  rudiment: RUDIMENTS,
  fill: FILLS,
};

export const SECTION_TITLES = {
  course: "Curriculum", groove: "Grooves", rudiment: "Rudiments",
  fill: "Fills", song: "Songs",
};

export const findPattern = (sec, name) => LIB[sec].find(p => p.name === name);
export const findSong = (name) => SONGS.find(s => s.name === name);
