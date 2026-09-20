# OVERSTACK

*Stack. Fuse. Get greedy.*

A browser-based physics stacking game engineered for session length and return rate.
Drop shapes onto a wobbling tower — same shapes fuse into bigger, more valuable ones.
Fusions mint **coins**. Every drop is the decision: **BANK** (lock coins into your
permanent vault) or push on and let **GREED** multiply the next payout. Collapse
before banking and the run's coins burn — the vault never does.

**Play it:** open `index.html` in any browser. One self-contained file, no build,
no install, no login, no network required — 2.3 MB, of which 1.9 MB is the five
embedded songs. Everything else, the whole game, is under 400 KB.

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
  (Midas Touch 25k, Gold Rush 120k, Steady Aim 400k, Encore 1.2M, Chroma Rush
  3.5M, Titan Line 10M). Superpowers are earned, never bought — and the ladder is
  deliberately long, because the daily reward alone hands out 50k on its first
  day and the old thresholds gave away two of them before you had really played.
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
fifteen acts and they are dealt from a shuffled bag, so all fifteen are seen
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
blot rather than a hole — except the meteor and the angry block, which are meant
to pass in front of it. The six acts that scatter the word each
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

**In-play messages never cover the deck.** Toasts, hints, the curse banner and
the big reaction words all sit in the empty band under the GREED pill — clear of
it at every width — and well above the blocks and the landing.

**The NEXT preview is never sliced by its own box.** The label is laid out
first, because how much room the icon gets depends on how many lines it takes: a
name too long to shrink readably wraps instead (JACKPOT / DIAMOND), and the icon
is then centred in whatever is left and capped by it. Several specials paint well
outside their own radius — a star's points, a bomb's fuse, a jackpot's rays — and
each has a measured allowance. The canvas is sized to real device pixels rather
than CSS pixels, which is what was making the type look mushy — and the logical
size is a constant matched to the stylesheet rather than measured from the
element, because measuring it fed the canvas's own size back into itself and the
box grew every frame until it covered the screen.

**The magnet is a horseshoe**: a red arch, two legs straight down, white pole
faces on the ends, drawn once and shared by the piece and its preview. The old
one was a shallow bowl with two stubs poking out of the bottom, which at 20px
read as a blob with a bite taken out of it.

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
placed above it by preference, because below would land it on the deck.

**The ring waits for its subject.** The aim ghost is only drawn between drops,
and the odd shape only sits in the NEXT box for a beat, so while a piece is in
the air there is genuinely nothing to circle. Rather than park the ring where
the subject *will* be — which read as lag, or as a ring appearing before the
shape it is pointing at — `Tutor.anchorFor()` returns nothing at all, and the
ring fades out and comes back the moment the shape is really there. The words
hold their place while it is away; before a beat's first placement the whole
bubble stays down, because a bubble pointing nowhere is worse than no bubble. `save.tutorialDone` keeps it from ever appearing twice, `tutorialRuns`
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

**The phone HUD is four corners and nothing else.** NEXT and the menu chip
across the top, the wordmark and BANK across the bottom with their centres on
the same line — and the mark sits at the exact mirror of BANK's centre, a size
down from the desktop mark so it comes off the edge and the idle acts have room
to move without ever reaching the screen border. The vault comes off the play screen entirely — it is a
between-runs number, and it already lives on the menu and the results card. NEXT
is smaller than on desktop, and HUD chips cast no drop shadow at all: they belong
to the flat field they sit on, and a shadow under each one reads as grubbiness
rather than depth. (Cards keep theirs, because those really do float over the
run.)

**Five recorded one-shots, and everything else synthesised.** The things that
happen constantly — a drop, a landing, a fusion, a death, a button — are sampled,
because a recording has a character no two-oscillator voice will ever have. They
ship as base64 MP3 (~25 KB, and MP3 because Ogg Vorbis is Safari 17+ only), and
every one of them falls back to its synth voice if decoding ever fails.

Every source file carried about 100ms of near-silence before the actual hit,
which is heard as the whole game being late. They are trimmed to the first real
sample at build time, the context asks for `latencyHint: 'interactive'`, and the
one deliberate delay left — the wait to see whether a landing fuses — is 55ms.

The landing sound is the sound of a piece that *found nobody*, so it waits 130ms
to see whether a fusion follows and stays quiet if one does — and a piece that
already has a partner in reach when it touches down never even schedules it,
because the fusion sound is coming. A later landing supersedes an earlier one, so
a settling cascade is one sound rather than five. Fusions pitch their own sample
up the pentatonic ladder as the chain climbs.

Everything shares one signal path: a bus into a **soft-knee limiter** and a
high-shelf tilt, so overlapping cues sit in the mix instead of stabbing; one
**synthesised stereo room** (decorrelated noise with an exponential tail) so
nothing happens in a vacuum; and a pan on anything that happens at a place on
the deck. The synth voices are FM bells and filtered triangles in C minor
pentatonic — no raw sawtooth anywhere — and **banking is the loudest cue in the
game** by design: a resolved minor-seventh spread with soft attacks, a rising
sub, and coins somewhere in the room.

**Five songs.** One plays on the menu and everywhere else outside a run; the
other four are the in-run playlist, handed out in order. A run always starts the
**next** one, and the position is saved — end on the third and the next run opens
on the fourth, not back at the first. A revive keeps the song it was on, because
it is the same run.

Each song is cut to a loop whose tail has already been crossfaded onto its own
head, so `loop = true` is genuinely seamless rather than a click every pass. They
are decoded on demand (about 4.6 MB of PCM each) with the next one in the
rotation fetched ahead, so a switch never stalls.

**Switching songs is never a cut.** The outgoing one falls away through a
closing lowpass while the incoming one opens up through one — how a DJ leaves a
track, and far better than a fade. Big moments duck the music briefly rather
than fighting it, and the whole bed sits at about a tenth of full scale: it is a
room, not a performance, and the effects have to cut through it. **Sound effects and music are separate switches**, because
they are separate things: the effects are information, the music is a room.

