/* =====================================================================
   MUSEUM OF DESIGN · rooms (template) + 01 Contrast · 02 Hierarchy ·
   03 White Space · 04 Color
   Every room has the same rhythm: an entrance hall with its sculpture,
   three exhibits (title · one instruction · one takeaway), an exit
   with a passport stamp and the door to the next room.
   ===================================================================== */
window.EXHIBITS = {};
(function () {
  'use strict';
  const { $, $$, clamp, lerp, damp, pointer, reduced, fine, color } = P;
  const M = MUSEUM;

  const CLOSING = {
    contrast: 'The eye goes to <em>the difference.</em>',
    hierarchy: 'If everything is important, <em>nothing is.</em>',
    whitespace: 'Whatever you leave empty <em>speaks loudest.</em>',
    color: 'Seen first. <em>Remembered last.</em>',
    typography: 'Typography is what language <em>looks like.</em>',
    motion: 'Good motion is felt, <em>not noticed.</em>',
    balance: 'Nothing in here was crooked. <em>You checked.</em>'
  };

  const label = w => `
    <figure class="label">
      <span class="label-k mono">Museum of Design · Permanent collection</span>
      <b class="label-t">${w[0]}<span>, 2026</span></b>
      <span class="label-m">${w[1]}</span>
      <em class="label-n">${w[2]}</em>
    </figure>`;

  /* ================= the room template ================= */
  M.define('room', {
    html(d) {
      const ex = EXHIBITS[d.id];
      const nx = M.next(d.id);
      const exhibits = ex.map((e, i) => `
        <section class="ex ${e.cls || ''}" id="ex-${i + 1}" data-ex="${i}">
          <header class="ex-head">
            <span class="ex-no mono">${d.num}.${i + 1}</span>
            <h2 class="ex-title" data-lines>${e.title}</h2>
            <span class="ex-do mono"><svg aria-hidden="true"><use href="#p-${e.icon}"/></svg>${e.do}</span>
          </header>
          <div class="ex-body">${e.html()}</div>
          ${e.note ? `<p class="ex-note" data-reveal>${e.note}</p>` : ''}
        </section>`).join('');
      return `
      <article class="room room-${d.id}">
        <section class="rm-hall">
          <div class="rm-hall-top">
            <span class="rm-sign"><b>${d.num}</b><span class="mono">Room ${d.num} of 07</span></span>
            <span class="mono rm-hall-k">${ex.length} exhibits · please touch</span>
          </div>
          <h1 class="rm-title"><span>${d.name}</span></h1>
          <div class="rm-sculpture" data-cursor="Drag to turn" aria-label="${d.work[0]}, a 3D sculpture you can turn"></div>
          <div class="rm-hall-foot">
            <p class="rm-thesis">${d.thesis}</p>
            ${label(d.work)}
          </div>
          <button class="rm-enter mono" type="button"><span>Enter</span><svg><use href="#i-down"/></svg></button>
        </section>
        ${exhibits}
        <section class="rm-exit">
          <div class="exit-pass">
            <div class="exit-stamp" style="--c:${d.ink}">
              <span class="mono">Museum of Design</span>
              <b>${d.num}</b>
              <span class="exit-stamp-name">${d.name}</span>
              <span class="mono exit-stamp-date"></span>
            </div>
          </div>
          <p class="exit-k mono">End of Room ${d.num}</p>
          <h2 class="exit-line" data-lines>${CLOSING[d.id]}</h2>
          <a class="exit-door" href="${M.href(nx.id)}" data-cursor="Enter">
            <span class="exit-door-art" aria-hidden="true"></span>
            <span class="exit-door-meta">
              <span class="mono">Next · ${nx.id === 'rotunda' ? 'Room ∞' : 'Room ' + nx.num}</span>
              <b>${nx.name}</b>
              <i>${nx.thesis}</i>
            </span>
            <span class="exit-door-go"><svg><use href="#i-arrow"/></svg></span>
          </a>
          <a class="exit-lobby mono" href="#/"><svg><use href="#i-back"/></svg>Back to the lobby</a>
        </section>
      </article>`;
    },
    init(root, c, d) {
      const hall = $('.rm-hall', root);
      const title = $('.rm-title span', root);
      const fitTitle = () => P.fit(title, { box: $('.rm-title', root), vw: 17, maxSize: P.vw() * 0.24 });
      fitTitle(); c.onResize(fitTitle);
      // the sculpture
      c.sculpt($('.rm-sculpture', root), d.sculpture);
      // entrance choreography
      if (!reduced) {
        gsap.from(title, { yPercent: 30, opacity: 0, duration: 1.4, ease: 'museum', delay: 0.15 });
        gsap.from($$('.rm-hall-top, .rm-hall-foot > *, .rm-enter', root), { y: 20, opacity: 0, duration: 1.1, ease: 'museum', stagger: 0.08, delay: 0.35 });
        // the title drifts back as you walk in
        gsap.to(title, { yPercent: -18, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: hall, start: 'top top', end: 'bottom top', scrub: true } });
      }
      c.on($('.rm-enter', root), 'click', () => P.scrollToEl($('#ex-1', root)));
      // pinned exhibits keep their wall label on screen for the whole pin
      $$('.ex--pin', root).forEach(sec => {
        const pinEl = sec.querySelector('.ex-body [class$="-pin"]');
        if (pinEl) pinEl.prepend($('.ex-head', sec));
      });
      // exhibits
      EXHIBITS[d.id].forEach((e, i) => { if (e.init) e.init($(`#ex-${i + 1} .ex-body`, root), c, $(`#ex-${i + 1}`, root)); });
      // exit: stamp the passport when the visitor actually reaches it
      const exit = $('.rm-exit', root), stamp = $('.exit-stamp', root);
      $('.exit-stamp-date', root).textContent = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const already = M.passport.has(d.id);
      if (already) stamp.classList.add('is-in');
      ScrollTrigger.create({
        trigger: exit, start: 'top 55%', once: true,
        onEnter: () => {
          const fresh = M.passport.add(d.id);
          if (reduced || already) { stamp.classList.add('is-in'); return; }
          gsap.timeline()
            .fromTo(stamp, { scale: 2.4, rotate: -24, opacity: 0 }, { scale: 1, rotate: -9, opacity: 1, duration: 0.42, ease: 'power4.in' })
            .add(() => stamp.classList.add('is-in'))
            .fromTo(exit, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.3)' });
          if (fresh) c.later(() => P.toast(`Room ${d.num} stamped · ${M.passport.count()} of 7`, d.ink), 500);
        }
      });
      c.sculpt($('.exit-door-art', root), M.next(d.id).sculpture, { auto: 0.5, drag: false });
    }
  });

  /* =========================================================
     01 · CONTRAST
     ========================================================= */
  EXHIBITS.contrast = [
    {
      title: 'The Dark Room', icon: 'move', do: 'Move the light', cls: 'ex--bleed',
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
      note: '4.5 : 1 is the minimum <em>for reading.</em>',
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
          if (!reduced) gsap.from($$('.find-btn', grid), { opacity: 0, y: 10, duration: 0.5, ease: 'museum', stagger: { each: 0.012, from: 'random' } });
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

  /* =========================================================
     02 · HIERARCHY
     ========================================================= */
  EXHIBITS.hierarchy = [
    {
      title: 'The Poster', icon: 'scroll', do: 'Scroll slowly', cls: 'ex--pin',
      note: 'Size, weight, color, position: <em>four dials.</em>',
      html: () => `
        <div class="hier">
          <div class="hier-pin">
            <div class="hier-steps mono" aria-hidden="true">
              <span class="hs">Flat</span><span class="hs">Size</span><span class="hs">Weight</span><span class="hs">Color</span><span class="hs">Position</span>
              <span class="hs-bar"><i></i></span>
            </div>
            <div class="hier-frame">
              <div class="hier-stage" aria-label="A poster that organises itself as you scroll">
                <span class="he he-kicker" data-he="kicker">Exhibition — Spring 2026</span>
                <span class="he he-title" data-he="title"><span>The Shape</span><span>of Attention</span></span>
                <span class="he he-deck" data-he="deck"><span>Forty years of posters that</span><span>made strangers stop walking.</span></span>
                <span class="he he-body" data-he="body"><span>Two hundred works from the archive,</span><span>hung in the order your eye</span><span>would have chosen anyway.</span></span>
                <span class="he he-date" data-he="date">12.03 — 30.06</span>
                <span class="he he-venue" data-he="venue">Hall B, Level 2</span>
                <span class="he he-price" data-he="price">Free entry</span>
                <span class="he he-cta" data-he="cta">Book a ticket</span>
                <span class="he he-art" data-he="art"><svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice"><circle cx="100" cy="100" r="62" class="ha-c"/><rect x="100" y="38" width="62" height="124" class="ha-r"/><circle cx="100" cy="100" r="18" class="ha-d"/></svg></span>
                <svg class="hier-path" aria-hidden="true"><path/></svg>
                <span class="hier-mark">1</span><span class="hier-mark">2</span><span class="hier-mark">3</span><span class="hier-mark">4</span>
              </div>
              <div class="hier-stage hier-measure" aria-hidden="true"></div>
            </div>
          </div>
        </div>`,
      init(el, c, sec) {
        const frame = $('.hier-frame', el), stage = $('.hier-stage:not(.hier-measure)', el), measure = $('.hier-measure', el);
        const live = $$('.he', stage);
        live.forEach(n => measure.appendChild(n.cloneNode(true)));
        const clones = $$('.he', measure), keys = live.map(n => n.dataset.he);
        const PROPS = ['fontSize', 'fontWeight', 'color', 'backgroundColor', 'letterSpacing', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRadius'];
        const steps = $$('.hs', el), bar = $('.hs-bar i', el), pathEl = $('.hier-path path', stage), svg = $('.hier-path', stage), marks = $$('.hier-mark', stage);
        let states = [], tl = null, st = null;
        function size() {
          const fw = frame.clientWidth, fh = frame.clientHeight;
          const w = Math.min(fw, fh * 1.6);
          stage.style.width = w + 'px'; stage.style.height = (w / 1.6) + 'px';
          measure.style.width = w + 'px'; measure.style.height = (w / 1.6) + 'px';
        }
        function measureAll() {
          size();
          states = [];
          for (let k = 0; k < 5; k++) {
            measure.className = 'hier-stage hier-measure s' + k;
            const snap = {};
            clones.forEach((n, i) => {
              const cs = getComputedStyle(n);
              const o = { x: n.offsetLeft, y: n.offsetTop, width: n.offsetWidth, height: n.offsetHeight };
              PROPS.forEach(p => { o[p] = cs[p]; });
              o.fontWeight = +cs.fontWeight;
              o['--art-k'] = k >= 3 ? 1 : 0;
              snap[keys[i]] = o;
            });
            states.push(snap);
          }
        }
        const vars = o => { const s = { x: o.x, y: o.y, '--art-k': o['--art-k'] }; PROPS.forEach(p => { s[p] = o[p]; }); return s; };
        function build() {
          const prog = st ? st.progress : 0;
          if (st) st.kill();
          if (tl) tl.kill();
          measureAll();
          live.forEach((n, i) => { const o = states[0][keys[i]]; gsap.set(n, vars(o)); if (keys[i] === 'art') gsap.set(n, { width: o.width, height: o.height }); });
          const f = states[4];
          const pt = (k, ax, ay) => [f[k].x + f[k].width * ax, f[k].y + f[k].height * ay];
          const pts = [pt('title', -0.02, 0.08), pt('art', 0.5, 0.5), pt('deck', -0.02, 0.5), pt('cta', 1.04, 0.5)];
          marks.forEach((m, i) => gsap.set(m, { x: pts[i][0], y: pts[i][1], scale: 0, opacity: 0 }));
          svg.setAttribute('viewBox', `0 0 ${stage.offsetWidth} ${stage.offsetHeight}`);
          let d = `M${pts[0][0]},${pts[0][1]}`;
          for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, k = 1 / 6;
            d += ` C${p1[0] + (p2[0] - p0[0]) * k},${p1[1] + (p2[1] - p0[1]) * k} ${p2[0] - (p3[0] - p1[0]) * k},${p2[1] - (p3[1] - p1[1]) * k} ${p2[0]},${p2[1]}`;
          }
          pathEl.setAttribute('d', d);
          const len = pathEl.getTotalLength();
          gsap.set(pathEl, { strokeDasharray: len + ' ' + len, strokeDashoffset: len });
          tl = gsap.timeline({ paused: true });
          for (let k = 1; k < 5; k++) live.forEach((n, i) => {
            const o = states[k][keys[i]], v = vars(o);
            if (keys[i] === 'art') { v.width = o.width; v.height = o.height; }
            tl.to(n, Object.assign(v, { duration: 1, ease: 'power2.inOut' }), (k - 1) * 1.25 + (k === 4 ? i * 0.03 : 0));
          });
          tl.to(pathEl, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' }, 5.1);
          marks.forEach((m, i) => tl.to(m, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(3)' }, 5.1 + i * 0.4));
          tl.to({}, { duration: 0.6 });
          st = ScrollTrigger.create({
            trigger: el, pin: $('.hier-pin', el), start: 'top top', end: () => '+=' + Math.round(innerHeight * 3.6),
            scrub: reduced ? true : 0.7, animation: tl,
            onUpdate: s => {
              bar.style.setProperty('--p', s.progress.toFixed(4));
              const k = clamp(Math.floor((s.progress * tl.duration() + 0.55) / 1.25), 0, 4);
              steps.forEach((x, i) => x.classList.toggle('is-on', i <= k));
            }
          });
          if (prog) st.scroll(st.start + (st.end - st.start) * prog);
        }
        build();
        steps[0].classList.add('is-on');
        c.onResize(() => { build(); ScrollTrigger.refresh(); });
      }
    },
    {
      title: 'Promote One', icon: 'click', do: 'Pick a winner',
      note: 'Importance is assigned, <em>not found.</em>',
      html: () => `
        <div class="promo">
          <button type="button" class="promo-card is-top" data-i="0"><span class="mono">Plan</span><b>Studio</b><i>For small teams</i><em>€12</em></button>
          <button type="button" class="promo-card" data-i="1"><span class="mono">Plan</span><b>Atelier</b><i>For growing teams</i><em>€24</em></button>
          <button type="button" class="promo-card" data-i="2"><span class="mono">Plan</span><b>Museum</b><i>For everyone</i><em>€48</em></button>
        </div>`,
      init(el, c) {
        const cards = $$('.promo-card', el);
        c.on(el, 'click', e => {
          const b = e.target.closest('.promo-card');
          if (!b || b.classList.contains('is-top')) return;
          cards.forEach(x => x.classList.toggle('is-top', x === b));
          if (!reduced) gsap.fromTo(b, { scale: 0.96 }, { scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.45)' });
        });
      }
    },
    {
      title: 'The Squint Test', icon: 'hold', do: 'Hold to squint',
      note: 'If the order survives the blur, <em>it works.</em>',
      html: () => `
        <div class="squint">
          <figure class="sq-card sq-flat"><span>Exhibition — Spring 2026</span><span>The Shape of Attention</span><span>Forty years of posters that made strangers stop walking.</span><span>12.03 — 30.06 · Hall B</span><span>Book a ticket</span><figcaption class="mono">Before</figcaption></figure>
          <figure class="sq-card sq-good"><span class="sq-k">Exhibition — Spring 2026</span><span class="sq-t">The Shape of Attention</span><span class="sq-d">Forty years of posters that made strangers stop walking.</span><span class="sq-m">12.03 — 30.06 · Hall B</span><span class="sq-b">Book a ticket</span><figcaption class="mono">After</figcaption></figure>
          <button type="button" class="sq-btn" data-cursor="Hold"><span class="sq-ring"></span><span class="mono">Hold</span></button>
        </div>`,
      init(el, c) {
        const sq = $('.squint', el), btn = $('.sq-btn', el);
        const on = e => { e.preventDefault(); sq.classList.add('is-squint'); };
        const off = () => sq.classList.remove('is-squint');
        c.on(btn, 'pointerdown', on); c.on(btn, 'pointerup', off); c.on(btn, 'pointerleave', off);
        c.on(btn, 'keydown', e => { if (e.key === ' ' || e.key === 'Enter') on(e); });
        c.on(btn, 'keyup', off);
      }
    }
  ];

  /* =========================================================
     03 · WHITE SPACE
     ========================================================= */
  EXHIBITS.whitespace = [
    {
      title: 'The Clutter', icon: 'scroll', do: 'Scroll to clear it', cls: 'ex--pin',
      note: 'Remove things <em>until it speaks.</em>',
      html: () => `
        <div class="ws">
          <div class="ws-pin">
            <div class="ws-clutter" aria-hidden="true"></div>
            <p class="ws-word"><i>Breathe.</i></p>
            <p class="ws-count mono" aria-hidden="true"></p>
          </div>
        </div>`,
      init(el, c) {
        const clutter = $('.ws-clutter', el), word = $('.ws-word i', el), count = $('.ws-count', el);
        let seed = 7;
        const rnd = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
        const pick = a => a[Math.floor(rnd() * a.length)];
        const SW = [['#FD5A32', '#0C0C14'], ['#D9FD3A', '#0C0C14'], ['#3A22FC', '#F3F0E9'], ['#0C0C14', '#F3F0E9'], ['#8DEFC5', '#0C0C14'], ['#CDBFFF', '#0C0C14'], ['#FBC49F', '#0C0C14']];
        const TXT = { badge: ['Sale', 'New!', '−50%', 'Hot', 'Free shipping', 'Limited', 'Best seller', 'Act now', 'Trending', 'Only 2 left', '#1', 'Deal', 'VIP', 'Bonus', 'Last chance'], tag: ['Cookies?', 'Subscribe', 'Pop-up', 'Ad', 'Sponsored', 'Chat with us'], burst: ['Sale', 'Wow', 'New'], btn: ['Click here', 'Buy now', 'Sign up'] };
        const plan = [].concat(Array(12).fill('badge'), Array(6).fill('tag'), Array(3).fill('burst'), Array(3).fill('btn'), Array(5).fill('dot'), Array(3).fill('sq'));
        const items = plan.map((type, i) => {
          const n = document.createElement('span');
          const [bg, fg] = pick(SW);
          n.className = 'jk jk-' + type;
          const ring = i % 3, a = rnd() * Math.PI * 2, rr = [0.13, 0.28, 0.42][ring] + rnd() * 0.07;
          const x = 50 + Math.cos(a) * rr * 100, y = 60 + Math.sin(a) * rr * 70;
          // keep the wall label (top of the frame) clear of the junk
          n.style.setProperty('--x', clamp(x, 6, 94) + '%'); n.style.setProperty('--y', clamp(y, 27, 92) + '%');
          n.style.setProperty('--r', ((rnd() - 0.5) * 34).toFixed(1) + 'deg');
          n.style.fontSize = `clamp(10px, ${(0.8 + rnd() * 0.7).toFixed(2)}vw, 22px)`;
          if (TXT[type]) { n.textContent = pick(TXT[type]); n.style.background = bg; n.style.color = fg; }
          else { n.style.setProperty('--s', (2 + rnd() * 3.5).toFixed(1) + 'em'); n.style.background = bg; }
          n.dataset.dx = x - 50; n.dataset.dy = y - 60;
          clutter.appendChild(n);
          return n;
        });
        const total = items.length;
        count.textContent = total + ' things want your attention';
        const order = items.slice().sort((p, q) => Math.hypot(p.dataset.dx, p.dataset.dy) - Math.hypot(q.dataset.dx, q.dataset.dy));
        const tl = gsap.timeline();
        order.forEach((n, i) => {
          const dx = +n.dataset.dx, dy = +n.dataset.dy, dd = Math.hypot(dx, dy) || 1, push = 70 + (i % 5) * 14;
          tl.to(n, { x: (dx / dd) * push + 'vw', y: (dy / dd) * push * 0.7 + 'vh', rotate: (i % 2 ? 1 : -1) * (40 + (i % 7) * 12), opacity: 0, ease: 'power2.in', duration: 1 }, i * 0.04);
        });
        tl.fromTo(word, { scale: 0.9 }, { scale: 1.15, letterSpacing: '0.03em', ease: 'power1.inOut', duration: 1.2 }, 0.6);
        ScrollTrigger.create({
          trigger: el, pin: $('.ws-pin', el), start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.5),
          scrub: reduced ? true : 0.6, animation: tl,
          onUpdate: s => {
            const left = Math.max(1, Math.round(total * (1 - clamp(s.progress * 1.15, 0, 1))));
            count.textContent = left <= 1 ? 'One thing. Finally.' : left + ' things want your attention';
          }
        });
      }
    },
    {
      title: 'One Per Wall', icon: 'click', do: 'Switch the wall',
      note: 'Space makes things look <em>expensive.</em>',
      html: () => `
        <div class="wall">
          <div class="seg wall-seg" role="radiogroup" aria-label="Wall">
            <button type="button" role="radio" aria-checked="true" data-w="sale">Yard sale</button>
            <button type="button" role="radio" aria-checked="false" data-w="gallery">Gallery</button>
            <i class="seg-thumb" aria-hidden="true"></i>
          </div>
          <div class="wall-stage"></div>
        </div>`,
      init(el, c) {
        const stage = $('.wall-stage', el);
        // twelve small works; the first one is the masterpiece
        const ART = [
          '<circle cx="50" cy="50" r="24" fill="#FD5A32"/>',
          '<rect x="30" y="30" width="40" height="40" fill="#3A22FC"/>', '<path d="M50 24 76 72H24z" fill="#0C0C14"/>', '<circle cx="50" cy="50" r="20" fill="#8DEFC5"/>',
          '<rect x="26" y="40" width="48" height="20" fill="#FBC49F"/>', '<circle cx="40" cy="44" r="14" fill="#CDBFFF"/><circle cx="60" cy="58" r="14" fill="#3A22FC"/>', '<path d="M24 70 50 30 76 70" fill="none" stroke="#FD5A32" stroke-width="6"/>',
          '<rect x="36" y="24" width="28" height="52" fill="#D9FD3A"/>', '<circle cx="50" cy="50" r="26" fill="none" stroke="#0C0C14" stroke-width="5"/>', '<rect x="28" y="28" width="44" height="44" rx="22" fill="#FD5A32"/>',
          '<path d="M30 30h40v40H30z" fill="none" stroke="#3A22FC" stroke-width="5"/>', '<circle cx="50" cy="50" r="10" fill="#0C0C14"/>'
        ];
        stage.innerHTML = ART.map((a, i) => `<figure class="frame ${i === 0 ? 'frame-hero' : ''}"><svg viewBox="0 0 100 100">${a}</svg></figure>`).join('');
        const frames = $$('.frame', stage);
        // yard-sale layout: salon hang, everything touching everything
        const SALE = [[50, 48, 15], [22, 26, 11], [37, 22, 9], [64, 20, 12], [80, 30, 10], [18, 60, 13], [33, 66, 9], [64, 70, 11], [80, 64, 12], [48, 80, 8], [8, 40, 8], [92, 50, 8]];
        const lay = mode => frames.forEach((f, i) => {
          const g = mode === 'gallery';
          const [x, y, w] = g ? (i === 0 ? [50, 50, 24] : SALE[i]) : SALE[i];
          gsap.to(f, { left: x + '%', top: y + '%', width: w + '%', opacity: g && i ? 0 : 1, scale: g && i ? 0.6 : 1, rotate: g ? 0 : ((i * 37) % 9 - 4), duration: reduced ? 0 : 1.1, ease: 'expo.inOut', delay: g ? (i ? i * 0.02 : 0.25) : (i ? 0.2 + i * 0.03 : 0) });
          f.classList.toggle('is-lit', g && i === 0);
        });
        frames.forEach((f, i) => { const [x, y, w] = SALE[i]; gsap.set(f, { left: x + '%', top: y + '%', width: w + '%', rotate: (i * 37) % 9 - 4, xPercent: -50, yPercent: -50 }); });
        P.seg($('.wall-seg', el), b => lay(b.dataset.w));
      }
    },
    {
      title: 'Leading', icon: 'click', do: 'Give it air',
      note: 'Lines need <em>air</em> too.',
      html: () => `
        <div class="lead">
          <div class="seg lead-seg" role="radiogroup" aria-label="Spacing">
            <button type="button" role="radio" aria-checked="true" data-m="tight">Cramped</button>
            <button type="button" role="radio" aria-checked="false" data-m="air">Comfortable</button>
            <i class="seg-thumb" aria-hidden="true"></i>
          </div>
          <p class="lead-para">White space costs nothing and never goes out of style. When a paragraph is cramped, the eye loses its place at the end of every line and has to hunt for the next one. Give the lines room and a comfortable length, and reading stops feeling like work.</p>
          <p class="lead-meta mono"><span>Line height <b class="lm-lh">1.00</b></span><span>Line length <b class="lm-ch">120</b> ch</span></p>
        </div>`,
      init(el, c) {
        const para = $('.lead-para', el), lh = $('.lm-lh', el), ch = $('.lm-ch', el);
        const S = { tight: { lh: 1.0, mw: 120, ls: -0.02 }, air: { lh: 1.62, mw: 54, ls: 0.004 } };
        const s = Object.assign({}, S.tight);
        const render = () => {
          para.style.lineHeight = s.lh.toFixed(3); para.style.maxWidth = s.mw.toFixed(1) + 'ch'; para.style.letterSpacing = s.ls.toFixed(3) + 'em';
          lh.textContent = s.lh.toFixed(2); ch.textContent = Math.round(s.mw);
        };
        render();
        P.seg($('.lead-seg', el), b => gsap.to(s, Object.assign({ duration: reduced ? 0 : 1.3, ease: 'expo.inOut', onUpdate: render }, S[b.dataset.m])));
      }
    }
  ];

  /* =========================================================
     04 · COLOR
     ========================================================= */
  EXHIBITS.color = [
    {
      title: 'Temperature', icon: 'scroll', do: 'Scroll through the moods', cls: 'ex--pin ex--bleed',
      note: 'Color sets the mood <em>before a word is read.</em>',
      html: () => `
        <div class="temp">
          <div class="temp-pin">
            <div class="temp-words">
              <p class="temp-w" style="--c:#FF7A1A;--f:#2A0F00">HUNGRY</p>
              <p class="temp-w" style="--c:#1F6BFF;--f:#EAF1FF">TRUSTED</p>
              <p class="temp-w" style="--c:#3FCF8E;--f:#04261A">CALM</p>
              <p class="temp-w" style="--c:#FF2E4D;--f:#FFF0F2">URGENT</p>
              <p class="temp-w" style="--c:#9B5CFF;--f:#F5EEFF">ROYAL</p>
            </div>
          </div>
        </div>`,
      init(el, c) {
        const pin = $('.temp-pin', el), words = $$('.temp-w', el), hdr = $('.hdr');
        const C = words.map(w => [getComputedStyle(w).getPropertyValue('--c').trim(), getComputedStyle(w).getPropertyValue('--f').trim()]);
        gsap.set(words, { yPercent: 40, opacity: 0 });
        gsap.set(words[0], { yPercent: 0, opacity: 1 });
        pin.style.background = C[0][0];
        const tl = gsap.timeline();
        words.forEach((w, i) => {
          if (!i) return;
          const at = i - 0.5;
          tl.to(words[i - 1], { yPercent: -40, opacity: 0, duration: 0.4, ease: 'power2.in' }, at)
            .to(w, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, at + 0.25)
            .to(pin, { backgroundColor: C[i][0], duration: 0.7, ease: 'none' }, at);
        });
        // the wall label and the header take on each mood too
        let cur = -1, inside = false;
        const paint = () => {
          const i = clamp(Math.floor(tl.time() + 0.6), 0, 4);
          if (i !== cur) { cur = i; P.tone(pin, C[i][0], C[i][1]); }
          P.tone(hdr, inside ? C[cur][0] : null, C[cur][1]);
        };
        tl.eventCallback('onUpdate', paint);
        paint();
        ScrollTrigger.create({
          trigger: el, pin, start: 'top top', end: () => '+=' + Math.round(innerHeight * 3), scrub: reduced ? true : 0.5, animation: tl,
          onToggle: s => { inside = s.isActive; paint(); }
        });
        c.own(() => P.tone(hdr, null));
      }
    },
    {
      title: 'The Wheel', icon: 'drag', do: 'Drag the hue',
      note: 'Harmony is <em>a relationship.</em>',
      html: () => `
        <div class="wheel-lab">
          <div class="wl-wheel-wrap">
            <div class="wl-wheel" data-cursor="Drag">
              <canvas class="wl-canvas" aria-hidden="true"></canvas>
              <span class="wl-dot" aria-hidden="true"></span><span class="wl-dot" aria-hidden="true"></span>
              <button class="wl-handle" type="button" role="slider" aria-label="Base hue" aria-valuemin="0" aria-valuemax="360" aria-valuenow="285"></button>
              <div class="wl-center"><b class="wl-hue">285°</b></div>
            </div>
            <div class="seg wl-seg" role="radiogroup" aria-label="Harmony">
              <button type="button" role="radio" aria-checked="true" data-h="complementary">Complement</button>
              <button type="button" role="radio" aria-checked="false" data-h="analogous">Analogous</button>
              <button type="button" role="radio" aria-checked="false" data-h="triadic">Triadic</button>
              <i class="seg-thumb" aria-hidden="true"></i>
            </div>
          </div>
          <div class="wl-side">
            <div class="wl-mock">
              <div class="wm-top"><i class="wm-logo"></i><i class="wm-nav"></i><span class="wm-pill">Sign in</span></div>
              <p class="wm-tag mono">New season</p>
              <p class="wm-h">Weekend tickets, <em>sorted.</em></p>
              <span class="wm-btn">Get started <svg><use href="#i-arrow"/></svg></span>
              <div class="wm-bars"><i style="--h:.45"></i><i style="--h:.72"></i><i style="--h:.56"></i><i style="--h:.95"></i><i style="--h:.62"></i></div>
            </div>
            <ul class="wl-swatches"></ul>
          </div>
        </div>`,
      init(el, c) {
        const wheel = $('.wl-wheel', el), cvs = $('.wl-canvas', el), ctx2 = cvs.getContext('2d');
        const handle = $('.wl-handle', el), dots = $$('.wl-dot', el), hueLbl = $('.wl-hue', el);
        const mock = $('.wl-mock', el), sw = $('.wl-swatches', el), sec = el.closest('.ex');
        const HARM = { complementary: [180, 180], analogous: [32, -32], triadic: [120, 240] };
        const st = { hue: 285, shown: 285, mode: 'complementary' };
        const cusp = {};
        const cuspL = h => { const k = Math.round(h); if (cusp[k]) return cusp[k]; let best = { L: 0.6, C: 0 }; for (let L = 0.4; L <= 0.96; L += 0.02) { const x = color.oklch(L, 0.4, k); if (x.C > best.C) best = { L, C: x.C }; } return (cusp[k] = best); };
        function draw() {
          const s = wheel.clientWidth, dpr = Math.min(devicePixelRatio || 1, 2), cc = s / 2, R = cc - 2, r = cc * 0.64;
          cvs.width = s * dpr; cvs.height = s * dpr;
          ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
          for (let a = 0; a < 360; a++) {
            ctx2.beginPath();
            ctx2.arc(cc, cc, R, (a - 0.6) * Math.PI / 180, (a + 1.2) * Math.PI / 180);
            ctx2.arc(cc, cc, r, (a + 1.2) * Math.PI / 180, (a - 0.6) * Math.PI / 180, true);
            ctx2.closePath();
            ctx2.fillStyle = color.oklch(0.76, 0.15, a).hex;
            ctx2.fill();
          }
        }
        function paint() {
          const h0 = (st.shown % 360 + 360) % 360, off = HARM[st.mode];
          const h1 = (h0 + off[0]) % 360, h2 = (h0 + off[1] + 360) % 360;
          const c1 = cuspL(h1), c2 = cuspL(h2), c0 = cuspL(h0);
          const pal = [
            color.oklch(0.95, 0.035, h0), color.oklch(clamp(lerp(c1.L, 0.86, 0.55), 0.72, 0.9), 0.13, h1),
            color.oklch(clamp(c2.L, 0.5, 0.92), c2.C * 0.92, h2), color.oklch(clamp(lerp(c0.L, 0.7, 0.5), 0.55, 0.8), 0.15, h0), color.oklch(0.2, 0.04, h0)
          ];
          const accFg = color.contrast(pal[2].rgb, pal[4].rgb) > color.contrast(pal[2].rgb, pal[0].rgb) ? pal[4].hex : pal[0].hex;
          ['--m1', '--m2', '--m3', '--m4', '--m5'].forEach((k, i) => mock.style.setProperty(k, pal[i].hex));
          mock.style.setProperty('--m3fg', accFg);
          sec.style.setProperty('--wall', pal[0].hex);
          sw.innerHTML = pal.map((p, i) => `<li><button type="button" data-copy="${p.hex}" data-cursor="Copy" style="--c:${p.hex}"><i></i><span class="mono">${['Dominant', 'Secondary', 'Accent', 'Support', 'Ink'][i]}<br>${p.hex}</span></button></li>`).join('');
          // handle + harmony dots
          const s = wheel.clientWidth, cc = s / 2, rr = cc * 0.82;
          const pos = deg => [cc + Math.cos(deg * Math.PI / 180) * rr, cc + Math.sin(deg * Math.PI / 180) * rr];
          const [hx, hy] = pos(h0);
          gsap.set(handle, { x: hx, y: hy });
          handle.style.setProperty('--hc', color.oklch(0.76, 0.15, h0).hex);
          const extra = st.mode === 'complementary' ? [off[0]] : off;
          dots.forEach((d, i) => {
            const show = i < extra.length;
            if (show) { const [x, y] = pos(h0 + extra[i]); gsap.set(d, { x, y }); d.style.setProperty('--hc', color.oklch(0.76, 0.15, (h0 + extra[i] + 360) % 360).hex); }
            d.style.opacity = show ? 1 : 0;
          });
          hueLbl.textContent = Math.round(h0) + '°';
          handle.setAttribute('aria-valuenow', Math.round(h0));
        }
        let tw = null;
        const setHue = (h, instant) => {
          const d = ((h - st.shown + 540) % 360) - 180;
          st.hue = h;
          if (tw) tw.kill();
          if (instant) { st.shown += d; paint(); return; }
          tw = gsap.to(st, { shown: st.shown + d, duration: 0.6, ease: 'museum', onUpdate: paint });
        };
        const angle = e => { const r = wheel.getBoundingClientRect(); return (Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2) * 180 / Math.PI + 360) % 360; };
        let drag = false;
        c.on(wheel, 'pointerdown', e => { drag = true; wheel.setPointerCapture(e.pointerId); setHue(angle(e)); });
        c.on(wheel, 'pointermove', e => { if (drag) setHue(angle(e), true); });
        c.on(wheel, 'pointerup', () => { drag = false; });
        c.on(handle, 'keydown', e => {
          const k = e.shiftKey ? 15 : 5;
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setHue((st.hue + k) % 360); }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setHue((st.hue - k + 360) % 360); }
        });
        c.on(sw, 'click', e => { const b = e.target.closest('[data-copy]'); if (b) P.copy(b.dataset.copy, b.dataset.copy); });
        P.seg($('.wl-seg', el), b => { st.mode = b.dataset.h; paint(); });
        draw(); paint();
        c.onResize(() => { draw(); paint(); });
        if (!reduced) ScrollTrigger.create({ trigger: wheel, start: 'top 70%', once: true, onEnter: () => {
          const o = { h: st.shown - 150 }; st.shown = o.h;
          gsap.to(o, { h: 285, duration: 2, ease: 'expo.out', onUpdate: () => { st.shown = o.h; paint(); } });
        } });
      }
    },
    {
      title: 'Same Grey', icon: 'hold', do: 'Hold to reveal',
      note: 'No color exists <em>alone.</em>',
      html: () => `
        <div class="illusion" tabindex="0" role="button" aria-label="Hold to reveal that both squares are the same grey" data-cursor="Hold">
          <div class="il-half il-dark"><span class="il-chip"></span></div>
          <div class="il-half il-light"><span class="il-chip"></span></div>
          <div class="il-bridge" aria-hidden="true"></div>
          <p class="il-cap mono"><span class="il-a">Two different greys?</span><span class="il-b">The same grey.</span></p>
        </div>`,
      init(el, c) {
        const il = $('.illusion', el);
        const hold = e => { if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return; e.preventDefault(); il.classList.add('is-held'); };
        const free = () => il.classList.remove('is-held');
        c.on(il, 'pointerdown', hold); c.on(il, 'keydown', hold);
        ['pointerup', 'pointerleave', 'keyup', 'blur'].forEach(ev => c.on(il, ev, free));
      }
    }
  ];
})();
