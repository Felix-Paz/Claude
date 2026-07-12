/* =====================================================================
   THE MUSEUM OF DESIGN · rooms core
   registry + shared scaffolding every room is built from
   ===================================================================== */
window.ROOMS = (function () {
  'use strict';

  const order = ['contrast', 'hierarchy', 'whitespace', 'color', 'typography', 'motion', 'balance'];
  const defs = {};

  const define = (id, def) => { defs[id] = Object.assign({ id }, def); };
  const get = id => defs[id];
  const next = id => order[(order.indexOf(id) + 1) % order.length];

  /* ---- shared builders ---- */

  // full-viewport room opening: number, giant title, whisper of what's coming
  function hero({ num, title, titleHTML, tagline, hint = 'Scroll — the room will do the rest' }) {
    return `
    <section class="rm-hero">
      <p class="rm-num" data-reveal>Room ${num} <i></i> of 07</p>
      <h1 class="rm-title" aria-label="${title}">${titleHTML || title}</h1>
      <p class="rm-tagline" data-reveal style="--d:.15s">${tagline}</p>
      <div class="rm-hint" data-reveal style="--d:.3s" aria-hidden="true"><span>${hint}</span><i></i></div>
    </section>`;
  }

  // a floating caption used inside sticky scenes
  const caption = (cls, html) => `<p class="rm-cap ${cls}">${html}</p>`;

  // museum exhibit label — number, title, "medium", optional note
  function plaque(no, title, medium, note = '', cls = '') {
    return `
    <figure class="plaque ${cls}" data-reveal>
      <figcaption>
        <b>Exhibit ${no}</b>
        <strong>${title}</strong>
        <em>${medium}</em>
        ${note ? `<p>${note}</p>` : ''}
      </figcaption>
    </figure>`;
  }

  // glass display case on a pedestal, brass "please touch" plate
  function vitrine(inner, label = 'Please touch', cls = '') {
    return `
    <div class="vitrine ${cls}">
      <div class="vitrine-glass">${inner}</div>
      <div class="vitrine-base"><span>${label}</span></div>
    </div>`;
  }

  // closing statement + door to the next room
  function outro(id, statementHTML) {
    const nid = next(id);
    const n = get(nid) || { num: '··', name: nid };
    return `
    <section class="rm-outro">
      <h2 class="rm-statement" data-split>${statementHTML}</h2>
      <div class="rm-next" data-reveal>
        <p class="rm-next-kicker">Continue the visit</p>
        <a class="rm-next-door" href="#/room/${nid}" data-room="${nid}" data-cursor="enter">
          <span class="rm-next-arch"><span class="door-preview dp-${nid}">${n.preview || ''}</span></span>
          <span class="rm-next-meta">
            <b>Room ${n.num}</b>
            <strong>${n.name}</strong>
            <em>${n.tag || ''}</em>
          </span>
        </a>
        <a class="rm-back" href="#/" data-cursor="link">↩ or return to the gallery</a>
      </div>
    </section>`;
  }

  return { order, defs, define, get, next, hero, caption, plaque, vitrine, outro };
})();
