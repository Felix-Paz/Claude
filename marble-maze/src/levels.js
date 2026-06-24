// =====================================================================
//  levels.js — procedural, seeded maze + content generation.
//  Same level number => same maze (mastery, time-attack, replay).
//
//  Pipeline:
//   1. Recursive-backtracker perfect maze on a cell grid.
//   2. Braiding: knock out extra walls => loops & alternate routes
//      (the basis of risk/reward shortcuts).
//   3. BFS: find the farthest cell for the finish + a guaranteed
//      SAFE PATH that is kept clear of lethal static hazards.
//   4. Place coins (main route + risky branches), decoys, hazards,
//      boost pads, bouncers, power-ups — gated by mechanicsForLevel().
//
//  All positions are TILE coordinates; the game converts to world space.
// =====================================================================
import {
  mazeSizeForLevel, mechanicsForLevel, worldForLevel,
  POWERUP_POOL, timeTargetForLevel,
} from './config.js';

// --- seeded RNG (mulberry32) ---
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
const DIRS = [ [0,-1], [1,0], [0,1], [-1,0] ]; // N E S W

export function generateLevel(level) {
  const rand = rng(level * 2654435761 + 12345);
  const ri = (n) => Math.floor(rand() * n);
  const world = worldForLevel(level);
  const mech = mechanicsForLevel(level);
  const { cols, rows } = mazeSizeForLevel(level);

  // tile grid: walls everywhere, carve open cells/passages
  const gw = cols * 2 + 1, gh = rows * 2 + 1;
  const grid = Array.from({ length: gh }, () => new Array(gw).fill(1));
  const cellOpen = Array.from({ length: rows }, () => new Array(cols).fill(false));

  // --- recursive backtracker ---
  const stack = [[0, 0]];
  cellOpen[0][0] = true;
  grid[1][1] = 0;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const nbrs = [];
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !cellOpen[ny][nx]) nbrs.push([nx, ny, dx, dy]);
    }
    if (!nbrs.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = nbrs[ri(nbrs.length)];
    cellOpen[ny][nx] = true;
    grid[ny * 2 + 1][nx * 2 + 1] = 0;
    grid[cy * 2 + 1 + dy][cx * 2 + 1 + dx] = 0; // passage tile
    stack.push([nx, ny]);
  }

  // --- braiding: remove extra interior walls for loops / shortcuts ---
  const braid = Math.min(0.34, 0.06 + level * 0.012);
  for (let y = 1; y < gh - 1; y++) {
    for (let x = 1; x < gw - 1; x++) {
      if (grid[y][x] !== 1) continue;
      // only consider "passage" wall tiles (between two cells)
      const horiz = (x % 2 === 0 && y % 2 === 1);
      const vert  = (x % 2 === 1 && y % 2 === 0);
      if (!horiz && !vert) continue;
      const a = horiz ? grid[y][x-1] === 0 && grid[y][x+1] === 0
                      : grid[y-1][x] === 0 && grid[y+1][x] === 0;
      if (a && rand() < braid) grid[y][x] = 0;
    }
  }

  const start = { tx: 1, ty: 1 };

  // --- BFS distances from start over open tiles ---
  const dist = new Map(); const parent = new Map();
  bfs(grid, gw, gh, start, dist, parent);

  // finish = farthest open CELL tile from start
  let finish = { tx: gw - 2, ty: gh - 2 }, best = -1;
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    const tx = cx * 2 + 1, ty = cy * 2 + 1;
    const d = dist.get(key(tx, ty));
    if (d != null && d > best) { best = d; finish = { tx, ty }; }
  }

  // safe path start -> finish (kept clear of lethal static stuff)
  const safe = new Set();
  let cur = key(finish.tx, finish.ty);
  while (cur != null) { safe.add(cur); cur = parent.get(cur); }

  // collect open tiles + classify
  const openTiles = [];
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (grid[y][x] === 0) openTiles.push({ tx: x, ty: y });
  const isCell = (t) => t.tx % 2 === 1 && t.ty % 2 === 1;
  const openNeighbors = (t) => DIRS.reduce((n, [dx, dy]) => n + (grid[t.ty+dy]?.[t.tx+dx] === 0 ? 1 : 0), 0);
  const deadEnds = openTiles.filter(t => isCell(t) && openNeighbors(t) === 1 &&
    !(t.tx === start.tx && t.ty === start.ty) && !(t.tx === finish.tx && t.ty === finish.ty));
  const branch = openTiles.filter(t => !safe.has(key(t.tx, t.ty)));

  // occupancy bookkeeping
  const occupied = new Set([key(start.tx, start.ty), key(finish.tx, finish.ty)]);
  // keep tiles right next to spawn clear/safe
  for (const [dx, dy] of DIRS) occupied.add(key(start.tx + dx, start.ty + dy));
  const take = (pool) => {
    for (let i = 0; i < 40; i++) {
      const t = pool[ri(pool.length)];
      if (!t) return null;
      const k = key(t.tx, t.ty);
      if (!occupied.has(k)) { occupied.add(k); return t; }
    }
    return null;
  };
  const takeSafe = () => {
    const safeList = openTiles.filter(t => safe.has(key(t.tx, t.ty)) &&
      !occupied.has(key(t.tx, t.ty)) &&
      !(t.tx === start.tx && t.ty === start.ty) && !(t.tx === finish.tx && t.ty === finish.ty));
    if (!safeList.length) return null;
    const t = safeList[ri(safeList.length)]; occupied.add(key(t.tx, t.ty)); return t;
  };

  // ---- COINS: main-route trail + risky branch clusters ----
  const coins = [];
  // along the safe path (skip endpoints), every other path tile
  const pathArr = [...safe].map(k => { const [x, y] = k.split(',').map(Number); return { tx: x, ty: y, d: dist.get(k) || 0 }; })
                          .sort((a, b) => a.d - b.d);
  for (let i = 2; i < pathArr.length - 2; i += 2) {
    const t = pathArr[i];
    if (!occupied.has(key(t.tx, t.ty)) && rand() < 0.8) { coins.push({ tx: t.tx, ty: t.ty }); occupied.add(key(t.tx, t.ty)); }
  }
  // risky branch coins (often near dead-ends / hazards)
  const riskCoinTarget = Math.min(14, 3 + Math.floor(level * 0.8));
  const riskSpots = [];
  for (let i = 0; i < riskCoinTarget; i++) {
    const t = take(deadEnds.length && rand() < 0.6 ? deadEnds : branch);
    if (t) { coins.push({ tx: t.tx, ty: t.ty, risk: true }); riskSpots.push(t); }
  }

  // ---- DECOY (wrong) holes — only off the safe path ----
  const decoys = [];
  if (mech.has('decoys')) {
    const n = Math.min(7, 1 + Math.floor((level - 2) * 0.6));
    for (let i = 0; i < n; i++) { const t = take(deadEnds.length && rand() < 0.5 ? deadEnds : branch); if (t) decoys.push(t); }
  }

  // ---- BOOST PADS (on path or branch) ----
  const boostPads = [];
  if (mech.has('boostPads')) {
    const n = Math.min(5, 1 + Math.floor(level / 4));
    for (let i = 0; i < n; i++) {
      const t = (rand() < 0.6 ? takeSafe() : take(branch));
      if (t) boostPads.push({ ...t, dir: dominantOpenDir(grid, t) });
    }
  }

  // ---- BOUNCERS ----
  const bouncers = [];
  if (mech.has('bouncers')) {
    const n = Math.min(4, 1 + Math.floor(level / 6));
    for (let i = 0; i < n; i++) { const t = take(branch.length ? branch : openTiles); if (t) bouncers.push(t); }
  }

  // ---- CRAWLERS (patrolling toxic blobs) ----
  const crawlers = [];
  if (mech.has('crawlers')) {
    const n = Math.min(5, 1 + Math.floor(level / 5));
    for (let i = 0; i < n; i++) {
      const path = makePatrol(grid, gw, gh, openTiles, ri, start, finish);
      if (path.length >= 2) crawlers.push({ path, speed: 2.2 + rand() * 1.6 + level * 0.02 });
    }
  }

  // ---- SPIKES (timed) on branches near coins ----
  const spikes = [];
  if (mech.has('spikes')) {
    const n = Math.min(8, 2 + Math.floor(level / 4));
    for (let i = 0; i < n; i++) {
      const t = take(branch.length ? branch : openTiles);
      if (t) spikes.push({ ...t, phase: rand(), period: 1.6 + rand() * 1.2 });
    }
  }

  // ---- TURRETS (shoot across corridors) ----
  const turrets = [];
  if (mech.has('turrets')) {
    const n = Math.min(5, 1 + Math.floor((level - 10) / 4));
    for (let i = 0; i < n; i++) {
      const t = take(branch.length ? branch : openTiles);
      if (t) turrets.push({ ...t, dir: dominantOpenDir(grid, t), period: 1.6 + rand() * 1.0, phase: rand() });
    }
  }

  // ---- SIZE ZONES ----
  const sizeZones = [];
  if (mech.has('sizeZones')) {
    const n = Math.min(3, 1 + Math.floor(level / 12));
    for (let i = 0; i < n; i++) { const t = take(branch.length ? branch : openTiles); if (t) sizeZones.push({ ...t, kind: rand() < 0.5 ? 'shrink' : 'grow' }); }
  }

  // ---- ROTATING ARMS ----
  const rotators = [];
  if (mech.has('rotators')) {
    const n = Math.min(4, 1 + Math.floor((level - 15) / 5));
    for (let i = 0; i < n; i++) {
      const t = take(openTiles);
      if (t) rotators.push({ ...t, len: 2 + ri(2), speed: (rand() < 0.5 ? 1 : -1) * (0.8 + rand() * 1.2) });
    }
  }

  // ---- POWER-UPS ----
  const powerups = [];
  if (mech.has('powerups')) {
    const n = Math.min(3, 1 + Math.floor(level / 8));
    for (let i = 0; i < n; i++) {
      const t = (rand() < 0.5 ? takeSafe() : take(branch));
      if (t) powerups.push({ ...t, type: POWERUP_POOL[ri(POWERUP_POOL.length)] });
    }
  }

  // ---- WORLD-WIDE FORCE CURRENT (ocean/space signatures) ----
  let current = null;
  if (mech.has('currents') || world.signature === 'currents') {
    const ang = ri(4) * Math.PI / 2;
    current = { x: Math.cos(ang), y: Math.sin(ang), strength: 6 + level * 0.1 };
  }

  const coinTotal = coins.length;
  return {
    level, world, mechanics: mech,
    grid, gw, gh,
    start, finish, safe,
    coins, coinTotal,
    decoys, boostPads, bouncers, crawlers, spikes, turrets, sizeZones, rotators, powerups,
    current,
    parTimeMs: timeTargetForLevel(level) * 1000,
  };
}

