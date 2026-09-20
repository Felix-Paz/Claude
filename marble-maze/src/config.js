export const T = 3.2;
export const WALL_H = 2.5;
export const WALL_CAP = 0.34;
export const MARBLE_R = 0.95;

export const DANGER = 0xff2b2b;
export const DANGER_DARK = 0x8c1414;
export const FINISH_COLOR = 0x2bff9e;
export const MOVER_COLOR = 0xffb02e;
export const PORTAL_A = 0x46b6ff, PORTAL_B = 0xff7adf;

export const PHYS = {
  accel: 80,
  maxSpeed: 15.5,
  boostMult: 1.8,
  friction: 3.2,
  wallRestitution: 0.18,
  airControl: 0.4,
};

export const RADII = {
  coin: T * 0.52,
  hole: T * 0.44,
  powerup: T * 0.6,
  hazard: 0.92,
  portal: T * 0.42,
};

export const STARS = { coinFractionFor2: 0.5, coinFractionFor3: 0.999 };

export const WORLDS = [
  { id:'meadow', name:'Sunny Meadow',
    floor:0x74c56a, floorEdge:0x549a4c, wall:0x9a6a40, wallTop:0xc99a66, accent:0xffd23a,
    sky:0x8fd6ff, horizon:0xdaf4ff, fog:0.010,
    sun:0xfff6e0, sunInt:3.0, hemiSky:0xcdeeff, hemiGround:0x6fbf63, hemiInt:1.05, amb:0.32,
    sig:'none', blurb:'Roll to the green hole.' },

  { id:'canyon', name:'Red Canyon',
    floor:0xe2a766, floorEdge:0xb87f44, wall:0xb24f30, wallTop:0xe07c50, accent:0xffd27f,
    sky:0xffcf8c, horizon:0xffe7c2, fog:0.012,
    sun:0xfff0d2, sunInt:3.1, hemiSky:0xffe3bd, hemiGround:0xb07a45, hemiInt:1.0, amb:0.34,
    sig:'none', blurb:'Sun-baked rock and gold.' },

  { id:'jungle', name:'Jungle Temple',
    floor:0x3fa257, floorEdge:0x2e7a41, wall:0x6f4a2c, wallTop:0xa98b54, accent:0xffe24a,
    sky:0x66cf9a, horizon:0xc2efcf, fog:0.016,
    sun:0xfff2cf, sunInt:2.8, hemiSky:0xb0ecc6, hemiGround:0x2c5d39, hemiInt:1.05, amb:0.34,
    sig:'none', blurb:'Overgrown ruins.' },

  { id:'candy', name:'Candy Rush',
    floor:0xff9ec6, floorEdge:0xe070a0, wall:0x8d59d8, wallTop:0xc3a0ff, accent:0xfff04a,
    sky:0xffd6ee, horizon:0xffeaf6, fog:0.012,
    sun:0xffffff, sunInt:2.8, hemiSky:0xffdff1, hemiGround:0xe58cc0, hemiInt:1.1, amb:0.4,
    sig:'none', blurb:'Sweet and bouncy.' },

  { id:'ice', name:'Glacier Caves',
    floor:0x6fb0e0, floorEdge:0x4f8cc4, wall:0xeef7ff, wallTop:0xffffff, accent:0x49d6ff,
    sky:0xbfe3ff, horizon:0xe6f4ff, fog:0.014,
    sun:0xeaf6ff, sunInt:2.6, hemiSky:0xdaf0ff, hemiGround:0x86b4d6, hemiInt:1.15, amb:0.42,
    sig:'slippery', blurb:'Slick ice — ease off.' },

  { id:'ocean', name:'Coral Reef',
    floor:0x14566e, floorEdge:0x0e3c50, wall:0x2ba0c2, wallTop:0x7fe6e6, accent:0x2ff0d0,
    sky:0x0a3550, horizon:0x1d6a8c, fog:0.020,
    sun:0xcdf2ff, sunInt:2.2, hemiSky:0x49b6cf, hemiGround:0x0c3346, hemiInt:1.1, amb:0.4,
    sig:'current', blurb:'Mind the current.' },

  { id:'lava', name:'Lava Forge',
    floor:0x2e1a1c, floorEdge:0x190d10, wall:0x7c2c22, wallTop:0xff6a38, accent:0xff5a2a,
    sky:0x1c0c0e, horizon:0x3c1612, fog:0.018, emissiveWorld:true,
    sun:0xffb070, sunInt:2.0, hemiSky:0x6a2a1e, hemiGround:0x160809, hemiInt:0.9, amb:0.55,
    sig:'none', blurb:'Glowing forge.' },

  { id:'neon', name:'Neon Grid',
    floor:0x141a40, floorEdge:0x0c1030, wall:0x2c3c96, wallTop:0x3affff, accent:0x21f3ff,
    sky:0x070414, horizon:0x160a30, fog:0.018, emissiveWorld:true,
    sun:0x9fb6ff, sunInt:1.7, hemiSky:0x3a3a8a, hemiGround:0x0a0820, hemiInt:0.8, amb:0.55,
    sig:'none', blurb:'Synthwave maze.' },

  { id:'toxic', name:'Toxic Swamp',
    floor:0x35562a, floorEdge:0x24401c, wall:0x6c9038, wallTop:0xb6ff5c, accent:0x9bff2a,
    sky:0x6a7a3a, horizon:0xb6c47a, fog:0.02, emissiveWorld:true,
    sun:0xeaffc0, sunInt:2.2, hemiSky:0xb6c47a, hemiGround:0x24401c, hemiInt:1.0, amb:0.42,
    sig:'none', blurb:'Don’t drink the water.' },

  { id:'space', name:'Orbital Station',
    floor:0x16183c, floorEdge:0x0c0e26, wall:0x3a4aa0, wallTop:0xc49aff, accent:0xb98aff,
    sky:0x05030e, horizon:0x0c0922, fog:0.016, emissiveWorld:true,
    sun:0xd6dcff, sunInt:1.8, hemiSky:0x3a3e74, hemiGround:0x05030e, hemiInt:0.85, amb:0.55,
    sig:'lowgrav', blurb:'Low gravity. Stay sharp.' },
];

