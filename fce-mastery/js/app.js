/* Mastery (FCE) — bootstrap: topbar + dock + blobs */
window.FCE = window.FCE || {};
FCE.app = (function(){
var A = {};
var NAV_FULL = [
  ['dash','⌂','Home'],
  ['practice','✎','Train'],
  ['mock','▤','Mock'],
  ['coach','◎','Coach'],
  ['progress','◔','Stats'],
  ['book','❡','Book'],
  ['settings','⚙','Setup'],
];
var NAV_LITE = [
  ['lite','⌂','Home'],
  ['mock','▤','Mock'],
  ['settings','⚙','Setup'],
];

/* mock intro view */
FCE.ui.views.mock = function(){
  var eng = FCE.engine;
  var mocks = eng.state.mocks;
  var done = eng.state.papersDone;
  var rec = eng.nextPaper();
  var doneN = Object.keys(done).length;
  var v = FCE.ui.el(
    '<div class="h-page">Mock <em>Test</em></div>'+
    '<p class="sub">Twelve complete, fixed Use of English papers — like a book of past exams. Every passage and every transformation belongs to <b>one paper only</b>, so each mock is 100% fresh material. Papers 9–12 are <b>Challenge papers</b>: set above exam level and graded with a stated difficulty allowance.</p>'+
    '<div class="row wrap" style="margin-bottom:16px">'+
      '<span class="chip acc">12 fixed papers</span>'+
      '<span class="chip">8 standard · 4 challenge ⛰️</span>'+
      '<span class="chip '+(doneN?'ok':'')+'">'+doneN+' of 12 completed</span>'+
      '<span class="chip" title="Nothing rotates between papers: 36 exclusive passages + 72 exclusive transformations, none of which ever appear in practice sessions.">every exercise exclusive to its paper</span>'+
    '</div>'+
    '<div class="card" style="margin-bottom:16px"><h3>Up next for you: Paper '+rec.paper.n+(rec.paper.level==='challenge'?' · Challenge ⛰️':'')+'</h3>'+
      '<div class="muted" style="font-size:13.5px">'+
      (rec.retake ? 'You have completed all 12 papers — this is your oldest result, served as a retake (revision value only).'
        : (eng.recommendedLevel()==='challenge'
          ? 'Your training ability is running above exam level, so the engine is dealing you a <b>Challenge paper</b>: harder collocations, inversion, double word-formation shifts. Scoring includes a +12% difficulty allowance — and your result will say exactly how much it was worth.'
          : 'Standard papers mirror the real exam one-to-one. Challenge papers (9–12) unlock value once your ability climbs above exam level — you can still try one early, it just plays rough.'))+
      '</div></div>'+
    '<h3 class="sec-label">Choose your paper</h3>'+
    '<div class="paper-grid" style="margin-bottom:16px">'+
      FCE.PAPERS.map(function(p){
        var d = done[p.n], isRec = p.n === rec.paper.n && !rec.retake;
        return '<button class="paper-card'+(p.level==='challenge'?' ch':'')+(d?' done':'')+(isRec?' rec':'')+'" data-paper="'+p.n+'">'+
          '<span class="pc-n">'+p.n+'</span>'+
          '<span class="pc-lvl">'+(p.level==='challenge'?'⛰️ Challenge':'Standard')+'</span>'+
          (d ? '<span class="pc-done">✓ '+d.score+'/36 · scale '+d.scale+'</span>'
             : (isRec ? '<span class="pc-done rec-tag">▸ recommended</span>' : '<span class="pc-done fresh">unseen</span>'))+
        '</button>';
      }).join('')+
    '</div>'+
    '<div class="grid g2" style="margin-bottom:16px">'+
      '<div class="card"><h3>What you’ll face</h3>'+
        '<div class="stack" style="gap:7px;font-size:13.5px">'+
        '<div><b>Part 1</b> · Multiple-Choice Cloze — 8 gaps · 8 marks</div>'+
        '<div><b>Part 2</b> · Open Cloze — 8 gaps · 8 marks</div>'+
        '<div><b>Part 3</b> · Word Formation — 8 gaps · 8 marks</div>'+
        '<div><b>Part 4</b> · Transformations — 6 items · 12 marks</div>'+
        '</div></div>'+
      '<div class="card"><h3>Examiner’s corner</h3>'+
        '<div class="stack" style="gap:7px;font-size:13px;color:var(--tx2)">'+
        '<div>• Never leave a blank — wrong answers cost nothing.</div>'+
        '<div>• Part 2: ONE word. Part 4: 2–5 words, key word unchanged.</div>'+
        '<div>• Spelling counts everywhere.</div>'+
        '<div>• Budget ≈ 8 minutes per part, 3 to check.</div>'+
        '</div></div>'+
    '</div>'+
    (mocks.length ? '<div class="card" style="margin-bottom:16px"><h3>Your mock history</h3>'+
      mocks.slice(-5).reverse().map(function(m){
        return '<div class="row between" style="padding:6px 0;font-size:13.5px"><span>'+new Date(m.t).toLocaleDateString()+(m.paper?' · Paper '+m.paper:'')+(m.level==='challenge'?' ⛰️':'')+'</span><span class="mono">'+m.score+'/36</span><span class="chip '+(m.scale>=160?'ok':'warn')+'">scale '+m.scale+(m.delta?' <span title="includes the challenge-paper allowance">(+'+m.delta+')</span>':'')+'</span></div>';
      }).join('')+'</div>' : '')+
    '<button class="btn primary block" id="mock-start" style="font-size:16px;padding:16px">Start Paper '+rec.paper.n+' · 35:00 ▸</button>'
  );
  FCE.ui.$('#mock-start', v).addEventListener('click', function(){ FCE.practice.mock(rec.paper.n); });
  FCE.ui.$$('.paper-card', v).forEach(function(b){
    b.addEventListener('click', function(){ FCE.practice.mock(+b.dataset.paper); });
  });
  return v;
};

A.buildTopbar = function(){
  var tb = document.getElementById('topbar');
  if(!tb) return;
  var eng = FCE.engine, st = eng.state;
  tb.innerHTML =
    '<div class="tb-logo">'+FCE.ui.wordmark()+'</div>'+
    '<div class="tb-spacer"></div>'+
    '<div class="tb-level" title="XP = effort made visible. Levels grow on a square-root curve — each costs more work, and the engine raises its expectations as you climb."><span class="lvl">LVL '+eng.level()+'</span><div class="bar thin"><i class="shimmer" style="width:'+Math.round(eng.levelProgress()*100)+'%"></i></div><span class="lvl">'+st.xp+' XP</span></div>'+
    '<span class="tb-chip flame" title="Consecutive days practised. Habit is the best predictor of passing — protect the flame."><span class="fl">🔥</span>'+st.streak.count+'</span>';
};

A.buildNav = function(){
  var sb = document.querySelector('.sidebar');
  var items = FCE.ui.isLite() ? NAV_LITE : NAV_FULL;
  sb.innerHTML =
    '<div class="rail-card">'+
    items.map(function(n){
      return '<button class="nav-btn" data-v="'+n[0]+'" title="'+n[2]+'"><span class="ic">'+n[1]+'</span><span>'+n[2]+'</span></button>';
    }).join('')+
    '</div><div class="nav-spacer"></div>';
  Array.prototype.forEach.call(sb.querySelectorAll('.nav-btn'), function(b){
    b.addEventListener('click', function(){ FCE.ui.go(b.dataset.v); });
  });
  A.buildTopbar();
};

function boot(){
  FCE.engine.load();
  FCE.engine.indexBank();
  // liquid background blobs
  ['b1','b2','b3'].forEach(function(c){
    var d = document.createElement('div');
    d.className = 'blob '+c;
    document.body.appendChild(d);
  });
  A.buildNav();
  FCE.ui.go(FCE.engine.state.onboarded ? 'dash' : 'onboard');
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
return A;
})();
