// ============================================================
// TIQUES.JS — the seven creatures (plus one unpaid lobby intern).
// Procedural bodies built from primitives; emotional state
// machine drives idle / alert / inspect / react / chat motion.
// ============================================================

import * as THREE from 'three';
import {
  mat, box, cyl, sph, cone, caps, plane,
  snapshot, resetToBase, clamp, lerp, makeSprite, canvasTexture,
} from './helpers.js';

const INK = 0x16121f;
const EYE_WHITE = 0xfff9ee;

// ----------------------------------------------------------------
// shared bits
// ----------------------------------------------------------------
function makeEye(parent, r, x, y, z) {
  const eye = new THREE.Group();
  eye.position.set(x, y, z);
  sph(eye, r, 0, 0, 0, mat(EYE_WHITE, { rough: 0.35, metal: 0 }));
  const pupil = sph(eye, r * 0.42, 0, 0, r * 0.72, mat(INK, { rough: 0.3 }));
  pupil.name = 'pupil';
  eye.userData.pupil = pupil;
  eye.userData.r = r;
  parent.add(eye);
  return eye;
}

function shadowDisc(parent, r) {
  const m = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.34, depthWrite: false });
  const d = plane(parent, r * 2, r * 2 * 0.8, 0, 0.02, 0, m);
  d.rotation.x = -Math.PI / 2;
  return d;
}

// reaction choreography: progress k in 0..1, returns transform offsets
function reactionPose(name, k, t) {
  const pulse = Math.sin(k * Math.PI); // rises then falls
  const J = (a) => (Math.random() - 0.5) * a;
  switch (name) {
    case 'horror': return {
      y: pulse * 0.25 + Math.abs(Math.sin(t * 26)) * 0.06 * pulse,
      z: pulse * 0.85, rotX: -0.22 * pulse, rotZ: J(0.07) * pulse,
      jx: J(0.07) * pulse, squash: 1 + pulse * 0.12, pupil: 0.45,
    };
    case 'pain': return {
      y: -pulse * 0.3, z: 0.2 * pulse, rotX: 0.42 * pulse, rotZ: Math.sin(t * 9) * 0.05 * pulse,
      jx: 0, squash: 1 - pulse * 0.26, pupil: 0.62,
    };
    case 'unimpressed': return {
      y: -pulse * 0.12, z: 0, rotX: 0.07 * pulse, rotZ: 0.18 * pulse,
      jx: 0, squash: 1 - pulse * 0.05, pupil: 0.8, lookAway: true,
    };
    case 'neutral': return {
      y: Math.abs(Math.sin(k * Math.PI * 2)) * 0.08, z: 0, rotX: Math.sin(k * Math.PI * 4) * 0.08,
      rotZ: 0, jx: 0, squash: 1, pupil: 1,
    };
    case 'intrigued': return {
      y: pulse * 0.12, z: -pulse * 0.5, rotX: -0.14 * pulse, rotZ: 0,
      jx: 0, squash: 1 + pulse * 0.06, pupil: 1.45,
    };
    case 'delight': return {
      y: Math.abs(Math.sin(k * Math.PI * 5)) * 0.5 * pulse, z: -0.2 * pulse,
      rotX: -0.1 * pulse, rotZ: Math.sin(k * Math.PI * 2) * 0.12,
      jx: 0, squash: 1 + Math.sin(k * Math.PI * 5) * 0.1, pupil: 1.5, spin: k > 0.3 && k < 0.7,
    };
    default: return { y: 0, z: 0, rotX: 0, rotZ: 0, jx: 0, squash: 1, pupil: 1 };
  }
}

const BUBBLE_TEXT = {
  horror: '!!', pain: 'ow.', unimpressed: 'meh.', neutral: 'hm. fine.',
  intrigued: 'oh?', delight: '!!!',
};

// ----------------------------------------------------------------
// Tique controller
// ----------------------------------------------------------------
export class Tique {
  constructor(group, parts, animFn, def) {
    this.group = group;
    this.parts = parts;          // {head, eyes[], glow[], ...}
    this.animFn = animFn;        // per-creature flavor motion
    this.def = def;
    this.state = 'idle';         // idle | alert | inspect | react | chat
    this.reaction = null;
    this.reactT = 0;
    this.reactDur = 2.8;
    this.lookTarget = null;      // Vector3 in world space
    this.blinkT = 1 + Math.random() * 3;
    this.blink = 0;
    this.talkT = 0;
    this.bubble = null;
    this.seed = Math.random() * 100;
    snapshot(group);
  }

