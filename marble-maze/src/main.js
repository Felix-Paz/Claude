// =====================================================================
//  main.js — bootstrap + game state machine.
//  Wires the engine (game.js), UI, storage, input, audio and ad SDK
//  into the full play loop with retention systems layered on top.
// =====================================================================
import { Game } from './game.js';
import { UI } from './ui.js';
import { Input } from './input.js';
import * as Audio from './audio.js';
import * as SDK from './sdk.js';
import * as S from './storage.js';
import { generateLevel } from './levels.js';
import {
  SKINS, TRAILS, ECON, LEVELS_PER_WORLD,
  worldForLevel, newMechanicAt, worldIndexForLevel,
} from './config.js';

class App {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ui = new UI();
    this.input = new Input();
    this.game = new Game(this.canvas);
    this.currentLevel = 1;
    this.levelData = null;
    this.run = { coinValue: 0 };
    this.revivedThisRun = false;
    this.winsSinceAd = 0;
    this.lastWin = null;
    this.pendingStart = null;     // level waiting on tilt permission choice
    this._last = performance.now();
  }

  async boot() {
    S.load();
    const st = S.get();

    // settings -> systems
    Audio.setEnabled({ sound: st.settings.sound, music: st.settings.music });
    this.input.setMode(st.settings.control);
    this.input.setSensitivity(st.settings.tiltSensitivity);
    this.input.attach();
    this.input.bindTouchSurface(this.canvas);
    this.applyQuality(st.settings.quality);

    // unlock audio on first gesture (autoplay policy)
    const unlock = () => { Audio.resume(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    this._wireHandlers();
    this.game.setCallbacks(this._gameCallbacks());

    // SDK
    SDK.setAdStateHandler((on) => this.ui.adCurtain(on));
    SDK.loadingStart();
    const provider = await SDK.init();
    this.ui.setProvider(provider);
    SDK.loadingFinished();

    // backdrop scene behind the menu
    this._loadShowcase();

    this.ui.refreshMenu();
    this.ui.setMenuWorld(worldForLevel(st.maxLevel).name);
    this.ui.showScreen('menu');

    // RAF
    requestAnimationFrame(this._loop);
  }

  _loop = (now) => {
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this.input.update(dt);
    this.game.update(dt, this.input);
    requestAnimationFrame(this._loop);
  };

  applyQuality(q) {
    if (q === 'low') this.game.setQuality('low');
    else if (q === 'high') this.game.setQuality('high');
    else { // auto: be conservative on small/hi-dpr touch screens
      const heavy = (window.innerWidth * window.innerHeight) > 2_500_000 && (window.devicePixelRatio || 1) > 2;
      this.game.setQuality(heavy ? 'low' : 'high');
    }
  }

  // ---- backdrop ----
  _loadShowcase() {
    const lvl = S.get().maxLevel;
    this.levelData = generateLevel(lvl);
    this.game.loadLevel(this.levelData, this._skinDef(), this._trailDef());
    this.game.state = 'idle';
  }

  _skinDef() { return SKINS.find(s => s.id === S.get().skin) || SKINS[0]; }
  _trailDef() { return TRAILS.find(t => t.id === S.get().trail) || TRAILS[0]; }

  // ---- control display ----
  _updateControlUI() {
    const mode = this.input.activeMode;
    const hint = mode === 'keys' ? 'WASD / Arrows  ·  hold Shift to boost'
      : mode === 'tilt' ? 'Tilt your device to steer  ·  hold BOOST'
        : 'Drag anywhere to steer  ·  hold BOOST';
    this.ui.setControlHint(hint);
    this.ui.showControlHint();
    this.ui.showBoostButton(mode !== 'keys');
    clearTimeout(this._hintT);
    this._hintT = setTimeout(() => this.ui.fadeControlHint(), 4200);
  }

  // ---- level flow ----
  play() { this.startLevel(S.get().maxLevel); }

  startLevel(n) {
    this.currentLevel = n;
    this.levelData = generateLevel(n);
    this.run = { coinValue: 0 };
    this.revivedThisRun = false;
    S.bump('runs');

    this.game.loadLevel(this.levelData, this._skinDef(), this._trailDef());
    this.game.beginResolveReset();

    // music per world
    const world = this.levelData.world;
    Audio.configureMusic(worldScale(world.id), worldRoot(world.id));
    if (S.get().settings.music) Audio.startMusic();

    this.ui.hideOverlays();
    this.ui.showHUD(true);
    this.ui.powerups([]);
    this._updateControlUI();

    // On touch devices wanting tilt but not yet permitted, ask once.
    const wantTilt = (this.input.mode === 'auto' || this.input.mode === 'tilt');
    if (this.input.isTouchDevice() && wantTilt && this.input.tiltAvailable && !this.input.tiltPermitted) {
      this.pendingStart = n;
      this.ui.showScreen('tiltPrompt');
      return;
    }
    this._beginPlay();
  }

  _beginPlay() {
    if (this.input.activeMode === 'tilt') this.input.calibrate();
    this.input.reset();
    this.game.start();
    SDK.gameplayStart();

    // novelty signposting
    const n = this.currentLevel;
    const worldChanged = (n - 1) % LEVELS_PER_WORLD === 0 && n > 1;
    const nm = newMechanicAt(n);
    if (worldChanged) {
      this.ui.banner('NEW WORLD', this.levelData.world.name);
      this.ui.toast(this.levelData.world.blurb, 2200);
    } else if (nm && !S.hasSeenMechanic(nm.key)) {
      this.ui.banner('NEW!', nm.label);
      S.markMechanicSeen(nm.key);
    } else {
      this.ui.banner('LEVEL ' + n, this.levelData.world.name);
    }
    this.ui.setMenuWorld(this.levelData.world.name);
  }

  pause() {
    if (this.game.state !== 'playing') return;
    this.game.pause(); SDK.gameplayStop();
    this.ui.showScreen('pause');
  }
  resume() {
    this.ui.hideOverlays(); this.ui.showHUD(true);
    this.game.resume(); SDK.gameplayStart();
  }
  restart() {
    this.ui.hideOverlays();
    this.startLevel(this.currentLevel);
  }
  toMenu() {
    SDK.gameplayStop();
    Audio.stopMusic();
    this.game.state = 'idle';
    this.ui.showHUD(false);
    this.ui.showScreen('menu');
    this.ui.refreshMenu();
  }

  // ---- win ----
  _onWin(data) {
    SDK.gameplayStop(); SDK.happyMoment();
    Audio.stopMusic();
    const lvl = this.currentLevel;
    const base = this.run.coinValue;
    const finish = ECON.finishBonus(lvl);
    const perfect = (data.coins >= data.coinTotal && data.coinTotal > 0) ? ECON.perfectBonus : 0;
    const beatPar = data.timeMs <= this.levelData.parTimeMs;
    const medal = beatPar ? 25 : 0;
    let awarded = base + finish + perfect + medal;

    S.recordLevelResult(lvl, { stars: data.stars, coins: data.coins, timeMs: data.timeMs });
    S.unlockNextLevel(lvl);
    S.addCoins(awarded);
    S.bump('wins');
    this.winsSinceAd++;
    this.lastWin = { awarded, doubled: false };

    this.ui.setCoinBalance(S.get().coins);
    this.ui.showWin({ ...data, coinsAwarded: awarded, beatPar }, {
      canDouble: true,
      onDouble: () => this._doubleCoins(),
      onNext: () => this._next(),
      onReplay: () => this.startLevel(lvl),
      onMenu: () => this.toMenu(),
    });
    if (perfect) this.ui.toast('Perfect! All coins collected ✨', 2200);
    else if (beatPar) this.ui.toast('⏱ Time medal!', 1800);
  }

  async _doubleCoins() {
    if (this.lastWin.doubled) return;
    const ok = await SDK.rewardedBreak();
    if (ok) {
      S.addCoins(this.lastWin.awarded);             // +100% => doubled
      this.lastWin.doubled = true;
      this.ui.setWinCoins(this.lastWin.awarded * 2);
      this.ui.setCoinBalance(S.get().coins);
      this.ui.disableDouble();
      Audio.powerup();
      this.ui.toast('Coins doubled! 🤑');
    } else this.ui.toast('Ad not available');
  }

  async _next() {
    const lvl = this.currentLevel + 1;
    // interstitial at a natural break, lightly (never on early levels)
    if (this.winsSinceAd >= 3 && lvl > 4) { this.winsSinceAd = 0; await SDK.commercialBreak(); }
    this.startLevel(lvl);
  }

  // ---- lose ----
  _onDie(reason) {
    SDK.gameplayStop();
    Audio.stopMusic();
    S.bump('deaths');
    this.ui.showLose(reason, {
      canRevive: !this.revivedThisRun,
      onRevive: () => this._revive(),
      onRetry: () => this.startLevel(this.currentLevel),
      onMenu: () => this.toMenu(),
    });
  }
  async _revive() {
    const ok = await SDK.rewardedBreak();
    if (!ok) { this.ui.toast('Ad not available'); return; }
    this.revivedThisRun = true;
    this.ui.hideOverlays(); this.ui.showHUD(true);
    if (S.get().settings.music) Audio.startMusic();
    this.game.revive();
    SDK.gameplayStart();
    this.ui.toast('Revived! Shielded for a moment 🛡️');
  }

  // ---- engine callbacks ----
  _gameCallbacks() {
    return {
      onHud: (h) => this.ui.updateHUD({ level: this.currentLevel, ...h }),
      onCoin: (collected, val, combo) => { this.run.coinValue += val; if (combo >= 3) this.ui.combo(combo); },
      onPowerupStart: (def) => this.ui.toast(`${def.icon || '★'} ${def.name}`, 1400),
      onPowerups: (list) => this.ui.powerups(list),
      onPowerupEnd: () => {},
      onWin: (d) => this._onWin(d),
      onDie: (r) => this._onDie(r),
      onSfx: (name, arg) => this._sfx(name, arg),
    };
  }
  _sfx(name, arg) {
    const map = {
      coin: () => Audio.coin(arg || 0), boost: Audio.boost, bounce: Audio.bounce,
      powerup: Audio.powerup, shieldHit: Audio.shieldHit, die: Audio.die,
      win: Audio.win, star: () => Audio.star(arg || 0), uiClick: Audio.uiClick, uiBack: Audio.uiBack,
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
      enableTilt: async () => {
        const ok = await this.input.requestTilt();
        S.setSetting('control', ok ? 'tilt' : 'touch');
        if (!ok) { this.input.setMode('touch'); this.ui.toast('Using touch controls'); }
        this._resumePendingStart();
      },
      useTouch: () => {
        this.input.setMode('touch'); S.setSetting('control', 'touch');
        this._resumePendingStart();
      },
      buySkin: (id) => this._buy('skin', id),
      buyTrail: (id) => this._buy('trail', id),
      equipSkin: (id) => { S.equipSkin(id); this.game.applySkin(this._skinDef()); },
      equipTrail: (id) => { S.equipTrail(id); this.game.applyTrail(this._trailDef()); },
      claimDaily: () => S.claimDaily(),
      setSetting: (k, v) => this._setSetting(k, v),
    });
  }

  _resumePendingStart() {
    this.ui.hideOverlays(); this.ui.showHUD(true);
    this._updateControlUI();
    this._beginPlay();
  }

  _buy(kind, id) {
    const list = kind === 'skin' ? SKINS : TRAILS;
    const item = list.find(x => x.id === id);
    if (!item) return false;
    const owns = kind === 'skin' ? S.ownsSkin(id) : S.ownsTrail(id);
    if (owns) return true;
    if (!S.spendCoins(item.price)) return false;
    if (kind === 'skin') { S.unlockSkin(id); S.equipSkin(id); this.game.applySkin(this._skinDef()); }
    else { S.unlockTrail(id); S.equipTrail(id); this.game.applyTrail(this._trailDef()); }
    this.ui.setCoinBalance(S.get().coins);
    this.ui.toast(`Unlocked ${item.name}!`);
    return true;
  }

  _setSetting(key, val) {
    S.setSetting(key, val);
    if (key === 'sound' || key === 'music') {
      Audio.setEnabled({ [key]: val });
      if (key === 'music' && val && this.game.state === 'playing') Audio.startMusic();
    }
    if (key === 'control') { this.input.setMode(val); this._updateControlUI(); }
    if (key === 'tiltSensitivity') this.input.setSensitivity(val);
    if (key === 'quality') this.applyQuality(val);
  }
}

// ---- per-world music palettes (root Hz + scale offsets in semitones) ----
function worldRoot(id) {
  return ({ meadow: 261, jungle: 220, ice: 329, neon: 196, desert: 246, lava: 174, ocean: 207, space: 233 })[id] || 220;
}
function worldScale(id) {
  const minorPent = [0, 3, 5, 7, 10];
  const majorPent = [0, 2, 4, 7, 9];
  const lydian = [0, 2, 4, 6, 7];
  const phrygian = [0, 1, 5, 7, 8];
  return ({ meadow: majorPent, jungle: minorPent, ice: lydian, neon: phrygian, desert: minorPent, lava: phrygian, ocean: lydian, space: majorPent })[id] || minorPent;
}

// ---- go ----
const app = new App();
window.__marble = app;             // handy for debugging
app.boot();
