// =====================================================================
//  director.js — the adaptive brain (v4).
//
//  Goal: maximise P(player starts one more level).
//
//  PLAYER MODEL (each 0..1 unless noted):
//    skill        — ELO rating (number), how likely they win
//    frustration  — "too hard / unfair", near-quit-from-pain
//    boredom       — "too easy / same-y", near-quit-from-tedium (OPPOSITE of frustration)
//    excitement   — near-misses, close wins, secrets — keeps people despite risk
//    curiosity    — appetite for new things (decays with sameness)
//    fatigue       — focus vs grinding
//
//  CHURN is a Bayesian-ish belief: a leave-probability WITH a CONFIDENCE
//  that grows as evidence accumulates. Risk has emotional inertia (it
//  decays gradually, not in jumps). A psychological STATE MACHINE
//  (exploring→learning→flow→challenged→frustrated→recovering→bored→
//  mastery→leaving) keeps transitions smooth. Frustration and boredom get
//  OPPOSITE treatments. Interventions are scored by whether risk actually
//  fell afterwards, so the director learns what works for THIS player.
//
//  Maze SIZE is a separate learned preference from difficulty.
//  A player-facing difficulty dial biases the whole band.
// =====================================================================
import { DIRECTOR, SIZE_ORDER, DIFFICULTY_PRESETS } from './config.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const c01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class Director {
  constructor(saved, onSave) {
    this.onSave = onSave || (() => {});
    this.skill = saved?.skill ?? DIRECTOR.startSkill;
    this.history = saved?.history ?? [];
    this.frustration = saved?.frustration ?? 0.25;
    this.boredom = saved?.boredom ?? 0.2;
    this.curiosity = saved?.curiosity ?? 0.8;
    this.excitement = 0.3;
    this.fatigue = 0;
    this.arch = saved?.arch ?? { explorer: 1, speedrunner: 1, competitor: 1, collector: 1, survivor: 1 };
    // cross-session memory
    this.baselineDeaths = saved?.baselineDeaths ?? 1.5;     // this player's "normal" deaths/level
    this.sizeStats = saved?.sizeStats ?? Object.fromEntries(SIZE_ORDER.map(s => [s, { n: 0, sat: 0.5 }]));
    this.interv = saved?.interv ?? {};                       // intervention -> {n, delta}
    this.preset = saved?.preset ?? 'normal';
    this.sessions = (saved?.sessions ?? 0) + 1;

    // live belief
    this.risk = 25; this.riskSmoothed = 25; this.confidence = 0.1;
    this.modelTrust = saved?.modelTrust ?? 0.6;
    this.state = 'exploring';
    this.momentum = 0; this.riskHist = [];
    this.sessionLevels = 0; this.events = 0; this.levelsSinceNovel = 0;
    this._lastIntervention = null; this._riskBeforeInterv = null;
    this._lastSize = 'medium'; this._exploringSize = null;
    this.session = {
      winStreak: 0, loseStreak: 0, deathStreak: 0, retries: 0, lastDeathSpot: null,
      repeatedSpot: 0, idle: false, paused: false, tabBlur: false, quickDeath: false,
      lastDeathAt: null, retrySpeed: 3, deathsThisLevel: 0, levelStartMs: 0, slowPlay: false,
    };
  }

  serialize() {
    return { skill: this.skill, history: this.history.slice(-50), frustration: this.frustration, boredom: this.boredom,
      curiosity: this.curiosity, arch: this.arch, baselineDeaths: this.baselineDeaths, sizeStats: this.sizeStats,
      interv: this.interv, preset: this.preset, sessions: this.sessions, modelTrust: this.modelTrust };
  }
  _save() { this.onSave(this.serialize()); }

  // ---- difficulty dial ----
  setDifficulty(preset) { if (DIFFICULTY_PRESETS[preset]) { this.preset = preset; this._save(); } }
  _bias() { return (DIFFICULTY_PRESETS[this.preset] || DIFFICULTY_PRESETS.normal).bias; }
  _k() { return (DIFFICULTY_PRESETS[this.preset] || DIFFICULTY_PRESETS.normal).k; }

  expected(d) { return 1 / (1 + Math.pow(10, (d - this.skill) / 400)); }
  estWinProb(d) { return Math.round(this.expected(d) * 100); }
  meters() { return { skill01: c01((this.skill - DIRECTOR.diffMin) / (DIRECTOR.diffMax - DIRECTOR.diffMin)), frustration: c01(this.frustration), boredom: c01(this.boredom), excitement: c01(this.excitement), curiosity: c01(this.curiosity), fatigue: c01(this.fatigue), momentum: Math.round(this.momentum) }; }
  archetype() { let best = 'explorer', v = -1; for (const k in this.arch) if (this.arch[k] > v) { v = this.arch[k]; best = k; } return best; }

  // ---- signals ----
  noteLevelStart() { this.session.levelStartMs = now(); this.session.idle = false; this.session.paused = false; this.session.quickDeath = false; this.session.slowPlay = false; this.session.deathsThisLevel = 0; this.sessionLevels++; this.levelsSinceNovel++; this.fatigue = c01(this.fatigue + 0.04); this.events++; }
  noteMove() { this.session.idle = false; this._mom(+1); }
  noteCoin() { this._mom(+1.5); }
  noteIdle() { this.session.idle = true; this.boredom = c01(this.boredom + 0.08); this._mom(-6); }
  notePause() { this.session.paused = true; }
  noteTabBlur() { this.session.tabBlur = true; this._mom(-14); }
  noteTabFocus() { this.session.tabBlur = false; }
  noteNearMiss() { this.excitement = c01(this.excitement + 0.35); this.boredom = c01(this.boredom - 0.1); }
  noteSecret() { this.excitement = c01(this.excitement + 0.4); this.curiosity = c01(this.curiosity + 0.2); }
  noteNovelty() { this.curiosity = c01(this.curiosity + 0.5); this.boredom = c01(this.boredom - 0.25); this.excitement = c01(this.excitement + 0.15); this.levelsSinceNovel = 0; }
  noteDeathNow() { this.session.lastDeathAt = now(); }
  noteRetryNow() {
    if (this.session.lastDeathAt != null) {
      const rs = (now() - this.session.lastDeathAt) / 1000; this.session.retrySpeed = rs;
      // fast retry = rage-to-continue (engaged); slow = considering quitting
      this._mom(rs < 1.2 ? +14 : rs < 4 ? +2 : rs < 10 ? -10 : -24);
      if (rs < 1.5) this.excitement = c01(this.excitement + 0.05);
      this.session.lastDeathAt = null;
    }
  }
  _mom(d) { this.momentum = clamp(this.momentum * 0.9 + d, -100, 100); this.events++; }

  // ---- outcomes ----
  recordWin({ difficulty, timeMs, par, coins, coinTotal, deaths }) {
    const exp = this.expected(difficulty);
    this.skill = clamp(this.skill + this._k() * (1 - exp), DIRECTOR.diffMin - 200, DIRECTOR.diffMax + 200);
    this.history.push({ d: difficulty, won: 1 });
    this.session.winStreak++; this.session.loseStreak = 0; this.session.deathStreak = 0; this.session.retries = 0; this.session.repeatedSpot = 0; this.session.lastDeathSpot = null;
    const easy = deaths === 0 && exp > 0.82;
    const beatPar = par && timeMs <= par;
    this.frustration = c01(this.frustration - (deaths > 0 ? 0.15 : 0.3));
    // boredom rises from easy wins AND long unbroken streaks (the game feels
    // "solved"); a hard-fought win relieves it.
    this.boredom = c01(this.boredom + (easy ? 0.16 : -0.06) + Math.max(0, this.session.winStreak - 2) * 0.06);
    this.excitement = c01(this.excitement + (beatPar ? 0.25 : 0.05) + (deaths > 0 ? 0.1 : 0));
    this.fatigue = c01(this.fatigue - (coins >= coinTotal ? 0.18 : 0.08));
    this._mom(+22);
    if (beatPar) this.arch.speedrunner += 2;
    if (coinTotal && coins >= coinTotal) { this.arch.explorer += 1.5; this.arch.collector += 1.5; }
    if (deaths === 0) this.arch.survivor += 1.2;
    if (deaths >= 1 && difficulty > this.skill) this.arch.competitor += 2;
    this._baseline(deaths); this._scoreSize(+ (easy ? 0.4 : 1.0)); this._finishIntervention(); this._afterOutcome(); this._save();
  }
  recordLoss({ difficulty, timeMs, deathSpot, nearFinish }) {
    const exp = this.expected(difficulty);
    this.skill = clamp(this.skill - this._k() * 0.55 * exp, DIRECTOR.diffMin - 200, DIRECTOR.diffMax + 200);
    this.history.push({ d: difficulty, won: 0 });
    this.session.loseStreak++; this.session.winStreak = 0; this.session.deathStreak++; this.session.retries++; this.session.deathsThisLevel++;
    this.session.quickDeath = timeMs < 3500;
    // frustration relative to THIS PLAYER'S baseline (some people die a lot and stay)
    const rel = this.session.deathsThisLevel / Math.max(1, this.baselineDeaths);
    this.frustration = c01(this.frustration + (this.session.quickDeath ? 0.2 : 0.1) * clamp(rel, 0.5, 2));
    this.boredom = c01(this.boredom - 0.1);
    if (nearFinish) this.excitement = c01(this.excitement + 0.2);          // "so close" is exciting, not just painful
    if (deathSpot && this.session.lastDeathSpot) { const d = Math.hypot(deathSpot.x - this.session.lastDeathSpot.x, deathSpot.z - this.session.lastDeathSpot.z); this.session.repeatedSpot = d < 6 ? this.session.repeatedSpot + 1 : 0; }
    this.session.lastDeathSpot = deathSpot || null;
    this.arch.survivor = Math.max(1, this.arch.survivor - 0.3);
    this._mom(-16); this._scoreSize(-0.8); this._finishIntervention(); this._afterOutcome(); this._save();
  }
  _baseline(deaths) { this.baselineDeaths = lerp(this.baselineDeaths, deaths, 0.12); }
  _afterOutcome() { this.confidence = c01(0.12 + this.sessionLevels * 0.08 + this.events * 0.004); this._pushRisk(); this._updateState(); }

  // ---- size preference (learned, with exploration) ----
  _scoreSize(delta) {
    const s = this.sizeStats[this._lastSize]; if (!s) return;
    const engaged = clamp(0.5 + this.momentum / 200 + (delta > 0 ? 0.2 : -0.2) - this.frustration * 0.3 + this.excitement * 0.2, 0, 1);
    s.n++; s.sat = lerp(s.sat, engaged, 0.3);
    if (this._exploringSize === this._lastSize) { this._exploringSize = null; } // we evaluated the experiment
  }
  pickSize() {
    let best = SIZE_ORDER[0], v = -1;
    for (const k of SIZE_ORDER) if (this.sizeStats[k].sat > v) { v = this.sizeStats[k].sat; best = k; }
    // explore ~20%: try a different size to test if they'd enjoy it more
    let pick = best;
    if (Math.random() < 0.2) { const others = SIZE_ORDER.filter(s => s !== best); pick = others[Math.floor(Math.random() * others.length)]; this._exploringSize = pick; }
    this._lastSize = pick; return pick;
  }

  // ---- intervention learning ----
  _beginIntervention(kind) { this._lastIntervention = kind; this._riskBeforeInterv = this.risk; }
  _finishIntervention() {
    if (!this._lastIntervention || this._riskBeforeInterv == null) return;
    const delta = this.risk - this._riskBeforeInterv;          // negative = it helped
    const e = this.interv[this._lastIntervention] || { n: 0, delta: 0 };
    e.delta = (e.delta * e.n + delta) / (e.n + 1); e.n++; this.interv[this._lastIntervention] = e;
    this._lastIntervention = null; this._riskBeforeInterv = null;
  }

  // ---- churn / leave-probability with confidence + projection ----
  _instRisk() {
    const C = DIRECTOR.churn; let r = 16; const reasons = [];
    const add = (v, why) => { r += v; if (v > 0) reasons.push({ why, v }); };
    if (this.session.deathStreak >= 3) add(C.deathStreak3, 'repeated deaths');
    else if (this.session.deathStreak === 2) add(C.deathStreak2, 'two deaths');
    if (this.session.quickDeath) add(C.quickDeath, 'died instantly');
    if (this.session.idle) add(C.idle5s, 'gone quiet');
    if (this.session.repeatedSpot >= 1) add(C.repeatedSpot, 'stuck on one spot');
    if (this.session.loseStreak >= 4) add(C.longLoseStreak, 'long losing streak');
    if (this.session.tabBlur) add(C.tabBlur, 'looked away');
    if (this.session.retrySpeed > 10) add(18, 'slow to retry');
    add(this.boredom * 30, this.boredom > 0.5 ? 'getting bored' : '');
    add(Math.max(0, -this.momentum) * 0.25, '');
    if (this.session.winStreak >= 1) add(C.recentWin, '');
    add(-this.excitement * 25, '');                            // excitement keeps people
    reasons.sort((a, b) => b.v - a.v);
    return { r: clamp(r, 0, 100), reason: reasons[0]?.why || 'engaged' };
  }
  _pushRisk() {
    const inst = this._instRisk();
    // emotional inertia: risk eases toward the instant value, faster up than down
    const up = inst.r > this.risk; this.risk = lerp(this.risk, inst.r, up ? 0.6 : 0.3);
    this.riskSmoothed = lerp(this.riskSmoothed, this.risk, 0.5);
    this.riskHist.push(this.risk); if (this.riskHist.length > 6) this.riskHist.shift();
    this._lastReason = inst.reason;
  }
  frustrationVelocity() { const h = this.riskHist; if (h.length < 2) return 0; return clamp((h[h.length - 1] - h[0]) / Math.max(1, h.length - 1), -100, 100); }

  churn() {
    const fv = this.frustrationVelocity();
    const leaveProb = clamp(Math.round(this.riskSmoothed * (0.6 + 0.4 * this.modelTrust)), 0, 100);
    const s30 = clamp(Math.round(this.riskSmoothed + fv * 1.5), 0, 100);
    const s60 = clamp(Math.round(this.riskSmoothed + fv * 3), 0, 100);
    // act on zone only as strongly as confidence allows (Bayesian-ish)
    const eff = leaveProb * (0.5 + 0.5 * this.confidence);
    const zone = eff >= 80 ? 'panic' : eff >= 64 ? 'red' : eff >= 48 ? 'orange' : eff >= 30 ? 'yellow' : 'green';
    return { risk: Math.round(this.risk), leaveProb, confidence: Math.round(this.confidence * 100), zone,
      reason: this._lastReason || 'engaged', projection: { s30, s60 }, state: this.state,
      frustration: +this.frustration.toFixed(2), boredom: +this.boredom.toFixed(2), excitement: +this.excitement.toFixed(2),
      momentum: Math.round(this.momentum), frustrationVelocity: Math.round(fv) };
  }

  // ---- psychological state machine ----
  _updateState() {
    const m = this.meters(); const ch = this.churn(); const prev = this.state;
    let s;
    if (ch.leaveProb > 78 && this.confidence > 0.45) s = 'leaving';
    else if (m.frustration > 0.6) s = 'frustrated';
    else if (prev === 'frustrated' && m.frustration <= 0.5) s = 'recovering';
    else if (m.boredom > 0.6) s = 'bored';
    else if (m.excitement > 0.6 && m.skill01 > 0.5) s = 'challenged';
    else if (this.sessionLevels < 3) s = (this.sessionLevels < 1 ? 'exploring' : 'learning');
    else if (m.skill01 > 0.7 && m.frustration < 0.3 && m.boredom < 0.4) s = 'mastery';
    else s = 'flow';
    this.state = s;
  }

  // ---- the plan ----
  planNext(stage, ctx = {}) {
    const m = this.meters(); const ch = this.churn(); const archetype = this.archetype();
    this.excitement = c01(this.excitement - 0.06);        // decays each level
    this.curiosity = c01(this.curiosity - 0.12);
    const curiosityDebt = this.curiosity < 0.35 || this.levelsSinceNovel >= 5;
    let novelty = !!(ctx.newMechanic || ctx.worldChanged) || curiosityDebt || this.state === 'bored';

    // MODE from state (frustration & boredom get OPPOSITE treatments)
    let mode;
    if (this.state === 'leaving' || this.state === 'frustrated') mode = 'rescue';
    else if (this.state === 'bored') mode = 'challenge';              // boredom -> MORE, not less
    else if (ctx.newMechanic) mode = 'teach';
    else if (this.state === 'challenged' || this.state === 'mastery') mode = 'challenge';
    else mode = 'flow';

    let target = this.skill + 400 * Math.log10((1 - DIRECTOR.targetWinProb) / DIRECTOR.targetWinProb) + this._bias();

    const mods = { sizeScale: 1, hazardScale: 1, decoyScale: 1, extraCoins: 0, forgive: 0, tightness: 0,
      addBoost: false, biggerGoal: false, closerFinish: false, guaranteePowerup: null, rescueOpen: false, surpriseReward: 0, slowHazards: 1, novelty };

    if (mode === 'teach') { target += DIRECTOR.offsetEasy * 0.5; mods.hazardScale = 0.6; }
    else if (mode === 'challenge') { target += DIRECTOR.offsetHard; mods.extraCoins = 3; mods.tightness = 0.4; this._beginIntervention('challenge'); }
    else if (mode === 'rescue') {
      const sev = ch.zone === 'panic' ? 1.4 : ch.zone === 'red' ? 1.0 : 0.7;
      target += DIRECTOR.offsetEasy * sev;
      mods.hazardScale = clamp(0.5 - sev * 0.2, 0.2, 0.6); mods.decoyScale = 0.4;
      mods.biggerGoal = true; mods.closerFinish = true; mods.forgive = clamp(0.4 + sev * 0.3, 0.4, 0.9);
      mods.guaranteePowerup = 'shield'; mods.addBoost = true;
      if (ch.zone === 'panic') mods.surpriseReward = 250;
      this._beginIntervention('rescue');
    }
    if (m.fatigue > 0.7) { mods.closerFinish = true; }

    // archetype-flavoured help
    if (mode === 'rescue' || mode === 'flow') {
      if (archetype === 'collector' || archetype === 'explorer') mods.extraCoins += 4;
      if (archetype === 'speedrunner') mods.addBoost = true;
      if (archetype === 'competitor' && mode === 'flow') target += 30;
      if (archetype === 'survivor') mods.hazardScale *= 0.85;
    }

    target = clamp(Math.round(ctx.scripted?.difficulty ?? target), DIRECTOR.diffMin, DIRECTOR.diffMax);
    const sizeBucket = ctx.scripted ? 'small' : this.pickSize();    // scripted early levels stay small
    if (novelty) this.levelsSinceNovel = 0;
    this._save();
    return { stage, difficulty: target, sizeBucket, mods, mode, churn: ch, meters: m, archetype, novelty, mission: this._mission(archetype) };
  }

  retryMods() {
    const n = this.session.retries;
    const m = { rescueOpen: false, hazardScale: 1, forgive: 0, biggerGoal: false, slowHazards: 1 };
    if (n >= 2) { m.forgive = 0.4; m.slowHazards = 0.85; }
    if (n >= 3) { m.hazardScale = 0.6; m.slowHazards = 0.7; m.forgive = 0.6; }
    if (n >= 4) { m.rescueOpen = true; m.hazardScale = 0.4; m.biggerGoal = true; m.forgive = 0.8; }
    return m;
  }

  _mission(archetype) {
    const byArch = {
      speedrunner: { id: 'fast', label: 'Beat the par time ⏱', reward: 40 },
      explorer: { id: 'allcoins', label: 'Collect every coin ✨', reward: 45 },
      collector: { id: 'allcoins', label: 'Collect every coin ✨', reward: 45 },
      survivor: { id: 'flawless', label: 'Finish without dying 🛡️', reward: 35 },
      competitor: { id: 'fast', label: 'Beat the par time ⏱', reward: 40 },
    };
    return byArch[archetype] || { id: 'allcoins', label: 'Collect every coin ✨', reward: 40 };
  }
  checkMission(mission, win) {
    if (!mission) return false;
    if (mission.id === 'fast') return win.timeMs <= win.parMs;
    if (mission.id === 'allcoins') return win.coinTotal > 0 && win.coins >= win.coinTotal;
    if (mission.id === 'flawless') return (win.deaths || 0) === 0;
    return false;
  }
}
