# MOTH — *a nocturne in six hours*

You are the moth. There is a flame. The closer you fly, the more the night
pays you — and the game's entire retention architecture is that sentence,
made mechanical. No metaphor in MOTH is decorative: the compulsion loop the
game runs on *is* the story it tells.

**Play it:** open `index.html` (or serve the folder — any static server).
Mouse/touch to fly, click or <kbd>Space</kbd> to dash, <kbd>Esc</kbd> to pause.
No build step, no dependencies, no assets: every visual is procedural canvas,
every sound is a synthesised WebAudio voice, everything persists in
`localStorage` and nothing leaves the browser.

---

## The game in one flight

Six hours from midnight to dawn, each ~22 seconds long. You orbit a candle
inside its **graze band** — flying deep builds a heat multiplier (×1→×5),
flying too deep burns you. Light-motes drift inward from the dark to be eaten
by the flame; intercept them first and they become **lumen**, multiplied by
your heat. At each hour's chime the world slows and you choose: **fly home**
(bank the whole pot) or **stay** (the night gets richer *and* meaner). Die and
you keep two-fifths. Survive all six hours and the dawn doubles everything.

Flares telegraph and lash from the flame. Cinders cross the field and *singe*
— scattering a fifth of your pot back into the world as re-catchable motes.
After every flight you turn **fate cards**. Above it all: levels (Instar I →
Imago), eight ink palettes pinned in a specimen drawer, daily field tasks,
streaks, and a forecast for tomorrow night.

---

## LAMPLIGHT — the retention engine

`js/engine.js` is a standalone player-modeling engine with one-way data flow:

```
game events ──▶ TELEMETRY (append-only stream + counters)
                   │
                   ▼
               MODEL  — skill · risk appetite · tilt · boredom · motivation
                   │
     ┌─────────────┼──────────────┬──────────────┐
     ▼             ▼              ▼              ▼
  DIRECTOR      REWARDS        HOOKS          QUESTS
```

**TELEMETRY** — every meaningful act emits an event (`graze:tick`,
`gate`, `cards:pick`, `drawer:dwell`, `singe`, …). One dispatch point routes
the stream to every consumer.

**MODEL** — the portrait of you, updated per event and persisted:

- **skill** — EWMA over a per-flight performance composite (hours survived,
  graze quality, exit type)
- **risk appetite** — EWMA over gate decisions *and* how deep in the band you
  habitually sit (`graze:depth` samples)
- **tilt** — spikes on early deaths and death streaks, cools on retry
- **boredom** — rises when a high-skill player survives hours while barely
  touching the band
- **motivation vector** — a normalised 4-axis profile (*mastery / fortune /
  order / beauty*) nudged by behaviour: fast retries push mastery, gate-greed
  pushes fortune, quest claims push order, drawer dwell-time pushes beauty

**DIRECTOR** — flow-band difficulty, recomputed *every frame*:
`intensity = base(hour) × skillAdj × mercy × arc + boredomSpike`. Frustrated
players get a mercy ramp; bored experts get a spike and extra wisps; nobody
plays the same night. It also publishes personalised survival odds — the
number the gate shows you is the model reading you aloud.

**REWARDS** — a variable-ratio card economy with guardrails: pity counters
cap droughts (≥5 picks without a rare forces one *genuine* rare into the next
spread; ≥8 floors the whole spread), the first draw of a session never
insults you, and near-misses are honest — the two cards you didn't pick flip
over and show what they really were.

**HOOKS** — the session arc. It detects fatigue (three declining flights +
growing gaps between them, or a 20-minute session), schedules one last
spectacle (the **golden wisp** — the peak-end rule), then offers *"a fine
place to rest"* with tomorrow's forecast attached. Streaks, amber-drop streak
insurance, comeback gifts that scale with absence, and the nightly forecast
all live here.

**QUESTS** — three daily field tasks *generated from the motivation vector*:
the lead quest always speaks to your dominant drive. Mastery players get
deep-graze tasks; fortune players get gate and card tasks; and so on.

### The technique catalogue

| Psychology | Where it lives |
|---|---|
| Flow-channel difficulty (Csíkszentmihályi) | `DIRECTOR.frame()` — per-frame, per-player |
| Variable-ratio reinforcement (Skinner) | fate cards, wisp spawns, mote values × heat |
| Loss aversion (Kahneman–Tversky) | unbanked pot at every gate; death keeps 2/5; singe *scatters* loss visibly — and lets you chase it back |
| Push-your-luck / escalating commitment | the hourly stay-or-bank gate, with a 6s urgency timer that defaults to *stay* |
| Near-miss effect | unpicked cards revealed honestly; grazing itself is a continuous near-miss |
| Endowed progress (Nunes & Drèze) | new saves start with the XP bar 42% full |
| Goal gradient | "next unlock" chip always visible; XP bar on every summary |
| Peak-end rule (Kahneman) | golden wisp scheduled at fatigue, then the rest screen |
| Appointment mechanics / Zeigarnik | tomorrow's forecast announced tonight; daily quests reset at midnight |
| Streaks + insurance | consecutive nights, amber drops that survive one miss |
| Reciprocity / comeback warmth | absence is met with gifts, not punishment |
| Sunk-cost visibility | lifetime tally in Field Notes: flights, dawns, seconds grazed |
| Collection compulsion | the specimen drawer: eight inks, four trails, pinned like lepidoptera |
| Personalisation-as-spectacle | Field Notes shows the model *reading you back* — compass, sparkline, prose |

**A note on honesty.** The engine never fabricates: every card draw is a real
draw, every forecast is honoured, the odds at the gate come from the actual
model, and the Field Notes screen discloses the whole portrait to the player.
It retains by being generous at the right moments — warm welcomes, mercy
curves, dignified exits — not by lying. And it tracks everything while
sending nothing anywhere: the save never leaves `localStorage`.

---

## The design system — "The Field Guide"

**Direction:** a Victorian entomologist's field guide, opened at night.
Every screen is a *plate*: hairline double-frame with corner marks, a
small-caps mono overline, an italic serif display line, dotted-leader
ledgers, a footnote. The reader is the specimen.

**Palette** (default ink, *Lamplight* — the engine re-inks the whole game live):

| token | value | role |
|---|---|---|
| night | `#12101c` | the page beneath the page |
| paper | `#efe7d4` | aged cream — all type, all rules |
| flame | `#ffb454` | candle amber — reward, heat, emphasis |
| hot | `#ff6a2b` | the dangerous end of the flame |
| moon | `#7e93ad` | slate blue — the cool counterpoint |

Seven more inks (Moonglass, Foxfire, Vermeil, Absinthe, Aubergine, Ivory
Dawn, Oilslick) are full re-colourings of canvas *and* UI, unlocked through
play and displayed as pinned specimens.

**Type:** italic serif display (Iowan Old Style / Palatino / Georgia stack)
at tight leading for anything that should feel *written*; 10px letter-spaced
small-caps mono for anything that should feel *measured*. Numbers are
savoured — summary counters ease in over 900ms.

**Motifs:** figure captions on the play field itself (*fig. 1 — the graze*),
Latin binomials on every ink (*Noctua lucerna*), Roman-numeral hours, the
lamp hung from a hairline cord, film grain and candlelight vignette,
currency written `℘`.

---

## Files

```
moth/
  index.html      shell
  css/moth.css    the design system (tokens, plates, cards, drawer, notes)
  js/engine.js    LAMPLIGHT: telemetry → model → director/rewards/hooks/quests
  js/scene.js     simulation + procedural renderer + synthesised audio
  js/ui.js        screens: title, HUD, gate, summary, fates, drawer, notes
```
