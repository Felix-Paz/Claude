/* =====================================================================
   PRINCIPIA · core
   utilities · pointer · smooth scroll · themes · cursor · magnetics ·
   header · rail · menu · grid · toast · reveals · fit-to-width
   ===================================================================== */
window.P = (function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create('principia', 'M0,0 C0.16,1 0.3,1 1,1');
  CustomEase.create('curtain', 'M0,0 C0.76,0 0.24,1 1,1');

  /* ---------------- tiny helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
  const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
  const pad = (n, l = 2) => String(Math.round(n)).padStart(l, '0');
  // layout width — unlike innerWidth, never inflated by a zoomed-out mobile viewport
  const vw = () => document.documentElement.clientWidth || innerWidth;

  const mqReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = mqReduced.matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  const body = document.body;

  /* ---------------- pointer ---------------- */
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, px: innerWidth / 2, py: innerHeight / 2, vx: 0, vy: 0, speed: 0, moved: false, down: false };
  addEventListener('pointermove', e => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.moved = true;
  }, { passive: true });
  addEventListener('pointerdown', () => { pointer.down = true; }, { passive: true });
  addEventListener('pointerup', () => { pointer.down = false; }, { passive: true });
  gsap.ticker.add((t, dtMs) => {
    const dt = Math.max(dtMs, 1) / 1000;
    const vx = (pointer.x - pointer.px) / dt, vy = (pointer.y - pointer.py) / dt;
    pointer.vx = lerp(pointer.vx, vx, 0.25);
    pointer.vy = lerp(pointer.vy, vy, 0.25);
    pointer.speed = Math.hypot(pointer.vx, pointer.vy);
    pointer.px = pointer.x; pointer.py = pointer.y;
  });

  /* ---------------- smooth scroll ---------------- */
  let lenis = null;
  function initScroll() {
    if (!reduced && window.Lenis) {
      lenis = new Lenis({ lerp: 0.095, wheelMultiplier: 0.95, touchMultiplier: 1.5, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  const velocity = () => (lenis ? lenis.velocity : 0);
  function scrollTo(target, opts = {}) {
    const el = typeof target === 'string' ? $(target) : target;
    if (lenis) {
      lenis.scrollTo(el == null ? 0 : el, Object.assign({
        duration: 1.8,
        easing: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
        offset: 0
      }, opts));
    } else {
      const y = el ? el.getBoundingClientRect().top + scrollY : 0;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    }
  }
  const stopScroll = () => { lenis ? lenis.stop() : (body.style.overflow = 'hidden'); };
  const startScroll = () => { lenis ? lenis.start() : (body.style.overflow = ''); };

  /* ---------------- toast ---------------- */
  let toastTl = null;
  function toast(text, color) {
    const el = $('.toast');
    el.innerHTML = '<i></i><span></span>';
    el.querySelector('span').textContent = text;
    if (color) el.style.setProperty('--c', color); else el.style.removeProperty('--c');
    if (!el._ready) { gsap.set(el, { x: 0, y: 0, xPercent: -50, yPercent: 220 }); el._ready = true; }
    if (toastTl) toastTl.kill();
    toastTl = gsap.timeline()
      .to(el, { yPercent: 0, duration: 0.7, ease: 'principia' })
      .to(el, { yPercent: 220, duration: 0.6, ease: 'power3.in' }, '+=1.6');
  }
  function copy(text, color) {
    const done = () => toast('Copied ' + text, color);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => toast(text, color));
    } else toast(text, color);
  }

  /* ---------------- text splitting ---------------- */
  // wraps every character in <span class="ch">, keeps spaces as text
  function splitChars(el) {
    if (el.dataset.split) return $$('.ch', el);
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const c of n.textContent) {
            if (c === ' ' || c === '\n') { frag.appendChild(document.createTextNode(c)); continue; }
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = c;
            frag.appendChild(s);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('probe')) walk(n);
      });
    };
    walk(el);
    el.dataset.split = '1';
    return $$('.ch', el);
  }

  /* ---------------- fit-to-width (via the width axis) ----------------
     Titles keep one cap height and stretch or condense to fill the measure.
     If even the extremes can't fit, the size gives way instead.          */
  function naturalWidth(el) {
    const prevW = el.style.width, prevD = el.style.display;
    const isFlex = getComputedStyle(el).display.includes('flex');
    el.style.width = 'max-content';
    el.style.display = isFlex ? 'inline-flex' : 'inline-block';
    const w = el.getBoundingClientRect().width;
    el.style.width = prevW; el.style.display = prevD;
    return w;
  }
  function fit(el, opts = {}) {
    const box = opts.box || el.parentElement;
    const cs = getComputedStyle(box);
    const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const base = opts.size || (vw() * (opts.vw || 15) / 100);
    const maxSize = opts.maxSize || base * 1.32;
    const lo0 = opts.min || 75, hi0 = opts.max || 125;
    const target = avail * (opts.fill || 1);
    el.style.fontSize = base + 'px';
    const setW = w => { el.style.fontStretch = w + '%'; el.style.setProperty('--fit-wd', w); };

    setW(hi0);
    let wHi = naturalWidth(el);
    if (wHi <= target) {
      const size = Math.min(maxSize, base * target / wHi);
      el.style.fontSize = size + 'px';
      el._fit = { wd: hi0, size };
      return el._fit;
    }
    setW(lo0);
    const wLo = naturalWidth(el);
    if (wLo >= target) {
      const size = base * target / wLo;
      el.style.fontSize = size + 'px';
      el._fit = { wd: lo0, size };
      return el._fit;
    }
    let lo = lo0, hi = hi0;
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2;
      setW(mid);
      if (naturalWidth(el) > target) hi = mid; else lo = mid;
    }
    const wd = Math.round(lo * 10) / 10;
    setW(wd);
    el._fit = { wd, size: base };
    return el._fit;
  }

  /* ---------------- reveals ---------------- */
  function reveals() {
    if (reduced) {
      // everything simply present — no choreography
      gsap.set('[data-reveal]', { opacity: 1, y: 0 });
      $$('[data-count]').forEach(el => { el.textContent = pad(+el.dataset.count, +(el.dataset.pad || 2)); });
      return;
    }
    // fade-up blocks
    $$('[data-reveal]').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.2, ease: 'principia',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
    // masked line reveals
    $$('[data-reveal-lines]').forEach(el => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'rl', autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110, rotate: 2.5, transformOrigin: '0 0', duration: 1.25, ease: 'principia', stagger: 0.09,
            scrollTrigger: { trigger: el, start: 'top 86%', once: true }
          });
        }
      });
      el._split = split;
    });
    // lab headings: title lines rise, copy follows
    $$('.lab-head, .acts-head').forEach(head => {
      const title = $('.lab-title', head), kicker = $('.lab-kicker', head), copyEl = $('.lab-copy, .acts-sub', head);
      if (title) SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'rl', autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, { yPercent: 105, duration: 1.1, ease: 'principia', stagger: 0.08,
            scrollTrigger: { trigger: head, start: 'top 85%', once: true } });
        }
      });
      const rest = [kicker, copyEl].filter(Boolean);
      if (rest.length) gsap.from(rest, { opacity: 0, y: 16, duration: 1, ease: 'principia', stagger: 0.1,
        scrollTrigger: { trigger: head, start: 'top 85%', once: true } });
    });
    // section meta rules draw in
    $$('.law-meta-rule, .sec-meta-rule').forEach(el => {
      gsap.from(el, { scaleX: 0, transformOrigin: 'left center', duration: 1.6, ease: 'principia',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    // counters
    $$('[data-count]').forEach(el => {
      const to = +el.dataset.count, l = +(el.dataset.pad || 2);
      const o = { v: 0 };
      el.textContent = pad(0, l);
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: () => gsap.to(o, { v: to, duration: to > 50 ? 2.2 : 1.6, ease: 'expo.out', onUpdate: () => { el.textContent = pad(o.v, l); } })
      });
    });
  }

  /* ---------------- themes + chapters ---------------- */
  const chapterListeners = [];
  let currentTheme = null, currentChapter = null;
  function setTheme(name) {
    if (name === currentTheme) return;
    currentTheme = name;
    root.dataset.theme = name;
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = THEME_HEX[name] || THEME_HEX.ink;
  }
  const THEME_HEX = { ink: '#0C0C14', bone: '#F3F0E9', ultra: '#3A22FC', paper: '#FBFAF6', lilac: '#CDBFFF', mint: '#8DEFC5', coral: '#FD5A32', apricot: '#FBC49F' };
  function setChapter(sec) {
    const name = sec.dataset.chapter;
    if (name === currentChapter) return;
    const prev = currentChapter;
    currentChapter = name;
    const roll = $('.hdr-chapter-roll');
    if (roll) {
      const old = roll.querySelector('.hdr-chapter-name');
      const next = document.createElement('span');
      next.className = 'hdr-chapter-name';
      next.textContent = name;
      roll.appendChild(next);
      if (prev == null || reduced) { old && old.remove(); }
      else {
        gsap.set(next, { position: 'absolute', left: 0, top: 0, yPercent: 110 });
        gsap.to(old, { yPercent: -110, duration: 0.7, ease: 'principia', onComplete: () => old.remove() });
        gsap.to(next, { yPercent: 0, duration: 0.7, ease: 'principia', onComplete: () => gsap.set(next, { position: '' }) });
      }
    }
    // rail
    const id = sec.id;
    $$('.rail a').forEach(a => a.classList.toggle('is-active', a.dataset.rail === id));
    chapterListeners.forEach(fn => fn(sec));
  }
  function initThemes() {
    const sections = $$('main > [data-theme]');
    sections.forEach(sec => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 52%', end: 'bottom 52%',
        onToggle: self => {
          if (!self.isActive) return;
          setTheme(sec.dataset.theme);
          setChapter(sec);
        }
      });
    });
    setTheme('ink');
    setChapter(sections[0]);

    // rail visibility: from the first law to the last
    const rail = $('.rail');
    ScrollTrigger.create({
      trigger: '#contrast', endTrigger: '#balance', start: 'top 60%', end: 'bottom 40%',
      onToggle: self => rail.classList.toggle('is-on', self.isActive)
    });
    ScrollTrigger.create({
      trigger: '#top', start: 'top top', end: () => 'bottom top+=' + $('.hdr').offsetHeight,
      onToggle: self => $('.hdr').classList.toggle('on-hero', self.isActive)
    });
    // header progress + glass once we leave the hero
    const prog = $('.hdr-progress i'), hdr = $('.hdr');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        prog.style.setProperty('--p', self.progress.toFixed(4));
        hdr.classList.toggle('is-scrolled', self.scroll() > innerHeight * 0.85);
      }
    });
  }

  /* ---------------- clock ---------------- */
  function initClock() {
    const els = $$('.clock-time');
    const zone = $('.clock-zone');
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(new Date());
      const tz = parts.find(p => p.type === 'timeZoneName');
      if (zone && tz) zone.textContent = tz.value;
    } catch (e) {}
    const tick = () => {
      const d = new Date();
      const s = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      els.forEach(el => { el.textContent = s; });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- cursor ---------------- */
  function initCursor() {
    if (!fine) return;
    body.classList.add('has-cursor');
    const cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-label');
    let rx = pointer.x, ry = pointer.y;
    const setDot = { x: gsap.quickSetter(dot, 'x', 'px'), y: gsap.quickSetter(dot, 'y', 'px') };
    const setRing = { x: gsap.quickSetter(ring, 'x', 'px'), y: gsap.quickSetter(ring, 'y', 'px') };
    gsap.set(cur, { opacity: 0 });
    let shown = false;
    gsap.ticker.add((t, dtMs) => {
      const dt = dtMs / 1000;
      rx = damp(rx, pointer.x, 14, dt);
      ry = damp(ry, pointer.y, 14, dt);
      setDot.x(pointer.x); setDot.y(pointer.y);
      setRing.x(rx); setRing.y(ry);
      if (!shown && pointer.moved) { shown = true; gsap.to(cur, { opacity: 1, duration: 0.4 }); }
    });
    let state = '';
    const update = target => {
      const t = target && target.closest && target.closest('[data-cursor], a, button, input, [contenteditable]');
      let next = '', txt = '';
      if (t) {
        if (t.hasAttribute('contenteditable')) next = 'is-text';
        else if (t.dataset.cursor) { next = 'is-label'; txt = t.dataset.cursor; }
        else if (t.matches('input[type="range"]')) next = 'is-link';
        else next = 'is-link';
      }
      const key = next + txt;
      if (key === state) return;
      state = key;
      cur.classList.remove('is-label', 'is-link', 'is-text');
      if (next) cur.classList.add(next);
      if (txt) label.textContent = txt;
    };
    document.addEventListener('pointerover', e => update(e.target));
    document.addEventListener('pointerdown', () => cur.classList.add('is-down'));
    document.addEventListener('pointerup', () => cur.classList.remove('is-down'));
    document.documentElement.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.documentElement.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
  }

  /* ---------------- magnetic elements ---------------- */
  function initMagnetic() {
    if (!fine || reduced) return;
    $$('[data-magnetic]').forEach(el => {
      const strength = +(el.dataset.magnetic || 0) || 0.35;
      const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------------- menu ---------------- */
  let menuOpen = false, menuTl = null;
  function initMenu() {
    const menu = $('#menu'), btn = $('.hdr-menu'), close = $('.menu-close');
    const bars = $$('.menu-bg i', menu);
    const rows = $$('.menu-list a', menu);
    const extras = [$('.menu-top', menu), $('.menu-foot', menu)];
    rows.forEach(a => {
      const inner = document.createElement('span');
      inner.className = 'menu-row-in';
      while (a.firstChild) inner.appendChild(a.firstChild);
      a.appendChild(inner);
      inner.style.display = 'contents';
    });
    const open = () => {
      if (menuOpen) return;
      menuOpen = true;
      menu.classList.add('is-open');
      menu.removeAttribute('inert');
      menu.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      stopScroll();
      if (menuTl) menuTl.kill();
      menuTl = gsap.timeline()
        .fromTo(bars, { scaleY: 0, transformOrigin: 'top' }, { scaleY: 1, duration: 0.75, ease: 'curtain', stagger: { each: 0.045, from: 'end' } })
        .fromTo(rows, { yPercent: 105 }, { yPercent: 0, duration: 1, ease: 'principia', stagger: 0.05 }, 0.35)
        .fromTo(extras, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.5);
      setTimeout(() => close.focus({ preventScroll: true }), 400);
    };
    const shut = (then) => {
      if (!menuOpen) { then && then(); return; }
      menuOpen = false;
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      if (menuTl) menuTl.kill();
      menuTl = gsap.timeline({
        onComplete: () => { menu.classList.remove('is-open'); menu.setAttribute('inert', ''); }
      })
        .to(rows, { yPercent: -105, duration: 0.5, ease: 'power3.in', stagger: 0.025 })
        .to(extras, { opacity: 0, duration: 0.3 }, 0)
        .to(bars, { scaleY: 0, transformOrigin: 'bottom', duration: 0.7, ease: 'curtain', stagger: { each: 0.04, from: 'start' } }, 0.25);
      startScroll();
      if (then) setTimeout(then, 420);
    };
    btn.addEventListener('click', () => (menuOpen ? shut() : open()));
    close.addEventListener('click', () => shut());
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && menuOpen) shut();
      if (e.target.closest && e.target.closest('input, [contenteditable], textarea')) return;
      if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey) menuOpen ? shut() : open();
    });
    P.closeMenu = shut;
  }

  /* ---------------- anchors ---------------- */
  function initAnchors() {
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-scrollto]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href[0] !== '#') return;
      e.preventDefault();
      const go = () => scrollTo(href === '#top' ? 0 : href);
      if (menuOpen) P.closeMenu(go); else go();
    });
  }

  /* ---------------- grid overlay ---------------- */
  function initGrid() {
    $$('.grid-cols i').forEach((c, i) => c.style.setProperty('--i', i));
    const toggle = () => {
      const on = root.classList.toggle('grid-on');
      $$('.co-grid span').forEach(s => { s.textContent = on ? 'Hide the grid' : 'Show the grid'; });
    };
    addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input, [contenteditable], textarea')) return;
      if ((e.key === 'g' || e.key === 'G') && !e.metaKey && !e.ctrlKey) toggle();
    });
    $$('.co-grid').forEach(b => b.addEventListener('click', toggle));
  }

  /* ---------------- copy buttons ---------------- */
  function initCopy() {
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-copy]');
      if (b) copy(b.dataset.copy, b.dataset.copy);
    });
  }

  /* ---------------- segmented controls ---------------- */
  function seg(el, onChange) {
    const thumb = $('.seg-thumb', el);
    const btns = $$('button', el);
    const place = (b, instant) => {
      if (!thumb) return;
      if (instant) thumb.style.transition = 'none';
      thumb.style.setProperty('--x', b.offsetLeft + 'px');
      thumb.style.setProperty('--w', b.offsetWidth + 'px');
      if (instant) { thumb.offsetWidth; thumb.style.transition = ''; }
    };
    const select = (b, silent) => {
      btns.forEach(x => x.setAttribute('aria-checked', String(x === b)));
      place(b);
      if (!silent) onChange(b);
    };
    btns.forEach(b => b.addEventListener('click', () => select(b)));
    el.addEventListener('keydown', e => {
      const i = btns.findIndex(b => b.getAttribute('aria-checked') === 'true');
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); const n = btns[(i + 1) % btns.length]; n.focus(); select(n); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); const n = btns[(i - 1 + btns.length) % btns.length]; n.focus(); select(n); }
    });
    const cur = () => btns.find(b => b.getAttribute('aria-checked') === 'true') || btns[0];
    const relayout = () => place(cur(), true);
    addEventListener('resize', relayout);
    if (document.fonts) document.fonts.ready.then(relayout);
    requestAnimationFrame(relayout);
    return { select, relayout };
  }

  /* ---------------- range fill helper ---------------- */
  function rangeFill(input) {
    const set = () => {
      const p = (input.value - input.min) / (input.max - input.min) * 100;
      input.style.setProperty('--p', p + '%');
    };
    input.addEventListener('input', set);
    set();
    return set;
  }

  /* ---------------- loader ---------------- */
  function runLoader() {
    const loader = $('#loader');
    const num = $('.loader-num', loader);
    const status = $('.loader-status', loader);
    const chips = $$('.loader-chips span', loader);
    const curtain = $$('.curtain i');
    const MIN = reduced ? 300 : 1900;
    const t0 = performance.now();

    const fontsReady = Promise.all([
      document.fonts.load('830 100px "Mona Sans"'),
      document.fonts.load('italic 400 100px "Instrument Serif"'),
      document.fonts.load('400 100px "Instrument Serif"'),
      document.fonts.load('500 12px "Geist Mono"')
    ]).catch(() => {}).then(() => document.fonts.ready);
    let ready = false;
    fontsReady.then(() => { ready = true; status.textContent = 'Typefaces ready'; });
    const timeout = setTimeout(() => { ready = true; }, 5000);

    return new Promise(resolve => {
      const state = { p: 0 };
      const statuses = ['Loading typefaces', 'Mixing the palette', 'Calibrating the lens', 'Setting the grid'];
      const tick = () => {
        const el = performance.now() - t0;
        const target = clamp(el / MIN, 0, 1) * (ready ? 1 : 0.86);
        const now = performance.now(), dt = (now - (state.t || now)) / 1000; state.t = now;
        state.p = damp(state.p, target, 7, Math.min(dt, 0.1));
        if (target === 1 && state.p > 0.985) state.p = 1;
        num.textContent = pad(state.p * 100, 3);
        chips.forEach((c, i) => c.style.setProperty('--f', clamp(state.p * 7 - i, 0, 1).toFixed(3)));
        if (!ready) status.textContent = statuses[Math.min(statuses.length - 1, Math.floor(state.p * 4.6))];
        if (state.p < 1) { requestAnimationFrame(tick); return; }
        clearTimeout(timeout);
        // exit choreography: the palette becomes the curtain
        const tl = gsap.timeline({ onComplete: resolve });
        if (reduced) {
          tl.to(loader, { opacity: 0, duration: 0.3, onComplete: () => loader.remove() });
          body.classList.remove('is-loading');
          return;
        }
        tl.to($$('.loader-top, .loader-bottom', loader), { opacity: 0, y: -16, duration: 0.5, ease: 'power2.in' }, 0.15)
          .to(curtain, { scaleY: 1, duration: 0.85, ease: 'curtain', stagger: { each: 0.055, from: 'center' } }, 0.2)
          .add(() => { loader.remove(); body.classList.remove('is-loading'); P.emit('reveal'); })
          .set(curtain, { transformOrigin: 'top' })
          .to(curtain, { scaleY: 0, duration: 1.05, ease: 'curtain', stagger: { each: 0.06, from: 'edges' } }, '+=0.05')
          .add(() => $('.curtain').remove());
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------------- color science ----------------
     OKLCH → sRGB (Björn Ottosson's OKLab), with chroma reduced until the
     color fits the sRGB gamut, plus WCAG 2 contrast.                    */
  const color = (() => {
    const toLin = c => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const toGam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
    function oklchRaw(L, C, h) {
      const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180);
      const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
      const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
      return [
        toGam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        toGam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        toGam(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
      ];
    }
    const inGamut = rgb => rgb.every(v => v >= -0.0005 && v <= 1.0005 && !isNaN(v));
    function oklch(L, C, h) {
      let rgb = oklchRaw(L, C, h);
      if (!inGamut(rgb)) {
        let lo = 0, hi = C;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          if (inGamut(oklchRaw(L, mid, h))) lo = mid; else hi = mid;
        }
        C = lo;
        rgb = oklchRaw(L, C, h);
      }
      rgb = rgb.map(v => clamp(v, 0, 1));
      return { rgb, hex: hex(rgb), L, C, h, css: `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${Math.round(h)})` };
    }
    const hex = rgb => '#' + rgb.map(v => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
    const luminance = rgb => { const [r, g, b] = rgb.map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const contrast = (a, b) => { const la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
    return { oklch, hex, luminance, contrast };
  })();

  /* ---------------- tiny event bus ---------------- */
  const bus = {};
  const on = (n, fn) => { (bus[n] = bus[n] || []).push(fn); };
  const emit = (n, d) => { (bus[n] || []).forEach(fn => fn(d)); };

  return {
    $, $$, clamp, lerp, map, damp, pad, vw,
    reduced, fine, pointer, root, body,
    initScroll, scrollTo, velocity, stopScroll, startScroll,
    toast, copy, splitChars, fit, naturalWidth, reveals,
    initThemes, setTheme, onChapter: fn => chapterListeners.push(fn), get theme() { return currentTheme; },
    initClock, initCursor, initMagnetic, initMenu, initAnchors, initGrid, initCopy,
    seg, rangeFill, runLoader, on, emit, color,
    get lenis() { return lenis; }
  };
})();
