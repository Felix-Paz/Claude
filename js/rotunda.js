/* =====================================================================
   MUSEUM OF DESIGN · Room ∞ — the Rotunda
   The Grand Restoration (one awful poster, seven principles, one at a
   time) · passport control · the gift shop · the exit
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, clamp, reduced } = P;
  const M = MUSEUM;

  const STEPS = [
    { word: 'As found', wash: '#1B150D', light: false },
    { word: 'Contrast', wash: '#050507', light: false, id: 'contrast', fix: 'Ink returned to ink' },
    { word: 'Hierarchy', wash: '#3A22FC', light: false, id: 'hierarchy', fix: 'The title remembers it’s the title' },
    { word: 'White Space', wash: '#FBFAF6', light: true, id: 'whitespace', fix: 'The clutter is escorted out' },
    { word: 'Color', wash: '#CDBFFF', light: true, id: 'color', fix: 'One palette, one accent' },
    { word: 'Typography', wash: '#8DEFC5', light: true, id: 'typography', fix: 'Eight fonts become two' },
    { word: 'Motion', wash: '#FD5A32', light: true, id: 'motion', fix: 'Given a pulse' },
    { word: 'Balance', wash: '#FBC49F', light: true, id: 'balance', fix: 'Finally hung straight' },
    { word: '', wash: '#15110C', light: false }
  ];
  const COPY = [
    ['.pz-kick', '!!EXCLUSIVE EVENT!!', 'One night only'],
    ['.pz-title', 'DESIGN GALA NIGHT!!!', 'The Design Gala'],
    ['.pz-sub', 'the fanciest evening in town!!', 'An evening for people who notice.'],
    ['.pz-body', 'Join us for art, live music, tiny sandwiches and BIG IDEAS!!! Everyone welcome!! Dress code: FABULOUS!!', 'Art, live music, small sandwiches, large ideas. Dress code: considered.'],
    ['.pz-meta', 'SAT JUNE 21 ·· 8PM TILL LATE ·· MAIN HALL', 'Sat 21 June · 8 pm · Main Hall'],
    ['.pz-cta', 'CLICK HERE FOR TICKETS!!!!', 'Reserve a seat']
  ];

  M.define('rotunda', {
    html(d) {
      const slots = M.ROOMS.map(r => `
        <a class="pp-slot ${M.passport.has(r.id) ? 'is-stamped' : ''}" href="${M.href(r.id)}" style="--c:${r.ink}" data-cursor="${M.passport.has(r.id) ? 'Revisit' : 'Go get it'}">
          <span class="pp-stamp"><span class="mono">Room</span><b>${r.num}</b><span class="pp-stamp-n">${r.name}</span></span>
          <span class="pp-empty mono">${r.num}<br>${r.name}</span>
        </a>`).join('');
      const cards = M.ROOMS.map((r, i) => `
        <button type="button" class="pc" data-room="${r.id}" data-theme="${r.theme}" style="--r:${(i - 3) * 3.2}deg" data-cursor="Take one">
          <span class="pc-num">${r.num}</span>
          <span class="pc-name">${r.name}</span>
          <span class="pc-foot mono"><span>Field notes</span><span class="pc-price"></span></span>
        </button>`).join('');
      return `
      <article class="room rotunda">
        <section class="rm-hall">
          <div class="rm-hall-top">
            <span class="rm-sign"><b>∞</b><span class="mono">The last room</span></span>
            <span class="mono rm-hall-k">Restoration · passport · gift shop</span>
          </div>
          <h1 class="rm-title"><span>Rotunda</span></h1>
          <div class="rm-sculpture" data-cursor="Drag to turn" aria-label="Armillary, a 3D sculpture you can turn"></div>
          <div class="rm-hall-foot">
            <p class="rm-thesis">${d.thesis}</p>
            <figure class="label">
              <span class="label-k mono">Museum of Design · Permanent collection</span>
              <b class="label-t">${d.work[0]}<span>, 2026</span></b>
              <span class="label-m">${d.work[1]}</span>
              <em class="label-n">${d.work[2]}</em>
            </figure>
          </div>
          <button class="rm-enter mono" type="button"><span>Enter</span><svg><use href="#i-down"/></svg></button>
        </section>

        <section class="ex ex--pin ex--bleed resto" id="ex-1">
          <div class="resto-pin">
            <header class="ex-head">
              <span class="ex-no mono">∞.1</span>
              <h2 class="ex-title">The Grand Restoration</h2>
              <span class="ex-do mono"><svg aria-hidden="true"><use href="#p-scroll"/></svg>Scroll to restore</span>
            </header>
            <p class="resto-word" aria-hidden="true"><span>As found</span></p>
            <div class="resto-stage">
              <div class="pz" aria-label="A poster, restored one principle at a time">
                <i class="pz-sun" aria-hidden="true"></i>
                <span class="pz-burst" aria-hidden="true">WOW!!!</span>
                <span class="pz-sticker" aria-hidden="true">FREE!!</span>
                <span class="pz-spine mono" aria-hidden="true">Museum of Design · MMXXVI</span>
                <b class="pz-no" aria-hidden="true">21</b>
                <p class="pz-kick">!!EXCLUSIVE EVENT!!</p>
                <h3 class="pz-title">DESIGN GALA NIGHT!!!</h3>
                <p class="pz-sub">the fanciest evening in town!!</p>
                <p class="pz-body">Join us for art, live music, tiny sandwiches and BIG IDEAS!!! Everyone welcome!! Dress code: FABULOUS!!</p>
                <p class="pz-meta">SAT JUNE 21 ·· 8PM TILL LATE ·· MAIN HALL</p>
                <span class="pz-cta">CLICK HERE FOR TICKETS!!!!</span>
              </div>
            </div>
            <ol class="resto-list">
              ${STEPS.slice(1, 8).map((s, i) => `<li data-step="${i + 1}"><span class="mono">0${i + 1}</span><b>${s.word}</b><i>${s.fix}</i></li>`).join('')}
            </ol>
            <p class="resto-verdict" aria-hidden="true">Wow.</p>
          </div>
        </section>

        <section class="ex rt-pass" id="ex-2">
          <header class="ex-head">
            <span class="ex-no mono">∞.2</span>
            <h2 class="ex-title" data-lines>Passport Control</h2>
            <span class="ex-do mono"><svg aria-hidden="true"><use href="#p-click"/></svg>Missing one? Tap it</span>
          </header>
          <div class="ex-body">
            <div class="passport">
              <div class="pp-page pp-id">
                <span class="mono">Museum of Design</span>
                <b>Visitor’s<br>Passport</b>
                <dl class="mono"><div><dt>Holder</dt><dd>One curious person</dd></div><div><dt>Issued</dt><dd class="pp-date"></dd></div><div><dt>Stamps</dt><dd class="pp-count"></dd></div></dl>
              </div>
              <div class="pp-page pp-stamps">${slots}</div>
            </div>
          </div>
        </section>

        <section class="ex rt-shop" id="ex-3">
          <header class="ex-head">
            <span class="ex-no mono">∞.3</span>
            <h2 class="ex-title" data-lines>The Gift Shop</h2>
            <span class="ex-do mono"><svg aria-hidden="true"><use href="#p-click"/></svg>Take a postcard</span>
          </header>
          <div class="ex-body"><div class="postcards">${cards}</div></div>
          <p class="ex-note" data-reveal>Each card is a printable field guide. <em>Free — no receipt.</em></p>
        </section>

        <section class="rt-exit">
          <p class="exit-k mono">Exit</p>
          <h2 class="exit-line" data-lines>Design isn’t decoration. <em>It’s decisions — and now they’re yours.</em></h2>
          <div class="rt-exit-actions">
            <a class="btn btn-solid" href="#/"><svg><use href="#i-back"/></svg><span>Back to the lobby</span></a>
            <button class="btn btn-ghost rt-again" type="button"><span>Visit again with a fresh passport</span></button>
          </div>
        </section>
      </article>`;
    },
    init(root, c, d) {
      const title = $('.rm-title span', root);
      const fitT = () => P.fit(title, { box: $('.rm-title', root), vw: 17, maxSize: P.vw() * 0.24 });
      fitT(); c.onResize(fitT);
      c.sculpt($('.rm-sculpture', root), 'armillary');
      c.on($('.rm-enter', root), 'click', () => P.scrollToEl($('#ex-1', root)));
      if (!reduced) {
        gsap.from(title, { yPercent: 30, opacity: 0, duration: 1.4, ease: 'museum', delay: 0.15 });
        gsap.to(title, { yPercent: -18, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: $('.rm-hall', root), start: 'top top', end: 'bottom top', scrub: true } });
      }

      /* ---- the restoration ---- */
      const sec = $('.resto', root), pin = $('.resto-pin', root), word = $('.resto-word', root), wordSpan = $('.resto-word span', root);
      const pz = $('.pz', root), items = $$('.resto-list li', root), verdict = $('.resto-verdict', root);
      let step = -1, fixed = false, inside = false;
      const hdr = $('.hdr');
      const toneHdr = () => { const S = STEPS[Math.max(0, step)]; P.tone(hdr, inside ? S.wash : null, S.light ? '#0C0C14' : '#F3F0E9'); };
      c.own(() => P.tone(hdr, null));
      const fitWord = () => { if (wordSpan.textContent) P.fit(wordSpan, { box: word, vw: 16, maxSize: P.vw() * 0.2, min: 75, max: 125 }); };
      function show(s) {
        if (s === step) return;
        const prev = step;
        step = s;
        const S = STEPS[s];
        pin.style.background = S.wash;
        pin.classList.toggle('on-light', S.light);
        toneHdr();
        word.className = 'resto-word rw-' + s;
        wordSpan.textContent = S.word;
        wordSpan.style.fontSize = ''; wordSpan.style.fontStretch = '';
        fitWord();
        if (S.word && !reduced) gsap.fromTo(wordSpan, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'museum' });
        for (let k = 1; k <= 7; k++) pz.classList.toggle('s' + k, s >= k);
        items.forEach(li => li.classList.toggle('is-done', s >= +li.dataset.step));
        verdict.classList.toggle('is-on', s >= 8);
        pz.classList.toggle('is-final', s >= 8);
        const want = s >= 5;
        if (want !== fixed) { fixed = want; COPY.forEach(([sel, a, b]) => { $(sel, pz).textContent = want ? b : a; }); }
        if (s === 6 && prev === 5 && !reduced) gsap.from(Array.from(pz.children), { opacity: 0, y: 14, duration: 0.6, ease: 'museum', stagger: 0.06 });
      }
      show(0);
      ScrollTrigger.create({
        trigger: sec, pin, start: 'top top', end: () => '+=' + Math.round(innerHeight * 5.5),
        onUpdate: s => show(clamp(Math.floor(s.progress * 9.2), 0, 8)),
        onToggle: s => { inside = s.isActive; toneHdr(); }
      });
      c.onResize(fitWord);

      /* ---- passport control ---- */
      $('.pp-date', root).textContent = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const n = M.passport.count();
      $('.pp-count', root).textContent = n === 7 ? 'All seven — completionist' : n + ' of 7';
      const stamped = $$('.pp-slot.is-stamped .pp-stamp', root);
      if (!reduced && stamped.length) gsap.from(stamped, { scale: 2, rotate: -20, opacity: 0, duration: 0.45, ease: 'power4.in', stagger: 0.12, scrollTrigger: { trigger: $('.passport', root), start: 'top 70%', once: true } });

      /* ---- gift shop ---- */
      $$('.pc', root).forEach(card => c.on(card, 'click', () => {
        GUIDES.download(card.dataset.room);
        card.classList.add('is-taken');
        $('.pc-price', card).textContent = '✓';
        P.toast('Field notes saved — ' + M.get(card.dataset.room).name, M.get(card.dataset.room).ink);
      }));

      /* ---- exit ---- */
      c.on($('.rt-again', root), 'click', () => {
        M.passport.clear();
        try { sessionStorage.removeItem('mod-ticket'); } catch (e) {}
        location.hash = '#/';
        setTimeout(() => location.reload(), 60);
      });
    }
  });
})();
