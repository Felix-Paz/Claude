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

Then open <http://localhost:8080>.

**Controls**
| | |
|---|---|
| **Desktop** | `WASD` / Arrow keys to roll · hold **Shift** to boost |
| **Mobile** | **Tilt** your device to steer (with calibration) · or the **touch-drag** fallback · hold the **BOOST** button |

---

## 🎯 Designed for retention

Every system here exists to create *"I was so close — one more try."*

- **Instant understanding** — level 1 teaches the whole game in seconds, no text walls.
- **Brutally fast restart** — death → retry in one tap; levels are regenerated from a
  seed so a retry is the *same* maze (mastery + time-attack).
- **Constant novelty** — a mechanic-unlock schedule introduces something new on a steady
  cadence (decoys → boost pads → power-ups → moving hazards → turrets → size zones →
  rotating arms → currents), and the **world changes every 6 levels** with its own
  palette, music key, and signature twist.
- **Risk / reward** — braided mazes create optional loops & shortcuts; the juiciest coin
  routes run right past the danger. The guaranteed safe path is always solvable without
  touching a wrong hole.
- **Meta-progression** — coins, 16 marble **skins** across Common→Legendary rarity,
  **trails**, a shop, **star** ratings, time medals, **daily rewards + login streaks**.
- **Respectful ads** — only at natural breaks or as *optional rewards* (revive,
  double coins, …). Never mid-roll.

---

## 🧩 Architecture

No bundler — each file is a native ES module loaded via an import map.

| File | Responsibility |
|------|----------------|
| `index.html` | Markup, import map, all UI screens |
| `styles.css` | Premium hypercasual UI (glassy HUD, candy buttons, responsive) |
| `src/config.js` | **All tunables**: worlds, skins, trails, power-ups, economy, and the mechanic-pacing schedule |
| `src/levels.js` | Seeded procedural maze generation + smart content placement |
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

## ✅ Validated

The procedural generator is checked across 160 levels (every maze solvable, wrong holes
never block the only safe route, entities only on open tiles, deterministic per seed),
and the engine's physics / collision / pickup / win-lose-revive / power-up systems are
covered by a headless integration test.