**There are no haptics.** There were — eighteen shaped cues, a weight scale, an
iOS fallback built on the system tick a `<input type="checkbox" switch>` makes.
It is all gone. On a phone held in one hand the vibration motor is a blunt
instrument next to the audio, and a cue that fires on every landing stops being
information within about a minute. The whole vocabulary was cut rather than
tuned down, along with its setting: one fewer switch, one fewer thing to get
wrong on a device that does not implement the API the way its vendor documents.

## Shapes

One shape per tier, each with its own hue *and* side-count *and* size — three
redundant cues so value is never a subtle read: red triangle, orange square,
yellow pentagon, green hexagon, cyan heptagon, blue octagon, violet nonagon, gold
12-sided **AUREX**. Pieces are glossy solids: a radial fall-off, a bright rim, a
coloured glow that grows with the tier, and chamfered corners on the physics body
itself. AUREX is the end of the ladder — and two of them touching is
[THE OVERFLOW](#the-overflow--two-aurex).

**Shape packs** (the Collection's `theme` items) are **six**, and each is a
different *idea* rather than a different set of hues — the surest way to end up
with ten packs that all look alike is to keep re-rolling the same rainbow:

| Pack | The idea | Perk |
|---|---|---|
| **Signal** (free) | the spectrum | — |
| **Noir** 70k | a value ladder: monochrome ink, one blood accent, gold apex | +6% coins · bombs salvage ×1.8 |
| **Abyss** 150k | a depth ladder: foam down to the trench, lit from below | GREED opens ×1.25 · everything falls slower |
| **Inferno** 400k | a heat ladder: ash, ember, flame, white-hot core | +12% coins · +0.9 s to every chain |
| **Bloom** 900k | a muted ladder: clay, olive, denim, plum — dyed, not lit | GREED opens ×1.2 · the dock forgives the edge |
| **Sovereign** 2M | a material ladder: struck copper, brass, silver, gold | +10% coins · golden blocks 3× as often |

Adjacent tiers stay unmistakable inside every pack (nothing under ~100 of
Manhattan RGB separation — Signal's own closest pair is 107), and pack perks now
pull the same levers docks do (`slowFall`, `comboBonusMs`, `forgiveness`,
`salvageMult`), so a pack changes how a run *plays*, not only what it pays. A
save still wearing a retired pack is migrated back to Signal on load.

**Special blocks** each have their own unmistakable skin (never disguised as a
normal shape), its own behavior, and — since none of that was ever explained
anywhere — [one line saying what it does](#what-that-block-actually-does) the
moment it is announced in NEXT:
- GOLDEN (3× coins) — **gold, not yellow**. It used to be `#ffd93a`, a hair off
  the palette's own tier-3 yellow, so on half the boards it read as an ordinary
  block that happened to sparkle. Now it is deep struck metal that falls off to
  bronze at the rim, and it wears a **milled edge** — the reeded rim of a coin.
  Nothing else in the game has one, so it is identifiable at a glance and at any
  size, without changing its shape, its glow or its sparkle.
- GIANT (huge, 3×, deliberate camera zoom-out on drop)
- BOMB (dark sphere, lit fuse + countdown ring; explodes for salvage)
- UNSTABLE (glitchy hazard skin — and it genuinely *cannot hold still*: it
  shudders every frame and hops about once a second, walking itself along the
  tower and often straight off it. Two rules make that safe to play this hard:
  it can never move anything it touches, and its own fall is never lethal. 2×)
- ICE (slippery, 2×)
- LUCKY STAR (2× + greed surge) · RAINBOW (animated rainbow, fuses with anything)
- MAGNET (horseshoe skin, physically pulls same-tier pieces together to fuse)
- HEAVY (dense iron block, slams + compresses the tower on landing)
- SPLIT (shatters into 4 mini blocks on impact) · ANGRY (has eyes, jumps once after landing)
- DICE (pip-count = live tier, re-rolls each bounce, locks at rest)
- LUCKY CHEST (opens on land: coins / giant / rainbow / magnet / bomb / curse)
- JACKPOT DIAMOND (rare, ~every 5 min, absurd 8× payout)
- **PHASE** (2×) — a violet gate with a turning iris and edges that will not
  quite stay one colour. It falls like any other block, and the moment it lands
  it stops being subject to weight: gravity is cancelled on it every frame and
  its friction is absurd, so wherever it ends up is where it stays — including
  places nothing else in the game could ever rest. Then it starts moving on its
  own. See [walking the crest](#phase--a-block-that-will-not-stay-put).

**World events** fire live (not blocks): BLACK HOLE (opens ON the tower and
devours up to 3 pieces, paying coins for each — drawn as a true black disc
with two tilted orbit rings and a gravity well that darkens the world rather
than painting over it), METEOR (warns, then crashes —
it can knock pieces clean off the dock, but knocked-off pieces just *vanish in a
poof* during its grace window: a meteor can cost you blocks, never the run),
WIND (gusts on the block that is FALLING — the drop drifts sideways to a spot
you didn't pick, its landing x hard-clamped over the dock so wind alone can never
kill; the settled stack is untouched). **You cannot wait a gust out**: the clock
is only a floor, and the gust lifts when you have *landed* three pieces through
it, counted down on a banner. The only way past weather is to play in it.

**And the gust is drawn where you can actually see it.** It used to be a scatter
of pale dots thrown into the *world* layer, which gave it two problems that are
really one problem: it scaled and shook with the deck and never reached the
edges of the screen, and it was a single flat colour, so against a pale board it
disappeared. The physics is untouched — not one line of the force, the landing
clamp or the drop counter — and the look is rebuilt as a viewport-wide layer
(`Weather`, §21g): a **windward wash** with a harder rim right on the edge the
gust comes from, because a large area of tone is what survives a light board
where thin lines do not; long curved **ribbons of moving air** on a slow drift,
each laid down twice — a dark pass under a light one, two pixels apart — so on a
pale board the dark edge carries it and on a dark board the light one does; and
a **drift trail** bending off the piece that is actually being pushed. All of it
breathes on `gust`, the same 0.55–1.0 sine the force uses, so what the screen is
doing and what the physics is doing are the same thing.

There is also CURSE (no-banking / coin-leak /
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

### THE OVERFLOW — two AUREX

AUREX sits at the top of the ladder and there is no tier 9, so two of them
touching used to do precisely nothing: the two most valuable blocks in the game
would sit side by side, inert, and the player who had built them both got no
answer at all. Now the tower cashes itself in — **+500,000 coins, flat**, and a
clean deck.

It is **five** beats, and each one has a job:

| Beat | ~ms | What happens | Why |
|---|---|---|---|
| **CHARGE** | 0–1500 | light builds *between* the two blocks and rings tighten **inward** — the light is being gathered, not spent — arcs jump the gap, dust is pulled in, the shake ramps all the way up and BANK detonates into pulses | the player has to know something is coming before it lands, or the blast is a jump-scare instead of a payoff |
| **BLAST** | 1500 | white, everywhere, out of that exact point — full-screen. A bloom travels outward, a column of light stands where the blocks were, and the deck is emptied underneath the flash | the board is simply *gone* when the light lifts, rather than visibly deleted |
| **COUNT** | 2500–6700 | the number climbs to +500,000 on a smootherstep curve while growing to **3.1×** (2.15× on a phone) — and **every hundred thousand it crosses, it takes a hit**: a scale kick, a flash, a wash of light off the figure itself, a bell climbing the scale | a smooth ramp reads as a progress bar; a ramp that keeps getting punched reads as a number that will not stop |
| **HOLD** | 6700–7700 | nothing. The figure has landed on its number and simply stands there at full size, over one held chord | every crescendo needs a bar of rest after it, or the ear never registers that it peaked |
| **SETTLE** | 7700–9100 | the figure does not shrink politely, it **slams** back through its resting size and settles, with a low boom | a moment only reads as big if the game goes back to normal afterwards |

**It was too fast, and it was drawn with circles.** The whole event used to be over in five seconds, and the parts that are supposed to *be* the payoff went past before they could land — so every beat is now roughly half again as long, with a held beat added between the climb and the slam. The shockwaves are gone too: three stroked circles thrown out from the blast, and more off the figure at every milestone, read as exactly what they were — circles, drawn on top of the game. What a blast actually looks like is light with no edge, so they are soft radial falloffs now, three of them at slightly different speeds, with nothing to outline.

Nothing can be interrupted and nothing can kill you inside it: drops and banking
are refused for the duration, every live world event is cleared, the event timer
is pushed out, and the grace window covers the whole thing plus a tail. The room
holds the AUREX colour while it plays — without that, emptying the deck would
snap the world from white straight back to tier-1 red at the exact instant of
the payoff. Timings live in `CONFIG.overflow`; each phase is clocked from its
own start, so a dropped frame costs that phase a few milliseconds instead of
skipping a beat of the choreography.

**Why it used to play in full only once.** The figure's growth was a CSS
keyframe driven by a class, and re-adding a class that is already on an element
— or whose animation object still exists — does not restart that animation. So
the second OVERFLOW of a session ran its logic, cleared the deck and paid out,
but the number never grew. It is driven from `Overflow.paintNumber()` on the
frame loop now, as an inline transform and shadow: there is no animation left to
restart and so nothing that can fail to re-trigger. Every class the event does
still use is cancelled with `getAnimations().cancel()` before being re-added,
`reset()` puts every property back by hand rather than trusting a class to have
been removed, and a hard backstop finishes the event however it is interrupted.

### PHASE — a block that will not stay put

A block that teleports is easy to describe and easy to get wrong: done badly it
is just a piece that disappears and a different piece that appears, and the
player reads it as a bug. Three rules keep it readable.

**It falls like a block first.** No anti-gravity while it is dropping — you aim
it and land it exactly as you would anything else, and only on first contact
does weight stop applying. That is also the moment the player finds out what
they just dropped.

**It walks the crest, not the room.** `Stack.crestY(x)` is the skyline of the
pile: for any column, the top of whatever piece is under it, or the deck if
there is nothing there. Every destination is sampled off that one function and
scored — it wants to be beside its own tier (so its wandering usually ends in a
fusion rather than in the way), it prefers the high ground, it will not re-form
inside something, and it will not make a jump too short to follow. Four jumps,
then it holds its last spot.

**You can see where it went.** The leaving and the arriving are the same object
at different transforms — the block is sliced into bands and the *real* skin is
drawn inside each one, exactly as the deck build-ups in FIRST LOOK are drawn in
slices of the real deck. It collapses: bands shear apart, the edges split into
cyan and magenta, everything flattens into a line of light and two rings fall
inward after it. It arrives: the slit stabs open, the gate widens out of it with
a back-eased overshoot, the bands snap back in from outside, and rings go out.
Strung between the two points for the length of the arrival is a **corridor** —
a feathered beam and three shrinking outlines of the block itself, so the eye is
never asked to guess whether a new block appeared or the old one moved.

At rest it is still not quite at rest: the iris turns, the edges keep separating
and re-joining, and when the next jump is close the whole silhouette starts to
slip a frame. If it is hanging over a gap, a dashed tether of light runs down to
the crest under it — a block floating in mid-air has to read as *held*, not as
broken. It is intangible for the whole trip (`collisionFilter.mask = 0`), so it
can never shove the tower on its way through, and its own fall is never lethal.

### AUREX × 2 — the strain

Two AUREX on the same board is the rarest thing that can happen in a run, and
until now, if they landed apart, **nothing happened**. The two most valuable
blocks in the game sat there ignoring each other, and the player holding the
single most valuable move available had no way of knowing it was there.

So they acknowledge each other, and the whole effect is a function of one
number: the gap between their surfaces.

| Gap | What it looks like |
|---|---|
| 300 → 200 px | filaments start off both near faces and **visibly fall short**, guttering out in mid-air; a soft lens of light thickens in the space between them |
| 200 → 120 px | the arcs get further each time, hot nodes swell on both faces, an ellipse closes on the pair and repeats |
| 120 → 60 px | the far half of each block falls into amber shade while its near half blazes; concentric arcs march inward across the near faces; a starburst opens off the pair; the board begins to shake |
| under 60 px | one white seam between them, the vignette closes in, the tone is nearly continuous — and the pull turns real and shuts the gap |

The pull is deliberately almost nothing until the end (`CONFIG.strainForce`,
scaled by `k³`): the player closes the gap, the game does not close it for them.
Inside about a block's width a snap term takes over, because two bodies this
heavy and this high-friction will otherwise stall half a pixel short of the
payoff. The force is equal and opposite and always along the axis between them,
so the pair's centre of mass never moves and neither block can be dragged
outward.

**Contrast, not more light.** The first version of the close-range effect got
*less* visible as it got stronger, which is exactly backwards. An AUREX is
already the whitest thing on the board, so adding light to it does nothing — the
near face cannot get brighter than white, and at a twenty-pixel gap there is no
room left between the two to draw anything in. So at close range the drama moves
*out* to the pair, and the near faces are lit by pushing their far halves down
into amber shadow instead. Everything is either soft-edged or clipped to a real
silhouette: the earlier pass had gradient-filled trapezoids for the light cones
and they read as sheets of paper laid over the board, so they are an ellipse
stretched along the axis now, which has no edge to give away.

You can also hear it. `Audio2.strain(k)` fires one tone whose **rate** is the
reading — from about twice a second out at the edge of reach to nearly
continuous at touching distance — with pitch, brightness and a second voice
climbing with it, so you can tell how close they are with your eyes on the
falling piece.

### FIRST LOOK — a deck, and a pack, arriving

Buying a thing and then just *having* it is the least interesting version of
owning it. The first run on a deck you have never played, and the first run in a
pack you have never played, now open with the thing arriving. It fires once per
item, the first time it is actually **played** with — not when it is bought and
not when it is equipped in the shop, because neither of those is the moment you
see it (`save.debuted`).

**And it is a different arrival every time.** The first version of this gave all
seventeen decks the same sentence with different adjectives — parts fall in,
parts assemble, the deck is there. Different dust, same choreography, and
choreography is what the eye actually reads. So a deck now chooses three things,
not one:

- **style** — what a part does on its way in
- **order** — which part goes first: out from the middle, along the deck, from
  the ends inward, all at once, or in no order at all (six orderings, every one
  a real permutation, so no slab is ever visited twice or skipped)
- **whole** — whether there are parts at all. A deck marked `whole` arrives as
  **one object on one clock**; the slabs are still slices of the real deck, they
  just never move independently.

That last one is what makes the Bumper Deck read as a single springy body and
OBSIDIAN CROWN as a single gesture — an enormous thing lowered onto the board
over a second and a quarter, turning a few degrees straight as it comes — rather
than as seven planks landing in a row. `Reveal.rigid()` solves the whole deck's
motion for each slab's own centre and hands back the translation that puts it
exactly where a rigid body would, because `paintDock` spins and scales each slab
about *itself*: handing the deck a rotation directly shears it into a fan.

Whole-deck gestures also needed an ease that is actually slow. `out5` puts ninety
per cent of its travel in the first fifth of the clock — right for a slab being
driven into place, completely wrong for a coronation, which simply appeared, sat
still and waited out its own animation. `EASE.glide` keeps moving the whole way
and only eases at the very end.

**A deck builds itself.** The deck is not there when the run opens. Then it
arrives as itself — each landing with a thud, a puff of dust and a knock that
climbs a little with every piece, and a whole-deck arrival landing **once**,
at the end of its travel, instead of ringing a metronome seven times for a
single object. When the last one seats, the surface light runs across it, the
deck's signature detail fades up out of the material, and — if it has them —
the bumper walls rise out of the ends. Every frame of it is drawn by
the **same renderer that draws the finished deck**, in slices: `paintDock()`
takes a slab, clips the paint to a horizontal slice and offsets it, so a build-up
can never drift out of step with the real thing because it *is* the real thing.
(The ambient glow is the one thing skipped on a slab — clipped to a slice it
stops being a halo and becomes a hot line down both cut edges, which is exactly
what makes an assembly read as stripes instead of one deck.)

**A pack arrives as its shapes — and each pack builds a different shape in
space.** This was also one row of eight with five ways of sliding into it. A
pack's idea *is* a ladder of some kind, so the arrival is that ladder being
built in front of you, and the resting layout changes as much as the entry does:

| Pack | The arrival |
|---|---|
| **Noir** | a flat row that arrives grey, then catches fire along its own length until the gold apex flares |
| **Abyss** | a descent — each shape sinks to its own depth, so the row ends up a slope going down into the dark |
| **Inferno** | a burning fuse: nothing exists ahead of the flame, and everything behind it is still glowing |
| **Bloom** | a fan — they start stacked in one place and open outward into an arc (normalised so the ends of the fan land exactly where the ends of a plain row would, and it still fits a 390px phone) |
| **Sovereign** | a stack being struck, **apex first**: the most valuable thing lands before anything else, hammered down onto the line |

The room still runs up the pack's whole ladder underneath it, tier by tier,
while it happens.

**Two ways an arrival used to go missing.** The debut was spent the instant the
reveal was *chosen* — so a run abandoned in its first second burned the one
showing a deck or a pack ever gets. It is spent when the thing has finished
arriving now; showing it twice because the tab reloaded mid-arrival is a far
smaller failure than never showing it at all. And the pack parade was gated on
the performance tier, so a whole class of device silently never saw one while
still spending the debut on it — it is eight filled polygons and no particles,
so it runs anywhere.

**Then the name lands, and how hard it lands is what it cost.** Four grades on
the same three elements, so the difference is choreography rather than clutter —
which is what makes the expensive one feel expensive:

| Grade | Price | The arrival |
|---|---|---|
| 0 | under 200k | a clean lift, letters together |
| 1 | 200k–700k | letters slide in behind a sweep, out of blur |
| 2 | 700k–5M | each letter **slams** in on its own, from 2.6× and blurred, with a flash on landing |
| 3 | 5M+ | the same, harder and held longer, with a gold sweep running over the top |

Play is refused while the thing is still arriving, and not a moment longer — the
name card is only a look, so the deck is playable underneath it.

### Nothing stands on its own corner

A square falls, rolls, and comes to rest standing on one of its corners — a
diamond balanced on a point, held there by nothing. It stays like that until
something else touches it, and then it instantly topples, which is the tell: the
pose was never stable, the solver had just stopped looking at it.

Two things put a piece there. A rigid-body solver will happily find an exact
equilibrium on a single contact point, because with the contact normal running
through the centre of mass there is no torque to tip it; and Matter's sleeping
then freezes that pose permanently, so the infinitesimal nudge that would topple
it in the real world never arrives.

So `Balance` delivers the nudge. Every settled piece is measured against the
horizontal span of its own active contacts — that span **is** its base, and a
piece whose base has collapsed to a point is standing on nothing. It gets a
little angular velocity in the direction it is already leaning (dead centre, the
perfect balance that started all this, is the one case with no answer, and there
a coin toss is exactly right), and gravity finishes the job.

What it must never do is tidy up the tower, and two things keep it honest. A
block wedged against a neighbour, a plank bridging two others, a deliberate lean
— all of those have contacts at two separated places and a wide base, so none of
them qualifies. And Matter will sometimes report a *single* contact point for a
face lying flat on the deck, so acting on the contact span alone would topple
perfectly stable blocks; a second, purely geometric test asks the body's own
vertices instead — a piece resting on a face has two at its lowest extent, a
piece standing on a corner has one. Only a piece that fails **both** is ever
touched. Measured: a square balanced on a point falls over 12 times out of 12,
while a real dropped tower and a plank bridge drift **0px** and are never nudged.

### What that block actually does

Fifteen special blocks shipped with their own physics, their own payouts and
their own skins, and nothing anywhere that said what any of them were. You could
play for an hour without working out that the dice block re-rolls its own tier,
or that a bomb never merges with anything.

So the moment a special is announced in NEXT, it says what it is: one line, in
the same column every other live notice uses, up early enough to plan around and
gone before it is in the way. It never lands on top of the tour, an OVERFLOW, or
a deck still arriving.

The part that matters is that **"what it merges with" is drawn rather than
written**. A sentence naming the partner tier makes the player learn a second
vocabulary — the names — on top of the one they already read fluently, which is
the shapes themselves. So the pill just shows the shape, at 14 pixels, using the
same `drawDefIcon` the NEXT box and the aim ghost use: a wild card gets a little
run of partners instead of one, and a block that never merges says so in words
with no partner shape at all.

### The meteor is on fire

The ball was already right — a hot core falling off to a charred rim — so it is
untouched. What is new is everything around it, and all of it hangs off one piece
of state: the trail of positions the rock has actually occupied. Drawing the fire
along the real path rather than straight back along the velocity is the
difference between a rock burning through air and a rock wearing a cone.

Three passes run that path — a wide dark-orange body, a narrower bright one and
a thin white heart, each narrowing and cooling toward the tail, each segment
guttering on its own clock. Two more run it offset *across* the axis by a
travelling wave, so the silhouette ripples and tears. A bow shock stands just off
the leading edge where the air is piling up; smoke drawn with the normal operator
sits behind and under the fire, because a trail made only of additive light has
no weight; molten cracks turn across the rock as it tumbles; and it sheds embers
hard the whole way down. (The first attempt drew the flame licks as polylines and
they read as wire — everything here is soft-edged now, with no stroke in it.)

### PAST THE CROWN — a trial, and something you are given

OBSIDIAN CROWN used to be where the game quietly ended: the most expensive deck
in the Collection, every perk at once, and nothing left to want. So the crown
keeps all of its rewards and asks for something back. A deck can now carry a
`trial` multiplier, and every system that can lean on the player reads that one
number: **world events come at you ~45% more often**, and **the board's own edge
forgives proportionally less** than its trim suggests. It is the hardest board in
the game *and* the best one, which is the only way an endgame deck stays
interesting. The divisor is applied to the board's forgiveness and never to
STEADY AIM: a superpower is earned once and belongs to the player, and a deck
that quietly confiscated it would be a punishment for equipping the best thing
you own.

And past it there is **ZENITH**, at 20,000,000 — the only thing in the game that
is not for sale until it is offered. It carries no price, no progress bar and no
row in the Collection until **three runs have been finished on a trial deck**;
then a card arrives unbidden, says what the player did to deserve being shown it,
names it, and gets out of the way. It is not given — the price is still the price
— because a gift you cannot afford yet is a goal, and a goal is the point. In the
Collection it renders as a different *kind* of row rather than a more expensive
one: violet-on-black with a MYTHIC tag. The deck itself is the only one that is
not a material at all — a prism, with bands of the whole spectrum drifting under
a white surface, gold rules top and bottom and a slow star at the centre — and it
runs at the steepest trial in the game.

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
Six shape packs (above) and 17 docks, each a clean material with one quiet
signature detail (restraint reads expensive): Slab (the free default — a cool charcoal-slate that pops against the
green world), Heartwood, Brushed Steel, Carrara, Porcelain, Liquid Glass,
Basalt Forge, Reactor, Bullion, Bumper Deck, Aurora Deck, Nebula, Crimson Velvet,
Vortex Core, Obsidian, the 10,000,000 OBSIDIAN CROWN and — once it has been
earned rather than found — the 20,000,000 ZENITH. Power dimensions:
`lengthBonus`, `grip`, `forgiveness`, `slowFall`, `greedRate`, `salvageMult`,
`comboBonusMs`, `walls`, and `trial` — the one that makes a deck *harder* rather
than kinder.

Every dock and pack also gets a **first look** the first time it is played (see
above), graded by what it cost. Difficulty also leans harder as your vault grows past
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
- **A walled dock moves the point of no return up.** On an open deck a piece is
  only lost once it drops past the dock line; on Bumper Deck or OBSIDIAN CROWN
  it is lost the moment it clears the crest on the outside, because the wall it
  just went over is now between it and any way back. Reading the dock line there
  handed the player a free banking window while the piece was still visibly on
  its way down the outside — that window is gone.
- **An UNSTABLE block can never move anything else.** Every physics step, the
  velocity a neighbour gained along its contact with an unstable block is
  measured and handed straight back: the neighbour keeps gravity and keeps
  whatever every other body did to it, and feels nothing at all from this one. A
  piece stacked *on* one still gets its support (only the sideways drag is
  cancelled), and the settle check excuses a block that is never still, so a
  shuddering block never stalls the run behind a timeout.
- A frozen piece has *infinite* mass in Matter, and one of those in the
  centre-of-mass sum turns `Stack.stability()` into `NaN`, which then walks out
  through the micro-shake and into the camera transform. Anything without a
  finite, positive mass is simply not part of the balance.
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

## Privacy and terms

Settings has a **Privacy policy and terms** button, and behind it two documents
on a tabbed screen. This is not decoration: Y8, GameDistribution, GameMonetize
and GamePix all require a reachable privacy policy before they will take a build,
and a game that keeps a save, plays ads and measures anything needs to say so.

The policy covers what the game stores (a single `localStorage` key, on the
device, never transmitted), what it does not collect (no account, no name, no
email, no location, no contacts, no cross-site tracking), what an embedded
portal and its ad partners may collect independently of the game, how to erase
everything (Reset progress, or clearing site data), children's-privacy posture
under COPPA and GDPR-K, and the rights a reader has under GDPR and CCPA. The
terms cover the licence, acceptable use, virtual goods having no cash value, the
absence of a warranty, limitation of liability, and termination.

Three fields at the top of `LEGAL` in §5 are marked placeholders and must be
filled before the build is submitted anywhere: `contact` (a real address a
person reads), `law` (the governing jurisdiction), and `updated`. They are
deliberately obvious rather than plausible-looking, so a build cannot ship with
a fake contact address by accident.

## The tuning pass

Small things, mostly, and a few that were bugs wearing the costume of a
preference.

**A curse says it once.** The red badge stays; the toast that repeated its exact
words next to it is gone.

**And two notices never pile up.** A special is often announced twice — once as
"INCOMING" while it is still in the queue, and again as the banner that explains
it — and the two share a spot on screen. The toast is now sent away the moment
the banner is due, and the banner waits for it to finish leaving.

**The special-block hint waits for the block.** It used to fire when a special
entered the NEXT box and vanish 4.6 seconds later — which meant it explained a
block you could not yet act on and was gone by the time you held it. It now
appears when that block becomes the piece you are about to drop, and it lives
exactly as long as the block does: through the aim, through the fall, and out
the moment the piece merges, explodes, opens, shatters or leaves the deck. An
explanation still sitting there for a block that left is worse than none. The
hint tracks the queue entry itself rather than its type, so two golden blocks in
a row get two explanations, because they are two decisions.

**Giant and golden no longer spell out the obvious.** "Merges with its own kind"
under a block that plainly is its own kind is noise; those two now show the
block and the line and nothing else. Wild cards and the blocks that never merge
still show their partners, because there the rule is not obvious.

**Blocks lie flat.** Three separate causes, all of them real:

- *A merged piece was born crooked.* A fusion spawns already sitting in a gap,
  and it was inheriting the same random ±14° tilt a fresh drop gets to make it
  look like it tumbled in. With friction this high, nothing rocks it flat again.
- *"Flat" was the wrong angle.* Matter puts a polygon's face midpoints at
  multiples of 2π/n from the body angle, so a pentagon at angle 0 is standing
  18° off its own bottom face — on a corner, not on a side. Every piece that
  asked to be born square was being born crooked, including the star. There is
  now one `restAngle(n)` that answers "which angle puts a face on the floor",
  and both the spawner and the settle assist read it.
- *Static friction locked the rest.* A block that lands on another very often
  stops 10–25° off flat and simply stays there — not sunk, not balanced on a
  point, just tipped, until the next drop knocks it loose (which is exactly what
  you were seeing). The settle assist watches any piece that is held up from
  below, on a level contact, more than ~4.3° off flat for longer than 200ms, and
  adds a torque proportional to the error — capped, and never for more than
  1.4 seconds on one piece, so it cannot fight the physics or spin anything.

  On a fixed seeded game, mean resting tilt went from 6.4° to 3.1°, and pieces
  more than 8° off flat from 4 in 13 to 1 in 13.

**A merge still rocks, it just lands flat.** The lean is back, and it is
literally the old value: a merged block arrives tipped by up to fourteen
degrees and rocks itself down, exactly as it always did. That lean had been
taken away when merged pieces were made to arrive square — because with
friction this high a lean was a lean *forever*, and the block simply stayed
crooked, which is the bug it was removed to fix. What makes it safe to put back
is that the settle assist has since learned three things:

- **It waits for the block to stop.** A piece still turning is settling, not
  stuck, so the rock is left to play out instead of being fought — and the
  assist's time budget is still intact at the moment it is actually needed.
- **Its budget is a rate limit, not a life sentence.** A piece shoved crooked
  used to spend its whole allowance failing to straighten against whatever was
  leaning on it, then be abandoned that way for the rest of the run. Left alone
  for a couple of seconds, it earns another go.
- **It can wake a sleeper.** Matter deactivates the contact pairs between
  sleeping bodies, so a settled tower reports no support data at all, and the
  assist — which reads exactly that data — would bail out. A block that fell
  asleep crooked could never be straightened again: most settled dead flat and
  a handful sat at thirty degrees for the rest of the run, which is precisely
  the behaviour that was reported. One more than 8° off flat now gets woken;
  the next tick has real contacts and the ordinary path takes over.

Measured over thirty merges: the block leans up to 14° and comes to rest
between 0.0° and 1.2°, every time.

A spin and a small upward hop were both tried in place of the lean, and both
removed. A sideways nudge shifts the new block's centre of mass; extra upward
energy carries it past a corner, and at one setting two runs in three left a
block sitting at twenty-five degrees. Either one could also topple a marginal
tower — and a merge is not allowed to change whether a stack survives, which
the dev build's deliberately precarious tower template checks.

What is deliberately *not* straightened: a block wedged between two neighbours,
and a block perched on a slope. Those are at an angle because the stack put
them there, and forcing them square would be inventing physics rather than
fixing it — which is also why the test reports the **median** resting tilt
rather than the mean. A tower legitimately contains a few blocks the stack has
jammed at an angle, and one of those at fifty degrees drags an average
anywhere it likes. The typical block now comes to rest under 3°.

**The star is a star-shaped hole, not a ghost.** Its collision body is a
chamfered pentagon, and chamfering pulls the real hull *inside* the radius — so
points drawn at full radius hung in empty space and passed visibly through the
deck. The drawn star now sits at 0.92 of the radius, inside the hull it actually
collides with, from one `STAR_R` constant both the board and the NEXT box read.

**The angry block keeps being angry.** It jumped once and went quiet. It now
jumps on an interval (`CONFIG.angryJumpGapMs`), each hop a little weaker than
the last and pulled slightly inward so it works its way toward the middle of the
pile rather than off the side.

**The camera comes home.** It framed out to show a scattered tower and then
stayed there. The pull-out is unchanged; there is now a return: once the real
top of the climb sits well below the frame, the camera eases back and stops
exactly at home rather than in the dead zone that was holding it out.

**Wind has a terminal speed.** It was occasionally throwing the whole deck off.
The force is slightly lower, and drift is now capped (`windMaxDrift`) — a gust
can slide a tower, but it cannot accelerate one off the edge.

**The dice block wears the tier it will merge with.** Its outline takes the
colour of the tier it is currently showing — red on 1, orange on 2 — and pulses
while the roll is still live, going solid when it locks.

**The OVERFLOW counter stopped sounding like a funeral.** The climb was 22
minor-scale bells. It is now 48 low mechanical clicks, placed by inverting the
counter's own easing so they land with the digits: a counter being counted, not
a lament. The landing chord is unchanged. And the white flash at the merge holds
fully white for a real beat before it lets the world back in.

**A deck arrives, says its name, and then the game starts.** The name lands in
large type once the deck is whole, with its own in-and-out transition and a
shrink-to-fit pass so long names like OBSIDIAN CROWN never overflow the screen.
The drop preview is held back through all of it and fades in once the card is
gone — no aim line hanging over a deck that is still assembling.

**The tour talks next to what it is talking about.** Each step's tip is now
placed by scoring eight candidate positions against everything already on
screen, so it lands in empty space beside its subject instead of on top of it.

**Events and specials come a little more often** — the gap between world events
is 33–54s rather than 45–75s.

**Haptics are gone entirely**, along with their setting. See [On a phone](#on-a-phone).

## Graphics: AUTO, LOW, HIGH

Settings used to offer a **Reduce motion / low power** switch, backed by a probe
that measured the first 150 frames of the session, and — if they looked slow —
turned a long list of things off, permanently, with no way back. A device that
happened to be busy while the page loaded spent the rest of the session with
half the game missing. A device that got hot twenty minutes in was never
noticed at all.

That is replaced by one control with three positions. **HIGH** is the whole game
with nothing withheld. **LOW** takes every picture-level saving at once and
leaves the physics alone. **AUTO** is the default, and it is the interesting one.

### What AUTO actually does

It starts at HIGH, because the assumption is that the device is fine. Then it
watches, once a second, and asks three separate questions, because they are
three different failures:

- **Are frames arriving late?** (mean overshoot past the budget)
- **Are they arriving unevenly?** (share of frames that ran badly long)
- **Are they arriving at all?** (frames delivered per second)

A steady 40fps and a locked 60 with one stall a second are both bad, and only
one of them shows up in an average — which is why frame *pacing* is measured
alongside frame *rate*.

The budget comes from the display, not from a constant: the first ninety frames
identify a 60, 90 or 120Hz panel, and the target is set to the refresh rate or
60, whichever is gentler, plus a quarter-frame of room. A phone that can only
just hold 60 is never told it is failing for not reaching 120.

**It does not turn things down. It turns ONE thing down, and only if that thing
is currently costing something.** Every rung on the ladder can price itself
against the scene as it stands — no sparks on screen, no saving available from
the sparks, so that rung is skipped entirely and the next one is considered. A
reduction worth less than a third of a millisecond is not taken at all, because
the player would notice the loss and not the gain.

### The ladder, ordered by measurement

Each step was benchmarked on an identical seeded board under a 6× CPU throttle
at DPR 2, twice — once with the particle pool saturated, once with only the
sparks the props throw off themselves. Share of frame time returned:

| Step | Measured saving | Notes |
|---|---|---|
| resolution | **36%** | quadratic in pixels; the biggest single lever |
| background wash | **24%** | identical in both runs — the most reliable result here |
| glow on blocks | **19%** | |
| glow on sparks | **9%** | only with a full pool; ~0 with a dozen sparks |
| solver accuracy | **6%** | last resort, past where manual LOW stops |
| glow on props | **4%** | |
| spark count | **0%** | no measurable effect in either run |
| ambient sparks | **0%** | no measurable effect in either run |

The last two rows are the whole point. Turning off ambient sparks makes the
game plainer and gives back *nothing*, so it is not a step on its own — it
happens only as part of capping the pool, and only once the pool is genuinely
large enough for the cap to buy something. Nothing is taken away just because
it could be.

### Coming back

Recovery is deliberately slower than reduction, and it happens one rung at a
time, most-recent-first. How fast depends on how much room the device is
showing: comfortably idle and it comes back in about two seconds a step, only
just healthy and it takes the slow road, because that is the device most likely
to fall over again. A step that fails on the way back up earns a cooling-off
period that doubles each time, so a device sitting exactly on the edge settles
instead of flickering a feature on and off.

Three things are never treated as evidence: the first few seconds after boot, a
run opening, and the moment just after a change was made. Those all cost frames
for reasons that say nothing about what the device can sustain, and judging them
would have the game strip itself during precisely the seconds it is trying to
impress.

### What it will not do

Quality changes how the game is **drawn**. It never touches the simulation, the
economy, the director, the retention model or the odds — there is a test that
diffs all of those across a mode change. The single exception is the solver, at
the very bottom of the ladder, past where manual LOW stops: same physics, same
constants, fewer iterations, reached only on a device that is otherwise failing
outright. In a throttled test the controller never gets that far.

### The optimisations underneath

Reducing quality is the fallback. Three things were simply made cheaper, and
they help every device at HIGH:

- **Block gradients are built once per look, not once per block per frame.** A
  block's gradient depends on its skin, its tier colour and its size, and on
  nothing that changes as it moves — yet it was being rebuilt sixty times a
  second per block and thrown away. Measured at ~0.54ms a frame on a two-dozen
  block board. The cached gradient is built at the origin and the canvas is
  translated for the fill alone, which lands identical pixels: a gradient is
  resolved in the space in effect when the paint lands, while the path was
  already baked when it was traced.
- **The piece list is built once per change, not once per ask.** It walked the
  whole body tree and allocated two arrays every call, several times a frame.
  `plugin.piece` never changes after a body is built, so the list is rebuilt
  only when something enters or leaves the world.
- **The HUD stops writing text that has not changed.** The score, the multiplier
  and the BANK label are recomputed every frame and change on maybe one frame in
  ten, and they sit inside elements running CSS animations.

A pixel-diff harness compares HIGH against the previous build on four scenes,
reading the canvas directly and comparing 16×16 tile means. The two
deterministic scenes — a tower of plain blocks, and the menu — come back
**identical**. The two scenes full of self-animating blocks throwing random
sparks are noisy by construction, so they are read against a control: the same
build compared with itself, twice. Old-vs-new lands inside that control band
every time, and on several runs the control differs *more* than the change
does.

## The dev build

`overstack/dev.html` is the same game with a window cut into the side of it.
Open it instead of `index.html`; everything else about it is identical.

**It really is the same game.** The panel is appended *inside* the game's own
IIFE, after the last line of it — so it can reach every module directly while
not one character above it changes. The build asserts that: strip the `§99` block
out of `dev.html` and the remaining script is byte-for-byte `index.html`.

**How it fits on screen.** The game is wrapped in `#game-shell`, which carries a
transform — that makes it the containing block for every `position: fixed`
element inside it, so the whole game lays out inside the left column without a
single one of its own rules being touched. `window.innerWidth/innerHeight` are
shadowed to the shell's size so the canvas measures the column rather than the
window. (Telling the game its new size means firing a resize event at it, and the
game's handler re-sizes the canvas, which clears the backing store. A first
version re-entered on its own synthetic event and cleared the canvas after every
render: the game ran perfectly while drawing to nothing at all. It fires exactly
once per real size change now.)

### CORE ENGINE — what the machine knows, and what it is doing about it

Every group is live, and almost every row is editable, so you can set a state and
watch the game react to it:

- **This run** — state, coins, GREED, stability, whether the tower is already
  past saving, chain and combo, spam heat
- **Flow director** — the flow score, the band it lands in, the thresholds, and
  the six weights the band hands to the piece roll, plus wealth and spam
  pressure. `Director.band()` recomputes the score from the player model every
  roll, so typing a score in would be thrown away a moment later — instead there
  is a **band pin** that holds the game in a band, and a row that tells you when
  the session's opening phase is overriding the band anyway
- **Player model** — all ten exponential moving averages, the only inputs to the
  flow score
- **Player profile** — risk tolerance, inferred goal, style title, and every
  counter behind them
- **Session arc**, **churn watch** (including whether a gift is queued for the
  next piece) and **ads**
- **Equipped** — every perk the deck and the pack are actually applying
- **Event director** — the countdown to the next event, the grace window, every
  live event, and the current block-injection odds
- **The save**
- **Event log** — both streams, newest first: `trackEvent` (analytics) and the
  FeedbackBus (audio / visuals)

### TESTING — make anything happen

- **What drops next** — tier, special, shape and size into either queue slot,
  plus one button per special wearing its own skin (the board cannot be used as a
  gallery: a bomb goes off, a chest opens, a split shatters, and five of them
  vanish rather than fall)
- **World events** — meteor, black hole, wind, curse, jackpot, roll one at
  random, clear everything, or hold events off entirely
- **Set pieces** — THE OVERFLOW, two AUREX left far apart to strain at each
  other, a phase block on a pile, the revive screen, and any deck or pack
  arrival replayed on demand
- **Money** — run coins, vault, GREED, and UNLOCK EVERYTHING
- **Physics** — gravity, time scale, solver iterations, sleeping, zero-g, a shove,
  slow-mo, and the corner-balance case
- **Tower templates** — nine of them, laid one piece at a time and allowed to
  settle, so what you get is a board the physics agreed to rather than a dozen
  bodies spawned inside one another and thrown off the deck. The three
  *inspection* layouts freeze fusions first, or they would merge themselves into
  two pieces before you could read them
- **Quality** — the mode, the live numbers the adaptive controller decides on
  (frames per second against the detected refresh rate, mean lateness, share of
  long frames), how far down the ladder it is, every rung it has taken and why,
  what the next rung would save in the scene as it stands, and whether a
  warm-up hold is currently suppressing judgement. Rungs can be stepped down
  and back up by hand
- **Flags** — god mode, freeze fusions, sound, music, restart, replay the tour,
  wipe the save

Verified by `test_dev.js`: 48 assertions that press the actual buttons and check
the game moved.

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
