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

**The world is the colour of your best piece.** Not a cousin of it, not a shade
off it — the exact hue and saturation of the most valuable shape currently on the
dock, simply darkened enough that the pieces still read against it. Merge into a
higher tier and the whole room becomes that colour, eased in so it feels like a
mood swing rather than a flash. It is painted in screen space as one flat plane,
edge to edge: no horizon, no seam at the dock, nothing showing through at any
zoom. A single soft pool of the same colour sits behind the tower so the middle
breathes — present, but never dramatic.

**Three fixed accents on top of that.** The world moves; the meaning of a colour
does not. **GOLD** is money, **MINT** is go, **ROSE** is loss.

**Light glass, not dark holes.** HUD chips are true translucency — the world
tints them, so the interface belongs to whatever colour the room is. Cards are
near-opaque instead, because they carry a lot of small type and the tower behind
them must not read through as clutter. (`backdrop-filter` is deliberately unused:
inside a fixed subtree Chromium samples a black backdrop rather than the canvas,
which is what made an earlier pass look uniformly dim.)

**Curvature by hierarchy.** Chips 14px, buttons 18px, cards 28px. Nothing is a
hard-edged box, and nothing is rounded by default.

**The wordmark is set in Unbounded ExtraBold** (SIL Open Font License), subset to
the nine letters it needs and embedded as a 1.4 KB woff2 — so the file stays
self-contained and renders identically offline. A geometric display face: wide,
very heavy, squared-off bowls, in the same family of forms as the pieces.

**It animates itself, and the animation is the game.** STACK is already
standing; OVER falls in from above and lands **on top** of it; STACK takes the
impact; OVER holds for a beat, then slides across in one clean move and drops
straight down into its own slot. While the word is unfinished its letters are
**gold** — not placed yet — and the moment it is whole the brand colour sweeps
across them one at a time, O through K. It plays when the menu opens and quietly
on the in-game mark as a run starts. The offsets are geometry, not taste:
+112.6% of OVER's own width is exactly what centres it over STACK, at every size
the mark is used at.

On the loading screen it holds still, because the splash is normally gone inside
a few hundred milliseconds and a 1.6s animation cut off a quarter of the way
through reads as a flicker, not a logo. If the wait actually runs long — past
650ms — the splash mark starts a **looping** variant instead: the same
choreography, then a hold, a fade and a clean restart, so a slow connection gets
something worth watching and a fast one gets nothing at all.

**The mark in the HUD is a character, not a watermark.** It sits at the bottom
of the play screen at 30% opacity and, once in a while, it earns its keep: a
three-second piece of theatre built out of the game's own vocabulary. There are
sixteen acts and they are dealt from a shuffled bag, so all sixteen are seen
before any repeats.

- **FUSE** — OVER and STACK each get the same shape; STACK lifts, lands on
  OVER, they flash and merge into one wide shape holding the whole word.
- **SLIDE** — the same setup with two shapes that *don't* match, so STACK lands
  on a corner, tips, and slides off into place.
- **LETTERS** — every letter is its own shape; they launch in a wave and stack
  back down one at a time, two of them fusing on the way.
- **FLOAT** — gravity goes out for a second: the word drifts up and turns, then
  gravity comes back and it settles.
- **METEOR** — the word scatters, a meteor comes in from the top right, and the
  impact knocks it back into line.
- **HOLE** — a black hole opens, swallows the scattered letters, and pops,
  spitting them back exactly where they belong.
- **WIND** — a gust sweeps through and carries the letters into place.
- **BOMB** — the mark is buried in loose letters until a bomb clears everything
  that isn't the name.
- **ANGRY** — an angry block hops along the baseline, knocking each pair of
  letters home as it lands.
- **TUMBLE** — the whole word leans like a tower about to go, then rights
  itself.
- **MAGNET** — scattered, held, then snapped home in a single beat.
- **SWELL** — the word thickens, glows and opens its spacing, holds, and lets go.
- **GLINT** — a specular band passes across and every letter it touches lifts.
- **FLIP** — a split-flap board turning each letter over in sequence.
- **STAMP** — the word is driven flat, throws an impact ring, and springs back.
- **SPLIT** — OVER and STACK open a gap, a piece drops through, and they close
  on it.

