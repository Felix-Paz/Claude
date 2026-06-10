// ============================================================
// FX.JS — steam, sparks, confetti. The factory breathes.
// ============================================================

import * as THREE from 'three';

export function initFX(scene) {
  const emitters = [];
  const bursts = [];
  let confettiSys = null;

  // ---------------- steam ----------------
  function addSteam(pos, { rate = 1, size = 0.34, height = 3.4 } = {}) {
    const N = 26;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(N * 3);
    const seeds = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      seeds[i] = Math.random();
      positions[i * 3] = pos.x + (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = pos.y + Math.random() * height;
      positions[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xc9bce8, size, transparent: true, opacity: 0.32,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    emitters.push({ points, pos: pos.clone(), seeds, rate, height });
  }

  // ---------------- sparks ----------------
  function burst(pos, color = 0xffd23f, n = 26, power = 4) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(n * 3);
    const vels = [];
    for (let i = 0; i < n; i++) {
      positions[i * 3] = pos.x; positions[i * 3 + 1] = pos.y; positions[i * 3 + 2] = pos.z;
      vels.push(new THREE.Vector3(
        (Math.random() - 0.5) * power,
        Math.random() * power * 0.9,
        (Math.random() - 0.5) * power,
      ));
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color, size: 0.14, transparent: true, opacity: 1,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    bursts.push({ points, vels, life: 0.9, maxLife: 0.9 });
  }

  // ---------------- confetti ----------------
  function confetti(pos, n = 150) {
    if (confettiSys) { scene.remove(confettiSys.mesh); confettiSys = null; }
    const geo = new THREE.BoxGeometry(0.14, 0.02, 0.14);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial(), n);
    const colors = [0xff4757, 0xffd23f, 0x3df58c, 0x2de2e6, 0xa06bff, 0xff6bcb];
    const items = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      mesh.setColorAt(i, new THREE.Color(colors[i % colors.length]));
      const p = pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.4, Math.random() * 0.5, (Math.random() - 0.5) * 1.4));
      items.push({
        p,
        v: new THREE.Vector3((Math.random() - 0.5) * 5, 4 + Math.random() * 5, (Math.random() - 0.5) * 5),
        r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
        rv: new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9),
      });
      dummy.position.copy(p);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(mesh);
    confettiSys = { mesh, items, dummy, life: 5 };
  }

  // ---------------- tick ----------------
  function update(dt, t) {
    for (const e of emitters) {
      const arr = e.points.geometry.attributes.position.array;
      for (let i = 0; i < e.seeds.length; i++) {
        let y = arr[i * 3 + 1] + dt * (0.8 + e.seeds[i]) * e.rate;
        if (y > e.pos.y + e.height) {
          y = e.pos.y;
          arr[i * 3] = e.pos.x + (Math.random() - 0.5) * 0.3;
          arr[i * 3 + 2] = e.pos.z + (Math.random() - 0.5) * 0.3;
        }
        arr[i * 3] += Math.sin(t * 1.2 + e.seeds[i] * 9) * dt * 0.25;
        arr[i * 3 + 1] = y;
      }
      e.points.geometry.attributes.position.needsUpdate = true;
    }

    for (let bi = bursts.length - 1; bi >= 0; bi--) {
      const b = bursts[bi];
      b.life -= dt;
      const arr = b.points.geometry.attributes.position.array;
      for (let i = 0; i < b.vels.length; i++) {
        b.vels[i].y -= dt * 9;
        arr[i * 3] += b.vels[i].x * dt;
        arr[i * 3 + 1] += b.vels[i].y * dt;
        arr[i * 3 + 2] += b.vels[i].z * dt;
      }
      b.points.geometry.attributes.position.needsUpdate = true;
      b.points.material.opacity = Math.max(0, b.life / b.maxLife);
      if (b.life <= 0) { scene.remove(b.points); bursts.splice(bi, 1); }
    }

    if (confettiSys) {
      confettiSys.life -= dt;
      const { mesh, items, dummy } = confettiSys;
      items.forEach((it, i) => {
        it.v.y -= dt * 4.5;
        it.v.multiplyScalar(1 - dt * 0.4);
        it.p.addScaledVector(it.v, dt);
        if (it.p.y < 0.05) { it.p.y = 0.05; it.v.set(0, 0, 0); it.rv.multiplyScalar(0.9); }
        it.r.x += it.rv.x * dt; it.r.y += it.rv.y * dt; it.r.z += it.rv.z * dt;
        dummy.position.copy(it.p);
        dummy.rotation.copy(it.r);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (confettiSys.life <= 0) { scene.remove(mesh); confettiSys = null; }
    }
  }

  return { addSteam, burst, confetti, update };
}
