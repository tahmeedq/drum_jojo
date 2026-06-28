/* ============================================================
   Transport scheduler — look-ahead Web Audio clock.
   Emits events instead of touching the DOM:
     "tick"        {step}            playhead position
     "count"       {n}               count-in display (0 = go)
     "transport"   {playing,countIn} play/stop
     "partChanged" {idx,live}        song-mode section change
     "banner"                        trade-mode call/response
     "bpm"         {bpm}             tempo changed
     "rep"         {rep,bars}        a full loop completed
     "trainerTarget"                 speed trainer reached target bpm
     "expectHit"   {id,time,step,v}  a scheduled note (for MIDI timing)
   ============================================================ */
import { Audio } from "../audio/engine.js";
import { trigger, loadSamples, isSamplesReady } from "../audio/voices.js";
import { S, emit } from "../state.js";
import { activeRows, prep, fromSaved } from "./patterns.js";
import { findPattern } from "../data/index.js";
import { store } from "./store.js";

const lookahead = 25, scheduleAhead = 0.12;
let timer = null, nextNoteTime = 0, countLeft = 0;
let sessionStart = 0;

const stepDur = () => (60 / S.bpm) / S.current.sub;
const hum = () => 0.92 + Math.random() * 0.14;
const velFor = (v) => (v === 2 ? 1.05 : v === 3 ? 0.3 : 0.8) * hum();

// Swing delays every other subdivision (long-short feel). Only meaningful
// for even subdivisions (8ths / 16ths); compound meters are left straight.
function swingOffset(step) {
  if (!S.swing || S.current.sub % 2 !== 0) return 0;
  return (step % 2 === 1) ? stepDur() * S.swing : 0;
}

function muteKitNow() {
  if (S.guideMute) return true;
  if (S.trade && (S.barCount % 2 === 1)) return true;   // odd bars = "your turn"
  return false;
}

function playSnareOrn(step, time, vel) {
  const o = S.current._orn ? S.current._orn[step] : ".";
  if (!o || o === ".") return;
  if (o === "f") trigger("snare", time - 0.022, vel * 0.4);
  else if (o === "d") { trigger("snare", time - 0.05, vel * 0.34); trigger("snare", time - 0.026, vel * 0.34); }
  else if (o === "z") { for (let k = 1; k <= 3; k++) trigger("snare", time - 0.012 * k, vel * 0.4); }
}

function afterAudio(time, fn) {
  setTimeout(() => { if (S.playing) fn(); }, Math.max(0, (time - Audio.now()) * 1000));
}

function scheduleStep(step, time) {
  const p = S.current;
  const sw = swingOffset(step);
  const at = time + sw;
  const clickEvery = S.clickRes === "all" ? 1 : p.sub;
  if (S.click && step % clickEvery === 0) trigger("click", time, step === 0);

  const silent = muteKitNow();
  activeRows().forEach(row => {
    const v = p._t[row.id][step] || 0;
    if (v <= 0) return;
    // Expected note for the MIDI timing engine — independent of audio
    // muting, so "play it yourself" voices are still graded. We pass the
    // notated dynamic (v) so the engine can grade accent/ghost velocity.
    if (S.midiOn) emit("expectHit", { id: row.id, time: at, step, v });
    if (silent || S.muted[row.id]) return;
    const vel = velFor(v);
    if (row.id === "snare") playSnareOrn(step, at, vel);
    trigger(row.id, at, vel);
  });
  afterAudio(at, () => emit("tick", { step }));
}

function scheduleCount(beat, time) {
  trigger("click", time, beat === 0);
  afterAudio(time, () => emit("count", { n: 4 - beat }));
}

export function setSongPart(i) {
  const part = S.song.parts[i];
  let p = null;
  if (part.src) {                         // custom song: "groove:Name" / "fill:Name" / "custom:id"
    const c = part.src.indexOf(":");
    const kind = part.src.slice(0, c), key = part.src.slice(c + 1);
    if (kind === "custom") { const s = store.custom.find(x => x._id === key); p = s ? fromSaved(s) : null; }
    else p = findPattern(kind, key);
  } else if (part.ref) {                   // built-in song
    p = findPattern(part.ref[0], part.ref[1]);
  }
  S.current = prep(p || findPattern("groove", "Basic Rock Beat"));
  S.muted = {};
}

