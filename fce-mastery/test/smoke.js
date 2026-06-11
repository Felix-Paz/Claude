/* Headless smoke test for the Mastery engine (no DOM needed). */
global.window = global;
global.localStorage = { _s:{}, getItem(k){ return this._s[k]||null; }, setItem(k,v){ this._s[k]=v; }, removeItem(k){ delete this._s[k]; } };
require('../js/data-core.js');
require('../js/data-bank1.js');
require('../js/data-bank2.js');
require('../js/data-bank3.js');
require('../js/data-bank4.js');
require('../js/data-bank5.js');
require('../js/data-bank6.js');
require('../js/data-vocab.js');
require('../js/engine.js');
require('../js/charts.js');

const E = FCE.engine;
let fails = 0;
function ok(cond, msg){ if(cond){ console.log('  ✓ ' + msg); } else { fails++; console.log('  ✗ FAIL: ' + msg); } }

console.log('— bank integrity —');
E.load(); E.indexBank();
const all = E.allItems();
ok(all.length >= 540, `bank has ${all.length} items (>=540)`);
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
    if(a.toLowerCase().indexOf(q.key.toLowerCase()) === -1) kwtBad.push(q.id+' missing key in "'+a+'"');
  });
  if(!q.halves || q.halves.length !== 2) kwtBad.push(q.id+' halves');
  if(q.s2.indexOf('____') === -1) kwtBad.push(q.id+' no gap');
});
ok(kwtBad.length === 0, 'KWT answers 2–5 words, contain key, halves & gaps ok' + (kwtBad.length? ' | '+kwtBad.join(' | '):''));
let gapBad = [];
FCE.BANK.cloze.forEach(q => { if(q.s.indexOf('____') === -1) gapBad.push(q.id); });
FCE.BANK.wf.forEach(q => { if(q.s.indexOf('____') === -1) gapBad.push(q.id); });
FCE.BANK.mcc.forEach(q => { if(q.s.indexOf('____') === -1) gapBad.push(q.id); if(q.opts.length!==4 || q.cor<0 || q.cor>3) gapBad.push(q.id+' opts'); });
ok(gapBad.length === 0, 'cloze/wf/mcc well-formed' + (gapBad.length? ' | '+gapBad.join(','):''));
let pBad = [];
['p1','p2','p3'].forEach(p => FCE.BANK.passages[p].forEach(ps => {
  ps.gaps.forEach(g => {
    const marker = '('+g.n+')' + (p==='p3' ? g.stem : '');
    if(ps.text.indexOf(marker) === -1) pBad.push(ps.id+' gap '+g.n);
  });
  if(ps.gaps.length !== 8) pBad.push(ps.id+' has '+ps.gaps.length+' gaps');
}));
ok(pBad.length === 0, 'passage markers match text ('+FCE.BANK.passages.p2.length+' open-cloze passages)' + (pBad.length? ' | '+pBad.join(' | '):''));
let spellBad = [];
FCE.SPELL.forEach(s => { s.bad.forEach(b => { if(b === s.w) spellBad.push(s.w); }); });
ok(spellBad.length === 0 && FCE.SPELL.length >= 40, `spelling bank ok (${FCE.SPELL.length} words)`);
let defBad = [];
FCE.SPELL.forEach(sp => {
  if(!sp.def || !sp.cue) defBad.push(sp.w+' missing def/cue');
  else if(sp.def.toLowerCase().includes(sp.w)) defBad.push(sp.w+' leaks into def');
});
ok(defBad.length === 0, 'gym clues never reveal the word' + (defBad.length? ' | '+defBad.join(', '):''));
let vBad = [];
FCE.VOCAB.forEach(vx => { if(!vx.basic || !vx.up || !vx.s || vx.s.indexOf('____')===-1) vBad.push(vx.up); });
ok(FCE.VOCAB.length >= 54 && vBad.length === 0, `essay vocab bank ok (${FCE.VOCAB.length} upgrades)`);

