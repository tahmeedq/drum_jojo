/* ============================================================
   Songs — chain grooves + fills into arrangements.
   ============================================================ */
export const SONGS = [
  { name: "Rock Anthem", bpm: 112, desc: "Intro → verse → fill → chorus → fill. A classic arrangement.",
    parts: [
      { label: "Intro",  ref: ["groove", "Basic Rock Beat"], bars: 2 },
      { label: "Verse",  ref: ["groove", "Rock w/ 8th Kicks"], bars: 4 },
      { label: "Fill",   ref: ["fill", "Basic 4-Beat Fill"], bars: 1 },
      { label: "Chorus", ref: ["groove", "Four-on-the-Floor"], bars: 4 },
      { label: "Fill",   ref: ["fill", "Crash Ending Fill"], bars: 1 },
    ] },
  { name: "Funk Workout", bpm: 100, desc: "Two funk grooves traded with fills. Builds pocket and chops.",
    parts: [
      { label: "Groove A", ref: ["groove", "Money Beat (Funk)"], bars: 4 },
      { label: "Fill",     ref: ["fill", "Linear Funk Fill"], bars: 1 },
      { label: "Groove B", ref: ["groove", "Funky Drummer"], bars: 4 },
      { label: "Fill",     ref: ["fill", "Gospel Linear Chop"], bars: 1 },
    ] },
  { name: "Shuffle Blues", bpm: 96, desc: "Shuffle feel with triplet fills.",
    parts: [
      { label: "Shuffle",    ref: ["groove", "Shuffle (Triplet)"], bars: 4 },
      { label: "Fill",       ref: ["fill", "Triplet Tom Fill"], bars: 1 },
      { label: "Slow Blues", ref: ["groove", "12/8 Blues"], bars: 4 },
      { label: "Fill",       ref: ["fill", "Six-Stroke Roll Fill"], bars: 1 },
    ] },
  { name: "Pop Set", bpm: 108, desc: "Verse/chorus pop dynamics with clean fills.",
    parts: [
      { label: "Verse",  ref: ["groove", "Pop Groove"], bars: 4 },
      { label: "Fill",   ref: ["fill", "Two-Beat Build"], bars: 1 },
      { label: "Chorus", ref: ["groove", "Motown Backbeat"], bars: 4 },
      { label: "Fill",   ref: ["fill", "Basic 4-Beat Fill"], bars: 1 },
    ] },
  { name: "Fusion Burner", bpm: 104, desc: "Linear funk and chops traded with busy fills. Advanced.",
    parts: [
      { label: "Groove", ref: ["groove", "16th Hi-Hat Funk"], bars: 4 },
      { label: "Fill",   ref: ["fill", "Herta Fill"], bars: 1 },
      { label: "Bridge", ref: ["groove", "Funky Drummer"], bars: 2 },
      { label: "Fill",   ref: ["fill", "Fusion Ghost Fill"], bars: 1 },
    ] },
];
