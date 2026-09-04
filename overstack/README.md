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
| `Space` / `Enter` | Continue (menu → play, results → drop again); in a run `Space` = BANK |
| `←` `→` `↓` | Aim / drop (desktop) |
| `R` | Restart (instant from menu/results; mid-run asks for a confirming second press — unbanked coins burn) |
| `Esc` | Back out of whatever is open: dialog → card → run/results → menu |

## The economy (one currency, everywhere)

- **Coins** — minted by fusions (`tier value × GREED × special bonus`). The big
  center number during a run.
- **GREED** — event-driven multiplier. Rises only when you act: surviving a drop
  (+ extra for risky landings), fusing. Banking resets it. It never climbs on its own.
- **VAULT** — banked coins. Permanent, spendable in the Collection, shown top-right.
  Collapsing never touches it.
- **Lifetime banked** — never decreases; unlocks **superpowers** at milestones
  (Midas Touch, Gold Rush, Steady Aim, Encore, Chroma Rush, Titan Line). Superpowers
  are earned, never bought — see `MILESTONES` in §1.
- **Daily reward** — log in every day and claim a vault gift that **doubles**
  each consecutive day: 50k → 100k → 200k → 400k → 800k → 1.6M → **3.2M (max)**.
  Miss a day and the ladder restarts at 50k. The DAILY card auto-greets you once
  per session when a claim is waiting, and its 7-day calendar shows exactly what
  the coming week pays.

Coins are written as plain numbers. There is no currency glyph anywhere in the
game, and no emoji anywhere in the interface — every mark on screen is drawn.

## The design system

Everything on screen answers to one system rather than picking its own look.

**Palette — two primaries and one accent.** `INK` is the table: a single solid
ramp (`#080D0B` → `#2B4438`) used for every ground and panel, never a gradient.
`BONE` (`#EDE6D8`) is everything you read. `BRASS` (`#D9A441`) is the only accent
— money, the BANK key, the live edge of the deck, the ruler line your tower has
passed. One `CRIMSON` is reserved exclusively for loss. Nothing else introduces a
hue: docks, shape packs, particles and vignettes are all drawn from this set.

**Form — one shape language.** The pieces are hard-edged polygons, so the
instrument panel is hard-edged too. Corner radius is a three-step scale applied
strictly by hierarchy: **2px** for HUD chips, **10px** for buttons, **20px** for
modal cards. The dock is a machined slab with cut corners, not a filleted
rectangle — the same cut the pieces have.

**Depth — crisp, not blurry.** Objects sit on a table: one hard offset shadow, a
lit top facet, a dark cut edge. No glow blooms, no backdrop blur. A fine grain
layer sits over the world so flat colour never reads as flat vector.

**The wordmark is drawn, not typeset.** Nine monolinear geometric caps on a
100-unit cap height, built from the game's own vocabulary — the **O** is the
octagon piece, the **A** is the triangle piece — in one weight, one colour, with
no drop shadow. It lives in `<symbol id="wm">` and is instanced three times.

**The background is the run.** A solid ground with two planes meeting at the dock
line: air above, table below. The only geometry in the air is a **height ruler**
the tower is actually measured against — hairlines every 100 units, ticked and
labelled, turning brass as the tower passes them — plus the dock centre line you
aim against. Nothing floats for decoration. Wealth still shows: a big unbanked
pile warms the table toward brass on a deliberately lazy curve, so an ordinary
run barely moves it and a monstrous one turns the whole room. The palette holds
either way.

**The drop reads as intent.** The piece hangs close above the stack, falls down a
soft brass corridor, and the deck shows a machined bracket exactly the width of
the piece at the point it will land. A fast drop leaves a short motion trail.

## Shapes

One shape per tier, each with its own colour *and* side-count *and* size — three
redundant cues so value is never a subtle read. The default **Signal** ramp reads
value as heat — slate, frost, copper, sand, brass, rust, ember, white-hot — with
the lightness deliberately alternating so neighbouring tiers always separate at a
glance. Every shape pack is one ramp with a story, never a bag of hues.

The historical rainbow ladder was: red triangle → orange square →
yellow pentagon → green hexagon → cyan heptagon → blue octagon → violet nonagon →
gold 12-sided **AUREX**. Every hue is spaced far from its neighbors.

