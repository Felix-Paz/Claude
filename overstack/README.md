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

## Shapes

One shape per tier, each with its own hue *and* its own side-count *and* its own
size — three independent, redundant cues so value is never a subtle read:
red triangle → orange square → lime pentagon → emerald hexagon → cyan heptagon →
blue octagon → violet nonagon → gold 12-sided **AUREX**. Six shape themes in the
Collection each rotate their own distinct 8-hue set.

**Surprise blocks** appear every 20–40 s: ✨ GOLDEN (3× coins), 🗿 GIANT (huge, 3×,
the one deliberate camera zoom-out on drop), 💣 BOMB (explodes — salvage coins,
chaos), ⚡ UNSTABLE (jitters, 2×), 🌈 RAINBOW (fuses with anything, 2×).

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

## Shipping to a real platform (Poki etc.)

Replace `MockAdAdapter` (§18) with an adapter mapping the same interface onto the live
SDK (`init`, `gameLoadingStart/Finished`, `gameplayStart/Stop`, `commercialBreak`,
`rewardedBreak`). Game logic never touches the SDK directly.

## Tuning

All constants live in §1 of the script (`CONFIG`, `RETENTION_CONFIG`, `CHURN_CONFIG`,
`AD_CONFIG`, `MILESTONES`, tier tables). Debug handle: `window.__overstack`.