  setState(s) { this.state = s; }

  /** Position the creature in the world (updates the animation base too). */
  place(x, y, z, rotY = 0) {
    this.group.position.set(x, y, z);
    this.group.rotation.y = rotY;
    const b = this.group.userData.base;
    b.p.copy(this.group.position);
    b.r.copy(this.group.rotation);
  }

  react(reaction, scoreish = 5) {
    this.reaction = reaction;
    this.reactT = 0;
    this.reactDur = reaction === 'delight' ? 3.4 : 2.8;
    this.state = 'react';
    this.say(BUBBLE_TEXT[reaction] || '…');
  }

  say(text, dur = 2) {
    if (this.bubble) { this.group.remove(this.bubble); this.bubble = null; }
    const s = makeSprite(text, { color: '#ffd23f' });
    const head = this.parts.head || this.group;
    s.position.set(0, (this.parts.bubbleY ?? 3.4), 0);
    s.userData.life = dur;
    this.group.add(s);
    this.bubble = s;
  }

  talk(dur = 1.4) { this.talkT = dur; }

  lookAt(v3) { this.lookTarget = v3; }

  update(t, dt, camera) {
    resetToBase(this.group);
    const P = this.parts;
    const tt = t + this.seed;

    // ---- reaction layer ----
    let pose = { y: 0, z: 0, rotX: 0, rotZ: 0, jx: 0, squash: 1, pupil: 1 };
    if (this.state === 'react' && this.reaction) {
      this.reactT += dt;
      const k = clamp(this.reactT / this.reactDur, 0, 1);
      pose = reactionPose(this.reaction, k, t);
      if (pose.spin) this.group.rotation.y += Math.sin(this.reactT * 14) * 0.3;
      // glow pulse on delight / alarm tint on horror
      const glowList = P.glow || [];
      for (const g of glowList) {
        if (this.reaction === 'delight') g.material.emissiveIntensity = 1.5 + Math.sin(t * 18) * 1.2;
        else if (this.reaction === 'horror') g.material.emissiveIntensity = 1.4 + Math.sin(t * 30) * 0.8;
      }
      if (k >= 1) { this.state = 'inspect'; this.reaction = null; for (const g of glowList) g.material.emissiveIntensity = g.userData.baseEI ?? 1; }
    }

    // ---- common body application ----
    this.group.position.y += pose.y;
    this.group.position.z += pose.z + pose.jx;
    this.group.position.x += pose.jx;
    this.group.rotation.x += pose.rotX;
    this.group.rotation.z += pose.rotZ;
    this.group.scale.y *= pose.squash;
    this.group.scale.x *= 1 / Math.sqrt(pose.squash);
    this.group.scale.z *= 1 / Math.sqrt(pose.squash);

    // ---- breathing baseline ----
    const breathe = 1 + Math.sin(tt * 2.1) * 0.012;
    this.group.scale.y *= breathe;

    // ---- creature flavor ----
    this.animFn?.(this, tt, dt, pose);

    // ---- talking head-bob ----
    if (this.talkT > 0) {
      this.talkT -= dt;
      if (P.head) {
        P.head.rotation.x += Math.sin(t * 22) * 0.06;
        P.head.position.y += Math.abs(Math.sin(t * 22)) * 0.03;
      }
    }

    // ---- eyes: look + blink + pupil scale ----
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 0.14; this.blinkT = 1.6 + Math.random() * 3.4; }
    if (this.blink > 0) this.blink -= dt;
    const eyes = P.eyes || [];
    for (const eye of eyes) {
      const pupil = eye.userData.pupil;
      if (this.lookTarget && !pose.lookAway) {
        const wp = new THREE.Vector3();
        eye.getWorldPosition(wp);
        const target = this.lookTarget.clone();
        eye.lookAt(target);
      } else if (pose.lookAway) {
        eye.rotation.y += 0.7;
      }
      const ps = (pose.pupil ?? 1) * (eye.userData.pupilScale ?? 1);
      pupil.scale.setScalar(ps);
      if (this.blink > 0) pupil.scale.y *= 0.08;
    }

