/* ============================================================
   Transport scheduler — look-ahead Web Audio clock.
   Emits events instead of touching the DOM:
     "tick"        {step}            playhead position
     "count"       {n}               count-in display (0 = go)
     "transport"   {playing,countIn} play/stop
     "partChanged" {idx,live}        song-mode section change
     "banner"                        trade-mode call/response
     "bpm"         {bpm}             tempo changed
     "expectHit"   {id,time,step}    a scheduled note (for MIDI timing)
   ============================================================ */
import { Audio } from "../audio/engine.js";
import { trigger, loadSamples, isSamplesReady } from "../audio/voices.js";
import { S, emit } from "../state.js";
import { activeRows, prep } from "./patterns.js";
import { findPattern } from "../data/index.js";

const lookahead = 25, scheduleAhead = 0.12;
let timer = null, nextNoteTime = 0, countLeft = 0;

const stepDur = () => (60 / S.bpm) / S.current.sub;
const hum = () => 0.92 + Math.random() * 0.14;
const velFor = (v) => (v === 2 ? 1.05 : v === 3 ? 0.3 : 0.8) * hum();

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
  const clickEvery = S.clickRes === "all" ? 1 : p.sub;
  if (S.click && step % clickEvery === 0) trigger("click", time, step === 0);

  const silent = muteKitNow();
  activeRows().forEach(row => {
    const v = p._t[row.id][step] || 0;
    if (v <= 0) return;
    // Expected note for the MIDI timing engine — independent of audio
    // muting, so "play it yourself" voices are still graded.
    if (S.midiOn) emit("expectHit", { id: row.id, time, step });
    if (silent || S.muted[row.id]) return;
    const vel = velFor(v);
    if (row.id === "snare") playSnareOrn(step, time, vel);
    trigger(row.id, time, vel);
  });
  afterAudio(time, () => emit("tick", { step }));
}

function scheduleCount(beat, time) {
  trigger("click", time, beat === 0);
  afterAudio(time, () => emit("count", { n: 4 - beat }));
}

export function setSongPart(i) {
  const part = S.song.parts[i];
  S.current = prep(findPattern(part.ref[0], part.ref[1]));
  S.muted = {};
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
        S.stepIdx = 0; S.barCount++;
        const tAt = nextNoteTime;
        if (S.mode === "song") {
          S.barsPlayed++;
          if (S.barsPlayed >= S.song.parts[S.songIdx].bars) {
            S.barsPlayed = 0; S.songIdx = (S.songIdx + 1) % S.song.parts.length;
            const idx = S.songIdx; setSongPart(idx);
            afterAudio(tAt, () => emit("partChanged", { idx, live: true }));
            if (S.trainer && S.songIdx === 0) setBpm(Math.min(280, S.bpm + 4));
          }
        } else if (S.trainer) {
          setBpm(Math.min(280, S.bpm + 4));
        }
        if (S.trade) afterAudio(tAt, () => emit("banner"));
      }
    }
  }
}

export function play() {
  Audio.init(); Audio.resume();
  if (!isSamplesReady()) loadSamples();
  S.playing = true;
  if (S.mode === "song") { S.songIdx = 0; S.barsPlayed = 0; setSongPart(0); emit("partChanged", { idx: 0, live: true }); }
  S.stepIdx = 0; S.barCount = 0; countLeft = S.countIn ? 4 : 0;
  emit("transport", { playing: true, countIn: S.countIn });
  emit("banner");
  nextNoteTime = Audio.now() + 0.12;
  timer = setInterval(loop, lookahead);
}

export function stop() {
  S.playing = false;
  if (timer) clearInterval(timer); timer = null;
  emit("transport", { playing: false });
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
