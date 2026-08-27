/* ============================================================
   "Thanks For The Memories" (Fall Out Boy) — drum transcription.

   Transcribed from the Rob Ferrell Drum Studio chart
   (thanks-for-the-memories.pdf, © Rob Ferrell Drum Studio 2016,
   www.robertferrell.com). The source is engraved notation in
   common time (4/4) at ~152 BPM. The recurring grooves — the
   straight-8th hi-hat verse with open/closed-hat accents ("o"/"+"
   in the chart), the crash-driven chorus, and the quiet bridge
   that builds into 16th-note kicks — are transcribed bar-by-bar;
   they carry the tune. Voice ids mirror src/engine/data/kit.js.
   Each part is one bar and the arrangement plays them in order as
   a play-along.
   ============================================================ */

// Shared pattern defaults keep each part's inline pattern terse.
const P = (parts) =>
  parts.map((pt) => ({
    ...pt,
    pattern: { meter: "4/4", sub: 4, beats: 4, bars: 1, ...pt.pattern },
  }));

// Reusable grooves (16th grid; beats fall on steps 0,4,8,12).
const VERSE = { hat: "x.x.x.x.x.x.x.x.", snare: "....x.......x...", kick: "x.....x.x.....x." };
const VERSE_OPEN = { openhat: "x.......x.......", hat: "..x.x.x...x.x.x.", snare: "....x.......x...", kick: "x.....x.x.....x." };
const CHORUS = { crash: "x.......x.......", hat: "..x.x.x...x.x.x.", snare: "....x.......x...", kick: "x.....x.x.....x." };
const CHORUS_HIT = { crash: "x...............", hat: "x.x.x.x.x.x.x.x.", snare: "....x.......x...", kick: "x.....x.x.....x." };
const FILL_TOMS = { snare: "xxxx............", tom1: "....xxxx........", tom2: "........xxxx....", floor: "............xxxx" };
const FILL_SNARE = { snare: "x.x.x.x.x.xxxxxx", kick: "x.......x......." };
const BRIDGE_QUIET = { rim: "....x.......x...", hat: "x...x...x...x...", kick: "x.......x......." };
const BRIDGE_BUILD = { hat: "x.x.x.x.x.x.x.x.", snare: "....x.......x...", kick: "xxxxxxxxxxxxxxxx" };

export const THANKS_FOR_THE_MEMORIES = {
  name: "Thanks For The Memories",
  bpm: 152,
  desc: "Fall Out Boy — transcribed from the Rob Ferrell Drum Studio chart. Driving 8th-note verses, open-hat chorus and a bridge that builds into 16th-note kicks. Play along with the whole arrangement.",
  parts: P([
    // --- Intro pickup: drums enter with an open-hat lead-in ---
    { label: "Pickup", bars: 1, pattern: { name: "Pickup", tracks: { openhat: "............x.x.", snare: "..............x." } } },

    // --- Verse 1 (8 bars) ---
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: { ...VERSE, hat: "x.x.x.x.x.x.x.x.", snare: "....x.......x.x." } } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_TOMS } },

    // --- Pre-chorus (4 bars): open-hat lift ---
    { label: "Pre-Chorus", bars: 1, pattern: { name: "Pre-Chorus", tracks: VERSE_OPEN } },
    { label: "Pre-Chorus", bars: 1, pattern: { name: "Pre-Chorus", tracks: VERSE_OPEN } },
    { label: "Pre-Chorus", bars: 1, pattern: { name: "Pre-Chorus", tracks: VERSE_OPEN } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_SNARE } },

    // --- Chorus 1 (8 bars) ---
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS_HIT } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS_HIT } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_TOMS } },

    // --- Verse 2 (8 bars) ---
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: { ...VERSE, snare: "....x.......x.x." } } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_SNARE } },

    // --- Pre-chorus 2 (4 bars) ---
    { label: "Pre-Chorus", bars: 1, pattern: { name: "Pre-Chorus", tracks: VERSE_OPEN } },
    { label: "Pre-Chorus", bars: 1, pattern: { name: "Pre-Chorus", tracks: VERSE_OPEN } },
    { label: "Pre-Chorus", bars: 1, pattern: { name: "Pre-Chorus", tracks: VERSE_OPEN } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_SNARE } },

    // --- Chorus 2 (8 bars) ---
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS_HIT } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS_HIT } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_TOMS } },

    // --- Bridge (8 bars): drops to cross-stick, then builds ---
    { label: "Bridge", bars: 1, pattern: { name: "Bridge", tracks: BRIDGE_QUIET } },
    { label: "Bridge", bars: 1, pattern: { name: "Bridge", tracks: BRIDGE_QUIET } },
    { label: "Bridge", bars: 1, pattern: { name: "Bridge", tracks: BRIDGE_QUIET } },
    { label: "Bridge", bars: 1, pattern: { name: "Bridge", tracks: { ...BRIDGE_QUIET, snare: "............x.x." } } },
    { label: "Build", bars: 1, pattern: { name: "Build", tracks: BRIDGE_BUILD } },
    { label: "Build", bars: 1, pattern: { name: "Build", tracks: BRIDGE_BUILD } },
    { label: "Build", bars: 1, pattern: { name: "Build", tracks: BRIDGE_BUILD } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_TOMS } },

    // --- Final chorus (8 bars) ---
    { label: "Final Chorus", bars: 1, pattern: { name: "Final Chorus", tracks: CHORUS_HIT } },
    { label: "Final Chorus", bars: 1, pattern: { name: "Final Chorus", tracks: CHORUS } },
    { label: "Final Chorus", bars: 1, pattern: { name: "Final Chorus", tracks: CHORUS } },
    { label: "Final Chorus", bars: 1, pattern: { name: "Final Chorus", tracks: CHORUS } },
    { label: "Final Chorus", bars: 1, pattern: { name: "Final Chorus", tracks: CHORUS_HIT } },
    { label: "Final Chorus", bars: 1, pattern: { name: "Final Chorus", tracks: CHORUS } },
    { label: "Final Chorus", bars: 1, pattern: { name: "Final Chorus", tracks: CHORUS } },

    // --- Ending hit ---
    { label: "Ending", bars: 1, pattern: { name: "Ending", tracks: { crash: "x...............", kick: "x..............." } } },
  ]),
};