    // ---- speech bubble lifecycle ----
    if (this.bubble) {
      this.bubble.userData.life -= dt;
      this.bubble.position.y += dt * 0.35;
      this.bubble.material.opacity = clamp(this.bubble.userData.life, 0, 1);
      if (this.bubble.userData.life <= 0) { this.group.remove(this.bubble); this.bubble = null; }
    }
  }
}

// ----------------------------------------------------------------
// individual creature builders — each returns a Tique
// ----------------------------------------------------------------

// ROOM 01 — THE SYNTAX CLERK: tall, thin, folded inward, typewriter arms
function buildSyntaxClerk(def) {
  const g = new THREE.Group();
  const accent = mat(def.color, { emissive: def.color, ei: 0.55, unique: true });
  shadowDisc(g, 1.3);

  const hips = box(g, 0.55, 0.5, 0.45, 0, 0.85, 0, mat(0x352b4d));
  const torso = box(g, 0.72, 1.5, 0.5, 0, 1.85, 0, mat(0x46395f));
  torso.rotation.x = 0.14;
  const collar = box(torso, 0.8, 0.14, 0.56, 0, 0.8, 0, accent);
  const head = new THREE.Group();
  head.position.set(0, 2.85, 0.18);
  box(head, 0.78, 0.62, 0.55, 0, 0, 0, mat(0x584a78));
  const visor = box(head, 0.84, 0.16, 0.58, 0, 0.32, 0, mat(0x1d3b2a, { emissive: 0x2dd76a, ei: 0.5 }));
  g.add(head);
  const eyeL = makeEye(head, 0.17, -0.2, 0.02, 0.26);
  const eyeR = makeEye(head, 0.17, 0.2, 0.02, 0.26);

  // long typewriter arms
  const armL = new THREE.Group(); armL.position.set(-0.45, 2.3, 0.1); g.add(armL);
  box(armL, 0.13, 1.4, 0.13, 0, -0.7, 0, mat(0x46395f));
  box(armL, 0.26, 0.12, 0.3, 0, -1.42, 0.06, mat(0x584a78));
  const armR = new THREE.Group(); armR.position.set(0.45, 2.3, 0.1); g.add(armR);
  box(armR, 0.13, 1.2, 0.13, 0, -0.6, 0, mat(0x46395f));
  // the STAMP
  const stamp = new THREE.Group(); stamp.position.set(0, -1.25, 0.1); armR.add(stamp);
  cyl(stamp, 0.05, 0.05, 0.3, 8, 0, 0.15, 0, mat(0x8a7458));
  const stampHead = box(stamp, 0.34, 0.12, 0.34, 0, -0.05, 0, accent);

  // legs
  box(g, 0.16, 0.62, 0.16, -0.18, 0.31, 0, mat(0x352b4d));
  box(g, 0.16, 0.62, 0.16, 0.18, 0.31, 0, mat(0x352b4d));

  const parts = { head, eyes: [eyeL, eyeR], glow: [stampHead, visor], armL, armR, stamp, bubbleY: 3.7 };
  stampHead.userData.baseEI = 0.55; visor.userData.baseEI = 0.5;

  const animFn = (tq, t, dt) => {
    const fast = tq.state === 'inspect' || tq.state === 'alert' ? 2.1 : 1;
    // typewriter strikes
    tq.parts.armL.rotation.x = -0.5 + Math.max(0, Math.sin(t * 9 * fast)) * 0.5;
    tq.parts.armR.rotation.x = -0.5 + Math.max(0, Math.sin(t * 9 * fast + Math.PI)) * 0.45;
    // periodic dramatic stamp slam
    const slam = Math.pow(Math.max(0, Math.sin(t * 1.4)), 14);
    tq.parts.armR.rotation.x -= slam * 1.1;
    // nervous head darts
    tq.parts.head.rotation.y = Math.sin(Math.floor(t * (1.5 * fast)) * 7.7) * 0.3;
    if (tq.state === 'inspect') tq.parts.head.rotation.x = 0.18;
  };
  return new Tique(g, parts, animFn, def);
}

