/* ============================================================
   Onboarding.jsx — first-run walkthrough overlay for Drum Dojo.

   Props: { onClose: () => void }

   Mount gating (in App.jsx or similar orchestrator):
     import Onboarding from "./components/Onboarding.jsx";
     import { store } from "./engine/core/store.js";
     {!store.onboarded && <Onboarding onClose={...} />}

   On finish OR Skip:  store.onboarded = true  (via saveStore)
   On Escape / backdrop click:  dismissed for this session only
     (onClose without persisting) so a stray click never permanently
     marks the user as onboarded.
   ============================================================ */
import { useEffect, useRef, useState } from "react";
import { store, saveStore } from "../engine/core/store.js";
import "../styles/onboarding.css";

/* ---- Step definitions ---------------------------------------- */
const STEPS = [
  {
    icon: "🎹",
    title: "Connect your e-kit",
    body: (
      <>
        Drum Dojo uses <strong>Web MIDI</strong> to receive hits directly from your
        electronic drum kit — no audio interface required. Plug your kit into USB,
        then click <strong>Connect MIDI</strong> in the Timing Coach panel. Chrome
        and Edge are supported; Firefox requires a plugin.
      </>
    ),
  },
  {
    icon: "⏱️",
    title: "Calibrate latency",
    body: (
      <>
        Every kit and audio setup has a small delay between you hitting a pad and
        the app hearing it. Find the <strong>Latency calibration</strong> slider in
        the Timing Coach, play a steady groove for a few bars, then press{" "}
        <strong>Auto-zero</strong> to lock in your personal offset. Re-calibrate
        whenever you change kits or audio gear.
      </>
    ),
  },
  {
    icon: "🥁",
    title: "Play along & get graded",
    body: (
      <>
        Select a pattern from the sidebar, hit Play, and drum along. Each hit lands
        on the <strong>Rush ← → Drag</strong> meter as a shaped tick: a tall pill for
        Perfect, a wide bar for Good, and a thin stripe for Off. Your accuracy,
        tendency, and consistency are tracked in real time — aim for that A+!
      </>
    ),
  },
];

/* ============================================================ */
export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0);
  const total = STEPS.length;
  const isLast = step === total - 1;
  const dialogRef = useRef(null);

  /* Mark onboarded in the persistent store, then call the parent's onClose.
     Used by Skip and the final "Get started" — an explicit user decision. */
  const finish = () => {
    store.onboarded = true;
    saveStore();
    onClose();
  };

  /* Dismiss for this session WITHOUT persisting — used by Escape and a
     backdrop click so a stray outside click never permanently marks the
     user as onboarded (it will reappear next run). */
  const dismiss = () => onClose();

  /* Focus management + Escape-to-dismiss.
     On mount: remember the previously-focused element, move focus into the
     dialog. On unmount: restore focus and remove the keydown listener. */
  useEffect(() => {
    const prevFocus = document.activeElement;
    dialogRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        return;
      }
      // Light focus trap: keep Tab cycling among the dialog's buttons.
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll("button");
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore focus to whatever was focused before the overlay opened.
      if (prevFocus instanceof HTMLElement) prevFocus.focus();
    };
    // Empty deps: dismiss/onClose are stable enough for a one-shot overlay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /* Clicking outside the card dismisses for this session (no persist) */
    <div className="modal-backdrop" onClick={dismiss}>
      <div
        className="modal ob-modal"
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Onboarding, step ${step + 1} of ${total}: ${STEPS[step].title}`}
        /* Stop backdrop click from propagating through the card */
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-head">
          <h3>Welcome to Drum Dojo</h3>
          <button className="modal-x" onClick={skip} aria-label="Skip onboarding">
            ✕
          </button>
        </div>

        {/* Step indicator dots — also serve as progressbar for AT */}
        <div
          className="ob-stepper"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of ${total}`}
        >
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={
                "ob-step-dot" +
                (i === step ? " active" : i < step ? " done" : "")
              }
            />
          ))}
        </div>

        {/* Step content */}
        <div className="ob-body">
          <div className="ob-icon" aria-hidden="true">
            {STEPS[step].icon}
          </div>
          <h4 className="ob-title">{STEPS[step].title}</h4>
          <p className="ob-text">{STEPS[step].body}</p>
        </div>

        {/* Navigation */}
        <div className="ob-nav">
          <button className="btn ob-skip" onClick={skip}>
            Skip
          </button>
          <div className="ob-nav-r">
            {step > 0 && (
              <button
                className="btn ob-back"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </button>
            )}
            {isLast ? (
              <button className="btn primary ob-next" onClick={finish}>
                Get started ▶
              </button>
            ) : (
              <button
                className="btn primary ob-next"
                onClick={() => setStep((s) => s + 1)}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