console.log('— grading & diagnosis —');
const k01 = FCE.BANK.kwt.find(q => q.id==='k01');
ok(E.gradeKWT(k01, ' Is  Being  BUILT. ').score === 2, 'KWT tolerant full match');
ok(E.gradeKWT(k01, 'is being build').score === 1, 'KWT partial credit');
ok(E.gradeKWT(k01, 'was builded').score === 0, 'KWT zero');
ok(E.wordCount("didn't") === 2, 'contraction = two words');
const d1 = E.diagnose({ans:['since']}, 'cloze', 'sinse');
ok(d1.code === 'spell', 'diagnosis: spelling slip detected ('+d1.code+')');
const d2 = E.diagnose({ans:['which'], gt:'rel'}, 'cloze', 'of');
ok(d2.code === 'class', 'diagnosis: wrong word class detected ('+d2.code+')');
const d3 = E.diagnose({ans:['decision']}, 'wf', 'decidement');
ok(d3.code === 'family', 'diagnosis: word-family error detected ('+d3.code+')');
const d4 = E.diagnose(k01, 'kwt', 'gets built now');
ok(d4.code === 'key', 'diagnosis: missing key word detected');
ok(E.diagnose({ans:['since']}, 'cloze', '').code === 'blank', 'diagnosis: blank detected');
ok(E.spellPattern('begining','beginning').id === 'double', 'spell pattern: double letters');
ok(E.spellPattern('seperate','separate').id === 'vowel', 'spell pattern: weak vowel');
ok(['s','f','g'].includes(E.inferConf({ttfk:1200, edits:0, pauses:0, changed:false}, 9000, 35000)), 'behavioural confidence inference runs');
ok(E.inferConf({ttfk:1200, edits:0, pauses:0, changed:false}, 9000, 35000) === 's', 'fluent trace → inferred certain');
ok(E.inferConf({ttfk:9000, edits:8, pauses:3, changed:true}, 60000, 35000) === 'g', 'hesitant trace → inferred guessing');

