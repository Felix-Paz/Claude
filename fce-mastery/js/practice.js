/* FCE Mastery — practice sessions (adaptive) + full mock test */
window.FCE = window.FCE || {};
FCE.practice = (function(){
var P = {};
var U = function(){ return FCE.ui; };
var E = function(){ return FCE.engine; };
var TYPE_LABEL = {kwt:'Part 4 · Key Word Transformation', cloze:'Part 2 · Open Cloze', wf:'Part 3 · Word Formation', mcc:'Part 1 · Multiple-Choice Cloze'};

/* ============================ SESSION ============================ */
var S = null; // {queue, idx, ok, run, mode, t0, qt0, selOpt, conf, graded, results[]}

P.start = function(cfg){
  cfg = cfg || {};
  var eng = E(), queue;
  if(cfg.mode === 'diagnostic') queue = eng.diagnosticSet();
  else if(cfg.mode === 'ids') queue = (cfg.ids||[]).map(function(id){ return eng.byId[id]; }).filter(Boolean);
  else queue = eng.pickSession(cfg.n || 10, {type:cfg.type, tag:cfg.tag});
  if(!queue.length){ U().toast('No questions available for that filter yet.'); return; }
  S = {queue:queue, idx:0, ok:0, run:0, mode:cfg.mode||'smart', tag:cfg.tag||'', t0:Date.now(), qt0:0, selOpt:-1, conf:'', graded:false, results:[]};
  render();
};

function render(){
  var host = U().$('#view');
  host.innerHTML = '';
  host.appendChild(qView());
  window.scrollTo(0,0);
}

function qView(){
  var u = U(), eng = E();
  if(S.idx >= S.queue.length) return summaryView();
  var it = S.queue[S.idx], q = it.q;
  S.qt0 = Date.now(); S.selOpt = -1; S.conf = ''; S.graded = false;
  var seen = eng.state.items[q.id];
  var isReview = seen && seen.att > 0;

  var body = '';
  if(it.type === 'kwt'){
    body = '<div class="q-text">'+u.esc(q.s1)+'</div>'+
      '<div class="q-key">key word: <b>'+u.esc(q.key)+'</b> <span class="tiny">(use 2–5 words including the key word — do not change it)</span></div>'+
      '<div class="q-text" style="margin-top:8px">'+gapify(q.s2)+'</div>'+
      '<input class="ans-input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the missing words…">'+
      '<div class="tiny" id="wc" style="margin-top:6px"></div>';
  } else if(it.type === 'cloze'){
    body = '<div class="q-text">'+gapify(q.s)+'</div>'+
      '<input class="ans-input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="One word only…">';
  } else if(it.type === 'wf'){
    body = '<div class="q-text">'+gapify(q.s)+'</div>'+
      '<div class="q-key" style="margin-top:12px">stem: <span class="q-stem">'+u.esc(q.stem)+'</span> <span class="tiny">— transform it to fit the gap</span></div>'+
      '<input class="ans-input" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="The transformed word…">';
  } else {
    body = '<div class="q-text">'+gapify(q.s)+'</div>'+
      '<div class="opts">'+q.opts.map(function(o,i){
        return '<button class="opt" data-i="'+i+'"><span class="letter">'+String.fromCharCode(65+i)+'</span><span>'+u.esc(o)+'</span></button>';
      }).join('')+'</div>';
  }

  var html =
  '<div class="q-shell">'+
    '<div class="q-top">'+
      '<button class="btn small ghost" id="q-quit">← End session</button>'+
      '<div class="q-progress"><div class="bar"><i style="width:'+Math.round(100*S.idx/S.queue.length)+'%"></i></div></div>'+
      '<span class="tiny mono">'+(S.idx+1)+' / '+S.queue.length+'</span>'+
      '<span class="q-timer" id="q-timer">0:00</span>'+
    '</div>'+
    '<div class="q-card">'+
      '<div class="q-type"><span class="chip acc">'+TYPE_LABEL[it.type]+'</span>'+
      (isReview?'<span class="chip warn">🔁 review — you’ve seen this before</span>':'')+
      (S.mode==='diagnostic'?'<span class="chip">🧪 diagnostic</span>':'')+
      '</div>'+
      body+
      '<div class="conf-row" id="conf-row">'+
        '<span class="conf-label">How sure are you? <span style="text-transform:none;letter-spacing:0">(be honest — the engine uses this to find hidden weaknesses)</span></span>'+
        ['g','f','s'].map(function(k){
          return '<button class="conf" data-c="'+k+'">'+FCE.CONF[k].icon+' '+FCE.CONF[k].name+'</button>';
        }).join('')+
      '</div>'+
      '<div class="q-actions"><button class="btn primary" id="q-check" disabled>Check answer</button></div>'+
      '<div id="fb"></div>'+
    '</div>'+
  '</div>';

  var v = u.el(html);

  // timer
  var timerEl = u.$('#q-timer', v);
  var tInt = setInterval(function(){
    if(!document.body.contains(timerEl)){ clearInterval(tInt); return; }
    var s = Math.floor((Date.now()-S.qt0)/1000);
    timerEl.textContent = Math.floor(s/60)+':'+('0'+s%60).slice(-2);
    var target = it.type==='kwt' ? 75 : 45;
    if(s > target) timerEl.classList.add('hot');
  }, 1000);

  var checkBtn = u.$('#q-check', v);
  function canCheck(){
    var hasAns = it.type==='mcc' ? S.selOpt>=0 : (u.$('#ans', v) && u.$('#ans', v).value.trim().length>0);
    checkBtn.disabled = !(hasAns && S.conf);
  }
  u.$$('.conf', v).forEach(function(b){
    b.addEventListener('click', function(){
      if(S.graded) return;
      u.$$('.conf', v).forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel'); S.conf = b.dataset.c; canCheck();
    });
  });
  u.$$('.opt', v).forEach(function(b){
    b.addEventListener('click', function(){
      if(S.graded) return;
      u.$$('.opt', v).forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel'); S.selOpt = +b.dataset.i; canCheck();
    });
  });
  var inp = u.$('#ans', v);
  if(inp){
    inp.addEventListener('input', function(){
      canCheck();
      if(it.type==='kwt'){
        var wc = E().wordCount(inp.value);
        var wcEl = u.$('#wc', v);
        if(!inp.value.trim()) wcEl.textContent = '';
        else wcEl.innerHTML = wc+' word'+(wc!==1?'s':'')+(wc<2||wc>5 ? ' — <span style="color:#fda4af">must be 2–5 (contractions count as two)</span>' : ' ✓');
      }
    });
    inp.addEventListener('keydown', function(ev){
      if(ev.key==='Enter' && !checkBtn.disabled && !S.graded) grade(v, it);
    });
    setTimeout(function(){ inp.focus(); }, 80);
  }
  checkBtn.addEventListener('click', function(){
    if(!S.graded) grade(v, it);
  });
  u.$('#q-quit', v).addEventListener('click', function(){ finishSession(true); });
  document.onkeydown = function(ev){
    if(ev.key==='Enter' && S && S.graded){
      var nx = u.$('#q-next'); if(nx){ ev.preventDefault(); nx.click(); }
    }
  };
  return v;
}

function gapify(s){
  return U().esc(s).replace(/____+/g, '<span class="gap">&nbsp;?&nbsp;</span>');
}

function grade(v, it){
  var u = U(), eng = E(), q = it.q;
  var ms = Date.now() - S.qt0;
  var ok, userTxt = '', kwtScore = null;
  if(it.type === 'mcc'){
    ok = S.selOpt === q.cor;
    userTxt = q.opts[S.selOpt] || '';
    u.$$('.opt', v).forEach(function(b,i){
      if(i === q.cor) b.classList.add('right');
      else if(i === S.selOpt && !ok) b.classList.add('wrong');
      b.disabled = true;
    });
  } else {
    userTxt = u.$('#ans', v).value;
    if(it.type === 'kwt'){
      var wc = eng.wordCount(userTxt);
      if(wc < 2 || wc > 5){
        u.toast('⚠️ Cambridge rule: between <b>2 and 5 words</b> (contractions = two words). Fix it before checking.');
        return;
      }
      var g = eng.gradeKWT(q, userTxt);
      ok = g.ok; kwtScore = g.score;
    } else {
      ok = eng.gradeOne(q, userTxt);
    }
    u.$('#ans', v).disabled = true;
  }
  S.graded = true;
  if(ok){ S.ok++; S.run++; if(S.run > eng.state.records.bestRun){ eng.state.records.bestRun = S.run; } }
  else S.run = 0;
  eng.record(q, it.type, ok, S.conf, ms, userTxt, '', {runStreak:S.run});
  S.results.push({id:q.id, ok:ok});

  // feedback panel
  var ansText = it.type==='mcc' ? q.opts[q.cor] : q.ans.join('  ·  ');
  var pattern = eng.patternFor(it.type==='mcc' ? q.opts[q.cor] : q.ans[0]);
  var slow = ms/1000 > (it.type==='kwt'?75:45);
  var lucky = ok && S.conf==='g';
  var falseConf = !ok && S.conf==='s';
  var fb = '<div class="feedback '+(ok?'ok':'bad')+'">'+
    '<div class="fb-head">'+(ok ? '✅ Correct'+(kwtScore===2?' — full 2 marks':'') : '❌ Not this time'+(kwtScore===1?' — but worth 1 of 2 marks':''))+'</div>'+
    '<div class="fb-ans">'+(it.type==='kwt'?'Accepted answer'+(q.ans.length>1?'s':'')+': ':'Answer: ')+'<code>'+u.esc(ansText)+'</code></div>'+
    '<div class="fb-exp">'+u.esc(q.exp||'')+'</div>'+
    (q.trap ? '<div class="fb-trap">⚠️ <b>Cambridge trap:</b> '+u.esc(q.trap)+'</div>' : '')+
    (pattern ? '<div class="fb-pattern">⭐ <b>'+u.esc(pattern.name)+'</b> — appears in real FCE papers '+'★'.repeat(pattern.freq)+' · '+u.esc(pattern.lose)+'</div>' : '')+
    (lucky ? '<div class="fb-trap">🎲 <b>Lucky guess detected.</b> This counts as half-learned — it will come back very soon.</div>' : '')+
    (falseConf ? '<div class="fb-trap">🚨 <b>False confidence.</b> You were certain and wrong — the most dangerous error type in an exam. Flagged and weighted heavier.</div>' : '')+
    (slow && ok ? '<div class="fb-pattern">🐢 Right, but slow ('+Math.round(ms/1000)+'s). Exam pace for this type: '+(it.type==='kwt'?75:45)+'s.</div>' : '')+
    (!ok ? '<div class="fb-hook">🧠 <b>Memory hook:</b> '+u.esc(FCE.makeHook(it.type==='mcc'?q.opts[q.cor]:q.ans[0], (q.s||q.s2||'').replace(/____+/g,'___')))+'</div>' : '')+
    (!ok ? '<div class="tiny" style="margin-top:12px">Why did you miss it? <i>(this trains your Mistake DNA)</i></div>'+
      '<div class="cause-row">'+Object.keys(FCE.CAUSES).map(function(c){
        return '<button class="cause" data-c="'+c+'">'+FCE.CAUSES[c].icon+' '+FCE.CAUSES[c].name+'</button>';
      }).join('')+'</div>' : '')+
    '<div class="q-actions"><button class="btn primary" id="q-next">'+(S.idx+1>=S.queue.length?'Finish session':'Next question')+' →</button></div>'+
  '</div>';
  u.$('#fb', v).innerHTML = fb;
  u.$$('.cause', v).forEach(function(b){
    b.addEventListener('click', function(){
      u.$$('.cause', v).forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel');
      eng.setCause(b.dataset.c);
    });
  });
  u.$('#q-next', v).addEventListener('click', function(){
    S.idx++; render();
  });
  u.$('#q-next', v).focus();
}

function finishSession(early){
  var eng = E();
  document.onkeydown = null;
  var n = S.results.length;
  if(early && n === 0){ FCE.ui.go('dash'); return; }
  S.idx = S.queue.length;
  render();
}

function summaryView(){
  var u = U(), eng = E();
  document.onkeydown = null;
  var n = S.results.length || 1;
  var acc = S.ok / n;
  if(!S.summarySaved){
    S.summarySaved = true;
    var accR = S.ok/(S.results.length||1);
    eng.state.sessions.push({t:Date.now(), n:S.results.length, ok:S.ok, type:S.mode});
    eng.state.trend.push({t:Date.now(), acc:accR, n:S.results.length});
    if(eng.state.trend.length > 40) eng.state.trend.shift();
    if(accR > eng.state.records.bestAcc && S.results.length >= 5) eng.state.records.bestAcc = accR;
    if(S.mode === 'diagnostic') eng.award('first');
    eng.save();
  }
  var pr = eng.predict();
  var msg = S.mode==='diagnostic'
    ? 'Diagnostic complete — your mastery map is live. From now on, every session is built around <b>your</b> data.'
    : acc >= 0.8 ? 'Excellent. The engine will now push your difficulty up to keep you in the learning zone.'
    : acc >= 0.5 ? 'Solid work — every error here just became a page in your Grammar Book and a future review.'
    : 'Tough one. That’s desirable difficulty: these exact items will return at the perfect moment to stick.';
  var wrong = S.results.filter(function(r){ return !r.ok; });
  var v = u.el(
    '<div class="q-shell"><div class="q-card session-done">'+
      '<div class="emoji">'+(acc>=0.8?'🏆':acc>=0.5?'💪':'🧗')+'</div>'+
      '<h2 style="margin:12px 0 4px">'+(S.mode==='diagnostic'?'Diagnostic complete':'Session complete')+'</h2>'+
      '<p class="muted">'+msg+'</p>'+
      '<div class="ring-stats">'+
        FCE.charts.ring(acc, Math.round(acc*100)+'%', 'accuracy', acc>=0.7?'#34d399':acc>=0.45?'#fbbf24':'#fb7185')+
        FCE.charts.ring(Math.min(1,S.results.length/10), String(S.results.length), 'questions', '#9d8cff')+
        FCE.charts.ring(pr.p, String(pr.scale), 'predicted scale', '#2dd4bf')+
      '</div>'+
      (wrong.length ? '<p class="tiny" style="margin-bottom:14px">'+wrong.length+' item'+(wrong.length>1?'s':'')+' joined your review queue and Grammar Book.</p>' : '<p class="tiny" style="margin-bottom:14px">Clean sweep — intervals extended on everything you saw.</p>')+
      '<div class="row" style="justify-content:center;flex-wrap:wrap">'+
        '<button class="btn primary" id="ss-again">Another session</button>'+
        '<button class="btn" id="ss-dash">Dashboard</button>'+
        (wrong.length?'<button class="btn" id="ss-book">📖 Grammar Book</button>':'')+
      '</div>'+
    '</div></div>'
  );
  u.$('#ss-again', v).addEventListener('click', function(){ P.start({mode:'smart', tag:S.tag||undefined}); });
  u.$('#ss-dash', v).addEventListener('click', function(){ FCE.ui.go('dash'); });
  var bk = u.$('#ss-book', v);
  if(bk) bk.addEventListener('click', function(){ FCE.ui.go('book'); });
  return v;
}

/* ============================ MOCK TEST ============================ */
var M = null;
P.mock = function(){
  var eng = E();
  M = {set: eng.mockSet(), t0: Date.now(), limit: 35*60, done:false};
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
        inner = '<span class="pgap"><span class="n">'+g.n+'</span><input data-part="p3" data-n="'+g.n+'" autocomplete="off" spellcheck="false" placeholder="'+u.esc(g.stem)+'"></span>';
      } else {
        inner = '<span class="pgap"><span class="n">'+g.n+'</span><input data-part="p2" data-n="'+g.n+'" autocomplete="off" spellcheck="false"></span>';
      }
      txt = txt.replace('('+g.n+')'+(mode==='p3'?u.esc(g.stem):''), inner);
    });
    return '<div class="passage">'+txt+'</div>';
  }
  var html =
  '<div class="mock-timer"><div class="inner">⏱️ <span id="mt">35:00</span><span class="tiny">Use of English · 36 marks</span><button class="btn small danger" id="m-abort">Abandon</button></div></div>'+
  '<div class="h-page">Mock Test</div>'+
  '<p class="sub">Real format, real timing, no feedback until the end — exactly like exam day. Answers are scored with official-style marking (Part 4: 0, 1 or 2 marks each).</p>'+
  '<div class="mock-part"><h4>Part 1 — Multiple-Choice Cloze · '+u.esc(s.p1.title)+'</h4><div class="pd">For each gap, choose the option (A–D) that best fits. 8 marks.</div>'+passageHTML(s.p1,'p1')+'</div>'+
  '<div class="mock-part"><h4>Part 2 — Open Cloze · '+u.esc(s.p2.title)+'</h4><div class="pd">Write ONE word in each gap. 8 marks.</div>'+passageHTML(s.p2,'p2')+'</div>'+
  '<div class="mock-part"><h4>Part 3 — Word Formation · '+u.esc(s.p3.title)+'</h4><div class="pd">Use the word shown in each box to form a word that fits the gap. 8 marks.</div>'+passageHTML(s.p3,'p3')+'</div>'+
  '<div class="mock-part"><h4>Part 4 — Key Word Transformations</h4><div class="pd">Complete the second sentence (2–5 words, including the key word). 12 marks.</div>'+
    s.p4.map(function(q,i){
      return '<div class="mock-kwt"><div style="font-size:14.5px">'+(i+1)+'. '+u.esc(q.s1)+'</div>'+
        '<div class="q-key">key word: <b>'+u.esc(q.key)+'</b></div>'+
        '<div style="font-size:14.5px;margin:6px 0 10px">'+u.esc(q.s2).replace(/____+/g,'<span class="gap">&nbsp;?&nbsp;</span>')+'</div>'+
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
    if(left < 300) mt.style.color = '#fda4af';
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
  // P1
  s.p1.gaps.forEach(function(g){
    var sel = u.$('select[data-part="p1"][data-n="'+g.n+'"]', v);
    var val = sel ? +sel.value : -1;
    var ok = val === g.cor;
    if(ok){ score++; parts.p1++; }
    else errors.push({part:'Part 1', n:g.n, user: val>=0 ? g.opts[val] : '(blank)', corr:g.opts[g.cor], exp:g.exp});
    eng.record({id:s.p1.id+'-'+g.n, tags:g.tags, diff:3, ans:[g.opts[g.cor]]}, 'mcc', ok, 'f', 0, val>=0?g.opts[val]:'', '', {quiet:true});
  });
  // P2
  s.p2.gaps.forEach(function(g){
    var inp = u.$('input[data-part="p2"][data-n="'+g.n+'"]', v);
    var val = inp ? inp.value : '';
    var ok = eng.gradeOne({ans:g.ans}, val);
    if(ok){ score++; parts.p2++; }
    else errors.push({part:'Part 2', n:g.n, user:val||'(blank)', corr:g.ans.join(' / '), exp:g.exp});
    eng.record({id:s.p2.id+'-'+g.n, tags:g.tags, gt:g.gt, diff:3, ans:g.ans}, 'cloze', ok, 'f', 0, val, '', {quiet:true});
  });
  // P3
  s.p3.gaps.forEach(function(g){
    var inp = u.$('input[data-part="p3"][data-n="'+g.n+'"]', v);
    var val = inp ? inp.value : '';
    var ok = eng.gradeOne({ans:g.ans}, val);
    if(ok){ score++; parts.p3++; }
    else errors.push({part:'Part 3', n:g.n, user:val||'(blank)', corr:g.ans.join(' / ')+' ('+g.stem+')', exp:g.exp});
    eng.record({id:s.p3.id+'-'+g.n, tags:g.tags, diff:3, ans:g.ans}, 'wf', ok, 'f', 0, val, '', {quiet:true});
  });
  // P4 (0/1/2)
  s.p4.forEach(function(q,i){
    var inp = u.$('input[data-part="p4"][data-n="'+i+'"]', v);
    var val = inp ? inp.value : '';
    var g = eng.gradeKWT(q, val);
    score += g.score; parts.p4 += g.score;
    if(!g.ok) errors.push({part:'Part 4', n:i+1, user:val||'(blank)', corr:q.ans[0], exp:q.exp + (g.score===1?' (You earned 1 mark for a correct half.)':'')});
    eng.record(q, 'kwt', g.ok, 'f', 0, val, '', {quiet:true});
  });
  eng.checkBadges(0);
  var scale = eng.recordMock(score, 36, parts);
  var pr = eng.predict();
  var grade = scale>=180?'A':scale>=173?'B':scale>=160?'C':scale>=140?'Below pass (B1 cert.)':'Below pass';
  var host = u.$('#view');
  host.innerHTML = '';
  host.appendChild(u.el(
    '<div class="q-shell"><div class="q-card session-done">'+
      '<div class="emoji">'+(score>=30?'🏆':score>=22?'🎯':'🧗')+'</div>'+
      '<div class="mock-result-score gradtx">'+score+'<span style="font-size:26px;color:var(--tx3)"> / 36</span></div>'+
      '<p class="muted" style="margin-top:6px">≈ Cambridge scale <b>'+scale+'</b> · '+grade+'</p>'+
      '<div class="mr-grid">'+
        mr('Part 1', parts.p1, 8)+mr('Part 2', parts.p2, 8)+mr('Part 3', parts.p3, 8)+mr('Part 4', parts.p4, 12)+
      '</div>'+
      '<p class="tiny">Your overall prediction has been updated to <b>'+pr.scale+'</b>. Every error below is now in your review queue.</p>'+
    '</div>'+
    (errors.length ? '<div class="card" style="margin-top:16px"><h3>🔍 Error autopsy ('+errors.length+')</h3>'+
      errors.map(function(e2){
        return '<div class="gb-mistake"><b>'+e2.part+' · gap '+e2.n+'</b> — you: <span class="yours">'+u.esc(e2.user)+'</span> → <span class="right">'+u.esc(e2.corr)+'</span><br><span class="tiny">'+u.esc(e2.exp||'')+'</span></div>';
      }).join('')+'</div>' : '')+
    '<div class="row" style="justify-content:center;margin-top:18px;flex-wrap:wrap">'+
      '<button class="btn primary" id="mk-dash">Dashboard</button>'+
      '<button class="btn" id="mk-again">New mock</button>'+
    '</div></div>'
  ));
  u.$('#mk-dash').addEventListener('click', function(){ FCE.ui.go('dash'); });
  u.$('#mk-again').addEventListener('click', function(){ P.mock(); });
  window.scrollTo(0,0);
  function mr(name, got, of){
    var f = got/of;
    return '<div class="stat-tile"><div class="v" style="color:'+(f>=0.75?'#6ee7b7':f>=0.5?'#fcd34d':'#fda4af')+'">'+got+'/'+of+'</div><div class="l">'+name+'</div></div>';
  }
}

return P;
})();
