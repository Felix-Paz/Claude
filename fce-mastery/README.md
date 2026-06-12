# Mastery — FCE Edition

A premium, fully offline adaptive trainer for the Cambridge **B2 First (FCE) Use of English** paper. One HTML file (`dist/Mastery-FCE.html`). No server, no account, **no AI API** — every "intelligent" behaviour is a real, local algorithm.

## Use it

Open `dist/Mastery-FCE.html` in any browser (double-click works). Progress lives in localStorage; **Settings → Export** moves it between devices. On phones it auto-switches to a simplified, exercise-only **lite mode** (configurable in Settings).

Rebuild after editing source:

```bash
node fce-mastery/build.js          # → dist/Mastery-FCE.html
node fce-mastery/test/smoke.js     # 60+ engine & content assertions
node fce-mastery/test/ui.js        # Playwright walk-through (needs chromium)
```

## The engine (all on-device)

| Capability | How it works |
|---|---|
| Adaptive difficulty | Elo rating per exam part; questions chosen for 25–92% success (the learning zone), all four parts balanced until evidence says otherwise |
| Spaced repetition & forgetting | Compressed SM-2 scheduling; skill mastery decays toward uncertainty when unused; fast fluent answers stretch intervals |
| Behavioural telemetry | Hesitation before typing, erase/rewrite cycles, first-instinct capture, option switching, pauses, skips — used to **infer confidence** when the (optional) self-rating is skipped, to catch lucky guesses, hidden doubt, and "you changed a right answer" |
| Answer diagnosis | Wrong answers are classified: spelling slip (Levenshtein), wrong word-family form, wrong word class (closed-class lists), missing KWT key word, half-credit chunks, blank |
| Error generalization | A miss boosts the *concept*: the engine feeds that skill back through **different** exercises until it sticks; wobbly items (right-wrong-right) get extra pressure |
| "I want to master this" | One tap floods future sessions with that concept; two clean wins clear it from the Mastery List |
| Answer disputes | "My answer was actually right" repairs the stats, whitelists the answer for that item, and stores a report in the backup |
| Spelling intelligence | Slips are fingerprinted (double letters, ie/ei, -tion/-sion, weak vowels…) and feed the **Spelling Gym** — missing-letters skeletons + flash-and-write rounds with definition clues, seeded with the user's own victims + 43 danger words (a wrong spelling is never displayed) |
| Grade prediction | Ability + recent accuracy + mocks, corrected for practice-is-harder-than-exam bias → clear output: predicted **grade letter**, scale ± CI, **pass probability** |
| Coaching | marks-at-risk = exam weight × personal risk; Mastery List; stubborn items; auto 7-Day Emergency Mode |
| Content | **545 hand-written Cambridge-style items** + 21 full passages (6× Part 1, 8× Part 2, 7× Part 3 — passages appear in mocks; 336 paper combinations before counting the 6-of-130 random KWT set), pattern DB with real-paper frequency stars |
| Positional intelligence | Every Open Cloze answer is fingerprinted by WHERE the gap sits (sentence start/end, after a comma, neighbouring word classes); weak positions get served more |
| Focus search | Type anything — "had better", "provided that", inversions — and the engine floods future sessions with it |
| Essay Vocab Lab | 58 basic→band-boosting upgrades inside real essay frames, Leitner-spaced ladder: recognise → cued recall (letter skeleton) → full production |
| Telemetry, in the open | Every captured signal (keystrokes, hesitation, typing time, rewrites, abandoned right answers…) displayed in Progress → Habits |

## Brand — "Red Ink on Paper"

Modern liquid-glass paper: warm beige (`#F4EDDF`), deep ink (`#1B1C21`), vermilion red signal (`#E0492F`). Frosted glass cards over drifting warm light blobs + paper grain, sturdy Georgia/Charter display type (no hairline fonts), bold sans exercise text, a text lockup logo (Mastery · FCE tab · USE OF ENGLISH), red-dot rail navigation, live XP topbar, bento dashboard, XP floats, combo flames.

## Benchmarks

The adaptive engine is benchmarked against its own previous versions on synthetic students (weakness discovery, targeting share, coverage, part fairness, learning gain, prediction error). See [`BENCHMARKS.md`](BENCHMARKS.md) and run `node fce-mastery/test/bench/bench.js`.

## Source layout

```
fce-mastery/
  index.html         dev shell
  css/styles.css     design system
  js/data-core.js    skills, rules, patterns, spelling bank, word classes
  js/data-bank1.js   KWT + Open Cloze items
  js/data-bank2.js   Word Formation + MCC + exam passages
  js/data-bank3.js   expansion pack (+89 items, +5 passages)
  js/data-bank4.js   expansion pack (+100 items)
  js/data-bank5.js   expansion pack (+100 items, +3 passages)
  js/data-bank6.js   hard-tier pack (+100 items)
  js/data-mocks2.js  mock-paper pack (+8 passages)
  js/data-vocab.js   essay vocab upgrades (58)
  js/engine.js       the adaptive engine
  js/charts.js       dependency-free SVG charts
  js/views.js        all screens + Quill
  js/practice.js     sessions, spelling gym, mock
  js/app.js          nav & boot (full + lite)
  build.js           single-file bundler
dist/Mastery-FCE.html   ← the deliverable
```
