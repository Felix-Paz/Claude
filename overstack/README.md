# OVERSTACK

*Stack. Fuse. Get greedy.*

A browser-based physics stacking game engineered for session length and return rate.
Drop shapes onto a wobbling tower — same shapes fuse into bigger, more valuable ones.
Fusions mint **coins**. Every drop is the decision: **BANK** (lock coins into your
permanent vault) or push on and let **GREED** multiply the next payout. Collapse
before banking and the run's coins burn — the vault never does.

**Play it:** open `index.html` in any browser. One self-contained file, no build,
no install, no login, no network required.

## Controls

| Input | Action |
|---|---|
| Drag / move + release (or click) | Aim and drop |
| `Space` | Bank |
| `←` `→` `↓` | Aim / drop (desktop) |
| `Enter` | Drop again / play |
| `Esc` | Menu |

## The economy (one currency, everywhere)

- **Coins** — minted by fusions (`tier value × GREED × special bonus`). The big
  center number during a run.
- **GREED** — event-driven multiplier. Rises only when you act: surviving a drop
  (+ extra for risky landings), fusing. Banking resets it. It never climbs on its own.
- **VAULT** — banked coins. Permanent, spendable in the Collection, shown top-right.
  Collapsing never touches it.
- **Lifetime banked** — never decreases; unlocks **superpowers** at milestones
  (Head Start, Gold Rush, Steady Aim, Encore, Chroma Rush, Titan Line). Superpowers
  are earned, never bought — see `MILESTONES` in §1.

Brand identity is **fresh spring green + gold** — a bright, airy green world (no
more cave-dark), green→gold wordmark, in-game logo at the bottom-center.

## Shapes

One shape per tier, each with its own hue *and* side-count *and* size — three
redundant cues so value is never a subtle read: red triangle → orange square →
yellow pentagon → green hexagon → cyan heptagon → blue octagon → violet nonagon →
gold 12-sided **AUREX**. Every hue is spaced far from its neighbors.

