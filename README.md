# Museum of Design

A small museum on the web. You come in with a ticket, pick a room, and every room teaches one principle of design by doing it to you. At the end, one terrible poster is restored in front of you, one principle at a time.

## The visit

1. **Ticket.** Tear the stub to get in. The ticket flies into your passport in the header.
2. **Lobby.** A turning centrepiece, then the permanent collection: seven rooms and a rotunda, each a card with its own sculpture. Start the tour or choose a room.
3. **Rooms 01–07.** Every room has the same shape:
   - **Entrance hall.** The room's name, a 3D sculpture you can turn, and a museum label.
   - **Three exhibits.** Each exhibit has a title, one instruction, and one line of takeaway.
   - **Exit.** Your passport gets stamped and a door leads to the next room.
4. **Rotunda.**
   - **The Grand Restoration.** An awful poster is fixed in seven passes as you scroll: contrast, hierarchy, white space, color, typography, motion, balance.
   - **Passport Control.** Shows which rooms you've stamped.
   - **The Gift Shop.** Seven postcards that download as printable field notes.

You can always see where you are: the header shows the room you're in and your passport stamps, and **Floor plan** opens a map with the suggested route.

| Room | Sculpture | Exhibits |
| --- | --- | --- |
| 01 Contrast | *Eclipse*: two lacquer halves around a light | The Dark Room · The Dial · Find "Continue" |
| 02 Hierarchy | *The Podium* | The Poster · Promote One · The Squint Test |
| 03 White Space | *One Thing*: a tilting slab, one red sphere | The Clutter · One Per Wall · Leading |
| 04 Color | *Spectrum*: twelve OKLCH hues in a wave | Temperature · The Wheel · Same Grey |
| 05 Typography | *Ampersand*: extruded Instrument Serif | Words That Act · One Font · Kerning |
| 06 Motion | *Newton's Cradle* (click it) | Photo Finish · The Spring · Stagger |
| 07 Balance | *Mobile No. 3*, after Calder | The Seesaw · Two Kinds of Calm · The Thirds |
| ∞ Rotunda | *Armillary* | The Grand Restoration · Passport Control · The Gift Shop |

## How it's built

- **Router.** A hash-routed single page (`#/`, `#/room/<id>`, `#/rotunda`). Each view mounts into one context, and leaving the view tears all of it down: tweens, ScrollTriggers, listeners and 3D views. Between rooms, two gallery doors close in the next room's color.
- **3D.** One transparent three.js canvas renders every sculpture on the page. Each sculpture is drawn into the rectangle of its DOM element using scissor and viewport. The lighting is a studio environment built with PMREM, and contact shadows are soft blobs. Glyphs are extruded from real font outlines. You can drag any sculpture to turn it, and each has its own motion: an eclipse opening, balls bouncing on a podium, a rolling sphere, a hue wave, a working Newton's cradle, a mobile, an armillary.
- **Type.**
  - **Mona Sans** (variable weight and width) for everything structural. Room names are fitted to the page with the width axis.
  - **Instrument Serif** italic for the voice.
  - **Geist Mono** for labels.
- **Color.** Each room owns one color from a palette chosen in OKLCH:
  - darks and lights: Ink `#0C0C14`, Bone `#F3F0E9`, Paper `#FBFAF6`
  - accents: Ultra `#3A22FC`, Lilac `#CDBFFF`, Mint `#8DEFC5`, Coral `#FD5A32`, Apricot `#FBC49F`, Volt `#D9FD3A`, Brass `#E2B866`

  The whole page changes over to that color when you enter.
- **Motion.** [GSAP](https://gsap.com) handles animation (ScrollTrigger, SplitText, CustomEase) and [Lenis](https://lenis.darkroom.engineering) provides smooth scrolling. Both are vendored in `vendor/` with three.js r159. Fonts are self-hosted (OFL). There are no images; every graphic is code.

Respects `prefers-reduced-motion`: there's no smooth scrolling or choreography, and the sculptures hold still. Controls work from the keyboard, the ticket tears with Enter and Esc closes the map. The layout is responsive down to phones. Your passport is kept in `localStorage`.

## Run it

Any static server:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step.
