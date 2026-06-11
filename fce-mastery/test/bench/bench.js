/* Engine benchmark: V1 vs V3 vs V4 (live).
   Simulates synthetic students with planted weaknesses, forgetting and learning,
   then measures how intelligently each engine version behaves.

   Metrics:
   - discover   : questions until the planted weakest skill enters the coach's top 3
   - targeting  : % of questions (after warm-up) that hit a planted weak skill
   - coverage60 : % of all skills touched within the first 60 questions
   - balance40  : max-min spread of part counts in the first 40 questions (lower = fairer)
   - reserveLag : median questions until a missed CONCEPT is served again (new exercise)
   - gain       : final true skill on the weak tags (targeted practice raises it faster)
   - predMAE    : |predicted exam accuracy − true exam accuracy| at the end
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadEngine(files, seed){
  const seededMath = Object.create(Math);
  seededMath.random = mulberry((seed||1)*7919 + 13);
  const ctx = { console, Math: seededMath, Date, JSON, setTimeout, clearTimeout,
    localStorage:{ _s:{}, getItem(k){return this._s[k]||null;}, setItem(k,v){this._s[k]=v;}, removeItem(k){delete this._s[k];} } };
  ctx.window = ctx; ctx.global = ctx;
  vm.createContext(ctx);
  files.forEach(f => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, {filename:f}));
  ctx.FCE.engine.load();
  ctx.FCE.engine.indexBank();
  return ctx.FCE;
}
const dir = p => path.join(__dirname, p);
const VERSIONS = {
  V1: ['v1/data-core.js','v1/data-bank1.js','v1/data-bank2.js','v1/engine.js'].map(f => dir(f)),
  V3: ['v3/data-core.js','v3/data-bank1.js','v3/data-bank2.js','v3/data-bank3.js','v3/engine.js'].map(f => dir(f)),
  V4: ['../../js/data-core.js','../../js/data-bank1.js','../../js/data-bank2.js','../../js/data-bank3.js','../../js/data-bank4.js','../../js/data-bank5.js','../../js/engine.js'].map(f => dir(f)),
};

/* ---------- synthetic student ---------- */
function mulberry(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function makeStudent(FCE, seed){
  const rnd = mulberry(seed);
  const tags = Object.keys(FCE.TAGS);
  const skill = {};
  tags.forEach(t => skill[t] = 0.55 + rnd()*0.3);            // mid 0.55–0.85
  // plant 3 weak skills among the heavyweight ones (so they matter)
  const heavy = tags.slice().sort((a,b)=>FCE.TAGS[b].weight-FCE.TAGS[a].weight).slice(0,10);
  const weak = [];
  while(weak.length < 3){ const t = heavy[Math.floor(rnd()*heavy.length)]; if(!weak.includes(t)) weak.push(t); }
  weak.forEach(t => skill[t] = 0.22 + rnd()*0.13);           // 0.22–0.35
  return { skill, weak, rnd,
    pCorrect(q){
      const ts = (q.tags||[]).filter(t=>skill[t]!==undefined);
      const base = ts.length ? ts.reduce((x,t)=>x+skill[t],0)/ts.length : 0.6;
      return Math.max(0.05, Math.min(0.97, base - ((q.diff||3)-3)*0.06));
    },
    learn(q, hit){ // feedback teaches; weak-tag hits teach most (they have headroom)
      (q.tags||[]).forEach(t => { if(skill[t]!==undefined) skill[t] += (hit?0.045:0.02)*(0.95-skill[t]); });
    }};
}
function trueExamAcc(FCE, student){
  // fixed pseudo-exam: every bank item at its stated difficulty, expectation not sampling
  const all = FCE.engine.allItems();
  let s = 0;
  all.forEach(it => s += student.pCorrect(it.q));
  return s/all.length;
}

/* ---------- run one engine × one student ---------- */
function run(FCE, seed){
  const E = FCE.engine;
  E.reset(); E.load();
  const student = makeStudent(FCE, seed);
  const weakSet = new Set(student.weak);
  const N_SESS = 12, PER = 10;
  let qCount = 0, discover = null, hitWeak = 0, afterWarm = 0;
  const seenTags = new Set(), typeCount = {}, firstTypes = [];
  const missQueue = []; const reserveLags = [];
  for(let s = 0; s < N_SESS; s++){
    let sess;
    try { sess = E.pickSession(PER); } catch(e){ sess = []; }
    if(!sess.length) break;
    for(const it of sess){
      qCount++;
      const tset = it.q.tags||[];
      tset.forEach(t => seenTags.add(t));
      if(qCount <= 40){ typeCount[it.type] = (typeCount[it.type]||0)+1; firstTypes.push(it.type); }
      // reserve-lag bookkeeping: does this question revisit a previously missed concept?
      for(const m of missQueue){
        if(!m.done && m.q !== it.q.id && tset.some(t => m.tags.includes(t))){
          m.done = true; reserveLags.push(qCount - m.at);
        }
      }
      const correct = student.rnd() < student.pCorrect(it.q);
      if(qCount > 30){ afterWarm++; if(tset.some(t => weakSet.has(t))) hitWeak++; }
      const conf = student.rnd() < 0.5 ? (correct ? 'f' : 'g') : '';
      try {
        E.record(it.q, it.type, correct, conf, 20000, 'x', '', {quiet:true});
      } catch(e){ E.record(it.q, it.type, correct, conf||'f', 20000, 'x', '', {quiet:true}); }
      if(!correct) missQueue.push({q:it.q.id, tags:tset.slice(0,2), at:qCount, done:false});
      student.learn(it.q, tset.some(t => weakSet.has(t)));
      if(discover === null){
        try {
          const top3 = E.coach().slice(0,3).map(r => r.tag);
          if(top3.some(t => weakSet.has(t))) discover = qCount;
        } catch(e){}
      }
    }
  }
  const counts = Object.values(typeCount);
  const balance = counts.length ? Math.max(...counts, 0) - Math.min(...counts.concat(counts.length<4?[0]:[])) : 99;
  const gain = student.weak.reduce((x,t)=>x+student.skill[t],0)/student.weak.length;
  const tAcc = trueExamAcc(FCE, student);
  let predP = null;
  try { predP = E.predict().p; } catch(e){}
  reserveLags.sort((a,b)=>a-b);
  return {
    discover: discover === null ? 999 : discover,
    targeting: afterWarm ? hitWeak/afterWarm : 0,
    coverage60: Math.min(1, seenTags.size/Object.keys(FCE.TAGS).length),
    balance40: balance,
    reserveLag: reserveLags.length ? reserveLags[Math.floor(reserveLags.length/2)] : 999,
    gain, predMAE: predP === null ? 1 : Math.abs(predP - tAcc),
  };
}

/* ---------- benchmark all versions ---------- */
const SEEDS = [11,23,37,42,58,71,89,97,113,131];
const results = {};
for(const [name, files] of Object.entries(VERSIONS)){
  const agg = {};
  for(const seed of SEEDS){
    const FCE = loadEngine(files, seed);    // fresh, seeded context per run
    const r = run(FCE, seed);
    for(const k of Object.keys(r)) (agg[k] = agg[k]||[]).push(r[k]);
  }
  results[name] = {};
  for(const k of Object.keys(agg)){
    const v = agg[k].slice().sort((a,b)=>a-b);
    results[name][k] = { mean: agg[k].reduce((x,y)=>x+y,0)/agg[k].length, med: v[Math.floor(v.length/2)] };
  }
}
function fmt(name, k, mult, unit, digits){
  const r = results[name][k];
  return (r.mean*mult).toFixed(digits===undefined?1:digits) + (unit||'');
}
const rows = [
  ['Weakness found in top-3 after (questions, ↓)', 'discover', 1, '', 1],
  ['Weak-skill targeting share (↑)',               'targeting', 100, '%', 1],
  ['Skill coverage by Q60 (↑)',                    'coverage60', 100, '%', 1],
  ['Part imbalance, first 40 Q (↓)',               'balance40', 1, '', 1],
  ['Missed concept re-served within (Q, ↓)',       'reserveLag', 1, '', 1],
  ['Final true skill on weaknesses (↑)',           'gain', 100, '%', 1],
  ['Prediction error |pred − true| (↓)',           'predMAE', 100, ' pts%', 1],
];
let out = 'ENGINE BENCHMARK — 10 synthetic students × 120 questions each\n';
out += ''.padEnd(48) + 'V1'.padEnd(12) + 'V3'.padEnd(12) + 'V4\n';
for(const [label, k, mult, unit, d] of rows){
  out += label.padEnd(48) + fmt('V1',k,mult,unit,d).padEnd(12) + fmt('V3',k,mult,unit,d).padEnd(12) + fmt('V4',k,mult,unit,d) + '\n';
}
console.log(out);
fs.writeFileSync(path.join(__dirname, 'results.txt'), out);
