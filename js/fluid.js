/* =====================================================================
   THE MUSEUM OF DESIGN · fluid
   A living ink that lives IN the page — not on the cursor. It flows down
   the column as you scroll, pools behind the italic accent phrases to
   highlight them, splits into droplets when several are in view, and
   merges back into one big drop through the empty passages. The pointer
   only stirs it. SVG alpha-threshold goo. Desktop · fine pointer · motion.
   ===================================================================== */
window.FLUID = (function () {
  'use strict';
  const noop = { setAccent() {}, rescan() {} };
  if (M.reduced || !M.fine || innerWidth < 900) return noop;

  const { lerp, clamp } = M;

  const wrap = document.createElement('div');
  wrap.id = 'fluid';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML =
    '<svg width="0" height="0"><defs><filter id="goo-f" color-interpolation-filters="sRGB">' +
    '<feGaussianBlur in="SourceGraphic" stdDeviation="16" result="b"/>' +
    '<feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -13" result="g"/>' +
    '<feBlend in="SourceGraphic" in2="g"/>' +
    '</filter></defs></svg>' +
    '<div class="fluid-field"></div>';
  document.body.appendChild(wrap);
  const field = wrap.querySelector('.fluid-field');

  // --- the drops. A few "highlighters" chase accents; the rest form the body. ---
  const HL = 3, BODY = 4, N = HL + BODY;
  const drops = [];
  for (let i = 0; i < N; i++) {
    const el = document.createElement('i');
    field.appendChild(el);
    drops.push({
      el,
      x: innerWidth * 0.5, y: innerHeight * 0.5,
      w: 120, h: 120,
      hl: i < HL,
      ph: i * 1.9,
      eager: i < HL ? 0.16 + i * 0.05 : 0.05 + i * 0.014
    });
  }

  // --- accent targets: the serif italic phrases that carry the meaning ---
  let scope = document;
  let accents = [];
  function rescan() {
    // the current view's <em> accents + big statement lines
    const root = document.body.dataset.view === 'room'
      ? document.getElementById('room')
      : document.getElementById('home');
    scope = root || document;
    accents = Array.from(scope.querySelectorAll('em, .hero-title .ht, [data-split] i'))
      .filter(el => el.offsetParent !== null)
      .slice(0, 60);
  }
  addEventListener('resize', rescan);
  setTimeout(rescan, 400);

  const CENTER = () => innerHeight * 0.44;

  M.onFrame((t, dt) => {
    // gather the accents currently on screen, nearest-to-focus first
    const vis = [];
    const focus = CENTER();
    for (let i = 0; i < accents.length; i++) {
      const el = accents[i];
      const r = el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > innerHeight + 40 || r.width < 4) continue;
      vis.push({ cx: r.left + r.width / 2, cy: r.top + r.height / 2,
                 w: r.width, h: r.height, d: Math.abs(r.top + r.height / 2 - focus) });
      if (vis.length > 24) break;
    }
    vis.sort((a, b) => a.d - b.d);

    const drag = clamp(M.scroll.sv, -55, 55) * -2.6; // the body lags the scroll
    const px = M.pointer.sx, py = M.pointer.sy;

    drops.forEach((d, i) => {
      let tx, ty, tw, th;

      if (d.hl && vis.length) {
        // a highlighter: pool behind the i-th most central accent
        const a = vis[Math.min(i, vis.length - 1)];
        const stir = Math.sin(t / 700 + d.ph) * 6;
        tx = a.cx + stir;
        ty = a.cy + Math.cos(t / 800 + d.ph) * 4;
        tw = clamp(a.w * 0.62 + a.h * 0.9, 48, 260);
        th = clamp(a.h * 1.15, 30, 96);
      } else {
        // the body: drift down the column, pulled a little toward the pointer & scroll
        const bi = i - HL;
        const homeX = innerWidth * (0.5 + Math.sin(t / 3200 + d.ph) * 0.16);
        const homeY = focus + Math.cos(t / 3600 + d.ph * 1.3) * innerHeight * 0.16 + drag;
        // gentle pointer gravity — a stir, not a leash
        const pg = d.hl ? 0 : 0.12;
        tx = lerp(homeX, px, pg) + Math.sin(t / 900 + bi) * 22;
        ty = lerp(homeY, py, pg * 0.6) + Math.cos(t / 1100 + bi) * 18;
        const big = vis.length ? 92 : 150; // no accents in view → merge into one big drop
        tw = big + bi * 26;
        th = big + bi * 22;
      }

      const k = 1 - Math.pow(1 - d.eager, dt);
      d.x = lerp(d.x, tx, k);
      d.y = lerp(d.y, ty, k);
      d.w = lerp(d.w, tw, 1 - Math.pow(1 - 0.09, dt));
      d.h = lerp(d.h, th, 1 - Math.pow(1 - 0.09, dt));
      d.el.style.width = d.w.toFixed(1) + 'px';
      d.el.style.height = d.h.toFixed(1) + 'px';
      d.el.style.transform =
        `translate(${(d.x - d.w / 2).toFixed(1)}px, ${(d.y - d.h / 2).toFixed(1)}px)`;
    });
  });

  // click sends a ripple through the whole body of ink
  addEventListener('pointerdown', () => {
    field.classList.remove('is-pulse'); void field.offsetWidth;
    field.classList.add('is-pulse');
  }, { passive: true });

  function setAccent(a, b) {
    wrap.style.setProperty('--fa', a || '#FF4B14');
    wrap.style.setProperty('--fb', b || a || '#2C39E8');
  }
  setAccent('#FF4B14', '#2C39E8');

  return { setAccent, rescan };
})();
