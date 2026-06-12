/* Mastery (FCE Edition) — adaptive engine. 100% on-device.
   Elo ability · skill mastery with forgetting · spaced repetition · answer diagnosis
   (spelling / word-family / word-class) · behavioural confidence inference ·
   error generalization (reinforce the CONCEPT in new exercises) · grade prediction. */
window.FCE = window.FCE || {};
(function(){
var E = FCE.engine = {};
var KEY = 'fce-mastery-state-v1';
var DAY = 86400000;

/* ---------------- state ---------------- */
E.blank = function(){
  return {
    v:2, name:'', examDate:'', createdAt:Date.now(), onboarded:false,
    settings:{dailyGoal:20, emergency:false, lite:'auto'},
    xp:0, streak:{count:0, last:''}, badges:[], records:{bestRun:0, bestAcc:0, total:0},
    week:{id:'', counts:{}},
    ability:{kwt:1150, cloze:1150, wf:1150, mcc:1150},
    tags:{}, items:{}, gaps:{},
    calib:{g:{att:0,cor:0}, f:{att:0,cor:0}, s:{att:0,cor:0}},
    log:[], sessions:[], mocks:[], trend:[],
    passSeen:{},
    beh:{ n:0, ttfkSum:0, editSum:0, pauseSum:0, changed:0, changedRight:0, selfCorrect:0, hiddenHesit:0, fluentSure:0, skips:0, fastRight:0, keySum:0, typeMsSum:0 },
    boost:{},            // tag -> remaining reinforcement count (error generalization)
    pos:{},              // open-cloze positional fingerprints: where in the sentence you fail
    vocab:{},            // essay-vocab Leitner boxes: word -> {box,due,att,cor}
    wants:{},            // itemId -> {t, tag, cleared:0} — "I want to master this"
    accepts:{},          // itemId -> [extra accepted answers] (user reported "I was right")
    reports:[],          // {t,id,user} app-mistake reports
    spell:{pat:{}, words:{}}, // spelling-error patterns + the exact words missed
    spellSeen:{},        // spelling-gym word -> wins
  };
};
E.state = null;
E.load = function(){
  try{
    var raw = localStorage.getItem(KEY);
    E.state = raw ? JSON.parse(raw) : E.blank();
  }catch(e){ E.state = E.blank(); }
  if(!E.state.v) E.state = E.blank();
  var b = E.blank(); // migrate forward: fill anything missing
  Object.keys(b).forEach(function(k){ if(E.state[k] === undefined) E.state[k] = b[k]; });
  ['boost','wants','accepts','passSeen','spellSeen'].forEach(function(k){ if(!E.state[k]) E.state[k]={}; });
  if(!E.state.spell) E.state.spell = {pat:{}, words:{}};
  if(!E.state.reports) E.state.reports = [];
  if(!E.state.settings.lite) E.state.settings.lite = 'auto';
  return E.state;
};
E.save = function(){ try{ localStorage.setItem(KEY, JSON.stringify(E.state)); }catch(e){} };
E.reset = function(){ E.state = E.blank(); E.save(); };
E.export = function(){ return JSON.stringify(E.state, null, 1); };
E.import = function(json){ var s = JSON.parse(json); if(!s || !s.v) throw new Error('bad file'); E.state = s; E.load2(); E.save(); };
E.load2 = function(){ var b=E.blank(); Object.keys(b).forEach(function(k){ if(E.state[k]===undefined) E.state[k]=b[k]; }); };

/* ---------------- bank access ---------------- */
E.allItems = function(){
  var B = FCE.BANK, out = [];
  B.kwt.forEach(function(q){ out.push({q:q, type:'kwt'}); });
  B.cloze.forEach(function(q){ out.push({q:q, type:'cloze'}); });
  B.wf.forEach(function(q){ out.push({q:q, type:'wf'}); });
  B.mcc.forEach(function(q){ out.push({q:q, type:'mcc'}); });
  return out;
};
E.byId = {};
E.indexBank = function(){ E.allItems().forEach(function(it){ E.byId[it.q.id] = it; }); };
E.itemState = function(id){
  var s = E.state.items[id];
  if(!s){ s = E.state.items[id] = {att:0,cor:0,last:0,due:0,ivl:0,ease:2.3,lapses:0,conf:'',hist:[]}; }
  if(!s.hist) s.hist = [];
  return s;
};
E.tagState = function(tag){
  var s = E.state.tags[tag];
  if(!s){ s = E.state.tags[tag] = {att:0,cor:0,m:0.5,last:0,lapses:0,causes:{},hist:[]}; }
  return s;
};

/* ---------------- normalization & grading ---------------- */
E.norm = function(s){
  return String(s||'').toLowerCase()
    .replace(/[‘’ʼ]/g,"'").replace(/[“”]/g,'"')
    .replace(/\s+/g,' ').trim()
    .replace(/[.!?,;:]+$/g,'').trim();
};
E.wordCount = function(s){
  var t = E.norm(s); if(!t) return 0;
  var toks = t.split(' '), n = 0;
  toks.forEach(function(w){ n += 1; if(/[a-z]'(t|s|ll|re|ve|d|m)\b/.test(w)) n += 1; });
  return n;
};
function userAccepts(q, u){
  var ex = E.state.accepts[q.id];
  return !!(ex && ex.indexOf(u) !== -1);
}
E.gradeKWT = function(q, user){
  var u = E.norm(user);
  var full = q.ans.some(function(a){ return E.norm(a) === u; }) || userAccepts(q, u);
  if(full) return {score:2, ok:true};
  var hits = 0;
  q.halves.forEach(function(h){
    if(h.some(function(a){ return u.indexOf(E.norm(a)) !== -1; })) hits++;
  });
  return {score: hits >= 1 ? 1 : 0, ok:false};
};
E.gradeOne = function(q, user){
  var u = E.norm(user);
  return q.ans.some(function(a){ return E.norm(a) === u; }) || userAccepts(q, u);
};

/* ---------------- answer diagnosis (what KIND of wrong was it?) ---------------- */
E.lev = function(a, b){
  a = String(a); b = String(b);
  if(Math.abs(a.length-b.length) > 3) return 99;
  var m = [], i, j;
  for(i=0;i<=b.length;i++) m[i]=[i];
  for(j=0;j<=a.length;j++) m[0][j]=j;
  for(i=1;i<=b.length;i++) for(j=1;j<=a.length;j++)
    m[i][j] = Math.min(m[i-1][j]+1, m[i][j-1]+1, m[i-1][j-1] + (b[i-1]===a[j-1]?0:1));
  return m[b.length][a.length];
};
E.classOf = function(w){
  w = E.norm(w);
  var order = ['art','modal','aux','rel','pron','det','comp','prep','advpart','link'];
  for(var i=0;i<order.length;i++){
    if(FCE.WORDCLASS[order[i]].indexOf(w) !== -1) return order[i];
  }
  return null;
};
function stemOverlap(a, b){
  var n = 0, L = Math.min(a.length, b.length);
  while(n < L && a[n] === b[n]) n++;
  return n;
}
/* Returns {code, msg, right} — codes: blank | spell | family | class | key | half | wrong */
E.diagnose = function(q, type, user){
  var u = E.norm(user);
  var best = E.norm(q.ans[0]);
  if(!u) return {code:'blank', msg:'Left blank — in the real exam ALWAYS write something; blanks score zero with certainty.', right:best};
  if(type === 'kwt'){
    if(u.indexOf(E.norm(q.key)) === -1)
      return {code:'key', msg:'Your answer doesn’t contain the key word “'+q.key+'” — Cambridge gives 0 even if the grammar is perfect.', right:best};
    var hits = 0;
    q.halves.forEach(function(h){ if(h.some(function(a){ return u.indexOf(E.norm(a)) !== -1; })) hits++; });
    if(hits === 1) return {code:'half', msg:'Half right — one of the two marking chunks is there. In the exam this earns 1 of 2 marks.', right:best};
    return {code:'wrong', msg:'', right:best};
  }
  // single-word answers (cloze / wf)
  var bestDist = 99, bestAns = best;
  q.ans.forEach(function(a){
    var d = E.lev(u, E.norm(a));
    if(d < bestDist){ bestDist = d; bestAns = E.norm(a); }
  });
  var tol = bestAns.length >= 7 ? 2 : 1;
  if(bestDist > 0 && bestDist <= tol)
    return {code:'spell', msg:'You had the right word — the spelling betrayed you: “'+user.trim()+'” → “'+bestAns+'”. At Cambridge, spelling is all-or-nothing.', right:bestAns};
  var ov = stemOverlap(u, bestAns);
  if(ov >= 4 && Math.abs(u.length - bestAns.length) <= 5)
    return {code:'family', msg:'Right word family, wrong form: “'+user.trim()+'” vs “'+bestAns+'”. Re-read the sentence — what part of speech does the gap demand?', right:bestAns};
  if(type === 'cloze' && q.gt && FCE.GT2CLASS[q.gt]){
    var need = FCE.GT2CLASS[q.gt], got = E.classOf(u);
    if(got && got !== need)
      return {code:'class', msg:'You wrote a '+FCE.CLASSNAMES[got]+' (“'+user.trim()+'”), but this gap needs a '+FCE.CLASSNAMES[need]+'. Look at the words either side of the gap.', right:bestAns};
  }
  return {code:'wrong', msg:'', right:bestAns};
};
/* Spelling error pattern classifier */
E.spellPattern = function(wrong, right){
  wrong = E.norm(wrong); right = E.norm(right);
  function squash(s){ return s.replace(/(.)\1+/g,'$1'); }
  if(squash(wrong) === squash(right)) return {id:'double', name:'double letters', tip:'Your enemy is the double letter (occurrence, beginning, necessary). Say the word slowly and tap each doubled letter twice.'};
  if(wrong.replace(/ie/g,'ei') === right || wrong.replace(/ei/g,'ie') === right) return {id:'ie', name:'ie / ei order', tip:'I before E except after C — and learn the rebels (foreign, height) by heart.'};
  if(wrong.replace(/tion/g,'sion') === right || wrong.replace(/sion/g,'tion') === right) return {id:'tion', name:'-tion vs -sion', tip:'decide→decision, explain→explanation: the verb’s final sound usually decides T or S.'};
  var wv = wrong.replace(/[aeiou]/g,'•'), rv = right.replace(/[aeiou]/g,'•');
  if(wv === rv && wrong !== right) return {id:'vowel', name:'weak vowel choice', tip:'Unstressed vowels all sound like “uh” (separate, definite). Anchor the letter visually: sep-A-rate has A RAT in it.'};
  if(wrong.length === right.length - 1 && right.indexOf('e') !== -1) return {id:'silente', name:'dropped letters', tip:'A letter is going missing — usually a silent E or a quiet N (government). Write the word out by hand, slowly, once.'};
  if(wrong.length === right.length && squash(wrong) !== wrong) return {id:'double', name:'double letters', tip:'Check which letter doubles — and which doesn’t (until has one L).'};
  return {id:'other', name:'letter order / shape', tip:'Photograph the word: write it large, circle the danger zone, then write it twice from memory.'};
};

/* ---------------- Elo, mastery, forgetting ---------------- */
E.qElo = function(q){ return 950 + (q.diff||2)*110; };
E.pWin = function(ability, qe){ return 1/(1+Math.pow(10,(qe-ability)/400)); };
E.updAbility = function(type, q, ok){
  var a = E.state.ability, n = E.state.records.total;
  var k = n < 30 ? 40 : (n < 120 ? 28 : 18);
  var p = E.pWin(a[type], E.qElo(q));
  a[type] = Math.max(700, Math.min(1700, a[type] + k*((ok?1:0)-p)));
};
E.recordTag = function(tag, ok, weight){
  var t = E.tagState(tag);
  t.att++; if(ok) t.cor++;
  var alpha = Math.min(0.5, Math.max(0.12, 1/(t.att)) * (weight||1));
  t.m = Math.max(0, Math.min(1, t.m + alpha*((ok?1:0) - t.m)));
  // Bayesian track: Beta(a,b) posterior — gives the coach calibrated uncertainty
  t.a = (t.a||1) + (weight||1)*(ok?1:0);
  t.b = (t.b||1) + (weight||1)*(ok?0:1);
  if(!ok) t.lapses++;
  t.last = Date.now();
  t.hist.push(ok?1:0); if(t.hist.length>30) t.hist.shift();
};
/* Beta posterior with time-decay toward the prior (unused skills become uncertain again) */
E.mBeta = function(tag){
  var t = E.state.tags[tag];
  if(!t || !t.att) return {mean:0.5, sd:0.29, n:0};
  var days = (Date.now()-t.last)/DAY;
  var f = Math.exp(-days/14);
  var a = 1 + ((t.a||1)-1)*f, b = 1 + ((t.b||1)-1)*f;
  var mean = a/(a+b);
  var sd = Math.sqrt(a*b/((a+b)*(a+b)*(a+b+1)));
  return {mean:mean, sd:sd, n:t.att};
};
var gaussSpare = null;
function gauss(){
  if(gaussSpare !== null){ var s = gaussSpare; gaussSpare = null; return s; }
  var u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  var r = Math.sqrt(-2*Math.log(u));
  gaussSpare = r*Math.sin(2*Math.PI*v);
  return r*Math.cos(2*Math.PI*v);
}
E.mEff = function(tag){
  var t = E.state.tags[tag];
  if(!t || !t.att) return null;
  var days = (Date.now()-t.last)/DAY;
  return 0.5 + (t.m-0.5)*Math.exp(-days/12);
};
E.tagTrend = function(tag){
  var t = E.state.tags[tag];
  if(!t || t.hist.length < 6) return 0;
  var h = t.hist, mid = Math.floor(h.length/2);
  var a = h.slice(0,mid), b = h.slice(mid);
  return b.reduce(function(x,y){return x+y;},0)/b.length - a.reduce(function(x,y){return x+y;},0)/a.length;
};

/* ---------------- expected pace ---------------- */
E.par = function(type, diff){
  var base = {mcc:35, cloze:35, wf:35, kwt:60}[type] || 40;
  return Math.round(base * (0.75 + 0.125*(diff||3)));
};

/* ---------------- spaced repetition ---------------- */
E.schedule = function(id, ok, conf, fast){
  var it = E.itemState(id), now = Date.now();
  if(ok){
    var lucky = (conf === 'g');
    if(it.ivl === 0) it.ivl = lucky ? 0.25 : (fast ? 1.6 : 1);
    else it.ivl = Math.min(15, it.ivl * (lucky ? 1.2 : it.ease) * (fast ? 1.15 : 1));
    it.ease = Math.min(2.8, it.ease + (conf==='s' ? 0.08 : 0.02));
  }else{
    it.lapses++; it.ivl = 0.2;
    it.ease = Math.max(1.4, it.ease - (conf==='s' ? 0.3 : 0.18));
  }
  it.due = now + it.ivl*DAY;
};
E.dueItems = function(){
  var now = Date.now(), out = [];
  Object.keys(E.state.items).forEach(function(id){
    var it = E.state.items[id];
    if(it.att > 0 && it.due && it.due <= now && E.byId[id]) out.push(id);
  });
  out.sort(function(a,b){ return E.state.items[a].due - E.state.items[b].due; });
  return out;
};
E.leeches = function(){
  return Object.keys(E.state.items).filter(function(id){
    var it = E.state.items[id];
    return it.lapses >= 3 && E.byId[id];
  });
};
/* wobbly = right-wrong-right-wrong pattern: it isn't sticking */
E.isWobbly = function(id){
  var it = E.state.items[id];
  if(!it || !it.hist || it.hist.length < 3) return false;
  var flips = 0;
  for(var i=1;i<it.hist.length;i++) if(it.hist[i] !== it.hist[i-1]) flips++;
  return flips >= 2 && it.hist.indexOf(0) !== -1;
};

/* ---------------- behavioural confidence inference ---------------- */
E.inferConf = function(beh, ms, parMs){
  if(!beh) return 'f';
  var hesit = (beh.ttfk||0) > 4000 || (beh.edits||0) >= 6 || (beh.pauses||0) >= 2 || beh.changed;
  var fluent = (beh.ttfk||0) > 0 && (beh.ttfk||0) < 2600 && (beh.edits||0) <= 1 && !beh.changed && ms < parMs;
  if(fluent) return 's';
  if(hesit) return 'g';
  return 'f';
};

/* ---------------- the master record call ---------------- */
E.record = function(q, type, ok, conf, ms, user, cause, opts){
  opts = opts || {};
  var st = E.state, now = Date.now();
  var parMs = E.par(type, q.diff) * 1000;
  var beh = opts.beh;
  var declared = !!conf;
  var effConf = conf || E.inferConf(beh, ms||parMs, parMs);
  var fast = ok && ms > 0 && ms < parMs*0.8 && (!beh || (beh.edits||0) <= 1);

  var w = 1;
  if(!ok && effConf==='s') w = 1.3;
  if(ok && effConf==='g') w = 0.5;
  if(fast) w *= 1.1;
  (q.tags||[]).forEach(function(t){ E.recordTag(t, ok, w); });

  if(type==='cloze' && q.gt){
    var g = st.gaps[q.gt] || (st.gaps[q.gt]={att:0,cor:0,recent:[]});
    g.att++; if(ok) g.cor++;
    g.recent.push(ok?1:0); if(g.recent.length>14) g.recent.shift();
  }
  if(type==='cloze' && q.s) E.recPos(q, ok);
  var it = E.itemState(q.id);
  it.att++; if(ok) it.cor++; it.last = now; it.conf = effConf;
  it.hist.push(ok?1:0); if(it.hist.length>10) it.hist.shift();
  E.schedule(q.id, ok, effConf, fast);
  E.updAbility(type, q, ok);
  if(declared && st.calib[conf]){ st.calib[conf].att++; if(ok) st.calib[conf].cor++; }

  var entry = {t:now, id:q.id, type:type, tags:q.tags||[], gt:q.gt||'', ok:ok?1:0,
               conf:declared?conf:'', iconf:effConf, ms:ms||0, cause:cause||'', user:String(user||'').slice(0,80)};
  if(opts.diag) entry.diag = opts.diag.code;
  if(beh){
    entry.beh = beh;
    var B = st.beh;
    B.n++; B.ttfkSum += beh.ttfk||0; B.editSum += beh.edits||0; B.pauseSum += beh.pauses||0;
    B.keySum += beh.keys||0; B.typeMsSum += beh.typeMs||0;
    if(beh.skipped) B.skips++;
    if(beh.changed){
      B.changed++;
      if(beh.firstRight && !ok) B.changedRight++;
      if(!beh.firstRight && ok) B.selfCorrect++;
    }
    var hes = (beh.ttfk||0) > 4000 || (beh.edits||0) >= 6 || (beh.pauses||0) >= 2;
    if(declared && conf==='s' && hes) B.hiddenHesit++;
    if(declared && conf==='g' && !hes && !beh.changed && ok) B.fluentSure++;
    if(fast) B.fastRight++;
    if(ok && hes){ it.ivl = Math.max(0.2, it.ivl*0.8); it.due = now + it.ivl*DAY; }
  }
  st.log.push(entry);
  if(st.log.length > 1500) st.log = st.log.slice(-1200);

  /* spelling intelligence */
  if(opts.diag && opts.diag.code === 'spell'){
    var sp = E.spellPattern(user, opts.diag.right);
    st.spell.pat[sp.id] = (st.spell.pat[sp.id]||0)+1;
    st.spell.words[opts.diag.right] = (st.spell.words[opts.diag.right]||0)+1;
    entry.cause = entry.cause || 'spell';
    var ts0 = q.tags||[]; ts0.forEach(function(t){ var s2=E.tagState(t); s2.causes.spell=(s2.causes.spell||0)+1; });
  }

  /* error generalization: a miss boosts the CONCEPT, so the idea returns in NEW exercises */
  if(!ok){
    (q.tags||[]).slice(0,2).forEach(function(t){
      st.boost[t] = Math.min(9, (st.boost[t]||0) + (E.isWobbly(q.id) ? 4 : 3));
    });
  } else {
    // wants clearing: a wanted item answered correctly twice in a row clears
    var wnt = st.wants[q.id];
    if(wnt){
      wnt.cleared = (wnt.cleared||0)+1;
      if(wnt.cleared >= 2){
        delete st.wants[q.id];
        var clearedCount = (st.wantsCleared = (st.wantsCleared||0)+1);
        if(clearedCount >= 3) E.award('wants');
        if(FCE.ui && FCE.ui.toast) FCE.ui.toast('🎯 Mastered: that one is off your Mastery List.');
      }
    }
  }

  st.records.total++;
  if(ok){ st.xp += 8 + (q.diff||2)*4 + (fast?4:0) + (effConf==='s'&&declared?3:0); } else { st.xp += 2; }
  E.touchStreak();
  E.bumpWeek(type, ok);
  if(!opts.quiet){ E.checkBadges(opts.runStreak||0); }
  E.save();
  return {fast:fast, effConf:effConf, declared:declared};
};
E.setCause = function(cause){
  var l = E.state.log[E.state.log.length-1];
  if(!l || l.ok) return;
  l.cause = cause;
  (l.tags||[]).forEach(function(t){
    var ts = E.tagState(t);
    ts.causes[cause] = (ts.causes[cause]||0)+1;
  });
  E.save();
};

/* "I was actually right" — accept the user's answer, repair the stats, log a report */
E.amend = function(qid){
  var st = E.state;
  var l = null;
  for(var i=st.log.length-1;i>=0;i--){ if(st.log[i].id===qid){ l = st.log[i]; break; } }
  if(!l || l.ok) return false;
  var u = E.norm(l.user);
  if(!u) return false;
  l.ok = 1; l.amended = true;
  (st.accepts[qid] = st.accepts[qid] || []).push(u);
  st.reports.push({t:Date.now(), id:qid, user:l.user});
  (l.tags||[]).forEach(function(t){
    var ts = E.tagState(t);
    ts.cor++; ts.lapses = Math.max(0, ts.lapses-1);
    ts.m = Math.min(1, ts.m + 0.25*(1-ts.m));
    if(ts.hist.length) ts.hist[ts.hist.length-1] = 1;
  });
  var it = E.itemState(qid);
  it.cor++; it.lapses = Math.max(0, it.lapses-1);
  if(it.hist.length) it.hist[it.hist.length-1] = 1;
  it.ivl = 2; it.due = Date.now() + 2*DAY;
  if(l.gt && st.gaps[l.gt]){ st.gaps[l.gt].cor++; if(st.gaps[l.gt].recent.length) st.gaps[l.gt].recent[st.gaps[l.gt].recent.length-1]=1; }
  (l.tags||[]).slice(0,2).forEach(function(t){ if(st.boost[t]) st.boost[t] = Math.max(0, st.boost[t]-2); });
  st.xp += 12;
  E.save();
  return true;
};

/* "I want to master this" */
E.addWant = function(qid){
  var it = E.byId[qid]; if(!it) return;
  E.state.wants[qid] = {t:Date.now(), tag:(it.q.tags||[])[0]||'', cleared:0};
  (it.q.tags||[]).slice(0,2).forEach(function(t){
    E.state.boost[t] = Math.min(10, (E.state.boost[t]||0) + 5);
  });
  E.save();
};

/* ---------------- streak / week / badges ---------------- */
E.today = function(){ return new Date().toISOString().slice(0,10); };
E.touchStreak = function(){
  var s = E.state.streak, today = E.today();
  if(s.last === today) return;
  var y = new Date(Date.now()-DAY).toISOString().slice(0,10);
  s.count = (s.last === y) ? s.count+1 : 1;
  s.last = today;
};
E.weekId = function(){
  var d = new Date(); var onejan = new Date(d.getFullYear(),0,1);
  var wk = Math.ceil((((d - onejan)/DAY) + onejan.getDay()+1)/7);
  return d.getFullYear()+'-'+wk;
};
E.challenge = function(){
  var wid = E.weekId();
  if(E.state.week.id !== wid){ E.state.week = {id:wid, counts:{}}; }
  var list = FCE.CHALLENGES;
  var idx = parseInt(wid.split('-')[1],10) % list.length;
  var ch = list[idx];
  var c = E.state.week.counts;
  var prog = ch.type==='correct' ? (c.correct||0) : (c[ch.type]||0);
  return {ch:ch, prog:Math.min(prog, ch.n), done:prog>=ch.n};
};
E.bumpWeek = function(type, ok){
  E.challenge();
  var c = E.state.week.counts;
  c[type] = (c[type]||0)+1;
  if(ok) c.correct = (c.correct||0)+1;
};
E.award = function(id){
  if(E.state.badges.indexOf(id) !== -1) return false;
  E.state.badges.push(id);
  var b = FCE.BADGES.filter(function(x){return x.id===id;})[0];
  if(b && FCE.ui && FCE.ui.toast) FCE.ui.toast(b.icon+' Badge earned: <b>'+b.name+'</b>', 'gold');
  return true;
};
E.checkBadges = function(runStreak){
  var st = E.state;
  if(st.records.total >= 50) E.award('q50');
  if(st.records.total >= 200) E.award('q200');
  if(st.streak.count >= 3) E.award('streak3');
  if(st.streak.count >= 7) E.award('streak7');
  if(runStreak >= 10) E.award('perfect10');
  if(st.calib.s.att >= 25 && st.calib.s.cor/st.calib.s.att >= 0.9) E.award('calib');
  var types = {}; st.log.forEach(function(l){ types[l.type]=1; });
  if(types.kwt && types.cloze && types.wf && types.mcc) E.award('allparts');
  var cb = Object.keys(st.items).some(function(id){ var it=st.items[id]; return it.lapses>=3 && it.ivl>=2; });
  if(cb) E.award('comeback');
};
E.level = function(){ return Math.floor(Math.sqrt(E.state.xp/90)) + 1; };
/* human-readable difficulty tier from average Elo ability */
E.difficultyTier = function(){
  var a = E.state.ability;
  var avg = (a.kwt + a.cloze + a.wf + a.mcc) / 4;
  if(avg < 1080) return {name:'Foundation',  desc:'easier items while the engine maps you', icon:'•'};
  if(avg < 1180) return {name:'Developing',  desc:'core B2 difficulty', icon:'••'};
  if(avg < 1280) return {name:'Exam level',  desc:'true FCE paper difficulty', icon:'•••'};
  if(avg < 1380) return {name:'Sharp',       desc:'above-paper difficulty — building margin', icon:'••••'};
  return {name:'Distinction', desc:'C1-leaning items — grade-A training', icon:'•••••'};
};
E.levelProgress = function(){
  var lvl = E.level();
  var cur = Math.pow(lvl-1,2)*90, next = Math.pow(lvl,2)*90;
  return (E.state.xp-cur)/(next-cur);
};

/* ---------------- grade prediction (Cambridge scale 122–190) ---------------- */
var SCALE_MAP = [[0,126],[0.25,148],[0.40,158],[0.50,164],[0.60,170],[0.72,177],[0.82,183],[0.92,188],[1,190]];
function toScale(p){
  for(var i=0;i<SCALE_MAP.length-1;i++){
    if(p >= SCALE_MAP[i][0] && p <= SCALE_MAP[i+1][0]){
      var f = (p-SCALE_MAP[i][0])/(SCALE_MAP[i+1][0]-SCALE_MAP[i][0] || 1);
      return SCALE_MAP[i][1] + f*(SCALE_MAP[i+1][1]-SCALE_MAP[i][1]);
    }
  }
  return 126;
}
/* Integrate ability over the item bank's real difficulty distribution (self-calibrating) */
var diffHist = null;
function bankDiffHist(){
  if(diffHist) return diffHist;
  diffHist = {kwt:{}, cloze:{}, wf:{}, mcc:{}};
  var counts = {kwt:0, cloze:0, wf:0, mcc:0};
  E.allItems().forEach(function(it){
    var d = it.q.diff||3;
    diffHist[it.type][d] = (diffHist[it.type][d]||0)+1;
    counts[it.type]++;
  });
  Object.keys(diffHist).forEach(function(t){
    Object.keys(diffHist[t]).forEach(function(d){ diffHist[t][d] /= counts[t]||1; });
  });
  return diffHist;
}
E.expectedAccuracy = function(){
  var a = E.state.ability, acc = {}, H = bankDiffHist();
  ['kwt','cloze','wf','mcc'].forEach(function(t){
    var s = 0, h = H[t];
    Object.keys(h).forEach(function(d){ s += h[d]*E.pWin(a[t], 950 + (+d)*110); });
    acc[t] = s || E.pWin(a[t], 950+3*110);
  });
  return {p:(8*acc.mcc + 8*acc.cloze + 8*acc.wf + 12*acc.kwt)/36, per:acc};
};
E.predict = function(){
  var n = E.state.records.total;
  var ex = E.expectedAccuracy(), p = ex.p;
  var recent = E.state.log.slice(-80);
  if(recent.length >= 10){
    var obs = recent.reduce(function(x,l){return x+l.ok;},0)/recent.length;
    p = 0.55*p + 0.45*obs;
  }
  // practice here is deliberately harder than the exam (desirable difficulty) — correct for it
  p = Math.min(1, p*1.05 + 0.02);
  var scale = toScale(p);
  if(E.state.mocks.length){
    var last = E.state.mocks[E.state.mocks.length-1];
    scale = 0.55*scale + 0.45*last.scale;
  }
  var ci = Math.max(2.5, 22/Math.sqrt(n+3));
  var sd = ci/1.6;
  var phi = function(z){
    var t = 1/(1+0.2316419*Math.abs(z));
    var d = 0.3989423*Math.exp(-z*z/2);
    var pr = d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
    return z>0 ? 1-pr : pr;
  };
  var pAbove = function(th){ return 1-phi((th-scale)/sd); };
  var pA = pAbove(180), pB = Math.max(0,pAbove(173)-pA), pC = Math.max(0,pAbove(160)-pA-pB);
  var grade = scale>=180 ? 'A' : scale>=173 ? 'B' : scale>=160 ? 'C' : scale>=140 ? 'B1' : '—';
  var borderline = Math.abs(scale-160)<=ci || Math.abs(scale-173)<=ci || Math.abs(scale-180)<=ci;
  var label = grade==='A' ? 'Grade A — top 2% territory'
            : grade==='B' ? 'Grade B — strong pass'
            : grade==='C' ? 'Grade C — a pass'
            : grade==='B1' ? 'Just below pass (B1 certificate)'
            : 'Below pass — keep building';
  return {
    scale:Math.round(scale), ci:Math.round(ci), p:p, n:n, per:ex.per,
    pass:pAbove(160), pA:pA, pB:pB, pC:pC,
    grade:grade, label:label, borderline:borderline,
    cefr: scale>=180 ? 'C1' : scale>=160 ? 'B2' : scale>=140 ? 'B1' : 'A2–B1',
  };
};

/* ---------------- coach ---------------- */
E.coach = function(sampled){
  var recs = [];
  Object.keys(FCE.TAGS).forEach(function(tag){
    var meta = FCE.TAGS[tag];
    var m = E.mEff(tag);
    var t = E.state.tags[tag];
    var mb = E.mBeta(tag);
    var why, seen = !!(t && t.att);
    // risk: Bayesian. Selection THOMPSON-SAMPLES the posterior (smart exploration);
    // the displayed coach is deterministic, and a CONFIRMED weakness must outrank a merely
    // unexplored skill — so unseen risk is capped below evidence-backed risk.
    var risk;
    if(sampled){
      risk = Math.max(0, Math.min(1, 1 - (mb.mean + mb.sd*gauss())));
    } else if(!seen){
      risk = 0.46;
    } else {
      risk = Math.max(0, Math.min(1, (1 - mb.mean) + 0.22*mb.sd));
    }
    if(!seen){ why = 'Not tested yet — unknown territory is risk.'; }
    else{
      var days = (Date.now()-t.last)/DAY;
      if(days > 3 && t.m > 0.6){ risk += 0.12; why = 'Was solid, but untouched for '+Math.round(days)+' days — forgetting has started.'; }
      else if(t.lapses >= 4 && risk > 0.35){ why = 'A stubborn weakness ('+t.lapses+' misses so far).'; }
      else if(risk > 0.5){ why = Math.round((t.cor/t.att)*100)+'% over '+t.att+' tries — below exam-safe.'; }
      else why = 'Close to mastery — cheap marks still on the table.';
    }
    var boost = E.state.boost[tag] ? 0.35 : 0;
    var cost = meta.weight * Math.max(0, risk - 0.12) + boost;
    recs.push({tag:tag, name:meta.name, risk:risk, cost:cost, why:why, seen:seen, m:m, boosted:!!E.state.boost[tag]});
  });
  recs.sort(function(a,b){ return b.cost - a.cost; });
  return recs;
};
E.daysToExam = function(){
  if(!E.state.examDate) return null;
  return Math.ceil((new Date(E.state.examDate+'T00:00:00') - new Date())/DAY);
};
E.emergencyOn = function(){
  var d = E.daysToExam();
  return E.state.settings.emergency || (d !== null && d >= 0 && d <= 7);
};
E.emergencyPlan = function(){
  var d = E.daysToExam();
  var top = E.coach().slice(0,6);
  var names = top.map(function(r){ return r.name; });
  var plan = [
    {day:1, title:'Damage report', what:'Two Smart Sessions + review every mistake', focus:names.slice(0,3).join(', ')},
    {day:2, title:'Heaviest weakness', what:'20 targeted questions on your #1 weak skill', focus:names[0]||'—'},
    {day:3, title:'Transformations day', what:'Part 4 sprint — highest marks per minute', focus:'Part 4 patterns'},
    {day:4, title:'Little words day', what:'Open Cloze + your two worst gap types + Spelling Gym', focus:'Part 2 & 3 function words'},
    {day:5, title:'Full mock test', what:'36 marks under real timing, then autopsy every error', focus:'Exam conditions'},
    {day:6, title:'Mastery List hunt', what:'Clear everything you marked “want to master”', focus:'Stubborn items'},
    {day:7, title:'Light polish', what:'One short Smart Session + read your Grammar Book. Sleep well.', focus:'Confidence'},
  ];
  if(d !== null && d > 0 && d <= 7){ plan = plan.slice(Math.max(0, 7-d)); }
  return plan;
};

/* ---------------- adaptive selection ----------------
   Priorities: due reviews → boosted concepts (your recent errors, in NEW exercises)
   → wanted re-tests → weak×valuable skills → coverage explore → type balance. */
function shuffle(a){ a = a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
E.pickSession = function(n, filter){
  n = n || 10;
  filter = filter || {};
  var types = filter.types || (filter.type ? [filter.type] : null);
  var st = E.state, picked = [], usedTags = [], usedIds = {}, typeCount = {kwt:0,cloze:0,wf:0,mcc:0};
  var pool = E.allItems().filter(function(it){
    if(types && types.indexOf(it.type) === -1) return false;
    if(filter.tag && (it.q.tags||[]).indexOf(filter.tag) === -1) return false;
    return true;
  });
  var nTypes = types ? types.length : 4;
  // part quotas: equal until ~40 answers, then weighted toward your weaker parts
  var quotas = {};
  var base = Math.max(1, Math.ceil(n/nTypes));
  var allT = types || ['kwt','cloze','wf','mcc'];
  if(!types && !filter.tag && st.records.total >= 40 && isFinite(n)){
    // gently tilt quotas toward weaker parts, never more than one extra question
    var abil = st.ability;
    var meanA = (abil.kwt+abil.cloze+abil.wf+abil.mcc)/4;
    allT.forEach(function(t){
      quotas[t] = base + ((meanA - abil[t]) > 35 ? 1 : 0) - ((abil[t] - meanA) > 60 ? 1 : 0);
      quotas[t] = Math.max(1, quotas[t]);
    });
  } else {
    allT.forEach(function(t){ quotas[t] = base; });
  }
  var extra = {kwt:0,cloze:0,wf:0,mcc:0};
  function fits(it, allowExtra){
    if(usedIds[it.q.id]) return false;
    if(types || filter.tag) return true;
    if(typeCount[it.type] < (quotas[it.type]||base)) return true;
    if(allowExtra && extra[it.type] < 1) return true; // boosts may exceed by at most one
    return false;
  }
  function take(it, tag){
    picked.push(it); usedIds[it.q.id]=1; typeCount[it.type]++;
    if(typeCount[it.type] > (quotas[it.type]||base)) extra[it.type]++;
    if(tag) usedTags.push(tag);
  }
  // 1) due reviews
  E.dueItems().filter(function(id){
    var it = E.byId[id];
    if(types && types.indexOf(it.type) === -1) return false;
    if(filter.tag && (it.q.tags||[]).indexOf(filter.tag) === -1) return false;
    return true;
  }).slice(0, E.emergencyOn() ? 4 : 3).forEach(function(id){ take(E.byId[id]); });
  // 2) boosted concepts — same idea, NEW exercises
  var boostTags = Object.keys(st.boost).filter(function(t){ return st.boost[t] > 0; })
    .sort(function(a,b){ return st.boost[b]-st.boost[a]; });
  boostTags.forEach(function(tag){
    if(picked.length >= n) return;
    if(filter.tag && tag !== filter.tag) return;
    var cands = pool.filter(function(it){
      return fits(it, true) && (it.q.tags||[]).indexOf(tag) !== -1 &&
             (!st.items[it.q.id] || st.items[it.q.id].att === 0 || E.isWobbly(it.q.id));
    });
    if(!cands.length) cands = pool.filter(function(it){ return fits(it, true) && (it.q.tags||[]).indexOf(tag) !== -1; });
    if(cands.length){
      take(shuffle(cands)[0], tag);
      st.boost[tag]--;
      if(st.boost[tag] <= 0) delete st.boost[tag];
    }
  });
  // 3) one wanted re-test per session
  var wantIds = Object.keys(st.wants).filter(function(id){ return E.byId[id] && !usedIds[id]; });
  if(wantIds.length && picked.length < n){
    var wid = shuffle(wantIds)[0];
    if(!types || types.indexOf(E.byId[wid].type) !== -1) take(E.byId[wid]);
  }
  // 4) weak × valuable via Thompson sampling, interleaved, learning zone; 5) explore least-seen
  var recs = E.coach(true).filter(function(r){ return !filter.tag || r.tag === filter.tag; });
  var weakTags = recs.slice(0, E.emergencyOn() ? 5 : 6).map(function(r){ return r.tag; });
  var tries = 0;
  while(picked.length < n && tries < 500){
    tries++;
    var roll = Math.random();
    var explorize = st.records.total < 60 ? 0.25 : 0.15; // early on, prioritise mapping the student
    var tagPick;
    if(roll < explorize){ // coverage: least practised skill
      var unseen = recs.filter(function(r){ return !r.seen; });
      var leastSeen = unseen.length ? unseen : recs.slice().sort(function(a,b){
        return (st.tags[a.tag]?st.tags[a.tag].att:0) - (st.tags[b.tag]?st.tags[b.tag].att:0);
      });
      tagPick = leastSeen[Math.floor(Math.random()*Math.min(4,leastSeen.length))];
    } else if(roll < 0.25 && recs.length > 5){ // retrieval of strengths
      tagPick = recs[recs.length-1-Math.floor(Math.random()*3)];
    } else {
      var wt = recs.filter(function(r){ return weakTags.indexOf(r.tag) !== -1; });
      tagPick = wt[Math.floor(Math.random()*wt.length)] || recs[0];
    }
    if(!tagPick) break;
    if(tagPick.tag === usedTags[usedTags.length-1] && Math.random() < 0.7) continue;
    var cands2 = pool.filter(function(it){
      if(!fits(it)) return false;
      if((it.q.tags||[]).indexOf(tagPick.tag) === -1) return false;
      var p = E.pWin(st.ability[it.type], E.qElo(it.q));
      return p >= 0.25 && p <= 0.92;
    });
    if(!cands2.length) cands2 = pool.filter(function(it){ return fits(it) && (it.q.tags||[]).indexOf(tagPick.tag) !== -1; });
    if(!cands2.length) continue;
    var wp = E.worstPos();
    cands2.sort(function(a,b){
      var pa = (wp && a.type==='cloze' && E.clozeFeatures(a.q).indexOf(wp) !== -1) ? -1e12 : 0;
      var pb = (wp && b.type==='cloze' && E.clozeFeatures(b.q).indexOf(wp) !== -1) ? -1e12 : 0;
      var ia = st.items[a.q.id], ib = st.items[b.q.id];
      return (pa + (ia?ia.last:0)) - (pb + (ib?ib.last:0));
    });
    take(cands2[Math.floor(Math.random()*Math.min(3,cands2.length))], tagPick.tag);
  }
  // 6) fill
  if(picked.length < n){
    shuffle(pool).forEach(function(it){ if(picked.length < n && fits(it)) take(it); });
  }
  if(picked.length < n){
    shuffle(pool).forEach(function(it){ if(picked.length < n && !usedIds[it.q.id]) take(it); });
  }
  return picked.slice(0,n);
};
E.diagnosticSet = function(){
  var ids = ['m01','m05','m30','c02','c18','c27','c36','w02','w19','w39','k03','k33','k21','k42'];
  return ids.map(function(id){ return E.byId[id]; }).filter(Boolean);
};
E.mockSet = function(){
  var P = FCE.BANK.passages;
  var p1 = E.pickPassage('p1') || P.p1[0];
  var p2 = E.pickPassage('p2') || P.p2[0];
  var p3 = E.pickPassage('p3') || P.p3[0];
  var kwts = shuffle(FCE.BANK.kwt).slice(0,6);
  return {p1:p1, p2:p2, p3:p3, p4:kwts};
};
E.recordMock = function(score, max, parts){
  var p = Math.min(1, (score/max)*1.02);
  var scale = Math.round(toScale(p));
  E.state.mocks.push({t:Date.now(), score:score, max:max, scale:scale, parts:parts});
  E.award('mock');
  if(score >= 30) E.award('mock30');
  E.save();
  return scale;
};
E.pickPassage = function(part){
  var list = FCE.BANK.passages[part] || [];
  if(!list.length) return null;
  var seen = E.state.passSeen, min = Infinity;
  list.forEach(function(p){ var c = seen[p.id]||0; if(c < min) min = c; });
  var pool = list.filter(function(p){ return (seen[p.id]||0) === min; });
  return pool[Math.floor(Math.random()*pool.length)];
};
E.markPassage = function(id){ E.state.passSeen[id] = (E.state.passSeen[id]||0)+1; E.save(); };

/* ---------------- Spelling Gym ---------------- */
E.spellingSet = function(n){
  n = n || 8;
  var st = E.state, out = [], used = {};
  // 1) the user's own recent spelling victims
  Object.keys(st.spell.words).sort(function(a,b){ return st.spell.words[b]-st.spell.words[a]; })
    .forEach(function(w){
      if(out.length >= Math.min(3,n)) return;
      var entry = FCE.SPELL.filter(function(s){ return s.w === w; })[0] ||
                  {w:w, bad:[],
                   def:'WORD · you misspelled this in a recent session. \u201C'+w.charAt(0).toUpperCase()+w.slice(1)+'\u201D — write the correct form.',
                   cue:'Straight from your own mistake log — burn the correct shape in now.'};
      out.push(entry); used[entry.w]=1;
    });
  // 2) least-practised danger words
  var rest = FCE.SPELL.filter(function(s){ return !used[s.w]; })
    .sort(function(a,b){ return (st.spellSeen[a.w]||0) - (st.spellSeen[b.w]||0) || Math.random()-0.5; });
  rest.forEach(function(s){ if(out.length < n){ out.push(s); used[s.w]=1; } });
  return shuffle(out).slice(0,n);
};
E.recordSpell = function(word, ok){
  var st = E.state;
  if(ok){ st.spellSeen[word] = (st.spellSeen[word]||0)+1; st.xp += 6; if(st.spell.words[word] && st.spellSeen[word] >= 2) delete st.spell.words[word]; }
  else { st.spell.words[word] = (st.spell.words[word]||0)+1; st.xp += 1; }
  E.touchStreak();
  E.save();
};

/* ---------------- analytics for views ---------------- */
E.heatmap = function(){
  var out = [];
  Object.keys(FCE.GAPTYPES).forEach(function(gt){
    var g = E.state.gaps[gt], meta = FCE.GAPTYPES[gt];
    var err = null, trend = 0, att = 0;
    if(g && g.att){
      att = g.att; err = 1 - g.cor/g.att;
      if(g.recent.length >= 6){
        var mid = Math.floor(g.recent.length/2);
        var a = g.recent.slice(0,mid), b = g.recent.slice(mid);
        trend = b.reduce(function(x,y){return x+y;},0)/b.length - a.reduce(function(x,y){return x+y;},0)/a.length;
      }
    }
    out.push({gt:gt, name:meta.name, freq:meta.freq, att:att, err:err, trend:trend,
              danger: err===null ? meta.freq*0.09 : err*meta.freq/5});
  });
  out.sort(function(a,b){ return b.danger - a.danger; });
  return out;
};
E.dna = function(){
  var counts = {}, total = 0;
  E.state.log.forEach(function(l){ if(!l.ok && l.cause){ counts[l.cause]=(counts[l.cause]||0)+1; total++; } });
  var out = Object.keys(counts).map(function(c){ return {cause:c, n:counts[c], pct: total? counts[c]/total : 0}; });
  out.sort(function(a,b){ return b.n - a.n; });
  return {list:out, total:total};
};
E.confReality = function(){
  var c = E.state.calib;
  return ['g','f','s'].map(function(k){
    var claimed = k==='g' ? 0.33 : k==='f' ? 0.65 : 0.92;
    return {k:k, name:FCE.CONF[k].name, icon:FCE.CONF[k].icon, att:c[k].att,
            actual: c[k].att ? c[k].cor/c[k].att : null, claimed:claimed};
  });
};
E.luckyAndFalse = function(){
  var lucky=0, falseConf=0;
  E.state.log.forEach(function(l){
    if(l.ok && l.conf==='g') lucky++;
    if(!l.ok && l.conf==='s') falseConf++;
  });
  return {lucky:lucky, falseConf:falseConf};
};
E.behaviorReport = function(){
  var B = E.state.beh;
  if(!B || !B.n) return null;
  var flips = B.changedRight + B.selfCorrect;
  return {
    n:B.n, avgHesit:B.ttfkSum/B.n/1000, avgEdits:B.editSum/B.n,
    changed:B.changed, changedRight:B.changedRight, selfCorrect:B.selfCorrect,
    hiddenHesit:B.hiddenHesit, fluentSure:B.fluentSure, skips:B.skips, fastRight:B.fastRight,
    avgKeys: B.n ? B.keySum/B.n : 0, avgTypeMs: B.n ? B.typeMsSum/B.n : 0,
    instinct: flips ? B.changedRight/flips : null,
  };
};
E.spellReport = function(){
  var st = E.state.spell;
  var pats = Object.keys(st.pat).map(function(p){ return {id:p, n:st.pat[p]}; }).sort(function(a,b){ return b.n-a.n; });
  var words = Object.keys(st.words).map(function(w){ return {w:w, n:st.words[w]}; }).sort(function(a,b){ return b.n-a.n; });
  return {patterns:pats, words:words, total:pats.reduce(function(x,p){return x+p.n;},0)};
};
E.readiness = function(){
  var pr = E.predict();
  var tagsSeen = Object.keys(E.state.tags).filter(function(t){return E.state.tags[t].att>0;}).length;
  var coverage = tagsSeen / Object.keys(FCE.TAGS).length;
  var mockDone = E.state.mocks.length ? 1 : 0.4;
  var vol = Math.min(1, E.state.records.total/120);
  return Math.round(100 * (0.45*pr.p + 0.2*coverage + 0.2*vol + 0.15*mockDone));
};

/* ---------------- the coach's read ----------------
   A tailored prose overview of THIS student, composed from the live model:
   every candidate observation is scored for salience, the strongest few are
   woven into one paragraph. Deterministic per day (no Math.random), so it
   reads stable within a day but evolves with the data. */
E.studentStory = function(){
  var st = E.state, n = st.records.total;
  var esc = function(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var name = esc(st.name || 'friend');
  var day = Math.floor(Date.now()/864e5), pickI = 0;
  var pick = function(arr){ return arr[(day + (pickI++)) % arr.length]; };
  var pct = function(x){ return Math.round(x*100); };

  if(n < 10){
    var d0 = E.daysToExam();
    return pick([
      'This panel becomes your living profile, '+name+'. Right now the engine knows nothing — after about <b>ten answers</b> it starts writing what it sees here: where you hesitate, what you misspell, which grammar quietly costs you marks'+(d0!==null && d0>=0 ? ', and whether you are on schedule for the exam in <b>'+d0+' day'+(d0===1?'':'s')+'</b>.' : '.')+' Do one Smart Session and come back.',
      name+', this space is reserved for an honest description of you as a candidate — your instincts, your spelling, your strongest paper. It is written by the engine from your own answers, and it cannot start until you give it about <b>ten</b>. The diagnostic is the fastest way to wake it up.',
    ]);
  }

  var pr = E.predict(), tier = E.difficultyTier();
  var obs = [];

  /* accuracy trend: recent vs previous */
  var L = st.log;
  if(L.length >= 30){
    var rec = L.slice(-25), prev = L.slice(-50, -25);
    var ra = rec.reduce(function(x,l){return x+l.ok;},0)/rec.length;
    var pa = prev.length ? prev.reduce(function(x,l){return x+l.ok;},0)/prev.length : ra;
    if(ra - pa >= 0.12) obs.push({w:5.8, t:pick([
      'Your last 25 answers run at <b>'+pct(ra)+'%</b> — a clear step up from the '+pct(pa)+'% before them, so whatever you changed, keep it.',
      'The curve is bending the right way: <b>'+pct(ra)+'%</b> over your last 25, up from '+pct(pa)+'%.'])});
    else if(pa - ra >= 0.12) obs.push({w:6.0, t:pick([
      'Heads up: accuracy has dipped to <b>'+pct(ra)+'%</b> over the last 25 (from '+pct(pa)+'%) — usually a sign of rushing or fatigue, not forgetting.',
      'Your recent 25 sit at <b>'+pct(ra)+'%</b>, down from '+pct(pa)+'%. Slow the first read of each question and the number comes back.'])});
  }

  /* sharpest confirmed weakness */
  var recs = E.coach();
  var c0 = recs && recs.length ? recs[0] : null;
  if(c0 && n >= 15) obs.push({w:5.6, t:pick([
    'The single most expensive gap is <b>'+esc(c0.name)+'</b> — roughly <b>'+(Math.round(c0.cost*2)/2).toFixed(1)+' marks</b> riding on it right now.',
    '<b>'+esc(c0.name)+'</b> is where your marks leak fastest; the engine is already steering exercises there.'])});

  /* strongest confirmed skill */
  var bestTag = null, bestM = 0;
  Object.keys(st.tags).forEach(function(t){
    var r = st.tags[t]; if(!r || r.att < 5 || !FCE.TAGS[t]) return;
    var m = E.mEff(t); if(m > bestM){ bestM = m; bestTag = t; }
  });
  if(bestTag && bestM >= 0.8) obs.push({w:3.2, t:pick([
    'On the bright side, <b>'+esc(FCE.TAGS[bestTag].name)+'</b> is genuinely solid ('+pct(bestM)+'% mastered) — banked marks.',
    'You can already treat <b>'+esc(FCE.TAGS[bestTag].name)+'</b> as a strength: '+pct(bestM)+'% mastery and holding.'])});

  /* paper-part contrast */
  var PN = {kwt:'Part 4 (transformations)', cloze:'Part 2 (open cloze)', wf:'Part 3 (word formation)', mcc:'Part 1 (multiple choice)'};
  var per = E.expectedAccuracy().per;
  var parts = Object.keys(per).sort(function(a,b){ return per[b]-per[a]; });
  if(n >= 25 && per[parts[0]] - per[parts[3]] >= 0.12) obs.push({w:4.2, t:pick([
    'Across the paper you are strongest in <b>'+PN[parts[0]]+'</b> and most exposed in <b>'+PN[parts[3]]+'</b> ('+pct(per[parts[0]])+'% vs '+pct(per[parts[3]])+'% expected).',
    'If the exam were tomorrow, <b>'+PN[parts[0]]+'</b> would carry you and <b>'+PN[parts[3]]+'</b> would bill you — a '+ (pct(per[parts[0]]) - pct(per[parts[3]])) +'-point spread.'])});

  /* behavioural instincts */
  var br = E.behaviorReport();
  if(br){
    var flips = br.changedRight + br.selfCorrect;
    if(br.changedRight >= 3 && flips >= 5 && br.changedRight/flips >= 0.6) obs.push({w:5.4, t:pick([
      'The telemetry shows a costly habit: you have talked yourself <i>out of</i> a correct answer <b>'+br.changedRight+' times</b>. When your hand moves first, let it finish.',
      'You change answers under doubt — and <b>'+br.changedRight+'</b> of those edits destroyed a right answer. Your first instinct is better than you trust it to be.'])});
    else if(br.selfCorrect >= 3 && flips >= 5 && br.changedRight/flips <= 0.4) obs.push({w:3.6, t:
      'Your re-reads genuinely rescue marks — <b>'+br.selfCorrect+'</b> answers were saved on second look. Keep budgeting those few extra seconds.'});
    if(br.fastRight >= 10 && br.avgHesit < 2.5) obs.push({w:2.4, t:
      'Pace is a weapon for you: <b>'+br.fastRight+'</b> fast-and-correct answers with barely any hesitation.'});
    else if(br.avgHesit > 6) obs.push({w:2.2, t:
      'You are a deliberate starter (≈<b>'+br.avgHesit.toFixed(1)+'s</b> before the first keystroke). Fine in practice — just rehearse the exam clock in mocks.'});
  }

  /* spelling cost */
  var sr = E.spellReport();
  if(sr.total >= 3){
    var topW = sr.words.length ? sr.words[0].w : null;
    obs.push({w:5.2, t:pick([
      'Spelling alone has cost you <b>'+sr.total+' marks</b> you otherwise earned'+(topW ? ' — <i>'+esc(topW)+'</i> is your most frequent victim' : '')+'. The Spelling Gym is loaded with exactly these words.',
      '<b>'+sr.total+'</b> of your errors were pure spelling — the grammar was right'+(topW ? ' (<i>'+esc(topW)+'</i> tops the list)' : '')+'. Cheapest marks you can win back this week.'])});
  }

  /* calibration */
  var lf = E.luckyAndFalse();
  if(lf.falseConf >= 3) obs.push({w:4.1, t:
    'Calibration check: <b>'+lf.falseConf+' times</b> you felt sure and were wrong. Treat "certain" answers to one extra glance — that is where silent marks vanish.'});
  else if(lf.lucky >= 4) obs.push({w:2.6, t:
    'You called <b>'+lf.lucky+'</b> correct answers "a guess" — you know more than you give yourself credit for.'});

  /* open-cloze positional fingerprint */
  var wp = E.worstPos();
  if(wp) obs.push({w:4.4, t:
    'There is a positional pattern in your open-cloze misses: gaps <b>'+esc(E.posName(wp))+'</b> trip you disproportionately — the engine now serves more of exactly those.'});

  /* mock vs day-to-day signal */
  if(st.mocks.length){
    var lastMock = st.mocks[st.mocks.length-1];
    if(Math.abs(lastMock.scale - pr.scale) >= 5) obs.push({w:4.6, t: lastMock.scale > pr.scale ?
      'Your last mock landed at <b>'+Math.round(lastMock.scale)+'</b> — above your day-to-day signal, so you rise to exam conditions.' :
      'Your last mock came in at <b>'+Math.round(lastMock.scale)+'</b>, below your practice level — likely pacing, not knowledge. Another timed paper will confirm.'});
  } else if(n >= 40){
    obs.push({w:3.4, t:'You have never sat a full timed mock — at this point it is the highest-information forty minutes available to you.'});
  }

  /* mastery list */
  var wantsN = Object.keys(st.wants).length;
  if(wantsN) obs.push({w:3.0, t:'Your Mastery List holds <b>'+wantsN+'</b> flagged pattern'+(wantsN>1?'s':'')+' — each clears after two clean wins, and the engine keeps dealing them in.'});

  /* essay vocab */
  var vs = E.vocabStats();
  if(vs.mastered >= 6) obs.push({w:2.0, t:'Your essay arsenal is growing too: <b>'+vs.mastered+'</b> band-boosting upgrades locked in for the writing paper.'});

  obs.sort(function(a,b){ return b.w - a.w; });
  var body = [], len = 0;
  for(var i=0; i<obs.length && body.length < 4; i++){
    if(len + obs[i].t.length > 600 && body.length >= 2) break;
    body.push(obs[i].t); len += obs[i].t.length;
  }

  var opener = pick([
    name+', after <b>'+n+' answers</b> here is the honest picture. You are training at <b>'+tier.name+'</b> difficulty and tracking toward a <b>'+pr.grade+'</b> ('+pct(pr.pass)+'% pass odds). ',
    'The engine’s read on you, '+name+' — <b>'+n+' answers</b> in, training at <b>'+tier.name+'</b> level, currently a <b>'+pr.grade+'</b>-shaped candidate with '+pct(pr.pass)+'% pass odds. ',
    name+' in one paragraph: <b>'+n+'</b> answers logged, <b>'+tier.name+'</b>-tier difficulty, pass probability <b>'+pct(pr.pass)+'%</b>. ',
  ]);
  if(st.streak.count >= 3) opener += pick([
    'The <b>'+st.streak.count+'-day streak</b> is doing quiet compound work. ',
    ''+st.streak.count+' straight days — consistency is your real edge. ',
  ]);

  var d = E.daysToExam(), closer;
  if(d !== null && d >= 0 && d <= 10) closer = ' With <b>'+(d===0?'the exam today':d+' day'+(d===1?'':'s')+' left')+'</b>, the plan is simple: protect strengths, drill the one gap above, sleep well.';
  else if(c0) closer = pick([
    ' Next move: a focused drill on <b>'+esc(c0.name)+'</b> — that is where the next mark is cheapest.',
    ' If you only do one thing today, make it <b>'+esc(c0.name)+'</b>.',
  ]);
  else closer = ' Keep feeding the engine — every answer sharpens this picture.';

  return opener + body.join(' ') + closer;
};

E.grammarBook = function(){
  var byTag = {};
  E.state.log.forEach(function(l){
    if(l.ok) return;
    (l.tags||[]).forEach(function(t){ (byTag[t] = byTag[t] || []).push(l); });
  });
  var chapters = Object.keys(byTag).map(function(tag){
    var meta = FCE.TAGS[tag]; if(!meta) return null;
    var t = E.state.tags[tag] || {causes:{}};
    var topCause = null, max=0;
    Object.keys(t.causes||{}).forEach(function(c){ if(t.causes[c]>max){max=t.causes[c];topCause=c;} });
    return {tag:tag, meta:meta, errors:byTag[tag].slice(-6).reverse(), n:byTag[tag].length, topCause:topCause, m:E.mEff(tag)};
  }).filter(Boolean);
  chapters.sort(function(a,b){ return b.n - a.n; });
  return chapters;
};
E.patternFor = function(answerText){
  var u = ' '+E.norm(answerText)+' ';
  for(var i=0;i<FCE.PATTERNS.length;i++){
    var p = FCE.PATTERNS[i];
    for(var j=0;j<p.match.length;j++){
      if(u.indexOf(E.norm(p.match[j])) !== -1) return p;
    }
  }
  return null;
};
E.tipFor = function(q){
  var tags = q.tags||[];
  for(var i=0;i<tags.length;i++){
    var meta = FCE.TAGS[tags[i]];
    if(meta && meta.tips && meta.tips.length) return meta.tips[Math.floor(Math.random()*meta.tips.length)];
  }
  return '';
};

/* ---------------- open-cloze positional intelligence ----------------
   WHERE in a sentence do this student's cloze errors live?
   start of sentence · after a comma · mid-clause · sentence end · after/before word classes. */
E.clozeFeatures = function(q){
  var s = q.s || '';
  var gi = s.indexOf('____');
  if(gi < 0) return [];
  var before = s.slice(0, gi).trim();
  var after = s.slice(gi+4).replace(/^_+/,'').trim();
  var f = [];
  if(!before || /[.!?]$/.test(before)) f.push('start');
  if(/,$/.test(before)) f.push('afterComma');
  if(!after || /^[.!?]/.test(after)) f.push('end');
  if(f.indexOf('start') < 0 && f.indexOf('end') < 0) f.push('mid');
  var pw = (before.match(/([\w'’]+)[^\w]*$/)||[])[1];
  var nw = (after.match(/^[^\w]*([\w'’]+)/)||[])[1];
  var pc = pw ? E.classOf(pw) : null;
  var nc = nw ? E.classOf(nw) : null;
  if(pc) f.push('after-'+pc);
  if(nc) f.push('before-'+nc);
  if(nw && /ing$/.test(nw)) f.push('before-ing');
  return f;
};
E.POSNAMES = { start:'first word of the sentence', end:'last word of the sentence', mid:'mid-sentence',
  afterComma:'right after a comma', 'before-ing':'before an -ing form' };
E.posName = function(k){
  if(E.POSNAMES[k]) return E.POSNAMES[k];
  var m = k.match(/^(after|before)-(\w+)$/);
  if(m) return m[1]+' a '+(FCE.CLASSNAMES[m[2]]||m[2]);
  return k;
};
E.recPos = function(q, ok){
  E.clozeFeatures(q).forEach(function(k){
    var p = E.state.pos[k] || (E.state.pos[k] = {att:0, cor:0});
    p.att++; if(ok) p.cor++;
  });
};
E.posReport = function(){
  var out = [];
  Object.keys(E.state.pos).forEach(function(k){
    var p = E.state.pos[k];
    if(p.att >= 3) out.push({k:k, name:E.posName(k), att:p.att, err:1 - p.cor/p.att});
  });
  out.sort(function(a,b){ return b.err - a.err; });
  return out;
};
E.worstPos = function(){
  var r = E.posReport().filter(function(p){ return p.att >= 4 && p.err >= 0.4; });
  return r.length ? r[0].k : null;
};

/* ---------------- Essay Vocab Lab (Leitner boxes) ---------------- */
E.vocabState = function(w){
  var v = E.state.vocab[w];
  if(!v){ v = E.state.vocab[w] = {box:0, due:0, att:0, cor:0}; }
  return v;
};
E.vocabSet = function(n){
  n = n || 8;
  var now = Date.now(), due = [], fresh = [], later = [];
  FCE.VOCAB.forEach(function(it){
    var v = E.state.vocab[it.up[0]];
    if(!v) fresh.push(it);
    else if(v.due <= now && v.box < 4) due.push(it);
    else if(v.box < 4) later.push(it);
  });
  function shuf(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
  return shuf(due).concat(shuf(fresh)).concat(shuf(later)).slice(0, n);
};
E.recordVocab = function(it, ok){
  var v = E.vocabState(it.up[0]);
  v.att++;
  if(ok){ v.cor++; v.box = Math.min(4, v.box+1); }
  else { v.box = Math.max(0, v.box-1); }
  var IVL = [0.15, 1, 3, 7, 21];
  v.due = Date.now() + IVL[v.box]*DAY;
  E.state.xp += ok ? 7 : 2;
  E.touchStreak();
  E.save();
};
E.vocabStats = function(){
  var mastered = 0, learning = 0;
  Object.keys(E.state.vocab).forEach(function(w){
    var v = E.state.vocab[w];
    if(v.box >= 3) mastered++; else if(v.att) learning++;
  });
  return {mastered:mastered, learning:learning, total:FCE.VOCAB.length};
};
E.gradeVocab = function(it, user){
  var u = E.norm(user);
  return it.up.some(function(a){ return E.norm(a) === u; });
};

/* ---------------- focus search: "feed me more of X" ---------------- */
E.searchLearnables = function(query){
  var q = E.norm(query);
  if(q.length < 2) return [];
  var out = [], seen = {};
  Object.keys(FCE.TAGS).forEach(function(t){
    if(FCE.TAGS[t].name.toLowerCase().indexOf(q) !== -1)
      out.push({kind:'tag', id:t, label:FCE.TAGS[t].name, sub:'skill — sessions will lean into it'});
  });
  FCE.PATTERNS.forEach(function(p){
    var hit = p.name.toLowerCase().indexOf(q) !== -1 || p.match.some(function(m){ return E.norm(m).indexOf(q) !== -1; });
    if(hit && !seen['pt'+p.id]){ seen['pt'+p.id]=1; out.push({kind:'pattern', id:p.id, tags:p.tags, label:p.name, sub:'exam pattern ★'.concat('★'.repeat(Math.max(0,p.freq-1)))}); }
  });
  E.allItems().forEach(function(it2){
    if(out.length > 14) return;
    var hay = (it2.type==='mcc' ? it2.q.opts[it2.q.cor] : it2.q.ans.join(' ')) + ' ' + (it2.q.key||'') + ' ' + (it2.q.stem||'');
    if(E.norm(hay).indexOf(q) !== -1 && !seen[it2.q.id]){
      seen[it2.q.id]=1;
      var label = it2.type==='mcc' ? it2.q.opts[it2.q.cor] : it2.q.ans[0];
      out.push({kind:'item', id:it2.q.id, tags:it2.q.tags, label:'\u201C'+label+'\u201D', sub:'exact exercise — added to your Mastery List'});
    }
  });
  return out.slice(0, 9);
};
E.focusAdd = function(match){
  if(match.kind === 'tag'){
    E.state.boost[match.id] = Math.min(10, (E.state.boost[match.id]||0) + 6);
  } else if(match.kind === 'item'){
    E.addWant(match.id);
  } else {
    (match.tags||[]).slice(0,2).forEach(function(t){
      E.state.boost[t] = Math.min(10, (E.state.boost[t]||0) + 5);
    });
  }
  E.save();
};
})();
