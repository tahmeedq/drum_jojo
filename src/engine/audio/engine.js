/* ============================================================
   Audio engine — context, master bus, convolver reverb, glue
   compressor. Also exposes a performance.now()→AudioContext
   time converter used by the MIDI timing engine.
   ============================================================ */
export const Audio = {
  ctx: null, master: null, bus: null, conv: null, revGain: null, comp: null,

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
