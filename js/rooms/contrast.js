/* =====================================================================
   MUSEUM OF DESIGN · Room 01 · Contrast
   The room's exhibits: The Dark Room, The Dial, Find “Continue”
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, damp, pointer, reduced, color } = P;

  EXHIBITS.contrast = [
    {
      title: 'The Dark Room', icon: 'move', do: 'Move the light', cls: 'ex--bleed',
      about: 'This wall has something to say, but it’s whispering: the words are almost the same color as the wall. Your torch adds light — and light adds contrast. <em>Same words, suddenly readable.</em>',
      note: 'Without contrast, <em>nothing gets noticed.</em>',
      html: () => `
        <div class="spot" data-cursor="Light">
          <div class="spot-layer spot-dim"><p class="spot-text">QUIET IS<br>EASY TO<br>IGNORE.</p></div>
          <div class="spot-layer spot-lit" aria-hidden="true"><p class="spot-text">QUIET IS<br>EASY TO<br><mark>IGNORE.</mark></p></div>
          <span class="spot-hint mono">Hold to widen the beam</span>
        </div>`,
      init(el, c) {
        const spot = $('.spot', el), lit = $('.spot-lit', spot);
        let x = 0, y = 0, r = 0, inside = false, held = false, last = 0;
        c.on(spot, 'pointerenter', () => { inside = true; });
        c.on(spot, 'pointerleave', () => { inside = false; held = false; });
        c.on(spot, 'pointermove', () => { last = performance.now(); });
        c.on(spot, 'pointerdown', () => { held = true; });
        c.on(window, 'pointerup', () => { held = false; });
        c.visible(spot, (t, dt) => {
          const b = spot.getBoundingClientRect(), live = inside && performance.now() - last < 3000;
          const tx = live ? pointer.x - b.left : b.width * (0.5 + 0.3 * Math.sin(t * 0.5));
          const ty = live ? pointer.y - b.top : b.height * (0.5 + 0.18 * Math.sin(t * 0.77 + 1));
          const m = Math.min(b.width, b.height);
          x = damp(x || tx, tx, 10, dt); y = damp(y || ty, ty, 10, dt);
          r = damp(r, m * (held ? 0.7 : live ? 0.3 : 0.24), 6, dt);
          lit.style.setProperty('--x', x.toFixed(1) + 'px');
          lit.style.setProperty('--y', y.toFixed(1) + 'px');
          lit.style.setProperty('--r', r.toFixed(1) + 'px');
        });
      }
    },
    {
      title: 'The Dial', icon: 'slide', do: 'Turn up the contrast',
      about: 'Contrast can be measured. It’s a ratio between the lighter and the darker color: 1&#8239;:&#8239;1 is invisible, 21&#8239;:&#8239;1 is black on white. Body text on a screen needs at least <em>4.5&#8239;:&#8239;1</em> — slide past it and watch the badges light up.',
      note: '4.5&#8239;:&#8239;1 is the minimum <em>for reading.</em>',
      html: () => `
        <div class="dial">
          <div class="dial-view"><p class="dial-word">Read me.</p></div>
          <div class="dial-side">
            <p class="dial-ratio"><b class="dial-num">1.00</b><span>: 1</span></p>
            <div class="dial-badges mono"><span data-min="3">Large text</span><span data-min="4.5">AA</span><span data-min="7">AAA</span></div>
            <label class="slider dial-slider"><span class="slider-top mono"><span>Contrast</span><output class="dial-out">Whisper</output></span>
              <input type="range" class="dial-range" min="0.26" max="1" step="0.002" value="0.31" aria-label="Text lightness"></label>
          </div>
        </div>`,
      init(el, c) {
        const range = $('.dial-range', el), view = $('.dial-view', el), num = $('.dial-num', el), out = $('.dial-out', el);
        const badges = $$('.dial-badges span', el);
        const bg = color.oklch(0.22, 0.03, 280);
        view.style.background = bg.hex;
        P.rangeFill(range);
        let shown = 1, target = 1;
        // the read-out chases the true ratio like a needle
        c.visible(el, (t, dt) => {
          if (Math.abs(target - shown) < 0.005) return;
          shown += (target - shown) * Math.min(1, dt * 12);
          num.textContent = shown.toFixed(2);
        });
        const update = () => {
          const fg = color.oklch(+range.value, 0.03, 280);
          view.style.color = fg.hex;
          const ratio = color.contrast(fg.rgb, bg.rgb);
          target = ratio;
          badges.forEach(b => b.classList.toggle('is-pass', ratio >= +b.dataset.min));
          out.textContent = ratio < 3 ? 'Whisper' : ratio < 4.5 ? 'Murmur' : ratio < 7 ? 'Clear' : 'Unmissable';
        };
        c.on(range, 'input', update);
        update();
        // invite: sweep the dial once when it comes into view
        if (!reduced) ScrollTrigger.create({ trigger: el, start: 'top 60%', once: true, onEnter: () => {
          gsap.to(range, { value: 0.78, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { range.dispatchEvent(new Event('input')); } });
        } });
      }
    },
    {
      title: 'Find “Continue”', icon: 'click', do: 'Find it, fast',
      about: 'Two rounds, one button to find. In round one every button looks alike, so you have to read them all. In round two one of them is different — and your eye gets there <em>before you’ve read a word.</em>',
      note: 'Contrast is a shortcut <em>for the eye.</em>',
      html: () => `
        <div class="find">
          <div class="find-bar mono">
            <span class="find-round">Round 1 of 2</span>
            <span class="find-time"><b>0.0</b>s</span>
          </div>
          <div class="find-grid"></div>
          <div class="find-result" hidden>
            <p class="find-res-line"><span class="mono">Round 1</span><b class="r1">—</b></p>
            <p class="find-res-line"><span class="mono">Round 2</span><b class="r2">—</b></p>
            <p class="find-verdict"></p>
            <button class="btn btn-ghost find-again" type="button"><span>Play again</span></button>
          </div>
        </div>`,
      init(el, c) {
        const grid = $('.find-grid', el), time = $('.find-time b', el), round = $('.find-round', el);
        const result = $('.find-result', el);
        const WORDS = ['Cancel', 'Back', 'Next', 'Skip', 'Save', 'Menu', 'Edit', 'Help', 'Share', 'Close', 'Undo', 'Retry', 'Later', 'More', 'Sort', 'Filter', 'Copy', 'Print', 'Reset', 'Apply', 'Done', 'Open', 'Send'];
        let r = 1, t0 = 0, running = false, times = [];
        const shuffle = a => a.map(v => [Math.random(), v]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
        function deal() {
          const words = shuffle(WORDS).slice(0, 23).concat(['Continue']);
          grid.innerHTML = shuffle(words).map(w => `<button type="button" class="find-btn ${w === 'Continue' && r === 2 ? 'is-hot' : ''}" data-w="${w}">${w}</button>`).join('');
          round.textContent = `Round ${r} of 2`;
          t0 = 0; running = false; time.textContent = '0.0';
          if (!reduced) gsap.fromTo($$('.find-btn', grid), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'museum', stagger: { each: 0.012, from: 'random' }, clearProps: 'transform,opacity' });
        }
        c.on(grid, 'pointerover', () => { if (!running && !t0) { running = true; t0 = performance.now(); } });
        c.on(grid, 'click', e => {
          const b = e.target.closest('.find-btn');
          if (!b) return;
          if (!running) { running = true; t0 = performance.now(); }
          if (b.dataset.w !== 'Continue') {
            gsap.fromTo(b, { x: -5 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
            return;
          }
          running = false;
          times[r - 1] = (performance.now() - t0) / 1000;
          b.classList.add('is-found');
          if (r === 1) { r = 2; c.later(deal, 700); }
          else c.later(finish, 600);
        });
        c.visible(el, () => { if (running) time.textContent = ((performance.now() - t0) / 1000).toFixed(1); });
        function finish() {
          grid.hidden = true; result.hidden = false; $('.find-bar', el).hidden = true;
          $('.r1', result).textContent = times[0].toFixed(1) + 's';
          $('.r2', result).textContent = times[1].toFixed(1) + 's';
          const k = times[0] / Math.max(0.1, times[1]);
          $('.find-verdict', result).innerHTML = k > 1.2 ? `<b>${k.toFixed(1)}×</b> faster with contrast.` : 'Fast either way — but only one of them was luck.';
          if (!reduced) gsap.from(result.children, { y: 16, opacity: 0, duration: 0.7, ease: 'museum', stagger: 0.08 });
        }
        c.on($('.find-again', el), 'click', () => { r = 1; times = []; grid.hidden = false; result.hidden = true; $('.find-bar', el).hidden = false; deal(); });
        deal();
      }
    }
  ];
})();
