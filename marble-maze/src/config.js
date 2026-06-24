// =====================================================================
//  MARBLE MAZE — config.js
//  Central data: physics tunables, worlds, skins, trails, power-ups,
//  hazards, and the level / mechanic pacing schedule.
//  Everything that designers would want to tweak lives here.
// =====================================================================

// ---- Core geometry ----
export const T = 3.2;          // tile size in world units (rooms & walls share this)
export const WALL_H = 2.6;     // wall height
export const WALL_INSET = 0.0; // visual inset (kept 0 for crisp readability)
export const MARBLE_R = 0.95;  // default marble radius

// ---- Physics feel (tuned for "smooth, forgiving, responsive") ----
export const PHYS = {
  accel: 78,            // input acceleration (units/s^2)
  maxSpeed: 15.5,       // base top speed
  boostMult: 1.75,      // Shift boost multiplier on top speed + accel
  friction: 3.2,        // velocity damping: v *= exp(-friction*dt)
  wallRestitution: 0.22,// bounciness off walls (low = forgiving slide)
  tiltGain: 1.0,        // device-tilt -> accel scaler (also user setting)
  airControl: 0.4,      // control retained while falling into a hole
};

// ---- Pickup / capture radii (generous = forgiving) ----
export const RADII = {
  coin: T * 0.52,
  hole: T * 0.44,
  powerup: T * 0.58,
  hazard: 0.95,         // base hazard contact (added to marble radius)
};

// ---- Star scoring per level (drives "I can do better") ----
export const STARS = {
  // 1 star: finish. 2 stars: finish + half coins. 3 stars: all coins.
  coinFractionFor2: 0.5,
  coinFractionFor3: 0.999,
};

// =====================================================================
//  WORLDS — each visually distinct, with a signature mechanic.
//  Colors are hex ints. `fog` density tuned per palette.
// =====================================================================
export const WORLDS = [
  {
    id: 'meadow', name: 'Sunny Meadow',
    floor: 0x8fd98a, floorEdge: 0x6cc06a, wall: 0xf2f7e8, wallTop: 0xffffff,
    accent: 0x4caf50, sky: 0x9fe0ff, horizon: 0xdff6ff, fog: 0.012,
    sun: 0xffffff, sunInt: 2.6, hemiSky: 0xbfe9ff, hemiGround: 0x6cba66, hemiInt: 0.9,
    signature: 'intro', blurb: 'Roll, collect, reach the hole.',
  },
  {
    id: 'jungle', name: 'Jungle Temple',
    floor: 0x4f9d5d, floorEdge: 0x3a7a47, wall: 0x8a6b4f, wallTop: 0xb89a78,
    accent: 0xffcf48, sky: 0x57c785, horizon: 0xa9e8b6, fog: 0.018,
    sun: 0xfff2cc, sunInt: 2.4, hemiSky: 0xa7e6c2, hemiGround: 0x2f5d39, hemiInt: 0.95,
    signature: 'vines', blurb: 'Boost pads & bouncers awaken.',
  },
  {
    id: 'ice', name: 'Frostbite Caves',
    floor: 0xbfe9ff, floorEdge: 0x8fd0f0, wall: 0xeaf6ff, wallTop: 0xffffff,
    accent: 0x55ccff, sky: 0xcdeaff, horizon: 0xeaf7ff, fog: 0.02,
    sun: 0xeaf6ff, sunInt: 2.2, hemiSky: 0xdff2ff, hemiGround: 0x9fc6e0, hemiInt: 1.05,
    signature: 'slippery', blurb: 'Low friction — plan your stops.',
  },
  {
    id: 'neon', name: 'Neon City',
    floor: 0x141633, floorEdge: 0x0c0e22, wall: 0x232a5c, wallTop: 0x3a4aa0,
    accent: 0x21f3ff, sky: 0x06030f, horizon: 0x160a2e, fog: 0.026,
    sun: 0x88aaff, sunInt: 1.4, hemiSky: 0x3a2a66, hemiGround: 0x06030f, hemiInt: 0.6,
    signature: 'lasers', emissiveWorld: true, blurb: 'Shooting machines online.',
  },
  {
    id: 'desert', name: 'Desert Ruins',
    floor: 0xe9c389, floorEdge: 0xcfa468, wall: 0xc8956a, wallTop: 0xe4bb8f,
    accent: 0xff8a3d, sky: 0xffd79a, horizon: 0xffe9c4, fog: 0.016,
    sun: 0xfff0d0, sunInt: 2.7, hemiSky: 0xffe6bf, hemiGround: 0xb98a55, hemiInt: 0.9,
    signature: 'quicksand', blurb: 'Spike traps & moving walls.',
  },
  {
    id: 'lava', name: 'Lava Forge',
    floor: 0x3a2024, floorEdge: 0x24151a, wall: 0x5a2a26, wallTop: 0x7a3a30,
    accent: 0xff5a2a, sky: 0x1a0a0c, horizon: 0x3a1410, fog: 0.03,
    sun: 0xffb070, sunInt: 1.8, hemiSky: 0x5a2218, hemiGround: 0x140607, hemiInt: 0.7,
    signature: 'eruptions', emissiveWorld: true, blurb: 'Toxic crawlers & timed fire.',
  },
  {
    id: 'ocean', name: 'Deep Reef',
    floor: 0x1c5a78, floorEdge: 0x123e54, wall: 0x2a86a8, wallTop: 0x46b6cf,
    accent: 0x2ff0d0, sky: 0x0a3550, horizon: 0x1d6a8c, fog: 0.032,
    sun: 0xbfefff, sunInt: 1.6, hemiSky: 0x2a8fb0, hemiGround: 0x0a2c40, hemiInt: 1.0,
    signature: 'currents', blurb: 'Currents push you off-course.',
  },
  {
    id: 'space', name: 'Orbital Station',
    floor: 0x1b1e3a, floorEdge: 0x0e1024, wall: 0x33407a, wallTop: 0x5566bb,
    accent: 0xb98aff, sky: 0x04030c, horizon: 0x0a0820, fog: 0.022,
    sun: 0xcfd6ff, sunInt: 1.7, hemiSky: 0x2a2e5c, hemiGround: 0x04030c, hemiInt: 0.55,
    signature: 'lowgrav', emissiveWorld: true, blurb: 'Low gravity. Rotating arms.',
  },
];