**Shape packs** (the Collection's `theme` items) each recolor all shapes with a
distinct 8-hue palette *and* grant a perk (pricier = better): Ember (+6% coins),
Oceanic (greed starts ×1.25), Toxic (+10% coins), Candy (2× golden blocks),
Prism (+15% coins, greed ×1.3).

**Special blocks** each have their own unmistakable skin (never disguised as a
normal shape) and its own behavior:
- ✨ GOLDEN (3× coins) · 🗿 GIANT (huge, 3×, deliberate camera zoom-out on drop)
- 💣 BOMB (dark sphere, lit fuse + countdown ring; explodes for salvage)
- ⚡ UNSTABLE (glitchy hazard skin, shudders constantly, 2×) · 🧊 ICE (slippery, 2×)
- ⭐ LUCKY STAR (2× + greed surge) · 🌈 RAINBOW (animated rainbow, fuses with anything)
- 🧲 MAGNET (horseshoe skin, physically pulls same-tier pieces together to fuse)
- 🏋️ HEAVY (dense iron block, slams + compresses the tower on landing)
- 🧩 SPLIT (shatters into 4 mini blocks on impact) · 😠 ANGRY (has eyes, jumps once after landing)
- 🎲 DICE (pip-count = live tier, re-rolls each bounce, locks at rest)
- 🎁 LUCKY CHEST (opens on land: coins / giant / rainbow / magnet / bomb / curse)
- 💎 JACKPOT DIAMOND (rare, ~every 5 min, absurd 8× payout)

**World events** fire live (not blocks): 🕳️ BLACK HOLE (pulls the tower into new
shapes), ☄️ METEOR (warns, then crashes — scatters or compresses), and 🔒 CURSE
(temporary debuff: no-banking / coin-leak / slippery / next-3-huge).

### Event Director
Every 45–75 s the `EventDirector` asks "what crazy thing should happen now?" and
either injects a special block or fires a world event, weighted by the retention
engine (risk tolerance, churn state, session depth) — the whole point is a fresh
surprise before the player can get bored. Nothing it does is instantly lethal.

### Risk FX — greed made irresistible
`RiskFX` continuously scores your risk (unbanked coins vs. best, greed, tower
instability) and cranks the drama to match: a pulsing gold vignette that speeds
up, gold particles raining across the screen, adrenaline micro-shakes, and the
BANK button escalating through four "character" tiers until it's literally
shaking and flashing **BANK ME** at you.

## Collection (◆100,000 → ◆12,000,000)

Each dock in the Collection has a distinct canvas render *and*, for pricier ones,
real powers: Slab (free), Frostpane (frosted glass), Liquid Glass (+length +
slow-fall), Lava Forge (+60% salvage, glowing molten cracks), Reactor (+length +
faster greed, scrolling circuitry), Bumper Deck (raised edge walls that physically
catch throws), Aurora Deck (+length + wider combo window), Vortex Core (everything).
Dock power dimensions: `lengthBonus`, `grip`, `forgiveness`, `slowFall`, `greedRate`,
`salvageMult`, `comboBonusMs`, `walls`.

## The adaptation engine

A persistent, per-player **Profile** (never shown as numbers, surfaced as a style
title like THE GAMBLER / THE BANKER / THE COLLECTOR) drives:

1. **Risk tolerance** — early bankers get golden temptation drops mid-run; never-bankers
   get a lower near-miss threshold so "I ALMOST lost" fires more often.
2. **Skill** — flow-banded `DifficultyDirector` also adapts *physics*: strugglers get
   grippier, deader pieces; hot players get bouncier, odder, bigger-variance ones.
3. **Frustration** — churn model detects collapse-streak trends and answers with
   "Here. 🎁": a golden guaranteed-fusable opener next run.
4. **Boredom** — detected separately (opposite signature); answered with novelty
   (unstable block, never-equipped cosmetics), never with an easier game.
5. **Goals** — collector / competitive / chaos affinities re-weight which open-loop
   headline the results screen leads with.
6. **Adaptive pacing** — the game learns your typical session length and schedules a
   golden block right before your usual quit point (`retention_save` event).
7. All of it logged through `trackEvent` with flow band, arc phase, and profile
   snapshots attached — inspect `window.__overstackEvents`.

## Guardrails

- Banking only works while a piece is "in preview" — `DECISION` (idle, waiting)
  or `AIMING` (finger down, not yet released). The instant a piece is actually
  falling or resolving, the BANK button disables outright: there is no window to
  tap Bank a split second before a visible death. `Stack.isDoomed()` remains as a
  defense-in-depth check for the DECISION edge case.
- Revive **always** costs a watched ad, with no free path — the ENCORE superpower
  only grants a second revive attempt per run, each one still ad-gated.
- Ad offers (revive / double) are opt-in, one-tap, and never bigger than the free
  DROP AGAIN path. Double Coins only appears on a successful bank (nothing to
  double on a loss); Revive only appears on a collapse. Interstitials: never in
  the first 3 runs, only at voluntary boundaries, ≥105 s apart.
- Shop purchases require a deliberate second tap ("Tap again to confirm") before
  coins are spent — a single accidental tap never buys anything.
- `ChurnRiskModel` and `Profile` output are deliberately **never** wired into
  `AdManager`. Flag any change to this in code review.
- Camera shake is reserved for two things only: near-death instability (danger
  micro-shake, gated below ~55% stability) and a huge merge (3+ chain, jackpot
  fusion, bomb). Nothing shakes or zooms on an ordinary drop.
- Near-misses are computed from real run state, never randomly inserted.
- Every run nets some coins (collapse pays a small salvage) — no zero-progress outcomes.
- Adjacent same-tier pieces fuse even when they come to rest a hair apart (a
  proximity + active-contact scan, not just first-contact events).
- Reviving rolls back to the tower state from *before* the fatal drop (snapshot is
  taken pre-drop), so the killer piece is gone — you don't instantly die again.
- Any piece resting on a fused/removed/shrunk support is woken so it falls (no
  frozen floating blocks).

## Shipping to a real platform (Poki etc.)

Replace `MockAdAdapter` (§18) with an adapter mapping the same interface onto the live
SDK (`init`, `gameLoadingStart/Finished`, `gameplayStart/Stop`, `commercialBreak`,
`rewardedBreak`). Game logic never touches the SDK directly.

## Tuning

All constants live in §1 of the script (`CONFIG`, `RETENTION_CONFIG`, `CHURN_CONFIG`,
`AD_CONFIG`, `MILESTONES`, tier tables). Debug handle: `window.__overstack`.
