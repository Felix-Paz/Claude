/* =====================================================================
   MUSEUM OF DESIGN · core
   helpers · pointer · smooth scroll · cursor · magnetics · view
   contexts (clean teardown between rooms) · color science · loader
   ===================================================================== */
window.P = (function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create('museum', 'M0,0 C0.16,1 0.3,1 1,1');
  CustomEase.create('door', 'M0,0 C0.76,0 0.24,1 1,1');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
  const pad = (n, l = 2) => String(Math.round(n)).padStart(l, '0');
  const vw = () => document.documentElement.clientWidth || innerWidth;
  const html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement, body = document.body;

  /* ---------------- pointer ---------------- */
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, px: 0, py: 0, vx: 0, vy: 0, moved: false, down: false };
  addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.moved = true; }, { passive: true });
  addEventListener('pointerdown', () => { pointer.down = true; }, { passive: true });
  addEventListener('pointerup', () => { pointer.down = false; }, { passive: true });
  gsap.ticker.add((t, dms) => {
    const dt = Math.max(dms, 1) / 1000;
    pointer.vx = lerp(pointer.vx, (pointer.x - pointer.px) / dt, 0.25);
    pointer.vy = lerp(pointer.vy, (pointer.y - pointer.py) / dt, 0.25);
    pointer.px = pointer.x; pointer.py = pointer.y;
  });

  /* ---------------- smooth scroll ---------------- */
  let lenis = null;
  function initScroll() {
    if (!reduced && window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  const scrollTop = () => { if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); window.scrollTo(0, 0); };
  function scrollToEl(el, opts = {}) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, Object.assign({ duration: 1.5, easing: t => 1 - Math.pow(2, -10 * t) }, opts));
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  const stopScroll = () => { lenis ? lenis.stop() : (root.style.overflow = 'hidden'); };
  const startScroll = () => { lenis ? lenis.start() : (root.style.overflow = ''); };
  const velocity = () => (lenis ? lenis.velocity : 0);

  /* ---------------- toast ---------------- */
  let toastTl = null;
  function toast(text, color) {
    const el = $('.toast');
    el.innerHTML = '<i></i><span></span>';
    el.lastChild.textContent = text;
    el.style.setProperty('--c', color || 'var(--volt)');
    if (!el._ready) { gsap.set(el, { xPercent: -50, yPercent: 220 }); el._ready = true; }
    if (toastTl) toastTl.kill();
    toastTl = gsap.timeline().to(el, { yPercent: 0, duration: 0.6, ease: 'museum' }).to(el, { yPercent: 220, duration: 0.5, ease: 'power3.in' }, '+=1.8');
  }
  function copy(text, color) {
    const done = () => toast('Copied ' + text, color);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => toast(text, color));
    else toast(text, color);
  }

  /* ---------------- text ---------------- */
  function splitChars(el) {
    if (el.dataset.split) return $$('.ch', el);
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const f = document.createDocumentFragment();
          for (const c of n.textContent) {
            if (c === ' ' || c === '\n') { f.appendChild(document.createTextNode(c)); continue; }
            const s = document.createElement('span');
            s.className = 'ch'; s.textContent = c;
            f.appendChild(s);
          }
          n.replaceWith(f);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    el.dataset.split = '1';
    return $$('.ch', el);
  }
  function naturalWidth(el) {
    const pw = el.style.width, pd = el.style.display;
    const flex = getComputedStyle(el).display.includes('flex');
    el.style.width = 'max-content';
    el.style.display = flex ? 'inline-flex' : 'inline-block';
    const w = el.getBoundingClientRect().width;
    el.style.width = pw; el.style.display = pd;
    return w;
  }
  // fill the measure by stretching/condensing the width axis; size gives way only at the extremes
  function fit(el, o = {}) {
    const box = o.box || el.parentElement;
    const cs = getComputedStyle(box);
    const avail = (box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) * (o.fill || 1);
    const base = o.size || vw() * (o.vw || 15) / 100;
    const maxSize = o.maxSize || base * 1.3;
    const lo0 = o.min ?? 75, hi0 = o.max ?? 125;
    el.style.fontSize = base + 'px';
    const setW = w => { el.style.fontStretch = w + '%'; el.style.setProperty('--fit-wd', w); };
    setW(hi0);
    const wHi = naturalWidth(el);
    if (wHi <= avail) { const size = Math.min(maxSize, base * avail / wHi); el.style.fontSize = size + 'px'; return { wd: hi0, size }; }
    setW(lo0);
    const wLo = naturalWidth(el);
    if (wLo >= avail) { const size = base * avail / wLo; el.style.fontSize = size + 'px'; return { wd: lo0, size }; }
    let lo = lo0, hi = hi0;
    for (let i = 0; i < 9; i++) { const m = (lo + hi) / 2; setW(m); if (naturalWidth(el) > avail) hi = m; else lo = m; }
    setW(Math.round(lo * 10) / 10);
    return { wd: lo, size: base };
  }

  /* ---------------- color science (OKLCH → sRGB, WCAG) ---------------- */
  const color = (() => {
    const toLin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const toGam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
    function raw(L, C, h) {
      const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
      const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.2914855480 * b;
      const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
      return [toGam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), toGam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), toGam(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)];
    }
    const inGamut = rgb => rgb.every(v => v >= -0.0005 && v <= 1.0005 && !isNaN(v));
    const hex = rgb => '#' + rgb.map(v => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
    function oklch(L, C, h) {
      let rgb = raw(L, C, h);
      if (!inGamut(rgb)) {
        let lo = 0, hi = C;
        for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (inGamut(raw(L, mid, h))) lo = mid; else hi = mid; }
        C = lo; rgb = raw(L, C, h);
      }
      rgb = rgb.map(v => clamp(v, 0, 1));
      return { rgb, hex: hex(rgb), L, C, h };
    }
    const lum = rgb => { const [r, g, b] = rgb.map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    return { oklch, hex, contrast };
  })();

  /* ---------------- view contexts: everything a room creates, it cleans up ---------------- */
  function ctx() {
    const g = gsap.context(() => {});
    const offs = [];
    const c = {
      gsap: fn => g.add(fn),
      on(el, ev, fn, o) { el.addEventListener(ev, fn, o); offs.push(() => el.removeEventListener(ev, fn, o)); },
      tick(fn) { const w = (t, d) => fn(t, d / 1000); gsap.ticker.add(w); offs.push(() => gsap.ticker.remove(w)); },
      visible(el, fn) {
        let on = false;
        g.add(() => ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: s => { on = s.isActive; } }));
        c.tick((t, dt) => { if (on) fn(t, Math.min(dt, 1 / 20)); });
      },
      sculpt(el, name, o) { const v = window.SCULPT ? SCULPT.mount(el, name, o) : null; if (v) offs.push(() => v.dispose()); return v; },
      own(fn) { offs.push(fn); },
      later(fn, ms) { const id = setTimeout(fn, ms); offs.push(() => clearTimeout(id)); return id; },
      onResize(fn) { let id; const w = () => { clearTimeout(id); id = setTimeout(fn, 140); }; addEventListener('resize', w); offs.push(() => { removeEventListener('resize', w); clearTimeout(id); }); },
      destroy() { offs.splice(0).reverse().forEach(f => { try { f(); } catch (e) {} }); g.revert(); }
    };
    return c;
  }

  // reveal helpers, scoped to a freshly mounted view
  function reveals(root, c) {
    if (reduced) { $$('[data-reveal]', root).forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; }); return; }
    c.gsap(() => {
      $$('[data-reveal]', root).forEach(el => {
        gsap.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, ease: 'museum', delay: +(el.dataset.reveal || 0),
          scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      });
      $$('[data-lines]', root).forEach(el => {
        SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
          onSplit: self => gsap.from(self.lines, { yPercent: 110, duration: 1.15, ease: 'museum', stagger: 0.08,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true } }) });
      });
    });
  }

  /* ---------------- cursor ---------------- */
  function initCursor() {
    if (!fine) return;
    body.classList.add('has-cursor');
    const cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-label');
    let rx = pointer.x, ry = pointer.y, shown = false;
    const sd = { x: gsap.quickSetter(dot, 'x', 'px'), y: gsap.quickSetter(dot, 'y', 'px') };
    const sr = { x: gsap.quickSetter(ring, 'x', 'px'), y: gsap.quickSetter(ring, 'y', 'px') };
    gsap.set(cur, { opacity: 0 });
    gsap.ticker.add((t, dms) => {
      const dt = dms / 1000;
      rx = damp(rx, pointer.x, 15, dt); ry = damp(ry, pointer.y, 15, dt);
      sd.x(pointer.x); sd.y(pointer.y); sr.x(rx); sr.y(ry);
      if (!shown && pointer.moved) { shown = true; gsap.to(cur, { opacity: 1, duration: 0.4 }); }
    });
    let state = '';
    document.addEventListener('pointerover', e => {
      const t = e.target.closest && e.target.closest('[data-cursor], a, button, input, [contenteditable]');
      let cls = '', txt = '';
      if (t) {
        if (t.hasAttribute('contenteditable')) cls = 'is-text';
        else if (t.dataset.cursor) { cls = 'is-label'; txt = t.dataset.cursor; }
        else cls = 'is-link';
      }
      if (cls + txt === state) return;
      state = cls + txt;
      cur.classList.remove('is-label', 'is-link', 'is-text');
      if (cls) cur.classList.add(cls);
      if (txt) label.textContent = txt;
    });
    document.addEventListener('pointerdown', () => cur.classList.add('is-down'));
    document.addEventListener('pointerup', () => cur.classList.remove('is-down'));
    root.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    root.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
  }
  function magnetic(el, strength = 0.3) {
    if (!fine || reduced) return () => {};
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const mv = e => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * strength); yTo((e.clientY - r.top - r.height / 2) * strength); };
    const lv = () => { xTo(0); yTo(0); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv);
    return () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); };
  }

  /* ---------------- controls ---------------- */
  function seg(el, onChange) {
    const thumb = $('.seg-thumb', el), btns = $$('button', el);
    const place = (b, instant) => {
      if (!thumb) return;
      if (instant) thumb.style.transition = 'none';
      thumb.style.setProperty('--x', b.offsetLeft + 'px');
      thumb.style.setProperty('--w', b.offsetWidth + 'px');
      if (instant) { void thumb.offsetWidth; thumb.style.transition = ''; }
    };
    const select = (b, silent) => { btns.forEach(x => x.setAttribute('aria-checked', String(x === b))); place(b); if (!silent) onChange(b); };
    btns.forEach(b => b.addEventListener('click', () => select(b)));
    el.addEventListener('keydown', e => {
      const i = btns.findIndex(b => b.getAttribute('aria-checked') === 'true');
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (d) { e.preventDefault(); const n = btns[(i + d + btns.length) % btns.length]; n.focus(); select(n); }
    });
    const cur = () => btns.find(b => b.getAttribute('aria-checked') === 'true') || btns[0];
    requestAnimationFrame(() => place(cur(), true));
    return { select, relayout: () => place(cur(), true) };
  }
  function rangeFill(input) {
    const set = () => input.style.setProperty('--p', ((input.value - input.min) / (input.max - input.min) * 100) + '%');
    input.addEventListener('input', set); set();
    return set;
  }

  /* ---------------- loader ---------------- */
  function runLoader(fontsReady) {
    const loader = $('#loader'), num = $('.loader-num', loader), status = $('.loader-status', loader);
    const chips = $$('.loader-chips span', loader);
    const MIN = reduced ? 300 : 1700, t0 = performance.now();
    let ready = false;
    fontsReady.then(() => { ready = true; });
    setTimeout(() => { ready = true; }, 5000);
    const lines = ['Loading the collection', 'Polishing the plinths', 'Hanging the labels', 'Unlocking the doors'];
    return new Promise(resolve => {
      const st = { p: 0, t: performance.now() };
      const tick = () => {
        const now = performance.now(), dt = Math.min(0.1, (now - st.t) / 1000); st.t = now;
        const target = clamp((now - t0) / MIN, 0, 1) * (ready ? 1 : 0.86);
        st.p = damp(st.p, target, 7, dt);
        if (target === 1 && st.p > 0.985) st.p = 1;
        num.textContent = pad(st.p * 100, 3);
        chips.forEach((c, i) => c.style.setProperty('--f', clamp(st.p * 7 - i, 0, 1).toFixed(3)));
        status.textContent = lines[Math.min(3, Math.floor(st.p * 4))];
        if (st.p < 1) { requestAnimationFrame(tick); return; }
        gsap.timeline({ onComplete: () => { loader.remove(); resolve(); } })
          .to($$('.loader-top, .loader-bottom', loader), { opacity: 0, y: -14, duration: 0.4, ease: 'power2.in' }, 0.1)
          .to(chips, { yPercent: -120, opacity: 0, duration: 0.7, ease: 'door', stagger: { each: 0.04, from: 'center' } }, 0.15)
          .to(loader, { opacity: 0, duration: 0.5 }, 0.55);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------------- bus ---------------- */
  const bus = {};
  // re-tone an element (and everything inside it) to a local bg/fg pair;
  // tone(el, null) hands it back to the room theme
  const TONE = ['--bg', '--fg', '--muted', '--line', '--line-2'];
  function tone(el, bg, fg) {
    if (!el) return;
    if (!bg) { TONE.forEach(k => el.style.removeProperty(k)); return; }
    el.style.setProperty('--bg', bg);
    el.style.setProperty('--fg', fg);
    el.style.setProperty('--muted', `color-mix(in oklab, ${fg} 62%, ${bg})`);
    el.style.setProperty('--line', `color-mix(in oklab, ${fg} 16%, transparent)`);
    el.style.setProperty('--line-2', `color-mix(in oklab, ${fg} 30%, transparent)`);
  }

  const on = (n, f) => { (bus[n] = bus[n] || []).push(f); };
  const emit = (n, d) => { (bus[n] || []).forEach(f => f(d)); };

  return {
    $, $$, clamp, lerp, damp, pad, vw, html, reduced, fine, pointer, root, body,
    initScroll, scrollTop, scrollToEl, stopScroll, startScroll, velocity, get lenis() { return lenis; },
    toast, copy, splitChars, naturalWidth, fit, color, tone, ctx, reveals,
    initCursor, magnetic, seg, rangeFill, runLoader, on, emit
  };
})();
