/* ============================================================
   Persistence — completed lessons, volume, preferences, and
   personal-best timing stats per pattern.
   ============================================================ */
const KEY = "drumdojo.v2";

export const store = {
  done: {}, vol: 85, reverb: 0.13,
  midiMonitor: true,
  best: {},            // patternName -> { accuracy, meanMs }
};

export function loadStore() {
  try { Object.assign(store, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
}
export function saveStore() {
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
}
export const lessonKey = (l, i) => l + ":" + i;
