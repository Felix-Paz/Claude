/* Headless smoke test for the FCE Mastery engine (no DOM needed). */
global.window = global;
global.localStorage = { _s:{}, getItem(k){ return this._s[k]||null; }, setItem(k,v){ this._s[k]=v; }, removeItem(k){ delete this._s[k]; } };
require('../js/data-core.js');
require('../js/data-bank1.js');
require('../js/data-bank2.js');
require('../js/engine.js');
require('../js/charts.js');

const E = FCE.engine;
let fails = 0;
function ok(cond, msg){ if(cond){ console.log('  ✓ ' + msg); } else { fails++; console.log('  ✗ FAIL: ' + msg); } }

console.log('— bank integrity —');
E.load(); E.indexBank();
const all = E.allItems();
ok(all.length >= 250, `bank has ${all.length} items (>=250)`);
const ids = new Set();
let dup = null;
all.forEach(it => { if(ids.has(it.q.id)) dup = it.q.id; ids.add(it.q.id); });
ok(!dup, 'no duplicate item ids' + (dup ? ' (dup: '+dup+')' : ''));
let badTags = [];
all.forEach(it => (it.q.tags||[]).forEach(t => { if(!FCE.TAGS[t]) badTags.push(it.q.id+':'+t); }));
ok(badTags.length === 0, 'all tags valid' + (badTags.length ? ' BAD: '+badTags.join(',') : ''));
let badGt = [];
FCE.BANK.cloze.forEach(q => { if(!FCE.GAPTYPES[q.gt]) badGt.push(q.id); });
ok(badGt.length === 0, 'all cloze gap types valid');
let kwtBad = [];
FCE.BANK.kwt.forEach(q => {
  q.ans.forEach(a => {
    const wc = E.wordCount(a);
    if(wc < 2 || wc > 5) kwtBad.push(q.id+' "'+a+'" ('+wc+'w)');
    const key = q.key.toLowerCase();
    if(a.toLowerCase().indexOf(key.toLowerCase()) === -1) kwtBad.push(q.id+' missing key in "'+a+'"');
  });
  if(!q.halves || q.halves.length !== 2) kwtBad.push(q.id+' halves');
  if(q.s2.indexOf('____') === -1) kwtBad.push(q.id+' no gap');
});
ok(kwtBad.length === 0, 'KWT answers are 2–5 words, contain key, have halves & gaps' + (kwtBad.length? ' | '+kwtBad.join(' | '):''));
let gapBad = [];
FCE.BANK.cloze.forEach(q => { if(q.s.indexOf('____') === -1) gapBad.push(q.id); });
FCE.BANK.wf.forEach(q => { if(q.s.indexOf('____') === -1) gapBad.push(q.id); });
FCE.BANK.mcc.forEach(q => { if(q.s.indexOf('____') === -1) gapBad.push(q.id); if(q.opts.length!==4 || q.cor<0 || q.cor>3) gapBad.push(q.id+' opts'); });
ok(gapBad.length === 0, 'cloze/wf/mcc gaps & options well-formed' + (gapBad.length? ' | '+gapBad.join(','):''));
// passages
let pBad = [];
['p1','p2','p3'].forEach(p => FCE.BANK.passages[p].forEach(ps => {
  ps.gaps.forEach(g => {
    const marker = '('+g.n+')' + (p==='p3' ? g.stem : '');
    if(ps.text.indexOf(marker) === -1) pBad.push(ps.id+' gap '+g.n+' marker "'+marker+'" not in text');
  });
  if(ps.gaps.length !== 8) pBad.push(ps.id+' has '+ps.gaps.length+' gaps');
}));
ok(pBad.length === 0, 'passage gap markers all match text' + (pBad.length? ' | '+pBad.join(' | '):''));

