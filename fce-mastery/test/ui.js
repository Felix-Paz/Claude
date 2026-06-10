/* Browser walk-through of the built single file using Playwright. */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const file = 'file://' + path.resolve(__dirname, '../../dist/FCE-Mastery.html');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const shot = (n) => page.screenshot({ path: path.join(__dirname, 'shots', n + '.png'), fullPage: false });
  require('fs').mkdirSync(path.join(__dirname, 'shots'), { recursive: true });

  await page.goto(file);
  await page.waitForTimeout(400);
  await shot('01-onboarding');

  // onboarding
  await page.fill('#ob-name', 'Felix');
  const exam = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10); // 5 days -> emergency mode
  await page.fill('#ob-date', exam);
  await page.click('#ob-go');
  await page.waitForSelector('.q-card');
  await shot('02-question');

  // answer all 14 diagnostic questions
  for (let i = 0; i < 14; i++) {
    await page.waitForSelector('.q-card .conf');
    const isMcc = await page.$('.opt');
    if (isMcc) {
      await page.click('.opt');
    } else {
      const isKwt = await page.$('#wc');
      await page.fill('#ans', isKwt ? 'would not have got' : 'on');
    }
    await page.click('.conf-row .conf:nth-of-type(2)');
    await page.click('#q-check');
    await page.waitForSelector('#q-next');
    if (i === 0) {
      const cause = await page.$('.cause');
      if (cause) await cause.click();
      await shot('03-feedback');
    }
    await page.click('#q-next');
    await page.waitForTimeout(120);
  }
  await page.waitForSelector('.session-done');
  await shot('04-summary');
  await page.click('#ss-dash');
  await page.waitForSelector('.hero');
  await shot('05-dashboard');

  // stats
  await page.click('.nav-btn[data-v="stats"]');
  await page.waitForSelector('.heat-grid');
  await shot('06-stats');

  // grammar book
  await page.click('.nav-btn[data-v="book"]');
  await page.waitForTimeout(250);
  await shot('07-book');

  // memory lab
  await page.click('.nav-btn[data-v="memory"]');
  await page.waitForTimeout(250);
  const flip = await page.$('[data-flip]');
  if (flip) await flip.click();
  await shot('08-memory');

  // coach (emergency mode should be on — exam in 5 days)
  await page.click('.nav-btn[data-v="coach"]');
  await page.waitForTimeout(250);
  const emg = await page.textContent('.card h3');
  await shot('09-coach');

  // mock: start, fill a few, submit
  await page.click('.nav-btn[data-v="mock"]');
  await page.waitForSelector('#mock-start');
  await page.click('#mock-start');
  await page.waitForSelector('#m-submit');
  await shot('10-mock');
  const sels = await page.$$('select[data-part="p1"]');
  for (const s of sels) await s.selectOption('1');
  const p2 = await page.$$('input[data-part="p2"]');
  for (const i of p2) await i.fill('on');
  const p3 = await page.$$('input[data-part="p3"]');
  for (const i of p3) await i.fill('test');
  const p4 = await page.$$('input[data-part="p4"]');
  for (const i of p4) await i.fill('was put off');
  await page.click('#m-submit');
  await page.waitForSelector('.mock-result-score');
  await shot('11-mock-results');

  // back to dashboard — emergency ribbon check
  await page.click('#mk-dash');
  await page.waitForSelector('.hero');
  const ribbon = await page.$('.emg-ribbon');
  await shot('12-dashboard-final');

  // persistence across reload
  await page.reload();
  await page.waitForSelector('.hero');
  const name = await page.textContent('.h-page');

  console.log('Emergency ribbon on dashboard:', !!ribbon);
  console.log('Coach header:', (emg || '').trim());
  console.log('After reload, dashboard greets:', name.trim());
  console.log('JS errors:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error('UI TEST CRASH:', e.message); process.exit(1); });
