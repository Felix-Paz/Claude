// =====================================================================
//  ui.js — all DOM screens, HUD, shop, daily, overlays.
//  Pure presentation + input wiring; game logic lives in main.js.
// =====================================================================
import { SKINS, TRAILS, RARITY, POWERUPS, ECON } from './config.js';
import * as S from './storage.js';

const $ = (id) => document.getElementById(id);
const hex = (n) => '#' + ('000000' + (n >>> 0).toString(16)).slice(-6);

export class UI {
  constructor() {
    this.h = {};                  // handlers set by main
    this.shopTab = 'skins';
    this.screens = ['loading', 'menu', 'pause', 'win', 'lose', 'shop', 'daily', 'settings', 'tiltPrompt', 'adCurtain'];
    this._bindStatic();
  }
  setHandlers(h) { this.h = h; }

  // ---- screen management ----
  showScreen(name) {
    for (const s of this.screens) $(s)?.classList.toggle('hidden', s !== name);
    if (name === 'menu') this.refreshMenu();
    if (name === 'shop') this.buildShop(this.shopTab);
  }
  hideOverlays() {
    for (const s of ['pause', 'win', 'lose', 'daily', 'settings', 'tiltPrompt', 'adCurtain']) $(s)?.classList.add('hidden');
  }
  showHUD(on) { $('hud').classList.toggle('hidden', !on); }

