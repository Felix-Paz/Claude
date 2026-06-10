// ============================================================
// ROOMS.JS — the factory itself: floor, pipes, gears, conveyor,
// intake assembly, seven analysis rooms with props, verdict vault.
// ============================================================

import * as THREE from 'three';
import {
  mat, box, cyl, sph, torus, cone, plane, caps,
  canvasTexture, textPlane, makeSprite, clamp, lerp,
} from './helpers.js';
import { buildTique, buildIntern } from './tiques.js';

export const ROOM_SPACING = 26;
export const INTAKE_X = 0;
export const roomX = (i) => ROOM_SPACING * (i + 1);
export const VERDICT_X = ROOM_SPACING * 8;
export const BELT_Y = 1.06; // top surface of the conveyor

const WORLD_X0 = -22;
const WORLD_X1 = VERDICT_X + 30;

// ----------------------------------------------------------------
function signTexture(text, accent, sub = '') {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#16121f';
    ctx.fillRect(0, 0, w, h);
    // hazard border
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, 18); ctx.rect(0, h - 18, w, 18); ctx.clip();
    for (let x = -40; x < w + 40; x += 40) {
      ctx.fillStyle = '#ffd23f'; ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x - 10, h); ctx.lineTo(x - 30, h); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = accent;
    ctx.font = '900 92px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 - (sub ? 18 : 0));
    if (sub) {
      ctx.fillStyle = '#9c8fc0';
      ctx.font = '32px monospace';
      ctx.fillText(sub, w / 2, h / 2 + 62);
    }
  });
}

function hangingSign(parent, text, accentHex, x, y, z, w = 7) {
  const tex = signTexture(text, accentHex);
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: false });
  const s = plane(parent, w, w / 4, x, y, z, m);
  // chains
  const chain = mat(0x4a3f63, { metal: 0.7 });
  cyl(parent, 0.03, 0.03, 1.4, 6, x - w / 2 + 0.5, y + w / 8 + 0.7, z, chain);
  cyl(parent, 0.03, 0.03, 1.4, 6, x + w / 2 - 0.5, y + w / 8 + 0.7, z, chain);
  return s;
}

function gearAssembly(x, z, scale = 1, color = 0x4a3f63) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const m = mat(color, { metal: 0.7, rough: 0.35 });
  const mkGear = (r, y, ox) => {
    const gear = new THREE.Group();
    gear.position.set(ox, y, 0);
    torus(gear, r, r * 0.22, 0, 0, 0, m, 18);
    for (let i = 0; i < 4; i++) {
      const spoke = box(gear, r * 2, r * 0.16, r * 0.14, 0, 0, 0, m);
      spoke.rotation.z = (i / 4) * Math.PI;
    }
    for (let i = 0; i < 8; i++) {
      const tooth = box(gear, r * 0.28, r * 0.28, r * 0.2, Math.cos((i / 8) * Math.PI * 2) * (r + r * 0.22), Math.sin((i / 8) * Math.PI * 2) * (r + r * 0.22), 0, m);
      tooth.rotation.z = (i / 8) * Math.PI * 2;
    }
    g.add(gear);
    return gear;
  };
  const a = mkGear(1.5 * scale, 3.4 * scale, 0);
  const b = mkGear(0.9 * scale, 3.4 * scale + 2.45 * scale, 0.4 * scale);
  g.userData.gears = [{ obj: a, v: 0.6 }, { obj: b, v: -1.0 }];
  return g;
}

