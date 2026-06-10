# FCE Mastery — B2 First Use of English Trainer

A premium, fully offline learning platform for the Cambridge **B2 First (FCE) Use of English** paper, built for high-impact last-minute preparation. One HTML file. No server, no account, **no AI API** — all the "intelligence" is real, local algorithms.

## Use it

Open `dist/FCE-Mastery.html` in any modern browser (double-click works). Progress is saved in the browser's localStorage; use **Settings → Export** to back it up or move devices.

To rebuild the single file after editing the source:

```bash
node fce-mastery/build.js
```

For development, open `fce-mastery/index.html` (loads the unbundled css/js).

## What's inside (and how it works without AI)

| Feature | Implementation |
|---|---|
| Diagnostic engine & mastery map | Per-skill EWMA mastery + per-question stats, seeded by a 14-item diagnostic |
| Adaptive difficulty | Elo rating per task type; questions picked inside a 25–92% success window (the learning zone) |
| Infinite-feeling personalized practice | 250+ hand-written Cambridge-style items tagged across 24 skills, selected by weakness × exam value, interleaved, never the same session twice |
| Spaced repetition | Compressed SM-2-style scheduler tuned for exam-week cramming; lapses shorten intervals |
| Forgetting detection | Mastery decays toward uncertainty with days unseen; "forgetting risk" list on the radar |
| Confidence calibration | Confidence declared before each answer; lucky guesses get half credit + early re-test, certain-but-wrong weighted 1.5× |
| Mistake DNA | Every error tagged with a root cause (knowledge gap, mix-up, slip, trap, time, spelling) and aggregated into patterns |
| Score predictor | Marks-weighted expected accuracy → Cambridge scale (122–190) with confidence interval; grade probabilities from a normal model; mocks blend in at 45% |
| Smart coach | marks-at-risk = skill's exam weight × (risk − baseline); top items become the study plan |
| Open Cloze heatmap | Error rate × real-exam frequency per gap type (articles, prepositions, auxiliaries…) with trend arrows |
| Personal Grammar Book | Auto-built chapters from the student's own errors, with hand-written rule cards and their actual wrong answers; printable |
| Memory layer | 40+ hand-crafted mnemonics for classic FCE offenders + a deterministic hook generator for everything else |
| Cambridge Pattern Intelligence | Database of 25 high-frequency exam patterns with frequency stars and "where students lose the mark" notes, surfaced in feedback |
| Mock test | Full 36-mark paper (real passages), 35-minute timer, official-style 0/1/2 KWT marking, error autopsy |
| 7-Day Emergency Mode | Auto-activates ≤7 days before the exam date; compressed day-by-day plan, selection narrowed to top-value weaknesses |
| Gamification | XP, levels, streaks, weekly challenges, 14 badges — all tied to learning behaviours |

## Source layout

```
fce-mastery/
  index.html        dev shell
  css/styles.css    design system (dark, premium)
  js/data-core.js   skill taxonomy, rule cards, pattern DB, mnemonics
  js/data-bank1.js  Key Word Transformations + Open Cloze bank
  js/data-bank2.js  Word Formation + Multiple-Choice Cloze + mock passages
  js/engine.js      adaptive engine (Elo, SRS, predictor, coach, analytics)
  js/charts.js      dependency-free SVG charts
  js/views.js       dashboard, stats, book, memory lab, coach, settings
  js/practice.js    session + mock controllers
  js/app.js         bootstrap & nav
  build.js          single-file bundler
dist/FCE-Mastery.html   ← the deliverable
```
