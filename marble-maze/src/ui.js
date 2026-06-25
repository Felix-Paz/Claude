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
    $('hudCoins').textContent = `${s.coins}`;                 // coins are a BONUS, not a goal
    $('hudTime').textContent = (s.timeMs / 1000).toFixed(1);
    // timer turns red when over par for THIS level
    $('hudTimePill').classList.toggle('overtime', s.parMs && s.timeMs > s.parMs);
    const pct = Math.min(100, (s.speed / (s.maxSpeed * 1.8)) * 100);
    $('speedBar').style.width = pct + '%';
    $('boostFlare').classList.toggle('on', !!s.boosting);
  }

  // ---- off-screen GOAL arrow ----
  finishArrow(info) {
    const el = $('goalArrow');
    if (!info || !info.visible) { el.classList.remove('show'); return; }
    el.classList.add('show');
    const vw = window.innerWidth, vh = window.innerHeight;
    const vx = info.x, vy = -info.y;                          // NDC -> screen dir
    const ang = Math.atan2(vy, vx);
    const R = Math.min(vw, vh) * 0.34;
    el.style.left = (vw / 2 + Math.cos(ang) * R) + 'px';
    el.style.top = (vh / 2 + Math.sin(ang) * R) + 'px';
    el.querySelector('span').style.transform = `rotate(${ang + Math.PI / 2}rad)`;
  }

  goldRush(on) {
    document.body.classList.toggle('goldrush', on);
    if (on) this.banner('🔥 GOD MODE 🔥', 'GOLD RUSH!');
  }

  // cool menu/shop exit -> reveal the game, then show HUD (fixes lingering logo)
  enterGame() {
    const open = this.screens.map(s => $(s)).find(e => e && !e.classList.contains('hidden'));
    const done = () => { for (const s of this.screens) $(s)?.classList.add('hidden'); this.showHUD(true); };
    if (open) { open.classList.add('screen-exit'); setTimeout(() => { open.classList.remove('screen-exit'); done(); }, 340); }
    else done();
  }

  surprise(text, sub) { this.banner(text, sub); }
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
      hole: ['So close!', 'That hole was RED — avoid red!'],
      hazard: ['So close!', 'Red means danger. Time it next try.'],
      default: ['So close!', 'You almost had it.'],
    };
    let [t, sub] = lines[reason] || lines.default;
    if (opts.nearFinish) { t = 'SO close!'; sub = 'You were almost at the goal — one more try!'; }
    $('loseTitle').textContent = t; $('loseSub').textContent = sub;
    const rv = $('reviveBtn');
    rv.classList.toggle('hidden', !opts.canRevive);
    rv.onclick = () => { this.h.sfx?.('uiClick'); opts.onRevive?.(); };
    const sk = $('skipBtn');
    sk.classList.toggle('hidden', !opts.canSkip);
    sk.onclick = () => { this.h.sfx?.('uiClick'); opts.onSkip?.(); };
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
    const r = RARITY[s.rarity];
    const c = document.createElement('div');
    c.className = 'card rar-' + s.rarity + (equipped ? ' equipped-card' : '');
    c.style.setProperty('--rc', r.color);
    const tag = document.createElement('div'); tag.className = 'card-rarity'; tag.textContent = r.label; c.appendChild(tag);
    const disc = document.createElement('div'); disc.className = 'card-disc';
    disc.appendChild(skinSwatch(s)); c.appendChild(disc);
    const nm = document.createElement('div'); nm.className = 'cname'; nm.textContent = s.name; c.appendChild(nm);
    const btn = document.createElement('button');
    if (equipped) { btn.className = 'cbtn equipped'; btn.textContent = '✓ Equipped'; }
    else if (owned) { btn.className = 'cbtn equip'; btn.textContent = 'Equip'; btn.onclick = () => { this.h.equipSkin?.(s.id); this.buildShop('skins'); this.h.sfx?.('uiClick'); }; }
    else {
      const afford = S.get().coins >= s.price;
      btn.className = 'cbtn ' + (afford ? 'buy' : 'locked');
      btn.innerHTML = `<span class="dot gold"></span> ${fmt(s.price)}`;
      btn.onclick = () => { if (this.h.buySkin?.(s.id)) { this.buildShop('skins'); this.h.sfx?.('powerup'); } else { this.toast('Not enough coins'); this.h.sfx?.('uiBack'); } };
    }
    c.appendChild(btn); return c;
  }
  _trailCard(t) {
    const owned = S.ownsTrail(t.id), equipped = S.get().trail === t.id;
    const c = document.createElement('div'); c.className = 'card rar-rare' + (equipped ? ' equipped-card' : '');
    c.style.setProperty('--rc', '#3fa9ff');
    const tag = document.createElement('div'); tag.className = 'card-rarity'; tag.textContent = 'Trail'; c.appendChild(tag);
    const disc = document.createElement('div'); disc.className = 'card-disc';
    const sw = document.createElement('div'); sw.className = 'swatch';
    sw.style.cssText = t.rainbow
      ? 'background:conic-gradient(#ff4d8d,#ffd23a,#3ddc84,#21f3ff,#b06bff,#ff4d8d)'
      : `background:radial-gradient(circle at 40% 35%, #fff, ${hex(t.color)} 70%);box-shadow:0 0 22px ${hex(t.color)}aa`;
    disc.appendChild(sw); c.appendChild(disc);
    const nm = document.createElement('div'); nm.className = 'cname'; nm.textContent = t.name; c.appendChild(nm);
    const btn = document.createElement('button');
    if (equipped) { btn.className = 'cbtn equipped'; btn.textContent = '✓ Equipped'; }
    else if (owned) { btn.className = 'cbtn equip'; btn.textContent = 'Equip'; btn.onclick = () => { this.h.equipTrail?.(t.id); this.buildShop('trails'); this.h.sfx?.('uiClick'); }; }
    else {
      const afford = S.get().coins >= t.price;
      btn.className = 'cbtn ' + (afford ? 'buy' : 'locked');
      btn.innerHTML = `<span class="dot gold"></span> ${fmt(t.price)}`;
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

// Draw a small circular marble preview for the shop (real-ish per skin).
function skinSwatch(s) {
  const c = document.createElement('canvas'); c.width = c.height = 120; c.className = 'swatch-canvas';
  const x = c.getContext('2d'); const R = 56, cx = 60, cy = 60;
  x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip();
  const base = hex(s.mat.color);
  const paint = (fn) => { fn(); };
  const fillBg = (col) => { x.fillStyle = col; x.fillRect(0, 0, 120, 120); };
  const dot = (px, py, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); };
  switch (s.tex) {
    case 'beach': { fillBg('#fff'); const cols = ['#ff4d6d', '#ffd23a', '#4dd4ff', '#5be37a', '#b06bff']; for (let i = 0; i < 5; i++) { x.fillStyle = cols[i]; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, 120, i / 5 * 7, (i + 1) / 5 * 7); x.closePath(); x.fill(); } break; }
    case 'smiley': fillBg('#ffd23a'); dot(46, 50, 8, '#23201a'); dot(74, 50, 8, '#23201a'); x.strokeStyle = '#23201a'; x.lineWidth = 7; x.beginPath(); x.arc(60, 64, 22, 0.2, Math.PI - 0.2); x.stroke(); break;
    case 'eight': fillBg('#111'); dot(60, 52, 22, '#fff'); x.fillStyle = '#111'; x.font = 'bold 30px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('8', 60, 54); break;
    case 'soccer': fillBg('#fff'); x.fillStyle = '#111'; for (let i = 0; i < 6; i++) { const a = i / 6 * 7; pentS(x, 60 + Math.cos(a) * 34, 60 + Math.sin(a) * 34, 10, a); } pentS(x, 60, 60, 11, 0); break;
    case 'basket': fillBg('#e0692a'); x.strokeStyle = '#1a1008'; x.lineWidth = 4; x.beginPath(); x.moveTo(4, 60); x.lineTo(116, 60); x.moveTo(60, 4); x.lineTo(60, 116); x.stroke(); x.beginPath(); x.arc(8, 60, 56, -1, 1); x.stroke(); x.beginPath(); x.arc(112, 60, 56, Math.PI - 1, Math.PI + 1); x.stroke(); break;
    case 'melon': fillBg('#3aa052'); x.fillStyle = '#1f6e36'; for (let i = 0; i < 7; i++) x.fillRect(i * 17 + 4, 0, 5, 120); break;
    case 'disco': for (let yy = 0; yy < 10; yy++) for (let xx = 0; xx < 10; xx++) { x.fillStyle = (xx + yy) % 2 ? '#cdd6e6' : '#8e9bb3'; x.fillRect(xx * 12, yy * 12, 11, 11); } break;
    case 'planet': { const cols = ['#d9a05a', '#caa24a', '#e0b070', '#b88840']; for (let i = 0; i < 8; i++) { x.fillStyle = cols[i % 4]; x.fillRect(0, i * 15, 120, 15); } break; }
    case 'galaxy': fillBg('#140a2a'); for (let i = 0; i < 90; i++) { const a = i * 0.5, r = i * 0.55; x.fillStyle = i % 5 ? '#fff' : '#9a6bff'; x.globalAlpha = Math.random(); x.fillRect(60 + Math.cos(a) * r * 0.32, 60 + Math.sin(a) * r * 0.32, 2, 2); } x.globalAlpha = 1; break;
    case 'slime': fillBg('#9bff2a'); for (let i = 0; i < 8; i++) dot(Math.random() * 120, Math.random() * 120, 6 + Math.random() * 9, '#5fb81a'); break;
    default: { // PBR look
      const g = x.createRadialGradient(44, 40, 6, 60, 60, 64);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, base); g.addColorStop(1, '#00000066');
      x.fillStyle = g; x.fillRect(0, 0, 120, 120);
      if (s.mat.metalness >= 0.9) { x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0, 78, 120, 10); }
    }
  }
  // glossy highlight
  const hl = x.createRadialGradient(44, 38, 2, 48, 42, 40); hl.addColorStop(0, 'rgba(255,255,255,.85)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = hl; x.beginPath(); x.arc(48, 42, 30, 0, 7); x.fill();
  x.restore();
  if (s.ring) { x.strokeStyle = '#e8c98a'; x.lineWidth = 6; x.save(); x.translate(cx, cy); x.rotate(-0.4); x.scale(1, 0.32); x.beginPath(); x.arc(0, 0, 52, 0, 7); x.stroke(); x.restore(); }
  return c;
}
function pentS(x, cx, cy, r, rot) { x.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i / 5 * Math.PI * 2; const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); x.fill(); }
