// ============================================================
// CYLINDER.JS — the evidence vessel. The user's text is printed
// onto paper strips and sealed inside a glass roll that travels
// the factory. The words on the paper are the user's actual words.
// ============================================================

import * as THREE from 'three';
import { mat, glassMat, cyl, torus, canvasTexture, clamp } from './helpers.js';

function stripTexture(lines) {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#fff6e3';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d8c9a8';
    ctx.fillRect(0, 0, w, 14); ctx.fillRect(0, h - 14, w, 14);
    ctx.fillStyle = '#2a2114';
    ctx.font = '17px monospace';
    lines.forEach((line, i) => ctx.fillText(line, 12, 44 + i * 26));
  });
}

function chunkText(text, lineLen = 24, linesPerStrip = 17, strips = 6) {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > lineLen) { lines.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
    if (lines.length >= linesPerStrip * strips) break;
  }
  if (cur.trim()) lines.push(cur.trim());
  const out = [];
  for (let s = 0; s < strips; s++) {
    out.push(lines.slice(s * linesPerStrip, (s + 1) * linesPerStrip));
    if (!out[s].length) out[s] = ['· · ·'];
  }
  return out;
}

export function buildCylinder(text) {
  const group = new THREE.Group();

  // glass shell
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82, 0.82, 2.3, 24, 1, true),
    glassMat(0xcdeeff),
  );
  glass.position.y = 1.35;
  group.add(glass);

  // brass caps — the lid starts hovering open
  const capMat = mat(0xb8742c, { metal: 0.85, rough: 0.25 });
  const capBottom = cyl(group, 0.9, 0.96, 0.22, 24, 0, 0.18, 0, capMat);
  torus(group, 0.86, 0.05, 0, 0.32, 0, mat(0xffd23f, { emissive: 0xffae00, ei: 0.8 }), 26).rotation.x = Math.PI / 2;
  const capTop = cyl(group, 0.96, 0.9, 0.24, 24, 0, 2.62, 0, capMat);
  const handle = torus(capTop, 0.28, 0.05, 0, 0.16, 0, capMat, 18);
  handle.rotation.x = Math.PI / 2;

  // paper strips with the user's words, arranged in a ring
  const strips = new THREE.Group();
  strips.position.y = 1.35;
  group.add(strips);
  const chunks = chunkText(text);
  chunks.forEach((lines, i) => {
    const m = new THREE.MeshBasicMaterial({ map: stripTexture(lines), side: THREE.DoubleSide });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.9), m);
    const a = (i / chunks.length) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
    s.rotation.y = -a + Math.PI / 2;
    s.userData.targetScale = 1;
    s.scale.setScalar(0.001);
    strips.add(s);
  });

  // inner glow
  const glow = new THREE.PointLight(0xffe2a8, 4, 5, 1.8);
  glow.position.y = 1.4;
  group.add(glow);

  // ---------------- state ----------------
  const state = {
    fill: 0,            // 0..1 strips materializing
    lid: 1,             // 1 = open (raised), 0 = sealed
    lidTarget: 1,
    filling: false,
    bobT: 0,
  };

  function fill(seconds = 1.6) {
    state.filling = true;
    state.fillSpeed = 1 / seconds;
    return new Promise((res) => { state.fillDone = res; });
  }

  function seal() {
    state.lidTarget = 0;
    return new Promise((res) => { state.sealDone = res; });
  }

  function update(dt, t) {
    // strips materialize one after another
    if (state.filling) {
      state.fill = clamp(state.fill + dt * state.fillSpeed, 0, 1);
      if (state.fill >= 1) { state.filling = false; state.fillDone?.(); }
    }
    strips.children.forEach((s, i) => {
      const k = clamp(state.fill * strips.children.length - i, 0, 1);
      s.scale.setScalar(Math.max(0.001, k));
      s.position.y = (1 - k) * 2.2;
    });
    strips.rotation.y = t * 0.45;

    // lid seal animation
    const prevLid = state.lid;
    state.lid += (state.lidTarget - state.lid) * Math.min(1, dt * 4.5);
    capTop.position.y = 2.62 + state.lid * 1.6;
    capTop.rotation.y = state.lid * 0.8;
    if (prevLid > 0.05 && state.lid <= 0.05 && state.sealDone) {
      const done = state.sealDone; state.sealDone = null; done();
    }

    // inner glow breathes
    glow.intensity = 3.2 + Math.sin(t * 2.6) * 1.0;
  }

  return { group, update, fill, seal };
}