// ----------------------------------------------------------------
export function buildFactory(scene, defs) {
  const api = { tiques: {}, beltSpeed: 0, update, openIntakeDoors, stampSlam, setBeltSpeed, setCringeAlarm };
  const animated = []; // {fn(dt,t)}
  const roomGroups = {};

  // ================== FLOOR ==================
  const floorTex = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#181226'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#241b38'; ctx.lineWidth = 3;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath(); ctx.moveTo((w / 8) * i, 0); ctx.lineTo((w / 8) * i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (h / 8) * i); ctx.lineTo(w, (h / 8) * i); ctx.stroke();
    }
    ctx.fillStyle = '#1f1730';
    for (let i = 0; i < 40; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set((WORLD_X1 - WORLD_X0) / 8, 5);
  const floor = plane(scene, WORLD_X1 - WORLD_X0, 40, (WORLD_X0 + WORLD_X1) / 2, 0, 0,
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0.2 }));
  floor.rotation.x = -Math.PI / 2;

  // hazard stripes alongside the belt
  const hazardTex = canvasTexture(256, 64, (ctx, w, h) => {
    for (let x = -40; x < w + 40; x += 40) {
      ctx.fillStyle = '#ffd23f'; ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x - 10, h); ctx.lineTo(x - 30, h); ctx.fill();
      ctx.fillStyle = '#16121f'; ctx.beginPath();
      ctx.moveTo(x + 20, 0); ctx.lineTo(x + 40, 0); ctx.lineTo(x + 10, h); ctx.lineTo(x - 10, h); ctx.fill();
    }
  });
  hazardTex.wrapS = THREE.RepeatWrapping;
  hazardTex.repeat.set((WORLD_X1 - WORLD_X0) / 6, 1);
  for (const zz of [2.1, -2.1]) {
    const hz = plane(scene, WORLD_X1 - WORLD_X0, 0.5, (WORLD_X0 + WORLD_X1) / 2, 0.02, zz,
      new THREE.MeshBasicMaterial({ map: hazardTex }));
    hz.rotation.x = -Math.PI / 2;
  }

  // ================== CEILING / COLUMNS ==================
  const beamMat = mat(0x2b2240, { metal: 0.6, rough: 0.4 });
  for (let x = WORLD_X0 + 8; x < WORLD_X1; x += 13) {
    box(scene, 0.6, 0.6, 19, x, 8.6, -0.5, beamMat);
    box(scene, 0.55, 8.6, 0.55, x, 4.3, -8.5, beamMat);
    if (((x / 13) | 0) % 2 === 0) box(scene, 0.55, 8.6, 0.55, x, 4.3, 8.8, beamMat);
  }
  // long spine beams
  box(scene, WORLD_X1 - WORLD_X0, 0.4, 0.4, (WORLD_X0 + WORLD_X1) / 2, 8.8, -4, beamMat);
  box(scene, WORLD_X1 - WORLD_X0, 0.4, 0.4, (WORLD_X0 + WORLD_X1) / 2, 8.8, 3, beamMat);

  // hanging lamps
  const lampShade = mat(0x241c38, { metal: 0.5 });
  for (let x = -8; x < WORLD_X1; x += 13) {
    const lamp = new THREE.Group();
    lamp.position.set(x, 8.4, 0.5);
    cyl(lamp, 0.02, 0.02, 1.2, 6, 0, -0.6, 0, lampShade);
    cone(lamp, 0.65, 0.5, 12, 0, -1.35, 0, lampShade);
    sph(lamp, 0.22, 0, -1.5, 0, mat(0xffe9b0, { emissive: 0xffd98a, ei: 2.2 }));
    scene.add(lamp);
    const phase = Math.random() * 9;
    animated.push((dt, t) => { lamp.rotation.x = Math.sin(t * 0.7 + phase) * 0.06; });
  }

  // ================== BACK WALL ==================
  const wallMat = mat(0x1d1530, { rough: 0.8 });
  box(scene, WORLD_X1 - WORLD_X0, 9, 0.5, (WORLD_X0 + WORLD_X1) / 2, 4.5, -9, wallMat);
  // glowing windows strip
  const winTex = canvasTexture(1024, 128, (ctx, w, h) => {
    for (let x = 8; x < w; x += 56) {
      ctx.fillStyle = Math.random() > 0.4 ? '#3a2d66' : '#5a4391';
      ctx.fillRect(x, 26, 40, 76);
      ctx.fillStyle = 'rgba(255,222,140,.16)';
      ctx.fillRect(x + 4, 32, 32, 30);
    }
  });
  winTex.wrapS = THREE.RepeatWrapping;
  winTex.repeat.set((WORLD_X1 - WORLD_X0) / 24, 1);
  plane(scene, WORLD_X1 - WORLD_X0, 2.4, (WORLD_X0 + WORLD_X1) / 2, 7.0, -8.72,
    new THREE.MeshBasicMaterial({ map: winTex }));

  // ================== PIPES + ENERGY PULSES ==================
  const pipeMat = mat(0x4a3f63, { metal: 0.75, rough: 0.3 });
  const pipeMat2 = mat(0x6d4390, { metal: 0.75, rough: 0.3 });
  for (const [py, pm] of [[5.6, pipeMat], [6.3, pipeMat2]]) {
    const pipe = cyl(scene, 0.22, 0.22, WORLD_X1 - WORLD_X0, 10, (WORLD_X0 + WORLD_X1) / 2, py, -7.6, pm);
    pipe.rotation.z = Math.PI / 2;
  }
  // vertical feeder pipes + valves at each room
  for (let i = 0; i < 8; i++) {
    const x = roomX(i) - ROOM_SPACING / 2;
    cyl(scene, 0.18, 0.18, 5.6, 8, x, 2.8, -7.6, pipeMat);
    const valve = torus(scene, 0.36, 0.07, x, 4.2, -7.1, mat(0xff4757, { metal: 0.6 }), 16);
    animated.push((dt, t) => { valve.rotation.z += dt * 0.7; });
  }
  // pulses gliding through the pipes
  const pulses = [];
  const pulseMat = mat(0x2de2e6, { emissive: 0x2de2e6, ei: 2.6 });
  for (let i = 0; i < 9; i++) {
    const p = sph(scene, 0.3, WORLD_X0 + Math.random() * (WORLD_X1 - WORLD_X0), i % 2 ? 5.6 : 6.3, -7.6, pulseMat, 10);
    pulses.push({ obj: p, v: 5 + Math.random() * 4 });
  }
  animated.push((dt) => {
    for (const p of pulses) {
      p.obj.position.x += p.v * dt;
      if (p.obj.position.x > WORLD_X1) p.obj.position.x = WORLD_X0;
    }
  });

  // ================== GEARS between rooms ==================
  for (let i = 0; i <= 7; i++) {
    const ga = gearAssembly(roomX(i) - ROOM_SPACING / 2, -6.8, 0.9 + (i % 3) * 0.25);
    scene.add(ga);
    animated.push((dt, t) => {
      for (const gear of ga.userData.gears) gear.obj.rotation.z += dt * gear.v * (0.5 + api.beltSpeed * 0.4);
    });
  }

  // ================== CONVEYOR ==================
  const beltTex = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#221a33'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2f2547'; ctx.fillRect(0, 0, 18, h);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(54, h / 2 - 3, 20, 6);
  });
  beltTex.wrapS = THREE.RepeatWrapping;
  beltTex.repeat.set((WORLD_X1 - WORLD_X0) / 2.4, 1);
  const beltTop = plane(scene, WORLD_X1 - WORLD_X0, 2.0, (WORLD_X0 + WORLD_X1) / 2, BELT_Y, 0,
    new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.7, metalness: 0.1 }));
  beltTop.rotation.x = -Math.PI / 2;
  box(scene, WORLD_X1 - WORLD_X0, 0.85, 2.3, (WORLD_X0 + WORLD_X1) / 2, 0.58, 0, mat(0x342a4e, { metal: 0.5, rough: 0.45 }));
  // side rails with emissive trim
  for (const zz of [1.25, -1.25]) {
    box(scene, WORLD_X1 - WORLD_X0, 0.14, 0.12, (WORLD_X0 + WORLD_X1) / 2, 1.12, zz, mat(0xffd23f, { emissive: 0xff9d1a, ei: 0.85 }));
  }
  // legs
  for (let x = WORLD_X0 + 4; x < WORLD_X1; x += 4.2) {
    box(scene, 0.3, 0.6, 1.8, x, 0.16, 0, mat(0x241c38));
  }
  animated.push((dt) => { beltTex.offset.x -= dt * api.beltSpeed * 0.42; });

  // small rollers at the belt front edge
  for (let x = -6; x < VERDICT_X + 6; x += 2.1) {
    const r = cyl(scene, 0.09, 0.09, 2.0, 8, x, 1.0, 1.32, mat(0x57496f, { metal: 0.8 }));
    r.rotation.x = Math.PI / 2;
    animated.push((dt) => { r.rotation.y -= dt * api.beltSpeed * 4; });
  }

  // ================== INTAKE ASSEMBLY (x = 0) ==================
  const intake = new THREE.Group();
  intake.position.set(INTAKE_X, 0, 0);
  scene.add(intake);
  // support frame
  const frameM = mat(0x3a2f55, { metal: 0.6 });
  box(intake, 0.5, 7.6, 0.5, -3.2, 3.8, -1.6, frameM);
  box(intake, 0.5, 7.6, 0.5, 3.2, 3.8, -1.6, frameM);
  box(intake, 7, 0.5, 0.5, 0, 7.6, -1.6, frameM);
  // THE FUNNEL — inverted glowing cone over the belt
  const funnel = new THREE.Group();
  funnel.position.set(0, 5.6, 0);
  intake.add(funnel);
  const funnelMesh = cyl(funnel, 1.9, 0.45, 2.2, 18, 0, 0, 0, mat(0xb8742c, { metal: 0.7, rough: 0.35 }));
  torus(funnel, 1.9, 0.14, 0, 1.1, 0, mat(0xffd23f, { emissive: 0xffae00, ei: 1.4 }), 28);
  cyl(funnel, 0.45, 0.45, 1.4, 12, 0, -1.7, 0, mat(0x8a5a20, { metal: 0.7 }));
  animated.push((dt, t) => { funnel.rotation.y += dt * 0.4; funnel.position.y = 5.6 + Math.sin(t * 1.3) * 0.08; });
  // printer box where paper is made physical
  box(intake, 2.6, 1.6, 2.6, 0, 3.0, 0, mat(0x46395f, { metal: 0.4 }));
  plane(intake, 1.7, 0.18, 0, 2.62, 1.31, new THREE.MeshBasicMaterial({ color: 0x16121f })); // slot
  const printLight = sph(intake, 0.12, 1.0, 3.42, 1.1, mat(0xff4757, { emissive: 0xff4757, ei: 2 }));
  animated.push((dt, t) => { printLight.material.emissiveIntensity = 1.2 + Math.sin(t * 5) * 0.9; });
  hangingSign(intake, 'INTAKE VALVE 7-B', '#ffd23f', 0, 6.9, 2.2, 6.4);
  textPlane(intake, 3.4, 0.85, 0, 1.9, 1.45, (ctx, w, h) => {
    ctx.fillStyle = '#fff6e3'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#16121f'; ctx.font = 'bold 34px monospace'; ctx.textAlign = 'center';
    ctx.fillText('FEED RESPONSIBLY', w / 2, 56);
    ctx.font = '24px monospace'; ctx.fillStyle = '#7c2d2d';
    ctx.fillText('the machine remembers', w / 2, 96);
  });

  // intake gate doors (slide apart when factory opens)
  const gate = new THREE.Group();
  gate.position.set(5.5, 0, 0);
  scene.add(gate);
  box(gate, 0.7, 8, 0.7, 0, 4, -4.4, frameM);
  box(gate, 0.7, 8, 0.7, 0, 4, 4.4, frameM);
  box(gate, 0.7, 0.7, 9.4, 0, 8, 0, frameM);
  const doorMatU = mat(0x5a4391, { metal: 0.5, rough: 0.4, unique: true });
  const doorL = box(gate, 0.4, 6.6, 4.1, 0, 3.3, -2.1, doorMatU);
  const doorR = box(gate, 0.4, 6.6, 4.1, 0, 3.3, 2.1, doorMatU);
  // warning lights on the gate
  const gateLampM = mat(0xff4757, { emissive: 0xff4757, ei: 1.6, unique: true });
  const gateLamp = sph(gate, 0.2, 0, 7.4, 0, gateLampM);
  animated.push((dt, t) => { gateLamp.material.emissiveIntensity = 1.1 + Math.sin(t * 3.2) * 0.7; });
  let doorOpen = 0, doorTarget = 0;
  animated.push((dt) => {
    doorOpen = lerp(doorOpen, doorTarget, dt * 2.2);
    doorL.position.z = -2.1 - doorOpen * 3.4;
    doorR.position.z = 2.1 + doorOpen * 3.4;
  });
  function openIntakeDoors(open = true) { doorTarget = open ? 1 : 0; }

  // big TIQUE marquee back at the lobby
  hangingSign(scene, 'TIQUE™ — THE CRITIQUE FACTORY', '#2de2e6', -2, 8.0, -7.2, 13);

  // ================== THE SEVEN ROOMS ==================
  const ROOM_PROPS = { syntax: propsSyntax, tempo: propsTempo, logic: propsLogic, cringe: propsCringe, tone: propsTone, novelty: propsNovelty, surprise: propsSurprise };

  defs.forEach((def, i) => {
    const x = roomX(i);
    const room = new THREE.Group();
    room.position.set(x, 0, 0);
    scene.add(room);
    roomGroups[def.id] = room;

    // accent backdrop
    const accent = new THREE.Color(def.color);
    const dim = accent.clone().multiplyScalar(0.16);
    box(room, 11, 7.2, 0.4, 0, 3.6, -8.4, new THREE.MeshStandardMaterial({ color: dim, roughness: 0.7 }));
    box(room, 11, 0.35, 0.5, 0, 7.4, -8.3, mat(def.color, { emissive: def.color, ei: 0.8 }));
    box(room, 0.35, 7.2, 0.5, -5.5, 3.6, -8.3, mat(def.color, { emissive: def.color, ei: 0.55 }));
    box(room, 0.35, 7.2, 0.5, 5.5, 3.6, -8.3, mat(def.color, { emissive: def.color, ei: 0.55 }));

    hangingSign(room, def.sign, def.accent, 0, 6.2, -4.2, 7.5);
    // room number stencil on the floor
    textPlane(room, 2.6, 1.3, -3.6, 0.03, 3.4, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(255,210,63,.75)';
      ctx.font = '900 110px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1).padStart(2, '0'), w / 2, h / 2);
    }).rotation.x = -Math.PI / 2;

    // room accent light
    const pl = new THREE.PointLight(def.color, 26, 19, 1.7);
    pl.position.set(0, 5.2, -2);
    room.add(pl);
    animated.push((dt, t) => { pl.intensity = 24 + Math.sin(t * 2.4 + i * 1.7) * 4; });

    // the creature
    const tq = buildTique(def);
    tq.place(x - 1.6, 0, -3.4, 0.15);
    scene.add(tq.group);
    api.tiques[def.id] = tq;

    // bespoke props
    ROOM_PROPS[def.id]?.(room, animated, def);
  });

  // ================== VERDICT VAULT ==================
  const vault = new THREE.Group();
  vault.position.set(VERDICT_X, 0, 0);
  scene.add(vault);
  // giant vault door backdrop
  const vd = new THREE.Group(); vd.position.set(0, 4, -8); vault.add(vd);
  cyl(vd, 4.4, 4.4, 0.7, 28, 0, 0, 0, mat(0x3a3050, { metal: 0.8, rough: 0.3 })).rotation.x = Math.PI / 2;
  torus(vd, 4.4, 0.22, 0, 0, 0.35, mat(0xffd23f, { emissive: 0xffae00, ei: 0.9 }), 36);
  const vaultWheel = new THREE.Group(); vaultWheel.position.set(0, 0, 0.55); vd.add(vaultWheel);
  torus(vaultWheel, 1.5, 0.14, 0, 0, 0, mat(0x57496f, { metal: 0.8 }), 22);
  for (let i = 0; i < 3; i++) {
    const sp = box(vaultWheel, 3, 0.16, 0.12, 0, 0, 0, mat(0x57496f, { metal: 0.8 }));
    sp.rotation.z = (i / 3) * Math.PI;
  }
  animated.push((dt) => { vaultWheel.rotation.z += dt * 0.25; });
  hangingSign(vault, 'FINAL VERDICT VAULT', '#ffd23f', 0, 6.6, -4.5, 8.5);

  // the GREAT STAMP — slams onto the cylinder for the verdict
  const stampRig = new THREE.Group(); stampRig.position.set(0, 0, 0); vault.add(stampRig);
  box(stampRig, 0.6, 7.5, 0.6, -2.6, 3.75, -1.4, frameM);
  box(stampRig, 5.4, 0.5, 0.6, 0, 7.3, -1.4, frameM);
  const stampArm = new THREE.Group(); stampArm.position.set(0.4, 6.9, 0); stampRig.add(stampArm);
  cyl(stampArm, 0.3, 0.3, 2.4, 10, 0, -1.2, 0, mat(0x8a5a20, { metal: 0.7 }));
  box(stampArm, 1.7, 0.5, 1.7, 0, -2.6, 0, mat(0xff4757, { emissive: 0xff4757, ei: 0.5, unique: true }));
  let stampAnim = -1;
  animated.push((dt, t) => {
    if (stampAnim >= 0) {
      stampAnim += dt;
      const k = stampAnim;
      let yo = 0;
      if (k < 0.45) yo = -easeIn(k / 0.45) * 3.1;           // slam down
      else if (k < 0.8) yo = -3.1;                            // hold
      else if (k < 1.6) yo = -3.1 + (k - 0.8) / 0.8 * 3.1;   // rise
      else stampAnim = -1;
      stampArm.position.y = 6.9 + yo;
    }
  });
  function stampSlam() { stampAnim = 0; }
  function easeIn(t) { return t * t * t; }

  // celebratory string lights across the vault
  for (let i = 0; i < 14; i++) {
    const lx = -6 + i * 0.95;
    const ly = 6.2 + Math.sin((i / 13) * Math.PI) * -0.9;
    const c = [0xff4757, 0xffd23f, 0x3df58c, 0x2de2e6, 0xa06bff][i % 5];
    const bulb = sph(vault, 0.11, lx, ly, 2.5, mat(c, { emissive: c, ei: 1.6, unique: true }), 8);
    animated.push((dt, t) => { bulb.material.emissiveIntensity = 1.2 + Math.sin(t * 4 + i * 1.1) * 0.8; });
  }
  // scoreboard
  textPlane(vault, 5, 2.5, 3.8, 4.0, -7.9, (ctx, w, h) => {
    ctx.fillStyle = '#0d0a14'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#4a3f63'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = '#2de2e6'; ctx.font = 'bold 44px monospace'; ctx.textAlign = 'center';
    ctx.fillText('DEPT. SCORES', w / 2, 64);
    ctx.fillStyle = '#9c8fc0'; ctx.font = '30px monospace';
    ctx.fillText('tabulating…', w / 2, 130);
    ctx.fillText('do not bribe the stamp', w / 2, 180);
  });

  // ================== LOBBY LIFE ==================
  const intern = buildIntern();
  intern.place(-5, 0, 4.5, 0);
  scene.add(intern.group);
  api.intern = intern;
  // the runaway comma
  const comma = makeSprite(',', { size: 160, color: '#ffd23f' });
  comma.position.set(-4, 0.8, 4);
  scene.add(comma);
  animated.push((dt, t) => {
    comma.position.x = -5 + Math.sin(t * 0.6) * 3.2;
    comma.position.z = 4.2 + Math.cos(t * 0.83) * 2.4;
    comma.position.y = 0.8 + Math.abs(Math.sin(t * 2.2)) * 0.5;
  });
  intern.chaseTarget = comma.position;

  // drifting dust motes for atmosphere
  const moteGeo = new THREE.BufferGeometry();
  const moteCount = 260;
  const motePos = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePos[i * 3] = WORLD_X0 + Math.random() * (WORLD_X1 - WORLD_X0);
    motePos[i * 3 + 1] = 0.5 + Math.random() * 8;
    motePos[i * 3 + 2] = -8 + Math.random() * 17;
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
    color: 0xc4b4ff, size: 0.05, transparent: true, opacity: 0.5, depthWrite: false,
  }));
  scene.add(motes);
  animated.push((dt, t) => { motes.position.y = Math.sin(t * 0.12) * 0.4; });

  // ================== per-frame ==================
  function setBeltSpeed(v) { api.beltSpeed = v; }
  function setCringeAlarm(on) {
    const room = roomGroups.cringe;
    if (room) room.userData.alarm = on;
  }
  function update(dt, t) {
    for (const fn of animated) fn(dt, t);
  }

  return api;
}

