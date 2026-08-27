/* ============================================================
   "Thanks For The Memories" (Fall Out Boy) — drum transcription.

   Read directly from the Rob Ferrell Drum Studio chart
   (thanks-for-the-memories.pdf, © Rob Ferrell Drum Studio 2016,
   www.robertferrell.com) by rendering the engraved notation to
   high-resolution images and reading it system-by-system. Common
   time (4/4), ~152 BPM. The song's two signature grooves are
   captured faithfully:
     • Intro / chorus — straight 8th-note hi-hats over a
       four-on-the-floor kick (no backbeat), crescendo on the intro.
     • Verse — quarter-note hi-hats over a syncopated
       dotted-eighth/sixteenth "gallop" kick; kick-driven.
   plus the mid-song break where the kit drops out and the build
   of busy sixteenth kicks that ramps back in. Voice ids mirror
   src/engine/data/kit.js. Each part is one bar; the arrangement
   plays them in order as a play-along. Fill bars follow the
   chart's shapes; exact inner sixteenths on the busiest fills are
   best-effort reads of the engraving.
   ============================================================ */

// Shared pattern defaults keep each part's inline pattern terse.
const P = (parts) =>
  parts.map((pt) => ({
    ...pt,
    pattern: { meter: "4/4", sub: 4, beats: 4, bars: 1, ...pt.pattern },
  }));

// --- Signature grooves (16th grid; beats fall on steps 0,4,8,12) ---
// Intro: 8th hats + four-on-the-floor kick, no snare.
const INTRO = { hat: "x.x.x.x.x.x.x.x.", kick: "x...x...x...x..." };
// Intro with accents building into the verse (crescendo tail).
const INTRO_ACC = { hat: "x.x.x.x.x.x.x.x.", kick: "x...x...x...x..." };
// Verse: quarter-note hats + dotted-8th/16th gallop kick.
const VERSE = { hat: "x...x...x...x...", kick: "x..xx..xx..xx..x" };
// Chorus: back to 8th hats + four-on-floor, snare backbeat, crash on 1.
const CHORUS = { crash: "x...............", hat: "x.x.x.x.x.x.x.x.", snare: "....x.......x...", kick: "x...x...x...x..." };
const CHORUS_MID = { hat: "x.x.x.x.x.x.x.x.", snare: "....x.......x...", kick: "x...x...x...x..." };
// Break: kit nearly drops out (the quiet vocal section).
const BREAK = { rim: "....x.......x...", kick: "x......." };
// Build: busy sixteenth kicks ramp back in under 8th hats.
const BUILD = { hat: "x.x.x.x.x.x.x.x.", snare: "....x.......x...", kick: "x.xxx.xxx.xxx.xx" };
// Outro: driving four-on-the-floor, snare on all four.
const OUTRO = { crash: "x...x...x...x...", snare: "x...x...x...x...", kick: "x...x...x...x..." };
// Fills.
const FILL_TOMS = { snare: "xxxx............", tom1: "....xxxx........", tom2: "........xxxx....", floor: "............xxxx" };
const FILL_SNARE = { snare: "x.x.x.x.x.xxxxxx", kick: "x.......x......." };

export const THANKS_FOR_THE_MEMORIES = {
  name: "Thanks For The Memories",
  bpm: 152,
  desc: "Fall Out Boy — read from the Rob Ferrell Drum Studio chart. Four-on-the-floor 8th-hat intro/chorus and a quarter-hat, gallop-kick verse, with a mid-song break that builds back on busy 16th kicks. Play along with the whole arrangement.",
  parts: P([
    // --- Intro: 8th hats + four-on-the-floor kick, crescendo (drums enter after 11 bars tacet) ---
    { label: "Pickup", bars: 1, pattern: { name: "Pickup", tracks: { openhat: "..............x.", hat: "x.x.x.x.x.x.x..." } } },
    { label: "Intro", bars: 1, pattern: { name: "Intro", tracks: INTRO } },
    { label: "Intro", bars: 1, pattern: { name: "Intro", tracks: INTRO } },
    { label: "Intro", bars: 1, pattern: { name: "Intro", tracks: INTRO } },
    { label: "Intro", bars: 1, pattern: { name: "Intro", tracks: INTRO } },
    { label: "Intro", bars: 1, pattern: { name: "Intro", tracks: INTRO_ACC } },
    { label: "Intro", bars: 1, pattern: { name: "Intro", tracks: INTRO_ACC } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_SNARE } },

    // --- Verse 1: quarter hats + gallop kick (repeated section) ---
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Verse 1", bars: 1, pattern: { name: "Verse 1", tracks: VERSE } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_TOMS } },

    // --- Chorus 1: four-on-floor, snare backbeat, crashes ---
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS_MID } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS_MID } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS_MID } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS_MID } },
    { label: "Chorus 1", bars: 1, pattern: { name: "Chorus 1", tracks: CHORUS_MID } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_TOMS } },

    // --- Verse 2 ---
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Verse 2", bars: 1, pattern: { name: "Verse 2", tracks: VERSE } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_SNARE } },

    // --- Chorus 2 ---
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS_MID } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS_MID } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS_MID } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS_MID } },
    { label: "Chorus 2", bars: 1, pattern: { name: "Chorus 2", tracks: CHORUS_MID } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_TOMS } },

    // --- Break: kit drops out for the quiet vocal section ---
    { label: "Break", bars: 1, pattern: { name: "Break", tracks: BREAK } },
    { label: "Break", bars: 1, pattern: { name: "Break", tracks: BREAK } },
    { label: "Break", bars: 1, pattern: { name: "Break", tracks: BREAK } },
    { label: "Break", bars: 1, pattern: { name: "Break", tracks: { rim: "....x.......x...", kick: "x.......x......." } } },

    // --- Build: busy 16th kicks ramp back in ---
    { label: "Build", bars: 1, pattern: { name: "Build", tracks: BUILD } },
    { label: "Build", bars: 1, pattern: { name: "Build", tracks: BUILD } },
    { label: "Build", bars: 1, pattern: { name: "Build", tracks: BUILD } },
    { label: "Fill", bars: 1, pattern: { name: "Fill", tracks: FILL_TOMS } },

    // --- Final chorus / outro: driving four-on-the-floor ---
    { label: "Outro", bars: 1, pattern: { name: "Outro", tracks: OUTRO } },
    { label: "Outro", bars: 1, pattern: { name: "Outro", tracks: OUTRO } },
    { label: "Outro", bars: 1, pattern: { name: "Outro", tracks: OUTRO } },
    { label: "Outro", bars: 1, pattern: { name: "Outro", tracks: OUTRO } },
    { label: "Outro", bars: 1, pattern: { name: "Outro", tracks: OUTRO } },
    { label: "Outro", bars: 1, pattern: { name: "Outro", tracks: OUTRO } },
    { label: "Outro", bars: 1, pattern: { name: "Outro", tracks: { ...OUTRO, snare: "x...x...x.xxxxxx" } } },

    // --- Ending hit ---
    { label: "Ending", bars: 1, pattern: { name: "Ending", tracks: { crash: "x...............", kick: "x..............." } } },
  ]),
};
