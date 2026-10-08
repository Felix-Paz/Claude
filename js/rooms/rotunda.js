/* =====================================================================
   MUSEUM OF DESIGN · Room ∞ — the Rotunda
   The Grand Restoration (one awful poster, seven principles, one at a
   time) · passport control · the gift shop (a 3D postcard spinner) ·
   the exit
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, clamp, reduced } = P;
  const M = MUSEUM;

  const STEPS = [
    { word: 'As found', wash: '#1B150D', light: false, cap: 'Everything shouts, nothing leads, nothing lines up.' },
    { word: 'Contrast', wash: '#050507', light: false, id: 'contrast', fix: 'Ink returned to ink', cap: 'The neon goes. Dark ink on a pale sheet: now you can read it.' },
    { word: 'Hierarchy', wash: '#3A22FC', light: false, id: 'hierarchy', fix: 'The title remembers it’s the title', cap: 'The title gets big, the details get small. There’s a first thing.' },
    { word: 'White Space', wash: '#FBFAF6', light: true, id: 'whitespace', fix: 'The clutter is escorted out', cap: 'Stickers, bursts and borders leave. The rest gets room.' },
    { word: 'Color', wash: '#CDBFFF', light: true, id: 'color', fix: 'One palette, one accent', cap: 'Eight colors become one accent: a coral sun.' },
    { word: 'Typography', wash: '#8DEFC5', light: true, id: 'typography', fix: 'Eight fonts become two', cap: 'One sans to speak, one serif to sing. The words calm down too.' },
    { word: 'Motion', wash: '#FD5A32', light: true, id: 'motion', fix: 'Given a pulse', cap: 'Parts arrive in order, and the sun breathes.' },
    { word: 'Balance', wash: '#FBC49F', light: true, id: 'balance', fix: 'Finally hung straight', cap: 'Straightened, aligned to a grid, weighted against the sun.' },
    { word: '', wash: '#15110C', light: false, cap: 'Same words. Same event. Seven decisions.' }
  ];
  const COPY = [
    ['.pz-kick', '!!EXCLUSIVE EVENT!!', 'One night only'],
    ['.pz-title', 'DESIGN GALA NIGHT!!!', 'The Design Gala'],
    ['.pz-sub', 'the fanciest evening in town!!', 'An evening for people who notice.'],
    ['.pz-body', 'Join us for art, live music, tiny sandwiches and BIG IDEAS!!! Everyone welcome!! Dress code: FABULOUS!!', 'Art, live music, small sandwiches, large ideas. Dress code: considered.'],
    ['.pz-meta', 'SAT JUNE 21 ·· 8PM TILL LATE ·· MAIN HALL', 'Sat 21 June · 8 pm · Main Hall'],
    ['.pz-cta', 'CLICK HERE FOR TICKETS!!!!', 'Reserve a seat']
  ];

  const LIST = [
    {
      title: 'The Grand Restoration', icon: 'scroll', do: 'Scroll to restore', cls: 'ex--pin ex--bleed resto',
      about: 'One truly terrible poster. As you scroll, each room you visited fixes one thing — in order — and only that thing. Watch the checklist on the right.',
      html: () => `
            <div class="resto-pin">
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
              <p class="resto-cap"><span class="mono resto-cap-k">As found</span><span class="resto-cap-t">${STEPS[0].cap}</span></p>
              <p class="resto-verdict" aria-hidden="true">Wow.</p>
            </div>`
    },
    {
      title: 'Passport Control', icon: 'click', do: 'Missing one? Tap it', cls: 'rt-pass',
      about: 'Every room you finished stamped your passport on the way out. An empty circle means a room still waiting for you — tap it to go back.',
      html: () => `
            <div class="passport">
              <div class="pp-page pp-id">
                <span class="mono">Museum of Design</span>
                <b>Visitor’s<br>Passport</b>
                <dl class="mono"><div><dt>Holder</dt><dd>One curious person</dd></div><div><dt>Issued</dt><dd class="pp-date"></dd></div><div><dt>Stamps</dt><dd class="pp-count"></dd></div></dl>
              </div>
              <div class="pp-page pp-stamps">${M.ROOMS.map(r => `
                <a class="pp-slot ${M.passport.has(r.id) ? 'is-stamped' : ''}" href="${M.href(r.id)}" style="--c:${r.ink}" data-cursor="${M.passport.has(r.id) ? 'Revisit' : 'Go get it'}">
                  <span class="pp-stamp"><span class="mono">Room</span><b>${r.num}</b><span class="pp-stamp-n">${r.name}</span></span>
                  <span class="pp-empty mono">${r.num}<br>${r.name}</span>
                </a>`).join('')}</div>
            </div>`
    },
    {
      title: 'The Gift Shop', icon: 'drag', do: 'Spin it, take a card', cls: 'rt-shop',
      about: 'Every museum ends in a gift shop; this one is free. Spin the rack and pick a postcard — each one is a printable, one-page field guide to its room.',
      note: 'Exit through the gift shop. <em>No receipt needed.</em>',
      html: () => `
            <div class="shop">
              <div class="shop-rack" data-cursor="Spin · click a card" aria-hidden="true"></div>
              <ul class="shop-list" aria-label="Postcards">${M.ROOMS.map(r => `
                <li><button type="button" class="shop-btn" data-room="${r.id}" style="--c:${r.ink}"><span class="mono">${r.num}</span><b>${r.name}</b><i class="mono shop-got">Saved ✓</i></button></li>`).join('')}
              </ul>
            </div>`
    }
  ];

  /* ---------------- the postcard spinner ---------------- */
  function cardTexture(r, w = 512, h = 720) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    const light = !['ink', 'ultra'].includes(r.theme);
    const fg = light ? '#0C0C14' : '#F3F0E9';
    g.fillStyle = r.bg; g.fillRect(0, 0, w, h);
    if (r.theme === 'paper') { g.strokeStyle = 'rgba(12,12,20,0.12)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); }
    // a big quiet motif per room
    g.save();
    g.globalAlpha = light ? 0.14 : 0.22;
    g.fillStyle = r.id === 'contrast' ? '#D9FD3A' : fg;
    g.beginPath(); g.arc(w * 0.66, h * 0.44, w * 0.42, 0, Math.PI * 2); g.fill();
    g.restore();
    g.fillStyle = fg;
    g.font = '840 expanded 210px "Mona Sans"';
    if ('fontStretch' in g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
    g.textBaseline = 'top';
    g.fillText(r.num, 30, 36);
    g.font = '800 64px "Mona Sans"';
    g.textBaseline = 'alphabetic';
    g.fillText(r.name, 34, h - 128);
    g.font = 'italic 34px "Instrument Serif"';
    g.globalAlpha = 0.85;
    g.fillText(r.thesis, 36, h - 82);
    g.globalAlpha = 1;
    g.fillRect(36, h - 58, w - 72, 2);
    g.font = '500 20px "Geist Mono"';
    g.fillText('FIELD NOTES · MUSEUM OF DESIGN', 36, h - 26);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function backTexture(w = 512, h = 720) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#F6F2E9'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(12,12,20,0.25)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(w / 2, 60); g.lineTo(w / 2, h - 60); g.stroke();
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(w / 2 + 24, 380 + i * 64); g.lineTo(w - 36, 380 + i * 64); g.stroke(); }
    g.strokeRect(w - 128, 48, 84, 104);
    g.fillStyle = 'rgba(12,12,20,0.55)';
    g.font = '500 18px "Geist Mono"';
    g.fillText('POST CARD', 40, 80);
    const t = new THREE.CanvasTexture(c);
    if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function rack(el, c, take) {
    if (!window.THREE || !S3D.init()) return null;
    const T = THREE, Mt = S3D.mat;
    const cards = [];
    let hovered = null;
    const v = S3D.view(el, (turn, vv) => {
      const brass = Mt.brass(0.26);
      const pole = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 2.9, 24), brass);
      pole.position.y = 1.45;
      const foot = new T.Mesh(new T.CylinderGeometry(0.62, 0.7, 0.07, 64), Mt.gloss(0x0C0C14, 0.3));
      foot.position.y = 0.035;
      const cap = new T.Mesh(new T.SphereGeometry(0.075, 24, 16), brass);
      cap.position.y = 2.93;
      turn.add(pole, foot, cap);
      // the sign on top
      // the band wraps all the way round: three repeats, at the band's true aspect
      const sc = document.createElement('canvas'); sc.width = 2048; sc.height = 96;
      const sg = sc.getContext('2d');
      sg.fillStyle = '#E2B866'; sg.fillRect(0, 0, 2048, 96);
      sg.fillStyle = '#15110C'; sg.font = '800 46px "Mona Sans"'; sg.textAlign = 'center'; sg.textBaseline = 'middle';
      for (let k = 0; k < 3; k++) sg.fillText('POSTCARDS · FREE', 2048 * (k + 0.5) / 3, 52);
      const st = new T.CanvasTexture(sc);
      if ('colorSpace' in st) st.colorSpace = T.SRGBColorSpace;
      const sign = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.13, 96, 1, true), new T.MeshStandardMaterial({ map: st, roughness: 0.5, side: T.DoubleSide }));
      sign.position.y = 2.72;
      turn.add(sign);
      const back = backTexture();
      const N = M.ROOMS.length, R = 0.7;
      const geo = new T.BoxGeometry(0.62, 0.87, 0.012);
      M.ROOMS.forEach((r, i) => {
        const a = (i / N) * Math.PI * 2;
        const holder = new T.Group();
        holder.rotation.y = a;
        const mat = [Mt.clay(0xF6F2E9, 0.8), Mt.clay(0xF6F2E9, 0.8), Mt.clay(0xF6F2E9, 0.8), Mt.clay(0xF6F2E9, 0.8),
          new T.MeshStandardMaterial({ map: cardTexture(r), roughness: 0.55 }), new T.MeshStandardMaterial({ map: back, roughness: 0.8 })];
        const card = new T.Mesh(geo, mat);
        const tier = i % 2;
        card.position.set(0, 0.95 + tier * 0.98, R);
        card.rotation.x = -0.08;
        card.userData.room = r.id;
        // a little wire pocket
        const lip = new T.Mesh(new T.BoxGeometry(0.66, 0.025, 0.06), brass);
        lip.position.set(0, card.position.y - 0.42, R + 0.025);
        const arm = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, R, 8), brass);
        arm.rotation.x = Math.PI / 2;
        arm.position.set(0, card.position.y - 0.42, R / 2);
        holder.add(card, lip, arm);
        turn.add(holder);
        cards.push({ card, holder, base: card.position.clone(), out: 0, want: 0, id: r.id });
      });
      const sh = S3D.shadow(0.95, 0.95, 0.35); turn.add(sh);
      vv.fit = { w: 2.6, h: 3.5, cy: 1.42, elev: 0.14, margin: 1.04 };
      return (t, dt) => {
        cards.forEach(o => {
          o.out += ((o.want || (o.id === hovered ? 0.35 : 0)) - o.out) * Math.min(1, dt * 7);
          o.card.position.z = o.base.z + o.out * 0.45;
          o.card.position.y = o.base.y + o.out * 0.08;
          o.card.rotation.x = -0.08 + o.out * 0.12;
          o.card.rotation.z = Math.sin(t * 1.3 + o.base.y * 4) * 0.012;
        });
      };
    }, { plinth: false, auto: 0.22, lean: 0.4, fov: 26 });
    if (!v) return null;
    c.own(() => v.dispose());
    const hit = (x, y) => { const h = v.pick(x, y, cards.map(o => o.card), false)[0]; return h ? h.object.userData.room : null; };
    v.listen('pointermove', e => { if (!v.spin.drag) { hovered = hit(e.clientX, e.clientY); el.classList.toggle('is-over', !!hovered); } });
    v.listen('pointerleave', () => { hovered = null; });
    v.listen('pointerup', e => {
      if (v.moved > 6) return;
      const id = hit(e.clientX, e.clientY);
      if (!id) return;
      const o = cards.find(k => k.id === id);
      o.want = 1;
      c.later(() => { o.want = 0; }, 1400);
      take(id);
    });
    return v;
  }

  M.define('rotunda', {
    html(d) {
      return `
      <article class="room rotunda">
        ${ROOM.hall.html(d, LIST)}
        ${LIST.map((e, i) => ROOM.exhibit.html(d, e, i)).join('')}
        <section class="rt-exit" id="exit">
          <p class="exit-k mono">Exit</p>
          <h2 class="exit-line" data-lines>Design isn’t decoration. <em>It’s decisions — and now they’re yours.</em></h2>
          <div class="rt-exit-actions">
            <a class="btn btn-solid" href="#/"><svg><use href="#i-back"/></svg><span>Back to the lobby</span></a>
            <button class="btn btn-ghost rt-again" type="button"><span>Visit again with a fresh passport</span></button>
          </div>
        </section>
        ${ROOM.rail.html(d, LIST, 'Exit')}
      </article>`;
    },
    init(root, c, d) {
      ROOM.hall.init(root, c, d);
      ROOM.exhibit.init(root, c, d, LIST);
      ROOM.rail.init(root, c);

      /* ---- the restoration ---- */
      const sec = $('.resto', root), pin = $('.resto-pin', root), word = $('.resto-word', root), wordSpan = $('.resto-word span', root);
      const pz = $('.pz', root), items = $$('.resto-list li', root), verdict = $('.resto-verdict', root);
      const capK = $('.resto-cap-k', root), capT = $('.resto-cap-t', root);
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
        capK.textContent = s === 0 ? 'As found' : s >= 8 ? 'Restored' : `Step ${s} of 7 · ${S.word}`;
        capT.textContent = S.cap;
        if (!reduced && prev >= 0) gsap.fromTo([capK, capT], { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'museum', stagger: 0.05 });
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
      const take = id => {
        GUIDES.download(id);
        const b = $(`.shop-btn[data-room="${id}"]`, root);
        if (b) b.classList.add('is-taken');
        P.toast('Postcard taken — ' + M.get(id).name + ' field notes saved', M.get(id).ink);
      };
      rack($('.shop-rack', root), c, take);
      $$('.shop-btn', root).forEach(b => c.on(b, 'click', () => take(b.dataset.room)));

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
