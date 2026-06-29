/* ============================================================
   Onboarding.jsx — first-run walkthrough overlay for Drum Dojo.

   Props: { onClose: () => void }

   Mount gating (in App.jsx or similar orchestrator):
     import Onboarding from "./components/Onboarding.jsx";
     import { store } from "./engine/core/store.js";
     {!store.onboarded && <Onboarding onClose={...} />}

   On finish OR skip:  store.onboarded = true  (via saveStore)
   ============================================================ */
import { useState } from "react";
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

  /* Mark onboarded in the persistent store, then call the parent's onClose. */
  const finish = () => {
    store.onboarded = true;
    saveStore();
    onClose();
  };

  /* Clicking the backdrop or Skip also counts as "done". */
  const skip = finish;

  return (
    /* Clicking outside the card skips/closes */
    <div className="modal-backdrop ob-backdrop" onClick={skip}>
      <div
        className="modal ob-modal"
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
