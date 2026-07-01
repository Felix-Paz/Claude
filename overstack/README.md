# OVERSTACK

A browser-based physics stacking game engineered for session length and return rate.
Drop irregular shapes onto a wobbling stack, fuse same-tier shapes into bigger ones,
and decide every drop: **BANK** (lock in coins, end the run safely) or **PUSH**
(drop again, risk everything since your last bank, chase a bigger multiplier).

**Play it:** open `index.html` in any browser. That's it — one self-contained file,
no build step, no install, no login, no network required (an optional Google Font
loads when online; everything else, including Matter.js, is inlined).

## Controls

| Input | Action |
|---|---|
| Drag / move + release (or click) | Aim and drop |
| `Space` | Bank |
| `←` `→` `↓` | Aim / drop (desktop) |
| `Enter` | Drop again / play |
| `Esc` | Menu |

## Architecture

Single file, but internally sectioned to mirror the design brief's `/src` layout:

| Section | Brief module | What it does |
|---|---|---|
| §1 | `/data` | Tier table, themes, `RETENTION_CONFIG`, `CHURN_CONFIG`, `AD_CONFIG` — every tunable in one place (Phase 6) |
| §2 | persistence | `localStorage` wrapper, swappable for a backend later |
| §3 | `trackEvent` | Analytics stub; ring-buffer log at `window.__overstackEvents` |
| §4 | `FeedbackBus` | Semantic events (`fusion`, `drop`, `bank`, `collapse`) — audio/fx/camera subscribe independently |
| §6 | `/audio` | WebAudio synth: pitch-ascending fusion arpeggio, variant pools, resolving bank chord, adaptive ambient pad |
| §8 | `/fx` | Pooled particles, screen shake (impulse + instability micro-shake), slow-mo controller |
| §9 | `RewardPacer` (4.1) | Multiplier climb with Poisson-scheduled micro-jumps — never perfectly predictable |
| §10 | `PlayerStateVector` + `EngagementEstimator` (4.2b) | EMA-smoothed per-player signals → `flowScore` vs. the player's *own* baseline |
| §11 | `SessionArcController` (4.13) | HOOK → GROOVE → SUSTAIN → LATE whole-session pacing |
| §12 | `ChurnRiskModel` (4.15) | Trend-based frustration vs. boredom classifier; honest levers only |
| §13 | `DifficultyDirector` (4.2) | Flow-banded shape-spawn weighting, invisible to the player |
| §14 | `NearMissDetector` (4.3b) | Weighted intensity from real run state; slow-mo/camera scale with it |
| §15–17 | Economy / Streaks / Board (4.5–4.8) | Permanent coins, visible-but-locked shop, calendar streaks, local leaderboard |
| §18 | `AdManager` (§7) | Mock adapter (game fully playable offline); revive / double / head-start rewarded placements; interstitial pacing tighter than platform caps |
| §19–20 | `/core` | Matter.js stack, fusion resolution, explicit state machine: `DECISION → AIMING → DROPPING → RESOLVING → DECISION → (BANK \| COLLAPSE)` |

## Guardrails baked in

- Collapse-to-next-drop is one tap and <100 ms (measured ~70 ms in headless tests).
- Ad offers are always opt-in, secondary to the free "Drop Again" path, one-tap dismissible.
- Interstitials: never in the first 3 runs, never straight off a collapse, only every 5th
  consecutive drop-again or on menu return, ≥105 s apart.
- `ChurnRiskModel` output is deliberately **never** wired into `AdManager` — ad pacing is
  governed only by its own session-boundary and cooldown rules. Flag any change to this
  in code review.
- Near-misses are detected from real run state (fusion proximity, stability 1 s prior,
  PB delta), never randomly inserted.
- Every run — banked or collapsed — nets some currency. No zero-progress outcomes.

## Shipping to a real platform (Poki etc.)

Replace `MockAdAdapter` (§18) with an adapter that maps the same interface onto the live
SDK (`init`, `gameLoadingStart/Finished`, `gameplayStart/Stop`, `commercialBreak`,
`rewardedBreak`). Game logic never touches the SDK directly. Confirm current method names
against the live Poki SDK docs at integration time.

## Tuning

All behavioral constants live in §1 (`RETENTION_CONFIG`, `CHURN_CONFIG`, `AD_CONFIG`,
`CONFIG`). Every `fusion` / `bank` / `collapse` / `near_miss` event carries the live
`flowScore`, flow band, and session-arc phase, and `churn_risk_evaluated` logs both
sub-scores plus which response fired — inspect `window.__overstackEvents` during a
playtest. A debug handle is exposed at `window.__overstack`.
