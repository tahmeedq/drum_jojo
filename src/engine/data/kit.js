/* ============================================================
   Kit definition — rows top→bottom, plus the General MIDI
   drum-note map used by the e-drum (MIDI-in) timing engine.
   ============================================================ */

// Display rows. Only rows present in a pattern are rendered.
export const ROWS = [
  { id: "crash",   label: "Crash" },
  { id: "ride",    label: "Ride" },
  { id: "openhat", label: "Open HH" },
  { id: "hat",     label: "Hi-Hat" },
  { id: "tom1",    label: "Tom 1" },
  { id: "tom2",    label: "Tom 2" },
  { id: "snare",   label: "Snare" },
  { id: "rim",     label: "Cross-Stick" },
  { id: "floor",   label: "Floor Tom" },
  { id: "kick",    label: "Kick" },
];

// General MIDI percussion note numbers → our voice ids.
// Covers the common e-drum mappings (Roland/Alesis/Yamaha).
export const GM_DRUM_MAP = {
  35: "kick", 36: "kick",                 // Acoustic/Electric bass drum
  38: "snare", 40: "snare", 31: "snare",  // Snare (head + rim shot variants)
  37: "rim",                              // Side stick / cross-stick
  42: "hat", 44: "hat", 22: "hat",        // Closed / pedal hat
  46: "openhat", 26: "openhat",           // Open hat
  48: "tom1", 50: "tom1",                 // High / hi-mid tom
  45: "tom2", 47: "tom2",                 // Low-mid tom
  41: "floor", 43: "floor", 58: "floor",  // Floor toms
  49: "crash", 52: "crash", 55: "crash", 57: "crash", // Crashes / china / splash
  51: "ride", 53: "ride", 59: "ride",     // Ride + bell
};
