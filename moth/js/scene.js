/* ════════════════════════════════════════════════════════════════════════
   MOTH · SCENE
   ────────────────────────────────────────────────────────────────────────
   Simulation + renderer. A single candle in a field of night; a moth with
   flutter physics; a graze band where risk is converted into light.

   Everything visual is procedural — no assets. Everything audible is
   synthesised — no samples. Every difficulty number is asked of
   ENGINE.director each frame, so no two players fly the same night.
   ════════════════════════════════════════════════════════════════════ */
'use strict';

window.SCENE = (() => {
  const E = window.ENGINE;
  const { clamp, lerp, rand } = E.utils;
  const TAU = Math.PI * 2;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── value noise (flicker, wander) ─────────────────────────────────── */
  const noiseTab = new Float32Array(512).map(() => Math.random() * 2 - 1);
  const vnoise = (x) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(noiseTab[i & 511], noiseTab[(i + 1) & 511], u);
  };

  /* ── audio: a tiny synthesiser ─────────────────────────────────────── */
  const AUDIO = {
    ctx: null, master: null, shimmer: null, muted: false,
    init() {
      if (this.ctx) return;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
        this._drone();
        this._shimmer();
      } catch (e) { this.ctx = null; }
    },
    setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.5; },
    _drone() {
      const c = this.ctx;
      const g = c.createGain(); g.gain.value = 0.03;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
      const o1 = c.createOscillator(); o1.frequency.value = 72;
      const o2 = c.createOscillator(); o2.frequency.value = 72.7;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.07;
      const lfoG = c.createGain(); lfoG.gain.value = 0.012;
      lfo.connect(lfoG); lfoG.connect(g.gain);
      o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.master);
      o1.start(); o2.start(); lfo.start();
    },
    _shimmer() {
      const c = this.ctx;
      const len = c.sampleRate * 2;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 2.2;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(bp); bp.connect(g); g.connect(this.master);
      src.start();
      this.shimmer = { g, bp };
    },
    setHeat(h) {
      if (!this.ctx || !this.shimmer) return;
      const t = this.ctx.currentTime;
      this.shimmer.g.gain.setTargetAtTime(h * 0.045, t, 0.1);
      this.shimmer.bp.frequency.setTargetAtTime(900 + h * 2800, t, 0.1);
    },
    _env(freq, type, dur, peak = 0.12, sweep = 0) {
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      const o = c.createOscillator(); o.type = type; o.frequency.value = freq;
      if (sweep) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + sweep), t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    },
    collect(mult) { this._env(430 + mult * 90 + rand(-14, 14), 'triangle', 0.16, 0.07, 120); },
    wisp()   { this._env(880, 'sine', 0.5, 0.1, 440); this._env(1320, 'sine', 0.7, 0.05, 660); },
    chime()  { this._env(660, 'sine', 1.4, 0.11, 0); this._env(1650, 'sine', 0.9, 0.04, 0); },
    warn()   { this._env(140, 'sawtooth', 0.4, 0.04, -60); },
    dash()   { this._env(300, 'sine', 0.12, 0.05, 260); },
    singe()  { this._env(220, 'square', 0.2, 0.06, -120); },
    death()  {
      this._env(180, 'sawtooth', 0.9, 0.14, -140);
      if (!this.ctx) return;
      const c = this.ctx, t = c.currentTime;
      const len = c.sampleRate * 0.4, buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const s = c.createBufferSource(); s.buffer = buf;
      const g = c.createGain(); g.gain.value = 0.12;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      s.connect(lp); lp.connect(g); g.connect(this.master); s.start(t);
    },
    flip() { this._env(950, 'triangle', 0.08, 0.05, -200); },
    dawn() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this._env(f, 'sine', 1.2, 0.08), i * 160)); },
  };

  /* ── canvas ────────────────────────────────────────────────────────── */
  let cv, cx, W, H, DPR, UNIT, CXx, CYy, coreR, grazeR;
  let grain = null, stars = [];

  const resize = () => {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    UNIT = Math.min(W, H);
    CXx = W / 2; CYy = H / 2 + UNIT * 0.02;
    coreR = Math.max(20, UNIT * 0.034);
    grazeR = coreR + UNIT * 0.165;
    stars = [];
    const n = Math.round((W * H) / 14000);
    for (let i = 0; i < n; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, r: rand(0.4, 1.3), p: Math.random() * TAU });
    }
  };

  const makeGrain = () => {
    grain = document.createElement('canvas');
    grain.width = grain.height = 224;
    const g = grain.getContext('2d');
    const img = g.createImageData(224, 224);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (Math.random() * 2 - 1) * 128;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 14;
    }
    g.putImageData(img, 0, 0);
  };

  /* pre-rendered glow sprites, keyed by colour+radius */
  const spriteCache = new Map();
  const glowSprite = (color, r) => {
    const key = color + r;
    let s = spriteCache.get(key);
    if (s) return s;
    s = document.createElement('canvas');
    const d = Math.ceil(r * 2);
    s.width = s.height = d;
    const g = s.getContext('2d');
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, color);
    gr.addColorStop(0.35, color + 'aa');
    gr.addColorStop(1, color + '00');
    g.fillStyle = gr; g.fillRect(0, 0, d, d);
    spriteCache.set(key, s);
    return s;
  };

  /* ── palette ───────────────────────────────────────────────────────── */
  let INK = E.inks[0];
  const applyInk = ink => {
    INK = ink;
    spriteCache.clear();
    const r = document.documentElement.style;
    r.setProperty('--bg', ink.bg); r.setProperty('--bg2', ink.bg2);
    r.setProperty('--paper', ink.paper); r.setProperty('--flame', ink.flame);
    r.setProperty('--hot', ink.hot); r.setProperty('--moon', ink.moon);
  };
  const flameColor = () => {
    if (!INK.iridescent) return INK.flame;
    const h = (perfNow() / 40) % 360;
    return `hsl(${h} 80% 68%)`;
  };
  const perfNow = () => performance.now();

  /* ── state ─────────────────────────────────────────────────────────── */
  const HOURS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const HOUR_LEN = 22;

  let mode = 'idle';            // idle | run | gate | dying | leaving | dawning
  let timeScale = 1, tGlobal = 0, shake = 0, flash = 0, flashCol = '#fff';
  let hooks = { onGate: () => {}, onRunEnd: () => {}, onHud: () => {}, onToast: () => {} };

  const moth = {
    x: 0, y: 0, vx: 0, vy: 0, heading: 0, flap: 0,
    heat: 0, invuln: 0, dashCd: 0, singeFx: 0,
  };
  let target = { x: 0, y: 0 };
  let motes = [], wisps = [], flares = [], cinders = [], parts = [];
  let run = null;
  let idleT = 0;

  const newRun = () => ({
    hour: 0, tIn: 0, pot: 0, motesN: 0,
    grazeSec: 0, deepSec: 0, bestMult: 1,
    grazeAccum: 0, deepAccum: 0, depthSamples: [], depthTimer: 0,
    hourGraze: 0,
    flareT: rand(2.5, 4), cinderT: rand(4, 7), moteT: 0,
    moteMult: 1, ftue: false, durMs: 0,
    goldenAt: -1, goldenDone: false,
    dyingT: 0, leaveT: 0, dawnT: 0, cause: null,
  });

  /* ── run control ───────────────────────────────────────────────────── */
  const startRun = () => {
    run = newRun();
    const S = E.save;
    run.ftue = S.flags.ftue;
    if (S.boons.moteBoost > 0) {
      S.boons.moteBoost--;
      run.moteMult = 1.25;
      hooks.onToast('Sweet nectar: motes worth +25% this flight.');
    }
    if (E.hooks.goldenPending()) {
      run.goldenAt = HOUR_LEN + rand(3, 8);   // arrives in hour II — one last spectacle
    }
    moth.x = CXx; moth.y = H - UNIT * 0.12;
    moth.vx = 0; moth.vy = -40; moth.heat = 0; moth.invuln = 1.2; moth.dashCd = 0;
    target.x = CXx; target.y = CYy + grazeR;
    motes = []; wisps = []; flares = []; cinders = []; parts = [];
    timeScale = 1; mode = 'run';
    E.save.totals.flights++;
    E.emit('run:start', {});
    E.emit('hour:reach', { hour: 1 });
  };

  const endRun = (opts) => {
    const S = E.save;
    const durSec = run.durMs / 1000;
    const hoursReached = run.hour + 1;
    const kept = opts.died ? Math.round(run.pot * 0.4)
               : opts.dawn ? Math.round(run.pot * 2)
               : run.pot;
    const grazeQuality = clamp(run.grazeSec / Math.max(20, durSec * 0.45), 0, 1);
    const perf = clamp(
      0.55 * (hoursReached / 4.5) +
      0.30 * grazeQuality +
      0.15 * (opts.dawn ? 1 : opts.home ? 0.7 : 0), 0, 1);

    const levelUps = E.econ.addLumen(kept, 'flight');
    E.econ.addXp(Math.round(25 * hoursReached));
    S.totals.deaths += opts.died ? 1 : 0;
    S.totals.dawns += opts.dawn ? 1 : 0;
    S.totals.grazeSec += Math.round(run.grazeSec);
    S.totals.motes += run.motesN;
    S.totals.playMs += run.durMs;
    S.best.pot = Math.max(S.best.pot, kept);
    S.best.hour = Math.max(S.best.hour, hoursReached);
    if (opts.dawn) S.flags.sawDawn = true;
    if (S.flags.ftue) S.flags.ftue = false;

    E.emit('death:cleanup', {});
    E.emit('run:end', { perf, died: !!opts.died, kept, hours: hoursReached });
    if (opts.dawn) E.hooks.ensureForecast();
    E.persist(true);

    mode = 'idle'; idleT = 0;
    hooks.onRunEnd({
      died: !!opts.died, dawn: !!opts.dawn, home: !!opts.home, cause: run.cause,
      hours: hoursReached, pot: run.pot, kept,
      motes: run.motesN, grazeSec: Math.round(run.grazeSec),
      bestMult: run.bestMult, perf, levelUps,
      cards: E.rewards.cardsEarned(hoursReached, !!opts.dawn),
    });
  };

  const die = cause => {
    if (mode !== 'run') return;
    run.cause = cause;
    mode = 'dying'; run.dyingT = 0;
    timeScale = 0.25;
    shake = REDUCED ? 0 : 16;
    flash = 0.7; flashCol = INK.hot;
    AUDIO.death();
    burst(moth.x, moth.y, 40, INK.hot, 3.2);
    burst(moth.x, moth.y, 24, INK.paper, 2.2);
    E.emit('death', { cause, hour: run.hour, tIntoHour: run.tIn });
  };

  const resolveGate = choice => {
    if (mode !== 'gate') return;
    E.emit('gate', { hour: run.hour + 1, choice, pot: run.pot });
    if (choice === 'home') {
      mode = 'leaving'; run.leaveT = 0; timeScale = 1;
    } else {
      run.hour++; run.tIn = 0; run.hourGraze = 0;
      mode = 'run'; timeScale = 1;
      E.emit('hour:reach', { hour: run.hour + 1 });
      hooks.onToast(`Hour ${HOURS[run.hour]}. The flame remembers you.`);
      AUDIO.chime();
    }
  };

  const dash = () => {
    if (mode !== 'run' || moth.dashCd > 0) return;
    const dx = target.x - moth.x, dy = target.y - moth.y;
    const d = Math.hypot(dx, dy) || 1;
    moth.vx += (dx / d) * 560; moth.vy += (dy / d) * 560;
    moth.invuln = Math.max(moth.invuln, 0.22);
    moth.dashCd = 1.6;
    AUDIO.dash();
    burst(moth.x, moth.y, 8, INK.paper, 1.4);
    E.emit('dash', {});
  };

  /* ── particles ─────────────────────────────────────────────────────── */
  const burst = (x, y, n, color, speed = 2) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = rand(20, 90) * speed;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.4, 1.1), t: 0, r: rand(1, 3), color });
    }
    if (parts.length > 420) parts.splice(0, parts.length - 420);
  };

  /* ── update ────────────────────────────────────────────────────────── */
  const update = dt => {
    tGlobal += dt;
    const sdt = dt * timeScale;

    if (mode === 'idle') { updateIdle(dt); return; }
    if (!run) return;
    run.durMs += dt * 1000;

    if (mode === 'dying') {
      run.dyingT += dt;
      timeScale = lerp(timeScale, 0.9, dt * 2);
      updateParticles(sdt);
      if (run.dyingT > 1.5) endRun({ died: true });
      return;
    }
    if (mode === 'leaving') {
      run.leaveT += dt;
      moth.vy -= 500 * dt; moth.x += moth.vx * dt; moth.y += moth.vy * dt;
      moth.flap += dt * 30;
      updateParticles(sdt);
      if (run.leaveT > 0.9) endRun({ home: true });
      return;
    }
    if (mode === 'dawning') {
      run.dawnT += dt;
      updateParticles(sdt);
      if (Math.random() < 0.3) burst(rand(0, W), rand(0, H * 0.5), 2, INK.flame, 0.8);
      if (run.dawnT > 2.4) endRun({ dawn: true });
      return;
    }

    /* gate: the world holds its breath */
    if (mode === 'gate') {
      timeScale = lerp(timeScale, 0.1, dt * 6);
      updateFlight(sdt, dt);
      updateField(sdt);
      updateParticles(sdt);
      return;
    }

    /* ordinary flight */
    timeScale = lerp(timeScale, 1, dt * 4);
    run.tIn += sdt;

    updateFlight(sdt, dt);
    updateField(sdt);
    updateSpawns(sdt);
    updateHeat(sdt);
    updateParticles(sdt);

    /* hour boundary */
    if (run.tIn >= HOUR_LEN) {
      E.emit('hour:safe', { hour: run.hour + 1, grazeFrac: run.hourGraze / HOUR_LEN });
      if (run.hour >= 5) {
        mode = 'dawning'; run.dawnT = 0; AUDIO.dawn();
        E.emit('hour:reach', { hour: 6 });
      } else {
        mode = 'gate';
        AUDIO.chime();
        hooks.onGate({
          hour: run.hour + 1, nextHour: HOURS[run.hour + 1], pot: run.pot,
          odds: 1 - E.model.deathP(run.hour + 1),
        });
      }
    }

    hooks.onHud({
      hour: HOURS[run.hour], hourFrac: run.tIn / HOUR_LEN,
      pot: run.pot, mult: 1 + moth.heat * 4, heat: moth.heat,
      dashCd: clamp(moth.dashCd / 1.6, 0, 1),
    });
  };

  const updateIdle = dt => {
    idleT += dt;
    // the title-screen moth: unhurried, hypnotic
    const a = idleT * 0.35;
    target.x = CXx + Math.cos(a) * grazeR * 1.15;
    target.y = CYy + Math.sin(a * 1.7) * grazeR * 0.8;
    updateFlight(dt, dt, 0.5);
    updateParticles(dt);
  };

  const updateFlight = (sdt, dt, damp = 1) => {
    // steering: pursuit with flutter — a moth, not a cursor
    const k = 3.4 * damp;
    const dx = target.x - moth.x, dy = target.y - moth.y;
    const desiredX = dx * k, desiredY = dy * k;
    const blend = 1 - Math.exp(-sdt * 3.2);
    moth.vx += (desiredX - moth.vx) * blend;
    moth.vy += (desiredY - moth.vy) * blend;
    // wander: perpendicular jitter from value noise
    const wob = vnoise(tGlobal * 3.1) * 46;
    const sp = Math.hypot(moth.vx, moth.vy) || 1;
    moth.vx += (-moth.vy / sp) * wob * sdt * 3;
    moth.vy += (moth.vx / sp) * wob * sdt * 3;
    const max = 460;
    if (sp > max) { moth.vx *= max / sp; moth.vy *= max / sp; }
    moth.x += moth.vx * sdt; moth.y += moth.vy * sdt;
    moth.x = clamp(moth.x, 8, W - 8); moth.y = clamp(moth.y, 8, H - 8);
    moth.heading = Math.atan2(moth.vy, moth.vx);
    moth.flap += sdt * (14 + sp / 30);
    moth.invuln = Math.max(0, moth.invuln - dt);
    moth.dashCd = Math.max(0, moth.dashCd - dt);
    moth.singeFx = Math.max(0, moth.singeFx - dt);

    // trail
    if (mode !== 'idle' || Math.random() < 0.5) {
      const trail = E.save.trails.active;
      const col = trail === 'ember' ? INK.hot
                : trail === 'silk' ? INK.moon
                : trail === 'prism' ? `hsl(${(tGlobal * 120) % 360} 70% 70%)`
                : INK.paper;
      parts.push({ x: moth.x - Math.cos(moth.heading) * 6, y: moth.y - Math.sin(moth.heading) * 6,
        vx: rand(-8, 8), vy: rand(-2, 12), life: trail === 'silk' ? 1.4 : 0.7, t: 0, r: rand(0.6, 1.8), color: col });
    }
  };

  const updateHeat = sdt => {
    const d = Math.hypot(moth.x - CXx, moth.y - CYy);
    const flick = 1 + vnoise(tGlobal * 7) * 0.12;
    const inner = coreR * flick;

    // burn?
    if (d < inner + 4 && moth.invuln <= 0) { die('flame'); return; }

    // graze band
    const bandIn = coreR + 8, bandOut = grazeR;
    if (d < bandOut && d > bandIn - 4) {
      const closeness = clamp(1 - (d - bandIn) / (bandOut - bandIn), 0, 1);
      moth.heat = clamp(moth.heat + (0.12 + Math.pow(closeness, 1.2)) * 0.62 * sdt, 0, 1);
      run.grazeSec += sdt; run.hourGraze += sdt;
      run.grazeAccum += sdt;
      if (run.grazeAccum >= 1) { E.emit('graze:tick', { sec: 1 }); run.grazeAccum -= 1; }
      run.depthSamples.push(closeness);
      const mult = 1 + moth.heat * 4;
      if (mult >= 3) {
        run.deepSec += sdt; run.deepAccum += sdt;
        if (run.deepAccum >= 1) { E.emit('deep:tick', { sec: 1 }); run.deepAccum -= 1; }
      }
      run.bestMult = Math.max(run.bestMult, mult);
    } else {
      moth.heat = clamp(moth.heat - 0.22 * sdt, 0, 1);
    }
    run.depthTimer += sdt;
    if (run.depthTimer > 2 && run.depthSamples.length) {
      const avg = run.depthSamples.reduce((a, b) => a + b, 0) / run.depthSamples.length;
      E.emit('graze:depth', { depth: avg });
      run.depthSamples = []; run.depthTimer = 0;
    }
    AUDIO.setHeat(moth.heat);
  };

  const updateSpawns = sdt => {
    const P = E.director.frame(run.hour, run.tIn, HOUR_LEN);
    const ftueScale = run.ftue ? 2.2 : 1;

    // motes: born in the outer dark, drawn inward — like everything else
    // here — to be eaten by the flame unless the moth intercepts first
    run.moteT -= sdt;
    if (run.moteT <= 0 && motes.length < 110) {
      run.moteT = P.motePeriod;
      const bias = P.moteBias;
      const rr = grazeR + rand(20, UNIT * 0.34);
      const aa = Math.random() * TAU;
      motes.push({
        x: CXx + Math.cos(aa) * rr, y: CYy + Math.sin(aa) * rr,
        a: aa, r: rr, drift: rand(-0.12, 0.12), bob: Math.random() * TAU,
        fall: rand(14, 26) * (0.8 + bias * 0.5),   // inward pull, px/s
        ttl: 30, t: 0,
      });
    }

    // flares: telegraphed tongues of flame
    if (run.hour > 0 || !run.ftue) {
      run.flareT -= sdt;
      if (run.flareT <= 0) {
        run.flareT = P.flarePeriod * ftueScale * rand(0.75, 1.3);
        // aim near the moth often enough to matter — the flame is watching
        const toMoth = Math.atan2(moth.y - CYy, moth.x - CXx);
        const ang = Math.random() < 0.55 ? toMoth + rand(-0.5, 0.5) : Math.random() * TAU;
        flares.push({ ang, warn: P.flareWarn, t: 0, phase: 'warn',
          maxL: grazeR * lerp(1.1, 2.1, P.flareLen), L: 0, width: coreR * 0.55 });
        AUDIO.warn();
      }
    }

    // cinders: slow hazards that cross the field
    if (run.hour > 0 || !run.ftue) {
      run.cinderT -= sdt;
      if (run.cinderT <= 0 && cinders.length < 7) {
        run.cinderT = P.cinderPeriod * ftueScale * rand(0.8, 1.25);
        const edge = Math.floor(Math.random() * 4);
        const c = { x: 0, y: 0, vx: 0, vy: 0, wob: Math.random() * TAU, r: rand(6, 9) };
        if (edge === 0) { c.x = -20; c.y = rand(0, H); } else if (edge === 1) { c.x = W + 20; c.y = rand(0, H); }
        else if (edge === 2) { c.x = rand(0, W); c.y = -20; } else { c.x = rand(0, W); c.y = H + 20; }
        const aimX = CXx + rand(-W * 0.25, W * 0.25), aimY = CYy + rand(-H * 0.25, H * 0.25);
        const d = Math.hypot(aimX - c.x, aimY - c.y) || 1;
        c.vx = (aimX - c.x) / d * P.cinderSpeed; c.vy = (aimY - c.y) / d * P.cinderSpeed;
        cinders.push(c);
      }
    }

    // wisps: rare, radiant, worth chasing
    if (Math.random() < P.wispChance * sdt / HOUR_LEN * 8 && wisps.length < 2) {
      wisps.push({ t: 0, ttl: rand(7, 10), phase: Math.random() * TAU, golden: false });
    }
    // the golden wisp — the engine's scheduled spectacle
    if (run.goldenAt > 0 && !run.goldenDone) {
      const elapsed = run.hour * HOUR_LEN + run.tIn;
      if (elapsed >= run.goldenAt) {
        run.goldenDone = true;
        E.hooks.consumeGolden();
        wisps.push({ t: 0, ttl: 14, phase: Math.random() * TAU, golden: true });
        hooks.onToast('A golden wisp has wandered in.');
        AUDIO.wisp();
      }
    }
  };

  const updateField = sdt => {
    /* motes */
    for (let i = motes.length - 1; i >= 0; i--) {
      const m = motes[i];
      m.t += sdt; m.a += m.drift * sdt * 0.3; m.bob += sdt * 2;
      m.r -= (m.fall || 16) * sdt;               // the flame calls them home
      m.x = CXx + Math.cos(m.a) * m.r + Math.sin(m.bob) * 4;
      m.y = CYy + Math.sin(m.a) * m.r + Math.cos(m.bob * 0.8) * 4;
      if (m.r < coreR + 10) {                    // eaten — a small loss, witnessed
        motes.splice(i, 1);
        burst(m.x, m.y, 2, INK.hot, 0.5);
        continue;
      }
      if (m.t > m.ttl) { motes.splice(i, 1); continue; }
      if (mode === 'run' && Math.hypot(m.x - moth.x, m.y - moth.y) < 20) {
        motes.splice(i, 1);
        const mult = 1 + moth.heat * 4;
        const gain = Math.round(3 * mult * run.moteMult);
        run.pot += gain; run.motesN++;
        E.emit('mote', { value: gain });
        AUDIO.collect(mult);
        burst(m.x, m.y, 3, INK.flame, 0.8);
      }
    }
    /* wisps: lissajous drift */
    for (let i = wisps.length - 1; i >= 0; i--) {
      const w = wisps[i];
      w.t += sdt;
      w.x = CXx + Math.cos(w.t * 0.55 + w.phase) * UNIT * 0.34;
      w.y = CYy + Math.sin(w.t * 0.82 + w.phase) * UNIT * 0.26;
      if (w.t > w.ttl) { wisps.splice(i, 1); continue; }
      if (mode === 'run' && Math.hypot(w.x - moth.x, w.y - moth.y) < 22) {
        wisps.splice(i, 1);
        const mult = Math.max(1 + moth.heat * 4, w.golden ? 2 : 1.5);
        const gain = Math.round((w.golden ? 260 : 40) * mult * run.moteMult);
        run.pot += gain;
        E.emit('wisp', { golden: w.golden, value: gain });
        AUDIO.wisp();
        burst(w.x, w.y, w.golden ? 46 : 18, w.golden ? '#ffd76a' : INK.moon, 1.6);
        hooks.onToast(w.golden ? `The golden wisp! +${gain}` : `A wisp — +${gain}`);
        if (!REDUCED) { timeScale = 0.4; }
      }
    }
    /* flares */
    for (let i = flares.length - 1; i >= 0; i--) {
      const f = flares[i];
      f.t += sdt;
      if (f.phase === 'warn' && f.t >= f.warn) { f.phase = 'strike'; f.t = 0; }
      else if (f.phase === 'strike') {
        f.L = f.t < 0.16 ? lerp(0, f.maxL, f.t / 0.16) : f.t < 0.42 ? f.maxL : lerp(f.maxL, 0, (f.t - 0.42) / 0.14);
        if (f.t >= 0.56) { flares.splice(i, 1); continue; }
        // collision: point vs tongue segment
        if (mode === 'run' && moth.invuln <= 0 && f.L > 12) {
          const bx = CXx + Math.cos(f.ang) * coreR, by = CYy + Math.sin(f.ang) * coreR;
          const ex = CXx + Math.cos(f.ang) * (coreR + f.L), ey = CYy + Math.sin(f.ang) * (coreR + f.L);
          const px = moth.x - bx, py = moth.y - by, sx = ex - bx, sy = ey - by;
          const len2 = sx * sx + sy * sy || 1;
          const tt = clamp((px * sx + py * sy) / len2, 0, 1);
          const ddx = px - sx * tt, ddy = py - sy * tt;
          const width = f.width * (1 - tt * 0.6);
          if (ddx * ddx + ddy * ddy < (width + 6) * (width + 6)) { die('flare'); return; }
        }
      }
    }
    /* cinders */
    for (let i = cinders.length - 1; i >= 0; i--) {
      const c = cinders[i];
      c.wob += sdt * 2;
      c.x += (c.vx + Math.sin(c.wob) * 14) * sdt;
      c.y += (c.vy + Math.cos(c.wob * 0.7) * 14) * sdt;
      if (Math.random() < sdt * 8) parts.push({ x: c.x, y: c.y, vx: rand(-6, 6), vy: rand(-18, -4), life: 0.9, t: 0, r: rand(1, 2.4), color: '#55504a' });
      if (c.x < -60 || c.x > W + 60 || c.y < -60 || c.y > H + 60) { cinders.splice(i, 1); continue; }
      if (mode === 'run' && moth.invuln <= 0 && Math.hypot(c.x - moth.x, c.y - moth.y) < c.r + 7) {
        cinders.splice(i, 1);
        // singe: not death — loss you can watch scatter, then chase
        const scatter = Math.round(run.pot * 0.2);
        run.pot -= scatter;
        const back = Math.min(12, Math.max(3, Math.round(scatter / 4)));
        for (let j = 0; j < back; j++) {
          const aa = Math.random() * TAU, rr2 = Math.hypot(moth.x - CXx, moth.y - CYy);
          motes.push({ x: moth.x, y: moth.y, a: Math.atan2(moth.y - CYy, moth.x - CXx) + rand(-0.6, 0.6),
            r: clamp(rr2 + rand(-40, 60), coreR + 30, UNIT * 0.46), drift: rand(-0.2, 0.2), bob: aa, ttl: 7, t: 0 });
        }
        moth.heat = 0; moth.invuln = 1; moth.singeFx = 0.8;
        shake = REDUCED ? 0 : 9; flash = 0.25; flashCol = '#3a352e';
        AUDIO.singe();
        hooks.onToast(scatter > 0 ? `Singed — ${scatter} lumen shaken loose.` : 'Singed.');
        E.emit('singe', { lost: scatter });
      }
    }
  };

  const updateParticles = sdt => {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += sdt; p.x += p.vx * sdt; p.y += p.vy * sdt; p.vy += 10 * sdt;
      if (p.t > p.life) parts.splice(i, 1);
    }
  };

  /* ── render ────────────────────────────────────────────────────────── */
  const render = () => {
    const flick = 1 + vnoise(tGlobal * 7) * 0.12;
    const heatGlow = mode === 'run' || mode === 'gate' ? moth.heat : 0;

    cx.save();
    if (shake > 0.2) {
      cx.translate(rand(-shake, shake), rand(-shake, shake));
      shake *= 0.86;
    }

    /* sky */
    const dawning = mode === 'dawning' ? clamp(run.dawnT / 2.4, 0, 1) : 0;
    const g = cx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, dawning ? mix(INK.bg, '#e8d9b8', dawning) : INK.bg);
    g.addColorStop(1, dawning ? mix(INK.bg2, '#f0e4c8', dawning) : INK.bg2);
    cx.fillStyle = g;
    cx.fillRect(-20, -20, W + 40, H + 40);

    /* stars */
    cx.fillStyle = INK.paper;
    for (const s of stars) {
      const tw = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(tGlobal * 0.8 + s.p));
      cx.globalAlpha = tw * (1 - dawning);
      cx.fillRect(s.x, s.y, s.r, s.r);
    }
    cx.globalAlpha = 1;

    /* ambient light around the flame */
    const halo = glowSprite(flameColor(), grazeR * 2.2);
    cx.globalAlpha = 0.16 + heatGlow * 0.1 + vnoise(tGlobal * 5) * 0.02;
    cx.drawImage(halo, CXx - grazeR * 2.2, CYy - grazeR * 2.2, grazeR * 4.4, grazeR * 4.4);
    cx.globalAlpha = 1;

    drawPlate(heatGlow);
    drawMotes();
    drawFlares(flick);
    drawCinders();
    drawFlame(flick);
    if (mode !== 'idle' || true) drawMoth();
    drawParticles();

    cx.restore();

    /* flash */
    if (flash > 0.01) {
      cx.globalAlpha = flash;
      cx.fillStyle = flashCol;
      cx.fillRect(0, 0, W, H);
      cx.globalAlpha = 1;
      flash *= 0.86;
    }

    /* vignette */
    const v = cx.createRadialGradient(CXx, CYy, UNIT * 0.3, CXx, CYy, UNIT * 0.95);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.42)');
    cx.fillStyle = v;
    cx.fillRect(0, 0, W, H);

    /* grain */
    if (grain) {
      cx.globalAlpha = 0.5;
      for (let x = 0; x < W; x += 224) for (let y = 0; y < H; y += 224) cx.drawImage(grain, x, y);
      cx.globalAlpha = 1;
    }
  };

  /* the specimen-plate diagram: the play field annotated like a figure */
  const drawPlate = heatGlow => {
    cx.strokeStyle = INK.paper;
    cx.globalAlpha = 0.16 + heatGlow * 0.22;
    cx.setLineDash([2, 7]);
    cx.lineWidth = 1;
    cx.beginPath(); cx.arc(CXx, CYy, grazeR, 0, TAU); cx.stroke();
    cx.setLineDash([]);
    // cardinal ticks
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      cx.beginPath();
      cx.moveTo(CXx + Math.cos(a) * (grazeR - 5), CYy + Math.sin(a) * (grazeR - 5));
      cx.lineTo(CXx + Math.cos(a) * (grazeR + 5), CYy + Math.sin(a) * (grazeR + 5));
      cx.stroke();
    }
    // hour progress arc, drawn like a fine instrument
    if (run && (mode === 'run' || mode === 'gate')) {
      cx.globalAlpha = 0.4;
      cx.lineWidth = 1.5;
      cx.beginPath();
      cx.arc(CXx, CYy, grazeR + 12, -Math.PI / 2, -Math.PI / 2 + TAU * (run.tIn / HOUR_LEN));
      cx.stroke();
    }
    // figure label
    cx.globalAlpha = 0.34;
    cx.fillStyle = INK.paper;
    cx.font = `italic 12px Georgia, 'Times New Roman', serif`;
    cx.textAlign = 'center';
    cx.fillText('fig. 1 — the graze', CXx, CYy + grazeR + 30);
    cx.globalAlpha = 1;
  };

  const drawFlame = flick => {
    const fc = flameColor();
    // hanging cord + housing: the lamp as an object, not an effect
    cx.strokeStyle = INK.paper;
    cx.globalAlpha = 0.25;
    cx.lineWidth = 1;
    cx.beginPath(); cx.moveTo(CXx, 0); cx.lineTo(CXx, CYy - coreR * 2.4); cx.stroke();
    cx.globalAlpha = 0.55;
    cx.fillStyle = INK.paper;
    cx.fillRect(CXx - 4, CYy - coreR * 2.4, 8, 5);
    cx.globalAlpha = 1;

    // glow layers
    const mid = glowSprite(fc, coreR * 3);
    cx.globalAlpha = 0.5 + vnoise(tGlobal * 9 + 40) * 0.08;
    cx.drawImage(mid, CXx - coreR * 3, CYy - coreR * 3, coreR * 6, coreR * 6);
    cx.globalAlpha = 1;

    // teardrop flame body
    const hR = coreR * flick;
    const sway = vnoise(tGlobal * 4.4) * hR * 0.3;
    cx.save();
    cx.translate(CXx, CYy);
    const grd = cx.createRadialGradient(0, 0, 1, 0, 0, hR * 1.5);
    grd.addColorStop(0, '#fffbe9');
    grd.addColorStop(0.35, fc);
    grd.addColorStop(1, INK.hot + '00');
    cx.fillStyle = grd;
    cx.beginPath();
    cx.moveTo(0, -hR * 1.9 + sway * 0.3);
    cx.bezierCurveTo(hR * 0.9 + sway, -hR * 0.8, hR * 0.85, hR * 0.6, 0, hR * 0.95);
    cx.bezierCurveTo(-hR * 0.85, hR * 0.6, -hR * 0.9 + sway, -hR * 0.8, 0, -hR * 1.9 + sway * 0.3);
    cx.fill();
    // white-hot core
    cx.fillStyle = '#fff8e0';
    cx.globalAlpha = 0.9;
    cx.beginPath();
    cx.ellipse(0, hR * 0.1, hR * 0.32, hR * 0.55, 0, 0, TAU);
    cx.fill();
    cx.restore();
    cx.globalAlpha = 1;

    // rising embers
    if (Math.random() < 0.35) {
      parts.push({ x: CXx + rand(-4, 4), y: CYy - coreR, vx: rand(-8, 8), vy: rand(-46, -20), life: rand(0.6, 1.4), t: 0, r: rand(0.7, 1.8), color: fc });
    }
  };

  const drawMotes = () => {
    for (const m of motes) {
      const fade = Math.min(1, m.t * 2, (m.ttl - m.t));
      const spr = glowSprite(INK.flame, 7);
      cx.globalAlpha = clamp(fade, 0, 1) * 0.9;
      cx.drawImage(spr, m.x - 7, m.y - 7, 14, 14);
    }
    cx.globalAlpha = 1;
    for (const w of wisps) {
      const col = w.golden ? '#ffd76a' : INK.moon;
      const pulse = 14 + Math.sin(w.t * 6) * 3 + (w.golden ? 8 : 0);
      const spr = glowSprite(col, pulse * 2);
      cx.globalAlpha = 0.9;
      cx.drawImage(spr, w.x - pulse * 2, w.y - pulse * 2, pulse * 4, pulse * 4);
      cx.globalAlpha = 1;
      if (Math.random() < 0.4) parts.push({ x: w.x, y: w.y, vx: rand(-14, 14), vy: rand(-14, 14), life: 0.7, t: 0, r: 1.2, color: col });
    }
  };

  const drawFlares = () => {
    for (const f of flares) {
      const bx = CXx + Math.cos(f.ang) * coreR, by = CYy + Math.sin(f.ang) * coreR;
      if (f.phase === 'warn') {
        const p = f.t / f.warn;
        cx.strokeStyle = INK.hot;
        cx.globalAlpha = 0.25 + p * 0.5;
        cx.setLineDash([3, 6]);
        cx.lineWidth = 1 + p * 2;
        cx.beginPath();
        cx.moveTo(bx, by);
        cx.lineTo(CXx + Math.cos(f.ang) * (coreR + f.maxL), CYy + Math.sin(f.ang) * (coreR + f.maxL));
        cx.stroke();
        cx.setLineDash([]);
      } else {
        const ex = CXx + Math.cos(f.ang) * (coreR + f.L), ey = CYy + Math.sin(f.ang) * (coreR + f.L);
        const grd = cx.createLinearGradient(bx, by, ex, ey);
        grd.addColorStop(0, '#fff8e0');
        grd.addColorStop(0.3, flameColor());
        grd.addColorStop(1, INK.hot + '00');
        cx.strokeStyle = grd;
        cx.globalAlpha = 0.95;
        cx.lineCap = 'round';
        cx.lineWidth = f.width * 1.6;
        cx.beginPath(); cx.moveTo(bx, by); cx.lineTo(ex, ey); cx.stroke();
        cx.lineWidth = f.width * 0.7;
        cx.strokeStyle = '#fff8e0';
        cx.globalAlpha = 0.7;
        cx.beginPath(); cx.moveTo(bx, by); cx.lineTo(lerp(bx, ex, 0.7), lerp(by, ey, 0.7)); cx.stroke();
      }
    }
    cx.globalAlpha = 1;
  };

  const drawCinders = () => {
    for (const c of cinders) {
      const spr = glowSprite('#e04f1f', c.r * 2.4);
      cx.globalAlpha = 0.8;
      cx.drawImage(spr, c.x - c.r * 2.4, c.y - c.r * 2.4, c.r * 4.8, c.r * 4.8);
      cx.globalAlpha = 1;
      cx.fillStyle = '#2a201a';
      cx.beginPath(); cx.arc(c.x, c.y, c.r * 0.7, 0, TAU); cx.fill();
    }
  };

  const drawMoth = () => {
    if (mode === 'dying' && run && run.dyingT > 0.35) return; // consumed
    const charred = mode === 'dying';
    const singed = moth.singeFx > 0;
    const body = charred ? '#3a3028' : singed ? mix(INK.paper, '#3a3028', moth.singeFx) : INK.paper;
    const flap = Math.sin(moth.flap);
    const s = UNIT * 0.011; // moth scale

    cx.save();
    cx.translate(moth.x, moth.y);
    cx.rotate(moth.heading + Math.PI / 2);
    if (moth.invuln > 0 && mode === 'run') cx.globalAlpha = 0.55 + Math.sin(tGlobal * 30) * 0.25;

    // soft self-glow when hot
    if (moth.heat > 0.15) {
      const spr = glowSprite(INK.flame, s * 4);
      cx.globalAlpha = (cx.globalAlpha || 1) * moth.heat * 0.5;
      cx.drawImage(spr, -s * 4, -s * 4, s * 8, s * 8);
      cx.globalAlpha = moth.invuln > 0 ? 0.7 : 1;
    }

    cx.fillStyle = body;
    const wy = flap * s * 0.9;
    // upper wing pair
    for (const side of [-1, 1]) {
      cx.beginPath();
      cx.moveTo(0, -s * 0.4);
      cx.bezierCurveTo(side * s * 2.6, -s * 2.2 + wy, side * s * 3.4, wy * 0.6, side * s * 0.9, s * 0.5);
      cx.closePath();
      cx.fill();
      // lower wing pair
      cx.beginPath();
      cx.moveTo(0, s * 0.3);
      cx.bezierCurveTo(side * s * 2.2, s * 0.8 + wy * 0.7, side * s * 1.6, s * 2.4 + wy * 0.5, side * s * 0.3, s * 1.2);
      cx.closePath();
      cx.fill();
    }
    // wing spots — the specimen's signature
    cx.fillStyle = INK.bg;
    cx.globalAlpha *= 0.55;
    cx.beginPath(); cx.arc(-s * 1.5, -s * 0.7 + wy * 0.5, s * 0.38, 0, TAU); cx.fill();
    cx.beginPath(); cx.arc(s * 1.5, -s * 0.7 + wy * 0.5, s * 0.38, 0, TAU); cx.fill();
    cx.globalAlpha = moth.invuln > 0 && mode === 'run' ? 0.7 : 1;
    // body
    cx.fillStyle = body;
    cx.beginPath(); cx.ellipse(0, 0, s * 0.5, s * 1.5, 0, 0, TAU); cx.fill();
    // antennae
    cx.strokeStyle = body; cx.lineWidth = 1;
    cx.beginPath(); cx.moveTo(0, -s * 1.4); cx.lineTo(-s * 0.8, -s * 2.3); cx.stroke();
    cx.beginPath(); cx.moveTo(0, -s * 1.4); cx.lineTo(s * 0.8, -s * 2.3); cx.stroke();
    cx.restore();
    cx.globalAlpha = 1;
  };

  const drawParticles = () => {
    for (const p of parts) {
      const a = 1 - p.t / p.life;
      cx.globalAlpha = a * 0.85;
      cx.fillStyle = p.color;
      cx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
    }
    cx.globalAlpha = 1;
  };

  /* colour mix helper (hex → hex) */
  const mix = (h1, h2, t) => {
    const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const a = p(h1), b = p(h2);
    return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
  };

  /* ── main loop ─────────────────────────────────────────────────────── */
  let last = 0, paused = false, rafId = 0;
  const loop = t => {
    rafId = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    if (paused) return;
    update(dt);
    render();
  };

  /* ── input ─────────────────────────────────────────────────────────── */
  const bindInput = () => {
    const setTarget = e => { target.x = e.clientX; target.y = e.clientY; };
    window.addEventListener('pointermove', setTarget, { passive: true });
    window.addEventListener('pointerdown', e => {
      AUDIO.init();
      if (e.target.closest('.ui-block')) return;   // clicks on UI don't dash
      setTarget(e);
      dash();
    });
    window.addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); dash(); }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && mode === 'run') paused = true;
    });
  };

  /* ── public ────────────────────────────────────────────────────────── */
  return {
    init(canvas) {
      cv = canvas; cx = cv.getContext('2d');
      resize(); makeGrain(); bindInput();
      applyInk(E.inks.find(i => i.id === E.save.inks.active) || E.inks[0]);
      window.addEventListener('resize', resize);
      moth.x = CXx + grazeR; moth.y = CYy;
      requestAnimationFrame(t => { last = t; loop(t); });
    },
    hooks,
    startRun, resolveGate,
    applyInkById(id) { applyInk(E.inks.find(i => i.id === id) || E.inks[0]); },
    setPaused(p) { paused = p; if (!p) last = performance.now(); },
    isPaused: () => paused,
    audio: AUDIO,
    mode: () => mode,
  };
})();
