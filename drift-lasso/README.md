# Drift Lasso

A portal-ready, single-mechanic **hypercasual** web game with a **bold cartoon 2.5D** look
(glossy 3D-style balls, soft shadows, candy colours, thick ink outlines) fused with `.io`-style
area capture. You drive a glossy ball that leaves a thick candy ribbon; **steer left/right** and
circle the little drones with your trail to pop them. Cross your own live trail with nothing
enclosed and you die. Greed kills. The arena is full of **characters** — googly-eyed wanderers,
teal cowards that flee you, rare gold stars, and spiky purple bombs you must *not* lasso.

> Steer, circle, pop. Depth comes from escalation + a cast of critters, not menus.

The entire game ships as **one self-contained `index.html`** — vanilla JS + HTML5 Canvas 2D, no
dependencies, no external fonts/CDNs, no network calls. It is playable within 2–3 seconds of load.

---

## Run it

```bash
# Option A — just open the file
open index.html            # macOS  (or double-click it)

# Option B — serve it (recommended; mirrors how a portal iframes it)
python3 -m http.server 8000
#   then visit http://localhost:8000/
```

That's it. No build step, no install. To deploy, upload `index.html` (the rest is optional dev tooling).

**Controls — direct steering:** the car always drives forward; you steer it.
**Phone:** hold the **left or right half** of the screen to turn that way. **Desktop:** `←` / `→`
or `A` / `D`. No input = drive straight. Circle a drone to lasso it. Touch, mouse, or keyboard
(`Space` / `↓` / `Enter`) all map to the same single "hold" input.

---

## The first 10 seconds (guaranteed)

There is no menu, logo, or tutorial. On load the car drives into the arena flanked by big pulsing
**◀ ▶ steering arrows** and a single intro drone that **hovers at the car's turn-centre** — so the
moment the player steers (left *or* right) the loop wraps it. And if they touch *nothing*, the car
**auto-curls** after a beat and laps it anyway. Either way you win; intro deaths are softened to
trail-resets so the first try literally cannot fail. Verified across **every input × 6 screen sizes**
(`_dev/sim.test.js`): first capture in **≤7 s**, always; driving straight never self-crosses.

---

## Cast & hazards

Everything has googly eyes that track you, blink, and emote — and behaves differently:

- 🟠 **Wanderer** — drifts lazily. Bread-and-butter points.
- 🟢 **Runner** — a teal coward that **panics and flees** when you get close (worth `1.6×`). Chasing them down is the fun.
- ⭐ **Gold star** — rare, fast, **`3×`** points + a fanfare. Variable-reward dopamine.
- 🟣 **Bomb** — a spiky purple grump. **Do NOT lasso it:** wrapping a bomb spoils the loop, **shatters your combo**, and stings (`BONK!`) — but never kills you (the one death rule stays "empty self-cross"). The greed preview turns **red** when a closing loop would catch one.
- 🌈 **Power-up orb** — rare; **drive over it** to grab a ~7s power: **FRENZY** (score ×2), **MAGNET** (reels critters in), or **SLO-MO** (everything slows).

Your trail is a **fence** — drones can't cross your live line, so once you start circling them they're trapped (close the mouth to seal the catch). The tail **grows longer** the more you catch in a run: bigger lassos, bigger risk.

Captures fire **witty callouts** (`YOINK!`, `GOTCHA!`, `ROUNDUP!`…), candy confetti, a camera punch, and a rising-pitch combo ladder.

---

## Purpose: levels, goals, garage

- **Levels = themed maps** — every **`LEVEL_STEP` (500) points = a level**, shown as a progress bar under the score + a `LV` chip. Each level-up fires a banner, pays coins, nudges difficulty, and **swaps the whole biome**: a crossfading sky, a different floor motif, and a witty name banner. The cast (the cartoon critters) stays for legibility; the *world* changes. Biomes cycle: **Neon Grid → Deep Space → Coral Reef → Disco Fever → Wild West → Candy Rush** (`BIOMES` array — add your own with a name, two sky colours, and a floor type: `grid/stars/bubbles/checker/dunes/sprinkles`).
- **Objectives** — 3 rotating goals (in the Garage now): *Lasso 9 runners*, *Hit a x6 combo*, *Catch a gold star*… complete one → coins + fanfare → replaced. The longer-term "one more run" hook. (The old daily-streak is gone.)
- **Garage** — 9 trail skins + **make-your-own custom trail** (pick two colours), 6 car skins, and **equippable superpowers** (🧲 Magnet · 🛡️ Shield · 🔥 Hot Start). Buy with coins or watch a rewarded ad.