// ================================================================
// ROOM PROPS — each department gets its own furniture
// ================================================================

function propsSyntax(room, animated) {
  // mountains of paperwork
  const paper = mat(0xfff6e3, { rough: 0.9 });
  for (let i = 0; i < 7; i++) {
    const h = 0.5 + Math.random() * 1.8;
    const stack = box(room, 0.9, h, 0.7, -4.6 + (i % 4) * 1.2, h / 2, -5.6 - ((i / 4) | 0) * 1.2, paper);
    stack.rotation.y = Math.random() * 0.4;
  }
  // desk
  box(room, 3.2, 0.18, 1.6, 2.6, 1.3, -5.4, mat(0x5a4327));
  box(room, 0.2, 1.3, 0.2, 1.4, 0.65, -5.0, mat(0x3a2c18));
  box(room, 0.2, 1.3, 0.2, 3.8, 0.65, -5.0, mat(0x3a2c18));
  // auto-stamp machine that slams forever
  const stamper = new THREE.Group(); stamper.position.set(2.6, 0, -5.4); room.add(stamper);
  const stampArm = new THREE.Group(); stampArm.position.y = 2.8; stamper.add(stampArm);
  cyl(stampArm, 0.1, 0.1, 1.1, 8, 0, -0.5, 0, mat(0x8a5a20, { metal: 0.6 }));
  box(stampArm, 0.55, 0.2, 0.55, 0, -1.1, 0, mat(0xff4757, { emissive: 0xff4757, ei: 0.7 }));
  animated.push((dt, t) => {
    const k = Math.pow(Math.max(0, Math.sin(t * 2.2)), 10);
    stampArm.position.y = 2.8 - k * 1.15;
  });
  // red APPROVED/DENIED splats on the floor
  for (let i = 0; i < 5; i++) {
    const splat = plane(room, 0.6, 0.6, 1 + Math.random() * 3.4, 0.025, -3.2 + Math.random() * 1.8,
      new THREE.MeshBasicMaterial({ color: 0xc22838, transparent: true, opacity: 0.75 }));
    splat.rotation.x = -Math.PI / 2;
    splat.rotation.z = Math.random() * 6;
  }
  // flying papers caught mid-air
  for (let i = 0; i < 6; i++) {
    const p = plane(room, 0.45, 0.6, -2 + Math.random() * 5, 2 + Math.random() * 2.5, -4.5 + Math.random() * 2, new THREE.MeshBasicMaterial({ color: 0xfff6e3, side: THREE.DoubleSide }));
    const ph = Math.random() * 8;
    animated.push((dt, t) => {
      p.position.y += Math.sin(t * 1.4 + ph) * dt * 0.4;
      p.rotation.x = Math.sin(t * 0.9 + ph) * 0.8;
      p.rotation.z = Math.cos(t * 0.7 + ph) * 0.7;
    });
  }
}