// ROOM 02 — THE TEMPO WARDEN: stretched torso, tiny relentless legs
function buildTempoWarden(def) {
  const g = new THREE.Group();
  shadowDisc(g, 1.2);
  const bodyMat = mat(0x6b4a2e);
  const body = new THREE.Group(); body.position.y = 1.7; g.add(body);
  caps(body, 0.5, 1.7, 0, 0, 0, bodyMat);
  const band = cyl(body, 0.53, 0.53, 0.18, 14, 0, 0.55, 0, mat(def.color, { emissive: def.color, ei: 0.8, unique: true }));
  const head = new THREE.Group(); head.position.set(0, 1.25, 0.1); body.add(head);
  sph(head, 0.42, 0, 0, 0, bodyMat);
  const eyeL = makeEye(head, 0.13, -0.16, 0.08, 0.32);
  const eyeR = makeEye(head, 0.13, 0.16, 0.08, 0.32);
  // permanent slightly annoyed brows
  const browL = box(head, 0.2, 0.05, 0.05, -0.16, 0.26, 0.36, mat(0x3a2817)); browL.rotation.z = -0.3;
  const browR = box(head, 0.2, 0.05, 0.05, 0.16, 0.26, 0.36, mat(0x3a2817)); browR.rotation.z = 0.3;
  // stubby arms
  const armL = caps(body, 0.11, 0.5, -0.6, 0.3, 0, bodyMat); armL.rotation.z = 0.6;
  const armR = caps(body, 0.11, 0.5, 0.6, 0.3, 0, bodyMat); armR.rotation.z = -0.6;
  // tiny legs
  const legL = new THREE.Group(); legL.position.set(-0.22, 0.75, 0); g.add(legL);
  caps(legL, 0.09, 0.45, 0, -0.3, 0, mat(0x4a3320));
  const legR = new THREE.Group(); legR.position.set(0.22, 0.75, 0); g.add(legR);
  caps(legR, 0.09, 0.45, 0, -0.3, 0, mat(0x4a3320));

  const parts = { head, eyes: [eyeL, eyeR], glow: [band], legL, legR, armL, armR, body, bubbleY: 3.9 };
  band.userData.baseEI = 0.8;

  const animFn = (tq, t, dt) => {
    const speed = tq.runSpeed ?? 7;
    tq.parts.legL.rotation.x = Math.sin(t * speed) * 0.95;
    tq.parts.legR.rotation.x = Math.sin(t * speed + Math.PI) * 0.95;
    tq.parts.armL.rotation.x = Math.sin(t * speed + Math.PI) * 0.6;
    tq.parts.armR.rotation.x = Math.sin(t * speed) * 0.6;
    tq.group.position.y += Math.abs(Math.sin(t * speed)) * 0.09;
    tq.parts.body.rotation.x = 0.12 + speed * 0.012;
    if (tq.state === 'inspect') tq.parts.head.rotation.y = Math.sin(t * 0.8) * 0.4;
  };
  return new Tique(g, parts, animFn, def);
}

