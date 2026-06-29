/* ============================================================
   Voices — loads a selectable sampled kit (kick/snare/hat/toms)
   from public/samples, and synthesizes the voices no kit ships
   (crash, ride, open hi-hat, cross-stick) with an inharmonic
   metal-oscillator engine. Exposes trigger(id, time, velocity).
   ============================================================ */
import { Audio } from "./engine.js";
import { KITS, SAMPLE_MAP, DEFAULT_KIT, findKit } from "../data/kits.js";

const BUFFERS = {};            // current kit's decoded buffers by voice id
let currentKit = null, samplesReady = false, loadingKit = null, noiseBuf = null;
const BASE = import.meta.env.BASE_URL || "/";

// Output bus for the next note(s) created — set by trigger() before it builds
// any nodes (always synchronous, so concurrent routes never cross). Falls back
// to the shared bus until the engine has built its sub-buses.
let routeGain = null;
const out = () => routeGain || Audio.kitGain || Audio.bus;

// Sampled cymbal overrides (CC0, Versilian VCSL). No kit ships these, so
// they load once and play on top of any kit, ahead of the synth fallback.
const CYMBALS = {};
const CYMBAL_SRC = { crash: ["crash", 0.85], ride: ["ride", 0.7], openhat: ["openhat", 0.8] };
let cymbalsReady = false;

function getNoise() {
  if (!noiseBuf) {
    const ctx = Audio.ctx, len = ctx.sampleRate;
    const b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = b;
  }
  return noiseBuf;
}

async function fetchDecode(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("missing " + url);
  const arr = await res.arrayBuffer();
  return await Audio.ctx.decodeAudioData(arr);
}

/* Load (or switch to) a kit. Decodes into a staging map, then swaps
   it in atomically so playback never reads a half-loaded kit. */
export async function loadKit(id = DEFAULT_KIT) {
  Audio.init();
  const kit = findKit(id);
  loadingKit = kit.id;
  const next = {};
  const ext = kit.ext || "mp3";
  await Promise.all(Object.entries(SAMPLE_MAP).map(async ([voice, file]) => {
    try { next[voice] = await fetchDecode(`${BASE}samples/${kit.id}/${file}.${ext}`); }
    catch (e) { /* fall back to synth for this voice */ }
  }));
  if (loadingKit !== kit.id) return kitInfo();   // a newer switch superseded us
  for (const k in BUFFERS) delete BUFFERS[k];
  Object.assign(BUFFERS, next);
  currentKit = kit; samplesReady = Object.keys(BUFFERS).length > 0;
  return kitInfo();
}

// One-time load of the sampled cymbal overrides (shared across all kits).
export async function loadCymbals() {
  Audio.init();
  await Promise.all(Object.entries(CYMBAL_SRC).map(async ([id, [file]]) => {
    try { CYMBALS[id] = await fetchDecode(`${BASE}samples/_cymbals/${file}.m4a`); } catch (e) {}
  }));
  cymbalsReady = Object.keys(CYMBALS).length > 0;
  return cymbalsReady;
}

export const loadSamples = () => loadKit(currentKit ? currentKit.id : DEFAULT_KIT);
export const isSamplesReady = () => samplesReady;
export const currentKitId = () => (currentKit ? currentKit.id : DEFAULT_KIT);
export function kitInfo() {
  const n = Object.keys(BUFFERS).length;
  const voices = n + (cymbalsReady ? Object.keys(CYMBALS).length : 0);
  return { sampled: n, kit: currentKit ? currentKit.id : null,
           label: currentKit ? `${currentKit.label} · ${voices} voices` : "Synth kit" };
}

/* ---- synthesis helpers ---- */
function tone(type, f, t, dur, peak, glide, gt) {
  const ctx = Audio.ctx, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + (gt || dur));
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out()); o.start(t); o.stop(t + dur + 0.05);
}
function nz(t, dur, peak, type, freq, q) {
  const ctx = Audio.ctx, n = ctx.createBufferSource(); n.buffer = getNoise();
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f); f.connect(g); g.connect(out()); n.start(t); n.stop(t + dur + 0.05);
}