function propsTempo(room, animated) {
  // the treadmill (its Warden runs beside the belt)
  const tm = new THREE.Group(); tm.position.set(-1.6, 0, -3.4); room.add(tm);
  const trackTex = canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#241c38'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff7a1a'; ctx.fillRect(0, h / 2 - 4, w, 8);
  });
  trackTex.wrapS = trackTex.wrapT = THREE.RepeatWrapping;
  trackTex.repeat.set(1, 4);
  const track = plane(tm, 1.6, 3.0, 0, 0.18, 0, new THREE.MeshStandardMaterial({ map: trackTex, roughness: 0.8 }));
  track.rotation.x = -Math.PI / 2;
  box(tm, 1.9, 0.16, 3.3, 0, 0.06, 0, mat(0x342a4e, { metal: 0.5 }));
  cyl(tm, 0.12, 0.12, 1.8, 8, 0, 0.14, 1.6, mat(0x57496f, { metal: 0.7 })).rotation.z = Math.PI / 2;
  cyl(tm, 0.12, 0.12, 1.8, 8, 0, 0.14, -1.6, mat(0x57496f, { metal: 0.7 })).rotation.z = Math.PI / 2;
  // console
  box(tm, 1.6, 1.1, 0.16, 0, 1.5, -1.9, mat(0x46395f));
  textPlane(tm, 1.3, 0.7, 0, 1.55, -1.8, (ctx, w, h) => {
    ctx.fillStyle = '#0d0a14'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff7a1a'; ctx.font = 'bold 44px monospace'; ctx.textAlign = 'center';
    ctx.fillText('PACE:', w / 2, 56);
    ctx.fillText('PLOT', w / 2, 110);
  });
  room.userData.treadmillTex = trackTex;
  animated.push((dt) => { trackTex.offset.y -= dt * (room.userData.paceSpeed ?? 1.2); });
  // wall speed-stripes
  for (let i = 0; i < 4; i++) {
    const s = box(room, 2.6, 0.16, 0.1, -3.4 + i * 2.3, 4.4 + (i % 2) * 0.8, -8.1, mat(0xff7a1a, { emissive: 0xff7a1a, ei: 0.9 }));
    const ph = i * 1.4;
    animated.push((dt, t) => { s.scale.x = 0.7 + Math.pow(Math.max(0, Math.sin(t * 2.4 + ph)), 2) * 0.6; });
  }
  // giant impatient wall clock
  const clock = new THREE.Group(); clock.position.set(3.8, 4.6, -8.0); room.add(clock);
  cyl(clock, 1.0, 1.0, 0.16, 24, 0, 0, 0, mat(0xfff6e3)).rotation.x = Math.PI / 2;
  const handA = box(clock, 0.08, 0.75, 0.06, 0, 0.3, 0.12, mat(0x16121f));
  const handB = box(clock, 0.08, 0.55, 0.06, 0, 0.2, 0.14, mat(0xff4757));
  animated.push((dt, t) => {
    handA.rotation.z = -t * 1.1;
    handB.rotation.z = -t * 6; // time moves wrong here
  });
}

