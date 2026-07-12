/* =====================================================================
   THE MUSEUM OF DESIGN · fluid
   A gooey, living ink that drifts through every room, chases the
   cursor, merges with itself, and re-tints to each room's accent.
   SVG alpha-threshold goo — desktop, fine pointers, motion allowed.
   ===================================================================== */
window.FLUID = (function () {
  'use strict';
  const noop = { setAccent() {} };
  if (M.reduced || !M.fine || innerWidth < 900) return noop;

  const wrap = document.createElement('div');
  wrap.id = 'fluid';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML =
    '<svg width="0" height="0" style="position:absolute"><defs><filter id="goo-f">' +
    '<feGaussianBlur in="SourceGraphic" stdDeviation="20"/>' +
    '<feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -12"/>' +
    '</filter></defs></svg>' +
    '<div class="fluid-field"></div>';
  document.body.appendChild(wrap);
  const field = wrap.querySelector('.fluid-field');

  const N = 5;
  const blobs = [];
  for (let i = 0; i < N; i++) {
    const el = document.createElement('i');
    const r = 42 + i * 20;
    el.style.width = el.style.height = r * 2 + 'px';
    field.appendChild(el);
    blobs.push({
      el, r,
      x: innerWidth * 0.5, y: innerHeight * 0.6,
      k: 0.022 + i * 0.014,     // each blob chases at its own eagerness → goo stretch
      ph: i * 1.87
    });
  }

  M.onFrame((t, dt) => {
    const drag = M.clamp(M.scroll.sv, -60, 60) * -3.2; // scroll leaves the ink behind
    blobs.forEach((b, i) => {
      const wx = Math.sin(t / 2300 + b.ph) * (55 + i * 34);
      const wy = Math.cos(t / 2800 + b.ph * 1.31) * (44 + i * 26);
      const tx = M.pointer.sx + wx;
      const ty = M.pointer.sy + wy + drag;
      const k = 1 - Math.pow(1 - b.k, dt);
      b.x += (tx - b.x) * k;
      b.y += (ty - b.y) * k;
      b.el.style.transform = `translate(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px)`;
    });
  });

  // a click makes the ink gulp
  addEventListener('pointerdown', () => {
    field.classList.remove('is-pulse');
    void field.offsetWidth;
    field.classList.add('is-pulse');
  }, { passive: true });

  function setAccent(a, b) {
    wrap.style.setProperty('--fa', a || '#FF4B14');
    wrap.style.setProperty('--fb', b || a || '#2C39E8');
  }
  setAccent('#FF4B14', '#2C39E8');

  return { setAccent };
})();