## Difficulty & the win/lose rhythm (the psychology)

The micro-**win** is every capture (confetti + a rising-pitch tone + points); the chase is the **next level bar** and **beating your best**; the surprise wins are gold stars, `PERFECT`, and power-up orbs (variable-ratio reward = the addictive bit). The loss is always self-inflicted (cross your own empty loop), so the game never *takes* a win from you — instead a **director** shapes how risky the arena feels, manufacturing a *win → tension → relief → win* flow:

1. **Onboarding (lvl 1–2):** no bombs, slow, plentiful drones — you win constantly and feel good.
2. **Tension wave:** a sine over ~24 s (`TENSION_PERIOD`) pushes spawn rate, speed, and bomb chance **up then down** — pressure builds (you might slip and die), then eases so you rack up easy combos and feel back on top.
3. **Relief after a revive** (`RELIEF_TIME`): a guaranteed calm window so you immediately get a win back.
4. **Rubber-band (DDA):** the last 5 run scores feed `DDA_REF`; players whose recent runs are short get the difficulty quietly eased (`DDA_MAX_EASE`) so they win more, while strong players get pushed. Everyone stays in flow.

Tuning these four constants is how you move the "when do they win / when do they sweat" dial without ever making a death feel unfair.

## Brand

Name **Drift Lasso** (searchable on "drift", portal-friendly). The look is a locked palette — **Ink** `#241A4D` outline, **Cyan** `#00E5FF` + **Magenta** `#FF49C3` (the lasso), **Amber** `#FFB020` (coins/targets), candy **Sky** gradient — used consistently across game, HUD, menus, logo, and favicon. The logo (a lasso loop around a drone) appears on the game-over card and as the browser tab icon; it never blocks first play.

---

## Architecture (module map)

All modules live in the one `<script>` in `index.html`, separated by banner comments so you can
jump straight to the system you want to tune. Search for `[NAME]`:

| Banner | Responsibility |
|---|---|
| `[CONFIG]` | Every tunable number + the colour palette |
| `[UTIL]` | Math + geometry: segment-intersection, point-in-polygon, shoelace area |
| `[STORAGE]` | Persistence abstraction (localStorage now → cloud-save later) |
| `[AUDIO]` | Procedural WebAudio synth (autoplay-safe, mute toggle, rising-pitch ladder) |
| `[ADSDK]` | Ad interface stub: `showRewarded` / `showInterstitial` + fallbacks |
| `[INPUT]` | Pointer/touch/mouse/keyboard → one `isHolding()` boolean |
| `[POOL]` | Generic zero-allocation object pool |
| `[SPRITES]` | Pre-rendered glow sprites (cheap bloom on mobile) |
| `[PARTICLES]` / `[POPUPS]` | Pooled particle bursts + score popups |
| `[FX]` | Screen shake, hit-stop slow-mo, flashes, chromatic aberration, near-miss |
| `[COSMETICS]` | Trail + car skins, coins, unlocks |
| `[ENTITIES]` | Trail (ring buffer + self-cross), Drones |
| `[GAME]` | State machine, spawn director, scoring, combo, collision/capture |
| `[RENDER]` | The draw pass |
| `[UI]` | DOM overlays: game-over (logo + objectives), garage/shop |
| `[OBJECTIVES]` | Rotating goals = the game's "purpose"; persisted, paid in coins |
| `[LOOP]` | Fixed-timestep update + rAF render + lifecycle (pause/resize/DPR) |

The update loop is **fixed-timestep (1/60)** and decoupled from render, with delta-time clamping so
it's frame-rate-independent on weak phones. **Object pooling is used everywhere** (trail points,
drones, particles, popups) — there are no per-frame allocations in the hot loop.

---

## Where to drop in the real portal SDK

Everything portal-specific is isolated behind two seams — swap them and nothing else changes.