function propsLogic(room, animated) {
  // filing cabinets of evidence
  const cab = mat(0x39466b, { metal: 0.5 });
  for (let i = 0; i < 3; i++) {
    box(room, 1.1, 2.6, 0.9, -4.4 + i * 1.3, 1.3, -6.4, cab);
    for (let d = 0; d < 4; d++) box(room, 0.9, 0.08, 0.95, -4.4 + i * 1.3, 0.5 + d * 0.62, -6.36, mat(0x4d5d8a));
  }
  // the scale of narrative justice — perpetually balancing
  const scale = new THREE.Group(); scale.position.set(3.2, 0, -5.6); room.add(scale);
  cyl(scale, 0.12, 0.3, 2.2, 10, 0, 1.1, 0, cab);
  const beam = new THREE.Group(); beam.position.y = 2.3; scale.add(beam);
  box(beam, 2.6, 0.1, 0.1, 0, 0, 0, mat(0x4d7cff, { emissive: 0x4d7cff, ei: 0.5 }));
  const panL = cyl(beam, 0.45, 0.45, 0.1, 12, -1.2, -0.5, 0, cab);
  const panR = cyl(beam, 0.45, 0.45, 0.1, 12, 1.2, -0.5, 0, cab);
  textPlane(scale, 1.6, 0.5, 0, 0.4, 0.5, (ctx, w, h) => {
    ctx.fillStyle = '#fff6e3'; ctx.font = 'bold 40px monospace'; ctx.textAlign = 'center';
    ctx.fillText('CAUSE ⇄ EFFECT', w / 2, h / 2 + 14);
  });
  animated.push((dt, t) => {
    beam.rotation.z = Math.sin(t * 0.8) * 0.16;
    panL.position.y = -0.5 - Math.sin(t * 0.8) * 0.18;
    panR.position.y = -0.5 + Math.sin(t * 0.8) * 0.18;
  });
  // wall of rubber-stamped rules
  textPlane(room, 3.4, 2.2, -3.4, 4.4, -8.1, (ctx, w, h) => {
    ctx.fillStyle = '#101726'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4d7cff'; ctx.font = 'bold 40px monospace'; ctx.textAlign = 'center';
    ctx.fillText('RULES OF ORDER', w / 2, 58);
    ctx.fillStyle = '#8fa8e8'; ctx.font = '28px monospace'; ctx.textAlign = 'left';
    ['1. things happen FOR reasons', '2. people want THINGS', '3. memory is CANON', '4. no free lunches'].forEach((l, i) => ctx.fillText(l, 30, 120 + i * 44));
  });
}