// ROOM 03 — THE LOGIC SENTINEL: massive block, checklist arm
function buildLogicSentinel(def) {
  const g = new THREE.Group();
  shadowDisc(g, 1.9);
  const steel = mat(0x39466b);
  const body = box(g, 2.1, 1.9, 1.5, 0, 1.6, 0, steel);
  box(body, 2.2, 0.18, 1.6, 0, 1.0, 0, mat(def.color, { emissive: def.color, ei: 0.5, unique: true }));
  const head = new THREE.Group(); head.position.set(0, 2.95, 0.1); g.add(head);
  box(head, 1.0, 0.7, 0.9, 0, 0, 0, mat(0x46557e));
  const eyeL = makeEye(head, 0.14, -0.24, 0.02, 0.44);
  const eyeR = makeEye(head, 0.14, 0.24, 0.02, 0.44);
  const brow = box(head, 0.95, 0.1, 0.1, 0, 0.26, 0.45, mat(0x222c49));
  // thick limbs
  box(g, 0.5, 0.9, 0.5, -0.75, 0.45, 0, steel);
  box(g, 0.5, 0.9, 0.5, 0.75, 0.45, 0, steel);
  const armR = new THREE.Group(); armR.position.set(1.3, 2.1, 0); g.add(armR);
  box(armR, 0.42, 1.2, 0.42, 0, -0.6, 0, steel);
  // checklist FUSED to left arm
  const armL = new THREE.Group(); armL.position.set(-1.3, 2.1, 0); g.add(armL);
  box(armL, 0.42, 1.2, 0.42, 0, -0.6, 0, steel);
  const board = textPlaneChecklist(); board.position.set(-0.05, -1.0, 0.45); board.rotation.x = -0.3; armL.add(board);

  const parts = { head, eyes: [eyeL, eyeR], glow: [], armL, armR, brow, bubbleY: 4.0 };

  const animFn = (tq, t, dt) => {
    // ponderous: nearly still
    tq.parts.head.rotation.z = Math.sin(t * 0.35) * 0.05;
    const tilt = Math.pow(Math.max(0, Math.sin(t * 0.22)), 6);
    tq.parts.head.rotation.x = tilt * 0.3; // the long uncomfortable head tilt
    tq.parts.armL.rotation.x = -0.5 - Math.sin(t * 0.5) * 0.1; // consults checklist
    if (tq.state === 'inspect') {
      tq.parts.armL.rotation.x = -0.9;
      tq.parts.brow.position.y = 0.2; // lowered brow
    }
  };
  return new Tique(g, parts, animFn, def);

  function textPlaneChecklist() {
    const tex = canvasTexture(256, 384, (ctx, w, h) => {
      ctx.fillStyle = '#fff6e3'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#16121f'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#16121f'; ctx.font = 'bold 34px "Space Mono", monospace';
      ctx.fillText('AUDIT', 24, 56);
      ctx.font = '28px "Space Mono", monospace';
      const items = ['☑ motive', '☑ cause', '☐ stakes', '☑ memory', '☐ alibi', '☑ logic'];
      items.forEach((it, i) => ctx.fillText(it, 24, 116 + i * 42));
    });
    return new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 1.25),
      new THREE.MeshBasicMaterial({ map: tex }),
    );
  }
}

// ROOM 04 — THE SECONDHAND PAIN UNIT: overinflated, braced for impact
function buildPainUnit(def) {
  const g = new THREE.Group();
  shadowDisc(g, 1.7);
  const skin = mat(0xe87bb8, { rough: 0.7 });
  const body = sph(g, 1.25, 0, 1.45, 0, skin, 24);
  body.scale.set(1, 0.92, 0.96);
  // permanently squinting eyes
  const eyeL = makeEye(body, 0.16, -0.4, 0.3, 0.95);
  const eyeR = makeEye(body, 0.16, 0.4, 0.3, 0.95);
  eyeL.userData.pupilScale = 0.8; eyeR.userData.pupilScale = 0.8;
  const lidL = box(body, 0.4, 0.12, 0.1, -0.4, 0.45, 1.05, skin);
  const lidR = box(body, 0.4, 0.12, 0.1, 0.4, 0.45, 1.05, skin);
  lidL.rotation.z = -0.12; lidR.rotation.z = 0.12;
  // worry mouth
  const mouth = box(body, 0.3, 0.06, 0.08, 0, -0.12, 1.12, mat(0x7c2d55));
  // nub arms half-covering the face
  const armL = new THREE.Group(); armL.position.set(-0.9, 1.6, 0.5); g.add(armL);
  caps(armL, 0.16, 0.55, 0, 0, 0, skin).rotation.z = 1.1;
  const armR = new THREE.Group(); armR.position.set(0.9, 1.6, 0.5); g.add(armR);
  caps(armR, 0.16, 0.55, 0, 0, 0, skin).rotation.z = -1.1;
  // tiny feet
  caps(g, 0.14, 0.3, -0.4, 0.16, 0.2, mat(0xb55c90)).rotation.x = 1.4;
  caps(g, 0.14, 0.3, 0.4, 0.16, 0.2, mat(0xb55c90)).rotation.x = 1.4;
  const beaconMat = mat(def.color, { emissive: def.color, ei: 0.7, unique: true });
  const beacon = sph(g, 0.14, 0, 2.75, 0, beaconMat);

  const parts = { head: body, eyes: [eyeL, eyeR], glow: [beacon], armL, armR, mouth, bubbleY: 3.4 };
  beacon.userData.baseEI = 0.7;

  const animFn = (tq, t, dt) => {
    // anxious breathing — bigger than the standard baseline
    const b = 1 + Math.sin(t * 3.1) * 0.04;
    tq.group.scale.x *= b; tq.group.scale.z *= b;
    // random flinches
    const flinch = Math.pow(Math.max(0, Math.sin(t * 0.9 + Math.sin(t * 0.31) * 3)), 24);
    tq.group.scale.y *= 1 - flinch * 0.18;
    tq.parts.armL.position.y += flinch * 0.5;
    tq.parts.armR.position.y += flinch * 0.5;
    if (tq.state === 'inspect') {
      // peeks between fingers
      tq.parts.armL.rotation.z = 0.4 + Math.sin(t * 2) * 0.15;
      tq.parts.armR.rotation.z = -0.4 - Math.sin(t * 2) * 0.15;
    }
    if (tq.reaction === 'horror' || tq.reaction === 'pain') {
      tq.parts.armL.position.set(-0.45, 1.85, 1.0);
      tq.parts.armR.position.set(0.45, 1.85, 1.0);
    }
  };
  return new Tique(g, parts, animFn, def);
}

