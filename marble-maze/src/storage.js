import { SKINS, TRAILS, ECON } from './config.js';

const KEY = 'marblemaze.save.v1';

function backend() {
  if (typeof window !== 'undefined' && window.GamePix && window.GamePix.localStorage) return window.GamePix.localStorage;
  return (typeof localStorage !== 'undefined') ? localStorage : null;
}

const DEFAULT = () => ({
  coins: 0,
  totalCoinsEver: 0,
  maxLevel: 1,
  ownedSkins: SKINS.filter(s => s.unlocked).map(s => s.id),
  ownedTrails: TRAILS.filter(t => t.unlocked).map(t => t.id),
  skin: 'pearl',
  trail: 'none',
  levels: {},
  settings: {
    sound: true, music: true,
    control: 'auto',
    tiltSensitivity: 1.0,
    quality: 'auto',
    difficulty: 'normal',
  },
  daily: { lastClaimDay: null, streak: 0 },
  stats: { runs: 0, deaths: 0, wins: 0, secretsFound: 0 },
  seenMechanics: [],
  director: null,
});

let state = DEFAULT();

export function load() {
  try {
    const ls = backend();
    const raw = ls && ls.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = deepMerge(DEFAULT(), parsed);
      const def = DEFAULT();
      for (const id of def.ownedSkins) if (!state.ownedSkins.includes(id)) state.ownedSkins.push(id);
      for (const id of def.ownedTrails) if (!state.ownedTrails.includes(id)) state.ownedTrails.push(id);
    }
  } catch (e) {
    console.warn('[storage] load failed, resetting', e);
    state = DEFAULT();
  }
  return state;
}

export function save() {
  try { const ls = backend(); if (ls) ls.setItem(KEY, JSON.stringify(state)); }
  catch (e) { }
}

export function get() { return state; }

export function addCoins(n) {
  n = Math.max(0, Math.round(n));
  state.coins += n;
  state.totalCoinsEver += n;
  save();
  return state.coins;
}
export function spendCoins(n) {
  if (state.coins < n) return false;
  state.coins -= n;
  save();
  return true;
}

export function ownsSkin(id) { return state.ownedSkins.includes(id); }
export function ownsTrail(id) { return state.ownedTrails.includes(id); }
export function unlockSkin(id) { if (!ownsSkin(id)) { state.ownedSkins.push(id); save(); } }
export function unlockTrail(id) { if (!ownsTrail(id)) { state.ownedTrails.push(id); save(); } }
export function equipSkin(id) { if (ownsSkin(id)) { state.skin = id; save(); } }
export function equipTrail(id) { if (ownsTrail(id)) { state.trail = id; save(); } }

export function unlockNextLevel(level) {
  const next = level + 1;
  if (next > state.maxLevel) { state.maxLevel = next; save(); }
}
export function recordLevelResult(level, { stars, coins, timeMs }) {
  const prev = state.levels[level] || { stars: 0, bestCoins: 0, bestTimeMs: Infinity };
  const merged = {
    stars: Math.max(prev.stars, stars),
    bestCoins: Math.max(prev.bestCoins, coins),
    bestTimeMs: Math.min(prev.bestTimeMs ?? Infinity, timeMs),
  };
  state.levels[level] = merged;
  save();
  return merged;
}
export function levelRecord(level) {
  return state.levels[level] || { stars: 0, bestCoins: 0, bestTimeMs: Infinity };
}
export function totalStars() {
  return Object.values(state.levels).reduce((a, r) => a + (r.stars || 0), 0);
}

export function setSetting(key, val) { state.settings[key] = val; save(); }

export function getDirector() { return state.director; }
export function setDirector(d) { state.director = d; save(); }

export function hasSeenMechanic(key) { return state.seenMechanics.includes(key); }
export function markMechanicSeen(key) {
  if (!state.seenMechanics.includes(key)) { state.seenMechanics.push(key); save(); }
}

export function bump(stat, n = 1) { state.stats[stat] = (state.stats[stat] || 0) + n; save(); }

function dayNumber(d = new Date()) {
  const ms = d.getTime() - d.getTimezoneOffset() * 60000;
  return Math.floor(ms / 86400000);
}
export function dailyStatus() {
  const today = dayNumber();
  const last = state.daily.lastClaimDay;
  const claimable = last !== today;
  let streak = state.daily.streak || 0;
  let nextStreak;
  if (last === null) nextStreak = 1;
  else if (last === today) nextStreak = streak;
  else if (last === today - 1) nextStreak = streak + 1;
  else nextStreak = 1;
  const dayInCycle = ((nextStreak - 1) % ECON.daily.length);
  const reward = ECON.daily[dayInCycle];
  const isChest = (nextStreak % ECON.dailySkinAt) === 0;
  return { claimable, streak, nextStreak, reward, dayInCycle, isChest };
}
export function claimDaily() {
  const s = dailyStatus();
  if (!s.claimable) return null;
  const today = dayNumber();
  state.daily.lastClaimDay = today;
  state.daily.streak = s.nextStreak;
  addCoins(s.reward);
  return s;
}

function deepMerge(base, over) {
  if (Array.isArray(base)) return Array.isArray(over) ? over.slice() : base;
  if (base && typeof base === 'object') {
    const out = { ...base };
    if (over && typeof over === 'object') {
      for (const k of Object.keys(over)) {
        out[k] = (k in base) ? deepMerge(base[k], over[k]) : over[k];
      }
    }
    return out;
  }
  return over === undefined ? base : over;
}

export function hardReset() { state = DEFAULT(); save(); }
