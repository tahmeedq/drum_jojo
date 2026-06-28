/* ============================================================
   Selectable drum kits. Each kit ships six sampled voices in
   public/samples/<id>/ (kick, snare, hihat, tom1, tom2, tom3).
   Crash / ride / open-hat / cross-stick have no sampled source
   in any kit, so they are synthesized on top (see voices.js).
   ============================================================ */
export const KITS = [
  { id: "muldjord", label: "Studio",     char: "Real multi-mic acoustic", ext: "m4a" },
  { id: "acoustic", label: "Acoustic",   char: "Warm studio kit",         ext: "mp3" },
  { id: "stark",    label: "Stark",      char: "Big, punchy rock",        ext: "mp3" },
  { id: "r8",       label: "Roland R8",  char: "Classic electronic",      ext: "mp3" },
  { id: "techno",   label: "Techno",     char: "Hard & modern",           ext: "mp3" },
  { id: "linn",     label: "LinnDrum",   char: "'80s drum machine",       ext: "mp3" },
  { id: "cr78",     label: "CR-78",      char: "Vintage analog",          ext: "mp3" },
];

// our internal voice id -> sample file name in the kit folder
export const SAMPLE_MAP = {
  kick: "kick", snare: "snare", hat: "hihat",
  tom1: "tom1", tom2: "tom2", floor: "tom3",
};

export const DEFAULT_KIT = "muldjord";
export const findKit = (id) => KITS.find(k => k.id === id) || KITS[0];
