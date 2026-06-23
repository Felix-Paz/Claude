# Drift Lasso — V2

`drift-lasso.html` is a single, self-contained, zero-dependency HTML5 Canvas
game (no fonts, CDNs, or network calls — instant first paint). V2 evolves V1
without regressing any existing strength: the core mechanic, difficulty
director, juice, procedural audio, object pools, and the fixed-timestep sim are
all preserved. The **one death rule is unchanged** — you die *only* when your
trail crosses itself enclosing nothing useful.

## What's new in V2

| Module | Role |
|---|---|
| `[RNG]` | Seedable mulberry32. **Every gameplay-affecting** random draw routes here. |
| `[DAILY]` | UTC daily seed, streak, daily-best. |
| `[PERF]` | One-time FPS probe → device tier. Scales **visuals only**. |
| `[LEADER]` | Daily + weekly boards (local now). Portal seam mirrors `AdSDK`. |
| `[META]` | Account XP / level curve, mastery tiers + titles, collection, set bonuses, prestige. |
| `[GHOST]` | Records the run's steer timeline (RLE) + score samples; replays a translucent ghost car. |
| `[SHARE]` | Offscreen branded score-card PNG (share / download). |
| `[ONBOARD]` | Active, skippable first-run lesson. |

Milestones delivered in order: **M1** comprehension & polish (perf governor,
ghost demo, truthful control hint, new-best peak-end replay, Zeigarnik teaser) →
**M2** daily seed + leaderboard (the keystone) → **M3** meta-spine → **M4**
ghosts & sharing → **M5** reach & extras (gamepad, colour-blind + reduce-motion
toggles, rare golden swarm, new audio cues).

## The determinism guarantee (keystone)

Gameplay randomness is consumed **only inside the fixed-timestep update**, via
`RNG`. Anything that runs at render rate or varies by device — particle spray,
screen shake, background decor — uses plain `Math.random` (`crand`). This means:

> **same seed + same effective-steer timeline ⇒ an identical run** (score,
> positions, drone count, RNG state)

…regardless of display FPS or the `PERF` tier. That single property is what
makes daily challenges fair, leaderboards comparable, and ghost replays correct.
The car path is integrated by a **shared `Game.stepCar`** used by both the live
car and the ghost, so a recorded steer timeline reproduces the path exactly.

## Testing

```bash
node tests/drift-lasso.test.js     # headless: determinism + all V2 systems + v1→v2 migration
```

In the browser console you can also run the in-game self-check:

```js
DriftLasso.selfTest()   // runs two same-seed sims + one different-seed sim, compares, restores your save
```

## Tuning & experiments

Every new constant lives in `CONFIG` with a comment. The two key A/B
experiments are flags (also settable via `?ab=` URL):

- `CONFIG.AB_STEERING` — `'half'` (hold L/R screen half, shipped V1) vs `'curl'` (hold-to-curl, one button). `?ab=curl`
- `CONFIG.AB_ONBOARDING` — `'ghostdemo'` (active demo) vs `'hint'` (static arrows). `?ab=hint`

## Storage

Save key bumped to `driftlasso.save.v2` with a one-time migration from v1
(coins, highScore, unlocked, equips, custom colours preserved). New fields:
account XP/level, mastery tier, prestige, streak, daily/weekly bests, collection,
and `settings { colorblind, reduceMotion }`.

## Integration seams (kept portal-agnostic)

- **Ads:** `AdSDK.setProvider(...)` — rewarded / interstitial.
- **Leaderboard:** `LEADER.setProvider(...)` — `submit(kind,key,score)` / `fetch(kind,key)`. The local provider seeds deterministic synthetic rivals so the rank nudge always has a reachable target; they vanish when a real provider is wired in.
