# The Museum of Design

An interactive museum where **every room teaches a design principle by doing it to you** — no plaques, no paragraphs.

## The seven rooms

| Room | Principle | You experience it as… |
| --- | --- | --- |
| 01 | **Contrast** | a room that dials itself from mud to maximum drama, with a live WCAG contrast ratio |
| 02 | **Hierarchy** | a front page where everything screams equally — until scrolling puts it in order |
| 03 | **White Space** | a wall crammed with 37 pieces of junk that empties as you scroll |
| 04 | **Color** | a hue journey that changes the room's temperature, harmony wheels, and a pointer-driven mixer |
| 05 | **Typography** | letter anatomy drawn over a giant *g*, variable-font axes you scrub with scroll and pointer |
| 06 | **Motion** | easing races, tastable durations, stagger waves, and a throwable spring ball |
| 07 | **Balance** | seesaws, symmetry that breaks but still balances, and a frame you level by hand |

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
