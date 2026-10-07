/* =====================================================================
   MUSEUM OF DESIGN · the 3D stage
   One WebGL renderer, one fixed transparent canvas. Every sculpture on
   the page registers a "view" bound to a DOM element; each frame the
   renderer draws each visible view into that element's rectangle
   (scissor + viewport). Many sculptures, one context.
   ===================================================================== */
window.S3D = (function () {
  'use strict';

  const views = new Set();
  let renderer = null, canvas = null, env = null, ok = false;
  let W = 0, H = 0, dpr = 1;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;

  /* ---------------- studio lighting (after three's RoomEnvironment, MIT) ---------------- */
  function studio() {
    const scene = new THREE.Scene();
    const box = new THREE.BoxGeometry();
    box.deleteAttribute('uv');
    const room = new THREE.Mesh(box, new THREE.MeshStandardMaterial({ side: THREE.BackSide, color: 0x8a8a90 }));
    room.position.set(-0.757, 13.219, 0.717);
    room.scale.set(31.713, 28.305, 28.591);
    scene.add(room);
    const pl = new THREE.PointLight(0xffffff, 900, 28, 2);
    pl.position.set(0.418, 16.199, 0.3);
    scene.add(pl);
    const panel = (i, p, s) => {
      const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(i) }));
      m.position.set(p[0], p[1], p[2]); m.scale.set(s[0], s[1], s[2]);
      scene.add(m);
    };
    panel(50, [-16.116, 14.37, 8.208], [0.1, 2.428, 2.739]);
    panel(50, [-16.109, 18.021, -8.207], [0.1, 2.425, 2.751]);
    panel(17, [14.904, 12.198, -1.832], [0.15, 4.265, 6.331]);
    panel(43, [-0.462, 8.89, 14.52], [4.38, 5.441, 0.088]);
    panel(20, [3.235, 11.486, -12.541], [2.5, 2.0, 0.1]);
    panel(100, [0, 20, 0], [1, 0.1, 1]);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const tex = pmrem.fromScene(scene, 0.04).texture;
    pmrem.dispose();
    return tex;
  }

  function init() {
    if (ok) return ok;
    try {
      canvas = document.createElement('canvas');
      canvas.className = 'stage3d';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.autoClear = false;
      env = studio();
      resize();
      addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 80); });
      gsap.ticker.add(render);
      ok = true;
    } catch (e) {
      console.warn('[museum] 3D unavailable', e);
      if (canvas) canvas.remove();
      ok = false;
    }
    return ok;
  }

  function resize() {
    W = document.documentElement.clientWidth || innerWidth;
    H = innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
  }

  /* ---------------- frame ---------------- */
  let last = performance.now();
  function render() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    renderer.setScissorTest(false);
    renderer.clear(true, true, true);
    if (!views.size) return;
    renderer.setScissorTest(true);
    const t = now / 1000;
    views.forEach(v => {
      const r = v.el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > H + 40 || r.right < 0 || r.left > W || r.width < 2 || r.height < 2) { v.visible = false; return; }
      v.visible = true;
      const aspect = r.width / r.height;
      if (Math.abs(aspect - v.camera.aspect) > 1e-4 || v._h !== r.height) {
        v.camera.aspect = aspect;
        v._h = r.height;
        frame(v);
      }
      tick(v, t, dt);
      const x = Math.round(r.left), y = Math.round(H - r.bottom), w = Math.round(r.width), h = Math.round(r.height);
      renderer.setViewport(x, y, w, h);
      renderer.setScissor(x, y, w, h);
      renderer.render(v.scene, v.camera);
    });
  }

  // keep the subject inside the frame at any aspect ratio
  function frame(v) {
    const cam = v.camera, f = v.fit;
    const el = f.elev || 0.18;
    // a plinth is part of the work: always frame it whole, down to its foot
    let w = f.w, h = f.h, cy = f.cy;
    if (v.plinthBox) {
      const top = cy + h / 2;
      const bottom = Math.min(cy - h / 2, -v.plinthBox.h - v.plinthBox.r * Math.sin(el) * 1.1 - 0.06);
      h = top - bottom; cy = (top + bottom) / 2;
      w = Math.max(w, v.plinthBox.r * 2.12);
    }
    const vfov = cam.fov * Math.PI / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * cam.aspect);
    const dV = h / 2 / Math.tan(vfov / 2);
    const dH = w / 2 / Math.tan(hfov / 2);
    const d = Math.max(dV, dH) * (f.margin || 1.15);
    cam.position.set(0, cy + d * Math.sin(el), d * Math.cos(el));
    cam.lookAt(0, cy, 0);
    cam.updateProjectionMatrix();
  }

  function tick(v, t, dt) {
    // drag to turn, with inertia; idle turntable
    const s = v.spin;
    if (!s.drag) {
      s.vel *= Math.pow(0.08, dt);
      s.angle += (s.vel + (reduced ? 0 : s.auto * (v.hover ? 2.6 : 1))) * dt;
    }
    if (s.swing) {
      // oscillate around the front instead of spinning all the way round
      const target = Math.sin(t * s.swing) * s.range + s.offset;
      v.turn.rotation.y = target + s.angle * 0.25;
    } else v.turn.rotation.y = s.angle;
    // lean toward the pointer
    const tx = v.hover ? v.px * 0.22 : 0, ty = v.hover ? v.py * 0.12 : 0;
    v.tilt.rotation.x += (ty - v.tilt.rotation.x) * Math.min(1, dt * 4);
    v.tilt.rotation.z += (-tx * 0.3 - v.tilt.rotation.z) * Math.min(1, dt * 4);
    if (v.update) v.update(reduced ? 0 : t, reduced ? 0 : dt, v);
  }

  /* ---------------- helpers shared by sculptures ---------------- */
  const mat = {
    clay: (c, r = 0.55) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, envMapIntensity: 0.9 }),
    gloss: (c, r = 0.16) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1 }),
    chrome: (c = 0xffffff, r = 0.06) => new THREE.MeshStandardMaterial({ color: c, metalness: 1, roughness: r, envMapIntensity: 1.25 }),
    brass: (r = 0.24) => new THREE.MeshStandardMaterial({ color: 0xE2B866, metalness: 1, roughness: r, envMapIntensity: 1.2 }),
    velvet: (c, sheen = 0x666677) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.92, sheen: 1, sheenRoughness: 0.35, sheenColor: new THREE.Color(sheen), envMapIntensity: 0.6 }),
    glow: (c, i = 1.4) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.4 }),
    glass: (c = 0xffffff, o = 0.28) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.04, metalness: 0, transparent: true, opacity: o, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 620], envMapIntensity: 1.6, depthWrite: false })
  };

  // a box with properly rounded edges (extruded rounded rect with a round bevel)
  function roundedBox(w, h, d, r = 0.06, seg = 5) {
    r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
    const s = new THREE.Shape();
    const x = -w / 2 + r, y = -h / 2 + r, ww = w - 2 * r, hh = h - 2 * r;
    s.moveTo(x, y); s.lineTo(x + ww, y); s.lineTo(x + ww, y + hh); s.lineTo(x, y + hh); s.lineTo(x, y);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(1e-3, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: seg, curveSegments: seg });
    g.translate(0, 0, -(d - 2 * r) / 2);
    g.computeVertexNormals();
    return g;
  }

  // a museum plinth: a cylinder with a softly rounded top edge
  function plinth(radius = 1.15, height = 0.62, color = 0xF6F3EC) {
    const r = 0.05, pts = [new THREE.Vector2(0, -height)];
    pts.push(new THREE.Vector2(radius, -height));
    pts.push(new THREE.Vector2(radius, -r));
    for (let i = 1; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push(new THREE.Vector2(radius - r + Math.cos(a) * r, -r + Math.sin(a) * r)); }
    pts.push(new THREE.Vector2(0, 0));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), mat.clay(color, 0.78));
    return m;
  }

  // soft contact shadow (radial gradient on a plane)
  let shadowTex = null;
  function shadow(rx = 1, rz = 1, opacity = 0.4) {
    if (!shadowTex) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grd.addColorStop(0, 'rgba(10,10,20,1)');
      grd.addColorStop(0.45, 'rgba(10,10,20,0.45)');
      grd.addColorStop(1, 'rgba(10,10,20,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
      shadowTex = new THREE.CanvasTexture(c);
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * rx, 2 * rz), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.004;
    m.renderOrder = -1;
    return m;
  }

  // glyph outline (from GLYPHS) → extruded mesh geometry, centred, 1 unit = 1 em
  function glyph(key, depth = 0.22, bevel = 0.018) {
    const g = window.GLYPHS && window.GLYPHS[key];
    if (!g) return null;
    const sp = new THREE.ShapePath();
    const tok = g.d.split(' ');
    const k = 1 / 1000;
    for (let i = 0; i < tok.length;) {
      const c = tok[i++];
      if (c === 'M') { sp.moveTo(+tok[i] * k, +tok[i + 1] * k); i += 2; }
      else if (c === 'L') { sp.lineTo(+tok[i] * k, +tok[i + 1] * k); i += 2; }
      else if (c === 'Q') { sp.quadraticCurveTo(+tok[i] * k, +tok[i + 1] * k, +tok[i + 2] * k, +tok[i + 3] * k); i += 4; }
      else if (c === 'Z') { /* subpaths close implicitly */ }
    }
    const shapes = sp.toShapes(true);
    const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 4, curveSegments: 10 });
    geo.computeBoundingBox();
    const b = geo.boundingBox;
    geo.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -(b.min.z + b.max.z) / 2);
    geo.computeVertexNormals();
    return geo;
  }

  /* ---------------- views ---------------- */
  // build(scene, v) returns an update(t, dt, v) function; it may set v.fit
  function view(el, build, opts = {}) {
    if (!ok && !init()) return null;
    const scene = new THREE.Scene();
    scene.environment = env;
    const camera = new THREE.PerspectiveCamera(opts.fov || 28, 1, 0.1, 100);
    const tilt = new THREE.Group(), turn = new THREE.Group();
    tilt.add(turn); scene.add(tilt);
    const key = new THREE.DirectionalLight(0xffffff, opts.key ?? 1.6);
    key.position.set(3, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(opts.rim || 0xCDBFFF, opts.rimI ?? 1.1);
    rim.position.set(-5, 3, -4);
    scene.add(rim);
    const v = {
      el, scene, camera, tilt, turn, key, rim,
      fit: { w: 3, h: 3, cy: 1, margin: 1.15, elev: 0.18 },
      spin: { angle: opts.angle || 0, vel: 0, auto: opts.auto ?? 0.18, drag: false, swing: opts.swing || 0, range: opts.range || 0.5, offset: opts.offset || 0 },
      hover: false, px: 0, py: 0, visible: false, t0: performance.now() / 1000
    };
    if (opts.plinth !== false) {
      const pr = opts.plinthR || 1.15, ph = opts.plinthH || 0.62;
      const p = plinth(pr, ph, opts.plinthColor);
      turn.add(p);
      // the plinth's own soft shadow on the gallery floor
      const fs = shadow(pr * 1.5, pr * 1.5, 0.32);
      fs.position.y = -ph + 0.002;
      tilt.add(fs);
      v.plinth = p;
      v.plinthBox = { r: pr, h: ph };
    }
    v.update = build(turn, v) || null;
    if (opts.fit) Object.assign(v.fit, opts.fit);
    frame(v);

    // interaction: hover lean, drag to turn (horizontal drags only on touch)
    const onMove = e => {
      const r = el.getBoundingClientRect();
      v.px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      v.py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (v.spin.drag) {
        const dx = e.clientX - v.spin.lx;
        v.spin.lx = e.clientX;
        v.spin.angle += dx * 0.012;
        v.spin.vel = dx * 0.012 / Math.max(0.008, (performance.now() - v.spin.lt) / 1000);
        v.spin.lt = performance.now();
      }
    };
    const onEnter = () => { v.hover = true; };
    const onLeave = () => { v.hover = false; v.spin.drag = false; };
    const onDown = e => {
      if (opts.drag === false) return;
      v.spin.drag = true; v.spin.lx = e.clientX; v.spin.lt = performance.now(); v.spin.vel = 0;
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      if (opts.onPoke) opts.onPoke(v);
    };
    const onUp = () => { v.spin.drag = false; };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    views.add(v);

    v.dispose = () => {
      views.delete(v);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      });
    };
    return v;
  }

  return { init, view, mat, roundedBox, plinth, shadow, glyph, get ok() { return ok; }, get count() { return views.size; } };
})();
