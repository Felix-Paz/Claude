/* =====================================================================
   MUSEUM OF DESIGN · Room 02 · Hierarchy
   The room's exhibits: The Poster, Promote One, The Squint Test
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, clamp, reduced, fine, color } = P;

  EXHIBITS.hierarchy = [
    {
      title: 'The Poster', icon: 'scroll', do: 'Scroll slowly', cls: 'ex--pin',
      about: 'A poster whose parts are all the same size, weight and color — so it reads like a shopping list. As you scroll it gets one tool at a time. The numbered dots show the order your eye now takes.',
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
            <p class="hier-cap" aria-live="polite"><span class="mono hier-cap-k">Step 0 · Flat</span><span class="hier-cap-t">Every line at the same volume. Where do you start? Exactly.</span></p>
          </div>
        </div>`,
      init(el, c, sec) {
        const frame = $('.hier-frame', el), stage = $('.hier-stage:not(.hier-measure)', el), measure = $('.hier-measure', el);
        const live = $$('.he', stage);
        live.forEach(n => measure.appendChild(n.cloneNode(true)));
        const clones = $$('.he', measure), keys = live.map(n => n.dataset.he);
        const PROPS = ['fontSize', 'fontWeight', 'color', 'backgroundColor', 'letterSpacing', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRadius'];
        const steps = $$('.hs', el), bar = $('.hs-bar i', el), pathEl = $('.hier-path path', stage), svg = $('.hier-path', stage), marks = $$('.hier-mark', stage);
        let states = [], tl = null, st = null, capAt = 0;
        const CAPS = [
          ['Flat', 'Every line at the same volume. Where do you start? Exactly.'],
          ['Size', 'The title grows, the fine print shrinks. Now there’s a first thing.'],
          ['Weight', 'Bold for what matters, light for what doesn’t.'],
          ['Color', 'One accent leads the eye to the date and the button.'],
          ['Position', 'Grouped, aligned, ordered. Follow the dots: that’s the route your eye just took.']
        ];
        const capK = $('.hier-cap-k', el), capT = $('.hier-cap-t', el);
        function caption(k) {
          if (k === capAt) return;
          capAt = k;
          capK.textContent = `Step ${k} · ${CAPS[k][0]}`;
          capT.textContent = CAPS[k][1];
          if (!reduced) gsap.fromTo([capK, capT], { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'museum', stagger: 0.04 });
        }
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
              caption(k);
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
      about: 'Three equal plans, three equal shouts — so nobody chooses. Pick one to promote: it grows, takes the color, and the others <em>step back on their own.</em>',
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
      about: 'Designers squint at their work to blur the words away and see only shapes. Hold the button: if one clear first thing survives the blur, <em>the hierarchy works.</em>',
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
})();
