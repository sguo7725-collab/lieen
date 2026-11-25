// 1.22: the build as committed (no Pro server configured) never gives Pro away.
// Uses the real app/pro-config.js (the test environment's own Pro switch is removed before the app starts).
const assert = require('assert');
const { chromium, url, launchOptions } = require('./test-environment.cjs');

(async () => {
  const browser = await chromium.launch(launchOptions);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { delete window.SUISUI_PRO_CONFIG; }); // as shipped
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  const isPro = () => page.evaluate(() => window.SuiSuiPro.isPro());

  assert.equal(await page.evaluate(() => window.SuiSuiPro.freeForTesters), false, 'the shipped build is not a free test build');
  assert.equal(await isPro(), false, 'a fresh install has no Pro');

  // data from an older test build (simulated purchase) or an edited store: owned without a licence → no Pro
  await page.evaluate(() => { const k = 'suisui-locktodo-v1'; const raw = JSON.parse(localStorage.getItem(k)); raw.settings.pro = { owned: true, via: 'code', code: 'SUISUI-AAAA-BBBB-CCCC', trialUsed: true, trialEnds: 0 }; localStorage.setItem(k, JSON.stringify(raw)); });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await isPro(), false, 'a stored "owned" flag alone does not unlock Pro');

  // no way in: the demo code and any code are refused, checkout says not open yet
  assert.equal(await page.evaluate(() => window.SuiSuiPro.redeem(window.SuiSuiPro.demoCode)), false, 'demo code refused');
  await page.evaluate(() => window.SuiSuiPro.openPay());
  await page.locator('#pro-pay-title').waitFor();
  assert.equal((await page.locator('#pro-pay-title').textContent()).trim(), 'Pro 即将开放', 'checkout explains that sales are not open');
  assert.equal(await page.locator('#pro-pay-redeem, #pro-start-qr, #pro-paid').count(), 0, 'no payment form, no code form');
  assert.equal(await isPro(), false);

  // the free trial is the only thing that works (once per install)
  await page.evaluate(() => { const k = 'suisui-locktodo-v1'; const raw = JSON.parse(localStorage.getItem(k)); raw.settings.pro = { owned: false, trialUsed: false, trialEnds: 0 }; localStorage.setItem(k, JSON.stringify(raw)); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => window.SuiSuiPro.openPay());
  await page.locator('#pro-pay-trial').click();
  assert.equal(await isPro(), true, 'the trial unlocks Pro for its days');

  assert.deepEqual(errors, []);
  await browser.close();
  console.log('verify-entitlement: shipped build has no free Pro, stored flags and demo codes are refused, trial works');
})().catch(e => { console.error(e); process.exit(1); });
