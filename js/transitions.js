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
      // a strobing inversion: the halves argue about which is which
      const flip = on => {
        top.style.background = on ? '#fff' : '#000';
        bot.style.background = on ? '#000' : '#fff';
      };
      flip(true); await wait(110);
      flip(false); await wait(90);
      flip(true); await wait(160);
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
        const b = el(ov, `left:0;right:0;top:${y}%;height:${r.h + 0.5}%;background:${r.c};transform:translateX(-101%);` +
                         'display:flex;align-items:center;padding-left:4vw;overflow:hidden');
        b.innerHTML = `<span style="font-family:Archivo,sans-serif;font-weight:850;color:rgb(255 255 255/.28);` +
          `font-size:${Math.max(r.h * 0.62, 5)}vh;line-height:1;font-variation-settings:'wdth' 120">${i + 1}</span>`;
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
      const word = el(ov, 'inset:0;display:grid;place-items:center;opacity:0');
      word.innerHTML = '<span style="font-family:ui-monospace,monospace;font-size:0.72rem;letter-spacing:0.34em;' +
        'text-transform:uppercase;color:#A99F82">( breathe )</span>';
      await anim(c, { transform: ['scale(0)', 'scale(1.02)'] }, { duration: 900, easing: 'cubic-bezier(0.22,1,0.36,1)' });
      await anim(word, { opacity: [0, 1] }, { duration: 300, easing: 'ease' });
      await wait(260);
      await anim(word, { opacity: [1, 0] }, { duration: 220, easing: 'ease' });
    },
    async release(ov) {
      await anim(ov.firstChild, { opacity: [1, 0] }, { duration: 700, easing: 'ease' });
    }
  };

  /* ------- 04 · COLOR: the spectrum sweeps you in ------- */
  const color = {
    async cover(ov) {
      const hues = [
        ['#FF3D2E', 'urgent', '#7A0E05'], ['#FF9A1F', 'hungry', '#7A4302'],
        ['#F4E22C', 'alert', '#6E6407'], ['#3FCB6B', 'calm', '#0E5427'],
        ['#2C39E8', 'trusted', '#0A1268'], ['#0E0D12', '', '']
      ];
      const ps = hues.map(([c, wordTxt, wc], i) => {
        const p = el(ov, `inset:-1px;background:${c};transform:translateX(-101%);` +
                         `display:flex;align-items:center;justify-content:${i % 2 ? 'flex-end' : 'flex-start'};` +
                         'padding:0 6vw;overflow:hidden');
        if (wordTxt) p.innerHTML = `<span style="font-family:ui-monospace,monospace;font-size:0.8rem;` +
          `letter-spacing:0.4em;text-transform:uppercase;color:${wc};opacity:.8">${wordTxt}</span>`;
        return anim(p, { transform: ['translateX(-101%)', 'translateX(0)'] },
                    { duration: 460, delay: i * 90, easing: 'cubic-bezier(0.76,0,0.24,1)' });
      });
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
      const glyph = el(ov, 'inset:0;display:flex;align-items:center;justify-content:center;gap:4vmin');
      glyph.innerHTML =
        '<span style="font-family:Fraunces,Georgia,serif;font-variation-settings:\'opsz\' 144,\'WONK\' 1;font-size:34vmin;line-height:1;color:#1D1608;opacity:0">A</span>' +
        '<span style="font-family:Fraunces,Georgia,serif;font-style:italic;font-variation-settings:\'opsz\' 144;font-size:34vmin;line-height:1;color:#C33A1B;opacity:0">a</span>' +
        '<span style="font-family:Fraunces,Georgia,serif;font-variation-settings:\'opsz\' 144,\'SOFT\' 100;font-size:34vmin;line-height:1;color:#1D1608;opacity:0">&</span>';
      const spans = Array.from(glyph.children);
      const cover = anim(panel, { transform: ['translateY(101%)', 'translateY(0)'] },
                         { duration: 560, easing: 'cubic-bezier(0.76,0,0.24,1)' });
      const stamps = spans.map((s, i) => s.animate([
        { opacity: 0, transform: 'scale(1.7)', fontWeight: 200 },
        { opacity: 1, transform: 'scale(1)', fontWeight: 700 }
      ], { duration: 380, delay: 400 + i * 130, fill: 'forwards', easing: 'cubic-bezier(0.34,1.56,0.64,1)' }).finished);
      await Promise.all([cover, ...stamps]);
      await wait(160);
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
      // ghost echoes trail the drop
      [0.10, 0.05].forEach((op, i) => {
        const g = el(ov, `left:50%;top:100%;width:${d}px;height:${d}px;margin:${-d / 2}px 0 0 ${-d / 2}px;` +
                         `border-radius:50%;background:#C8F23F;opacity:${op};transform:scale(0.045)`);
        g.animate([
          { transform: `translateY(${-innerHeight * 0.9 - d * 0.02}px) scale(0.05)` },
          { transform: 'translateY(0) scale(0.06)' }
        ], { duration: 420, delay: 60 + i * 70, fill: 'forwards', easing: 'cubic-bezier(0.5,0,1,1)' });
      });
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
