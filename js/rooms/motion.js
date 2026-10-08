/* =====================================================================
   MUSEUM OF DESIGN · Room 06 · Motion
   The room's exhibits: Photo Finish, The Spring, Stagger
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, clamp, lerp, reduced, color } = P;

  EXHIBITS.motion = [
    {
      title: 'Photo Finish', icon: 'click', do: 'Start the race',
      about: 'Four balls, same distance, same time. Only the easing is different: how the speed changes along the way. Which one looks real?',
      note: 'Ease out for things that arrive. Linear is for progress bars.',
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
        const COLS = [0xF3EFE6, 0xFFD21F, 0xE8461E, 0x5B7FFF];
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
      about: 'A ball on a spring. Pull it and let go: it swings home, overshoots a little and settles.',
      note: 'One small overshoot is what makes a spring feel physical.',
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
      title: 'Stagger', icon: 'click', do: 'Switch, then click',
      about: 'The same dots doing the same move, either all at once or one after another. Switch, then click the grid.',
      note: 'Start each item 20 to 60 ms after the one before.',
      html: () => `
        <div class="stag">
          <div class="seg stag-seg" role="radiogroup" aria-label="Timing">
            <button type="button" role="radio" aria-checked="false" data-s="0">All at once</button>
            <button type="button" role="radio" aria-checked="true" data-s="1">One after another</button>
            <i class="seg-thumb" aria-hidden="true"></i>
          </div>
          <div class="stagger" data-cursor="Click"></div>
          <p class="stag-read mono"><span>Delay between neighbours</span><b class="stag-ms">45 ms</b></p>
        </div>`,
      init(el, c) {
        const box = $('.stagger', el), ms = $('.stag-ms', el);
        const COLS = 18, ROWS = 8;
        let step = 0.045;
        box.style.setProperty('--cols', COLS);
        box.innerHTML = Array.from({ length: COLS * ROWS }, () => '<i></i>').join('');
        const dots = $$('i', box);
        const wave = (cx, cy) => {
          if (reduced) return;
          dots.forEach((d, i) => {
            const x = i % COLS, y = Math.floor(i / COLS);
            const dist = Math.hypot(x - cx, (y - cy) * 1.1);
            gsap.timeline({ delay: dist * step })
              .to(d, { scale: 1.9, backgroundColor: '#121110', duration: 0.22, ease: 'power2.out', overwrite: 'auto' })
              .to(d, { scale: 1, backgroundColor: '', duration: 0.9, ease: 'elastic.out(1, 0.4)' });
          });
        };
        const centre = () => wave((COLS - 1) / 2, (ROWS - 1) / 2);
        P.seg($('.stag-seg', el), b => { step = +b.dataset.s ? 0.045 : 0; ms.textContent = step ? '45 ms' : '0 ms'; idle = -1.5; centre(); });
        c.on(box, 'click', e => {
          const r = box.getBoundingClientRect();
          wave((e.clientX - r.left) / r.width * (COLS - 1), (e.clientY - r.top) / r.height * (ROWS - 1));
          idle = -2;
        });
        let idle = 0;
        c.visible(box, (t, dt) => { idle += dt; if (idle > 3.4) { idle = 0; wave(Math.random() * (COLS - 1), Math.random() * (ROWS - 1)); } });
      }
    }
  ];
})();
