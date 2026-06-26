// =====================================================================
//  levels.js — seeded maze + content generation, driven by a director
//  PLAN ({ stage, difficulty, mods }) instead of a raw level number.
//
//   • stage 1  = one straight corridor (marble → green hole). Nothing else.
//   • stage 2  = corridor with ONE obvious RED wrong hole.
//   • stage 3-7 = gentle procedural ramp, at most one new idea at a time.
//   • stage 8+ = full procedural, sized/populated from the ELO difficulty.
//
//  mods (interventions) quietly tune the maze for retention: fewer hazards,
//  extra coins, a guaranteed boost pad, a bigger/closer goal, or — after
//  repeated failures — a carved shortcut the player won't notice.
// =====================================================================
import {
  mechanicsForLevel, worldForLevel, POWERUP_POOL, DIRECTOR,
} from './config.js';

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const key = (x, y) => x + ',' + y;
const DIRS = [[0,-1],[1,0],[0,1],[-1,0]];

const EMPTY_MODS = { sizeScale:1, hazardScale:1, decoyScale:1, extraCoins:0, forgive:0,
  addBoost:false, biggerGoal:false, closerFinish:false, guaranteePowerup:null, rescueOpen:false, slowHazards:1 };

function normalizePlan(arg) {
  if (typeof arg === 'number') {
    // legacy/simple call: derive a sensible difficulty from the stage
    const t = Math.min(1, (arg - 1) / 24);
    return { stage: arg, difficulty: Math.round(760 + t * 900), mods: { ...EMPTY_MODS }, seedSalt: 0 };
  }
  return { stage: arg.stage, difficulty: arg.difficulty ?? 1000, mods: { ...EMPTY_MODS, ...(arg.mods || {}) }, seedSalt: arg.seedSalt || 0 };
}

export function generateLevel(arg) {
  const plan = normalizePlan(arg);
  const lvl = plan.stage;
  if (lvl === 1) return template1(plan);
  if (lvl === 2) return template2(plan);
  return procedural(plan);
}

// ---------------------------------------------------------------
//  Scripted openers
// ---------------------------------------------------------------
function blankWorldLevel(plan, gw, gh) {
  const grid = Array.from({ length: gh }, () => new Array(gw).fill(1));
  return { plan, grid, gw, gh };
}

function template1(plan) {
  // one straight horizontal corridor, marble left, green hole right
  const cols = 7, gw = cols * 2 + 1, gh = 3;
  const { grid } = blankWorldLevel(plan, gw, gh);
  for (let x = 1; x < gw - 1; x++) grid[1][x] = 0;
  const start = { tx: 1, ty: 1 }, finish = { tx: gw - 2, ty: 1 };
  const coins = [{ tx: 5, ty: 1 }, { tx: 7, ty: 1 }, { tx: 9, ty: 1 }];
  return finalize(plan, grid, gw, gh, start, finish, new Set(pathKeys(grid, gw, gh, start, finish)),
    { coins, decoys: [], powerups: [], boostPads: [], bouncers: [], crawlers: [], spikes: [],
      turrets: [], sizeZones: [], rotators: [], movingWalls: [], portals: [] });
}

function template2(plan) {
  // corridor to the goal, with one OBVIOUS red wrong hole in a side pocket
  const cols = 8, gw = cols * 2 + 1, gh = 5;
  const { grid } = blankWorldLevel(plan, gw, gh);
  for (let x = 1; x < gw - 1; x++) grid[1][x] = 0;          // main corridor
  grid[2][7] = 0; grid[3][7] = 0;                           // side pocket downward
  const start = { tx: 1, ty: 1 }, finish = { tx: gw - 2, ty: 1 };
  const decoys = [{ tx: 7, ty: 3 }];                        // the lone red hole
  const coins = [{ tx: 5, ty: 1 }, { tx: 7, ty: 1 }, { tx: 11, ty: 1 }, { tx: 13, ty: 1 }];
  return finalize(plan, grid, gw, gh, start, finish, new Set(pathKeys(grid, gw, gh, start, finish)),
    { coins, decoys, powerups: [], boostPads: [], bouncers: [], crawlers: [], spikes: [],
      turrets: [], sizeZones: [], rotators: [], movingWalls: [], portals: [] });
}

