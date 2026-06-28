import { store } from "../engine/core/store.js";

const fmt = (s) => {
  const m = Math.floor(s / 60), sec = Math.round(s % 60);
  return m ? `${m}m ${sec}s` : `${sec}s`;
};

export default function SessionSummary({ secs, stats, reps, newBest, midi, onClose }) {
  const graded = midi && stats && stats.samples >= 8;
  const grade = graded ? letterGrade(stats.acc) : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Session complete</h3>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {newBest && <div className="newbest">🏆 New personal best!</div>}

        <div className="summary-grid">
          <Stat big={fmt(secs)} lbl="Practice time" />
          <Stat big={reps || 0} lbl="Loops completed" />
          {graded ? (
            <>
              <Stat big={grade} lbl="Grade" accent />
              <Stat big={stats.acc + "%"} lbl="Timing accuracy" />
              <Stat big={tendencyStr(stats.mean)} lbl="Tendency" />
              <Stat big={"±" + Math.round(stats.spread) + "ms"} lbl="Consistency" />
              <Stat big={(stats.dynAcc ?? 0) + "%"} lbl="Dynamics" />
              <Stat big={stats.bpm + " bpm"} lbl="Tempo" />
            </>
          ) : (
            <div className="summary-note">
              Connect an electronic kit and play along to get a graded timing report —
              accuracy, rush/drag tendency, consistency and dynamics.
            </div>
          )}
        </div>

        <div className="streakline">
          🔥 {store.stats.streak}-day streak · {Math.round(store.stats.totalSeconds / 60)} min total
        </div>

        <button className="btn primary wide" onClick={onClose}>Keep practicing ▶</button>
      </div>
    </div>
  );
}

function Stat({ big, lbl, accent }) {
  return (
    <div className={"sumstat" + (accent ? " accent" : "")}>
      <div className="sumstat-val">{big}</div>
      <div className="sumstat-lbl">{lbl}</div>
    </div>
  );
}

function letterGrade(acc) {
  if (acc >= 95) return "A+";
  if (acc >= 90) return "A";
  if (acc >= 80) return "B";
  if (acc >= 70) return "C";
  if (acc >= 55) return "D";
  return "F";
}
function tendencyStr(mean) {
  const m = Math.round(mean);
  if (Math.abs(m) <= 5) return "Locked";
  return m < 0 ? `−${Math.abs(m)}ms` : `+${m}ms`;
}
