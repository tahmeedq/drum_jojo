/* ============================================================
   Persistence — completed lessons, preferences, personal-best
   timing/dynamics scores, practice streak + minutes, custom
   patterns, and a recent-session log. localStorage backed.
   ============================================================ */
const KEY = "drumdojo.v3";

export const store = {
  done: {}, vol: 85, reverb: 0.13,
  volKit: 85, volClick: 90, volMidi: 80,   // per-source mixer (0..100)
  midiMonitor: true,
  midiOffset: 0,                           // input+output latency comp, ms (subtracted from each hit)
  swing: 0,
  kit: "muldjord",

  best: {},            // itemKey -> { acc, meanMs, spread, dynAcc, bpm, date }
  custom: [],          // user-created patterns
  customSongs: [],     // user-built arrangements (sections + bar counts)
  stats: {
    totalSeconds: 0,   // lifetime practice time
    streak: 0,         // consecutive days practiced
    lastDay: null,     // YYYY-MM-DD of last practice
    sessions: [],      // recent sessions: { date, secs, item, acc }
    reps: 0,           // lifetime loop reps completed
  },
};

export function loadStore() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
    Object.assign(store, saved);
    store.stats = Object.assign({ totalSeconds: 0, streak: 0, lastDay: null, sessions: [], reps: 0 }, saved.stats || {});
    store.best = saved.best || {};
    store.custom = saved.custom || [];
    store.customSongs = saved.customSongs || [];
  } catch (e) {}
}

let saveTimer = null;
export function saveStore() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  }, 120);
}

export const lessonKey = (l, i) => l + ":" + i;
const today = () => new Date().toISOString().slice(0, 10);

// Roll the daily streak forward when a practice session happens.
export function bumpStreak() {
  const d = today();
  const s = store.stats;
  if (s.lastDay === d) return;
  if (s.lastDay) {
    const diff = Math.round((new Date(d) - new Date(s.lastDay)) / 86400000);
    s.streak = diff === 1 ? s.streak + 1 : 1;
  } else s.streak = 1;
  s.lastDay = d;
  saveStore();
}

// Record a finished practice session. Returns whether a new best was set.
export function recordSession({ item, secs, stats }) {
  const s = store.stats;
  if (secs > 4) { s.totalSeconds += Math.round(secs); bumpStreak(); }

  let newBest = false;
  if (item && stats && stats.samples >= 8) {
    const prev = store.best[item];
    const score = stats.acc;
    if (!prev || score > prev.acc || (score === prev.acc && Math.abs(stats.mean) < Math.abs(prev.meanMs))) {
      store.best[item] = {
        acc: stats.acc, meanMs: Math.round(stats.mean), spread: Math.round(stats.spread),
        dynAcc: stats.dynAcc || 0, bpm: stats.bpm || 0, date: today(),
      };
      newBest = true;
    }
  }
  if (secs > 4) {
    s.sessions.unshift({ date: Date.now(), secs: Math.round(secs), item: item || "Free play", acc: stats && stats.samples >= 8 ? stats.acc : null });
    s.sessions = s.sessions.slice(0, 30);
  }
  saveStore();
  return newBest;
}

export function addReps(n) { store.stats.reps += n; saveStore(); }