### 1. Ads — `AdSDK` (`[ADSDK]` banner)

Replace the `provider` object with the real SDK adapter. The contract:

```js
// onSuccess fires ONLY on genuine completion; onFail on skip / early-close / no-fill.
AdSDK.showRewarded(onSuccess, onFail);
AdSDK.showInterstitial(onDone);   // self-caps frequency; called only at game-over
```

Example for **CrazyGames**:

```js
AdSDK.setProvider({
  available: true,
  rewarded(onComplete, onError){
    window.CrazyGames.SDK.ad.requestAd('rewarded', {
      adFinished: onComplete,           // -> grants the reward
      adError:    () => onError('error'),
      adStarted:  () => {},
    });
  },
  interstitial(onDone){
    window.CrazyGames.SDK.ad.requestAd('midgame', { adFinished: onDone, adError: onDone });
  },
});
```

(**Poki:** `PokiSDK.rewardedBreak().then(ok => ok ? onComplete() : onError())` and
`PokiSDK.commercialBreak().then(onDone)`. **GameDistribution:** `gdsdk.showAd('rewarded'|'interstitial')`.)

Already wired correctly for QA: reward is granted **only** on completion, **always** on completion,
**never** on skip; the rewarded **double-coins** path grants a graceful **partial** reward if the ad
fails to load (`CONFIG.DOUBLE_COINS_PARTIAL`); interstitials fire only at the game-over break and are
frequency-capped (`CONFIG.INTERSTITIAL_EVERY_RUNS`). Natural rewarded moments: **revive**, **double
coins**, **unlock a skin early**.

### 2. Saves & leaderboard — `Storage` (`[STORAGE]` banner)

All game state goes through `Storage.data` + `Storage.save()`. Point `_read()` / `_write()` at the
portal's cloud-save and you get cross-device saves for free:

```js
// inside Storage:  swap these two for the portal's KV / cloud-save calls
function _read(){  return /* portal.getData() */ JSON.parse(localStorage.getItem(KEY)); }
function _write(o){ /* portal.setData(o) */ localStorage.setItem(KEY, JSON.stringify(o)); }
```

The high-score list is local now but already abstracted — a portal leaderboard slots into
`gameOver()` (submit `score`) and the game-over panel (display).

---

## Tuning — the numbers you'll actually touch

All live in the **`CONFIG`** object at the very top of the script, named for data-driven iteration
(patch the exact moment players quit without hunting through code). The high-leverage ones:

| Constant | What it does | Default |
|---|---|---|
| `CAR_SPEED` | Constant forward speed (px/s) | `250` |
| `TURN_RATE` / `STEER_LERP` | How sharply you turn (lasso radius = `CAR_SPEED/TURN_RATE` ≈ 93px) / steering responsiveness | `2.7` / `16` |
| `RUNNER_CHANCE` / `BONUS_CHANCE` / `BOMB_CHANCE` | Spawn mix: fleeing runners / rare gold stars / bombs-to-avoid | `0.30` / `0.07` / `0.16` |
| `RUNNER_FLEE`, `BOMB_AFTER_SCORE`, `RUNNER_VALUE`, `BONUS_VALUE` | Flee distance, when bombs unlock, score multipliers | `130`, `400`, `1.6`, `3.0` |
| `TRAIL_LIFESPAN` | Base seconds a trail point lives = the self-collision **hazard window** | `2.6` |
| `TAIL_GROW` / `TAIL_MAX_EXTRA` | Extra tail seconds per capture / cap (the **growing tail**) | `0.05` / `1.7` |
| `LEVEL_STEP` | Score per level-up (the progression ladder + bg colour change) | `500` |
| `TENSION_PERIOD` / `RELIEF_TIME` | Seconds per win→tension→relief wave / calm window after a revive | `24` / `6` |
| `DDA_REF` / `DDA_MAX_EASE` | Recent-avg score that = "skilled" / max difficulty easing for strugglers | `1400` / `0.35` |
| `POWERUP_MIN` / `POWERUP_MAX` / `POWERUP_DUR` | Seconds between power-up orbs / how long one lasts | `16` / `26` / `7` |
| `MAGNET_EQUIP` / `MAGNET_POWER` / `SLOMO_SCALE` | Pull strength (equipped vs orb) / slo-mo factor | `70` / `240` / `0.45` |
| `SELF_GRACE_SEGMENTS` | **Forgiving-hitbox grace** near the head (the single most important feel knob) | `6` |
| `NEAR_MISS_DIST` | Proximity that triggers the "almost died!" shimmer + tick | `24` |
| `MIN_DRONES` / `MAX_DRONES` | Drone count floor / ceiling | `3` / `15` |
| `DRONE_BASE_SPEED` / `DRONE_MAX_SPEED` | Drone speed at difficulty 0 → 1 | `12` / `58` |
| `RAMP_GENTLE_TIME` | Seconds of deliberately gentle intro (no wall) | `20` |
| `RAMP_FULL_TIME` / `SCORE_FOR_MAX` | How long / how much score to approach max difficulty | `150` / `6000` |
| `BASE_CAPTURE`, `AREA_*`, `COMBO_MAX`, `COMBO_DECAY_TIME` | Scoring + combo shape | — |
| `HITSTOP_BIG`, `SHAKE_DECAY`, `CHROMA_COMBO` | Juice intensity | — |
| `WALL_DEATH` | Wall is lethal? Kept `false` → **one** death rule (self-cross only); soft containment instead | `false` |
| `INTERSTITIAL_EVERY_RUNS`, `REVIVE_INVULN`, `DOUBLE_COINS_PARTIAL` | Monetization pacing | `3`, `1.3`, `1.5` |

