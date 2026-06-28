/* ============================================================
   Central app state + a tiny event bus that decouples the
   audio scheduler, the MIDI engine and the UI.
   ============================================================ */
const bus = new EventTarget();
export const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));
export const on = (type, fn) => bus.addEventListener(type, e => fn(e.detail));

export const S = {
  // navigation / selection
  sec: "course", mode: "pattern", current: null,
  activeLesson: null,            // {l, i}
  song: null, songIdx: 0, barsPlayed: 0,

  // transport
  playing: false, bpm: 90, stepIdx: 0, barCount: 0,
  click: true, clickRes: "beat", countIn: true,
  trainer: false, guideMute: false, trade: false,
  muted: {},

  // midi
  midiOn: false, midiMonitor: true,
};

// Counting syllables per subdivision count.
export const COUNT = {
  4: ["", "e", "&", "a"], 3: ["", "&", "a"],
  6: ["", "ta", "la", "li", "ta", "la"], 2: ["", "&"],
};
