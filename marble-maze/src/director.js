// =====================================================================
//  director.js — the adaptive brain (v3).
//
//  Goal: maximise P(player starts one more level).
//
//  A 4-STATE PLAYER MODEL drives everything:
//    • skill        — ELO rating, how likely they win
//    • frustration  — how close to quitting (and its *velocity*)
//    • curiosity    — how much new stuff they still want (decays = boredom)
//    • fatigue      — focused vs. just grinding
//
//  From those it picks a MODE — Teach / Flow / Challenge / Rescue — and
//  emits a level PLAN (difficulty + interventions + novelty + a micro-
//  mission) tailored to the player's ARCHETYPE (explorer / speedrunner /
//  competitor / collector / survivor).
//
//  CHURN is a real leave-probability estimate (not just a penalty sum):
//  it folds in retry-speed, session momentum, and frustration velocity —
//  it tries to know the player is checking out *before* they leave.
// =====================================================================
import { DIRECTOR } from './config.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clamp01 = (v) => clamp(v, 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class Director {
  constructor(saved, onSave) {
    this.onSave = onSave || (() => {});
    this.skill = saved?.skill ?? DIRECTOR.startSkill;
    this.history = saved?.history ?? [];                 // [{d,won}]
    this.frustration = saved?.frustration ?? 0.25;       // persisted lightly
    this.curiosity = saved?.curiosity ?? 0.8;
    this.fatigue = 0;                                     // session-only
    this.arch = saved?.arch ?? { explorer: 1, speedrunner: 1, competitor: 1, collector: 1, survivor: 1 };
    this.riskHist = [];                                   // for frustration velocity
    this.momentum = 0;                                    // -100..100
    this.sessionLevels = 0;
    this.levelsSinceNovel = 0;
    this.session = {
      winStreak: 0, loseStreak: 0, deathStreak: 0, retries: 0,
      lastDeathSpot: null, repeatedSpot: 0, idle: false, paused: false, tabBlur: false,
      quickDeath: false, levelStartMs: 0, lastDeathAt: null, retrySpeed: 3, deathsThisLevel: 0,
    };
  }

  serialize() { return { skill: this.skill, history: this.history.slice(-50), frustration: this.frustration, curiosity: this.curiosity, arch: this.arch }; }
  _save() { this.onSave(this.serialize()); }

  expected(d) { return 1 / (1 + Math.pow(10, (d - this.skill) / 400)); }
  estWinProb(d) { return Math.round(this.expected(d) * 100); }
  meters() { return { skill01: clamp01((this.skill - DIRECTOR.diffMin) / (DIRECTOR.diffMax - DIRECTOR.diffMin)), frustration: clamp01(this.frustration), curiosity: clamp01(this.curiosity), fatigue: clamp01(this.fatigue), momentum: this.momentum }; }
  archetype() { let best = 'explorer', v = -1; for (const k in this.arch) if (this.arch[k] > v) { v = this.arch[k]; best = k; } return best; }

  // ---- behavioural signals ----
  noteLevelStart() { this.session.levelStartMs = now(); this.session.idle = false; this.session.paused = false; this.session.quickDeath = false; this.session.deathsThisLevel = 0; this.sessionLevels++; this.levelsSinceNovel++; this.fatigue = clamp01(this.fatigue + 0.04); }
  noteMove() { this.session.idle = false; this._mom(+1); }
  noteCoin() { this._mom(+1.5); }
  noteIdle() { this.session.idle = true; this._mom(-6); }
  notePause() { this.session.paused = true; }
  noteTabBlur() { this.session.tabBlur = true; this._mom(-14); }
  noteTabFocus() { this.session.tabBlur = false; }
  noteDeathNow() { this.session.lastDeathAt = now(); }
  noteRetryNow() {
    if (this.session.lastDeathAt != null) {
      const rs = (now() - this.session.lastDeathAt) / 1000; this.session.retrySpeed = rs;
      this._mom(rs < 1.2 ? +14 : rs < 4 ? +2 : rs < 10 ? -10 : -24);   // fast retry = hooked
      this.session.lastDeathAt = null;
    }
  }
  _mom(d) { this.momentum = clamp(this.momentum * 0.9 + d, -100, 100); }

  // delivered novelty (new mechanic / world / event) resets curiosity debt
  noteNovelty() { this.curiosity = clamp01(this.curiosity + 0.5); this.levelsSinceNovel = 0; }

  // ---- outcomes ----
  recordWin({ difficulty, timeMs, par, coins, coinTotal, deaths }) {
    const exp = this.expected(difficulty);
    this.skill = clamp(this.skill + DIRECTOR.K * (1 - exp), DIRECTOR.diffMin - 200, DIRECTOR.diffMax + 200);
    this.history.push({ d: difficulty, won: 1 });
    this.session.winStreak++; this.session.loseStreak = 0; this.session.deathStreak = 0; this.session.retries = 0; this.session.repeatedSpot = 0; this.session.lastDeathSpot = null;
    // meters
    this.frustration = clamp01(this.frustration - (deaths > 0 ? 0.15 : 0.32));
    this.fatigue = clamp01(this.fatigue - (coins >= coinTotal ? 0.18 : 0.08));   // a satisfying clear refreshes
    this._mom(+22);
    // archetype tallies
    if (par && timeMs <= par) this.arch.speedrunner += 2;
    if (coinTotal && coins >= coinTotal) this.arch.explorer += 1.5, this.arch.collector += 1.5;
    if (deaths === 0) this.arch.survivor += 1.2;
    if (deaths >= 1 && difficulty > this.skill) this.arch.competitor += 2;       // beat something hard
    this._pushRisk(); this._save();
  }
  recordLoss({ difficulty, timeMs, deathSpot, nearFinish }) {
    const exp = this.expected(difficulty);
    this.skill = clamp(this.skill - DIRECTOR.K * 0.55 * exp, DIRECTOR.diffMin - 200, DIRECTOR.diffMax + 200);
    this.history.push({ d: difficulty, won: 0 });
    this.session.loseStreak++; this.session.winStreak = 0; this.session.deathStreak++; this.session.retries++; this.session.deathsThisLevel++;
    this.session.quickDeath = timeMs < 3500;
    this.frustration = clamp01(this.frustration + (this.session.quickDeath ? 0.22 : 0.13) + (nearFinish ? 0.05 : 0));
    if (deathSpot && this.session.lastDeathSpot) { const d = Math.hypot(deathSpot.x - this.session.lastDeathSpot.x, deathSpot.z - this.session.lastDeathSpot.z); this.session.repeatedSpot = d < 6 ? this.session.repeatedSpot + 1 : 0; }
    this.session.lastDeathSpot = deathSpot || null; this.session.nearFinish = !!nearFinish;
    this.arch.survivor = Math.max(1, this.arch.survivor - 0.3);
    this._mom(-16); this._pushRisk(); this._save();
  }

  // ---- churn / leave-probability ----
  _baseRisk() {
    const C = DIRECTOR.churn; let r = 18; const reasons = [];
    const add = (v, why) => { r += v; if (v > 0) reasons.push({ why, v }); };
    if (this.session.deathStreak >= 3) add(C.deathStreak3, 'repeated deaths');
    else if (this.session.deathStreak === 2) add(C.deathStreak2, 'two deaths in a row');
    if (this.session.quickDeath) add(C.quickDeath, 'died instantly');
    if (this.session.idle) add(C.idle5s, 'gone quiet');
    if (this.session.paused) add(C.pausedMidLevel, 'paused');
    if (this.session.repeatedSpot >= 1) add(C.repeatedSpot, 'stuck on one spot');
    if (this.session.loseStreak >= 4) add(C.longLoseStreak, 'long losing streak');
    if (this.session.tabBlur) add(C.tabBlur, 'looked away');
    if (this.session.retrySpeed > 8) add(16, 'slow to retry');
    if (this.session.winStreak >= 1) add(C.recentWin, '');
    reasons.sort((a, b) => b.v - a.v);
    return { r: clamp(r, 0, 100), reason: reasons[0]?.why || 'engaged' };
  }
  _pushRisk() { this.riskHist.push(this._baseRisk().r); if (this.riskHist.length > 6) this.riskHist.shift(); }
  frustrationVelocity() { const h = this.riskHist; if (h.length < 2) return 0; return clamp(h[h.length - 1] - h[0], -100, 100) / Math.max(1, h.length - 1); }

  churn() {
    const b = this._baseRisk();
    const fv = this.frustrationVelocity();
    // leave probability folds behaviour together (momentum & retry-speed matter
    // as much as deaths — a calm tab-away is more dangerous than 5 eager retries)
    let lp = b.r * 0.6;
    lp += Math.max(0, -this.momentum) * 0.3;          // negative momentum
    lp += Math.max(0, fv) * 1.2;                       // rising fast = scary
    lp += this.fatigue * 18;
    lp -= Math.max(0, this.momentum) * 0.2;            // eager play lowers it
    if (this.session.tabBlur) lp += 18;
    const leaveProb = clamp(Math.round(lp), 0, 100);
    const risk = clamp(Math.round((b.r + leaveProb) / 2), 0, 100);
    const zone = risk >= 95 ? 'panic' : risk >= 85 ? 'red' : risk >= 70 ? 'orange' : risk >= 40 ? 'yellow' : 'green';
    return { risk, zone, reason: b.reason, leaveProb, momentum: Math.round(this.momentum), frustrationVelocity: Math.round(fv) };
  }

  // ---- the plan ----
  planNext(stage, ctx = {}) {
    const ch = this.churn();
    const m = this.meters();
    const archetype = this.archetype();

    // curiosity decays with sameness; deliver novelty when it's low (or when
    // a new mechanic/world is naturally due here)
    this.curiosity = clamp01(this.curiosity - 0.12);
    const curiosityDebt = this.curiosity < 0.35 || this.levelsSinceNovel >= 5;
    let novelty = !!(ctx.newMechanic || ctx.worldChanged) || curiosityDebt;

    // choose MODE
    let mode;
    if (ch.zone === 'red' || ch.zone === 'panic' || m.frustration > 0.7) mode = 'rescue';
    else if (ctx.newMechanic) mode = 'teach';
    else if (m.skill01 > 0.55 && m.frustration < 0.35 && ch.zone === 'green' && this.session.winStreak >= 2 && m.fatigue < 0.7) mode = 'challenge';
    else mode = 'flow';

    // base difficulty ~ targetWinProb below skill (achievable)
    let target = this.skill + 400 * Math.log10((1 - DIRECTOR.targetWinProb) / DIRECTOR.targetWinProb);

    const mods = { sizeScale: 1, hazardScale: 1, decoyScale: 1, extraCoins: 0, forgive: 0,
      addBoost: false, biggerGoal: false, closerFinish: false, guaranteePowerup: null,
      rescueOpen: false, surpriseReward: 0, slowHazards: 1, novelty };

    if (mode === 'teach') { target += DIRECTOR.offsetEasy * 0.5; mods.hazardScale = 0.6; mods.sizeScale = 0.9; }
    else if (mode === 'challenge') { target += DIRECTOR.offsetHard; mods.extraCoins = 3; }
    else if (mode === 'rescue') {
      const sev = ch.zone === 'panic' ? 1.4 : ch.zone === 'red' ? 1.0 : 0.7;
      target += DIRECTOR.offsetEasy * sev;
      mods.hazardScale = clamp(0.5 - sev * 0.2, 0.2, 0.6); mods.decoyScale = 0.4; mods.sizeScale = clamp(0.9 - sev * 0.15, 0.6, 0.9);
      mods.biggerGoal = true; mods.closerFinish = true; mods.forgive = clamp(0.4 + sev * 0.3, 0.4, 0.9);
      mods.guaranteePowerup = 'shield'; mods.addBoost = true;
      if (ch.zone === 'panic') mods.surpriseReward = 250;
    }
    // fatigue -> shorter, cleaner
    if (m.fatigue > 0.7) { mods.closerFinish = true; mods.sizeScale = Math.min(mods.sizeScale, 0.85); }

    // archetype-flavoured intervention (same risk, different medicine)
    if (mode === 'rescue' || mode === 'flow') {
      if (archetype === 'collector' || archetype === 'explorer') mods.extraCoins += 4;
      if (archetype === 'speedrunner') { mods.addBoost = true; mods.closerFinish = mode === 'rescue'; }
      if (archetype === 'competitor' && mode === 'flow') target += 30;          // they want bite
      if (archetype === 'survivor') mods.hazardScale *= 0.85;
    }

    target = clamp(Math.round(ctx.scripted?.difficulty ?? target), DIRECTOR.diffMin, DIRECTOR.diffMax);

    if (novelty) this.levelsSinceNovel = 0;            // we're about to deliver novelty
    this._save();
    return { stage, difficulty: target, mods, mode, churn: ch, meters: m, archetype,
      novelty, mission: this._mission(archetype) };
  }

  // subtle in-maze rescue for the SAME maze on repeated fails
  retryMods() {
    const n = this.session.retries;
    const m = { rescueOpen: false, hazardScale: 1, forgive: 0, biggerGoal: false, slowHazards: 1 };
    if (n >= 2) { m.forgive = 0.4; m.slowHazards = 0.85; }
    if (n >= 3) { m.hazardScale = 0.6; m.slowHazards = 0.7; m.forgive = 0.6; }
    if (n >= 4) { m.rescueOpen = true; m.hazardScale = 0.4; m.biggerGoal = true; m.forgive = 0.8; }
    return m;
  }

  // optional objective for goal-chaining (checked from win data in main)
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
