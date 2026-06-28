/* ============================================================
   Drum Dojo — entry point.
   ============================================================ */
import { loadStore } from "./core/store.js";
import { loadSamples } from "./audio/voices.js";
import { boot } from "./ui/app.js";
import { $ } from "./ui/dom.js";

loadStore();
boot();

// Pre-decode the acoustic kit and update the status pill.
loadSamples().then(info => {
  const dot = $("kitDot"), label = $("kitLabel");
  if (dot) dot.classList.toggle("ready", info.sampled > 0);
  if (label) label.textContent = info.label;
}).catch(() => {});
