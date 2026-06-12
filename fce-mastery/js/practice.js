/* Mastery (FCE) — sessions, spelling gym, mock test.
   Silent telemetry: hesitation, erase/rewrite cycles, first instinct, option switching,
   pauses, skips. Confidence rating optional — inferred from behaviour when not given. */
window.FCE = window.FCE || {};
FCE.practice = (function(){
var P = {};
var U = function(){ return FCE.ui; };
var E = function(){ return FCE.engine; };
var TYPE_LABEL = {kwt:'Part 4 · Transformation', cloze:'Part 2 · Open Cloze', wf:'Part 3 · Word Formation', mcc:'Part 1 · Multiple Choice'};

/* ---------- behaviour tracker ---------- */
function Tracker(t0){
  return { t0:t0, ttfk:0, edits:0, pauses:0, switches:0, lastInput:0, firstInput:0, keys:0,
           firstGuess:'', firstOpt:-1, settled:false, settleTimer:null, maxLen:0,
           skipped:false, pausedMs:0 };
}
function trackInput(tr, inp){
  inp.addEventListener('keydown', function(ev){
    var now = Date.now();
    if(!tr.ttfk) tr.ttfk = now - tr.t0 - tr.pausedMs;
    if(ev.key && ev.key.length === 1) tr.keys++;
    if(ev.key === 'Backspace' || ev.key === 'Delete') tr.edits++;
  });
  inp.addEventListener('input', function(){
    var now = Date.now();
    if(!tr.firstInput) tr.firstInput = now;
    if(tr.lastInput && now - tr.lastInput > 2000) tr.pauses++;
    tr.lastInput = now;
    if(inp.value.length > tr.maxLen) tr.maxLen = inp.value.length;
    if(tr.settleTimer) clearTimeout(tr.settleTimer);
    if(!tr.settled && inp.value.trim()){
      tr.settleTimer = setTimeout(function(){
        if(!tr.settled && inp.value.trim()){ tr.firstGuess = inp.value.trim(); tr.settled = true; }
      }, 1100);
    }
  });
}
function finishTracker(tr, finalVal){
  if(tr.settleTimer) clearTimeout(tr.settleTimer);
  if(!tr.settled && finalVal){ tr.firstGuess = String(finalVal).trim(); tr.settled = true; }
  return tr;
}
function behFromTracker(tr, finalVal, firstRight){
  var changed = tr.firstGuess && E().norm(tr.firstGuess) !== E().norm(finalVal||'');
  return { ttfk:tr.ttfk, edits:tr.edits, pauses:tr.pauses, switches:tr.switches,
           keys:tr.keys, typeMs: tr.firstInput ? Math.max(0, tr.lastInput - tr.firstInput) : 0,
           changed:!!changed, firstGuess: changed ? tr.firstGuess.slice(0,60) : '',
           firstRight:!!firstRight, skipped:tr.skipped };
}

/* ---------- key manager ---------- */
var keyHandler = null;
function setKeys(fn){
  if(keyHandler) document.removeEventListener('keydown', keyHandler);
  keyHandler = fn;
  if(fn) document.addEventListener('keydown', fn);
}
P.clearKeys = function(){ setKeys(null); };

/* ============================ SESSION ============================ */
var S = null;

P.start = function(cfg){
  cfg = cfg || {};
  var eng = E(), queue;
  var endless = cfg.mode === 'endless';
  if(cfg.mode === 'diagnostic') queue = eng.diagnosticSet();
  else if(cfg.mode === 'ids') queue = (cfg.ids||[]).map(function(id){ return eng.byId[id]; }).filter(Boolean);
  else queue = eng.pickSession(cfg.n || 10, {types:cfg.types, type:cfg.type, tag:cfg.tag});
  if(!queue.length){ U().toast('No questions available for that filter yet.'); return; }
  S = {queue:queue, idx:0, ok:0, run:0, mode:endless?'endless':(cfg.mode||'smart'), cfg:cfg,
       tag:cfg.tag||'', t0:Date.now(), selOpt:-1, conf:'', graded:false, results:[],
       skippedIds:{}, requeued:{}, planned:queue.length, summarySaved:false, paused:false, levelBefore:eng.level()};
  render();
};

function render(){
  var host = U().$('#view');
  host.innerHTML = '';
  if(S.mode !== 'endless' && S.idx >= S.queue.length){ host.appendChild(summaryView()); }
  else {
    if(S.mode === 'endless' && S.idx >= S.queue.length){
      var more = E().pickSession(10, {types:S.cfg.types, type:S.cfg.type, tag:S.cfg.tag});
      more.forEach(function(it){ S.queue.push(it); });
      if(S.idx >= S.queue.length){ host.appendChild(summaryView()); window.scrollTo(0,0); return; }
    }
    host.appendChild(qView());
  }
  window.scrollTo(0,0);
}

function qView(){
  var u = U(), eng = E();
  var it = S.queue[S.idx], q = it.q;
  S.selOpt = -1; S.conf = ''; S.graded = false;
  var tr = S.tr = Tracker(Date.now());
  tr.skipped = !!S.skippedIds[q.id];
  var seen = eng.state.items[q.id];
  var isReview = seen && seen.att > 0;
  var par = eng.par(it.type, q.diff);
  var endless = S.mode === 'endless';

  var body = '';
  if(it.type === 'kwt'){
    body = '<div class="q-text">'+u.esc(q.s1)+'</div>'+
      '<div class="q-key">key word: <b>'+u.esc(q.key)+'</b> <span class="tiny">2–5 words, key word unchanged</span></div>'+
      '<div class="q-text" style="margin-top:8px">'+gapify(q.s2)+'</div>'+
      '<input class="ans-input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the missing words…">'+
      '<div class="tiny" id="wc" style="margin-top:6px"></div>';
  } else if(it.type === 'cloze'){
    body = '<div class="q-text">'+gapify(q.s)+'</div>'+
      '<input class="ans-input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="One word only…">';
  } else if(it.type === 'wf'){
    body = '<div class="q-text">'+gapify(q.s)+'</div>'+
      '<div class="q-key" style="margin-top:12px">stem: <span class="q-stem">'+u.esc(q.stem)+'</span> <span class="tiny">— transform it to fit</span></div>'+
      '<input class="ans-input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="The transformed word…">';
  } else {
    // display order is shuffled; data-i keeps the ORIGINAL index so grading/telemetry are untouched
    var ord = q.opts.map(function(_,i){ return i; });
    for(var z=ord.length-1; z>0; z--){ var rz=Math.floor(Math.random()*(z+1)), tz=ord[z]; ord[z]=ord[rz]; ord[rz]=tz; }
    body = '<div class="q-text">'+gapify(q.s)+'</div>'+
      '<div class="opts">'+ord.map(function(oi,pos){
        return '<button class="opt" data-i="'+oi+'"><span class="letter">'+String.fromCharCode(65+pos)+'</span><span>'+u.esc(q.opts[oi])+'</span></button>';
      }).join('')+'</div>';
  }

  var v = u.el(
  '<div class="q-shell">'+
    '<div class="q-top">'+
      '<button class="btn small ghost" id="q-quit">✕ End</button>'+
      '<button class="btn small ghost" id="q-pause" title="Pause — the clock stops">⏸</button>'+
      '<div class="q-progress"><div class="bar"><i style="width:'+(endless?100:Math.round(100*S.idx/S.queue.length))+'%"></i></div></div>'+
      '<span class="tiny mono">'+(endless ? (S.results.length+1)+' ∞' : (S.idx+1)+' / '+S.queue.length)+'</span>'+
      (S.run >= 3 ? '<span class="chip gold">🔥 ×'+S.run+'</span>' : '')+
      '<span class="q-timer" id="q-timer">0:00</span>'+
    '</div>'+
    '<div class="q-card">'+
      '<div class="q-type"><span class="chip acc">'+TYPE_LABEL[it.type]+'</span>'+
      (isReview?'<span class="chip warn">🔁 review</span>':'')+
      (tr.skipped?'<span class="chip">↩ skipped earlier</span>':'')+
      (S.mode==='diagnostic'?'<span class="chip">🧪 diagnostic</span>':'')+
      '<span class="grow"></span><span class="chip" style="font-size:10px" title="'+u.esc(eng.difficultyTier().desc)+'">'+eng.difficultyTier().icon+' '+u.esc(eng.difficultyTier().name)+'</span>'+
      '<span class="tiny" title="typical exam pace for this question">⏱ pace '+par+'s</span>'+
      '</div>'+
      body+
      '<div class="conf-row">'+
        '<span class="conf-label">Optional — how sure are you? <span style="text-transform:none;letter-spacing:0">(skip it and the engine reads your behaviour instead)</span></span>'+
        ['g','f','s'].map(function(k){
          return '<button class="conf" data-c="'+k+'">'+FCE.CONF[k].icon+' '+FCE.CONF[k].name+'</button>';
        }).join('')+
      '</div>'+
      '<div class="q-actions">'+
        '<button class="btn primary" id="q-check" disabled>Check</button>'+
        '<button class="btn ghost small" id="q-idk">I don’t know — show me</button>'+
        (S.queue.length - S.idx > 1 ? '<button class="btn ghost small" id="q-skip">Skip ↷</button>' : '')+
        
      '</div>'+
      '<div id="fb"></div>'+
    '</div>'+
  '</div>');

  var timerEl = u.$('#q-timer', v);
  var tInt = setInterval(function(){
    if(!document.body.contains(timerEl)){ clearInterval(tInt); return; }
    if(S.paused || S.graded) return; // clock stops the moment you answer
    var s = Math.floor((Date.now()-tr.t0-tr.pausedMs)/1000);
    timerEl.textContent = Math.floor(s/60)+':'+('0'+s%60).slice(-2);
    if(s > par) timerEl.classList.add('hot');
  }, 1000);

  var checkBtn = u.$('#q-check', v);
  function canCheck(){
    var hasAns = it.type==='mcc' ? S.selOpt>=0 : (u.$('#ans', v) && u.$('#ans', v).value.trim().length>0);
    checkBtn.disabled = !hasAns;
  }
  u.$$('.conf', v).forEach(function(b){
    b.addEventListener('click', function(){
      if(S.graded) return;
      var was = b.classList.contains('sel');
      u.$$('.conf', v).forEach(function(x){ x.classList.remove('sel'); });
      if(!was){ b.classList.add('sel'); S.conf = b.dataset.c; } else S.conf = '';
    });
  });
  u.$$('.opt', v).forEach(function(b){
    b.addEventListener('click', function(){
      if(S.graded) return;
      var now = Date.now();
      if(!tr.ttfk) tr.ttfk = now - tr.t0 - tr.pausedMs;
      if(S.selOpt >= 0 && S.selOpt !== +b.dataset.i) tr.switches++;
      if(tr.firstOpt < 0) tr.firstOpt = +b.dataset.i;
      u.$$('.opt', v).forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel'); S.selOpt = +b.dataset.i; canCheck();
    });
  });
  var inp = u.$('#ans', v);
  if(inp){
    trackInput(tr, inp);
    inp.addEventListener('input', function(){
      canCheck();
      if(it.type==='kwt'){
        var wc = E().wordCount(inp.value);
        var wcEl = u.$('#wc', v);
        if(!inp.value.trim()) wcEl.textContent = '';
        else wcEl.innerHTML = wc+' word'+(wc!==1?'s':'')+(wc<2||wc>5 ? ' — <span style="color:var(--bad)">needs 2–5 (contractions = two)</span>' : ' ✓');
      }
    });
    setTimeout(function(){ inp.focus(); }, 120);
  }
  checkBtn.addEventListener('click', function(){ if(!S.graded) grade(v, it, false); });
  u.$('#q-idk', v).addEventListener('click', function(){ if(!S.graded){ S.conf='g'; grade(v, it, true); } });
  var skipBtn = u.$('#q-skip', v);
  if(skipBtn) skipBtn.addEventListener('click', function(){
    S.skippedIds[q.id] = true;
    S.queue.push(S.queue.splice(S.idx,1)[0]);
    render();
  });
  u.$('#q-quit', v).addEventListener('click', function(){ finishSession(true); });
  u.$('#q-pause', v).addEventListener('click', function(){ pauseOverlay(tr); });

  setKeys(function(ev){
    if(ev.key !== 'Enter' || S.paused) return;
    if(S && S.graded){
      var nx = u.$('#q-next'); if(nx){ ev.preventDefault(); nx.click(); }
    } else if(S && !checkBtn.disabled){
      ev.preventDefault(); grade(v, it, false);
    }
  });
  return v;
}

function pauseOverlay(tr){
  var u = U();
  S.paused = true;
  var startedAt = Date.now();
  var m = document.createElement('div');
  m.className = 'modal-back';
  m.innerHTML = '<div class="modal" style="text-align:center;max-width:380px">'+
    '<div class="emoji" style="font-size:44px">⏸</div>'+
    '<h2 class="serif" style="font-size:24px;margin:14px 0 6px">Paused</h2>'+
    '<p class="muted" style="margin-bottom:18px">The clock has stopped. Breathe, stretch, come back sharp.</p>'+
    '<button class="btn primary block" id="pz-go">Resume ▸</button></div>';
  document.body.appendChild(m);
  function resume(){
    var dur = Date.now() - startedAt;
    tr.pausedMs += dur;
    S.paused = false;
    m.remove();
  }
  m.querySelector('#pz-go').addEventListener('click', resume);
  m.addEventListener('click', function(ev){ if(ev.target === m) resume(); });
}

function gapify(s){
  return U().esc(s).replace(/____+/g, '<span class="gap">&nbsp;?&nbsp;</span>');
}

function gradeFirstGuess(it, q, tr){
  if(it.type === 'mcc') return tr.firstOpt >= 0 && tr.firstOpt === q.cor;
  if(!tr.firstGuess) return false;
  if(it.type === 'kwt') return E().gradeKWT(q, tr.firstGuess).ok;
  return E().gradeOne(q, tr.firstGuess);
}

function grade(v, it, gaveUp){
  var u = U(), eng = E(), q = it.q, tr = S.tr;
  var ms = Date.now() - tr.t0 - tr.pausedMs;
  var ok = false, userTxt = '', kwtScore = null;
  if(it.type === 'mcc'){
    if(!gaveUp){
      ok = S.selOpt === q.cor;
      userTxt = q.opts[S.selOpt] || '';
    }
    u.$$('.opt', v).forEach(function(b){
      var oi = +b.dataset.i;
      if(oi === q.cor) b.classList.add('right');
      else if(!gaveUp && oi === S.selOpt && !ok) b.classList.add('wrong');
      b.disabled = true;
    });
  } else {
    userTxt = gaveUp ? '' : u.$('#ans', v).value;
    if(!gaveUp){
      if(it.type === 'kwt'){
        var wcnt = eng.wordCount(userTxt);
        if(wcnt < 2 || wcnt > 5){
          u.toast('⚠️ Cambridge rule: between <b>2 and 5 words</b> (contractions count as two).');
          return;
        }
        var g = eng.gradeKWT(q, userTxt);
        ok = g.ok; kwtScore = g.score;
      } else {
        ok = eng.gradeOne(q, userTxt);
      }
    }
    var ie = u.$('#ans', v); if(ie) ie.disabled = true;
  }
  S.graded = true;
  var cbtn = u.$('#q-check', v);
  if(cbtn){ cbtn.disabled = true; cbtn.classList.add('spent'); cbtn.textContent = 'Checked'; }
  var tEl = u.$('#q-timer', v); if(tEl) tEl.classList.add('done');
  var idkB = u.$('#q-idk', v); if(idkB) idkB.disabled = true;
  var skB = u.$('#q-skip', v); if(skB) skB.disabled = true;
  u.$$('.conf', v).forEach(function(x){ x.disabled = true; });
  finishTracker(tr, userTxt);
  var firstRight = gradeFirstGuess(it, q, tr);
  var beh = behFromTracker(tr, userTxt, firstRight);
  if(it.type === 'mcc'){ beh.changed = tr.firstOpt >= 0 && tr.firstOpt !== S.selOpt; if(beh.changed) beh.firstGuess = q.opts[tr.firstOpt]||''; }

  var diag = (!ok && it.type !== 'mcc') ? eng.diagnose(q, it.type, userTxt) : null;
  if(gaveUp) diag = {code:'blank', msg:'You asked to see the answer — honest, and exactly what the engine needs to plan your reviews.', right:E().norm(q.ans?q.ans[0]:'')};

  if(ok){ S.ok++; S.run++; if(S.run > eng.state.records.bestRun) eng.state.records.bestRun = S.run; }
  else S.run = 0;
  var autoCause = gaveUp ? 'gap' : (diag && diag.code==='spell' ? 'spell' : '');
  var xpBefore = eng.state.xp;
  var res = eng.record(q, it.type, ok, S.conf, ms, userTxt, autoCause, {runStreak:S.run, beh:beh, diag:diag||undefined});
  // immediate retrieval practice: a missed item returns once, a few questions later.
  // The session keeps its planned length: the retry replaces an unseen question at the tail.
  if(!ok && S.mode !== 'diagnostic' && !S.requeued[q.id]){
    S.requeued[q.id] = true;
    var pos = Math.min(S.idx + 3, S.queue.length);
    S.queue.splice(pos, 0, it);
    if(S.queue.length > S.planned){
      var lastId = S.queue[S.queue.length-1].q.id;
      if(lastId !== q.id && !S.requeued[lastId] && S.queue.length-1 > pos){
        S.queue.pop();
      }
    }
  }
  var xpGain = eng.state.xp - xpBefore;
  if(FCE.app && FCE.app.buildTopbar) FCE.app.buildTopbar();
  S.results.push({id:q.id, ok:ok});
  if(eng.level() > S.levelBefore){
    S.levelBefore = eng.level();
    u.toast('🎓 <b>Level '+eng.level()+'!</b> The engine raises its expectations accordingly.', 'gold');
  }

  var ansText = it.type==='mcc' ? q.opts[q.cor] : q.ans.join('  ·  ');
  var pattern = eng.patternFor(it.type==='mcc' ? q.opts[q.cor] : q.ans[0]);

  var behNote = '';
  if(beh.changed && beh.firstRight && !ok){
    behNote = '⚡ <b>Your first instinct was right.</b> You first '+(it.type==='mcc'?'chose':'wrote')+' “'+u.esc(beh.firstGuess)+'” — correct — then talked yourself out of it.';
  } else if(beh.changed && !beh.firstRight && ok){
    behNote = '🛠️ <b>Good self-correction.</b> “'+u.esc(beh.firstGuess)+'” → fixed before checking. That habit earns real marks.';
  } else if(ok && res.fast){
    behNote = '⚡ <b>Faster than exam pace</b> ('+Math.round(ms/1000)+'s vs '+eng.par(it.type,q.diff)+'s) with a clean trace — that’s automaticity. Interval extended.';
  } else if(ok && S.conf==='s' && ((beh.ttfk||0) > 4000 || beh.edits >= 6)){
    behNote = '🫥 Right answer, hesitant trace ('+(beh.ttfk/1000).toFixed(1)+'s before typing'+(beh.edits?', '+beh.edits+' deletions':'')+'). It will return sooner, just in case.';
  }

  var fb;
  if(ok){
    fb = '<div class="feedback ok">'+
      '<div class="fb-head">✓ Correct'+(kwtScore===2?' — full 2 marks':'')+' <span class="chip ok" style="margin-left:auto">+XP</span></div>'+
      (q.ans && q.ans.length>1 && it.type!=='mcc' ? '<div class="fb-ans">Also accepted: <code>'+u.esc(q.ans.slice(1).join(' · '))+'</code></div>' : '')+
      '<div class="fb-exp">'+u.esc(q.exp||'')+'</div>'+
      (pattern ? '<div class="fb-pattern">⭐ <b>'+u.esc(pattern.name)+'</b> — real-paper frequency <span class="stars">'+'★'.repeat(pattern.freq)+'</span></div>' : '')+
      (behNote ? '<div class="fb-beh">'+behNote+'</div>' : '')+
      nextBtnHtml()+
    '</div>';
  } else {
    fb = '<div class="feedback bad">'+
      '<div class="fb-head">'+(gaveUp ? 'Here it is:' : '✗ Not this time'+(kwtScore===1?' — 1 of 2 marks':''))+'</div>'+
      '<div class="big-answer">'+u.esc(ansText)+'</div>'+
      (diag && diag.msg ? '<div class="fb-diag">'+u.esc(diag.msg)+'</div>' : '')+
      '<div class="fb-exp">'+u.esc(q.exp||'')+'</div>'+
      (q.trap ? '<div class="fb-trap">⚠️ <b>The trap:</b> '+u.esc(q.trap)+'</div>' : '')+
      (behNote ? '<div class="fb-beh">'+behNote+'</div>' : '')+
      '<div class="row wrap" style="margin-top:14px;gap:8px">'+
        '<button class="btn small teal" id="fb-want">🎯 I want to master this</button>'+
        (!gaveUp && userTxt ? '<button class="btn small ghost" id="fb-right" title="If your answer is genuinely correct English for this gap, tell the engine">My answer was actually right</button>' : '')+
      '</div>'+
      '<div class="tiny" style="margin-top:12px">Why did you miss it? <i>(optional — sharpens your Mistake DNA)</i></div>'+
      '<div class="cause-row">'+Object.keys(FCE.CAUSES).map(function(c){
        return '<button class="cause'+(autoCause===c?' sel':'')+'" data-c="'+c+'">'+FCE.CAUSES[c].icon+' '+FCE.CAUSES[c].name+'</button>';
      }).join('')+'</div>'+
      nextBtnHtml()+
    '</div>';
  }
  function nextBtnHtml(){
    return '<div class="q-actions"><button class="btn primary" id="q-next">'+
      (S.mode!=='endless' && S.idx+1>=S.queue.length ? 'Finish session' : 'Next')+' →</button>'+
      (S.mode==='endless' ? '<button class="btn ghost small" id="q-end-endless">Stop & see results</button>' : '')+
      '</div>';
  }
  u.$('#fb', v).innerHTML = fb;
  u.$$('.cause', v).forEach(function(b){
    b.addEventListener('click', function(){
      u.$$('.cause', v).forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel');
      eng.setCause(b.dataset.c);
    });
  });
  var wantB = u.$('#fb-want', v);
  if(wantB) wantB.addEventListener('click', function(){
    eng.addWant(q.id);
    wantB.disabled = true; wantB.textContent = '🎯 On your Mastery List';
    u.toast('🎯 Noted. Expect this concept — in many disguises — until you own it.');
  });
  var rightB = u.$('#fb-right', v);
  if(rightB) rightB.addEventListener('click', function(){
    if(eng.amend(q.id)){
      S.ok++; S.results[S.results.length-1].ok = true;
      var fbEl = u.$('.feedback', v);
      fbEl.className = 'feedback ok';
      fbEl.innerHTML = '<div class="fb-head">✓ Accepted — thank you</div>'+
        '<div class="fb-exp">Your answer “'+u.esc(userTxt)+'” is now accepted for this question and your stats have been repaired. The report is stored (Settings → Backup includes it).</div>'+
        nextBtnHtml();
      wireNext();
    }
  });
  function wireNext(){
    var nb = u.$('#q-next', v);
    if(nb) nb.addEventListener('click', function(){ S.idx++; render(); });
    var ee = u.$('#q-end-endless', v);
    if(ee) ee.addEventListener('click', function(){ finishSession(false); });
  }
  wireNext();
  if(ok && xpGain > 0){
    var fh = u.$('.feedback .fb-head', v);
    if(fh){
      var fl = document.createElement('span');
      fl.className = 'xp-float';
      fl.textContent = '+'+xpGain+' XP'+(res.fast?' ⚡':'');
      fh.appendChild(fl);
    }
  }
}

function saveSummary(){
  if(S.summarySaved) return;
  S.summarySaved = true;
  var eng = E(), n = S.results.length;
  if(!n) return;
  var acc = S.ok/n;
  eng.state.sessions.push({t:Date.now(), n:n, ok:S.ok, type:S.mode});
  eng.state.trend.push({t:Date.now(), acc:acc, n:n});
  if(eng.state.trend.length > 40) eng.state.trend.shift();
  if(acc > eng.state.records.bestAcc && n >= 5) eng.state.records.bestAcc = acc;
  if(S.mode === 'diagnostic') eng.award('first');
  eng.save();
}
function finishSession(early){
  setKeys(null);
  if(early && S.results.length === 0){ FCE.ui.go('dash'); return; }
  saveSummary();
  S.mode = S.mode==='endless' ? 'smart' : S.mode; // so render shows summary
  S.idx = S.queue.length;
  render();
}

function confettiBurst(host){
  var colors = ['#0e5e64','#c9a227','#a3c1ad','#b5474d','#20303a'];
  for(var i=0;i<26;i++){
    var c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = (8+Math.random()*84)+'%';
    c.style.background = colors[i%colors.length];
    c.style.animationDelay = (Math.random()*0.5)+'s';
    c.style.transform = 'rotate('+Math.random()*360+'deg)';
    host.appendChild(c);
  }
}

function summaryView(){
  var u = U(), eng = E();
  setKeys(null);
  saveSummary();
  var n = S.results.length || 1;
  var acc = S.ok / n;
  var pr = eng.predict();
  var msg = S.mode==='diagnostic'
    ? 'Your mastery map is live. From now on every session is built from <b>your</b> data — nobody else gets these questions in this order.'
    : acc >= 0.8 ? 'Excellent. Difficulty rises from here — that’s how the learning zone works.'
    : acc >= 0.5 ? 'Good work. Each miss just became a chapter in your Grammar Book and a scheduled review.'
    : 'Hard session — on purpose. Struggling at the edge of your ability is where memory is actually made.';
  var wrong = S.results.filter(function(r){ return !r.ok; });
  var wrongSeen = {}, consol = '';
  wrong.forEach(function(r){
    if(wrongSeen[r.id]) return; wrongSeen[r.id] = 1;
    var it2 = eng.byId[r.id]; if(!it2) return;
    var corr = it2.type==='mcc' ? it2.q.opts[it2.q.cor] : it2.q.ans[0];
    var cue = it2.type==='kwt' ? it2.q.key : (it2.q.stem || '');
    consol += '<div class="consol-row"><span class="tiny" style="flex:1;text-align:left">'+u.esc((it2.q.s1||it2.q.s||'').slice(0,72))+'…'+(cue?' ['+u.esc(cue)+']':'')+'</span><b>'+u.esc(corr)+'</b></div>';
  });
  if(S.run >= 5){ eng.state.xp += 15; eng.save(); if(FCE.app) FCE.app.buildTopbar(); }
  var boostsNow = Object.keys(eng.state.boost).length;
  var v = u.el(
    '<div class="q-shell"><div class="q-card session-done" style="position:relative;overflow:hidden">'+
      '<div id="confetti-zone"></div>'+
      '<div class="emoji">'+(acc>=0.8?'🏆':acc>=0.5?'💪':'🧗')+'</div>'+
      '<h2 class="serif" style="margin:12px 0 4px;font-size:28px">'+(S.mode==='diagnostic'?'Diagnostic complete':'Session complete')+'</h2>'+
      '<p class="muted" style="max-width:430px;margin:0 auto">'+msg+'</p>'+
      '<div class="ring-stats">'+
        FCE.charts.ring(acc, Math.round(acc*100)+'%', 'accuracy', acc>=0.7?'#2E7D4F':acc>=0.45?'#C98A2D':'#C2371F')+
        FCE.charts.ring(Math.min(1,n/10), String(S.results.length), 'questions', '#1B1C21')+
        FCE.charts.ring(Math.max(0,Math.min(1,(pr.scale-122)/68)), pr.grade, 'predicted grade', '#C98A2D')+
      '</div>'+
      (S.run >= 5 ? '<div class="chip gold" style="margin-bottom:10px">🔥 combo ×'+S.run+' — +15 bonus XP</div>' : '')+
      (wrong.length ? '<p class="tiny" style="margin-bottom:6px">'+wrong.length+' miss'+(wrong.length>1?'es':'')+' → scheduled for review · <b>'+boostsNow+'</b> concept reinforcement'+(boostsNow===1?'':'s')+' queued by the engine.</p>'
                    : '<p class="tiny" style="margin-bottom:14px">Clean sweep. Intervals extended on everything you saw.</p>')+
      (consol ? '<div class="card consol" style="text-align:left;margin:14px auto;max-width:520px"><h3>⚡ 60-second consolidation — read each answer once, aloud</h3>'+consol+'</div>' : '')+
      '<div class="row" style="justify-content:center;flex-wrap:wrap">'+
        '<button class="btn primary" id="ss-again">Another session ▸</button>'+
        '<button class="btn" id="ss-dash">Home</button>'+
      '</div>'+
      '<div class="tiny" style="margin-top:14px;opacity:.8">Tomorrow, 10 minutes on '+u.esc((eng.coach()[0]||{}).name||'your weakest skill')+' would be worth ≈ '+((Math.round((eng.coach()[0]||{cost:0}).cost*2)/2)||1).toFixed(1)+' marks. Deal?</div>'+
    '</div></div>'
  );
  if(acc >= 0.7) confettiBurst(u.$('#confetti-zone', v));
  u.$('#ss-again', v).addEventListener('click', function(){ P.start(S.cfg.mode==='diagnostic'?{mode:'smart'}:S.cfg); });
  u.$('#ss-dash', v).addEventListener('click', function(){ FCE.ui.go('dash'); });
  setKeys(function(ev){ if(ev.key==='Enter'){ ev.preventDefault(); setKeys(null); P.start(S.cfg.mode==='diagnostic'?{mode:'smart'}:S.cfg); } });
  return v;
}

/* ============================ SPELLING GYM ============================
   Rebuilt on the formats real spelling trainers use:
   · LETTERS — the word's skeleton with the danger letters missing + a definition clue
   · FLASH   — look·cover·write: the word flashes, then you rebuild it from the definition
   A wrong spelling is never shown; the clue never contains the word. */
var G = null;
P.spellingGym = function(){
  var eng = E();
  G = {set: eng.spellingSet(8), idx:0, ok:0, t0:Date.now(), graded:false, missed:[]};
  renderGym();
};
function renderGym(){
  var u = U(), host = u.$('#view');
  host.innerHTML = '';
  host.appendChild(G.idx >= G.set.length ? gymDone() : gymQ());
  window.scrollTo(0,0);
}
/* choose which letters to hide: where students actually go wrong */
function holePositions(item){
  var w = item.w, holes = {};
  var bad = (item.bad && item.bad[0]) || '';
  if(bad.length === w.length){
    for(var i=0;i<w.length;i++) if(w[i] !== bad[i]) holes[i] = 1;
  }
  // add doubled letters and unstressed vowels until we have enough
  var want = Math.max(2, Math.min(5, Math.floor(w.length/3)+1));
  for(var j=1;j<w.length && Object.keys(holes).length<want;j++){
    if(w[j] === w[j-1]){ holes[j]=1; }
  }
  for(var k=1;k<w.length-1 && Object.keys(holes).length<want;k++){
    if('aeiou'.indexOf(w[k])!==-1 && !holes[k]) holes[k]=1;
  }
  delete holes[0]; // first letter always visible
  if(!Object.keys(holes).length) holes[Math.max(1,Math.floor(w.length/2))]=1;
  return holes;
}
function boxesHTML(word, holes){
  var u = U();
  return '<div class="letterboxes">'+word.split('').map(function(ch,i){
    return '<span class="lbox'+(holes && holes[i] ? ' hole' : '')+'">'+(holes && holes[i] ? '' : u.esc(ch))+'</span>';
  }).join('')+'</div>';
}
function gymQ(){
  var u = U(), eng = E();
  var item = G.set[G.idx];
  G.graded = false;
  var flash = G.idx % 2 === 1; // letters first, flash second
  var defHTML = '<div class="gym-def"><span class="pos">'+u.esc(item.def.split('·')[0].trim())+'</span>'+
                u.esc(item.def.split('·').slice(1).join('·').trim())+'</div>';
  var stage;
  if(flash){
    stage = '<div class="gym-count" id="g-count">memorize · 3</div>'+
            '<div class="gym-flash" id="g-flash">'+u.esc(item.w)+'</div>';
  } else {
    stage = defHTML + boxesHTML(item.w, holePositions(item)) +
            '<div class="gym-count">fill the missing letters — type the whole word</div>';
  }
  var v = u.el(
    '<div class="q-shell">'+
      '<div class="q-top">'+
        '<button class="btn small ghost" id="g-quit">✕ End</button>'+
        '<div class="q-progress"><div class="bar"><i class="warn" style="width:'+Math.round(100*G.idx/G.set.length)+'%"></i></div></div>'+
        '<span class="tiny mono">'+(G.idx+1)+' / '+G.set.length+'</span>'+
        (G.ok>=3?'<span class="chip gold combo-chip">🏋️ ×'+G.ok+'</span>':'')+
      '</div>'+
      '<div class="q-card" style="text-align:center">'+
        '<div class="q-type" style="justify-content:center"><span class="chip gold">🏋️ Spelling Gym · '+(flash?'flash round':'missing letters')+'</span></div>'+
        '<div class="gym-stage" id="g-stage">'+stage+'</div>'+
        '<input class="ans-input" id="g-ans" style="text-align:center;max-width:380px;margin:14px auto 0;display:'+(flash?'none':'block')+'" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type the word…">'+
        '<div class="q-actions" style="justify-content:center"><button class="btn primary" id="g-check" disabled style="display:'+(flash?'none':'inline-flex')+'">Check</button></div>'+
        '<div id="g-fb"></div>'+
      '</div>'+
    '</div>'
  );
  var inp = u.$('#g-ans', v);
  var checkBtn = u.$('#g-check', v);
  inp.addEventListener('input', function(){ checkBtn.disabled = !inp.value.trim(); });
  if(flash){
    var left = 3;
    var cd = setInterval(function(){
      if(!document.body.contains(v) || G.graded){ clearInterval(cd); return; }
      left--;
      var ce = u.$('#g-count', v);
      if(left > 0){ if(ce) ce.textContent = 'memorize · '+left; return; }
      clearInterval(cd);
      u.$('#g-stage', v).innerHTML = defHTML + '<div class="gym-count">now write it from memory</div>';
      inp.style.display = 'block';
      checkBtn.style.display = 'inline-flex';
      inp.focus();
    }, 1000);
  } else {
    setTimeout(function(){ inp.focus(); }, 150);
  }
  function check(){
    if(G.graded || !inp.value.trim()) return;
    G.graded = true;
    var ok = eng.norm(inp.value) === item.w;
    if(ok) G.ok++; else G.missed.push(item.w);
    eng.recordSpell(item.w, ok);
    inp.disabled = true;
    checkBtn.style.display = 'none';                  // no dead button after checking
    var fbEl = u.$('#g-fb', v);
    fbEl.innerHTML = '<div class="feedback '+(ok?'ok':'bad')+'" style="text-align:left">'+
      (ok ? '<div class="fb-head">✓ Nailed it <span class="chip gold" style="margin-left:auto">+6 XP</span></div>'+
            '<div style="margin:6px 0">'+boxesHTML(item.w, null)+'</div>'
          : '<div class="fb-head">Not this time</div>'+
            '<div class="big-answer" style="text-align:center">'+u.esc(item.w)+'</div>'+
            '<div style="margin:6px 0">'+boxesHTML(item.w, null)+'</div>'+
            '<div class="fb-exp">Trace it once with your eyes — it will come back later in the round queue.</div>')+
      '<div class="fb-hook">🔑 '+u.esc(item.cue)+'</div>'+
      '<div class="q-actions"><button class="btn primary" id="g-next">'+(G.idx+1>=G.set.length?'See results':'Next word')+' →</button></div></div>';
    u.$('#g-next', v).addEventListener('click', function(){ G.idx++; renderGym(); });
    u.$('#g-next', v).focus();
    if(FCE.app && FCE.app.buildTopbar) FCE.app.buildTopbar();
  }
  checkBtn.addEventListener('click', check);
  u.$('#g-quit', v).addEventListener('click', function(){ setKeys(null); FCE.ui.go('practice'); });
  setKeys(function(ev){
    if(ev.key !== 'Enter') return;
    ev.preventDefault();
    if(G.graded){ var nb = u.$('#g-next'); if(nb) nb.click(); }
    else check();
  });
  return v;
}
function gymDone(){
  var u = U(), eng = E();
  setKeys(null);
  if(G.ok === G.set.length) eng.award('speller');
  eng.save();
  var rep = eng.spellReport();
  var v = u.el(
    '<div class="q-shell"><div class="q-card session-done">'+
      '<div class="emoji">'+(G.ok>=7?'🏆':G.ok>=5?'💪':'🏋️')+'</div>'+
      '<h2 class="serif" style="margin:12px 0 4px;font-size:27px">'+G.ok+' / '+G.set.length+' spelled clean</h2>'+
      '<p class="muted">'+(G.ok===G.set.length?'Flawless. Cambridge cannot touch your spelling today.':'Missed words come back in future rounds — spaced, until they stick.')+'</p>'+
      (G.missed.length ? '<div class="row wrap" style="justify-content:center;margin-top:10px">'+G.missed.map(function(w){ return '<span class="chip bad">'+u.esc(w)+'</span>'; }).join('')+'</div>' : '')+
      (rep.patterns.length ? '<div class="card" style="text-align:left;margin:20px auto;max-width:430px"><h3>Your spelling fingerprint</h3>'+
        rep.patterns.slice(0,3).map(function(p2){
          var names = {double:'double letters', ie:'ie/ei order', tion:'-tion vs -sion', vowel:'weak vowels', silente:'dropped letters', other:'letter order'};
          return '<div class="row between" style="padding:4px 0;font-size:13px"><span>'+ (names[p2.id]||p2.id) +'</span><span class="chip warn">×'+p2.n+'</span></div>';
        }).join('')+'</div>' : '')+
      '<div class="row" style="justify-content:center;flex-wrap:wrap">'+
        '<button class="btn primary" id="g-again">Another round ▸</button>'+
        '<button class="btn" id="g-home">Home</button>'+
      '</div>'+
    '</div></div>'
  );
  u.$('#g-again', v).addEventListener('click', function(){ P.spellingGym(); });
  u.$('#g-home', v).addEventListener('click', function(){ FCE.ui.go('dash'); });
  setKeys(function(ev){ if(ev.key==='Enter'){ ev.preventDefault(); setKeys(null); P.spellingGym(); } });
  return v;
}
/* ============================ ESSAY VOCAB LAB ============================
   Upgrade flat words into band-boosting vocabulary inside real essay frames.
   New words: recognise among 4. Known words: full typed recall. Leitner-spaced. */
var VB = null;
P.vocabLab = function(){
  var eng = E();
  VB = {set: eng.vocabSet(8), idx:0, ok:0, graded:false};
  if(!VB.set.length){ U().toast('Vocab Lab is fully mastered for now — come back when reviews are due.'); return; }
  renderVocab();
};
function renderVocab(){
  var u = U(), host = u.$('#view');
  host.innerHTML = '';
  host.appendChild(VB.idx >= VB.set.length ? vocabDone() : vocabQ());
  window.scrollTo(0,0);
}
function vocabQ(){
  var u = U(), eng = E();
  var item = VB.set[VB.idx];
  VB.graded = false;
  var st = eng.state.vocab[item.up[0]];
  var box = st ? st.box : 0;
  var mode = box >= 2 ? 'recall' : box >= 1 ? 'cued' : 'choose'; // recognition -> cued recall -> free recall
  var typed = mode !== 'choose';
  var scaffold = '';
  if(mode === 'cued'){
    var w0 = item.up[0];
    scaffold = '<div class="letterboxes" style="margin-top:14px">'+w0.split('').map(function(ch,i){
      if(ch === ' ') return '<span style="width:12px"></span>';
      return '<span class="lbox'+(i===0?'':' hole')+'">'+(i===0?ch:'')+'</span>';
    }).join('')+'</div>';
  }
  var opts = [];
  if(!typed){
    opts = [item.up[0]];
    var pool = FCE.VOCAB.filter(function(o){ return o !== item; });
    while(opts.length < 4 && pool.length){
      var pick = pool.splice(Math.floor(Math.random()*pool.length),1)[0].up[0];
      if(opts.indexOf(pick) === -1) opts.push(pick);
    }
    opts.sort(function(){ return Math.random()-0.5; });
  }
  var v = u.el(
    '<div class="q-shell">'+
      '<div class="q-top">'+
        '<button class="btn small ghost" id="vb-quit">✕ End</button>'+
        '<div class="q-progress"><div class="bar"><i style="width:'+Math.round(100*VB.idx/VB.set.length)+'%"></i></div></div>'+
        '<span class="tiny mono">'+(VB.idx+1)+' / '+VB.set.length+'</span>'+
        (VB.ok>=3?'<span class="chip gold combo-chip">💎 ×'+VB.ok+'</span>':'')+
      '</div>'+
      '<div class="q-card">'+
        '<div class="q-type"><span class="chip acc">💎 Essay Vocab Lab · '+(mode==='recall'?'full recall':mode==='cued'?'cued recall':'recognise')+'</span>'+
        '<span class="grow"></span><span class="tiny">writing-paper vocabulary</span></div>'+
        '<div class="vb-basic">upgrade: <b>'+u.esc(item.basic)+'</b></div>'+
        '<div class="q-text">'+u.esc(item.s).replace(/____+/g,'<span class="gap">&nbsp;?&nbsp;</span>')+'</div>'+
        scaffold+
        (typed
          ? '<input class="ans-input" id="vb-ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="'+(mode==='cued'?'Type the word — the skeleton is your cue…':'The stronger word, from memory…')+'">'
          : '<div class="opts">'+opts.map(function(o,i){
              return '<button class="opt" data-w="'+u.esc(o)+'"><span class="letter">'+String.fromCharCode(65+i)+'</span><span>'+u.esc(o)+'</span></button>';
            }).join('')+'</div>')+
        '<div class="q-actions">'+(typed?'<button class="btn primary" id="vb-check" disabled>Check</button>':'')+'</div>'+
        '<div id="vb-fb"></div>'+
      '</div>'+
    '</div>'
  );
  function feedback(ok, chosen){
    VB.graded = true;
    if(ok) VB.ok++;
    eng.recordVocab(item, ok);
    if(FCE.app && FCE.app.buildTopbar) FCE.app.buildTopbar();
    u.$('#vb-fb', v).innerHTML = '<div class="feedback '+(ok?'ok':'bad')+'">'+
      (ok ? '<div class="fb-head">✓ '+u.esc(item.up[0])+(mode!=='choose'?' — produced from memory':'')+'</div>'
          : '<div class="fb-head">Not quite</div><div class="big-answer">'+u.esc(item.up.join('  ·  '))+'</div>')+
      '<div class="fb-exp"><b>'+u.esc(item.s.replace(/____+/g, item.up[0].toUpperCase()))+'</b></div>'+
      '<div class="fb-diag">🔒 <b>Lock it in:</b> look away from the screen and say the whole sentence aloud, with <i>'+u.esc(item.up[0])+'</i> in place. Retrieval + production is what plants it for essay day.</div>'+
      '<div class="fb-hook">✍️ <b>Examiner note:</b> '+u.esc(item.why)+(item.up.length>1?' Also accepted: <i>'+u.esc(item.up.slice(1).join(', '))+'</i>.':'')+'</div>'+
      '<div class="q-actions"><button class="btn primary" id="vb-next">'+(VB.idx+1>=VB.set.length?'See results':'Next')+' →</button></div></div>';
    u.$('#vb-next', v).addEventListener('click', function(){ VB.idx++; renderVocab(); });
    u.$('#vb-next', v).focus();
  }
  if(typed){
    var inp = u.$('#vb-ans', v), btn = u.$('#vb-check', v);
    inp.addEventListener('input', function(){ btn.disabled = !inp.value.trim(); });
    btn.addEventListener('click', function(){ if(!VB.graded && inp.value.trim()){ inp.disabled = true; btn.style.display='none'; feedback(eng.gradeVocab(item, inp.value), inp.value); } });
    setTimeout(function(){ inp.focus(); }, 140);
    setKeys(function(ev){
      if(ev.key !== 'Enter') return;
      ev.preventDefault();
      if(VB.graded){ var nb = u.$('#vb-next'); if(nb) nb.click(); }
      else if(inp.value.trim()){ inp.disabled = true; btn.style.display='none'; feedback(eng.gradeVocab(item, inp.value), inp.value); }
    });
  } else {
    u.$$('.opt', v).forEach(function(b){
      b.addEventListener('click', function(){
        if(VB.graded) return;
        var w = b.dataset.w;
        var ok = eng.norm(w) === eng.norm(item.up[0]);
        u.$$('.opt', v).forEach(function(x){
          if(eng.norm(x.dataset.w) === eng.norm(item.up[0])) x.classList.add('right');
          else if(x === b) x.classList.add('wrong');
          x.disabled = true;
        });
        feedback(ok, w);
      });
    });
    setKeys(function(ev){
      if(ev.key === 'Enter' && VB.graded){ ev.preventDefault(); var nb = u.$('#vb-next'); if(nb) nb.click(); }
    });
  }
  u.$('#vb-quit', v).addEventListener('click', function(){ setKeys(null); FCE.ui.go('practice'); });
  return v;
}
function vocabDone(){
  var u = U(), eng = E();
  setKeys(null);
  var vs = eng.vocabStats();
  var v = u.el(
    '<div class="q-shell"><div class="q-card session-done">'+
      '<div class="emoji">'+(VB.ok>=7?'💎':VB.ok>=5?'✨':'📚')+'</div>'+
      '<h2 class="serif" style="margin:12px 0 4px;font-size:27px">'+VB.ok+' / '+VB.set.length+' upgraded</h2>'+
      '<p class="muted">Essay arsenal: <b>'+vs.mastered+'</b> words mastered · '+vs.learning+' in training · '+vs.total+' total. Words you produce from memory twice move into long-term rotation.</p>'+
      '<div class="row" style="justify-content:center;flex-wrap:wrap;margin-top:14px">'+
        '<button class="btn primary" id="vb-again">Another round ▸</button>'+
        '<button class="btn" id="vb-home">Home</button>'+
      '</div>'+
    '</div></div>'
  );
  u.$('#vb-again', v).addEventListener('click', function(){ P.vocabLab(); });
  u.$('#vb-home', v).addEventListener('click', function(){ FCE.ui.go('dash'); });
  setKeys(function(ev){ if(ev.key==='Enter'){ ev.preventDefault(); setKeys(null); P.vocabLab(); } });
  return v;
}

/* ============================ MOCK TEST ============================ */
var M = null;
P.mock = function(paperN){
  var eng = E();
  M = {set: eng.pickPaper(paperN), t0: Date.now(), limit: 35*60, done:false};
  var u = U();
  var host = u.$('#view');
  host.innerHTML = '';
  host.appendChild(mockView());
  window.scrollTo(0,0);
};

function mockView(){
  var u = U(), s = M.set;
  function passageHTML(p, mode){
    var txt = u.esc(p.text);
    p.gaps.forEach(function(g){
      var inner;
      if(mode==='p1'){
        inner = '<select data-part="p1" data-n="'+g.n+'"><option value="-1">— '+g.n+' —</option>'+
          g.opts.map(function(o,i){ return '<option value="'+i+'">'+String.fromCharCode(65+i)+'. '+u.esc(o)+'</option>'; }).join('')+'</select>';
      } else if(mode==='p3'){
        inner = '<span class="pgap"><span class="n">'+g.n+'</span><span class="stem-chip">'+u.esc(g.stem)+'</span><input data-part="p3" data-n="'+g.n+'" class="p3in" autocomplete="off" spellcheck="false"></span>';
      } else {
        inner = '<span class="pgap"><span class="n">'+g.n+'</span><input data-part="p2" data-n="'+g.n+'" autocomplete="off" spellcheck="false"></span>';
      }
      txt = txt.replace('('+g.n+')'+(mode==='p3'?u.esc(g.stem):''), inner);
    });
    return '<div class="passage">'+txt+'</div>';
  }
  var pp = s.paper, isCh = pp.level === 'challenge';
  var html =
  '<div class="mock-timer"><div class="inner">⏱️ <span id="mt">35:00</span><span class="tiny">Paper '+pp.n+' · 36 marks</span><button class="btn small danger" id="m-abort">Abandon</button></div></div>'+
  '<div class="h-page">Paper '+pp.n+(isCh?' <em>· Challenge</em>':'')+'</div>'+
  '<p class="sub">Real format, real timing, feedback only at the end. Part 4 is marked 0 / 1 / 2 — exactly like Cambridge.'+
  (isCh ? ' <b>This is a CHALLENGE paper</b> — set above exam level. Your result will be graded with a stated difficulty allowance, so don’t panic if it feels harder: it is.' : '')+
  (s.retake ? ' <b>Retake</b> — you have sat this paper before; treat it as revision, not prediction.' : '')+'</p>'+
  '<div class="mock-part"><h4>Part 1 — Multiple-Choice Cloze · '+u.esc(s.p1.title)+'</h4><div class="pd">Choose A–D for each gap. 8 marks.</div>'+passageHTML(s.p1,'p1')+'</div>'+
  '<div class="mock-part"><h4>Part 2 — Open Cloze · '+u.esc(s.p2.title)+'</h4><div class="pd">ONE word per gap. 8 marks.</div>'+passageHTML(s.p2,'p2')+'</div>'+
  '<div class="mock-part"><h4>Part 3 — Word Formation · '+u.esc(s.p3.title)+'</h4><div class="pd">Form a word from each stem. 8 marks.</div>'+passageHTML(s.p3,'p3')+'</div>'+
  '<div class="mock-part"><h4>Part 4 — Key Word Transformations</h4><div class="pd">2–5 words including the key word. 12 marks.</div>'+
    s.p4.map(function(q,i){
      return '<div class="mock-kwt"><div class="ms1">'+(i+1)+'. '+u.esc(q.s1)+'</div>'+
        '<div class="q-key">key word: <b>'+u.esc(q.key)+'</b></div>'+
        '<div class="ms1" style="margin:6px 0 10px">'+u.esc(q.s2).replace(/____+/g,'<span class="gap">&nbsp;?&nbsp;</span>')+'</div>'+
        '<input class="ans-input" style="margin-top:0;font-size:15px" data-part="p4" data-n="'+i+'" autocomplete="off" spellcheck="false">'+
      '</div>';
    }).join('')+
  '</div>'+
  '<button class="btn primary block" id="m-submit" style="font-size:16px;padding:15px">Submit paper →</button>';

  var v = u.el(html);
  var mt = u.$('#mt', v);
  var int = setInterval(function(){
    if(M.done || !document.body.contains(mt)){ clearInterval(int); return; }
    var left = M.limit - Math.floor((Date.now()-M.t0)/1000);
    if(left <= 0){ clearInterval(int); gradeMock(v); return; }
    mt.textContent = Math.floor(left/60)+':'+('0'+left%60).slice(-2);
    if(left < 300) mt.style.color = 'var(--bad)';
  }, 1000);
  u.$('#m-submit', v).addEventListener('click', function(){ gradeMock(v); });
  u.$('#m-abort', v).addEventListener('click', function(){ M.done = true; FCE.ui.go('dash'); });
  return v;
}

function gradeMock(v){
  if(M.done) return;
  M.done = true;
  var u = U(), eng = E(), s = M.set;
  var score = 0, parts = {p1:0,p2:0,p3:0,p4:0}, errors = [];
  var marks = {p1:{}, p2:{}, p3:{}, p4:[]};
  var gdiff = s.paper.level === 'challenge' ? 4 : 3;
  s.p1.gaps.forEach(function(g){
    var sel = u.$('select[data-part="p1"][data-n="'+g.n+'"]', v);
    var val = sel ? +sel.value : -1;
    var ok = val === g.cor;
    if(ok){ score++; parts.p1++; }
    else errors.push({part:'Part 1', n:g.n, user: val>=0 ? g.opts[val] : '(blank)', corr:g.opts[g.cor], exp:g.exp});
    marks.p1[g.n] = {ok:ok, user: val>=0 ? g.opts[val] : '', corr:g.opts[g.cor], exp:g.exp};
    eng.record({id:s.p1.id+'-'+g.n, tags:g.tags, diff:gdiff, ans:[g.opts[g.cor]]}, 'mcc', ok, '', 0, val>=0?g.opts[val]:'', '', {quiet:true});
  });
  s.p2.gaps.forEach(function(g){
    var inp = u.$('input[data-part="p2"][data-n="'+g.n+'"]', v);
    var val = inp ? inp.value : '';
    var ok = eng.gradeOne({id:s.p2.id+'-'+g.n, ans:g.ans}, val);
    if(ok){ score++; parts.p2++; }
    else errors.push({part:'Part 2', n:g.n, user:val||'(blank)', corr:g.ans.join(' / '), exp:g.exp});
    marks.p2[g.n] = {ok:ok, user:val, corr:g.ans[0], exp:g.exp};
    eng.record({id:s.p2.id+'-'+g.n, tags:g.tags, gt:g.gt, diff:gdiff, ans:g.ans}, 'cloze', ok, '', 0, val, '', {quiet:true});
  });
  s.p3.gaps.forEach(function(g){
    var inp = u.$('input[data-part="p3"][data-n="'+g.n+'"]', v);
    var val = inp ? inp.value : '';
    var ok = eng.gradeOne({id:s.p3.id+'-'+g.n, ans:g.ans}, val);
    if(ok){ score++; parts.p3++; }
    else errors.push({part:'Part 3', n:g.n, user:val||'(blank)', corr:g.ans.join(' / ')+' ('+g.stem+')', exp:g.exp});
    marks.p3[g.n] = {ok:ok, user:val, corr:g.ans[0], stem:g.stem, exp:g.exp};
    eng.record({id:s.p3.id+'-'+g.n, tags:g.tags, diff:gdiff, ans:g.ans}, 'wf', ok, '', 0, val, '', {quiet:true});
  });
  s.p4.forEach(function(q,i){
    var inp = u.$('input[data-part="p4"][data-n="'+i+'"]', v);
    var val = inp ? inp.value : '';
    var g = eng.gradeKWT(q, val);
    score += g.score; parts.p4 += g.score;
    if(!g.ok) errors.push({part:'Part 4', n:i+1, user:val||'(blank)', corr:q.ans[0], exp:q.exp + (g.score===1?' (1 mark earned for a correct half.)':'')});
    marks.p4.push({q:q, user:val, score:g.score, ok:g.ok});
    eng.record(q, 'kwt', g.ok, '', 0, val, '', {quiet:true});
  });
  eng.checkBadges(0);
  eng.markPassage(s.p1.id); eng.markPassage(s.p2.id); eng.markPassage(s.p3.id);
  var res = eng.recordMock(score, 36, parts, s.paper);
  var scale = res.scale, isCh = res.level === 'challenge';
  var pr = eng.predict();
  // render the WHOLE paper back, corrected in place — like a marked exam script
  function corrected(pass, mode){
    var txt = u.esc(pass.text);
    pass.gaps.forEach(function(g){
      var m = marks[mode][g.n];
      var inner;
      if(m.ok){
        inner = '<span class="pgap"><span class="n">'+g.n+'</span><b class="mk-ok">'+u.esc(m.corr)+'</b></span>';
      } else {
        inner = '<span class="pgap"><span class="n">'+g.n+'</span>'+
                (m.user ? '<s class="mk-bad">'+u.esc(m.user)+'</s>' : '<span class="mk-bad">—</span>')+
                '<b class="mk-fix" title="'+u.esc(m.exp||'')+'">'+u.esc(m.corr)+'</b></span>';
      }
      txt = txt.replace('('+g.n+')'+(mode==='p3'?u.esc(marks.p3[g.n].stem):''), inner);
    });
    return '<div class="passage corrected">'+txt+'</div>';
  }
  var host = u.$('#view');
  host.innerHTML = '';
  host.appendChild(u.el(
    '<div class="q-shell"><div class="q-card session-done">'+
      '<div class="emoji">'+(score>=30?'🏆':score>=22?'🎯':'🧗')+'</div>'+
      '<div class="mock-result-score">'+score+'<span style="font-size:26px;color:var(--ink3)"> / 36</span></div>'+
      '<p class="muted" style="margin-top:6px">Paper '+s.paper.n+(isCh?' · <b style="color:var(--red)">Challenge</b>':'')+' · ≈ Cambridge scale <b>'+scale+'</b> · '+(scale>=180?'Grade A':scale>=173?'Grade B':scale>=160?'Grade C — pass':'below pass')+' on this paper</p>'+
      (isCh ?
        '<div class="card" style="text-align:left;margin:14px auto 0;max-width:560px;background:var(--glass3)">'+
          '<h3 style="margin-bottom:6px">⛰️ This was a higher-level paper</h3>'+
          '<div style="font-size:13.5px;line-height:1.65">Challenge papers run <b>above real exam difficulty</b> — C1-edge collocations, inversion, double word-formation shifts. '+
          'Raw marks here are worth more: your '+score+'/36 was graded with a <b>+12% difficulty allowance</b>'+
          (res.delta>0 ? ', lifting your scale from '+res.scaleStd+' to <b>'+scale+'</b> (+'+res.delta+' points) compared with the same raw score on a standard paper.' : '.')+
          ' If you can score here, the real paper will feel slow and friendly.</div>'+
        '</div>' : '')+
      '<div class="mr-grid">'+
        mr('Part 1', parts.p1, 8)+mr('Part 2', parts.p2, 8)+mr('Part 3', parts.p3, 8)+mr('Part 4', parts.p4, 12)+
      '</div>'+
      '<p class="tiny">Overall prediction updated: <b>'+pr.grade+'</b> ('+pr.scale+'). Below is your whole paper, marked — green stays, red gets fixed. Every miss is queued for review.</p>'+
    '</div>'+
    '<h3 class="sec-label" style="margin-top:22px">Your paper, corrected</h3>'+
    '<div class="mock-part"><h4>Part 1 · '+u.esc(s.p1.title)+' <span class="chip '+(parts.p1>=6?'ok':'warn')+'">'+parts.p1+'/8</span></h4>'+corrected(s.p1,'p1')+'</div>'+
    '<div class="mock-part"><h4>Part 2 · '+u.esc(s.p2.title)+' <span class="chip '+(parts.p2>=6?'ok':'warn')+'">'+parts.p2+'/8</span></h4>'+corrected(s.p2,'p2')+'</div>'+
    '<div class="mock-part"><h4>Part 3 · '+u.esc(s.p3.title)+' <span class="chip '+(parts.p3>=6?'ok':'warn')+'">'+parts.p3+'/8</span></h4>'+corrected(s.p3,'p3')+'</div>'+
    '<div class="mock-part"><h4>Part 4 · Transformations <span class="chip '+(parts.p4>=9?'ok':'warn')+'">'+parts.p4+'/12</span></h4>'+
      marks.p4.map(function(m,i){
        return '<div class="mock-kwt"><div class="ms1">'+(i+1)+'. '+u.esc(m.q.s1)+' <span class="q-key" style="margin:0">[<b>'+u.esc(m.q.key)+'</b>]</span></div>'+
          '<div class="ms1" style="margin-top:6px">'+u.esc(m.q.s2).replace(/____+/g,
            m.ok ? '<b class="mk-ok">'+u.esc(m.user)+'</b>'
                 : (m.user?'<s class="mk-bad">'+u.esc(m.user)+'</s> ':'')+'<b class="mk-fix">'+u.esc(m.q.ans[0])+'</b>')+
          ' <span class="chip '+(m.score===2?'ok':m.score===1?'warn':'bad')+'" style="font-size:10px">'+m.score+'/2</span></div>'+
          (!m.ok ? '<div class="tiny" style="margin-top:6px">'+u.esc(m.q.exp||'')+'</div>' : '')+
        '</div>';
      }).join('')+
    '</div>'+
    '<div class="row" style="justify-content:center;margin-top:18px;flex-wrap:wrap">'+
      '<button class="btn primary" id="mk-dash">Home</button>'+
      '<button class="btn" id="mk-again">New mock</button>'+
    '</div></div>'
  ));
  u.$('#mk-dash').addEventListener('click', function(){ FCE.ui.go('dash'); });
  u.$('#mk-again').addEventListener('click', function(){ P.mock(); });
  window.scrollTo(0,0);
  function mr(name, got, of){
    var f = got/of;
    return '<div class="stat-tile"><div class="v" style="color:'+(f>=0.75?'var(--ok)':f>=0.5?'var(--warn)':'var(--bad)')+'">'+got+'/'+of+'</div><div class="l">'+name+'</div></div>';
  }
}

return P;
})();
