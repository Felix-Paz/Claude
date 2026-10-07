/* =====================================================================
   MUSEUM OF DESIGN · 3D exhibits
   · GALLERY — a corner of a real gallery: twelve paintings that hang
     salon-style, then one per wall (White Space · One Per Wall)
   · FIBONACCI — the golden rectangle as a terrazzo slab of Fibonacci
     tiles with a brass spiral inlay and a ball rolling home
     (Balance · The Golden Ratio)
   ===================================================================== */
window.EX3D = (function () {
  'use strict';
  const T = () => THREE;
  const svgTex = (markup, size = 512, bg = '#FBFAF6') => {
    const THREE = T();
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    const img = new Image();
    img.onload = () => { g.drawImage(img, 0, 0, size, size); tex.needsUpdate = true; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">${markup}</svg>`);
    return tex;
  };

  /* ---------------- the gallery wall ---------------- */
  function gallery(el, c, art) {
    const THREE = T();
    if (!window.THREE || !S3D.init()) return null;
    const Mt = S3D.mat;
    let api = null;
    const v = S3D.view(el, (turn, vv) => {
      const room = new THREE.Group();
      turn.add(room);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xF2EEE6, roughness: 0.95 });
      const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.12), wallMat);
      wall.position.set(0, 2, -0.06);
      wall.receiveShadow = true;
      const floorMat = new THREE.MeshStandardMaterial({ color: 0xD9CFBF, roughness: 0.7 });
      const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 4.4), floorMat);
      floor.position.set(0, -0.05, 2.1);
      floor.receiveShadow = true;
      // floorboards
      for (let i = -9; i <= 9; i++) {
        const seam = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.002, 4.4), new THREE.MeshBasicMaterial({ color: 0xC7BBA8 }));
        seam.position.set(i * 0.42, 0.001, 2.1);
        room.add(seam);
      }
      const skirting = new THREE.Mesh(new THREE.BoxGeometry(8, 0.12, 0.03), Mt.clay(0xE6E0D4, 0.8));
      skirting.position.set(0, 0.06, 0.015);
      room.add(wall, floor, skirting);

      // twelve works: canvas, mat and frame
      const FR = [Mt.gloss(0x0C0C14, 0.4), Mt.brass(0.32), Mt.clay(0x8A5A34, 0.6), Mt.clay(0xFFFFFF, 0.7)];
      const works = art.map((a, i) => {
        const g = new THREE.Group();
        const tex = svgTex(a);
        const canvas = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0 }));
        canvas.position.z = 0.032;
        const frame = new THREE.Mesh(S3D.roundedBox(1.16, 1.16, 0.05, 0.012, 2), FR[i === 0 ? 0 : i % FR.length]);
        frame.position.z = 0.0;
        frame.castShadow = true;
        const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.9 }));
        mat.position.z = 0.027;
        g.add(frame, mat, canvas);
        room.add(g);
        return { g, canvas, mat, frame };
      });
      // salon hang: crammed, mismatched, a little crooked
      const SALE = [[0, 1.75, 0.95], [-1.95, 2.55, 0.62], [-1.0, 2.75, 0.48], [0.95, 2.78, 0.62], [1.95, 2.35, 0.55], [-2.25, 1.45, 0.75], [-1.05, 1.15, 0.5], [1.0, 1.15, 0.64], [2.1, 1.25, 0.72], [-0.05, 0.62, 0.42], [-3.0, 2.2, 0.48], [3.05, 1.85, 0.5]];
      const st = SALE.map(([x, y, s], i) => ({ x, y, s, r: ((i * 37) % 9 - 4) * 0.012, k: 1 }));
      const target = SALE.map(([x, y, s], i) => ({ x, y, s, r: ((i * 37) % 9 - 4) * 0.012, k: 1 }));

      // the gallery hang adds a bench, a rope and a spotlight
      const extras = new THREE.Group();
      room.add(extras);
      const bench = new THREE.Group();
      const seat = new THREE.Mesh(S3D.roundedBox(1.7, 0.09, 0.46, 0.03), Mt.clay(0x6B4A2E, 0.55));
      seat.position.y = 0.44;
      [-0.68, 0.68].forEach(x => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.4), Mt.gloss(0x0C0C14, 0.35)); leg.position.set(x, 0.2, 0); bench.add(leg); });
      bench.add(seat);
      bench.position.set(0, 0, 2.3);
      bench.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
      const rope = new THREE.Group();
      [-0.95, 0.95].forEach(x => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 16), Mt.brass(0.25));
        post.position.set(x, 0.45, 0.85);
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), Mt.brass(0.25));
        top.position.set(x, 0.92, 0.85);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.03, 32), Mt.brass(0.3));
        base.position.set(x, 0.015, 0.85);
        rope.add(post, top, base);
      });
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.95, 0.88, 0.85), new THREE.Vector3(0, 0.62, 0.85), new THREE.Vector3(0.95, 0.88, 0.85)]);
      rope.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.022, 10), Mt.velvet(0x8B1E2B, 0xFF8899)));
      rope.traverse(o => { if (o.isMesh) o.castShadow = true; });
      const label = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2), new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.9 }));
      label.position.set(1.05, 1.25, 0.012);
      for (let i = 0; i < 3; i++) { const ln = new THREE.Mesh(new THREE.PlaneGeometry(i ? 0.18 : 0.24, 0.014), new THREE.MeshBasicMaterial({ color: i ? 0x9A958B : 0x0C0C14 })); ln.position.set(1.02 - (i ? 0.03 : 0), 1.3 - i * 0.04, 0.014); extras.add(ln); }
      extras.add(bench, rope, label);
      // spotlight: a soft cone and a pool of light
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.2, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFF3DA, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      cone.position.set(0, 2.55, 0.6);
      cone.rotation.x = -0.35;
      room.add(cone);
      const spot = new THREE.SpotLight(0xFFF1D6, 0, 9, 0.42, 0.55, 1.2);
      spot.position.set(0, 3.9, 2.4);
      spot.target.position.set(0, 1.6, 0);
      spot.castShadow = true;
      spot.shadow.mapSize.set(1024, 1024);
      room.add(spot, spot.target);
      const amb = new THREE.HemisphereLight(0xffffff, 0xD9CFBF, 0.5);
      room.add(amb);

      vv.fit = { w: 6.6, h: 3.6, cy: 1.65, elev: 0.06, margin: 1.0 };
      vv.camera.fov = 30;
      let mode = 'sale', dim = 0, dimT = 0;
      extras.scale.y = 0.001; extras.visible = false;
      api = {
        set(m) {
          mode = m;
          const g = m === 'gallery';
          SALE.forEach(([x, y, s], i) => {
            const t = target[i];
            // the others make room: they slide off the wall, out of frame
            if (g) Object.assign(t, i === 0 ? { x: 0, y: 1.6, s: 1.28, r: 0, k: 1 } : { x: (x < 0 || (x === 0 && i % 2) ? -1 : 1) * (4.8 + Math.abs(x)), y, s, r: 0, k: 1 });
            else Object.assign(t, { x, y, s, r: ((i * 37) % 9 - 4) * 0.012, k: 1 });
          });
          dimT = g ? 1 : 0;
          extras.visible = true;
          gsap.to(extras.scale, { y: g ? 1 : 0.001, duration: P.reduced ? 0 : 0.9, ease: g ? 'back.out(1.6)' : 'power2.in', delay: g ? 0.5 : 0, onComplete: () => { if (!g) extras.visible = false; } });
        }
      };
      const wallLit = new THREE.Color(0xF2EEE6), wallDim = new THREE.Color(0xCFC8BB);
      return (t, dt) => {
        works.forEach((w, i) => {
          const k = Math.min(1, dt * (3.2 + (i % 5) * 0.5));
          const s = st[i], g = target[i];
          s.x += (g.x - s.x) * k; s.y += (g.y - s.y) * k; s.s += (g.s - s.s) * k; s.r += (g.r - s.r) * k; s.k += (g.k - s.k) * k * 1.3;
          w.g.position.set(s.x, s.y, 0.05);
          w.g.rotation.z = s.r;
          const sc = Math.max(0.0001, s.s * s.k);
          w.g.scale.setScalar(sc);
          w.g.visible = sc > 0.002;
        });
        dim += (dimT - dim) * Math.min(1, dt * 3);
        wallMat.color.copy(wallLit).lerp(wallDim, dim);
        floorMat.color.setHex(0xD9CFBF).lerp(new THREE.Color(0xB9AE9C), dim);
        spot.intensity = dim * 28;
        cone.material.opacity = dim * 0.03;
        works[0].canvas.material.emissiveIntensity = dim * 0.06;
        amb.intensity = 0.5 - dim * 0.25;
        vv.key.intensity = 1.5 - dim * 0.9;
      };
    }, { plinth: false, auto: 0, swing: 0.25, range: 0.07, drag: false, lean: 0.6, shadows: { size: 5, map: 1536 }, fov: 30, key: 1.5, rimI: 0.35 });
    if (!v) return null;
    c.own(() => v.dispose());
    return api;
  }

  /* ---------------- Fibonacci: the golden rectangle in terrazzo ---------------- */
  function fibonacci(turn, v) {
    const THREE = T(), Mt = S3D.mat;
    const COLORS = [0xFD5A32, 0x3A22FC, 0xD9FD3A, 0x8DEFC5, 0xCDBFFF, 0xFBC49F, 0x0C0C14, 0xF3F0E9];
    // cut a 21 × 13 rectangle into Fibonacci squares, spiralling in
    let x = 0, y = 0, w = 21, h = 13;
    const sq = [];
    for (let k = 0; k < 7; k++) {
      const d = k % 4, s = Math.min(w, h);
      let q;
      if (d === 0) { q = [x, y, s]; x += s; w -= s; }
      else if (d === 1) { q = [x, y, s]; y += s; h -= s; }
      else if (d === 2) { q = [x + w - s, y, s]; w -= s; }
      else { q = [x, y + h - s, s]; h -= s; }
      sq.push(q.concat(d));
    }
    const U = 2.6 / 21, H = 0.2;
    const slab = new THREE.Group();
    slab.position.set(-21 * U / 2, 0, -13 * U / 2);
    turn.add(slab);
    const spiral = [];
    sq.forEach(([qx, qy, s, d], i) => {
      const gap = 0.012;
      const tile = new THREE.Mesh(S3D.roundedBox(s * U - gap, H, s * U - gap, Math.min(0.04, s * U * 0.12)), Mt.clay(COLORS[i % COLORS.length], i === 6 ? 0.4 : 0.55));
      tile.position.set((qx + s / 2) * U, H / 2, (qy + s / 2) * U);
      slab.add(tile);
      // quarter arc per square (same corners as the 2D construction)
      const cx = [qx + s, qx, qx, qx + s][d], cy = [qy + s, qy + s, qy, qy][d];
      const a0 = [Math.PI, -Math.PI / 2, 0, Math.PI / 2][d];
      for (let j = 0; j <= 16; j++) {
        const a = a0 + (j / 16) * (Math.PI / 2);
        spiral.push(new THREE.Vector3((cx + Math.cos(a) * s) * U, H + 0.018, (cy + Math.sin(a) * s) * U));
      }
    });
    const curve = new THREE.CatmullRomCurve3(spiral);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 400, 0.022, 12), Mt.brass(0.22));
    slab.add(tube);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 32, 24), Mt.gloss(0xFFFFFF, 0.08));
    slab.add(ball);
    const sh = S3D.shadow(1.7, 1.15, 0.3); turn.add(sh);
    v.fit = { w: 3.0, h: 1.6, cy: 0.2, elev: 0.62 };
    const p = new THREE.Vector3();
    return t => {
      const u = (t * 0.11) % 1;
      curve.getPointAt(Math.min(0.999, u), p);
      ball.position.set(p.x, p.y + 0.06, p.z);
      slab.rotation.x = Math.sin(t * 0.5) * 0.03;
      slab.position.y = 0.05 + Math.sin(t * 0.8) * 0.02;
    };
  }
  if (window.SCULPT) { SCULPT.builders.fibonacci = fibonacci; SCULPT.settings.fibonacci = { plinthR: 1.75, plinthH: 0.35, auto: 0.16 }; }

  return { gallery, fibonacci };
})();
