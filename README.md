# TIQUE — The Critique Factory

**A living machine that judges writing with personality.**

Feed the factory your story. Watch it get printed onto paper, sealed in a glass
cylinder, and carried by conveyor through seven rooms — each operated by a
small, strange, hyper-specialized creature (a **TIQUE**) that physically reacts
to your prose, scores it out of 10, writes a deadpan critique, and answers your
follow-up questions.

The factory existed before you arrived. It will exist after. Probably.

## The seven departments

| Room | TIQUE | Judges |
|---|---|---|
| 01 | The Syntax Clerk | grammar, syntax, clarity, sentence effectiveness |
| 02 | The Tempo Warden | pacing, rhythm, narrative momentum |
| 03 | The Logic Sentinel | character logic, motivation, internal consistency |
| 04 | The Secondhand Pain Unit | cringe, forced emotion, failed humor |
| 05 | The Tone Calibrator | tone, mood, intent vs. result |
| 06 | The Novelty Seeker | originality of plot, characters, voice |
| 07 | The Unpredictability Gauge | surprise, predictability, setup vs. payoff |

Then the **Verdict Vault** stamps a final grade and prints a downloadable
inspection report.

## Tech

- **Three.js** — fully procedural 3D factory (no model files): conveyor belts,
  pulsing pipes, gears, steam, bloom, cinematic camera rig. All seven creatures
  are built from primitives and animated with an emotional state machine.
- **Web Audio** — fully procedural soundscape (hums, bells, stamps, alarms,
  creature blips). No audio assets.
- **Two cogitation cores**:
  - **LOCAL GEARS** (default, zero config) — a real text-analysis engine that
    runs in the browser: sentence rhythm, adverb density, cliché detection,
    telegraphing, tonal swing… and generates deadpan critiques that quote the
    author's actual text.
  - **CLAUDE CORE** — full AI critiques and chat via the Anthropic API
    (`claude-opus-4-8`, structured outputs). Activates automatically when
    available; falls back to Local Gears per-room on any failure.

## Run it

```bash
npm install
npm run dev        # local dev at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build
```

## Enabling the Claude core

Pick either (or both):

1. **Server key (recommended for a deployed site)** — set the
   `ANTHROPIC_API_KEY` environment variable on the Netlify site
   (Site settings → Environment variables), then redeploy. The serverless
   function at `netlify/functions/critique.mjs` handles all calls; the key
   never reaches the browser.
2. **Visitor key** — click the engine badge (top-right) in the app and paste an
   Anthropic API key. It is stored only in that browser's `localStorage` and
   calls `api.anthropic.com` directly from the browser.

No key at all? The factory still works — Local Gears handles everything.

## Deploy on Netlify

The repo is Netlify-ready (`netlify.toml`):

- build command `npm run build`, publish directory `dist`
- function bundling via esbuild
- `/api/critique` routed to the serverless function

Either connect the repo in the Netlify UI, or `netlify deploy --prod` with the CLI.

## Project map

```
index.html                     HUD markup (intake, critique panel, verdict…)
src/main.js                    state machine + cinematic sequences + render loop
src/world.js                   renderer, bloom, lights, atmosphere
src/rooms.js                   the factory: belt, pipes, gears, 7 rooms, vault
src/tiques.js                  the seven creatures + emotional animation
src/cylinder.js                the glass evidence vessel (your words, printed)
src/camera.js                  cinematic camera rig (orbit/fly/follow/shake)
src/fx.js                      steam, sparks, confetti
src/audio.js                   procedural Web Audio soundscape
src/analysis.js                LOCAL GEARS: metrics, scoring, deadpan critiques
src/ai.js                      CLAUDE CORE client + engine fallback chain
src/prompts.js                 shared TIQUE persona prompts + JSON schema
src/copy.js                    every word the factory says
src/ui.js                      DOM wiring
netlify/functions/critique.mjs serverless Claude endpoint
```

---

*This software is legally meaningless in all jurisdictions, including imaginary ones.*