export const LEVELS_PER_WORLD = 3;
export function worldIndexForLevel(level) {
  return Math.floor((level - 1) / LEVELS_PER_WORLD) % WORLDS.length;
}
export function worldForLevel(level) { return WORLDS[worldIndexForLevel(level)]; }

export const MECHANIC_UNLOCKS = [
  { key:'coins',       level:1,  label:'Collect coins (bonus!)' },
  { key:'decoys',      level:2,  label:'Avoid the RED holes' },
  { key:'powerups',    level:4,  label:'Grab power-ups' },
  { key:'boostPads',   level:5,  label:'Speed pads — zoom!' },
  { key:'movingWalls', level:6,  label:'Sliding walls' },
  { key:'bouncers',    level:7,  label:'Bouncers' },
  { key:'crawlers',    level:8,  label:'Toxic blobs are RED' },
  { key:'spikes',      level:10, label:'Spike traps' },
  { key:'turrets',     level:12, label:'Watch the shooters' },
  { key:'sizeZones',   level:14, label:'Size gates' },
  { key:'rotators',    level:17, label:'Spinning blades' },
];
export function mechanicsForLevel(level) {
  const s = new Set();
  for (const m of MECHANIC_UNLOCKS) if (level >= m.level) s.add(m.key);
  return s;
}
export function newMechanicAt(level) { return MECHANIC_UNLOCKS.find(m => m.level === level) || null; }

