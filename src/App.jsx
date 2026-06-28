import { useEffect, useRef, useState } from "react";
import { S } from "./engine/state.js";
import { toggle, setBpm, tap, stop } from "./engine/core/scheduler.js";
import { recordSession, store } from "./engine/core/store.js";
import { selectSection } from "./engine/controller.js";
import { useBus, useRenderOn } from "./hooks/useBus.js";

import TopBar from "./components/TopBar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import PatternHeader from "./components/PatternHeader.jsx";
import Transport from "./components/Transport.jsx";
import Grid from "./components/Grid.jsx";
import MidiPanel from "./components/MidiPanel.jsx";
import SongTimeline from "./components/SongTimeline.jsx";
import SessionSummary from "./components/SessionSummary.jsx";

export default function App() {
  // Re-render the tree on selection changes.
  useRenderOn(["view"]);
  const [summary, setSummary] = useState(null);
  const lastStats = useRef({ samples: 0 });

  // Boot: land on the course.
  useEffect(() => { selectSection("course"); }, []);

  // Keep the most recent timing snapshot for the end-of-session report.
  useBus("timingStats", (d) => { lastStats.current = d; });

  // On stop, log the session and pop a summary when something was practiced.
  useBus("transport", (d) => {
    if (d.playing || !d.sessionSecs) return;
    const st = lastStats.current;
    const stats = { ...st, bpm: S.bpm };
    const newBest = recordSession({ item: S.itemKey, secs: d.sessionSecs, stats });
    if (d.sessionSecs > 6 || st.samples >= 8) {
      setSummary({ secs: d.sessionSecs, stats, reps: S.repCount, newBest, midi: S.midiOn });
    }
  });

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      else if (e.key === "t" || e.key === "T") tap();
      else if (e.key === "ArrowUp") { e.preventDefault(); setBpm(S.bpm + 1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setBpm(S.bpm - 1); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const isSong = S.mode === "song";

  return (
    <div className="app">
      <TopBar />
      <div className="wrap">
        <Sidebar />
        <main className="card workspace">
          <PatternHeader />
          <Transport />
          <MidiPanel />
          {isSong && <SongTimeline />}
          <Grid />
        </main>
      </div>
      {summary && <SessionSummary {...summary} onClose={() => setSummary(null)} />}
    </div>
  );
}
