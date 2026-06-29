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
import SongBuilder from "./components/SongBuilder.jsx";
import SessionSummary from "./components/SessionSummary.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import PracticeDashboard from "./components/PracticeDashboard.jsx";
import Onboarding from "./components/Onboarding.jsx";

export default function App() {
  // Re-render the tree on selection changes.
  useRenderOn(["view"]);
  const [summary, setSummary] = useState(null);
  const [showDash, setShowDash] = useState(false);             // Progress dashboard overlay
  const [showOnboard, setShowOnboard] = useState(() => !store.onboarded);  // first-run flow
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

  // App-shell rail state. Rails start open on desktop, collapsed on small viewports.
  const [leftOpen, setLeftOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth > 820);
  const [rightOpen, setRightOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth > 1100);

  // Close any open overlay drawer (used by the mobile scrim).
  const closeDrawers = () => { setLeftOpen(false); setRightOpen(false); };

  // Track when each rail is rendered as an off-screen overlay drawer (matches the
  // CSS breakpoints). Only then should a CLOSED rail be hidden from a11y/focus —
  // on desktop the collapsed strip keeps its expand button reachable.
  const mq = (q) => typeof window !== "undefined" && window.matchMedia(q).matches;
  const [leftDrawer, setLeftDrawer] = useState(() => mq("(max-width:820px)"));
  const [rightDrawer, setRightDrawer] = useState(() => mq("(max-width:1100px)"));
  useEffect(() => {
    const ml = window.matchMedia("(max-width:820px)");
    const mr = window.matchMedia("(max-width:1100px)");
    const ul = () => setLeftDrawer(ml.matches);
    const ur = () => setRightDrawer(mr.matches);
    ml.addEventListener("change", ul); mr.addEventListener("change", ur);
    return () => { ml.removeEventListener("change", ul); mr.removeEventListener("change", ur); };
  }, []);
  const leftHidden = leftDrawer && !leftOpen;     // off-screen, closed
  const rightHidden = rightDrawer && !rightOpen;

  return (
    <div className={"shell" + (leftOpen ? " left-open" : "") + (rightOpen ? " right-open" : "")}>
      {/* Slim DAW header: brand, nav, stat chips, kit picker, Progress + rail toggles. */}
      <TopBar
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onToggleLeft={() => setLeftOpen(o => !o)}
        onToggleRight={() => setRightOpen(o => !o)}
        onOpenDashboard={() => setShowDash(true)}
      />

      <div
        className="shell-body"
        style={{
          "--lw": leftOpen ? "300px" : "var(--rail-strip)",
          "--rw": rightOpen ? "320px" : "var(--rail-strip)",
        }}
      >
        {/* LEFT RAIL — collapsible library */}
        <aside
          className={"rail leftrail" + (leftOpen ? "" : " is-collapsed")}
          aria-hidden={leftHidden || undefined}
          inert={leftHidden ? "" : undefined}
          tabIndex={leftHidden ? -1 : undefined}
        >
          <div className="rail-head">
            <span className="rail-title">Library</span>
            <button
              className="rail-btn"
              onClick={() => setLeftOpen(o => !o)}
              title={leftOpen ? "Collapse library" : "Expand library"}
              aria-label="Toggle library"
            >{leftOpen ? "‹" : "›"}</button>
          </div>
          <div className="rail-body"><Sidebar /></div>
        </aside>

        {/* CENTER — hero workspace, scrolls internally */}
        <main className="center">
          <div className="center-scroll">
            <PatternHeader />
            {isSong && (S.editSong ? <SongBuilder /> : <SongTimeline />)}
            <Grid />
          </div>
        </main>

        {/* RIGHT RAIL — collapsible inspector (MIDI coach) */}
        <aside
          className={"rail rightrail" + (rightOpen ? "" : " is-collapsed")}
          aria-hidden={rightHidden || undefined}
          inert={rightHidden ? "" : undefined}
          tabIndex={rightHidden ? -1 : undefined}
        >
          <div className="rail-head">
            <button
              className="rail-btn"
              onClick={() => setRightOpen(o => !o)}
              title={rightOpen ? "Collapse inspector" : "Expand inspector"}
              aria-label="Toggle inspector"
            >{rightOpen ? "›" : "🎛️"}</button>
            <span className="rail-title">Inspector</span>
          </div>
          <div className="rail-body"><MidiPanel /></div>
        </aside>
      </div>

      {/* BOTTOM — docked transport bar */}
      <Transport />

      {/* Scrim closes the mobile drawers when tapped outside. */}
      <div className="rail-scrim" onClick={closeDrawers} />

      {summary && <SessionSummary {...summary} onClose={() => setSummary(null)} />}

      {/* Global ⌘K command palette — self-manages its own open/close. */}
      <CommandPalette />

      {/* First-run onboarding — gated on the persisted store.onboarded flag. */}
      {showOnboard && <Onboarding onClose={() => setShowOnboard(false)} />}

      {/* Progress dashboard overlay — opened from the header Progress button. */}
      {showDash && <PracticeDashboard onClose={() => setShowDash(false)} />}
    </div>
  );
}
