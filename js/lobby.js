/* =====================================================================
   MUSEUM OF DESIGN · the lobby
   atrium with the centrepiece · the collection (one door per room)
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
      return `
      <div class="lobby">
        <section class="lb-atrium">
          <div class="rm-hall-top">
            <span class="mono">Open daily · Free admission</span>
            <span class="mono lb-date"></span>
          </div>
          <h1 class="lb-title"><span class="lb-l1">Museum</span><span class="lb-l2"><i>of</i> Design</span></h1>
          <div class="lb-sculpture" data-cursor="Drag to turn" aria-label="Composition No. 7, a 3D sculpture you can turn"></div>
          <div class="rm-hall-foot">
            <p class="lb-lede">Seven rooms. Seven principles.<br><em>Each one done to you — not explained.</em></p>
            <figure class="label">
              <span class="label-k mono">Lobby · Centrepiece</span>
              <b class="label-t">Composition No. 7<span>, 2026</span></b>
              <span class="label-m">Seven forms, one balance</span>
              <em class="label-n">One shape for every room.</em>
            </figure>
          </div>
          <div class="lb-actions">
            <a class="btn btn-solid lb-start" href="#/room/contrast" data-magnetic><span>${M.passport.count() ? 'Continue the tour' : 'Start the tour'}</span><svg><use href="#i-arrow"/></svg></a>
            <button class="btn btn-ghost lb-choose" type="button"><span>Choose a room</span><svg><use href="#i-down"/></svg></button>
          </div>
        </section>

        <section class="lb-halls" id="halls">
          <header class="lb-halls-head">
            <p class="mono">The permanent collection</p>
            <h2 data-lines>Seven rooms <em>and a rotunda.</em></h2>
            <p class="lb-halls-sub mono">Visit in order, or wander. Each room stamps your passport.</p>
          </header>
          <ol class="halls">${M.ROOMS.map(card).join('')}${card(M.ROTUNDA)}</ol>
        </section>

        <footer class="lb-colophon mono">
          <span>Museum of Design · 2026</span>
          <span>Mona Sans · Instrument Serif · Geist Mono</span>
          <span>Built by hand — HTML, CSS, GSAP, three.js</span>
        </footer>
      </div>`;
    },
    init(root, c, d, { from }) {
      $('.lb-date', root).textContent = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      c.sculpt($('.lb-sculpture', root), 'composition');
      $$('.hall', root).forEach(a => c.sculpt($('.hall-art', a), a.dataset.sculpt, { auto: 0.3 }));
      // next unvisited room is where "continue" leads
      const nextRoom = M.ROOMS.find(r => !M.passport.has(r.id)) || M.ROTUNDA;
      $('.lb-start', root).setAttribute('href', M.href(nextRoom.id));
      c.on($('.lb-choose', root), 'click', () => P.scrollToEl($('#halls', root)));
      c.own(P.magnetic($('.lb-start', root)));
      if (!reduced) {
        gsap.from($$('.lb-l1, .lb-l2', root), { yPercent: 60, opacity: 0, duration: 1.5, ease: 'museum', stagger: 0.12, delay: 0.1 });
        gsap.from($$('.lb-atrium .rm-hall-top, .lb-atrium .rm-hall-foot > *, .lb-actions', root), { y: 20, opacity: 0, duration: 1.1, ease: 'museum', stagger: 0.08, delay: 0.4 });
        gsap.from($$('.hall', root), { y: 60, opacity: 0, duration: 1.1, ease: 'museum', stagger: 0.07, scrollTrigger: { trigger: $('.halls', root), start: 'top 85%', once: true } });
      }
      // coming back from a room: land at the collection, not the front door
      if (from && from !== 'lobby') requestAnimationFrame(() => { const h = $('#halls', root); if (h) { if (P.lenis) P.lenis.scrollTo(h, { immediate: true, offset: -40 }); else h.scrollIntoView(); } });
    }
  });
})();
