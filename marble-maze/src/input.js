export class Input {
  constructor() {
    this.raw = { x: 0, y: 0 };
    this.vec = { x: 0, y: 0 };
    this.boost = false;
    this.mode = 'auto';
    this.activeMode = 'keys';
    this.sensitivity = 1.0;
    this.tiltAvailable = ('DeviceOrientationEvent' in window);
    this.tiltPermitted = false;
    this.tiltNeutral = { beta: 40, gamma: 0 };
    this._keys = new Set();
    this._touch = { active: false, ax: 0, ay: 0, id: null, radius: 78 };
    this._touchBoost = false;
    this._lastTilt = null;
    this._bound = false;
  }

  isTouchDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  }

  attach() {
    if (this._bound) return;
    this._bound = true;
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    window.addEventListener('deviceorientation', this._onTilt);
    if (this.mode === 'auto') {
      this.activeMode = this.isTouchDevice() ? (this.tiltPermitted ? 'tilt' : 'touch') : 'keys';
    } else {
      this.activeMode = this.mode;
    }
  }

  setMode(m) {
    this.mode = m;
    if (m === 'auto') {
      this.activeMode = this.isTouchDevice() ? (this.tiltPermitted ? 'tilt' : 'touch') : 'keys';
    } else {
      this.activeMode = m;
    }
  }

  setSensitivity(s) { this.sensitivity = s; }

  async requestTilt() {
    if (!this.tiltAvailable) return false;
    try {
      const D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function') {
        const res = await D.requestPermission();
        this.tiltPermitted = (res === 'granted');
      } else {
        this.tiltPermitted = true;
      }
    } catch (e) { this.tiltPermitted = false; }
    if (this.tiltPermitted && (this.mode === 'auto' || this.mode === 'tilt')) {
      this.activeMode = 'tilt';
      this.calibrate();
    }
    return this.tiltPermitted;
  }

  calibrate() {
    if (this._lastTilt) this.tiltNeutral = { beta: this._lastTilt.beta, gamma: this._lastTilt.gamma };
  }

  setTouchBoost(b) { this._touchBoost = b; }

  bindTouchSurface(el) {
    el.addEventListener('touchstart', this._onTouchStart, { passive: false });
    el.addEventListener('touchmove', this._onTouchMove, { passive: false });
    el.addEventListener('touchend', this._onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
  }

  update(dt) {
    let rx = 0, ry = 0;
    if (this.activeMode === 'keys' || this.mode === 'auto') {
      const k = this._keys;
      if (k.has('a') || k.has('arrowleft')) rx -= 1;
      if (k.has('d') || k.has('arrowright')) rx += 1;
      if (k.has('w') || k.has('arrowup')) ry -= 1;
      if (k.has('s') || k.has('arrowdown')) ry += 1;
      if (rx || ry) { const m = Math.hypot(rx, ry) || 1; rx /= m; ry /= m; this.activeMode = (this.mode === 'auto') ? 'keys' : this.activeMode; }
    }
    if ((this.activeMode === 'touch') && this._touch.active) {
      rx = this._touch.ax; ry = this._touch.ay;
    }
    if (this.activeMode === 'tilt' && this._lastTilt) {
      const maxA = 32;
      let gx = (this._lastTilt.gamma - this.tiltNeutral.gamma);
      let gy = (this._lastTilt.beta - this.tiltNeutral.beta);
      rx = clampDead(gx / maxA, 0.06);
      ry = clampDead(gy / maxA, 0.06);
    }
    rx *= this.sensitivity; ry *= this.sensitivity;
    const mag = Math.hypot(rx, ry);
    if (mag > 1) { rx /= mag; ry /= mag; }
    this.raw.x = rx; this.raw.y = ry;

    const k = 1 - Math.exp(-18 * dt);
    this.vec.x += (this.raw.x - this.vec.x) * k;
    this.vec.y += (this.raw.y - this.vec.y) * k;

    const keyBoost = this._keys.has('shift');
    this.boost = keyBoost || this._touchBoost;
  }

  reset() { this.vec.x = 0; this.vec.y = 0; this.raw.x = 0; this.raw.y = 0; }

  detach() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
    window.removeEventListener('deviceorientation', this._onTilt);
    this._bound = false;
  }

  _onKeyDown = (e) => {
    const key = e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault();
    if (key === 'shift') { this._keys.add('shift'); return; }
    this._keys.add(key);
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
      if (this.mode === 'auto') this.activeMode = 'keys';
    }
  };
  _onKeyUp = (e) => {
    const key = e.key.toLowerCase();
    if (key === 'shift') this._keys.delete('shift');
    this._keys.delete(key);
  };
  _onBlur = () => { this._keys.clear(); this._touch.active = false; this._touchBoost = false; };

  _onTilt = (e) => {
    if (e.beta == null && e.gamma == null) return;
    this._lastTilt = { beta: e.beta || 0, gamma: e.gamma || 0 };
  };

  _onTouchStart = (e) => {
    if (this.activeMode === 'tilt') return;
    e.preventDefault();
    const t = e.changedTouches[0];
    this._touch.active = true; this._touch.id = t.identifier;
    this._touch.ax = 0; this._touch.ay = 0;
    this._touch._ox = t.clientX; this._touch._oy = t.clientY;
    if (this.mode === 'auto') this.activeMode = 'touch';
  };
  _onTouchMove = (e) => {
    if (!this._touch.active) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== this._touch.id) continue;
      const dx = t.clientX - this._touch._ox;
      const dy = t.clientY - this._touch._oy;
      const r = this._touch.radius;
      this._touch.ax = Math.max(-1, Math.min(1, dx / r));
      this._touch.ay = Math.max(-1, Math.min(1, dy / r));
    }
  };
  _onTouchEnd = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === this._touch.id) {
        this._touch.active = false; this._touch.ax = 0; this._touch.ay = 0; this._touch.id = null;
      }
    }
  };
}

function clampDead(v, dead) {
  if (Math.abs(v) < dead) return 0;
  const s = Math.sign(v);
  v = (Math.abs(v) - dead) / (1 - dead);
  return s * Math.max(-1, Math.min(1, v));
}