**Death rule (one sentence):** *you die only if your live trail crosses itself with no drone
enclosed* — a loop around ≥1 drone is a safe capture. The hitbox is forgiving (`SELF_GRACE_SEGMENTS`)
and the thick glowing line reads as danger well before the centre-lines actually cross, so deaths
feel self-inflicted, never cheap.

---

## QA checklist — status

- **Functional:** boots with no white-screen; fixed pools + ring-buffer trail = no leak over long
  play (validated: 5000-frame random-input stress run, state stays bounded & finite); **restart
  fully resets everything** (`fullReset()`); audio is suspended until first tap and the mute toggle
  persists; correct pause/resume on `visibilitychange` (dt is reset, no spike); saves are
  try/caught (private-mode safe) and never corrupt.
- **Mobile:** `pointer`/touch + `touch-action:none` + `overscroll-behavior:none` + `preventDefault`
  so page scroll/zoom/pull-to-refresh never fight the gesture; portrait-first; HUD respects the
  notch via `env(safe-area-inset-top)`; buttons are ≥52px and kept in the corners away from the
  thumb zone; DPR-aware crisp rendering (capped at 2 for perf).
- **Performance:** pre-rendered glow sprites + additive multi-pass trail (no `shadowBlur` in the
  loop); particles pooled & capped (`MAX_PARTICLES`); zero per-frame allocations.
- **Monetization:** rewarded grants only-on-completion / always-on-completion / never-on-skip;
  partial fallback on ad-fail; interstitials only at the game-over break, frequency-capped.
- **Polish:** every action has audio + visual feedback; gentle first 20 s (no difficulty wall);
  UI text is minimal and spell-checked; no external links or non-portal ads.

---

## Discoverability

Title/meta is `Drift Lasso` (genre-clear, searchable on "drift"); tagged to drift / `.io` / arcade /
hypercasual via the meta description + OG card. The **money shot** — a thick inked cyan→pink lasso
ribbon snapping shut around a cluster of glossy coral/gold balls, confetti bursting, with a big
chunky combo number — is engineered to happen constantly in real play (it *is* the core action), so
capture/preview footage sells the game. See `preview.svg` for an illustrative still of that framing.

---

## Dev tooling (`_dev/`, not shipped)

Pure-Node, zero-dependency. Run them with `node`:

```bash
node _dev/sim.test.js        # geometry unit tests + the opening-guarantee proof (16 assertions)
node _dev/smoke.js           # mocks DOM/Canvas/WebAudio, boots the real game, drives input,
                             # clicks every UI/ad button, and stress-runs 5000 frames — no-crash proof
node _dev/opening.explore.js # parameter search used to tune the bulletproof opening
```

These mirror the in-game algorithms so behaviour can be proven headlessly (the browser handles the
visuals). They are safe to delete before deploying.