export const POWERUPS = {
  magnet:    { id:'magnet',    name:'Coin Magnet',  color:0xffcf3a, dur:7,  icon:'', timed:true,  blurb:'Pulls coins in' },
  x2:        { id:'x2',        name:'2× Coins',     color:0xffe14d, dur:9,  icon:'', timed:true,  blurb:'Double coins' },
  speed:     { id:'speed',     name:'Speed Surge',  color:0x49d0ff, dur:5,  icon:'', timed:true,  blurb:'Go faster' },
  slowmo:    { id:'slowmo',    name:'Slow-Mo',      color:0xb98aff, dur:5,  icon:'', timed:true,  blurb:'Slow time' },
  shield:    { id:'shield',    name:'Shield',       color:0x4dffa3, dur:10, icon:'', timed:true,  blurb:'Survive one hit' },
  bigfinish: { id:'bigfinish', name:'Big Finish',   color:0x7affd0, dur:10, icon:'', timed:true,  blurb:'Bigger goal' },
  shrink:    { id:'shrink',    name:'Mini Marble',  color:0x9affff, dur:8,  icon:'', timed:true,  blurb:'Squeeze through' },
  patchHoles:{ id:'patchHoles',name:'Hole Patch',   color:0x6be3ff, dur:7,  icon:'', timed:true,  blurb:'Seals RED holes' },
  ghost:     { id:'ghost',     name:'Ghost',        color:0xd6e4ff, dur:5,  icon:'', timed:true,  blurb:'Pass through walls' },
  freeze:    { id:'freeze',    name:'Time Freeze',  color:0x8fefff, dur:4,  icon:'', timed:true,  blurb:'Hazards freeze' },
};
export const POWERUP_POOL = Object.keys(POWERUPS);

export const GOLD_RUSH = { fraction: 0.85, minFast: 12, windowSec: 3.0, durationSec: 6, fillCount: 60 };

export const PERKS = {
  shield:   { icon:'', label:'Extra Life', blurb:'Start each level shielded' },
  magnet:   { icon:'', label:'Coin Pull',  blurb:'Gentle passive coin magnet' },
  headstart:{ icon:'', label:'Headstart',  blurb:'+8% top speed' },
  lucky:    { icon:'', label:'Lucky',      blurb:'+15% coins earned' },
};

export const RARITY = {
  common:    { label:'Common',    color:'#9aa6b2', order:0 },
  rare:      { label:'Rare',      color:'#3fa9ff', order:1 },
  epic:      { label:'Epic',      color:'#b06bff', order:2 },
  legendary: { label:'Legendary', color:'#ffb02e', order:3 },
};

export const SKINS = [
  { id:'pearl',   name:'Classic Pearl', rarity:'common', price:0,    unlocked:true, tex:'pearl',
    mat:{ color:0xffffff, metalness:0.12, roughness:0.1, clearcoat:1 } },
  { id:'beach',   name:'Beach Ball',    rarity:'common', price:220,  tex:'beach',
    mat:{ color:0xffffff, metalness:0.0, roughness:0.22, clearcoat:0.8 } },
  { id:'smiley',  name:'Happy Face',    rarity:'common', price:300,  tex:'smiley',
    mat:{ color:0xffffff, metalness:0.0, roughness:0.26, clearcoat:0.5 } },
  { id:'donut',   name:'Sprinkle Pop',  rarity:'common', price:420,  tex:'donut',
    mat:{ color:0xffffff, metalness:0.0, roughness:0.35, clearcoat:0.4 } },

  { id:'soccer',  name:'Soccer',        rarity:'rare', price:700, tex:'soccer',
    mat:{ color:0xffffff, metalness:0.0, roughness:0.3 } },
  { id:'basket',  name:'Basketball',    rarity:'rare', price:780, tex:'basket',
    mat:{ color:0xffffff, metalness:0.0, roughness:0.42 } },
  { id:'eight',   name:'8-Ball',        rarity:'rare', price:880, tex:'eight',
    mat:{ color:0xffffff, metalness:0.0, roughness:0.2, clearcoat:0.55 } },
  { id:'melon',   name:'Watermelon',    rarity:'rare', price:950, tex:'melon',
    mat:{ color:0xffffff, metalness:0.0, roughness:0.34, clearcoat:0.35 } },

  { id:'disco',   name:'Disco Ball',    rarity:'epic', price:1600, tex:'disco', perk:'lucky',
    mat:{ color:0xffffff, metalness:0.95, roughness:0.12 } },
  { id:'panda',   name:'Panda',         rarity:'epic', price:1800, tex:'panda', perk:'lucky',
    mat:{ color:0xffffff, metalness:0.0, roughness:0.4, clearcoat:0.3 } },
  { id:'globe',   name:'Lil Earth',     rarity:'epic', price:2000, tex:'globe', perk:'magnet',
    mat:{ color:0xffffff, metalness:0.0, roughness:0.42, clearcoat:0.5 } },
  { id:'magma',   name:'Magma Core',    rarity:'epic', price:2200, tex:'magma', perk:'headstart',
    mat:{ color:0xffffff, metalness:0.3, roughness:0.55, emissive:0xff5a14, emissiveInt:0.55 } },

  { id:'gold',    name:'Solid Gold',    rarity:'legendary', price:3600, tex:'gold', perk:'lucky',
    mat:{ color:0xffffff, tint:0xffd76a, metalness:1.0, roughness:0.18 } },
  { id:'saturn',  name:'Lil Planet',    rarity:'legendary', price:4200, tex:'planet', ring:true, perk:'magnet',
    mat:{ color:0xffffff, metalness:0.15, roughness:0.45 } },
  { id:'galaxy',  name:'Galaxy',        rarity:'legendary', price:4800, tex:'galaxy', perk:'headstart',
    mat:{ color:0xffffff, metalness:0.35, roughness:0.28, clearcoat:1, emissive:0x3a1a8a, emissiveInt:0.3 } },
  { id:'rainbow', name:'Aurora',        rarity:'legendary', price:5600, tex:'aurora', rainbow:true, perk:'shield',
    mat:{ color:0xffffff, metalness:0.35, roughness:0.1, clearcoat:1, emissive:0x1a6a78, emissiveInt:0.35 } },
  { id:'diamond', name:'Diamond',       rarity:'legendary', price:6400, tex:'diamond', perk:'shield',
    mat:{ color:0xffffff, metalness:0.25, roughness:0.05, clearcoat:1, emissive:0x6fb8e0, emissiveInt:0.15 } },
];

