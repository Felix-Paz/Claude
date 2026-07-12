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
          <h2 class="mo-velo-word">VELOCITY</h2>
          <p class="mo-velo-read"><b>0</b> px/s</p>
          <p class="rm-cap mo-velo-cap">This word is wired to your scroll wheel. <em>Floor it.</em></p>
          ${ROOMS.plaque('06.2', 'The Speedometer', 'variable font on a live wire',
            'Width, slant and glow mapped to your scroll velocity. The medium is you.')}
        </div>
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

      /* room-wide velocity skew */
      const skew = root.querySelector('.mo-skew');
      c.frame(() => {
        const v = clamp(M.scroll.sv * 0.018, -3.2, 3.2);
        skew.style.transform = `skewY(${v.toFixed(3)}deg)`;
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

      /* Scene B: the word wired to scroll velocity */
      const velo = root.querySelector('.mo-velo');
      const veloWord = root.querySelector('.mo-velo-word');
      const veloRead = root.querySelector('.mo-velo-read b');
      let veloVis = false, vSmooth = 0;
      c.track(velo, p => { veloVis = p > 0 && p < 1; });
      c.frame((t, dt) => {
        if (!veloVis) return;
        const v = Math.abs(M.scroll.sv) * 60; // px/s
        vSmooth = M.lerp(vSmooth, v, 0.2 * dt);
        const q = M.clamp(vSmooth / 2600, 0, 1);
        veloWord.style.fontVariationSettings =
          `'wght' ${Math.round(M.lerp(300, 900, q))}, 'wdth' ${M.lerp(70, 125, q).toFixed(1)}`;
        veloWord.style.transform = `skewX(${(M.clamp(M.scroll.sv, -30, 30) * -0.5).toFixed(2)}deg)`;
        veloWord.style.textShadow = `0 0 ${Math.round(q * 70)}px rgba(200, 242, 63, ${(q * 0.85).toFixed(2)})`;
        veloRead.textContent = Math.round(vSmooth);
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
      const slots = ROOMS.order.map(id => {
        const d = ROOMS.get(id);
        return `<a class="bp-slot" href="#/room/${id}" data-room="${id}" data-cursor="dot">
          <span class="stamp">Visited</span><b>${d ? d.num : '··'}</b><i>${d ? d.name : id}</i></a>`;
      }).join('');
      const cards = ROOMS.order.map((id, i) => {
        const d = ROOMS.get(id);
        return `<a class="ba-postcard" href="#/room/${id}" data-room="${id}" data-cursor="enter" style="--rot:${(i - 3) * 2.4}deg">
          <span class="door-preview dp-${id}">${d ? d.preview : ''}</span>
          <b>${d ? d.name : id}</b>
          <i>postcard · $0.00</i>
        </a>`;
      }).join('');
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

      <!-- FINALE · passport control, then the gift shop -->
      <section class="ba-finale">
        <p class="ba-fin-kicker" data-reveal>End of the permanent collection</p>
        <h2 class="ba-fin-big" data-split>You’ve walked all seven rooms. Design isn’t decoration — <em>it’s decisions.</em></h2>

        <div class="ba-passport" data-reveal>
          <div class="bp-head">
            <b>Visitor’s Passport</b>
            <span class="bp-count">0 of 7 rooms stamped</span>
          </div>
          <div class="bp-grid">${slots}</div>
          <p class="bp-note">Stamps are earned by walking, not by reading about walking.</p>
        </div>

        <div class="ba-shop">
          <p class="ba-shop-kicker" data-reveal>· The gift shop ·</p>
          <div class="ba-postcards" data-reveal style="--d:.1s">${cards}</div>
          <p class="ba-shop-note" data-reveal style="--d:.2s">Take one. Knowledge ships free.</p>
        </div>

        <a class="ba-exit" href="#/" data-cursor="enter" data-reveal style="--d:.15s">
          <span>Exit through the gift shop</span>
          <b>← Back to the gallery</b>
        </a>
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

      /* Finale: stamp the passport with this visit's earnings */
      const S = window.STAMPS;
      if (S) {
        root.querySelectorAll('.bp-slot').forEach(sl =>
          sl.classList.toggle('is-stamped', S.has(sl.dataset.room)));
        const n = ROOMS.order.filter(id => S.has(id)).length;
        root.querySelector('.bp-count').textContent =
          n === 7 ? 'All 7 rooms stamped — a completionist!' : `${n} of 7 rooms stamped`;
      }

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
        let torque = 0;
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
})();