// ---------------------------------------------------------------
//  Procedural levels (stage 3+)
// ---------------------------------------------------------------
function procedural(plan) {
  const lvl = plan.stage, mods = plan.mods;
  const rand = rng(lvl * 2654435761 + 12345 + plan.seedSalt * 7);
  const ri = (n) => Math.floor(rand() * n);
  const mech = mechanicsForLevel(lvl);

  // difficulty -> size & density
  const t = Math.max(0, Math.min(1, (plan.difficulty - 700) / 1200));
  const early = lvl <= 7;
  let cols = Math.round((4 + t * 9) * mods.sizeScale);
  let rows = Math.round((4 + t * 7) * mods.sizeScale);
  cols = Math.max(3, Math.min(14, cols)); rows = Math.max(3, Math.min(12, rows));
  if (early) { cols = Math.min(cols, 5 + lvl); rows = Math.min(rows, 4 + lvl); }

  const braid = Math.max(0, Math.min(0.5, 0.05 + t * 0.24 + (mods.rescueOpen ? 0.18 : 0)));
  const { grid, gw, gh } = buildMaze(cols, rows, braid, rand);

  const start = { tx: 1, ty: 1 };
  const dist = new Map(), parent = new Map();
  bfs(grid, gw, gh, start, dist, parent);

  // finish = farthest cell (or a mid-distance one when we want it closer)
  const cells = [];
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    const tx = cx * 2 + 1, ty = cy * 2 + 1, d = dist.get(key(tx, ty));
    if (d != null) cells.push({ tx, ty, d });
  }
  cells.sort((a, b) => b.d - a.d);
  let finish;
  if (mods.closerFinish && cells.length > 3) finish = cells[Math.floor(cells.length * 0.45)];
  else finish = cells[0] || { tx: gw - 2, ty: gh - 2 };

  // safe path
  const safe = new Set(); let cur = key(finish.tx, finish.ty);
  while (cur != null) { safe.add(cur); cur = parent.get(cur); }

  const openTiles = [];
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (grid[y][x] === 0) openTiles.push({ tx: x, ty: y });
  const isCell = (tt) => tt.tx % 2 === 1 && tt.ty % 2 === 1;
  const deg = (tt) => DIRS.reduce((n, [dx, dy]) => n + (grid[tt.ty + dy]?.[tt.tx + dx] === 0 ? 1 : 0), 0);
  const deadEnds = openTiles.filter(tt => isCell(tt) && deg(tt) === 1 && !same(tt, start) && !same(tt, finish));
  const branch = openTiles.filter(tt => !safe.has(key(tt.tx, tt.ty)));

  const occupied = new Set([key(start.tx, start.ty), key(finish.tx, finish.ty)]);
  for (const [dx, dy] of DIRS) occupied.add(key(start.tx + dx, start.ty + dy));
  const take = (pool) => { for (let i = 0; i < 40; i++) { const tt = pool[ri(pool.length)]; if (!tt) return null; const k = key(tt.tx, tt.ty); if (!occupied.has(k)) { occupied.add(k); return tt; } } return null; };
  const takeSafe = () => { const L = openTiles.filter(tt => safe.has(key(tt.tx, tt.ty)) && !occupied.has(key(tt.tx, tt.ty)) && !same(tt, start) && !same(tt, finish)); if (!L.length) return null; const tt = L[ri(L.length)]; occupied.add(key(tt.tx, tt.ty)); return tt; };

  // ---- coins: main-route trail + risky branch coins ----
  const coins = [];
  const pathArr = [...safe].map(k => { const [x, y] = k.split(',').map(Number); return { tx: x, ty: y, d: dist.get(k) || 0 }; }).sort((a, b) => a.d - b.d);
  for (let i = 2; i < pathArr.length - 2; i += 2) { const tt = pathArr[i]; if (!occupied.has(key(tt.tx, tt.ty)) && rand() < 0.8) { coins.push({ tx: tt.tx, ty: tt.ty }); occupied.add(key(tt.tx, tt.ty)); } }
  const riskCoins = Math.min(12, Math.round(2 + t * 9));
  for (let i = 0; i < riskCoins; i++) { const tt = take(deadEnds.length && rand() < 0.6 ? deadEnds : branch); if (tt) coins.push({ tx: tt.tx, ty: tt.ty, risk: true }); }
  for (let i = 0; i < (mods.extraCoins || 0); i++) { const tt = takeSafe() || take(openTiles); if (tt) coins.push({ tx: tt.tx, ty: tt.ty }); }

  // ---- decoys (RED holes), off the safe path ----
  const decoys = [];
  if (mech.has('decoys')) {
    const n = Math.round(Math.min(6, 1 + t * 6) * mods.decoyScale);
    for (let i = 0; i < n; i++) { const tt = take(deadEnds.length && rand() < 0.5 ? deadEnds : branch); if (tt) decoys.push(tt); }
  }

  // ---- hazards: budgeted, with a cap on DISTINCT types so early/eased
  //      levels never stack (fixes the old "blob + spike = impossible") ----
  const hazardTypes = ['crawlers', 'spikes', 'turrets', 'rotators'].filter(k => mech.has(k));
  let typeCap = t < 0.28 ? 1 : t < 0.52 ? 2 : t < 0.76 ? 3 : 4;
  if (mods.hazardScale < 0.5) typeCap = Math.min(typeCap, 1);
  shuffle(hazardTypes, rand);
  const useTypes = hazardTypes.slice(0, typeCap);
  let budget = Math.round(Math.min(9, t * 9) * mods.hazardScale);

  const crawlers = [], spikes = [], turrets = [], rotators = [];
  const spend = () => budget > 0 && (budget--, true);
  for (const type of useTypes) {
    const want = Math.max(1, Math.ceil(budget / Math.max(1, useTypes.length)));
    for (let i = 0; i < want && budget > 0; i++) {
      // crawlers & rotators must NOT sit on the mandatory route (they'd block it)
      if (type === 'crawlers') { const path = makePatrol(grid, gw, gh, openTiles, ri, start, finish, safe); if (path.length >= 2 && spend()) crawlers.push({ path, speed: (2.0 + rand() * 1.4) * (mods.slowHazards || 1) }); }
      else if (type === 'spikes') { const tt = take(branch.length ? branch : openTiles); if (tt && spend()) spikes.push({ ...tt, phase: rand(), period: (1.7 + rand() * 1.1) / (mods.slowHazards || 1) }); }
      else if (type === 'turrets') { const tt = take(branch.length ? branch : openTiles); if (tt && spend()) turrets.push({ ...tt, dir: openDir(grid, tt), period: (1.7 + rand() * 1.0) / (mods.slowHazards || 1), phase: rand() }); }
      else if (type === 'rotators') { const tt = take(branch.length ? branch : openTiles); if (tt && spend()) rotators.push({ ...tt, len: 1 + ri(2), speed: (rand() < 0.5 ? 1 : -1) * (0.7 + rand() * 1.0) * (mods.slowHazards || 1) }); }
    }
  }

  // ---- speed pads — placed on LONG straight corridors so the boring
  //      straights become a fun "zoom" (two-way; behaviour handled in game) ----
  const boostPads = [];
  if (mech.has('boostPads')) {
    const n = Math.min(4, 1 + Math.floor(t * 4));
    for (let i = 0; i < n; i++) { const seg = longCorridorSlot(grid, openTiles, ri, occupied, safe) || corridorSlot(grid, openTiles, ri, occupied); if (seg) { boostPads.push({ tx: seg.tx, ty: seg.ty, dir: seg.dir }); occupied.add(key(seg.tx, seg.ty)); } }
  }
  if (mods.addBoost && boostPads.length === 0) { const seg = longCorridorSlot(grid, openTiles, ri, occupied, safe) || corridorSlot(grid, openTiles, ri, occupied); if (seg) { boostPads.push({ tx: seg.tx, ty: seg.ty, dir: seg.dir }); occupied.add(key(seg.tx, seg.ty)); } }

  // ---- bouncers ----
  const bouncers = [];
  if (mech.has('bouncers')) { const n = Math.min(3, 1 + Math.floor(t * 3)); for (let i = 0; i < n; i++) { const tt = take(branch.length ? branch : openTiles); if (tt) bouncers.push(tt); } }

  // ---- moving (sliding) walls ----
  const movingWalls = [];
  if (mech.has('movingWalls')) {
    const n = Math.min(4, 1 + Math.floor(t * 4));
    for (let i = 0; i < n; i++) {
      const seg = corridorSlot(grid, openTiles, ri, occupied);
      if (seg) { movingWalls.push({ tx: seg.tx, ty: seg.ty, dir: seg.dir, period: 2.0 + rand() * 1.2, phase: rand() }); occupied.add(key(seg.tx, seg.ty)); }
    }
  }

  // ---- size zones ----
  const sizeZones = [];
  if (mech.has('sizeZones')) { const n = Math.min(2, 1 + Math.floor(t * 2)); for (let i = 0; i < n; i++) { const tt = take(branch.length ? branch : openTiles); if (tt) sizeZones.push({ ...tt, kind: rand() < 0.5 ? 'shrink' : 'grow' }); } }

  // ---- power-ups ----
  const powerups = [];
  if (mech.has('powerups')) {
    const n = Math.min(3, 1 + Math.floor(t * 2.5));
    for (let i = 0; i < n; i++) { const tt = (rand() < 0.5 ? takeSafe() : take(branch)); if (tt) powerups.push({ ...tt, type: POWERUP_POOL[ri(POWERUP_POOL.length)] }); }
  }
  if (mods.guaranteePowerup) { const tt = takeSafe() || take(openTiles); if (tt) powerups.push({ ...tt, type: mods.guaranteePowerup }); }

  // ---- world-wide current (ocean / signature) ----
  let current = null;
  const world = worldForLevel(lvl);
  if (world.sig === 'current') { const ang = ri(4) * Math.PI / 2; current = { x: Math.cos(ang), y: Math.sin(ang), strength: 5 + t * 4 }; }

  return finalize(plan, grid, gw, gh, start, finish, safe,
    { coins, decoys, powerups, boostPads, bouncers, crawlers, spikes, turrets, sizeZones, rotators, movingWalls, current });
}