// ROOM 05 — THE TONE CALIBRATOR: unstable triangle with a prism
function buildToneCalibrator(def) {
  const g = new THREE.Group();
  shadowDisc(g, 1.4);
  const body = new THREE.Group(); body.position.y = 1.5; g.add(body);
  const pyramidMat = mat(0x6b4dc4, { rough: 0.4 });
  const pyramid = cone(body, 1.05, 2.1, 4, 0, 0, 0, pyramidMat);
  pyramid.rotation.y = Math.PI / 4;
  const head = new THREE.Group(); head.position.set(0, 1.2, 0.2); body.add(head);
  const eyeL = makeEye(head, 0.14, -0.2, 0, 0.1);
  const eyeR = makeEye(head, 0.14, 0.2, 0, 0.1);
  // arm holding THE PRISM
  const armR = new THREE.Group(); armR.position.set(0.7, 0.4, 0.2); body.add(armR);
  cyl(armR, 0.06, 0.06, 1.0, 8, 0, 0.5, 0, pyramidMat);
  const prismMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, emissive: new THREE.Color().setHSL(0, 1, 0.55), emissiveIntensity: 1.6,
    roughness: 0.1, metalness: 0.1,
  });
  const prism = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), prismMat);
  prism.position.set(0, 1.15, 0); armR.add(prism);
  const prismLight = new THREE.PointLight(0xffffff, 6, 9, 1.8);
  prism.add(prismLight);
  const armL = new THREE.Group(); armL.position.set(-0.7, 0.4, 0.2); body.add(armL);
  cyl(armL, 0.06, 0.06, 0.8, 8, 0, -0.35, 0, pyramidMat);
  // balances on a ball
  sph(g, 0.3, 0, 0.32, 0, mat(0x3a2a66));

  const parts = { head, eyes: [eyeL, eyeR], glow: [prism], prism, prismLight, body, armR, bubbleY: 3.6 };
  prism.userData.baseEI = 1.6;

  const animFn = (tq, t, dt) => {
    // permanently off-balance
    tq.parts.body.rotation.z = Math.sin(t * 1.7) * 0.16 + Math.sin(t * 4.3) * 0.04;
    tq.parts.body.rotation.x = Math.sin(t * 2.3) * 0.06;
    // prism slowly cycles hue; spins
    const hue = (t * 0.07) % 1;
    tq.parts.prism.material.emissive.setHSL(hue, 1, 0.55);
    tq.parts.prismLight.color.setHSL(hue, 1, 0.6);
    tq.parts.prism.rotation.y = t * 1.4; tq.parts.prism.rotation.x = t * 0.8;
    // violent head tilts, occasionally
    const tilt = Math.pow(Math.max(0, Math.sin(t * 0.4 + 2)), 18);
    tq.parts.head.rotation.z = tilt * 0.9;
    if (tq.state === 'inspect') tq.parts.armR.rotation.x = -0.6; // points prism at cylinder
  };
  return new Tique(g, parts, animFn, def);
}

