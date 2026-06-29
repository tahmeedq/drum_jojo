/* ============================================================
   Audio engine — context, master bus, convolver reverb, glue
   compressor. Also exposes a performance.now()→AudioContext
   time converter used by the MIDI timing engine.
   ============================================================ */
export const Audio = {
  ctx: null, master: null, bus: null, conv: null, revGain: null, comp: null,
  kitGain: null, clickGain: null, monitorGain: null,

  init() {
    if (this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext;
    const ctx = this.ctx = new C();

    const master = this.master = ctx.createGain();
    master.gain.value = 0.9;

    // Gentle bus compression to "glue" the kit together.
    const comp = this.comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    comp.attack.value = 0.003; comp.release.value = 0.25;
    master.connect(comp); comp.connect(ctx.destination);

    const bus = this.bus = ctx.createGain();
    bus.connect(master);

    // Convolution room reverb.
    const conv = this.conv = ctx.createConvolver();
    conv.buffer = this.makeIR(1.6, 2.6);
    const revGain = this.revGain = ctx.createGain();
    revGain.gain.value = 0.13;
    bus.connect(conv); conv.connect(revGain); revGain.connect(master);

    // Three independently-controllable sub-buses so the player can balance
    // groove playback, the metronome and their own (MIDI-in) hits.
    //  • kit + monitor go through `bus` → they share the room reverb + glue.
    //  • the click is routed dry, straight to master, so it always cuts
    //    through the mix instead of getting buried in playback + monitor.
    const kitGain = this.kitGain = ctx.createGain(); kitGain.gain.value = 0.85;
    const monitorGain = this.monitorGain = ctx.createGain(); monitorGain.gain.value = 0.8;
    kitGain.connect(bus); monitorGain.connect(bus);
    const clickGain = this.clickGain = ctx.createGain(); clickGain.gain.value = 0.9 * 1.6;
    clickGain.connect(master);
  },

  makeIR(dur, decay) {
    const ctx = this.ctx, len = ctx.sampleRate * dur;
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  },

  resume() { if (this.ctx) this.ctx.resume(); },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  setVolume(v) { if (this.master) this.master.gain.value = v / 100 * 1.05; },
  setReverb(v) { if (this.revGain) this.revGain.gain.value = v; },

  // Per-source volumes (0..100). The click gets extra headroom (×1.6) because
  // its synth peak is low and it needs to punch through a busy mix.
  setKitVolume(v)     { if (this.kitGain)     this.kitGain.gain.value     = v / 100; },
  setClickVolume(v)   { if (this.clickGain)   this.clickGain.gain.value   = v / 100 * 1.6; },
  setMonitorVolume(v) { if (this.monitorGain) this.monitorGain.gain.value = v / 100; },

  /* Convert a DOMHighResTimeStamp (performance.now ms) to AudioContext
     seconds — the link between Web MIDI event times and audio time. */
  perfToCtx(perfMs) {
    if (!this.ctx) return 0;
    const ts = this.ctx.getOutputTimestamp ? this.ctx.getOutputTimestamp() : null;
    if (ts && ts.performanceTime != null && ts.contextTime != null) {
      return ts.contextTime + (perfMs - ts.performanceTime) / 1000;
    }
    return this.ctx.currentTime + (perfMs - performance.now()) / 1000;
  },
};
