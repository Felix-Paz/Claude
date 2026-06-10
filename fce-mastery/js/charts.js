/* FCE Mastery — dependency-free SVG charts */
window.FCE = window.FCE || {};
FCE.charts = (function(){
var C = {};
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

/* Semi-circular score gauge, Cambridge scale 122–190, with CI band */
C.gauge = function(scale, ci){
  var min=122, max=190, W=260, H=150, cx=130, cy=132, R=104;
  function ang(v){ return Math.PI * (1 - (v-min)/(max-min)); } // pi..0
  function pt(v, r){ var a=ang(v); return [cx + r*Math.cos(a), cy - r*Math.sin(a)]; }
  function arc(v1,v2,r){
    var p1=pt(v1,r), p2=pt(v2,r);
    var large = (ang(v1)-ang(v2)) > Math.PI ? 1 : 0;
    return 'M'+p1[0].toFixed(1)+' '+p1[1].toFixed(1)+' A'+r+' '+r+' 0 '+large+' 1 '+p2[0].toFixed(1)+' '+p2[1].toFixed(1);
  }
  var zones = [
    [122,140,'#fb7185'],[140,160,'#fbbf24'],[160,173,'#34d399'],[173,180,'#2dd4bf'],[180,190,'#a78bfa']
  ];
  var s = '<svg viewBox="0 0 260 158" style="width:100%;max-width:280px">';
  zones.forEach(function(z){
    s += '<path d="'+arc(z[0],z[1],R)+'" stroke="'+z[2]+'" stroke-width="13" fill="none" stroke-linecap="butt" opacity=".28"/>';
  });
  var lo = Math.max(min, scale-ci), hi = Math.min(max, scale+ci);
  s += '<path d="'+arc(lo,hi,R)+'" stroke="url(#ggrad)" stroke-width="13" fill="none" stroke-linecap="round"/>';
  s += '<defs><linearGradient id="ggrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c6cff"/><stop offset="1" stop-color="#ff5fa2"/></linearGradient></defs>';
  // needle
  var np = pt(Math.max(min,Math.min(max,scale)), R-22);
  s += '<line x1="'+cx+'" y1="'+cy+'" x2="'+np[0].toFixed(1)+'" y2="'+np[1].toFixed(1)+'" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>';
  s += '<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="#fff"/>';
  // threshold labels
  [[140,'140'],[160,'160 pass'],[180,'180 A']].forEach(function(t){
    var p = pt(t[0], R+15);
    s += '<text x="'+p[0].toFixed(1)+'" y="'+p[1].toFixed(1)+'" font-size="8.5" fill="#6b7699" text-anchor="middle">'+t[1]+'</text>';
  });
  s += '</svg>';
  return s;
};

/* Radar / spider chart of skills: data = [{name, val 0..1}] (max 8) */
C.radar = function(data){
  var N = data.length; if(N < 3) return '<div class="tiny">Answer more questions to unlock the radar (3+ skills needed).</div>';
  var W=320, H=290, cx=160, cy=150, R=104;
  function pt(i, r){
    var a = -Math.PI/2 + i*2*Math.PI/N;
    return [cx + r*Math.cos(a), cy + r*Math.sin(a)];
  }
  var s = '<svg viewBox="0 0 320 300" style="width:100%;max-width:360px">';
  [0.25,0.5,0.75,1].forEach(function(f){
    var d = '';
    for(var i=0;i<N;i++){ var p=pt(i,R*f); d += (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1); }
    s += '<path d="'+d+'Z" fill="none" stroke="rgba(255,255,255,.08)"/>';
  });
  for(var i=0;i<N;i++){
    var p = pt(i,R);
    s += '<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" stroke="rgba(255,255,255,.07)"/>';
  }
  var d2 = '';
  for(var j=0;j<N;j++){
    var v = Math.max(0.06, data[j].val);
    var p2 = pt(j, R*v);
    d2 += (j?'L':'M')+p2[0].toFixed(1)+' '+p2[1].toFixed(1);
  }
  s += '<path d="'+d2+'Z" fill="rgba(124,108,255,.22)" stroke="#9d8cff" stroke-width="2"/>';
  for(var k=0;k<N;k++){
    var v2 = Math.max(0.06, data[k].val);
    var pp = pt(k, R*v2);
    s += '<circle cx="'+pp[0].toFixed(1)+'" cy="'+pp[1].toFixed(1)+'" r="3.4" fill="#c4b5fd"/>';
    var lp = pt(k, R+24);
    var anchor = Math.abs(lp[0]-cx)<12 ? 'middle' : (lp[0]>cx ? 'start' : 'end');
    var nm = data[k].name.length > 15 ? data[k].name.slice(0,14)+'…' : data[k].name;
    s += '<text x="'+lp[0].toFixed(1)+'" y="'+(lp[1]+3).toFixed(1)+'" font-size="9.5" fill="#aab3d0" text-anchor="'+anchor+'">'+esc(nm)+'</text>';
  }
  s += '</svg>';
  return s;
};

/* Confidence vs reality grouped bars */
C.calibration = function(rows){
  var W=340, H=190, x0=46, bw=34, gap=64, y0=150, scaleH=120;
  var s = '<svg viewBox="0 0 340 196" style="width:100%;max-width:380px">';
  [0,0.25,0.5,0.75,1].forEach(function(f){
    var y = y0 - f*scaleH;
    s += '<line x1="'+x0+'" y1="'+y+'" x2="320" y2="'+y+'" stroke="rgba(255,255,255,.07)"/>';
    s += '<text x="'+(x0-7)+'" y="'+(y+3)+'" font-size="8.5" fill="#6b7699" text-anchor="end">'+(f*100)+'%</text>';
  });
  rows.forEach(function(r,i){
    var x = x0 + 22 + i*(bw*2+gap);
    var hc = r.claimed*scaleH;
    s += '<rect x="'+x+'" y="'+(y0-hc)+'" width="'+bw+'" height="'+hc+'" rx="5" fill="rgba(255,255,255,.16)"/>';
    if(r.actual !== null){
      var ha = r.actual*scaleH;
      var col = r.actual >= r.claimed-0.07 ? '#34d399' : '#fb7185';
      s += '<rect x="'+(x+bw+5)+'" y="'+(y0-ha)+'" width="'+bw+'" height="'+ha+'" rx="5" fill="'+col+'" opacity=".85"/>';
    } else {
      s += '<text x="'+(x+bw+5)+'" y="'+(y0-8)+'" font-size="8.5" fill="#6b7699">no data</text>';
    }
    s += '<text x="'+(x+bw+2)+'" y="'+(y0+16)+'" font-size="10" fill="#aab3d0" text-anchor="middle">'+r.icon+' '+esc(r.name)+'</text>';
    if(r.att) s += '<text x="'+(x+bw+2)+'" y="'+(y0+30)+'" font-size="8.5" fill="#6b7699" text-anchor="middle">'+r.att+' answers</text>';
  });
  s += '<rect x="'+x0+'" y="178" width="9" height="9" rx="2" fill="rgba(255,255,255,.16)"/><text x="'+(x0+14)+'" y="186" font-size="9" fill="#6b7699">what you claim</text>';
  s += '<rect x="'+(x0+110)+'" y="178" width="9" height="9" rx="2" fill="#34d399"/><text x="'+(x0+124)+'" y="186" font-size="9" fill="#6b7699">what you score</text>';
  s += '</svg>';
  return s;
};

/* Accuracy trend sparkline: data = [0..1] */
C.spark = function(data, w, h){
  w = w||300; h = h||56;
  if(data.length < 2) return '<div class="tiny">Complete two or more sessions to see your trend.</div>';
  var pad=6, n=data.length;
  var pts = data.map(function(v,i){
    return [(pad + i*(w-2*pad)/(n-1)).toFixed(1), (h-pad - v*(h-2*pad)).toFixed(1)];
  });
  var d = pts.map(function(p,i){ return (i?'L':'M')+p[0]+' '+p[1]; }).join('');
  var s = '<svg viewBox="0 0 '+w+' '+h+'" style="width:100%">';
  s += '<path d="'+d+' L'+pts[pts.length-1][0]+' '+(h-2)+' L'+pts[0][0]+' '+(h-2)+'Z" fill="rgba(124,108,255,.13)" stroke="none"/>';
  s += '<path d="'+d+'" fill="none" stroke="#9d8cff" stroke-width="2.2" stroke-linecap="round"/>';
  var last = pts[pts.length-1];
  s += '<circle cx="'+last[0]+'" cy="'+last[1]+'" r="3.4" fill="#fff"/>';
  s += '</svg>';
  return s;
};

/* Progress ring */
C.ring = function(frac, label, sub, color){
  frac = Math.max(0, Math.min(1, frac||0));
  var R=34, CIRC=2*Math.PI*R;
  return '<div style="text-align:center">'+
    '<svg viewBox="0 0 84 84" style="width:84px;height:84px">'+
    '<circle cx="42" cy="42" r="'+R+'" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="7"/>'+
    '<circle cx="42" cy="42" r="'+R+'" fill="none" stroke="'+(color||'#9d8cff')+'" stroke-width="7" stroke-linecap="round" '+
    'stroke-dasharray="'+CIRC.toFixed(1)+'" stroke-dashoffset="'+(CIRC*(1-frac)).toFixed(1)+'" transform="rotate(-90 42 42)"/>'+
    '<text x="42" y="47" font-size="17" font-weight="800" fill="#eef1fb" text-anchor="middle">'+esc(label)+'</text>'+
    '</svg>'+
    '<div class="tiny" style="margin-top:2px">'+esc(sub||'')+'</div></div>';
};

/* heat color for error rate 0..1 (null = grey) */
C.heatColor = function(err){
  if(err === null) return 'rgba(255,255,255,.05)';
  if(err < 0.15) return 'rgba(52,211,153,.18)';
  if(err < 0.3)  return 'rgba(45,212,191,.16)';
  if(err < 0.45) return 'rgba(251,191,36,.18)';
  if(err < 0.65) return 'rgba(249,115,22,.22)';
  return 'rgba(251,113,133,.28)';
};
C.heatBorder = function(err){
  if(err === null) return 'rgba(255,255,255,.09)';
  if(err < 0.15) return 'rgba(52,211,153,.4)';
  if(err < 0.3)  return 'rgba(45,212,191,.4)';
  if(err < 0.45) return 'rgba(251,191,36,.4)';
  if(err < 0.65) return 'rgba(249,115,22,.45)';
  return 'rgba(251,113,133,.55)';
};
return C;
})();