// World rotates every N levels; after the last world we cycle & intensify.
export const LEVELS_PER_WORLD = 6;

export function worldIndexForLevel(level) {
  return Math.floor((level - 1) / LEVELS_PER_WORLD) % WORLDS.length;
}
export function worldForLevel(level) {
  return WORLDS[worldIndexForLevel(level)];
}

// =====================================================================
//  MECHANIC PACING — "something new every ~30–60s".
//  Each mechanic unlocks at a level; the generator turns it on from then.
//  Order is the intended teaching sequence.
// =====================================================================
export const MECHANIC_UNLOCKS = [
  { key: 'coins',      level: 1,  label: 'Collect coins' },
  { key: 'decoys',     level: 3,  label: 'Beware wrong holes' },
  { key: 'boostPads',  level: 4,  label: 'Boost pads' },
  { key: 'powerups',   level: 5,  label: 'Power-ups appear' },
  { key: 'movingWalls',level: 6,  label: 'Moving walls' },
  { key: 'bouncers',   level: 7,  label: 'Bouncers' },
  { key: 'crawlers',   level: 8,  label: 'Toxic crawlers' },
  { key: 'spikes',     level: 9,  label: 'Spike traps' },
  { key: 'turrets',    level: 11, label: 'Shooting machines' },
  { key: 'sizeZones',  level: 13, label: 'Size-change zones' },
  { key: 'rotators',   level: 16, label: 'Rotating arms' },
  { key: 'currents',   level: 19, label: 'Force currents' },
];

// Returns a set of enabled mechanic keys for a level.
export function mechanicsForLevel(level) {
  const set = new Set();
  for (const m of MECHANIC_UNLOCKS) if (level >= m.level) set.add(m.key);
  return set;
}

