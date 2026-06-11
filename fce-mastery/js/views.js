/* Mastery (FCE) — UI: router, mascot, and all primary views */
window.FCE = window.FCE || {};
FCE.ui = (function(){
var U = {};
var E = function(){ return FCE.engine; };

U.esc = function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
U.$ = function(sel, root){ return (root||document).querySelector(sel); };
U.$$ = function(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); };

/* ---------- Memo, the chubby study blob ---------- */
U.mascot = function(mood, size){
  size = size || 72;
  var eyes, mouth;
  if(mood === 'happy'){
    eyes = '<path d="M40 52 q6 -8 12 0" stroke="#03363D" stroke-width="4" fill="none" stroke-linecap="round"/>'+
           '<path d="M68 52 q6 -8 12 0" stroke="#03363D" stroke-width="4" fill="none" stroke-linecap="round"/>';
    mouth = '<path d="M50 66 q10 11 20 0" stroke="#03363D" stroke-width="4" fill="none" stroke-linecap="round"/>';
  } else if(mood === 'rest'){
    eyes = '<path d="M40 53 h12" stroke="#03363D" stroke-width="4" stroke-linecap="round"/>'+
           '<path d="M68 53 h12" stroke="#03363D" stroke-width="4" stroke-linecap="round"/>';
    mouth = '<path d="M54 67 q6 4 12 0" stroke="#03363D" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
  } else if(mood === 'think'){
    eyes = '<circle cx="46" cy="52" r="4.6" fill="#03363D"/><circle cx="74" cy="50" r="4.6" fill="#03363D"/>'+
           '<circle cx="47.6" cy="50.4" r="1.6" fill="#fff"/><circle cx="75.6" cy="48.4" r="1.6" fill="#fff"/>';
    mouth = '<path d="M54 68 q7 -3 13 1" stroke="#03363D" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
  } else {
    eyes = '<circle cx="46" cy="52" r="5" fill="#03363D"/><circle cx="74" cy="52" r="5" fill="#03363D"/>'+
           '<circle cx="47.8" cy="50.2" r="1.8" fill="#fff"/><circle cx="75.8" cy="50.2" r="1.8" fill="#fff"/>';
    mouth = '<path d="M52 65 q8 8 16 0" stroke="#03363D" stroke-width="4" fill="none" stroke-linecap="round"/>';
  }
  return '<svg class="mascot" viewBox="0 0 120 110" style="width:'+size+'px;height:'+Math.round(size*0.92)+'px" aria-label="Memo">'+
    '<defs><linearGradient id="memog" x1="0" y1="0" x2="0.4" y2="1">'+
    '<stop offset="0" stop-color="#D8EEEC"/><stop offset="0.55" stop-color="#BDD9D7"/><stop offset="1" stop-color="#8FBDB9"/></linearGradient></defs>'+
    /* chubby pear body */
    '<path d="M60 14 C84 14 100 32 102 56 C104 82 88 98 60 98 C32 98 16 82 18 56 C20 32 36 14 60 14 Z" fill="url(#memog)"/>'+
    '<ellipse cx="60" cy="96" rx="34" ry="5" fill="rgba(1,12,14,.25)"/>'+
    /* stubby arms */
    '<path d="M19 62 q-8 4 -6 12 q8 2 12 -5" fill="#8FBDB9"/>'+
    '<path d="M101 62 q8 4 6 12 q-8 2 -12 -5" fill="#8FBDB9"/>'+
    /* belly shine */
    '<ellipse cx="46" cy="36" rx="14" ry="9" fill="rgba(255,255,255,.5)" transform="rotate(-18 46 36)"/>'+
    /* blush */
    '<ellipse cx="36" cy="62" rx="6.5" ry="4" fill="rgba(255,107,92,.55)"/>'+
    '<ellipse cx="84" cy="62" rx="6.5" ry="4" fill="rgba(255,107,92,.55)"/>'+
    eyes + mouth +
    /* tiny graduation cap, tilted */
    '<g transform="rotate(-10 60 14)">'+
    '<path d="M38 16 L60 6 L82 16 L60 26 Z" fill="#03363D"/>'+
    '<path d="M48 20 v8 q12 6 24 0 v-8" fill="#02282D"/>'+
    '<line x1="82" y1="16" x2="86" y2="30" stroke="#FF6B5C" stroke-width="2.6" stroke-linecap="round"/>'+
    '<circle cx="86" cy="32" r="3" fill="#FF6B5C"/></g>'+
  '</svg>';
};
/* the Mastery mark: three rising steps + a coral summit dot */
U.logoSVG = function(size){
  size = size || 36;
  return '<svg class="logo-mark" viewBox="0 0 48 48" style="width:'+size+'px;height:'+size+'px" aria-label="Mastery">'+
    '<defs><linearGradient id="lgm" x1="0" y1="1" x2="1" y2="0">'+
    '<stop offset="0" stop-color="#8FBDB9"/><stop offset="1" stop-color="#5FD3C0"/></linearGradient></defs>'+
    '<rect width="48" height="48" rx="14" fill="rgba(189,217,215,.10)" stroke="rgba(189,217,215,.25)"/>'+
    '<rect x="10" y="28" width="7" height="10" rx="3.5" fill="url(#lgm)" opacity=".55"/>'+
    '<rect x="20.5" y="21" width="7" height="17" rx="3.5" fill="url(#lgm)" opacity=".8"/>'+
    '<rect x="31" y="13" width="7" height="25" rx="3.5" fill="url(#lgm)"/>'+
    '<circle cx="34.5" cy="8.5" r="3.4" fill="#FF6B5C"/>'+
  '</svg>';
};
U.wordmark = function(small){
  return '<span class="wordmark'+(small?' small':'')+'">mastery<span class="ed">FCE</span></span>';
};

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

/* ---------- "How the engine works" ---------- */
U.howModal = function(){
  U.modal(
    '<div style="text-align:center">'+U.mascot('think',64)+'</div>'+
    '<h2 class="serif" style="font-size:24px;margin:10px 0 14px;text-align:center">What’s under the hood</h2>'+
    '<div class="how-sec"><b>1 · A rating, like chess.</b> You and every question hold an Elo rating per exam part. Each answer moves yours; questions are then chosen so you succeed 25–92% of the time — the science-backed “learning zone” where memory forms fastest.</div>'+
    '<div class="how-sec"><b>2 · Forgetting is modelled, not ignored.</b> Every skill decays on a forgetting curve the longer you ignore it. Spaced repetition schedules each item just before you’d lose it; lapses shrink the interval, fast fluent answers stretch it.</div>'+
    '<div class="how-sec"><b>3 · Your behaviour talks.</b> The engine watches hesitation before typing, erase-and-rewrite cycles, answer switching and pace. It detects lucky guesses, hidden doubt and “you changed a right answer” — even if you never rate your confidence.</div>'+
    '<div class="how-sec"><b>4 · Errors are diagnosed, not just counted.</b> A wrong answer is classified: spelling slip, wrong word-family form, wrong word class, missing key word… Each diagnosis routes differently — a spelling slip goes to the Word Forge, a concept gap floods your next sessions with that concept <i>in new exercises</i>.</div>'+
    '<div class="how-sec"><b>5 · Marks-at-risk economics.</b> Every skill carries its real exam weight. Priority = how often Cambridge tests it × how likely you are to miss it. You always study the highest-value marks first.</div>'+
    '<div class="how-sec"><b>6 · Honest forecasting.</b> Your predicted grade blends ability ratings, recent accuracy and mock results, corrected for the fact that practice here is harder than the real paper. The confidence interval narrows as evidence grows.</div>'+
    '<p class="tiny" style="margin-top:14px;text-align:center">All of it runs on this device. No internet, no account, no API.</p>'
  );
};

/* ---------------- router ---------------- */
U.views = {};
U.current = 'dash';
U.liteOverride = null; // session-only override
U.isLite = function(){
  var s = E().state.settings.lite;
  if(U.liteOverride !== null) return U.liteOverride;
  if(s === 'on') return true;
  if(s === 'off') return false;
  return window.innerWidth <= 700;
};
U.go = function(name, arg){
  var eng = E();
  if(FCE.practice && FCE.practice.clearKeys) FCE.practice.clearKeys();
  if(!eng.state.onboarded && name !== 'onboard'){ name = 'onboard'; }
  if(U.isLite() && name === 'dash') name = 'lite';
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

function answeredToday(){
  var today = E().today();
  return E().state.log.filter(function(l){ return new Date(l.t).toISOString().slice(0,10) === today; }).length;
}
function daysChip(){
  var d = E().daysToExam();
  if(d === null) return '';
  if(d < 0) return '<span class="chip">exam date passed</span>';
  if(d === 0) return '<span class="chip bad">🚨 exam day</span>';
  return '<span class="chip '+(d<=7?'bad':'acc')+'">'+d+' day'+(d>1?'s':'')+' to exam</span>';
}
var MEMO_TIPS = [
  'Recall beats re-reading: closing your eyes and retrieving a rule strengthens it three times more than seeing it again.',
  'Miss a question? Perfect. Errors followed by correction are remembered better than easy successes — psychologists call it the hypercorrection effect.',
  'Ten minutes today beats seventy on Sunday. Spacing is the single most replicated finding in memory science.',
  'Before checking an answer, commit to it. The tiny act of commitment makes the feedback stick.',
  'Sleep is part of studying: the night after practice is when your hippocampus files what you learned.',
  'Trust a fluent first instinct — your stats here show whether second-guessing helps or hurts YOU specifically.',
  'In the real exam, never leave a blank. A guess has expected value; a blank has none.',
];

/* ---------------- onboarding ---------------- */
U.views.onboard = function(){
  var v = el(
  '<div class="onb">'+
    '<div style="display:flex;justify-content:center">'+U.mascot('normal', 96)+'</div>'+
    '<h1 style="margin-top:10px">'+U.wordmark()+'</h1>'+
    '<p class="onb-tag">Your personal war-room for B2 First <em>Use of English</em>.<br>An on-device engine learns exactly how you fail — then makes those failures impossible to repeat.</p>'+
    '<div class="field"><label>Your name</label><input id="ob-name" placeholder="e.g. Felix" maxlength="24"></div>'+
    '<div class="field"><label>Exam date <span style="text-transform:none;letter-spacing:0">(optional — powers the countdown & Emergency Mode)</span></label><input id="ob-date" type="date"></div>'+
    '<div class="card" style="margin-top:20px;text-align:left"><h3>First: a 14-question scan</h3>'+
    '<p class="diag-intro">Two minutes across all four parts. It seeds your <b>mastery map</b> so every later session is yours alone. Answer honestly — the engine reads how you answer, not just what.</p></div>'+
    '<button class="btn primary block" id="ob-go" style="margin-top:18px;font-size:15px;padding:14px">Start the scan ▸</button>'+
    '<button class="btn ghost block small" id="ob-skip" style="margin-top:10px">Skip for now</button>'+
    '<p class="tiny" style="margin-top:18px">100% offline · no account · no API · your data never leaves this browser</p>'+
  '</div>');
  function saveBasics(){
    var st = E().state;
    st.name = U.$('#ob-name', v).value.trim() || 'Student';
    st.examDate = U.$('#ob-date', v).value || '';
    st.onboarded = true;
    E().save();
  }
  U.$('#ob-go', v).addEventListener('click', function(){ saveBasics(); FCE.practice.start({mode:'diagnostic'}); });
  U.$('#ob-skip', v).addEventListener('click', function(){
    saveBasics(); E().award('first'); E().save();
    U.toast('Welcome aboard, '+U.esc(E().state.name)+'. Memo will calibrate as you go.');
    U.go('dash');
  });
  v.addEventListener('keydown', function(ev){
    if(ev.key === 'Enter'){ ev.preventDefault(); saveBasics(); FCE.practice.start({mode:'diagnostic'}); }
  });
  return v;
};

/* ---------------- dashboard (bento) ---------------- */
U.views.dash = function(){
  var eng = E(), st = eng.state;
  var pr = eng.predict();
  var recs = eng.coach().slice(0,3);
  var ch = eng.challenge();
  var emg = eng.emergencyOn();
  var due = eng.dueItems().length;
  var goal = st.settings.dailyGoal || 20;
  var doneToday = answeredToday();
  var tip = MEMO_TIPS[(new Date().getDate()) % MEMO_TIPS.length];
  var hour = new Date().getHours();
  var greet = hour < 12 ? 'Good morning' : hour < 19 ? 'Good afternoon' : 'Good evening';
  var hasData = pr.n >= 10;
  var nSignals = st.log.length*7 + st.records.total*3;

  var html = '';
  if(emg){
    var d = eng.daysToExam();
    html += '<div class="emg-ribbon">🚨 <b>Emergency Mode</b> — locked onto your highest-value weaknesses.'+
      (d!==null && d>=0 ? ' <b>'+(d===0?'Exam day — go gently.':d+' day'+(d>1?'s':'')+' left.')+'</b>' : '')+
      '<span style="flex:1"></span><button class="btn small ghost" data-go="coach">Plan →</button></div>';
  }
  html +=
  '<div class="dash-head">'+
    '<div><div class="greet">'+greet+', <em>'+U.esc(st.name||'friend')+'</em>.</div>'+
    '<div class="ticker" style="margin-top:9px">ENGINE LIVE · <b>'+nSignals.toLocaleString()+'</b> signals · <b>'+Object.keys(FCE.TAGS).length+'</b> skills tracked · <b>'+eng.allItems().length+'</b> exercises · '+(due? '<b>'+due+'</b> reviews due':'queue clear')+'</div></div>'+
    '<div class="row">'+daysChip()+'<button class="btn small ghost" data-go="awards" title="Awards">🏆</button></div>'+
  '</div>'+

  '<div class="bento" style="margin-bottom:16px">'+
    '<div class="card hoverable grade-card sp7"><div class="halo"></div>'+
      '<h3>Predicted FCE grade <span class="grow"></span><button class="btn small ghost" id="how-link">how? ⓘ</button></h3>'+
      (hasData ?
        '<div class="row" style="gap:26px;flex-wrap:wrap;align-items:center">'+
          '<div class="grade-big">'+pr.grade+'</div>'+
          '<div style="flex:1;min-width:190px">'+
            '<div class="serif" style="font-size:18px;color:var(--mint)">'+pr.label+'</div>'+
            '<div class="muted" style="margin:4px 0 12px">Cambridge scale '+pr.scale+' ± '+pr.ci+(pr.borderline?' · <span style="color:var(--gold)">on a boundary — every mark moves you</span>':'')+'</div>'+
            '<div class="gp-row"><span>Chance of passing</span><div class="bar thin"><i class="ok shimmer" style="width:'+Math.round(pr.pass*100)+'%"></i></div><b>'+Math.round(pr.pass*100)+'%</b></div>'+
            (pr.pA>0.05?'<div class="gp-row" style="margin-top:7px"><span>Chance of grade A</span><div class="bar thin"><i class="gold" style="width:'+Math.round(pr.pA*100)+'%"></i></div><b>'+Math.round(pr.pA*100)+'%</b></div>':'')+
            '<div class="tiny" style="margin-top:9px">From '+pr.n+' answers'+(st.mocks.length? ' + '+st.mocks.length+' mock'+(st.mocks.length>1?'s':''):'')+' · sharpens as you go.</div>'+
          '</div>'+
          '<div style="margin:0 auto">'+FCE.charts.gauge(pr.scale, pr.ci)+'</div>'+
        '</div>'
        :
        '<div class="row" style="gap:18px">'+U.mascot('think',72)+'<div class="muted" style="flex:1;font-size:14.5px">Too early to call — give me ~10 answers and I’ll show your predicted grade, Cambridge scale and pass probability. Honestly, with error bars.</div></div>')+
    '</div>'+
    '<div class="card sp5">'+
      '<h3>Today</h3>'+
      '<div class="row" style="gap:18px">'+
        FCE.charts.ring(Math.min(1,doneToday/goal), String(doneToday), 'of '+goal+' today', doneToday>=goal?'#5FD3A6':'#5FD3C0')+
        '<div style="flex:1;min-width:0">'+
          '<div class="serif" style="font-size:17.5px;line-height:1.45">'+(doneToday>=goal?'Goal met. Everything else is compound interest.':(goal-doneToday)+' questions between you and today’s win.')+'</div>'+
          '<div class="row wrap" style="margin-top:8px"><span class="chip gold">🔥 '+st.streak.count+'-day streak</span><span class="chip">LVL '+eng.level()+'</span></div>'+
        '</div>'+
      '</div>'+
      '<div class="today-cta">'+
        '<button class="btn primary" data-act="smart">▸ Smart Session</button>'+
        '<button class="btn" data-go="mock">Mock</button>'+
        '<button class="btn" data-act="gym">⚒ Forge</button>'+
      '</div>'+
    '</div>'+
  '</div>'+

  '<h3 class="sec-label">Where your marks are <b>leaking</b></h3>'+
  '<div class="bento" style="margin-bottom:16px">'+
    recs.map(function(r,i){
      return '<div class="card hoverable focus-card sp4">'+
        '<div class="fk">Target '+(i+1)+(r.boosted?' · reinforcing':'')+'</div>'+
        '<div class="fn">'+U.esc(r.name)+'</div>'+
        '<div class="fw">'+U.esc(r.why)+'</div>'+
        '<div class="fg"><b>≈'+(Math.round(r.cost*2)/2).toFixed(1)+'</b><span>marks at stake</span></div>'+
        '<button class="btn small block" data-drill="'+r.tag+'">Drill this →</button>'+
      '</div>';
    }).join('')+
  '</div>'+

  '<div class="bento">'+
    '<div class="card sp6"><h3>'+ch.ch.name+' <span class="grow"></span><span class="chip '+(ch.done?'ok':'acc')+'">'+ch.prog+' / '+ch.ch.n+'</span></h3>'+
      '<div class="muted" style="margin-bottom:10px">'+ch.ch.desc+' — this week’s challenge.</div>'+
      '<div class="bar"><i class="gold" style="width:'+Math.round(100*ch.prog/ch.ch.n)+'%"></i></div></div>'+
    '<div class="card memo-tip sp6"><div class="row" style="align-items:flex-start;gap:14px">'+U.mascot('normal',56)+
      '<div style="flex:1"><h3 style="margin-bottom:6px">Memo says</h3><div class="serif" style="font-size:14.5px;line-height:1.65">'+tip+'</div></div></div></div>'+
  '</div>';

  var v = el(html);
  wireDash(v);
  return v;
};
function wireDash(v){
  U.$$('[data-act]', v).forEach(function(b){
    b.addEventListener('click', function(){
      if(b.dataset.act==='smart') FCE.practice.start({mode:'smart'});
      else if(b.dataset.act==='gym') FCE.practice.spellingGym();
    });
  });
  U.$$('[data-go]', v).forEach(function(b){ b.addEventListener('click', function(){ U.go(b.dataset.go); }); });
  U.$$('[data-drill]', v).forEach(function(b){
    b.addEventListener('click', function(){ FCE.practice.start({mode:'smart', tag:b.dataset.drill}); });
  });
  var how = U.$('#how-link', v);
  if(how) how.addEventListener('click', U.howModal);
}

/* ---------------- lite (mobile) home ---------------- */
U.views.lite = function(){
  var eng = E(), st = eng.state;
  var pr = eng.predict();
  var v = el(
    '<div class="lite-home">'+
      '<div style="display:flex;justify-content:center">'+U.mascot('normal',72)+'</div>'+
      '<h1 class="serif" style="text-align:center;font-size:28px;margin:8px 0 2px">Hi '+U.esc(st.name||'there')+'</h1>'+
      '<div class="row" style="justify-content:center;margin-bottom:20px">'+
        '<span class="chip gold">🔥 '+st.streak.count+'</span>'+
        (pr.n>=10?'<span class="chip acc">grade '+pr.grade+' · '+Math.round(pr.pass*100)+'% pass</span>':'')+
      '</div>'+
      '<button class="btn primary block lite-big" data-m="smart">▸ Smart Session<small>the engine picks what matters</small></button>'+
      '<div class="lite-grid">'+
        '<button class="btn" data-t="mcc">Part 1</button>'+
        '<button class="btn" data-t="cloze">Part 2</button>'+
        '<button class="btn" data-t="wf">Part 3</button>'+
        '<button class="btn" data-t="kwt">Part 4</button>'+
      '</div>'+
      '<button class="btn block" data-m="gym" style="margin-top:10px">⚒ Word Forge</button>'+
      '<button class="btn block" data-m="endless" style="margin-top:10px">∞ Endless practice</button>'+
      '<div class="row" style="justify-content:center;margin-top:22px">'+
        '<button class="btn ghost small" id="lite-full">Open full app →</button>'+
      '</div>'+
    '</div>'
  );
  U.$$('[data-m]', v).forEach(function(b){ b.addEventListener('click', function(){
    if(b.dataset.m==='gym') FCE.practice.spellingGym();
    else FCE.practice.start({mode:b.dataset.m==='endless'?'endless':'smart'});
  }); });
  U.$$('[data-t]', v).forEach(function(b){ b.addEventListener('click', function(){ FCE.practice.start({mode:'smart', type:b.dataset.t}); }); });
  U.$('#lite-full', v).addEventListener('click', function(){ U.liteOverride = false; FCE.app.buildNav(); U.go('dash'); });
  return v;
};

/* ---------------- practice hub ---------------- */
U.views.practice = function(){
  var eng = E();
  var due = eng.dueItems().length;
  var tagOpts = Object.keys(FCE.TAGS).map(function(t){
    var m = eng.mEff(t);
    return '<option value="'+t+'">'+U.esc(FCE.TAGS[t].name)+(m!==null? ' · '+Math.round(m*100)+'%':'')+'</option>';
  }).join('');
  var v = el(
    '<div class="h-page">Practice</div>'+
    '<p class="sub">Everything runs in short <b>sessions</b> — a clear start, a clear end, a clear win. Reviews due first, then your weak spots, all four parts balanced until the engine knows you better.</p>'+

    '<div class="grid g2" style="margin-bottom:18px">'+
      '<button class="qa" data-m="smart" style="border-color:rgba(14,94,100,.45)"><div class="ic">✦</div><div class="t">Smart Session · 10</div><div class="d">The recommended way in. The engine weighs all four parts by where your marks leak'+(due? ' — <b>'+due+' reviews waiting</b>':'')+'.</div></button>'+
      '<button class="qa" data-m="endless"><div class="ic">∞</div><div class="t">Endless</div><div class="d">No session wall — question after question until <i>you</i> say stop. Progress saves whenever you end.</div></button>'+
    '</div>'+

    '<div class="card" style="margin-bottom:18px"><h3>Build your own session</h3>'+
      '<div class="row wrap" style="margin-bottom:12px" id="part-picks">'+
        '<button class="pick sel" data-p="mcc">Part 1 · Multiple Choice</button>'+
        '<button class="pick sel" data-p="cloze">Part 2 · Open Cloze</button>'+
        '<button class="pick sel" data-p="wf">Part 3 · Word Formation</button>'+
        '<button class="pick sel" data-p="kwt">Part 4 · Transformations</button>'+
      '</div>'+
      '<div class="row wrap">'+
        '<span class="tiny" style="font-weight:700;letter-spacing:1px;text-transform:uppercase">Length</span>'+
        '<button class="pick len" data-n="5">5</button>'+
        '<button class="pick len sel" data-n="10">10</button>'+
        '<button class="pick len" data-n="15">15</button>'+
        '<span class="grow"></span>'+
        '<button class="btn primary" id="custom-go">Start ▸</button>'+
      '</div></div>'+

    '<div class="grid g2">'+
      '<div class="card"><h3>⚒ Word Forge</h3>'+
        '<p class="muted" style="margin-bottom:12px">Look-cover-write and letter-forging rounds built from <b>your own</b> misspellings plus Cambridge’s favourite trap words. You never see a wrong spelling — only the right one, burned in.</p>'+
        '<button class="btn teal" id="gym-go">Enter the Forge ▸</button></div>'+
      '<div class="card"><h3>🎯 Drill one skill</h3>'+
        '<p class="muted" style="margin-bottom:12px">Hammer a single weakness — conditionals, prepositions, passives…</p>'+
        '<div class="row wrap"><select id="drill-tag">'+tagOpts+'</select>'+
        '<button class="btn" id="drill-go">Drill ▸</button></div></div>'+
    '</div>'
  );
  U.$$('[data-m]', v).forEach(function(b){ b.addEventListener('click', function(){
    FCE.practice.start({mode: b.dataset.m === 'endless' ? 'endless' : 'smart'});
  }); });
  U.$$('#part-picks .pick', v).forEach(function(b){
    b.addEventListener('click', function(){ b.classList.toggle('sel'); });
  });
  U.$$('.pick.len', v).forEach(function(b){
    b.addEventListener('click', function(){
      U.$$('.pick.len', v).forEach(function(x){ x.classList.remove('sel'); });
      b.classList.add('sel');
    });
  });
  U.$('#custom-go', v).addEventListener('click', function(){
    var parts = U.$$('#part-picks .pick.sel', v).map(function(b){ return b.dataset.p; });
    if(!parts.length){ U.toast('Pick at least one part.'); return; }
    var nBtn = U.$('.pick.len.sel', v);
    FCE.practice.start({mode:'smart', types:parts, n:+(nBtn?nBtn.dataset.n:10)});
  });
  U.$('#gym-go', v).addEventListener('click', function(){ FCE.practice.spellingGym(); });
  U.$('#drill-go', v).addEventListener('click', function(){
    FCE.practice.start({mode:'smart', tag:U.$('#drill-tag', v).value});
  });
  return v;
};

/* ---------------- progress (tabbed) ---------------- */
U.views.progress = function(arg){
  var tab = arg || 'overview';
  var eng = E(), st = eng.state;
  var pr = eng.predict();
  var html = '<div class="h-page">Progress</div>'+
    '<p class="sub">The headline first; the microscope if you want it.</p>'+
    '<div class="tabs">'+
      ['overview|Overview','skills|Skills','habits|Habits & confidence','words|Words & spelling'].map(function(t){
        var p = t.split('|');
        return '<button class="tab'+(tab===p[0]?' active':'')+'" data-tab="'+p[0]+'">'+p[1]+'</button>';
      }).join('')+
    '</div>';

  if(tab === 'overview'){
    var trend = st.trend.slice(-14).map(function(t){ return t.acc; });
    var lf = eng.luckyAndFalse();
    html += '<div class="grid g2" style="margin-bottom:16px">'+
      '<div class="card"><h3>The headline</h3>'+
        (pr.n>=10 ?
        '<div class="ins-line">Right now you’re heading for a <b>'+(pr.grade==='B1'||pr.grade==='—'?'fail — yet':'grade '+pr.grade)+'</b> ('+pr.scale+' ± '+pr.ci+' on the Cambridge scale), with a <b>'+Math.round(pr.pass*100)+'% chance of passing</b>.'+(pr.borderline?' You are sitting on a grade boundary — a handful of marks moves you up or down.':'')+'</div>'
        : '<div class="ins-line">Not enough evidence yet — about 10 answers in, the forecast switches on.</div>')+
        '<div class="ins-note">Based on '+pr.n+' answers'+(st.mocks.length?' and '+st.mocks.length+' mock'+(st.mocks.length>1?'s':''):'')+'. The interval honestly narrows as you practise; mocks weigh heaviest.</div></div>'+
      '<div class="card"><h3>Session accuracy trend</h3>'+FCE.charts.spark(trend)+
        '<div class="ins-note">'+(trend.length>=2 ? (trend[trend.length-1]>=trend[0]?'Trending up — keep the cadence.':'Recent dip — usually means the engine raised difficulty. Good sign, not bad.') : 'Two sessions unlock the trend line.')+'</div></div>'+
    '</div>'+
    '<div class="card" style="margin-bottom:16px"><h3>Exam parts</h3>'+
      [['mcc','Part 1 · Multiple Choice'],['cloze','Part 2 · Open Cloze'],['wf','Part 3 · Word Formation'],['kwt','Part 4 · Transformations']].map(function(p){
        var val = pr.per[p[0]];
        return '<div class="skill-row"><span>'+p[1]+'</span><div class="bar thin"><i class="'+(val>0.7?'ok':val>0.5?'warn':'bad')+'" style="width:'+Math.round(val*100)+'%"></i></div><span></span><span class="pct">'+Math.round(val*100)+'%</span></div>';
      }).join('')+
      '<div class="ins-note">Expected accuracy per part at exam difficulty. Part 4 carries 12 of the 36 marks — weight your time accordingly.</div></div>'+
    '<div class="grid g3">'+
      '<div class="stat-tile"><div class="v">'+st.records.total+'</div><div class="l">answers given</div></div>'+
      '<div class="stat-tile"><div class="v">'+eng.dueItems().length+'</div><div class="l">reviews due</div></div>'+
      '<div class="stat-tile"><div class="v">'+lf.lucky+'</div><div class="l">lucky guesses caught</div></div>'+
    '</div>';
  }

  if(tab === 'skills'){
    var coach = eng.coach();
    html += '<div class="card"><h3>Every skill, ranked by marks at risk</h3>'+
      '<div class="ins-note" style="margin-bottom:10px">Bar = your current mastery (decays if untouched). 🔁 = the engine is actively re-feeding this concept after recent misses.</div>'+
      coach.map(function(r){
        var pct = r.m===null ? null : r.m;
        var trendv = eng.tagTrend(r.tag);
        var tr = pct===null ? '' : trendv>0.12 ? '▲' : trendv<-0.12 ? '▼' : '·';
        var trCol = trendv>0.12 ? 'var(--ok)' : trendv<-0.12 ? 'var(--bad)' : 'var(--ink3)';
        return '<div class="skill-row"><span>'+U.esc(r.name)+(r.boosted?' 🔁':'')+'</span>'+
          '<div class="bar thin"><i class="'+(pct===null?'':pct>0.7?'ok':pct>0.45?'warn':'bad')+'" style="width:'+Math.round((pct||0)*100)+'%"></i></div>'+
          '<span style="color:'+trCol+';text-align:center">'+tr+'</span>'+
          '<span class="pct">'+(pct===null?'<span class="tiny">new</span>':Math.round(pct*100)+'%')+'</span></div>';
      }).join('')+'</div>';
  }

  if(tab === 'habits'){
    var br = eng.behaviorReport();
    var calib = eng.confReality();
    html += '<div class="grid g2" style="margin-bottom:16px">';
    if(br && br.n >= 8){
      var inst = br.instinct;
      html += '<div class="card"><h3>Your instinct, measured</h3>'+
        (inst !== null ?
          '<div class="ins-line">When you changed an answer, your first instinct was right <b>'+Math.round(inst*100)+'% of the time</b>.</div>'+
          '<div class="ins-note">'+(inst>0.6?'Your gut outperforms your second thoughts — in the exam, only change an answer with a concrete reason.':'Your revisions genuinely improve answers — keep checking before you commit.')+'</div>'
          : '<div class="ins-line">No answer-changes recorded yet — your first version is usually your final one.</div>')+
        '<div class="divider"></div>'+
        '<div class="row wrap">'+
          '<span class="chip ok">🛠 '+br.selfCorrect+' self-corrections</span>'+
          '<span class="chip warn">↩ '+br.changedRight+' right answers abandoned</span>'+
          '<span class="chip acc">⚡ '+br.fastRight+' faster-than-exam answers</span>'+
        '</div></div>';
      html += '<div class="card"><h3>The hidden tells</h3>'+
        '<div class="ins-line">Average hesitation before answering: <b>'+br.avgHesit.toFixed(1)+'s</b>. Rewrites per question: <b>'+br.avgEdits.toFixed(1)+'</b>.</div>'+
        '<div class="ins-note">'+(br.hiddenHesit>2?'On '+br.hiddenHesit+' answers you claimed “Certain” while your typing said otherwise — those items get earlier reviews automatically.':'Your declared confidence and your behaviour mostly agree — a sign of honest self-assessment.')+'</div>'+
        (br.fluentSure?'<div class="ins-note">'+br.fluentSure+' “guesses” were answered fast and clean — you know more than you give yourself credit for.</div>':'')+
        '</div>';
    } else {
      html += '<div class="card"><div class="row">'+U.mascot('think',56)+'<div class="muted" style="flex:1">Answer ~8 more questions and I’ll show what your typing reveals: hesitation, abandoned right answers, hidden doubt…</div></div></div>';
    }
    html += '</div>';
    var anyCal = calib.some(function(r){ return r.att >= 4; });
    html += '<div class="card"><h3>When you rate your confidence, can it be trusted?</h3>';
    if(anyCal){
      html += calib.map(function(r){
        if(!r.att) return '';
        var a = Math.round((r.actual||0)*100);
        var verdict = r.actual===null ? '' :
          r.actual >= r.claimed+0.08 ? '<span class="chip ok">underconfident</span>' :
          r.actual <= r.claimed-0.12 ? '<span class="chip bad">overconfident</span>' :
          '<span class="chip ok">well calibrated ✓</span>';
        return '<div class="calib-row"><span>'+r.icon+' “'+r.name+'”</span>'+
          '<div class="bar thin"><i class="'+(r.actual>=r.claimed-0.07?'ok':'bad')+'" style="width:'+a+'%"></i></div>'+
          '<b>'+a+'%</b>'+verdict+'</div>';
      }).join('')+
      '<div class="ins-note">Read: of the answers you called “Certain”, the bar shows how many were actually right. Rating confidence is optional — but when you do, this is the audit.</div>';
    } else {
      html += '<div class="muted">Rate your confidence on a few answers (it’s optional) and this audit unlocks: are your “Certains” really certain?</div>';
    }
    html += '</div>';
  }

  if(tab === 'words'){
    var heat = eng.heatmap().filter(function(h){ return h.att > 0; });
    var unseen = eng.heatmap().filter(function(h){ return !h.att; });
    var rep = eng.spellReport();
    var dna = eng.dna();
    html += '<div class="card" style="margin-bottom:16px"><h3>Open Cloze — the little words</h3>'+
      '<div class="ins-note" style="margin-bottom:12px">Part 2 gaps are almost always function words. This shows which kinds cost you marks (sorted by danger = your error rate × how often Cambridge uses that kind).</div>'+
      (heat.length ? '<div class="heat-grid">'+heat.map(function(h){
        var acc = Math.round((1-h.err)*100);
        var status = h.err<0.2?'<span class="chip ok">safe</span>':h.err<0.45?'<span class="chip warn">risky</span>':'<span class="chip bad">danger</span>';
        return '<div class="heat-cell" style="background:'+FCE.charts.heatColor(h.err)+';border-color:'+FCE.charts.heatBorder(h.err)+'">'+
          '<div class="hn">'+U.esc(h.name)+'</div><div class="hv">'+acc+'%</div>'+
          '<div class="hs">'+h.att+' answered · FCE '+'★'.repeat(h.freq)+'</div>'+status+'</div>';
      }).join('')+'</div>' : '<div class="muted">Answer some Open Cloze questions and this map lights up.</div>')+
      (unseen.length ? '<div class="tiny" style="margin-top:10px">Not yet tested: '+unseen.map(function(h){return h.name;}).join(' · ')+'</div>' : '')+
    '</div>'+
    '<div class="grid g2">'+
      '<div class="card"><h3>Spelling fingerprint</h3>'+
        (rep.total ? rep.patterns.slice(0,4).map(function(p2){
            var names = {double:'Double letters', ie:'IE / EI order', tion:'-tion vs -sion', vowel:'Weak vowels', silente:'Dropped letters', other:'Letter order'};
            return '<div class="dna-bar"><span>'+(names[p2.id]||p2.id)+'</span><div class="bar thin"><i class="warn" style="width:'+Math.round(100*p2.n/rep.total)+'%"></i></div><b>'+p2.n+'</b></div>';
          }).join('')+
          (rep.words.length?'<div class="ins-note">Words that beat you: '+rep.words.slice(0,5).map(function(w){return '<b>'+U.esc(w.w)+'</b>';}).join(', ')+'. The Gym serves these first.</div>':'')+
          '<button class="btn teal small" id="pg-gym" style="margin-top:10px">⚒ Forge them now</button>'
        : '<div class="muted">No spelling slips recorded yet. When they happen, the engine classifies the <i>kind</i> of slip and builds your antidote here.</div>')+
      '</div>'+
      '<div class="card"><h3>Why you miss things</h3>'+
        (dna.total ? dna.list.map(function(d2){
          var c = FCE.CAUSES[d2.cause]; if(!c) return '';
          return '<div class="dna-bar"><span>'+c.icon+' '+c.name+'</span><div class="bar thin"><i class="bad" style="width:'+Math.round(d2.pct*100)+'%"></i></div><b>'+d2.n+'</b></div>';
        }).join('')+
        '<div class="ins-note">'+(function(){ var top=dna.list[0], c=FCE.CAUSES[top.cause]; return '<b>Dominant pattern:</b> '+Math.round(top.pct*100)+'% — '+c.advice+'.'; })()+'</div>'
        : '<div class="muted">Tag the cause when you miss (one tap) and your error anatomy appears here.</div>')+
      '</div>'+
    '</div>';
  }

  var v = el(html);
  U.$$('.tab', v).forEach(function(b){ b.addEventListener('click', function(){ U.go('progress', b.dataset.tab); }); });
  var pgGym = U.$('#pg-gym', v);
  if(pgGym) pgGym.addEventListener('click', function(){ FCE.practice.spellingGym(); });
  return v;
};

/* ---------------- coach ---------------- */
U.views.coach = function(){
  var eng = E(), st = eng.state;
  var recs = eng.coach();
  var emg = eng.emergencyOn();
  var d = eng.daysToExam();
  var plan = eng.emergencyPlan();
  var wants = Object.keys(st.wants).filter(function(id){ return eng.byId[id]; });
  var leeches = eng.leeches().slice(0,6);
  var v = el(
    '<div class="h-page">Coach</div>'+
    '<p class="sub">One question, answered continuously: <i>what is the next most valuable thing you can do?</i> Ranked by real exam weight × your risk of missing it.</p>'+

    '<h3 class="sec-label">Next three wins</h3>'+
    '<div class="stack" style="margin-bottom:20px">'+
      recs.slice(0,3).map(function(r,i){
        return '<div class="coach-item"><div class="coach-rank">'+(i+1)+'</div>'+
          '<div style="flex:1;min-width:0"><div class="t">'+U.esc(r.name)+(r.boosted?' <span class="chip warn" style="font-size:10px">🔁 reinforcing</span>':'')+'</div><div class="d">'+U.esc(r.why)+'</div>'+
          '<div class="tiny" style="margin-top:4px">💡 '+U.esc(FCE.TAGS[r.tag].tips[0])+'</div></div>'+
          '<div class="gain"><b>+'+(Math.round(r.cost*2)/2).toFixed(1)+'</b><span>marks</span></div>'+
          '<button class="btn small" data-drill="'+r.tag+'">Drill</button></div>';
      }).join('')+
    '</div>'+

    (wants.length ?
    '<h3 class="sec-label">🎯 Your Mastery List <span style="text-transform:none;letter-spacing:0;font-weight:400">— you asked for these; two clean wins each and they’re gone</span></h3>'+
    '<div class="stack" style="margin-bottom:20px">'+
      wants.map(function(id){
        var it = eng.byId[id], w = st.wants[id];
        var label = it.type==='mcc' ? it.q.opts[it.q.cor] : it.q.ans[0];
        return '<div class="coach-item"><div style="flex:1;min-width:0"><div class="t serif" style="font-style:italic">“'+U.esc(label)+'”</div>'+
          '<div class="d">'+U.esc(FCE.TAGS[(it.q.tags||[])[0]] ? FCE.TAGS[it.q.tags[0]].name : '')+' · progress '+(w.cleared||0)+'/2</div></div>'+
          '<button class="btn small teal" data-retest="'+id+'">Re-test ▸</button></div>';
      }).join('')+
    '</div>' : '')+

    (leeches.length ?
    '<h3 class="sec-label">Stubborn items <span style="text-transform:none;letter-spacing:0;font-weight:400">— missed 3+ times; they need deliberate kills</span></h3>'+
    '<div class="stack" style="margin-bottom:20px">'+
      leeches.map(function(id){
        var it = eng.byId[id];
        var label = it.type==='mcc' ? it.q.opts[it.q.cor] : it.q.ans[0];
        return '<div class="coach-item"><div style="flex:1;min-width:0"><div class="t serif" style="font-style:italic">“'+U.esc(label)+'”</div>'+
          '<div class="d">'+U.esc(st.items[id].lapses)+' misses · '+U.esc((it.q.exp||'').slice(0,90))+'</div></div>'+
          '<button class="btn small" data-retest="'+id+'">Face it ▸</button></div>';
      }).join('')+
    '</div>' : '')+

    '<div class="card"><h3>'+(emg?'🚨 Emergency plan':'Final-week plan (preview)')+'</h3>'+
      (emg && d!==null && d>=0 ? '<p class="muted" style="margin-bottom:12px">'+(d===0?'Exam day. One light session, then trust the work.':'<b>'+d+' day'+(d>1?'s':'')+'</b> left — the plan compresses to fit.')+'</p>'
       : '<p class="muted" style="margin-bottom:12px">Auto-activates 7 days before your exam'+(st.examDate?'':' — set the date in Settings')+'.</p>')+
      plan.map(function(p){
        return '<div class="coach-item" style="margin-bottom:8px"><div class="coach-rank">D'+p.day+'</div>'+
          '<div style="flex:1"><div class="t">'+U.esc(p.title)+'</div><div class="d">'+U.esc(p.what)+' · <i>'+U.esc(p.focus)+'</i></div></div></div>';
      }).join('')+
      '<button class="btn '+(st.settings.emergency?'danger':'primary')+'" id="emg-toggle" style="margin-top:10px">'+(st.settings.emergency?'Deactivate manual Emergency Mode':'🚨 Activate Emergency Mode now')+'</button>'+
    '</div>'
  );
  U.$('#emg-toggle', v).addEventListener('click', function(){
    st.settings.emergency = !st.settings.emergency;
    if(st.settings.emergency) eng.award('emg');
    eng.save(); U.go('coach');
  });
  U.$$('[data-drill]', v).forEach(function(b){ b.addEventListener('click', function(){ FCE.practice.start({mode:'smart', tag:b.dataset.drill}); }); });
  U.$$('[data-retest]', v).forEach(function(b){ b.addEventListener('click', function(){ FCE.practice.start({mode:'ids', ids:[b.dataset.retest]}); }); });
  return v;
};

/* ---------------- grammar book ---------------- */
U.views.book = function(){
  var eng = E();
  eng.award('bookworm'); eng.save();
  var chapters = eng.grammarBook();
  var v = el(
    '<div class="row between wrap" style="margin-bottom:4px"><div class="h-page">Your Grammar Book</div>'+
    '<button class="btn small" onclick="window.print()">🖨 Print / PDF</button></div>'+
    '<p class="sub">A book that writes itself from your mistakes. Each chapter exists because <i>you</i> needed it; the worst offenders sit on top. Read it the night before the exam.</p>'+
    (chapters.length ? chapters.map(function(c,i){
      return '<div class="gb-chapter'+(i===0?' open':'')+'">'+
        '<div class="gb-head"><div class="num">'+(i+1)+'</div>'+
        '<div style="flex:1;min-width:0"><div class="t">'+U.esc(c.meta.name)+'</div>'+
        '<div class="m">'+c.n+' miss'+(c.n>1?'es':'')+' · mastery now '+(c.m===null?'—':Math.round(c.m*100)+'%')+
        (c.topCause && FCE.CAUSES[c.topCause] ? ' · mostly “'+FCE.CAUSES[c.topCause].name.toLowerCase()+'”' : '')+'</div></div>'+
        '<span class="gb-arrow">▾</span></div>'+
        '<div class="gb-body">'+
          '<div class="gb-rule">'+c.meta.rule+'</div>'+
          '<div class="row wrap" style="margin-top:10px">'+c.meta.tips.map(function(t){ return '<span class="chip">💡 '+U.esc(t)+'</span>'; }).join('')+'</div>'+
          '<h3 style="margin-top:16px">Your own slip-ups</h3>'+
          c.errors.slice(0,3).map(function(eL){
            var it = eng.byId[eL.id]; if(!it) return '';
            var corr = it.type==='mcc' ? it.q.opts[it.q.cor] : it.q.ans[0];
            return '<div class="gb-mistake">'+U.esc(shortQ(it))+'<br>'+
              (eL.user ? 'You: <span class="yours">'+U.esc(eL.user)+'</span> → ' : '')+
              '<span class="right">'+U.esc(corr)+'</span></div>';
          }).join('')+
          '<button class="btn small teal" data-drill="'+c.tag+'" style="margin-top:12px">Drill this chapter ▸</button>'+
        '</div></div>';
    }).join('')
    : '<div class="card session-done">'+U.mascot('rest',80)+'<h2 class="serif" style="margin:12px 0 6px;font-size:24px">Blank, for now</h2><p class="muted">Every mistake you make writes a page here. By exam week this is your single most valuable document.</p><button class="btn primary" style="margin-top:14px" id="bk-go">Go make some mistakes ▸</button></div>')
  );
  U.$$('.gb-head', v).forEach(function(h){
    h.addEventListener('click', function(){ h.parentElement.classList.toggle('open'); });
  });
  U.$$('[data-drill]', v).forEach(function(b){ b.addEventListener('click', function(ev){ ev.stopPropagation(); FCE.practice.start({mode:'smart', tag:b.dataset.drill}); }); });
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
    '<div class="h-page">Awards</div>'+
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
    '<p class="sub">Everything lives in this browser. Export a backup before changing devices.</p>'+
    '<div class="card" style="margin-bottom:16px"><h3>Profile</h3>'+
      '<div class="grid g2">'+
      '<div><label class="tiny lab">NAME</label><input class="ans-input slim" id="set-name" value="'+U.esc(st.name)+'"></div>'+
      '<div><label class="tiny lab">EXAM DATE</label><input class="ans-input slim" id="set-date" type="date" value="'+U.esc(st.examDate)+'"></div>'+
      '<div><label class="tiny lab">DAILY GOAL (QUESTIONS)</label><input class="ans-input slim" id="set-goal" type="number" min="5" max="100" value="'+(st.settings.dailyGoal||20)+'"></div>'+
      '<div><label class="tiny lab">PHONE MODE</label><select class="ans-input slim" id="set-lite">'+
        '<option value="auto"'+(st.settings.lite==='auto'?' selected':'')+'>Auto (simple app on small screens)</option>'+
        '<option value="on"'+(st.settings.lite==='on'?' selected':'')+'>Always simple</option>'+
        '<option value="off"'+(st.settings.lite==='off'?' selected':'')+'>Always full</option>'+
      '</select></div>'+
      '</div>'+
      '<button class="btn primary" style="margin-top:14px" id="set-save">Save</button></div>'+
    '<div class="card" style="margin-bottom:16px"><h3>The engine</h3>'+
      '<p class="muted" style="margin-bottom:12px">Curious why this app feels like it reads your mind? See exactly how the adaptive engine works — ratings, forgetting curves, behavioural tells, error diagnosis.</p>'+
      '<button class="btn" id="set-how">ⓘ How the engine works</button>'+
      (st.reports.length?'<p class="tiny" style="margin-top:12px">You have reported '+st.reports.length+' answer dispute'+(st.reports.length>1?'s':'')+' — they’re stored in your backup file and your answers are now accepted for those items.</p>':'')+
    '</div>'+
    '<div class="card" style="margin-bottom:16px"><h3>Backup</h3>'+
      '<div class="row wrap">'+
      '<button class="btn" id="set-export">⬇ Export progress</button>'+
      '<button class="btn" id="set-import">⬆ Import progress</button>'+
      '<input type="file" id="set-file" accept=".json,application/json" style="display:none">'+
      '</div></div>'+
    '<div class="card"><h3>Danger zone</h3>'+
      '<button class="btn danger" id="set-reset">Reset all progress</button></div>'
  );
  U.$('#set-save', v).addEventListener('click', function(){
    st.name = U.$('#set-name', v).value.trim() || st.name;
    st.examDate = U.$('#set-date', v).value;
    st.settings.dailyGoal = Math.max(5, Math.min(100, +U.$('#set-goal', v).value || 20));
    st.settings.lite = U.$('#set-lite', v).value;
    U.liteOverride = null;
    eng.save(); FCE.app.buildNav(); U.toast('Saved ✓'); U.go('dash');
  });
  U.$('#set-how', v).addEventListener('click', U.howModal);
  U.$('#set-export', v).addEventListener('click', function(){
    var blob = new Blob([eng.export()], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mastery-fce-progress.json';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
  });
  U.$('#set-import', v).addEventListener('click', function(){ U.$('#set-file', v).click(); });
  U.$('#set-file', v).addEventListener('change', function(ev){
    var f = ev.target.files[0]; if(!f) return;
    var r = new FileReader();
    r.onload = function(){
      try{ eng.import(r.result); U.toast('Progress imported ✓'); U.go('dash'); }
      catch(e){ U.toast('⚠️ Not a valid Mastery backup file.'); }
    };
    r.readAsText(f);
  });
  U.$('#set-reset', v).addEventListener('click', function(){
    var m = U.modal('<h3 class="serif" style="margin-bottom:10px;font-size:19px">Reset everything?</h3><p class="muted" style="margin-bottom:16px">Mastery map, mistake history, grammar book, badges — all gone from this browser.</p><div class="row"><button class="btn danger" id="rz-yes">Yes, wipe it</button><button class="btn" id="rz-no">Cancel</button></div>');
    U.$('#rz-yes', m).addEventListener('click', function(){ eng.reset(); m.remove(); location.reload(); });
    U.$('#rz-no', m).addEventListener('click', function(){ m.remove(); });
  });
  return v;
};

return U;
})();
