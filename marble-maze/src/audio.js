// =====================================================================
//  audio.js — 100% procedural sound via WebAudio (no asset files).
//  SFX + a speed-reactive rolling loop + a gentle generative music bed.
//  Must be resumed on a user gesture (browser autoplay policy).
// =====================================================================

let ctx = null;
let master, sfxGain, musicGain, noiseBuf;
let enabled = { sound: true, music: true };
let rolling = null;       // { src, filter, gain }
let musicTimer = null;
let musicScale = [0, 3, 5, 7, 10]; // minor pentatonic offsets
let musicRoot = 220;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  sfxGain = ctx.createGain(); sfxGain.gain.value = 0.9; sfxGain.connect(master);
  musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
  // shared noise buffer for rolling / impacts
  const len = ctx.sampleRate * 1.0;
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

export function resume() {
  ensure();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function setEnabled(opts) {
  enabled = { ...enabled, ...opts };
  if (musicGain) musicGain.gain.value = enabled.music ? 0.18 : 0.0;
  if (!enabled.music) stopMusic();
}

// ---- low-level helpers ----
function tone(freq, t0, dur, type = 'sine', peak = 0.5, glideTo = null) {
  if (!ctx || !enabled.sound) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(sfxGain);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function noiseBurst(t0, dur, freq = 1200, q = 1, peak = 0.4, type = 'bandpass') {
  if (!ctx || !enabled.sound) return;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(sfxGain);
  src.start(t0); src.stop(t0 + dur + 0.02);
}

// ---- public SFX ----
export function coin(combo = 0) {
  if (!ensure()) return;
  const t = ctx.currentTime;
  const base = 880 * Math.pow(2, Math.min(combo, 8) / 12);
  tone(base, t, 0.12, 'triangle', 0.35);
  tone(base * 1.5, t + 0.04, 0.12, 'sine', 0.25);
}
export function powerup() {
  if (!ensure()) return; const t = ctx.currentTime;
  tone(523, t, 0.1, 'square', 0.3, 880);
  tone(784, t + 0.08, 0.18, 'square', 0.3, 1320);
}
export function boost() {
  if (!ensure()) return; const t = ctx.currentTime;
  noiseBurst(t, 0.25, 600, 0.6, 0.3, 'highpass');
  tone(180, t, 0.25, 'sawtooth', 0.2, 520);
}
export function bounce() {
  if (!ensure()) return; const t = ctx.currentTime;
  tone(300, t, 0.15, 'sine', 0.4, 760);
}
export function shieldHit() {
  if (!ensure()) return; const t = ctx.currentTime;
  noiseBurst(t, 0.18, 2200, 2, 0.35, 'bandpass');
  tone(420, t, 0.14, 'triangle', 0.25, 200);
}
export function die() {
  if (!ensure()) return; const t = ctx.currentTime;
  tone(330, t, 0.5, 'sawtooth', 0.35, 70);
  noiseBurst(t, 0.4, 400, 0.5, 0.3, 'lowpass');
}
export function win() {
  if (!ensure()) return; const t = ctx.currentTime;
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => tone(n, t + i * 0.09, 0.22, 'triangle', 0.32));
}
export function star(i = 0) {
  if (!ensure()) return; const t = ctx.currentTime;
  tone([784, 988, 1175][i % 3], t, 0.18, 'sine', 0.3);
}
export function gold() {
  if (!ensure()) return; const t = ctx.currentTime;
  // triumphant rising arpeggio for GOLD RUSH
  const notes = [523, 659, 784, 1047, 1319, 1568];
  notes.forEach((n, i) => tone(n, t + i * 0.06, 0.3, 'triangle', 0.34));
  noiseBurst(t, 0.5, 5000, 0.5, 0.18, 'highpass');
}
export function portal() {
  if (!ensure()) return; const t = ctx.currentTime;
  tone(880, t, 0.18, 'sine', 0.28, 220);
  noiseBurst(t, 0.2, 1800, 1.4, 0.18, 'bandpass');
}
export function uiClick() {
  if (!ensure()) return; const t = ctx.currentTime;
  tone(660, t, 0.05, 'square', 0.16);
}
export function uiBack() {
  if (!ensure()) return; const t = ctx.currentTime;
  tone(330, t, 0.06, 'square', 0.16);
}

// ---- rolling loop (call setRolling each frame) ----
export function startRolling() {
  if (!ensure() || rolling) return;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const filter = ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 300; filter.Q.value = 0.8;
  const gain = ctx.createGain(); gain.gain.value = 0;
  src.connect(filter); filter.connect(gain); gain.connect(sfxGain);
  src.start();
  rolling = { src, filter, gain };
}
export function setRolling(speed01) {
  if (!rolling || !ctx) return;
  const g = enabled.sound ? Math.min(0.22, speed01 * 0.26) : 0;
  rolling.gain.gain.setTargetAtTime(g, ctx.currentTime, 0.05);
  rolling.filter.frequency.setTargetAtTime(220 + speed01 * 900, ctx.currentTime, 0.05);
}
export function stopRolling() {
  if (!rolling) return;
  try { rolling.src.stop(); } catch (e) {}
  rolling = null;
}

// ---- generative music bed ----
export function configureMusic(scale, rootHz) {
  if (scale) musicScale = scale;
  if (rootHz) musicRoot = rootHz;
}
export function startMusic() {
  if (!ensure() || musicTimer || !enabled.music) return;
  musicGain.gain.value = 0.18;
  let step = 0;
  const tick = () => {
    if (!ctx || !enabled.music) return;
    const t = ctx.currentTime + 0.02;
    const deg = musicScale[(step * 2) % musicScale.length];
    const oct = (step % 8 < 4) ? 1 : 2;
    const f = musicRoot * Math.pow(2, deg / 12) * oct;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g); g.connect(musicGain);
    o.start(t); o.stop(t + 0.55);
    // soft bass every 4 steps
    if (step % 4 === 0) {
      const b = ctx.createOscillator(); const bg = ctx.createGain();
      b.type = 'triangle'; b.frequency.value = musicRoot / 2;
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.exponentialRampToValueAtTime(0.6, t + 0.04);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      b.connect(bg); bg.connect(musicGain);
      b.start(t); b.stop(t + 0.85);
    }
    step++;
  };
  tick();
  musicTimer = setInterval(tick, 320);
}
export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  if (musicGain) musicGain.gain.value = 0;
}
