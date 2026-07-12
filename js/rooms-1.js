/* =====================================================================
   THE MUSEUM OF DESIGN · rooms 01–04
   Contrast · Hierarchy · White Space · Color
   ===================================================================== */
(function () {
  'use strict';
  const { clamp, map, lerp } = M;

  /* ============================================================
     ROOM 01 · CONTRAST
     ============================================================ */
  ROOMS.define('contrast', {
    num: '01',
    name: 'Contrast',
    tag: 'Difference makes meaning',
    preview: '<i></i><b></b>',
    theme: 'th-contrast',

    html() {
      return `
      ${ROOMS.hero({
        num: '01', title: 'Contrast',
        titleHTML: '<span class="ct-word">CONTRAST</span>',
        tagline: 'This room is black and white about it: <em>difference is information.</em>'
      })}

      <!-- Antechamber · dark adaptation -->
      <section class="ct-dark sticky-wrap" style="--len:260">
        <div class="sticky-pane">
          <p class="ct-dark-line ctd-1">Most galleries ask for silence.</p>
          <p class="ct-dark-line ctd-2">This one only asks for your eyes.</p>
          <h2 class="ct-dark-word" aria-hidden="true">LOOK</h2>
          ${ROOMS.plaque('01.0', 'The Antechamber', 'darkness · floor-to-ceiling',
            'A retina takes ~25 minutes to fully adapt to the dark. You get one scroll.')}
        </div>
      </section>

      <!-- Scene A · the dial -->
      <section class="ct-dial sticky-wrap" style="--len:340">
        <div class="sticky-pane">
          <h2 class="ct-dial-word">
            <span class="ct-w-lo">invisible</span>
            <span class="ct-w-hi">UNMISSABLE</span>
          </h2>
          <div class="ct-meter">
            <span class="ct-ratio">1.0&hairsp;:&hairsp;1</span>
            <span class="ct-ratio-note">contrast ratio — keep scrolling</span>
            <div class="ct-meter-bar"><i></i></div>
          </div>
          ${ROOMS.plaque('01.1', 'The Dial', 'photons, increasingly · live',
            'The W3C says 4.5:1. Your optometrist says more.')}
        </div>
      </section>

      <!-- Scene B · more than color -->
      <section class="ct-more sticky-wrap" style="--len:330">
        <div class="sticky-pane">
          <p class="rm-cap ct-more-cap">Color is only one dial. Contrast has many.</p>
          <div class="ct-phase ct-ph-size"><span class="ct-small">a whisper</span><span class="ct-big">SHOUT</span></div>
          <div class="ct-phase ct-ph-weight"><span class="ct-thin">feather</span><span class="ct-heavy">ANVIL</span></div>
          <div class="ct-phase ct-ph-form"><i></i><i></i><b></b><i></i><i></i></div>
          <p class="ct-more-label" aria-hidden="true">SIZE</p>
          ${ROOMS.plaque('01.2', 'Three More Dials', 'size, weight & form · in rotation')}
        </div>
      </section>

      <!-- Scene C · the needle (find the button) -->
      <section class="ct-find">
        <p class="rm-cap" data-reveal>A little game. Find <em>“Continue”.</em></p>
        <div class="ct-find-grid" data-reveal style="--d:.1s"></div>
        <p class="ct-find-status" data-reveal style="--d:.15s">Round 1 — every button matters equally, which is to say: not at all.</p>
        ${ROOMS.plaque('01.3', 'The Needle', '23 haystacks · interactive',
          'Low contrast hides the way forward. High contrast is the way forward.', 'plaque--center')}
      </section>

      <!-- Scene D · interactive divider -->
      <section class="ct-split">
        <p class="rm-cap" data-reveal>Same poster, two moods. <em>Move across the glass.</em></p>
        <div class="vitrine" data-reveal style="--d:.1s">
        <div class="vitrine-glass">
        <div class="ct-stage" data-cursor="drag">
          <div class="ct-poster ct-lo-poster">
            <span class="ctp-kick">Tonight only</span>
            <strong class="ctp-title">JAZZ<br>AT THE<br>VOID</strong>
            <span class="ctp-line"></span>
            <span class="ctp-cta">Get tickets</span>
          </div>
          <div class="ct-poster ct-hi-poster">
            <span class="ctp-kick">Tonight only</span>
            <strong class="ctp-title">JAZZ<br>AT THE<br>VOID</strong>
            <span class="ctp-line"></span>
            <span class="ctp-cta">Get tickets</span>
          </div>
          <div class="ct-split-line"><span>⟷</span></div>
        </div>
        </div>
        <div class="vitrine-base"><span>Please touch the exhibit</span></div>
        </div>
        <p class="ct-split-note" data-reveal>One of these gets designed on purpose.<br>The other one just happens.</p>
      </section>

      ${ROOMS.outro('contrast', 'The eye goes to the difference. <em>Be the difference.</em>')}`;
    },

    init(root, c) {
      /* Antechamber: eyes adjust — the word surfaces out of black */
      const dark = root.querySelector('.ct-dark');
      const dWord = root.querySelector('.ct-dark-word');
      const d1 = root.querySelector('.ctd-1');
      const d2 = root.querySelector('.ctd-2');
      c.track(dark, p => {
        const q = M.map(p, 0.3, 0.92, 0, 1);
        const v = Math.round(10 + q * 245);
        dWord.style.color = `rgb(${v} ${v} ${v})`;
        d1.style.opacity = M.map(p, 0.02, 0.1, 0, 1) - M.map(p, 0.22, 0.32, 0, 1);
        d2.style.opacity = M.map(p, 0.24, 0.34, 0, 1) - M.map(p, 0.5, 0.62, 0, 1);
      });

      /* The needle: find the button, twice */
      const grid = root.querySelector('.ct-find-grid');
      const status = root.querySelector('.ct-find-status');
      const DECOYS = ['Cancel', 'Back', 'Maybe', 'Later', 'Skip', 'Retry', 'Undo', 'Close',
        'Wait', 'Hmm', 'Nope', 'Okay?', 'Sure?', 'Menu', 'Help', 'About', 'More', 'Less',
        'Reset', 'Pause', 'Idle', 'Shrug', 'Mmkay'];
      let round = 1, t0 = 0, t1ms = 0;
      const build = () => {
        const labels = [...DECOYS];
        const target = Math.floor(Math.random() * 24);
        grid.innerHTML = '';
        grid.className = 'ct-find-grid ' + (round === 2 ? 'is-round2' : '');
        for (let i = 0; i < 24; i++) {
          const b = document.createElement('button');
          b.dataset.cursor = 'link';
          if (i === target) { b.textContent = 'Continue'; b.className = 'is-it'; }
          else b.textContent = labels.splice(Math.floor(Math.random() * labels.length), 1)[0];
          grid.appendChild(b);
        }
        t0 = performance.now();
      };
      c.on(grid, 'click', e => {
        const b = e.target.closest('button');
        if (!b || grid.classList.contains('is-done')) return;
        if (!b.classList.contains('is-it')) {
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          return;
        }
        const ms = performance.now() - t0;
        if (round === 1) {
          t1ms = ms; round = 2;
          status.innerHTML = `Found it in <b>${(ms / 1000).toFixed(1)}s</b>. Round 2 — same game, one difference.`;
          setTimeout(build, 900);
        } else {
          grid.classList.add('is-done');
          status.innerHTML = `Round 1: <b>${(t1ms / 1000).toFixed(1)}s</b> · Round 2: <b>${(ms / 1000).toFixed(1)}s</b> — that gap is contrast, doing its job.`;
        }
      });
      build();

      /* Scene A: real WCAG ratio while the room fades from mud to ink-on-white */
      const dial = root.querySelector('.ct-dial');
      const pane = dial.querySelector('.sticky-pane');
      const wLo = root.querySelector('.ct-w-lo');
      const wHi = root.querySelector('.ct-w-hi');
      const ratioEl = root.querySelector('.ct-ratio');
      const noteEl = root.querySelector('.ct-ratio-note');
      const barEl = root.querySelector('.ct-meter-bar i');

      const lum = v => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const note = r =>
        r < 1.6 ? 'almost nothing — squint all you want' :
        r < 3   ? 'fails every accessibility bar' :
        r < 4.5 ? '3:1 — minimum for large type (AA)' :
        r < 7   ? '4.5:1 — body text becomes legal' :
        r < 12  ? '7:1 — AAA. chef’s kiss' :
                  'maximum drama';

      c.track(dial, p => {
        const q = M.map(p, 0.05, 0.92, 0, 1);
        const bg = Math.round(lerp(158, 251, q));
        const fg = Math.round(lerp(146, 8, q));
        pane.style.background = `rgb(${bg} ${bg} ${Math.round(bg * 0.985)})`;
        wLo.style.color = wHi.style.color = `rgb(${fg} ${fg} ${fg})`;
        wLo.style.opacity = q < 0.55 ? 1 : Math.max(0, 1 - (q - 0.55) * 8);
        wHi.style.opacity = q < 0.55 ? 0 : Math.min(1, (q - 0.55) * 8);
        wHi.style.fontWeight = Math.round(lerp(300, 900, M.map(q, 0.5, 1, 0, 1)));
        const L1 = 0.2126 * lum(bg) + 0.7152 * lum(bg) + 0.0722 * lum(Math.round(bg * 0.985));
        const L2 = 0.2126 * lum(fg) + 0.7152 * lum(fg) + 0.0722 * lum(fg);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        ratioEl.textContent = ratio.toFixed(1) + ' : 1';
        noteEl.textContent = note(ratio);
        barEl.style.transform = `scaleX(${clamp(ratio / 21, 0, 1)})`;
      });

      /* Scene B: size → weight → form */
      const more = root.querySelector('.ct-more');
      const phases = root.querySelectorAll('.ct-phase');
      const label = root.querySelector('.ct-more-label');
      const names = ['SIZE', 'WEIGHT', 'FORM'];
      const big = root.querySelector('.ct-big');
      const heavy = root.querySelector('.ct-heavy');
      const odd = root.querySelector('.ct-ph-form b');

      c.track(more, p => {
        const i = Math.min(2, Math.floor(p * 3));
        const q = clamp(p * 3 - i, 0, 1);
        phases.forEach((ph, k) => ph.classList.toggle('is-on', k === i));
        label.textContent = names[i];
        if (i === 0) big.style.transform = `scale(${lerp(0.25, 1, M.map(q, 0, 0.8, 0, 1))})`;
        if (i === 1) heavy.style.fontWeight = Math.round(lerp(100, 900, M.map(q, 0, 0.85, 0, 1)));
        if (i === 2) odd.style.transform = `scale(${M.map(q, 0.15, 0.7, 0, 1)})`;
      });

      /* Scene C: pointer divider */
      const stage = root.querySelector('.ct-stage');
      const hi = root.querySelector('.ct-hi-poster');
      const line = root.querySelector('.ct-split-line');
      let sx = 50, tx = 50;
      const move = e => {
        const r = stage.getBoundingClientRect();
        tx = clamp(((e.clientX - r.left) / r.width) * 100, 0, 100);
      };
      c.on(stage, 'pointermove', move);
      c.frame((t, dt) => {
        sx = lerp(sx, tx, 1 - Math.pow(1 - 0.16, dt));
        hi.style.clipPath = `inset(0 0 0 ${sx}%)`;
        line.style.left = sx + '%';
      });
    }
  });

  /* ============================================================
     ROOM 02 · HIERARCHY
     ============================================================ */
  ROOMS.define('hierarchy', {
    num: '02',
    name: 'Hierarchy',
    tag: 'The eye obeys an order',
    preview: '<i></i><i></i><i></i><i></i>',
    theme: 'th-hierarchy',

    html() {
      const sheet = extra => `
          <div class="hi-sheet ${extra || ''}">
            <p class="hi-el hi-kick">Exclusive</p>
            <h2 class="hi-el hi-head">Design quietly runs the world</h2>
            <p class="hi-el hi-deck">Everything you use today was a series of decisions someone made about order.</p>
            <p class="hi-el hi-body">The button you found without looking. The price you missed. The headline you couldn't ignore this morning. None of it was luck — someone decided what would reach your eye first, and everything else got in line behind it.</p>
            <p class="hi-el hi-meta">By A. Visitor · 4 min read</p>
            <span class="hi-el hi-cta">Read the story</span>
            <b class="hi-badge hb-1">1</b><b class="hi-badge hb-2">2</b><b class="hi-badge hb-3">3</b>
          </div>`;
      return `
      ${ROOMS.hero({
        num: '02', title: 'Hierarchy',
        titleHTML: 'HIER<br>ARCHY',
        tagline: 'Every layout is a queue. <em>Somebody has to go first.</em>'
      })}

      <!-- Scene A · the flat front page organizes itself -->
      <section class="hi-page sticky-wrap" style="--len:400">
        <div class="sticky-pane">
          ${sheet()}
          <p class="rm-cap hi-cap">When every word is equally loud, reading is labor.</p>
          ${ROOMS.plaque('02.1', 'The Democratic Page', 'equal type, universal suffering · restored mid-scroll')}
        </div>
      </section>

      <!-- Scene B · the squint test -->
      <section class="hi-squint">
        <p class="rm-cap" data-reveal>The oldest trick in the studio: <em>the squint test.</em></p>
        <div class="hi-squint-stage" data-reveal style="--d:.1s">
          ${sheet('hi-sheet--done')}
          <button class="hi-squint-btn" data-cursor="link">
            <i></i>Hold&nbsp;to&nbsp;squint
          </button>
        </div>
        <p class="hi-squint-note" data-reveal>Blur murders detail. Hierarchy survives it.<br>Whatever you can still see is what your layout is really saying.</p>
        ${ROOMS.plaque('02.2', 'The Squint Test', 'vaseline on lens · press & hold', '', 'plaque--center')}
      </section>

      <!-- Scene C · the eye path -->
      <section class="hi-eye sticky-wrap" style="--len:300">
        <div class="sticky-pane">
          <div class="hi-wire">
            <span class="hw-block hw-a"></span>
            <span class="hw-block hw-b"></span>
            <span class="hw-block hw-c"></span>
            <span class="hw-block hw-d"></span>
            <svg class="hi-svg" viewBox="0 0 100 132" aria-hidden="true">
              <path class="hi-trace" d="M14 18 H86 M14 18 V52 H70 M14 52 V96 H48 M14 96 V118" fill="none"/>
            </svg>
            <i class="hi-dot"></i>
            <b class="hi-n" style="left:8%;top:9%">1</b>
            <b class="hi-n" style="left:63%;top:35%">2</b>
            <b class="hi-n" style="left:41%;top:68%">3</b>
            <b class="hi-n" style="left:8%;top:87%">4</b>
          </div>
          <p class="rm-cap hi-eye-cap">Western eyes sweep an <em>F.</em> Put your treasure on its shelves.</p>
          ${ROOMS.plaque('02.3', 'The Reader’s Path', 'eye-tracking ghost · follows scroll',
            'Nielsen filmed a thousand readers. They all drew this letter.')}
        </div>
      </section>

      <!-- Scene C · you are the editor -->
      <section class="hi-editor">
        <p class="rm-cap" data-reveal>Importance is not discovered. It is <em>assigned.</em> Click a card to promote it.</p>
        <div class="hi-cards" data-reveal style="--d:.1s">
          <button class="hi-card is-1" data-cursor="link"><b>Aurora</b><span>flagship product</span></button>
          <button class="hi-card is-2" data-cursor="link"><b>Borealis</b><span>side project</span></button>
          <button class="hi-card is-3" data-cursor="link"><b>Cascade</b><span>a footnote</span></button>
        </div>
        <p class="hi-editor-note" data-reveal style="--d:.2s">Whatever you just clicked became the story.<br>That is the entire job description.</p>
      </section>

      ${ROOMS.outro('hierarchy', 'If <em>everything</em> is important, nothing is.')}`;
    },

    init(root, c) {
      /* Scene A: --u goes 1 → 0 (uniform → organized) */
      const page = root.querySelector('.hi-page');
      const sheet = root.querySelector('.hi-sheet');
      const cap = root.querySelector('.hi-cap');
      const caps = [
        [0.00, 'When every word is equally loud, reading is labor.'],
        [0.30, 'Scroll — give the eye an order.'],
        [0.62, 'Headline. Deck. Body. Everyone in their place.'],
        [0.85, 'First, second, third. <em>Done in a glance.</em>']
      ];
      c.track(page, p => {
        const u = 1 - M.map(p, 0.12, 0.78, 0, 1);
        sheet.style.setProperty('--u', u.toFixed(4));
        sheet.classList.toggle('is-ranked', p > 0.82);
        let html = caps[0][1];
        caps.forEach(([at, t]) => { if (p >= at) html = t; });
        if (cap.dataset.txt !== html) { cap.dataset.txt = html; cap.innerHTML = html; }
      });

      /* Scene B: hold to squint */
      const squintStage = root.querySelector('.hi-squint-stage');
      const squintBtn = root.querySelector('.hi-squint-btn');
      const squintOn = e => { e.preventDefault(); squintStage.classList.add('is-blur'); };
      const squintOff = () => squintStage.classList.remove('is-blur');
      c.on(squintBtn, 'pointerdown', squintOn);
      c.on(squintBtn, 'pointerup', squintOff);
      c.on(squintBtn, 'pointerleave', squintOff);
      c.on(squintBtn, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') squintOn(e); });
      c.on(squintBtn, 'keyup', squintOff);

      /* Scene C: dot rides the F-pattern */
      const eye = root.querySelector('.hi-eye');
      const trace = root.querySelector('.hi-trace');
      const svg = root.querySelector('.hi-svg');
      const dot = root.querySelector('.hi-dot');
      const ns = root.querySelectorAll('.hi-n');
      const len = trace.getTotalLength();
      trace.style.strokeDasharray = len;
      c.track(eye, p => {
        const q = M.map(p, 0.05, 0.9, 0, 1);
        trace.style.strokeDashoffset = len * (1 - q);
        const pt = trace.getPointAtLength(len * q);
        const vb = svg.viewBox.baseVal;
        dot.style.left = (pt.x / vb.width * 100) + '%';
        dot.style.top = (pt.y / vb.height * 100) + '%';
        ns.forEach((n, i) => n.classList.toggle('is-on', q > [0.1, 0.38, 0.66, 0.93][i]));
      });

      /* Scene C: promote on click */
      const cards = Array.from(root.querySelectorAll('.hi-card'));
      cards.forEach(card => c.on(card, 'click', () => {
        const rest = cards.filter(x => x !== card)
          .sort((a, b) => a.className.localeCompare(b.className));
        [card, ...rest].forEach((el, i) => {
          el.classList.remove('is-1', 'is-2', 'is-3');
          el.classList.add('is-' + (i + 1));
        });
      }));
    }
  });

  /* ============================================================
     ROOM 03 · WHITE SPACE
     ============================================================ */
  ROOMS.define('whitespace', {
    num: '03',
    name: 'White Space',
    tag: 'Emptiness is a material',
    preview: '<i></i>',
    theme: 'th-whitespace',

    html() {
      const JUNK = [
        'SALE!', '50% OFF', 'CLICK HERE', 'NEW!!', 'FREE SHIPPING', 'BUY NOW',
        'LIMITED TIME', 'WIN A PRIZE', 'SUBSCRIBE', 'POP-UP', 'ACT FAST', 'HOT DEAL',
        'ONLY TODAY', 'DON’T MISS OUT', '★★★★★', 'MEGA OFFER', 'URGENT', 'BONUS',
        '+1 NOTIFICATION', 'ALLOW COOKIES?', 'SPIN TO WIN', 'FLASH SALE', '99¢', 'LAST CHANCE',
        'TRENDING', 'AS SEEN ON TV', 'DOWNLOAD', 'SIGN UP FREE', 'NO. 1 APP', 'CLEARANCE',
        'BOGO', 'EXTRA 20%', 'JOIN NOW', 'BREAKING', 'UNMUTE 🔊', 'YOUR AD HERE'
      ];
      const junk = JUNK.map((t, i) => {
        const x = 4 + (i * 37) % 88, y = 6 + (i * 53) % 82;
        const r = ((i * 47) % 24) - 12, s = 0.72 + ((i * 29) % 10) / 14;
        const kind = i % 5;
        return `<span class="ws-junk k${kind}" style="--x:${x};--y:${y};--r:${r};--s:${s.toFixed(2)};--th:${(i / JUNK.length).toFixed(3)}">${t}</span>`;
      }).join('');

      const bottles = n => Array.from({ length: n }, () =>
        '<span class="ws-bottle"><i></i></span>').join('');

      return `
      <!-- Scene A · hero starts crowded; scrolling empties it -->
      <section class="ws-crowd sticky-wrap" style="--len:380">
        <div class="sticky-pane">
          <div class="ws-junkfield" aria-hidden="true">${junk}</div>
          <div class="ws-heroin">
            <p class="rm-num">Room 03 <i></i> of 07</p>
            <h1 class="rm-title ws-title">WHITE<br>SPACE</h1>
            <p class="ws-count" aria-hidden="true"><b>36</b> things on this wall</p>
          </div>
          <p class="ws-better">Better.</p>
        </div>
      </section>

      <!-- Scene B · the paragraph breathes -->
      <section class="ws-breathe sticky-wrap" style="--len:300">
        <div class="sticky-pane">
          <p class="ws-para">Cramped words make readers work. Give letters room and the same sentence stops shouting, starts speaking, and finally — finally — gets read. Nothing was added. Nothing was removed. Only space.</p>
          <p class="rm-cap ws-breathe-cap">Letters need air. <em>So do eyes.</em></p>
          ${ROOMS.plaque('03.1', 'The Inhale', 'leading & tracking · expands on approach')}
        </div>
      </section>

      <!-- Scene C · the corridor of nothing -->
      <section class="ws-nothing">
        <div class="ws-nothing-run" aria-hidden="true">
          <span class="ws-nothing-dot"></span>
          <p class="ws-nothing-whisper">( this pause is on purpose )</p>
        </div>
        <h2 class="ws-nothing-punch" data-split>You just scrolled through two screens of <em>nothing</em> — and it felt expensive, didn't it?</h2>
      </section>

      <!-- Scene D · one painting per wall -->
      <section class="ws-wall sticky-wrap" style="--len:320">
        <div class="sticky-pane">
          <div class="ws-wall-room">
            <figure class="ws-art ws-art-main"><i></i></figure>
            <figure class="ws-art ws-art-c c1"><i></i></figure>
            <figure class="ws-art ws-art-c c2"><b></b></figure>
            <figure class="ws-art ws-art-c c3"><u></u></figure>
            <figure class="ws-art ws-art-c c4"><i></i></figure>
            <figure class="ws-art ws-art-c c5"><b></b></figure>
            <figure class="ws-art ws-art-c c6"><u></u></figure>
            <figure class="ws-art ws-art-c c7"><i></i></figure>
            <figure class="ws-art ws-art-c c8"><b></b></figure>
          </div>
          <p class="rm-cap ws-wall-cap">Galleries hang one masterpiece per wall. <em>The wall is part of the art.</em></p>
          ${ROOMS.plaque('03.2', 'Composition No. 1', 'pigment on generous wall · priceless')}
        </div>
      </section>

      <!-- Scene E · the price of nothing -->
      <section class="ws-lux">
        <p class="rm-cap" data-reveal>Space is the most expensive material in design.</p>
        <div class="ws-shelves">
          <figure class="ws-shelf ws-cheap" data-reveal style="--d:.1s">
            <div class="ws-shelf-row">${bottles(9)}</div>
            <span class="ws-sticker">3 FOR 2!</span>
            <figcaption><b>$4.99</b><span>hurry, selling fast</span></figcaption>
          </figure>
          <figure class="ws-shelf ws-dear" data-reveal style="--d:.22s">
            <div class="ws-shelf-row">${bottles(1)}</div>
            <figcaption><b>$490</b><span>№ 03 · eau de silence</span></figcaption>
          </figure>
        </div>
        <p class="ws-lux-note" data-reveal>Same bottle. The second one bought<br>everything <em>around</em> it.</p>
      </section>

      <!-- Scene D · clear a little room -->
      <section class="ws-field-scene">
        <p class="rm-cap" data-reveal>Attention follows emptiness. <em>Sweep some.</em></p>
        <div class="ws-field" data-cursor="drag" data-reveal style="--d:.1s">
          <span class="ws-secret">focus</span>
        </div>
      </section>

      ${ROOMS.outro('whitespace', 'Whatever you refuse to fill <em>speaks loudest.</em>')}`;
    },

    init(root, c) {
      /* Scene A: junk flies away as you scroll */
      const crowd = root.querySelector('.ws-crowd');
      const junk = Array.from(root.querySelectorAll('.ws-junk'));
      const count = root.querySelector('.ws-count');
      const countB = count.querySelector('b');
      const better = root.querySelector('.ws-better');
      const heroin = root.querySelector('.ws-heroin');
      c.track(crowd, p => {
        const q = M.map(p, 0.06, 0.72, 0, 1);
        let left = 0;
        junk.forEach(el => {
          const gone = q > parseFloat(el.style.getPropertyValue('--th'));
          el.classList.toggle('is-gone', gone);
          if (!gone) left++;
        });
        countB.textContent = left;
        count.style.opacity = q > 0.94 ? 0 : 1;
        better.classList.toggle('is-on', p > 0.86);
        heroin.style.setProperty('--calm', M.map(p, 0.6, 0.9, 0, 1).toFixed(3));
      });

      /* Scene D: the museum wall gets a yard sale */
      const wall = root.querySelector('.ws-wall');
      const wallRoom = root.querySelector('.ws-wall-room');
      const wallCap = root.querySelector('.ws-wall-cap');
      c.track(wall, p => {
        const crowded = p > 0.52;
        wallRoom.classList.toggle('is-crowded', crowded);
        const html = crowded
          ? 'The same painting at a yard sale. <em>Feel the price drop?</em>'
          : 'Galleries hang one masterpiece per wall. <em>The wall is part of the art.</em>';
        if (wallCap.dataset.txt !== html) { wallCap.dataset.txt = html; wallCap.innerHTML = html; }
      });

      /* Scene B: typography inhales */
      const breathe = root.querySelector('.ws-breathe');
      const para = root.querySelector('.ws-para');
      c.track(breathe, p => {
        const q = M.map(p, 0.08, 0.85, 0, 1);
        para.style.lineHeight = lerp(1.02, 1.95, q).toFixed(3);
        para.style.letterSpacing = lerp(-0.045, 0.01, q).toFixed(4) + 'em';
        para.style.maxWidth = lerp(96, 44, q).toFixed(1) + 'rem';
        para.style.wordSpacing = lerp(-0.12, 0.08, q).toFixed(3) + 'em';
        para.style.opacity = lerp(0.75, 1, q);
      });

      /* Scene D: dots flee the pointer, revealing the word beneath.
         Dot rest positions are known percentages — one rect read per frame, total. */
      const field = root.querySelector('.ws-field');
      const DOTS = 130;
      const dots = [];
      for (let i = 0; i < DOTS; i++) {
        const d = document.createElement('i');
        const px = (4 + ((i % 13) / 12) * 92) / 100;
        const py = (8 + (Math.floor(i / 13) / 9) * 84) / 100;
        d.style.left = (px * 100) + '%';
        d.style.top = (py * 100) + '%';
        field.appendChild(d);
        dots.push({ el: d, px, py, ox: 0, oy: 0, tx: 0, ty: 0 });
      }
      let fr = null;
      c.on(field, 'pointermove', e => { fr = { x: e.clientX, y: e.clientY }; });
      c.on(field, 'pointerleave', () => { fr = null; });
      c.frame((t, dt) => {
        const rect = field.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const k = 1 - Math.pow(1 - 0.11, dt);
        dots.forEach(d => {
          if (fr) {
            const cx = rect.left + d.px * rect.width;
            const cy = rect.top + d.py * rect.height;
            const dx = cx - fr.x, dy = cy - fr.y;
            const dist = Math.hypot(dx, dy) || 1;
            const R = 150;
            if (dist < R) {
              const f = (1 - dist / R) * 92;
              d.tx = (dx / dist) * f; d.ty = (dy / dist) * f;
            } else { d.tx = 0; d.ty = 0; }
          } else { d.tx = 0; d.ty = 0; }
          const nox = lerp(d.ox, d.tx, k), noy = lerp(d.oy, d.ty, k);
          if (Math.abs(nox - d.ox) > 0.05 || Math.abs(noy - d.oy) > 0.05) {
            d.ox = nox; d.oy = noy;
            d.el.style.transform = `translate(${nox.toFixed(1)}px, ${noy.toFixed(1)}px)`;
          }
        });
      });
    }
  });

  /* ============================================================
     ROOM 04 · COLOR
     ============================================================ */
  ROOMS.define('color', {
    num: '04',
    name: 'Color',
    tag: 'Feeling at 400 nanometers',
    preview: '<i></i><b></b>',
    theme: 'th-color',

    html() {
      const wheelDots = Array.from({ length: 12 }, (_, i) => {
        const a = i * 30 - 90;
        return `<i class="co-wdot" style="--a:${a}deg;--h:${i * 30}" data-i="${i}"></i>`;
      }).join('');
      return `
      ${ROOMS.hero({
        num: '04', title: 'Color',
        titleHTML: '<span class="co-l" style="--h:4">C</span><span class="co-l" style="--h:36">O</span><span class="co-l" style="--h:150">L</span><span class="co-l" style="--h:210">O</span><span class="co-l" style="--h:275">R</span>',
        tagline: 'Nothing reaches the brain faster. <em>This room will change your pulse.</em>'
      })}

      <!-- Scene A · temperature journey -->
      <section class="co-temp sticky-wrap" style="--len:560">
        <div class="sticky-pane">
          <div class="co-word-stack">
            <h2 class="co-word"></h2>
            <p class="co-word-note"></p>
          </div>
          <div class="co-hud">
            <span class="co-hue">H&thinsp;0°</span>
            <span class="co-temp-tag">warm</span>
          </div>
          ${ROOMS.plaque('04.1', 'The Temperature Corridor', '300 degrees of feeling · walk-through', '', 'plaque--right')}
        </div>
      </section>

      <!-- Scene B · harmony -->
      <section class="co-harmony sticky-wrap" style="--len:380">
        <div class="sticky-pane">
          <div class="co-wheel">
            ${wheelDots}
            <svg class="co-lines" viewBox="-110 -110 220 220" aria-hidden="true"><polygon fill="none"/></svg>
          </div>
          <div class="co-scheme">
            <h3 class="co-scheme-name">Complementary</h3>
            <p class="co-scheme-note">Opposites on the wheel. Maximum tension — use one as the star, one as the cameo.</p>
            <div class="co-chips"></div>
          </div>
          ${ROOMS.plaque('04.2', 'The Wheel', 'twelve suspects · rearranged by scroll')}
        </div>
      </section>

      <!-- Scene C · your eyes lie -->
      <section class="co-illusion">
        <p class="rm-cap" data-reveal>Two chips. <em>Identical grey.</em> Your brain refuses to believe it.</p>
        <div class="co-illu" data-reveal style="--d:.1s">
          <div class="co-illu-half cih-dark"><i></i></div>
          <div class="co-illu-half cih-light"><i></i></div>
        </div>
        <button class="co-illu-btn" data-cursor="link" data-reveal style="--d:.15s"><i></i>Hold to remove the neighbors</button>
        ${ROOMS.plaque('04.3', 'Simultaneous Contrast', 'after M.&thinsp;E. Chevreul, 1839',
          'No color exists alone. Every hue is a rumor started by its neighbors.', 'plaque--center')}
      </section>

      <!-- Scene D · the wrong outfit -->
      <section class="co-outfit sticky-wrap" style="--len:360">
        <div class="sticky-pane">
          <div class="co-phone">
            <span class="co-phone-notch" aria-hidden="true"></span>
            <div class="co-phone-ui">
              <b class="cp-app">lumen</b>
              <h3 class="cp-word">Breathe</h3>
              <p class="cp-sub">4 minutes · evening wind-down</p>
              <span class="cp-btn">Begin session</span>
            </div>
          </div>
          <p class="rm-cap co-outfit-cap">This is a meditation app. Feeling calm yet?</p>
          ${ROOMS.plaque('04.4', 'The Wrong Outfit', 'one app, three wardrobes · rotates on scroll')}
        </div>
      </section>

      <!-- Scene E · the 60·30·10 rule -->
      <section class="co-rule sticky-wrap" style="--len:300">
        <div class="sticky-pane">
          <p class="rm-cap co-rule-cap">Palettes aren't split evenly. <em>60 · 30 · 10.</em></p>
          <div class="co-rule-ui">
            <div class="co-rl co-rl-60"><span>60 — the room</span></div>
            <div class="co-rl co-rl-30"><span>30 — the furniture</span></div>
            <div class="co-rl co-rl-10"><span>10 — the flowers</span></div>
          </div>
        </div>
      </section>

      <!-- Scene D · the mixer -->
      <section class="co-mixer-scene">
        <div class="co-mixer" data-cursor="drag">
          <p class="co-mixer-hint">← hue → &nbsp;·&nbsp; ↑ light ↓</p>
          <div class="co-mixer-read">
            <b class="co-mix-name">hsl(24 85% 56%)</b>
            <span>you're mixing — a palette follows you</span>
          </div>
          <div class="co-derived">
            <span class="co-d-chip cdc-base"><i></i>base</span>
            <span class="co-d-chip cdc-comp"><i></i>complement</span>
            <span class="co-d-chip cdc-a1"><i></i>neighbor −30°</span>
            <span class="co-d-chip cdc-a2"><i></i>neighbor +30°</span>
          </div>
          <span class="co-mixer-brass">Please touch · the paint is dry</span>
        </div>
      </section>

      ${ROOMS.outro('color', 'Color is the first thing seen and the last thing <em>forgotten.</em>')}`;
    },

    init(root, c) {
      /* Scene A: hue sweep with emotional stops */
      const temp = root.querySelector('.co-temp');
      const pane = temp.querySelector('.sticky-pane');
      const word = root.querySelector('.co-word');
      const note = root.querySelector('.co-word-note');
      const hueEl = root.querySelector('.co-hue');
      const tempTag = root.querySelector('.co-temp-tag');
      const stops = [
        { h: 6,   s: 78, l: 50, w: 'URGENT',   n: 'Red raises the pulse. Stop signs, sirens, sales.' },
        { h: 28,  s: 88, l: 54, w: 'HUNGRY',   n: 'Orange sells appetite. Count the food logos.' },
        { h: 50,  s: 92, l: 55, w: 'ALERT',    n: 'Yellow is optimism — and hazard tape. Context is king.' },
        { h: 140, s: 55, l: 42, w: 'CALM',     n: 'Green is permission: go, grow, breathe, spend.' },
        { h: 222, s: 70, l: 48, w: 'TRUSTED',  n: 'Blue lowers the pulse. Ask every bank on earth.' },
        { h: 278, s: 55, l: 46, w: 'RARE',     n: 'Violet was once worth more than gold. It remembers.' }
      ];
      let cur = -1;
      c.track(temp, p => {
        const q = M.map(p, 0.04, 0.96, 0, 1);
        const f = Math.min(stops.length - 1.0001, q * (stops.length - 1));
        const i = Math.floor(f), tq = f - i;
        const a = stops[i], b = stops[Math.min(i + 1, stops.length - 1)];
        const h = lerp(a.h, b.h, tq), s = lerp(a.s, b.s, tq), l = lerp(a.l, b.l, tq);
        pane.style.background = `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
        hueEl.textContent = 'H ' + Math.round(h) + '°';
        tempTag.textContent = (h > 90 && h < 330) ? 'cool' : 'warm';
        // yellows read bright even at mid lightness: flip the type to ink there
        const bright = l > 58 || (h > 38 && h < 90 && l > 42);
        pane.style.setProperty('--wordcol', bright ? '#14110B' : '#FDFCF8');
        const si = Math.round(f);
        if (si !== cur) {
          cur = si;
          word.textContent = stops[si].w;
          note.textContent = stops[si].n;
          word.classList.remove('pop'); void word.offsetWidth; word.classList.add('pop');
        }
      });

      /* Scene B: harmonies on the wheel */
      const harmony = root.querySelector('.co-harmony');
      const wdots = Array.from(root.querySelectorAll('.co-wdot'));
      const poly = root.querySelector('.co-lines polygon');
      const schemeName = root.querySelector('.co-scheme-name');
      const schemeNote = root.querySelector('.co-scheme-note');
      const chips = root.querySelector('.co-chips');
      const R = 88;
      const pt = i => {
        const a = (i * 30 - 90) * Math.PI / 180;
        return `${(Math.cos(a) * R).toFixed(1)},${(Math.sin(a) * R).toFixed(1)}`;
      };
      const schemes = [
        { name: 'Complementary', idx: [0, 6],
          note: 'Opposites on the wheel. Maximum tension — one star, one cameo.' },
        { name: 'Analogous', idx: [5, 6, 7],
          note: 'Neighbors. They cannot clash — the safest harmony there is.' },
        { name: 'Triadic', idx: [0, 4, 8],
          note: 'Three colors, 120° apart. Lively but balanced — circus-proof.' }
      ];
      let curS = -1;
      c.track(harmony, p => {
        const i = Math.min(2, Math.floor(M.map(p, 0.05, 0.95, 0, 1) * 3));
        if (i === curS) return;
        curS = i;
        const s = schemes[i];
        wdots.forEach((d, k) => d.classList.toggle('is-on', s.idx.includes(k)));
        poly.setAttribute('points', s.idx.map(pt).join(' '));
        schemeName.textContent = s.name;
        schemeNote.textContent = s.note;
        chips.innerHTML = s.idx.map(k => `<i style="background:hsl(${k * 30} 72% 52%)"></i>`).join('');
      });

      /* Scene C: hold to dissolve the illusion */
      const illu = root.querySelector('.co-illu');
      const illuBtn = root.querySelector('.co-illu-btn');
      const illuOn = e => { e.preventDefault(); illu.classList.add('is-flat'); };
      const illuOff = () => illu.classList.remove('is-flat');
      c.on(illuBtn, 'pointerdown', illuOn);
      c.on(illuBtn, 'pointerup', illuOff);
      c.on(illuBtn, 'pointerleave', illuOff);
      c.on(illuBtn, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') illuOn(e); });
      c.on(illuBtn, 'keyup', illuOff);

      /* Scene D: the app tries on three wardrobes */
      const outfit = root.querySelector('.co-outfit');
      const phone = root.querySelector('.co-phone');
      const outfitCap = root.querySelector('.co-outfit-cap');
      const fits = [
        ['is-rave', 'This is a meditation app. Feeling calm yet?'],
        ['is-diner', 'Now it wants to sell you fries with that.'],
        ['is-calm', 'There it is. <em>Color is the outfit meaning wears.</em>']
      ];
      let curFit = -1;
      c.track(outfit, p => {
        const i = Math.min(2, Math.floor(M.map(p, 0.05, 0.95, 0, 1) * 3));
        if (i === curFit) return;
        curFit = i;
        phone.className = 'co-phone ' + fits[i][0];
        outfitCap.innerHTML = fits[i][1];
      });

      /* Scene E: 60-30-10 assembles */
      const rule = root.querySelector('.co-rule');
      const ui = root.querySelector('.co-rule-ui');
      c.track(rule, p => {
        ui.style.setProperty('--q', M.map(p, 0.1, 0.8, 0, 1).toFixed(3));
      });

      /* Scene D: pointer mixer */
      const mixer = root.querySelector('.co-mixer');
      const mixName = root.querySelector('.co-mix-name');
      const chipEls = {
        base: root.querySelector('.cdc-base i'),
        comp: root.querySelector('.cdc-comp i'),
        a1: root.querySelector('.cdc-a1 i'),
        a2: root.querySelector('.cdc-a2 i')
      };
      let mh = 24, ml = 56, th = 24, tl = 56;
      c.on(mixer, 'pointermove', e => {
        const r = mixer.getBoundingClientRect();
        th = ((e.clientX - r.left) / r.width) * 360;
        tl = 82 - ((e.clientY - r.top) / r.height) * 58;
      });
      c.frame((t, dt) => {
        const rect = mixer.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const k = 1 - Math.pow(1 - 0.1, dt);
        mh = lerp(mh, th, k); ml = lerp(ml, tl, k);
        const H = Math.round(mh), L = Math.round(ml);
        mixer.style.background = `hsl(${H} 82% ${L}%)`;
        mixer.style.color = L > 60 ? '#14110B' : '#FDFCF8';
        mixName.textContent = `hsl(${H} 82% ${L}%)`;
        chipEls.base.style.background = `hsl(${H} 82% ${L}%)`;
        chipEls.comp.style.background = `hsl(${(H + 180) % 360} 82% ${L}%)`;
        chipEls.a1.style.background = `hsl(${(H + 330) % 360} 82% ${L}%)`;
        chipEls.a2.style.background = `hsl(${(H + 30) % 360} 82% ${L}%)`;
      });
    }
  });
})();