function propsCringe(room, animated) {
  // padded wall tiles
  const pad = mat(0xd66ba8, { rough: 0.95 });
  for (let px = 0; px < 5; px++) {
    for (let py = 0; py < 3; py++) {
      const tile = box(room, 1.9, 1.9, 0.35, -4 + px * 2, 1.2 + py * 2, -8.0, pad);
      tile.scale.z = 1 + ((px + py) % 2) * 0.3;
    }
  }
  // rotating emergency beacon
  const beacon = new THREE.Group(); beacon.position.set(0, 7.0, -4); room.add(beacon);
  cyl(beacon, 0.22, 0.3, 0.3, 10, 0, 0, 0, mat(0x46395f));
  const beaconLight = new THREE.SpotLight(0xff3b5c, 0, 26, 0.5, 0.4, 1.2);
  beaconLight.position.set(0, 0.2, 0);
  const beaconTarget = new THREE.Object3D();
  beacon.add(beaconLight, beaconTarget);
  beaconLight.target = beaconTarget;
  sph(beacon, 0.18, 0, 0.25, 0, mat(0xff3b5c, { emissive: 0xff3b5c, ei: 2.2 }));
  room.userData.beacon = beaconLight;
  animated.push((dt, t) => {
    beaconTarget.position.set(Math.cos(t * 2.4) * 8, -6, Math.sin(t * 2.4) * 8);
    beaconLight.intensity = room.userData.alarm ? 160 : 0;
  });
  // first-aid sign, but for feelings
  textPlane(room, 2.4, 1.4, 3.9, 4.6, -7.9, (ctx, w, h) => {
    ctx.fillStyle = '#fff6e3'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff3b5c';
    ctx.fillRect(w / 2 - 14, 24, 28, 90); ctx.fillRect(w / 2 - 45, 55, 90, 28);
    ctx.fillStyle = '#16121f'; ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center';
    ctx.fillText('EMOTIONAL', w / 2, 160);
    ctx.fillText('FIRST AID', w / 2, 196);
  });
  // a pile of tissues (for witnesses)
  box(room, 0.7, 0.5, 0.5, 2.4, 0.25, -5.2, mat(0xfff6e3));
  plane(room, 0.4, 0.4, 2.4, 0.62, -5.2, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })).rotation.x = -0.4;
}