// ROOM 06 — THE NOVELTY SEEKER: asymmetrical, one enormous eye
function buildNoveltySeeker(def) {
  const g = new THREE.Group();
  shadowDisc(g, 1.4);
  const skin = mat(0x3f8f5f, { rough: 0.65 });
  const body = new THREE.Group(); body.position.y = 1.25; body.rotation.z = 0.13; g.add(body);
  const blob = sph(body, 0.95, 0, 0, 0, skin, 22);
  blob.scale.set(1.1, 0.95, 0.9);
  sph(body, 0.45, 0.55, 0.55, 0.2, skin); // asymmetric lump
  const eyeBig = makeEye(body, 0.4, -0.25, 0.42, 0.72);
  const eyeSmall = makeEye(body, 0.12, 0.42, 0.3, 0.82);
  // antenna with a star
  const ant = new THREE.Group(); ant.position.set(0.2, 0.9, 0); body.add(ant);
  cyl(ant, 0.03, 0.03, 0.7, 6, 0, 0.35, 0, skin);
  const starMat = mat(def.color, { emissive: def.color, ei: 1.2, unique: true });
  const star = sph(ant, 0.11, 0, 0.75, 0, starMat);
  // mismatched legs
  caps(g, 0.12, 0.5, -0.3, 0.4, 0, mat(0x2c6a45));
  caps(g, 0.16, 0.3, 0.34, 0.3, 0, mat(0x2c6a45));

  const parts = { head: body, eyes: [eyeBig, eyeSmall], glow: [star], star, ant, bubbleY: 3.2 };
  star.userData.baseEI = 1.2;

  const animFn = (tq, t, dt) => {
    // scanning sweep with the big eye
    if (!tq.lookTarget) {
      tq.parts.eyes[0].rotation.y = Math.sin(t * 0.9) * 0.7;
      tq.parts.eyes[1].rotation.y = Math.sin(t * 1.7) * 0.5;
    }
    // boredom droop cycle… then snap awake
    const phase = (t * 0.13) % 1;
    if (tq.state !== 'react') {
      const droop = phase > 0.7 ? Math.min(1, (phase - 0.7) / 0.25) : 0;
      tq.parts.head.rotation.x = droop * 0.5;
      if (phase > 0.97) tq.parts.head.rotation.x = -0.2; // snap!
    }
    tq.parts.ant.rotation.z = Math.sin(t * 3.1) * 0.25;
  };
  return new Tique(g, parts, animFn, def);
}

// ROOM 07 — THE UNPREDICTABILITY GAUGE: a living instrument
function buildSurpriseGauge(def) {
  const g = new THREE.Group();
  shadowDisc(g, 1.4);
  const shell = mat(0x2a4d57, { rough: 0.4, metal: 0.5 });
  const body = new THREE.Group(); body.position.y = 1.55; g.add(body);
  const casing = box(body, 1.7, 1.9, 0.9, 0, 0, 0, shell);
  // gauge face
  const faceTex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0d1518'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#2de2e6'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(w / 2, h * 0.78, 86, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.fillStyle = '#2de2e6'; ctx.font = 'bold 26px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DULL', 52, h * 0.62); ctx.fillText('WOW', w - 52, h * 0.62);
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * 74, h * 0.78 + Math.sin(a) * 74);
      ctx.lineTo(w / 2 + Math.cos(a) * 86, h * 0.78 + Math.sin(a) * 86);
      ctx.stroke();
    }
  });
  const face = plane(body, 1.3, 1.3, 0, 0.12, 0.46, new THREE.MeshBasicMaterial({ map: faceTex }));
  // needle
  const needleMat = mat(0xff4757, { emissive: 0xff4757, ei: 1.4, unique: true });
  const needlePivot = new THREE.Group(); needlePivot.position.set(0, -0.18, 0.5); body.add(needlePivot);
  box(needlePivot, 0.05, 0.62, 0.03, 0, 0.31, 0, needleMat);
  needlePivot.rotation.z = 0.9;
  // small eyes on top
  const eyeL = makeEye(body, 0.12, -0.3, 1.1, 0.2);
  const eyeR = makeEye(body, 0.12, 0.3, 1.1, 0.2);
  cyl(body, 0.07, 0.07, 0.36, 6, -0.3, 0.93, 0.2, shell);
  cyl(body, 0.07, 0.07, 0.36, 6, 0.3, 0.93, 0.2, shell);
  // legs
  caps(g, 0.1, 0.5, -0.45, 0.4, 0, shell);
  caps(g, 0.1, 0.5, 0.45, 0.4, 0, shell);
  const lamp = sph(body, 0.12, 0, 1.15, -0.1, mat(def.color, { emissive: def.color, ei: 1.1, unique: true }));

  const parts = { head: body, eyes: [eyeL, eyeR], glow: [lamp], needle: needlePivot, bubbleY: 3.6 };
  lamp.userData.baseEI = 1.1;

  const animFn = (tq, t, dt) => {
    // needle quivers near the middle, sweeps when reacting
    let target = 0.9 + Math.sin(t * 7) * 0.05 + Math.sin(t * 23) * 0.02;
    if (tq.reaction === 'delight') target = -0.5 + Math.sin(t * 30) * 0.3;
    else if (tq.reaction === 'unimpressed' || tq.reaction === 'pain') target = 1.35;
    else if (tq.reaction === 'intrigued') target = 0.2;
    tq.parts.needle.rotation.z = lerp(tq.parts.needle.rotation.z, target, dt * 6);
  };
  return new Tique(g, parts, animFn, def);
}

