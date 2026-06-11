# Mastery — FCE Edition

A premium, fully offline adaptive trainer for the Cambridge **B2 First (FCE) Use of English** paper. One HTML file (`dist/Mastery-FCE.html`). No server, no account, **no AI API** — every "intelligent" behaviour is a real, local algorithm.

## Use it

Open `dist/Mastery-FCE.html` in any browser (double-click works). Progress lives in localStorage; **Settings → Export** moves it between devices. On phones it auto-switches to a simplified, exercise-only **lite mode** (configurable in Settings).

Rebuild after editing source:

```bash
node fce-mastery/build.js          # → dist/Mastery-FCE.html
node fce-mastery/test/smoke.js     # 47 engine assertions
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
| Spelling intelligence | Slips are fingerprinted (double letters, ie/ei, -tion/-sion, weak vowels…) and feed a separate **Spelling Gym** game seeded with the user's own victims + 43 Cambridge danger words |
| Grade prediction | Ability + recent accuracy + mocks, corrected for practice-is-harder-than-exam bias → clear output: predicted **grade letter**, scale ± CI, **pass probability** |
| Coaching | marks-at-risk = exam weight × personal risk; Mastery List; stubborn items; auto 7-Day Emergency Mode |
| Content | 345 hand-written Cambridge-style items + 9 full passages (2× Part 1, 6× Part 2, 2× Part 3 — passages appear in mocks), pattern DB with real-paper frequency stars |

## Brand

"Mastery", FCE edition. Ivory paper + glass cards, ink serif display type, Cambridge-sage/teal/brass palette, and **Quill** — the owl mascot (pure SVG). Sessions are deliberately finite (start → win → break) with streaks, XP, levels, weekly challenges, confetti where deserved — gamified but professional.

## Source layout

```
fce-mastery/
  index.html         dev shell
  css/styles.css     design system
  js/data-core.js    skills, rules, patterns, spelling bank, word classes
  js/data-bank1.js   KWT + Open Cloze items
  js/data-bank2.js   Word Formation + MCC + exam passages
  js/data-bank3.js   expansion pack (+89 items)
  js/engine.js       the adaptive engine
  js/charts.js       dependency-free SVG charts
  js/views.js        all screens + Quill
  js/practice.js     sessions, spelling gym, mock
  js/app.js          nav & boot (full + lite)
  build.js           single-file bundler
dist/Mastery-FCE.html   ← the deliverable
```