  // ---- static bindings ----
  _bindStatic() {
    const click = (id, fn) => { const e = $(id); if (e) e.addEventListener('click', () => { this.h.sfx?.('uiClick'); fn(); }); };
    click('playBtn', () => this.h.play?.());
    click('shopBtn', () => this.showScreen('shop'));
    click('dailyBtn', () => this.showDaily());
    click('settingsBtn', () => this.showSettings());
    click('shopBackBtn', () => this.showScreen('menu'));
    click('pauseBtn', () => this.h.pause?.());
    click('resumeBtn', () => this.h.resume?.());
    click('restartBtn', () => this.h.restart?.());
    click('pauseMenuBtn', () => this.h.toMenu?.());
    click('settingsCloseBtn', () => this.hideOverlays());
    click('dailyCloseBtn', () => this.hideOverlays());
    click('calibrateBtn', () => { this.h.calibrate?.(); this.toast('Tilt calibrated'); });
    click('resetBtn', () => { if (confirm('Reset all progress, coins and unlocks?')) { S.hardReset(); this.refreshMenu(); this.buildShop(this.shopTab); this.toast('Progress reset'); } });
    click('tiltEnableBtn', () => this.h.enableTilt?.());
    click('tiltTouchBtn', () => this.h.useTouch?.());

    // shop tabs
    document.querySelectorAll('.shop-tabs .tab').forEach(t => t.addEventListener('click', () => {
      this.h.sfx?.('uiClick');
      document.querySelectorAll('.shop-tabs .tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active'); this.shopTab = t.dataset.tab; this.buildShop(this.shopTab);
    }));

    // settings controls
    $('setSound').addEventListener('change', e => this.h.setSetting?.('sound', e.target.checked));
    $('setMusic').addEventListener('change', e => this.h.setSetting?.('music', e.target.checked));
    $('setSens').addEventListener('input', e => { $('sensVal').textContent = (+e.target.value).toFixed(1); this.h.setSetting?.('tiltSensitivity', +e.target.value); });
    this._seg('setControl', v => this.h.setSetting?.('control', v));
    this._seg('setQuality', v => this.h.setSetting?.('quality', v));

    // boost button (touch)
    const bb = $('boostBtn');
    const on = (e) => { e.preventDefault(); this.h.boost?.(true); };
    const off = (e) => { e.preventDefault(); this.h.boost?.(false); };
    bb.addEventListener('touchstart', on, { passive: false });
    bb.addEventListener('touchend', off, { passive: false });
    bb.addEventListener('mousedown', on);
    bb.addEventListener('mouseup', off);
    bb.addEventListener('mouseleave', off);
  }
  _seg(id, fn) {
    const wrap = $(id);
    wrap.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      this.h.sfx?.('uiClick');
      wrap.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); fn(b.dataset.v);
    }));
  }
  setSeg(id, v) {
    $(id)?.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.v === v));
  }

  // ---- menu ----
  refreshMenu() {
    const st = S.get();
    $('menuCoins').textContent = fmt(st.coins);
    $('shopCoins').textContent = fmt(st.coins);
    $('menuStars').textContent = S.totalStars();
    const d = S.dailyStatus();
    $('dailyDot').classList.toggle('hidden', !d.claimable);
    $('playLabel').textContent = st.maxLevel > 1 ? `PLAY · Lv ${st.maxLevel}` : 'PLAY';
  }
  setMenuWorld(name) { $('menuWorld').textContent = name; }
  setProvider(p) { $('menuProvider').textContent = p === 'none' ? 'standalone' : p; }
  setCoinBalance(n) { $('menuCoins').textContent = fmt(n); $('shopCoins').textContent = fmt(n); }

  // ---- HUD ----
  updateHUD(s) {
    $('hudLevel').textContent = 'Level ' + s.level;
    $('hudCoins').textContent = `${s.coins}/${s.coinTotal}`;
    $('hudTime').textContent = (s.timeMs / 1000).toFixed(1);
    const pct = Math.min(100, (s.speed / (s.maxSpeed * 1.75)) * 100);
    $('speedBar').style.width = pct + '%';
    $('boostFlare').classList.toggle('on', !!s.boosting);
  }
  setControlHint(text) { const e = $('controlHint'); e.textContent = text; }
  fadeControlHint() { const e = $('controlHint'); e.style.opacity = '0'; }
  showControlHint() { const e = $('controlHint'); e.style.opacity = ''; }
  showBoostButton(on) { $('boostBtn').classList.toggle('hidden', !on); }

  powerups(list) {
    const wrap = $('powerupChips'); wrap.innerHTML = '';
    for (const p of list) {
      const def = p.def || POWERUPS[p.id] || { icon: '★', name: p.id, dur: 1 };
      const el = document.createElement('div'); el.className = 'pu-chip';
      const frac = Math.max(0, Math.min(1, p.t / (def.dur || 1)));
      el.innerHTML = `<span class="ico">${def.icon || '★'}</span><span>${(def.name || p.id)}</span>
        <span class="bar" style="width:${frac * 100}%;background:${hex(def.color || 0x21f3ff)}"></span>`;
      wrap.appendChild(el);
    }
  }

  // ---- win ----
  showWin(data, opts) {
    this.showScreen('win');
    // stars
    const spans = $('winStars').children;
    for (let i = 0; i < 3; i++) {
      spans[i].classList.remove('on');
      if (i < data.stars) setTimeout(() => { spans[i].classList.add('on'); this.h.sfx?.('star', i); }, 250 + i * 260);
    }
    $('winCoins').textContent = '+' + data.coinsAwarded;
    $('winTime').textContent = (data.timeMs / 1000).toFixed(1) + 's';
    $('winTimeNote').textContent = data.beatPar ? 'time ⏱ medal!' : 'time';
    const db = $('doubleBtn');
    db.classList.toggle('hidden', !opts.canDouble);
    db.onclick = () => { this.h.sfx?.('uiClick'); opts.onDouble?.(); };
    $('nextBtn').onclick = () => { this.h.sfx?.('uiClick'); opts.onNext?.(); };
    $('replayBtn').onclick = () => { this.h.sfx?.('uiClick'); opts.onReplay?.(); };
    $('winMenuBtn').onclick = () => { this.h.sfx?.('uiClick'); opts.onMenu?.(); };
  }
  setWinCoins(n) { $('winCoins').textContent = '+' + n; }
  disableDouble() { $('doubleBtn').classList.add('hidden'); }

  // ---- lose ----
  showLose(reason, opts) {
    this.showScreen('lose');
    const lines = {
      hole: ['So close!', 'Wrong hole — watch the rims.'],
      hazard: ['Ouch!', 'A hazard got you.'],
      default: ['So close!', 'You almost had it.'],
    };
    const [t, sub] = lines[reason] || lines.default;
    $('loseTitle').textContent = t; $('loseSub').textContent = sub;
    const rv = $('reviveBtn');
    rv.classList.toggle('hidden', !opts.canRevive);
    rv.onclick = () => { this.h.sfx?.('uiClick'); opts.onRevive?.(); };
    $('retryBtn').onclick = () => { this.h.sfx?.('uiClick'); opts.onRetry?.(); };
    $('loseMenuBtn').onclick = () => { this.h.sfx?.('uiClick'); opts.onMenu?.(); };
  }

  // ---- shop ----
  buildShop(tab) {
    const grid = $('shopGrid'); grid.innerHTML = '';
    $('shopCoins').textContent = fmt(S.get().coins);
    if (tab === 'skins') {
      [...SKINS].sort((a, b) => (RARITY[a.rarity].order - RARITY[b.rarity].order) || (a.price - b.price))
        .forEach(s => grid.appendChild(this._skinCard(s)));
    } else {
      TRAILS.forEach(t => grid.appendChild(this._trailCard(t)));
    }
  }
  _skinCard(s) {
    const owned = S.ownsSkin(s.id), equipped = S.get().skin === s.id;
    const c = document.createElement('div'); c.className = 'card' + (owned ? ' owned-glow' : '');
    const r = RARITY[s.rarity];
    const glow = s.mat.emissive && s.mat.emissiveInt ? `,0 0 22px ${hex(s.mat.emissive)}` : '';
    const sw = `background:radial-gradient(circle at 32% 28%, #ffffffcc, ${hex(s.mat.color)} 52%, #00000055);box-shadow:inset -8px -10px 16px rgba(0,0,30,.45),0 8px 18px rgba(0,0,0,.4)${glow}`;
    c.innerHTML = `
      ${s.rarity === 'legendary' ? '<div class="ribbon">RARE</div>' : ''}
      <div class="swatch" style="${sw}"></div>
      <div class="cname">${s.name}</div>
      <div class="rarity" style="color:${r.color};background:${r.color}22">${r.label}</div>
      ${owned ? '' : `<div class="price"><span class="dot gold"></span>${fmt(s.price)}</div>`}`;
    const btn = document.createElement('button');
    if (equipped) { btn.className = 'cbtn equipped'; btn.textContent = 'Equipped'; }
    else if (owned) { btn.className = 'cbtn equip'; btn.textContent = 'Equip'; btn.onclick = () => { this.h.equipSkin?.(s.id); this.buildShop('skins'); this.h.sfx?.('uiClick'); }; }
    else {
      const afford = S.get().coins >= s.price;
      btn.className = 'cbtn ' + (afford ? 'buy' : 'locked');
      btn.textContent = afford ? 'Buy' : 'Need coins';
      btn.onclick = () => { if (this.h.buySkin?.(s.id)) { this.buildShop('skins'); this.h.sfx?.('powerup'); } else { this.toast('Not enough coins'); this.h.sfx?.('uiBack'); } };
    }
    c.appendChild(btn); return c;
  }
  _trailCard(t) {
    const owned = S.ownsTrail(t.id), equipped = S.get().trail === t.id;
    const c = document.createElement('div'); c.className = 'card' + (owned ? ' owned-glow' : '');
    const sw = t.rainbow
      ? 'background:conic-gradient(#ff4d8d,#ffd23a,#3ddc84,#21f3ff,#b06bff,#ff4d8d)'
      : `background:radial-gradient(circle at 40% 35%, #fff, ${hex(t.color)} 70%)`;
    c.innerHTML = `
      <div class="swatch" style="${sw};box-shadow:0 0 22px ${hex(t.color)}aa"></div>
      <div class="cname">${t.name}</div>
      <div class="rarity" style="color:var(--c1);background:#21f3ff22">Trail</div>
      ${owned ? '' : `<div class="price"><span class="dot gold"></span>${fmt(t.price)}</div>`}`;
    const btn = document.createElement('button');
    if (equipped) { btn.className = 'cbtn equipped'; btn.textContent = 'Equipped'; }
    else if (owned) { btn.className = 'cbtn equip'; btn.textContent = 'Equip'; btn.onclick = () => { this.h.equipTrail?.(t.id); this.buildShop('trails'); this.h.sfx?.('uiClick'); }; }
    else {
      const afford = S.get().coins >= t.price;
      btn.className = 'cbtn ' + (afford ? 'buy' : 'locked');
      btn.textContent = afford ? 'Buy' : 'Need coins';
      btn.onclick = () => { if (this.h.buyTrail?.(t.id)) { this.buildShop('trails'); this.h.sfx?.('powerup'); } else { this.toast('Not enough coins'); this.h.sfx?.('uiBack'); } };
    }
    c.appendChild(btn); return c;
  }

  // ---- daily ----
  showDaily() {
    this.showScreen('daily');
    const d = S.dailyStatus();
    $('dailyStreak').innerHTML = `Current streak: <b>${d.streak}</b> day${d.streak === 1 ? '' : 's'}`;
    const grid = $('dailyGrid'); grid.innerHTML = '';
    for (let i = 0; i < ECON.daily.length; i++) {
      const cell = document.createElement('div');
      const isChest = ((i + 1) % ECON.dailySkinAt) === 0;
      cell.className = 'daily-cell' + (isChest ? ' chest' : '');
      const isToday = d.claimable && i === d.dayInCycle;
      const claimed = i < d.dayInCycle || (!d.claimable && i <= d.dayInCycle);
      if (isToday) cell.classList.add('today');
      else if (claimed) cell.classList.add('claimed');
      cell.innerHTML = `Day ${i + 1}<b>${isChest ? '🎁' : '+' + ECON.daily[i]}</b>`;
      grid.appendChild(cell);
    }
    const btn = $('claimBtn');
    btn.disabled = !d.claimable;
    btn.textContent = d.claimable ? `Claim +${d.reward}${d.isChest ? ' 🎁' : ''}` : 'Come back tomorrow';
    btn.style.opacity = d.claimable ? '1' : '.5';
    btn.onclick = () => {
      if (!d.claimable) return;
      this.h.sfx?.('powerup');
      const res = this.h.claimDaily?.();
      this.refreshMenu();
      if (res) { this.toast(`+${res.reward} coins! Streak ${res.nextStreak} 🔥`); }
      this.showDaily();
    };
  }

  // ---- settings ----
  showSettings() {
    this.showScreen('settings');
    const st = S.get();
    $('setSound').checked = st.settings.sound;
    $('setMusic').checked = st.settings.music;
    $('setSens').value = st.settings.tiltSensitivity; $('sensVal').textContent = (+st.settings.tiltSensitivity).toFixed(1);
    this.setSeg('setControl', st.settings.control);
    this.setSeg('setQuality', st.settings.quality);
  }

  // ---- transient ----
  toast(msg, dur = 1800) {
    const t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(this._tT);
    this._tT = setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.classList.add('hidden'), 300); }, dur);
  }
  banner(newLabel, title) {
    const b = $('banner');
    b.innerHTML = `<div class="b-new">${newLabel}</div><div class="b-title">${title}</div>`;
    b.classList.remove('hidden'); requestAnimationFrame(() => b.classList.add('show'));
    clearTimeout(this._bT);
    this._bT = setTimeout(() => { b.classList.remove('show'); setTimeout(() => b.classList.add('hidden'), 350); }, 1900);
  }
  combo(n) {
    if (n < 3) return;
    const c = $('comboPop'); c.textContent = `Combo ×${n}!`;
    c.style.fontSize = Math.min(48, 22 + n * 2) + 'px';
    c.classList.remove('hidden', 'show'); void c.offsetWidth; c.classList.add('show');
  }
  adCurtain(on) { $('adCurtain').classList.toggle('hidden', !on); }
}

function fmt(n) { return n >= 10000 ? (n / 1000).toFixed(1) + 'k' : '' + n; }
