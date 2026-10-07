/* =====================================================================
   MUSEUM OF DESIGN · the permanent collection (3D)
   Nine kinetic sculptures, one per room plus the lobby and the
   Rotunda. Each builder adds its pieces to the turntable group, sets
   the camera framing, and returns an update(t, dt) loop.
   House style: soft studio light, matte clay + one lacquered or
   metallic hero material, white plinths, contact shadows.
   ===================================================================== */
window.SCULPT = (function () {
  'use strict';
  const T = THREE, S = S3D, M = S3D.mat;
  const INK = 0x0C0C14, BONE = 0xF3F0E9, WHITE = 0xFFFFFF, ULTRA = 0x3A22FC, LILAC = 0xCDBFFF,
    CORAL = 0xFD5A32, APRICOT = 0xFBC49F, VOLT = 0xD9FD3A, MINT = 0x8DEFC5;

  const mesh = (g, m) => { const o = new T.Mesh(g, m); return o; };
  const sphere = (r, seg = 64) => new T.SphereGeometry(r, seg, Math.round(seg * 0.75));
  // a thin rod between two points
  function rod(a, b, r, m) {
    const d = new T.Vector3().subVectors(b, a), len = d.length();
    const o = mesh(new T.CylinderGeometry(r, r, len, 12), m);
    o.position.copy(a).addScaledVector(d, 0.5);
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    return o;
  }

  /* -------- Lobby · Composition No. 7 — a balanced stack of the whole palette -------- */
  function composition(turn, v) {
    const base = mesh(S.roundedBox(1.05, 0.95, 1.05, 0.14), M.clay(ULTRA, 0.48));
    base.position.y = 0.475;
    const ball = mesh(sphere(0.42), M.gloss(CORAL));
    ball.position.y = 0.95 + 0.42;
    const top = new T.Group();
    top.position.y = 0.95 + 0.84;
    const disc = mesh(new T.CylinderGeometry(0.86, 0.86, 0.05, 96), M.gloss(INK, 0.22));
    disc.position.y = 0.025;
    const pea = mesh(sphere(0.12, 40), M.gloss(VOLT, 0.12));
    pea.position.set(0.66, 0.05 + 0.12, 0);
    top.add(disc, pea);
    // a mint hoop leaning on the base
    const hoop = mesh(new T.TorusGeometry(0.46, 0.07, 32, 120), M.gloss(MINT, 0.2));
    hoop.position.set(-0.98, 0.53, 0.5);
    hoop.rotation.set(0, 0.95, 0);
    const cube = mesh(S.roundedBox(0.42, 0.42, 0.42, 0.09), M.glass(LILAC, 0.5));
    cube.position.set(-1.0, 2.05, 0.1);
    const cone = mesh(new T.ConeGeometry(0.24, 0.56, 64), M.clay(APRICOT, 0.5));
    cone.position.set(0.86, 0.28, 0.5);
    turn.add(base, ball, top, hoop, cube, cone);
    const sh = S.shadow(0.9, 0.9, 0.38); turn.add(sh);
    const sh2 = S.shadow(0.3, 0.3, 0.35); sh2.position.set(0.86, 0.005, 0.5); turn.add(sh2);
    const sh3 = S.shadow(0.45, 0.25, 0.3); sh3.position.set(-0.98, 0.005, 0.5); turn.add(sh3);
    v.fit = { w: 3.3, h: 2.85, cy: 1.2, margin: 1.08 };
    return t => {
      top.rotation.y = t * 1.1;
      top.rotation.z = Math.sin(t * 1.6) * 0.035;
      top.rotation.x = Math.cos(t * 1.3) * 0.03;
      cube.rotation.set(t * 0.42, t * 0.31, t * 0.17);
      cube.position.y = 2.05 + Math.sin(t * 1.1) * 0.08;
    };
  }

  /* -------- I · Contrast — Eclipse: two halves that only mean something together -------- */
  function eclipse(turn, v) {
    const g = new T.Group();
    g.position.y = 1.32;
    g.rotation.z = 0.32;
    const R = 0.82;
    const topG = new T.Group(), botG = new T.Group();
    const white = M.gloss(BONE, 0.1), black = M.gloss(0x111118, 0.16);
    const top = mesh(new T.SphereGeometry(R, 96, 48, 0, Math.PI * 2, 0, Math.PI / 2), white);
    const topCap = mesh(new T.CircleGeometry(R, 96), white); topCap.rotation.x = Math.PI / 2;
    const bot = mesh(new T.SphereGeometry(R, 96, 48, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), black);
    const botCap = mesh(new T.CircleGeometry(R, 96), black); botCap.rotation.x = -Math.PI / 2;
    topG.add(top, topCap); botG.add(bot, botCap);
    const core = mesh(new T.CylinderGeometry(R * 0.97, R * 0.97, 0.01, 96), M.glow(VOLT, 3));
    g.add(topG, botG, core);
    const moonPivot = new T.Group();
    moonPivot.position.y = 1.32;
    moonPivot.rotation.z = -0.5;
    const moon = new T.Group();
    const mA = mesh(new T.SphereGeometry(0.13, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), black);
    const mB = mesh(new T.SphereGeometry(0.13, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), white);
    moon.add(mA, mB);
    moon.position.x = 1.32;
    moonPivot.add(moon);
    turn.add(g, moonPivot);
    const sh = S.shadow(0.85, 0.85, 0.32); turn.add(sh);
    v.fit = { w: 3.0, h: 2.9, cy: 1.15 };
    return t => {
      const gap = 0.04 + 0.32 * Math.pow(0.5 + 0.5 * Math.sin(t * 0.8), 1.6);
      topG.position.y = gap / 2;
      botG.position.y = -gap / 2;
      core.scale.setScalar(0.92 + gap * 0.4);
      g.rotation.y = t * 0.35;
      g.position.y = 1.32 + Math.sin(t * 0.8) * 0.05;
      moonPivot.rotation.y = t * 0.6;
      moon.rotation.y = -t * 0.6;
    };
  }

  /* -------- II · Hierarchy — The Podium: ranked, numbered, obvious -------- */
  function podium(turn, v) {
    const spec = [
      { x: 0, h: 0.95, n: 'd1', r: 0.36, c: VOLT },
      { x: -0.82, h: 0.62, n: 'd2', r: 0.25, c: LILAC },
      { x: 0.82, h: 0.4, n: 'd3', r: 0.17, c: CORAL }
    ];
    const balls = [];
    spec.forEach((s, i) => {
      const block = mesh(S.roundedBox(0.78, s.h, 0.78, 0.07), M.clay(BONE, 0.62));
      block.position.set(s.x, s.h / 2, 0);
      const num = S.glyph(s.n, 0.16, 0.012);
      if (num) {
        const nm = mesh(num, M.gloss(INK, 0.25));
        const k = Math.min(0.44, s.h * 0.52);
        nm.scale.setScalar(k);
        nm.position.set(s.x, s.h * 0.5, 0.39 + 0.014);
        turn.add(nm);
      }
      const b = mesh(sphere(s.r), M.gloss(s.c, 0.12));
      b.position.set(s.x, s.h + s.r, 0);
      const sh = S.shadow(s.r * 1.4, s.r * 1.4, 0.35);
      sh.position.set(s.x, s.h + 0.004, 0);
      turn.add(block, b, sh);
      balls.push({ b, base: s.h + s.r, r: s.r, sh });
    });
    const sh = S.shadow(1.5, 0.75, 0.3); turn.add(sh);
    v.fit = { w: 2.9, h: 2.05, cy: 0.78 };
    return t => {
      const cyc = 2.6;
      balls.forEach((o, i) => {
        const u = ((t - i * 0.32) % cyc + cyc) % cyc;
        const air = u < 0.55 ? Math.sin((u / 0.55) * Math.PI) : 0;
        const land = u >= 0.55 && u < 0.75 ? Math.sin(((u - 0.55) / 0.2) * Math.PI) : 0;
        const jump = air * (0.55 - i * 0.12);
        o.b.position.y = o.base + jump - land * o.r * 0.12;
        o.b.scale.set(1 + land * 0.16, 1 - land * 0.18 + air * 0.06, 1 + land * 0.16);
        o.sh.material.opacity = 0.35 * (1 - air * 0.6);
        o.sh.scale.setScalar(1 - air * 0.3);
      });
    };
  }

  /* -------- III · White Space — One Thing: a slab, a ball, and room to roll -------- */
  function onething(turn, v) {
    const slabG = new T.Group();
    slabG.position.y = 0.95;
    const slab = mesh(S.roundedBox(2.6, 0.06, 1.7, 0.028), M.clay(0xD9D4C9, 0.75));
    slabG.add(slab);
    const ball = mesh(sphere(0.1, 48), M.gloss(CORAL, 0.1));
    ball.position.y = 0.03 + 0.1;
    slabG.add(ball);
    const ballSh = S.shadow(0.16, 0.16, 0.45);
    ballSh.position.y = 0.034;
    slabG.add(ballSh);
    turn.add(slabG);
    const floor = S.shadow(1.6, 1.05, 0.22); turn.add(floor);
    const st = { x: 0.62, vx: 0 };
    v.fit = { w: 4.1, h: 2.0, cy: 0.85, elev: 0.46 };
    return (t, dt) => {
      const tilt = Math.sin(t * 0.42) * 0.07;
      slabG.rotation.z = tilt;
      slabG.rotation.x = Math.sin(t * 0.31) * 0.025;
      slabG.position.y = 0.95 + Math.sin(t * 0.6) * 0.04;
      st.vx += -Math.sin(tilt) * 4.2 * dt;
      st.vx *= Math.pow(0.6, dt);
      st.x += st.vx * dt;
      if (st.x > 1.15) { st.x = 1.15; st.vx *= -0.4; }
      if (st.x < -1.15) { st.x = -1.15; st.vx *= -0.4; }
      ball.position.x = st.x;
      ball.rotation.z = -st.x / 0.1;
      ballSh.position.x = st.x;
    };
  }

  /* -------- IV · Color — Spectrum: twelve hues in a ring around a bubble -------- */
  function spectrum(turn, v) {
    const ring = new T.Group();
    const caps = [];
    for (let i = 0; i < 12; i++) {
      const hex = P.color.oklch(0.74, 0.17, i * 30 + 10).hex;
      const c = mesh(new T.CapsuleGeometry(0.11, 0.62, 10, 28), M.gloss(new T.Color(hex), 0.2));
      const a = (i / 12) * Math.PI * 2;
      c.position.set(Math.cos(a) * 0.98, 0.5, Math.sin(a) * 0.98);
      ring.add(c);
      const sh = S.shadow(0.18, 0.18, 0.3);
      sh.position.set(c.position.x, 0.004, c.position.z);
      ring.add(sh);
      caps.push(c);
    }
    const bubble = mesh(sphere(0.52, 96), M.glass(WHITE, 0.34));
    bubble.position.y = 1.08;
    turn.add(ring, bubble);
    v.fit = { w: 2.9, h: 1.85, cy: 0.8 };
    return t => {
      ring.rotation.y = t * 0.3;
      caps.forEach((c, i) => {
        c.position.y = 0.5 + Math.sin(t * 1.7 - i * 0.52) * 0.1;
        c.rotation.z = Math.sin(t * 1.7 - i * 0.52) * 0.08;
      });
      bubble.position.y = 1.1 + Math.sin(t * 1.1) * 0.06;
      bubble.rotation.y = t * 0.4;
    };
  }

  /* -------- V · Typography — Ampersand: a serif italic, extruded and lacquered -------- */
  function ampersand(turn, v) {
    const g = new T.Group();
    g.position.y = 1.08;
    const geo = S.glyph('amp', 0.2, 0.016);
    if (geo) {
      const amp = mesh(geo, [M.gloss(INK, 0.14), M.clay(ULTRA, 0.4)]);
      amp.scale.setScalar(2.35);
      g.add(amp);
    }
    const ag = S.glyph('a_mona', 0.22, 0.02);
    let small = null;
    if (ag) {
      small = mesh(ag, [M.gloss(CORAL, 0.18), M.clay(0xC9431F, 0.5)]);
      small.scale.setScalar(0.42);
      small.position.set(0.66, 0.17, 0.5);
      small.rotation.y = -0.45;
      turn.add(small);
      const ssh = S.shadow(0.28, 0.2, 0.35); ssh.position.set(0.66, 0.005, 0.5); turn.add(ssh);
    }
    turn.add(g);
    const sh = S.shadow(0.95, 0.6, 0.3); turn.add(sh);
    v.fit = { w: 2.7, h: 2.3, cy: 1.02 };
    return t => {
      g.position.y = 1.08 + Math.sin(t * 0.9) * 0.05;
      g.rotation.x = Math.sin(t * 0.6) * 0.05;

    };
  }

  /* -------- VI · Motion — Newton's Cradle: energy, passed along -------- */
  function cradle(turn, v) {
    const chrome = M.chrome(0xffffff, 0.05), dark = M.gloss(INK, 0.25);
    const base = mesh(S.roundedBox(2.2, 0.12, 0.95, 0.05), dark);
    base.position.y = 0.06;
    turn.add(base);
    const topY = 1.72, half = 0.38;
    [-1, 1].forEach(sz => {
      const z = sz * half;
      turn.add(rod(new T.Vector3(-1.0, 0.12, z), new T.Vector3(-1.0, topY, z), 0.025, chrome));
      turn.add(rod(new T.Vector3(1.0, 0.12, z), new T.Vector3(1.0, topY, z), 0.025, chrome));
      turn.add(rod(new T.Vector3(-1.0, topY, z), new T.Vector3(1.0, topY, z), 0.025, chrome));
      [-1, 1].forEach(sx => {
        const k = mesh(sphere(0.045, 24), chrome);
        k.position.set(sx * 1.0, topY, z);
        turn.add(k);
      });
    });
    const L = 1.05, r = 0.105, pivots = [];
    const string = new T.MeshStandardMaterial({ color: 0x222230, roughness: 0.5 });
    for (let i = 0; i < 5; i++) {
      const p = new T.Group();
      p.position.set((i - 2) * r * 2.02, topY, 0);
      const b = mesh(sphere(r, 48), chrome);
      b.position.y = -L;
      p.add(b);
      [-half, half].forEach(z => p.add(rod(new T.Vector3(0, 0, z), new T.Vector3(0, -L + r * 0.8, 0), 0.004, string)));
      turn.add(p);
      pivots.push(p);
    }
    const sh = S.shadow(1.3, 0.62, 0.3); turn.add(sh);
    const st = { A: 0.62 };
    v.poke = () => { st.A = 0.75; };
    v.fit = { w: 2.6, h: 1.95, cy: 0.92 };
    return (t, dt) => {
      st.A = Math.max(0.4, st.A - dt * 0.02);
      const s = Math.sin(t * 3.9);
      const sw = st.A * Math.sign(s) * Math.pow(Math.abs(s), 0.9);
      pivots[0].rotation.z = s < 0 ? sw : 0;
      pivots[4].rotation.z = s > 0 ? sw : 0;
      for (let i = 1; i < 4; i++) pivots[i].rotation.z = Math.sin(t * 40 + i) * 0.002 * (Math.abs(s) < 0.08 ? 1 : 0);
    };
  }

  /* -------- VII · Balance — Mobile No. 3: a truce in the air (after Calder) -------- */
  function mobile(turn, v) {
    const wire = M.gloss(INK, 0.3);
    const disc = (r, c) => {
      const g = new T.Group();
      const d = mesh(new T.CylinderGeometry(r, r, 0.035, 72), M.clay(c, 0.4));
      d.rotation.x = Math.PI / 2;
      d.position.y = -r;
      g.add(d);
      return g;
    };
    // an arm hangs from its pivot; left/right children hang from its ends
    function arm(len, frac, left, right, dl = 0.32, dr = 0.32) {
      const g = new T.Group();
      const x0 = -len * frac, x1 = len * (1 - frac);
      g.add(rod(new T.Vector3(x0, 0, 0), new T.Vector3(x1, 0, 0), 0.012, wire));
      const tip = sphere(0.02, 12);
      [[x0, dl, left], [x1, dr, right]].forEach(([x, drop, child]) => {
        g.add(rod(new T.Vector3(x, 0, 0), new T.Vector3(x, -drop, 0), 0.006, wire));
        const k = mesh(tip, wire); k.position.set(x, 0, 0); g.add(k);
        child.position.set(x, -drop, 0);
        g.add(child);
      });
      return g;
    }
    const a3 = arm(1.0, 0.45, disc(0.19, ULTRA), disc(0.14, INK), 0.26, 0.3);
    const a2 = arm(1.45, 0.58, disc(0.27, WHITE), a3, 0.34, 0.24);
    const a1 = arm(2.3, 0.4, disc(0.43, CORAL), a2, 0.3, 0.3);
    const hang = new T.Group();
    hang.position.y = 2.72;
    hang.add(rod(new T.Vector3(0, 0.0, 0), new T.Vector3(0, 0.9, 0), 0.006, wire));
    hang.add(a1);
    turn.add(hang);
    const sh = S.shadow(1.6, 0.9, 0.18); turn.add(sh);
    v.fit = { w: 3.9, h: 3.1, cy: 1.6, elev: 0.08 };
    return t => {
      a1.rotation.y = Math.sin(t * 0.21) * 1.2;
      a2.rotation.y = t * 0.33;
      a3.rotation.y = -t * 0.52;
      a1.rotation.z = Math.sin(t * 0.7) * 0.03;
      a2.rotation.z = Math.sin(t * 0.9 + 1) * 0.04;
      a3.rotation.z = Math.sin(t * 1.1 + 2) * 0.05;
    };
  }

  /* -------- ∞ · Rotunda — Armillary: everything, turning around one centre -------- */
  function armillary(turn, v) {
    const brass = M.brass(0.22);
    const stem = mesh(new T.CylinderGeometry(0.05, 0.08, 0.62, 32), brass);
    stem.position.y = 0.31;
    const foot = mesh(new T.CylinderGeometry(0.34, 0.4, 0.06, 64), brass);
    foot.position.y = 0.03;
    const g = new T.Group();
    g.position.y = 1.5;
    const outer = new T.Group(), mid = new T.Group(), inner = new T.Group();
    outer.add(mesh(new T.TorusGeometry(0.88, 0.028, 20, 180), brass));
    mid.add(mesh(new T.TorusGeometry(0.72, 0.026, 20, 160), brass));
    inner.add(mesh(new T.TorusGeometry(0.56, 0.024, 20, 140), brass));
    const core = mesh(sphere(0.2, 48), M.glow(VOLT, 1.6));
    const halo = mesh(sphere(0.3, 48), M.glass(VOLT, 0.18));
    inner.add(core, halo);
    mid.add(inner); outer.add(mid); g.add(outer);
    [0, 1, 2, 3].forEach(i => { const b = mesh(sphere(0.045, 20), brass); const a = i * Math.PI / 2; b.position.set(Math.cos(a) * 0.88, Math.sin(a) * 0.88, 0); outer.add(b); });
    const neck = mesh(new T.CylinderGeometry(0.03, 0.05, 0.6, 16), brass);
    neck.position.y = 0.92;
    turn.add(stem, foot, g, neck);
    const sh = S.shadow(0.7, 0.7, 0.35); turn.add(sh);
    v.fit = { w: 2.3, h: 2.6, cy: 1.3 };
    return t => {
      outer.rotation.y = t * 0.35;
      mid.rotation.x = t * 0.5 + 0.6;
      inner.rotation.z = t * 0.8;
      inner.rotation.y = t * 0.3;
      core.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06);
    };
  }

  const builders = { composition, eclipse, podium, onething, spectrum, ampersand, cradle, mobile, armillary };
  // per-sculpture stage settings (plinth, turntable behaviour)
  const settings = {
    composition: { plinthR: 1.55 },
    eclipse: { plinthR: 1.0 },
    podium: { plinthR: 1.5, swing: 0.35, range: 0.45, auto: 0 },
    onething: { plinth: false },
    spectrum: { plinthR: 1.32 },
    ampersand: { plinthR: 1.05, swing: 0.45, range: 0.55, auto: 0 },
    cradle: { plinthR: 1.4, swing: 0.25, range: 0.35, auto: 0, offset: 0.25 },
    mobile: { plinth: false, auto: 0.05 },
    armillary: { plinthR: 0.9 }
  };

  // mount a sculpture into an element; returns the view (or null without WebGL)
  function mount(el, name, extra = {}) {
    if (!window.THREE || !S3D.init()) return null;
    const opts = Object.assign({}, settings[name] || {}, extra);
    let viewRef = null;
    const v = S3D.view(el, (turn, vv) => builders[name](turn, vv), Object.assign(opts, {
      onPoke: vv => { if (vv.poke) vv.poke(); }
    }));
    viewRef = v;
    return viewRef;
  }

  return { mount, builders, settings, names: Object.keys(builders), rod, sphere };
})();
