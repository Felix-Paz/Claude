/* =====================================================================
   THE MUSEUM OF DESIGN · rooms 05–07
   Typography · Motion · Balance (+ the museum finale)
   ===================================================================== */
(function () {
  'use strict';
  const { clamp, map, lerp } = M;

  /* ============================================================
     ROOM 05 · TYPOGRAPHY
     ============================================================ */
  ROOMS.define('typography', {
    num: '05',
    name: 'Typography',
    tag: 'The clothing words wear',
    preview: '<span>Aa</span>',
    theme: 'th-typography',

    html() {
      return `
      ${ROOMS.hero({
        num: '05', title: 'Typography',
        titleHTML: '<span class="ty-t1">Typo</span><span class="ty-t2">graphy</span>',
        tagline: 'Before you read a single word, the letters have <em>already spoken.</em>'
      })}

      <!-- Scene · type can act (kinetic / expressive) -->
      <section class="ty-kin sticky-wrap" style="--len:280">
        <div class="sticky-pane">
          <div class="ty-kin-stack" aria-hidden="true">
            <span class="tk tk-grow">BIGGER</span>
            <span class="tk tk-shrink">smaller</span>
            <span class="tk tk-heavy">heavy</span>
            <span class="tk tk-light">light</span>
            <span class="tk tk-fast"><i>fast</i></span>
            <span class="tk tk-spread">s p r e a d</span>
            <span class="tk tk-fall">fall</span>
            <span class="tk tk-shake">shake</span>
          </div>
          <p class="rm-cap ty-kin-cap">Type doesn't just <em>say</em> the word. It can <em>be</em> the word.</p>
          ${ROOMS.plaque('05.0', 'Kinetic Specimens', 'eight words, doing as they say · live')}
        </div>
      </section>

      <!-- Scene A · anatomy of a letter -->
      <section class="ty-anatomy sticky-wrap" style="--len:360">
        <div class="sticky-pane">
          <div class="ty-glyph-wrap">
            <span class="ty-glyph">g</span>
            <span class="ty-rule tr-asc"><i>ascender line</i></span>
            <span class="ty-rule tr-cap"><i>cap height</i></span>
            <span class="ty-rule tr-x"><i>x-height</i></span>
            <span class="ty-rule tr-base"><i>baseline</i></span>
            <span class="ty-rule tr-desc"><i>descender line</i></span>
            <span class="ty-marker tm-counter"><i></i><b>the counter — a letter's lungs</b></span>
          </div>
          <p class="rm-cap ty-anatomy-cap">Every letter is a small building with <em>load-bearing walls.</em></p>
          ${ROOMS.plaque('05.1', 'Anatomy of a g', 'Fraunces, dissected · x-height and all',
            'The double-story g is the hardest letter to draw. Type designers save it for last.')}
        </div>
      </section>

      <!-- Scene B · variable axes -->
      <section class="ty-axes sticky-wrap" style="--len:380">
        <div class="sticky-pane">
          <h2 class="ty-elastic">ELASTIC</h2>
          <div class="ty-axis-hud">
            <span class="ty-axis-name">wght</span>
            <span class="ty-axis-val">100</span>
            <div class="ty-axis-bar"><i></i></div>
          </div>
          <p class="rm-cap ty-axes-cap">One file. Infinite voices. <em>Variable fonts are play-dough.</em></p>
        </div>
      </section>

      <!-- Scene C · same words, different voice -->
      <section class="ty-voice sticky-wrap" style="--len:420">
        <div class="sticky-pane">
          <p class="ty-voice-kicker">Read this out loud, four times:</p>
          <h2 class="ty-say ty-say-0">Trust me.</h2>
          <h2 class="ty-say ty-say-1">TRUST ME.</h2>
          <h2 class="ty-say ty-say-2">trust_me( );</h2>
          <h2 class="ty-say ty-say-3">Trust me.</h2>
          <p class="ty-voice-who"></p>
        </div>
      </section>

      <!-- Scene D · kerning, once seen… -->
      <section class="ty-kern sticky-wrap" style="--len:260">
        <div class="sticky-pane">
          <h2 class="ty-kern-word"><span>K</span><span>E</span><span>R</span><span>N</span><span>I</span><span>N</span><span>G</span></h2>
          <p class="rm-cap ty-kern-cap">Scroll to close the gaps. <em>You'll never unsee it again.</em></p>
        </div>
      </section>

      <!-- Scene E · the four crimes of typesetting -->
      <section class="ty-crimes sticky-wrap" style="--len:480">
        <div class="sticky-pane">
          <div class="ty-court">
            <p class="ty-crime-para">Good typesetting is invisible — you only notice it when it goes wrong. And now that you are about to watch it go wrong four times in a row, you will notice it everywhere, forever: on menus, on slides, on wedding invitations, on the sides of vans. We apologize in advance. There are worse curses to carry.</p>
            <span class="ty-crime-stamp" aria-hidden="true"><b>Crime №1</b><i>lines two feet long</i></span>
          </div>
          <p class="rm-cap ty-crimes-cap">The people vs. this paragraph.</p>
          ${ROOMS.plaque('05.2', 'The Courtroom', 'four misdemeanors · re-enacted hourly')}
        </div>
      </section>

      <!-- Scene F · the playground -->
      <section class="ty-play-scene">
        <p class="rm-cap" data-reveal>You are now a type designer. <em>Move. Click to change family.</em></p>
        <div class="vitrine" data-reveal style="--d:.1s">
          <div class="vitrine-glass">
            <div class="ty-play" data-cursor="drag">
              <span class="ty-play-glyph">Rg</span>
              <div class="ty-play-hud">
                <span class="tp-fam">Archivo</span>
                <span class="tp-wght">wght 400</span>
                <span class="tp-wdth">wdth 100</span>
              </div>
            </div>
          </div>
          <div class="vitrine-base"><span>Please touch the specimens</span></div>
        </div>
      </section>

      ${ROOMS.outro('typography', 'Typography is what language <em>looks like.</em>')}`;
    },

    init(root, c) {
      /* Scene A: rules draw in, one by one */
      const anatomy = root.querySelector('.ty-anatomy');
      const rules = root.querySelectorAll('.ty-rule');
      const marker = root.querySelector('.ty-marker');
      const glyph = root.querySelector('.ty-glyph');
      c.track(anatomy, p => {
        const q = M.map(p, 0.05, 0.9, 0, 1);
        glyph.style.fontVariationSettings = `'opsz' 144, 'wght' ${Math.round(lerp(300, 620, q))}, 'WONK' 1`;
        rules.forEach((r, i) => r.classList.toggle('is-on', q > 0.08 + i * 0.13));
        marker.classList.toggle('is-on', q > 0.8);
      });

      /* Scene B: scrub the variable axes */
      const axes = root.querySelector('.ty-axes');
      const elastic = root.querySelector('.ty-elastic');
      const axName = root.querySelector('.ty-axis-name');
      const axVal = root.querySelector('.ty-axis-val');
      const axBar = root.querySelector('.ty-axis-bar i');
      c.track(axes, p => {
        const q = M.map(p, 0.05, 0.95, 0, 1);
        let w = 400, wd = 100;
        if (q < 0.5) {
          const t = q / 0.5;
          w = lerp(100, 900, t); wd = 62;
          axName.textContent = 'wght';
          axVal.textContent = Math.round(w);
          axBar.style.transform = `scaleX(${t.toFixed(3)})`;
        } else {
          const t = (q - 0.5) / 0.5;
          w = 900; wd = lerp(62, 125, t);
          axName.textContent = 'wdth';
          axVal.textContent = Math.round(wd);
          axBar.style.transform = `scaleX(${t.toFixed(3)})`;
        }
        elastic.style.fontVariationSettings = `'wght' ${Math.round(w)}, 'wdth' ${wd.toFixed(1)}`;
      });

      /* Scene C: four voices */
      const voice = root.querySelector('.ty-voice');
      const says = root.querySelectorAll('.ty-say');
      const who = root.querySelector('.ty-voice-who');
      const whos = [
        '— the poet. serif, light, italic.',
        '— the drill sergeant. heavy, wide, caps.',
        '— the machine. mono, lowercase, suspicious.',
        '— the dessert menu. soft serif, round, warm.'
      ];
      let curV = -1;
      c.track(voice, p => {
        const i = Math.min(3, Math.floor(M.map(p, 0.05, 0.95, 0, 1) * 4));
        if (i === curV) return;
        curV = i;
        says.forEach((s, k) => s.classList.toggle('is-on', k === i));
        who.textContent = whos[i];
      });

      /* Scene D: kerning closes */
      const kern = root.querySelector('.ty-kern');
      const kls = root.querySelectorAll('.ty-kern-word span');
      const gaps = [0, 0.55, 0.1, 0.65, 0.05, 0.5, 0.12]; // em of extra badness
      c.track(kern, p => {
        const q = 1 - M.map(p, 0.1, 0.85, 0, 1);
        kls.forEach((s, i) => { s.style.marginLeft = (gaps[i] * q).toFixed(3) + 'em'; });
      });

      /* Scene E: the four crimes */
      const crimes = root.querySelector('.ty-crimes');
      const court = root.querySelector('.ty-court');
      const stampEl = root.querySelector('.ty-crime-stamp');
      const crimesCap = root.querySelector('.ty-crimes-cap');
      const docket = [
        ['is-clean',  '', '', 'The people vs. this paragraph.'],
        ['is-c1', 'Crime №1', 'lines two feet long', 'Past ~75 characters, the eye loses the trail back.'],
        ['is-c2', 'Crime №2', 'suffocated line-height', 'Leading is the air between floors. This building has none.'],
        ['is-c3', 'Crime №3', 'all caps, all body', 'CAPITALS HAVE NO SILHOUETTE. READING BECOMES SPELLING.'],
        ['is-c4', 'Crime №4', 'centered body text', 'Every line starts somewhere new. Your eye pays the fare.'],
        ['is-acquit', 'Verdict', 'acquitted, with apologies', 'Settings restored. <em>Notice how loud the silence isn’t.</em>']
      ];
      let curCrime = -1;
      c.track(crimes, p => {
        const i = Math.min(5, Math.floor(M.map(p, 0.03, 0.97, 0, 1) * 6));
        if (i === curCrime) return;
        curCrime = i;
        const [cls, kick, name, cap] = docket[i];
        court.className = 'ty-court ' + cls;
        if (kick) {
          stampEl.innerHTML = `<b>${kick}</b><i>${name}</i>`;
          stampEl.classList.remove('slam'); void stampEl.offsetWidth; stampEl.classList.add('slam');
        } else stampEl.classList.remove('slam');
        crimesCap.innerHTML = cap;
      });

      /* Scene F: pointer playground */
      const play = root.querySelector('.ty-play');
      const pg = root.querySelector('.ty-play-glyph');
      const fam = root.querySelector('.tp-fam');
      const wghtEl = root.querySelector('.tp-wght');
      const wdthEl = root.querySelector('.tp-wdth');
      let serif = false, pw = 400, pd = 100, tw = 400, td = 100;
      c.on(play, 'pointermove', e => {
        const r = play.getBoundingClientRect();
        tw = lerp(100, 900, clamp((e.clientX - r.left) / r.width, 0, 1));
        td = lerp(62, 125, clamp(1 - (e.clientY - r.top) / r.height, 0, 1));
      });
      c.on(play, 'click', () => {
        serif = !serif;
        pg.style.fontFamily = serif ? "'Fraunces', Georgia, serif" : "'Archivo', sans-serif";
        fam.textContent = serif ? 'Fraunces' : 'Archivo';
      });
      c.frame((t, dt) => {
        const rect = play.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        const k = 1 - Math.pow(1 - 0.12, dt);
        pw = lerp(pw, tw, k); pd = lerp(pd, td, k);
        pg.style.fontVariationSettings = serif
          ? `'wght' ${Math.round(pw)}, 'opsz' ${lerp(9, 144, (pd - 62) / 63).toFixed(0)}, 'WONK' 1`
          : `'wght' ${Math.round(pw)}, 'wdth' ${pd.toFixed(1)}`;
        wghtEl.textContent = 'wght ' + Math.round(pw);
        wdthEl.textContent = serif
          ? 'opsz ' + lerp(9, 144, (pd - 62) / 63).toFixed(0)
          : 'wdth ' + Math.round(pd);
      });
    }
  });

  /* ============================================================
     ROOM 06 · MOTION
     ============================================================ */
  ROOMS.define('motion', {
    num: '06',
    name: 'Motion',
    tag: "Design's fourth dimension",
    preview: '<i></i><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M8,92 C40,92 60,8 92,8" fill="none"/></svg>',
    theme: 'th-motion',

    html() {
      const dots = Array.from({ length: 80 }, (_, i) =>
        `<i style="--dx:${i % 10};--dy:${Math.floor(i / 10)}"></i>`).join('');
      return `
      ${ROOMS.hero({
        num: '06', title: 'Motion',
        titleHTML: '<span class="mo-l">M</span><span class="mo-l">O</span><span class="mo-l">T</span><span class="mo-l">I</span><span class="mo-l">O</span><span class="mo-l">N</span>',
        tagline: 'Nothing alive moves in a straight line. <em>Neither should your pixels.</em>'
      })}

      <div class="mo-skew">

      <!-- Scene A · the easing race -->
      <section class="mo-race sticky-wrap" style="--len:380">
        <div class="sticky-pane">
          <p class="rm-cap mo-race-cap">Same distance. Same duration. <em>Different soul.</em></p>
          <div class="mo-lanes">
            <div class="mo-lane">
              <span class="mo-lane-name">linear — the robot</span>
              <div class="mo-lane-track"><i class="mo-runner mr-a"></i></div>
              <svg class="mo-curve" viewBox="0 0 100 100"><path d="M0,100 L100,0"/></svg>
            </div>
            <div class="mo-lane">
              <span class="mo-lane-name">ease-in-out — the human</span>
              <div class="mo-lane-track"><i class="mo-runner mr-b"></i></div>
              <svg class="mo-curve" viewBox="0 0 100 100"><path d="M0,100 C35,100 65,0 100,0"/></svg>
            </div>
            <div class="mo-lane">
              <span class="mo-lane-name">spring — the alive one</span>
              <div class="mo-lane-track"><i class="mo-runner mr-c"></i></div>
              <svg class="mo-curve" viewBox="0 0 100 100"><path d="M0,100 C20,100 32,-24 52,-8 C66,4 74,2 100,0"/></svg>
            </div>
          </div>
          ${ROOMS.plaque('06.1', 'The Photo Finish', 'three easings, one distance · looped')}
        </div>
      </section>

      <!-- Scene B · this word reads your scroll -->
      <section class="mo-velo sticky-wrap" style="--len:300">
        <div class="sticky-pane">
          <span class="mo-velo-glow" aria-hidden="true">VELOCITY</span>
          <h2 class="mo-velo-word">VELOCITY</h2>
          <p class="mo-velo-read"><b>0</b> px/s</p>
          <p class="rm-cap mo-velo-cap">This word is wired to your scroll wheel. <em>Floor it.</em></p>
          ${ROOMS.plaque('06.2', 'The Speedometer', 'variable font on a live wire',
            'Width, slant and glow mapped to your scroll velocity. The medium is you.')}
        </div>
      </section>

      <!-- Scene · the morph (tweening between shapes) -->
      <section class="mo-morph sticky-wrap" style="--len:420">
        <div class="sticky-pane">
          <p class="rm-cap mo-morph-cap">Motion is just <em>in-between.</em> Give a start and an end — the machine draws the rest.</p>
          <svg class="mo-morph-svg" viewBox="-110 -110 220 220" aria-hidden="true"><path d=""/></svg>
          <p class="mo-morph-read">tweening <b class="mo-morph-name">circle</b> → <b class="mo-morph-next">square</b></p>
        </div>
      </section>

      <!-- Scene · the velocity ribbon -->
      <section class="mo-ribbon">
        <div class="mo-ribbon-row" aria-hidden="true">
          <span>Design</span><span>in</span><span>Motion</span><span>Design</span><span>in</span><span>Motion</span>
          <span>Design</span><span>in</span><span>Motion</span><span>Design</span><span>in</span><span>Motion</span>
        </div>
        <p class="rm-cap mo-ribbon-cap">Scroll faster — <em>the ribbon feels it.</em></p>
      </section>

      <!-- Scene B · duration is a flavor -->
      <section class="mo-dur">
        <p class="rm-cap" data-reveal>Duration is a flavor. <em>Taste all three.</em></p>
        <div class="mo-toggles">
          <div class="mo-tg" data-reveal style="--d:.05s">
            <button class="mo-toggle" style="--ms:90ms" data-cursor="link" aria-label="90 millisecond toggle"><i></i></button>
            <span><b>90&thinsp;ms</b> twitchy</span>
          </div>
          <div class="mo-tg" data-reveal style="--d:.15s">
            <button class="mo-toggle" style="--ms:280ms" data-cursor="link" aria-label="280 millisecond toggle"><i></i></button>
            <span><b>280&thinsp;ms</b> just right</span>
          </div>
          <div class="mo-tg" data-reveal style="--d:.25s">
            <button class="mo-toggle" style="--ms:1500ms" data-cursor="link" aria-label="1.5 second toggle"><i></i></button>
            <span><b>1500&thinsp;ms</b> molasses</span>
          </div>
        </div>
        <p class="mo-dur-note" data-reveal>Interfaces feel “fast” at ~250–350&thinsp;ms.<br>Below that: nervous. Above: asleep.</p>
      </section>

      <!-- Scene D · choreography -->
      <section class="mo-stagger sticky-wrap" style="--len:340">
        <div class="sticky-pane">
          <div class="mo-grid" aria-hidden="true">${dots}</div>
          <p class="rm-cap mo-stagger-cap">One dot moving is a glitch.<br>Eighty in order is a <em>dance.</em></p>
          ${ROOMS.plaque('06.3', 'The Corps de Ballet', 'eighty dancers · 40ms apart')}
        </div>
      </section>

      <!-- Scene E · the petting zoo -->
      <section class="mo-zoo">
        <p class="rm-cap" data-reveal>The petting zoo. <em>Small motions, big feelings.</em></p>
        <div class="mo-zoo-row">
          <div class="mo-pet" data-reveal style="--d:.05s">
            <button class="mo-like" data-cursor="link" aria-label="Like this exhibit">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.8-10-9.3C.4 8.4 2 4.6 5.6 4.1c2.1-.3 4 .7 5.1 2.3.3.5 1.1.5 1.4 0 1.1-1.6 3-2.6 5.1-2.3 3.6.5 5.2 4.3 3.6 7.6C19.5 16.2 12 21 12 21z"/></svg>
              <span class="mo-burst" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
            </button>
            <b>Celebration</b><span>click it</span>
          </div>
          <div class="mo-pet" data-reveal style="--d:.15s">
            <button class="mo-jump" data-cursor="link">Jump</button>
            <b>Anticipation</b><span>it crouches first</span>
          </div>
          <div class="mo-pet" data-reveal style="--d:.25s">
            <button class="mo-mag" data-cursor="link"><span>Magnet</span></button>
            <b>Magnetism</b><span>circle it slowly</span>
          </div>
        </div>
        ${ROOMS.plaque('06.4', 'Live Specimens', 'three microinteractions · please feed them', '', 'plaque--center')}
      </section>

      <!-- Scene F · the spring toy -->
      <section class="mo-toy-scene">
        <p class="rm-cap" data-reveal>Springs make pixels feel like things. <em>Grab it. Throw it.</em></p>
        <div class="vitrine" data-reveal style="--d:.1s">
          <div class="vitrine-glass">
            <div class="mo-toy">
              <i class="mo-ghost g1"></i><i class="mo-ghost g2"></i><i class="mo-ghost g3"></i>
              <button class="mo-ball" data-cursor="drag" aria-label="Throwable spring ball"></button>
            </div>
          </div>
          <div class="vitrine-base"><span>Please throw the exhibit</span></div>
        </div>
      </section>

      </div>

      ${ROOMS.outro('motion', 'Good motion is invisible. <em>You only feel that it’s alive.</em>')}`;
    },

    init(root, c) {
      /* hero letters spring in */
      root.querySelectorAll('.mo-l').forEach((l, i) => {
        l.animate([
          { transform: 'translateY(-120%) scale(1,1)', opacity: 0, easing: 'cubic-bezier(0.5,0,1,1)' },
          { transform: 'translateY(0) scale(1.06,0.9)', opacity: 1, offset: 0.6, easing: 'cubic-bezier(0.34,1.56,0.64,1)' },
          { transform: 'translateY(0) scale(1,1)', opacity: 1 }
        ], { duration: 900, delay: 220 + i * 80, fill: 'backwards' });
      });

      /* Scene A: three easings, one scrubber */
      const race = root.querySelector('.mo-race');
      const ra = root.querySelector('.mr-a');
      const rb = root.querySelector('.mr-b');
      const rc = root.querySelector('.mr-c');
      const easeInOut = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      const spring = x => 1 - Math.exp(-6 * x) * Math.cos(9 * x);
      c.track(race, p => {
        const q = M.map(p, 0.08, 0.85, 0, 1);
        ra.style.setProperty('--px', q.toFixed(4));
        rb.style.setProperty('--px', easeInOut(q).toFixed(4));
        rc.style.setProperty('--px', clamp(spring(q), 0, 1.15).toFixed(4));
      });

      /* Scene B: the word wired to scroll velocity.
         The glow is a static blurred twin whose opacity changes (composited,
         cheap); glyph re-raster is quantized so idle frames write nothing. */
      const velo = root.querySelector('.mo-velo');
      const veloWord = root.querySelector('.mo-velo-word');
      const veloGlow = root.querySelector('.mo-velo-glow');
      const veloRead = root.querySelector('.mo-velo-read b');
      let veloVis = false, vSmooth = 0, lastW = -1, lastSk = -1, lastPx = -1;
      c.track(velo, p => { veloVis = p > 0 && p < 1; });
      c.frame((t, dt) => {
        if (!veloVis) return;
        const v = Math.abs(M.scroll.sv) * 60; // px/s
        vSmooth = M.lerp(vSmooth, v, 0.2 * dt);
        const q = M.clamp(vSmooth / 2600, 0, 1);
        const w = Math.round(M.lerp(300, 900, q) / 10) * 10; // quantized raster steps
        if (w !== lastW) {
          lastW = w;
          veloWord.style.fontVariationSettings =
            `'wght' ${w}, 'wdth' ${M.lerp(70, 125, q).toFixed(0)}`;
        }
        const sk = Math.round(M.clamp(M.scroll.sv, -30, 30) * -0.5 * 10) / 10;
        if (sk !== lastSk) {
          lastSk = sk;
          veloWord.style.transform = `skewX(${sk}deg)`;
          veloGlow.style.opacity = q.toFixed(2);
        }
        const px = Math.round(vSmooth / 20) * 20;
        if (px !== lastPx) { lastPx = px; veloRead.textContent = px; }
      });

      /* Scene: the morph — one path tweening between four shapes */
      const morph = root.querySelector('.mo-morph');
      const mpath = root.querySelector('.mo-morph-svg path');
      const mName = root.querySelector('.mo-morph-name');
      const mNext = root.querySelector('.mo-morph-next');
      const MN = 64;
      const shapeDefs = [
        { name: 'circle', r: () => 100 },
        { name: 'square', r: a => 80 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))) },
        { name: 'star',   r: a => 72 + 30 * Math.cos(5 * a) },
        { name: 'blob',   r: a => 86 + 17 * Math.sin(3 * a + 1) + 9 * Math.cos(5 * a + 0.5) }
      ];
      const shapes = shapeDefs.map(s => ({
        name: s.name,
        R: Array.from({ length: MN }, (_, i) => s.r(i / MN * Math.PI * 2))
      }));
      const crPath = pts => {
        const n = pts.length;
        let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
        for (let i = 0; i < n; i++) {
          const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
          const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
          const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
          d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
        }
        return d + 'Z';
      };
      c.track(morph, p => {
        const q = clamp(p, 0, 0.9999) * shapes.length;
        const i = Math.floor(q) % shapes.length, j = (i + 1) % shapes.length;
        const tt = q - Math.floor(q), e = tt * tt * (3 - 2 * tt);
        const pts = shapes[i].R.map((r, k) => {
          const rr = r + (shapes[j].R[k] - r) * e;
          const a = k / MN * Math.PI * 2;
          return [Math.cos(a) * rr, Math.sin(a) * rr];
        });
        mpath.setAttribute('d', crPath(pts));
        mName.textContent = shapes[i].name;
        mNext.textContent = shapes[j].name;
      });

      /* Scene: the velocity ribbon — drifts, and your scroll shoves it */
      const ribbon = root.querySelector('.mo-ribbon');
      const row = root.querySelector('.mo-ribbon-row');
      let rx = 0, half = 0;
      c.add(() => { half = row.scrollWidth / 2; });
      c.frame((t, dt) => {
        const rect = ribbon.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        if (!half) half = row.scrollWidth / 2;
        rx -= (0.7 + Math.abs(M.scroll.sv) * 0.85) * dt;
        if (rx < -half) rx += half;
        const skew = clamp(M.scroll.sv * -0.4, -13, 13);
        row.style.transform = `translateX(${rx.toFixed(1)}px) skewX(${skew.toFixed(1)}deg)`;
      });

      /* Scene C: duration toggles */
      root.querySelectorAll('.mo-toggle').forEach(tg =>
        c.on(tg, 'click', () => tg.classList.toggle('is-on')));

      /* Scene E: the petting zoo */
      const like = root.querySelector('.mo-like');
      c.on(like, 'click', () => {
        like.classList.remove('is-liked'); void like.offsetWidth;
        like.classList.add('is-liked');
      });
      const jump = root.querySelector('.mo-jump');
      c.on(jump, 'click', () => {
        jump.classList.remove('is-jumping'); void jump.offsetWidth;
        jump.classList.add('is-jumping');
      });
      const mag = root.querySelector('.mo-mag');
      if (M.fine) {
        c.on(mag, 'pointermove', e => {
          const r = mag.getBoundingClientRect();
          const dx = (e.clientX - r.left - r.width / 2) * 0.42;
          const dyy = (e.clientY - r.top - r.height / 2) * 0.42;
          mag.style.transform = `translate(${dx.toFixed(1)}px, ${dyy.toFixed(1)}px)`;
        });
        c.on(mag, 'pointerleave', () => { mag.style.transform = ''; });
      }

      /* Scene C: stagger wave */
      const stag = root.querySelector('.mo-stagger');
      const grid = root.querySelector('.mo-grid');
      c.track(stag, p => {
        grid.style.setProperty('--q', M.map(p, 0.05, 0.9, 0, 1).toFixed(4));
      });

      /* Scene D: throwable spring ball */
      const toy = root.querySelector('.mo-toy');
      const ball = root.querySelector('.mo-ball');
      const ghosts = root.querySelectorAll('.mo-ghost');
      const s = { x: 0, y: 0, vx: 0, vy: 0, drag: false, lx: 0, ly: 0 };
      const gpos = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
      c.on(ball, 'pointerdown', e => {
        s.drag = true; s.lx = e.clientX; s.ly = e.clientY;
        ball.setPointerCapture(e.pointerId);
      });
      c.on(ball, 'pointermove', e => {
        if (!s.drag) return;
        s.vx = e.clientX - s.lx; s.vy = e.clientY - s.ly;
        s.x += s.vx; s.y += s.vy;
        s.lx = e.clientX; s.ly = e.clientY;
      });
      const drop = () => { s.drag = false; s.vx *= 2.4; s.vy *= 2.4; };
      c.on(ball, 'pointerup', drop);
      c.on(ball, 'pointercancel', drop);
      c.frame((t, dt) => {
        const rect = toy.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        if (!s.drag) {
          const k = 0.09, damp = 0.88;
          s.vx += -s.x * k * dt; s.vy += -s.y * k * dt;
          s.vx *= Math.pow(damp, dt); s.vy *= Math.pow(damp, dt);
          s.x += s.vx * dt; s.y += s.vy * dt;
        }
        const lim = Math.min(rect.width, rect.height) * 0.42;
        s.x = clamp(s.x, -lim * 1.6, lim * 1.6);
        s.y = clamp(s.y, -lim, lim);
        const sp = Math.hypot(s.vx, s.vy);
        const stretch = clamp(1 + sp * 0.012, 1, 1.55);
        const ang = Math.atan2(s.vy, s.vx) * 180 / Math.PI;
        ball.style.transform =
          `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) rotate(${ang.toFixed(1)}deg) scale(${stretch.toFixed(3)}, ${(1 / stretch).toFixed(3)}) rotate(${(-ang).toFixed(1)}deg)`;
        gpos.forEach((g, i) => {
          const kk = 0.32 - i * 0.09;
          g.x = lerp(g.x, s.x, kk * dt); g.y = lerp(g.y, s.y, kk * dt);
          ghosts[i].style.transform = `translate(${g.x.toFixed(1)}px, ${g.y.toFixed(1)}px)`;
        });
      });
    }
  });

  /* ============================================================
     ROOM 07 · BALANCE  (ends with the museum finale)
     ============================================================ */
  ROOMS.define('balance', {
    num: '07',
    name: 'Balance',
    tag: 'Felt, never seen',
    preview: '<div class="dpb-beam"><i></i><b></b></div><u></u>',
    theme: 'th-balance',

    html() {
      return `
      ${ROOMS.hero({
        num: '07', title: 'Balance',
        titleHTML: '<span class="ba-rock">BALANCE</span><span class="ba-fulcrum" aria-hidden="true"></span>',
        tagline: 'You can’t point at it. But you always know <em>when it’s gone.</em>'
      })}

      <!-- Scene A · weight vs distance -->
      <section class="ba-lever sticky-wrap" style="--len:360">
        <div class="sticky-pane">
          <p class="rm-cap ba-lever-cap">Visual weight works like physical weight: <em>big & near ≈ small & far.</em></p>
          <div class="ba-rig">
            <div class="ba-beam">
              <i class="ba-big"></i>
              <b class="ba-small"></b>
            </div>
            <span class="ba-pivot"></span>
            <span class="ba-angle">−9.0°</span>
          </div>
        </div>
      </section>

      <!-- Scene B · symmetry vs asymmetry -->
      <section class="ba-sym sticky-wrap" style="--len:360">
        <div class="sticky-pane">
          <div class="ba-comp">
            <i class="bc bc-1"></i><i class="bc bc-2"></i><i class="bc bc-3"></i>
            <i class="bc bc-4"></i><i class="bc bc-5"></i>
            <span class="ba-axis"></span>
          </div>
          <p class="rm-cap ba-sym-cap">Symmetry always balances. <em>It’s also always predictable.</em></p>
          ${ROOMS.plaque('07.2', 'Mirror, Broken Nicely', 'five shapes, re-hung mid-scroll')}
        </div>
      </section>

      <!-- Scene C · the rule of thirds -->
      <section class="ba-thirds sticky-wrap" style="--len:320">
        <div class="sticky-pane">
          <div class="ba-photo">
            <span class="ba-ground"></span>
            <i class="ba-sun"></i>
            <span class="ba-gl gl-v1"></span><span class="ba-gl gl-v2"></span>
            <span class="ba-gl gl-h1"></span><span class="ba-gl gl-h2"></span>
          </div>
          <p class="rm-cap ba-thirds-cap">Dead center is stable. Stable is <em>static.</em></p>
          ${ROOMS.plaque('07.3', 'Sunset, Rehung', 'the rule of thirds · in motion',
            'Painters knew it, then photographers, then everyone with a phone.')}
        </div>
      </section>

      <!-- Scene D · level it yourself -->
      <section class="ba-game-scene">
        <p class="rm-cap" data-reveal>Your turn. <em>Drag the discs until the frame stops tilting.</em></p>
        <div class="ba-game" data-reveal style="--d:.1s">
          <div class="ba-frame">
            <span class="ba-level-tag">BALANCED</span>
            <button class="ba-disc bd-1" data-cursor="drag" aria-label="Large disc"></button>
            <button class="ba-disc bd-2" data-cursor="drag" aria-label="Medium disc"></button>
            <button class="ba-disc bd-3" data-cursor="drag" aria-label="Small disc"></button>
            <i class="ba-game-pivot"></i>
          </div>
          <span class="ba-game-angle">0.0°</span>
        </div>
      </section>

      <!-- EXIT · the grand doors -->
      <section class="rm-outro">
        <h2 class="rm-statement" data-split>Nothing in this room was crooked. <em>You checked, didn’t you?</em></h2>
        <div class="rm-next" data-reveal>
          <p class="rm-next-kicker">End of the permanent collection</p>
          <a class="rm-next-door" href="#/room/finale" data-room="finale" data-cursor="enter">
            <span class="rm-next-arch"><span class="door-preview dp-finale"><i></i><b></b></span></span>
            <span class="rm-next-meta">
              <b>Through the doors</b>
              <strong>The Rotunda</strong>
              <em>every principle, one last time</em>
            </span>
          </a>
          <a class="rm-back" href="#/" data-cursor="link">↩ or return to the gallery</a>
        </div>
      </section>`;
    },

    init(root, c) {
      /* Scene A: the small disc slides out until the beam levels */
      const lever = root.querySelector('.ba-lever');
      const beam = root.querySelector('.ba-beam');
      const small = root.querySelector('.ba-small');
      const angleEl = root.querySelector('.ba-angle');
      c.track(lever, p => {
        const q = M.map(p, 0.1, 0.85, 0, 1);
        const ang = lerp(-9, 0, q);
        beam.style.transform = `rotate(${ang.toFixed(2)}deg)`;
        small.style.right = lerp(38, 4, q).toFixed(1) + '%';
        angleEl.textContent = (ang < -0.05 ? '−' : '') + Math.abs(ang).toFixed(1) + '°';
        angleEl.classList.toggle('is-level', Math.abs(ang) < 0.1);
      });

      /* Scene B: mirror → counterweighted asymmetry */
      const sym = root.querySelector('.ba-sym');
      const comp = root.querySelector('.ba-comp');
      const symCap = root.querySelector('.ba-sym-cap');
      c.track(sym, p => {
        const q = M.map(p, 0.15, 0.75, 0, 1);
        comp.style.setProperty('--q', q.toFixed(4));
        symCap.innerHTML = q < 0.5
          ? 'Symmetry always balances. <em>It’s also always predictable.</em>'
          : 'Asymmetry balances by trade: <em>one big near the center, small things far away.</em>';
      });

      /* Scene C: the sun finds its third */
      const thirds = root.querySelector('.ba-thirds');
      const photo = root.querySelector('.ba-photo');
      const thirdsCap = root.querySelector('.ba-thirds-cap');
      c.track(thirds, p => {
        const grid = M.map(p, 0.3, 0.45, 0, 1);
        const q = M.map(p, 0.45, 0.85, 0, 1);
        photo.style.setProperty('--grid', grid.toFixed(3));
        photo.style.setProperty('--q', q.toFixed(4));
        const html = q > 0.55
          ? 'On the thirds, the picture has somewhere to go. <em>Tension is interest.</em>'
          : 'Dead center is stable. Stable is <em>static.</em>';
        if (thirdsCap.dataset.txt !== html) { thirdsCap.dataset.txt = html; thirdsCap.innerHTML = html; }
      });

      /* Scene D: drag discs, level the frame */
      const frame = root.querySelector('.ba-frame');
      const discs = Array.from(root.querySelectorAll('.ba-disc'));
      const gAngle = root.querySelector('.ba-game-angle');
      const weights = [3, 2, 1];
      const pos = [{ x: -0.3, y: -0.15 }, { x: 0.32, y: 0.1 }, { x: 0.05, y: 0.3 }];
      let dragging = -1, ang = 0, levelSince = 0;
      discs.forEach((d, i) => {
        c.on(d, 'pointerdown', e => { dragging = i; d.setPointerCapture(e.pointerId); });
        c.on(d, 'pointermove', e => {
          if (dragging !== i) return;
          const r = frame.getBoundingClientRect();
          pos[i].x = clamp((e.clientX - r.left) / r.width - 0.5, -0.44, 0.44);
          pos[i].y = clamp((e.clientY - r.top) / r.height - 0.5, -0.4, 0.4);
        });
        const up = () => { if (dragging === i) dragging = -1; };
        c.on(d, 'pointerup', up);
        c.on(d, 'pointercancel', up);
      });
      c.frame((t, dt) => {
        const rect = frame.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > innerHeight) return;
        let torque = 0; /* balance beam torque */
        discs.forEach((d, i) => {
          d.style.left = ((pos[i].x + 0.5) * 100).toFixed(2) + '%';
          d.style.top = ((pos[i].y + 0.5) * 100).toFixed(2) + '%';
          torque += weights[i] * pos[i].x;
        });
        const target = clamp(torque * 14, -10, 10);
        ang = lerp(ang, target, 1 - Math.pow(1 - 0.07, dt));
        frame.style.transform = `rotate(${ang.toFixed(2)}deg)`;
        gAngle.textContent = (ang < -0.05 ? '−' : '') + Math.abs(ang).toFixed(1) + '°';
        const level = Math.abs(ang) < 0.6;
        levelSince = level ? levelSince + dt * 16.7 : 0;
        frame.classList.toggle('is-level', levelSince > 700);
      });
    }
  });

  /* ============================================================
     ROOM ∞ · THE ROTUNDA
     the grand restoration, passport control, and the gift shop
     ============================================================ */
  ROOMS.define('finale', {
    num: '∞',
    name: 'The Rotunda',
    tag: 'Every principle, one last time',
    preview: '<i></i><b></b>',
    theme: 'th-finale',

    html() {
      const SLOTC = {
        contrast: ['#0B0B0B', '#F7F6F2'], hierarchy: ['#2C39E8', '#FFFFFF'],
        whitespace: ['#FBFAF6', '#1B1A16'], color: ['#0E0D12', '#F5F3EE'],
        typography: ['#F4EBD9', '#1D1608'], motion: ['#0C0C0F', '#C8F23F'],
        balance: ['#C25532', '#FFF6EC']
      };
      const slots = ROOMS.order.map((id, i) => {
        const d = ROOMS.get(id);
        const [bg, fg] = SLOTC[id];
        return `<a class="bp-slot" href="#/room/${id}" data-room="${id}" data-cursor="dot"
          style="--slot:${bg};--slotfg:${fg};--tilt:${(i % 2 ? 1.7 : -1.9)}deg">
          <b>${d.num}</b><i>${d.name}</i><u aria-hidden="true">✓</u></a>`;
      }).join('');
      const cards = ROOMS.order.map((id, i) => {
        const d = ROOMS.get(id);
        return `<a class="ba-postcard" href="#/room/${id}" data-room="${id}" data-cursor="enter" data-cursor-label="Take one" style="--rot:${(i - 3) * 2.4}deg">
          <span class="door-preview dp-${id}">${d.preview}</span>
          <b>${d.name}</b>
          <i>field notes · $0.00</i>
        </a>`;
      }).join('');
      return `
      ${ROOMS.hero({
        num: '∞', title: 'The Rotunda',
        titleHTML: 'ROTUNDA',
        tagline: 'Seven rooms of theory walk into one dome. <em>Watch what they can do together.</em>',
        hint: 'Scroll — the restoration begins'
      })}

      <!-- THE GRAND RESTORATION · staged in the conservation lab -->
      <section class="fn-resto sticky-wrap" style="--len:1000">
        <div class="sticky-pane fn-lab">
          <h3 class="fn-word fw-0" aria-hidden="true">AS FOUND</h3>
          <div class="fn-stage">
            <div class="resto-poster">
              <i class="rp-sun" aria-hidden="true"></i>
              <b class="rp-no" aria-hidden="true">07</b>
              <span class="rp-vert" aria-hidden="true">The Museum of Design · MMXXVI</span>
              <span class="rp-burst" aria-hidden="true">WOW!!!</span>
              <p class="rp-kick">!!EXCLUSIVE EVENT!!</p>
              <h4 class="rp-title">DESIGN GALA NIGHT!!!</h4>
              <p class="rp-sub">the fanciest evening in town!!</p>
              <p class="rp-body">Join us for art, live music, tiny sandwiches and BIG IDEAS!!! Everyone welcome!! Dress code: FABULOUS. Doors open EARLY so COME EARLY!!!</p>
              <p class="rp-meta">SAT JUNE 21 ·· 8PM TILL LATE ·· MAIN HALL</p>
              <span class="rp-cta">CLICK HERE FOR TICKETS!!!!</span>
            </div>
          </div>
          <aside class="fn-side">
            <p class="fn-side-kick">The Grand Restoration<br><em>one poster · seven interventions</em></p>
            <ol class="resto-list">
              <li data-step="1"><b>Contrast</b><span>ink returned to ink</span></li>
              <li data-step="2"><b>Hierarchy</b><span>the title remembers itself</span></li>
              <li data-step="3"><b>White space</b><span>clutter escorted out</span></li>
              <li data-step="4"><b>Color</b><span>the palette enters therapy</span></li>
              <li data-step="5"><b>Typography</b><span>eight fonts become two</span></li>
              <li data-step="6"><b>Motion</b><span>given a pulse</span></li>
              <li data-step="7"><b>Balance</b><span>finally hung straight</span></li>
            </ol>
            <p class="resto-verdict" aria-hidden="true">WOW.</p>
          </aside>
        </div>
      </section>

      <!-- PASSPORT CONTROL -->
      <section class="fn-pass">
        <p class="rm-cap" data-reveal>Passport control. <em>No one is detained — we just like the ink.</em></p>
        <div class="ba-passport" data-reveal style="--d:.08s">
          <div class="bp-head">
            <b>Visitor’s Passport</b>
            <span class="bp-count">0 of 7 rooms stamped</span>
          </div>
          <div class="bp-grid">${slots}</div>
          <p class="bp-note">Stamps are earned by walking, not by reading about walking. Tap an empty tile to go earn it.</p>
        </div>
      </section>

      <!-- THE GIFT SHOP -->
      <section class="ba-shop fn-shop">
        <p class="ba-shop-kicker" data-reveal>· The gift shop ·</p>
        <div class="ba-postcards" data-reveal style="--d:.1s">${cards}</div>
        <p class="ba-shop-note" data-reveal style="--d:.2s">Take one — each card is a printable field guide:<br>eight tricks from its room, free, no receipt necessary.</p>
      </section>

      <!-- EXIT -->
      <section class="fn-exit">
        <h2 class="ba-fin-big" data-split>Design isn’t decoration. <em>It’s decisions —</em> and now they’re yours to make.</h2>
        <a class="ba-exit" href="#/" data-cursor="enter" data-reveal>
          <span>The doors are always open</span>
          <b>← Back to the gallery</b>
        </a>
      </section>`;
    },

    init(root, c) {
      /* the restoration, staged: giant principle words + room washes */
      const resto = root.querySelector('.fn-resto');
      const lab = root.querySelector('.fn-lab');
      const word = root.querySelector('.fn-word');
      const poster = root.querySelector('.resto-poster');
      const items = root.querySelectorAll('.resto-list li');
      const verdict = root.querySelector('.resto-verdict');
      const STEPS = [
        // [word, wash, light-wash?]
        ['AS FOUND', '#161209', false],
        ['CONTRAST', '#050505', false],
        ['HIERARCHY', '#2C39E8', false],
        ['WHITE SPACE', '#F6F4EE', true],
        ['COLOR', '#0E0D12', false],
        ['Typography', '#F4EBD9', true],
        ['MOTION', '#0C0C0F', false],
        ['BALANCE', '#E9E0CF', true],
        ['', '#161209', false]
      ];
      const copyfix = [
        ['.rp-kick', '!!EXCLUSIVE EVENT!!', 'One night only'],
        ['.rp-title', 'DESIGN GALA NIGHT!!!', 'The Design Gala'],
        ['.rp-sub', 'the fanciest evening in town!!', 'An evening for people who notice.'],
        ['.rp-body', 'Join us for art, live music, tiny sandwiches and BIG IDEAS!!! Everyone welcome!! Dress code: FABULOUS. Doors open EARLY so COME EARLY!!!',
                     'Art, live music, small sandwiches, large ideas. Dress code: considered.'],
        ['.rp-meta', 'SAT JUNE 21 ·· 8PM TILL LATE ·· MAIN HALL', 'Sat June 21 · 8 pm · Main Hall'],
        ['.rp-cta', 'CLICK HERE FOR TICKETS!!!!', 'Reserve a seat']
      ];
      let step = -1, typeFixed = false;
      c.track(resto, p => {
        const s = M.clamp(Math.floor(M.map(p, 0.03, 0.97, 0, 1) * 9), 0, 8);
        if (s === step) return;
        const prev = step;
        step = s;
        const [txt, wash, light] = STEPS[s];
        // the whole lab washes to the principle's world
        lab.style.background = wash;
        lab.classList.toggle('on-light', light);
        // the word arrives, styled as the thing it names
        word.className = 'fn-word fw-' + s;
        word.textContent = txt;
        if (txt && !M.reduced) {
          word.classList.remove('pop'); void word.offsetWidth; word.classList.add('pop');
        }
        // the patient improves, cumulatively
        for (let k = 1; k <= 7; k++) poster.classList.toggle('s' + k, s >= k);
        items.forEach(li => li.classList.toggle('is-done', s >= +li.dataset.step));
        verdict.classList.toggle('is-on', s >= 8);
        const wantFixed = s >= 5;
        if (wantFixed !== typeFixed) {
          typeFixed = wantFixed;
          copyfix.forEach(([sel, ugly, fixed]) => {
            poster.querySelector(sel).textContent = wantFixed ? fixed : ugly;
          });
        }
        if (s === 6 && prev === 5 && !M.reduced) {
          Array.from(poster.children).forEach((el, i) => {
            el.animate([
              { opacity: 0, transform: 'translateY(16px)' },
              { opacity: 1, transform: 'translateY(0)' }
            ], { duration: 480, delay: i * 70, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'backwards' });
          });
        }
      });

      /* passport control */
      const S = window.STAMPS;
      if (S) {
        root.querySelectorAll('.bp-slot').forEach(sl =>
          sl.classList.toggle('is-stamped', S.has(sl.dataset.room)));
        const n = ROOMS.order.filter(id => S.has(id)).length;
        root.querySelector('.bp-count').textContent =
          n === 7 ? 'All 7 rooms stamped — a completionist!' : `${n} of 7 rooms stamped`;
      }

      /* the gift shop hands out field notes */
      root.querySelectorAll('.ba-postcard').forEach(pc => {
        c.on(pc, 'click', e => {
          e.preventDefault();
          GUIDES.download(pc.dataset.room);
          pc.classList.add('is-taken');
          pc.querySelector('i').textContent = 'saved to your device ✓';
        });
      });
    }
  });
})();