// LOBBY INTERN — a small generic tique doing a pointless job
export function buildIntern() {
  const g = new THREE.Group();
  shadowDisc(g, 1.0);
  const skin = mat(0xc4b06a, { rough: 0.7 });
  const body = sph(g, 0.62, 0, 0.85, 0, skin, 18);
  body.scale.y = 1.15;
  const eyeL = makeEye(body, 0.13, -0.2, 0.25, 0.5);
  const eyeR = makeEye(body, 0.13, 0.2, 0.25, 0.5);
  // hard hat
  const hat = sph(body, 0.42, 0, 0.5, 0, mat(0xffd23f, { emissive: 0xffd23f, ei: 0.25 }), 14);
  hat.scale.y = 0.6;
  caps(g, 0.09, 0.3, -0.2, 0.25, 0, skin);
  caps(g, 0.09, 0.3, 0.2, 0.25, 0, skin);
  const armL = caps(g, 0.08, 0.4, -0.6, 0.95, 0.1, skin); armL.rotation.z = 0.9;
  const armR = caps(g, 0.08, 0.4, 0.6, 0.95, 0.1, skin); armR.rotation.z = -0.9;

  const parts = { head: body, eyes: [eyeL, eyeR], glow: [], armL, armR, bubbleY: 2.3 };

  const animFn = (tq, t, dt) => {
    // waddle-chases a runaway comma (the comma is animated by rooms.js).
    // Persistent movement goes into the animation BASE so the per-frame
    // reset doesn't undo the chase.
    if (tq.chaseTarget) {
      const base = tq.group.userData.base;
      const target = tq.chaseTarget;
      const dx = target.x - base.p.x;
      const dz = target.z - base.p.z;
      const d = Math.hypot(dx, dz);
      if (d > 0.8) {
        base.p.x += (dx / d) * dt * 1.7;
        base.p.z += (dz / d) * dt * 1.7;
      }
      base.r.y = Math.atan2(dx, dz);
      tq.group.position.copy(base.p);
      tq.group.rotation.y = base.r.y;
      tq.group.rotation.z = Math.sin(t * 10) * 0.12; // waddle
      tq.group.position.y += Math.abs(Math.sin(t * 10)) * 0.06;
      tq.parts.armL.rotation.z = 0.9 + Math.sin(t * 10) * 0.4;
      tq.parts.armR.rotation.z = -0.9 - Math.sin(t * 10) * 0.4;
    }
  };
  return new Tique(g, parts, animFn, { id: 'intern', name: 'UNPAID INTERN' });
}

const BUILDERS = {
  syntax: buildSyntaxClerk,
  tempo: buildTempoWarden,
  logic: buildLogicSentinel,
  cringe: buildPainUnit,
  tone: buildToneCalibrator,
  novelty: buildNoveltySeeker,
  surprise: buildSurpriseGauge,
};

export function buildTique(def) {
  return BUILDERS[def.id](def);
}
