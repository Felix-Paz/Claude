/* =====================================================================
   MUSEUM OF DESIGN · field notes
   Each gift-shop postcard hands the visitor a printable field guide:
   a standalone HTML file, generated right here, free of charge.
   ===================================================================== */
window.GUIDES = (function () {
  'use strict';

  const NOTES = {
    contrast: {
      num: '01', name: 'Contrast', tag: 'How things get noticed',
      tips: [
        ['Check the ratio', 'Body text needs 4.5 : 1 against its background. Headings above about 24 px can go down to 3 : 1. Any contrast checker will tell you.'],
        ['One loud thing per screen', 'If two things shout at the same volume, people notice neither. Decide which one gets the strongest contrast.'],
        ['Turn the rest down', 'To make something stand out, it often works better to quieten what’s around it than to make it bigger.'],
        ['Pick one tool and push it', 'Size, weight, color, shape, direction. Pushing one of them a long way works better than nudging all five.'],
        ['Light grey text is hard to read', 'It looks tidy in a mockup and fails on a real screen. Check it before you ship.'],
        ['Use the odd one out', 'One circle among squares gets seen first. Save that for the action you want people to take.'],
        ['Test on a bad screen', 'Try your page in sunlight, in dark mode and on a cheap laptop. Your visitors will.'],
        ['Go easy on bold', 'Bold only stands out when most of the page isn’t bold.']
      ]
    },
    hierarchy: {
      num: '02', name: 'Hierarchy', tag: 'What gets read first',
      tips: [
        ['Decide what comes first', 'Write down the one thing a new visitor has to see, and make it the most prominent thing on the page.'],
        ['Squint at it', 'Blur your eyes or the screenshot. If the reading order still makes sense, the hierarchy works.'],
        ['Use a type scale', 'Sizes like 16, 20, 25, 32 and 40 px look deliberate. 14 px next to 15 px looks like a mistake.'],
        ['Follow the reading path', 'People scan from the top left, across, then down the left edge. Put important things on that path.'],
        ['One headline per screen', 'With two headlines the same size, readers can’t tell where to start.'],
        ['Shrink, don’t delete', 'Small grey text is often better than removing something. People can still find it when they need it.'],
        ['Only number real sequences', 'Numbers suggest an order. Use them for steps, not for lists where the order doesn’t matter.'],
        ['Widen the steps', 'If the levels blur together, increase the difference between them instead of making everything bigger.']
      ]
    },
    whitespace: {
      num: '03', name: 'White Space', tag: 'The space between things',
      tips: [
        ['Leave some room', 'An empty margin is doing a job: it shows where one thing stops and the next starts.'],
        ['Try double the padding', 'Whatever padding you were about to use, try twice as much and compare.'],
        ['Group with spacing', 'Things close together read as a group. Often you can drop the borders and boxes entirely.'],
        ['45–75 characters per line', 'Longer lines make it hard to find the start of the next one. Use a line height of 1.4 to 1.7 for body text.'],
        ['One idea per screen', 'Expensive brands show one product at a time. Bargain sites show forty.'],
        ['Keep a margin around everything', 'Galleries don’t hang paintings tight against a corner. Give your content the same room.'],
        ['Wait a day before refilling', 'A page can feel bare right after a cut. Look again tomorrow before you add anything back.'],
        ['Delete first', 'Removing an element is the easiest way to make space.']
      ]
    },
    color: {
      num: '04', name: 'Color', tag: 'What color does before you read',
      tips: [
        ['60 · 30 · 10', 'Roughly 60% neutral, 30% a supporting color and 10% one accent. Interior designers have used it for decades.'],
        ['Keep saturation consistent', 'Choose all muted or all vivid colors. Mixing the two tends to look accidental.'],
        ['Judge colors in place', 'Every color changes next to its neighbours. Check swatches on the real background, not in the color picker.'],
        ['Use the wheel', 'Opposite hues give strong contrast, neighbouring hues look calm, and three evenly spaced hues feel playful.'],
        ['Warm colors come forward', 'Reds and oranges seem closer than blues and greens. Use warm colors where you want people to look.'],
        ['Know what a color means', 'Red is appetising on a menu and alarming on a bank statement. Check what it means in your context.'],
        ['Check text on colored backgrounds', 'Text on an accent color still needs 4.5 : 1.'],
        ['If it flickers, desaturate', 'Strong colors side by side can seem to vibrate. Lower the saturation before you change the hues.']
      ]
    },
    typography: {
      num: '05', name: 'Typography', tag: 'How letters sound',
      tips: [
        ['Two typefaces are enough', 'One for headings and one for text is plenty. Often a single family in a few weights does the job.'],
        ['Get the body text right', 'At least 16 px, 45–75 characters per line, line height around 1.5, aligned left.'],
        ['Keep capitals for short labels', 'Words in capitals lose their shape, so they’re slower to read. Fine for a few words, tiring for a paragraph.'],
        ['Rank with weight and size', 'Hierarchy comes from weight, size and spacing. Underlines and extra colors mostly add noise.'],
        ['Kern your headlines', 'Large text shows every uneven gap. If a pair looks too far apart, fix it by hand.'],
        ['Tabular figures for tables', 'Numbers in columns need digits of equal width so they line up. In CSS: font-variant-numeric: tabular-nums.'],
        ['Use italics sparingly', 'Italic works for titles and the odd word. A whole page of it is hard going.'],
        ['Read it aloud', 'If the typeface sounds wrong for the words, change one of them.']
      ]
    },
    motion: {
      num: '06', name: 'Motion', tag: 'How things move',
      tips: [
        ['200–350 ms for most UI', 'Fast enough to feel instant, slow enough to see. Under 100 ms looks like a flicker; over 700 ms feels slow.'],
        ['Ease out on the way in', 'Things that arrive should slow down at the end, and things that leave should speed up. Linear is for progress bars.'],
        ['Stagger by 20–60 ms', 'When several items appear, start each one a little after the last so the eye can follow.'],
        ['Animate transform and opacity', 'Animating width, top or margins makes the browser redo the layout, which can stutter. Transforms stay smooth.'],
        ['Give every animation a job', 'Good motion shows where something came from or what changed. If it does neither, consider cutting it.'],
        ['One bounce is enough', 'A spring that overshoots once feels physical. Several bounces start to look like jelly.'],
        ['Respect reduced motion', 'Some people get dizzy from movement. Honour prefers-reduced-motion and switch the big animations off.'],
        ['Keep most things still', 'Motion is easier to notice when the rest of the page is calm.']
      ]
    },
    balance: {
      num: '07', name: 'Balance', tag: 'Where the weight sits',
      tips: [
        ['Weight × distance', 'A big shape near the centre can be balanced by a small one far out, like on a seesaw.'],
        ['Symmetry is the safe option', 'A symmetrical layout always balances but can feel stiff. Asymmetry is livelier and needs a counterweight.'],
        ['Use the thirds', 'Put subjects on the crossings and horizons on the lines. Things in the exact middle tend to look static.'],
        ['Empty space has weight', 'A large empty area needs something on the other side to balance it.'],
        ['Squint to find the heavy side', 'If one side seems to sink, move a small element further out or a large one closer in.'],
        ['Try the golden ratio', 'About 1 : 1.618. Split a page 62 / 38, or multiply font sizes by 1.618. Each part has the same proportion as the whole.'],
        ['Centre by eye', 'Something centred exactly often looks slightly low. Move it up a little.'],
        ['Check the balance first', 'When a layout feels off and you can’t say why, look at the balance before you change the colors.']
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
<title>Field Notes ${n.num} · ${n.name} · The Museum of Design</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Mona Sans', 'Helvetica Neue', Arial, sans-serif;
    background: #EEEAE2; color: #121110;
    padding: 4rem 1.5rem;
    -webkit-font-smoothing: antialiased;
  }
  .sheet { max-width: 42rem; margin: 0 auto; }
  header {
    border-bottom: 3px solid #121110;
    padding-bottom: 1.4rem; margin-bottom: 2rem;
  }
  .brand { display: flex; align-items: center; gap: .55rem;
    font-family: ui-monospace, monospace; font-size: .68rem;
    letter-spacing: .22em; text-transform: uppercase; color: #7A766F; }
  .brand i { width: 11px; height: 11px; border-radius: 3px; background: #1D3ECF; }
  h1 { font-size: clamp(2.2rem, 7vw, 3.4rem); line-height: 1; letter-spacing: -.02em;
    text-transform: uppercase; margin-top: 1rem; }
  h1 small { display: block; font-size: .42em; color: #1D3ECF; letter-spacing: .04em; }
  .tag { font-family: Georgia, serif; font-style: italic; color: #7A766F; margin-top: .6rem; }
  ol { list-style: none; display: grid; gap: 1.1rem; }
  li { display: flex; gap: 1rem; border-bottom: 1px solid #DCD8CE; padding-bottom: 1.1rem; }
  .no { font-family: ui-monospace, monospace; font-size: .72rem; font-weight: 700;
    color: #1D3ECF; padding-top: .25rem; }
  li b { display: block; font-size: 1.02rem; margin-bottom: .25rem; }
  li p { font-size: .88rem; line-height: 1.55; color: #34333B; }
  footer { margin-top: 2.4rem; display: flex; justify-content: space-between;
    font-family: ui-monospace, monospace; font-size: .6rem; letter-spacing: .16em;
    text-transform: uppercase; color: #7A766F; }
  @media print { body { background: #fff; padding: 1rem; } }
</style>
</head>
<body>
<div class="sheet">
  <header>
    <p class="brand"><i></i>The Museum of Design · Field Notes</p>
    <h1><small>Room ${n.num}</small>${n.name}</h1>
    <p class="tag">${n.tag}. Eight tips to take home.</p>
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