Three rules hold across all of them. Every act **opens and closes on the plain
resting wordmark**, with a real entrance and exit rather than a fade, so any two
could be chained without a seam. The 0.3 wash is never touched — nothing in the
choreography writes to `#hud-brand` itself, which also keeps it centred. And
motion stays inside a small envelope: vertical travel never exceeds about two
and a half letter-heights, because vertical movement is what pulls the eye off
the tower.

Props sit **behind** the letters — a black hole on top of the word reads as a
blot rather than a hole — except the meteor, the angry block and the glint,
which are meant to pass in front of it. The six acts that scatter the word each
bend the same hand-placed base scatter their own way, mirrored or widened or
flattened, so the set does not have one face.

Acts only begin from DECISION, the one moment nothing is falling; never during
the first-run tour, on a low-tier device, or under reduced motion; and never in
the opening 45 seconds of a run. The gap is 70–120s normally, 42–72s once the
adaptation engine reads the player as bored, and a player who has sat on one
decision for eight seconds can pull the next one forward — but never closer
than 30 seconds apart.

**No emoji, no currency glyph.** Every mark in the interface is drawn; coins are
plain numbers.

**In-play messages never cover the deck.** Toasts, hints and the big reaction
words all sit in the empty band directly under the GREED pill, well above the
blocks and the landing.

## The first run

A brand-new player gets a five-beat tour, once, ever. Each beat is a gold ring
drawn around the thing you are meant to touch and one short line above it:

1. the drop point — *"Tap anywhere to drop. It lands where you tap."*
2. the piece on the deck — *"Two of the same shape fuse into a bigger one."*
3. the NEXT box — *"This one matches nothing. Different shapes just stack."*
4. the GREED pill — *"GREED climbs with every drop, and it multiplies
   everything you fuse."*
5. the BANK button — *"But a fall takes every coin you have not banked."*

Nothing is dimmed, nothing is modal, and there is no Next button: the overlay is
`pointer-events: none` and each beat is dismissed by **doing the thing** it
describes.

**The middle two beats rig the queue**, because "two of the same shape fuse" is
a rule you learn by doing it once, not by reading it. While beat 2 is up, every
piece the tour hands you is a twin of your first one, so a fusion is always one
well-aimed drop away and the ring stays until you land it. The moment one fuses,
the tour does the exact opposite and slips in a shape that matches nothing on
the deck — the fastest way to teach that fusing is a rule and not just what
happens. After that the queue is back to normal for good.

Rigging only ever rewrites `queue[1]` **before it is shown**, so the NEXT box
still never lies about what is coming; and because a lucky cascade can grow the
tower into the odd shape's tier during the two drops it takes to arrive, the
tour checks again the instant before it falls and quietly lines up a fresh one
if it is no longer an orphan.

Beat 3 waits for the odd shape to land, beat 4 for the next drop, and beat 5
waits 15 seconds for a BANK before giving up, so a player who ignores the tour
is finished with it anyway. The ring takes the shape of what it is pointing at —
a circle round the GREED pill would swallow half the HUD — and the bubble is
placed above it by preference, because below would land it on the deck. `save.tutorialDone` keeps it from ever appearing twice, `tutorialRuns`
retires it after three runs for a player who never fuses or banks, and ordinary
onboarding hints stand down while it is on screen.

## On a phone

A phone is not a small desktop, so below 760px the game frames itself
differently.

**The camera frames the deck, not the world.** Fitting all 480 world px across a
narrow screen left the dock at barely half the width with dead space either
side. On a phone the horizontal fit is the dock plus just enough room to watch a
piece topple off the edge, which puts the deck — and every shape on it — at
about three quarters of the screen width. The aim range still fits entirely on
screen, and the frame still eases out on its own as the tower grows. Desktop,
where there is room for it, keeps the wider view.

**BANK is a button, not a billboard.** Just the word, at exactly the height of
the menu chip beside it, no wider than it needs to be. The running total drops
off the button because it is already the biggest number on the screen.

**Sound is a synth engine, not a bag of beeps.** Three things do most of the
work. Everything lands on a shared bus into a soft-knee limiter and a high-shelf
tilt, so two fusions and a collapse at once sit in the mix instead of stabbing,
and the fizz that makes WebAudio games sound cheap is gone. One synthesised
stereo room — decorrelated noise with an exponential tail, built at load — turns
dry oscillators into sounds that happen somewhere, and every voice picks how wet
it is. And everything is in one key, C minor pentatonic across four octaves, so
any two sounds that overlap are consonant by construction; fusions climb the
ladder as the combo climbs.

