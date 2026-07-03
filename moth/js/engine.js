/* ════════════════════════════════════════════════════════════════════════
   MOTH · THE LAMPLIGHT ENGINE
   ────────────────────────────────────────────────────────────────────────
   A player-retention engine. Everything the game does — difficulty, rewards,
   pacing, quests, even the words it says to you — is downstream of a live
   statistical portrait of the person holding the pointer.

   Architecture (one-way data flow):

     game events ──▶ TELEMETRY (append-only stream + counters)
                        │
                        ▼
                    MODEL (skill · risk · tilt · boredom · motivation)
                        │
          ┌─────────────┼──────────────┬──────────────┐
          ▼             ▼              ▼              ▼
       DIRECTOR      REWARDS        HOOKS          QUESTS
     (flow-band    (variable-     (session arc,  (generated from
      difficulty,   ratio + pity,  streaks,       the motivation
      mercy/spike)  satiation      forecasts,     vector, daily)
                    budget)        peak-end)
          │             │              │              │
          └─────────────┴──────┬───────┴──────────────┘
                               ▼
                         game parameters

   The engine never lies to the player: every card draw is a real draw,
   every forecast is honoured, and the Field Notes screen shows the model
   reading you back. It retains by being generous at the right moments,
   not by cheating.
   ════════════════════════════════════════════════════════════════════ */
'use strict';

