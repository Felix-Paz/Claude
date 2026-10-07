/* =====================================================================
   PRINCIPIA · chapters B
   IV color · V typography · VI motion · VII balance · finale
   ===================================================================== */
P.chapters = P.chapters || [];
(function () {
  'use strict';
  const { $, $$, clamp, lerp, damp, map, pointer, reduced, fine, color, root } = P;

  /* ============================= IV · COLOR ========================== */
  P.chapters.push(function colorLaw() {
    const sec = $('#color');
    const title = $('.t-color', sec);
    const fitIt = () => P.fitTitle(title, { maxSize: P.vw() * 0.26, vw: 19 });
    fitIt(); P.on('resize', fitIt);
    gsap.fromTo(title, { '--gx': '0%' }, { '--gx': '100%', ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });

    const wheel = $('.cl-wheel', sec), cvs = $('.cl-canvas', wheel), ctx = cvs.getContext('2d');
    const handle = $('.cl-handle', wheel), dots = [$('.cl-dot-2', wheel), $('.cl-dot-3', wheel)];
    const links = $('.cl-links', wheel), hueLbl = $('.cl-hue', wheel);
    const sws = $$('.sw', sec), mock = $('.cl-mock', sec), ratio = $('.cl-ratio', sec);
    const HARM = { analogous: [0, 32, -32], complementary: [0, 180, 180], triadic: [0, 120, 240], split: [0, 150, 210] };
    const ROLES = ['Dominant', 'Secondary', 'Accent', 'Support', 'Ink'];
    const state = { hue: 285, shown: 285, mode: 'complementary' };
    let palette = [];
    let active = false;

    function drawWheel() {
      const size = wheel.clientWidth, dpr = Math.min(devicePixelRatio || 1, 2);
      cvs.width = size * dpr; cvs.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const c = size / 2, R = c - 2, r = c * 0.66;
      ctx.clearRect(0, 0, size, size);
      for (let a = 0; a < 360; a += 1) {
        const col = color.oklch(0.76, 0.15, a).hex;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos((a - 0.6) * Math.PI / 180) * r, c + Math.sin((a - 0.6) * Math.PI / 180) * r);
        ctx.arc(c, c, R, (a - 0.6) * Math.PI / 180, (a + 1.2) * Math.PI / 180);
        ctx.arc(c, c, r, (a + 1.2) * Math.PI / 180, (a - 0.6) * Math.PI / 180, true);
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
      }
      // ticks every 30°
      ctx.strokeStyle = 'rgba(12,12,20,0.35)';
      ctx.lineWidth = 1;
      for (let a = 0; a < 360; a += 30) {
        const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180);
        ctx.beginPath(); ctx.moveTo(c + ca * (r - 10), c + sa * (r - 10)); ctx.lineTo(c + ca * (r - 3), c + sa * (r - 3)); ctx.stroke();
      }
    }

    // every hue has a "cusp": the lightness where sRGB lets it be most vivid.
    // yellows peak near white, blues near black — so accents follow the cusp.
    const cuspCache = {};
    function cusp(h) {
      const key = Math.round(h);
      if (cuspCache[key]) return cuspCache[key];
      let best = { L: 0.6, C: 0 };
      for (let L = 0.4; L <= 0.96; L += 0.02) {
        const c = color.oklch(L, 0.4, key);
        if (c.C > best.C) best = { L, C: c.C };
      }
      return (cuspCache[key] = best);
    }
    function build(h0, mode) {
      const off = HARM[mode];
      const h1 = (h0 + off[1] + 360) % 360, h2 = (h0 + off[2] + 360) % 360;
      const c1 = cusp(h1), c2 = cusp(h2), c0 = cusp(h0);
      return [
        color.oklch(0.945, 0.035, h0),                                  // dominant — a whisper of the base
        color.oklch(clamp(lerp(c1.L, 0.86, 0.55), 0.72, 0.9), 0.13, h1), // secondary — soft partner
        color.oklch(clamp(c2.L, 0.5, 0.92), c2.C * 0.92, h2),           // accent — at its cusp, as loud as sRGB allows
        color.oklch(clamp(lerp(c0.L, 0.7, 0.5), 0.55, 0.8), 0.15, h0),  // support — the base, mid-tone
        color.oklch(0.2, 0.04, h0)                                      // ink
      ];
    }

    function place() {
      const size = wheel.clientWidth, c = size / 2, rr = c * 0.83;
      const off = HARM[state.mode];
      const pos = deg => [c + Math.cos(deg * Math.PI / 180) * rr, c + Math.sin(deg * Math.PI / 180) * rr];
      const [hx, hy] = pos(state.shown);
      gsap.set(handle, { x: hx, y: hy });
      handle.style.setProperty('--hc', color.oklch(0.76, 0.15, state.shown).hex);
      const extra = state.mode === 'complementary' ? [off[1]] : [off[1], off[2]];
      let svg = `<line x1="${c}" y1="${c}" x2="${hx}" y2="${hy}"/>`;
      dots.forEach((d, i) => {
        if (i < extra.length) {
          const deg = state.shown + extra[i];
          const [x, y] = pos(deg);
          gsap.set(d, { x, y });
          d.style.setProperty('--hc', color.oklch(0.76, 0.15, (deg + 360) % 360).hex);
          if (d._off !== false) { d._off = false; gsap.to(d, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.5)', overwrite: 'auto' }); }
          svg += `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}"/>`;
        } else if (d._off !== true) { d._off = true; gsap.to(d, { autoAlpha: 0, scale: 0.2, duration: 0.3, ease: 'power2.in', overwrite: 'auto' }); }
      });
      links.setAttribute('viewBox', `0 0 ${size} ${size}`);
      links.innerHTML = svg;
      hueLbl.textContent = Math.round((state.shown + 360) % 360) + '°';
      handle.setAttribute('aria-valuenow', Math.round((state.hue + 360) % 360));
    }

    function paint() {
      palette = build((state.shown + 360) % 360, state.mode);
      palette.forEach((p, i) => {
        const b = sws[i];
        b.querySelector('i').style.setProperty('--sc', p.hex);
        b.querySelector('em').textContent = p.hex;
        b.dataset.copy = p.hex;
      });
      const v = ['--m1', '--m2', '--m3', '--m4', '--m5'];
      palette.forEach((p, i) => { mock.style.setProperty(v[i], p.hex); ratio.style.setProperty(v[i], p.hex); });
      // text on the accent flips to ink when the accent is light (yellows, limes)
      mock.style.setProperty('--m3fg', color.contrast(palette[2].rgb, palette[4].rgb) > color.contrast(palette[2].rgb, palette[0].rgb) ? palette[4].hex : palette[0].hex);
      title.style.setProperty('--c1', palette[2].hex);
      title.style.setProperty('--c2', palette[3].hex);
      title.style.setProperty('--c3', palette[1].hex);
      if (active) applyTheme();
    }
    function applyTheme() {
      root.style.setProperty('--bg', palette[0].hex);
      root.style.setProperty('--fg', palette[4].hex);
      root.style.setProperty('--accent', palette[2].hex);
      root.style.setProperty('--accent-fg', color.contrast(palette[2].rgb, palette[4].rgb) > color.contrast(palette[2].rgb, palette[0].rgb) ? palette[4].hex : palette[0].hex);
    }
    function clearTheme() { ['--bg', '--fg', '--accent', '--accent-fg'].forEach(p => root.style.removeProperty(p)); }

    P.onChapter(s => {
      active = s === sec;
      if (active) applyTheme(); else clearTheme();
    });

    let hueTween = null;
    function setHue(h, instant) {
      // travel the short way round
      let d = ((h - state.shown + 540) % 360) - 180;
      state.hue = h;
      if (hueTween) hueTween.kill();
      if (instant) { state.shown = state.shown + d; place(); paint(); return; }
      hueTween = gsap.to(state, { shown: state.shown + d, duration: 0.6, ease: 'principia', onUpdate: () => { place(); paint(); } });
    }

    // dragging around the wheel
    const angleAt = e => {
      const r = wheel.getBoundingClientRect();
      return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI + 360) % 360;
    };
    let dragging = false;
    wheel.addEventListener('pointerdown', e => {
      dragging = true;
      wheel.classList.add('is-drag');
      wheel.setPointerCapture(e.pointerId);
      setHue(angleAt(e));
    });
    wheel.addEventListener('pointermove', e => { if (dragging) setHue(angleAt(e), true); });
    const end = () => { dragging = false; wheel.classList.remove('is-drag'); };
    wheel.addEventListener('pointerup', end);
    wheel.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', e => {
      const step = e.shiftKey ? 15 : 5;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setHue((state.hue + step) % 360); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setHue((state.hue - step + 360) % 360); }
    });

    P.seg($('.cl-seg', sec), b => { state.mode = b.dataset.h; place(); paint(); });
    sws.forEach(b => b.addEventListener('click', () => P.copy(b.dataset.copy, b.dataset.copy)));

    const relayout = () => { drawWheel(); place(); };
    drawWheel(); place(); paint();
    P.on('resize', relayout);
    // a little welcome spin when the lab arrives
    if (!reduced) {
      ScrollTrigger.create({
        trigger: wheel, start: 'top 75%', once: true,
        onEnter: () => {
          const o = { h: state.shown - 160 };
          state.shown = o.h;
          gsap.to(o, { h: 285, duration: 2.2, ease: 'expo.out', onUpdate: () => { state.shown = o.h; place(); paint(); } });
        }
      });
    }

    // simultaneous contrast illusion
    const ill = $('.cl-illusion', sec);
    ill.tabIndex = 0;
    ill.setAttribute('role', 'button');
    ill.setAttribute('aria-label', 'Hold to reveal that the two squares are the same grey');
    const hold = e => { if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return; e.preventDefault(); ill.classList.add('is-held'); };
    const free = () => ill.classList.remove('is-held');
    ill.addEventListener('pointerdown', hold);
    ill.addEventListener('keydown', hold);
    ['pointerup', 'pointerleave', 'keyup', 'blur'].forEach(ev => ill.addEventListener(ev, free));
  });

  /* =========================== V · TYPOGRAPHY ======================== */
  P.chapters.push(function typography() {
    const sec = $('#typography');
    const title = $('.t-type', sec), tSpan = title.firstElementChild;
    const chars = P.splitChars(tSpan);
    let fitWd = 125;
    const fitIt = () => {
      chars.forEach(c => { c.style.removeProperty('--w'); c.style.removeProperty('--wd'); });
      const f = P.fitTitle(title, { min: 75, max: 125 });
      fitWd = f.wd;
    };
    fitIt(); P.on('resize', fitIt);

    // the title breathes: a weight wave, and the letters nearest the pointer swell
    const L = chars.map((el, i) => ({ el, i, w: 820, wd: fitWd, cx: 0, qw: 0, qwd: 0 }));
    const measure = () => L.forEach(l => { const r = l.el.getBoundingClientRect(); l.cx = r.left + r.width / 2; l.cy = r.top + r.height / 2 + scrollY; });
    measure(); P.on('resize', () => requestAnimationFrame(measure));
    ScrollTrigger.create({ trigger: title, start: 'top bottom', onEnter: measure, onEnterBack: measure });
    if (!reduced) {
      P.whileVisible(title, (t, dt) => {
        const tr = title.getBoundingClientRect();
        const near = pointer.y > tr.top - 200 && pointer.y < tr.bottom + 200;
        L.forEach(l => {
          const wave = Math.sin(t * 1.8 - l.i * 0.62);
          let tw = 540 + wave * 300;
          let twd = fitWd - (fitWd - 75) * (0.5 - wave * 0.5) * 0.55;
          if (near) {
            const d = Math.abs(pointer.x - l.cx) / innerWidth;
            const prox = clamp(1 - d * 4.5, 0, 1);
            tw = lerp(tw, 840, prox);
            twd = lerp(twd, fitWd, prox);
          }
          l.w = damp(l.w, tw, 8, dt);
          l.wd = damp(l.wd, Math.min(twd, fitWd), 8, dt);
          const qw = Math.round(l.w / 5) * 5, qwd = Math.round(l.wd * 2) / 2;
          if (qw !== l.qw) { l.qw = qw; l.el.style.setProperty('--w', qw); }
          if (qwd !== l.qwd) { l.qwd = qwd; l.el.style.setProperty('--wd', qwd); }
        });
      });
    }

    /* ---- the variable lab ---- */
    const word = $('.ty-word', sec), stage = $('.ty-stage', sec), code = $('.ty-code', sec);
    const inputs = $$('[data-ty]', sec);
    const outs = { w: $('.ty-o-w', sec), wd: $('.ty-o-wd', sec), s: $('.ty-o-s', sec), t: $('.ty-o-t', sec) };
    const fills = inputs.map(P.rangeFill);
    const s = { w: 640, wd: 112, s: 11, t: -0.03, serif: 0 };
    const render = () => {
      word.classList.toggle('is-serif', s.serif > 0.5);
      word.style.fontWeight = Math.round(s.w);
      word.style.fontStretch = s.wd.toFixed(1) + '%';
      word.style.letterSpacing = s.t.toFixed(3) + 'em';
      const wanted = P.vw() * s.s / 100;
      word.style.fontSize = wanted + 'px';
      const avail = stage.clientWidth - 48;
      const ww = word.scrollWidth;
      if (ww > avail) word.style.fontSize = (wanted * avail / ww) + 'px';
      outs.w.textContent = Math.round(s.w);
      outs.wd.textContent = s.wd.toFixed(1).replace('.0', '');
      outs.s.textContent = s.s.toFixed(1).replace('.0', '') + 'vw';
      outs.t.textContent = (s.t < 0 ? '−' : '') + Math.abs(s.t).toFixed(3) + 'em';
      code.textContent = s.serif > 0.5
        ? `font-family: "Instrument Serif";\nfont-style: italic;\nletter-spacing: ${s.t.toFixed(3)}em;`
        : `font-variation-settings:\n  "wght" ${Math.round(s.w)}, "wdth" ${s.wd.toFixed(1)};\nletter-spacing: ${s.t.toFixed(3)}em;`;
      inputs.forEach((inp, i) => {
        const k = inp.dataset.ty;
        if (document.activeElement !== inp) inp.value = s[k];
        fills[i]();
      });
      presets.forEach(b => b.classList.remove('is-on'));
    };
    const presets = $$('[data-preset]', sec);
    inputs.forEach(inp => inp.addEventListener('input', () => { s[inp.dataset.ty] = +inp.value; render(); }));
    const PRE = {
      shout: { w: 900, wd: 125, s: 13, t: -0.055, serif: 0 },
      whisper: { w: 200, wd: 82, s: 6.5, t: 0.14, serif: 0 },
      editorial: { w: 400, wd: 100, s: 14, t: -0.02, serif: 1 },
      poster: { w: 820, wd: 75, s: 16, t: -0.035, serif: 0 }
    };
    presets.forEach(b => b.addEventListener('click', () => {
      const p = PRE[b.dataset.preset];
      s.serif = p.serif;
      gsap.to(s, { w: p.w, wd: p.wd, s: p.s, t: p.t, duration: reduced ? 0.01 : 1.1, ease: 'expo.inOut', onUpdate: render, onComplete: () => { render(); b.classList.add('is-on'); } });
    }));
    word.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); word.blur(); } });
    word.addEventListener('input', () => {
      if (word.textContent.length > 16) word.textContent = word.textContent.slice(0, 16);
      render();
    });
    word.addEventListener('blur', () => { if (!word.textContent.trim()) { word.textContent = 'Gestalt'; render(); } });
    render();
    P.on('resize', render);

    /* ---- words that act (horizontal) ---- */
    const acts = $('.acts', sec), track = $('.acts-track', sec);
    const dist = () => Math.max(0, track.scrollWidth - P.vw());
    const scrollTween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: acts, pin: $('.acts-pin', sec), start: 'top top', end: () => '+=' + Math.round(dist() * 0.72), scrub: reduced ? true : 0.6, invalidateOnRefresh: true }
    });
    const act = name => $(`.act[data-act="${name}"] .act-w`, sec);
    const st = { containerAnimation: scrollTween, start: 'left 88%', end: 'center 48%', scrub: true };
    const by = (name, from, to) => gsap.fromTo(act(name), from, Object.assign({ ease: 'none', scrollTrigger: Object.assign({ trigger: act(name).parentElement }, st) }, to));
    by('bigger', { scale: 0.35 }, { scale: 1.45 });
    by('heavy', { fontWeight: 200 }, { fontWeight: 900 });
    by('wide', { fontStretch: '75%' }, { fontStretch: '125%' });
    by('space', { letterSpacing: '-0.06em' }, { letterSpacing: '0.42em' });
    by('light', { fontWeight: 900, y: 70 }, { fontWeight: 200, y: -70 });
    by('narrow', { fontStretch: '125%' }, { fontStretch: '75%' });
    const fallChars = P.splitChars(act('fall'));
    gsap.fromTo(fallChars, { y: 0, rotate: 0 }, {
      y: (i) => ['85%', '140%', '60%', '120%'][i % 4], rotate: (i) => [14, -22, 8, -12][i % 4],
      ease: 'power2.in', stagger: 0.12,
      scrollTrigger: Object.assign({ trigger: act('fall').parentElement }, st)
    });
    const it = $('.act[data-act="italic"]', sec);
    gsap.timeline({ scrollTrigger: Object.assign({ trigger: it }, st) })
      .fromTo($('.aw-sans', it), { skewX: 0, opacity: 1 }, { skewX: -16, opacity: 0, ease: 'power1.in', duration: 1 })
      .fromTo($('.aw-serif', it), { opacity: 0, x: 30 }, { opacity: 1, x: 0, ease: 'power1.out', duration: 0.8 }, 0.45);
  });

  /* ============================= VI · MOTION ========================= */
  P.chapters.push(function motion() {
    const sec = $('#motion');
    const title = $('.t-motion', sec), tSpan = title.firstElementChild;
    const fitIt = () => P.fitTitle(title, { maxSize: P.vw() * 0.235, vw: 18 });
    fitIt(); P.on('resize', fitIt);
    const chars = P.splitChars(tSpan);
    if (!reduced) {
      gsap.from(chars, {
        yPercent: -130, rotate: i => (i % 2 ? 18 : -14), opacity: 0,
        duration: 1.5, ease: 'elastic.out(1, 0.38)', stagger: 0.07,
        scrollTrigger: { trigger: title, start: 'top 82%', toggleActions: 'play none none reverse' }
      });
      // poke a letter, it jumps; click the word, they all do
      chars.forEach((c, i) => {
        c.addEventListener('pointerenter', () => {
          gsap.timeline()
            .to(c, { yPercent: -22, scaleY: 1.08, scaleX: 0.94, duration: 0.22, ease: 'power2.out' })
            .to(c, { yPercent: 0, scaleY: 1, scaleX: 1, duration: 1, ease: 'elastic.out(1.1, 0.3)' });
        });
      });
      title.addEventListener('click', () => {
        chars.forEach((c, i) => gsap.timeline({ delay: i * 0.05 })
          .to(c, { yPercent: -45, rotate: i % 2 ? 8 : -8, duration: 0.3, ease: 'power2.out' })
          .to(c, { yPercent: 0, rotate: 0, duration: 1.2, ease: 'elastic.out(1, 0.28)' }));
      });
      title.style.cursor = 'pointer';
      title.dataset.cursor = 'Poke';
    }

    /* ---- easing race ---- */
    const lanes = $$('.ez-lane', sec).map(l => {
      const ease = gsap.parseEase(l.dataset.ease);
      const path = $('.ez-curve path', l), dot = $('.ez-curve circle', l);
      let d = '';
      for (let i = 0; i <= 48; i++) {
        const t = i / 48;
        d += (i ? 'L' : 'M') + (6 + t * 48).toFixed(2) + ',' + (54 - ease(t) * 48).toFixed(2);
      }
      path.setAttribute('d', d);
      dot.setAttribute('cx', 6); dot.setAttribute('cy', 54);
      return { el: l, ease, ball: $('.ez-ball', l), track: $('.ez-track', l), dot };
    });
    const prog = { t: 0 };
    const draw = () => {
      lanes.forEach(L => {
        const e = L.ease(prog.t);
        const span = L.track.clientWidth - L.ball.offsetWidth;
        gsap.set(L.ball, { x: e * span });
        L.dot.setAttribute('cx', (6 + prog.t * 48).toFixed(2));
        L.dot.setAttribute('cy', (54 - e * 48).toFixed(2));
      });
    };
    let race = null;
    const run = () => {
      if (race) race.kill();
      race = gsap.timeline({ repeat: -1, repeatDelay: 0.2 })
        .fromTo(prog, { t: 0 }, { t: 1, duration: 1.4, ease: 'none', onUpdate: draw })
        .to({}, { duration: 1.1 })
        .to(prog, { t: 0, duration: 0.7, ease: 'power3.inOut', onUpdate: draw });
    };
    draw();
    ScrollTrigger.create({
      trigger: $('.ez-lab', sec), start: 'top 70%', end: 'bottom top',
      onEnter: () => { if (!race) run(); else race.play(); },
      onEnterBack: () => race && race.play(),
      onLeave: () => race && race.pause(),
      onLeaveBack: () => race && race.pause()
    });
    $('.ez-run', sec).addEventListener('click', run);
    P.on('resize', draw);

    /* ---- spring ---- */
    const stage = $('.sp-stage', sec), ball = $('.sp-ball', sec), band = $('.sp-band path', sec);
    const bandSvg = $('.sp-band', sec), vOut = $('.sp-v', sec);
    const kIn = $('.sp-k', sec), cIn = $('.sp-c', sec);
    [kIn, cIn].forEach(P.rangeFill);
    const ok = $('.sp-o-k', sec), oc = $('.sp-o-c', sec);
    let K = +kIn.value, C = +cIn.value;
    kIn.addEventListener('input', () => { K = +kIn.value; ok.textContent = K; });
    cIn.addEventListener('input', () => { C = +cIn.value; oc.textContent = C; });
    const b = { x: -140, y: -90, vx: 0, vy: 0, drag: false, ox: 0, oy: 0, lx: 0, ly: 0, lt: 0 };
    const centre = () => ({ x: stage.clientWidth / 2, y: stage.clientHeight / 2 });
    ball.addEventListener('pointerdown', e => {
      e.preventDefault();
      ball.setPointerCapture(e.pointerId);
      const r = stage.getBoundingClientRect(), c = centre();
      b.drag = true;
      b.ox = (e.clientX - r.left - c.x) - b.x;
      b.oy = (e.clientY - r.top - c.y) - b.y;
      b.lx = e.clientX; b.ly = e.clientY; b.lt = performance.now();
      b.vx = b.vy = 0;
    });
    ball.addEventListener('pointermove', e => {
      if (!b.drag) return;
      const r = stage.getBoundingClientRect(), c = centre();
      const nx = clamp(e.clientX - r.left - c.x - b.ox, -c.x + 46, c.x - 46);
      const ny = clamp(e.clientY - r.top - c.y - b.oy, -c.y + 46, c.y - 46);
      const now = performance.now(), dt = Math.max(8, now - b.lt) / 1000;
      b.vx = lerp(b.vx, (nx - b.x) / dt, 0.5);
      b.vy = lerp(b.vy, (ny - b.y) / dt, 0.5);
      b.x = nx; b.y = ny; b.lt = now;
    });
    const release = () => { b.drag = false; };
    ball.addEventListener('pointerup', release);
    ball.addEventListener('pointercancel', release);
    let vShown = 0;
    P.whileVisible(stage, (t, dt) => {
      dt = Math.min(dt, 1 / 30);
      if (!b.drag) {
        const n = 6, h = dt / n;
        for (let i = 0; i < n; i++) {
          b.vx += (-K * b.x - C * b.vx) * h;
          b.vy += (-K * b.y - C * b.vy) * h;
          b.x += b.vx * h; b.y += b.vy * h;
        }
      }
      const c = centre();
      const sp = Math.hypot(b.vx, b.vy);
      const ang = Math.atan2(b.vy, b.vx) * 180 / Math.PI;
      const sq = clamp(sp / 4200, 0, 0.42);
      gsap.set(ball, { x: c.x + b.x, y: c.y + b.y, rotate: ang, scaleX: 1 + sq, scaleY: 1 - sq * 0.6 });
      const dist = Math.hypot(b.x, b.y);
      bandSvg.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
      const mx = c.x + b.x / 2, my = c.y + b.y / 2 + Math.min(60, dist * 0.08);
      band.setAttribute('d', `M${c.x},${c.y} Q${mx},${my} ${c.x + b.x},${c.y + b.y}`);
      band.setAttribute('stroke-width', clamp(9 - dist / 55, 1.4, 9).toFixed(2));
      vShown = lerp(vShown, sp, 0.2);
      vOut.textContent = Math.round(vShown);
    });

    /* ---- velocity marquee ---- */
    const mq = $('.marquee', sec), mt = $('.marquee-track', sec);
    const unit = mt.firstElementChild;
    const fill = () => {
      while (mt.children.length > 1) mt.lastChild.remove();
      const n = Math.ceil((P.vw() * 2) / Math.max(1, unit.offsetWidth)) + 1;
      for (let i = 0; i < n; i++) mt.appendChild(unit.cloneNode(true));
    };
    fill(); P.on('resize', fill);
    let mx = 0, skew = 0, dir = -1;
    P.whileVisible(mq, (t, dt) => {
      const v = P.velocity();
      if (Math.abs(v) > 0.4) dir = v > 0 ? -1 : 1;
      const speed = 70 + Math.min(1600, Math.abs(v) * 55);
      mx += dir * speed * dt;
      const w = unit.offsetWidth;
      if (mx <= -w) mx += w;
      if (mx > 0) mx -= w;
      skew = damp(skew, clamp(-v * 0.5, -16, 16), 8, dt);
      gsap.set(mt, { x: mx, skewX: reduced ? 0 : skew });
    });
  });

  /* ============================= VII · BALANCE ======================== */
  P.chapters.push(function balance() {
    const sec = $('#balance');
    const title = $('.t-balance', sec), beamTitle = $('.tb-beam', sec);
    const fitIt = () => P.fitTitle(title, { maxSize: P.vw() * 0.2 });
    fitIt(); P.on('resize', fitIt);
    let tilt = reduced ? 0 : 7, tv = 0;
    P.whileVisible(title, (t, dt) => {
      const r = title.getBoundingClientRect();
      const inside = pointer.y > r.top - 160 && pointer.y < r.bottom + 160 && fine;
      const target = inside ? clamp((pointer.x - (r.left + r.width / 2)) / r.width * 9, -6, 6) : 0;
      tv += ((target - tilt) * 70 - tv * 7) * Math.min(dt, 1 / 30);
      tilt += tv * Math.min(dt, 1 / 30);
      beamTitle.style.setProperty('--tilt', tilt.toFixed(3) + 'deg');
    });

    const stage = $('.bl-stage', sec), beam = $('.bl-beam', sec), tray = $('.bl-tray', sec);
    const pieces = $$('.bl-piece', sec);
    const status = $('.bl-status-t', sec);
    const out = { l: $('.bl-l', sec), r: $('.bl-r', sec), a: $('.bl-a', sec) };
    const meter = $('.bl-meter i', sec), meterBox = $('.bl-meter', sec);
    let ang = 0, av = 0, balancedOnce = false;
    const onBeam = new Map(); // piece -> normalized position (-1 … 1)

    pieces.forEach(p => { p.tabIndex = 0; });

    const torque = () => { let l = 0, r = 0; onBeam.forEach((x, p) => { const t = +p.dataset.m * x; if (t < 0) l -= t; else r += t; }); return { l, r, net: r - l }; };

    function layoutOnBeam(p) {
      const x = onBeam.get(p), bw = beam.offsetWidth;
      p.style.left = (bw / 2 + x * bw / 2 - p.offsetWidth / 2) + 'px';
    }
    function attach(p, xNorm, fromRect) {
      onBeam.set(p, clamp(xNorm, -0.96, 0.96));
      p.classList.add('on-beam');
      beam.appendChild(p);
      p.style.top = '';
      layoutOnBeam(p);
      if (fromRect) {
        const to = p.getBoundingClientRect();
        gsap.fromTo(p, { x: fromRect.left - to.left, y: fromRect.top - to.top, rotate: -ang }, { x: 0, y: 0, rotate: 0, duration: 0.7, ease: 'bounce.out' });
      }
      update();
    }
    function toTray(p, fromRect) {
      onBeam.delete(p);
      p.classList.remove('on-beam');
      p.style.left = p.style.top = p.style.position = '';
      const order = pieces.indexOf(p);
      const after = pieces.slice(order + 1).find(q => q.parentElement === tray);
      tray.insertBefore(p, after || null);
      if (fromRect) {
        const to = p.getBoundingClientRect();
        gsap.fromTo(p, { x: fromRect.left - to.left, y: fromRect.top - to.top }, { x: 0, y: 0, rotate: 0, duration: 0.8, ease: 'expo.out' });
      }
      update();
    }

    // pointer dragging
    pieces.forEach(p => {
      let drag = null;
      p.addEventListener('pointerdown', e => {
        e.preventDefault();
        p.setPointerCapture(e.pointerId);
        const r = p.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        onBeam.delete(p);
        gsap.killTweensOf(p);
        p.classList.remove('on-beam');
        p.classList.add('is-drag');
        stage.appendChild(p);
        gsap.set(p, { x: 0, y: 0, rotate: 0 });
        p.style.position = 'absolute';
        p.style.left = (r.left - sr.left) + 'px';
        p.style.top = (r.top - sr.top) + 'px';
        drag = { dx: e.clientX - r.left, dy: e.clientY - r.top, sr };
        update();
      });
      p.addEventListener('pointermove', e => {
        if (!drag) return;
        const sr = stage.getBoundingClientRect();
        p.style.left = clamp(e.clientX - sr.left - drag.dx, -20, sr.width - p.offsetWidth + 20) + 'px';
        p.style.top = clamp(e.clientY - sr.top - drag.dy, -20, sr.height - p.offsetHeight + 20) + 'px';
      });
      const drop = () => {
        if (!drag) return;
        drag = null;
        p.classList.remove('is-drag');
        const r = p.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const beamW = beam.offsetWidth;
        const pivotX = sr.left + beam.offsetLeft + beamW / 2;
        const xNorm = (cx - pivotX) / (beamW / 2) / Math.cos(ang * Math.PI / 180);
        const aboveTray = r.bottom < sr.top + sr.height * 0.8;
        if (aboveTray && Math.abs(xNorm) <= 1.05) attach(p, xNorm, r);
        else toTray(p, r);
      };
      p.addEventListener('pointerup', drop);
      p.addEventListener('pointercancel', drop);
      // keyboard: Enter places / removes, arrows slide along the beam
      p.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const r = p.getBoundingClientRect();
          if (onBeam.has(p)) toTray(p, r);
          else attach(p, pieces.indexOf(p) % 2 ? 0.6 : -0.6, r);
          p.focus({ preventScroll: true });
        }
        if (onBeam.has(p) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          e.preventDefault();
          onBeam.set(p, clamp(onBeam.get(p) + (e.key === 'ArrowLeft' ? -0.05 : 0.05), -0.96, 0.96));
          layoutOnBeam(p); update();
        }
      });
    });

    function update() {
      const t = torque();
      out.l.textContent = t.l.toFixed(1);
      out.r.textContent = t.r.toFixed(1);
    }
    $('.bl-reset', sec).addEventListener('click', () => {
      pieces.forEach(p => { if (p.parentElement !== tray) toTray(p, p.getBoundingClientRect()); });
    });
    P.on('resize', () => onBeam.forEach((x, p) => layoutOnBeam(p)));

    let lastStatus = '';
    P.whileVisible(stage, (tm, dt) => {
      dt = Math.min(dt, 1 / 30);
      const t = torque();
      const target = clamp(t.net * 3.2, -14, 14);
      av += ((target - ang) * 38 - av * 6.5) * dt;
      ang += av * dt;
      beam.style.setProperty('--a', ang.toFixed(3) + 'deg');
      out.a.textContent = (ang >= 0 ? '' : '−') + Math.abs(ang).toFixed(1) + '°';
      meter.style.setProperty('--m', (clamp(t.net / 4, -1, 1) * meterBox.clientWidth / 2).toFixed(1) + 'px');
      let left = 0, right = 0;
      onBeam.forEach(x => { if (x < 0) left++; else right++; });
      const balanced = left > 0 && right > 0 && Math.abs(t.net) < 0.12 && Math.abs(ang) < 0.8 && Math.abs(av) < 2;
      let msg;
      if (!onBeam.size) msg = 'Drop shapes on the beam';
      else if (balanced) msg = 'Balanced. A truce.';
      else if (Math.abs(t.net) < 0.12 && (!left || !right)) msg = 'Use both sides';
      else msg = t.net < 0 ? 'Tipping left — add weight right' : 'Tipping right — add weight left';
      stage.classList.toggle('is-balanced', balanced);
      if (msg !== lastStatus) {
        lastStatus = msg;
        status.textContent = msg;
        if (balanced && !balancedOnce) {
          balancedOnce = true;
          P.toast('Balanced — weight × distance cancelled out', '#3A22FC');
        }
      }
    });
  });

  /* =============================== FINALE ============================ */
  P.chapters.push(function finale() {
    const fin = $('#fin');
    const links = $$('.fin-laws a', fin);
    const L = links.map(el => ({ el, w: 300, wd: 90, cx: 0, cy: 0 }));
    const measure = () => L.forEach(l => { const r = l.el.getBoundingClientRect(); l.cx = r.left + r.width / 2; l.cy = r.top + r.height / 2; });
    P.whileVisible($('.fin-laws', fin), (t, dt) => {
      measure();
      L.forEach((l, i) => {
        let tw = 300, twd = 90;
        if (fine) {
          const d = Math.hypot(pointer.x - l.cx, (pointer.y - l.cy) * 1.6);
          const prox = clamp(1 - d / 360, 0, 1);
          tw = lerp(300, 860, prox); twd = lerp(90, 125, prox);
        } else {
          const wave = Math.sin(t * 1.5 - i * 0.8) * 0.5 + 0.5;
          tw = lerp(300, 820, wave); twd = lerp(90, 120, wave);
        }
        l.w = damp(l.w, tw, 9, dt); l.wd = damp(l.wd, twd, 9, dt);
        l.el.style.setProperty('--w', Math.round(l.w / 5) * 5);
        l.el.style.setProperty('--wd', Math.round(l.wd));
      });
    });

    // the wordmark — and the lens from the very first screen comes back for a bow
    const markBox = $('.fin-mark', fin), mark = $('.fin-mark-word', fin);
    const fitMark = () => P.fit(markBox, { box: fin, vw: 25, min: 100, max: 100, fill: 0.99, maxSize: P.vw() * 0.4 });
    fitMark();
    let lens = null;
    if (!reduced && P.HeroGL) {
      try {
        lens = P.HeroGL.create(markBox, {
          canvas: $('.fin-gl', markBox), lines: [mark], melt: false, hud: false, amb: 0, vig: 0, grain: 0, flag: markBox,
          radius: (w, h) => clamp(h * 0.46, 46, 170)
        });
      } catch (e) { lens = null; }
    }
    if (lens) {
      lens.setIntro(0);
      lens.start();
      ScrollTrigger.create({ trigger: markBox, start: 'top 92%', once: true, onEnter: () => lens.intro(2.6) });
    } else if (!reduced) {
      const chars = P.splitChars(mark);
      gsap.from(chars, {
        yPercent: 100, duration: 1.4, ease: 'principia', stagger: 0.05,
        scrollTrigger: { trigger: markBox, start: 'top 95%', toggleActions: 'play none none reverse' }
      });
    }
    P.on('resize', () => { fitMark(); if (lens) lens.resize(); });
    if (!reduced) {
      gsap.from($$('.co-cell', fin), {
        y: 40, opacity: 0, duration: 1.1, ease: 'principia', stagger: 0.07,
        scrollTrigger: { trigger: $('.colophon', fin), start: 'top 85%', once: true }
      });
    }
    // the CTA's arrow points the way home
    const cta = $('.fin-cta', fin);
    if (!reduced) {
      gsap.fromTo(cta, { scale: 0.4, rotate: -90 }, { scale: 1, rotate: 0, duration: 1.4, ease: 'elastic.out(1, 0.5)', scrollTrigger: { trigger: cta, start: 'top 85%', toggleActions: 'play none none reverse' } });
    }
  });
})();