// ---------------------------------------------------------------
//  finalize: attach world, mechanics, difficulty, par time, totals
// ---------------------------------------------------------------
function finalize(plan, grid, gw, gh, start, finish, safe, ent) {
  const lvl = plan.stage;
  const world = worldForLevel(lvl);
  const mech = mechanicsForLevel(lvl);
  const coinTotal = ent.coins.length;
  // par time scales with maze span + difficulty
  const span = (gw + gh);
  const par = (8 + span * 0.7 + (plan.difficulty - 800) * 0.01) * 1000;
  return {
    level: lvl, stage: lvl, world, mechanics: mech,
    difficulty: plan.difficulty, mods: plan.mods,
    grid, gw, gh, start, finish, safe,
    coins: ent.coins, coinTotal,
    decoys: ent.decoys || [], powerups: ent.powerups || [],
    boostPads: ent.boostPads || [], bouncers: ent.bouncers || [],
    crawlers: ent.crawlers || [], spikes: ent.spikes || [],
    turrets: ent.turrets || [], sizeZones: ent.sizeZones || [],
    rotators: ent.rotators || [], movingWalls: ent.movingWalls || [],
    portals: ent.portals || [], current: ent.current || null,
    biggerGoal: !!plan.mods.biggerGoal, forgive: plan.mods.forgive || 0,
    parTimeMs: par,
  };
}

