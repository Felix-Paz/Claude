/* =====================================================================
   MUSEUM OF DESIGN · 05 Typography · 06 Motion · 07 Balance
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, clamp, lerp, damp, pointer, reduced } = P;

  /* =========================================================
     05 · TYPOGRAPHY
     ========================================================= */
  EXHIBITS.typography = [
    {
      title: 'Words That Act', icon: 'move', do: 'Watch them work',
      about: 'Each word is set to do what it says. Same alphabet, different behaviour — that’s typography doing the talking.',
      note: 'Type can <em>do</em> what it says.',
      html: () => `
        <div class="acts">
          <div class="act" data-a="bigger"><span class="act-w">BIGGER</span></div>
          <div class="act" data-a="heavy"><span class="act-w">HEAVY</span></div>
          <div class="act" data-a="wide"><span class="act-w">WIDE</span></div>
          <div class="act" data-a="light"><span class="act-w">light</span></div>
          <div class="act" data-a="space"><span class="act-w">SPACE</span></div>
          <div class="act" data-a="fall"><span class="act-w">FALL</span></div>
        </div>`,
      init(el, c) {
        if (reduced) return;
        const w = n => $(`[data-a="${n}"] .act-w`, el);
        const loop = (target, from, to, dur = 1.6, extra = {}) =>
          gsap.fromTo(target, from, Object.assign({ duration: dur, ease: 'power3.inOut', repeat: -1, yoyo: true, repeatDelay: 0.5 }, to, extra));
        const tweens = [
          loop(w('bigger'), { scale: 0.45 }, { scale: 1.15 }),
          loop(w('heavy'), { fontWeight: 200 }, { fontWeight: 900 }),
          loop(w('wide'), { fontStretch: '75%' }, { fontStretch: '125%' }),
          loop(w('light'), { fontWeight: 900, y: 26 }, { fontWeight: 200, y: -26 }),
          loop(w('space'), { letterSpacing: '-0.06em' }, { letterSpacing: '0.4em' })
        ];
        const fc = P.splitChars(w('fall'));
        const fall = gsap.timeline({ repeat: -1, repeatDelay: 0.6 })
          .to(fc, { y: i => [110, 160, 90, 140][i % 4] + '%', rotate: i => [16, -24, 9, -14][i % 4], duration: 0.8, ease: 'power2.in', stagger: 0.1 })
          .to(fc, { y: 0, rotate: 0, duration: 1, ease: 'elastic.out(1, 0.45)', stagger: 0.08 }, '+=0.5');
        tweens.push(fall);
        tweens.forEach(t => t.pause());
        ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: s => tweens.forEach(t => (s.isActive ? t.play() : t.pause())) });
      }
    },
    {
      title: 'One Font', icon: 'slide', do: 'Turn the axes',
      about: 'Everything here comes from a single variable font file. Two sliders — weight and width — give you hundreds of styles in between. Click the word to type your own.',
      note: 'One file. <em>Every voice.</em>',
      html: () => `
        <div class="vf">
          <div class="vf-stage"><span class="vf-word" contenteditable="true" spellcheck="false" aria-label="Editable sample word">Gestalt</span></div>
          <div class="vf-side">
            <div class="vf-presets">
              <button type="button" class="chip" data-p="shout">Shout</button>
              <button type="button" class="chip" data-p="whisper">Whisper</button>
              <button type="button" class="chip" data-p="poster">Poster</button>
            </div>
            <label class="slider"><span class="slider-top mono"><span>Weight</span><output class="vf-ow">640</output></span><input type="range" data-k="w" min="200" max="900" step="1" value="640"></label>
            <label class="slider"><span class="slider-top mono"><span>Width</span><output class="vf-owd">112</output></span><input type="range" data-k="wd" min="75" max="125" step="0.5" value="112"></label>
            <p class="vf-tip mono">Click the word to retype it</p>
          </div>
        </div>`,
      init(el, c) {
        const word = $('.vf-word', el), stage = $('.vf-stage', el), inputs = $$('input', el);
        const ow = $('.vf-ow', el), owd = $('.vf-owd', el);
        const fills = inputs.map(P.rangeFill);
        const s = { w: 640, wd: 112 };
        const render = () => {
          word.style.fontWeight = Math.round(s.w);
          word.style.fontStretch = s.wd.toFixed(1) + '%';
          word.style.fontSize = '';
          const avail = stage.clientWidth * 0.9, ww = word.scrollWidth;
          if (ww > avail) word.style.fontSize = (parseFloat(getComputedStyle(word).fontSize) * avail / ww) + 'px';
          ow.textContent = Math.round(s.w); owd.textContent = s.wd.toFixed(0);
          inputs.forEach((inp, i) => { if (document.activeElement !== inp) inp.value = s[inp.dataset.k]; fills[i](); });
        };
        inputs.forEach(inp => c.on(inp, 'input', () => { s[inp.dataset.k] = +inp.value; render(); }));
        const PRE = { shout: { w: 900, wd: 125 }, whisper: { w: 200, wd: 80 }, poster: { w: 820, wd: 75 } };
        $$('[data-p]', el).forEach(b => c.on(b, 'click', () => {
          $$('[data-p]', el).forEach(x => x.classList.toggle('is-on', x === b));
          gsap.to(s, Object.assign({ duration: reduced ? 0 : 1, ease: 'expo.inOut', onUpdate: render }, PRE[b.dataset.p]));
        }));
        c.on(word, 'keydown', e => { if (e.key === 'Enter') { e.preventDefault(); word.blur(); } });
        c.on(word, 'input', () => { if (word.textContent.length > 14) word.textContent = word.textContent.slice(0, 14); render(); });
        c.on(word, 'blur', () => { if (!word.textContent.trim()) { word.textContent = 'Gestalt'; render(); } });
        render(); c.onResize(render);
      }
    },
    {
      title: 'Kerning', icon: 'slide', do: 'Slide to fix the gaps',
      about: 'Kerning adjusts the space between particular pairs of letters: A and V lean away from each other, T hangs over A. Slide until the gaps look even — your eye will tell you when.',
      note: 'Good spacing <em>disappears.</em>',
      html: () => `
        <div class="kern">
          <p class="kern-word" aria-label="AVATAR">AVATAR</p>
          <label class="slider kern-slider"><span class="slider-top mono"><span>Kerning</span><output class="kern-out">Off</output></span>
            <input type="range" class="kern-range" min="0" max="1" step="0.001" value="0" aria-label="Kerning"></label>
        </div>`,
      init(el, c) {
        const word = $('.kern-word', el), range = $('.kern-range', el), out = $('.kern-out', el);
        const chars = P.splitChars(word);
        // un-kerned: every pair spaced like a typewriter, a few pairs badly off
        const BAD = [0.16, 0.2, 0.18, 0.04, 0.2, 0];
        P.rangeFill(range);
        const render = () => {
          const k = +range.value;
          chars.forEach((ch, i) => { ch.style.marginRight = ((1 - k) * BAD[i]).toFixed(3) + 'em'; });
          word.style.fontKerning = k > 0.5 ? 'normal' : 'none';
          out.textContent = k < 0.05 ? 'Off' : k > 0.95 ? 'Kerned' : Math.round(k * 100) + '%';
        };
        c.on(range, 'input', render);
        render();
        if (!reduced) ScrollTrigger.create({ trigger: el, start: 'top 60%', once: true, onEnter: () => {
          gsap.to(range, { value: 0.35, duration: 1.2, ease: 'power2.inOut', delay: 0.4, onUpdate: () => range.dispatchEvent(new Event('input')) });
        } });
      }
    }
  ];

  /* =========================================================
     06 · MOTION
     ========================================================= */
  EXHIBITS.motion = [
    {
      title: 'Photo Finish', icon: 'click', do: 'Start the race',
      about: 'Four balls travel the same distance in the same time. Only their <em>easing</em> differs — how speed changes along the way. Which one feels most like a real thing moving?',
      note: 'Same distance, same time — <em>different personality.</em>',
      html: () => `
        <div class="race">
          <div class="race-lane" data-e="none"><span class="rl-name"><b>Linear</b><i>robotic</i></span><span class="rl-track"><i class="rl-ball"></i></span></div>
          <div class="race-lane" data-e="expo.out"><span class="rl-name"><b>Ease out</b><i>confident</i></span><span class="rl-track"><i class="rl-ball"></i></span></div>
          <div class="race-lane" data-e="power3.inOut"><span class="rl-name"><b>Ease in-out</b><i>graceful</i></span><span class="rl-track"><i class="rl-ball"></i></span></div>
          <div class="race-lane" data-e="elastic.out(1,0.35)"><span class="rl-name"><b>Spring</b><i>delighted</i></span><span class="rl-track"><i class="rl-ball"></i></span></div>
          <div class="race-3d" aria-hidden="true"><i class="race-flash"></i></div>
          <div class="race-foot"><button class="btn btn-solid race-go" type="button"><span>Race again</span><svg><use href="#i-arrow"/></svg></button><p class="race-cap mono">Same start · same finish · same 1.5 seconds</p></div>
        </div>`,
      init(el, c) {
        const lanes = $$('.race-lane', el).map(l => ({ ease: gsap.parseEase(l.dataset.e), ball: $('.rl-ball', l), track: $('.rl-track', l), name: $('b', l).textContent, sub: $('i', l).textContent }));
        const COLS = [0xF3F0E9, 0xD9FD3A, 0xCDBFFF, 0x8DEFC5];
        // the track wants width: phones keep the flat lanes
        const r3 = window.EX3D && P.vw() > 760 ? EX3D.race($('.race-3d', el), c, lanes.map((L, i) => ({ name: L.name, sub: L.sub, ease: L.ease, color: COLS[i] }))) : null;
        if (r3) el.querySelector('.race').classList.add('is-3d');
        const p = r3 ? r3.state : { t: 0 };
        const flashEl = $('.race-flash', el);
        const snap = () => { if (r3) r3.flash(); if (!reduced) gsap.fromTo(flashEl, { opacity: 0.45 }, { opacity: 0, duration: 0.6, ease: 'power2.out' }); };
        const draw = () => { if (!r3) lanes.forEach(L => gsap.set(L.ball, { x: L.ease(p.t) * (L.track.clientWidth - L.ball.offsetWidth) })); };
        let race = null;
        const run = () => {
          if (race) race.kill();
          race = gsap.timeline({ repeat: -1, repeatDelay: 0.3 })
            .fromTo(p, { t: 0 }, { t: 1, duration: 1.5, ease: 'none', onUpdate: draw })
            .add(snap)
            .to({}, { duration: 1.4 })
            .to(p, { t: 0, duration: 0.7, ease: 'power3.inOut', onUpdate: draw });
        };
        draw();
        ScrollTrigger.create({ trigger: el, start: 'top 70%', end: 'bottom top', onEnter: () => (race ? race.play() : run()), onEnterBack: () => race && race.play(), onLeave: () => race && race.pause(), onLeaveBack: () => race && race.pause() });
        c.on($('.race-go', el), 'click', run);
        c.onResize(draw);
      }
    },
    {
      title: 'The Spring', icon: 'drag', do: 'Drag it, let go',
      about: 'This ball hangs on a spring. Pull it and throw it: tension drags it home, friction calms it down, and it overshoots a little on arrival — like anything real. That overshoot is what “spring” easing borrows.',
      note: 'Physics makes things <em>feel alive.</em>',
      html: () => `
        <div class="spring">
          <svg class="sp-band" aria-hidden="true"><path/></svg>
          <span class="sp-anchor" aria-hidden="true"></span>
          <span class="sp-ball" data-cursor="Drag" role="img" aria-label="A ball on a spring"></span>
        </div>`,
      init(el, c) {
        const stage = $('.spring', el), ball = $('.sp-ball', el), band = $('.sp-band path', el), bsvg = $('.sp-band', el);
        const K = 180, C = 8;
        const b = { x: reduced ? 0 : -150, y: reduced ? 0 : -80, vx: 0, vy: 0, drag: false, ox: 0, oy: 0, lt: 0 };
        // in 3D: a real coil spring from a brass ceiling mount (the DOM ball stays as the handle)
        if (window.EX3D && EX3D.coil(stage, c, b)) stage.classList.add('is-3d');
        const mid = () => ({ x: stage.clientWidth / 2, y: stage.clientHeight / 2 });
        c.on(ball, 'pointerdown', e => {
          e.preventDefault(); ball.setPointerCapture(e.pointerId);
          const r = stage.getBoundingClientRect(), m = mid();
          b.drag = true; b.ox = e.clientX - r.left - m.x - b.x; b.oy = e.clientY - r.top - m.y - b.y; b.lt = performance.now(); b.vx = b.vy = 0;
        });
        c.on(ball, 'pointermove', e => {
          if (!b.drag) return;
          const r = stage.getBoundingClientRect(), m = mid();
          const nx = clamp(e.clientX - r.left - m.x - b.ox, -m.x + 44, m.x - 44), ny = clamp(e.clientY - r.top - m.y - b.oy, -m.y + 44, m.y - 44);
          const now = performance.now(), dt = Math.max(8, now - b.lt) / 1000;
          b.vx = lerp(b.vx, (nx - b.x) / dt, 0.5); b.vy = lerp(b.vy, (ny - b.y) / dt, 0.5);
          b.x = nx; b.y = ny; b.lt = now;
        });
        const up = () => { b.drag = false; };
        c.on(ball, 'pointerup', up); c.on(ball, 'pointercancel', up);
        c.visible(stage, (t, dt) => {
          if (!b.drag) for (let i = 0; i < 6; i++) { const h = dt / 6; b.vx += (-K * b.x - C * b.vx) * h; b.vy += (-K * b.y - C * b.vy) * h; b.x += b.vx * h; b.y += b.vy * h; }
          const m = mid(), sp = Math.hypot(b.vx, b.vy), sq = clamp(sp / 4200, 0, 0.42);
          gsap.set(ball, { x: m.x + b.x, y: m.y + b.y, rotate: Math.atan2(b.vy, b.vx) * 180 / Math.PI, scaleX: 1 + sq, scaleY: 1 - sq * 0.6 });
          bsvg.setAttribute('viewBox', `0 0 ${stage.clientWidth} ${stage.clientHeight}`);
          const d = Math.hypot(b.x, b.y);
          band.setAttribute('d', `M${m.x},${m.y} Q${m.x + b.x / 2},${m.y + b.y / 2 + Math.min(60, d * 0.08)} ${m.x + b.x},${m.y + b.y}`);
          band.setAttribute('stroke-width', clamp(9 - d / 55, 1.5, 9).toFixed(2));
        });
      }
    },
    {
      title: 'Stagger', icon: 'click', do: 'Click anywhere',
      about: 'When things move one after another instead of all at once, movement becomes choreography. Click the grid to send a ripple through it.',
      note: 'Order turns movement <em>into choreography.</em>',
      html: () => `<div class="stagger" data-cursor="Click"></div>`,
      init(el, c) {
        const box = $('.stagger', el);
        const COLS = 18, ROWS = 8;
        box.style.setProperty('--cols', COLS);
        box.innerHTML = Array.from({ length: COLS * ROWS }, () => '<i></i>').join('');
        const dots = $$('i', box);
        const wave = (cx, cy) => {
          if (reduced) return;
          dots.forEach((d, i) => {
            const x = i % COLS, y = Math.floor(i / COLS);
            const dist = Math.hypot(x - cx, (y - cy) * 1.1);
            gsap.timeline({ delay: dist * 0.045 })
              .to(d, { scale: 1.9, backgroundColor: '#0C0C14', duration: 0.22, ease: 'power2.out', overwrite: 'auto' })
              .to(d, { scale: 1, backgroundColor: '', duration: 0.9, ease: 'elastic.out(1, 0.4)' });
          });
        };
        c.on(box, 'click', e => {
          const r = box.getBoundingClientRect();
          wave((e.clientX - r.left) / r.width * (COLS - 1), (e.clientY - r.top) / r.height * (ROWS - 1));
        });
        let idle = 0;
        c.visible(box, (t, dt) => { idle += dt; if (idle > 3.4) { idle = 0; wave(Math.random() * (COLS - 1), Math.random() * (ROWS - 1)); } });
        c.on(box, 'click', () => { idle = -2; });
      }
    }
  ];

  /* =========================================================
     07 · BALANCE
     ========================================================= */
  EXHIBITS.balance = [
    {
      title: 'The Seesaw', icon: 'drag', do: 'Drag shapes onto the beam',
      about: 'Every shape weighs what it looks like it weighs. Its pull is weight × distance from the middle, so a small shape far out can balance a big one close in. Find the truce.',
      note: 'Visual weight × distance <em>from the centre.</em>',
      html: () => `
        <div class="saw">
          <div class="saw-stage">
            <div class="saw-beam"><span class="saw-bar"></span><span class="saw-ticks" aria-hidden="true"></span></div>
            <span class="saw-pivot" aria-hidden="true"></span>
            <div class="saw-tray">
              <span class="saw-piece sp-circle" data-m="5" data-cursor="Drag" role="img" aria-label="Large circle, weight 5"></span>
              <span class="saw-piece sp-square" data-m="3" data-cursor="Drag" role="img" aria-label="Dark square, weight 3"></span>
              <span class="saw-piece sp-tri" data-m="1.6" data-cursor="Drag" role="img" aria-label="Triangle, weight 1.6"></span>
              <span class="saw-piece sp-dot" data-m="0.8" data-cursor="Drag" role="img" aria-label="Small dot, weight 0.8"></span>
            </div>
            <p class="saw-status mono" aria-live="polite">Drop shapes on the beam</p>
          </div>
        </div>`,
      init(el, c) {
        const stage = $('.saw-stage', el), beam = $('.saw-beam', el), tray = $('.saw-tray', el), status = $('.saw-status', el);
        const pieces = $$('.saw-piece', el);
        let ang = 0, av = 0, toasted = false;
        const on = new Map();
        pieces.forEach(p => { p.tabIndex = 0; });
        const torque = () => { let n = 0; on.forEach((x, p) => { n += +p.dataset.m * x; }); return n; };
        const place = p => { const bw = beam.offsetWidth; p.style.left = (bw / 2 + on.get(p) * bw / 2 - p.offsetWidth / 2) + 'px'; };
        function attach(p, x, from) {
          on.set(p, clamp(x, -0.95, 0.95));
          p.classList.add('on-beam'); beam.appendChild(p); p.style.top = '';
          place(p);
          if (from && !reduced) { const to = p.getBoundingClientRect(); gsap.fromTo(p, { x: from.left - to.left, y: from.top - to.top, rotate: -ang }, { x: 0, y: 0, rotate: 0, duration: 0.7, ease: 'bounce.out' }); }
        }
        function home(p, from) {
          on.delete(p); p.classList.remove('on-beam');
          p.style.left = p.style.top = p.style.position = '';
          const after = pieces.slice(pieces.indexOf(p) + 1).find(q => q.parentElement === tray);
          tray.insertBefore(p, after || null);
          if (from && !reduced) { const to = p.getBoundingClientRect(); gsap.fromTo(p, { x: from.left - to.left, y: from.top - to.top }, { x: 0, y: 0, rotate: 0, duration: 0.8, ease: 'expo.out' }); }
        }
        pieces.forEach(p => {
          let drag = null;
          c.on(p, 'pointerdown', e => {
            e.preventDefault();
            const r = p.getBoundingClientRect(), sr = stage.getBoundingClientRect();
            on.delete(p); gsap.killTweensOf(p);
            p.classList.remove('on-beam'); p.classList.add('is-drag');
            stage.appendChild(p); gsap.set(p, { x: 0, y: 0, rotate: 0 });
            // capture after re-parenting: moving a node in the DOM drops its pointer capture
            try { p.setPointerCapture(e.pointerId); } catch (err) {}
            p.style.position = 'absolute'; p.style.left = (r.left - sr.left) + 'px'; p.style.top = (r.top - sr.top) + 'px';
            drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
          });
          c.on(p, 'pointermove', e => {
            if (!drag) return;
            const sr = stage.getBoundingClientRect();
            p.style.left = clamp(e.clientX - sr.left - drag.dx, -10, sr.width - p.offsetWidth + 10) + 'px';
            p.style.top = clamp(e.clientY - sr.top - drag.dy, -10, sr.height - p.offsetHeight + 10) + 'px';
          });
          const drop = () => {
            if (!drag) return;
            drag = null; p.classList.remove('is-drag');
            const r = p.getBoundingClientRect(), sr = stage.getBoundingClientRect();
            const bw = beam.offsetWidth, pivot = sr.left + beam.offsetLeft + bw / 2;
            const x = (r.left + r.width / 2 - pivot) / (bw / 2) / Math.cos(ang * Math.PI / 180);
            if (r.bottom < sr.top + sr.height * 0.78 && Math.abs(x) <= 1.05) attach(p, x, r); else home(p, r);
          };
          c.on(p, 'pointerup', drop); c.on(p, 'pointercancel', drop);
          c.on(p, 'keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const r = p.getBoundingClientRect(); if (on.has(p)) home(p, r); else attach(p, pieces.indexOf(p) % 2 ? 0.6 : -0.6, r); p.focus({ preventScroll: true }); }
            if (on.has(p) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); on.set(p, clamp(on.get(p) + (e.key === 'ArrowLeft' ? -0.05 : 0.05), -0.95, 0.95)); place(p); }
          });
        });
        c.onResize(() => on.forEach((x, p) => place(p)));
        let last = '';
        c.visible(stage, (t, dt) => {
          const n = torque();
          av += ((clamp(n * 3.2, -14, 14) - ang) * 38 - av * 6.5) * dt;
          ang += av * dt;
          beam.style.setProperty('--a', ang.toFixed(3) + 'deg');
          let L = 0, R = 0;
          on.forEach(x => { if (x < 0) L++; else R++; });
          const ok = L > 0 && R > 0 && Math.abs(n) < 0.12 && Math.abs(ang) < 0.8 && Math.abs(av) < 2;
          const msg = !on.size ? 'Drop shapes on the beam' : ok ? 'Balanced.' : Math.abs(n) < 0.12 ? 'Use both sides' : n < 0 ? 'Heavier on the left' : 'Heavier on the right';
          stage.classList.toggle('is-ok', ok);
          if (msg !== last) {
            last = msg; status.textContent = msg;
            if (ok && !toasted) { toasted = true; P.toast('Balanced — a truce between unequal things', '#3A22FC'); }
          }
        });
      }
    },
    {
      title: 'Two Kinds of Calm', icon: 'click', do: 'Switch the hang',
      about: 'Symmetry balances with mirror images: steady, formal, a little stiff. Asymmetry trades one big light shape for a few small dark ones — dark weighs more. The beam underneath does the maths: level means balanced.',
      note: 'Asymmetry balances <em>by trade.</em>',
      html: () => `
        <div class="sym">
          <div class="seg sym-seg" role="radiogroup" aria-label="Composition">
            <button type="button" role="radio" aria-checked="true" data-s="sym">Symmetric</button>
            <button type="button" role="radio" aria-checked="false" data-s="asym">Asymmetric</button>
            <button type="button" role="radio" aria-checked="false" data-s="lop">Lopsided</button>
            <i class="seg-thumb" aria-hidden="true"></i>
          </div>
          <div class="sym-canvas">
            <i class="sy sy-a"></i><i class="sy sy-b"></i><i class="sy sy-c"></i><i class="sy sy-d"></i>
            <span class="sym-axis" aria-hidden="true"></span>
            <div class="sym-beam" aria-hidden="true"><i class="sym-bar"></i><i class="sym-pivot"></i></div>
            <p class="sym-read mono"><span class="sym-word">Stable</span> · <span class="sym-sub">predictable</span></p>
          </div>
        </div>`,
      init(el, c) {
        const A = $$('.sy', el), word = $('.sym-word', el), sub = $('.sym-sub', el), axis = $('.sym-axis', el), bar = $('.sym-bar', el), canvas = $('.sym-canvas', el);
        // [left%, top%, size% of width]; ink shapes weigh 2.2× their area
        const DARK = [1, 1, 2.2, 2.2];
        const L = {
          sym: [[30, 46, 22], [70, 46, 22], [50, 22, 5], [50, 70, 5]],
          asym: [[40, 44, 30], [72, 64, 4], [82, 28, 9], [89, 56, 6]],
          lop: [[30, 42, 30], [16, 74, 6], [45, 70, 9], [22, 20, 6]]
        };
        const TXT = { sym: ['Stable', 'predictable'], asym: ['Balanced', 'alive'], lop: ['Uneasy', 'it wants to tip'] };
        const tilt = m => {
          let mom = 0, tot = 0;
          L[m].forEach(([x, , s], i) => { const w = s * s * DARK[i]; mom += (x - 50) * w; tot += w; });
          return clamp((mom / tot) * 0.9, -9, 9);
        };
        const go = (m, instant) => {
          const d = instant || reduced ? 0 : 1.2;
          A.forEach((n, i) => { const [x, y, s] = L[m][i]; gsap.to(n, { left: x + '%', top: y + '%', width: s + '%', duration: d, ease: 'expo.inOut', delay: instant ? 0 : i * 0.05 }); });
          gsap.to(axis, { opacity: m === 'sym' ? 1 : 0, duration: 0.5 });
          gsap.to(bar, { rotate: tilt(m), duration: instant || reduced ? 0 : 1.6, ease: 'elastic.out(1, 0.45)', delay: instant ? 0 : 0.6 });
          canvas.classList.toggle('is-off', m === 'lop');
          word.textContent = TXT[m][0];
          sub.textContent = TXT[m][1];
        };
        A.forEach(n => gsap.set(n, { xPercent: -50, yPercent: -50 }));
        go('sym', true);
        P.seg($('.sym-seg', el), b => go(b.dataset.s));
      }
    },
    {
      title: 'The Thirds', icon: 'drag', do: 'Drag the sun',
      about: 'Split a frame into thirds both ways. The lines and their four crossings are where the eye likes to rest — dead centre feels static. Drag the sun and feel the difference.',
      note: 'Off-centre is <em>more interesting.</em>',
      html: () => `
        <div class="thirds">
          <div class="th-scene">
            <div class="th-sky"></div><div class="th-sea"></div>
            <span class="th-sun" data-cursor="Drag" role="img" aria-label="The sun — drag it"></span>
            <div class="th-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          </div>
          <p class="th-read mono"><span class="th-state">Dead centre</span></p>
        </div>`,
      init(el, c) {
        const scene = $('.th-scene', el), sun = $('.th-sun', el), grid = $('.th-grid', el), state = $('.th-state', el);
        const pos = { x: 0.5, y: 0.5 };
        const POINTS = [[1 / 3, 1 / 3], [2 / 3, 1 / 3], [1 / 3, 2 / 3], [2 / 3, 2 / 3]];
        const set = () => { sun.style.left = pos.x * 100 + '%'; sun.style.top = pos.y * 100 + '%'; };
        set();
        let drag = false;
        const read = () => {
          const near = POINTS.find(p => Math.hypot(p[0] - pos.x, (p[1] - pos.y) * 0.62) < 0.05);
          const centre = Math.hypot(pos.x - 0.5, pos.y - 0.5) < 0.06;
          scene.classList.toggle('is-third', !!near);
          state.textContent = near ? 'On a third — tension, interest' : centre ? 'Dead centre — stable, static' : 'Keep looking';
          return near;
        };
        c.on(sun, 'pointerdown', e => { e.preventDefault(); drag = true; sun.setPointerCapture(e.pointerId); grid.classList.add('is-on'); });
        c.on(sun, 'pointermove', e => {
          if (!drag) return;
          const r = scene.getBoundingClientRect();
          pos.x = clamp((e.clientX - r.left) / r.width, 0.06, 0.94);
          pos.y = clamp((e.clientY - r.top) / r.height, 0.08, 0.92);
          set(); read();
        });
        const up = () => {
          if (!drag) return;
          drag = false; grid.classList.remove('is-on');
          const near = read();
          if (near) gsap.to(pos, { x: near[0], y: near[1], duration: 0.5, ease: 'back.out(2)', onUpdate: set });
        };
        c.on(sun, 'pointerup', up); c.on(sun, 'pointercancel', up);
        c.on(sun, 'keydown', e => {
          const k = 0.02, m = { ArrowLeft: [-k, 0], ArrowRight: [k, 0], ArrowUp: [0, -k], ArrowDown: [0, k] }[e.key];
          if (m) { e.preventDefault(); pos.x = clamp(pos.x + m[0], 0.06, 0.94); pos.y = clamp(pos.y + m[1], 0.08, 0.92); set(); read(); }
        });
        sun.tabIndex = 0;
        read();
      }
    },
    {
      title: 'The Golden Ratio', icon: 'slide', do: 'Slide until it clicks',
      about: 'φ (phi) is about <em>1.618</em>. Cut a square off a golden rectangle and what’s left is another golden rectangle — the same shape, smaller, forever. Slide the proportion: at φ the dashed ghost fits the leftover exactly and the spiral closes.',
      note: 'One proportion that <em>contains itself.</em>',
      html: () => `
        <div class="gold">
          <div class="gold-lab">
            <div class="gold-frame"><svg class="gold-svg" aria-label="A rectangle cut into squares, with a spiral"><g class="gold-sq"></g><path class="gold-ghost"/><path class="gold-spiral"/></svg><b class="gold-phi" aria-hidden="true">φ</b></div>
            <label class="slider gold-slider"><span class="slider-top mono"><span>Width ÷ height</span><output class="gold-out">1.400</output></span>
              <input type="range" class="gold-range" min="1.2" max="2.1" step="0.001" value="1.4" aria-label="Rectangle proportion"></label>
            <p class="gold-read mono"><span class="gold-left">Leftover: 2.500</span><span class="gold-verdict">Different shape — keep sliding</span></p>
          </div>
          <div class="gold-side">
            <div class="gold-3d" data-cursor="Drag to turn" aria-label="A golden rectangle in terrazzo with a brass spiral, as a 3D sculpture"></div>
            <ul class="gold-uses">
              <li><b>Layouts</b><span>A 1000 px page → columns of 618 + 382.</span></li>
              <li><b>Type scales</b><span>16 → 26 → 42 → 68 px, each × 1.618.</span></li>
              <li><b>Nature, sort of</b><span>Sunflowers and shells come close. Close is the point.</span></li>
            </ul>
          </div>
        </div>`,
      init(el, c) {
        const PHI = (1 + Math.sqrt(5)) / 2;
        const svg = $('.gold-svg', el), gsq = $('.gold-sq', el), ghost = $('.gold-ghost', el), spiral = $('.gold-spiral', el);
        const range = $('.gold-range', el), out = $('.gold-out', el), left = $('.gold-left', el), verdict = $('.gold-verdict', el), lab = $('.gold-lab', el);
        const COLS = ['#FD5A32', '#3A22FC', '#D9FD3A', '#8DEFC5', '#CDBFFF', '#FBC49F', '#0C0C14', '#F3F0E9', '#FD5A32', '#3A22FC'];
        P.rangeFill(range);
        let gold = false;
        function draw(r) {
          const H = 400, W = r * H;
          svg.setAttribute('viewBox', `-4 -4 ${2.1 * H + 8} ${H + 8}`);
          let x = 0, y = 0, w = W, h = H, sq = '', d = '';
          let ghostD = '';
          for (let k = 0; k < 10 && w > 1 && h > 1; k++) {
            const dir = k % 4, s = Math.min(w, h);
            let qx, qy;
            if (dir === 0) { qx = x; qy = y; x += s; w -= s; }
            else if (dir === 1) { qx = x; qy = y; y += s; h -= s; }
            else if (dir === 2) { qx = x + w - s; qy = y; w -= s; }
            else { qx = x; qy = y + h - s; h -= s; }
            sq += `<rect x="${qx.toFixed(2)}" y="${qy.toFixed(2)}" width="${s.toFixed(2)}" height="${s.toFixed(2)}" fill="${COLS[k]}" fill-opacity="${k === 6 ? 0.85 : 0.82}"/>`;
            const P0 = [[qx, qy + s], [qx, qy], [qx + s, qy], [qx + s, qy + s]][dir], P1 = [[qx + s, qy], [qx + s, qy + s], [qx, qy + s], [qx, qy]][dir];
            d += (k ? ' L' : 'M') + `${P0[0].toFixed(2)},${P0[1].toFixed(2)} A${s.toFixed(2)},${s.toFixed(2)} 0 0 1 ${P1[0].toFixed(2)},${P1[1].toFixed(2)}`;
            if (k === 0) {
              // the whole rectangle, shrunk to the leftover's height, laid over it
              const lw = w, lh = h, scale = Math.max(lw, lh) / W;
              const gw = W * scale, gh = H * scale;
              const gx = x, gy = y + (lh - (lw >= lh ? gh : gw)) * 0;
              ghostD = lw >= lh ? `M${gx},${gy} h${gw} v${gh} h${-gw} Z` : `M${gx},${gy} h${gh} v${gw} h${-gh} Z`;
            }
          }
          gsq.innerHTML = sq + `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="currentColor" stroke-width="3"/>`;
          spiral.setAttribute('d', d);
          ghost.setAttribute('d', ghostD);
          const leftover = H / (W - H);
          out.textContent = r.toFixed(3);
          left.textContent = 'Leftover: ' + (leftover >= 1 ? leftover : 1 / leftover).toFixed(3);
          const g = Math.abs(r - PHI) < 0.006;
          verdict.textContent = g ? 'Same shape. Forever. ✦' : Math.abs(r - PHI) < 0.06 ? 'So close — the ghost almost fits' : 'Different shape — keep sliding';
          if (g !== gold) {
            gold = g;
            lab.classList.toggle('is-gold', g);
            if (g) { out.textContent = PHI.toFixed(3); if (!reduced) gsap.fromTo($('.gold-phi', el), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(2)' }); P.toast('φ = 1.6180339… found it', '#E2B866'); }
          }
        }
        c.on(range, 'input', () => draw(+range.value));
        c.on(range, 'change', () => { if (Math.abs(+range.value - PHI) < 0.03) { range.value = PHI; range.dispatchEvent(new Event('input')); } });
        draw(+range.value);
        // a quick demo sweep — stops the moment you take over
        let demo = null;
        const takeOver = () => { if (demo) { demo.kill(); demo = null; } };
        c.on(range, 'pointerdown', takeOver); c.on(range, 'keydown', takeOver);
        if (!reduced) ScrollTrigger.create({ trigger: el, start: 'top 65%', once: true, onEnter: () => {
          demo = gsap.to(range, { value: 1.85, duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: 1, onUpdate: () => draw(+range.value), onComplete: () => { demo = null; } });
        } });
        c.sculpt($('.gold-3d', el), 'fibonacci');
      }
    }
  ];
})();
