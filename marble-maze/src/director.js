// =====================================================================
//  director.js — the Adaptive Difficulty + Churn-Risk engine.
//
//  Goal: maximise "probability the player starts one more level."
//
//  Two hidden ratings (ELO-style):
//    • player skill   — rises on hard wins, dips on easy losses
//    • maze difficulty — we GENERATE a maze for a target rating, then
//      update skill from the win/loss outcome vs that target.
//
//  Plus a live CHURN-RISK score (0-100) built from behavioural signals
//  (death streaks, quick deaths, idle, tab-blur, repeated mistakes…).
//  Risk drives interventions so the player keeps feeling "I can do this":
//    green  → play it straight
//    yellow → invisible nudges (a boost tile, slightly wider path)
//    orange → visible help (extra coins, easier next maze)
//    red    → retention-first (shorter route, bigger goal, forgiving)
//    panic  → rescue (surprise reward, near-win save)
//
//  Difficulty is also shaped into a WIN / WIN / CLOSE-LOSS rhythm rather
//  than a flat ramp, because "I almost had it" drives retries.
// =====================================================================
import { DIRECTOR } from './config.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Director {
  constructor(saved, onSave) {
    this.onSave = onSave || (() => {});
    this.skill = saved?.skill ?? DIRECTOR.startSkill;
    this.history = saved?.history ?? [];     // last outcomes: {d, won}
    this.profile = saved?.profile ?? { speed: 0.5, persistence: 0.5, explore: 0.5, frustration: 0.3 };
    // per-session (not persisted)
    this.session = {
      winStreak: 0, loseStreak: 0, deathStreak: 0,
      retries: 0, lastDeathSpot: null, repeatedSpot: 0,
      idle: false, paused: false, tabBlur: false, quickDeath: false,
      levelStartMs: 0, lastIntent: 'teach',
    };
  }

  serialize() { return { skill: this.skill, history: this.history.slice(-40), profile: this.profile }; }
  _save() { this.onSave(this.serialize()); }

  // ----- expected win probability (ELO logistic) -----
  expected(difficulty) { return 1 / (1 + Math.pow(10, (difficulty - this.skill) / 400)); }

  // ----- behavioural signals fed by main.js -----
  noteLevelStart() { this.session.levelStartMs = performance.now(); this.session.idle = false; this.session.paused = false; this.session.quickDeath = false; }
  noteMove() { this.session.idle = false; }
  noteIdle() { this.session.idle = true; }
  notePause() { this.session.paused = true; }
  noteTabBlur() { this.session.tabBlur = true; }
  noteTabFocus() { this.session.tabBlur = false; }

  // ----- record outcomes -----
  recordWin({ difficulty, timeMs, par, coins, coinTotal, deaths }) {
    const exp = this.expected(difficulty);
    this.skill = clamp(this.skill + DIRECTOR.K * (1 - exp), DIRECTOR.diffMin - 200, DIRECTOR.diffMax + 200);
    this.history.push({ d: difficulty, won: 1 });
    // profile: speed (beat par fast), explore (coins), persistence
    if (par) this.profile.speed = lerp(this.profile.speed, clamp(par / Math.max(timeMs, 1), 0, 1.5) / 1.5, 0.25);
    if (coinTotal) this.profile.explore = lerp(this.profile.explore, clamp(coins / coinTotal, 0, 1), 0.2);
    this.profile.frustration = lerp(this.profile.frustration, deaths > 0 ? 0.55 : 0.15, 0.25);
    this.session.winStreak++; this.session.loseStreak = 0; this.session.deathStreak = 0;
    this.session.retries = 0; this.session.repeatedSpot = 0; this.session.lastDeathSpot = null;
    this._save();
  }

  recordLoss({ difficulty, timeMs, deathSpot, nearFinish }) {
    const exp = this.expected(difficulty);
    this.skill = clamp(this.skill - DIRECTOR.K * 0.6 * exp, DIRECTOR.diffMin - 200, DIRECTOR.diffMax + 200);
    this.history.push({ d: difficulty, won: 0 });
    this.session.loseStreak++; this.session.winStreak = 0;
    this.session.deathStreak++; this.session.retries++;
    this.session.quickDeath = timeMs < 3500;
    this.profile.frustration = lerp(this.profile.frustration, 0.7, 0.3);
    this.profile.persistence = lerp(this.profile.persistence, 0.7, 0.15); // they're still here = persistent
    // repeated-spot detection (same area of the maze)
    if (deathSpot && this.session.lastDeathSpot) {
      const d = Math.hypot(deathSpot.x - this.session.lastDeathSpot.x, deathSpot.z - this.session.lastDeathSpot.z);
      if (d < 6) this.session.repeatedSpot++; else this.session.repeatedSpot = 0;
    }
    this.session.lastDeathSpot = deathSpot || null;
    this.session.nearFinish = !!nearFinish;
    this._save();
  }

  // ----- CHURN RISK (0-100) + dominant reason -----
  churn() {
    const C = DIRECTOR.churn; let r = 18; const reasons = [];
    const add = (v, why) => { r += v; if (v > 0) reasons.push({ why, v }); };
    if (this.session.deathStreak >= 3) add(C.deathStreak3, 'repeated deaths');
    else if (this.session.deathStreak === 2) add(C.deathStreak2, 'two deaths');
    if (this.session.quickDeath) add(C.quickDeath, 'died instantly');
    if (this.session.idle) add(C.idle5s, 'gone quiet');
    if (this.session.paused) add(C.pausedMidLevel, 'paused');
    if (this.session.repeatedSpot >= 1) add(C.repeatedSpot, 'stuck on one spot');
    if (this.session.loseStreak >= 4) add(C.longLoseStreak, 'long losing streak');
    if (this.session.tabBlur) add(C.tabBlur, 'tab unfocused');
    if (this.session.winStreak >= 1) add(C.recentWin, '');
    const risk = clamp(Math.round(r), 0, 100);
    reasons.sort((a, b) => b.v - a.v);
    const zone = risk >= 95 ? 'panic' : risk >= 85 ? 'red' : risk >= 70 ? 'orange' : risk >= 40 ? 'yellow' : 'green';
    return { risk, zone, reason: reasons[0]?.why || 'engaged' };
  }

  // ----- plan the next maze: difficulty target + interventions + intent -----
  planNext(stage, scripted) {
    const ch = this.churn();
    // Base target so the player should win ~targetWinProb of the time.
    // Inverting the ELO logistic: diff = skill + 400*log10((1-p)/p).
    // For p>0.5 this lands BELOW skill (achievable, "I can do this").
    let target = this.skill + 400 * Math.log10((1 - DIRECTOR.targetWinProb) / DIRECTOR.targetWinProb);
    // win/win/close-loss rhythm: after 2+ clean wins, occasionally spike (challenge)
    let intent = 'flow';
    const lastTwoWins = this.history.slice(-2).every(h => h?.won === 1) && this.history.length >= 2;
    if (ch.zone === 'green' && lastTwoWins && this.session.winStreak >= 2 && Math.random() < 0.5) {
      target += DIRECTOR.offsetHard; intent = 'challenge';            // engineer an "almost" moment
    }
    // churn interventions shift target down + add help
    const mods = { sizeScale: 1, hazardScale: 1, decoyScale: 1, extraCoins: 0, forgive: 0,
                   addBoost: false, biggerGoal: false, closerFinish: false, guaranteePowerup: null,
                   rescueOpen: false, surpriseReward: 0 };
    if (ch.zone === 'yellow') { target += DIRECTOR.offsetEasy * 0.35; mods.addBoost = true; mods.sizeScale = 0.92; intent = 'ease'; }
    else if (ch.zone === 'orange') { target += DIRECTOR.offsetEasy * 0.7; mods.extraCoins = 4; mods.hazardScale = 0.6; mods.addBoost = true; mods.sizeScale = 0.85; intent = 'help'; }
    else if (ch.zone === 'red') { target += DIRECTOR.offsetEasy; mods.extraCoins = 6; mods.hazardScale = 0.4; mods.decoyScale = 0.5; mods.biggerGoal = true; mods.closerFinish = true; mods.forgive = 0.6; mods.sizeScale = 0.75; mods.guaranteePowerup = 'shield'; intent = 'retain'; }
    else if (ch.zone === 'panic') { target += DIRECTOR.offsetEasy * 1.4; mods.extraCoins = 10; mods.hazardScale = 0.2; mods.decoyScale = 0.25; mods.biggerGoal = true; mods.closerFinish = true; mods.forgive = 0.85; mods.sizeScale = 0.65; mods.guaranteePowerup = 'shield'; mods.surpriseReward = 250; intent = 'rescue'; }

    target = clamp(target, DIRECTOR.diffMin, DIRECTOR.diffMax);
    this.session.lastIntent = intent;
    return { stage, difficulty: Math.round(scripted?.difficulty ?? target), mods, intent, churn: ch };
  }

  // ----- subtle in-maze rescue for the SAME maze after repeated fails -----
  //  Returns mods that quietly make the current maze winnable without the
  //  player realising the game changed (open a shortcut, soften hazards).
  retryMods() {
    const n = this.session.retries;
    const m = { rescueOpen: false, hazardScale: 1, forgive: 0, biggerGoal: false, slowHazards: 1 };
    if (n >= 2) { m.forgive = 0.4; m.slowHazards = 0.85; }
    if (n >= 3) { m.hazardScale = 0.6; m.slowHazards = 0.7; m.forgive = 0.6; }
    if (n >= 4) { m.rescueOpen = true; m.hazardScale = 0.4; m.biggerGoal = true; m.forgive = 0.8; } // open a quiet shortcut
    return m;
  }

  estWinProb(difficulty) { return Math.round(this.expected(difficulty) * 100); }
}

function lerp(a, b, t) { return a + (b - a) * t; }