The voices are FM bells, filtered triangles and noise through envelope-swept
filters — there is not a single raw sawtooth stab left. Anything that happens at
a place on the deck is panned to it. Banking is the most satisfying sound in the
game by design: a resolved minor-seventh spread with soft attacks, a rising sub,
and coins somewhere in the room. Under it all is a room tone that breathes
rather than drones — detuned triangles under a slowly moving filter that only
gets louder and brighter as the run gets more dangerous, and ducks out of the
way of anything big.

**Haptics are a percussion section, not a rumble pack.** Eighteen named cues,
almost all of them shaped patterns — a soft pre-tick into a strong hit, or a run
of taps that resolves — rather than one flat buzz: the tap as you take aim, the
drop, a soft or hard landing, an ordinary fusion against a five-beat one for
tier 5 and up, chains, each whole number of GREED, the moment the tower is
genuinely about to go, an event announcing itself, a revive, a near miss (which
lands *after* the crash rather than under it), jackpots, blasts, a new best, the
bank, a superpower, the collapse.

Every cue carries a weight, and weight is the dramatic scale: nothing fires
within 70ms of the last cue unless it is heavier than what is already playing,
so a collapse always cuts through a landing and the game can never settle into
continuous noise. The Haptics switch is offered on every device: iOS exposes no
Vibration API at all, so feature-detecting it would hide the switch on exactly
the phones most likely to want it.

## Shapes

One shape per tier, each with its own hue *and* side-count *and* size — three
redundant cues so value is never a subtle read: red triangle, orange square,
yellow pentagon, green hexagon, cyan heptagon, blue octagon, violet nonagon, gold
12-sided **AUREX**. Pieces are glossy solids: a radial fall-off, a bright rim, a
coloured glow that grows with the tier, and chamfered corners on the physics body
itself.

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
devours up to 3 pieces, paying coins for each — drawn as a true black disc
with two tilted orbit rings and a gravity well that darkens the world rather
than painting over it), METEOR (warns, then crashes —
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
instead of ending the run. WIND and BLACK HOLE carry the same promise, and it
extends past the event itself: each opens a grace window covering the whole
effect plus a settling tail, so a piece nudged by a gust that slides off its
neighbour two seconds later still vanishes rather than collapsing the tower. When any special block is announced as *incoming*,
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
- Reviving rolls back to the tower from *before* the fatal drop, and then makes
  that tower survivable rather than merely restoring it: pieces that were already
  hanging over the edge are dropped, everything kept is seated fully back over the
  deck with half its lean and no momentum, and the top is trimmed until the board
  is no longer doomed. Every live world event is cleared, the event timer is
  pushed out, the queue is reset to two small grippy pieces, and a grace window
  covers the settle — so an ad-paid revive cannot hand you an instant second
  death, or a block that is impossible to place.
- Any piece resting on a fused/removed/shrunk support is woken so it falls (no
  frozen floating blocks).

## 404

`404.html` is the same game, standing still: same tokens, same shape language,
the same wordmark playing the same animation, and the world still taking its
colour from the most valuable shape on screen. Underneath the number is a small
pile sim — circles for the collisions, the game's polygons for the look, a deck
with edges so the shapes stack instead of spreading into a row. Tapping drops
another one. It is 15 KB, self-contained down to the 1.8 KB font subset that
covers both `OVERSTACK` and `404`, and it makes no network requests at all.

Most static hosts want it at the root of whatever they publish; on GitHub Pages
that is `/404.html` for the published directory.

## Shipping to a real platform (Poki etc.)

Replace `MockAdAdapter` (§18) with an adapter mapping the same interface onto the live
SDK (`init`, `gameLoadingStart/Finished`, `gameplayStart/Stop`, `commercialBreak`,
`rewardedBreak`). Game logic never touches the SDK directly.

## Tuning

All constants live in §1 of the script (`CONFIG`, `RETENTION_CONFIG`, `CHURN_CONFIG`,
`AD_CONFIG`, `MILESTONES`, tier tables). Debug handle: `window.__overstack`.
