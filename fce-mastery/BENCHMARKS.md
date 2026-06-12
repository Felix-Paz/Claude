# Engine benchmarks — V1 vs V3 vs V4

**Method.** 10 synthetic students (seeded RNG, reproducible), each answering 120 questions
(12 sessions × 10). Every student gets 3 planted weaknesses among the 10 highest-weight
skills (true accuracy 22–35% there, 55–85% elsewhere), plus a learning model: targeted
practice raises a weak skill faster than incidental practice. Each engine version runs in
an isolated VM with seeded selection randomness. Run it yourself:

```bash
node fce-mastery/test/bench/bench.js
```

| Metric | V1 | V3 | **V4** | What it measures |
|---|---|---|---|---|
| Weakness in coach top-3 after (questions) ↓ | **1.3** | 2.0 | 2.6 | how fast a planted weakness is *identified* |
| Weak-skill targeting share ↑ | 30.8% | 33.1% | **36.0%** | % of later questions that attack planted weaknesses |
| Skill coverage by Q60 ↑ | **98.0%** | 92.0% | 90.8% | breadth — does it still tour everything? |
| Part imbalance, first 40 Q ↓ | 21.6 | **5.6** | 6.3 | fairness across the 4 exam parts before evidence exists |
| Missed concept re-served within (questions) ↓ | 4.6 | 4.9 | **4.9** | how quickly an error's *concept* returns in a new exercise |
| Final true skill on weaknesses ↑ | 59.7% | 61.0% | **61.8%** | actual learning produced by the selection policy |
| Prediction error \|pred − true\| ↓ | 16.1 pts | 9.4 pts | **4.9 pts** | honesty of the score forecast |

## Reading the table

- **V1's "wins" are artifacts.** Its 1.3-question discovery comes from a panic reflex: one
  miss on a never-seen skill slammed estimated mastery to ~0 (EWMA with α=1), so anything
  you missed first jumped the rankings — including flukes. Its 98% coverage is the flip
  side of having almost no targeting policy: it wandered. And it fed students 21.6-spread
  part imbalance (e.g. 16 transformations, 0 word formation in 40 questions) while
  mispredicting their exam result by ~16 scale-equivalent accuracy points.
- **V3** fixed fairness (5.6 imbalance) and halved prediction error, at a small cost in
  coverage and discovery snappiness.
- **V4** keeps V3's fairness, then adds three structural upgrades:
  1. **Bayesian mastery (Beta posteriors) + Thompson sampling.** Each skill is a probability
     distribution, not a number. Selection samples from the posterior — uncertain skills get
     explored *in proportion to their uncertainty*, confirmed weaknesses get exploited. One
     unlucky miss no longer rewrites your profile (that's why discovery is ~1 question
     "slower" than V1: it demands evidence, not noise).
  2. **Bank-calibrated forecasting.** Expected accuracy integrates Elo ability over the real
     difficulty distribution of the item bank per part, instead of a single difficulty point.
     Prediction error drops to 4.9 pts — 3.3× more accurate than V1, ~2× better than V3.
  3. **Deficit-tilted quotas + early exploration boost.** All four parts stay near-equal until
     ~40 answers (imbalance 6.3), then quotas tilt one question toward measurably weaker parts;
     the first 60 answers carry a raised exploration rate to map the student faster.
- **Net effect on learning:** highest weak-skill gain (61.8%) with the most accurate
  self-knowledge (4.9 pts) — the engine drills the right things *and* knows what it knows.

## Honest limitations

- Synthetic students are simpler than humans (no fatigue, no tilt, no day gaps — forgetting
  curves are exercised in unit tests but not in this 1-sitting protocol).
- "Targeting share" should not approach 100% by design: interleaving, retrieval of strengths
  and coverage guarantees are *features* (desirable difficulty), so ~35–45% attack share with
  ~90% coverage is the intended operating point.
- Discovery is measured against the coach's *displayed* top-3; selection reacts to errors even
  earlier through concept boosts (see reserve lag).
