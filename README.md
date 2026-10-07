# Principia — seven laws of design, performed

A single-page, scroll-driven field guide to visual design. Every chapter **does the thing it describes**: the Contrast chapter is lit by a spotlight, the Hierarchy chapter reorganises a poster in front of you, the White Space chapter blows its own clutter off the screen, the Color chapter repaints the whole section from a palette you pick, and so on.

It began as a rebuild of the *Museum of Design* (PR #17): same idea — teach design by doing it — with a single art direction, one type system and one palette instead of seven competing ones.

## The tour

| | Chapter | What you do |
| --- | --- | --- |
| — | **Hero** | Move a lens of liquid glass over the headline. It's a WebGL fragment shader: magnification, chromatic dispersion, fresnel rim, specular glint, squash & stretch with velocity, click ripples. Scroll and the type melts. |
| — | **Preface** | A manifesto that reads itself in as you scroll, with tiny live graphics set inline in the sentence. |
| — | **Contents** | Seven rows that flood with each law's color; a generative poster follows your cursor. |
| I | **Contrast** | A spotlight that reveals a 1.3 : 1 whisper as a 17 : 1 shout (hold to widen it). A live WCAG ratio lab in OKLCH. |
| II | **Hierarchy** | A pinned poster that starts flat and gains size → weight → color → position, then draws the eye's reading route. Hold to squint. |
| III | **White Space** | 36 pieces of marketing junk explode outward to leave one word. Then 80vh of nothing. Then a leading & measure toggle. |
| IV | **Color** | Drag around an OKLCH hue wheel; harmonies are computed per hue at the sRGB cusp so accents stay vivid. The section, title gradient, a sample UI and the 60·30·10 bar all repaint. Plus a simultaneous-contrast illusion. |
| V | **Typography** | The title is one variable font breathing (weight + width per letter, swelling near the cursor). A variable-font lab with presets and live CSS. A horizontal gallery of words that act out their meaning. |
| VI | **Motion** | Six balls, one distance, six easing curves. A draggable ball on a real spring (tension/friction, squash in the direction of travel). A marquee that leans with scroll velocity. |
| VII | **Balance** | Drag shapes onto a beam; torque = visual weight × distance tilts it until you find the truce. |
| — | **Fin.** | Proximity-weighted law names, a colophon, and the lens returns over the wordmark. |

## Design system

- **Type** — Mona Sans (variable: `wght` 200–900, `wdth` 75–125) for display and text, Instrument Serif italic for expression, Geist Mono for data. Chapter titles are *fit to the measure with the width axis*: they keep one cap height and stretch or condense to fill the line.
- **Palette** — three hue families in two temperatures, chosen in OKLCH: Ultra `#3A22FC` / Lilac `#CDBFFF`, Flame `#FD5A32` / Apricot `#FBC49F`, Volt `#D9FD3A` / Mint `#8DEFC5`, on Ink `#0C0C14`, Bone `#F3F0E9` and Paper `#FBFAF6`. Each chapter owns one; the page changes clothes as you scroll (registered `@property` colors, so the whole theme interpolates).
- **Motion** — one house ease (`cubic-bezier(.16, 1, .3, 1)`), masked line reveals, springs for anything you touch.

Press **G** anywhere to see the 12-column grid. **M** opens the index.

## Built with

Semantic HTML, hand-written CSS, [GSAP](https://gsap.com) (ScrollTrigger, SplitText, CustomEase) and [Lenis](https://lenis.darkroom.engineering) vendored in `vendor/`, and raw WebGL. Fonts are self-hosted (OFL). No images: every graphic is code.

Respects `prefers-reduced-motion` (no smooth scroll, no WebGL, no choreography — the content is simply there), keyboard accessible (segmented controls, sliders, the wheel handle and the balance pieces all work from the keyboard), responsive down to phones.

## Run it

Any static server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step.
