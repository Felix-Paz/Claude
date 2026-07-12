/* =====================================================================
   THE MUSEUM OF DESIGN · main
   loader · custom cursor · hash router with themed transitions · nav
   ===================================================================== */
(function () {
  'use strict';
  const { $, $$, clamp, lerp } = M;

  const body = document.body;
  const homeEl = $('#home');
  const roomEl = $('#room');
  const overlay = $('#transition');
  const nav = $('#nav');

  /* ================= LOADER ================= */
  function runLoader() {
    const loader = $('#loader');
    const pct = $('.loader-pct');
    const bar = $('.loader-bar i');
    const t0 = performance.now();
    const MIN = 1500;

    let fontsReady = false;
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fontsReady = true; });
    else fontsReady = true;

    return new Promise(resolve => {
      const tick = () => {
        const el = performance.now() - t0;
        // crawl to 90% on the clock, wait for fonts for the last 10
        let p = clamp(el / MIN, 0, 1) * 0.9;
        if (fontsReady) p = Math.max(p, clamp((el - MIN) / 350, 0, 1));
        if (el >= MIN && fontsReady) p = 1;
        pct.textContent = M.pad2(Math.round(p * 100));
        bar.style.setProperty('--p', p.toFixed(3));
        if (p >= 1) {
          setTimeout(() => {
            loader.classList.add('is-done');
            body.classList.remove('is-loading');
            resolve();
          }, 180);
        } else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ================= TICKET GATE ================= */
  function runTicketGate() {
    const gate = $('#ticket-gate');
    // deep links into a room skip the box office
    if (location.hash.match(/^#\/room\//) || M.reduced) { gate.remove(); return Promise.resolve(); }

    gate.hidden = false;
    body.classList.add('is-transitioning'); // hold scroll until the tear
    $('.tg-date').textContent = new Date().toLocaleDateString('en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
    $('.tg-num').textContent = String(Math.floor(Math.random() * 899999) + 100000);

    requestAnimationFrame(() => requestAnimationFrame(() => gate.classList.add('is-in')));

    return new Promise(resolve => {
      let done = false;
      const tear = () => {
        if (done) return;
        done = true;
        gate.classList.add('is-torn');
        body.classList.remove('is-transitioning');
        setTimeout(() => { gate.remove(); resolve(); }, 950);
      };
      gate.addEventListener('click', tear);
      gate.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') tear(); });
      setTimeout(() => { $('.tg-ticket').focus({ preventScroll: true }); }, 700);
    });
  }

  /* ================= VISITOR STAMPS ================= */
  const STAMPS = (() => {
    let set;
    try { set = new Set(JSON.parse(localStorage.getItem('mod-stamps') || '[]')); }
    catch (e) { set = new Set(); }
    const save = () => { try { localStorage.setItem('mod-stamps', JSON.stringify([...set])); } catch (e) {} };
    return {
      has: id => set.has(id),
      all: () => [...set],
      count: () => set.size,
      paint,
      add(id) { if (!set.has(id)) { set.add(id); save(); } paint(); }
    };
    function paint() {
      $$('.nav-index a').forEach(a => a.classList.toggle('is-stamped', set.has(a.dataset.room)));
      $$('#home .hall').forEach(h => h.classList.toggle('is-stamped', set.has(h.dataset.room)));
    }
  })();
  window.STAMPS = STAMPS;

  /* ================= VITRINE SHEEN ================= */
  let sheenGlasses = [];
  const refreshSheen = () => { sheenGlasses = $$('.vitrine-glass'); };
  M.onFrame(() => {
    if (!M.fine || !sheenGlasses.length) return;
    const shx = (M.pointer.sx / innerWidth) * 100;
    sheenGlasses.forEach(g => g.style.setProperty('--shx', shx.toFixed(1)));
  });

  /* ================= CURSOR ================= */
  function initCursor() {
    if (!M.fine) return;
    const cursor = $('#cursor');
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    const label = $('.cursor-label');
    let rx = M.pointer.x, ry = M.pointer.y, shown = false;

    M.onFrame((t, dt) => {
      const k = 1 - Math.pow(1 - 0.22, dt);
      rx = lerp(rx, M.pointer.x, k);
      ry = lerp(ry, M.pointer.y, k);
      dot.style.left = M.pointer.x + 'px';
      dot.style.top = M.pointer.y + 'px';
      ring.style.left = rx.toFixed(1) + 'px';
      ring.style.top = ry.toFixed(1) + 'px';
      if (!shown && M.pointer.moved) { shown = true; cursor.style.opacity = 1; }
    });
    cursor.style.opacity = 0;

    const LABELS = { enter: 'Enter', drag: 'Play', link: '', dot: '' };
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      cursor.className = '';
      if (t) {
        const kind = t.dataset.cursor;
        cursor.classList.add('c-' + kind);
        label.textContent = t.dataset.cursorLabel || LABELS[kind] || '';
      }
    });
    document.addEventListener('pointerdown', () => cursor.classList.add('c-down'));
    document.addEventListener('pointerup', () => cursor.classList.remove('c-down'));
    document.addEventListener('mouseleave', () => cursor.classList.add('c-hide'));
    document.addEventListener('mouseenter', () => cursor.classList.remove('c-hide'));
  }

  /* ================= NAV ================= */
  const navProgress = $('.nav-progress i');
  let lastY = 0;
  M.onFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    navProgress.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(4) : 0);
    // hide on scroll down (rooms only), show on scroll up
    if (body.dataset.view === 'room') {
      if (scrollY > lastY + 4 && scrollY > 300) body.classList.add('nav-hidden');
      else if (scrollY < lastY - 4) body.classList.remove('nav-hidden');
    } else body.classList.remove('nav-hidden');
    lastY = scrollY;
  });

  function setNav(roomId) {
    $$('.nav-index a').forEach(a =>
      a.classList.toggle('is-active', a.dataset.room === roomId));
    const def = roomId && ROOMS.get(roomId);
    $('.nav-room-num').textContent = def ? 'Room ' + def.num : '';
    $('.nav-room-name').textContent = def ? def.name : '';
  }

  /* ================= ROOM MOUNT ================= */
  let roomCtx = null;
  let currentRoom = null;

  function mountRoom(id) {
    const def = ROOMS.get(id);
    if (!def) return false;
    unmountRoom();
    roomEl.innerHTML = def.html();
    roomEl.className = def.theme || '';
    roomEl.hidden = false;
    homeEl.hidden = true;
    body.dataset.view = 'room';
    body.dataset.theme = def.theme || '';
    scrollTo(0, 0);
    if (ROOMS.order.includes(id)) STAMPS.add(id); // the Rotunda issues no stamp
    roomCtx = M.ctx();
    def.init(roomEl, roomCtx);
    M.reveal(roomEl);
    M.remeasure();
    refreshSheen();
    currentRoom = id;
    setNav(id);
    if (window.FLUID) {
      FLUID.setAccent(getComputedStyle(roomEl).getPropertyValue('--racc').trim() || '#FF4B14', '#FF4B14');
    }
    document.title = `Room ${def.num} · ${def.name} — Museum of Design`;
    return true;
  }

  function unmountRoom() {
    if (roomCtx) { roomCtx.destroy(); roomCtx = null; }
    roomEl.innerHTML = '';
    roomEl.hidden = true;
    currentRoom = null;
    refreshSheen();
  }

  function mountHome(target) {
    unmountRoom();
    homeEl.hidden = false;
    body.dataset.view = 'home';
    delete body.dataset.theme;
    setNav(null);
    if (window.FLUID) FLUID.setAccent('#FF4B14', '#2C39E8');
    document.title = 'DESIGN — An Interactive Museum';
    // land back at the gallery when returning from a room, at top otherwise
    if (target === 'gallery') {
      const g = $('#gallery');
      scrollTo(0, g.offsetTop + innerHeight * 0.6);
    } else scrollTo(0, 0);
    M.remeasure();
  }

  /* ================= ROUTER + TRANSITIONS ================= */
  let navigating = false;
  let clickPt = null;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#/"]');
    if (a) clickPt = { x: e.clientX, y: e.clientY };
  }, true);

  const parse = () => {
    const m = location.hash.match(/^#\/room\/([a-z]+)/);
    return m && ROOMS.get(m[1]) ? m[1] : null;
  };

  async function route(initial) {
    const target = parse();
    if (navigating) return;
    if (!initial && target === currentRoom && (target !== null || body.dataset.view === 'home')) return;

    if (initial) {
      if (target) mountRoom(target); else mountHome();
      return;
    }

    navigating = true;
    body.classList.add('is-transitioning');
    // travel using the principle of the room you're entering (or the one you're leaving)
    const themeId = target || currentRoom;
    const tr = (M.reduced ? null : TRANSITIONS[themeId]) || TRANSITIONS.fade;
    overlay.classList.add('is-on');
    try {
      await tr.cover(overlay, clickPt);
      const cameFromRoom = body.dataset.view === 'room';
      if (target) mountRoom(target);
      else mountHome(cameFromRoom ? 'gallery' : 'top');
      await tr.release(overlay);
    } finally {
      overlay.classList.remove('is-on');
      overlay.innerHTML = '';
      body.classList.remove('is-transitioning');
      clickPt = null;
      navigating = false;
    }
    // if the hash changed again mid-flight, catch up
    if (parse() !== currentRoom) route();
  }

  addEventListener('hashchange', () => route());
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && body.dataset.view === 'room') location.hash = '#/';
  });

  /* ================= BOOT ================= */
  initCursor();
  HOME.init();
  STAMPS.paint(); // show any stamps from a previous visit
  runLoader()
    .then(runTicketGate)
    .then(() => {
      route(true);
      M.remeasure();
    });
})();
