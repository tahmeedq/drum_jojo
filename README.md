# Drum Dojo — Pro Play-Along Trainer

A browser-based drum trainer: a progressive course, grooves, rudiments, fills,
song mode, a **custom-pattern editor**, **practice analytics**, and **live
timing + dynamics feedback for electronic kits over MIDI**.

Built with **Vite + React** for the UI, with the real-time audio/MIDI engine
kept as framework-agnostic plain modules so React's render cycle never touches
the millisecond-critical scheduling path.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npm run preview    # serve the production build
```

- **Audio** works in any modern browser.
- **MIDI timing feedback** needs Chrome or Edge on a `localhost`/HTTPS origin
  (Web MIDI requirement). Plug in your e-kit, click **Connect MIDI**, hit play,
  and play along — each hit is graded against the grid in milliseconds.

## Features

- **Course** — 22 lessons across foundations → rock → funk, with goals, focus
  notes and completion tracking.
- **Grooves / Rudiments / Fills** — a curated library grouped by style/family.
- **Song Mode** — chained sections with a live-highlighting timeline.
- **Custom-pattern editor** — click grid cells to cycle rest → hit → accent →
  ghost, set beats/subdivision/bars, name it and **save to "My Patterns"**.
- **Feel & practice tools** — swing slider, count-in, metronome (beats or
  subdivisions), loop region + rep counter, speed trainer (configurable
  increment & target tempo), metronome-only, and trade (demo ↔ you).
- **Seven swappable kits** — a real multi-mic acoustic **Studio** kit
  (MuldjordKit / DrumGizmo, the default), plus Acoustic, Stark, Roland R8, Techno,
  LinnDrum and CR-78, bundled offline in `public/samples/` with a kit picker in
  the header. Each ships kick/snare/hi-hat/3 toms.
- **Sampled cymbals** — crash, ride and open hi-hat are real drumset cymbal
  samples (MuldjordKit) in `public/samples/_cymbals/`, layered on top of every
  kit; an inharmonic metal-oscillator synth is the fallback. Cross-stick stays synth.
- **Big content library** — 75+ grooves (rock, pop, funk, neo-soul, hip-hop/trap,
  metal/double-bass, blues/shuffle, jazz, latin/world, reggae, drum & bass,
  gospel/fusion, odd time), 55+ fills (incl. a full double-bass family), the
  complete **PAS 40 International Drum Rudiments**, 9 play-along songs, and a
  35-lesson / 10-level course.
- **E-Drum Timing Coach** — grades timing **and dynamics** (were your accents
  loud and ghost notes soft?) live.
- **Progress analytics** — daily streak, lifetime practice time, per-item
  personal bests, and an end-of-session report.

## How the timing coach works

1. The scheduler emits an `expectHit{id, time, step, v}` event for every
   scheduled note (`time` in `AudioContext` seconds, `v` = notated dynamic).
2. Web MIDI delivers your note-ons with a high-res `timeStamp`, which the engine
   converts to `AudioContext` time via `engine.perfToCtx()`
   (`getOutputTimestamp` bridges `performance.now()` ↔ audio time).
3. Each hit is matched to the nearest scheduled note **of the same voice**
   within ±180 ms; the offset is graded Perfect (≤18 ms) / Good (≤45 ms) / Off,
   and the played velocity is checked against the notated accent/ghost dynamic.
4. The panel shows live **Accuracy**, **Tendency** (rush/drag), **Consistency**
   (spread) and **Dynamics**, with a moving needle + hit ticks. The matching
   grid cell flashes green/amber/red.

General-MIDI drum notes are mapped in `src/engine/data/kit.js`.

## Architecture

```
index.html                Vite entry
public/samples/<kit>/     bundled .mp3 one-shots (kick snare hihat tom1 tom2 tom3)
src/
  main.jsx                bootstrap (loads store + samples, mounts React)
  App.jsx                 layout, shortcuts, session-summary orchestration
  styles.css              bold studio-console design system
  hooks/useBus.js         subscribe React components to the engine event bus
  engine/                 framework-agnostic real-time core
    state.js              central state + event bus (audio ↔ MIDI ↔ UI)
    controller.js         section/lesson/pattern/song/custom selection
    audio/                engine.js · voices.js · samples.js (embedded kit)
    core/                 patterns.js · scheduler.js (look-ahead) · store.js
    midi/midi.js          Web MIDI input + timing/dynamics grading
    data/                 kit · kits · grooves · rudiments · fills · songs · course
  components/             TopBar · Sidebar · PatternHeader · Transport · Grid ·
                          MidiPanel · SongTimeline · SessionSummary
```

The engine never touches the DOM — the scheduler and MIDI engine emit events on
a shared bus (`state.js`); React components subscribe via the `useBus` hook.
Fast, high-frequency updates (the playhead, MIDI hit flashes, the timing meter)
bypass React and manipulate the DOM directly via refs to stay sample-accurate.

## Credits

The **Studio** kit and the drumset cymbals (crash / ride / open hi-hat) are from
the [MuldjordKit](https://github.com/freepats/muldjordkit) (a DrumGizmo kit via
the FreePats project), licensed **CC-BY 4.0** — © Bjørn Jacobsen / FreePats.
The other six kits are from the [Tone.js audio](https://github.com/Tonejs/audio)
library (MIT). All samples are transcoded to AAC and live under `public/samples/`.

The complete PAS 40 International Drum Rudiments list follows the
[Percussive Arts Society](https://pas.org/rudiments/) standard.

> `_v1/` holds the previous vanilla-JS module version; `_legacy/` the original
> single-file prototype. Both are kept for reference only.
