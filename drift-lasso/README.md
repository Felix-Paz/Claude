# Drift Lasso

A portal-ready, single-mechanic **hypercasual** web game — *neon synthwave night drift* meets
`.io`-style area capture. You permanently drift in a circle leaving a glowing trail; **hold to
tighten, release to widen**, and lasso floating drones by closing a loop around them. Cross your
own live trail with nothing enclosed and you die. Greed kills.

> One mechanic. Hold and release. Depth comes from escalation, not features.

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

**Controls:** press & hold anywhere = tighten the drift; release = widen. Touch, mouse, or keyboard
(`Space` / `↓` / `Enter`) all map to the same single "hold" input.

---

## The first 10 seconds (guaranteed)

There is no menu, logo, or tutorial. On load the car is already drifting and **one drone hovers at
the centre of its circle**. Until the player's first capture, that drone gently tracks the centre of
the *current* drift circle, so the very first action — whether they idle, hold immediately, hold
late, tap, or mash — **always** closes a capturing loop and never a cheap death. This is verified by
simulation across every screen size and input timing (see `_dev/sim.test.js`): first capture lands
in **1.6–3.3 s**, every time.

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
| `[UI]` | DOM overlays: game-over, garage/shop, daily reward |
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
| `CAR_SPEED` | Constant forward speed (px/s) | `252` |
| `MIN_RADIUS` / `MAX_RADIUS` | Tightest (held) / widest (released) drift radius | `44` / `165` |
| `RADIUS_LERP` | How snappily the radius responds to input | `8.5` |
| `TRAIL_LIFESPAN` | Seconds a trail point lives = the self-collision **hazard window** | `2.6` |
| `SELF_GRACE_SEGMENTS` | **Forgiving-hitbox grace** near the head (the single most important feel knob) | `6` |
| `NEAR_MISS_DIST` | Proximity that triggers the "almost died!" shimmer + tick | `24` |
| `MIN_DRONES` / `MAX_DRONES` | Drone count floor / ceiling | `3` / `15` |
| `DRONE_BASE_SPEED` / `DRONE_MAX_SPEED` | Drone speed at difficulty 0 → 1 | `12` / `58` |
| `RAMP_GENTLE_TIME` | Seconds of deliberately gentle intro (no wall) | `20` |
| `RAMP_FULL_TIME` / `SCORE_FOR_MAX` | How long / how much score to approach max difficulty | `150` / `6000` |
| `BASE_CAPTURE`, `AREA_*`, `COMBO_MAX`, `COMBO_DECAY_TIME` | Scoring + combo shape | — |
| `INTRO_RADIUS`, `FIRST_DRONE_FRAC`, `INTRO_DRONE_TRACK` | The guaranteed-first-capture opening | `74`, `0.75`, `8` |
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
hypercasual via the meta description + OG card. The **money shot** — a glowing cyan→magenta loop
mid-snap around a cluster of amber drones on black with a big magenta combo number — is engineered to
happen constantly in real play (it *is* the core action), so capture/preview footage sells the game.

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
