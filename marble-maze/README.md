# 🟠 Marble Maze

A fast, polished **3D marble-runner** built for web portals (Poki / CrazyGames) and
engineered around one goal: **keep the player rolling for one more try.**

Roll a glossy marble through a 3D maze, dodge danger, grab coins, and dive into the
finish hole — across 8 distinct worlds with a new mechanic, hazard, or twist arriving
every level.

> Pure HTML + ES modules + Three.js. No build step, no framework, no asset pipeline —
> open it on a static server and play.

---

## ▶️ Run it locally

ES modules must be served over HTTP (not `file://`). Any static server works:

```bash
cd marble-maze
python3 -m http.server 8080
#   …or:  npx serve .
```

Then open <http://localhost:8080>. You drop **straight into level 1** (a one-tap
corridor with a "hold to roll" hint) — the menu/shop/settings live behind the Pause
button so the crucial first 30–60 seconds are pure play.

**Controls**
| | |
|---|---|
| **Desktop** | `WASD` / Arrow keys to roll · hold **Shift** to boost |
| **Mobile** | **Tilt** your device to steer (with calibration) · or the **touch-drag** fallback · hold the **BOOST** button |

---

## 🎯 Designed for retention

Every system here exists to create *"I was so close — one more try."*

- **Instant understanding** — level 1 is a single corridor (marble → green hole); level 2
  teaches the one RED wrong hole. Complexity is introduced one idea at a time.
- **Readability rules** — **RED always means death** (wrong holes, spikes, toxic blobs,
  bullets, blades); the **finish is always a green beam** with particles + an off-screen
  arrow; sliding walls are a distinct amber; walls have bright top caps so edges read.
- **Adaptive director (v4)** — a 4-meter player model (skill / frustration / **boredom** /
  **excitement**) feeding a psychological **state machine** and a Bayesian-style churn
  belief (leave-probability **with confidence**, retry-speed, momentum, frustration
  velocity, projection). Frustration and boredom get **opposite** treatments (ease vs.
  challenge). **Maze size is a separate learned preference** from difficulty (huge-easy or
  small-hard), the **ceiling is high** enough to stretch aces, and a **difficulty dial**
  (Chill→Expert) lets players steer their own ELO. After repeated fails it quietly opens a
  shortcut so you win without feeling handed it.
- **Brutally fast restart** — death → retry in one tap; a retry is the *same* maze
  (mastery + time-attack), plus a "Skip (Ad)" escape valve after repeated fails.
- **Constant novelty** — mechanics unlock on a teaching cadence (decoys → power-ups →
  launch pads → sliding walls → bouncers → toxic blobs → spikes → **portals** → turrets →
  size gates → blades), and the **world changes every 3 levels** across 10 biomes.
- **GOLD RUSH** — collect coins fast and the whole maze floods with gold (god mode).
- **Risk / reward** — braided mazes create optional shortcuts; the best coin routes hug
  the danger. A guaranteed safe path never forces you through a wrong hole.
- **Meta-progression** — coins, 16 witty **skins** (beach ball, 8-ball, soccer, disco,
  planet…) across Common→Legendary, **trails**, a redesigned shop, **star** ratings,
  time medals, **daily rewards + login streaks**.
- **Respectful ads** — only at natural breaks or as *optional rewards* (revive,
  double coins, skip). Never mid-roll, and suppressed when churn-risk is high.

---

## 🧩 Architecture

No bundler — each file is a native ES module loaded via an import map.

| File | Responsibility |
|------|----------------|
| `index.html` | Markup, import map, all UI screens |
| `styles.css` | Premium hypercasual UI (glassy HUD, candy buttons, responsive) |
| `src/config.js` | **All tunables**: biome worlds, skins, trails, power-ups, economy, pacing, director constants |
| `src/levels.js` | Seeded procedural maze gen driven by a director *plan* (difficulty + interventions) |
| `src/director.js` | **Adaptive engine**: ELO skill, churn-risk model, interventions, win/loss shaping |
| `src/game.js` | The 3D engine: scene, marble physics, every hazard/entity, power-ups, particles, trail, camera |
| `src/input.js` | Unified controls — keyboard, device tilt (+ calibration), touch-drag fallback |
| `src/ui.js` | HUD, menus, shop, daily, win/lose overlays |
| `src/storage.js` | localStorage save (coins, unlocks, bests, daily/streak, settings) |
| `src/audio.js` | 100% procedural WebAudio SFX + generative music bed (no audio files) |
| `src/sdk.js` | Poki / CrazyGames ad abstraction with safe standalone fallbacks |
| `src/main.js` | Bootstrap + the game state machine that wires it all together |
| `vendor/three.module.js` | Three.js r160, vendored locally (no external CDN) |

### Tuning the game
Almost everything a designer wants to change lives in **`src/config.js`** — physics
feel, world palettes, the level/mechanic schedule, skin prices and materials, power-up
durations, and the coin/reward economy.

---

## 📦 Shipping to a portal

The game runs standalone out of the box (rewarded actions simply grant their reward in
dev). To enable real ads, add **one** SDK `<script>` in `index.html` `<head>` — the
abstraction in `src/sdk.js` auto-detects it:

```html
<!-- Poki -->
<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>
<!-- …or CrazyGames -->
<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>
```

Then zip the `marble-maze/` folder and upload. The build is fully self-contained
(Three.js is vendored — no external network calls required to play).

---

## ✅ Validated (headless — no browser in CI)

- **Generator**: stage 1 = clean corridor, stage 2 = exactly one red hole, every maze
  solvable, wrong holes never block the safe route, hazard-type stacking capped on easy
  levels, deterministic per seed, rescue/forgive mods never break solvability.
- **Engine**: physics, collision, pickups, all entities (sliding walls, portals,
  launch pads, redesigned spikes/blobs), every power-up (incl. phase-walls & hole-patch),
  GOLD RUSH, win/lose/revive, idle signal, and perf auto-scaling — no crashes/NaN/escape.
- **Director**: ELO converges to a ~60–80% win band, churn escalates green→panic with
  forgiving interventions, retry-rescue stays subtle before opening a shortcut.

⚠️ Live visuals still need an eyeball in a real browser (WebGL can't render headlessly here).
