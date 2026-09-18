/* ============================================================
   Mastery (FCE) — THE FEEL LAYER
   Everything that makes the app feel alive: synthesised sound (no assets),
   haptics, particles, ripples, pointer tilt, count-ups, entrance staggers,
   the "ink dot" character, and celebration moments.
   Rules: transform/opacity only, always cancellable, always respectful of
   prefers-reduced-motion and the user's own Calm-mode setting.
   ============================================================ */
window.FCE = window.FCE || {};
FCE.feel = (function(){
var F = {};
var E = function(){ return FCE.engine; };
/* the feel layer also loads in the headless test harness — never assume a DOM */
var DOM = (typeof document !== 'undefined' && !!document.createElement);
function S(){ var e = E(); return (e && e.state && e.state.settings) ? e.state.settings : {}; }

/* ---------------- preferences ---------------- */
F.calm = function(){
  if(S().motion === 'calm') return true;
  try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; }
};
F.soundOn = function(){ return S().sound !== false; };

/* ---------------- sound: a tiny synthesiser, zero assets ----------------
   Warm, quiet, short. Never a buzzer — a miss gets a soft paper thud, not a scold. */
var actx = null, master = null;
function audio(){
  if(actx !== null) return actx;
  try{
    var AC = window.AudioContext || window.webkitAudioContext;
    if(!AC){ actx = false; return false; }
    actx = new AC();
    master = actx.createGain(); master.gain.value = 0.85;
    var lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6800;
    master.connect(lp); lp.connect(actx.destination);
  }catch(e){ actx = false; }
  return actx;
}
function tone(freq, opt){
  if(!DOM || !F.soundOn()) return;
  var a = audio(); if(!a) return;
  try{
    if(a.state === 'suspended') a.resume();
    opt = opt || {};
    var dur = opt.dur || 0.18;
    var t0 = a.currentTime + (opt.delay || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if(opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, t0 + dur);
    var peak = (opt.gain == null ? 0.055 : opt.gain);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (opt.attack || 0.014));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.04);
  }catch(e){}
}
F.sfx = {
  tick:    function(){ tone(1900, {type:'triangle', dur:0.035, gain:0.016}); },
  select:  function(){ tone(660, {type:'triangle', dur:0.07, gain:0.03, to:880}); },
  ok:      function(){ tone(784, {type:'triangle', dur:0.13, gain:0.05});
                       tone(1175, {type:'triangle', dur:0.26, gain:0.045, delay:0.075}); },
  okFast:  function(){ tone(784, {type:'triangle', dur:0.1, gain:0.05});
                       tone(1175, {type:'triangle', dur:0.1, gain:0.045, delay:0.06});
                       tone(1568, {type:'triangle', dur:0.3, gain:0.04, delay:0.12}); },
  near:    function(){ tone(622, {type:'sine', dur:0.2, gain:0.05, to:660}); },
  miss:    function(){ tone(196, {type:'sine', dur:0.2, gain:0.055, to:150});
                       tone(98,  {type:'sine', dur:0.26, gain:0.035, delay:0.03}); },
  combo:   function(n){ var semis = Math.min(14, (n-2)*2); tone(880*Math.pow(2, semis/12), {type:'triangle', dur:0.16, gain:0.04}); },
  levelUp: function(){ [523,659,784,1046].forEach(function(f,i){ tone(f, {type:'triangle', dur:0.42, gain:0.05, delay:i*0.085}); }); },
  unlock:  function(){ [1318,1760,2093].forEach(function(f,i){ tone(f, {type:'sine', dur:0.3, gain:0.032, delay:i*0.06}); }); },
  done:    function(){ [659,880,1046,1318].forEach(function(f,i){ tone(f, {type:'triangle', dur:0.5, gain:0.042, delay:i*0.1}); }); },
  start:   function(){ tone(440, {type:'triangle', dur:0.22, gain:0.04, to:660}); },
};
F.haptic = function(p){ try{ if(navigator.vibrate && !F.calm()) navigator.vibrate(p); }catch(e){} };