// Inharmonic square-oscillator bank → the body of a metallic cymbal.
const METAL_RATIOS = [1, 1.34, 1.81, 2.32, 2.83, 3.41];
function metal(t, vel, fund, decay, hpf, bpf, level, attack = 0.0015) {
  const ctx = Audio.ctx;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = hpf;
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = bpf; bp.Q.value = 0.7;
  hp.connect(bp); bp.connect(out());
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, level * vel), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  g.connect(hp);
  METAL_RATIOS.forEach(r => {
    const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = fund * r;
    o.connect(g); o.start(t); o.stop(t + decay + 0.05);
  });
}

const Synth = {
  kick(t, v = 1) { tone("sine", 125, t, 0.34, v, 48, 0.10); tone("sine", 60, t, 0.30, v * 0.7, 40, 0.18); nz(t, 0.012, v * 0.5, "highpass", 3500); },
  snare(t, v = 1) { tone("triangle", 185, t, 0.13, v * 0.45); tone("triangle", 330, t, 0.10, v * 0.3); nz(t, 0.20, v * 0.7, "highpass", 1500); nz(t, 0.16, v * 0.5, "bandpass", 3200, 1.2); nz(t, 0.025, v * 0.55, "highpass", 6500); },
  tom(t, v, f) { tone("sine", f, t, 0.34, v * 0.9, f * 0.55, 0.22); nz(t, 0.02, v * 0.3, "bandpass", f * 2.5, 1); },
  tom1(t, v = 1) { Synth.tom(t, v, 220); }, tom2(t, v = 1) { Synth.tom(t, v, 165); }, floor(t, v = 1) { Synth.tom(t, v, 110); },

  // Closed hat fallback (kits provide a sampled one) — tight metal + noise.
  hat(t, v = 1) { metal(t, v * 0.5, 360, 0.05, 8000, 11000, 0.18); nz(t, 0.03, v * 0.3, "highpass", 9000); },
  // Open hi-hat — sustained shimmer.
  openhat(t, v = 1) { metal(t, v * 0.6, 360, 0.42, 7000, 10500, 0.16); nz(t, 0.34, v * 0.32, "highpass", 7500); nz(t, 0.28, v * 0.2, "bandpass", 10000, 1.5); },
  // Crash — wide, long, splashy.
  crash(t, v = 1) { metal(t, v * 0.7, 300, 1.7, 3500, 7000, 0.16); metal(t, v * 0.5, 480, 1.3, 5000, 9000, 0.10); nz(t, 1.4, v * 0.4, "highpass", 4000); nz(t, 1.0, v * 0.22, "bandpass", 8000, 0.8); },
  // Ride — focused stick "ping" plus a bell tone and shimmer.
  ride(t, v = 1) { tone("sine", 2600, t, 0.10, v * 0.18); metal(t, v * 0.4, 540, 0.9, 5500, 9500, 0.10); tone("triangle", 1180, t, 0.6, v * 0.06); nz(t, 0.5, v * 0.14, "highpass", 6000); },
  // Cross-stick / rim — woody click.
  rim(t, v = 1) { tone("square", 430, t, 0.022, v * 0.5); tone("triangle", 1700, t, 0.03, v * 0.35); nz(t, 0.018, v * 0.3, "highpass", 2500); },

  click(t, accent) { tone("square", accent ? 2000 : 1300, t, 0.03, 0.32); },
};

function playBuffer(buf, t, vel, trim = 1) {
  const s = Audio.ctx.createBufferSource(); s.buffer = buf;
  s.playbackRate.value = 1 + (Math.random() * 0.03 - 0.015);
  const g = Audio.ctx.createGain(); g.gain.value = Math.min(1.6, vel) * trim;
  s.connect(g); g.connect(out()); s.start(t);
}

// route: "kit" (default playback) | "monitor" (player's own MIDI-in hits).
// The metronome is auto-routed to its own dry bus regardless of route.
export function trigger(id, t, vel, route = "kit") {
  if (id === "click") { routeGain = Audio.clickGain; Synth.click(t, vel); return; }
  routeGain = route === "monitor" ? Audio.monitorGain : Audio.kitGain;
  const cy = CYMBAL_SRC[id];                       // sampled cymbal override?
  if (cy && CYMBALS[id]) { playBuffer(CYMBALS[id], t, vel, cy[1]); return; }
  if (BUFFERS[id]) { playBuffer(BUFFERS[id], t, vel); return; }
  (Synth[id] || Synth.snare)(t, vel);
}
