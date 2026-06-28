import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { loadStore, store } from "./engine/core/store.js";
import { loadKit, loadCymbals, kitInfo, isSamplesReady } from "./engine/audio/voices.js";
import { emit } from "./engine/state.js";
import "./styles.css";

loadStore();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const announce = () => emit("kit", { ready: isSamplesReady(), label: kitInfo().label, kit: kitInfo().kit });

// Decode the saved kit (fast), announce, then load the shared sampled
// cymbals and re-announce so the voice count + crash/ride/open-hat upgrade.
loadKit(store.kit || "acoustic")
  .then(announce)
  .then(loadCymbals)
  .then(announce)
  .catch(() => emit("kit", { ready: false, label: "Synth kit" }));
