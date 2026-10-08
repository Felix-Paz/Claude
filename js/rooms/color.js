/* =====================================================================
   MUSEUM OF DESIGN · Room 04 · Color
   The room's exhibits: Temperature, The Wheel, Same Grey
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, clamp, lerp, reduced, color } = P;

  EXHIBITS.color = [
    {
      title: 'Temperature', icon: 'scroll', do: 'Scroll through the moods', cls: 'ex--pin ex--bleed',
      about: 'Five words, five colors. Notice that each color already says its word before you’ve read it — warm ones feel hungry or urgent, cool ones calm or trustworthy.',
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
      about: 'Colors in a fixed relationship on the wheel tend to look like they belong together. Drag the hue and pick a harmony; the swatches and the little app repaint to match.',
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
      about: 'Both squares are exactly the same grey. Your eye judges a color by its neighbours, so the background changes what you see. Hold to take the neighbours away.',
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
