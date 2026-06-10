// ============================================================
// HELPERS.JS — tiny construction kit for the factory.
// Primitive builders, cached materials, canvas textures, easing.
// ============================================================

import * as THREE from 'three';

export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const matCache = new Map();

/** Cached standard material. Pass unique:true when the material will be animated. */
export function mat(color, opts = {}) {
  const { rough = 0.55, metal = 0.25, emissive = 0x000000, ei = 1, transparent = false, opacity = 1, unique = false, side } = opts;
  const key = unique ? null : `${color}|${rough}|${metal}|${emissive}|${ei}|${transparent}|${opacity}|${side || 0}`;
  if (key && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial({
    color, roughness: rough, metalness: metal,
    emissive, emissiveIntensity: ei, transparent, opacity,
    side: side || THREE.FrontSide,
  });
  if (key) matCache.set(key, m);
  return m;
}

export function glassMat(tint = 0xbfeFFF) {
  return new THREE.MeshPhysicalMaterial({
    color: tint, metalness: 0, roughness: 0.08,
    transmission: 0.92, thickness: 0.4, transparent: true, opacity: 0.5,
    envMapIntensity: 0.6,
  });
}

const geoCache = new Map();
function geo(kind, ...args) {
  const key = kind + args.join(',');
  if (!geoCache.has(key)) {
    const G = {
      box: THREE.BoxGeometry, cyl: THREE.CylinderGeometry, sph: THREE.SphereGeometry,
      torus: THREE.TorusGeometry, cone: THREE.ConeGeometry, plane: THREE.PlaneGeometry,
      caps: THREE.CapsuleGeometry,
    }[kind];
    geoCache.set(key, new G(...args));
  }
  return geoCache.get(key);
}

function place(mesh, parent, x, y, z) {
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export const box = (parent, w, h, d, x, y, z, material) => place(new THREE.Mesh(geo('box', w, h, d), material), parent, x, y, z);
export const cyl = (parent, rt, rb, h, seg, x, y, z, material) => place(new THREE.Mesh(geo('cyl', rt, rb, h, seg), material), parent, x, y, z);
export const sph = (parent, r, x, y, z, material, seg = 18) => place(new THREE.Mesh(geo('sph', r, seg, seg), material), parent, x, y, z);
export const torus = (parent, r, tube, x, y, z, material, seg = 24) => place(new THREE.Mesh(geo('torus', r, tube, 12, seg), material), parent, x, y, z);
export const cone = (parent, r, h, seg, x, y, z, material) => place(new THREE.Mesh(geo('cone', r, h, seg), material), parent, x, y, z);
export const caps = (parent, r, len, x, y, z, material) => place(new THREE.Mesh(geo('caps', r, len, 6, 14), material), parent, x, y, z);
export const plane = (parent, w, h, x, y, z, material) => place(new THREE.Mesh(geo('plane', w, h), material), parent, x, y, z);

/** Canvas-backed texture. draw(ctx, w, h). */
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Unlit emissive text plane (signs, labels). */
export function textPlane(parent, w, h, x, y, z, draw, opts = {}) {
  const tex = canvasTexture(opts.pw || 512, opts.ph || 256, draw);
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
  const p = plane(parent, w, h, x, y, z, m);
  return p;
}

/** Billboard sprite from canvas text. */
export function makeSprite(text, { size = 96, color = '#fff6e3', stroke = '#16121f', font = 'Archivo Black' } = {}) {
  const tex = canvasTexture(512, 256, (ctx, w, h) => {
    ctx.font = `${size}px "${font}", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 14; ctx.strokeStyle = stroke;
    ctx.strokeText(text, w / 2, h / 2);
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2);
  });
  const sm = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const s = new THREE.Sprite(sm);
  s.scale.set(2.4, 1.2, 1);
  return s;
}

// ---------------- easing & math ----------------
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

/** Capture base transform so animations can offset without drifting. */
export function snapshot(obj) {
  obj.traverse((o) => {
    o.userData.base = {
      p: o.position.clone(),
      r: o.rotation.clone(),
      s: o.scale.clone(),
    };
  });
}
export function resetToBase(obj) {
  obj.traverse((o) => {
    const b = o.userData.base;
    if (!b) return;
    o.position.copy(b.p);
    o.rotation.copy(b.r);
    o.scale.copy(b.s);
  });
}
