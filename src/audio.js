// ============================================================
// AUDIO.JS — fully procedural factory soundscape (Web Audio).
// No samples, no files: hums, bells, stamps, alarms, creature
// blips — all synthesized on the fly.
// ============================================================

let ctx = null;
let master = null;
let muted = false;
let humNodes = null;

function ensure() {
  if (!ctx) return false;
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

function envGain(at, peak, attack, decay) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  g.connect(master);
  return g;
}

function osc(type, freq, at) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  return o;
}

function noiseBuffer(seconds = 1) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function noise(at, dur, filterType, freq, peak, q = 1) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(dur + 0.1);
  const f = ctx.createBiquadFilter();
  f.type = filterType; f.frequency.setValueAtTime(freq, at); f.Q.value = q;
  const g = envGain(at, peak, 0.005, dur);
  src.connect(f).connect(g);
  src.start(at); src.stop(at + dur + 0.1);
}

export const audio = {
  init() {
    if (ctx) { ensure(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    this.startHum();
  },

  setMuted(m) {
    muted = m;
    if (master) master.gain.value = m ? 0 : 0.55;
  },
  isMuted() { return muted; },

  startHum() {
    if (!ensure() || humNodes) return;
    const g = ctx.createGain(); g.gain.value = 0.05; g.connect(master);
    const o1 = osc('sawtooth', 54, ctx.currentTime);
    const o2 = osc('sawtooth', 54.7, ctx.currentTime);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160;
    o1.connect(f); o2.connect(f); f.connect(g);
    // slow machinery wobble
    const lfo = osc('sine', 0.13, ctx.currentTime);
    const lfoG = ctx.createGain(); lfoG.gain.value = 14;
    lfo.connect(lfoG).connect(f.frequency);
    // air hiss
    const hiss = ctx.createBufferSource();
    hiss.buffer = noiseBuffer(2); hiss.loop = true;
    const hf = ctx.createBiquadFilter(); hf.type = 'bandpass'; hf.frequency.value = 900; hf.Q.value = 0.4;
    const hg = ctx.createGain(); hg.gain.value = 0.008;
    hiss.connect(hf).connect(hg).connect(master);
    o1.start(); o2.start(); lfo.start(); hiss.start();
    humNodes = { o1, o2, lfo, hiss };
  },

  bell() {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    for (const [f, p] of [[1318, 0.16], [1975, 0.1], [880, 0.12]]) {
      const o = osc('sine', f, t0);
      o.connect(envGain(t0, p, 0.004, 1.4));
      o.start(t0); o.stop(t0 + 1.6);
    }
    noise(t0, 0.08, 'highpass', 4000, 0.08);
  },

  stamp() {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    const o = osc('sine', 120, t0);
    o.frequency.exponentialRampToValueAtTime(38, t0 + 0.16);
    o.connect(envGain(t0, 0.5, 0.003, 0.22));
    o.start(t0); o.stop(t0 + 0.3);
    noise(t0, 0.05, 'lowpass', 1400, 0.3);
  },

  clank() {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    noise(t0, 0.12, 'bandpass', 500 + Math.random() * 900, 0.12, 6);
    const o = osc('triangle', 200 + Math.random() * 160, t0);
    o.connect(envGain(t0, 0.06, 0.002, 0.18));
    o.start(t0); o.stop(t0 + 0.2);
  },

  whoosh(dur = 1.2) {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(dur + 0.2);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 1.4;
    f.frequency.setValueAtTime(220, t0);
    f.frequency.exponentialRampToValueAtTime(1900, t0 + dur * 0.55);
    f.frequency.exponentialRampToValueAtTime(300, t0 + dur);
    const g = envGain(t0, 0.16, dur * 0.3, dur * 0.7);
    src.connect(f).connect(g);
    src.start(t0); src.stop(t0 + dur + 0.2);
  },

  print() {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    for (let i = 0; i < 14; i++) {
      noise(t0 + i * 0.085, 0.02, 'highpass', 2600, 0.05);
    }
    const o = osc('sawtooth', 70, t0);
    o.connect(envGain(t0, 0.04, 0.05, 1.1));
    o.start(t0); o.stop(t0 + 1.25);
  },

  seal() {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    noise(t0, 0.3, 'lowpass', 500, 0.25);
    const o = osc('sine', 90, t0 + 0.12);
    o.frequency.exponentialRampToValueAtTime(45, t0 + 0.4);
    o.connect(envGain(t0 + 0.12, 0.4, 0.004, 0.3));
    o.start(t0 + 0.12); o.stop(t0 + 0.5);
  },

  doors() {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(2.4);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 240;
    const g = envGain(t0, 0.22, 0.5, 1.8);
    src.connect(f).connect(g);
    src.start(t0); src.stop(t0 + 2.4);
    const o = osc('sawtooth', 30, t0);
    o.connect(envGain(t0, 0.12, 0.4, 1.9));
    o.start(t0); o.stop(t0 + 2.4);
  },

  alarm() {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = osc('square', i % 2 ? 622 : 466, t0 + i * 0.28);
      o.connect(envGain(t0 + i * 0.28, 0.07, 0.01, 0.2));
      o.start(t0 + i * 0.28); o.stop(t0 + i * 0.28 + 0.24);
    }
  },

  chime() {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    [523, 659, 784, 1046].forEach((f, i) => {
      const o = osc('sine', f, t0 + i * 0.09);
      o.connect(envGain(t0 + i * 0.09, 0.12, 0.005, 0.9));
      o.start(t0 + i * 0.09); o.stop(t0 + i * 0.09 + 1);
    });
  },

  sad() {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    const o = osc('triangle', 392, t0);
    o.frequency.exponentialRampToValueAtTime(196, t0 + 0.7);
    o.connect(envGain(t0, 0.1, 0.02, 0.7));
    o.start(t0); o.stop(t0 + 0.8);
  },

  /** creature speech — short pitched blips, per-creature base pitch */
  talk(seedPitch = 400, n = 5) {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    for (let i = 0; i < n; i++) {
      const f = seedPitch * (0.85 + Math.random() * 0.5);
      const o = osc(Math.random() < 0.5 ? 'triangle' : 'square', f, t0 + i * 0.09);
      o.connect(envGain(t0 + i * 0.09, 0.05, 0.008, 0.07));
      o.start(t0 + i * 0.09); o.stop(t0 + i * 0.09 + 0.09);
    }
  },

  uiClick() {
    if (!ensure()) return;
    const t0 = ctx.currentTime;
    const o = osc('triangle', 880, t0);
    o.connect(envGain(t0, 0.06, 0.002, 0.07));
    o.start(t0); o.stop(t0 + 0.09);
  },
};
