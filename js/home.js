/* =====================================================================
   THE MUSEUM OF DESIGN · home
   kinetic hero · pointer light · horizontal gallery corridor
   ===================================================================== */
window.HOME = (function () {
  'use strict';
  const { $, $$, lerp, clamp } = M;

  let heroTrack = null, galleryTrack = null;

  function init() {
    const hero = $('#hero');
    const letters = $$('.hero-title .ht');
    const bg = $('.hero-bg');
    const heroFoot = $('.hero-foot');
    const heroOver = $('.hero-over');

    /* --- kinetic letters: weight & width follow the pointer, scroll scatters --- */
    const L = letters.map((el, i) => ({
      el, i,
      w: 620, wd: 100,        // current variable axes
      cx: 0, cy: 0,           // letter center (measured)
      speed: 0.55 + ((i * 37) % 50) / 55   // scatter parallax factor
    }));
    const measure = () => L.forEach(l => {
      const r = l.el.getBoundingClientRect();
      l.cx = r.left + r.width / 2;          // hero doesn't move horizontally
      l.cy = r.top + scrollY + r.height / 2; // document coords
    });
    measure();
    addEventListener('resize', measure);
    // re-measure once fonts settle
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    let heroP = 0; // 0 at top → 1 when hero has scrolled past
    M.onFrame((t, dt) => {
      if (document.body.dataset.view !== 'home') return;
      const vh = innerHeight;
      heroP = clamp(scrollY / (vh * 0.95), 0, 1);
      if (heroP >= 1 && !M.pointer.moved) return;
      const k = 1 - Math.pow(1 - 0.14, dt);
      L.forEach(l => {
        const dd = Math.hypot(M.pointer.sx - l.cx, M.pointer.sy - (l.cy - scrollY));
        const prox = clamp(1 - dd / (innerWidth * 0.32), 0, 1);
        const idle = Math.sin(t / 900 + l.i * 1.1) * 0.5 + 0.5;
        const tw = lerp(380 + idle * 120, 900, prox);
        const twd = lerp(84 + idle * 10, 125, prox);
        l.w = lerp(l.w, tw, k);
        l.wd = lerp(l.wd, twd, k);
        // quantize so idle frames skip the glyph re-raster
        const qw = Math.round(l.w / 4) * 4, qwd = Math.round(l.wd);
        if (qw !== l.qw || qwd !== l.qwd) {
          l.qw = qw; l.qwd = qwd;
          l.el.style.setProperty('--w', qw);
          l.el.style.setProperty('--wd', qwd);
        }
        // scatter on scroll — each letter departs at its own rate
        const my = -heroP * l.speed * vh * 0.55;
        const mr = heroP * (l.i % 2 ? 6 : -6) * l.speed;
        l.el.style.setProperty('--my', my.toFixed(1));
        l.el.style.setProperty('--mr', mr.toFixed(2));
        l.el.style.opacity = (1 - heroP * 0.9).toFixed(3);
      });
      // the rest of the hero dissolves a touch faster than the letters
      // (leave the entrance reveal alone until scrolling actually starts)
      if (heroP > 0.02) {
        heroFoot.style.opacity = heroOver.style.opacity = clamp(1 - heroP * 1.6, 0, 1).toFixed(3);
      } else {
        heroFoot.style.opacity = heroOver.style.opacity = '';
      }
      // pointer light
      bg.style.setProperty('--lx', (M.pointer.sx / innerWidth * 100).toFixed(2));
      bg.style.setProperty('--ly', (M.pointer.sy / innerHeight * 100).toFixed(2));
    });

    /* --- gallery corridor: vertical scroll becomes horizontal travel --- */
    const gallery = $('#gallery');
    const track = $('.gallery-track');
    const head = $('.gallery-head');
    const halls = $$('.hall', track);

    // visitor stamp badge on every hall (shown once the room is visited)
    halls.forEach(h => {
      const s = document.createElement('span');
      s.className = 'stamp';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = 'Visited';
      h.appendChild(s);
    });

    // the centerpiece leans toward the cursor (fine pointers only)
    if (M.fine) {
      halls.forEach(h => {
        const art = h.querySelector('.hall-art');
        h.addEventListener('pointermove', e => {
          const r = h.getBoundingClientRect();
          const mx = ((e.clientX - r.left) / r.width - 0.5) * 22;
          const myy = ((e.clientY - r.top) / r.height - 0.5) * 14;
          art.style.setProperty('--magx', mx.toFixed(1) + 'px');
          art.style.setProperty('--magy', myy.toFixed(1) + 'px');
        });
        h.addEventListener('pointerleave', () => {
          art.style.setProperty('--magx', '0px');
          art.style.setProperty('--magy', '0px');
        });
      });
    }
    let gx = 0, gtx = 0;
    galleryTrack = M.track(gallery, p => {
      gtx = p;
    });
    M.onFrame((t, dt) => {
      if (document.body.dataset.view !== 'home') return;
      const span = track.scrollWidth - innerWidth;
      if (span <= 0) return;
      const k = 1 - Math.pow(1 - 0.09, dt);
      gx = lerp(gx, gtx, k);
      const x = -gx * span;
      track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      head.style.transform = `translate3d(${(-gx * innerWidth * 0.55).toFixed(1)}px, -50%, 0)`;
      head.style.opacity = clamp(1 - gx * 2.6, 0, 1).toFixed(3);
      // hall centerpieces counter-drift for depth
      halls.forEach(h => {
        const cx = h.offsetLeft + x + h.offsetWidth / 2 - innerWidth / 2;
        h.querySelector('.hall-art').style.setProperty('--par', clamp(cx * -0.045, -60, 60).toFixed(1));
      });
    });

    M.reveal(document);
  }

  return { init };
})();
