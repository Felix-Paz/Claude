/* =====================================================================
   PRINCIPIA · chapters A
   preface · contents · I contrast · II hierarchy · III white space
   ===================================================================== */
P.chapters = P.chapters || [];
(function () {
  'use strict';
  const { $, $$, clamp, lerp, damp, pointer, reduced, fine, color } = P;

  // law titles share one routine: fill the measure using the width axis
  P.fitTitle = (el, opts = {}) => P.fit(el, Object.assign({ box: el.parentElement, vw: 15.5, maxSize: P.vw() * 0.21 }, opts));

  // in-view helper: run a ticker callback only while a section is on screen
  P.whileVisible = (el, fn) => {
    let on = false;
    ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: s => { on = s.isActive; } });
    gsap.ticker.add((t, dt) => { if (on) fn(t, dt / 1000); });
  };

  /* ============================== PREFACE ============================ */
  P.chapters.push(function preface() {
    const el = $('.mf-text');
    SplitText.create(el, { type: 'words', wordsClass: 'w', ignore: '.pill' });
    const parts = $$('.w, .pill', el);
    if (reduced) return;
    gsap.fromTo(parts, { opacity: 0.1 }, {
      opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: 0.6 }
    });
    $$('.pill', el).forEach(p => {
      gsap.from(p, {
        scale: 0.2, rotate: -12, ease: 'back.out(2.2)', duration: 0.9,
        scrollTrigger: { trigger: p, start: 'top 72%', toggleActions: 'play none none reverse' }
      });
    });
  });

  /* ============================== CONTENTS =========================== */
  P.chapters.push(function contents() {
    const list = $('.idx-list');
    const rows = $$('.idx-row', list);

    // rows rise in like type being set
    if (!reduced) {
      gsap.from(rows.map(r => r.children), {
        yPercent: 60, opacity: 0, duration: 1.1, ease: 'principia', stagger: 0.025,
        scrollTrigger: { trigger: list, start: 'top 80%', once: true }
      });
    }

    if (!fine) return;
    const follow = $('.poster-follow'), inner = $('.poster-follow-inner'), posters = $$('.poster', follow);
    let x = innerWidth / 2, y = innerHeight / 2, rot = 0, visible = false, current = null;
    const setX = gsap.quickSetter(follow, 'x', 'px'), setY = gsap.quickSetter(follow, 'y', 'px'), setR = gsap.quickSetter(inner, 'rotate', 'deg');
    let z = 2;
    const show = n => {
      const p = posters[n - 1];
      if (p === current) return;
      current = p;
      p.style.zIndex = ++z;
      gsap.fromTo(p, { clipPath: 'inset(100% 0% 0% 0% round 14px)' }, { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 0.75, ease: 'principia', overwrite: true });
      if (!visible) {
        visible = true;
        x = pointer.x; y = pointer.y;
        gsap.to(follow, { opacity: 1, scale: 1, duration: 0.5, ease: 'principia', overwrite: 'auto' });
      }
    };
    const hide = () => {
      visible = false; current = null;
      gsap.to(follow, { opacity: 0, scale: 0.85, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
    };
    gsap.set(follow, { scale: 0.85, xPercent: -50, yPercent: -50 });
    rows.forEach(r => r.addEventListener('pointerenter', () => show(+r.dataset.law)));
    list.addEventListener('pointerleave', hide);
    addEventListener('scroll', () => { if (visible && !list.matches(':hover')) hide(); }, { passive: true });
    gsap.ticker.add((t, dtMs) => {
      if (!visible && +gsap.getProperty(follow, 'opacity') < 0.01) return;
      const dt = dtMs / 1000;
      x = damp(x, pointer.x + 40, 9, dt);
      y = damp(y, pointer.y, 9, dt);
      rot = damp(rot, clamp(pointer.vx * 0.012, -14, 14), 6, dt);
      setX(x); setY(y); setR(rot);
    });
  });

  /* ============================ I · CONTRAST ========================= */
  P.chapters.push(function contrast() {
    const sec = $('#contrast');
    const title = $('.t-contrast', sec);
    const fitIt = () => P.fitTitle(title);
    fitIt(); P.on('resize', fitIt);

    // the volt panel wipes across the word as the chapter arrives
    gsap.fromTo($('.tc-line', title), { '--cx': '112%' }, {
      '--cx': '38%', ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top 85%', end: 'top 5%', scrub: 0.8 }
    });

    /* ---- spotlight ---- */
    const spot = $('.spot', sec), lit = $('.spot-lit', spot);
    let sx = 0, sy = 0, sr = 0, inside = false, held = false;
    const size = () => Math.min(spot.clientWidth, spot.clientHeight);
    spot.addEventListener('pointerenter', () => { inside = true; });
    spot.addEventListener('pointerleave', () => { inside = false; held = false; });
    spot.addEventListener('pointerdown', () => { held = true; });
    addEventListener('pointerup', () => { held = false; });
    let lastMove = 0;
    spot.addEventListener('pointermove', () => { lastMove = performance.now(); });
    P.whileVisible(spot, (t, dt) => {
      const r = spot.getBoundingClientRect();
      const live = inside && performance.now() - lastMove < 3000;
      const tx = live ? pointer.x - r.left : r.width * (0.5 + 0.32 * Math.sin(t * 0.45));
      const ty = live ? pointer.y - r.top : r.height * (0.52 + 0.18 * Math.sin(t * 0.71 + 1));
      const tr = size() * (held ? 0.62 : live ? 0.3 : 0.24);
      sx = damp(sx || tx, tx, 10, dt);
      sy = damp(sy || ty, ty, 10, dt);
      sr = damp(sr, tr, held ? 5 : 7, dt);
      lit.style.setProperty('--x', sx.toFixed(1) + 'px');
      lit.style.setProperty('--y', sy.toFixed(1) + 'px');
      lit.style.setProperty('--r', sr.toFixed(1) + 'px');
    });

    /* ---- ratio lab ---- */
    const lab = $('.cr-lab', sec);
    const fg = $('.cr-fg', lab), bg = $('.cr-bg', lab), hue = $('.cr-h', lab);
    const preview = $('.cr-preview', lab), num = $('.cr-ratio-num', lab);
    const badges = $$('.cr-badge', lab);
    const out = { fg: $('.cr-out-fg', lab), bg: $('.cr-out-bg', lab), h: $('.cr-out-h', lab) };
    const chips = { fg: $('.cr-chip-fg b', lab), bg: $('.cr-chip-bg b', lab) };
    [fg, bg, hue].forEach(P.rangeFill);
    const shown = { v: 0 };
    let ratioTween = null;
    const update = () => {
      const h = +hue.value;
      const cf = color.oklch(+fg.value, 0.05, h);
      const cb = color.oklch(+bg.value, 0.13, h);
      const ratio = color.contrast(cf.rgb, cb.rgb);
      preview.style.setProperty('--crfg', cf.hex);
      preview.style.setProperty('--crbg', cb.hex);
      chips.fg.textContent = cf.hex; chips.bg.textContent = cb.hex;
      out.fg.textContent = (+fg.value).toFixed(2);
      out.bg.textContent = (+bg.value).toFixed(2);
      out.h.textContent = h + '°';
      if (ratioTween) ratioTween.kill();
      ratioTween = gsap.to(shown, { v: ratio, duration: 0.5, ease: 'power3.out', onUpdate: () => { num.textContent = shown.v.toFixed(2); } });
      badges.forEach(b => b.classList.toggle('is-pass', ratio >= +b.dataset.min));
    };
    [fg, bg, hue].forEach(i => i.addEventListener('input', update));
    update();
  });

  /* =========================== II · HIERARCHY ======================== */
  P.chapters.push(function hierarchy() {
    const sec = $('#hierarchy');
    const title = $('.t-hierarchy', sec);
    const tSpan = title.firstElementChild;
    // title: from flat to ranked — each letter a little smaller and lighter
    const chars = P.splitChars(tSpan);
    const fitIt = () => {
      const keep = chars.map(c => c.getAttribute('style'));
      chars.forEach(c => { c.style.fontSize = '1em'; c.style.fontWeight = '820'; });
      P.fitTitle(title, { fill: 1 });
      chars.forEach((c, i) => { if (keep[i] != null) c.setAttribute('style', keep[i]); else c.removeAttribute('style'); });
    };
    fitIt(); P.on('resize', fitIt);
    if (!reduced) {
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 80%', end: 'top 10%', scrub: 0.8 } });
      chars.forEach((c, i) => {
        tl.fromTo(c, { fontSize: '1em', fontWeight: 820 }, { fontSize: (1 - i * 0.062) + 'em', fontWeight: Math.round(900 - i * 78), ease: 'none' }, 0);
      });
    }

    /* ---- the self-organising poster ---- */
    const frame = $('.hier-frame', sec);
    const stage = $('.hier-stage:not(.hier-measure)', frame);
    const measure = $('.hier-measure', frame);
    const live = $$('.he', stage);
    live.forEach(el => measure.appendChild(el.cloneNode(true)));
    const clones = $$('.he', measure);
    const keys = live.map(el => el.dataset.he);
    const STATES = 5;
    const PROPS = ['fontSize', 'fontWeight', 'color', 'backgroundColor', 'letterSpacing', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderRadius'];
    let states = [];

    function sizeStage() {
      const fw = frame.clientWidth, fh = frame.clientHeight;
      const w = P.vw() < 900 ? fw : Math.min(fw, fh * 1.6);
      stage.style.width = w + 'px';
      stage.style.height = (w / 1.6) + 'px';
    }
    function measureAll() {
      sizeStage();
      measure.style.width = stage.offsetWidth + 'px';
      measure.style.height = stage.offsetHeight + 'px';
      states = [];
      for (let k = 0; k < STATES; k++) {
        measure.className = 'hier-stage hier-measure s' + k;
        const snap = {};
        clones.forEach((c, i) => {
          const cs = getComputedStyle(c);
          const o = { x: c.offsetLeft, y: c.offsetTop, width: c.offsetWidth, height: c.offsetHeight };
          PROPS.forEach(p => { o[p] = cs[p]; });
          o.fontWeight = +cs.fontWeight;
          o['--art-k'] = k >= 3 ? 1 : 0;
          snap[keys[i]] = o;
        });
        states.push(snap);
      }
    }

    const steps = $$('.hs', sec), bar = $('.hs-bar i', sec);
    const capK = $('.hier-caption-k', sec), capT = $('.hier-caption-t', sec);
    const CAPS = [
      ['00 — Flat', 'Everything is the same size, so everything is equally unimportant.'],
      ['01 — Size', 'Size is the loudest dial. The headline grows, the fine print gets out of the way.'],
      ['02 — Weight', 'Weight adds pressure without taking more room.'],
      ['03 — Color', 'Color picks out the one thing you can act on.'],
      ['04 — Position', 'Position sets the route. Now the eye knows where to start — and where to finish.']
    ];
    let stepNow = -1;
    const setStep = n => {
      if (n === stepNow) return;
      stepNow = n;
      steps.forEach((s, i) => s.classList.toggle('is-on', i <= n));
      gsap.to([capK, capT], { opacity: 0, y: -8, duration: 0.18, ease: 'power2.in', onComplete: () => {
        capK.textContent = CAPS[n][0]; capT.textContent = CAPS[n][1];
        gsap.fromTo([capK, capT], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'principia', stagger: 0.05 });
      } });
    };

    const pathEl = $('.hier-path path', stage), svg = $('.hier-path', stage);
    const marks = $$('.hier-mark', stage);
    let tl = null, st = null;

    function apply(o) {
      const s = {};
      s.x = o.x; s.y = o.y;
      PROPS.forEach(p => { s[p] = o[p]; });
      s['--art-k'] = o['--art-k'];
      return s;
    }

    function build() {
      measureAll();
      const progress = st ? st.progress : 0;
      if (st) st.kill();
      if (tl) tl.kill();
      live.forEach((el, i) => {
        const o = states[0][keys[i]];
        gsap.set(el, apply(o));
        if (el.dataset.he === 'art') gsap.set(el, { width: o.width, height: o.height });
      });

      // reading route through the final layout
      const f = states[4];
      const pt = (k, ax, ay) => [f[k].x + f[k].width * ax, f[k].y + f[k].height * ay];
      const pts = [pt('title', -0.02, 0.08), pt('art', 0.5, 0.5), pt('deck', -0.02, 0.5), pt('cta', 1.04, 0.5)];
      marks.forEach((m, i) => gsap.set(m, { x: pts[i][0], y: pts[i][1], scale: 0, opacity: 0 }));
      svg.setAttribute('viewBox', `0 0 ${stage.offsetWidth} ${stage.offsetHeight}`);
      // Catmull-Rom through the four stops → a calm, continuous route
      const cr = (pp) => {
        let d = `M${pp[0][0]},${pp[0][1]}`;
        for (let i = 0; i < pp.length - 1; i++) {
          const p0 = pp[i - 1] || pp[i], p1 = pp[i], p2 = pp[i + 1], p3 = pp[i + 2] || p2;
          const t = 0.5 / 3;
          d += ` C${p1[0] + (p2[0] - p0[0]) * t},${p1[1] + (p2[1] - p0[1]) * t} ${p2[0] - (p3[0] - p1[0]) * t},${p2[1] - (p3[1] - p1[1]) * t} ${p2[0]},${p2[1]}`;
        }
        return d;
      };
      pathEl.setAttribute('d', cr(pts));
      const len = pathEl.getTotalLength();
      gsap.set(pathEl, { strokeDasharray: len + ' ' + len, strokeDashoffset: len });

      tl = gsap.timeline({ paused: true });
      for (let k = 1; k < STATES; k++) {
        live.forEach((el, i) => {
          const o = states[k][keys[i]];
          const vars = apply(o);
          if (el.dataset.he === 'art') { vars.width = o.width; vars.height = o.height; }
          tl.to(el, Object.assign(vars, { duration: 1, ease: 'power2.inOut' }), (k - 1) * 1.25 + (k === 4 ? i * 0.03 : 0));
        });
      }
      const end = (STATES - 1) * 1.25;
      tl.to(pathEl, { strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' }, end + 0.1);
      marks.forEach((m, i) => tl.to(m, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(3)' }, end + 0.1 + i * 0.4));
      tl.to({}, { duration: 0.5 });

      st = ScrollTrigger.create({
        trigger: $('.hier', sec),
        pin: $('.hier-pin', sec),
        start: 'top top',
        end: () => '+=' + Math.round(innerHeight * 4.4),
        scrub: reduced ? true : 0.7,
        animation: tl,
        onUpdate: self => {
          const p = self.progress * tl.duration();
          bar.style.setProperty('--p', self.progress.toFixed(4));
          setStep(clamp(Math.floor((p + 0.55) / 1.25), 0, 4));
        }
      });
      if (progress) st.scroll(st.start + (st.end - st.start) * progress);
    }
    build();
    setStep(0);
    P.on('resize', () => { build(); });
    if (reduced) tl.progress(1);

    // squint test
    const sq = $('.squint', sec);
    const on = e => { e.preventDefault(); stage.classList.add('is-squint'); };
    const off = () => stage.classList.remove('is-squint');
    sq.addEventListener('pointerdown', on);
    sq.addEventListener('pointerup', off);
    sq.addEventListener('pointerleave', off);
    sq.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') on(e); });
    sq.addEventListener('keyup', off);
  });

  /* =========================== III · WHITE SPACE ===================== */
  P.chapters.push(function whitespace() {
    const sec = $('#whitespace');
    const title = $('.t-space', sec);
    const words = $$('span', title);
    let gapTween = null;
    const fitIt = () => {
      title.style.columnGap = '0.22em';
      P.fitTitle(title, { fill: 0.74 });
      const avail = title.parentElement.clientWidth;
      const used = words.reduce((s, w) => s + w.getBoundingClientRect().width, 0);
      const fs = parseFloat(title.style.fontSize);
      if (gapTween) gapTween.kill();
      gsap.set(title, { justifyContent: 'flex-start' });
      title.style.columnGap = (fs * 0.22) + 'px';
      gapTween = gsap.fromTo(title, { columnGap: (fs * 0.22) + 'px' }, {
        columnGap: Math.max(fs * 0.22, avail - used - 2) + 'px', ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top 85%', end: 'top 15%', scrub: 0.8, invalidateOnRefresh: true }
      });
    };
    fitIt(); P.on('resize', fitIt);

    /* ---- the clutter ---- */
    const clutter = $('.ws-clutter', sec);
    let seed = 7;
    const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const SW = [['#FD5A32', '#0C0C14'], ['#D9FD3A', '#0C0C14'], ['#3A22FC', '#F3F0E9'], ['#0C0C14', '#F3F0E9'], ['#8DEFC5', '#0C0C14'], ['#CDBFFF', '#0C0C14'], ['#FBC49F', '#0C0C14']];
    const BADGES = ['Sale', 'New!', '−50%', 'Hot', 'Free shipping', 'Limited', 'Best seller', 'Act now', 'Trending', 'Only 2 left', 'Win', '#1', 'Deal', 'VIP', 'Bonus', 'Last chance'];
    const TAGS = ['Cookies?', 'Subscribe', 'Pop-up', 'Ad', 'Sponsored', 'Chat with us', '3 new alerts'];
    const BURSTS = ['Sale', 'Wow', 'New'];
    const BTNS = ['Click here', 'Buy now', 'Sign up'];
    const TEXT = ['amazing!!', 'you won’t believe', 'don’t miss out'];
    const plan = [].concat(
      Array(12).fill('badge'), Array(6).fill('tag'), Array(3).fill('burst'), Array(3).fill('btn'),
      Array(4).fill('dot'), Array(3).fill('sq'), Array(2).fill('line'), Array(2).fill('text'), ['arrow']
    );
    const items = plan.map((type, i) => {
      const el = document.createElement('span');
      const [bgc, fgc] = pick(SW);
      el.className = 'jk jk-' + type;
      // scatter in rings around the centre so the word is properly smothered
      const ring = i % 3, ang = rnd() * Math.PI * 2;
      const rx = [0.12, 0.27, 0.42][ring] + rnd() * 0.08, ry = rx * (0.95 + rnd() * 0.3);
      const x = 50 + Math.cos(ang) * rx * 100, y = 50 + Math.sin(ang) * ry * 100;
      el.style.setProperty('--x', clamp(x, 6, 94).toFixed(2) + '%');
      el.style.setProperty('--y', clamp(y, 10, 90).toFixed(2) + '%');
      el.style.setProperty('--r', ((rnd() - 0.5) * 34).toFixed(1) + 'deg');
      el.style.fontSize = `clamp(10px, ${(0.8 + rnd() * 0.75).toFixed(2)}vw, 24px)`;
      if (type === 'badge') { el.textContent = pick(BADGES); el.style.background = bgc; el.style.color = fgc; }
      else if (type === 'tag') { el.textContent = pick(TAGS); el.style.background = fgc === '#0C0C14' ? '#0C0C14' : bgc; el.style.color = fgc === '#0C0C14' ? bgc : fgc; }
      else if (type === 'burst') { el.textContent = pick(BURSTS); el.style.background = bgc; el.style.color = fgc; }
      else if (type === 'btn') { el.textContent = pick(BTNS); el.style.background = bgc; el.style.color = fgc; }
      else if (type === 'dot' || type === 'sq' || type === 'line') { el.style.setProperty('--s', (2 + rnd() * 4).toFixed(1) + 'em'); el.style.background = bgc; }
      else if (type === 'text') { el.textContent = pick(TEXT); el.style.color = '#FD5A32'; }
      else if (type === 'arrow') { el.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 12h15M13 5.5 19.5 12 13 18.5" fill="none" stroke="#3A22FC" stroke-width="2.4"/></svg>'; }
      el.dataset.dx = (x - 50).toFixed(2);
      el.dataset.dy = (y - 50).toFixed(2);
      clutter.appendChild(el);
      return el;
    });

    const word = $('.ws-word i', sec), countN = $('.ws-count-n', sec), countWrap = $('.ws-count', sec);
    const total = items.length;
    // pop in as the chapter arrives — loud on purpose
    if (!reduced) {
      gsap.from(items, {
        scale: 0, duration: 0.7, ease: 'back.out(2.6)', stagger: { each: 0.025, from: 'random' },
        scrollTrigger: { trigger: $('.ws', sec), start: 'top 75%', toggleActions: 'play none none reverse' }
      });
    }
    // then scroll blows it all away
    const order = items.slice().sort((a, b) => Math.hypot(a.dataset.dx, a.dataset.dy) - Math.hypot(b.dataset.dx, b.dataset.dy));
    const tl = gsap.timeline();
    order.forEach((el, i) => {
      const dx = +el.dataset.dx, dy = +el.dataset.dy, d = Math.hypot(dx, dy) || 1;
      const push = 70 + (i % 5) * 14;
      tl.to(el, {
        x: (dx / d) * push + 'vw', y: (dy / d) * push * 0.7 + 'vh',
        rotate: (i % 2 ? 1 : -1) * (40 + (i % 7) * 12),
        opacity: 0, ease: 'power2.in', duration: 1
      }, i * 0.045);
    });
    tl.fromTo(word, { scale: 1, letterSpacing: '-0.01em' }, { scale: 1.12, letterSpacing: '0.04em', ease: 'power1.inOut', duration: 1.2 }, 0.6);
    ScrollTrigger.create({
      trigger: $('.ws', sec), pin: $('.ws-pin', sec), start: 'top top',
      end: () => '+=' + Math.round(innerHeight * 1.6),
      scrub: reduced ? true : 0.6, animation: tl,
      onUpdate: self => {
        const left = Math.max(1, Math.round(total * (1 - clamp(self.progress * 1.15, 0, 1))));
        if (left <= 1) { countWrap.innerHTML = '<b class="ws-count-n">1</b> thing. Finally.'; }
        else countWrap.innerHTML = `<b class="ws-count-n">${left}</b> things competing for you`;
      }
    });

    /* ---- leading & measure ---- */
    const para = $('.ms-para', sec);
    const m = { lh: $('.ms-lh', sec), ch: $('.ms-ch', sec), ls: $('.ms-ls', sec) };
    const PRESETS = {
      cramped: { lineHeight: 1.02, maxWidth: 120, letterSpacing: -0.02 },
      comfort: { lineHeight: 1.62, maxWidth: 62, letterSpacing: 0.004 }
    };
    const s = Object.assign({}, PRESETS.cramped);
    const render = () => {
      para.style.lineHeight = s.lineHeight.toFixed(3);
      para.style.maxWidth = s.maxWidth.toFixed(1) + 'ch';
      para.style.letterSpacing = s.letterSpacing.toFixed(3) + 'em';
      m.lh.textContent = s.lineHeight.toFixed(2);
      m.ch.textContent = Math.round(s.maxWidth) + 'ch';
      m.ls.textContent = (s.letterSpacing < 0 ? '−' : '+') + Math.abs(s.letterSpacing).toFixed(3) + 'em';
    };
    render();
    P.seg($('.ms-seg', sec), b => {
      gsap.to(s, Object.assign({ duration: 1.4, ease: 'expo.inOut', onUpdate: render }, PRESETS[b.dataset.ms]));
    });
  });
})();
