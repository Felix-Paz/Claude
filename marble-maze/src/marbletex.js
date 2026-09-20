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
      bg('#f6f7fb');
      for (let i = 0; i < 26; i++) {
        const g = x.createRadialGradient(rnd() * W, v(0.15 + rnd() * 0.7), 0, rnd() * W, v(0.5), v(0.4));
        const tint = ['rgba(198,214,255,.5)', 'rgba(255,224,240,.45)', 'rgba(210,255,246,.4)', 'rgba(255,246,214,.4)'][(rnd() * 4) | 0];
        g.addColorStop(0, tint); g.addColorStop(1, 'rgba(255,255,255,0)');
        fill(g); x.fillRect(0, 0, W, H);
      }
      veins(9, 26, v(0.012), 'rgba(176,192,220,.5)', 1.1);
      shade('rgba(255,255,255,.5)', 'rgba(120,140,180,.25)');
      break;
    }
    case 'beach': {
      const cols = ['#ff4d6d', '#ffd23a', '#2fc4ff', '#4ed17a', '#b06bff', '#ff8a3d'];
      for (let i = 0; i < cols.length; i++) { fill(cols[i]); x.fillRect(u(i / cols.length), 0, u(1 / cols.length) + 1, H); }
      caps('#fdfdff', 0.085);
      shade('rgba(255,255,255,.35)', 'rgba(0,0,40,.22)');
      break;
    }
    case 'smiley': {
      bg('#ffd23a');
      around(3, (cx) => {
        ell(cx - u(0.052), v(0.3), u(0.022), v(0.07), '#2a2318');
        ell(cx + u(0.052), v(0.3), u(0.022), v(0.07), '#2a2318');
        x.strokeStyle = '#2a2318'; x.lineWidth = v(0.042); x.lineCap = 'round';
        x.beginPath(); x.ellipse(cx, v(0.41), u(0.072), v(0.155), 0, 0.42, Math.PI - 0.42); x.stroke();
        ell(cx - u(0.115), v(0.42), u(0.028), v(0.05), 'rgba(255,120,120,.45)');
        ell(cx + u(0.115), v(0.42), u(0.028), v(0.05), 'rgba(255,120,120,.45)');
      });
      shade('rgba(255,255,255,.3)', 'rgba(120,70,0,.3)');
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
    case 'soccer': {
      bg('#f7f8fa');
      x.strokeStyle = '#b9c1ce'; x.lineWidth = v(0.014); x.lineJoin = 'round';
      const pent = (cx, cy, r, rot) => {
        const lat = Math.max(0.28, Math.sin((cy / H) * Math.PI));
        fill('#191c22'); x.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = rot + i / 5 * Math.PI * 2;
          const px = cx + Math.cos(a) * (r / lat) * 0.55, py = cy + Math.sin(a) * r;
          i ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.closePath(); x.fill(); x.stroke();
      };
      for (let i = 0; i < 6; i++) pent(u(i / 6), v(0.055), v(0.075), -Math.PI / 2);
      for (let i = 0; i < 6; i++) pent(u(i / 6), v(0.945), v(0.075), Math.PI / 2);
      around(5, (cx) => pent(cx, v(0.32), v(0.115), Math.PI / 2));
      for (let i = 0; i < 5; i++) pent(u(i / 5), v(0.68), v(0.115), -Math.PI / 2);
      for (let i = 0; i < 10; i++) {
        x.beginPath(); x.moveTo(u(i / 10), v(0.43)); x.lineTo(u((i + 0.5) / 10), v(0.57)); x.stroke();
      }
      shade('rgba(255,255,255,.35)', 'rgba(20,30,60,.3)');
      break;
    }
    case 'basket': {
      bg('#df6a22');
      speckle(220, 0.006, 0.012, ['rgba(140,60,10,.30)', 'rgba(255,170,110,.22)']);
      x.strokeStyle = '#2b1409'; x.lineWidth = v(0.016); x.lineCap = 'round';
      for (const uu of [0.25, 0.75]) { x.beginPath(); x.moveTo(u(uu), 0); x.lineTo(u(uu), H); x.stroke(); }
      for (const base of [0.32, 0.68]) {
        x.beginPath();
        for (let i = 0; i <= 60; i++) x.lineTo(u(i / 60), v(base + Math.sin(i / 60 * Math.PI * 4) * 0.055));
        x.stroke();
      }
      shade('rgba(255,210,170,.3)', 'rgba(40,12,0,.35)');
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
    case 'panda': {
      bg('#f7f7fa');
      around(2, (cx) => {
        ell(cx - u(0.075), v(0.24), u(0.045), v(0.085), '#1b1b1f');
        ell(cx + u(0.075), v(0.24), u(0.045), v(0.085), '#1b1b1f');
        ell(cx - u(0.055), v(0.47), u(0.042), v(0.085), '#1b1b1f');
        ell(cx + u(0.055), v(0.47), u(0.042), v(0.085), '#1b1b1f');
        ell(cx - u(0.05), v(0.46), u(0.016), v(0.032), '#ffffff');
        ell(cx + u(0.05), v(0.46), u(0.016), v(0.032), '#ffffff');
        ell(cx - u(0.05), v(0.465), u(0.008), v(0.017), '#000000');
        ell(cx + u(0.05), v(0.465), u(0.008), v(0.017), '#000000');
        ell(cx, v(0.58), u(0.022), v(0.036), '#1b1b1f');
      });
      caps('#e9e9ef', 0.05);
      shade('rgba(255,255,255,.35)', 'rgba(20,20,40,.3)');
      break;
    }
    case 'globe': {
      bg('#1f74c8');
      for (let i = 0; i < 22; i++) {
        const g = x.createRadialGradient(rnd() * W, v(0.5), 0, rnd() * W, v(0.5), v(0.6));
        g.addColorStop(0, 'rgba(60,150,220,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        fill(g); x.fillRect(0, 0, W, H);
      }
      const land = ['#3fa15a', '#57b86b', '#7cc36f', '#c9b978'];
      for (let i = 0; i < 26; i++) {
        const cy = v(0.18 + rnd() * 0.64);
        const taper = Math.max(0.3, Math.sin((cy / H) * Math.PI));
        const rx = u(0.035 + rnd() * 0.06) / taper, ry = v(0.05 + rnd() * 0.08);
        const cx = rnd() * W;
        ell(cx, cy, rx, ry, land[(rnd() * land.length) | 0]);
        ell(cx + rx * 0.5, cy + ry * 0.4, rx * 0.6, ry * 0.6, land[(rnd() * land.length) | 0]);
      }
      caps('#f2f8ff', 0.09);
      speckle(26, 0.01, 0.028, ['rgba(255,255,255,.55)'], 0.15, 0.85);
      shade('rgba(190,230,255,.3)', 'rgba(0,20,60,.4)');
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
