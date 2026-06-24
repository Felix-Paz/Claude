# Drift Lasso

`drift-lasso.html` is a single, self-contained, zero-dependency HTML5 Canvas
game (no fonts, CDNs, or network calls — instant first paint, ~176 KB). The
core mechanic is preserved from V1: the difficulty director, juice, procedural
audio, object pools, and the fixed-timestep sim. The **one death rule is
unchanged** — you die *only* when your trail crosses itself enclosing nothing.

## Modules

| Module | Role |
|---|---|
| `[RNG]` | Seedable mulberry32. **Every gameplay-affecting** random draw routes here (deterministic runs). |
| `[PERF]` | One-time FPS probe → device tier. Scales **visuals only** (particles / chroma / sheen). |
| `[LEADER]` | Local **weekly** leaderboard (keyed by ISO week). Portal seam mirrors `AdSDK`. |
| `[META]` | Account XP / level curve, mastery tiers + titles, collection, set bonuses, prestige. |
| `[COSMETICS]` | Trail **styles** (not just colours) with rarity tiers + a stronger custom editor; car skins; powers. |
| `[SHARE]` | Offscreen branded score-card PNG (share / download). |

## Trail skins are styles, not palettes

Every trail names a render **style** dispatched by `RENDER.drawTrail`:
`solid · stripes · dashed · pixel · electric · flame · comet · stars · galaxy ·
glow · rainbow`. They carry **rarity** tiers (Common / Rare / Epic / Legendary,
shown as a corner badge in the garage). The **Custom** trail is the power-user
option: pick two colours **and** a base style — so it's far more than a colour
swap and distinct from every preset.

Purchases are **coins-only**: an item is gated by its price and the coins are
actually spent (no free unlocks).

## The determinism guarantee

Gameplay randomness is consumed **only inside the fixed-timestep update**, via
`RNG`. Render-rate / cosmetic randomness (particles, shake, decor, trail
sparkles) uses plain `Math.random` (`crand`). So display FPS and the `PERF` tier
can never desync the sim — **same seed + same effective-steer timeline ⇒ an
identical run** (score, positions, drone count, RNG state).

## Gameplay notes

- **Death rules:** (1) empty self-cross, and (2) from **level 20**, enclosing the
  **toxic-waste** critter — a deliberate late-game lethal hazard (telegraphed with
  a red danger ring + the greed-preview turning red). Bombs still only *spoil* a
  loop, they don't kill.
- **Level 1** is a gentle on-ramp (fewer, slower drones); the snake gets **really
  long at high levels** via a level-scaled trail lifespan (buffer raised to fit).
- **Missions** live in a slide-out drawer on the play screen (tap the left tab),
  not in the garage. The set is broader and more varied.
- **Cars** are distinct **shapes** (orb / jet / gem / bolt / star / UFO / halo),
  rendered in-game, not just recolours.
- **Custom trail** uses **exclusive** styles (`duo` / `pulse` / `bubble`) so it can
  never reproduce a purchasable skin.

## Game-over screen

A deliberate three-tier hierarchy on a desktop-wide panel:

1. **PLAY AGAIN** — the one hero action.
2. **Ad-reward group** — `REVIVE` and `2× COINS`, boxed under a "▶ watch a short
   ad for a bonus" label so they never read as navigation.
3. **Small nav row** — Garage · Ranks · Share · Settings.

## Testing

```bash
node tests/drift-lasso.test.js     # headless: determinism, buy engine, revive, trail styles, migration, …
```

In the browser console: `DriftLasso.selfTest()` runs the determinism check live.

## Tuning & integration

- All tunables live in `CONFIG` with comments. One A/B flag: `CONFIG.AB_STEERING`
  (`'half'` hold-L/R, or `'curl'` hold-to-curl) — also `?ab=curl`.
- **Ads:** `AdSDK.setProvider(...)`. **Leaderboard:** `LEADER.setProvider(...)`
  (the local provider seeds deterministic synthetic rivals so the rank nudge
  always has a reachable target; they vanish when a real provider is wired in).
- Save key `driftlasso.save.v2` with a one-time v1 migration (coins, highScore,
  unlocks, equips, custom trail preserved). Accessibility: persisted
  colour-blind + reduce-motion toggles in Settings.
