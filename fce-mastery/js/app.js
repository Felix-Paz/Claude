/* FCE Mastery — bootstrap & navigation */
(function(){
var NAV = [
  ['dash','🏠','Dashboard'],
  ['practice','✏️','Practice'],
  ['mock','📝','Mock Test'],
  ['stats','📊','Radar & Stats'],
  ['memory','🧠','Memory Lab'],
  ['book','📖','Grammar Book'],
  ['coach','🎯','Coach'],
  ['awards','🏆','Awards'],
  ['settings','⚙️','Settings'],
];

/* mock intro view */
FCE.ui.views.mock = function(){
  var eng = FCE.engine;
  var mocks = eng.state.mocks;
  var v = FCE.ui.el(
    '<div class="h-page">Mock Test — Use of English</div>'+
    '<p class="sub">The full 36-mark paper: four parts, 35 minutes, official-style scoring (Part 4 gives 0, 1 or 2 marks per item). No feedback until you submit — just like the real room.</p>'+
    '<div class="grid g2" style="margin-bottom:16px">'+
      '<div class="card"><h3>📋 What you’ll face</h3>'+
        '<div class="stack" style="gap:7px;font-size:13.5px">'+
        '<div>🔠 <b>Part 1</b> — Multiple-Choice Cloze · 8 gaps · 8 marks</div>'+
        '<div>✏️ <b>Part 2</b> — Open Cloze · 8 gaps · 8 marks</div>'+
        '<div>🧩 <b>Part 3</b> — Word Formation · 8 gaps · 8 marks</div>'+
        '<div>🔁 <b>Part 4</b> — Transformations · 6 items · 12 marks</div>'+
        '</div></div>'+
      '<div class="card"><h3>🎓 Examiner tips</h3>'+
        '<div class="stack" style="gap:7px;font-size:13px;color:var(--tx2)">'+
        '<div>• Never leave a gap blank — wrong answers cost nothing.</div>'+
        '<div>• Part 2: ONE word only. Part 4: 2–5 words, key word unchanged.</div>'+
        '<div>• Spelling counts everywhere. Check it before you submit.</div>'+
        '<div>• Budget: ~8 min per part, 3 to review.</div>'+
        '</div></div>'+
    '</div>'+
    (mocks.length ? '<div class="card" style="margin-bottom:16px"><h3>📈 Your mock history</h3>'+
      mocks.slice(-5).reverse().map(function(m){
        return '<div class="row between" style="padding:6px 0;font-size:13.5px"><span>'+new Date(m.t).toLocaleDateString()+'</span><span class="mono">'+m.score+'/36</span><span class="chip '+(m.scale>=160?'ok':'warn')+'">scale '+m.scale+'</span></div>';
      }).join('')+'</div>' : '')+
    '<button class="btn primary block" id="mock-start" style="font-size:16px;padding:15px">Start mock test (35:00) →</button>'
  );
  FCE.ui.$('#mock-start', v).addEventListener('click', function(){ FCE.practice.mock(); });
  return v;
};

function boot(){
  FCE.engine.load();
  FCE.engine.indexBank();
  var sb = document.querySelector('.sidebar');
  sb.innerHTML =
    '<div class="logo"><div class="logo-badge">F</div><div class="logo-name">FCE Mastery<small>Use of English</small></div></div>'+
    NAV.map(function(n){
      return '<button class="nav-btn" data-v="'+n[0]+'"><span class="ic">'+n[1]+'</span><span>'+n[2]+'</span></button>';
    }).join('')+
    '<div class="nav-spacer"></div>'+
    '<div class="nav-foot">Adaptive engine runs 100% on-device.<br>No internet · no account · no API.</div>';
  Array.prototype.forEach.call(sb.querySelectorAll('.nav-btn'), function(b){
    b.addEventListener('click', function(){ FCE.ui.go(b.dataset.v); });
  });
  FCE.ui.go(FCE.engine.state.onboarded ? 'dash' : 'onboard');
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
