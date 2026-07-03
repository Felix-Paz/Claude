# DRIFTLINE — powered by SIREN

A neon arcade survival game whose real product is the engine underneath it:
**SIREN** (Self-Improving Retention Engine) — a player-adaptive director that
watches how *you* play, builds a statistical model of you, and re-tunes every
knob in the game to keep you in the flow channel and coming back.

**Zero dependencies. Zero assets. One HTML file.** Open `index.html` and play.
All telemetry stays in your browser (`localStorage`), and every inference the
engine makes about you is inspectable in-game — press **E**.

---

## The game (60 seconds)

You are a ship that follows your pointer (critically damped spring — floaty but
precise). Collect motes, chain combos, and **graze** hazards — passing within a
hair of death pays shards, charges the **OVERDRIVE** meter, and briefly dilates
time. Chasers hunt you, mines fuse, laser sweeps telegraph, swarms undulate.
Die, read the run summary, press *One More Run*.

Between runs: 9 permanent upgrade tracks, 20 achievements, pilot levels, hull
skins, a seeded **Daily Rift** (modifier + task + streak), and offline salvage
drones. During runs: five *rift events* — GOLD RUSH, METEOR STORM, PHANTOM
CHASE, GRAVITY WELL, ELITE HUNT.

## The engine (the part worth reading)

```
                 ┌──────────────────────────────────────────────────┐
                 │                     SIREN                        │
                 │                                                  │
 input, actions  │  ┌───────────┐      ┌──────────────────────┐    │
 ───────────────►│  │ Telemetry │─────►│     PlayerModel      │    │
 hits, grazes,   │  │  (senses) │      │ · skill (Kalman)     │    │
 deaths, events  │  └───────────┘      │ · frustration/boredom│    │
                 │                     │ · motivation profile │    │
                 │                     │ · churn hazard       │    │
                 │                     └──────┬───────────────┘    │
                 │            ┌───────────────┼───────────────┐    │
                 │            ▼               ▼               ▼    │
                 │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐
                 │  │ FlowDirector │  │ RewardEngine │  │SessionSculptor │
                 │  │ difficulty,  │  │ drops, pity, │  │ goal ladders,  │
                 │  │ pacing waves,│  │ mercy shifts │  │ comeback gifts,│
                 │  │ event clock  │  │              │  │ peak-end frames│
                 │  └──────┬───────┘  └──────┬───────┘  └───────┬────────┘
                 │         │   ┌─────────────┴──┐               │
                 │         │   │ ContentBandit  │               │
                 │         │   │ (Thompson/Beta)│               │
                 │         │   └────────────────┘               │
                 └─────────┼────────────────────────────────────┼──┘
                           ▼                                    ▼
                    spawn budgets,                        summary screens,
                    enemy mix, events                     welcome-backs, HUD goals
```

### PlayerModel — a Kalman filter over your skill

One observation per run: survival time vs. what the current estimate predicted,
blended with graze finesse and hit sloppiness. Standard scalar Kalman update —
`K = σ²/(σ²+R)` — with process noise `Q` so the filter keeps tracking a player
who improves across weeks instead of freezing at their first estimate. The
model also carries continuous **affect** (frustration spikes on deaths and
combo breaks and decays exponentially; boredom *grows* when threat density and
input variance both go quiet) and a **motivation profile** (thrill / collector /
achiever / explorer) nudged by what you actually do, not what you say.

Churn is a logistic hazard over session gaps and how your last session *ended*
(peak-end rule: sessions that end frustrated predict absence).

### FlowDirector — dynamic difficulty as control theory

Base difficulty chases the skill estimate; affect bends it — a frustrated
player gets slack they never see, a bored one gets teeth, and the first three
runs get onboarding grace. On top of that sit **pacing waves** (build–peak–
relief sine cycles, Left 4 Dead-style) and an invisible 3.5s mercy window after
every hit. The director emits a *spawn budget* per second; enemies have costs;
the mix shifts with difficulty. Boredom accelerates the event clock.

### ContentBandit — Thompson sampling over spectacle

Each rift event is an arm of a Beta-Bernoulli bandit. Reward = measured
engagement lift (EWMA of actions/sec + input energy) during the event versus
the pre-event baseline. Arms are sampled with true Beta draws
(Marsaglia–Tsang gamma sampling). Across sessions SIREN literally learns which
spectacle *your* hands respond to, and schedules more of it.

