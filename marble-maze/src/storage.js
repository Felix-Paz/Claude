// =====================================================================
//  storage.js — durable player state in localStorage.
//  Holds coins, unlocks, per-level bests, settings, daily/streak.
//  All access is defensive so a corrupt/old save never bricks the game.
// =====================================================================
import { SKINS, TRAILS, ECON } from './config.js';

const KEY = 'marblemaze.save.v1';

const DEFAULT = () => ({
  coins: 0,
  totalCoinsEver: 0,
  maxLevel: 1,                 // highest level unlocked (can play <= this)
  ownedSkins: SKINS.filter(s => s.unlocked).map(s => s.id),
  ownedTrails: TRAILS.filter(t => t.unlocked).map(t => t.id),
  skin: 'pearl',
  trail: 'none',
  levels: {},                  // { [n]: { stars, bestCoins, bestTimeMs } }
  settings: {
    sound: true, music: true,
    control: 'auto',           // auto | keys | tilt | touch
    tiltSensitivity: 1.0,
    quality: 'auto',           // auto | high | low
    difficulty: 'normal',      // chill | normal | hard | expert (dictates ELO band)
  },
  daily: { lastClaimDay: null, streak: 0 },
  stats: { runs: 0, deaths: 0, wins: 0, secretsFound: 0 },
  seenMechanics: [],           // mechanic keys whose intro banner was shown
  director: null,              // adaptive director state (skill ELO, history, profile)
});

let state = DEFAULT();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = deepMerge(DEFAULT(), parsed);
      // Guarantee at least the default freebies remain owned.
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
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { /* private mode / quota — game still runs in-memory */ }
}

export function get() { return state; }

// ---- Coins ----
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

// ---- Unlocks ----
export function ownsSkin(id) { return state.ownedSkins.includes(id); }
export function ownsTrail(id) { return state.ownedTrails.includes(id); }
export function unlockSkin(id) { if (!ownsSkin(id)) { state.ownedSkins.push(id); save(); } }
export function unlockTrail(id) { if (!ownsTrail(id)) { state.ownedTrails.push(id); save(); } }
export function equipSkin(id) { if (ownsSkin(id)) { state.skin = id; save(); } }
export function equipTrail(id) { if (ownsTrail(id)) { state.trail = id; save(); } }

// ---- Level progress / bests ----
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

// ---- Settings ----
export function setSetting(key, val) { state.settings[key] = val; save(); }

// ---- Adaptive director ----
export function getDirector() { return state.director; }
export function setDirector(d) { state.director = d; save(); }

// ---- Mechanic intro tracking ----
export function hasSeenMechanic(key) { return state.seenMechanics.includes(key); }
export function markMechanicSeen(key) {
  if (!state.seenMechanics.includes(key)) { state.seenMechanics.push(key); save(); }
}

// ---- Stats ----
export function bump(stat, n = 1) { state.stats[stat] = (state.stats[stat] || 0) + n; save(); }

// =====================================================================
//  DAILY REWARD / STREAK
//  Day index is local-midnight based. Consecutive day => streak++.
//  Missed a day => streak resets to 1.
// =====================================================================
function dayNumber(d = new Date()) {
  // days since epoch in local time
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
  else if (last === today) nextStreak = streak;          // already claimed
  else if (last === today - 1) nextStreak = streak + 1;  // consecutive
  else nextStreak = 1;                                   // broke streak
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
  addCoins(s.reward); // also saves
  return s;
}

// ---- utility ----
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