console.log('— learning loop —');
E.reset(); E.load();
ok(E.diagnosticSet().length === 14, 'diagnostic resolves');
let seed = 1234567;
const srnd = () => { seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
let n = 0;
for(let round = 0; round < 8; round++){
  const sess = E.pickSession(12);
  if(round === 0){
    const tc = {};
    sess.forEach(it => tc[it.type] = (tc[it.type]||0)+1);
    const maxT = Math.max(...Object.values(tc));
    ok(Object.keys(tc).length === 4 && maxT <= 4, 'first session balances all 4 parts: '+JSON.stringify(tc));
  }
  sess.forEach(it => {
    const isPrep = (it.q.tags||[]).some(t => t==='prep'||t==='depprep');
    const correct = isPrep ? srnd() < 0.25 : srnd() < 0.85;
    E.record(it.q, it.type, correct, srnd()<0.5?'f':'', 20000, 'x', '', {quiet:true,
      beh:{ttfk:2000, edits:correct?0:4, pauses:0, switches:0, changed:false, firstGuess:'', firstRight:false, skipped:false}});
    if(!correct) E.setCause(srnd()<0.5 ? 'gap' : 'mix');
    n++;
  });
}
console.log(`  (simulated ${n} answers, weak at prepositions)`);
const coach = E.coach();
const prepRank = coach.findIndex(r => r.tag === 'prep');
ok(prepRank <= 4, `coach ranks the planted weakness #${prepRank+1}`);
ok(Object.keys(E.state.boost).length > 0, 'errors created concept boosts ('+Object.keys(E.state.boost).join(',')+')');
const sess2 = E.pickSession(10);
ok(sess2.length === 10, 'boosted selection still fills sessions');
const pr = E.predict();
ok(pr.scale >= 122 && pr.scale <= 190 && pr.grade, `prediction: grade ${pr.grade}, scale ${pr.scale}±${pr.ci}, pass ${(pr.pass*100).toFixed(0)}%`);
ok(pr.pass > 0.4, 'predictor not unfairly pessimistic for a ~70% student');
// wants flow
const someItem = sess2[0].q;
E.record(someItem, sess2[0].type, false, '', 9000, 'zz', '', {quiet:true});
E.addWant(someItem.id);
ok(E.state.wants[someItem.id], 'want registered');
E.record(someItem, sess2[0].type, true, '', 9000, 'x', '', {quiet:true});
E.record(someItem, sess2[0].type, true, '', 9000, 'x', '', {quiet:true});
ok(!E.state.wants[someItem.id], 'want cleared after two clean wins');
// amend flow
const cl = FCE.BANK.cloze.find(q => q.id==='c01');
E.record(cl, 'cloze', false, 'f', 5000, 'during', '', {quiet:true});
ok(E.amend('c01') === true, 'amend (user was right) accepted');
ok(E.gradeOne(cl, 'during') === true, 'amended answer now grades correct');
ok(E.state.reports.length === 1, 'dispute report stored');
// positional intelligence
const feats = E.clozeFeatures({s:'____ being tired, she carried on.'});
ok(feats.indexOf('start') !== -1, 'positional: sentence-start gap detected');
const feats2 = E.clozeFeatures({s:'He went to work even ____ he felt ill.'});
ok(feats2.indexOf('mid') !== -1, 'positional: mid-sentence gap detected');
const startBefore = (E.state.pos.start || {att:0}).att;
E.recPos({s:'____ being tired, she carried on.'}, false);
E.recPos({s:'____ matter how hard I try, I fail.'}, false);
E.recPos({s:'____ long as you try, you pass.'}, false);
E.recPos({s:'____ though it rained, we played.'}, false);
ok(E.state.pos.start.att === startBefore + 4, 'positional tracker accumulates sentence-start data');
ok(E.posReport().some(p => p.k === 'start'), 'positional report includes sentence-start');
ok(typeof E.worstPos() === 'string' && E.worstPos().length > 0, 'worst position identified for selection ('+E.worstPos()+')');
// vocab lab
const vset = E.vocabSet(8);
ok(vset.length === 8, 'vocab lab builds a round');
E.recordVocab(vset[0], true);
ok(E.state.vocab[vset[0].up[0]].box === 1, 'vocab Leitner box advances');
ok(E.gradeVocab(vset[0], vset[0].up[0].toUpperCase()+' ') === true, 'vocab grading tolerant');
const fs2 = E.searchLearnables('had better');
ok(fs2.length > 0, 'focus search finds "had better" ('+fs2.length+' hits)');
E.focusAdd(fs2[0]);
ok(Object.keys(E.state.boost).length > 0 || Object.keys(E.state.wants).length > 0, 'focus search feeds the engine');
// spelling gym — incl. the white-screen regression (own-mistake words must carry a def)
E.state.spell.words['decision'] = 2; // simulate a word missed in sessions that is NOT in FCE.SPELL
const gym = E.spellingSet(8);
ok(gym.every(g => g.def && g.cue), 'every gym item has a definition clue (white-screen fix)');
ok(typeof E.difficultyTier().name === 'string', 'difficulty tier resolves ('+E.difficultyTier().name+')');
ok(gym.length === 8, 'spelling gym builds a round');
E.recordSpell(gym[0].w, true);
ok(E.state.spellSeen[gym[0].w] === 1, 'spelling result recorded');
// misc analytics
ok(E.heatmap().length === Object.keys(FCE.GAPTYPES).length, 'heatmap covers gap types');
ok(E.dna().total > 0, 'mistake DNA aggregates');
ok(E.grammarBook().length > 0, 'grammar book builds');
ok(typeof E.readiness() === 'number', 'readiness computes');
ok(E.behaviorReport() && E.behaviorReport().n > 0, 'behaviour report computes');
const mock = E.mockSet();
ok(mock.p1 && mock.p2 && mock.p3 && mock.p4.length === 6, 'mock set assembles');
const scale = E.recordMock(27, 36, {p1:6,p2:6,p3:6,p4:9});
ok(scale >= 168 && scale <= 184, `mock 27/36 → sensible scale (${scale})`);
ok(E.patternFor('is being built'), 'pattern intelligence matches');
ok(FCE.charts.gauge(165, 8).indexOf('<svg') === 0, 'gauge renders');
ok(FCE.charts.spark([0.4,0.6,0.7]).indexOf('<svg') === 0, 'spark renders');
const exp = E.export();
E.reset(); E.import(exp);
ok(E.state.reports.length === 1, 'export/import round-trip');

console.log(fails === 0 ? '\nALL SMOKE TESTS PASSED' : `\n${fails} FAILURES`);
process.exit(fails === 0 ? 0 : 1);