**Shape packs** (the Collection's `theme` items) are radical departures from the
default Signal palette — monochrome Noir, all-fire Inferno, jewel-tone Royal,
arcade Retro, neon Cyber, deep-sea Oceanic, acid Toxic, sugar Candy, and
max-saturation Prism — and each grants a perk (pricier = better).

**Special blocks** each have their own unmistakable skin (never disguised as a
normal shape) and its own behavior:
- GOLDEN (3× coins) · GIANT (huge, 3×, deliberate camera zoom-out on drop)
- BOMB (dark sphere, lit fuse + countdown ring; explodes for salvage)
- UNSTABLE (glitchy hazard skin, shudders constantly, 2×) · ICE (slippery, 2×)
- LUCKY STAR (2× + greed surge) · RAINBOW (animated rainbow, fuses with anything)
- MAGNET (horseshoe skin, physically pulls same-tier pieces together to fuse)
- HEAVY (dense iron block, slams + compresses the tower on landing)
- SPLIT (shatters into 4 mini blocks on impact) · ANGRY (has eyes, jumps once after landing)
- DICE (pip-count = live tier, re-rolls each bounce, locks at rest)
- LUCKY CHEST (opens on land: coins / giant / rainbow / magnet / bomb / curse)
- JACKPOT DIAMOND (rare, ~every 5 min, absurd 8× payout)

**World events** fire live (not blocks): BLACK HOLE (opens ON the tower and
devours up to 3 pieces, paying coins for each), METEOR (warns, then crashes —
it can knock pieces clean off the dock, but knocked-off pieces just *vanish in a
poof* during its grace window: a meteor can cost you blocks, never the run),
WIND (gusts on the block that is FALLING — the drop drifts sideways to a spot
you didn't pick, its landing x hard-clamped over the dock so wind alone can never
kill; the settled stack is untouched), and CURSE (no-banking / coin-leak /
slippery / next-3-huge). Curses are always felt: the HUGE curse balloons the
pieces already in the queue (the aim ghost and NEXT box grow instantly), the
leak drips visible `-coin` losses off the tower, and the director only picks a
curse that can bite right now. ANGRY's jump and HEAVY's slam run under
the same no-direct-death rule — chaos blocks knocked off the edge disappear
instead of ending the run. When any special block is announced as *incoming*,
it IS the next drop — never hidden behind another queued piece.

### Event Director
Every 45–75 s the `EventDirector` asks "what crazy thing should happen now?" and
either injects a special block or fires a world event, weighted by the retention
engine (risk tolerance, churn state, session depth) — the whole point is a fresh
surprise before the player can get bored. Nothing it does is instantly lethal.

### Risk FX — drama with timing
The gold vignette is a **danger siren**, not a wealth meter: it appears only
while the tower is genuinely at risk of dying, pulses while the danger lasts,
and fades the moment it steadies. Separately, the BANK button escalates through
four smooth "character" tiers (glow → grow → big pulses → BANK ME) driven by
unbanked coins, staying calm until ~150,000 is on the line. All scale pulses —
no jitter, no particles.

## Collection (30,000 → 10,000,000)

Prices climb in honest bands: pure looks 30–70k, entry perks 100–150k, solid
powers 200–500k, legends 750k–3M, and ONE crown jewel at 10,000,000.
16 docks, each a clean material with one quiet signature detail (restraint reads
expensive): Slab (the free default — a cool charcoal-slate that pops against the
green world), Heartwood, Brushed Steel, Carrara, Porcelain, Liquid Glass,
Basalt Forge, Reactor, Bullion, Bumper Deck, Aurora Deck, Nebula, Crimson Velvet,
Vortex Core, Obsidian, and the 10,000,000 OBSIDIAN CROWN. Power dimensions:
`lengthBonus`, `grip`, `forgiveness`, `slowFall`, `greedRate`, `salvageMult`,
`comboBonusMs`, `walls`. Difficulty also leans harder as your vault grows past
100k (bigger/odder pieces — honest pressure, never rigged RNG), and spam-clicking
sub-second drops triggers punish heat plus an "AIM!" warning.

## The adaptation engine

A persistent, per-player **Profile** (never shown as numbers, surfaced as a style
title like THE GAMBLER / THE BANKER / THE COLLECTOR) drives:

1. **Risk tolerance** — early bankers get golden temptation drops mid-run; never-bankers
   get a lower near-miss threshold so "I ALMOST lost" fires more often.
2. **Skill** — flow-banded `DifficultyDirector` also adapts *physics*: strugglers get
   grippier, deader pieces; hot players get bouncier, odder, bigger-variance ones.
3. **Frustration** — churn model detects collapse-streak trends and answers with
   "Here — take this one": a golden guaranteed-fusable opener next run.
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
- Shop purchases go through a confirm pop-up before coins are spent — a single
  accidental tap never buys anything. Cards close via a corner ✕ or tapping
  outside the card.
- `ChurnRiskModel` and `Profile` output are deliberately **never** wired into
  `AdManager`. Flag any change to this in code review.
- Camera shake is reserved for two things only: near-death instability (danger
  micro-shake, gated below ~55% stability) and a huge merge (3+ chain, jackpot
  fusion, bomb). Nothing shakes or zooms on an ordinary drop.
- Near-misses are computed from real run state, never randomly inserted.
- The NEXT box and the aim ghost use the SAME renderer as the live pieces —
  real skin, real radius (a HEAVY looks iron, a GIANT fills the box, a tier-1
  looks genuinely small). The preview never lies about what's coming.
- In-play messages stay out of the action: toasts sit centered between the
  dock and the wordmark; reaction words splash over the dock face.
- No tunneling: pieces have a terminal per-tick fall speed and the dock's
  physics slab is deeper than any single solver step, so a fast triangle can
  never pass through the dock.
- The ≡ menu button follows the BANK button exactly: leaving mid-run banks
  only if BANK is currently lit — a grayed-out BANK (falling piece, curse,
  doomed tower) can't be bypassed by exiting.
- Watching the double-coins ad counts the banked headline up to its doubled
  value, the same animation the vault total plays.
- The first 3 runs are a hot lap: the sim runs ~18% faster with grippy,
  low-tier, always-fusable pieces and no world events — quick, generous, and
  very hard to lose. Run 4 returns to the normal game.
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
