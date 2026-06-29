/**
 * PracticeDashboard.jsx
 *
 * Full-screen progress overlay for Drum Dojo.
 * Props: { onClose } — fired on Esc, backdrop-click, or ✕ button.
 *
 * Data source: store.stats + store.best (read-only — never mutated here).
 * Visualisations are pure SVG/CSS; no external chart libraries.
 *
 * Import path : src/components/PracticeDashboard.jsx
 * Mount example: <PracticeDashboard onClose={() => setShowDash(false)} />
 */
import { useMemo, useEffect } from "react";
import { store } from "../engine/core/store.js";
import "../styles/dashboard.css";

/* ═══════════════════════════════════════════════════════════════
   DATE / TIME HELPERS
   ═══════════════════════════════════════════════════════════════ */

/** Format lifetime seconds as "Xh Ym". Guards against undefined/NaN. */
function fmtTime(totalSecs) {
  totalSecs = Number(totalSecs) || 0;
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h === 0 && m === 0) return "0m";
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** ms-epoch → "YYYY-MM-DD" UTC string — matches store.js convention. */
function epochToDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Current date as "YYYY-MM-DD" UTC. */
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Shift a "YYYY-MM-DD" string by n days.
 * Uses noon-UTC to avoid DST edge-cases near midnight.
 */
