/* =====================================================================
   PRINCIPIA · hero — a lens of liquid glass
   The headline is typeset by the browser (so layout, kerning and the
   accessible text all stay real), traced glyph-by-glyph into a texture,
   and refracted in a fragment shader: magnification, chromatic
   dispersion, fresnel rim, specular glint, squash & stretch with
   velocity, click ripples, an intro dissolve and a scroll melt.
   ===================================================================== */
P.HeroGL = (function () {
  'use strict';
  const { $, $$, clamp, lerp, pointer, reduced, fine } = P;

  const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

  const FRAG = `
precision highp float;

uniform sampler2D uText;
uniform vec2  uRes;      // drawing-buffer size (device px)
uniform float uDpr;
uniform float uTime;
uniform vec2  uLens;     // lens centre (device px, y down)
uniform vec2  uVel;      // lens velocity (device px / frame)
uniform float uR;        // lens radius (device px)
uniform float uIntro;    // 0 → 1 text dissolve-in
uniform float uScroll;   // 0 → 1 hero leaving the viewport
uniform vec4  uRip[4];   // ripples: x, y, age (s), amplitude
uniform float uAmb;      // aurora amount
uniform float uVig;      // vignette amount
uniform float uGrain;    // film grain amount

const vec3 INK   = vec3(0.047, 0.047, 0.078);
const vec3 ULTRA = vec3(0.227, 0.133, 0.988);
const vec3 LILAC = vec3(0.804, 0.749, 1.000);
const vec3 CORAL = vec3(0.992, 0.353, 0.196);
const vec3 VOLT  = vec3(0.851, 0.992, 0.227);

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
  return v;
}

// slow aurora of the palette, pooled at the edges of an ink room
vec3 aurora(vec2 px) {
  if (uAmb <= 0.0) return INK;
  float aspect = uRes.x / uRes.y;
  vec2 uv = px / uRes.y;
  float t = uTime * 0.035;
  vec2 q = vec2(fbm(uv * 1.25 + vec2(t, -t)), fbm(uv * 1.25 + vec2(4.2 - t, 1.7 + t)));
  float n = fbm(uv * 1.1 + q * 1.7 + t);
  float g1 = smoothstep(1.15, 0.0, length((uv - vec2(aspect * 0.86, 1.02)) * vec2(0.85, 1.25)) + (n - 0.5) * 0.7);
  float g2 = smoothstep(0.8, 0.0, length((uv - vec2(aspect * 0.12, 1.12)) * vec2(0.75, 1.5)) + (q.x - 0.5) * 0.6);
  float g3 = smoothstep(0.95, 0.0, length((uv - vec2(aspect * 0.5, -0.2)) * vec2(0.55, 1.7)) + (q.y - 0.5) * 0.7);
  vec3 col = INK;
  col = mix(col, ULTRA * 0.78, g1 * 0.62 * uAmb);
  col = mix(col, CORAL * 0.72, g2 * 0.34 * uAmb);
  col = mix(col, LILAC * 0.32, g3 * 0.22 * uAmb);
  return col;
}

// where a pixel samples the type from: ripples, intro smear, scroll melt
vec2 warp(vec2 px) {
  for (int i = 0; i < 4; i++) {
    vec4 r = uRip[i];
    if (r.w > 0.0) {
      vec2 d = px - r.xy;
      float dist = length(d);
      float k = dist - r.z * 1100.0 * uDpr;
      float w = 70.0 * uDpr;
      float env = exp(-(k * k) / (2.0 * w * w)) * exp(-r.z * 1.5) * r.w;
      px -= (d / max(dist, 1.0)) * sin(k * 0.045 / uDpr) * 26.0 * uDpr * env;
    }
  }
  if (uIntro < 1.0) {
    float e = 1.0 - uIntro;
    px.x += e * e * (fbm(vec2(px.y / uRes.y * 9.0, uTime * 0.4)) - 0.5) * 420.0 * uDpr;
  }
  if (uScroll > 0.0) {
    float drip = fbm(vec2(px.x / uRes.x * 7.0, 3.1));
    px.y -= uScroll * uScroll * (0.2 + drip * 1.2) * uRes.y * 0.55;
  }
  return px;
}

vec4 textAt(vec2 px) {
  vec2 uv = vec2(px.x / uRes.x, 1.0 - px.y / uRes.y);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(uText, uv);
}

vec3 scene(vec2 px) {
  vec4 tx = textAt(warp(px));
  float m = 1.0;
  if (uIntro < 1.0) {
    float n = fbm(px / uRes.y * 3.4 + 7.0);
    m = smoothstep(n - 0.06, n + 0.06, uIntro * 1.3 - 0.15 + (px.x / uRes.x) * 0.0);
  }
  m *= 1.0 - smoothstep(0.55, 1.0, uScroll);
  return mix(aurora(px), tx.rgb, tx.a * m);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 col = scene(px);

  // ---- the lens ----
  vec2 d = px - uLens;
  float sp = length(uVel);
  vec2 dir = sp > 0.01 ? uVel / sp : vec2(1.0, 0.0);
  float st = clamp(sp / (uR * 0.22 + 1.0), 0.0, 0.42);          // stretch with speed
  vec2 dl = vec2(dot(d, dir), dot(d, vec2(-dir.y, dir.x)));
  dl.x /= (1.0 + st);
  dl.y /= (1.0 - st * 0.42);
  float ang = atan(dl.y, dl.x);
  float wob = 1.0 + 0.022 * sin(ang * 3.0 + uTime * 1.7) + 0.016 * sin(ang * 5.0 - uTime * 1.2);
  float R = max(uR * wob, 1.0);
  float r = length(dl) / R;

  // contact shadow + caustic glow under the drop
  float sh = smoothstep(1.4, 0.92, length((d - vec2(0.0, 0.22 * uR)) / max(uR, 1.0)));
  col *= 1.0 - sh * 0.32 * step(1.0, uR);
  float caustic = smoothstep(1.3, 1.0, length((d + vec2(0.0, -0.32 * uR)) / max(uR, 1.0))) * (1.0 - smoothstep(0.95, 1.0, r));
  col += LILAC * caustic * 0.05;

  if (r < 1.0 && uR > 1.0) {
    float h = sqrt(1.0 - r * r);                               // dome height
    vec2 nd = d / max(length(d), 0.001);
    float mag = mix(0.56, 1.0, pow(r, 2.6));                   // ~1.8× at the centre
    vec2 base = uLens + d * mag;
    float bend = pow(r, 5.0) * uR * 0.42;                      // rim bends hardest
    vec2 s0 = base - nd * bend;
    float disp = (0.6 + 5.0 * pow(r, 3.0)) * uDpr;             // dispersion, strongest at the rim
    vec3 c;
    c.r = scene(s0 + nd * disp).r;
    c.g = scene(s0).g;
    c.b = scene(s0 - nd * disp * 1.15).b;
    c *= vec3(0.97, 0.99, 1.05) * 1.07;

    vec3 N = normalize(vec3(nd * r * 1.35, h));
    vec3 L = normalize(vec3(-0.5, -0.7, 0.62));
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(N, H), 0.0), 110.0);
    float spec2 = pow(max(dot(N, normalize(vec3(0.55, 0.6, 0.5) + vec3(0.0, 0.0, 1.0))), 0.0), 40.0);
    float fres = pow(1.0 - h, 3.2);
    c += vec3(1.0) * spec * 0.95;
    c += VOLT * spec2 * 0.12;
    c += mix(LILAC, vec3(1.0), 0.45) * fres * 0.42;
    float rim = smoothstep(0.93, 0.985, r) * (1.0 - smoothstep(0.985, 1.0, r));
    c += rim * 0.18;
    float edge = 1.0 - smoothstep(1.0 - 1.6 * uDpr / R, 1.0, r);
    col = mix(col, c, edge);
  }

  // film grain + soft vignette
  col += (hash(px + fract(uTime * 0.37) * 371.0) - 0.5) * 0.05 * uGrain;
  vec2 vu = px / uRes - 0.5;
  col *= 1.0 - uVig * 0.32 * pow(length(vu * vec2(1.0, 1.15)) * 1.35, 2.6);
  gl_FragColor = vec4(col, 1.0);
}`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[principia] shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const STRETCH = [[50, 'ultra-condensed'], [62.5, 'extra-condensed'], [75, 'condensed'], [87.5, 'semi-condensed'],
    [100, 'normal'], [112.5, 'semi-expanded'], [125, 'expanded'], [150, 'extra-expanded'], [200, 'ultra-expanded']];
  const stretchKeyword = pct => {
    const v = parseFloat(pct) || 100;
    let best = STRETCH[4];
    STRETCH.forEach(s => { if (Math.abs(s[0] - v) < Math.abs(best[0] - v)) best = s; });
    return best[1];
  };

  function create(section, opts = {}) {
    const o = Object.assign({ melt: true, hud: true, amb: 1, vig: 1, grain: 1, flag: document.documentElement, radius: null }, opts);
    const canvas = o.canvas || $('.hero-gl', section);
    const lines = o.lines || $$('[data-gl-line]', section);
    let gl = null;
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    } catch (e) { gl = null; }
    if (!gl) return null;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('[principia] link failed'); return null; }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    ['uText', 'uRes', 'uDpr', 'uTime', 'uLens', 'uVel', 'uR', 'uIntro', 'uScroll', 'uRip', 'uAmb', 'uVig', 'uGrain'].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(U.uText, 0);
    gl.uniform1f(U.uAmb, o.amb);
    gl.uniform1f(U.uVig, o.vig);
    gl.uniform1f(U.uGrain, o.grain);

    const textCanvas = document.createElement('canvas');
    const tctx = textCanvas.getContext('2d');

    let W = 0, H = 0, dpr = 1, quality = 1;
    const lens = { x: 0, y: 0, vx: 0, vy: 0, r: 0, rTarget: 0, grow: 1 };
    const state = { intro: reduced ? 1 : 0, scroll: 0, active: true, running: false, hover: false, lastMove: 0 };
    const ripples = [];
    const ripData = new Float32Array(16);

    function baseRadius() {
      if (o.radius) return o.radius(W, H);
      const m = Math.min(W, H);
      return clamp(m * (fine ? 0.2 : 0.26), 80, 250);
    }

    function resize() {
      const r = section.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, fine ? 1.6 : 1.25) * quality;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      lens.rTarget = baseRadius();
      if (!lens.x) { lens.x = W * 0.62; lens.y = H * 0.5; }
      drawText();
    }

    // trace the real DOM typesetting, glyph by glyph
    function drawText() {
      textCanvas.width = canvas.width;
      textCanvas.height = canvas.height;
      const sr = section.getBoundingClientRect();
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tctx.clearRect(0, 0, W, H);
      tctx.textBaseline = 'alphabetic';
      const range = document.createRange();
      lines.forEach(line => {
        const cs = getComputedStyle(line);
        const probe = $('.probe', line);
        const baseY = probe.getBoundingClientRect().top - sr.top;
        const kw = stretchKeyword(cs.fontStretch);
        tctx.font = `${cs.fontStyle} ${cs.fontWeight} ${kw} ${cs.fontSize} ${cs.fontFamily}`;
        if ('fontStretch' in tctx) { try { tctx.fontStretch = kw; } catch (e) {} }
        if ('letterSpacing' in tctx) tctx.letterSpacing = '0px';
        tctx.fillStyle = cs.getPropertyValue('--gl').trim() || '#F3F0E9';
        const ls = parseFloat(cs.letterSpacing) || 0;
        const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const txt = node.textContent;
          for (let i = 0; i < txt.length; i++) {
            const ch = txt[i];
            if (ch === ' ' || ch === '\n') continue;
            range.setStart(node, i); range.setEnd(node, i + 1);
            const rr = range.getBoundingClientRect();
            if (!rr.width) continue;
            const domAdvance = rr.width - ls;
            const mw = tctx.measureText(ch).width || 1;
            let sx = domAdvance / mw;
            if (!isFinite(sx) || Math.abs(sx - 1) < 0.015 || sx <= 0.3 || sx > 3) sx = 1;
            tctx.save();
            tctx.translate(rr.left - sr.left, baseY);
            tctx.scale(sx, 1);
            tctx.fillText(ch, 0, 0);
            tctx.restore();
          }
        }
      });
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    }

    function ripple(x, y, amp = 1) {
      ripples.unshift({ x, y, t0: performance.now(), amp });
      ripples.length = Math.min(ripples.length, 4);
    }

    // input
    section.addEventListener('pointermove', e => {
      state.hover = true; state.lastMove = performance.now();
    }, { passive: true });
    section.addEventListener('pointerleave', () => { state.hover = false; });
    section.addEventListener('pointerdown', e => {
      const r = section.getBoundingClientRect();
      ripple(e.clientX - r.left, e.clientY - r.top, 1);
      lens.grow = 1.35;
    });

    let tPrev = performance.now(), frames = 0, slow = 0;
    const hud = o.hud ? { x: $('.hud-x'), y: $('.hud-y'), v: $('.hud-v') } : {};
    let hudT = 0;

    function frame(now) {
      if (!state.running) return;
      if (!frame.once) requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - tPrev) / 1000);
      tPrev = now;
      if (!state.active) return;

      // adaptive resolution: if the GPU struggles, render fewer pixels
      frames++;
      if (dt > 0.034) slow++;
      if (frames === 90) {
        if (slow > 45 && quality > 0.6) { quality = Math.max(0.6, quality - 0.2); resize(); }
        frames = 0; slow = 0;
      }

      const sr = section.getBoundingClientRect();
      const t = now / 1000;
      let tx, ty;
      const recent = now - state.lastMove < 2600;
      if (state.hover && recent && pointer.moved) {
        tx = pointer.x - sr.left; ty = pointer.y - sr.top;
      } else {
        // autopilot: a slow lissajous drift
        tx = W * (0.5 + 0.3 * Math.sin(t * 0.37)) ;
        ty = H * (0.5 + 0.2 * Math.sin(t * 0.53 + 1.3));
      }
      // under-damped spring (ζ ≈ 0.6) → a little overshoot = jelly
      const STIFF = 170, DAMP = 16;
      lens.vx += ((tx - lens.x) * STIFF - lens.vx * DAMP) * dt;
      lens.vy += ((ty - lens.y) * STIFF - lens.vy * DAMP) * dt;
      lens.x += lens.vx * dt;
      lens.y += lens.vy * dt;
      lens.grow = lerp(lens.grow, 1, 1 - Math.pow(0.002, dt));
      const press = P.pointer.down && state.hover ? 1.18 : 1;
      lens.r = lerp(lens.r, lens.rTarget * press * lens.grow * clamp(state.intro * 1.4 - 0.2, 0, 1), 1 - Math.pow(0.0005, dt));
      const speed = Math.hypot(lens.vx, lens.vy); // px / s

      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uDpr, dpr);
      gl.uniform1f(U.uTime, t);
      gl.uniform2f(U.uLens, lens.x * dpr, lens.y * dpr);
      gl.uniform2f(U.uVel, lens.vx * dpr * 0.022, lens.vy * dpr * 0.022);
      gl.uniform1f(U.uR, lens.r * dpr * (1 - state.scroll * 0.6));
      gl.uniform1f(U.uIntro, state.intro);
      gl.uniform1f(U.uScroll, state.scroll);
      for (let i = 0; i < 4; i++) {
        const rp = ripples[i];
        if (rp) {
          const age = (now - rp.t0) / 1000;
          ripData.set([rp.x * dpr, rp.y * dpr, age, age > 3 ? 0 : rp.amp], i * 4);
        } else ripData.set([0, 0, 0, 0], i * 4);
      }
      gl.uniform4fv(U.uRip, ripData);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // HUD
      if (now - hudT > 80 && hud.x) {
        hudT = now;
        hud.x.textContent = (lens.x / W).toFixed(3);
        hud.y.textContent = (lens.y / H).toFixed(3);
        hud.v.textContent = (speed / 1000).toFixed(2);
      }
    }

    function renderOnce() {
      state.running = true; state.active = true; frame.once = true;
      frame(performance.now());
      state.running = false; frame.once = false;
    }
    function start() {
      if (state.running) return;
      state.running = true;
      tPrev = performance.now();
      requestAnimationFrame(frame);
    }
    function stop() { state.running = false; }

    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); o.flag.classList.remove('gl-on'); });

    if (o.melt) {
      // the hero melts as it leaves; pause once it is fully off-screen
      ScrollTrigger.create({
        trigger: section, start: 'top top', end: 'bottom top',
        onUpdate: self => { state.scroll = self.progress; },
        onLeave: () => { state.active = false; },
        onEnterBack: () => { state.active = true; }
      });
    } else {
      state.active = false;
      ScrollTrigger.create({
        trigger: section, start: 'top bottom', end: 'bottom top',
        onToggle: self => { state.active = self.isActive; }
      });
    }

    resize();
    o.flag.classList.add('gl-on');

    return {
      start, stop, resize, drawText, ripple, renderOnce,
      intro(duration = 2.2) {
        state.intro = 0;
        return gsap.to(state, { intro: 1, duration, ease: 'power2.out' });
      },
      setIntro(v) { state.intro = v; },
      get lens() { return lens; }
    };
  }

  return { create };
})();