// The mechanic that is *brand new* on this level (for the "NEW!" banner).
export function newMechanicAt(level) {
  return MECHANIC_UNLOCKS.find(m => m.level === level) || null;
}

// Maze size grows with level but stays "short & fast to restart".
export function mazeSizeForLevel(level) {
  // cols/rows are CELL counts (not tiles). Kept odd-ish, capped for pace.
  const base = 4 + Math.floor((level - 1) / 2);
  const cols = Math.min(13, Math.max(4, base));
  const rows = Math.min(11, Math.max(4, base - (level % 2)));
  return { cols, rows };
}

// =====================================================================
//  POWER-UPS — floating pickups with timed effects.
// =====================================================================
export const POWERUPS = {
  magnet:    { id:'magnet',    name:'Coin Magnet',  color:0xffcf3a, dur:7,  icon:'🧲', blurb:'Pulls coins to you' },
  x2:        { id:'x2',        name:'2× Coins',     color:0xffe14d, dur:9,  icon:'✨', blurb:'Double coin value' },
  speed:     { id:'speed',     name:'Speed Surge',  color:0x49d0ff, dur:5,  icon:'⚡', blurb:'Go faster' },
  slowmo:    { id:'slowmo',    name:'Slow-Mo',      color:0xb98aff, dur:5,  icon:'🐢', blurb:'Slow the world' },
  shield:    { id:'shield',    name:'Shield',       color:0x4dffa3, dur:9,  icon:'🛡️', blurb:'Survive one hit' },
  bigfinish: { id:'bigfinish', name:'Big Finish',   color:0x7affd0, dur:10, icon:'🎯', blurb:'Larger finish hole' },
  ghost:     { id:'ghost',     name:'Hole Vanish',  color:0xff7ad0, dur:7,  icon:'👻', blurb:'Wrong holes vanish' },
  shrink:    { id:'shrink',    name:'Mini Marble',  color:0x9affff, dur:8,  icon:'🔽', blurb:'Squeeze through' },
};
export const POWERUP_POOL = Object.keys(POWERUPS);

// =====================================================================
//  MARBLE SKINS — rarity tiers. material params drive look.
//  unlocked:true = owned by default. price in coins.
//  mat: { color, metalness, roughness, clearcoat, emissive, emissiveInt }
// =====================================================================
export const RARITY = {
  common:    { label:'Common',    color:'#9aa6b2', order:0 },
  rare:      { label:'Rare',      color:'#3fa9ff', order:1 },
  epic:      { label:'Epic',      color:'#b06bff', order:2 },
  legendary: { label:'Legendary', color:'#ffb02e', order:3 },
};

