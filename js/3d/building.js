/* =====================================================================
   MUSEUM OF DESIGN · the building (scale 1 : 200)
   An architect's model of the museum you're standing in: seven rooms
   around a rotunda, each floor in its room's color, each room holding a
   miniature of its sculpture. The roof is off, the dome floats, and
   small visitors walk the route. Hover a room to lift it; click to go in.
   ===================================================================== */
window.BUILDING = (function () {
  'use strict';
  const T = THREE;

  // the same plan as the floor-plan overlay (1000 × 640 px) → world units
  const PLAN = {
    contrast: [24, 410, 256, 206], hierarchy: [24, 214, 256, 196], whitespace: [24, 24, 256, 190],
    color: [280, 24, 220, 190], typography: [500, 24, 220, 190], motion: [720, 24, 256, 190], balance: [720, 214, 256, 402],
    lobby: [384, 532, 232, 84]
  };
  const ROT = { cx: 500, cy: 372, r: 118 };
  const wx = x => (x - 500) / 100, wz = y => (y - 320) / 100;
  // doorways: [side, position along the side in plan px, width]
  const DOORS = {
    contrast: [['e', 560, 56], ['n', 150, 56]],
    hierarchy: [['s', 150, 56], ['n', 150, 56], ['e', 312, 56]],
    whitespace: [['s', 150, 56], ['e', 120, 56]],
    color: [['w', 120, 56], ['e', 120, 56], ['s', 390, 56]],
    typography: [['w', 120, 56], ['e', 120, 56], ['s', 610, 56]],
    motion: [['w', 120, 56], ['s', 848, 56]],
    balance: [['n', 848, 56], ['w', 470, 56]],
    lobby: [['n', 500, 64], ['s', 500, 72]]
  };
  // the visitors' route: [plan x, plan y, dwell seconds]
  const ROUTE = [
    [500, 690, 0], [500, 574, 1.2], [500, 532, 0], [430, 500, 0], [280, 560, 0], [168, 545, 2.2], [150, 410, 0],
    [168, 330, 2.2], [150, 214, 0], [168, 140, 2.2], [280, 120, 0], [390, 150, 2.2], [500, 120, 0], [610, 150, 2.2],
    [720, 120, 0], [848, 150, 2.2], [848, 214, 0], [860, 430, 2.2], [720, 470, 0], [650, 450, 0], [600, 400, 0],
    [540, 410, 2.6], [500, 490, 0], [500, 532, 0], [500, 574, 0], [500, 690, 0]
  ];

  const WALL_H = 0.55, WALL_T = 0.06, FLOOR_T = 0.04;
  const LIGHT_FLOORS = new Set(['paper', 'lilac', 'mint', 'coral', 'apricot', 'bone']);

  function labelTexture(text, fg, w = 256, h = 128, font = '800 92px "Mona Sans"') {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.font = font;
    g.fillStyle = fg;
    g.textBaseline = 'middle';
    g.fillText(text, 6, h / 2 + 4);
    const tx = new T.CanvasTexture(c);
    tx.anisotropy = 4;
    return tx;
  }

  function build(turn, v, opts) {
    const S = S3D, M = S.mat;
    const wallMat = M.clay(0xFBF9F4, 0.92);
    const model = new T.Group();
    // pivot the model a touch behind its centre so the near edge stays in frame
    model.position.z = -0.55;
    turn.add(model);

    // the board the model sits on
    const board = new T.Mesh(S.roundedBox(10.5, 0.34, 6.95, 0.08), M.clay(0xEFEBE2, 0.85));
    board.position.set(0, -0.17, 0.12);
    board.receiveShadow = true;
    model.add(board);
    // the court: pale stone between the rooms
    const court = new T.Mesh(new T.BoxGeometry(9.52, FLOOR_T * 0.5, 5.92), M.clay(0xE4DFD3, 0.9));
    court.position.set(0, FLOOR_T * 0.25, 0);
    court.receiveShadow = true;
    model.add(court);
    // entrance steps
    for (let i = 0; i < 3; i++) {
      const st = new T.Mesh(new T.BoxGeometry(1.1 - i * 0.18, 0.05, 0.14), wallMat);
      st.position.set(0, -0.025 - i * 0.05 + 0.05, 3.03 + i * 0.13);
      st.castShadow = st.receiveShadow = true;
      model.add(st);
    }

    const rooms = {};
    const picks = [];
    const wall = (g, x1, z1, x2, z2) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      if (len < 0.02) return;
      const m = new T.Mesh(new T.BoxGeometry(len, WALL_H, WALL_T), wallMat);
      m.position.set((x1 + x2) / 2, WALL_H / 2, (z1 + z2) / 2);
      m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
    };
    // a side of a rectangle, broken by its doorways
    function side(g, ax, az, bx, bz, doors) {
      const horiz = Math.abs(bz - az) < 1e-6;
      const along = horiz ? [ax, bx] : [az, bz];
      const cuts = doors.map(([at, w]) => [(at - (horiz ? 500 : 320)) / 100 - w / 200, (at - (horiz ? 500 : 320)) / 100 + w / 200]).sort((p, q) => p[0] - q[0]);
      let s0 = Math.min(along[0], along[1]);
      const s1 = Math.max(along[0], along[1]);
      cuts.forEach(([c0, c1]) => {
        if (horiz) wall(g, s0, az, c0, az); else wall(g, ax, s0, ax, c0);
        s0 = c1;
      });
      if (horiz) wall(g, s0, az, s1, az); else wall(g, ax, s0, ax, s1);
    }

    function room(id, data) {
      const [px, py, pw, ph] = PLAN[id];
      const x0 = wx(px) + WALL_T / 2, x1 = wx(px + pw) - WALL_T / 2, z0 = wz(py) + WALL_T / 2, z1 = wz(py + ph) - WALL_T / 2;
      const g = new T.Group();
      model.add(g);
      const floor = new T.Mesh(new T.BoxGeometry(x1 - x0, FLOOR_T, z1 - z0), M.clay(new T.Color(data.bg), 0.7));
      floor.position.set((x0 + x1) / 2, FLOOR_T / 2, (z0 + z1) / 2);
      floor.receiveShadow = true;
      g.add(floor);
      const ds = DOORS[id] || [];
      const pick = s => ds.filter(d => d[0] === s).map(d => [d[1], d[2]]);
      side(g, x0, z0, x1, z0, pick('n'));
      side(g, x0, z1, x1, z1, pick('s'));
      side(g, x0, z0, x0, z1, pick('w'));
      side(g, x1, z0, x1, z1, pick('e'));
      // the room number, printed on the floor
      if (data.num) {
        const lightFloor = LIGHT_FLOORS.has(data.theme);
        const tx = labelTexture(data.num, lightFloor ? 'rgba(12,12,20,0.82)' : 'rgba(243,240,233,0.9)');
        const lab = new T.Mesh(new T.PlaneGeometry(0.62, 0.31), new T.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
        lab.rotation.x = -Math.PI / 2;
        lab.position.set(x0 + 0.5, FLOOR_T + 0.003, z0 + 0.3);
        g.add(lab);
      }
      // an invisible volume to hover and click
      const hit = new T.Mesh(new T.BoxGeometry(x1 - x0, WALL_H + 0.3, z1 - z0), new T.MeshBasicMaterial());
      hit.position.set((x0 + x1) / 2, (WALL_H + 0.3) / 2, (z0 + z1) / 2);
      hit.visible = false;
      hit.userData.id = id;
      g.add(hit);
      picks.push(hit);
      const r = { id, data, g, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, lift: 0 };
      rooms[id] = r;
      return r;
    }

    // a miniature of the room's sculpture, on a miniature plinth
    const minis = [];
    function mini(r, name, scale, dx = 0, dz = 0) {
      const set = SCULPT.settings[name] || {};
      const holder = new T.Group();
      holder.position.set(r.cx + dx, FLOOR_T, r.cz + dz);
      const fake = {};
      const art = new T.Group();
      let top = 0;
      if (set.plinth !== false) {
        const pr = (set.plinthR || 1.15) * scale, ph = 0.62 * scale;
        const pl = S.plinth(pr, ph);
        pl.position.y = ph;
        pl.castShadow = true; pl.receiveShadow = true;
        holder.add(pl);
        top = ph;
      }
      art.position.y = top;
      art.scale.setScalar(scale);
      const up = SCULPT.builders[name](art, fake);
      art.traverse(o => { if (o.isMesh && !o.material.transparent) o.castShadow = true; });
      holder.add(art);
      r.g.add(holder);
      minis.push({ up, fake, holder });
    }

    const data = MUSEUM.ROOMS.concat([MUSEUM.LOBBY]);
    data.forEach(d => room(d.id, d));
    const SCALES = { eclipse: 0.25, podium: 0.27, onething: 0.27, spectrum: 0.3, ampersand: 0.28, cradle: 0.27, mobile: 0.24 };
    MUSEUM.ROOMS.forEach(d => mini(rooms[d.id], d.sculpture, SCALES[d.sculpture] || 0.25, 0, d.id === 'balance' ? -0.35 : 0.05));
    mini(rooms.lobby, 'composition', 0.16, 0, 0.02);

    // the rotunda: a ring wall with two doorways, a dusk floor, a floating glass dome
    const rot = new T.Group();
    model.add(rot);
    const RX = wx(ROT.cx), RZ = wz(ROT.cy), RR = ROT.r / 100;
    const rFloor = new T.Mesh(new T.CylinderGeometry(RR, RR, FLOOR_T, 96), M.clay(new T.Color(MUSEUM.ROTUNDA.bg), 0.6));
    rFloor.position.set(RX, FLOOR_T / 2, RZ);
    rFloor.receiveShadow = true;
    rot.add(rFloor);
    const ringSeg = (a0, a1) => {
      const pts = [new T.Vector2(RR - WALL_T, 0), new T.Vector2(RR, 0), new T.Vector2(RR, WALL_H), new T.Vector2(RR - WALL_T, WALL_H), new T.Vector2(RR - WALL_T, 0)];
      const m = new T.Mesh(new T.LatheGeometry(pts, 48, a0, a1 - a0), wallMat);
      m.position.set(RX, 0, RZ);
      m.castShadow = m.receiveShadow = true;
      rot.add(m);
    };
    // lathe angle 0 points +z (south); doors face south (lobby) and east (balance)
    const gap = 0.26;
    ringSeg(gap, Math.PI / 2 - gap);
    ringSeg(Math.PI / 2 + gap, Math.PI * 2 - gap);
    const dome = new T.Mesh(new T.SphereGeometry(RR * 0.98, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.glass(0xffffff, 0.22));
    dome.position.set(RX, WALL_H + 0.55, RZ);
    rot.add(dome);
    const oculus = new T.Mesh(new T.TorusGeometry(RR * 0.22, 0.018, 12, 48), M.brass(0.3));
    oculus.rotation.x = Math.PI / 2;
    dome.add(oculus);
    oculus.position.y = RR * 0.96;
    const rr = { id: 'rotunda', data: MUSEUM.ROTUNDA, g: rot, cx: RX, cz: RZ, lift: 0 };
    rooms.rotunda = rr;
    const rHit = new T.Mesh(new T.CylinderGeometry(RR, RR, WALL_H + 0.3, 24), new T.MeshBasicMaterial());
    rHit.position.set(RX, (WALL_H + 0.3) / 2, RZ);
    rHit.visible = false; rHit.userData.id = 'rotunda';
    rot.add(rHit); picks.push(rHit);
    mini(rr, 'armillary', 0.22, 0, 0);

    // you are here: a pin over the lobby
    const pin = new T.Group();
    const pinHead = new T.Mesh(new T.SphereGeometry(0.075, 32, 16), M.gloss(0xFD5A32, 0.15));
    const pinTip = new T.Mesh(new T.ConeGeometry(0.05, 0.16, 32), M.gloss(0xFD5A32, 0.15));
    pinTip.rotation.x = Math.PI; pinTip.position.y = -0.1;
    pin.add(pinHead, pinTip);
    const hereR = rooms[opts.here] || rooms.lobby;
    const pinX = hereR.cx + (hereR.id === 'lobby' ? 0.62 : hereR.id === 'rotunda' ? 0.55 : 0.5), pinZ = hereR.cz + (hereR.id === 'balance' ? 0.9 : 0);
    pin.position.set(pinX, 0.62, pinZ);
    pin.traverse(o => { if (o.isMesh) o.castShadow = true; });
    model.add(pin);
    const ringMat = new T.MeshBasicMaterial({ color: 0xFD5A32, transparent: true, opacity: 0.5, depthWrite: false });
    const pulse = new T.Mesh(new T.RingGeometry(0.08, 0.1, 48), ringMat);
    pulse.rotation.x = -Math.PI / 2;
    pulse.position.set(pinX, FLOOR_T + 0.004, pinZ);
    model.add(pulse);

    // flags in the rooms you've stamped
    const flags = [];
    MUSEUM.ROOMS.forEach(d => {
      if (!MUSEUM.passport.has(d.id)) return;
      const r = rooms[d.id];
      const [px, py] = PLAN[d.id];
      const f = new T.Group();
      const pole = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.5, 8), M.brass(0.3));
      pole.position.y = 0.25;
      const shape = new T.Shape(); shape.moveTo(0, 0); shape.lineTo(0.2, -0.06); shape.lineTo(0, -0.12); shape.lineTo(0, 0);
      const cloth = new T.Mesh(new T.ShapeGeometry(shape), new T.MeshStandardMaterial({ color: new T.Color(d.ink === '#FFFFFF' ? '#FD5A32' : d.ink), side: T.DoubleSide, roughness: 0.6 }));
      cloth.position.y = 0.5;
      f.add(pole, cloth);
      f.position.set(wx(px) + 0.2, FLOOR_T, wz(py) + 0.55);
      f.traverse(o => { if (o.isMesh) o.castShadow = true; });
      r.g.add(f);
      flags.push(cloth);
    });

    // visitors walking the route, pausing at each work
    const P3 = ROUTE.map(([x, y, w]) => ({ x: wx(x), z: wz(y), w }));
    const legs = [];
    let total = 0;
    for (let i = 0; i < P3.length - 1; i++) {
      const a = P3[i], b = P3[i + 1];
      if (a.w) { legs.push({ a, b: a, dur: a.w, dwell: true }); total += a.w; }
      const dur = Math.hypot(b.x - a.x, b.z - a.z) / 0.42;
      legs.push({ a, b, dur }); total += dur;
    }
    const COLORS = [0xFD5A32, 0x3A22FC, 0x0C0C14, 0xD9FD3A, 0x8DEFC5, 0xCDBFFF, 0xFBC49F, 0xFFFFFF, 0xE2B866];
    const people = [];
    const bodyG = new T.CapsuleGeometry(0.046, 0.1, 4, 10), headG = new T.SphereGeometry(0.04, 16, 10);
    const skin = M.clay(0xE9D7C3, 0.6);
    for (let i = 0; i < 11; i++) {
      const p = new T.Group();
      const body = new T.Mesh(bodyG, M.clay(COLORS[i % COLORS.length], 0.55));
      body.position.y = 0.1 / 2 + 0.046;
      const head = new T.Mesh(headG, skin);
      head.position.y = 0.25;
      p.add(body, head);
      p.traverse(o => { if (o.isMesh) o.castShadow = true; });
      model.add(p);
      people.push({ p, phase: (i / 11) * total + (i % 3) * 1.7, side: ((i * 37) % 7 - 3) * 0.028, speed: 0.92 + (i % 4) * 0.05 });
    }
    function walk(o, t) {
      let u = ((t * o.speed + o.phase) % total + total) % total;
      for (const L of legs) {
        if (u <= L.dur) {
          const k = L.dur ? u / L.dur : 0;
          const x = L.a.x + (L.b.x - L.a.x) * k, z = L.a.z + (L.b.z - L.a.z) * k;
          const dx = L.b.x - L.a.x, dz = L.b.z - L.a.z;
          if (!L.dwell) o.p.rotation.y = Math.atan2(dx, dz);
          // a little sidestep so nobody walks in single file
          const nx = Math.cos(o.p.rotation.y), nz = -Math.sin(o.p.rotation.y);
          o.p.position.set(x + nx * o.side, FLOOR_T + (L.dwell ? 0 : Math.abs(Math.sin(t * 9 + o.phase)) * 0.018), z + nz * o.side);
          return;
        }
        u -= L.dur;
      }
    }

    // fit the whole board
    v.fit = { w: 11.4, h: 7.5, cy: -0.1, elev: opts.elev || 0.9, margin: 1.0 };

    let hovered = null;
    return {
      rooms, picks,
      setHover(id) { hovered = id; },
      update(t, dt) {
        minis.forEach(m => m.up && m.up(t, dt, m.fake));
        people.forEach(o => walk(o, t));
        Object.values(rooms).forEach(r => {
          const want = r.id === hovered ? 1 : 0;
          r.lift += (want - r.lift) * Math.min(1, dt * 8);
          r.g.position.y = r.lift * 0.14;
        });
        dome.position.y = WALL_H + 0.55 + Math.sin(t * 0.8) * 0.06 + rooms.rotunda.lift * 0.25;
        dome.rotation.y = t * 0.1;
        pin.position.y = 0.6 + Math.sin(t * 2.2) * 0.05 + hereR.lift * 0.14;
        pin.rotation.y = t * 1.2;
        const k = (t * 0.7) % 1;
        pulse.scale.setScalar(1 + k * 3.2);
        ringMat.opacity = 0.55 * (1 - k);
        flags.forEach((f, i) => { f.rotation.y = Math.sin(t * 3 + i) * 0.35; });
        // the model breathes left and right on its own
        turn.rotation.y += Math.sin(t * 0.13) * 0.22;
      }
    };
  }

  // mount the model into an element; tip = the hover card element
  function mount(el, tip, c, opts = {}) {
    if (!window.THREE || !S3D.init()) return null;
    let api = null;
    const v = S3D.view(el, (turn, vv) => { api = build(turn, vv, opts); return (t, dt) => api.update(t, dt); },
      { plinth: false, auto: 0, lean: 0.25, shadows: { size: 7, map: 2048 }, fov: 26, key: 1.75, rimI: 0.8 });
    if (!v) return null;
    c.own(() => v.dispose());
    // the card lives above the 3D layer
    document.body.appendChild(tip);
    c.own(() => tip.remove());

    const touch = matchMedia('(pointer: coarse)').matches;
    let current = null, armed = null;
    const pos = {};
    const anchor = new T.Vector3();
    function show(id) {
      current = id;
      api.setHover(id);
      el.classList.toggle('is-over', !!id);
      if (!id) { tip.hidden = true; return; }
      const d = id === 'lobby' ? null : MUSEUM.get(id);
      const here = id === (opts.here || 'lobby');
      tip.hidden = false;
      tip.dataset.id = id;
      tip.style.setProperty('--c', d ? d.ink : '#FD5A32');
      tip.querySelector('.bld-tip-k').textContent = (here ? 'You are here · ' : '') + (id === 'lobby' ? 'Entrance' : id === 'rotunda' ? 'Room ∞' : 'Room ' + d.num);
      tip.querySelector('b').textContent = id === 'lobby' ? 'The Lobby' : d.name;
      tip.querySelector('i').textContent = id === 'lobby' ? 'Tickets, a lens, this model.' : d.thesis;
      tip.querySelector('.bld-tip-go').textContent = here ? '' : touch ? 'Tap again to go' : (MUSEUM.passport.has(id) ? 'Visited · click to go back' : 'Click to go');
    }
    // the card follows its room as the model turns
    c.tick(() => {
      if (!current || !v.visible) return;
      const r = api.rooms[current];
      anchor.set(r.cx, 0.9 + r.lift * 0.14, r.cz);
      r.g.parent.localToWorld(anchor);
      v.project(anchor, pos);
      const er = el.getBoundingClientRect();
      tip.style.setProperty('--x', (er.left + pos.x).toFixed(1) + 'px');
      tip.style.setProperty('--y', (er.top + pos.y).toFixed(1) + 'px');
    });
    const hitAt = (x, y) => { const h = v.pick(x, y, api.picks, false)[0]; return h ? h.object.userData.id : null; };
    v.listen('pointermove', e => { if (e.pointerType !== 'touch' && !v.spin.drag) show(hitAt(e.clientX, e.clientY)); });
    v.listen('pointerleave', () => { if (!touch) show(null); });
    v.listen('pointerup', e => {
      if (v.moved > 6) return;
      const id = hitAt(e.clientX, e.clientY);
      if (!id) { armed = null; show(null); return; }
      if (e.pointerType === 'touch' && armed !== id) { armed = id; show(id); return; }
      pick(id);
    });
    const pick = id => { if (opts.onPick) opts.onPick(id); else if (id !== (opts.here || 'lobby')) MUSEUM.go(id); };
    c.on(tip, 'click', () => { const id = tip.dataset.id; if (id) pick(id); });
    return v;
  }

  return { mount, PLAN, ROT };
})();
