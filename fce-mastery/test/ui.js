/* Browser walk-through of the built single file (Playwright). */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const file = 'file://' + path.resolve(__dirname, '../../dist/Mastery-FCE.html');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 880 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  require('fs').mkdirSync(path.join(__dirname, 'shots'), { recursive: true });
  const shot = n => page.screenshot({ path: path.join(__dirname, 'shots', n + '.png') });

  await page.goto(file);
  await page.waitForTimeout(700);
  await shot('01-onboarding');

  await page.fill('#ob-name', 'Felix');
  const exam = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
  await page.fill('#ob-date', exam);
  await page.click('#ob-go');
  await page.waitForSelector('.q-card');
  await shot('02-question');

  // 14 diagnostic questions — confidence now OPTIONAL; use Enter key on some
  for (let i = 0; i < 14; i++) {
    await page.waitForSelector('.q-card');
    const opt = await page.$('.opt');
    if (opt) {
      await opt.click();
      await page.click('#q-check');
    } else {
      const isKwt = await page.$('#wc');
      await page.fill('#ans', isKwt ? 'would not have got' : 'on');
      if (i % 2 === 0) await page.keyboard.press('Enter');   // Enter submits
      else await page.click('#q-check');
    }
    await page.waitForSelector('#q-next');
    if (i === 0) {
      const want = await page.$('#fb-want');
      if (want) await want.click();
      await shot('03-feedback');
    }
    if (i === 2) { await page.keyboard.press('Enter'); }     // Enter advances
    else await page.click('#q-next');
    await page.waitForTimeout(110);
  }
  await page.waitForSelector('.session-done');
  await shot('04-summary');
  await page.click('#ss-dash');
  await page.waitForSelector('.grade-card');
  await page.waitForTimeout(600);
  await shot('05-dashboard');

  // pause flow in a quick session
  await page.click('.nav-btn[data-v="practice"]');
  await page.waitForSelector('[data-m="smart"]');
  await shot('06-practice-hub');
  await page.click('[data-m="smart"]');
  await page.waitForSelector('.q-card');
  await page.click('#q-pause');
  await page.waitForSelector('.modal-back');
  await shot('07-paused');
  await page.click('#pz-go');
  // "I don't know" flow
  await page.click('#q-idk');
  await page.waitForSelector('#q-next');
  await shot('08-idk-feedback');
  await page.click('#q-quit');
  await page.waitForTimeout(300);

  // progress tabs
  await page.click('.nav-btn[data-v="progress"]');
  await page.waitForSelector('.tabs');
  await shot('09-progress-overview');
  await page.click('[data-tab="habits"]');
  await page.waitForTimeout(300);
  await shot('10-progress-habits');
  await page.click('[data-tab="words"]');
  await page.waitForTimeout(300);
  await shot('11-progress-words');

  // coach (emergency on — exam in 5 days) & book
  await page.click('.nav-btn[data-v="coach"]');
  await page.waitForTimeout(300);
  await shot('12-coach');
  await page.click('.nav-btn[data-v="book"]');
  await page.waitForTimeout(300);
  await shot('13-book');

  // word forge — memorize mode hides the input for ~3s (look-cover-write)
  await page.click('.nav-btn[data-v="practice"]');
  await page.waitForSelector('#gym-go');
  await page.click('#gym-go');
  await page.waitForSelector('#f-word, .tile-row');
  await shot('14-forge-look');
  await page.waitForSelector('#g-ans', { state: 'visible', timeout: 8000 });
  await shot('14b-forge-write');
  await page.fill('#g-ans', 'xyz');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#g-next');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  await page.click('#g-quit');

  // mock
  await page.click('.nav-btn[data-v="mock"]');
  await page.waitForSelector('#mock-start');
  await page.click('#mock-start');
  await page.waitForSelector('#m-submit');
  await shot('15-mock');
  for (const s of await page.$$('select[data-part="p1"]')) await s.selectOption('1');
  for (const i of await page.$$('input[data-part="p2"]')) await i.fill('on');
  for (const i of await page.$$('input[data-part="p3"]')) await i.fill('test');
  for (const i of await page.$$('input[data-part="p4"]')) await i.fill('was put off');
  await page.click('#m-submit');
  await page.waitForSelector('.mock-result-score');
  await shot('16-mock-results');
  await page.click('#mk-dash');
  await page.waitForSelector('.grade-card');

  // settings + how-it-works
  await page.click('.nav-btn[data-v="settings"]');
  await page.waitForSelector('#set-how');
  await page.click('#set-how');
  await page.waitForTimeout(300);
  await shot('17-how-it-works');

  // persistence
  await page.reload();
  await page.waitForSelector('.grade-card');
  const greet = await page.textContent('.greet');

  // ---- mobile lite mode (fresh context, small viewport) ----
  const mob = await browser.newPage({ viewport: { width: 390, height: 800 } });
  mob.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await mob.goto(file);
  await mob.waitForTimeout(500);
  await mob.fill('#ob-name', 'Felix');
  await mob.click('#ob-skip');
  await mob.waitForSelector('.lite-home');
  await mob.waitForTimeout(400);
  await mob.screenshot({ path: path.join(__dirname, 'shots', '18-mobile-lite.png') });
  await mob.click('[data-m="smart"]');
  await mob.waitForSelector('.q-card');
  await mob.screenshot({ path: path.join(__dirname, 'shots', '19-mobile-question.png') });

  console.log('Dashboard greet after reload:', (greet || '').trim());
  console.log('JS errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error('UI TEST CRASH:', e.message); process.exit(1); });
