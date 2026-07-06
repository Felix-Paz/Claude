# Marble Maze

A 3D marble game for the browser. Roll a glossy marble through procedurally
generated mazes across themed worlds — avoid the red hazards, collect coins and
power-ups, and reach the green finish hole.

Built with plain HTML + ES modules + Three.js (vendored locally). No build
step and no external requests — serve the folder and play.

## Run it locally

ES modules must be served over HTTP (not `file://`):

```bash
cd marble-maze
python3 -m http.server 8080
#   …or:  npx serve .
```

Then open <http://localhost:8080>. The game starts immediately; the menu
(shop, daily reward, settings) is available from the Pause button.

## Controls

| | |
|---|---|
| **Desktop** | `WASD` / Arrow keys to roll · hold **Shift** to boost · `R` restart · `Enter` / `Space` confirm · `Esc` / `P` pause |
| **Mobile** | **Tilt** to steer (with calibration) or **touch-drag** · hold **BOOST** |

## Features

- Procedurally generated mazes across 10 themed worlds
- Red means danger: wrong holes, spike traps, toxic blobs, turrets, spinning blades, sliding walls
- Power-ups: coin magnet, 2× coins, speed surge, slow-mo, shield, big finish, mini marble, hole patch, ghost, time freeze
- GOLD RUSH bonus mode
- Coins, unlockable marble skins (some with perks), trails, a chest mini-game, daily rewards and streaks
- Star ratings, time medals and per-level missions
- Difficulty setting from Chill to Expert
- Optional rewarded-ad hooks (revive, double coins, skip level) for Poki / CrazyGames

## Project structure

| File | Role |
|------|------|
| `index.html` / `styles.css` | Markup and UI styling |
| `src/config.js` | Game data: worlds, skins, trails, power-ups, economy |
| `src/levels.js` | Maze and level generation |
| `src/director.js` | Difficulty tuning and level selection |
| `src/game.js` | 3D engine: physics, entities, effects, camera |
| `src/input.js` | Keyboard, tilt and touch controls |
| `src/ui.js` | HUD, menus, shop and overlays |
| `src/storage.js` | Save data (localStorage) |
| `src/audio.js` | Procedural sound and music (WebAudio) |
| `src/sdk.js` | Poki / CrazyGames SDK wrapper |
| `src/main.js` | Bootstrap and game flow |
| `src/marbletex.js` | Procedural marble skin textures |
| `vendor/three.module.min.js` | Three.js r160 |

## Shipping to a portal

Enable one of the commented SDK `<script>` tags in `index.html` — `src/sdk.js`
auto-detects whichever is present. Zip the `marble-maze/` folder and upload;
the build is fully self-contained.
