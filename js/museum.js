/* =====================================================================
   MUSEUM OF DESIGN · the museum
   the collection (every room's copy lives here) · visitor passport ·
   router + gallery doors · "you are here" header · floor plan (3D)
   ===================================================================== */
window.MUSEUM = (function () {
  'use strict';
  const { $, $$, reduced } = P;

  /* ---------------- the collection ---------------- */
  const ROOMS = [
    { id: 'contrast', num: '01', name: 'Contrast', theme: 'ink', bg: '#121110', ink: '#FFD21F', sculpture: 'eclipse',
      thesis: 'How things get noticed.', mins: 3,
      intro: 'The eye skips over things that look alike and stops at the one that’s different. In this room you control how different.',
      closing: 'Body text: 4.5&#8239;:&#8239;1 or more.',
      work: ['Eclipse', 'Marble, granite, lamp', 'A marble half and a granite half, with a lamp between them.'] },
    { id: 'hierarchy', num: '02', name: 'Hierarchy', theme: 'klein', bg: '#1D3ECF', ink: '#1D3ECF', sculpture: 'podium',
      thesis: 'What gets read first.', mins: 3,
      intro: 'Every page is read in some order. Hierarchy is how you choose that order, with size, weight, color and position.',
      closing: 'Make one thing the biggest. Only one.',
      work: ['The Podium', 'Travertine, granite, brass', 'First, second and third, by height.'] },
    { id: 'whitespace', num: '03', name: 'White Space', theme: 'paper', bg: '#F8F6F1', ink: '#FFFFFF', sculpture: 'onething',
      thesis: 'The space between things.', mins: 3,
      intro: 'Empty space separates things and groups them. It’s also the cheapest way to make something look expensive.',
      closing: 'When in doubt, double the margin.',
      work: ['One Thing', 'Plaster slab, one red ball', 'A tilting slab with plenty of room.'] },
    { id: 'color', num: '04', name: 'Color', theme: 'plaster', bg: '#EBC6B8', ink: '#EBC6B8', sculpture: 'spectrum',
      thesis: 'What color does before you read.', mins: 4,
      intro: 'People react to a color before they read the words on it. So it’s worth picking on purpose.',
      closing: 'One loud color per page is plenty.',
      work: ['Spectrum', 'Pigment on wood, glass', 'Twelve pigments in a ring around a glass ball.'] },
    { id: 'typography', num: '05', name: 'Typography', theme: 'bottle', bg: '#163D30', ink: '#2F7A5A', sculpture: 'ampersand',
      thesis: 'How letters sound.', mins: 3,
      intro: 'The same sentence reads differently in a different typeface. Here you get to set a few yourself.',
      closing: 'Two typefaces are usually enough. One is often better.',
      work: ['Ampersand', 'Granite, brass', 'Instrument Serif Italic, cut from stone.'] },
    { id: 'motion', num: '06', name: 'Motion', theme: 'vermilion', bg: '#E8461E', ink: '#E8461E', sculpture: 'cradle',
      thesis: 'How things move.', mins: 3,
      intro: 'Real objects speed up and slow down. Motion on a screen looks right when it does the same.',
      closing: 'Ease out on the way in. Ease in on the way out.',
      work: ['Newton’s Cradle', 'Chrome, granite, string', 'Click it and the energy passes along.'] },
    { id: 'balance', num: '07', name: 'Balance', theme: 'sand', bg: '#E4D2B0', ink: '#E4D2B0', sculpture: 'mobile',
      thesis: 'Where the weight sits.', mins: 5,
      intro: 'Big, dark and bright shapes look heavier. Balance means placing them so the page doesn’t seem to tip.',
      closing: 'Off-centre is fine. Just add a counterweight.',
      work: ['Mobile No. 3', 'Painted steel, after Calder', 'Four weights on wire, hanging level.'] }
  ];
  const ROTUNDA = { id: 'rotunda', num: '∞', name: 'The Rotunda', theme: 'dusk', bg: '#15110C', ink: '#D2A85F', sculpture: 'armillary',
    thesis: 'All seven rooms at once.', mins: 4,
    intro: 'The last room. A bad poster gets fixed with everything from rooms 01 to 07. Then passport control and a gift shop.',
    work: ['Armillary', 'Brass, lamp', 'Seven rings around one light.'] };
  const LOBBY = { id: 'lobby', num: '', name: 'Lobby', theme: 'bone', bg: '#EEEAE2' };
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
    $('.hdr-pass').setAttribute('aria-label', `Your passport: ${passport.count()} of 7 rooms stamped`);
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
    document.title = id === 'lobby' ? 'Museum of Design' : `${data.num !== '∞' ? 'Room ' + data.num + ' · ' : ''}${data.name} · Museum of Design`;
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
      <a href="#/" class="pl-room pl-lobby" data-id="lobby" style="--c:#EEEAE2">
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
      return `<li><a href="${href(id)}" data-id="${id}" style="--c:${r.ink || '#EEEAE2'}"><span class="mono">${id === 'lobby' ? '—' : r.num}</span><b>${r.name}</b><i class="ml-stamp" aria-label="stamped"><svg><use href="#i-check"/></svg></i></a></li>`;
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
  let mapOpen = false, mapTl = null, mapCtx = null;
  // the floor plan, in 3D: the same architect's model as the lobby, pinned where you stand
  function mapModel() {
    if (!window.BUILDING || !window.THREE || !S3D.init() || mapCtx || !mapOpen) return;
    const el = $('.plan3d', map);
    const tip = document.createElement('div');
    tip.className = 'bld-tip'; tip.hidden = true;
    tip.innerHTML = '<span class="mono bld-tip-k"></span><b></b><i></i><span class="mono bld-tip-go"></span>';
    el.after(tip);
    mapCtx = P.ctx();
    const v = BUILDING.mount(el, tip, mapCtx, { here: current || 'lobby', onPick: id => (id === current ? closeMap() : go(id)) });
    if (!v) { mapCtx.destroy(); mapCtx = null; return; }
    S3D.solo(v);
    map.classList.add('is-3d');
    P.body.classList.add('map-3d');
    if (!reduced) gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'museum' });
  }
  function dropModel() {
    if (!mapCtx) return;
    mapCtx.destroy(); mapCtx = null;
    S3D.solo(null);
    map.classList.remove('is-3d');
    P.body.classList.remove('map-3d');
  }
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
      .fromTo($$('.map-top, .plan, .map-list li, .map-foot', map), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'museum', stagger: 0.03 }, 0.25)
      .add(mapModel, reduced ? 0 : 0.6);
    setTimeout(() => $('.map-close').focus({ preventScroll: true }), 300);
  }
  function closeMap(instant) {
    if (!mapOpen) return;
    mapOpen = false;
    mapBtn.setAttribute('aria-expanded', 'false');
    map.setAttribute('aria-hidden', 'true'); map.setAttribute('inert', '');
    P.startScroll();
    if (mapTl) mapTl.kill();
    dropModel();
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
