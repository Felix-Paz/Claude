# The Museum of Design

An interactive museum where **every room teaches a design principle by doing it to you.**

You're handed a **ticket** (tear it to enter), rooms **stamp your passport** as you visit, exhibits sit in **glass vitrines** on brass-labelled pedestals ("please touch"), every scene has a proper **exhibit plaque**, and the tour ends in a **gift shop** of free postcards.

## The seven rooms

| Room | Principle | You experience it as… |
| --- | --- | --- |
| 01 | **Contrast** | a pitch-black antechamber while your eyes adapt, a live WCAG contrast dial, a find-the-button game that times you, a split poster under glass |
| 02 | **Hierarchy** | a front page where everything screams equally until scrolling puts it in order, a hold-to-squint test, an eye-path tracer, click-to-promote editor cards |
| 03 | **White Space** | a wall of 37 pieces of junk that empties as you scroll, a paragraph that inhales, two screens of deliberate nothing, one masterpiece ruined by a yard sale |
| 04 | **Color** | a hue journey that changes the room's temperature, harmony wheels, a grey-chip illusion you dissolve by holding a button, one app in three wrong outfits, a pointer mixer |
| 05 | **Typography** | letter anatomy over a giant *g*, scroll-scrubbed variable axes, four voices, four typographic crimes prosecuted live, a kerning fix, a type playground |
| 06 | **Motion** | easing races, a word wired to your scroll speed, tastable durations, stagger waves, a microinteraction petting zoo, a throwable spring ball |
| 07 | **Balance** | seesaws, symmetry that breaks but still balances, the rule of thirds in motion, a frame you level by hand — then passport control and the gift shop |

Each doorway travels with a transition built **from the principle you're about to learn** — contrast slams black & white shut, white space is a slow breath, motion is a ball that swallows the screen.

## Details

- **Zero dependencies** — hand-written HTML, CSS, and vanilla JS. No frameworks, no libraries.
- **Variable fonts** — Archivo (weight + width axes) and Fraunces (optical size, softness, wonk), self-hosted.
- Custom cursor, kinetic hero letters that respond to pointer proximity, a horizontal gallery corridor, scroll-driven scenes, per-room palettes, grain, mesh-gradient lighting.
- Honors `prefers-reduced-motion`, keyboard navigable (Esc exits a room), responsive down to phones.

## Run it

Any static server works:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

There is no build step.
