/* =====================================================================
   MUSEUM OF DESIGN · the room
   Every room follows the same plan, so visitors always know where they
   are: an entrance hall (wall text + the room's sculpture in a niche),
   its exhibits (title · one instruction · what's going on · an
   audio-guide stop · one takeaway), and an exit that stamps the
   passport and opens the door to the next room. A rail on the left
   tracks the way through.
   Exhibits themselves live in js/rooms/<room>.js as EXHIBITS[id].
   ===================================================================== */
window.EXHIBITS = {};
window.ROOM = (function () {
  'use strict';
  const { $, $$, reduced } = P;
  const M = MUSEUM;

  const strip = h => String(h || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const label = w => `
    <figure class="label">
      <span class="label-k mono">Museum of Design · Permanent collection</span>
      <b class="label-t">${w[0]}<span>, 2026</span></b>
      <span class="label-m">${w[1]}</span>
      <em class="label-n">${w[2]}</em>
    </figure>`;

  /* ---------------- the entrance hall ---------------- */
  const hall = {
    html(d, list) {
      return `
        <section class="rm-hall" id="hall">
          <div class="rm-hall-top">
            <span class="rm-sign"><b>${d.num}</b><span class="mono">${d.num === '∞' ? 'The last room' : 'Room ' + d.num + ' of 07'}</span></span>
            <span class="mono rm-hall-k">${list.length} exhibits · about ${d.mins} minutes · please touch</span>
          </div>
          <div class="rm-wall">
            <h1 class="rm-title"><span>${d.name.replace(/^The /, '')}</span></h1>
            <p class="rm-thesis">${d.thesis}</p>
            <p class="rm-intro">${d.intro}</p>
            <div class="rm-list">
              <p class="mono rm-list-k">In this room</p>
              <ol>${list.map((e, i) => `
                <li><button type="button" data-goto="${i + 1}"><span class="mono">${d.num}.${i + 1}</span><b>${e.title}</b><i>${e.do}</i><svg aria-hidden="true"><use href="#i-arrow"/></svg></button></li>`).join('')}
              </ol>
            </div>
            <button class="btn btn-solid rm-enter" type="button"><span>Enter the room</span><svg><use href="#i-down"/></svg></button>
          </div>
          <div class="rm-niche">
            <div class="rm-alcove"><div class="rm-sculpture" data-cursor="Drag to turn" aria-label="${d.work[0]}, a 3D sculpture you can turn"></div></div>
            ${label(d.work)}
          </div>
        </section>`;
    },
    init(root, c, d) {
      const title = $('.rm-title span', root);
      const fitTitle = () => P.fit(title, { box: $('.rm-title', root), vw: 9, maxSize: Math.min(P.vw() * 0.125, 190) });
      fitTitle(); c.onResize(fitTitle);
      c.sculpt($('.rm-sculpture', root), d.sculpture);
      $$('.rm-list [data-goto]', root).forEach(b => c.on(b, 'click', () => P.scrollToEl($('#ex-' + b.dataset.goto, root))));
      c.on($('.rm-enter', root), 'click', () => P.scrollToEl($('#ex-1', root)));
      if (!reduced) {
        gsap.timeline({ delay: 0.1 })
          .from(title, { yPercent: 40, opacity: 0, duration: 1.3, ease: 'museum' })
          .from($$('.rm-hall-top, .rm-thesis, .rm-intro, .rm-list-k, .rm-list li, .rm-enter', root), { y: 18, opacity: 0, duration: 0.9, ease: 'museum', stagger: 0.05 }, 0.2)
          .from($('.rm-alcove', root), { clipPath: 'inset(100% 0 0 0 round 999px 999px 0 0)', duration: 1.3, ease: 'museum' }, 0.1)
          .from($('.rm-niche .label', root), { y: 16, opacity: 0, duration: 0.9, ease: 'museum' }, 0.6);
      }
    }
  };

  /* ---------------- the audio guide ---------------- */
  // every exhibit has a numbered stop, read aloud by the browser's own voice
  const voice = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let speaking = null;
  function listen(btn, text, c) {
    if (!voice) { btn.hidden = true; return; }
    const stop = () => { speechSynthesis.cancel(); if (speaking) speaking.classList.remove('is-on'); speaking = null; };
    c.on(btn, 'click', () => {
      if (speaking === btn) { stop(); return; }
      stop();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.02;
      const voices = speechSynthesis.getVoices();
      const en = voices.find(v => /en(-|_)GB/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang));
      if (en) u.voice = en;
      u.onend = u.onerror = () => { if (speaking === btn) { btn.classList.remove('is-on'); speaking = null; } };
      speaking = btn; btn.classList.add('is-on');
      speechSynthesis.speak(u);
    });
    c.own(() => { if (speaking) stop(); });
  }

  /* ---------------- one exhibit ---------------- */
  const stopNo = (d, i) => (d.num === '∞' ? '8' : d.num.replace(/^0/, '')) + (i + 1);
  const exhibit = {
    html: (d, e, i) => `
        <section class="ex ${e.cls || ''}" id="ex-${i + 1}" data-ex="${i}">
          <div class="ex-intro">
            <header class="ex-head">
              <span class="ex-no mono">${d.num}.${i + 1}</span>
              <h2 class="ex-title" data-lines>${e.title}</h2>
              <span class="ex-do mono"><svg aria-hidden="true"><use href="#p-${e.icon}"/></svg>${e.do}</span>
            </header>
            ${e.about ? `<div class="ex-about"><p>${e.about}</p><button type="button" class="ex-listen mono" aria-label="Audio guide: listen to ${strip(e.title)}"><svg aria-hidden="true"><use href="#i-audio"/></svg><span>Audio guide · stop ${stopNo(d, i)}</span></button></div>` : ''}
          </div>
          <div class="ex-body">${e.html()}</div>
          ${e.note ? `<p class="ex-note" data-reveal>${e.note}</p>` : ''}
        </section>`,
    init(root, c, d, list) {
      // pinned exhibits keep their wall text on screen for the whole pin
      $$('.ex--pin', root).forEach(sec => {
        const pinEl = sec.querySelector('.ex-body [class$="-pin"]') || sec.querySelector('[class$="-pin"]');
        const intro = $('.ex-intro', sec);
        if (!pinEl || !intro) return;
        pinEl.prepend(intro);
        // the pinned content starts below the wall text, however tall it wraps
        const measure = () => pinEl.style.setProperty('--intro-h', intro.offsetHeight + 'px');
        measure();
        c.onResize(measure);
        if (document.fonts) document.fonts.ready.then(measure);
      });
      list.forEach((e, i) => {
        const sec = $(`#ex-${i + 1}`, root);
        const btn = $('.ex-listen', sec);
        if (btn) listen(btn, `${strip(e.title)}. ${strip(e.about)} ${strip(e.note)}`, c);
        if (e.init) e.init($('.ex-body', sec), c, sec);
      });
    }
  };

  /* ---------------- the rail: hall · exhibits · exit ---------------- */
  const rail = {
    html: (d, list, exitLabel) => `
        <nav class="rm-rail" aria-label="In this room">
          <a href="#hall" data-to="hall"><i></i><span>Entrance</span></a>
          ${list.map((e, i) => `<a href="#ex-${i + 1}" data-to="ex-${i + 1}"><i></i><span>${d.num}.${i + 1} ${strip(e.title)}</span></a>`).join('')}
          <a href="#exit" data-to="exit"><i></i><span>${exitLabel}</span></a>
        </nav>`,
    init(root, c) {
      const nav = $('.rm-rail', root);
      if (!nav) return;
      document.body.appendChild(nav);
      c.own(() => nav.remove());
      const links = $$('a', nav);
      const secs = links.map(a => document.getElementById(a.dataset.to));
      links.forEach((a, i) => c.on(a, 'click', e => { e.preventDefault(); P.scrollToEl(secs[i]); }));
      let cur = -1;
      c.tick(() => {
        const mid = innerHeight * 0.45;
        let k = 0;
        secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < mid) k = i; });
        if (k === cur) return;
        cur = k;
        links.forEach((a, i) => { a.classList.toggle('is-here', i === k); a.classList.toggle('is-past', i < k); });
        nav.classList.toggle('is-on', k > 0);
      });
    }
  };

  /* ---------------- the room template ---------------- */
  M.define('room', {
    html(d) {
      const list = EXHIBITS[d.id];
      const nx = M.next(d.id);
      return `
      <article class="room room-${d.id}">
        ${hall.html(d, list)}
        ${list.map((e, i) => exhibit.html(d, e, i)).join('')}
        <section class="rm-exit" id="exit">
          <div class="exit-pass">
            <div class="exit-stamp" style="--c:${d.ink}">
              <span class="mono">Museum of Design</span>
              <b>${d.num}</b>
              <span class="exit-stamp-name">${d.name}</span>
              <span class="mono exit-stamp-date"></span>
            </div>
          </div>
          <p class="exit-k mono">End of Room ${d.num} · Rule of thumb</p>
          <h2 class="exit-line" data-lines>${d.closing}</h2>
          <a class="exit-door" href="${M.href(nx.id)}" data-cursor="Enter">
            <span class="exit-door-art" style="--next:${nx.bg}" aria-hidden="true"></span>
            <span class="exit-door-meta">
              <span class="mono">Next · ${nx.id === 'rotunda' ? 'Room ∞' : 'Room ' + nx.num}</span>
              <b>${nx.name}</b>
              <i>${nx.thesis}</i>
            </span>
            <span class="exit-door-go"><svg><use href="#i-arrow"/></svg></span>
          </a>
          <a class="exit-lobby mono" href="#/"><svg><use href="#i-back"/></svg>Back to the lobby</a>
        </section>
        ${rail.html(d, list, 'Exit')}
      </article>`;
    },
    init(root, c, d) {
      hall.init(root, c, d);
      exhibit.init(root, c, d, EXHIBITS[d.id]);
      rail.init(root, c);
      // the exit stamps the passport when the visitor actually reaches it
      const exit = $('.rm-exit', root), stamp = $('.exit-stamp', root);
      $('.exit-stamp-date', root).textContent = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const already = M.passport.has(d.id);
      if (already) stamp.classList.add('is-in');
      ScrollTrigger.create({
        trigger: exit, start: 'top 55%', once: true,
        onEnter: () => {
          const fresh = M.passport.add(d.id);
          if (reduced || already) { stamp.classList.add('is-in'); return; }
          gsap.timeline()
            .fromTo(stamp, { scale: 2.4, rotate: -24, opacity: 0 }, { scale: 1, rotate: -9, opacity: 1, duration: 0.42, ease: 'power4.in' })
            .add(() => stamp.classList.add('is-in'))
            .fromTo(exit, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.3)' });
          if (fresh) c.later(() => P.toast(`Room ${d.num} stamped · ${M.passport.count()} of 7`, d.ink), 500);
        }
      });
      c.sculpt($('.exit-door-art', root), M.next(d.id).sculpture, { auto: 0.5, drag: false });
    }
  });

  return { hall, exhibit, rail, listen, strip, label, voice };
})();