export const SKINS = [
  { id:'pearl',   name:'Pearl',        rarity:'common', price:0,    unlocked:true,
    mat:{ color:0xf3f5f8, metalness:0.0, roughness:0.18, clearcoat:1, emissive:0x000000, emissiveInt:0 } },
  { id:'cherry',  name:'Cherry Gloss', rarity:'common', price:120,  unlocked:false,
    mat:{ color:0xe23b4e, metalness:0.0, roughness:0.12, clearcoat:1, emissive:0x000000, emissiveInt:0 } },
  { id:'lime',    name:'Lime Pop',     rarity:'common', price:120,  unlocked:false,
    mat:{ color:0x9be24b, metalness:0.0, roughness:0.16, clearcoat:1, emissive:0x000000, emissiveInt:0 } },
  { id:'ocean',   name:'Ocean Glass',  rarity:'common', price:160,  unlocked:false,
    mat:{ color:0x3bb6e2, metalness:0.0, roughness:0.08, clearcoat:1, transmissionLike:true, emissive:0x000000, emissiveInt:0 } },

  { id:'chrome',  name:'Chrome',       rarity:'rare', price:450,  unlocked:false,
    mat:{ color:0xdfe6ee, metalness:1.0, roughness:0.05, clearcoat:0, emissive:0x000000, emissiveInt:0 } },
  { id:'gold',    name:'Gold Bar',     rarity:'rare', price:600,  unlocked:false,
    mat:{ color:0xffc23a, metalness:1.0, roughness:0.18, clearcoat:0, emissive:0x000000, emissiveInt:0 } },
  { id:'copper',  name:'Copper',       rarity:'rare', price:520,  unlocked:false,
    mat:{ color:0xd07a40, metalness:1.0, roughness:0.22, clearcoat:0, emissive:0x000000, emissiveInt:0 } },
  { id:'mint',    name:'Mint Candy',   rarity:'rare', price:500,  unlocked:false,
    mat:{ color:0x6ff0c0, metalness:0.1, roughness:0.1, clearcoat:1, emissive:0x000000, emissiveInt:0 } },

  { id:'magma',   name:'Magma Core',   rarity:'epic', price:1200, unlocked:false,
    mat:{ color:0x3a1410, metalness:0.4, roughness:0.4, clearcoat:0.5, emissive:0xff4a16, emissiveInt:1.3 } },
  { id:'neon',    name:'Neon Pulse',   rarity:'epic', price:1300, unlocked:false,
    mat:{ color:0x0a0f2a, metalness:0.2, roughness:0.2, clearcoat:1, emissive:0x21f3ff, emissiveInt:1.6 } },
  { id:'galaxy',  name:'Galaxy Swirl', rarity:'epic', price:1500, unlocked:false,
    mat:{ color:0x2a1b4d, metalness:0.6, roughness:0.25, clearcoat:1, emissive:0x7a3aff, emissiveInt:0.9 } },
  { id:'toxic',   name:'Toxic Slime',  rarity:'epic', price:1250, unlocked:false,
    mat:{ color:0x9bff2a, metalness:0.1, roughness:0.15, clearcoat:1, emissive:0x4aff10, emissiveInt:0.7 } },

  { id:'aurora',  name:'Aurora',       rarity:'legendary', price:3000, unlocked:false,
    mat:{ color:0x102a3a, metalness:0.5, roughness:0.08, clearcoat:1, emissive:0x2ff0d0, emissiveInt:1.1, rainbow:true } },
  { id:'plasma',  name:'Plasma Star',  rarity:'legendary', price:3600, unlocked:false,
    mat:{ color:0x140a2a, metalness:0.3, roughness:0.12, clearcoat:1, emissive:0xff36c8, emissiveInt:1.8, rainbow:true } },
  { id:'diamond', name:'Diamond',      rarity:'legendary', price:4200, unlocked:false,
    mat:{ color:0xeaf6ff, metalness:0.1, roughness:0.02, clearcoat:1, emissive:0x9fdfff, emissiveInt:0.25 } },
];

// =====================================================================
//  TRAILS — visual ribbon behind the marble.
// =====================================================================
export const TRAILS = [
  { id:'none',    name:'No Trail',   price:0,    unlocked:true,  color:0xffffff },
  { id:'spark',   name:'Sparkles',   price:200,  unlocked:false, color:0xffe14d },
  { id:'neon',    name:'Neon Streak',price:400,  unlocked:false, color:0x21f3ff },
  { id:'fire',    name:'Fire Tail',  price:600,  unlocked:false, color:0xff5a2a },
  { id:'bubble',  name:'Bubbles',    price:500,  unlocked:false, color:0x9adfff },
  { id:'rainbow', name:'Rainbow',    price:1500, unlocked:false, color:0xff00ff, rainbow:true },
];

// =====================================================================
//  ECONOMY / REWARDS
// =====================================================================
export const ECON = {
  coinValue: 1,
  finishBonus: (level) => 20 + level * 4,     // coins for finishing a level
  perfectBonus: 50,                            // all coins collected
  starBonusEach: 15,                           // per star (level select replays)
  reviveCostAds: true,                         // revive uses rewarded ad
  daily: [50, 75, 100, 150, 200, 300, 500],    // 7-day login streak rewards
  dailySkinAt: 7,                              // day 7 gives a bonus chest
};

// Time-attack target seconds per level (for medals).
export function timeTargetForLevel(level) {
  return 12 + level * 2.5;
}