window.ENGINE = (() => {

  /* ── utilities ─────────────────────────────────────────────────────── */
  const now   = () => Date.now();
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp  = (a, b, t) => a + (b - a) * t;
  const ewma  = (prev, x, a) => prev + (x - prev) * a;
  const rand  = (a, b) => a + Math.random() * (b - a);
  const irand = (a, b) => Math.floor(rand(a, b + 1));
  const pickOf = arr => arr[Math.floor(Math.random() * arr.length)];

  const dayKey = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const keyToDate = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const nightsBetween = (k1, k2) => Math.round((keyToDate(k2) - keyToDate(k1)) / 86400000);
  const tomorrowKey = () => { const d = new Date(); d.setDate(d.getDate() + 1); return dayKey(d); };

  /* ── catalogues: inks (palettes) & trails ──────────────────────────── */
  // Each ink is a full scene palette. Unlocks are the collection layer.
  const INKS = [
    { id: 'lamplight', name: 'Lamplight',  latin: 'Noctua lucerna',
      bg: '#12101c', bg2: '#1b1729', paper: '#efe7d4', flame: '#ffb454', hot: '#ff6a2b', moon: '#7e93ad',
      unlock: { type: 'start' } },
    { id: 'moonglass', name: 'Moonglass',  latin: 'Selenia vitrea',
      bg: '#0b1220', bg2: '#121c30', paper: '#e6eef2', flame: '#9fd8ff', hot: '#5fa8ff', moon: '#8fa8c8',
      unlock: { type: 'level', v: 3 } },
    { id: 'foxfire',   name: 'Foxfire',    latin: 'Ignis vulpina',
      bg: '#0a1410', bg2: '#101f18', paper: '#e4ecdd', flame: '#7fe08c', hot: '#3fbf6f', moon: '#7fa892',
      unlock: { type: 'level', v: 5 } },
    { id: 'vermeil',   name: 'Vermeil',    latin: 'Cinnabaris ardens',
      bg: '#170b0d', bg2: '#221114', paper: '#f2e3d8', flame: '#ff5c49', hot: '#ff2e1f', moon: '#b08585',
      unlock: { type: 'level', v: 7 } },
    { id: 'absinthe',  name: 'Absinthe',   latin: 'Artemisia lumen',
      bg: '#10140a', bg2: '#181f10', paper: '#eef0da', flame: '#d6e85c', hot: '#a8c92e', moon: '#96a37b',
      unlock: { type: 'lumen', v: 1200 } },
    { id: 'aubergine', name: 'Aubergine',  latin: 'Solanum nocturna',
      bg: '#170f1e', bg2: '#22172e', paper: '#ece2f0', flame: '#c77dff', hot: '#a44df0', moon: '#9a86b3',
      unlock: { type: 'lumen', v: 2200 } },
    { id: 'ivory',     name: 'Ivory Dawn', latin: 'Aurora eburnea',
      bg: '#efe7d4', bg2: '#e6dcc4', paper: '#1a1712', flame: '#ff6a2b', hot: '#e03d00', moon: '#7a6f5c',
      unlock: { type: 'dawn' } },
    { id: 'oilslick',  name: 'Oilslick',   latin: 'Iris petrolea',
      bg: '#0c0c12', bg2: '#14121d', paper: '#e8e6f0', flame: '#7df0d4', hot: '#c77dff', moon: '#8fb8c9',
      iridescent: true,
      unlock: { type: 'mythic' } },
  ];

  const TRAILS = [
    { id: 'dust',  name: 'Wing-dust',   unlock: { type: 'start' } },
    { id: 'ember', name: 'Ember Line',  unlock: { type: 'level', v: 4 } },
    { id: 'silk',  name: 'Silk Thread', unlock: { type: 'level', v: 6 } },
    { id: 'prism', name: 'Prism Wake',  unlock: { type: 'lumen', v: 1600 } },
  ];

  const LEVEL_NAMES = ['Ovum', 'Instar I', 'Instar II', 'Instar III', 'Instar IV',
    'Instar V', 'Instar VI', 'Instar VII', 'Chrysalis', 'Imago', 'Imago Aurea'];

  const xpNeed = lvl => Math.round(150 * Math.pow(lvl, 1.42));

  /* ── persistence ───────────────────────────────────────────────────── */
  const SAVE_KEY = 'moth.save.v1';

  const defaultSave = () => ({
    v: 1,
    born: now(),
    lumen: 0,
    dust: 0,
    xp: Math.round(xpNeed(1) * 0.42),   // endowed progress: the bar never starts empty
    streak: { count: 0, last: null, freezes: 1, history: [] },
    inks:   { owned: ['lamplight'], active: 'lamplight' },
    trails: { owned: ['dust'], active: 'dust' },
    quests: { date: null, list: [] },
    pity: 0,
    forecast: null,                      // { date, id, label } — tomorrow's honoured promise
    dayBoon: null,                       // { date, id } — today's active boon
    boons: { moteBoost: 0 },             // flights remaining of +25% motes
    flags: { mythicDrawn: false, sawDawn: false, ftue: true },
    best: { pot: 0, hour: 0 },
    totals: { flights: 0, deaths: 0, dawns: 0, banked: 0, grazeSec: 0, motes: 0, playMs: 0, sessions: 0 },
    model: {
      skill: 0.35, risk: 0.5, tilt: 0, boredom: 0,
      motiv: { mastery: 0.25, fortune: 0.25, order: 0.25, beauty: 0.25 },
      skillHist: [],
    },
    dailyGiftDay: null,
    log: [],                             // last few nights, for the streak row
  });

  let S;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    S = raw ? Object.assign(defaultSave(), JSON.parse(raw)) : defaultSave();
    // deep-merge the bits that matter across versions
    S.model  = Object.assign(defaultSave().model, S.model);
    S.totals = Object.assign(defaultSave().totals, S.totals);
  } catch (e) { S = defaultSave(); }

  let saveTimer = null;
  const persist = (immediate) => {
    if (saveTimer) clearTimeout(saveTimer);
    const write = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} };
    if (immediate) write(); else saveTimer = setTimeout(write, 400);
  };

  const wipe = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); };

  /* ── telemetry: the sensory organ ──────────────────────────────────── */
  const TEL = {
    buf: [],           // ring buffer of recent events
    counters: {},      // lifetime-ish counts per event type (session)
    observations: 0,   // total events ever seen this session
    emit(type, data = {}) {
      const e = { t: now(), type, ...data };
      this.buf.push(e);
      if (this.buf.length > 800) this.buf.splice(0, 200);
      this.counters[type] = (this.counters[type] || 0) + 1;
      this.observations++;
      MODEL.onEvent(type, e);
      QUESTS.onEvent(type, e);
      HOOKS.onEvent(type, e);
      return e;
    },
  };

  /* ── player model: the portrait ────────────────────────────────────── */
  const MODEL = {
    get skill()   { return S.model.skill; },
    get risk()    { return S.model.risk; },
    get tilt()    { return S.model.tilt; },
    get boredom() { return S.model.boredom; },
    get motiv()   { return S.model.motiv; },

    _lastDeathAt: 0,
    _deathStreak: 0,
    _grazeDepthAvg: 0.4,

    onEvent(type, e) {
      const m = S.model;
      switch (type) {

        case 'run:start': {
          // fast retry after death → mastery drive; also cools tilt slightly
          if (this._lastDeathAt && e.t - this._lastDeathAt < 7000) this.bump('mastery', 0.7);
          m.tilt = Math.max(0, m.tilt - 0.08);
          break;
        }

        case 'run:end': {
          // perf ∈ [0,1] computed by the scene: hours reached, graze quality, cause
          m.skill = ewma(m.skill, clamp(e.perf, 0, 1), 0.22);
          m.skillHist.push(Math.round(m.skill * 100) / 100);
          if (m.skillHist.length > 40) m.skillHist.shift();
          if (!e.died) this._deathStreak = 0;
          break;
        }

        case 'death': {
          this._lastDeathAt = e.t;
          this._deathStreak++;
          // early deaths tilt harder — frustration is front-loaded
          const early = e.hour <= 1 ? 1 : e.hour <= 2 ? 0.6 : 0.3;
          m.tilt = clamp(m.tilt + 0.22 * early + (this._deathStreak >= 2 ? 0.15 : 0), 0, 1);
          m.boredom = Math.max(0, m.boredom - 0.3);
          break;
        }

        case 'graze:depth': {
          // e.depth ∈ [0,1] — how deep into the band the player habitually sits
          this._grazeDepthAvg = ewma(this._grazeDepthAvg, e.depth, 0.05);
          m.risk = ewma(m.risk, clamp(this._grazeDepthAvg * 1.15, 0, 1), 0.04);
          break;
        }

        case 'gate': {
          m.risk = ewma(m.risk, e.choice === 'stay' ? 1 : 0, 0.25);
          this.bump(e.choice === 'stay' ? 'fortune' : 'order', e.choice === 'stay' ? 0.5 : 0.3);
          break;
        }

        case 'hour:safe': {
          // survived an hour while barely touching the band and under-challenged → boredom
          const under = S.model.skill > 0.55 && e.grazeFrac < 0.18;
          m.boredom = clamp(m.boredom + (under ? 0.22 : -0.1), 0, 1);
          break;
        }

        case 'cards:pick': {
          if (e.dwellMs < 1400) this.bump('fortune', 0.35);
          break;
        }

        case 'quest:claim':  this.bump('order', 0.7);  break;
        case 'ink:equip':    this.bump('beauty', 0.8); break;
        case 'drawer:dwell': this.bump('beauty', 0.2 * (e.ms / 5000)); break;
        case 'wisp':         this.bump('fortune', 0.2); break;
        case 'deep:tick':    this.bump('mastery', 0.04); break;
      }
      persist();
    },

    bump(axis, w) {
      const mv = S.model.motiv;
      mv[axis] += w * 0.08;
      const sum = mv.mastery + mv.fortune + mv.order + mv.beauty;
      for (const k in mv) mv[k] /= sum;
    },

    deathStreak() { return this._deathStreak; },

    // Personalised survival odds shown at the gate — the engine reading you aloud.
    deathP(hour) {
      const I = DIRECTOR.lastIntensity || 0.5;
      const p = 0.10 + 0.105 * hour * (0.7 + 0.5 * I) - (S.model.skill - 0.45) * 0.55;
      return clamp(p, 0.04, 0.93);
    },

    // Field Notes prose: the model describing its subject.
    reading() {
      const m = S.model, lines = [];
      lines.push(m.risk > 0.66 ? 'Subject courts the flame closely; risk appetite pronounced.'
               : m.risk < 0.34 ? 'Subject keeps a wary orbit; banks early, burns rarely.'
               : 'Subject balances the graze against the way home.');
      lines.push(m.skill > 0.7 ? 'Flight control is exceptional. Increasing turbulence.'
               : m.skill > 0.45 ? 'Flight control is steadying. The night deepens accordingly.'
               : 'Wings still learning. The flame is being gentle — for now.');
      const mv = m.motiv;
      const top = Object.keys(mv).sort((a, b) => mv[b] - mv[a])[0];
      lines.push({
        mastery: 'Primary drive: mastery. Tonight favours the deep graze.',
        fortune: 'Primary drive: fortune. The cards have noticed.',
        order:   'Primary drive: order. Tasks and tallies await below.',
        beauty:  'Primary drive: beauty. New inks are pinned in the drawer.',
      }[top]);
      if (m.tilt > 0.55) lines.push('Note: recent singeing. Mercy protocols engaged.');
      if (m.boredom > 0.5) lines.push('Note: signs of restlessness. Scheduling a surprise.');
      return lines;
    },
  };

  /* ── director: flow-band difficulty ────────────────────────────────── */
  // Keeps perceived challenge pinned just above the player's skill — the
  // Csíkszentmihályi flow channel — with mercy after death streaks and
  // deliberate spikes when boredom is detected.
  const DIRECTOR = {
    lastIntensity: 0.5,

    frame(hour, tIn, hourLen) {
      const m = S.model;
      const base = 0.30 + 0.155 * hour + 0.06 * (tIn / hourLen);   // night deepens
      const skillAdj = 0.68 + m.skill * 0.62;                       // your night ≠ my night
      let mercy = 1;
      if (m.tilt > 0.55) mercy *= 0.86;                             // frustrated → soften
      if (MODEL.deathStreak() >= 2 && hour <= 1) mercy *= 0.82;     // re-entry ramp
      let arc = 1;
      const phase = HOOKS.phase();
      if (phase === 'warmup') arc = 0.92;
      let spike = 0;
      if (m.boredom > 0.55) spike = 0.18;                           // bored → surprise them

      const I = clamp(base * skillAdj * mercy * arc + spike, 0.22, 1.85);
      this.lastIntensity = I;
      const n = clamp((I - 0.22) / (1.85 - 0.22), 0, 1);            // normalised

      return {
        intensity: I,
        flarePeriod: lerp(7.0, 2.1, n),        // seconds between flare telegraphs
        flareWarn:   lerp(1.15, 0.55, n),      // telegraph duration
        flareLen:    lerp(0.45, 1.0, n),       // tongue reach (fraction of field)
        cinderPeriod: lerp(9.0, 3.2, n),
        cinderSpeed:  lerp(46, 120, n),
        motePeriod:  lerp(0.34, 0.2, n),       // richer field when harder — risk pays
        moteBias:    lerp(0.45, 0.8, clamp(m.risk, 0, 1)),  // risk-takers get flame-side motes
        wispChance:  0.16 + (m.boredom > 0.55 ? 0.3 : 0) + (S.dayBoon?.id === 'golden' && hour >= 3 ? 0.2 : 0),
        mercy, spike,
      };
    },
  };

  /* ── rewards: variable-ratio schedule with a conscience ────────────── */
  const RARITIES = [
    { id: 'common',   w: 64 },
    { id: 'uncommon', w: 25 },
    { id: 'rare',     w: 9  },
    { id: 'mythic',   w: 2  },
  ];

  const REWARDS = {
    sessionDraws: 0,

    cardsEarned(hoursReached, dawned) {
      let n = 1;
      if (hoursReached >= 3) n++;
      if (dawned) n++;
      if (S.dayBoon?.id === 'spare') n++;
      return Math.min(n, 4);
    },

    _rollRarity(floor) {
      const gilded = S.dayBoon?.id === 'gilded';
      const order = ['common', 'uncommon', 'rare', 'mythic'];
      const floorIx = floor ? order.indexOf(floor) : 0;
      let pool = RARITIES.map((r, i) => ({ ...r }))
        .filter((r, i) => i >= floorIx);
      if (gilded) pool = pool.map(r => r.id === 'rare' || r.id === 'mythic' ? { ...r, w: r.w * 2.2 } : r);
      const total = pool.reduce((s, r) => s + r.w, 0);
      let roll = Math.random() * total;
      for (const r of pool) { roll -= r.w; if (roll <= 0) return r.id; }
      return pool[pool.length - 1].id;
    },

    _payload(rarity) {
      const lvl = PROGRESS.level();
      const scale = 1 + lvl * 0.12;
      switch (rarity) {
        case 'common': {
          const kind = Math.random() < 0.75 ? 'lumen' : 'xp';
          return kind === 'lumen'
            ? { kind, amount: Math.round(rand(55, 115) * scale), label: 'A pocket of lumen' }
            : { kind, amount: Math.round(45 * scale), label: 'A margin note', desc: 'Experience, pressed flat.' };
        }
        case 'uncommon': {
          const roll = Math.random();
          if (roll < 0.55) return { kind: 'lumen', amount: Math.round(rand(150, 260) * scale), label: 'A fold of lumen' };
          if (roll < 0.85) return { kind: 'boon', amount: 1, label: 'Sweet nectar', desc: 'Next flight: motes worth +25%.' };
          return { kind: 'freeze', amount: 1, label: 'Amber drop', desc: 'Preserves your streak through one missed night.' };
        }
        case 'rare': {
          return Math.random() < 0.6
            ? { kind: 'dust', amount: 1, label: 'Rare dust', desc: 'Scraped from a wing that touched the flame and lived.' }
            : { kind: 'lumen', amount: Math.round(rand(330, 470) * scale), label: 'A gilded cache' };
        }
        case 'mythic':
          return { kind: 'mythic', amount: 3, label: 'The Gilt Specimen',
                   desc: '3 dust, 600 lumen — and the Oilslick ink surrenders itself.' };
      }
    },

    // Draw a whole set at once. Every card is real; the near-miss is honest.
    drawSet(n = 3) {
      this.sessionDraws++;
      let floor = null;
      // warm welcome: the first draw of a session never insults you
      if (this.sessionDraws <= 1) floor = 'uncommon';
      // pity: droughts are capped by design, not luck
      const setFloor = S.pity >= 8 ? 'rare' : null;

      const cards = [];
      for (let i = 0; i < n; i++) {
        const r = this._rollRarity(setFloor || (i === 0 ? floor : null));
        cards.push({ rarity: r, ...this._payload(r) });
      }
      // pity ≥ 5 → at least one rare+ somewhere in the set (a genuine one)
      if (S.pity >= 5 && !cards.some(c => c.rarity === 'rare' || c.rarity === 'mythic')) {
        const ix = irand(0, n - 1);
        const r = Math.random() < 0.92 ? 'rare' : 'mythic';
        cards[ix] = { rarity: r, ...this._payload(r) };
      }
      return cards;
    },

    redeem(card) {
      switch (card.kind) {
        case 'lumen':  ECON.addLumen(card.amount, 'card'); break;
        case 'xp':     ECON.addXp(card.amount); break;
        case 'dust':   S.dust += card.amount; break;
        case 'boon':   S.boons.moteBoost = (S.boons.moteBoost || 0) + 1; break;
        case 'freeze': S.streak.freezes++; break;
        case 'mythic':
          S.dust += 3; ECON.addLumen(600, 'card');
          S.flags.mythicDrawn = true;
          break;
      }
      if (card.rarity === 'rare' || card.rarity === 'mythic') S.pity = 0; else S.pity++;
      persist(true);
    },
  };

  /* ── economy & progression ─────────────────────────────────────────── */
  const ECON = {
    addLumen(n, src) {
      S.lumen += n;
      if (src !== 'card') S.totals.banked += n;
      return this.addXp(n);
    },
    addXp(n) {
      const before = PROGRESS.level();
      S.xp += n;
      const after = PROGRESS.level();
      persist();
      const ups = [];
      for (let l = before + 1; l <= after; l++) ups.push(l);
      return ups;
    },
    spend(n) {
      if (S.lumen < n) return false;
      S.lumen -= n; persist(true); return true;
    },
  };

  const PROGRESS = {
    level() {
      let lvl = 1, acc = 0;
      while (acc + xpNeed(lvl) <= S.xp) { acc += xpNeed(lvl); lvl++; }
      return lvl;
    },
    levelName(l = this.level()) { return LEVEL_NAMES[Math.min(l, LEVEL_NAMES.length - 1)]; },
    xpInto() {
      let lvl = 1, acc = 0;
      while (acc + xpNeed(lvl) <= S.xp) { acc += xpNeed(lvl); lvl++; }
      return S.xp - acc;
    },
    xpNext() { return xpNeed(this.level()); },

    // The goal-gradient chip: there is always a "next thing", always visible.
    nextUnlock() {
      const lvl = this.level();
      const locked = [];
      for (const ink of INKS) {
        if (S.inks.owned.includes(ink.id)) continue;
        const u = ink.unlock;
        if (u.type === 'level')  locked.push({ what: `${ink.name} ink`, need: `Instar ${u.v}`, dist: u.v - lvl, kind: 'level' });
        if (u.type === 'lumen')  locked.push({ what: `${ink.name} ink`, need: `${u.v} lumen`, dist: (u.v - S.lumen) / 400, kind: 'lumen' });
        if (u.type === 'dawn'  && !S.flags.sawDawn)     locked.push({ what: `${ink.name} ink`, need: 'reach the Dawn', dist: 5, kind: 'feat' });
        if (u.type === 'mythic' && !S.flags.mythicDrawn) locked.push({ what: `${ink.name} ink`, need: 'draw a mythic card', dist: 8, kind: 'feat' });
      }
      for (const tr of TRAILS) {
        if (S.trails.owned.includes(tr.id)) continue;
        const u = tr.unlock;
        if (u.type === 'level') locked.push({ what: `${tr.name} trail`, need: `Instar ${u.v}`, dist: u.v - lvl, kind: 'level' });
        if (u.type === 'lumen') locked.push({ what: `${tr.name} trail`, need: `${u.v} lumen`, dist: (u.v - S.lumen) / 400, kind: 'lumen' });
      }
      locked.sort((a, b) => a.dist - b.dist);
      return locked[0] || null;
    },

    // Called after any change; grants level/feat unlocks automatically.
    sweepUnlocks() {
      const lvl = this.level(), fresh = [];
      const tryOwn = (cat, list, item) => {
        if (list.owned.includes(item.id)) return;
        const u = item.unlock;
        const ok = (u.type === 'start') ||
                   (u.type === 'level' && lvl >= u.v) ||
                   (u.type === 'dawn' && S.flags.sawDawn) ||
                   (u.type === 'mythic' && S.flags.mythicDrawn);
        if (ok) { list.owned.push(item.id); fresh.push({ cat, item }); }
      };
      for (const ink of INKS) tryOwn('ink', S.inks, ink);
      for (const tr of TRAILS) tryOwn('trail', S.trails, tr);
      if (fresh.length) persist(true);
      return fresh;
    },

    buy(cat, id) {
      const list = cat === 'ink' ? S.inks : S.trails;
      const item = (cat === 'ink' ? INKS : TRAILS).find(i => i.id === id);
      if (!item || list.owned.includes(id) || item.unlock.type !== 'lumen') return false;
      if (!ECON.spend(item.unlock.v)) return false;
      list.owned.push(id); persist(true);
      return true;
    },
  };

  /* ── hooks: session arc, streaks, forecasts, the graceful exit ─────── */
  const FORECASTS = [
    { id: 'gilded', label: 'Gilded odds — rare cards come twice as easily.' },
    { id: 'golden', label: 'A golden hour — from Hour III, wisps gather thick.' },
    { id: 'spare',  label: 'A spare card — every flight turns one extra.' },
  ];

  const HOOKS = {
    session: null,

    sessionStart() {
      S.totals.sessions++;
      this.session = {
        t0: now(), runs: [], lastRunEnd: 0, gaps: [],
        goldenPending: false, goldenUsed: false, stopShown: false, windDown: false,
      };
      TEL.emit('session:start');
      persist();
    },

    phase() {
      const s = this.session; if (!s) return 'core';
      if (s.windDown) return 'winddown';
      if (s.runs.length < 2 && now() - s.t0 < 3 * 60000) return 'warmup';
      return 'core';
    },

    onEvent(type, e) {
      const s = this.session; if (!s) return;
      if (type === 'run:start') {
        if (s.lastRunEnd) s.gaps.push(e.t - s.lastRunEnd);
      }
      if (type === 'run:end') {
        s.runs.push({ t: e.t, perf: e.perf });
        s.lastRunEnd = e.t;
        this._fatigueCheck();
      }
    },

    // Peak-end rule: don't let a session die of exhaustion. Detect the slide,
    // schedule one last spectacle, then offer a dignified exit with a hook
    // planted for tomorrow.
    _fatigueCheck() {
      const s = this.session;
      if (s.windDown) return;
      const long = now() - s.t0 > 20 * 60000;
      let sliding = false;
      if (s.runs.length >= 3) {
        const r = s.runs.slice(-3);
        sliding = r[0].perf > r[1].perf && r[1].perf > r[2].perf;
        const g = s.gaps.slice(-2);
        sliding = sliding && (g.length < 2 || g[1] >= g[0]);
      }
      if (long || sliding) { s.windDown = true; s.goldenPending = true; }
    },

    goldenPending() { return !!(this.session && this.session.goldenPending && !this.session.goldenUsed); },
    consumeGolden() { if (this.session) { this.session.goldenUsed = true; this.session.goldenPending = false; } },

    shouldOfferRest() {
      const s = this.session;
      return !!(s && s.windDown && s.goldenUsed && !s.stopShown);
    },
    restOffered() { if (this.session) this.session.stopShown = true; },

    ensureForecast() {
      const tomorrow = tomorrowKey();
      if (!S.forecast || S.forecast.date !== tomorrow) {
        const f = pickOf(FORECASTS);
        S.forecast = { date: tomorrow, id: f.id, label: f.label };
        persist();
      }
      return S.forecast;
    },

    // Runs once per calendar night, on boot. Returns everything the UI
    // should celebrate: streak state, comeback gifts, activated boons.
    dailyCheck() {
      const today = dayKey();
      const out = { today, streak: S.streak.count, events: [] };

      // honour yesterday's forecast if it was for today
      if (S.forecast && S.forecast.date === today) {
        S.dayBoon = { date: today, id: S.forecast.id };
        out.events.push({ kind: 'boon', label: S.forecast.label });
        S.forecast = null;
      }
      if (S.dayBoon && S.dayBoon.date !== today) S.dayBoon = null;

      if (S.dailyGiftDay === today) return out;   // already processed tonight
      S.dailyGiftDay = today;

      const last = S.streak.last;
      if (!last) {
        S.streak.count = 1;
        out.events.push({ kind: 'first', label: 'Your first night. The lamp is lit.' });
      } else {
        const gap = nightsBetween(last, today);
        if (gap === 0) { /* same night, nothing to do */ }
        else if (gap === 1) {
          S.streak.count++;
          out.events.push({ kind: 'streak', label: `Night ${S.streak.count} in a row.` });
        } else if (gap === 2 && S.streak.freezes > 0) {
          S.streak.freezes--; S.streak.count++;
          out.events.push({ kind: 'freeze', label: 'An amber drop preserved your streak while you were away.' });
        } else {
          const lost = S.streak.count;
          S.streak.count = 1;
          if (lost >= 3) out.events.push({ kind: 'reset', label: `The lamp went out after ${lost} nights. Relit tonight.` });
          // comeback gift scales with absence — returning must feel warm, not punitive
          const gift = Math.min(70 * gap, 420);
          ECON.addLumen(gift, 'comeback');
          out.events.push({ kind: 'comeback', label: `The lamp kept ${gift} lumen warm for you.` });
        }
      }
      S.streak.last = today;
      S.streak.history.push(today);
      if (S.streak.history.length > 14) S.streak.history.shift();
      out.streak = S.streak.count;

      // daily gift: modest, but always there — a reason to at least open the jar
      const daily = 40 + Math.min(S.streak.count, 7) * 15;
      ECON.addLumen(daily, 'daily');
      out.events.push({ kind: 'gift', label: `Nightly oil: ${daily} lumen.` });

      persist(true);
      return out;
    },
  };

  /* ── quests: generated from the motivation vector ──────────────────── */
  const QUEST_POOL = {
    mastery: [
      { id: 'graze',  make: lvl => ({ label: `Spend ${30 + lvl * 8}s in the graze band`, goal: 30 + lvl * 8, unit: 's' }) },
      { id: 'deep',   make: lvl => ({ label: `Hold heat ×3 or higher for ${12 + lvl * 3}s`, goal: 12 + lvl * 3, unit: 's' }) },
      { id: 'hour',   make: lvl => ({ label: `Reach Hour ${Math.min(3 + Math.floor(lvl / 3), 5)} in one flight`, goal: Math.min(3 + Math.floor(lvl / 3), 5), unit: 'hour' }) },
    ],
    fortune: [
      { id: 'stay',   make: ()  => ({ label: 'Choose to stay at 3 gates', goal: 3 }) },
      { id: 'cards',  make: ()  => ({ label: 'Turn 4 fate cards', goal: 4 }) },
      { id: 'wisp',   make: ()  => ({ label: 'Catch 2 wisps', goal: 2 }) },
    ],
    order: [
      { id: 'motes',  make: lvl => ({ label: `Gather ${90 + lvl * 25} motes`, goal: 90 + lvl * 25 }) },
      { id: 'bank',   make: lvl => ({ label: `Bring home ${400 + lvl * 120} lumen`, goal: 400 + lvl * 120 }) },
      { id: 'flights',make: ()  => ({ label: 'Fly 4 flights', goal: 4 }) },
    ],
    beauty: [
      { id: 'ink',    make: ()  => ({ label: 'Finish a flight wearing a non-default ink', goal: 1 }),
        avail: () => S.inks.owned.length > 1 },
      { id: 'dawnish',make: ()  => ({ label: 'Survive to Hour IV and admire the view', goal: 4, unit: 'hour' }) },
    ],
  };

  const QUESTS = {
    ensureDaily() {
      const today = dayKey();
      if (S.quests.date === today && S.quests.list.length) return S.quests.list;
      const mv = S.model.motiv;
      const axes = Object.keys(mv).sort((a, b) => mv[b] - mv[a]);
      const chosen = [];
      const used = new Set();
      const takeFrom = axis => {
        const pool = QUEST_POOL[axis].filter(q => !used.has(q.id) && (!q.avail || q.avail()));
        if (!pool.length) return;
        const q = pickOf(pool);
        used.add(q.id);
        const lvl = PROGRESS.level();
        const spec = q.make(lvl);
        chosen.push({
          id: q.id, axis, label: spec.label, goal: spec.goal, unit: spec.unit || '', prog: 0,
          reward: { lumen: 130 + Math.round(lvl * 22) + (chosen.length === 0 ? 60 : 0), dust: chosen.length === 0 ? 1 : 0 },
          done: false, claimed: false,
        });
      };
      takeFrom(axes[0]);              // lead quest speaks to who you are
      takeFrom(axes[1]);
      takeFrom(pickOf(axes.slice(1)));
      while (chosen.length < 3) takeFrom(pickOf(axes));
      S.quests = { date: today, list: chosen.slice(0, 3) };
      persist(true);
      return S.quests.list;
    },

    list() { return S.quests.list || []; },

    onEvent(type, e) {
      const L = S.quests.list; if (!L || !L.length) return;
      let touched = false;
      for (const q of L) {
        if (q.done) continue;
        const add = n => { q.prog = Math.min(q.goal, q.prog + n); touched = true; };
        switch (q.id) {
          case 'graze':   if (type === 'graze:tick') add(e.sec || 1); break;
          case 'deep':    if (type === 'deep:tick') add(e.sec || 1); break;
          case 'hour':
          case 'dawnish': if (type === 'hour:reach' && e.hour >= q.goal) q.prog = q.goal, touched = true; break;
          case 'stay':    if (type === 'gate' && e.choice === 'stay') add(1); break;
          case 'cards':   if (type === 'cards:pick') add(1); break;
          case 'wisp':    if (type === 'wisp') add(1); break;
          case 'motes':   if (type === 'mote') add(1); break;
          case 'bank':    if (type === 'run:end') add(e.kept || 0); break;
          case 'flights': if (type === 'run:start') add(1); break;
          case 'ink':     if (type === 'run:end' && S.inks.active !== 'lamplight') add(1); break;
        }
        if (q.prog >= q.goal && !q.done) { q.done = true; touched = true; TEL.emit('quest:done', { id: q.id }); }
      }
      if (touched) persist();
    },

    claim(ix) {
      const q = S.quests.list[ix];
      if (!q || !q.done || q.claimed) return null;
      q.claimed = true;
      const ups = ECON.addLumen(q.reward.lumen, 'quest');
      if (q.reward.dust) S.dust += q.reward.dust;
      TEL.emit('quest:claim', { id: q.id });
      persist(true);
      return { reward: q.reward, levelUps: ups };
    },
  };

  /* ── public surface ────────────────────────────────────────────────── */
  return {
    save: S,
    persist, wipe,
    emit: (t, d) => TEL.emit(t, d),
    telemetry: TEL,
    model: MODEL,
    director: DIRECTOR,
    rewards: REWARDS,
    econ: ECON,
    progress: PROGRESS,
    hooks: HOOKS,
    quests: QUESTS,
    inks: INKS,
    trails: TRAILS,
    utils: { clamp, lerp, rand, irand, dayKey },
  };
})();
