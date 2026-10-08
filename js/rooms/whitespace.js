/* =====================================================================
   MUSEUM OF DESIGN · Room 03 · White Space
   The room's exhibits: The Clutter, One Per Wall, Leading
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, clamp, reduced } = P;

  EXHIBITS.whitespace = [
    {
      title: 'The Clutter', icon: 'scroll', do: 'Scroll to clear it', cls: 'ex--pin',
      about: 'Thirty-two things fighting for attention. Scroll and they leave one by one until a single word is left.',
      note: 'Take things away until the important one is easy to find.',
      html: () => `
        <div class="ws">
          <div class="ws-pin">
            <div class="ws-clutter" aria-hidden="true"></div>
            <p class="ws-word"><i>Breathe.</i></p>
            <p class="ws-count mono" aria-hidden="true"></p>
          </div>
        </div>`,
      init(el, c) {
        const clutter = $('.ws-clutter', el), word = $('.ws-word i', el), count = $('.ws-count', el);
        let seed = 7;
        const rnd = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
        const pick = a => a[Math.floor(rnd() * a.length)];
        const SW = [['#E8461E', '#121110'], ['#FFD21F', '#121110'], ['#1D3ECF', '#EEEAE2'], ['#121110', '#EEEAE2'], ['#BFD3C2', '#121110'], ['#EBC6B8', '#121110'], ['#E4D2B0', '#121110']];
        const TXT = { badge: ['Sale', 'New!', '−50%', 'Hot', 'Free shipping', 'Limited', 'Best seller', 'Act now', 'Trending', 'Only 2 left', '#1', 'Deal', 'VIP', 'Bonus', 'Last chance'], tag: ['Cookies?', 'Subscribe', 'Pop-up', 'Ad', 'Sponsored', 'Chat with us'], burst: ['Sale', 'Wow', 'New'], btn: ['Click here', 'Buy now', 'Sign up'] };
        const plan = [].concat(Array(12).fill('badge'), Array(6).fill('tag'), Array(3).fill('burst'), Array(3).fill('btn'), Array(5).fill('dot'), Array(3).fill('sq'));
        const items = plan.map((type, i) => {
          const n = document.createElement('span');
          const [bg, fg] = pick(SW);
          n.className = 'jk jk-' + type;
          const ring = i % 3, a = rnd() * Math.PI * 2, rr = [0.13, 0.28, 0.42][ring] + rnd() * 0.07;
          const x = 50 + Math.cos(a) * rr * 100, y = 50 + Math.sin(a) * rr * 90;
          n.style.setProperty('--x', clamp(x, 6, 94) + '%'); n.style.setProperty('--y', clamp(y, 6, 90) + '%');
          n.style.setProperty('--r', ((rnd() - 0.5) * 34).toFixed(1) + 'deg');
          n.style.fontSize = `clamp(10px, ${(0.8 + rnd() * 0.7).toFixed(2)}vw, 22px)`;
          if (TXT[type]) { n.textContent = pick(TXT[type]); n.style.background = bg; n.style.color = fg; }
          else { n.style.setProperty('--s', (2 + rnd() * 3.5).toFixed(1) + 'em'); n.style.background = bg; }
          n.dataset.dx = x - 50; n.dataset.dy = y - 50;
          clutter.appendChild(n);
          return n;
        });
        const total = items.length;
        count.textContent = total + ' things want your attention';
        const order = items.slice().sort((p, q) => Math.hypot(p.dataset.dx, p.dataset.dy) - Math.hypot(q.dataset.dx, q.dataset.dy));
        const tl = gsap.timeline();
        order.forEach((n, i) => {
          const dx = +n.dataset.dx, dy = +n.dataset.dy, dd = Math.hypot(dx, dy) || 1, push = 70 + (i % 5) * 14;
          tl.to(n, { x: (dx / dd) * push + 'vw', y: (dy / dd) * push * 0.7 + 'vh', rotate: (i % 2 ? 1 : -1) * (40 + (i % 7) * 12), opacity: 0, ease: 'power2.in', duration: 1 }, i * 0.04);
        });
        tl.fromTo(word, { scale: 0.9 }, { scale: 1.15, letterSpacing: '0.03em', ease: 'power1.inOut', duration: 1.2 }, 0.6);
        ScrollTrigger.create({
          trigger: el, pin: $('.ws-pin', el), start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.5),
          scrub: reduced ? true : 0.6, animation: tl,
          onUpdate: s => {
            const left = Math.max(1, Math.round(total * (1 - clamp(s.progress * 1.15, 0, 1))));
            count.textContent = left <= 1 ? 'One thing left' : left + ' things want your attention';
          }
        });
      }
    },
    {
      title: 'One Per Wall', icon: 'click', do: 'Switch the wall',
      about: 'Twelve paintings hung two ways: frame to frame, or one per wall with its own light. Which ones look more valuable?',
      note: 'Galleries give expensive things a whole wall each.',
      html: () => `
        <div class="wall">
          <div class="seg wall-seg" role="radiogroup" aria-label="Wall">
            <button type="button" role="radio" aria-checked="true" data-w="sale">Salon hang</button>
            <button type="button" role="radio" aria-checked="false" data-w="gallery">One per wall</button>
            <i class="seg-thumb" aria-hidden="true"></i>
          </div>
          <div class="wall-stage"></div>
        </div>`,
      init(el, c) {
        const stage = $('.wall-stage', el);
        // twelve small works; the first one is the masterpiece
        const ART = [
          '<circle cx="50" cy="50" r="24" fill="#E8461E"/>',
          '<rect x="30" y="30" width="40" height="40" fill="#1D3ECF"/>', '<path d="M50 24 76 72H24z" fill="#121110"/>', '<circle cx="50" cy="50" r="20" fill="#BFD3C2"/>',
          '<rect x="26" y="40" width="48" height="20" fill="#E4D2B0"/>', '<circle cx="40" cy="44" r="14" fill="#EBC6B8"/><circle cx="60" cy="58" r="14" fill="#1D3ECF"/>', '<path d="M24 70 50 30 76 70" fill="none" stroke="#E8461E" stroke-width="6"/>',
          '<rect x="36" y="24" width="28" height="52" fill="#FFD21F"/>', '<circle cx="50" cy="50" r="26" fill="none" stroke="#121110" stroke-width="5"/>', '<rect x="28" y="28" width="44" height="44" rx="22" fill="#E8461E"/>',
          '<path d="M30 30h40v40H30z" fill="none" stroke="#1D3ECF" stroke-width="5"/>', '<circle cx="50" cy="50" r="10" fill="#121110"/>'
        ];
        // in 3D: a corner of a real gallery
        const g3 = window.EX3D ? EX3D.gallery(stage, c, ART) : null;
        if (g3) { stage.classList.add('is-3d'); stage.setAttribute('data-cursor', 'Move to look'); P.seg($('.wall-seg', el), b => g3.set(b.dataset.w)); return; }
        stage.innerHTML = ART.map((a, i) => `<figure class="frame ${i === 0 ? 'frame-hero' : ''}"><svg viewBox="0 0 100 100">${a}</svg></figure>`).join('');
        const frames = $$('.frame', stage);
        // yard-sale layout: salon hang, everything touching everything
        const SALE = [[50, 48, 15], [22, 26, 11], [37, 22, 9], [64, 20, 12], [80, 30, 10], [18, 60, 13], [33, 66, 9], [64, 70, 11], [80, 64, 12], [48, 80, 8], [8, 40, 8], [92, 50, 8]];
        const lay = mode => frames.forEach((f, i) => {
          const g = mode === 'gallery';
          const [x, y, w] = g ? (i === 0 ? [50, 50, 24] : SALE[i]) : SALE[i];
          gsap.to(f, { left: x + '%', top: y + '%', width: w + '%', opacity: g && i ? 0 : 1, scale: g && i ? 0.6 : 1, rotate: g ? 0 : ((i * 37) % 9 - 4), duration: reduced ? 0 : 1.1, ease: 'expo.inOut', delay: g ? (i ? i * 0.02 : 0.25) : (i ? 0.2 + i * 0.03 : 0) });
          f.classList.toggle('is-lit', g && i === 0);
        });
        frames.forEach((f, i) => { const [x, y, w] = SALE[i]; gsap.set(f, { left: x + '%', top: y + '%', width: w + '%', rotate: (i * 37) % 9 - 4, xPercent: -50, yPercent: -50 }); });
        P.seg($('.wall-seg', el), b => lay(b.dataset.w));
      }
    },
    {
      title: 'Leading', icon: 'click', do: 'Try all three',
      about: 'Leading (it rhymes with wedding) is the space between lines. The measure is how long each line runs. Try all three settings.',
      note: 'For body text: line height around 1.5, lines around 65 characters.',
      html: () => `
        <div class="lead">
          <div class="seg lead-seg" role="radiogroup" aria-label="Spacing">
            <button type="button" role="radio" aria-checked="true" data-m="tight">Cramped</button>
            <button type="button" role="radio" aria-checked="false" data-m="air">Comfortable</button>
            <button type="button" role="radio" aria-checked="false" data-m="vacuum">Too airy</button>
            <i class="seg-thumb" aria-hidden="true"></i>
          </div>
          <div class="lead-scale" aria-hidden="true">
            <i class="lead-ideal"><span class="mono">Readers’ sweet spot · 45–75 ch</span></i>
            <b class="lead-measure"><span class="mono lm-ch2"></span></b>
          </div>
          <div class="lead-page">
            <p class="lead-kick mono">A note on margins</p>
            <p class="lead-para">White space costs nothing and never goes out of style. When a paragraph is cramped, the eye loses its place at the end of every line and has to hunt for the next one. Give the lines room and a comfortable length, and reading stops feeling like work.</p>
          </div>
          <p class="lead-meta mono"><span>Line height <b class="lm-lh">1.00</b></span><span>Measure <b class="lm-ch">120</b> ch</span><span class="lm-verdict">Tiring to read</span></p>
        </div>`,
      init(el, c) {
        const page = $('.lead-page', el), para = $('.lead-para', el), lh = $('.lm-lh', el), ch = $('.lm-ch', el), ch2 = $('.lm-ch2', el), verdict = $('.lm-verdict', el), measure = $('.lead-measure', el), lead = $('.lead', el);
        const S = { tight: { lh: 1.0, mw: 112, ls: -0.02 }, air: { lh: 1.6, mw: 62, ls: 0.004 }, vacuum: { lh: 3.2, mw: 30, ls: 0.06 } };
        const VERDICT = { tight: 'Tiring to read', air: 'Comfortable', vacuum: 'Falling apart' };
        const s = Object.assign({}, S.tight);
        const render = () => {
          lead.style.setProperty('--lh', s.lh.toFixed(3));
          lead.style.setProperty('--mw', s.mw.toFixed(1) + 'ch');
          para.style.letterSpacing = s.ls.toFixed(3) + 'em';
          lh.textContent = s.lh.toFixed(2); ch.textContent = ch2.textContent = Math.round(s.mw);
          measure.classList.toggle('is-ok', s.mw >= 45 && s.mw <= 75);
        };
        render();
        P.seg($('.lead-seg', el), b => {
          const m = b.dataset.m;
          verdict.textContent = VERDICT[m];
          verdict.dataset.m = m;
          gsap.to(s, Object.assign({ duration: reduced ? 0 : 1.3, ease: 'expo.inOut', onUpdate: render }, S[m]));
        });
        verdict.dataset.m = 'tight';
      }
    }
  ];
})();