console.log('— grading —');
const k01 = FCE.BANK.kwt.find(q => q.id==='k01');
ok(E.gradeKWT(k01, ' Is  Being  BUILT. ').score === 2, 'KWT full match tolerant of case/space/punct');
ok(E.gradeKWT(k01, 'is being build').score === 1, 'KWT partial credit (one half)');
ok(E.gradeKWT(k01, 'was builded').score === 0, 'KWT zero for wrong');
const k22 = FCE.BANK.kwt.find(q => q.id==='k22');
ok(E.gradeKWT(k22, 'can’t have been').score === 2, 'curly apostrophe normalized');
ok(E.wordCount("didn't") === 2, 'contraction counts as two words');
ok(E.wordCount('would not have got') === 4, 'plain word count');
const c01 = FCE.BANK.cloze.find(q => q.id==='c01');
ok(E.gradeOne(c01, 'Since') === true && E.gradeOne(c01, 'for') === false, 'cloze grading');

console.log('— learning loop simulation —');
E.reset(); E.load();
const diag = E.diagnosticSet();
ok(diag.length === 14, 'diagnostic has 14 items, all resolvable');
// simulate 80 answers: weak at prepositions, strong elsewhere
let n = 0;
for(let round = 0; round < 8; round++){
  const sess = E.pickSession(10);
  ok(sess.length === 10 || round > 5, `session ${round+1} returns items (${sess.length})`);
  sess.forEach(it => {
    const isPrep = (it.q.tags||[]).some(t => t==='prep'||t==='depprep');
    const correct = isPrep ? Math.random() < 0.25 : Math.random() < 0.85;
    const conf = correct ? (Math.random()<0.3?'g':'s') : 's';
    E.record(it.q, it.type, correct, conf, 20000, 'x', '', {quiet:true});
    if(!correct) E.setCause(Math.random()<0.5 ? 'gap' : 'mix');
    n++;
  });
}
console.log(`  (simulated ${n} answers)`);
const coach = E.coach();
ok(coach.length === Object.keys(FCE.TAGS).length, 'coach covers all skills');
const prepRank = coach.findIndex(r => r.tag === 'prep');
ok(prepRank <= 4, `weak skill (prepositions) ranked high by coach (#${prepRank+1})`);
const pr = E.predict();
ok(pr.scale >= 122 && pr.scale <= 190, `prediction on Cambridge scale (${pr.scale} ±${pr.ci})`);
ok(pr.pass >= 0 && pr.pass <= 1 && pr.pA <= pr.pass + 1e-9, `probabilities coherent (pass ${(pr.pass*100).toFixed(0)}%, A ${(pr.pA*100).toFixed(0)}%)`);
const heat = E.heatmap();
ok(heat.length === Object.keys(FCE.GAPTYPES).length, 'heatmap covers all gap types');
const dna = E.dna();
ok(dna.total > 0 && dna.list.length > 0, `mistake DNA aggregates causes (${dna.total} tagged)`);
const book = E.grammarBook();
ok(book.length > 0 && book[0].errors.length > 0, `grammar book builds chapters (${book.length})`);
ok(typeof E.readiness() === 'number', 'readiness computes');
const due = E.dueItems();
ok(Array.isArray(due), `due queue works (${due.length} due)`);
const mock = E.mockSet();
ok(mock.p1 && mock.p2 && mock.p3 && mock.p4.length === 6, 'mock set assembles');
const scale = E.recordMock(27, 36, {p1:6,p2:6,p3:6,p4:9});
ok(scale > 160 && scale < 185, `mock 27/36 maps to sensible scale (${scale})`);
const hook = FCE.makeHook('put off');
ok(hook.indexOf('postpone') !== -1, 'hand-written hook found for "put off"');
ok(FCE.makeHook('whatever-novel-word').length > 30, 'generated hook for unknown word');
const pat = E.patternFor('is being built');
ok(pat && pat.id === 'pt-passive-being', 'pattern intelligence matches answers');
// charts render strings
ok(FCE.charts.gauge(165, 8).indexOf('<svg') === 0, 'gauge renders');
ok(FCE.charts.radar([{name:'a',val:.5},{name:'b',val:.7},{name:'c',val:.3}]).indexOf('<svg') === 0, 'radar renders');
ok(FCE.charts.calibration(E.confReality()).indexOf('<svg') === 0, 'calibration renders');
// persistence round-trip
const exp = E.export();
E.reset(); E.import(exp);
ok(E.state.records.total === n, 'export/import round-trip preserves state');

console.log(fails === 0 ? '\nALL SMOKE TESTS PASSED' : `\n${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