### RewardEngine — variable-ratio with honesty patches

Powerup drops on a variable interval, with two classic economy fixes: a **pity
counter** (a nova is guaranteed within 5 drops — no dead dry streaks) and a
**mercy shift** (frustration > 0.55 silently reweights drops toward defense).

### SessionSculptor — the long game

- **Goal ladder:** always exactly three live goals at three horizons, re-ranked
  by proximity × motivation fit (goal-gradient effect: near-complete goals pull
  hardest). Nothing on it is fabricated — it surfaces progress you already made.
- **Peak-end framing:** the death screen's one-line callout is chosen from the
  run ("★ NEW PERSONAL BEST", "312 from your record. It felt closer than that,
  didn't it?").
- **Comeback machinery:** offline salvage accrual, churn-scaled welcome-back
  gifts, daily streaks with a weekly **streak shield** (missing one day doesn't
  torch a week of habit — punishment-free streaks retain better than brittle ones).

### The dashboard — press E

Every module narrates its decisions to a live, color-coded log:

```
[BANDIT] thompson draws: GOLD RUSH 0.95 · METEOR STORM 0.50 · PHANTOM CHASE 0.76
         · GRAVITY WELL 0.83 · ELITE HUNT 0.98 → ELITE HUNT
[FLOW]   run start: base difficulty 0.91 (skill 0.32, frus 0.15, bore 0.15)
[MODEL]  skill 0.32→0.28 (obs 0.25, K 0.62; survived 11s vs ~60s expected)
[REWARD] mercy shift: frustration 0.58 → defensive drop table
[SCULPT] goal ladder: Magnet Core I 83% · Unlock EMBER hull 33% · 🔥 Gravity 33%
[CHURN]  risk 0.31 (avg gap 1.4d, last session ended at frustration 0.22)
```

Plus live gauges, the flow-channel trace (challenge line riding the skill ± 0.18
band), bandit posteriors with uncertainty, your motivation radar, and a
plain-language dossier of what the engine currently believes about you.
Opening it earns an achievement (*Behind the Curtain*).

## Retention techniques inventory

| Technique | Where |
|---|---|
| Flow-channel dynamic difficulty | `FlowDirector.baseDifficulty` |
| Pacing waves (tension/relief cycles) | `FlowDirector.update` |
| Post-hit mercy window | `FlowDirector.onPlayerHit` |
| Onboarding grace (first runs winnable) | `baseDifficulty` grace factor |
| Personalized content via Thompson sampling | `ContentBandit` |
| Boredom-triggered event acceleration | `FlowDirector.update` |
| Variable-ratio rewards + pity timer | `RewardEngine` |
| Frustration-triggered mercy drops | `RewardEngine.update` |
| Skill-expressive near-misses (graze + slow-mo) | `G.onGraze` |
| Charge-and-release power fantasy (Overdrive) | graze meter |
| Combo chains with visible decay bar | HUD + `Meta.comboWindow` |
| Goal-gradient ladders (3 horizons, always) | `SessionSculptor.goalLadder` |
| Always-on "why" on the HUD | `UI.onRunStart` goal strip |
| Peak-end framed death screens | `summaryCallout` |
| Instant "one more run" (Space/Enter, zero friction) | summary screen |
| Meta-progression sunk value (upgrades, XP, skins) | `Meta` |
| Achievement toasts mid-run | `Meta.checkAch` |
| Daily appointment (seeded modifier + task) | `Meta.boot` |
| Streaks with weekly streak shield | `Meta.boot` |
| Offline accrual (salvage drones) | `Meta.boot` |
| Churn-scaled welcome-back gifts | `SessionSculptor.welcomeGift` |
| Peak-end churn prediction | `PlayerModel.assessChurn` |
| Escalating streak/level reward tables | `Meta.boot` / `onRunEnd` |
| Second-chance revive (Phoenix Protocol) | `G.hitShip` |

## Design lines we hold

The engine's job is to make the game *better for this player*, and it does it
in the open. Deliberately: **no monetization, no guilt copy, no fake numbers**
(every goal bar is real progress), **no engineered near-miss rewards** (grazes
are skill, not slot machines), **data never leaves the device**, and the entire
manipulation machinery is one keypress from being inspected. Retention through
respect: the game earns the next session instead of extorting it.

## Controls

Pointer — steer · **P** pause · **E** engine dashboard · **M** mute ·
**Space/Enter** — one more run.
