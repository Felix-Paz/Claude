/* FCE Mastery — adaptive engine. 100% local: Elo ability tracking, per-skill mastery
   with forgetting curves, SM-2-style spaced repetition, confidence calibration,
   mistake-DNA, Cambridge-scale score prediction, and the study coach. */
window.FCE = window.FCE || {};
(function(){
var E = FCE.engine = {};
var KEY = 'fce-mastery-state-v1';
var DAY = 86400000;

/* ---------------- state ---------------- */
E.blank = function(){
  return {
    v:1, name:'', examDate:'', createdAt:Date.now(), onboarded:false,
    settings:{dailyGoal:20, emergency:false},
    xp:0, streak:{count:0, last:''}, badges:[], records:{bestRun:0, bestAcc:0, total:0},
    week:{id:'', counts:{}},
    ability:{kwt:1150, cloze:1150, wf:1150, mcc:1150},
    tags:{},        // tagId -> {att,cor,m,last,lapses,causes:{},hist:[]}
    items:{},       // itemId -> {att,cor,last,due,ivl,ease,lapses,conf:''}
    gaps:{},        // gapType -> {att,cor,recent:[]}
    calib:{g:{att:0,cor:0}, f:{att:0,cor:0}, s:{att:0,cor:0}},
    log:[],         // {t,id,type,tags,gt,ok,conf,ms,cause,ans,user}
    sessions:[],    // {t,n,ok,type}
    mocks:[],       // {t,score,max,scale,parts}
    trend:[],       // rolling per-session accuracy {t,acc,n}
  };
};
E.state = null;
E.load = function(){
  try{
    var raw = localStorage.getItem(KEY);
    E.state = raw ? JSON.parse(raw) : E.blank();
  }catch(e){ E.state = E.blank(); }
  if(!E.state.v) E.state = E.blank();
  return E.state;
};
E.save = function(){ try{ localStorage.setItem(KEY, JSON.stringify(E.state)); }catch(e){} };
E.reset = function(){ E.state = E.blank(); E.save(); };
E.export = function(){ return JSON.stringify(E.state, null, 1); };
E.import = function(json){ var s = JSON.parse(json); if(!s || !s.v) throw new Error('bad file'); E.state = s; E.save(); };

/* ---------------- item access ---------------- */
E.allItems = function(){
  var B = FCE.BANK, out = [];
  B.kwt.forEach(function(q){ out.push({q:q, type:'kwt'}); });
  B.cloze.forEach(function(q){ out.push({q:q, type:'cloze'}); });
  B.wf.forEach(function(q){ out.push({q:q, type:'wf'}); });
  B.mcc.forEach(function(q){ out.push({q:q, type:'mcc'}); });
  return out;
};
E.byId = {};
E.indexBank = function(){
  E.allItems().forEach(function(it){ E.byId[it.q.id] = it; });
};
E.itemState = function(id){
  var s = E.state.items[id];
  if(!s){ s = E.state.items[id] = {att:0,cor:0,last:0,due:0,ivl:0,ease:2.3,lapses:0,conf:''}; }
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
  toks.forEach(function(w){
    n += 1;
    // Cambridge rule: contractions count as two words (isn't = is not). Possessive 's is ambiguous; we follow the contraction rule.
    if(/[a-z]'(t|s|ll|re|ve|d|m)\b/.test(w)) n += 1;
  });
  return n;
};
E.gradeKWT = function(q, user){
  var u = E.norm(user);
  var full = q.ans.some(function(a){ return E.norm(a) === u; });
  if(full) return {score:2, ok:true};
  var hits = 0;
  q.halves.forEach(function(h){
    if(h.some(function(a){ return u.indexOf(E.norm(a)) !== -1; })) hits++;
  });
  return {score: hits >= 2 ? 1 : (hits === 1 ? 1 : 0), ok:false};
};
E.gradeOne = function(q, user){ // cloze + wf: exact one-word match against list
  var u = E.norm(user);
  return q.ans.some(function(a){ return E.norm(a) === u; });
};

/* ---------------- Elo ability & difficulty ---------------- */
E.qElo = function(q){ return 950 + (q.diff||2)*110; };           // diff 1..5 -> 1060..1500
E.pWin = function(ability, qe){ return 1/(1+Math.pow(10,(qe-ability)/400)); };
E.updAbility = function(type, q, ok){
  var a = E.state.ability, n = E.state.records.total;
  var k = n < 30 ? 40 : (n < 120 ? 28 : 18);
  var p = E.pWin(a[type], E.qElo(q));
  a[type] = Math.max(700, Math.min(1700, a[type] + k*((ok?1:0)-p)));
};

/* ---------------- mastery with forgetting ---------------- */
E.recordTag = function(tag, ok, weight){
  var t = E.tagState(tag);
  t.att++; if(ok) t.cor++;
  var alpha = Math.max(0.12, 1/(t.att)) * (weight||1);
  alpha = Math.min(0.5, alpha);
  t.m = Math.max(0, Math.min(1, t.m + alpha*((ok?1:0) - t.m)));
  if(!ok) t.lapses++;
  t.last = Date.now();
  t.hist.push(ok?1:0); if(t.hist.length>30) t.hist.shift();
};
E.mEff = function(tag){ // mastery decayed toward 0.5 (uncertainty) with time unseen
  var t = E.state.tags[tag];
  if(!t || !t.att) return null;
  var days = (Date.now()-t.last)/DAY;
  return 0.5 + (t.m-0.5)*Math.exp(-days/12);
};
E.tagTrend = function(tag){ // recent half vs older half of hist
  var t = E.state.tags[tag];
  if(!t || t.hist.length < 6) return 0;
  var h = t.hist, mid = Math.floor(h.length/2);
  var a = h.slice(0,mid), b = h.slice(mid);
  var av = a.reduce(function(x,y){return x+y;},0)/a.length;
  var bv = b.reduce(function(x,y){return x+y;},0)/b.length;
  return bv - av;
};

/* ---------------- spaced repetition (compressed for exam-week cramming) ---------------- */
E.schedule = function(id, ok, conf){
  var it = E.itemState(id), now = Date.now();
  if(ok){
    var lucky = (conf === 'g'); // lucky guess: re-test soon, half credit to interval
    if(it.ivl === 0) it.ivl = lucky ? 0.25 : 1;
    else it.ivl = Math.min(15, it.ivl * (lucky ? 1.2 : it.ease));
    it.ease = Math.min(2.8, it.ease + (conf==='s' ? 0.08 : 0.02));
  }else{
    it.lapses++; it.ivl = 0.2; // ~5h
    it.ease = Math.max(1.4, it.ease - (conf==='s' ? 0.3 : 0.18)); // false confidence hits harder
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
E.leeches = function(){ // items failed 3+ times -> memory lab
  return Object.keys(E.state.items).filter(function(id){
    var it = E.state.items[id];
    return it.lapses >= 3 && E.byId[id];
  });
};

/* ---------------- the master record call ---------------- */
E.record = function(q, type, ok, conf, ms, user, cause, opts){
  opts = opts || {};
  var st = E.state, now = Date.now();
  // weight: certain-but-wrong counts extra (false confidence), guess-and-right counts half (lucky)
  var w = 1;
  if(!ok && conf==='s') w = 1.5;
  if(ok && conf==='g') w = 0.5;
  (q.tags||[]).forEach(function(t){ E.recordTag(t, ok, w); });
  if(type==='cloze' && q.gt){
    var g = st.gaps[q.gt] || (st.gaps[q.gt]={att:0,cor:0,recent:[]});
    g.att++; if(ok) g.cor++;
    g.recent.push(ok?1:0); if(g.recent.length>14) g.recent.shift();
  }
  var it = E.itemState(q.id);
  it.att++; if(ok) it.cor++; it.last = now; it.conf = conf;
  E.schedule(q.id, ok, conf);
  E.updAbility(type, q, ok);
  if(conf && st.calib[conf]){ st.calib[conf].att++; if(ok) st.calib[conf].cor++; }
  st.log.push({t:now, id:q.id, type:type, tags:q.tags||[], gt:q.gt||'', ok:ok?1:0,
               conf:conf, ms:ms||0, cause:cause||'', user:String(user||'').slice(0,80)});
  if(st.log.length > 1500) st.log = st.log.slice(-1200);
  // gamification
  st.records.total++;
  if(ok){ st.xp += 8 + (q.diff||2)*4 + (conf==='s'?3:0); } else { st.xp += 2; }
  E.touchStreak();
  E.bumpWeek(type, ok);
  if(!opts.quiet){ E.checkBadges(opts.runStreak||0); }
  E.save();
};
E.setCause = function(cause){ // attach cause to last log entry + tag stats
  var l = E.state.log[E.state.log.length-1];
  if(!l || l.ok) return;
  l.cause = cause;
  (l.tags||[]).forEach(function(t){
    var ts = E.tagState(t);
    ts.causes[cause] = (ts.causes[cause]||0)+1;
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
  E.challenge(); // ensures week reset
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
  // comeback: an item with >=3 lapses now at 2+ consecutive correct (ivl>=2)
  var cb = Object.keys(st.items).some(function(id){ var it=st.items[id]; return it.lapses>=3 && it.ivl>=2; });
  if(cb) E.award('comeback');
};

/* ---------------- score predictor (Cambridge scale 122–190) ---------------- */
E.expectedAccuracy = function(){
  // marks-weighted: P1 8, P2 8, P3 8, P4 12 of 36
  var a = E.state.ability;
  var acc = {};
  ['kwt','cloze','wf','mcc'].forEach(function(t){
    // expected accuracy vs a mid-difficulty (diff 3) item
    acc[t] = E.pWin(a[t], 950+3*110);
  });
  var p = (8*acc.mcc + 8*acc.cloze + 8*acc.wf + 12*acc.kwt) / 36;
  return {p:p, per:acc};
};
E.predict = function(){
  var n = E.state.records.total;
  var ex = E.expectedAccuracy(), p = ex.p;
  // blend with recent observed accuracy when available
  var recent = E.state.log.slice(-60);
  if(recent.length >= 10){
    var obs = recent.reduce(function(x,l){return x+l.ok;},0)/recent.length;
    p = 0.6*p + 0.4*obs;
  }
  // piecewise map accuracy -> Cambridge scale
  var map = [[0,128],[0.30,145],[0.45,155],[0.55,160],[0.70,170],[0.82,180],[0.92,188],[1,190]];
  var scale = 128;
  for(var i=0;i<map.length-1;i++){
    if(p >= map[i][0] && p <= map[i+1][0]){
      var f = (p-map[i][0])/(map[i+1][0]-map[i][0] || 1);
      scale = map[i][1] + f*(map[i+1][1]-map[i][1]);
      break;
    }
  }
  // mock results carry real weight
  if(E.state.mocks.length){
    var last = E.state.mocks[E.state.mocks.length-1];
    scale = 0.55*scale + 0.45*last.scale;
  }
  var ci = Math.max(2.5, 22/Math.sqrt(n+3)); // narrows with evidence
  var sd = ci/1.6;
  var phi = function(z){ // standard normal CDF approx
    var t = 1/(1+0.2316419*Math.abs(z));
    var d = 0.3989423*Math.exp(-z*z/2);
    var pr = d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
    return z>0 ? 1-pr : pr;
  };
  var pAbove = function(th){ return 1-phi((th-scale)/sd); };
  var pA = pAbove(180), pB = Math.max(0,pAbove(173)-pA), pC = Math.max(0,pAbove(160)-pA-pB);
  return {
    scale:Math.round(scale), ci:Math.round(ci), p:p, n:n, per:ex.per,
    pass:pAbove(160), pA:pA, pB:pB, pC:pC,
    cefr: scale>=180 ? 'C1' : scale>=160 ? 'B2' : scale>=140 ? 'B1' : 'A2–B1',
    grade: scale>=180 ? 'A' : scale>=173 ? 'B' : scale>=160 ? 'C' : (scale>=140?'B1 Cert':'Below')
  };
};

/* ---------------- coach: what to study next & why ---------------- */
E.coach = function(){
  var recs = [];
  Object.keys(FCE.TAGS).forEach(function(tag){
    var meta = FCE.TAGS[tag];
    var m = E.mEff(tag);
    var t = E.state.tags[tag];
    var risk, why, seen = !!(t && t.att);
    if(!seen){ risk = 0.45; why = 'Not tested yet — unknown territory is risk.'; }
    else{
      risk = 1 - m;
      var days = (Date.now()-t.last)/DAY;
      if(days > 3 && t.m > 0.6){ risk += 0.12; why = 'Was solid, but untouched for '+Math.round(days)+' days — forgetting has started.'; }
      else if(t.lapses >= 4 && risk > 0.35){ why = 'Repeated misses ('+t.lapses+' errors so far) — a stubborn weakness.'; }
      else if(risk > 0.5){ why = 'Accuracy '+Math.round((t.cor/t.att)*100)+'% over '+t.att+' tries — well below exam-safe.'; }
      else why = 'Fine-tuning: close to mastery, cheap marks available.';
    }
    var cost = meta.weight * Math.max(0, risk - 0.15); // marks at risk vs a strong candidate
    recs.push({tag:tag, name:meta.name, risk:risk, cost:cost, why:why, seen:seen, m:m});
  });
  recs.sort(function(a,b){ return b.cost - a.cost; });
  return recs;
};
E.daysToExam = function(){
  if(!E.state.examDate) return null;
  var d = Math.ceil((new Date(E.state.examDate+'T00:00:00') - new Date())/DAY);
  return d;
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
    {day:1, title:'Damage report', what:'Smart Session ×2 + review every mistake', focus:names.slice(0,3).join(', ')},
    {day:2, title:'Heaviest weakness', what:'20 targeted questions on your #1 weak skill', focus:names[0]||'—'},
    {day:3, title:'Transformations day', what:'Key Word Transformations sprint + memory hooks', focus:'Part 4 patterns'},
    {day:4, title:'Open Cloze + heatmap', what:'Drill your two worst gap types', focus:'Part 2 function words'},
    {day:5, title:'Full mock test', what:'36 marks under real timing, then autopsy every error', focus:'Exam conditions'},
    {day:6, title:'Leech hunt', what:'Memory Lab: kill every item you have failed twice+', focus:'Mistake DNA review'},
    {day:7, title:'Light polish', what:'1 short Smart Session + read your Grammar Book. Sleep.', focus:'Confidence'},
  ];
  if(d !== null && d >= 0 && d <= 7 && d > 0){
    var startIdx = 7 - d;
    plan = plan.map(function(p,i){ return p; }).slice(Math.max(0,startIdx-0));
  }
  return plan;
};

/* ---------------- adaptive question selection ---------------- */
function shuffle(a){ a = a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i];a[i]=a[j];a[j]=t; } return a; }
E.pickSession = function(n, filter){
  n = n || 10;
  var st = E.state, picked = [], usedTags = [], usedIds = {};
  var pool = E.allItems().filter(function(it){
    if(filter && filter.type && it.type !== filter.type) return false;
    if(filter && filter.tag && (it.q.tags||[]).indexOf(filter.tag) === -1) return false;
    return true;
  });
  var emergency = E.emergencyOn();
  // 1) due reviews first (max 3, or 4 in emergency)
  var due = E.dueItems().filter(function(id){
    var it = E.byId[id];
    if(filter && filter.type && it.type !== filter.type) return false;
    if(filter && filter.tag && (it.q.tags||[]).indexOf(filter.tag) === -1) return false;
    return true;
  }).slice(0, emergency ? 4 : 3);
  due.forEach(function(id){ picked.push(E.byId[id]); usedIds[id]=1; });
  // 2) coach-driven weak-tag targeting with interleaving + difficulty window
  var recs = E.coach().filter(function(r){ return !filter || !filter.tag || r.tag===filter.tag; });
  var weakTags = recs.slice(0, emergency ? 5 : 8).map(function(r){ return r.tag; });
  var tries = 0;
  while(picked.length < n && tries < 400){
    tries++;
    var strengthCheck = Math.random() < 0.15 && recs.length > 4; // desirable difficulty: occasional strength retrieval
    var tagPool = strengthCheck ? recs.slice(-4) : recs.filter(function(r){ return weakTags.indexOf(r.tag)!==-1; });
    if(!tagPool.length) tagPool = recs;
    var rec = tagPool[Math.floor(Math.random()*tagPool.length)];
    var lastTag = usedTags[usedTags.length-1];
    if(rec.tag === lastTag && Math.random() < 0.7) continue; // interleave
    var cands = pool.filter(function(it){
      if(usedIds[it.q.id]) return false;
      if((it.q.tags||[]).indexOf(rec.tag) === -1) return false;
      var ab = st.ability[it.type], qe = E.qElo(it.q);
      var p = E.pWin(ab, qe);
      return p >= 0.25 && p <= 0.92; // the learning zone
    });
    if(!cands.length){
      cands = pool.filter(function(it){ return !usedIds[it.q.id] && (it.q.tags||[]).indexOf(rec.tag) !== -1; });
    }
    if(!cands.length) continue;
    // prefer unseen, then oldest-seen
    cands.sort(function(a,b){
      var ia = st.items[a.q.id], ib = st.items[b.q.id];
      var sa = ia ? ia.last : 0, sb = ib ? ib.last : 0;
      return sa - sb;
    });
    var pick = cands[Math.floor(Math.random()*Math.min(3,cands.length))];
    picked.push(pick); usedIds[pick.q.id]=1; usedTags.push(rec.tag);
  }
  // 3) fallback fill
  if(picked.length < n){
    shuffle(pool).forEach(function(it){
      if(picked.length < n && !usedIds[it.q.id]){ picked.push(it); usedIds[it.q.id]=1; }
    });
  }
  return picked.slice(0,n);
};
E.diagnosticSet = function(){
  var ids = ['m01','m05','m30','c02','c18','c27','c36','w02','w19','w39','k03','k33','k21','k42'];
  return ids.map(function(id){ return E.byId[id]; }).filter(Boolean);
};
E.mockSet = function(){
  var P = FCE.BANK.passages;
  var p1 = P.p1[Math.floor(Math.random()*P.p1.length)];
  var p2 = P.p2[Math.floor(Math.random()*P.p2.length)];
  var p3 = P.p3[Math.floor(Math.random()*P.p3.length)];
  var kwts = shuffle(FCE.BANK.kwt).slice(0,6);
  return {p1:p1, p2:p2, p3:p3, p4:kwts};
};
E.recordMock = function(score, max, parts){
  var p = score/max;
  var map = [[0,128],[0.30,145],[0.45,155],[0.55,160],[0.70,170],[0.82,180],[0.92,188],[1,190]];
  var scale = 128;
  for(var i=0;i<map.length-1;i++){
    if(p >= map[i][0] && p <= map[i+1][0]){
      var f = (p-map[i][0])/(map[i+1][0]-map[i][0] || 1);
      scale = Math.round(map[i][1] + f*(map[i+1][1]-map[i][1]));
      break;
    }
  }
  E.state.mocks.push({t:Date.now(), score:score, max:max, scale:scale, parts:parts});
  E.award('mock');
  if(score >= 30) E.award('mock30');
  E.save();
  return scale;
};

/* ---------------- analytics helpers for views ---------------- */
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
        trend = (b.reduce(function(x,y){return x+y;},0)/b.length) - (a.reduce(function(x,y){return x+y;},0)/a.length);
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
E.readiness = function(){
  var pr = E.predict();
  var tagsSeen = Object.keys(E.state.tags).filter(function(t){return E.state.tags[t].att>0;}).length;
  var coverage = tagsSeen / Object.keys(FCE.TAGS).length;
  var mockDone = E.state.mocks.length ? 1 : 0.4;
  var vol = Math.min(1, E.state.records.total/120);
  return Math.round(100 * (0.45*pr.p + 0.2*coverage + 0.2*vol + 0.15*mockDone));
};
E.grammarBook = function(){
  var byTag = {};
  E.state.log.forEach(function(l){
    if(l.ok) return;
    (l.tags||[]).forEach(function(t){
      (byTag[t] = byTag[t] || []).push(l);
    });
  });
  var chapters = Object.keys(byTag).map(function(tag){
    var meta = FCE.TAGS[tag]; if(!meta) return null;
    var t = E.state.tags[tag] || {causes:{}};
    var topCause = null, max=0;
    Object.keys(t.causes||{}).forEach(function(c){ if(t.causes[c]>max){max=t.causes[c];topCause=c;} });
    return {tag:tag, meta:meta, errors:byTag[tag].slice(-8).reverse(), n:byTag[tag].length, topCause:topCause, m:E.mEff(tag)};
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
E.level = function(){ return Math.floor(Math.sqrt(E.state.xp/90)) + 1; };
E.levelProgress = function(){
  var lvl = E.level();
  var cur = Math.pow(lvl-1,2)*90, next = Math.pow(lvl,2)*90;
  return (E.state.xp-cur)/(next-cur);
};
})();
