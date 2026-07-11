/* =====================================================================
   THE MUSEUM OF DESIGN · transitions
   Travelling to a room uses the principle you are about to learn.
   Each transition: cover(overlay, meta) → swap happens → release(overlay)
   ===================================================================== */
window.TRANSITIONS = (function () {
  'use strict';

  const anim = (el, kf, opts) =>
    el.animate(kf, Object.assign({ fill: 'forwards', easing: 'cubic-bezier(0.83,0,0.17,1)' }, opts)).finished;

  const el = (parent, css) => {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;' + css;
    parent.appendChild(d);
    return d;
  };

  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ------- fallback / reduced motion: a quiet fade ------- */
  const fade = {
    cover(ov) {
      const p = el(ov, 'inset:-1px;background:#14110B;opacity:0');
      return anim(p, { opacity: [0, 1] }, { duration: 350, easing: 'ease' });
    },
    release(ov) {
      return anim(ov.firstChild, { opacity: [1, 0] }, { duration: 350, easing: 'ease' });
    }
  };

  /* ------- 01 · CONTRAST: black & white slam shut, reopen inverted ------- */
  const contrast = {
    async cover(ov) {
      const top = el(ov, 'left:0;right:0;top:-1px;height:51%;background:#000;transform:translateY(-101%)');
      const bot = el(ov, 'left:0;right:0;bottom:-1px;height:51%;background:#fff;transform:translateY(101%)');
      await Promise.all([
        anim(top, { transform: ['translateY(-101%)', 'translateY(0)'] }, { duration: 480 }),
        anim(bot, { transform: ['translateY(101%)', 'translateY(0)'] }, { duration: 480 })
      ]);
      // the invert flash: swap which half is which
      top.style.background = '#fff'; bot.style.background = '#000';
      await wait(180);
    },
    async release(ov) {
      const [top, bot] = ov.children;
      await Promise.all([
        anim(top, { transform: ['translateY(0)', 'translateY(-101%)'] }, { duration: 520 }),
        anim(bot, { transform: ['translateY(0)', 'translateY(101%)'] }, { duration: 520 })
      ]);
    }
  };

  /* ------- 02 · HIERARCHY: bars cascade in, biggest first ------- */
  const hierarchy = {
    async cover(ov) {
      const rows = [
        { h: 34, c: '#2C39E8' }, { h: 24, c: '#4553F2' }, { h: 17, c: '#6470F5' },
        { h: 13, c: '#8B95F8' }, { h: 13, c: '#B7BDFB' }
      ];
      let y = 0;
      const ps = rows.map((r, i) => {
        const b = el(ov, `left:0;right:0;top:${y}%;height:${r.h + 0.5}%;background:${r.c};transform:translateX(-101%)`);
        y += r.h;
        return anim(b, { transform: ['translateX(-101%)', 'translateX(0)'] }, { duration: 520, delay: i * 75 });
      });
      await Promise.all(ps);
      await wait(120);
    },
    async release(ov) {
      const ps = Array.from(ov.children).map((b, i) =>
        anim(b, { transform: ['translateX(0)', 'translateX(101%)'] }, { duration: 520, delay: i * 70 }));
      await Promise.all(ps);
    }
  };

  /* ------- 03 · WHITE SPACE: one slow white breath from the click ------- */
  const whitespace = {
    async cover(ov, meta) {
      const x = meta && meta.x != null ? meta.x : innerWidth / 2;
      const y = meta && meta.y != null ? meta.y : innerHeight / 2;
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const c = el(ov, `left:${x}px;top:${y}px;width:${r * 2}px;height:${r * 2}px;margin:${-r}px 0 0 ${-r}px;` +
                       'border-radius:50%;background:#FBFAF6;transform:scale(0)');
      await anim(c, { transform: ['scale(0)', 'scale(1.02)'] }, { duration: 900, easing: 'cubic-bezier(0.22,1,0.36,1)' });
      await wait(150);
    },
    async release(ov) {
      await anim(ov.firstChild, { opacity: [1, 0] }, { duration: 700, easing: 'ease' });
    }
  };

  /* ------- 04 · COLOR: the spectrum sweeps you in ------- */
  const color = {
    async cover(ov) {
      const hues = ['#FF3D2E', '#FF9A1F', '#F4E22C', '#3FCB6B', '#2C39E8', '#0E0D12'];
      const ps = hues.map((c, i) =>
        anim(el(ov, `inset:-1px;background:${c};transform:translateX(-101%)`),
             { transform: ['translateX(-101%)', 'translateX(0)'] },
             { duration: 460, delay: i * 90, easing: 'cubic-bezier(0.76,0,0.24,1)' }));
      await Promise.all(ps);
    },
    async release(ov) {
      // everything but the last (void-dark) panel already sits behind it
      await anim(ov.lastChild, { opacity: [1, 0] }, { duration: 500, easing: 'ease' });
    }
  };

  /* ------- 05 · TYPOGRAPHY: a glyph stamps the page shut ------- */
  const typography = {
    async cover(ov) {
      const panel = el(ov, 'inset:-1px;background:#F4EBD9;transform:translateY(101%)');
      const glyph = el(ov, 'inset:0;display:grid;place-items:center;opacity:0');
      glyph.innerHTML = '<span style="font-family:Fraunces,Georgia,serif;font-size:38vmin;line-height:1;' +
        "font-variation-settings:'opsz' 144,'WONK' 1;font-weight:250;color:#1D1608\">Aa</span>";
      const span = glyph.firstChild;
      const cover = anim(panel, { transform: ['translateY(101%)', 'translateY(0)'] },
                         { duration: 560, easing: 'cubic-bezier(0.76,0,0.24,1)' });
      const stamp = anim(glyph, { opacity: [0, 1] }, { duration: 200, delay: 380 });
      const weight = span.animate(
        [{ fontVariationSettings: "'opsz' 144, 'WONK' 1, 'wght' 250" },
         { fontVariationSettings: "'opsz' 144, 'WONK' 1, 'wght' 800" }],
        { duration: 550, delay: 380, fill: 'forwards', easing: 'cubic-bezier(0.34,1.56,0.64,1)' }).finished;
      await Promise.all([cover, stamp, weight]);
      await wait(140);
    },
    async release(ov) {
      const [panel, glyph] = ov.children;
      await Promise.all([
        anim(glyph, { opacity: [1, 0] }, { duration: 220 }),
        anim(panel, { transform: ['translateY(0)', 'translateY(-101%)'] },
             { duration: 560, delay: 120, easing: 'cubic-bezier(0.76,0,0.24,1)' })
      ]);
    }
  };

  /* ------- 06 · MOTION: a ball drops, squashes, and swallows the screen ------- */
  const motion = {
    async cover(ov) {
      const d = Math.max(innerWidth, innerHeight) * 2.4;
      const ball = el(ov, `left:50%;top:100%;width:${d}px;height:${d}px;margin:${-d / 2}px 0 0 ${-d / 2}px;` +
                          'border-radius:50%;background:#C8F23F;transform:translateY(-4%) scale(0.04)');
      // drop in from above, squash at the floor, then inflate over everything
      await ball.animate([
        { transform: `translateY(${-innerHeight * 0.9 - d * 0.02}px) scale(0.055)`, easing: 'cubic-bezier(0.5,0,1,1)' },
        { transform: 'translateY(0) scale(0.075, 0.045)', offset: 0.42, easing: 'cubic-bezier(0.34,1.3,0.64,1)' },
        { transform: 'translateY(0) scale(1.05)' }
      ], { duration: 950, fill: 'forwards' }).finished;
      const veil = el(ov, 'inset:-1px;background:#0C0C0F;opacity:0');
      await anim(veil, { opacity: [0, 1] }, { duration: 260, easing: 'ease' });
    },
    async release(ov) {
      await anim(ov, { opacity: [1, 0] }, { duration: 480, easing: 'ease' });
      ov.style.opacity = '';
    }
  };

  /* ------- 07 · BALANCE: a plane tips, settles level, lifts away ------- */
  const balance = {
    async cover(ov) {
      const p = el(ov, 'left:-20%;right:-20%;top:-20%;bottom:-20%;background:#E9E0CF;' +
                       'transform:translateY(120%) rotate(-10deg)');
      await p.animate([
        { transform: 'translateY(120%) rotate(-10deg)', easing: 'cubic-bezier(0.22,1,0.36,1)' },
        { transform: 'translateY(0) rotate(4deg)', offset: 0.55, easing: 'cubic-bezier(0.34,1.56,0.64,1)' },
        { transform: 'translateY(0) rotate(-1.4deg)', offset: 0.8, easing: 'cubic-bezier(0.34,1.56,0.64,1)' },
        { transform: 'translateY(0) rotate(0deg)' }
      ], { duration: 1000, fill: 'forwards' }).finished;
      await wait(100);
    },
    async release(ov) {
      await anim(ov.firstChild, { transform: ['translateY(0) rotate(0deg)', 'translateY(-120%) rotate(6deg)'] },
                 { duration: 650, easing: 'cubic-bezier(0.76,0,0.24,1)' });
    }
  };

  return { fade, contrast, hierarchy, whitespace, color, typography, motion, balance };
})();
