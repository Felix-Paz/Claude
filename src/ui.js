// ============================================================
// UI.JS — DOM chrome: intake, critique panel, chat, verdict,
// ticker, pips, toasts, key modal. The 2D face of the machine.
// ============================================================

import { TIQUES, TICKER_LINES, GRADES, SAMPLE_STORY, CHAT_THINKING, MODES } from './copy.js';

const $ = (id) => document.getElementById(id);

export function initUI(handlers) {
  const els = {
    hud: $('hud'), title: $('title-overlay'), enter: $('enter-btn'),
    intake: $('intake-panel'), story: $('story-input'), file: $('file-input'),
    sample: $('sample-btn'), charCount: $('char-count'),
    feedCover: $('feed-cover'), feedBtn: $('feed-btn'), modeRow: $('mode-row'),
    panel: $('critique-panel'), cpRoom: $('cp-room'), cpName: $('cp-name'), cpRole: $('cp-role'),
    cpStatus: $('cp-status'), cpOneliner: $('cp-oneliner'), cpCritique: $('cp-critique'),
    cpTips: $('cp-tips'), cpTipsList: $('cp-tips-list'), cpScore: $('cp-score'),
    gaugeNeedle: $('gauge-needle'), gaugeArc: $('gauge-arc'),
    chatLog: $('chat-log'), chatForm: $('chat-form'), chatInput: $('chat-input'),
    advance: $('advance-btn'),
    verdict: $('verdict-overlay'), verdictScore: $('verdict-score'), verdictGrade: $('verdict-grade'),
    verdictRooms: $('verdict-rooms'), verdictQuote: $('verdict-quote'), verdictStamp: $('verdict-stamp'),
    report: $('report-btn'), restart: $('restart-btn'),
    ticker: $('ticker'), pips: $('progress-pips'), progressRail: $('progress-rail'),
    skip: $('skip-btn'), letterbox: $('letterbox'), toast: $('toast'),
    engineBadge: $('engine-badge'), engineLabel: $('engine-label'), audioBtn: $('audio-btn'),
    keyModal: $('key-modal'), keyInput: $('key-input'), keySave: $('key-save'),
    keyClear: $('key-clear'), keyClose: $('key-close'),
  };

  let mode = 'draft';
  let typing = null;

  // ---------------- title ----------------
  els.enter.addEventListener('click', () => handlers.onEnter());

  // ---------------- intake ----------------
  const refreshCount = () => {
    const words = els.story.value.trim() ? els.story.value.trim().split(/\s+/).length : 0;
    els.charCount.textContent = `${words} WORDS`;
    els.feedBtn.disabled = words < 10;
    els.charCount.style.color = words >= 10 ? '#3df58c' : '#8d80b5';
  };
  els.story.addEventListener('input', refreshCount);

  els.modeRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.mode-btn');
    if (!btn) return;
    els.modeRow.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    mode = btn.dataset.mode;
    handlers.onUiClick?.();
  });

  els.file.addEventListener('change', async () => {
    const f = els.file.files?.[0];
    if (!f) return;
    els.story.value = (await f.text()).slice(0, 200000);
    refreshCount();
    toast('TEXT LOADED. THE FUNNEL SALIVATES.');
  });

  els.sample.addEventListener('click', () => {
    els.story.value = SAMPLE_STORY;
    refreshCount();
    toast('EMERGENCY SAMPLE DEPLOYED. IT INVOLVES A CAT.');
  });

  els.feedCover.addEventListener('click', () => {
    els.feedCover.classList.add('open');
    handlers.onUiClick?.();
    toast('SAFETY COVER LIFTED. NO GOING BACK. (THERE IS, BUT DRAMATICALLY.)');
  });

  els.feedBtn.addEventListener('click', () => {
    if (els.feedBtn.disabled) return;
    handlers.onFeed(els.story.value.trim(), mode);
  });

  // ---------------- critique panel ----------------
  els.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = els.chatInput.value.trim();
    if (!q) return;
    els.chatInput.value = '';
    handlers.onChat(q);
  });

  els.advance.addEventListener('click', () => {
    if (els.advance.disabled) return;
    handlers.onAdvance();
  });

  // click critique to finish typing instantly
  els.cpCritique.addEventListener('click', () => typing?.skip());

  // ---------------- verdict ----------------
  els.restart.addEventListener('click', () => handlers.onRestart());
  els.report.addEventListener('click', () => handlers.onReport());

  // ---------------- hud ----------------
  els.skip.addEventListener('click', () => handlers.onSkip());
  els.audioBtn.addEventListener('click', () => {
    const m = handlers.onToggleAudio();
    els.audioBtn.textContent = m ? '🔇' : '🔊';
  });
  els.engineBadge.addEventListener('click', () => {
    els.keyModal.classList.remove('hidden');
  });
  els.keySave.addEventListener('click', () => {
    handlers.onSetKey(els.keyInput.value.trim());
    els.keyModal.classList.add('hidden');
  });
  els.keyClear.addEventListener('click', () => {
    els.keyInput.value = '';
    handlers.onSetKey('');
    els.keyModal.classList.add('hidden');
  });
  els.keyClose.addEventListener('click', () => els.keyModal.classList.add('hidden'));

  // ticker rotation
  let tickerIdx = 0;
  els.ticker.addEventListener('animationiteration', () => {
    tickerIdx = (tickerIdx + 1) % TICKER_LINES.length;
    els.ticker.textContent = TICKER_LINES[tickerIdx];
  });

  // progress pips
  els.pips.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const pip = document.createElement('div');
    pip.className = 'pip';
    pip.textContent = i < 7 ? String(i + 1) : '★';
    pip.title = i < 7 ? TIQUES[i].name : 'FINAL VERDICT';
    els.pips.appendChild(pip);
  }

  // ---------------- typing effect ----------------
  function typeText(el, text, cps = 150) {
    typing?.skip();
    el.textContent = '';
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.textContent = ' ';
    el.appendChild(caret);
    let i = 0;
    let done;
    const promise = new Promise((r) => { done = r; });
    const step = setInterval(() => {
      i = Math.min(text.length, i + Math.max(1, Math.round(cps / 30)));
      el.textContent = text.slice(0, i);
      el.appendChild(caret);
      if (i >= text.length) finish();
    }, 33);
    function finish() {
      clearInterval(step);
      el.textContent = text;
      typing = null;
      done();
    }
    typing = { promise, skip: finish };
    return typing;
  }

  // ---------------- public api ----------------
  let toastTimer = null;
  function toast(msg, ms = 3200) {
    els.toast.textContent = msg;
    els.toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.add('hidden'), ms);
  }

  function setGauge(score) {
    const k = Math.max(0, Math.min(1, score / 10));
    const angle = -80 + k * 160;
    els.gaugeNeedle.setAttribute('transform', `rotate(${angle} 50 55)`);
    els.gaugeArc.style.strokeDashoffset = String(132 * (1 - k));
    const color = score < 4 ? '#ff4757' : score < 6.5 ? '#ff9d1a' : score < 8.5 ? '#ffd23f' : '#3df58c';
    els.gaugeArc.style.stroke = color;
    // count-up
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 1000);
      els.cpScore.textContent = (score * p).toFixed(1);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const api = {
    toast,
    showTitle: (v) => els.title.classList.toggle('hidden', !v),
    showHud: (v) => els.hud.classList.toggle('hidden', !v),
    showIntake(v) {
      els.intake.classList.toggle('hidden', !v);
      if (v) { els.feedCover.classList.remove('open'); refreshCount(); }
    },
    showProgress: (v) => els.progressRail.classList.toggle('hidden', !v),
    showSkip: (v) => els.skip.classList.toggle('hidden', !v),
    letterbox(v) {
      els.letterbox.classList.toggle('hidden', !v);
      els.letterbox.classList.toggle('on', v);
    },

    setPip(i, state) { // state: 'now' | 'done' | ''
      const pip = els.pips.children[i];
      if (!pip) return;
      pip.classList.remove('now', 'done');
      if (state) pip.classList.add(state);
    },

    showPanel(idx) {
      const t = TIQUES[idx];
      els.panel.classList.remove('hidden');
      els.cpRoom.textContent = t.room;
      els.cpName.textContent = t.name;
      els.cpRole.textContent = t.role;
      els.cpStatus.textContent = `PROCESSING… ${t.waiting}`;
      els.cpStatus.classList.remove('hidden');
      els.cpOneliner.classList.add('hidden');
      els.cpTips.classList.add('hidden');
      els.cpCritique.textContent = '';
      els.cpScore.textContent = '–';
      els.gaugeNeedle.setAttribute('transform', 'rotate(-80 50 55)');
      els.gaugeArc.style.strokeDashoffset = '132';
      els.chatLog.innerHTML = '';
      els.advance.disabled = true;
      els.advance.textContent = t.advanceLabel;
      els.panel.scrollTop = 0;
    },

    hidePanel() { els.panel.classList.add('hidden'); },

    async setResult(idx, result) {
      els.cpStatus.classList.add('hidden');
      setGauge(result.score);
      els.cpOneliner.textContent = `“${result.oneLiner}”`;
      els.cpOneliner.classList.remove('hidden');
      els.advance.disabled = false;
      const t = typeText(els.cpCritique, result.critique, 220);
      await t.promise;
      if (result.tips?.length) {
        els.cpTipsList.innerHTML = '';
        for (const tip of result.tips) {
          const li = document.createElement('li');
          li.textContent = tip;
          els.cpTipsList.appendChild(li);
        }
        els.cpTips.classList.remove('hidden');
      }
      if (result.fellBack) {
        toast('CLAUDE CORE HICCUPED — LOCAL GEARS COVERED THIS ROOM.');
      }
    },

    addChat(who, text) {
      const div = document.createElement('div');
      div.className = `chat-msg ${who}`;
      if (who === 'tique') {
        const b = document.createElement('b');
        b.textContent = els.cpName.textContent;
        div.appendChild(b);
        div.appendChild(document.createTextNode(text));
      } else {
        div.textContent = text;
      }
      els.chatLog.appendChild(div);
      els.chatLog.scrollTop = els.chatLog.scrollHeight;
      return div;
    },

    addChatThinking() {
      const div = document.createElement('div');
      div.className = 'chat-msg tique thinking';
      div.textContent = CHAT_THINKING[Math.floor(Math.random() * CHAT_THINKING.length)];
      els.chatLog.appendChild(div);
      els.chatLog.scrollTop = els.chatLog.scrollHeight;
      return div;
    },

    setEngine(engine) {
      const label = { server: 'CLAUDE CORE', browser: 'CLAUDE CORE (YOUR KEY)', local: 'LOCAL GEARS' }[engine] || engine;
      els.engineLabel.textContent = label;
    },

    showVerdict(results, story, mode, engine) {
      const scores = TIQUES.map((t) => results[t.id]?.score ?? 0);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const grade = GRADES.find((g) => avg >= g.min) || GRADES[GRADES.length - 1];

      els.verdict.classList.remove('hidden');
      els.verdictGrade.textContent = grade.grade;
      els.verdictStamp.textContent = grade.stamp;
      els.verdictQuote.textContent = `“${grade.quote}”`;
      els.verdictRooms.innerHTML = '';
      TIQUES.forEach((t) => {
        const r = results[t.id];
        const item = document.createElement('div');
        item.className = 'vr-item';
        item.innerHTML = `<div class="vr-name">${t.name}</div><div class="vr-score">${r.score.toFixed(1)}<small>/10</small></div><div class="vr-bar"><i style="width:0%; background:${t.accent}"></i></div>`;
        els.verdictRooms.appendChild(item);
        requestAnimationFrame(() => {
          item.querySelector('i').style.width = `${r.score * 10}%`;
        });
      });
      // count up the big number
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 1600);
        els.verdictScore.textContent = (avg * p).toFixed(1);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return avg;
    },

    hideVerdict() { els.verdict.classList.add('hidden'); },

    buildReport(results, story, mode, engine) {
      const scores = TIQUES.map((t) => results[t.id]?.score ?? 0);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const grade = GRADES.find((g) => avg >= g.min) || GRADES[GRADES.length - 1];
      const lines = [
        '══════════════════════════════════════════════',
        '   TIQUE™ — THE CRITIQUE FACTORY',
        '   OFFICIAL INSPECTION REPORT · FORM 27-B',
        '══════════════════════════════════════════════',
        '',
        `SUBMISSION CLASS : ${MODES[mode].label}`,
        `COGITATION CORE  : ${engine === 'local' ? 'LOCAL GEARS' : 'CLAUDE CORE (claude-opus-4-8)'}`,
        `DATE             : ${new Date().toISOString().slice(0, 10)}`,
        `WORD COUNT       : ${story.trim().split(/\s+/).length}`,
        '',
        `FINAL SCORE      : ${avg.toFixed(1)} / 10`,
        `${grade.grade}`,
        `VERDICT: ${grade.quote}`,
        '',
      ];
      TIQUES.forEach((t) => {
        const r = results[t.id];
        lines.push('──────────────────────────────────────────────');
        lines.push(`${t.room} — ${t.name}  [${r.score.toFixed(1)}/10]`);
        lines.push(`${t.role}`);
        lines.push('');
        lines.push(`REMARK: ${r.oneLiner}`);
        lines.push('');
        lines.push(r.critique);
        if (r.tips?.length) {
          lines.push('');
          lines.push('MAINTENANCE SUGGESTIONS:');
          r.tips.forEach((tip) => lines.push(` 🔧 ${tip}`));
        }
        lines.push('');
      });
      lines.push('══════════════════════════════════════════════');
      lines.push('This certificate is legally meaningless in all');
      lines.push('jurisdictions, including imaginary ones.');
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'TIQUE-inspection-report.txt';
      a.click();
      URL.revokeObjectURL(a.href);
    },
  };

  return api;
}