function propsTone(room, animated) {
  // wall of mood panels cycling hue
  const panels = [];
  for (let i = 0; i < 6; i++) {
    const pm = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x884488, emissiveIntensity: 0.8, roughness: 0.5 });
    panels.push(box(room, 1.45, 4.6, 0.22, -4.2 + i * 1.7, 3.4, -8.1, pm));
  }
  animated.push((dt, t) => {
    panels.forEach((p, i) => {
      p.material.emissive.setHSL(((t * 0.05) + i * 0.13) % 1, 0.85, 0.5);
    });
  });
  // chandelier of prisms
  for (let i = 0; i < 5; i++) {
    const pm = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.1, roughness: 0.15 });
    const oct = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), pm);
    oct.position.set(-2 + i * 1.1, 5.4, -3.4);
    room.add(oct);
    animated.push((dt, t) => {
      oct.rotation.y = t * (0.7 + i * 0.2);
      oct.position.y = 5.4 + Math.sin(t * 1.3 + i) * 0.25;
      pm.emissive.setHSL((t * 0.08 + i * 0.2) % 1, 0.9, 0.6);
    });
  }
  // tuning forks rack
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Group(); f.position.set(3 + i * 0.7, 0, -5.8); room.add(f);
    cyl(f, 0.05, 0.05, 1.5 + i * 0.4, 6, 0, (1.5 + i * 0.4) / 2, 0, mat(0xcfc4ec, { metal: 0.9, rough: 0.2 }));
    animated.push((dt, t) => { f.rotation.x = Math.sin(t * (3 + i)) * 0.04; });
  }
}