export const TRAILS = [
  { id:'none',    name:'No Trail',    price:0,    unlocked:true,  color:0xffffff },
  { id:'spark',   name:'Sparkles',    price:200,  color:0xffe14d },
  { id:'neon',    name:'Neon Streak', price:400,  color:0x21f3ff },
  { id:'fire',    name:'Fire Tail',   price:600,  color:0xff5a2a },
  { id:'bubble',  name:'Bubbles',     price:500,  color:0x9adfff },
  { id:'rainbow', name:'Rainbow',     price:1500, color:0xff00ff, rainbow:true },
];

export const ECON = {
  coinValue: 1,
  finishBonus: (level) => 18 + level * 3,
  perfectBonus: 50,
  daily: [50, 75, 100, 150, 200, 300, 500],
  dailySkinAt: 7,
  chestEvery: 3,
  chestCoins: (level) => 40 + level * 6,
};

export const SIZE_BUCKETS = {
  small:  { cols: [4, 6],  rows: [4, 5] },
  medium: { cols: [7, 9],  rows: [6, 8] },
  large:  { cols: [10, 12], rows: [8, 10] },
  huge:   { cols: [13, 16], rows: [10, 12] },
};
export const SIZE_ORDER = ['small', 'medium', 'large', 'huge'];

export const DIFFICULTY_PRESETS = {
  chill:  { label: 'Chill',  bias: -260, k: 28 },
  normal: { label: 'Normal', bias: 0,    k: 64 },
  hard:   { label: 'Hard',   bias: +220, k: 64 },
  expert: { label: 'Expert', bias: +460, k: 80 },
};
export const DIFFICULTY_ORDER = ['chill', 'normal', 'hard', 'expert'];

export const DIRECTOR = {
  startSkill: 1000,
  K: 64,
  targetWinProb: 0.72,
  offsetEasy: -120,
  offsetHard: +140,
  diffMin: 640, diffMax: 2600,
  churn: {
    deathStreak2: 22, deathStreak3: 40, quickDeath: 18, idle5s: 16,
    pausedMidLevel: 10, repeatedSpot: 20, longLoseStreak: 30, tabBlur: 14,
    recentWin: -28, newMechanic: -16, reward: -14, closeLoss: -8, perfect: -20,
  },
};
