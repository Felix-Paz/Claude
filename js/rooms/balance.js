/* =====================================================================
   MUSEUM OF DESIGN · Room 07 · Balance
   The room's exhibits: The Seesaw, Two Kinds of Calm, The Thirds, The Golden Ratio
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, clamp, pointer, reduced } = P;

  EXHIBITS.balance = [
    {
      title: 'The Seesaw', icon: 'drag', do: 'Drag shapes onto the beam',
      about: 'A shape’s pull is its weight times its distance from the middle. Drag shapes onto the beam until it sits level.',
      note: 'Weight times distance, same as on a playground.',
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
            if (ok && !toasted) { toasted = true; P.toast('Level. Nicely balanced.', '#1D3ECF'); }
          }
        });
      }
    },
    {
      title: 'Two Kinds of Calm', icon: 'click', do: 'Switch the hang',
      about: 'Symmetry balances by mirroring. Asymmetry balances one big light shape against a few small dark ones. The beam shows which hang is level.',
      note: 'Symmetry is the safe option. Asymmetry needs a counterweight.',
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
      about: 'Split the frame into thirds both ways. Things on the lines or crossings look more interesting than things in the middle. Drag the sun.',
      note: 'Put the subject on a third, not in the middle.',
      html: () => `
        <div class="thirds">
          <div class="th-scene">
            <div class="th-sky"></div><div class="th-sea"></div>
            <span class="th-sun" data-cursor="Drag" role="img" aria-label="The sun, drag it"></span>
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
          state.textContent = near ? 'On a third: more interesting' : centre ? 'Dead centre: steady but dull' : 'Keep looking';
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
      about: 'φ is about 1.618. Cut a square off a golden rectangle and the piece that’s left is golden too. Slide until the dashed outline fits.',
      note: 'Handy for splitting a page roughly 62 / 38.',
      html: () => `
        <div class="gold">
          <div class="gold-lab">
            <div class="gold-frame"><svg class="gold-svg" aria-label="A rectangle cut into squares, with a spiral"><g class="gold-sq"></g><path class="gold-ghost"/><path class="gold-spiral"/></svg><b class="gold-phi" aria-hidden="true">φ</b></div>
            <label class="slider gold-slider"><span class="slider-top mono"><span>Width ÷ height</span><output class="gold-out">1.400</output></span>
              <input type="range" class="gold-range" min="1.2" max="2.1" step="0.001" value="1.4" aria-label="Rectangle proportion"></label>
            <p class="gold-read mono"><span class="gold-left">Leftover: 2.500</span><span class="gold-verdict">Different shape, keep sliding</span></p>
          </div>
          <div class="gold-side">
            <div class="gold-3d" data-cursor="Drag to turn" aria-label="A golden rectangle in terrazzo with a brass spiral, as a 3D sculpture"></div>
            <ul class="gold-uses">
              <li><b>Layouts</b><span>A 1000 px page → columns of 618 + 382.</span></li>
              <li><b>Type scales</b><span>16 → 26 → 42 → 68 px, each × 1.618.</span></li>
              <li><b>Nature, roughly</b><span>Sunflower seeds and some shells come close, though rarely exactly.</span></li>
            </ul>
          </div>
        </div>`,
      init(el, c) {
        const PHI = (1 + Math.sqrt(5)) / 2;
        const svg = $('.gold-svg', el), gsq = $('.gold-sq', el), ghost = $('.gold-ghost', el), spiral = $('.gold-spiral', el);
        const range = $('.gold-range', el), out = $('.gold-out', el), left = $('.gold-left', el), verdict = $('.gold-verdict', el), lab = $('.gold-lab', el);
        const COLS = ['#E8461E', '#1D3ECF', '#FFD21F', '#BFD3C2', '#EBC6B8', '#E4D2B0', '#121110', '#EEEAE2', '#E8461E', '#1D3ECF'];
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
          verdict.textContent = g ? 'Golden: the leftover is the same shape' : Math.abs(r - PHI) < 0.06 ? 'Close, the outline almost fits' : 'Different shape, keep sliding';
          if (g !== gold) {
            gold = g;
            lab.classList.toggle('is-gold', g);
            if (g) { out.textContent = PHI.toFixed(3); if (!reduced) gsap.fromTo($('.gold-phi', el), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(2)' }); P.toast('φ = 1.6180339… found it', '#D2A85F'); }
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