// Called at every bar boundary in pattern/lesson mode.
function onBarComplete(tAt) {
  S.barCount++;
  const bars = S.loop ? S.loopBars : (S.trainer ? S.loopBars : 1);
  if (S.barCount % bars === 0) {
    S.repCount++;
    const rep = S.repCount;
    afterAudio(tAt, () => emit("rep", { rep, bars }));
    if (S.trainer) {
      if (!S.trainerTarget || S.bpm < S.trainerTarget) {
        const next = Math.min(S.trainerTarget || 280, 280, S.bpm + S.trainerInc);
        setBpm(next);
        if (S.trainerTarget && next >= S.trainerTarget) afterAudio(tAt, () => emit("trainerTarget"));
      }
    }
    if (S.loop && S.repTarget && S.repCount >= S.repTarget) {
      afterAudio(tAt, () => stop());
    }
  }
  if (S.trade) afterAudio(tAt, () => emit("banner"));
}

function loop() {
  while (nextNoteTime < Audio.now() + scheduleAhead) {
    if (countLeft > 0) {
      scheduleCount(4 - countLeft, nextNoteTime);
      nextNoteTime += 60 / S.bpm; countLeft--;
      if (countLeft === 0) {
        S.stepIdx = 0; S.barCount = 0;
        afterAudio(nextNoteTime, () => { emit("count", { n: 0 }); emit("banner"); });
      }
    } else {
      scheduleStep(S.stepIdx, nextNoteTime);
      nextNoteTime += stepDur(); S.stepIdx++;
      if (S.stepIdx >= S.current._steps) {
        S.stepIdx = 0;
        const tAt = nextNoteTime;
        if (S.mode === "song") {
          S.barCount++;
          S.barsPlayed++;
          if (S.barsPlayed >= S.song.parts[S.songIdx].bars) {
            S.barsPlayed = 0; S.songIdx = (S.songIdx + 1) % S.song.parts.length;
            const idx = S.songIdx; setSongPart(idx);
            afterAudio(tAt, () => emit("partChanged", { idx, live: true }));
            if (S.trainer && S.songIdx === 0) setBpm(Math.min(280, S.bpm + S.trainerInc));
          }
          if (S.trade) afterAudio(tAt, () => emit("banner"));
        } else {
          onBarComplete(tAt);
        }
      }
    }
  }
}

export function play() {
  Audio.init(); Audio.resume();
  if (!isSamplesReady()) loadSamples();
  S.playing = true; S.repCount = 0;
  sessionStart = performance.now();
  if (S.mode === "song") { S.songIdx = 0; S.barsPlayed = 0; setSongPart(0); emit("partChanged", { idx: 0, live: true }); }
  S.stepIdx = 0; S.barCount = 0; countLeft = S.countIn ? 4 : 0;
  emit("transport", { playing: true, countIn: S.countIn });
  emit("banner");
  nextNoteTime = Audio.now() + 0.12;
  timer = setInterval(loop, lookahead);
}

export function stop() {
  if (!S.playing) return;
  S.playing = false;
  if (timer) clearInterval(timer); timer = null;
  const secs = sessionStart ? (performance.now() - sessionStart) / 1000 : 0;
  sessionStart = 0;
  emit("transport", { playing: false, sessionSecs: secs });
}

export const toggle = () => (S.playing ? stop() : play());
export function setBpm(v) { S.bpm = Math.max(30, Math.min(280, Math.round(v))); emit("bpm", { bpm: S.bpm }); }

let taps = [];
export function tap() {
  const n = performance.now();
  taps = taps.filter(t => n - t < 2000); taps.push(n);
  if (taps.length >= 2) {
    let s = 0; for (let i = 1; i < taps.length; i++) s += taps[i] - taps[i - 1];
    setBpm(60000 / (s / (taps.length - 1)));
  }
}