// ---------------------------------------------------------------
//  helpers
// ---------------------------------------------------------------
function buildMaze(cols, rows, braid, rand) {
  const ri = (n) => Math.floor(rand() * n);
  const gw = cols * 2 + 1, gh = rows * 2 + 1;
  const grid = Array.from({ length: gh }, () => new Array(gw).fill(1));
  const open = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const stack = [[0, 0]]; open[0][0] = true; grid[1][1] = 0;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1]; const nb = [];
    for (const [dx, dy] of DIRS) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !open[ny][nx]) nb.push([nx, ny, dx, dy]); }
    if (!nb.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = nb[ri(nb.length)];
    open[ny][nx] = true; grid[ny * 2 + 1][nx * 2 + 1] = 0; grid[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = 0; stack.push([nx, ny]);
  }
  for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
    if (grid[y][x] !== 1) continue;
    const horiz = (x % 2 === 0 && y % 2 === 1), vert = (x % 2 === 1 && y % 2 === 0);
    if (!horiz && !vert) continue;
    const a = horiz ? grid[y][x - 1] === 0 && grid[y][x + 1] === 0 : grid[y - 1][x] === 0 && grid[y + 1][x] === 0;
    if (a && rand() < braid) grid[y][x] = 0;
  }
  return { grid, gw, gh };
}

