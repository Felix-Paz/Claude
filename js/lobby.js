/* =====================================================================
   MUSEUM OF DESIGN · the lobby
   Exhibit 0 (a lens of liquid glass over the museum's name) · the
   building (a 3D model of the museum: pick a room) · the collection
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, reduced } = P;
  const M = MUSEUM;

  M.define('lobby', {
    html() {
      const card = r => `
        <li>
          <a class="hall ${M.passport.has(r.id) ? 'is-stamped' : ''}" href="${M.href(r.id)}" data-sculpt="${r.sculpture}" data-theme="${r.theme}" data-cursor="Enter">
            <span class="hall-top"><span class="hall-num">${r.num}</span><span class="hall-stamp mono" aria-label="visited">Visited</span></span>
            <span class="hall-art" aria-hidden="true"></span>
            <span class="hall-meta"><b>${r.name}</b><i>${r.thesis}</i></span>
          </a>
        </li>`;
      const n = M.passport.count();
      return `
      <div class="lobby">
        <section class="lb-hero" data-theme="ink">
          <canvas class="hero-gl" aria-hidden="true"></canvas>
          <div class="lb-hero-top mono">
            <span>Open daily · Free admission</span>
            <span class="lb-hero-mid">Seven rooms · one rotunda · about 25 minutes</span>
            <span class="lb-date"></span>
          </div>
          <h1 class="hero-type" aria-label="Museum of Design">
            <span class="hl hl-1" data-gl-line aria-hidden="true">Museum<span class="probe"></span></span>
            <span class="hl hl-2" data-gl-line aria-hidden="true"><i>of</i> Design<span class="probe"></span></span>
          </h1>
          <figure class="label lb-hero-label">
            <span class="label-k mono">Exhibit 0 · Lobby</span>
            <b class="label-t">The Lens<span>, 2026</span></b>
            <span class="label-m">Liquid glass, light, your hand</span>
            <em class="label-n">Move it over the letters. Click for a ripple.</em>
          </figure>
          <div class="lb-hero-foot">
            <p class="lb-lede">Seven principles of design, one per room.<br><em>Each one is done to you first — then explained.</em></p>
            <div class="lb-actions">
              <a class="btn btn-solid lb-start" href="#/room/contrast" data-magnetic><span>${n ? 'Continue the tour' : 'Start the tour'}</span><svg><use href="#i-arrow"/></svg></a>
              <button class="btn btn-ghost lb-choose" type="button"><span>See the building</span><svg><use href="#i-down"/></svg></button>
            </div>
          </div>
        </section>

        <section class="lb-building" id="building">
          <header class="lb-sec-head">
            <p class="mono">The building · Scale 1 : 200</p>
            <h2 data-lines>Seven rooms around <em>a rotunda.</em></h2>
            <p class="lb-sec-sub">A model of the museum you're standing in. Drag to turn it, hover a room to peek inside, click to walk through the door.</p>
          </header>
          <div class="bld">
            <div class="bld-stage" data-cursor="Explore" aria-label="A 3D model of the museum. Rooms are also listed below."></div>
            <div class="bld-tip" hidden><span class="mono bld-tip-k"></span><b></b><i></i><span class="mono bld-tip-go"></span></div>
          </div>
          <div class="bld-legend mono" aria-hidden="true">
            <span><i class="lg-you"></i>You are here</span>
            <span><i class="lg-flag"></i>Flag = room visited (${n}/7)</span>
            <span class="lg-walk"><i class="lg-ppl"></i>Other visitors, taking their time</span>
            <span class="lg-scale">Scale 1 : 200 · roof removed for your convenience</span>
          </div>
        </section>

        <section class="lb-halls" id="halls">
          <header class="lb-sec-head">
            <p class="mono">The permanent collection</p>
            <h2 data-lines>Every room, <em>at a glance.</em></h2>
            <p class="lb-sec-sub">Visit in order or wander. Each room stamps your passport; the Rotunda puts everything together.</p>
          </header>
          <ol class="halls">${M.ROOMS.map(card).join('')}${card(M.ROTUNDA)}</ol>
        </section>

        <footer class="lb-colophon mono">
          <span>Museum of Design · 2026</span>
          <span>Mona Sans · Instrument Serif · Geist Mono</span>
          <span>Built by hand — HTML, CSS, GSAP, three.js, GLSL</span>
        </footer>
      </div>`;
    },
    init(root, c, d, { from }) {
      const hero = $('.lb-hero', root), hdr = $('.hdr');
      $('.lb-date', root).textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

      /* ---- Exhibit 0: the lens ---- */
      let lens = null, alive = true;
      if (!reduced && P.HeroGL) {
        try { lens = P.HeroGL.create(hero); } catch (e) { console.warn('[museum] lens unavailable', e); lens = null; }
      }
      const items = $$('.lb-hero-top, .lb-hero-label, .lb-hero-foot > *', root);
      function open() {
        if (!alive) return;
        const tl = gsap.timeline();
        if (lens) { lens.start(); tl.add(lens.intro(2.4), 0); }
        else if (!reduced) tl.from('.lb-hero .hl', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'museum', stagger: 0.1 }, 0.1);
        if (!reduced) tl.from(items, { y: 22, opacity: 0, duration: 1.1, ease: 'museum', stagger: 0.08 }, 0.35);
      }
      if (lens) { lens.setIntro(0); lens.renderOnce(); }
      const gate = document.getElementById('gate');
      if (gate && !gate.hidden) P.on('entered', open); else open();
      c.own(() => { alive = false; if (lens) lens.dispose(); });
      c.onResize(() => { if (lens) lens.resize(); });
      // the header goes dark while it sits over the lens
      let dark = null;
      const tone = on => { if (on === dark) return; dark = on; P.tone(hdr, on ? '#0C0C14' : null, '#F3F0E9'); };
      c.tick(() => tone(hero.getBoundingClientRect().bottom > 68));
      tone(true);
      c.own(() => P.tone(hdr, null));

      /* ---- the building ---- */
      if (window.BUILDING) BUILDING.mount($('.bld-stage', root), $('.bld-tip', root), c);

      /* ---- the collection ---- */
      $$('.hall', root).forEach(a => c.sculpt($('.hall-art', a), a.dataset.sculpt, { auto: 0.3 }));
      const nextRoom = M.ROOMS.find(r => !M.passport.has(r.id)) || M.ROTUNDA;
      $('.lb-start', root).setAttribute('href', M.href(nextRoom.id));
      c.on($('.lb-choose', root), 'click', () => P.scrollToEl($('#building', root)));
      c.own(P.magnetic($('.lb-start', root)));
      if (!reduced) {
        gsap.from($('.bld', root), { y: 80, opacity: 0, duration: 1.3, ease: 'museum', scrollTrigger: { trigger: $('.bld', root), start: 'top 88%', once: true } });
        gsap.from($$('.hall', root), { y: 60, opacity: 0, duration: 1.1, ease: 'museum', stagger: 0.07, scrollTrigger: { trigger: $('.halls', root), start: 'top 85%', once: true } });
      }
      // coming back from a room: land at the model, not the front door
      if (from && from !== 'lobby') requestAnimationFrame(() => { const h = $('#building', root); if (h) { if (P.lenis) P.lenis.scrollTo(h, { immediate: true, offset: -10 }); else h.scrollIntoView(); } });
    }
  });
})();