/* ---------------- particles ---------------- */
function fxLayer(){
  if(!DOM) return null;
  var l = document.getElementById('feel-fx');
  if(!l){ l = document.createElement('div'); l.id = 'feel-fx'; document.body.appendChild(l); }
  return l;
}
var INK = ['#E0492F','#C2371F','#C98A2D','#2E7D4F','#1B1C21'];
F.burst = function(target, opt){
  if(!DOM || F.calm()) return;
  opt = opt || {};
  var cx = opt.x, cy = opt.y;
  if(cx == null){
    var el = (typeof target === 'string') ? document.querySelector(target) : target;
    if(!el || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect();
    if(!r.width && !r.height) return;
    cx = r.left + r.width/2; cy = r.top + r.height/2;
  }
  var layer = fxLayer(), n = opt.n || 16, colors = opt.colors || INK, power = opt.power || 110;
  for(var i=0;i<n;i++){
    var p = document.createElement('i');
    p.className = 'fx-p' + (opt.paper ? ' paper' : '');
    var ang = opt.up ? (-Math.PI/2 + (Math.random()-0.5)*(opt.spread || 1.9)) : (Math.random()*Math.PI*2);
    var dist = power * (0.4 + Math.random()*0.8);
    p.style.left = cx + 'px'; p.style.top = cy + 'px';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--tx', (Math.cos(ang)*dist).toFixed(1)+'px');
    p.style.setProperty('--ty', (Math.sin(ang)*dist).toFixed(1)+'px');
    p.style.setProperty('--fall', (opt.fall==null?90:opt.fall)+'px');
    p.style.setProperty('--rot', (Math.random()*600-300).toFixed(0)+'deg');
    p.style.setProperty('--dur', (0.62 + Math.random()*0.55).toFixed(2)+'s');
    p.style.setProperty('--sz', (opt.size || (4 + Math.random()*5)).toFixed(1)+'px');
    layer.appendChild(p);
    (function(node){ setTimeout(function(){ if(node.parentNode) node.parentNode.removeChild(node); }, 1500); })(p);
  }
};
F.rain = function(opt){           /* celebration paper-fall across the viewport */
  if(!DOM || F.calm()) return;
  opt = opt || {};
  var layer = fxLayer(), n = opt.n || 40;
  for(var i=0;i<n;i++){
    var p = document.createElement('i');
    p.className = 'fx-fall';
    p.style.left = (Math.random()*100)+'vw';
    p.style.background = (opt.colors || INK)[i % (opt.colors||INK).length];
    p.style.setProperty('--dur', (1.6 + Math.random()*1.5).toFixed(2)+'s');
    p.style.setProperty('--delay', (Math.random()*0.7).toFixed(2)+'s');
    p.style.setProperty('--rot', (Math.random()*720-360).toFixed(0)+'deg');
    p.style.setProperty('--drift', (Math.random()*160-80).toFixed(0)+'px');
    p.style.width = (4+Math.random()*5).toFixed(1)+'px';
    p.style.height = (7+Math.random()*8).toFixed(1)+'px';
    layer.appendChild(p);
    (function(node){ setTimeout(function(){ if(node.parentNode) node.parentNode.removeChild(node); }, 3600); })(p);
  }
};

/* ---------------- ripple + press feedback ---------------- */
var RIPPLE_SEL = '.btn, .opt, .nav-btn, .conf, .cause, .paper-card, .tab, .lbox';
function ripple(ev){
  var t = ev.target && ev.target.closest ? ev.target.closest(RIPPLE_SEL) : null;
  if(!t || t.disabled) return;
  if(!F.calm()){
    var r = t.getBoundingClientRect();
    var s = document.createElement('span');
    s.className = 'fx-ripple';
    var size = Math.max(r.width, r.height) * 1.6;
    s.style.width = s.style.height = size + 'px';
    s.style.left = ((ev.clientX == null ? r.width/2 : ev.clientX - r.left) - size/2) + 'px';
    s.style.top  = ((ev.clientY == null ? r.height/2 : ev.clientY - r.top) - size/2) + 'px';
    t.appendChild(s);
    setTimeout(function(){ if(s.parentNode) s.parentNode.removeChild(s); }, 640);
  }
  F.sfx.tick();
  F.haptic(6);
}

/* ---------------- pointer tilt + glare (the "3D moment") ---------------- */
var TILT_SEL = '.card.hoverable, .q-card, .paper-card, .grade-card, .story-card, .focus-card';
var tiltEl = null, tiltRaf = 0, tiltX = 0, tiltY = 0;
function tiltMove(ev){
  if(F.calm() || ev.pointerType === 'touch') return;
  var t = ev.target && ev.target.closest ? ev.target.closest(TILT_SEL) : null;
  if(t !== tiltEl){ tiltReset(); tiltEl = t; if(t) t.classList.add('tilting'); }
  if(!t) return;
  var r = t.getBoundingClientRect();
  var px = (ev.clientX - r.left) / r.width, py = (ev.clientY - r.top) / r.height;
  t.style.setProperty('--mx', (px*100).toFixed(1)+'%');
  t.style.setProperty('--my', (py*100).toFixed(1)+'%');
  /* a card you are reading gets a hint of depth; a card you are browsing gets the full moment */
  var damp = t.classList.contains('q-card') ? 0.38 : 1;
  tiltX = (0.5 - py) * 5.5 * damp; tiltY = (px - 0.5) * 6.5 * damp;
  if(!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
}
function applyTilt(){
  tiltRaf = 0;
  if(!tiltEl) return;
  var lift = tiltEl.classList.contains('q-card') ? 0 : -3;
  tiltEl.style.transform = 'perspective(1000px) rotateX('+tiltX.toFixed(2)+'deg) rotateY('+tiltY.toFixed(2)+'deg) translateY('+lift+'px)';
}
function tiltReset(){
  if(!tiltEl) return;
  tiltEl.style.transform = '';
  tiltEl.classList.remove('tilting');
  tiltEl = null;
}

/* ---------------- numbers that count, bars that fill ---------------- */
function easeOut(t){ return 1 - Math.pow(1-t, 3); }
F.count = function(el, to, opt){
  if(!el) return;
  opt = opt || {};
  var from = (opt.from == null ? 0 : opt.from), dec = opt.dec || 0;
  var dur = opt.dur || 900, suf = opt.suffix || '', pre = opt.prefix || '';
  if(F.calm()){ el.textContent = pre + to.toFixed(dec) + suf; return; }
  var t0 = performance.now();
  (function tick(t){
    var f = Math.min(1, (t - t0) / dur);
    el.textContent = pre + (from + (to-from)*easeOut(f)).toFixed(dec) + suf;
    if(f < 1) requestAnimationFrame(tick);
  })(t0);
};
/* [data-count] elements + [data-w] bars, wherever they appear */
F.animateNumbers = function(root, delay){
  if(!DOM) return;
  var els = (root || document).querySelectorAll('[data-count]');
  setTimeout(function(){
    Array.prototype.forEach.call(els, function(el){
      if(el.dataset.counted) return; el.dataset.counted = '1';
      F.count(el, parseFloat(el.dataset.count), {
        dec: +(el.dataset.dec || 0), suffix: el.dataset.suffix || '',
        from: parseFloat(el.dataset.from || 0), dur: +(el.dataset.dur || 900)
      });
    });
    Array.prototype.forEach.call((root||document).querySelectorAll('[data-w]'), function(b){
      b.style.width = b.dataset.w + '%';
    });
  }, delay == null ? 260 : delay);
};

/* ---------------- entrance choreography ---------------- */
F.enter = function(root){
  if(!DOM || F.calm() || !root) return;
  /* .q-card is deliberately absent: its shell already deals itself in — one
     entrance per element, never three stacked on top of each other */
  var sel = '.h-page, .sub, .sec-label, .card, .paper-card, .emg-ribbon, .onb-step';
  var els = Array.prototype.slice.call(root.querySelectorAll(sel)).slice(0, 14);
  els.forEach(function(el, i){
    el.style.setProperty('--d', (i*52)+'ms');
    el.classList.add('fx-in');
  });
};

/* ---------------- the ink dot: the app's face ----------------
   No mascot — the product itself reacts. The dot breathes, thinks, cheers,
   flinches, and occasionally says one short human line. */
var dotTimer = null, sayTimer = null;
F.dot = {
  el: function(){ return DOM ? document.getElementById('tb-dot') : null; },
  set: function(state, ms){
    var d = F.dot.el(); if(!d) return;
    d.className = 'tb-dot is-'+state;
    if(dotTimer) clearTimeout(dotTimer);
    if(ms) dotTimer = setTimeout(function(){ d.className = 'tb-dot is-idle'; }, ms);
  },
  say: function(text, ms){
    if(!DOM) return;
    var s = document.getElementById('tb-say'); if(!s) return;
    if(F.calm()){ s.textContent = text; s.classList.add('on'); }
    else { s.textContent = text; s.classList.remove('on'); void s.offsetWidth; s.classList.add('on'); }
    if(sayTimer) clearTimeout(sayTimer);
    sayTimer = setTimeout(function(){ s.classList.remove('on'); }, ms || 3200);
  },
  happy: function(t){ F.dot.set('happy', 1400); if(t) F.dot.say(t); },
  sad:   function(t){ F.dot.set('sad', 1600); if(t) F.dot.say(t); },
  think: function(t){ F.dot.set('think', 2600); if(t) F.dot.say(t); },
  proud: function(t){ F.dot.set('proud', 2600); if(t) F.dot.say(t); },
};

/* ---------------- combo atmosphere ---------------- */
F.combo = function(n){
  if(!DOM || !document.body) return;
  document.body.setAttribute('data-combo', n >= 8 ? '8' : n >= 5 ? '5' : n >= 3 ? '3' : '0');
};

/* ---------------- flash wash over a card ---------------- */
F.flash = function(el, kind){
  if(!el || F.calm()) return;
  el.classList.remove('fx-wash-ok','fx-wash-bad','fx-wash-near');
  void el.offsetWidth;
  el.classList.add('fx-wash-'+kind);
  setTimeout(function(){ el.classList.remove('fx-wash-'+kind); }, 900);
};
F.shake = function(el){
  if(!el || F.calm()) return;
  el.classList.remove('fx-shake'); void el.offsetWidth; el.classList.add('fx-shake');
  setTimeout(function(){ el.classList.remove('fx-shake'); }, 520);
};
F.pop = function(el){
  if(!el || F.calm()) return;
  el.classList.remove('fx-pop'); void el.offsetWidth; el.classList.add('fx-pop');
};

/* ---------------- idle nudge ---------------- */
F.idle = function(ms, cb){
  if(!DOM) return function(){};
  var t = setTimeout(cb, ms);
  var reset = function(){ clearTimeout(t); t = setTimeout(cb, ms); };
  var stop = function(){ clearTimeout(t); document.removeEventListener('keydown', reset); document.removeEventListener('pointerdown', reset); };
  document.addEventListener('keydown', reset);
  document.addEventListener('pointerdown', reset);
  return stop;
};

/* ---------------- celebrations ---------------- */
var LEVEL_TITLES = ['First Draft','Note-Taker','Proofreader','Compositor','Sub-Editor',
                    'Stylist','Grammarian','Wordsmith','Examiner’s Equal','Master of the Paper'];
F.levelTitle = function(n){ return LEVEL_TITLES[Math.min(n, LEVEL_TITLES.length) - 1] || ('Master · '+n); };
F.overlay = function(html, opt){
  if(!DOM) return {el:null, close:function(){}};
  opt = opt || {};
  var back = document.createElement('div');
  back.className = 'cel-back' + (opt.cls ? ' '+opt.cls : '');
  back.innerHTML = '<div class="cel">'+html+'</div>';
  document.body.appendChild(back);
  requestAnimationFrame(function(){ back.classList.add('on'); });
  var close = function(){
    back.classList.remove('on');
    setTimeout(function(){ if(back.parentNode) back.parentNode.removeChild(back); }, 380);
  };
  back.addEventListener('click', close);
  if(opt.auto !== false) setTimeout(close, opt.ms || 3200);
  return {el:back, close:close};
};
F.levelUp = function(level){
  F.sfx.levelUp(); F.haptic([14,40,14,40,22]);
  var o = F.overlay(
    '<div class="cel-glow"></div>'+
    '<div class="cel-num">'+level+'</div>'+
    '<div class="cel-t">Level '+level+'</div>'+
    '<div class="cel-sub">'+F.levelTitle(level)+'</div>'+
    '<div class="cel-note">The engine just raised what it expects of you.</div>'+
    '<div class="cel-hint">tap to continue</div>', {ms:3600});
  setTimeout(function(){
    var n = o.el.querySelector('.cel-num');
    if(n) F.burst(n, {n:26, power:170, size:6});
  }, 220);
  F.rain({n:28});
  F.dot.proud('Level '+level+'. ' + F.levelTitle(level) + '.');
  return o;
};
F.badgeUnlock = function(badge){
  F.sfx.unlock();
  if(!DOM) return;
  var box = document.getElementById('toasts');
  if(!box) return;
  var t = document.createElement('div');
  t.className = 'toast badge-pop';
  t.innerHTML = '<span class="bp-ic">'+badge.icon+'</span><span><b>Badge earned</b><br>'+badge.name+'</span>';
  box.appendChild(t);
  setTimeout(function(){ F.burst(t, {n:14, power:80, size:4}); }, 180);
  setTimeout(function(){ t.style.opacity = '0'; t.style.transform = 'translateX(30px)'; setTimeout(function(){ if(t.parentNode) t.remove(); }, 420); }, 4200);
};

/* ---------------- praise & encouragement copy ---------------- */
var VOICE = {
  ok:     ['Clean.','That’s the one.','Textbook.','Nailed it.','Exactly right.','Sharp.','Locked in.','That’s exam English.'],
  okFast: ['Instant — that’s automaticity.','No hesitation. Beautiful.','Straight through it.'],
  okHard: ['That was a hard one. Taken.','Difficult item, clean answer.','You just beat an above-level question.'],
  near:   ['So close.','One small step out.','Half the marks — the idea was right.'],
  miss:   ['Not this time.','Missed — and now it’s fuel.','Wrong, usefully.','Not quite. Look once, then move.'],
  spell:  ['Right word, wrong spelling. Cheapest mark there is.','The grammar was yours. The letters weren’t.'],
  back:   ['Back on it.','Straight back up.','Good — that’s the recovery.'],
};
F.voice = function(kind){
  var arr = VOICE[kind] || VOICE.ok;
  return arr[Math.floor(Math.random()*arr.length)];
};

/* ---------------- sound/motion quick toggles ---------------- */
F.toggleSound = function(){
  var e = E(); if(!e) return;
  e.state.settings.sound = !F.soundOn();
  e.save();
  if(F.soundOn()) F.sfx.ok();
  if(FCE.app && FCE.app.buildTopbar) FCE.app.buildTopbar();
  if(FCE.ui && FCE.ui.toast) FCE.ui.toast(F.soundOn() ? '🔊 Sound on' : '🔇 Sound off');
};

/* ---------------- tactile charts: scrub the trend with a finger ---------------- */
function scrub(ev){
  var box = ev.target && ev.target.closest ? ev.target.closest('.chart-tactile[data-spark]') : null;
  if(!box) return;
  var svg = box.querySelector('svg'), tip = box.querySelector('.ct-tip');
  var dot = box.querySelector('.ct-dot'), rule = box.querySelector('.ct-rule');
  if(!svg || !tip) return;
  var data;
  try{ data = JSON.parse(decodeURIComponent(box.dataset.spark)); }catch(e){ return; }
  var w = +box.dataset.sw, h = +box.dataset.sh, pad = 6, n = data.length;
  var r = svg.getBoundingClientRect();
  var sx = (ev.clientX - r.left) * (w / r.width);
  var i = Math.max(0, Math.min(n-1, Math.round((sx - pad) / ((w - 2*pad) / (n-1)))));
  var px = pad + i*(w-2*pad)/(n-1), py = h - pad - data[i]*(h-2*pad);
  if(dot){ dot.setAttribute('cx', px.toFixed(1)); dot.setAttribute('cy', py.toFixed(1)); dot.setAttribute('opacity','1'); }
  if(rule){ rule.setAttribute('x1', px.toFixed(1)); rule.setAttribute('x2', px.toFixed(1)); rule.setAttribute('opacity','.28'); }
  tip.textContent = Math.round(data[i]*100) + '%  ·  session ' + (i+1);
  tip.style.left = (px / w * r.width) + 'px';
  tip.style.top = (py / h * r.height) + 'px';
  tip.classList.add('on');
}
function scrubOut(ev){
  var box = ev.target && ev.target.closest ? ev.target.closest('.chart-tactile') : null;
  if(!box) return;
  var tip = box.querySelector('.ct-tip'), dot = box.querySelector('.ct-dot'), rule = box.querySelector('.ct-rule');
  if(tip) tip.classList.remove('on');
  if(dot) dot.setAttribute('opacity','0');
  if(rule) rule.setAttribute('opacity','0');
}

/* ---------------- init ---------------- */
F.init = function(){
  if(!DOM) return;
  document.addEventListener('pointerdown', ripple, true);
  document.addEventListener('pointermove', tiltMove, {passive:true});
  document.addEventListener('pointermove', scrub, {passive:true});
  document.addEventListener('pointerleave', scrubOut, true);
  document.addEventListener('pointercancel', scrubOut, true);
  document.addEventListener('pointerleave', tiltReset, true);
  document.addEventListener('pointerdown', function unlockAudio(){
    audio();
    document.removeEventListener('pointerdown', unlockAudio);
  });
  fxLayer();
};
return F;
})();
