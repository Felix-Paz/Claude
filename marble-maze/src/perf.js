// Keeps the game inside a frame budget by turning settings down one at a time,
// keeping only the ones that measurably helped, and putting them back when the
// device recovers. It never decides a setting is worth losing without proof.

const SAMPLE_MS = 1000;          // decisions are made on a second of frames, never one frame
const SLOW_FACTOR = 1.35;        // a frame this far over budget counts as a dropped one
const PRESSURE_SLOW = 0.22;      // act once this share of frames is late...
const PRESSURE_AVG = 1.12;       // ...or the average frame is this far over budget
const RELIEF_SLOW = 0.05;        // give quality back only when almost nothing is late...
const RELIEF_AVG = 0.82;         // ...and there is this much headroom in hand
const TRIAL_SAMPLES = 2;         // seconds spent measuring whether a reduction helped
const MIN_GAIN = 0.03;           // under a 3% win, the reduction was not worth it
const GOOD_TO_RESTORE = 6;       // seconds of calm before anything is restored
const BLOCK_MS = 30000;          // how long a reduction that did not help is left alone
const LOCK_MS = 90000;           // how long a restored setting is safe from being cut again
const STEP_COOLDOWN_MS = 1500;   // minimum gap between changes, so nothing cascades
const STALL_MS = 250;            // a frame this long is a tab switch or a level build, not lag

// Aim for a smooth 60, and call the device struggling only once it cannot hold 50.
// Never chase a 120Hz panel: that would strip quality to win frames nobody asked for.
export const BUDGET_FAST = 1000 / 60;
export const BUDGET_SLOW = 1000 / 50;

export class PerfGovernor {
  constructor(knobs, opts = {}) {
    this.knobs = knobs;
    this.byId = new Map(knobs.map((k) => [k.id, k]));
    this.level = new Map(knobs.map((k) => [k.id, 0]));
    this.order = knobs.slice().sort((a, b) => (b.gain / b.cost) - (a.gain / a.cost));
    this.reduced = [];
    this.blocked = new Map();
    this.locked = new Map();
    this.active = false;
    this.budget = opts.budget || 1000 / 60;
    this._acc = 0; this._n = 0; this._slow = 0; this._elapsed = 0;
    this._good = 0; this._nextStepAt = 0; this._trial = null; this._lastAvg = 0;
  }

  setBudget(ms) { this.budget = ms; }

  setActive(on) {
    this.active = on;
    this._acc = this._n = this._slow = this._elapsed = 0;
    this._good = 0; this._trial = null; this._nextStepAt = 0;
  }

  applyAll(levels) {
    for (const k of this.knobs) {
      const lv = Math.max(0, Math.min(k.steps - 1, levels?.[k.id] ?? 0));
      this.level.set(k.id, lv); k.apply(lv);
    }
    this.reduced = [];
  }

  reset() {
    for (const k of this.knobs) { this.level.set(k.id, 0); k.apply(0); }
    this.reduced = []; this.blocked.clear(); this.locked.clear();
    this._trial = null; this._good = 0;
  }

  sample(dtMs, now) {
    if (!this.active) return;
    if (dtMs > STALL_MS) return;      // a tab switch or a level build is not a quality problem
    this._acc += dtMs; this._n++; this._elapsed += dtMs;
    if (dtMs > this.budget * SLOW_FACTOR) this._slow++;
    if (this._elapsed < SAMPLE_MS) return;

    const avg = this._acc / this._n;
    const slowRatio = this._slow / this._n;
    this._acc = this._n = this._slow = this._elapsed = 0;

    if (this._trial) { this._resolveTrial(avg, now); this._lastAvg = avg; return; }

    const pressure = slowRatio > PRESSURE_SLOW || avg > this.budget * PRESSURE_AVG;
    const relief = slowRatio < RELIEF_SLOW && avg < this.budget * RELIEF_AVG;

    if (pressure) {
      this._good = 0;
      if (now >= this._nextStepAt) this._stepDown(avg, now);
    } else if (relief) {
      if (++this._good >= GOOD_TO_RESTORE) { this._good = 0; this._stepUp(now); }
    } else {
      this._good = 0;
    }
    this._lastAvg = avg;
  }

  _stepDown(avg, now) {
    for (const k of this.order) {
      const lv = this.level.get(k.id);
      if (lv >= k.steps - 1) continue;
      if ((this.blocked.get(k.id) || 0) > now) continue;
      this.level.set(k.id, lv + 1); k.apply(lv + 1);
      this.reduced.push(k.id);
      this._trial = { id: k.id, before: avg, left: TRIAL_SAMPLES, acc: 0, n: 0 };
      this._nextStepAt = now + STEP_COOLDOWN_MS;
      return;
    }
  }

  _resolveTrial(avg, now) {
    const t = this._trial;
    t.acc += avg; t.n++;
    if (--t.left > 0) return;
    const after = t.acc / t.n;
    const gain = (t.before - after) / t.before;
    this._trial = null;
    if (gain < MIN_GAIN) {
      const k = this.byId.get(t.id);
      const lv = this.level.get(t.id);
      if (lv > 0) { this.level.set(t.id, lv - 1); k.apply(lv - 1); }
      const i = this.reduced.lastIndexOf(t.id);
      if (i >= 0) this.reduced.splice(i, 1);
      this.blocked.set(t.id, now + BLOCK_MS);
      this._nextStepAt = now;
    }
  }

  _stepUp(now) {
    for (let i = this.reduced.length - 1; i >= 0; i--) {
      const id = this.reduced[i];
      if ((this.locked.get(id) || 0) > now) continue;
      const k = this.byId.get(id);
      const lv = this.level.get(id);
      if (lv <= 0) { this.reduced.splice(i, 1); continue; }
      this.level.set(id, lv - 1); k.apply(lv - 1);
      this.reduced.splice(i, 1);
      this.locked.set(id, now + LOCK_MS);
      this._nextStepAt = now + STEP_COOLDOWN_MS;
      return;
    }
  }

  report() {
    const o = {};
    for (const k of this.knobs) o[k.id] = this.level.get(k.id);
    return o;
  }
}

// Reports the frame budget to aim for. rAF spacing on a device that is already
// struggling reflects how slow the *renderer* is, not how slow the *display* is, so a
// wide reading must never be taken as permission to relax — it is clamped to
// [BUDGET_FAST, BUDGET_SLOW] and only ever moves the target between 60 and 50 fps.
export function measureRefresh(cb) {
  let n = 0, last = 0, best = Infinity;
  const tick = (t) => {
    if (last) { const d = t - last; if (d > 4 && d < best) best = d; }
    last = t;
    if (++n < 24) requestAnimationFrame(tick);
    else cb(Math.min(BUDGET_SLOW, Math.max(BUDGET_FAST, best === Infinity ? BUDGET_FAST : best)));
  };
  requestAnimationFrame(tick);
}
