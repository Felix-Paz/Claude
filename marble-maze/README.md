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
| `fonts.css` | Self-hosted fonts (embedded, no external requests) |
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

`src/sdk.js` supports Poki, CrazyGames, GameDistribution and GamePix and
auto-detects whichever SDK script is present on the page.

Run:

```bash
node scripts/build-platforms.mjs
```

This bundles the whole game into a single `game.js` (via esbuild, fetched on
demand by `npx`) and writes an upload-ready zip per platform to `dist/`. Each
zip contains just four files at its root — `index.html`, `styles.css`,
`fonts.css`, `game.js` — and makes no network requests other than the
platform's own SDK:

- `marble-maze-poki.zip`
- `marble-maze-crazygames.zip`
- `marble-maze-gamedistribution.zip` — the GameDistribution game id is already
  baked into its `index.html`
- `marble-maze-gamemonetize.zip` — replace `PUT-YOUR-GAMEMONETIZE-GAME-ID-HERE`
  in its `index.html` with the game id from your GameMonetize control panel
- `marble-maze-gamepix.zip`

### Ad placement

Ad behaviour follows the detected platform, so one source tree satisfies each
portal's rules:

- **GameDistribution** opens on the menu and shows a **pre-roll** when the
  player presses PLAY, plus **mid-rolls** on the non-gameplay buttons — Next,
  Replay, Retry, Restart and Menu. The GD SDK regulates the actual ad
  interval, so those calls are made on every press. Audio is muted and the
  game is paused for the duration via the SDK's pause/start events.
- **Poki, CrazyGames, GameMonetize and GamePix** keep the instant-play boot
  (no pre-roll) and take an interstitial only every few completed levels.

Rewarded ads (revive, double coins, skip level) use each platform's rewarded
call where one exists. GameMonetize exposes only `sdk.showBanner()`, so its
rewarded moments play a regular interstitial and then grant the reward.

Platform-specific handling:

- **GameMonetize** pauses and mutes on `SDK_GAME_PAUSE` and resumes on
  `SDK_GAME_START`. Because `showBanner()` is fire-and-forget, the ad is
  treated as finished on `SDK_GAME_START`, with a short fallback so an
  unsold slot never leaves the player waiting.
- **GamePix** pauses and mutes around `interstitialAd()` and `rewardAd()`,
  pauses on tab switch, blocks page scrolling from the arrow keys, space and
  the wheel (scrollable panels keep their own scrolling), and saves through
  `GamePix.localStorage` with a plain-localStorage fallback.