function shiftDay(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Day-of-week (0 = Sun, 6 = Sat) for a "YYYY-MM-DD" string. */
function weekday(dateStr) {
  return new Date(dateStr + "T12:00:00Z").getUTCDay();
}

/** "YYYY-MM" → abbreviated month name e.g. "Jun". */
function fmtMonthAbbr(yyyymm) {
  const [y, m] = yyyymm.split("-");
  return new Date(`${y}-${m}-01T12:00:00Z`).toLocaleString("en", { month: "short" });
}

/* ═══════════════════════════════════════════════════════════════
   HEATMAP HELPERS
   ═══════════════════════════════════════════════════════════════ */

/** Build { "YYYY-MM-DD" → totalSecs } from the sessions log. */
function buildDayMap(sessions) {
  const map = {};
  for (const s of sessions) {
    const day = epochToDay(s.date);
    map[day] = (map[day] || 0) + s.secs;
  }
  return map;
}

/**
 * Build the flat cell array for a ~17-week heatmap.
 * Always starts on the Sunday of the week 119 days ago,
 * padded at the end to a full Saturday.
 *
 * Returns Array<{ day: "YYYY-MM-DD" | null, secs: number }>
 */
function buildHeatmapCells(dayMap) {
  const today = todayUTC();
  // today + 118 prior days = 119 days, ~17 weeks before Sunday-alignment
  let start = shiftDay(today, -118);
  // Rewind to the Sunday of that week
  const dow = weekday(start);
  if (dow > 0) start = shiftDay(start, -dow);

  const cells = [];
  let d = start;
  while (d <= today) {
    cells.push({ day: d, secs: dayMap[d] || 0 });
    d = shiftDay(d, 1);
  }
  // Pad trailing partial week with placeholder cells
  const rem = cells.length % 7;
  if (rem > 0) {
    for (let i = rem; i < 7; i++) cells.push({ day: null, secs: 0 });
  }
  return cells;
}

/**
 * Classify a day's practice seconds into intensity level 0–4.
 * 0 = no practice; 4 = at or near the busiest day.
 */
function intensityLevel(secs, maxSecs) {
  if (!secs || !maxSecs) return 0;
  const r = secs / maxSecs;
  if (r < 0.15) return 1;
  if (r < 0.40) return 2;
  if (r < 0.70) return 3;
  return 4;
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT CONSTANTS (kept in sync with dashboard.css)
   ═══════════════════════════════════════════════════════════════ */

const CELL       = 12; // px — heatmap cell size
const GAP        = 3;  // px — gap between cells
const CELL_STRIDE = CELL + GAP; // 15px per column/row step
const DOW_W      = 14; // px — day-of-week label column width
const FLEX_GAP   = 4;  // px — gap between dow column and cell grid

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/** Headline stat tile — icon + large value + label. */
function StatTile({ icon, value, label }) {
  return (
    <div className="db-tile">
      <div className="db-tile-icon" aria-hidden="true">{icon}</div>
      <div className="db-tile-value">{value}</div>
      <div className="db-tile-label">{label}</div>
    </div>
  );
}

/**
 * GitHub-style practice heatmap.
 * Columns = weeks (oldest → newest left-to-right).
 * Rows    = days of week (Sunday at top).
 */
function PracticeHeatmap({ sessions }) {
  const { cells, maxSecs, monthLabels } = useMemo(() => {
    const dayMap = buildDayMap(sessions);
    const cells  = buildHeatmapCells(dayMap);
    const maxSecs = Math.max(...cells.map(c => c.secs), 1);

    // Build { colIndex: "Jan" } — one label per unique month,
    // placed at the first column where that month appears.
    const seen = new Set();
    const monthLabels = {};
    const numCols = cells.length / 7;
    for (let col = 0; col < numCols; col++) {
      const cell = cells[col * 7]; // Sunday of this week
      if (!cell?.day) continue;
      const ym = cell.day.slice(0, 7);
      if (!seen.has(ym)) {
        seen.add(ym);
        monthLabels[col] = fmtMonthAbbr(ym);
      }
    }
    return { cells, maxSecs, monthLabels };
  }, [sessions]);

  const numCols = cells.length / 7;
  // Width of the month-label track must equal width of the cell grid
  const gridW = numCols * CELL_STRIDE - GAP;

  return (
    <div className="db-heatmap">
      {/* ── Top row: dow-spacer + month labels ── */}
      <div className="db-heatmap-header">
        <div style={{ width: DOW_W + FLEX_GAP, flexShrink: 0 }} aria-hidden="true" />
        <div className="db-month-row" style={{ width: gridW, minWidth: gridW }}>
          {Object.entries(monthLabels).map(([col, name]) => (
            <span
              key={col}
              className="db-month-label"
              style={{ left: Number(col) * CELL_STRIDE }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      {/* ── Body: dow labels + cell grid ── */}
      <div className="db-heatmap-body">
        {/* Day-of-week labels (only Mon / Wed / Fri shown to avoid crowding) */}
        <div className="db-dow" aria-hidden="true">
          {["S","M","T","W","T","F","S"].map((l, i) => (
            <div key={i} className={`db-dow-label ${i % 2 === 1 ? "db-dow-show" : ""}`}>
              {l}
            </div>
          ))}
        </div>

        {/* Cell grid — column-major fill (one week per column) */}
        <div
          className="db-cell-grid"
          style={{
            gridTemplateRows: `repeat(7, ${CELL}px)`,
            gridAutoColumns: CELL,
            gap: GAP,
          }}
        >
          {cells.map((cell, i) => {
            if (!cell.day) {
              // Future/placeholder padding
              return <div key={i} className="db-cell db-cell-empty" aria-hidden="true" />;
            }
            const lvl = intensityLevel(cell.secs, maxSecs);
            const tip = cell.secs > 0
              ? `${cell.day}: ${fmtTime(cell.secs)}`
              : cell.day;
            return (
              <div
                key={i}
                className={`db-cell db-lvl-${lvl}`}
                title={tip}
                aria-label={tip}
              />
            );
          })}
        </div>
      </div>

      {/* ── Intensity legend ── */}
      <div className="db-heatmap-legend" aria-label="Color intensity scale">
        <span className="db-legend-lbl">Less</span>
        {[0, 1, 2, 3, 4].map(lvl => (
          <div key={lvl} className={`db-cell db-lvl-${lvl}`} aria-hidden="true" />
        ))}
        <span className="db-legend-lbl">More</span>
      </div>
    </div>
  );
}

/**
 * SVG line chart of graded accuracy over time.
 * Filters sessions where acc != null; renders oldest → newest left-to-right.
 */
function AccuracyChart({ sessions }) {
  // sessions is newest-first in the store; reverse for left→right time flow
  const data = useMemo(
    () => sessions.filter(s => s.acc != null).slice().reverse(),
    [sessions]
  );

  if (data.length === 0) {
    return (
      <p className="db-empty-note">
        Connect a MIDI kit and play along to unlock accuracy tracking.
        Your graded session history will appear here as a line chart.
      </p>
    );
  }

  // Fixed SVG coordinate space; scales to container width via CSS
  const W = 600, H = 130;
  const PAD = { top: 10, right: 16, bottom: 24, left: 40 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top  - PAD.bottom;

  const xOf = (i) =>
    PAD.left + (data.length === 1 ? iW / 2 : (i / (data.length - 1)) * iW);
  const yOf = (v) => PAD.top + iH - (v / 100) * iH;

  const pts = data.map((s, i) =>
    `${xOf(i).toFixed(1)},${yOf(s.acc).toFixed(1)}`
  ).join(" ");

  /** Dot color keyed to accuracy tier. */
  const dotColor = (acc) =>
    acc >= 90 ? "var(--good)" : acc >= 75 ? "var(--warn)" : "var(--bad)";

  return (
    <svg
      className="db-acc-chart"
      viewBox={`0 0 ${W} ${H}`}
      aria-label="Accuracy over time"
      role="img"
    >
      <defs>
        {/* Gradient fill under the line */}
        <linearGradient id="db-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--cyan)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0.01" />
        </linearGradient>
        {/* Clip region so area fill doesn't overflow axes */}
        <clipPath id="db-clip">
          <rect x={PAD.left} y={PAD.top} width={iW} height={iH} />
        </clipPath>
      </defs>

      {/* Horizontal grid lines at 25 / 50 / 75 / 100 */}
      {[25, 50, 75, 100].map(v => (
        <g key={v}>
          <line
            x1={PAD.left}    y1={yOf(v)}
            x2={W - PAD.right} y2={yOf(v)}
            stroke="var(--line)" strokeWidth="1"
          />
          <text
            x={PAD.left - 6} y={yOf(v) + 4}
            fill="var(--muted2)" fontSize="9" textAnchor="end"
          >
            {v}%
          </text>
        </g>
      ))}

      {/* Area fill */}
      {data.length > 1 && (
        <polygon
          clipPath="url(#db-clip)"
          points={
            `${xOf(0).toFixed(1)},${(PAD.top + iH).toFixed(1)} ` +
            pts +
            ` ${xOf(data.length - 1).toFixed(1)},${(PAD.top + iH).toFixed(1)}`
          }
          fill="url(#db-area-grad)"
        />
      )}

      {/* Connecting polyline */}
      {data.length > 1 && (
        <polyline
          clipPath="url(#db-clip)"
          points={pts}
          fill="none"
          stroke="var(--cyan)"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Data-point dots, colour-coded by accuracy tier */}
      {data.map((s, i) => (
        <circle
          key={i}
          cx={xOf(i)} cy={yOf(s.acc)}
          r={data.length > 20 ? 2 : 3.5}
          fill={dotColor(s.acc)}
          stroke="var(--bg2)"
          strokeWidth="1.5"
        >
          <title>{`${s.item || "session"}: ${s.acc}%`}</title>
        </circle>
      ))}

      {/* Axis endpoint labels */}
      <text x={PAD.left}        y={H - 4} fill="var(--muted2)" fontSize="9">Oldest</text>
      <text x={W - PAD.right}   y={H - 4} fill="var(--muted2)" fontSize="9" textAnchor="end">Newest</text>
    </svg>
  );
}

/**
 * Personal bests table sorted by accuracy descending.
 * Columns: Item, Accuracy, Timing (mean ± spread), BPM, Date.
 */
function PersonalBests({ best }) {
  const rows = useMemo(
    () =>
      Object.entries(best)
        .map(([key, v]) => ({ key, ...v }))
        .sort((a, b) => b.acc - a.acc),
    [best]
  );

  if (rows.length === 0) {
    return (
      <p className="db-empty-note">
        Complete a graded MIDI session to set your first personal best.
      </p>
    );
  }

  /** Render meanMs as a tendency label ("Locked", "+12ms", "−8ms"). */
  function tendencyLabel(meanMs) {
    if (meanMs == null) return null;
    if (Math.abs(meanMs) <= 5) return "Locked";
    return meanMs < 0 ? `${meanMs}ms` : `+${meanMs}ms`;
  }

  /** CSS class for the accuracy pill based on tier. */
  function pillClass(acc) {
    if (acc >= 90) return "db-acc-good";
    if (acc >= 75) return "db-acc-warn";
    return "db-acc-bad";
  }

  return (
    <div className="db-table-wrap">
      <table className="db-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Accuracy</th>
            <th>Timing</th>
            <th>BPM</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const tendency = tendencyLabel(r.meanMs);
            return (
              <tr key={r.key}>
                <td className="db-td-item" title={r.key}>{r.key}</td>
                <td>
                  <span className={`db-acc-pill ${pillClass(r.acc)}`}>
                    {r.acc}%
                  </span>
                </td>
                <td className="db-td-timing">
                  {tendency != null ? (
                    <>
                      <span className="db-td-tendency">{tendency}</span>
                      {" "}±{r.spread}ms
                    </>
                  ) : "—"}
                </td>
                <td className="db-td-bpm">{r.bpm ? r.bpm : "—"}</td>
                <td className="db-td-date">{r.date || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════ */

export default function PracticeDashboard({ onClose }) {
  const { stats, best } = store;
  const { totalSeconds, streak, sessions, reps } = stats;

  // Close on Escape key
  useEffect(() => {
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  // ── Empty state — no sessions and no personal bests yet ──
  if (!sessions.length && !Object.keys(best).length) {
    return (
      <div className="db-backdrop" onClick={onClose}>
        <div
          className="db-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Practice Dashboard"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="db-header">
            <span className="db-title-icon" aria-hidden="true">📊</span>
            <h2 className="db-title">Progress</h2>
            <button className="modal-x" onClick={onClose} aria-label="Close dashboard">✕</button>
          </div>
          <div className="db-empty-state">
            <div className="db-empty-drum" aria-hidden="true">🥁</div>
            <h3>Start practicing to see your progress</h3>
            <p>
              Your streak, session heatmap, accuracy history, and personal
              bests will all appear here once you've logged some practice time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Full dashboard ──
  return (
    <div className="db-backdrop" onClick={onClose}>
      <div
        className="db-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Practice Dashboard"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="db-header">
          <span className="db-title-icon" aria-hidden="true">📊</span>
          <h2 className="db-title">Progress</h2>
          <button className="modal-x" onClick={onClose} aria-label="Close dashboard">✕</button>
        </div>

        {/* Headline stat tiles */}
        <div className="db-tiles">
          <StatTile icon="🔥" value={streak || 0}                     label="Day streak"    />
          <StatTile icon="⏱" value={fmtTime(totalSeconds ?? 0)}       label="Total time"    />
          <StatTile icon="🔁" value={(reps || 0).toLocaleString()}     label="Lifetime reps" />
          <StatTile icon="📅" value={sessions.length}                  label="Sessions"      />
        </div>

        {/* Practice heatmap — last ~17 weeks */}
        <section className="db-section">
          <h3 className="db-section-title">Practice Heatmap</h3>
          {sessions.length > 0
            ? <PracticeHeatmap sessions={sessions} />
            : <p className="db-empty-note">No sessions recorded yet.</p>}
        </section>

        {/* Accuracy over time */}
        <section className="db-section">
          <h3 className="db-section-title">Accuracy Over Time</h3>
          <AccuracyChart sessions={sessions} />
        </section>

        {/* Personal bests table */}
        <section className="db-section">
          <h3 className="db-section-title">Personal Bests</h3>
          <PersonalBests best={best} />
        </section>
      </div>
    </div>
  );
}
