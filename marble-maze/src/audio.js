// Every sound is a file. Effects are decoded into memory before play starts and
// fired straight from those buffers, so a sound lands on the same frame as the
// thing that caused it. Music streams on two decks that cross-fade into each
// other, so a track can loop or hand over to the next one with no gap.

const BASE = './audio/';

const TRACKS = {
  menu: 'menu.mp3',
  playA: 'play-a.mp3',
  playB: 'play-b.mp3',
};

// One entry per sound the game asks for. The balance between them is baked into
// the files themselves — each was brought to a shared loudness and then set in
// its place in the mix, so the ones that fire constantly sit under the ones that
// mark a real moment. They are wav because a short effect encoded as mp3 carries
// the encoder's padding at its head, which is silence before the sound, which is
// the sound arriving late. All six together are under 200KB.
const SFX = {
  coin:    'drop_002.wav',
  bounce:  'error_007.wav',
  uiClick: 'switch_007.wav',
  powerup: 'question_001.wav',
  win:     'confirmation_001.wav',
  die:     'error_006.wav',
};

// Music sits well under the effects so it stays background and the effects read
// over it; both are low, because neither should be the thing you notice.
const MUSIC_LEVEL = 0.20;
const SFX_LEVEL = 0.52;
const CROSSFADE = 2.6;
const DUCK = 0.45;              // while a panel is up, so its effect cuts through

let ctx = null;
let master, musicBus, sfxBus;
let enabled = { sound: true, music: true };
let hardMuted = false;
let buffers = new Map();
let decks = [];
let deckI = 0;
let scene = null;
let lastPlay = 'playB';
let ducked = false;
let watchdog = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
  master = ctx.createGain(); master.gain.value = hardMuted ? 0 : 1; master.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = enabled.sound ? SFX_LEVEL : 0; sfxBus.connect(master);
  return ctx;
}

export function resume() {
  ensure();
  if (ctx && ctx.state === 'suspended') ctx.resume();
  // a gesture may be the first chance we get to actually start playing
  if (scene) applyScene();
}

// ---- effects ---------------------------------------------------------------

// Called once, early. Nothing is played from a file that has not been decoded,
// so the first coin of the first level is as prompt as the hundredth.
export async function preload() {
  if (!ensure()) return;
  await Promise.all(Object.entries(SFX).map(async ([name, file]) => {
    if (buffers.has(name)) return;
    try {
      const res = await fetch(BASE + file);
      if (!res.ok) return;
      const raw = await res.arrayBuffer();
      const buf = await new Promise((ok, no) => {
        const p = ctx.decodeAudioData(raw, ok, no);
        if (p && p.then) p.then(ok, no);
      });
      buffers.set(name, buf);
    } catch (e) { /* a missing effect is silent, never fatal */ }
  }));
}

function fire(name, rate = 1) {
  if (!enabled.sound || !ctx) return;
  const buf = buffers.get(name); if (!buf) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  src.connect(sfxBus);
  src.start();
}

export function play(name, arg) {
  if (!SFX[name] || !ensure()) return;
  // Coins come in fast runs, and the identical click repeated twenty times reads
  // as a rattle. The same sound steps up slightly through a combo and resets with
  // it — about three semitones across a long one, so it never becomes a new sound.
  if (name === 'coin') fire('coin', 1 + Math.min(arg || 0, 8) * 0.025);
  else fire(name);
}

// ---- music -----------------------------------------------------------------

function makeDeck() {
  const el = new Audio();
  el.preload = 'none';
  el.crossOrigin = 'anonymous';
  const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(musicBus);
  let src = null;
  try { src = ctx.createMediaElementSource(el); src.connect(gain); } catch (e) { src = null; }
  return { el, gain, src, track: null };
}

function ramp(param, to, secs) {
  if (!ctx) return;
  const t = ctx.currentTime;
  param.cancelScheduledValues(t);
  param.setValueAtTime(param.value, t);
  param.linearRampToValueAtTime(to, t + secs);
}

function musicTarget() {
  if (!enabled.music) return 0;
  return MUSIC_LEVEL * (ducked ? DUCK : 1);
}

