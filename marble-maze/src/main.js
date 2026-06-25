// =====================================================================
//  main.js — bootstrap + adaptive game state machine (Retention v2).
//  Ties engine + UI + storage + input + audio + ad SDK + the adaptive
//  Director (ELO skill, churn-risk, interventions) into the play loop.
// =====================================================================
import { Game } from './game.js';
import { UI } from './ui.js';
import { Input } from './input.js';
import * as Audio from './audio.js';
import * as SDK from './sdk.js';
import * as S from './storage.js';
import { generateLevel } from './levels.js';
import { Director } from './director.js';
import { SKINS, TRAILS, ECON, LEVELS_PER_WORLD, worldForLevel, newMechanicAt } from './config.js';

const SCRIPTED = [0, 760, 800, 850, 900, 950, 1000, 1050]; // stages 1..7 fixed gentle ramp

class App {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ui = new UI();
    this.input = new Input();
    this.game = new Game(this.canvas);
    this.director = new Director(S.getDirector(), (st) => S.setDirector(st));
    this.stage = 1;
    this.levelData = null;
    this.run = { coinValue: 0 };
    this.revivedThisRun = false;
    this.deathsThisStage = 0;
    this.winsSinceAd = 0;
    this.lastWin = null;
    this.lastDifficulty = 900; this.lastMods = {};
    this.pendingStart = null;
    this._last = performance.now();
  }

  async boot() {
    S.load(); const st = S.get();
    Audio.setEnabled({ sound: st.settings.sound, music: st.settings.music });
    this.input.setMode(st.settings.control); this.input.setSensitivity(st.settings.tiltSensitivity);
    this.input.attach(); this.input.bindTouchSurface(this.canvas);
    this.applyQuality(st.settings.quality);

    const unlock = () => { Audio.resume(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.director.noteTabBlur(); else this.director.noteTabFocus(); });

    this._wireHandlers();
    this.game.setCallbacks(this._gameCallbacks());

    SDK.setAdStateHandler((on) => this.ui.adCurtain(on));
    SDK.loadingStart(); const provider = await SDK.init(); this.ui.setProvider(provider); SDK.loadingFinished();

    this._loadShowcase();
    this.ui.refreshMenu(); this.ui.setMenuWorld(worldForLevel(st.maxLevel).name); this.ui.showScreen('menu');
    requestAnimationFrame(this._loop);
  }

  _loop = (now) => {
    const dt = Math.min(0.05, (now - this._last) / 1000); this._last = now;
    this.input.update(dt); this.game.update(dt, this.input);
    requestAnimationFrame(this._loop);
  };

  applyQuality(q) {
    if (q === 'low') this.game.setQuality('low');
    else if (q === 'high') this.game.setQuality('high');
    else this.game.setQuality('auto');
  }

  _loadShowcase() { this.levelData = generateLevel({ stage: S.get().maxLevel, difficulty: this.director.skill, mods: {} }); this.game.loadLevel(this.levelData, this._skinDef(), this._trailDef()); this.game.state = 'idle'; }
  _skinDef() { return SKINS.find(s => s.id === S.get().skin) || SKINS[0]; }
  _trailDef() { return TRAILS.find(t => t.id === S.get().trail) || TRAILS[0]; }

  _updateControlUI() {
    const mode = this.input.activeMode;
    const hint = mode === 'keys' ? 'WASD / Arrows  ·  hold Shift to boost'
      : mode === 'tilt' ? 'Tilt to steer  ·  hold BOOST' : 'Drag to steer  ·  hold BOOST';
    this.ui.setControlHint(hint); this.ui.showControlHint(); this.ui.showBoostButton(mode !== 'keys');
    clearTimeout(this._hintT); this._hintT = setTimeout(() => this.ui.fadeControlHint(), 4200);
  }

  // ---- level flow ----
  play() { this.startStage(S.get().maxLevel, {}); }

  _planFor(stage, retry) {
    if (retry) return { stage, difficulty: this.lastDifficulty, mods: { ...this.lastMods, ...this.director.retryMods() }, seedSalt: 0 };
    const scripted = stage <= 7 ? { difficulty: SCRIPTED[stage] } : null;
    const plan = this.director.planNext(stage, scripted);
    this.lastDifficulty = plan.difficulty; this.lastMods = plan.mods;
    return plan;
  }

  startStage(stage, { retry = false } = {}) {
    this.stage = stage;
    const plan = this._planFor(stage, retry);
    this.levelData = generateLevel(plan);
    this.run = { coinValue: 0 };
    this.revivedThisRun = false;
    if (!retry) this.deathsThisStage = 0;
    S.bump('runs');

    this.game.loadLevel(this.levelData, this._skinDef(), this._trailDef());
    this.game.beginResolveReset();
    this.director.noteLevelStart();

    const world = this.levelData.world;
    Audio.configureMusic(worldScale(world.id), worldRoot(world.id));
    if (S.get().settings.music) Audio.startMusic();

    // Ask for tilt permission BEFORE the enter-game transition (its timer
    // would otherwise hide the prompt).
    const wantTilt = (this.input.mode === 'auto' || this.input.mode === 'tilt');
    if (this.input.isTouchDevice() && wantTilt && this.input.tiltAvailable && !this.input.tiltPermitted) {
      this.pendingStart = stage; this.pendingPlan = plan; this.ui.showScreen('tiltPrompt'); return;
    }
    this.ui.enterGame();                 // cool exit of whatever screen is open
    this.ui.powerups([]); this.ui.finishArrow({ visible: false }); this.ui.goldRush(false);
    this._updateControlUI();
    this._beginPlay(plan);
  }

  _beginPlay(plan) {
    if (this.input.activeMode === 'tilt') this.input.calibrate();
    this.input.reset(); this.game.start(); SDK.gameplayStart();

    const n = this.stage;
    const worldChanged = (n - 1) % LEVELS_PER_WORLD === 0 && n > 1;
    const nm = newMechanicAt(n);
    if (worldChanged) { this.ui.banner('NEW WORLD', this.levelData.world.name); this.ui.toast(this.levelData.world.blurb, 2200); }
    else if (nm && !S.hasSeenMechanic(nm.key)) { this.ui.banner('NEW!', nm.label); S.markMechanicSeen(nm.key); }
    else this.ui.banner('LEVEL ' + n, this.levelData.world.name);
    this.ui.setMenuWorld(this.levelData.world.name);

    // panic-mode surprise gift (feels like luck, not pity)
    if (plan && plan.mods && plan.mods.surpriseReward) {
      const amt = plan.mods.surpriseReward; S.addCoins(amt); this.ui.setCoinBalance(S.get().coins);
      setTimeout(() => this.ui.surprise('🎉 LUCKY DROP', '+' + amt + ' coins'), 700);
    }
  }

  pause() { if (this.game.state !== 'playing') return; this.director.notePause(); this.game.pause(); SDK.gameplayStop(); this.ui.showScreen('pause'); }
  resume() { this.ui.hideOverlays(); this.ui.showHUD(true); this.game.resume(); SDK.gameplayStart(); }
  restart() { this.startStage(this.stage, { retry: true }); }
  toMenu() { SDK.gameplayStop(); Audio.stopMusic(); this.game.state = 'idle'; this.ui.showHUD(false); this.ui.goldRush(false); this.ui.showScreen('menu'); this.ui.refreshMenu(); }

  // ---- win ----
  _onWin(data) {
    SDK.gameplayStop(); SDK.happyMoment(); Audio.stopMusic();
    const stage = this.stage;
    this.director.recordWin({ difficulty: this.lastDifficulty, timeMs: data.timeMs, par: this.levelData.parTimeMs, coins: data.coins, coinTotal: data.coinTotal, deaths: this.deathsThisStage });
    const base = this.run.coinValue;
    const finish = ECON.finishBonus(stage);
    const perfect = (data.coins >= data.coinTotal && data.coinTotal > 0) ? ECON.perfectBonus : 0;
    const beatPar = data.timeMs <= this.levelData.parTimeMs; const medal = beatPar ? 25 : 0;
    let chest = 0; if (stage % ECON.chestEvery === 0) chest = ECON.chestCoins(stage);
    let awarded = base + finish + perfect + medal + chest;

    S.recordLevelResult(stage, { stars: data.stars, coins: data.coins, timeMs: data.timeMs });
    S.unlockNextLevel(stage); S.addCoins(awarded); S.bump('wins'); this.winsSinceAd++;
    this.lastWin = { awarded, doubled: false };

    this.ui.setCoinBalance(S.get().coins);
    this.ui.showWin({ ...data, coinsAwarded: awarded, beatPar }, {
      canDouble: true,
      onDouble: () => this._doubleCoins(),
      onNext: () => this._next(),
      onReplay: () => this.startStage(stage, {}),
      onMenu: () => this.toMenu(),
    });
    if (chest) this.ui.toast(`🎁 Chest! +${chest} coins`, 2200);
    else if (perfect) this.ui.toast('Perfect! All coins ✨', 2000);
    else if (beatPar) this.ui.toast('⏱ Time medal!', 1700);
  }
  async _doubleCoins() {
    if (this.lastWin.doubled) return;
    const ok = await SDK.rewardedBreak();
    if (ok) { S.addCoins(this.lastWin.awarded); this.lastWin.doubled = true; this.ui.setWinCoins(this.lastWin.awarded * 2); this.ui.setCoinBalance(S.get().coins); this.ui.disableDouble(); Audio.powerup(); this.ui.toast('Coins doubled! 🤑'); }
    else this.ui.toast('Ad not available');
  }
  async _next() {
    const stage = this.stage + 1;
    // interstitial only at a calm moment (never when the player is at risk)
    if (this.winsSinceAd >= 3 && stage > 5 && this.director.churn().zone === 'green') { this.winsSinceAd = 0; await SDK.commercialBreak(); }
    this.startStage(stage, {});
  }

  // ---- lose ----
  _onDie(reason, info) {
    SDK.gameplayStop(); Audio.stopMusic(); S.bump('deaths'); this.deathsThisStage++;
    this.director.recordLoss({ difficulty: this.lastDifficulty, timeMs: this.game.clockMs, deathSpot: info, nearFinish: info?.nearFinish });
    this.ui.showLose(reason, {
      nearFinish: info?.nearFinish,
      canRevive: !this.revivedThisRun,
      canSkip: this.deathsThisStage >= 3,
      onRevive: () => this._revive(),
      onSkip: () => this._skip(),
      onRetry: () => this.startStage(this.stage, { retry: true }),
      onMenu: () => this.toMenu(),
    });
  }
  async _revive() {
    const ok = await SDK.rewardedBreak(); if (!ok) { this.ui.toast('Ad not available'); return; }
    this.revivedThisRun = true; this.ui.hideOverlays(); this.ui.showHUD(true);
    if (S.get().settings.music) Audio.startMusic();
    this.game.revive(); SDK.gameplayStart(); this.ui.toast('Revived! 🛡️ Shielded');
  }
  async _skip() {
    const ok = await SDK.rewardedBreak(); if (!ok) { this.ui.toast('Ad not available'); return; }
    S.unlockNextLevel(this.stage); this.ui.toast('Level skipped'); this.startStage(this.stage + 1, {});
  }

  // ---- engine callbacks ----
  _gameCallbacks() {
    return {
      onHud: (h) => this.ui.updateHUD({ level: this.stage, ...h }),
      onCoin: (collected, val, combo) => { this.run.coinValue += val; this.director.noteMove(); if (combo >= 3) this.ui.combo(combo); },
      onPowerupStart: (def) => this.ui.toast(`${def.icon || '★'} ${def.name}`, 1400),
      onPowerups: (list) => this.ui.powerups(list),
      onPowerupEnd: () => {},
      onWin: (d) => this._onWin(d),
      onDie: (r, info) => this._onDie(r, info),
      onSfx: (name, arg) => this._sfx(name, arg),
      onGoldRush: (on) => this.ui.goldRush(on),
      onFinishArrow: (info) => this.ui.finishArrow(info),
      onIdle: () => this.director.noteIdle(),
      onActive: () => this.director.noteMove(),
    };
  }
  _sfx(name, arg) {
    const map = {
      coin: () => Audio.coin(arg || 0), boost: Audio.boost, bounce: Audio.bounce, powerup: Audio.powerup,
      shieldHit: Audio.shieldHit, die: Audio.die, win: Audio.win, gold: Audio.gold, portal: Audio.portal,
      star: () => Audio.star(arg || 0), uiClick: Audio.uiClick, uiBack: Audio.uiBack,
    };
    (map[name] || (() => {}))();
  }

  // ---- UI handlers ----
  _wireHandlers() {
    this.ui.setHandlers({
      sfx: (n, a) => this._sfx(n, a),
      play: () => this.play(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      restart: () => this.restart(),
      toMenu: () => this.toMenu(),
      calibrate: () => this.input.calibrate(),
      boost: (on) => this.input.setTouchBoost(on),
      enableTilt: async () => { const ok = await this.input.requestTilt(); S.setSetting('control', ok ? 'tilt' : 'touch'); if (!ok) { this.input.setMode('touch'); this.ui.toast('Using touch controls'); } this._resumePendingStart(); },
      useTouch: () => { this.input.setMode('touch'); S.setSetting('control', 'touch'); this._resumePendingStart(); },
      buySkin: (id) => this._buy('skin', id),
      buyTrail: (id) => this._buy('trail', id),
      equipSkin: (id) => { S.equipSkin(id); this.game.applySkin(this._skinDef()); },
      equipTrail: (id) => { S.equipTrail(id); this.game.applyTrail(this._trailDef()); },
      claimDaily: () => S.claimDaily(),
      setSetting: (k, v) => this._setSetting(k, v),
    });
  }
  _resumePendingStart() {
    this.ui.enterGame(); this.ui.powerups([]); this.ui.finishArrow({ visible: false }); this.ui.goldRush(false);
    this._updateControlUI(); this._beginPlay(this.pendingPlan || { mods: this.lastMods });
  }

  _buy(kind, id) {
    const list = kind === 'skin' ? SKINS : TRAILS; const item = list.find(x => x.id === id); if (!item) return false;
    const owns = kind === 'skin' ? S.ownsSkin(id) : S.ownsTrail(id); if (owns) return true;
    if (!S.spendCoins(item.price)) return false;
    if (kind === 'skin') { S.unlockSkin(id); S.equipSkin(id); this.game.applySkin(this._skinDef()); }
    else { S.unlockTrail(id); S.equipTrail(id); this.game.applyTrail(this._trailDef()); }
    this.ui.setCoinBalance(S.get().coins); this.ui.toast(`Unlocked ${item.name}!`); return true;
  }
  _setSetting(key, val) {
    S.setSetting(key, val);
    if (key === 'sound' || key === 'music') { Audio.setEnabled({ [key]: val }); if (key === 'music' && val && this.game.state === 'playing') Audio.startMusic(); }
    if (key === 'control') { this.input.setMode(val); this._updateControlUI(); }
    if (key === 'tiltSensitivity') this.input.setSensitivity(val);
    if (key === 'quality') this.applyQuality(val);
  }
}

function worldRoot(id) { return ({ meadow: 261, canyon: 233, jungle: 220, candy: 294, ice: 329, ocean: 207, lava: 174, neon: 196, toxic: 246, space: 233 })[id] || 220; }
function worldScale(id) {
  const minorPent = [0, 3, 5, 7, 10], majorPent = [0, 2, 4, 7, 9], lydian = [0, 2, 4, 6, 7], phrygian = [0, 1, 5, 7, 8];
  return ({ meadow: majorPent, canyon: minorPent, jungle: minorPent, candy: majorPent, ice: lydian, ocean: lydian, lava: phrygian, neon: phrygian, toxic: phrygian, space: majorPent })[id] || minorPent;
}

const app = new App(); window.__marble = app; app.boot();
