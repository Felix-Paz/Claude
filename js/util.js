/* =====================================================================
   THE MUSEUM OF DESIGN · util
   tiny engine: raf hub · pointer · scroll trackers · split text · reveals
   ===================================================================== */
window.M = (function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => v < min ? min : v > max ? max : v;
  const map   = (v, a, b, c, d, cl = true) => {
    const t = (v - a) / (b - a);
    const r = c + (d - c) * t;
    return cl ? (c < d ? clamp(r, c, d) : clamp(r, d, c)) : r;
  };
  const pad2 = n => String(n).padStart(2, '0');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine    = matchMedia('(pointer: fine)').matches;

  /* ---------- raf hub ---------- */
  const rafSubs = new Set();
  let lastT = performance.now();
  function loop(t) {
    const dt = Math.min((t - lastT) / 16.667, 3) || 1; // normalized to 60fps frames
    lastT = t;
    rafSubs.forEach(fn => fn(t, dt));
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  const onFrame = fn => { rafSubs.add(fn); return () => rafSubs.delete(fn); };

  /* ---------- pointer ---------- */
  const pointer = {
    x: innerWidth / 2, y: innerHeight / 2,   // raw
    sx: innerWidth / 2, sy: innerHeight / 2, // smoothed
    nx: 0.5, ny: 0.5,                        // normalized raw
    down: false, moved: false
  };
  addEventListener('pointermove', e => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.nx = e.clientX / innerWidth; pointer.ny = e.clientY / innerHeight;
    pointer.moved = true;
  }, { passive: true });
  addEventListener('pointerdown', () => { pointer.down = true; }, { passive: true });
  addEventListener('pointerup',   () => { pointer.down = false; }, { passive: true });
  onFrame((t, dt) => {
    const k = 1 - Math.pow(1 - 0.14, dt);
    pointer.sx = lerp(pointer.sx, pointer.x, k);
    pointer.sy = lerp(pointer.sy, pointer.y, k);
  });

  /* ---------- scroll trackers ---------- */
  /* modes:
     'sticky' — progress of a tall wrapper with a sticky child:
                0 when wrapper hits top, 1 when its bottom hits viewport bottom
     'view'   — progress of an element travelling through the viewport:
                0 entering at bottom, 1 leaving at top                          */
  const tracks = new Set();

  function measureOne(tr) {
    const r = tr.el.getBoundingClientRect();
    const top = r.top + scrollY;
    if (tr.mode === 'sticky') {
      tr.top = top;
      tr.len = Math.max(tr.el.offsetHeight - innerHeight, 1);
    } else {
      tr.top = top - innerHeight;
      tr.len = Math.max(tr.el.offsetHeight + innerHeight, 1);
    }
  }

  function track(el, cb, mode = 'sticky') {
    const tr = { el, cb, mode, p: -1 };
    measureOne(tr);
    tracks.add(tr);
    tr.off = () => tracks.delete(tr);
    return tr;
  }

  function remeasure() { tracks.forEach(measureOne); }
  let rszT;
  addEventListener('resize', () => { clearTimeout(rszT); rszT = setTimeout(remeasure, 120); });

  const scroll = { y: scrollY, v: 0, sv: 0 };
  onFrame((t, dt) => {
    const y = scrollY;
    scroll.v = (y - scroll.y) / dt;
    scroll.sv = lerp(scroll.sv, scroll.v, 0.12 * dt);
    scroll.y = y;
    tracks.forEach(tr => {
      const p = clamp((y - tr.top) / tr.len, 0, 1);
      if (p !== tr.p) { tr.p = p; tr.cb(p); }
    });
  });

  /* ---------- split text (word-level, keeps inline tags like <em>) ---------- */
  function split(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    let wi = 0;
    const walk = node => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.style.setProperty('--wi', wi++);
            const i = document.createElement('i');
            i.textContent = part;
            w.appendChild(i);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains('w')) {
          walk(child);
        }
      });
    };
    walk(el);
  }

  /* ---------- reveal observer ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('inview'); io.unobserve(en.target); }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });

  function reveal(scope = document) {
    $$('[data-split]', scope).forEach(el => { split(el); io.observe(el); });
    $$('[data-reveal]', scope).forEach(el => io.observe(el));
  }

  /* ---------- per-room disposable context ---------- */
  function ctx() {
    const bin = [];
    return {
      on(target, ev, fn, opts) {
        target.addEventListener(ev, fn, opts);
        bin.push(() => target.removeEventListener(ev, fn, opts));
      },
      frame(fn) { bin.push(onFrame(fn)); },
      track(el, cb, mode) { const tr = track(el, cb, mode); bin.push(tr.off); return tr; },
      interval(fn, ms) { const id = setInterval(fn, ms); bin.push(() => clearInterval(id)); },
      add(fn) { bin.push(fn); },
      destroy() { bin.forEach(fn => fn()); bin.length = 0; }
    };
  }

  return { $, $$, lerp, clamp, map, pad2, reduced, fine,
           onFrame, pointer, scroll, track, remeasure, split, reveal, ctx };
})();
