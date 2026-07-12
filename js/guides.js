/* =====================================================================
   THE MUSEUM OF DESIGN · field notes
   Each gift-shop postcard hands the visitor a printable field guide —
   a standalone HTML file, generated right here, free of charge.
   ===================================================================== */
window.GUIDES = (function () {
  'use strict';

  const NOTES = {
    contrast: {
      num: '01', name: 'Contrast', tag: 'Difference makes meaning',
      tips: [
        ['Meet 4.5:1 or don’t ship it', 'Body text needs a 4.5:1 contrast ratio against its background; 3:1 for large type. If you’re squinting, so is everyone.'],
        ['One loud thing per view', 'Contrast is a budget. Two loud things equals zero loud things.'],
        ['Demote, don’t inflate', 'Weak emphasis is rarely fixed by making it bigger — make everything around it smaller and quieter.'],
        ['Five dials, turn one hard', 'Size, weight, color, form, direction. One dial turned all the way beats five turned a little.'],
        ['Grey-on-grey is not minimalism', 'It’s fog. Minimalism keeps the contrast and removes the clutter.'],
        ['The odd one out wins', 'The single circle among squares gets seen first. Spend that trick on the action you actually want taken.'],
        ['Test on a bad screen', 'Sunlight, night mode, cheap panels. Real users own all three.'],
        ['If everything is bold…', '…then nothing is. Bold is a rank, not a font.']
      ]
    },
    hierarchy: {
      num: '02', name: 'Hierarchy', tag: 'The eye obeys an order',
      tips: [
        ['Pick the one thing', 'Decide what a first-time visitor must see first. Design that. Everything else queues behind it.'],
        ['Squint test everything', 'Blur the layout — if the reading order survives, ship it. If it all melts together, start over.'],
        ['Sizes step, never slide', 'A scale like 1 / 1.25 / 1.6 / 2.5 reads as intent. 14px next to 15px reads as an accident.'],
        ['Put treasure on the F', 'Eyes sweep top-left → right, then down the left edge. Prime shelf space — stock it.'],
        ['One headline per view', 'Two headlines are a fight. The reader loses.'],
        ['Mute to demote', 'Small + grey beats deleted. Secondary things should whisper, not vanish.'],
        ['Numbers promise order', 'Number things only when sequence matters. Otherwise the reader hunts for a story that isn’t there.'],
        ['"Make it all bigger" — no', 'When everything grows, nothing leads. Grow the gaps between levels instead.']
      ]
    },
    whitespace: {
      num: '03', name: 'White Space', tag: 'Emptiness is a material',
      tips: [
        ['Space is attention storage', 'Whatever you refuse to fill speaks loudest. An empty margin is doing work.'],
        ['Double it, then add more', 'Whatever padding you were about to type, double it. Discomfort means it’s working.'],
        ['Group with space first', 'Proximity groups better than boxes. Borders are the last resort of a crowded mind.'],
        ['45–75 characters per line', 'Longer and the eye loses the trail home. Line-height 1.4–1.7 for body text.'],
        ['One idea per screenful', 'That’s the luxury-brand move. Ten ideas per screenful is a pop-up ad.'],
        ['Margins are the frame', 'Galleries don’t butt paintings against the wall edge. Thin frames make cheap art.'],
        ['Emptier = clearer', 'If a page feels empty after a cut, the content got clearer. Sit with it.'],
        ['Deleting is free', 'The cheapest white space is the element you remove.']
      ]
    },
    color: {
      num: '04', name: 'Color', tag: 'Feeling at 400 nanometers',
      tips: [
        ['60 · 30 · 10', 'Dominant neutral, supporting tone, one accent. The tailor’s rule of interfaces.'],
        ['One saturation lane', 'All muted or all vivid. Mixing lanes is how accidents look.'],
        ['Color is a rumor', 'No color exists alone — every hue changes with its neighbors. Judge chips on the real background, never in the picker.'],
        ['Steal from the wheel', 'Complementary = drama. Analogous = calm. Triadic = play. They’re free.'],
        ['Warm advances, cool recedes', 'Put warmth where you want the eye to land first.'],
        ['Respect the meanings', 'Red is appetite on a menu and catastrophe on a bank statement. Context is the first stakeholder.'],
        ['Check text on every surface', 'Accent backgrounds still owe you 4.5:1 for the words sitting on them.'],
        ['Not a rave? Desaturate', 'If the palette vibrates and you didn’t mean it to, pull saturation before you pull hues.']
      ]
    },
    typography: {
      num: '05', name: 'Typography', tag: 'The clothing words wear',
      tips: [
        ['Two typefaces, maximum', 'One voice, one anchor. Three is a costume party.'],
        ['Set the body right', '16px minimum, 45–75 characters per line, line-height ~1.5, left-aligned. Boring and correct.'],
        ['Caps are for labels', 'Capitals have no silhouette; reading becomes spelling. Fine for six letters, cruel for sixty.'],
        ['Hierarchy ≠ decoration', 'Weight, size and space make rank. Underlines and rainbow colors make noise.'],
        ['Kern the big stuff', 'Display sizes expose every gap. If a pair looks wrong, it is wrong.'],
        ['Tables want tabular figures', 'Numbers that line up in columns need digits of equal width. font-variant-numeric: tabular-nums.'],
        ['Italic is seasoning', 'A pinch is flavor. Everywhere is soup.'],
        ['Read it out loud', 'Every typeface has a voice. If the font says one thing and the words another, change one of them.']
      ]
    },
    motion: {
      num: '06', name: 'Motion', tag: 'Design’s fourth dimension',
      tips: [
        ['200–350ms is the pocket', 'Fast enough to feel instant, slow enough to be seen. Under 100ms is a twitch; over 700ms is a nap.'],
        ['Nothing alive is linear', 'Ease-out to arrive, ease-in to leave, spring when you want a pulse.'],
        ['Stagger by 20–60ms', 'A crowd moving at once is a glitch. A crowd moving in order is choreography.'],
        ['Transform & opacity only', 'Animating layout (width, top, margins) stutters. Transforms ride the GPU.'],
        ['Motion answers a question', '"Where did it go? What changed?" If an animation answers nothing, it’s noise.'],
        ['One overshoot, max', 'A spring may bounce once. Twice is jelly.'],
        ['Respect reduced motion', 'prefers-reduced-motion is a promise, not a suggestion. Dizzy users don’t come back.'],
        ['Stillness is a feature', 'If everything moves, nothing does. The pause before the pounce is the pounce.']
      ]
    },
    balance: {
      num: '07', name: 'Balance', tag: 'Felt, never seen',
      tips: [
        ['Compose like a scale', 'Big-near-center trades evenly against small-far-away. Every element has visual weight; place it like it does.'],
        ['Symmetry is safe, and static', 'It always balances and never surprises. Asymmetry has energy — but pay the counterweight.'],
        ['Use the thirds', 'Subjects on the intersections, horizons on the lines. Dead center is stable; stable is static.'],
        ['Emptiness weighs', 'A large empty area needs mass across from it. White space sits on the scale too.'],
        ['Squint for heaviness', 'Blur your eyes: which side sinks? Move something small farther out, or something big closer in.'],
        ['Fewer alignment lines', 'Every new edge you align to is a new thing to keep level. Two or three strong lines beat ten weak ones.'],
        ['Trust optical over math', 'Perfect mathematical centering often looks low. Nudge up. The eye keeps its own books.'],
        ['"Off" usually means unbalanced', 'When a layout feels wrong and you can’t say why, check the scales before the colors.']
      ]
    }
  };

  function html(id) {
    const n = NOTES[id];
    if (!n) return '';
    const rows = n.tips.map(([t, d], i) => `
      <li>
        <span class="no">${String(i + 1).padStart(2, '0')}</span>
        <div><b>${t}</b><p>${d}</p></div>
      </li>`).join('');
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Field Notes ${n.num} · ${n.name} — The Museum of Design</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    background: #F2EFE7; color: #14110B;
    padding: 4rem 1.5rem;
    -webkit-font-smoothing: antialiased;
  }
  .sheet { max-width: 42rem; margin: 0 auto; }
  header {
    border-bottom: 3px solid #14110B;
    padding-bottom: 1.4rem; margin-bottom: 2rem;
  }
  .brand { display: flex; align-items: center; gap: .55rem;
    font-family: ui-monospace, monospace; font-size: .68rem;
    letter-spacing: .22em; text-transform: uppercase; color: #837D6F; }
  .brand i { width: 11px; height: 11px; border-radius: 3px; background: #FF4B14; }
  h1 { font-size: clamp(2.2rem, 7vw, 3.4rem); line-height: 1; letter-spacing: -.02em;
    text-transform: uppercase; margin-top: 1rem; }
  h1 small { display: block; font-size: .42em; color: #FF4B14; letter-spacing: .04em; }
  .tag { font-family: Georgia, serif; font-style: italic; color: #837D6F; margin-top: .6rem; }
  ol { list-style: none; display: grid; gap: 1.1rem; }
  li { display: flex; gap: 1rem; border-bottom: 1px solid #DFDACB; padding-bottom: 1.1rem; }
  .no { font-family: ui-monospace, monospace; font-size: .72rem; font-weight: 700;
    color: #FF4B14; padding-top: .25rem; }
  li b { display: block; font-size: 1.02rem; margin-bottom: .25rem; }
  li p { font-size: .88rem; line-height: 1.55; color: #3D3930; }
  footer { margin-top: 2.4rem; display: flex; justify-content: space-between;
    font-family: ui-monospace, monospace; font-size: .6rem; letter-spacing: .16em;
    text-transform: uppercase; color: #837D6F; }
  @media print { body { background: #fff; padding: 1rem; } }
</style>
</head>
<body>
<div class="sheet">
  <header>
    <p class="brand"><i></i>The Museum of Design · Field Notes</p>
    <h1><small>Room ${n.num}</small>${n.name}</h1>
    <p class="tag">${n.tag} — eight things worth stealing.</p>
  </header>
  <ol>${rows}</ol>
  <footer>
    <span>Issued to: one curious person</span>
    <span>Admission free · knowledge ships free</span>
  </footer>
</div>
</body>
</html>`;
  }

  function download(id) {
    const blob = new Blob([html(id)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `field-notes-0${NOTES[id].num.slice(-1)}-${id}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return { html, download, NOTES };
})();
