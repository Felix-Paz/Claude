# Museum of Design

A small museum on the web. You come in with a ticket, pick a room on a 3D model of the building, and every room teaches one principle of design by doing it to you first, then explaining it. At the end, one terrible poster is restored in front of you, one principle at a time.

## The visit

1. **Ticket.** Tear the stub to get in. The ticket flies into your passport in the header.
2. **Lobby.**
   - **Exhibit 0, The Lens.** A drop of liquid glass over the museum's name: move it, click for a ripple.
   - **Visitor information.** Five lines on how the museum works.
   - **The building.** A 1 : 200 architect's model of the museum with the roof off. Each room holds a miniature of its sculpture, a glass dome floats over the rotunda, and small visitors walk the route. Hover a room to lift it, click to walk in. Flags mark the rooms you've visited.
   - **The collection.** One card per room.
3. **Rooms 01–07.** Every room has the same shape:
   - **Entrance hall.** Wall text on the left: the room's name, its thesis, a short intro and an "In this room" list. The room's 3D sculpture stands in a lit, arched niche on the right with a museum label.
   - **Exhibits.** Three per room (four in Balance). Each one has:
     - a title and one instruction;
     - a short explanation of what you're seeing;
     - a numbered audio-guide stop that reads it aloud;
     - a one-line takeaway.
   - **Exit.** Your passport gets stamped and a door leads to the next room.
   - **Rail.** On desktop, a rail on the left shows the entrance, each exhibit and the exit, and where you are.
4. **Rotunda.**
   - **The Grand Restoration.** An awful poster is fixed in seven passes as you scroll, with a caption for each step.
   - **Passport Control.** Shows which rooms you've stamped.
   - **The Gift Shop.** A 3D postcard spinner; every card downloads a printable field guide.

**Floor plan** in the header opens the same 3D model, with a "You are here" pin on the room you're in.

| Room | Sculpture | Exhibits |
| --- | --- | --- |
| 01 Contrast | *Eclipse*: two lacquer halves around a light | The Dark Room · The Dial · Find "Continue" |
| 02 Hierarchy | *The Podium* | The Poster (self-organising, captioned) · Promote One · The Squint Test |
| 03 White Space | *One Thing*: a tilting slab, one red sphere | The Clutter · One Per Wall (a 3D gallery: salon hang → one spotlit work) · Leading (a page with its measure and line boxes drawn) |
| 04 Color | *Spectrum*: twelve OKLCH hues | Temperature · The Wheel · Same Grey |
| 05 Typography | *Ampersand*: extruded Instrument Serif | Words That Act · One Font · Kerning (the holes, measured) |
| 06 Motion | *Newton's Cradle* (click it) | Photo Finish (a 3D race track) · The Spring (a real coil) · Stagger (all at once vs one after another) |
| 07 Balance | *Mobile No. 3*, after Calder | The Seesaw · Two Kinds of Calm · The Thirds · The Golden Ratio (with a Fibonacci terrazzo sculpture) |
| ∞ Rotunda | *Armillary* | The Grand Restoration · Passport Control · The Gift Shop |

## Files

```
index.html          the shell: header, ticket gate, doors, floor plan, script order
css/
  base.css          tokens, room themes, header, ticket, doors, floor plan, controls
  lobby.css         the lens, visitor information, the building, the collection
  room.css          entrance hall + niche, exhibit template, rail, exit
  exhibits.css      every exhibit, room by room
  rotunda.css       the Grand Restoration (and its poster), passport, gift shop
js/
  core.js           helpers, smooth scroll, cursor, loader, view contexts (P)
  museum.js         the collection and its copy, passport, router, doors, floor plan
  lens.js           Exhibit 0, the liquid-glass shader
  lobby.js          the lobby view
  room.js           the room framework: hall, exhibits, audio guide, rail, exit
  rooms/*.js        one file per room: its exhibits (plus the Rotunda view)
  guides.js         the printable field notes from the gift shop
  main.js           boot: fonts, loader, ticket
  3d/
    stage.js        one WebGL renderer drawing every 3D view into its element
    sculptures.js   the nine room sculptures
    building.js     the 1 : 200 model of the museum
    exhibits.js     3D exhibits: gallery, race track, coil spring, Fibonacci slab
    glyphs.js       font outlines for extruded letters
```

## How it's built

- **Router.** A hash-routed single page (`#/`, `#/room/<id>`, `#/rotunda`). Each view mounts into one context, and leaving the view tears all of it down: tweens, ScrollTriggers, listeners and 3D views. Between rooms, two gallery doors close in the next room's color.
- **3D.**
  - **One canvas.** A single transparent three.js canvas renders every 3D piece on the page, each into its DOM element's rectangle.
  - **Lighting.** A PMREM studio environment, contact shadows, and real shadow maps for the architecture.
  - **Interaction.** Raycast picking finds what's under the pointer, and labels follow 3D points as the model turns.
  - **Pieces.** The building, the gallery, the race track, the spring, the postcard rack and the Fibonacci slab are all built from primitives, extruded font outlines and canvas textures.
- **The Lens.** A GLSL fragment shader over a texture traced from the real DOM typesetting. It does magnification, chromatic dispersion, fresnel rim, specular glint, squash and stretch with velocity, ripples, and a melt as you scroll away.
- **Type.**
  - **Mona Sans** (variable weight and width) for everything structural. Room names are fitted with the width axis.
  - **Instrument Serif** italic for the voice.
  - **Geist Mono** for labels.
- **Color.** Each room owns one color from a palette chosen in OKLCH:
  - darks and lights: Ink `#0C0C14`, Bone `#F3F0E9`, Paper `#FBFAF6`
  - accents: Ultra `#3A22FC`, Lilac `#CDBFFF`, Mint `#8DEFC5`, Coral `#FD5A32`, Apricot `#FBC49F`, Volt `#D9FD3A`, Brass `#E2B866`
- **Audio guide.** Uses the browser's speech synthesis. The button hides when it isn't available.
- **Libraries.**
  - [GSAP](https://gsap.com) (ScrollTrigger, SplitText, CustomEase), [Lenis](https://lenis.darkroom.engineering) and three.js r159, vendored in `vendor/`.
  - Fonts are self-hosted (OFL).
  - There are no images; every graphic is code.

Muted text keeps at least 4.5 : 1 contrast on every room's color. Respects `prefers-reduced-motion`: there's no lens, smooth scrolling or choreography, and the sculptures hold still. Controls work from the keyboard, and the layout is responsive down to phones, where the race keeps its flat lanes. Your passport is kept in `localStorage`.

## Run it

Any static server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step.