// ---- helpers ----
function bfs(grid, gw, gh, start, dist, parent) {
  const q = [start]; dist.set(key(start.tx, start.ty), 0); parent.set(key(start.tx, start.ty), null);
  while (q.length) {
    const c = q.shift(); const cd = dist.get(key(c.tx, c.ty));
    for (const [dx, dy] of DIRS) {
      const nx = c.tx + dx, ny = c.ty + dy;
      if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
      if (grid[ny][nx] !== 0) continue;
      const k = key(nx, ny);
      if (dist.has(k)) continue;
      dist.set(k, cd + 1); parent.set(k, key(c.tx, c.ty)); q.push({ tx: nx, ty: ny });
    }
  }
}

function dominantOpenDir(grid, t) {
  // pick a direction that has an open run (for boost/turret aiming)
  const opts = [];
  for (const [dx, dy] of DIRS) if (grid[t.ty+dy]?.[t.tx+dx] === 0) opts.push([dx, dy]);
  const d = opts[0] || [1, 0];
  return { x: d[0], y: d[1] };
}

function makePatrol(grid, gw, gh, openTiles, ri, start, finish) {
  // random walk along open tiles to form a short patrol path.
  // Seed away from the spawn (and finish) so the player is never killed
  // the instant a level begins.
  const far = (t) => (!start || Math.abs(t.tx - start.tx) + Math.abs(t.ty - start.ty) > 3) &&
                     (!finish || Math.abs(t.tx - finish.tx) + Math.abs(t.ty - finish.ty) > 1);
  let cur = null;
  for (let i = 0; i < 24; i++) { const c = openTiles[ri(openTiles.length)]; if (far(c)) { cur = c; break; } }
  if (!cur) cur = openTiles[ri(openTiles.length)];
  const path = [cur]; const seen = new Set([key(cur.tx, cur.ty)]);
  const steps = 3 + ri(4);
  for (let i = 0; i < steps; i++) {
    const opts = DIRS.map(([dx, dy]) => ({ tx: cur.tx + dx, ty: cur.ty + dy }))
      .filter(n => grid[n.ty]?.[n.tx] === 0 && !seen.has(key(n.tx, n.ty)));
    if (!opts.length) break;
    cur = opts[ri(opts.length)]; seen.add(key(cur.tx, cur.ty)); path.push(cur);
  }
  return path;
}
