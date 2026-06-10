/* FCE Mastery — UI: router, shared widgets, and all primary views */
window.FCE = window.FCE || {};
FCE.ui = (function(){
var U = {};
var E = function(){ return FCE.engine; };

U.esc = function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
U.$ = function(sel, root){ return (root||document).querySelector(sel); };
U.$$ = function(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); };

U.toast = function(html, cls){
  var box = U.$('#toasts');
  if(!box) return;
  var t = document.createElement('div');
  t.className = 'toast' + (cls ? ' '+cls : '');
  t.innerHTML = html;
  box.appendChild(t);
  setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity .4s'; setTimeout(function(){ t.remove(); },420); }, 4200);
};
U.modal = function(html){
  var back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = '<div class="modal">'+html+'</div>';
  back.addEventListener('click', function(ev){ if(ev.target === back) back.remove(); });
  document.body.appendChild(back);
  return back;
};

/* ---------------- router ---------------- */
U.views = {};
U.current = 'dash';
U.go = function(name, arg){
  var eng = E();
  if(!eng.state.onboarded && name !== 'onboard'){ name = 'onboard'; }
  U.current = name;
  U.$$('.nav-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.v === name); });
  var v = U.views[name] || U.views.dash;
  var host = U.$('#view');
  host.innerHTML = '';
  host.appendChild(v(arg));
  window.scrollTo(0,0);
};
function el(html){
  var d = document.createElement('div');
  d.className = 'view';
  d.innerHTML = html;
  return d;
}
U.el = el;

function fmtPct(x){ return x===null||x===undefined ? '—' : Math.round(x*100)+'%'; }
function daysBadge(){
  var d = E().daysToExam();
  if(d === null) return '';
  if(d < 0) return '<span class="chip">Exam date passed</span>';
  if(d === 0) return '<span class="chip bad">🚨 EXAM DAY</span>';
  return '<span class="chip '+(d<=7?'bad':'acc')+'">📅 '+d+' day'+(d>1?'s':'')+' to exam</span>';
}

/* ---------------- onboarding + diagnostic ---------------- */
U.views.onboard = function(){
  var v = el(
  '<div class="onb">'+
    '<div class="logo-big">F</div>'+
    '<h1>FCE <span class="gradtx">Mastery</span></h1>'+
    '<p class="sub" style="margin:14px auto 0;text-align:center">Your personal Use of English war-room for Cambridge B2 First. '+
    'An adaptive engine maps your weaknesses, predicts your score, and feeds you exactly what moves the needle — '+
    '<b>100% offline, no account, no API</b>. Your data never leaves this browser.</p>'+
    '<div class="field"><label>Your name</label><input id="ob-name" placeholder="e.g. Felix" maxlength="24"></div>'+
    '<div class="field"><label>Exam date (optional — unlocks the countdown & 7-Day Emergency Mode)</label><input id="ob-date" type="date"></div>'+
    '<div class="card" style="margin-top:20px;text-align:left"><h3>🧪 First step: 14-question diagnostic</h3>'+
    '<p class="diag-intro">A quick scan across all four Use of English parts — transformations, open cloze, word formation and multiple-choice. '+
    'It seeds your <b>mastery map</b> so every later session is personal. Answer honestly and mark your real confidence: '+
    'the engine specifically hunts for <i>lucky guesses</i> and <i>false confidence</i>.</p></div>'+
    '<button class="btn primary block" id="ob-go" style="margin-top:18px">Start the diagnostic →</button>'+
    '<button class="btn ghost block small" id="ob-skip" style="margin-top:10px">Skip diagnostic (not recommended)</button>'+
  '</div>');
  function saveBasics(){
    var st = E().state;
    st.name = U.$('#ob-name', v).value.trim() || 'Student';
    st.examDate = U.$('#ob-date', v).value || '';
    st.onboarded = true;
    E().save();
  }
  U.$('#ob-go', v).addEventListener('click', function(){
    saveBasics();
    FCE.practice.start({ mode:'diagnostic' });
  });
  U.$('#ob-skip', v).addEventListener('click', function(){
    saveBasics(); E().award('first'); E().save();
    U.toast('Welcome aboard, '+U.esc(E().state.name)+'! The engine will calibrate as you practise.');
    U.go('dash');
  });
  return v;
};

/* ---------------- dashboard ---------------- */
U.views.dash = function(){
  var eng = E(), st = eng.state;
  var pr = eng.predict();
  var ready = eng.readiness();
  var recs = eng.coach().slice(0,3);
  var ch = eng.challenge();
  var emg = eng.emergencyOn();
  var lf = eng.luckyAndFalse();
  var trend = st.trend.slice(-12).map(function(t){ return t.acc; });

  var html = '';
  if(emg){
    var d = eng.daysToExam();
    html += '<div class="emg-ribbon">🚨 <b>7-Day Emergency Mode is ON</b>&nbsp;— sessions are locked onto your highest-value weaknesses.'+
      (d!==null && d>=0 ? ' <b>'+(d===0?'Exam is today — light review only!':d+' day'+(d>1?'s':'')+' left.')+'</b>' : '')+
      '<span style="flex:1"></span><button class="btn small ghost" data-go="coach">See the plan →</button></div>';
  }
  html +=
  '<div class="row between wrap" style="margin-bottom:14px">'+
    '<div><div class="h-page">Hi '+U.esc(st.name||'there')+' 👋</div>'+
    '<div class="muted">Level '+eng.level()+' · '+st.xp+' XP · '+daysBadge()+'</div></div>'+
    '<div class="row">'+
      '<span class="chip gold" style="font-size:13px">🔥 '+st.streak.count+'-day streak</span>'+
    '</div>'+
  '</div>'+

  '<div class="hero">'+
    '<div class="card glow"><h3>🎯 FCE score prediction <span class="grow"></span><span class="tiny">'+ (pr.n<15 ? 'low confidence — keep practising' : '±'+pr.ci+' points') +'</span></h3>'+
      '<div class="gauge-wrap">'+
        '<div style="text-align:center">'+FCE.charts.gauge(pr.scale, pr.ci)+
          '<div class="big gradtx" style="margin-top:-34px">'+pr.scale+'</div>'+
          '<div class="tiny">Cambridge scale · '+pr.cefr+' '+(pr.grade==='A'||pr.grade==='B'||pr.grade==='C' ? '· Grade '+pr.grade : '')+'</div></div>'+
        '<div class="grade-probs">'+
          gpRow('Pass (160+)', pr.pass, '#34d399')+
          gpRow('Grade A (180+)', pr.pA, '#a78bfa')+
          gpRow('Grade B (173+)', pr.pA+pr.pB, '#2dd4bf')+
          gpRow('Grade C (160+)', pr.pA+pr.pB+pr.pC, '#fbbf24')+
          '<div class="tiny" style="margin-top:4px">Estimated from '+pr.n+' answers'+(st.mocks.length? ' + '+st.mocks.length+' mock'+(st.mocks.length>1?'s':''):'')+'. Confidence interval narrows as you practise.</div>'+
        '</div>'+
      '</div></div>'+
    '<div class="stack">'+
      '<div class="card"><h3>⚡ Exam readiness</h3>'+
        '<div class="row" style="gap:18px">'+FCE.charts.ring(ready/100, ready+'%', 'overall', ready>=70?'#34d399':ready>=45?'#fbbf24':'#fb7185')+
        '<div style="flex:1">'+
          miniBar('Part 1 · Multiple choice', pr.per.mcc)+
          miniBar('Part 2 · Open cloze', pr.per.cloze)+
          miniBar('Part 3 · Word formation', pr.per.wf)+
          miniBar('Part 4 · Transformations', pr.per.kwt)+
        '</div></div></div>'+
      '<div class="card"><h3>🏅 Weekly challenge</h3>'+
        '<div class="row between"><div><b>'+ch.ch.name+'</b><div class="tiny">'+ch.ch.desc+'</div></div>'+
        '<span class="chip '+(ch.done?'ok':'acc')+'">'+ch.prog+' / '+ch.ch.n+'</span></div>'+
        '<div class="bar" style="margin-top:10px"><i style="width:'+Math.round(100*ch.prog/ch.ch.n)+'%"></i></div></div>'+
    '</div>'+
  '</div>'+

  '<div class="card" style="margin-bottom:16px"><h3>🧠 Smart coach — study this next <span class="grow"></span><button class="btn small ghost" data-go="coach">Full plan →</button></h3>'+
    '<div class="stack">'+
    recs.map(function(r,i){
      return '<div class="coach-item"><div class="coach-rank">'+(i+1)+'</div>'+
        '<div style="flex:1;min-width:0"><div class="t">'+U.esc(r.name)+'</div><div class="d">'+U.esc(r.why)+'</div></div>'+
        '<div class="gain"><b>≈ '+(Math.round(r.cost*2)/2).toFixed(1)+'</b><span>marks at risk</span></div>'+
        '<button class="btn small" data-drill="'+r.tag+'">Drill</button></div>';
    }).join('')+
    '</div></div>'+

  '<div class="quick-actions" style="margin-bottom:16px">'+
    qa('smart','✨','Smart Session','10 adaptive questions aimed at your weak spots')+
    qa('mock','📝','Mock Test','Full 36-mark Use of English under exam timing')+
    qa('memory','🧠','Memory Lab','Hooks & mnemonics for your stubborn items')+
    qa('book','📖','Grammar Book','Your personal rulebook, built from your errors')+
  '</div>'+

  '<div class="grid g3">'+
    '<div class="stat-tile"><div class="v">'+st.records.total+'</div><div class="l">questions answered</div></div>'+
    '<div class="stat-tile"><div class="v">'+(lf.falseConf)+'</div><div class="l">false-confidence errors</div></div>'+
    '<div class="stat-tile"><div class="v">'+eng.dueItems().length+'</div><div class="l">reviews due now</div></div>'+
  '</div>'+
  (trend.length>=2 ? '<div class="card" style="margin-top:16px"><h3>📈 Session accuracy trend</h3>'+FCE.charts.spark(trend)+'</div>' : '');

  var v = el(html);
  wire(v);
  return v;

  function gpRow(name, p, color){
    p = Math.max(0, Math.min(1, p));
    return '<div class="gp-row"><span>'+name+'</span><div class="bar thin"><i style="width:'+Math.round(p*100)+'%;background:'+color+'"></i></div><b>'+Math.round(p*100)+'%</b></div>';
  }
  function miniBar(name, p){
    return '<div style="margin-bottom:9px"><div class="row between" style="margin-bottom:3px"><span class="tiny">'+name+'</span><span class="tiny mono">'+fmtPct(p)+'</span></div>'+
      '<div class="bar thin"><i style="width:'+Math.round((p||0)*100)+'%"></i></div></div>';
  }
  function qa(act, ic, t, d){
    return '<button class="qa" data-act="'+act+'"><div class="ic">'+ic+'</div><div class="t">'+t+'</div><div class="d">'+d+'</div></button>';
  }
  function wire(v){
    U.$$('[data-act]', v).forEach(function(b){
      b.addEventListener('click', function(){
        var a = b.dataset.act;
        if(a==='smart') FCE.practice.start({mode:'smart'});
        else U.go(a);
      });
    });
    U.$$('[data-go]', v).forEach(function(b){ b.addEventListener('click', function(){ U.go(b.dataset.go); }); });
    U.$$('[data-drill]', v).forEach(function(b){
      b.addEventListener('click', function(){ FCE.practice.start({mode:'smart', tag:b.dataset.drill}); });
    });
  }
};

/* ---------------- practice hub ---------------- */
U.views.practice = function(){
  var eng = E();
  var due = eng.dueItems().length;
  var types = [
    {t:'mcc',  n:'Part 1 · Multiple-Choice Cloze', d:'Collocations, phrasal verbs, linkers — pick the word that truly fits.', ic:'🔠'},
    {t:'cloze',n:'Part 2 · Open Cloze', d:'One word per gap. Function words: prepositions, articles, auxiliaries…', ic:'✏️'},
    {t:'wf',   n:'Part 3 · Word Formation', d:'Transform the stem. Watch for negatives and spelling traps.', ic:'🧩'},
    {t:'kwt',  n:'Part 4 · Key Word Transformations', d:'2–5 words, key word unchanged. The highest-value part (12 marks).', ic:'🔁'},
  ];
  var tagOpts = Object.keys(FCE.TAGS).map(function(t){
    var m = eng.mEff(t);
    return '<option value="'+t+'">'+U.esc(FCE.TAGS[t].name)+(m!==null? ' ('+Math.round(m*100)+'%)':'')+'</option>';
  }).join('');
  var v = el(
    '<div class="h-page">Practice</div>'+
    '<p class="sub">Every session adapts: due reviews come first, then questions chosen from your weakest high-value skills, kept inside your learning zone and interleaved so your brain has to work.</p>'+
    '<div class="grid g2" style="margin-bottom:16px">'+
      '<button class="qa" data-m="smart" style="border-color:rgba(124,108,255,.5)"><div class="ic">✨</div><div class="t">Smart Session — 10 questions</div><div class="d">The recommended way to study. Mixed parts, weakness-targeted'+(due? ' · <b>'+due+' reviews due</b>':'')+'.</div></button>'+
      '<button class="qa" data-m="sprint"><div class="ic">⚡</div><div class="t">Quick Sprint — 5 questions</div><div class="d">Short on time? Five high-value questions, no excuses.</div></button>'+
    '</div>'+
    '<h3 style="font-size:12px;letter-spacing:1.1px;text-transform:uppercase;color:var(--tx3);margin:18px 0 10px">By exam part</h3>'+
    '<div class="grid g2">'+
      types.map(function(x){
        return '<button class="qa" data-t="'+x.t+'"><div class="ic">'+x.ic+'</div><div class="t">'+x.n+'</div><div class="d">'+x.d+'</div></button>';
      }).join('')+
    '</div>'+
    '<div class="card" style="margin-top:16px"><h3>🎯 Drill one specific skill</h3>'+
      '<div class="row wrap"><select id="drill-tag" style="flex:1;min-width:200px;padding:10px 12px;border-radius:11px;background:#101830;border:1px solid var(--line2)">'+tagOpts+'</select>'+
      '<button class="btn primary" id="drill-go">Drill it</button></div></div>'
  );
  U.$$('[data-m]', v).forEach(function(b){ b.addEventListener('click', function(){
    FCE.practice.start({mode:'smart', n: b.dataset.m==='sprint' ? 5 : 10});
  }); });
  U.$$('[data-t]', v).forEach(function(b){ b.addEventListener('click', function(){
    FCE.practice.start({mode:'smart', type:b.dataset.t});
  }); });
  U.$('#drill-go', v).addEventListener('click', function(){
    FCE.practice.start({mode:'smart', tag:U.$('#drill-tag', v).value});
  });
  return v;
};

/* ---------------- stats ---------------- */
U.views.stats = function(){
  var eng = E(), st = eng.state;
  var coach = eng.coach();
  var seen = coach.filter(function(r){ return r.seen; });
  var radarData = seen.slice().sort(function(a,b){ return (E().state.tags[b.tag].att)-(E().state.tags[a.tag].att); })
    .slice(0,8).map(function(r){ return {name:r.name, val:r.m===null?0.5:r.m}; });
  var heat = eng.heatmap();
  var dna = eng.dna();
  var calib = eng.confReality();
  var lf = eng.luckyAndFalse();
  var strongest = seen.slice().sort(function(a,b){ return (b.m||0)-(a.m||0); }).slice(0,3);
  var weakest = seen.slice().sort(function(a,b){ return (a.m||1)-(b.m||1); }).slice(0,3);
  var forgotten = seen.filter(function(r){
    var t = st.tags[r.tag];
    return t && t.m > 0.6 && (Date.now()-t.last)/86400000 > 3;
  }).slice(0,4);
  var avgMs = {};
  ['mcc','cloze','wf','kwt'].forEach(function(tp){
    var ls = st.log.filter(function(l){ return l.type===tp && l.ms>0; }).slice(-25);
    avgMs[tp] = ls.length ? ls.reduce(function(x,l){return x+l.ms;},0)/ls.length/1000 : null;
  });
  var targets = {mcc:45, cloze:45, wf:45, kwt:75};

  var v = el(
    '<div class="h-page">Weakness Radar</div>'+
    '<p class="sub">Perception vs reality, skill by skill. Red cells are where exam marks are bleeding.</p>'+
    '<div class="grid g2" style="margin-bottom:16px">'+
      '<div class="card"><h3>🕸️ Skill radar (most practised)</h3><div style="display:flex;justify-content:center">'+FCE.charts.radar(radarData)+'</div></div>'+
      '<div class="card"><h3>🧭 Confidence vs reality</h3>'+FCE.charts.calibration(calib)+
        '<div class="row wrap" style="margin-top:8px">'+
        '<span class="chip warn">🎲 '+lf.lucky+' lucky guesses</span>'+
        '<span class="chip bad">💪 '+lf.falseConf+' false-confidence errors</span></div>'+
        '<div class="tiny" style="margin-top:8px">Lucky guesses get re-tested early instead of counting as mastery. "Certain"-but-wrong answers are flagged as dangerous and weighted heavier.</div></div>'+
    '</div>'+

    '<div class="card" style="margin-bottom:16px"><h3>🔥 Open Cloze heatmap — which word types hurt you</h3>'+
      '<div class="heat-grid">'+
      heat.map(function(h){
        var pct = h.err===null ? '—' : Math.round(h.err*100)+'%';
        var tr = h.trend > 0.12 ? '<span class="chip ok" style="font-size:9.5px">▲ improving</span>' : h.trend < -0.12 ? '<span class="chip bad" style="font-size:9.5px">▼ slipping</span>' : '';
        var stars = '★★★★★'.slice(0,h.freq)+'<span style="opacity:.25">'+'★★★★★'.slice(h.freq)+'</span>';
        return '<div class="heat-cell" style="background:'+FCE.charts.heatColor(h.err)+';border-color:'+FCE.charts.heatBorder(h.err)+'">'+
          '<div class="hn">'+U.esc(h.name)+'</div><div class="hv">'+pct+'</div>'+
          '<div class="hs">error rate · '+(h.att||0)+' tries</div>'+
          '<div class="hs" title="frequency in real FCE papers">FCE freq: '+stars+'</div>'+tr+'</div>';
      }).join('')+
      '</div>'+
      '<div class="legend"><span><i style="background:rgba(52,211,153,.5)"></i>safe</span><span><i style="background:rgba(251,191,36,.5)"></i>warning</span><span><i style="background:rgba(251,113,133,.6)"></i>danger</span><span><i style="background:rgba(255,255,255,.12)"></i>no data yet</span><span style="flex:1"></span><span>sorted by exam danger = error × FCE frequency</span></div>'+
    '</div>'+

    '<div class="grid g2" style="margin-bottom:16px">'+
      '<div class="card"><h3>🧬 Mistake DNA — root causes</h3>'+
        (dna.total ? dna.list.map(function(d){
          var c = FCE.CAUSES[d.cause]; if(!c) return '';
          return '<div class="dna-bar"><span>'+c.icon+' '+c.name+'</span><div class="bar"><i class="bad" style="width:'+Math.round(d.pct*100)+'%"></i></div><b>'+d.n+'</b></div>';
        }).join('')+
        '<div class="tiny" style="margin-top:10px">'+dnaAdvice(dna)+'</div>'
        : '<div class="tiny">When you make a mistake, tag its cause — the engine will expose your error patterns here.</div>')+
      '</div>'+
      '<div class="card"><h3>⏱️ Speed vs exam pace</h3>'+
        [['mcc','Part 1'],['cloze','Part 2'],['wf','Part 3'],['kwt','Part 4']].map(function(p){
          var s = avgMs[p[0]], t = targets[p[0]];
          if(s===null) return '<div class="dna-bar"><span>'+p[1]+'</span><div class="bar"><i style="width:0"></i></div><b class="tiny">—</b></div>';
          var ratio = Math.min(1.6, s/t)/1.6;
          var cls = s <= t ? 'ok' : s <= t*1.4 ? 'warn' : 'bad';
          return '<div class="dna-bar"><span>'+p[1]+' <span class="tiny">(target '+t+'s)</span></span><div class="bar"><i class="'+cls+'" style="width:'+Math.round(ratio*100)+'%"></i></div><b>'+Math.round(s)+'s</b></div>';
        }).join('')+
        '<div class="tiny" style="margin-top:10px">Average seconds per question (last 25 of each type) vs the pace the real paper allows.</div></div>'+
    '</div>'+

    '<div class="grid g3" style="margin-bottom:16px">'+
      listCard('💪 Strongest', strongest, 'ok')+
      listCard('🩸 Weakest', weakest, 'bad')+
      listCard('🍂 Forgetting risk', forgotten.length?forgotten:null, 'warn', 'Skills you mastered but haven’t touched in 3+ days.')+
    '</div>'+

    '<div class="card"><h3>📋 Full skill table</h3>'+
      coach.map(function(r){
        var t = st.tags[r.tag];
        var pct = r.m===null ? null : r.m;
        var trend = E().tagTrend(r.tag);
        var trTxt = !t||t.hist.length<6 ? '' : trend>0.12 ? '▲' : trend<-0.12 ? '▼' : '—';
        var trCol = trend>0.12 ? '#6ee7b7' : trend<-0.12 ? '#fda4af' : 'var(--tx3)';
        return '<div class="skill-row"><span>'+U.esc(r.name)+'</span>'+
          '<div class="bar thin"><i class="'+(pct===null?'':pct>0.7?'ok':pct>0.45?'warn':'bad')+'" style="width:'+Math.round((pct||0)*100)+'%"></i></div>'+
          '<span style="color:'+trCol+';text-align:center">'+trTxt+'</span>'+
          '<span class="pct">'+(pct===null?'<span class="tiny">unseen</span>':Math.round(pct*100)+'%')+'</span></div>';
      }).join('')+
    '</div>'
  );
  return v;

  function listCard(title, rows, cls, empty){
    return '<div class="card"><h3>'+title+'</h3>'+
      (rows && rows.length ? rows.map(function(r){
        return '<div class="row between" style="padding:5px 0"><span style="font-size:13px">'+U.esc(r.name)+'</span><span class="chip '+cls+'">'+(r.m===null?'?':Math.round(r.m*100)+'%')+'</span></div>';
      }).join('') : '<div class="tiny">'+(empty||'Not enough data yet.')+'</div>')+'</div>';
  }
  function dnaAdvice(dna){
    if(!dna.list.length) return '';
    var top = dna.list[0], c = FCE.CAUSES[top.cause];
    return '<b>Dominant pattern:</b> '+Math.round(top.pct*100)+'% of your tagged errors are “'+c.name.toLowerCase()+'” — that’s '+c.advice+'.';
  }
};

/* ---------------- coach / emergency plan ---------------- */
U.views.coach = function(){
  var eng = E();
  var recs = eng.coach();
  var emg = eng.emergencyOn();
  var d = eng.daysToExam();
  var plan = eng.emergencyPlan();
  var v = el(
    '<div class="h-page">Study Coach</div>'+
    '<p class="sub">Ranked by <b>marks at risk</b> = how often this skill appears in the real paper × how likely you are to miss it. Fixing the top of this list is the fastest route to a higher grade.</p>'+
    (eng.state.examDate ? '' :
      '<div class="card" style="margin-bottom:16px"><div class="row between wrap"><div><b>Set your exam date</b><div class="tiny">Unlocks the countdown and auto-activates 7-Day Emergency Mode.</div></div><button class="btn small" data-go="settings">Settings →</button></div></div>')+
    '<div class="card" style="margin-bottom:16px"><h3>'+(emg?'🚨 7-Day Emergency Plan':'🗓️ Final-week battle plan (preview)')+'</h3>'+
      (emg && d!==null && d>=0 ? '<p class="muted" style="margin-bottom:12px">'+(d===0?'Exam day. Trust your preparation — one light session max.':'Days remaining: <b>'+d+'</b>. The plan below compresses to fit.')+'</p>' :
       '<p class="muted" style="margin-bottom:12px">This is what your final week will look like. It activates automatically 7 days before your exam'+(eng.state.examDate?'':' (set the date in Settings)')+', or turn it on manually below.</p>')+
      plan.map(function(p){
        return '<div class="coach-item" style="margin-bottom:8px"><div class="coach-rank">D'+p.day+'</div>'+
          '<div style="flex:1"><div class="t">'+U.esc(p.title)+'</div><div class="d">'+U.esc(p.what)+' · <i>'+U.esc(p.focus)+'</i></div></div></div>';
      }).join('')+
      '<div class="row" style="margin-top:12px">'+
        '<button class="btn '+(eng.state.settings.emergency?'danger':'primary')+'" id="emg-toggle">'+(eng.state.settings.emergency?'Deactivate manual Emergency Mode':'🚨 Activate Emergency Mode now')+'</button>'+
      '</div></div>'+
    '<div class="card"><h3>🎯 All recommendations</h3><div class="stack">'+
      recs.map(function(r,i){
        return '<div class="coach-item"><div class="coach-rank">'+(i+1)+'</div>'+
          '<div style="flex:1;min-width:0"><div class="t">'+U.esc(r.name)+'</div><div class="d">'+U.esc(r.why)+'</div>'+
          '<div class="tiny" style="margin-top:4px">'+U.esc(FCE.TAGS[r.tag].tips[0])+'</div></div>'+
          '<div class="gain"><b>≈ '+(Math.round(r.cost*2)/2).toFixed(1)+'</b><span>marks at risk</span></div>'+
          '<button class="btn small" data-drill="'+r.tag+'">Drill</button></div>';
      }).join('')+
    '</div></div>'
  );
  U.$('#emg-toggle', v).addEventListener('click', function(){
    var st = E().state;
    st.settings.emergency = !st.settings.emergency;
    if(st.settings.emergency) E().award('emg');
    E().save(); U.go('coach');
  });
  U.$$('[data-drill]', v).forEach(function(b){ b.addEventListener('click', function(){ FCE.practice.start({mode:'smart', tag:b.dataset.drill}); }); });
  U.$$('[data-go]', v).forEach(function(b){ b.addEventListener('click', function(){ U.go(b.dataset.go); }); });
  return v;
};

/* ---------------- memory lab ---------------- */
U.views.memory = function(){
  var eng = E();
  var leeches = eng.leeches();
  var wrongIds = {};
  eng.state.log.forEach(function(l){ if(!l.ok) wrongIds[l.id] = (wrongIds[l.id]||0)+1; });
  var hard = Object.keys(wrongIds).filter(function(id){ return eng.byId[id]; })
    .sort(function(a,b){ return wrongIds[b]-wrongIds[a]; }).slice(0,12);
  var reviewed = 0;
  var v = el(
    '<div class="h-page">Memory Lab</div>'+
    '<p class="sub">Knowing a rule is not enough — it has to be <b>unforgettable</b>. Every item you keep missing gets a memory hook: a vivid image, story or chunk. Read it, close your eyes, see it, then re-test.</p>'+
    (hard.length ? '<div class="stack" id="mem-list">'+
      hard.map(function(id){
        var it = eng.byId[id], q = it.q;
        var key = answerKey(it);
        var hook = FCE.makeHook(key, contextOf(it));
        return '<div class="mem-card"><div class="row between wrap">'+
          '<div class="mem-word">'+U.esc(key)+'</div>'+
          '<span class="chip bad">missed ×'+wrongIds[id]+(eng.state.items[id]&&eng.state.items[id].lapses>=3?' · leech':'')+'</span></div>'+
          '<div class="tiny" style="margin-top:4px">'+U.esc(contextOf(it))+'</div>'+
          '<div class="flip-zone"><button class="btn small" style="align-self:flex-start" data-flip>🧠 Reveal memory hook</button>'+
          '<div class="mem-hook" style="display:none">'+U.esc(hook)+'</div></div>'+
          '<div class="row" style="margin-top:8px"><button class="btn small primary" data-retest="'+id+'">Re-test me now</button></div>'+
        '</div>';
      }).join('')+'</div>'
    : '<div class="card session-done"><div class="emoji">🧘</div><h2 style="margin:10px 0 6px">Nothing to fix… yet</h2><p class="muted">The Memory Lab fills with the items you miss repeatedly. Go practise — your future leeches are waiting.</p><button class="btn primary" style="margin-top:14px" id="mem-go">Start a Smart Session</button></div>')
  );
  U.$$('[data-flip]', v).forEach(function(b){
    b.addEventListener('click', function(){
      b.style.display='none';
      b.nextElementSibling.style.display='block';
      reviewed++;
      if(reviewed>=10){ E().award('memory'); E().save(); }
    });
  });
  U.$$('[data-retest]', v).forEach(function(b){
    b.addEventListener('click', function(){ FCE.practice.start({mode:'ids', ids:[b.dataset.retest]}); });
  });
  var go = U.$('#mem-go', v);
  if(go) go.addEventListener('click', function(){ FCE.practice.start({mode:'smart'}); });
  return v;

  function answerKey(it){
    var q = it.q;
    if(it.type==='mcc') return q.opts[q.cor];
    return q.ans[0];
  }
  function contextOf(it){
    var q = it.q, s = q.s || (q.s2 ? q.s1+' → '+q.s2 : '');
    return s.replace(/____/g,'_____');
  }
};

/* ---------------- grammar book ---------------- */
U.views.book = function(){
  var eng = E();
  eng.award('bookworm'); eng.save();
  var chapters = eng.grammarBook();
  var v = el(
    '<div class="row between wrap"><div><div class="h-page">Your Personal Grammar Book</div>'+
    '<p class="sub">Written by your mistakes. Each chapter exists because <i>you</i> needed it — ordered by how often it costs you marks. Re-read before the exam; it beats any generic grammar guide.</p></div>'+
    '<button class="btn small" onclick="window.print()">🖨️ Print / save as PDF</button></div>'+
    (chapters.length ? chapters.map(function(c,i){
      var causeTxt = c.topCause && FCE.CAUSES[c.topCause] ? '<span class="chip warn">'+FCE.CAUSES[c.topCause].icon+' mostly: '+FCE.CAUSES[c.topCause].name.toLowerCase()+'</span>' : '';
      return '<div class="gb-chapter'+(i===0?' open':'')+'">'+
        '<div class="gb-head"><div class="num">'+(i+1)+'</div>'+
        '<div style="flex:1;min-width:0"><div class="t">'+U.esc(c.meta.name)+'</div>'+
        '<div class="m">'+c.n+' error'+(c.n>1?'s':'')+' logged · current mastery '+(c.m===null?'—':Math.round(c.m*100)+'%')+'</div></div>'+
        causeTxt+'<span style="margin-left:8px;color:var(--tx3)">▾</span></div>'+
        '<div class="gb-body">'+
          '<div class="gb-rule">'+c.meta.rule+'</div>'+
          '<div style="margin-top:10px">'+c.meta.tips.map(function(t){ return '<div class="tiny" style="padding:3px 0">💡 '+U.esc(t)+'</div>'; }).join('')+'</div>'+
          '<h3 style="margin-top:14px">Your actual mistakes</h3>'+
          c.errors.map(function(eL){
            var it = eng.byId[eL.id]; if(!it) return '';
            var corr = it.type==='mcc' ? it.q.opts[it.q.cor] : it.q.ans[0];
            return '<div class="gb-mistake">'+U.esc(shortQ(it))+'<br>'+
              (eL.user ? 'You wrote: <span class="yours">'+U.esc(eL.user)+'</span> · ' : '')+
              'Correct: <span class="right">'+U.esc(corr)+'</span>'+
              ' <span class="tiny">('+new Date(eL.t).toLocaleDateString()+')</span></div>';
          }).join('')+
        '</div></div>';
    }).join('')
    : '<div class="card session-done"><div class="emoji">📖</div><h2 style="margin:10px 0 6px">Your book is empty (for now)</h2><p class="muted">Every mistake you make writes a page here. By exam day, this becomes your single most valuable revision document.</p><button class="btn primary" style="margin-top:14px" id="bk-go">Make some mistakes →</button></div>')
  );
  U.$$('.gb-head', v).forEach(function(h){
    h.addEventListener('click', function(){ h.parentElement.classList.toggle('open'); });
  });
  var go = U.$('#bk-go', v);
  if(go) go.addEventListener('click', function(){ FCE.practice.start({mode:'smart'}); });
  return v;
  function shortQ(it){
    var q = it.q;
    if(it.type==='kwt') return q.s1+' ['+q.key+'] → '+q.s2;
    if(it.type==='wf') return q.s+' ('+q.stem+')';
    return q.s;
  }
};

/* ---------------- awards ---------------- */
U.views.awards = function(){
  var eng = E(), st = eng.state;
  var v = el(
    '<div class="h-page">Awards & Records</div>'+
    '<p class="sub">Earned through learning, never instead of it.</p>'+
    '<div class="grid g4" style="margin-bottom:16px">'+
      '<div class="stat-tile"><div class="v">'+eng.level()+'</div><div class="l">level</div><div class="bar thin" style="margin-top:8px"><i style="width:'+Math.round(eng.levelProgress()*100)+'%"></i></div></div>'+
      '<div class="stat-tile"><div class="v">'+st.xp+'</div><div class="l">total XP</div></div>'+
      '<div class="stat-tile"><div class="v">'+st.streak.count+'</div><div class="l">day streak</div></div>'+
      '<div class="stat-tile"><div class="v">'+st.records.bestRun+'</div><div class="l">best correct run</div></div>'+
    '</div>'+
    '<div class="badge-grid">'+
      FCE.BADGES.map(function(b){
        var got = st.badges.indexOf(b.id)!==-1;
        return '<div class="badge'+(got?' earned':'')+'"><div class="bi">'+b.icon+'</div><div class="bt">'+b.name+'</div><div class="bd">'+b.desc+'</div></div>';
      }).join('')+
    '</div>'
  );
  return v;
};

/* ---------------- settings ---------------- */
U.views.settings = function(){
  var eng = E(), st = eng.state;
  var v = el(
    '<div class="h-page">Settings</div>'+
    '<p class="sub">Everything is stored locally in this browser. Export a backup before changing devices.</p>'+
    '<div class="card" style="margin-bottom:16px"><h3>👤 Profile</h3>'+
      '<div class="grid g2">'+
      '<div><label class="tiny" style="display:block;margin-bottom:5px">NAME</label><input class="ans-input" style="margin:0;font-size:15px" id="set-name" value="'+U.esc(st.name)+'"></div>'+
      '<div><label class="tiny" style="display:block;margin-bottom:5px">EXAM DATE</label><input class="ans-input" style="margin:0;font-size:15px" id="set-date" type="date" value="'+U.esc(st.examDate)+'"></div>'+
      '</div>'+
      '<button class="btn primary" style="margin-top:14px" id="set-save">Save</button></div>'+
    '<div class="card" style="margin-bottom:16px"><h3>💾 Backup</h3>'+
      '<div class="row wrap">'+
      '<button class="btn" id="set-export">⬇️ Export progress (.json)</button>'+
      '<button class="btn" id="set-import">⬆️ Import progress</button>'+
      '<input type="file" id="set-file" accept=".json,application/json" style="display:none">'+
      '</div></div>'+
    '<div class="card"><h3>⚠️ Danger zone</h3>'+
      '<button class="btn danger" id="set-reset">Reset all progress</button></div>'+
    '<p class="tiny" style="margin-top:18px">FCE Mastery runs entirely on this device: the adaptive engine, score predictor and exercise selection are local algorithms (Elo ability tracking, spaced repetition, forgetting curves, Bayesian-style calibration). No internet, no API, no tracking.</p>'
  );
  U.$('#set-save', v).addEventListener('click', function(){
    st.name = U.$('#set-name', v).value.trim() || st.name;
    st.examDate = U.$('#set-date', v).value;
    eng.save(); U.toast('Saved ✓'); U.go('dash');
  });
  U.$('#set-export', v).addEventListener('click', function(){
    var blob = new Blob([eng.export()], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fce-mastery-progress.json';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
  });
  U.$('#set-import', v).addEventListener('click', function(){ U.$('#set-file', v).click(); });
  U.$('#set-file', v).addEventListener('change', function(ev){
    var f = ev.target.files[0]; if(!f) return;
    var r = new FileReader();
    r.onload = function(){
      try{ eng.import(r.result); U.toast('Progress imported ✓'); U.go('dash'); }
      catch(e){ U.toast('⚠️ That file is not a valid FCE Mastery backup.'); }
    };
    r.readAsText(f);
  });
  U.$('#set-reset', v).addEventListener('click', function(){
    var m = U.modal('<h3 style="margin-bottom:10px;font-size:16px">Reset everything?</h3><p class="muted" style="margin-bottom:16px">Your mastery map, mistake history, grammar book and badges will be permanently deleted from this browser.</p><div class="row"><button class="btn danger" id="rz-yes">Yes, wipe it</button><button class="btn" id="rz-no">Cancel</button></div>');
    U.$('#rz-yes', m).addEventListener('click', function(){ eng.reset(); m.remove(); location.reload(); });
    U.$('#rz-no', m).addEventListener('click', function(){ m.remove(); });
  });
  return v;
};

return U;
})();