function bfs(grid, gw, gh, start, dist, parent) {
  const q = [start]; dist.set(key(start.tx, start.ty), 0); parent.set(key(start.tx, start.ty), null);
  while (q.length) { const c = q.shift(); const cd = dist.get(key(c.tx, c.ty));
    for (const [dx, dy] of DIRS) { const nx = c.tx + dx, ny = c.ty + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue; if (grid[ny][nx] !== 0) continue; const k = key(nx, ny); if (dist.has(k)) continue; dist.set(k, cd + 1); parent.set(k, key(c.tx, c.ty)); q.push({ tx: nx, ty: ny }); } }
}
function pathKeys(grid, gw, gh, start, finish) {
  const dist = new Map(), parent = new Map(); bfs(grid, gw, gh, start, dist, parent);
  const out = []; let cur = key(finish.tx, finish.ty); while (cur != null) { out.push(cur); cur = parent.get(cur); } return out;
}
function openDir(grid, tt) { for (const [dx, dy] of DIRS) if (grid[tt.ty + dy]?.[tt.tx + dx] === 0) return { x: dx, y: dy }; return { x: 1, y: 0 }; }
function corridorSlot(grid, openTiles, ri, occupied) {
  // a mid-corridor open tile with open neighbours on an axis (room to slide / launch)
  for (let i = 0; i < 50; i++) {
    const tt = openTiles[ri(openTiles.length)]; if (occupied.has(key(tt.tx, tt.ty))) continue;
    const h = grid[tt.ty]?.[tt.tx - 1] === 0 && grid[tt.ty]?.[tt.tx + 1] === 0;
    const v = grid[tt.ty - 1]?.[tt.tx] === 0 && grid[tt.ty + 1]?.[tt.tx] === 0;
    if (h && !v) return { tx: tt.tx, ty: tt.ty, dir: { x: 1, y: 0 } };
    if (v && !h) return { tx: tt.tx, ty: tt.ty, dir: { x: 0, y: 1 } };
  }
  return null;
}
function makePatrol(grid, gw, gh, openTiles, ri, start, finish, safe) {
  // seed & walk only on tiles OFF the safe path, away from spawn — so a
  // toxic blob never blocks the one route the player must take.
  const offSafe = (tt) => !safe || !safe.has(key(tt.tx, tt.ty));
  const far = (tt) => offSafe(tt) && (Math.abs(tt.tx - start.tx) + Math.abs(tt.ty - start.ty) > 3) && (Math.abs(tt.tx - finish.tx) + Math.abs(tt.ty - finish.ty) > 1);
  let cur = null;
  for (let i = 0; i < 30; i++) { const c = openTiles[ri(openTiles.length)]; if (far(c)) { cur = c; break; } }
  if (!cur) return [];                          // no safe spot -> spawn no crawler
  const path = [cur]; const seen = new Set([key(cur.tx, cur.ty)]); const steps = 3 + ri(4);
  for (let i = 0; i < steps; i++) { const opts = DIRS.map(([dx, dy]) => ({ tx: cur.tx + dx, ty: cur.ty + dy })).filter(n => grid[n.ty]?.[n.tx] === 0 && !seen.has(key(n.tx, n.ty)) && offSafe(n)); if (!opts.length) break; cur = opts[ri(opts.length)]; seen.add(key(cur.tx, cur.ty)); path.push(cur); }
  return path;
}

// a tile in the MIDDLE of a long straight run (>=4 open tiles) — ideal for a speed pad
function longCorridorSlot(grid, openTiles, ri, occupied, safe) {
  const runLen = (tt, dx, dy) => { let n = 0, x = tt.tx + dx, y = tt.ty + dy; while (grid[y]?.[x] === 0) { n++; x += dx; y += dy; } return n; };
  let best = null;
  for (let i = 0; i < 70; i++) {
    const tt = openTiles[ri(openTiles.length)]; if (occupied.has(key(tt.tx, tt.ty))) continue;
    const h = 1 + runLen(tt, 1, 0) + runLen(tt, -1, 0), v = 1 + runLen(tt, 0, 1) + runLen(tt, 0, -1);
    const onSafe = safe && safe.has(key(tt.tx, tt.ty));
    if (h >= 4 && h >= v) { const cand = { tx: tt.tx, ty: tt.ty, dir: { x: 1, y: 0 }, score: h + (onSafe ? 3 : 0) }; if (!best || cand.score > best.score) best = cand; }
    else if (v >= 4) { const cand = { tx: tt.tx, ty: tt.ty, dir: { x: 0, y: 1 }, score: v + (onSafe ? 3 : 0) }; if (!best || cand.score > best.score) best = cand; }
    if (best && best.score >= 7) break;
  }
  return best;
}
function shuffle(a, rand) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
function same(a, b) { return a.tx === b.tx && a.ty === b.ty; }
