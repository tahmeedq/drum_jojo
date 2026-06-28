/* ============================================================
   Central app state + a tiny event bus that decouples the
   audio scheduler, the MIDI engine and the (React) UI.
   React subscribes to this bus via the useBus hook.
   ============================================================ */
const bus = new EventTarget();
export const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));
export const on = (type, fn) => {
  const h = (e) => fn(e.detail);
  bus.addEventListener(type, h);
  return () => bus.removeEventListener(type, h);   // returns an unsubscribe fn
};

export const S = {
  // navigation / selection
  sec: "course", mode: "pattern", current: null,
  activeLesson: null,            // {l, i}
  song: null, songIdx: 0, barsPlayed: 0,
  itemKey: null,                 // stable id of the loaded item (for best-scores)

  // transport
  playing: false, bpm: 90, stepIdx: 0, barCount: 0,
  click: true, clickRes: "beat", countIn: true,
  trainer: false, guideMute: false, trade: false,
  muted: {},

  // feel
  swing: 0,                      // 0..0.6 — delays off-subdivisions

  // loop + speed trainer
  loop: false, loopBars: 2, repTarget: 0, repCount: 0,
  trainerInc: 4, trainerTarget: 0,

  // editing
  editMode: false, editSong: false,

  // midi
  midiOn: false, midiMonitor: true, gradeDynamics: true,
};

// Counting syllables per subdivision count.
export const COUNT = {
  4: ["", "e", "&", "a"], 3: ["", "&", "a"],
  6: ["", "ta", "la", "li", "ta", "la"], 2: ["", "&"],
};
