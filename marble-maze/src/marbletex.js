// =====================================================================
//  marbletex.js — shared procedural marble-skin painter.
//  Used by game.js (256px sphere map) AND ui.js (shop swatch) so a
//  skin looks identical in the shop and in play.
//  drawMarbleTexture(ctx, type, S) paints an S×S canvas context.
// =====================================================================
export function drawMarbleTexture(x, type, S) {
  const c = (n) => n * S;                       // fraction -> px helper
  const fill = (s) => (x.fillStyle = s);
  const bg = (s) => { fill(s); x.fillRect(0, 0, S, S); };
  const dot = (px, py, r, s) => { fill(s); x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); };

  switch (type) {
    case 'beach': {
      bg('#ffffff');
      const cols = ['#ff4d6d', '#ffd23a', '#4dd4ff', '#5be37a', '#b06bff'];
      for (let i = 0; i < cols.length; i++) { fill(cols[i]); x.beginPath(); x.moveTo(c(.5), c(.5)); x.arc(c(.5), c(.5), S, i / cols.length * 7, (i + 1) / cols.length * 7); x.closePath(); x.fill(); }
      dot(c(.5), c(.5), c(.08), '#fff'); break;
    }
    case 'smiley':
      bg('#ffd23a'); dot(c(.37), c(.4), c(.07), '#23201a'); dot(c(.63), c(.4), c(.07), '#23201a');
      x.strokeStyle = '#23201a'; x.lineWidth = c(.06); x.lineCap = 'round'; x.beginPath(); x.arc(c(.5), c(.54), c(.22), 0.25, Math.PI - 0.25); x.stroke(); break;
    case 'donut': {
      bg('#caa07a');                                   // dough
      fill('#ff8fc8'); x.beginPath(); x.arc(c(.5), c(.42), c(.42), 0, 7); x.fill(); // frosting
      const sp = ['#ffffff', '#ffe14d', '#4dd4ff', '#5be37a', '#ff4d6d'];
      for (let i = 0; i < 22; i++) { x.save(); x.translate(Math.random() * S, Math.random() * c(.7)); x.rotate(Math.random() * 7); fill(sp[i % sp.length]); x.fillRect(0, 0, c(.045), c(.02)); x.restore(); }
      break;
    }
    case 'soccer': {
      // shaded white base so it doesn't read as a flat disc
      const rg = x.createRadialGradient(c(.4), c(.36), c(.04), c(.5), c(.5), c(.66));
      rg.addColorStop(0, '#ffffff'); rg.addColorStop(1, '#c3cad6'); fill(rg); x.fillRect(0, 0, S, S);
      const black = '#1a1d24', seam = '#9aa3b2';
      x.lineJoin = 'round'; x.lineCap = 'round';
      const pentPath = (cx, cy, r, rot) => { x.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i / 5 * Math.PI * 2; const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); };
      // seams radiating out to the ring pentagons
      x.strokeStyle = seam; x.lineWidth = c(.028);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; x.beginPath(); x.moveTo(c(.5), c(.5)); x.lineTo(c(.5) + Math.cos(a) * c(.52), c(.5) + Math.sin(a) * c(.52)); x.stroke(); }
      // classic black center pentagon + a ring of five
      fill(black); pentPath(c(.5), c(.5), c(.16), -Math.PI / 2); x.fill();
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; fill(black); pentPath(c(.5) + Math.cos(a) * c(.37), c(.5) + Math.sin(a) * c(.37), c(.12), a + Math.PI); x.fill(); }
      break;
    }
    case 'basket':
      bg('#e0692a'); x.strokeStyle = '#1a1008'; x.lineWidth = c(.03);
      x.beginPath(); x.moveTo(0, c(.5)); x.lineTo(S, c(.5)); x.moveTo(c(.5), 0); x.lineTo(c(.5), S); x.stroke();
      x.beginPath(); x.arc(c(.05), c(.5), c(.46), -1, 1); x.stroke(); x.beginPath(); x.arc(c(.95), c(.5), c(.46), Math.PI - 1, Math.PI + 1); x.stroke(); break;
    case 'eight':
      bg('#141414'); dot(c(.5), c(.42), c(.2), '#fff'); fill('#141414'); x.font = `bold ${c(.26)}px Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('8', c(.5), c(.44)); break;
    case 'melon':
      bg('#3aa052'); fill('#1f6e36'); for (let i = 0; i < 8; i++) x.fillRect(i * c(.125) + c(.03), 0, c(.04), S); break;
    case 'disco':
      for (let yy = 0; yy < 10; yy++) for (let xx = 0; xx < 10; xx++) { fill((xx + yy) % 2 ? '#d2dbea' : '#8b98b0'); x.fillRect(xx * c(.1), yy * c(.1), c(.097), c(.097)); } break;
    case 'panda':
      bg('#f4f4f6'); dot(c(.28), c(.18), c(.12), '#1c1c1f'); dot(c(.72), c(.18), c(.12), '#1c1c1f'); // ears
      dot(c(.36), c(.44), c(.13), '#1c1c1f'); dot(c(.64), c(.44), c(.13), '#1c1c1f');               // eye patches
      dot(c(.36), c(.46), c(.05), '#fff'); dot(c(.64), c(.46), c(.05), '#fff'); dot(c(.37), c(.47), c(.025), '#000'); dot(c(.63), c(.47), c(.025), '#000');
      dot(c(.5), c(.6), c(.045), '#1c1c1f'); break;
    case 'globe':
      bg('#2b7fd4'); fill('#3fa15a'); for (let i = 0; i < 9; i++) { x.beginPath(); const px = Math.random() * S, py = Math.random() * S; x.ellipse(px, py, c(.07 + Math.random() * .06), c(.05 + Math.random() * .05), Math.random() * 7, 0, 7); x.fill(); } break;
    case 'slime':
      bg('#9bff2a'); for (let i = 0; i < 12; i++) dot(Math.random() * S, Math.random() * S, c(.05 + Math.random() * .07), '#5fb81a'); break;
    case 'planet': {
      const cols = ['#d9a05a', '#caa24a', '#e0b070', '#b88840', '#d8a860'];
      for (let i = 0; i < 9; i++) { fill(cols[i % cols.length]); x.fillRect(0, i * c(.111), S, c(.111)); } dot(c(.34), c(.62), c(.06), '#a8722f'); break;
    }
    case 'galaxy':
      bg('#140a2a'); for (let i = 0; i < 200; i++) { const a = i * 0.45, r = i * c(.0026); fill(i % 5 ? '#ffffff' : '#9a6bff'); x.globalAlpha = Math.random() * 0.9 + 0.1; x.fillRect(c(.5) + Math.cos(a) * r, c(.5) + Math.sin(a) * r, c(.012), c(.012)); } x.globalAlpha = 1; break;
    default:
      bg('#cccccc');
  }
}
function pent(x, cx, cy, r, rot) { x.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i / 5 * Math.PI * 2; const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); x.fill(); }