function propsNovelty(room, animated) {
  // "FRESH IDEAS TODAY:" counter board
  const counterTex = canvasTexture(512, 256, () => {});
  const redraw = (n) => {
    const c = counterTex.image; const ctx = c.getContext('2d');
    ctx.fillStyle = '#0d1a12'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#3df58c'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, c.width - 8, c.height - 8);
    ctx.fillStyle = '#3df58c'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center';
    ctx.fillText('FRESH IDEAS TODAY', c.width / 2, 60);
    ctx.font = '900 110px sans-serif';
    ctx.fillText(String(n), c.width / 2, 185);
    counterTex.needsUpdate = true;
  };
  redraw(0);
  const board = plane(room, 3.4, 1.7, -3.6, 4.7, -8.05, new THREE.MeshBasicMaterial({ map: counterTex }));
  let count = 0, nextTick = 6;
  animated.push((dt, t) => {
    nextTick -= dt;
    if (nextTick <= 0) { count = (count + (Math.random() < 0.2 ? 1 : 0)); redraw(count); nextTick = 5 + Math.random() * 7; }
  });
  // pile of crumpled rejected ideas
  for (let i = 0; i < 9; i++) {
    const ball = sph(room, 0.22 + Math.random() * 0.14, 2.6 + Math.random() * 2.4, 0.25, -4.6 + Math.random() * 1.6, mat(0xe9e2d0, { rough: 1 }), 7);
    ball.scale.set(1, 0.8 + Math.random() * 0.3, 1);
  }
  textPlane(room, 1.9, 0.6, 3.7, 1.6, -5.4, (ctx, w, h) => {
    ctx.fillStyle = '#fff6e3'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center';
    ctx.fillText('SEEN IT', w / 2, h / 2 + 12);
  });
  // confetti cannon, loaded, hopeful
  const cannon = new THREE.Group(); cannon.position.set(-4.2, 0, -4.6); room.add(cannon);
  cyl(cannon, 0.3, 0.42, 1.5, 12, 0, 1.2, 0, mat(0x2c6a45, { metal: 0.6 })).rotation.x = -0.7;
  box(cannon, 0.8, 0.5, 0.8, 0, 0.25, 0, mat(0x1d4630));
}

function propsSurprise(room, animated) {
  // the room is deliberately sparse: one wall gauge, one spotlight, silence
  const gaugeTex = canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#081316'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2de2e6'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(w / 2, h * 0.85, 180, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.font = 'bold 40px monospace'; ctx.fillStyle = '#2de2e6'; ctx.textAlign = 'center';
    ctx.fillText('EXPECTED', 110, h * 0.55);
    ctx.fillText('???', w - 110, h * 0.55);
  });
  plane(room, 5, 3.1, 0, 4.3, -8.05, new THREE.MeshBasicMaterial({ map: gaugeTex }));
  const needle = box(room, 0.1, 1.7, 0.08, 0, 3.6, -7.9, mat(0xff4757, { emissive: 0xff4757, ei: 1.3 }));
  needle.geometry.translate?.(0, 0.85, 0);
  animated.push((dt, t) => {
    needle.rotation.z = 0.8 + Math.sin(t * 5.1) * 0.05 + Math.sin(t * 17) * 0.02;
  });
  // single dramatic spotlight from above
  const spot = new THREE.SpotLight(0xbfefff, 90, 22, 0.55, 0.5, 1.6);
  spot.position.set(0, 8, 0);
  const st = new THREE.Object3D(); st.position.set(0, 0, 0);
  room.add(spot, st); spot.target = st;
  // one (1) decorative question mark, floating, judging
  const q = makeSprite('?', { size: 150, color: '#2de2e6' });
  q.position.set(2.8, 3.4, -5);
  room.add(q);
  animated.push((dt, t) => {
    q.position.y = 3.4 + Math.sin(t * 0.9) * 0.3;
    q.material.rotation = Math.sin(t * 0.6) * 0.2;
  });
}
