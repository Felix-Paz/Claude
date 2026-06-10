// ============================================================
// CAMERA.JS — the cinematic rig. The user never scrolls; the
// camera carries them: orbits, fly-throughs, follow-cam, shake.
// ============================================================

import * as THREE from 'three';
import { clamp, easeInOut } from './helpers.js';

const _v = new THREE.Vector3();

function bezier(out, a, b, c, t) {
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  );
  return out;
}

export class Rig {
  constructor(camera) {
    this.cam = camera;
    this.pos = camera.position.clone();
    this.look = new THREE.Vector3(0, 2, 0);
    this.tween = null;
    this.followFn = null;
    this.shakeAmp = 0;
    this.shakeDecay = 2.5;
    this.speed = 1; // fast-forward multiplier
  }

  cut(pos, look) {
    this.tween = null;
    this.followFn = null;
    this.pos.copy(pos);
    this.look.copy(look);
  }

  /** Smooth flight. opts: {pos, look, dur, via} — via = optional arc waypoint. */
  flyTo({ pos, look, dur = 2.5, via = null, ease = easeInOut }) {
    this.followFn = null;
    const fromP = this.pos.clone();
    const fromL = this.look.clone();
    const ctrl = via ? via.clone() : fromP.clone().lerp(pos, 0.5).add(new THREE.Vector3(0, 0.0, 0));
    return new Promise((resolve) => {
      this.tween = { t: 0, dur, fromP, fromL, toP: pos.clone(), toL: look.clone(), ctrl, ease, resolve };
    });
  }

  /** Per-frame follow: fn(dt, t) must return {pos, look}. */
  follow(fn) {
    this.tween = null;
    this.followFn = fn;
  }

  /** Idle orbit used in the lobby. */
  orbit(center, radius = 11, height = 4.2, speed = 0.12, lookY = 2.4) {
    const c = center.clone();
    let a = Math.atan2(this.pos.z - c.z, this.pos.x - c.x);
    this.follow((dt, t) => {
      a += dt * speed;
      return {
        pos: _v.set(
          c.x + Math.cos(a) * radius,
          height + Math.sin(t * 0.5) * 0.5,
          c.z + Math.sin(a) * radius,
        ).clone(),
        look: new THREE.Vector3(c.x, lookY, c.z),
      };
    });
  }

  shake(amp = 0.3) { this.shakeAmp = Math.max(this.shakeAmp, amp); }

  fastForward(mult = 4) { this.speed = mult; }

  update(dt, t) {
    if (this.tween) {
      const tw = this.tween;
      tw.t += (dt * this.speed) / tw.dur;
      const k = clamp(tw.t, 0, 1);
      const e = tw.ease(k);
      bezier(this.pos, tw.fromP, tw.ctrl, tw.toP, e);
      this.look.lerpVectors(tw.fromL, tw.toL, e);
      if (k >= 1) {
        const r = tw.resolve;
        this.tween = null;
        this.speed = 1;
        r();
      }
    } else if (this.followFn) {
      const out = this.followFn(dt, t);
      if (out) {
        this.pos.lerp(out.pos, Math.min(1, dt * 5));
        this.look.lerp(out.look, Math.min(1, dt * 6));
      }
    }

    // hand-held micro drift — keeps every shot alive
    const drift = 0.05;
    _v.set(
      Math.sin(t * 0.31) * drift + Math.sin(t * 1.13) * drift * 0.4,
      Math.cos(t * 0.41) * drift * 0.7,
      Math.sin(t * 0.23) * drift * 0.5,
    );

    // impact shake
    if (this.shakeAmp > 0.001) {
      _v.x += (Math.random() - 0.5) * this.shakeAmp;
      _v.y += (Math.random() - 0.5) * this.shakeAmp;
      this.shakeAmp *= Math.max(0, 1 - dt * this.shakeDecay * 2.2);
    }

    this.cam.position.copy(this.pos).add(_v);
    this.cam.lookAt(this.look);
  }
}
