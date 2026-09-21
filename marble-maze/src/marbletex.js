export function drawMarbleTexture(x, type, W, H = W) {
  const u = (n) => n * W, v = (n) => n * H;
  const fill = (s) => (x.fillStyle = s);
  const bg = (s) => { fill(s); x.fillRect(0, 0, W, H); };
  const ell = (cx, cy, rx, ry, s) => { fill(s); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); };
  const caps = (s, h) => { fill(s); x.fillRect(0, 0, W, v(h)); x.fillRect(0, H - v(h), W, v(h)); };
  const around = (n, fn) => { for (let i = 0; i < n; i++) fn(u((i + 0.5) / n), i); };

  let seed = 2166136261;
  for (let i = 0; i < type.length; i++) seed = (Math.imul(seed ^ type.charCodeAt(i), 16777619)) >>> 0;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

  const speckle = (n, rMin, rMax, cols, yMin = 0, yMax = 1) => {
    for (let i = 0; i < n; i++) {
      const cy = v(yMin + rnd() * (yMax - yMin));
      const taper = Math.max(0.25, Math.sin((cy / H) * Math.PI));
      const r = v(rMin + rnd() * (rMax - rMin));
      ell(rnd() * W, cy, r / taper, r, cols[(rnd() * cols.length) | 0]);
    }
  };
  const veins = (n, len, width, col, jitter) => {
    x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      let px = rnd() * W, py = v(0.12 + rnd() * 0.76), a = rnd() * 7;
      x.lineWidth = width * (0.6 + rnd() * 0.8);
      x.beginPath(); x.moveTo(px, py);
      for (let k = 0; k < len; k++) {
        a += (rnd() - 0.5) * jitter;
        px += Math.cos(a) * v(0.05); py += Math.sin(a) * v(0.035);
        x.lineTo(px, py);
      }
      x.stroke();
    }
  };
  const shade = (top, bottom) => {
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, bottom);
    fill(g); x.fillRect(0, 0, W, H);
  };

  switch (type) {
    case 'pearl': {
      // The camera looks down at the marble, so whatever sits near the poles is what
      // the player mostly sees. Colour has to cover the whole map, not just a band
      // around the equator, or the marble reads as a plain white ball in play.
      // Every horizontal gradient starts and ends on the same colour and every path
      // has the same height at both edges, so the map meets itself cleanly at the seam.
      const grad = (cols, y0 = 0, y1 = 0) => {
        const g = x.createLinearGradient(0, v(y0), W, v(y1));
        cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
        return g;
      };
      const path = (yc, amp, ph) => {
        const pts = [];
        for (let i = 0; i <= 96; i++) {
          const t = i / 96;
          pts.push([u(t), v(yc + Math.sin(t * Math.PI * 2 + ph) * amp)]);
        }
        return pts;
      };
      const stroke = (pts, style, lw, alpha) => {
        x.globalAlpha = alpha; x.strokeStyle = style; x.lineWidth = lw;
        x.lineCap = 'round'; x.lineJoin = 'round';
        x.beginPath(); for (const [px, py] of pts) x.lineTo(px, py); x.stroke();
        x.globalAlpha = 1;
      };

      // 1. the glass body. The scene is brightly lit and tone mapped, so a pale pastel
      //    washes out to plain white on screen — the body needs real colour to survive it.
      const body = x.createLinearGradient(0, 0, 0, H);
      body.addColorStop(0, '#bfe6ff'); body.addColorStop(0.28, '#6fb4f5');
      body.addColorStop(0.62, '#3f6fd8'); body.addColorStop(1, '#223f8f');
      fill(body); x.fillRect(0, 0, W, H);
      // nacre: a slow colour drift around the ball so no angle of it looks flat
      x.globalAlpha = 0.34;
      fill(grad(['#63e8ff', '#8f7bff', '#ff7cc4', '#5cf0cf', '#63e8ff'], 0.15, 0.85));
      x.fillRect(0, 0, W, H);
      x.globalAlpha = 1;

      // 2. the swirl, sweeping pole to pole so it is in view from above as it rolls
      const hue = grad(['#5ff0ff', '#7ea8ff', '#c07bff', '#ff74b8', '#5ff0ff']);
      const main = path(0.5, 0.32, 0);
      stroke(main, 'rgba(18,34,74,.34)', v(0.30), 1);
      for (let p = 3; p >= 1; p--) stroke(main, hue, v(0.17) * (1 + p * 0.45), 0.12);
      stroke(main, hue, v(0.17), 1);
      stroke(main, grad(['rgba(255,255,255,.95)', 'rgba(232,250,255,.85)', 'rgba(255,255,255,.95)']), v(0.045), 0.95);

      // 3. a second, quieter ribbon a half turn away, for depth rather than noise
      const back = path(0.5, 0.29, Math.PI);
      stroke(back, grad(['#9ff0ff', '#cbb0ff', '#ffb8dc', '#9ff0ff']), v(0.085), 0.26);

      // 4. glass: a soft highlight up top and a terminator at the bottom
      const gloss = x.createLinearGradient(0, 0, 0, v(0.22));
      gloss.addColorStop(0, 'rgba(255,255,255,.42)'); gloss.addColorStop(1, 'rgba(255,255,255,0)');
      fill(gloss); x.fillRect(0, 0, W, v(0.22));
      const deep = x.createLinearGradient(0, v(0.64), 0, H);
      deep.addColorStop(0, 'rgba(14,26,62,0)'); deep.addColorStop(1, 'rgba(12,22,56,.55)');
      fill(deep); x.fillRect(0, v(0.64), W, v(0.36));
      break;
    }
    case 'beach': {
      const cols = ['#ff4d6d', '#ffd23a', '#2fc4ff', '#4ed17a', '#b06bff', '#ff8a3d'];
      for (let i = 0; i < cols.length; i++) { fill(cols[i]); x.fillRect(u(i / cols.length), 0, u(1 / cols.length) + 1, H); }
      caps('#fdfdff', 0.085);
      shade('rgba(255,255,255,.35)', 'rgba(0,0,40,.22)');
      break;
    }
    case 'lavalamp': {
      bg('#2a0f3a');
      for (let i = 0; i < 18; i++) {
        const g = x.createRadialGradient(rnd() * W, v(0.5), 0, rnd() * W, v(0.5), v(0.5));
        g.addColorStop(0, 'rgba(120,30,140,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        fill(g); x.fillRect(0, 0, W, H);
      }
      const blobs = ['#ff5a2a', '#ff8a2a', '#ff3d7a', '#ffc247'];
      for (let i = 0; i < 16; i++) {
        const cx = rnd() * W, cy = v(0.12 + rnd() * 0.76);
        const taper = Math.max(0.35, Math.sin((cy / H) * Math.PI));
        const ry = v(0.08 + rnd() * 0.14), rx = ry * (0.5 + rnd() * 0.3) / taper;
        const col = blobs[(rnd() * blobs.length) | 0];
        const g = x.createRadialGradient(cx, cy - ry * 0.3, 0, cx, cy, ry * 1.5);
        g.addColorStop(0, '#ffe9a8'); g.addColorStop(0.42, col); g.addColorStop(1, 'rgba(255,60,20,0)');
        fill(g); x.beginPath(); x.ellipse(cx, cy, rx * 1.5, ry * 1.5, 0, 0, 7); x.fill();
        ell(cx, cy, rx, ry, col);
      }
      speckle(40, 0.004, 0.012, ['rgba(255,220,140,.7)']);
      break;
    }
    case 'donut': {
      bg('#ff9fc4');
      fill('#fff0dc'); x.beginPath();
      x.moveTo(0, v(0.62));
      for (let i = 0; i <= 28; i++) x.lineTo(u(i / 28), v(0.62 + Math.sin(i * 0.9) * 0.045));
      x.lineTo(W, H); x.lineTo(0, H); x.closePath(); x.fill();
      speckle(80, 0.012, 0.02, ['#ff4d6d', '#ffd23a', '#2fc4ff', '#4ed17a', '#b06bff', '#ffffff'], 0.1, 0.62);
      caps('#ffc2da', 0.06);
      shade('rgba(255,255,255,.4)', 'rgba(140,60,90,.28)');
      break;
    }
    case 'plasma': {
      bg('#0b0526');
      for (let i = 0; i < 22; i++) {
        const cx = rnd() * W, cy = v(0.2 + rnd() * 0.6);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, u(0.16));
        g.addColorStop(0, ['rgba(80,200,255,.55)', 'rgba(180,90,255,.5)', 'rgba(255,80,210,.4)'][(rnd() * 3) | 0]);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        fill(g); x.fillRect(0, 0, W, H);
      }
      x.lineCap = 'round'; x.lineJoin = 'round';
      for (let i = 0; i < 26; i++) {
        let px = rnd() * W, py = v(0.12 + rnd() * 0.76), a = rnd() * 7;
        const col = ['#7ae4ff', '#c58cff', '#ff8ae0'][(rnd() * 3) | 0];
        x.strokeStyle = col; x.lineWidth = v(0.016);
        x.beginPath(); x.moveTo(px, py);
        for (let k = 0; k < 14; k++) {
          a += (rnd() - 0.5) * 2.2;
          px += Math.cos(a) * v(0.055); py += Math.sin(a) * v(0.03);
          x.lineTo(px, py);
        }
        x.stroke();
        x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = v(0.005); x.stroke();
      }
      speckle(70, 0.003, 0.008, ['rgba(200,240,255,.9)']);
      break;
    }
    case 'boba': {
      const g0 = x.createLinearGradient(0, 0, 0, H);
      g0.addColorStop(0, '#ffe7cf'); g0.addColorStop(0.45, '#f0c49a'); g0.addColorStop(1, '#c98a5e');
      fill(g0); x.fillRect(0, 0, W, H);
      for (let i = 0; i < 14; i++) {
        const cy = v(0.1 + rnd() * 0.8);
        const taper = Math.max(0.35, Math.sin((cy / H) * Math.PI));
        x.strokeStyle = 'rgba(255,248,238,.5)'; x.lineWidth = v(0.05 + rnd() * 0.06);
        x.beginPath();
        for (let k = 0; k <= 30; k++) x.lineTo(u(k / 30), cy + Math.sin(k * 0.5 + i) * v(0.035) / taper);
        x.stroke();
      }
      for (let i = 0; i < 34; i++) {
        const cy = v(0.14 + rnd() * 0.72);
        const taper = Math.max(0.35, Math.sin((cy / H) * Math.PI));
        const r = v(0.026 + rnd() * 0.022), cx = rnd() * W;
        ell(cx, cy, r / taper, r, '#2e1a12');
        ell(cx - r * 0.3 / taper, cy - r * 0.32, r * 0.3 / taper, r * 0.28, 'rgba(255,230,200,.45)');
      }
      shade('rgba(255,250,240,.4)', 'rgba(90,50,20,.35)');
      break;
    }
    case 'eight': {
      bg('#0c0c0f');
      for (let i = 0; i < 40; i++) {
        const g = x.createRadialGradient(rnd() * W, rnd() * H, 0, rnd() * W, v(0.5), v(0.5));
        g.addColorStop(0, 'rgba(120,140,180,.07)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        fill(g); x.fillRect(0, 0, W, H);
      }
      around(2, (cx) => {
        ell(cx, v(0.5), u(0.085), v(0.17), '#fbfbfd');
        fill('#0c0c0f'); x.font = `bold ${v(0.22)}px Arial, sans-serif`;
        x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('8', cx, v(0.52));
      });
      shade('rgba(255,255,255,.22)', 'rgba(0,0,0,.4)');
      break;
    }
    case 'melon': {
      bg('#2f9147');
      for (let i = 0; i < 12; i++) {
        fill(i % 2 ? '#1c6b33' : '#49b45c');
        x.beginPath();
        const c0 = u(i / 12);
        x.moveTo(c0, 0);
        for (let k = 0; k <= 16; k++) x.lineTo(c0 + Math.sin(k * 1.3) * u(0.012) + u(0.026), v(k / 16));
        for (let k = 16; k >= 0; k--) x.lineTo(c0 + Math.sin(k * 1.3) * u(0.012) - u(0.012), v(k / 16));
        x.closePath(); x.fill();
      }
      caps('#256f37', 0.05);
      shade('rgba(210,255,215,.3)', 'rgba(0,40,10,.35)');
      break;
    }
    case 'disco': {
      const cx2 = 26, cy2 = 13;
      for (let yy = 0; yy < cy2; yy++) for (let xx = 0; xx < cx2; xx++) {
        const t = rnd();
        fill(t > 0.9 ? '#ffffff' : t > 0.72 ? '#dfe9ff' : t > 0.4 ? '#9fb0cc' : '#6d7d99');
        x.fillRect(xx * (W / cx2), yy * (H / cy2), W / cx2 - 1, H / cy2 - 1);
      }
      shade('rgba(255,255,255,.4)', 'rgba(10,20,50,.4)');
      break;
    }
    case 'ink': {
      bg('#f4f6fa');
      const inks = ['#ff5a2a', '#ff2d6a', '#ffb02e', '#12324a'];
      for (let i = 0; i < 9; i++) {
        const col = inks[i % inks.length];
        const base = 0.14 + rnd() * 0.72;
        x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
        x.lineWidth = v(0.03 + rnd() * 0.075);
        x.beginPath();
        const amp = 0.05 + rnd() * 0.1, ph = rnd() * 7, fr = 0.22 + rnd() * 0.3;
        for (let k = 0; k <= 60; k++) x.lineTo(u(k / 60), v(base + Math.sin(k * fr + ph) * amp));
        x.stroke();
        x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = v(0.012);
        x.beginPath();
        for (let k = 0; k <= 60; k++) x.lineTo(u(k / 60), v(base - 0.022 + Math.sin(k * fr + ph) * amp));
        x.stroke();
      }
      speckle(46, 0.006, 0.018, ['rgba(255,90,42,.5)', 'rgba(18,50,74,.4)', 'rgba(255,45,106,.4)']);
      shade('rgba(255,255,255,.4)', 'rgba(40,60,90,.32)');
      break;
    }
    case 'chameleon': {
      const g1 = x.createLinearGradient(0, 0, W, 0);
      const stops = ['#00e0a8', '#00c2ff', '#7a4dff', '#ff3fb4', '#ffb52e', '#00e0a8'];
      stops.forEach((c, i) => g1.addColorStop(i / (stops.length - 1), c));
      fill(g1); x.fillRect(0, 0, W, H);
      const g2 = x.createLinearGradient(0, 0, 0, H);
      g2.addColorStop(0, 'rgba(255,255,255,.34)'); g2.addColorStop(0.5, 'rgba(0,0,0,0)');
      g2.addColorStop(1, 'rgba(10,0,40,.4)');
      fill(g2); x.fillRect(0, 0, W, H);
      const rows = 13, cols3 = 30;
      for (let ry = 0; ry < rows; ry++) {
        for (let rx = 0; rx < cols3; rx++) {
          const cx = (rx + (ry % 2 ? 0.5 : 0)) * (W / cols3);
          const cy = (ry + 0.5) * (H / rows);
          const t = rnd();
          x.fillStyle = t > 0.7 ? 'rgba(255,255,255,.22)' : t > 0.42 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.05)';
          x.beginPath();
          x.ellipse(cx, cy, (W / cols3) * 0.62, (H / rows) * 0.52, 0, 0, Math.PI);
          x.fill();
          x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = v(0.004); x.stroke();
        }
      }
      break;
    }
    case 'magma': {
      bg('#221012');
      speckle(150, 0.008, 0.026, ['#170b0d', '#2e181a', '#3a1f1c']);
      veins(16, 30, v(0.03), 'rgba(255,92,20,.95)', 0.9);
      veins(16, 30, v(0.014), 'rgba(255,205,90,.95)', 0.9);
      for (let i = 0; i < 16; i++) {
        const cx = rnd() * W, cy = v(0.12 + rnd() * 0.76);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, v(0.16));
        g.addColorStop(0, 'rgba(255,180,60,.75)'); g.addColorStop(1, 'rgba(255,60,0,0)');
        fill(g); x.fillRect(0, 0, W, H);
      }
      break;
    }
    case 'gold': {
      bg('#f6bb35');
      for (let i = 0; i < 40; i++) {
        fill(['rgba(255,232,160,.55)', 'rgba(214,158,40,.30)', 'rgba(255,250,220,.45)'][(rnd() * 3) | 0]);
        const yy = v(rnd()); x.fillRect(0, yy, W, v(0.006 + rnd() * 0.02));
      }
      caps('#ffeaa6', 0.05);
      shade('rgba(255,253,232,.65)', 'rgba(190,130,25,.22)');
      break;
    }
    case 'planet': {
      const cols = ['#e7c48c', '#cfa762', '#f0d7a6', '#b98a4a', '#dcb87a', '#c69a55'];
      let yy = 0;
      for (let i = 0; yy < H; i++) {
        const hgt = v(0.045 + rnd() * 0.06);
        fill(cols[i % cols.length]); x.fillRect(0, yy, W, hgt + 1);
        yy += hgt;
      }
      for (let i = 0; i < 40; i++) {
        fill('rgba(255,255,255,.10)');
        x.fillRect(0, v(rnd()), W, v(0.006));
      }
      ell(u(0.32), v(0.62), u(0.075), v(0.06), '#a9682c');
      ell(u(0.32), v(0.62), u(0.05), v(0.038), '#c98a46');
      shade('rgba(255,245,220,.35)', 'rgba(60,35,0,.4)');
      break;
    }
    case 'galaxy': {
      bg('#0d0722');
      for (let i = 0; i < 26; i++) {
        const cx = rnd() * W, cy = v(0.2 + rnd() * 0.6);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, u(0.14));
        g.addColorStop(0, ['rgba(150,90,255,.5)', 'rgba(60,140,255,.45)', 'rgba(255,90,190,.4)'][(rnd() * 3) | 0]);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        fill(g); x.fillRect(0, 0, W, H);
      }
      for (let arm = 0; arm < 3; arm++) {
        for (let i = 0; i < 150; i++) {
          const t = i / 150;
          const cx = (u(arm / 3) + u(t * 0.55) + Math.sin(t * 6) * u(0.02)) % W;
          const cy = v(0.5 + Math.sin(t * 3.4 + arm) * 0.26);
          fill(i % 6 ? 'rgba(255,255,255,.9)' : 'rgba(180,140,255,.9)');
          const r = v(0.004 + rnd() * 0.008);
          x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
        }
      }
      speckle(160, 0.003, 0.007, ['rgba(255,255,255,.85)', 'rgba(190,210,255,.7)']);
      break;
    }
    case 'aurora': {
      bg('#07202c');
      for (let band = 0; band < 7; band++) {
        const base = 0.12 + band * 0.11;
        const col = ['rgba(47,240,208,.55)', 'rgba(90,200,255,.5)', 'rgba(160,110,255,.45)', 'rgba(255,120,200,.35)'][band % 4];
        const g = x.createLinearGradient(0, v(base - 0.09), 0, v(base + 0.09));
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        fill(g);
        x.beginPath(); x.moveTo(0, v(base));
        for (let i = 0; i <= 48; i++) x.lineTo(u(i / 48), v(base + Math.sin(i * 0.42 + band) * 0.045));
        x.lineTo(W, v(base + 0.1)); x.lineTo(0, v(base + 0.1)); x.closePath(); x.fill();
      }
      speckle(90, 0.003, 0.007, ['rgba(255,255,255,.8)']);
      break;
    }
    case 'diamond': {
      bg('#dff0ff');
      const cols2 = 20, rows = 10;
      for (let yy2 = 0; yy2 < rows; yy2++) for (let xx2 = 0; xx2 < cols2; xx2++) {
        const t = rnd();
        fill(t > 0.85 ? '#ffffff' : t > 0.6 ? '#eaf7ff' : t > 0.3 ? '#c2e0f7' : '#a8cfee');
        const px = xx2 * (W / cols2), py = yy2 * (H / rows);
        x.beginPath();
        x.moveTo(px + W / cols2 / 2, py);
        x.lineTo(px + W / cols2, py + H / rows / 2);
        x.lineTo(px + W / cols2 / 2, py + H / rows);
        x.lineTo(px, py + H / rows / 2);
        x.closePath(); x.fill();
        x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = v(0.006); x.stroke();
      }
      shade('rgba(255,255,255,.65)', 'rgba(80,140,200,.35)');
      break;
    }
    default:
      bg('#cccccc');
  }
}
