/* =====================================================================
   MUSEUM OF DESIGN · the building
   collection data · visitor passport · router + gallery doors ·
   "you are here" header · floor plan
   ===================================================================== */
window.MUSEUM = (function () {
  'use strict';
  const { $, $$, reduced } = P;

  /* ---------------- the collection ---------------- */
  const ROOMS = [
    { id: 'contrast', num: '01', name: 'Contrast', theme: 'ink', bg: '#0C0C14', ink: '#D9FD3A', sculpture: 'eclipse',
      thesis: 'Difference is information.', work: ['Eclipse', 'Lacquer, velvet, light', 'Two halves. Neither works alone.'] },
    { id: 'hierarchy', num: '02', name: 'Hierarchy', theme: 'ultra', bg: '#3A22FC', ink: '#3A22FC', sculpture: 'podium',
      thesis: 'Somebody has to go first.', work: ['The Podium', 'Clay, lacquer', 'Ranked by size, read in order.'] },
    { id: 'whitespace', num: '03', name: 'White Space', theme: 'paper', bg: '#FBFAF6', ink: '#FFFFFF', sculpture: 'onething',
      thesis: 'Emptiness is a material.', work: ['One Thing', 'Plaster, one red sphere', 'Plenty of room to roll.'] },
    { id: 'color', num: '04', name: 'Color', theme: 'lilac', bg: '#CDBFFF', ink: '#CDBFFF', sculpture: 'spectrum',
      thesis: 'Felt before it is read.', work: ['Spectrum', 'Twelve hues, one bubble', 'Every color, equally loud.'] },
    { id: 'typography', num: '05', name: 'Typography', theme: 'mint', bg: '#8DEFC5', ink: '#8DEFC5', sculpture: 'ampersand',
      thesis: 'Letters have a voice.', work: ['Ampersand', 'Instrument Serif, extruded', 'A word that means “and also”.'] },
    { id: 'motion', num: '06', name: 'Motion', theme: 'coral', bg: '#FD5A32', ink: '#FD5A32', sculpture: 'cradle',
      thesis: 'Nothing alive moves in a straight line.', work: ['Newton’s Cradle', 'Chrome, string, momentum', 'Click it. Energy passes along.'] },
    { id: 'balance', num: '07', name: 'Balance', theme: 'apricot', bg: '#FBC49F', ink: '#FBC49F', sculpture: 'mobile',
      thesis: 'Felt, never seen.', work: ['Mobile No. 3', 'Steel wire, after Calder', 'Four weights, one truce.'] }
  ];
  const ROTUNDA = { id: 'rotunda', num: '∞', name: 'The Rotunda', theme: 'dusk', bg: '#15110C', ink: '#E2B866', sculpture: 'armillary',
    thesis: 'Everything you learned, at once.', work: ['Armillary', 'Brass, light', 'Seven rings, one centre.'] };
  const LOBBY = { id: 'lobby', num: '', name: 'Lobby', theme: 'bone', bg: '#F3F0E9' };
  const ALL = ROOMS.concat([ROTUNDA]);
  const get = id => (id === 'lobby' ? LOBBY : ALL.find(r => r.id === id));
  const next = id => { const i = ROOMS.findIndex(r => r.id === id); return i < 0 ? null : (ROOMS[i + 1] || ROTUNDA); };

  /* ---------------- passport ---------------- */
  const KEY = 'mod-passport-v2';
  let stamps;
  try { stamps = new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { stamps = new Set(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...stamps])); } catch (e) {} };
  const passport = {
    has: id => stamps.has(id),
    count: () => ROOMS.filter(r => stamps.has(r.id)).length,
    add(id) {
      if (stamps.has(id)) return false;
      stamps.add(id); save(); paintPassport();
      return true;
    },
    clear() { stamps.clear(); save(); paintPassport(); }
  };
  function paintPassport() {
    const dots = $$('.hdr-pass-dots i');
    ROOMS.forEach((r, i) => {
      const d = dots[i];
      if (!d) return;
      d.classList.toggle('is-on', stamps.has(r.id));
      d.style.setProperty('--c', r.ink);
    });
    $('.hdr-pass-n').textContent = passport.count() + '/7';
    paintMap();
  }

  /* ---------------- views ---------------- */
  const VIEWS = {};
  const define = (id, def) => { VIEWS[id] = def; };

  const app = $('#app');
  let current = null, c = null, busy = false;

  function parse() {
    const h = location.hash;
    let m = h.match(/^#\/room\/([a-z]+)/);
    if (m && ROOMS.some(r => r.id === m[1])) return m[1];
    if (/^#\/rotunda/.test(h)) return 'rotunda';
    return 'lobby';
  }
  const href = id => (id === 'lobby' ? '#/' : id === 'rotunda' ? '#/rotunda' : '#/room/' + id);

  function mount(id, from) {
    const data = get(id);
    const def = VIEWS[id === 'lobby' || id === 'rotunda' ? id : 'room'];
    if (c) { c.destroy(); c = null; }
    ScrollTrigger.getAll().forEach(t => t.kill());
    app.innerHTML = def.html(data);
    P.root.dataset.theme = data.theme;
    setMeta(data);
    P.scrollTop();
    c = P.ctx();
    c.gsap(() => def.init(app, c, data, { from }));
    P.reveals(app, c);
    setHere(data);
    current = id;
    document.title = id === 'lobby' ? 'Museum of Design' : `${data.num !== '∞' ? 'Room ' + data.num + ' · ' : ''}${data.name} — Museum of Design`;
    requestAnimationFrame(() => ScrollTrigger.refresh());
    paintMap();
  }

  function setMeta(data) {
    const m = $('meta[name="theme-color"]');
    if (m) m.content = data.bg;
  }

  /* gallery doors: two panels slide shut in the next room's color, the sign changes, they open */
  const doors = $('.doors');
  function doorsClose(data) {
    doors.style.setProperty('--door', data.bg);
    doors.dataset.theme = data.theme;
    $('.doors-num', doors).textContent = data.id === 'lobby' ? 'Welcome back' : data.id === 'rotunda' ? 'Room ∞' : 'Room ' + data.num;
    $('.doors-name', doors).textContent = data.name;
    doors.classList.add('is-on');
    return new Promise(res => {
      gsap.timeline({ onComplete: res })
        .fromTo($$('.door', doors), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'door' })
        .fromTo($('.doors-sign', doors).children, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'museum', stagger: 0.06 }, 0.38)
        .to({}, { duration: 0.15 });
    });
  }
  function doorsOpen() {
    return new Promise(res => {
      gsap.timeline({ onComplete: () => { doors.classList.remove('is-on'); res(); } })
        .to($('.doors-sign', doors).children, { yPercent: -100, opacity: 0, duration: 0.4, ease: 'power2.in', stagger: 0.04 })
        .to($$('.door', doors), { scaleX: 0, duration: 0.75, ease: 'door' }, 0.2);
    });
  }

  async function route(initial) {
    const id = parse();
    if (busy) return;
    if (!initial && id === current) return;
    closeMap(true);
    if (initial || reduced) { mount(id, current); return; }
    busy = true;
    const from = current;
    P.stopScroll();
    await doorsClose(get(id));
    mount(id, from);
    P.startScroll();
    await doorsOpen();
    busy = false;
    if (parse() !== current) route();
  }
  const go = id => { location.hash = href(id); };

  /* ---------------- header ---------------- */
  let hereName = null;
  function setHere(data) {
    const roll = $('.hdr-here-roll');
    const label = data.id === 'lobby' ? 'Lobby' : data.id === 'rotunda' ? 'The Rotunda' : `Room ${data.num} · ${data.name}`;
    if (label === hereName) return;
    const prev = hereName;
    hereName = label;
    const old = $('.hdr-here-name', roll);
    const n = document.createElement('span');
    n.className = 'hdr-here-name';
    n.textContent = label;
    roll.appendChild(n);
    if (!prev || reduced) { old.remove(); return; }
    gsap.set(n, { position: 'absolute', left: 0, top: 0, yPercent: 110 });
    gsap.to(old, { yPercent: -110, duration: 0.6, ease: 'museum', onComplete: () => old.remove() });
    gsap.to(n, { yPercent: 0, duration: 0.6, ease: 'museum', onComplete: () => gsap.set(n, { position: '' }) });
  }

  /* ---------------- floor plan ---------------- */
  // plan geometry (viewBox 1000 × 640): rooms wind anticlockwise from the lobby to the rotunda
  const PLAN = {
    contrast: [24, 410, 256, 206], hierarchy: [24, 214, 256, 196], whitespace: [24, 24, 256, 190],
    color: [280, 24, 220, 190], typography: [500, 24, 220, 190], motion: [720, 24, 256, 190], balance: [720, 214, 256, 402]
  };
  const ROT = { cx: 500, cy: 372, r: 118 };
  const LOB = [384, 532, 232, 84];
  function buildMap() {
    const svg = $('.plan');
    const room = r => {
      const [x, y, w, h] = PLAN[r.id];
      return `<a href="${href(r.id)}" class="pl-room" data-id="${r.id}" style="--c:${r.ink}">
        <rect x="${x}" y="${y}" width="${w}" height="${h}"/>
        <text class="pl-num" x="${x + 18}" y="${y + 34}">${r.num}</text>
        <text class="pl-name" x="${x + 18}" y="${y + h - 20}">${r.name}</text>
        <g class="pl-stamp" transform="translate(${x + w - 30} ${y + 30})"><circle r="14"/><path d="M-6 0.5l4 4 8-9"/></g>
      </a>`;
    };
    svg.innerHTML = `
      <defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8"/></pattern></defs>
      <rect class="pl-floor" x="24" y="24" width="952" height="592"/>
      ${ROOMS.map(room).join('')}
      <a href="#/rotunda" class="pl-room pl-rot" data-id="rotunda" style="--c:${ROTUNDA.ink}">
        <circle cx="${ROT.cx}" cy="${ROT.cy}" r="${ROT.r}"/>
        <text class="pl-num" x="${ROT.cx}" y="${ROT.cy - 6}" text-anchor="middle">∞</text>
        <text class="pl-name" x="${ROT.cx}" y="${ROT.cy + 26}" text-anchor="middle">Rotunda</text>
      </a>
      <a href="#/" class="pl-room pl-lobby" data-id="lobby" style="--c:#F3F0E9">
        <rect x="${LOB[0]}" y="${LOB[1]}" width="${LOB[2]}" height="${LOB[3]}"/>
        <text class="pl-name" x="${LOB[0] + LOB[2] / 2}" y="${LOB[1] + 34}" text-anchor="middle">Lobby</text>
      </a>
      <path class="pl-route" d="M500 616 V 590 M 384 574 H 300 Q 280 574 270 560 L 150 520 L 150 312 L 150 120 L 390 120 L 610 120 L 848 120 L 848 420 Q 848 470 800 460 L 618 400"/>
      <path class="pl-entry" d="M470 616 h60"/>
      <text class="pl-entry-t" x="500" y="636" text-anchor="middle">Entrance</text>
      <g class="pl-here"><circle class="pl-here-pulse" r="18"/><circle class="pl-here-dot" r="7"/></g>`;
    const list = $('.map-list');
    list.innerHTML = ['lobby'].concat(ALL.map(r => r.id)).map(id => {
      const r = get(id);
      return `<li><a href="${href(id)}" data-id="${id}" style="--c:${r.ink || '#F3F0E9'}"><span class="mono">${id === 'lobby' ? '—' : r.num}</span><b>${r.name}</b><i class="ml-stamp" aria-label="stamped"><svg><use href="#i-check"/></svg></i></a></li>`;
    }).join('');
  }
  function paintMap() {
    $$('.plan .pl-room').forEach(a => {
      const id = a.dataset.id;
      a.classList.toggle('is-stamped', stamps.has(id));
      a.classList.toggle('is-here', id === current);
    });
    $$('.map-list a').forEach(a => {
      a.classList.toggle('is-stamped', stamps.has(a.dataset.id));
      a.classList.toggle('is-here', a.dataset.id === current);
    });
    const here = $('.pl-here');
    if (!here) return;
    let x = 500, y = 590;
    if (PLAN[current]) { const [px, py, w, h] = PLAN[current]; x = px + w / 2; y = py + h / 2; }
    else if (current === 'rotunda') { x = ROT.cx; y = ROT.cy + 62; }
    here.setAttribute('transform', `translate(${x} ${y})`);
  }
  const map = $('#map'), mapBtn = $('.hdr-map');
  let mapOpen = false, mapTl = null;
  function openMap() {
    if (mapOpen) return;
    mapOpen = true;
    map.classList.add('is-open');
    map.removeAttribute('inert'); map.setAttribute('aria-hidden', 'false');
    mapBtn.setAttribute('aria-expanded', 'true');
    P.stopScroll();
    paintMap();
    if (mapTl) mapTl.kill();
    mapTl = gsap.timeline()
      .fromTo(map, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: reduced ? 0 : 0.75, ease: 'door' })
      .fromTo($$('.map-top, .plan, .map-list li, .map-foot', map), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'museum', stagger: 0.03 }, 0.25);
    setTimeout(() => $('.map-close').focus({ preventScroll: true }), 300);
  }
  function closeMap(instant) {
    if (!mapOpen) return;
    mapOpen = false;
    mapBtn.setAttribute('aria-expanded', 'false');
    map.setAttribute('aria-hidden', 'true'); map.setAttribute('inert', '');
    P.startScroll();
    if (mapTl) mapTl.kill();
    const done = () => map.classList.remove('is-open');
    if (instant || reduced) { done(); return; }
    mapTl = gsap.timeline({ onComplete: done }).to(map, { clipPath: 'inset(100% 0 0% 0)', duration: 0.6, ease: 'door' });
  }

  function initChrome() {
    buildMap();
    paintPassport();
    mapBtn.addEventListener('click', () => (mapOpen ? closeMap() : openMap()));
    $('.hdr-pass').addEventListener('click', openMap);
    $('.map-close').addEventListener('click', () => closeMap());
    addEventListener('keydown', e => { if (e.key === 'Escape' && mapOpen) closeMap(); });
    map.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); closeMap(); }
      if (a && (a.getAttribute('href') === '#/' && parse() === 'lobby')) { e.preventDefault(); closeMap(); }
    });
    // header progress
    const prog = $('.hdr-progress i'), hdr = $('.hdr');
    gsap.ticker.add(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const y = window.scrollY;
      prog.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
      hdr.classList.toggle('is-scrolled', y > 40);
    });
    addEventListener('hashchange', () => route());
  }

  return { ROOMS, ROTUNDA, LOBBY, ALL, get, next, href, go, define, passport, route, initChrome, get current() { return current; } };
})();