// Brings up the next track on the free deck and fades the current one out under
// it, which covers both moving between tracks and looping one back to its start.
function crossTo(track, secs = CROSSFADE) {
  if (!ensure()) return;
  if (!decks.length) decks = [makeDeck(), makeDeck()];
  const cur = decks[deckI];
  const next = decks[deckI = (deckI + 1) % 2];

  next.track = track;
  if (next.el.src.indexOf(TRACKS[track]) === -1) next.el.src = BASE + TRACKS[track];
  next.el.currentTime = 0;
  next.el.loop = false;
  if (!next.src) next.el.volume = 0;
  next.gain.gain.value = 0;
  const started = next.el.play();
  if (started && started.catch) started.catch(() => {});

  ramp(next.gain.gain, 1, secs);
  if (!next.src) fadeElement(next, 1, secs);
  if (cur && cur.el.src) {
    ramp(cur.gain.gain, 0, secs);
    if (!cur.src) fadeElement(cur, 0, secs);
    const el = cur.el;
    setTimeout(() => { try { el.pause(); } catch (e) {} }, secs * 1000 + 120);
  }
  if (track !== 'menu') lastPlay = track;
  ramp(musicBus.gain, musicTarget(), 0.4);
  startWatchdog();
}

// createMediaElementSource is unavailable in a few embeds; there the element's
// own volume does the fade instead.
function fadeElement(deck, to, secs) {
  const from = deck.el.volume, t0 = performance.now();
  clearInterval(deck.fade);
  deck.fade = setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / (secs * 1000));
    try { deck.el.volume = Math.max(0, Math.min(1, from + (to - from) * k)); } catch (e) {}
    if (k >= 1) clearInterval(deck.fade);
  }, 50);
}

// Hands over before the file runs out, so a loop never exposes the gap that
// every mp3 has at its ends.
function startWatchdog() {
  clearInterval(watchdog);
  watchdog = setInterval(() => {
    const d = decks[deckI];
    if (!d || !d.el.duration || !isFinite(d.el.duration) || d.el.paused) return;
    if (d.el.duration - d.el.currentTime <= CROSSFADE) crossTo(nextTrack());
  }, 250);
}

function nextTrack() {
  if (scene === 'menu') return 'menu';
  return lastPlay === 'playA' ? 'playB' : 'playA';
}

function applyScene() {
  if (!enabled.music || !scene) return;
  if (!ensure()) return;
  const cur = decks[deckI];
  const want = scene === 'menu' ? 'menu' : (cur && cur.track && cur.track !== 'menu' ? cur.track : nextTrack());
  if (cur && cur.track === want && !cur.el.paused) { ramp(musicBus.gain, musicTarget(), 0.4); return; }
  crossTo(want, cur && cur.track ? CROSSFADE : 1.4);
}

// 'menu' and 'game' are places, not tracks: the music keeps running across level
// starts, deaths and wins, because restarting it every level is what makes a
// soundtrack feel cheap.
export function setScene(next) {
  scene = next;
  if (!next) { stopMusic(); return; }
  applyScene();
}

export function duck(on) {
  ducked = !!on;
  if (musicBus) ramp(musicBus.gain, musicTarget(), 0.35);
}

export function stopMusic() {
  clearInterval(watchdog); watchdog = null;
  if (musicBus) ramp(musicBus.gain, 0, 0.5);
  setTimeout(() => {
    for (const d of decks) { try { d.el.pause(); } catch (e) {} d.track = null; }
  }, 600);
}

// ---- settings --------------------------------------------------------------

export function setEnabled(opts) {
  enabled = { ...enabled, ...opts };
  if (sfxBus) sfxBus.gain.value = enabled.sound ? SFX_LEVEL : 0;
  if (!enabled.music) stopMusic();
  else if (scene) applyScene();
}

export function setHardMute(v) {
  hardMuted = !!v;
  if (master) ramp(master.gain, hardMuted ? 0 : 1, 0.12);
}

export function debug() {
  return {
    ctx: ctx ? ctx.state : 'none',
    sfxReady: buffers.size,
    scene,
    music: musicBus ? +musicBus.gain.value.toFixed(3) : 0,
    sfx: sfxBus ? +sfxBus.gain.value.toFixed(3) : 0,
    raw: { ctx, master, musicBus, sfxBus, decks },
  };
}
