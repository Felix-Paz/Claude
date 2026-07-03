/* ════════════════════════════════════════════════════════════════════════
   MOTH · UI
   ────────────────────────────────────────────────────────────────────────
   Every screen is set like a page from a field guide: overline in small
   caps, display lines in italic serif, dotted leaders, hairline rules.
   The DOM is the paper; the canvas behind it is the night.
   ════════════════════════════════════════════════════════════════════ */
'use strict';

(() => {
  const E = window.ENGINE, SC = window.SCENE;
  const S = E.save;
  const $ = s => document.querySelector(s);

  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const fmt = n => n.toLocaleString('en-US');

  let root, hud, toastBox;
  let dwellStart = 0;   // for drawer/notes dwell telemetry

  /* ── tiny DOM helpers ──────────────────────────────────────────────── */
  const div = (cls, html) => { const d = document.createElement('div'); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; };
  const clear = () => { root.innerHTML = ''; };
  const screen = (cls, html) => { const s = div('scr ui-block ' + cls, html); root.appendChild(s); requestAnimationFrame(() => s.classList.add('in')); return s; };

  /* ── moth mark (SVG) used across screens ───────────────────────────── */
  const mothSVG = (fill, size = 46) => `
    <svg viewBox="0 0 48 48" width="${size}" height="${size}" fill="${fill}" aria-hidden="true">
      <path d="M24 14 C18 4 6 4 4 12 C2 19 12 26 22 25 L24 22 Z"/>
      <path d="M24 14 C30 4 42 4 44 12 C46 19 36 26 26 25 L24 22 Z"/>
      <path d="M23 24 C15 26 10 33 13 38 C16 42 22 37 24 31 Z"/>
      <path d="M25 24 C33 26 38 33 35 38 C32 42 26 37 24 31 Z"/>
      <ellipse cx="24" cy="24" rx="2.1" ry="7"/>
      <path d="M24 16 L20 9 M24 16 L28 9" stroke="${fill}" stroke-width="1.4" fill="none"/>
    </svg>`;

  /* ── toasts ────────────────────────────────────────────────────────── */
  const toast = (msg, cls = '') => {
    const t = div('toast ' + cls, msg);
    toastBox.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 500); }, 3400);
  };

  const celebrateUnlocks = () => {
    for (const u of E.progress.sweepUnlocks()) {
      toast(`<em>New ${u.cat} pinned to the drawer:</em> ${u.item.name}`, 'gold');
    }
  };
  const celebrateLevels = ups => {
    for (const l of ups) {
      toast(`<em>You have grown.</em> ${E.progress.levelName(l)}`, 'gold');
      celebrateUnlocks();
    }
  };

  /* ── HUD ───────────────────────────────────────────────────────────── */
  const buildHud = () => {
    hud = div('hud', `
      <div class="hud-hour">
        <span class="overline">hour</span>
        <span class="hud-hour-n">I</span>
        <span class="overline dim">of six</span>
      </div>
      <div class="hud-pot">
        <span class="hud-pot-n">0</span><span class="hud-pot-unit">℘</span>
        <div class="hud-mult">×1.0</div>
        <div class="hud-heat"><i></i></div>
      </div>
      <div class="hud-dash"><i></i><span class="overline dim">dash</span></div>
    `);
    hud.style.display = 'none';
    document.body.appendChild(hud);
  };
  const hudRefs = {};
  const updateHud = h => {
    if (!hudRefs.hour) {
      hudRefs.hour = hud.querySelector('.hud-hour-n');
      hudRefs.pot = hud.querySelector('.hud-pot-n');
      hudRefs.mult = hud.querySelector('.hud-mult');
      hudRefs.heat = hud.querySelector('.hud-heat i');
      hudRefs.dash = hud.querySelector('.hud-dash i');
    }
    if (hudRefs.hour.textContent !== h.hour) hudRefs.hour.textContent = h.hour;
    const potTxt = fmt(h.pot);
    if (hudRefs.pot.textContent !== potTxt) hudRefs.pot.textContent = potTxt;
    hudRefs.mult.textContent = '×' + h.mult.toFixed(1);
    hudRefs.mult.style.opacity = 0.45 + h.heat * 0.55;
    hudRefs.heat.style.transform = `scaleX(${h.heat})`;
    hudRefs.dash.style.transform = `scaleX(${1 - h.dashCd})`;
  };

  /* ── title ─────────────────────────────────────────────────────────── */
  const showTitle = () => {
    clear();
    document.body.classList.remove('playing');
    hud.style.display = 'none';

    const lvl = E.progress.level();
    const xpPct = Math.round(E.progress.xpInto() / E.progress.xpNext() * 100);
    const next = E.progress.nextUnlock();
    const forecast = E.hooks.ensureForecast();
    const boon = S.dayBoon ? `<div class="chip chip-boon">tonight — ${boonLabel(S.dayBoon.id)}</div>` : '';

    const s = screen('title', `
      <div class="plate">
        <div class="overline">nocturne · field guide — plate i</div>
        <h1 class="display">MOTH</h1>
        <div class="subtitle">a nocturne in six hours</div>
        <div class="title-mark">${mothSVG('var(--paper)', 54)}</div>

        <button class="btn primary" id="begin">Begin the night</button>
        <div class="title-row">
          <button class="btn ghost" id="drawer">The Drawer</button>
          <button class="btn ghost" id="notes">Field Notes ${questBadge()}</button>
          <button class="btn ghost" id="settings">Apparatus</button>
        </div>

        <div class="title-meta">
          <div class="streak-row">${streakDots()}</div>
          ${boon}
          <div class="chip">tomorrow — ${forecast.label.toLowerCase()}</div>
          ${next ? `<div class="chip chip-next">next: ${next.what} · ${next.need}</div>` : ''}
        </div>

        <div class="title-foot">
          <div class="xp">
            <span class="overline">${E.progress.levelName(lvl)}</span>
            <div class="bar"><i style="width:${xpPct}%"></i></div>
          </div>
          <div class="purse">
            <span>${fmt(S.lumen)} <em>℘</em></span>
            <span class="dust">${S.dust} <em>dust</em></span>
          </div>
        </div>
        <div class="colophon">fig. 0 — the reader is the specimen</div>
      </div>
    `);

    s.querySelector('#begin').onclick = beginNight;
    s.querySelector('#drawer').onclick = showDrawer;
    s.querySelector('#notes').onclick = showNotes;
    s.querySelector('#settings').onclick = showSettings;
  };

  const questBadge = () => {
    const n = E.quests.list().filter(q => q.done && !q.claimed).length;
    return n ? `<b class="badge">${n}</b>` : '';
  };

  const streakDots = () => {
    const hist = new Set(S.streak.history);
    const cells = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = E.utils.dayKey(d);
      cells.push(`<i class="${hist.has(k) ? 'lit' : ''}" title="${k}"></i>`);
    }
    return `<span class="overline dim">nights</span> ${cells.join('')} <b>${S.streak.count}</b>
      ${S.streak.freezes ? `<span class="freeze" title="amber drops preserve missed nights">amber ×${S.streak.freezes}</span>` : ''}`;
  };

  const boonLabel = id => ({
    gilded: 'gilded odds on every card',
    golden: 'a golden hour of wisps',
    spare:  'one extra fate card per flight',
  }[id] || id);

  /* ── the night begins ──────────────────────────────────────────────── */
  const beginNight = () => {
    clear();
    document.body.classList.add('playing');
    hud.style.display = '';
    SC.startRun();
    if (S.flags.ftue) runHints();
  };

  const runHints = () => {
    const lines = [
      'You are the moth. The pointer is your desire.',
      'Graze the flame — close, but not too close — to raise your multiplier.',
      'Motes become lumen. Lumen becomes everything else.',
      'Click to dash. The flame forgives a dash.',
    ];
    lines.forEach((l, i) => setTimeout(() => toast(`<em>${l}</em>`), 900 + i * 3600));
  };

  /* ── the gate: stay or fly home ────────────────────────────────────── */
  let gateTimer = null;
  const showGate = g => {
    const odds = Math.round(g.odds * 100);
    const s = screen('gate', `
      <div class="plate small">
        <div class="overline">the clock strikes</div>
        <div class="display gate-hour">${ROMAN[g.hour - 1]}</div>
        <div class="gate-pot">unbanked <b>${fmt(g.pot)} ℘</b></div>
        <div class="gate-odds">the engine gives you <b>${odds}%</b> for hour ${g.nextHour}</div>
        <div class="gate-btns">
          <button class="btn primary" id="stay">Stay <span class="sub">the night deepens · richer motes</span></button>
          <button class="btn" id="home">Fly home <span class="sub">bank all ${fmt(g.pot)} ℘</span></button>
        </div>
        <div class="gate-ring"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" pathLength="100"/></svg><span id="gate-count">6</span></div>
        <div class="footnote">* burned moths keep two-fifths of the pot</div>
      </div>
    `);
    const ring = s.querySelector('circle');
    const count = s.querySelector('#gate-count');
    let left = 6;
    ring.style.strokeDasharray = '100';
    const t0 = performance.now();
    const tick = () => {
      const el = (performance.now() - t0) / 1000;
      left = Math.max(0, 6 - el);
      ring.style.strokeDashoffset = String(100 - (left / 6) * 100);
      count.textContent = Math.ceil(left);
      if (left <= 0) { resolve('stay'); return; }
      gateTimer = requestAnimationFrame(tick);
    };
    gateTimer = requestAnimationFrame(tick);

    const resolve = choice => {
      if (gateTimer) cancelAnimationFrame(gateTimer), gateTimer = null;
      s.remove();
      SC.resolveGate(choice);
      if (choice === 'home') { document.body.classList.remove('playing'); }
    };
    s.querySelector('#stay').onclick = () => resolve('stay');
    s.querySelector('#home').onclick = () => resolve('home');
  };

  /* ── run summary ───────────────────────────────────────────────────── */
  const showSummary = r => {
    document.body.classList.remove('playing');
    hud.style.display = 'none';
    clear();

    const head = r.dawn ? 'DAWN.' : r.home ? 'Home before dawn.' : `Burned at Hour ${ROMAN[r.hours - 1]}.`;
    const sub = r.dawn ? 'the pot is doubled — the night is beaten'
              : r.home ? 'every mote banked, nothing risked'
              : r.cause === 'flare' ? 'a tongue of flame found you' : 'you touched the heart of it';

    const lvl = E.progress.level();
    const xpPct = Math.round(E.progress.xpInto() / E.progress.xpNext() * 100);

    const s = screen('summary', `
      <div class="plate">
        <div class="overline">${r.dawn ? 'plate vi — the survivor' : 'the flight, recorded'}</div>
        <h2 class="display ${r.dawn ? 'gilt' : ''}">${head}</h2>
        <div class="subtitle">${sub}</div>
        <dl class="ledger">
          <div><dt>pot</dt><dd class="count" data-n="${r.pot}">0</dd></div>
          <div><dt>kept${r.died ? ' (two-fifths)' : r.dawn ? ' (doubled)' : ''}</dt><dd class="count gilt" data-n="${r.kept}">0</dd></div>
          <div><dt>motes gathered</dt><dd class="count" data-n="${r.motes}">0</dd></div>
          <div><dt>seconds in the graze</dt><dd class="count" data-n="${r.grazeSec}">0</dd></div>
          <div><dt>best multiplier</dt><dd>×${r.bestMult.toFixed(1)}</dd></div>
          ${r.kept >= S.best.pot && r.kept > 0 ? '<div><dt>a personal record</dt><dd class="gilt">✳</dd></div>' : ''}
        </dl>
        <div class="xp wide">
          <span class="overline">${E.progress.levelName(lvl)}</span>
          <div class="bar"><i style="width:${xpPct}%"></i></div>
        </div>
        <div class="sum-btns">
          ${r.cards > 0 ? `<button class="btn primary" id="cards">Turn your fate cards <b>${r.cards}</b></button>` : ''}
          <button class="btn ${r.cards > 0 ? '' : 'primary'}" id="again">Fly again</button>
          <button class="btn ghost" id="rest">Rest</button>
        </div>
      </div>
    `);

    // animated counters — numbers should be savoured
    s.querySelectorAll('.count').forEach(el => {
      const n = +el.dataset.n; const t0 = performance.now();
      const step = () => {
        const p = Math.min(1, (performance.now() - t0) / 900);
        el.textContent = fmt(Math.round(n * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });

    celebrateLevels(r.levelUps);
    celebrateUnlocks();

    const cardsBtn = s.querySelector('#cards');
    if (cardsBtn) cardsBtn.onclick = () => showCards(r.cards);
    s.querySelector('#again').onclick = beginNight;
    s.querySelector('#rest').onclick = () => maybeRest(true);
  };

  /* ── fate cards ────────────────────────────────────────────────────── */
  const RARITY_LABEL = { common: 'common', uncommon: 'uncommon', rare: 'rare ✳', mythic: 'MYTHIC ✳✳' };

  const showCards = totalPicks => {
    let remaining = totalPicks;
    const round = () => {
      clear();
      const set = E.rewards.drawSet(3);
      const t0 = performance.now();
      let picked = false;

      const s = screen('cards', `
        <div class="plate">
          <div class="overline">plate xiv — the fates · ${remaining} ${remaining === 1 ? 'turn' : 'turns'} left</div>
          <h2 class="display">Choose one.</h2>
          <div class="card-row">
            ${set.map((c, i) => `
              <div class="fate" data-i="${i}">
                <div class="fate-inner">
                  <div class="fate-back">${mothSVG('var(--paper)', 40)}<span class="overline">moth</span></div>
                  <div class="fate-face r-${c.rarity}">
                    <span class="overline">${RARITY_LABEL[c.rarity]}</span>
                    <b>${c.label}</b>
                    <span class="fate-desc">${c.desc || (c.kind === 'lumen' ? fmt(c.amount) + ' ℘' : c.kind === 'xp' ? c.amount + ' xp' : '')}</span>
                  </div>
                </div>
              </div>`).join('')}
          </div>
          <div class="card-foot"><button class="btn primary" id="next" style="visibility:hidden">·</button></div>
        </div>
      `);

      s.querySelectorAll('.fate').forEach(card => {
        card.onclick = () => {
          if (picked) return;
          picked = true;
          const i = +card.dataset.i, c = set[i];
          SC.audio.flip();
          card.classList.add('flip', 'chosen');
          E.emit('cards:pick', { rarity: c.rarity, dwellMs: performance.now() - t0 });
          const before = E.progress.level();
          E.rewards.redeem(c);
          celebrateLevels(Array.from({ length: E.progress.level() - before }, (_, k) => before + 1 + k));
          celebrateUnlocks();
          if (c.rarity === 'rare') toast('<em>Rare.</em> The pin gleams.', 'gold');
          if (c.rarity === 'mythic') toast('<em>MYTHIC.</em> The drawer will remember this.', 'gold');
          // honest near-miss: show what the other cards really were
          setTimeout(() => {
            s.querySelectorAll('.fate').forEach(o => { if (o !== card) o.classList.add('flip', 'dimmed'); });
            const btn = s.querySelector('#next');
            btn.style.visibility = 'visible';
            btn.textContent = remaining > 1 ? 'Next turn' : 'Continue';
            btn.onclick = () => {
              remaining--;
              if (remaining > 0) round();
              else if (!maybeRest(false)) afterCards();
            };
          }, 650);
        };
      });
    };
    round();
  };

  const afterCards = () => {
    clear();
    const s = screen('after', `
      <div class="plate small">
        <div class="overline">the night is young</div>
        <h2 class="display">Again?</h2>
        <div class="sum-btns">
          <button class="btn primary" id="again">Fly again</button>
          <button class="btn ghost" id="drawer">The Drawer</button>
          <button class="btn ghost" id="notes">Field Notes ${questBadge()}</button>
          <button class="btn ghost" id="title">Rest</button>
        </div>
      </div>
    `);
    s.querySelector('#again').onclick = beginNight;
    s.querySelector('#drawer').onclick = showDrawer;
    s.querySelector('#notes').onclick = showNotes;
    s.querySelector('#title').onclick = () => maybeRest(true);
  };

  /* ── the graceful exit (peak-end + tomorrow's hook) ────────────────── */
  const maybeRest = force => {
    if (!force && !E.hooks.shouldOfferRest()) return false;
    E.hooks.restOffered();
    const forecast = E.hooks.ensureForecast();
    clear();
    const s = screen('rest', `
      <div class="plate small">
        <div class="overline">the engine suggests</div>
        <h2 class="display">A fine place to rest.</h2>
        <div class="subtitle">the lamp will keep. tomorrow it burns brighter:</div>
        <div class="chip chip-boon big">${forecast.label.toLowerCase()}</div>
        <div class="rest-streak">${streakDots()}</div>
        <div class="sum-btns">
          <button class="btn primary" id="sleep">Goodnight</button>
          <button class="btn ghost" id="one-more">One more flight</button>
        </div>
        <div class="footnote">* streaks are preserved by playing tomorrow — or by amber</div>
      </div>
    `);
    s.querySelector('#sleep').onclick = showTitle;
    s.querySelector('#one-more').onclick = beginNight;
    return true;
  };

  /* ── the drawer: specimens in captivity ────────────────────────────── */
  const showDrawer = () => {
    clear();
    dwellStart = performance.now();
    const lvl = E.progress.level();

    const inkCell = ink => {
      const owned = S.inks.owned.includes(ink.id);
      const worn = S.inks.active === ink.id;
      const u = ink.unlock;
      let footer;
      if (worn) footer = `<span class="worn">worn tonight</span>`;
      else if (owned) footer = `<button class="btn tiny" data-wear="${ink.id}">wear</button>`;
      else if (u.type === 'lumen') footer = `<button class="btn tiny ${S.lumen >= u.v ? '' : 'off'}" data-buy="${ink.id}">${fmt(u.v)} ℘</button>`;
      else footer = `<span class="locked">${u.type === 'level' ? `instar ${u.v}` : u.type === 'dawn' ? 'reach the dawn' : 'draw a mythic'}</span>`;
      return `
        <div class="spec ${owned ? '' : 'ghost-spec'}" style="${owned ? `--sbg:${ink.bg};--sink:${ink.paper};--sfl:${ink.flame}` : ''}">
          <i class="pin"></i>
          <div class="spec-moth">${mothSVG(owned ? ink.paper : 'rgba(140,140,150,.35)', 44)}</div>
          <b>${ink.name}</b>
          <em>${ink.latin}</em>
          ${footer}
        </div>`;
    };

    const trailCell = tr => {
      const owned = S.trails.owned.includes(tr.id);
      const worn = S.trails.active === tr.id;
      const u = tr.unlock;
      let footer;
      if (worn) footer = `<span class="worn">worn</span>`;
      else if (owned) footer = `<button class="btn tiny" data-weartrail="${tr.id}">wear</button>`;
      else if (u.type === 'lumen') footer = `<button class="btn tiny ${S.lumen >= u.v ? '' : 'off'}" data-buytrail="${tr.id}">${fmt(u.v)} ℘</button>`;
      else footer = `<span class="locked">instar ${u.v}</span>`;
      return `<div class="trail-cell ${owned ? '' : 'ghost-spec'}"><b>${tr.name}</b>${footer}</div>`;
    };

    const s = screen('drawer', `
      <div class="plate wide-plate">
        <div class="overline">the drawer — lepidoptera in captivity</div>
        <h2 class="display">Inks.</h2>
        <div class="purse-line">${fmt(S.lumen)} ℘ · ${S.dust} dust · ${E.progress.levelName(lvl)}</div>
        <div class="spec-grid">${E.inks.map(inkCell).join('')}</div>
        <div class="overline rule-top">trails</div>
        <div class="trail-row">${E.trails.map(trailCell).join('')}</div>
        <div class="sum-btns"><button class="btn" id="back">Close the drawer</button></div>
      </div>
    `);

    s.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.wear) {
        S.inks.active = b.dataset.wear; E.persist(true);
        SC.applyInkById(b.dataset.wear);
        E.emit('ink:equip', { id: b.dataset.wear });
        showDrawer();
      } else if (b.dataset.buy) {
        if (E.progress.buy('ink', b.dataset.buy)) { toast('<em>Purchased and pinned.</em>', 'gold'); showDrawer(); }
        else toast('Not enough lumen — the flame provides, nightly.');
      } else if (b.dataset.weartrail) {
        S.trails.active = b.dataset.weartrail; E.persist(true);
        E.emit('ink:equip', { id: b.dataset.weartrail });
        showDrawer();
      } else if (b.dataset.buytrail) {
        if (E.progress.buy('trail', b.dataset.buytrail)) { toast('<em>Purchased.</em>', 'gold'); showDrawer(); }
        else toast('Not enough lumen.');
      }
    });
    s.querySelector('#back').onclick = () => {
      E.emit('drawer:dwell', { ms: performance.now() - dwellStart });
      showTitle();
    };
  };

  /* ── field notes: quests + the model reading you back ──────────────── */
  const showNotes = () => {
    clear();
    dwellStart = performance.now();
    const quests = E.quests.ensureDaily();
    const m = E.model;
    const mv = m.motiv;
    const t = S.totals;

    const questRow = (q, i) => `
      <div class="task ${q.done ? 'done' : ''}">
        <span class="task-label">${q.label}</span>
        <span class="leader"></span>
        ${q.claimed ? '<span class="worn">claimed</span>'
          : q.done ? `<button class="btn tiny" data-claim="${i}">claim ${q.reward.lumen}℘${q.reward.dust ? ' +dust' : ''}</button>`
          : `<span class="task-prog">${Math.floor(q.prog)}/${q.goal}</span>`}
      </div>`;

    // motivation compass: a 4-axis polygon
    const cw = 150, cc = cw / 2, rr = 52;
    const axes = [['mastery', 0], ['fortune', 1], ['order', 2], ['beauty', 3]];
    const pt = (v, i) => {
      const a = -Math.PI / 2 + i * Math.PI / 2;
      return `${cc + Math.cos(a) * rr * (v * 2.6)},${cc + Math.sin(a) * rr * (v * 2.6)}`;
    };
    const poly = axes.map(([k, i]) => pt(Math.min(mv[k], 0.55), i)).join(' ');

    const s = screen('notes', `
      <div class="plate wide-plate">
        <div class="overline">field notes — night of ${E.utils.dayKey()}</div>
        <h2 class="display">The Subject.</h2>
        <div class="notes-cols">
          <div class="notes-col">
            <div class="overline rule-top">tonight's field tasks</div>
            ${quests.map(questRow).join('')}
            <div class="overline rule-top">the reading</div>
            <div class="reading">${m.reading().map(l => `<p>${l}</p>`).join('')}</div>
          </div>
          <div class="notes-col">
            <div class="overline rule-top">motivation, observed</div>
            <div class="compass">
              <svg viewBox="0 0 ${cw} ${cw}">
                <circle cx="${cc}" cy="${cc}" r="${rr}" class="ring"/>
                <circle cx="${cc}" cy="${cc}" r="${rr * 0.5}" class="ring"/>
                <line x1="${cc}" y1="${cc - rr}" x2="${cc}" y2="${cc + rr}" class="ring"/>
                <line x1="${cc - rr}" y1="${cc}" x2="${cc + rr}" y2="${cc}" class="ring"/>
                <polygon points="${poly}" class="blob"/>
              </svg>
              <span class="c-lab n">mastery</span><span class="c-lab e">fortune</span>
              <span class="c-lab s">order</span><span class="c-lab w">beauty</span>
            </div>
            <div class="overline rule-top">flight control</div>
            <canvas id="spark" width="260" height="46"></canvas>
            <div class="dials">
              <div><span class="overline">risk appetite</span><div class="bar"><i style="width:${Math.round(m.risk * 100)}%"></i></div></div>
              <div><span class="overline">observations</span><b>${fmt(E.telemetry.observations)}</b></div>
            </div>
            <div class="overline rule-top">the tally</div>
            <dl class="ledger tight">
              <div><dt>flights</dt><dd>${fmt(t.flights)}</dd></div>
              <div><dt>dawns</dt><dd>${fmt(t.dawns)}</dd></div>
              <div><dt>best pot</dt><dd>${fmt(S.best.pot)} ℘</dd></div>
              <div><dt>seconds grazed</dt><dd>${fmt(t.grazeSec)}</dd></div>
            </dl>
          </div>
        </div>
        <div class="sum-btns"><button class="btn" id="back">Close the notebook</button></div>
        <div class="colophon">the engine watches so the night can fit you</div>
      </div>
    `);

    // skill sparkline
    const sp = s.querySelector('#spark'), sg = sp.getContext('2d');
    const hist = S.model.skillHist.length ? S.model.skillHist : [m.skill];
    sg.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--flame').trim() || '#ffb454';
    sg.lineWidth = 1.6;
    sg.beginPath();
    hist.forEach((v, i) => {
      const x = 6 + (i / Math.max(1, hist.length - 1)) * 248;
      const y = 40 - v * 34;
      i ? sg.lineTo(x, y) : sg.moveTo(x, y);
    });
    if (hist.length === 1) sg.lineTo(254, 40 - hist[0] * 34);
    sg.stroke();

    s.addEventListener('click', ev => {
      const b = ev.target.closest('button[data-claim]'); if (!b) return;
      const res = E.quests.claim(+b.dataset.claim);
      if (res) {
        toast(`<em>Task complete.</em> +${res.reward.lumen}℘${res.reward.dust ? ' +1 dust' : ''}`, 'gold');
        celebrateLevels(res.levelUps);
        celebrateUnlocks();
        showNotes();
      }
    });
    s.querySelector('#back').onclick = () => {
      E.emit('drawer:dwell', { ms: (performance.now() - dwellStart) * 0.5 });
      showTitle();
    };
  };

  /* ── settings ──────────────────────────────────────────────────────── */
  const showSettings = () => {
    clear();
    const s = screen('settings', `
      <div class="plate small">
        <div class="overline">apparatus</div>
        <h2 class="display">Settings.</h2>
        <div class="sum-btns">
          <button class="btn" id="mute">${SC.audio.muted ? 'Unmute the night' : 'Mute the night'}</button>
          <button class="btn ghost" id="wipe">Burn the notebook (reset)</button>
          <button class="btn primary" id="back">Back</button>
        </div>
        <div class="footnote">* your notebook lives only in this browser. nothing leaves the room.</div>
      </div>
    `);
    s.querySelector('#mute').onclick = ev => {
      SC.audio.setMuted(!SC.audio.muted);
      ev.target.textContent = SC.audio.muted ? 'Unmute the night' : 'Mute the night';
    };
    s.querySelector('#wipe').onclick = ev => {
      if (ev.target.dataset.armed) E.wipe();
      else { ev.target.dataset.armed = '1'; ev.target.textContent = 'Really burn it all?'; }
    };
    s.querySelector('#back').onclick = showTitle;
  };

  /* ── daily arrival ─────────────────────────────────────────────────── */
  const showDaily = daily => {
    if (!daily.events.length) return;
    const s = screen('daily', `
      <div class="plate small">
        <div class="overline">night ${daily.streak} — the lamp is lit</div>
        <h2 class="display">Welcome back.</h2>
        <div class="daily-list">
          ${daily.events.map(e => `<div class="daily-ev ev-${e.kind}">${e.label}</div>`).join('')}
        </div>
        <button class="btn primary" id="ok">Take the night</button>
      </div>
    `);
    s.style.zIndex = 60;
    s.querySelector('#ok').onclick = () => s.remove();
  };

  /* ── pause (Esc) ───────────────────────────────────────────────────── */
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (SC.mode() !== 'run') return;
    if (SC.isPaused()) { SC.setPaused(false); $('.pause')?.remove(); }
    else {
      SC.setPaused(true);
      const s = screen('pause', `
        <div class="plate small">
          <div class="overline">the night, suspended</div>
          <h2 class="display">Paused.</h2>
          <div class="sum-btns"><button class="btn primary" id="go">Resume</button></div>
        </div>`);
      s.classList.add('pause');
      s.querySelector('#go').onclick = () => { SC.setPaused(false); s.remove(); };
    }
  });

  /* ── boot ──────────────────────────────────────────────────────────── */
  const boot = () => {
    root = $('#ui');
    toastBox = div('toasts'); document.body.appendChild(toastBox);
    buildHud();

    SC.hooks.onGate = showGate;
    SC.hooks.onRunEnd = showSummary;
    SC.hooks.onHud = updateHud;
    SC.hooks.onToast = m => toast(m);

    SC.init($('#cv'));
    E.hooks.sessionStart();
    E.quests.ensureDaily();
    const daily = E.hooks.dailyCheck();   // before the title, so streak & purse are tonight's
    celebrateUnlocks();
    showTitle();
    showDaily(daily);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
