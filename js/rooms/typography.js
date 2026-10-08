/* =====================================================================
   MUSEUM OF DESIGN · Room 05 · Typography
   The room's exhibits: Words That Act, One Font, Kerning
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, reduced } = P;

  EXHIBITS.typography = [
    {
      title: 'Words That Act', icon: 'move', do: 'Watch them work',
      about: 'Each word is set to do what it says. Same alphabet, different behaviour — that’s typography doing the talking.',
      note: 'Type can <em>do</em> what it says.',
      html: () => `
        <div class="acts">
          <div class="act" data-a="bigger"><span class="act-w">BIGGER</span></div>
          <div class="act" data-a="heavy"><span class="act-w">HEAVY</span></div>
          <div class="act" data-a="wide"><span class="act-w">WIDE</span></div>
          <div class="act" data-a="light"><span class="act-w">light</span></div>
          <div class="act" data-a="space"><span class="act-w">SPACE</span></div>
          <div class="act" data-a="fall"><span class="act-w">FALL</span></div>
        </div>`,
      init(el, c) {
        if (reduced) return;
        const w = n => $(`[data-a="${n}"] .act-w`, el);
        const loop = (target, from, to, dur = 1.6, extra = {}) =>
          gsap.fromTo(target, from, Object.assign({ duration: dur, ease: 'power3.inOut', repeat: -1, yoyo: true, repeatDelay: 0.5 }, to, extra));
        const tweens = [
          loop(w('bigger'), { scale: 0.45 }, { scale: 1.15 }),
          loop(w('heavy'), { fontWeight: 200 }, { fontWeight: 900 }),
          loop(w('wide'), { fontStretch: '75%' }, { fontStretch: '125%' }),
          loop(w('light'), { fontWeight: 900, y: 26 }, { fontWeight: 200, y: -26 }),
          loop(w('space'), { letterSpacing: '-0.06em' }, { letterSpacing: '0.4em' })
        ];
        const fc = P.splitChars(w('fall'));
        const fall = gsap.timeline({ repeat: -1, repeatDelay: 0.6 })
          .to(fc, { y: i => [110, 160, 90, 140][i % 4] + '%', rotate: i => [16, -24, 9, -14][i % 4], duration: 0.8, ease: 'power2.in', stagger: 0.1 })
          .to(fc, { y: 0, rotate: 0, duration: 1, ease: 'elastic.out(1, 0.45)', stagger: 0.08 }, '+=0.5');
        tweens.push(fall);
        tweens.forEach(t => t.pause());
        ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: s => tweens.forEach(t => (s.isActive ? t.play() : t.pause())) });
      }
    },
    {
      title: 'One Font', icon: 'slide', do: 'Turn the axes',
      about: 'Everything here comes from a single variable font file. Two sliders — weight and width — give you hundreds of styles in between. Click the word to type your own.',
      note: 'One file. <em>Every voice.</em>',
      html: () => `
        <div class="vf">
          <div class="vf-stage"><span class="vf-word" contenteditable="true" spellcheck="false" aria-label="Editable sample word">Gestalt</span></div>
          <div class="vf-side">
            <div class="vf-presets">
              <button type="button" class="chip" data-p="shout">Shout</button>
              <button type="button" class="chip" data-p="whisper">Whisper</button>
              <button type="button" class="chip" data-p="poster">Poster</button>
            </div>
            <label class="slider"><span class="slider-top mono"><span>Weight</span><output class="vf-ow">640</output></span><input type="range" data-k="w" min="200" max="900" step="1" value="640"></label>
            <label class="slider"><span class="slider-top mono"><span>Width</span><output class="vf-owd">112</output></span><input type="range" data-k="wd" min="75" max="125" step="0.5" value="112"></label>
            <p class="vf-tip mono">Click the word to retype it</p>
          </div>
        </div>`,
      init(el, c) {
        const word = $('.vf-word', el), stage = $('.vf-stage', el), inputs = $$('input', el);
        const ow = $('.vf-ow', el), owd = $('.vf-owd', el);
        const fills = inputs.map(P.rangeFill);
        const s = { w: 640, wd: 112 };
        const render = () => {
          word.style.fontWeight = Math.round(s.w);
          word.style.fontStretch = s.wd.toFixed(1) + '%';
          word.style.fontSize = '';
          const avail = stage.clientWidth * 0.9, ww = word.scrollWidth;
          if (ww > avail) word.style.fontSize = (parseFloat(getComputedStyle(word).fontSize) * avail / ww) + 'px';
          ow.textContent = Math.round(s.w); owd.textContent = s.wd.toFixed(0);
          inputs.forEach((inp, i) => { if (document.activeElement !== inp) inp.value = s[inp.dataset.k]; fills[i](); });
        };
        inputs.forEach(inp => c.on(inp, 'input', () => { s[inp.dataset.k] = +inp.value; render(); }));
        const PRE = { shout: { w: 900, wd: 125 }, whisper: { w: 200, wd: 80 }, poster: { w: 820, wd: 75 } };
        $$('[data-p]', el).forEach(b => c.on(b, 'click', () => {
          $$('[data-p]', el).forEach(x => x.classList.toggle('is-on', x === b));
          gsap.to(s, Object.assign({ duration: reduced ? 0 : 1, ease: 'expo.inOut', onUpdate: render }, PRE[b.dataset.p]));
        }));
        c.on(word, 'keydown', e => { if (e.key === 'Enter') { e.preventDefault(); word.blur(); } });
        c.on(word, 'input', () => { if (word.textContent.length > 14) word.textContent = word.textContent.slice(0, 14); render(); });
        c.on(word, 'blur', () => { if (!word.textContent.trim()) { word.textContent = 'Gestalt'; render(); } });
        render(); c.onResize(render);
      }
    },
    {
      title: 'Kerning', icon: 'slide', do: 'Slide to fix the gaps',
      about: 'Kerning adjusts the space between particular pairs of letters: A and V lean away from each other, T hangs over A. Slide until the gaps look even — your eye will tell you when.',
      note: 'Good spacing <em>disappears.</em>',
      html: () => `
        <div class="kern">
          <p class="kern-word" aria-label="AVATAR">AVATAR</p>
          <label class="slider kern-slider"><span class="slider-top mono"><span>Kerning</span><output class="kern-out">Off</output></span>
            <input type="range" class="kern-range" min="0" max="1" step="0.001" value="0" aria-label="Kerning"></label>
        </div>`,
      init(el, c) {
        const word = $('.kern-word', el), range = $('.kern-range', el), out = $('.kern-out', el);
        const chars = P.splitChars(word);
        // un-kerned: every pair spaced like a typewriter, a few pairs badly off
        const BAD = [0.16, 0.2, 0.18, 0.04, 0.2, 0];
        P.rangeFill(range);
        const render = () => {
          const k = +range.value;
          chars.forEach((ch, i) => { ch.style.marginRight = ((1 - k) * BAD[i]).toFixed(3) + 'em'; });
          word.style.fontKerning = k > 0.5 ? 'normal' : 'none';
          out.textContent = k < 0.05 ? 'Off' : k > 0.95 ? 'Kerned' : Math.round(k * 100) + '%';
        };
        c.on(range, 'input', render);
        render();
        if (!reduced) ScrollTrigger.create({ trigger: el, start: 'top 60%', once: true, onEnter: () => {
          gsap.to(range, { value: 0.35, duration: 1.2, ease: 'power2.inOut', delay: 0.4, onUpdate: () => range.dispatchEvent(new Event('input')) });
        } });
      }
    }
  ];
})();
