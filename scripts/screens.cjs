// Shared by verify-overlap.cjs and visual-diff.cjs: every look, every screen, every device size.
'use strict';

const LOOKS = ['glass', 'paper', 'night', 'dawn', 'day', 'pro-night', 'bloom', 'room', 'fluff', 'tape', 'riso'];
const SIZES = { phone: [390, 844], small: [360, 740], ipad: [820, 1180], 'ipad-land': [1180, 820], 'ipad-mini': [744, 1133] };
const SCREENS = ['home', 'settings', 'look:0', 'look:1', 'lock', 'list', 'data', 'language', 'review', 'pro', 'pay', 'add'];

// the iPhone shell's bridge, stubbed, so the iOS-only settings show
const IOS_STUB = () => { window.webkit = { messageHandlers: { suisui: { postMessage() {} } } }; window.SuiSuiIOS = { status: { live: true, liveAllowed: true, liveWanted: true, notifications: 'granted' }, liveActivity() {}, requestNotifications() {}, openSettings() {} }; };

async function newPage(browser, size, opts = {}) {
  const [w, h] = SIZES[size];
  const ctx = await browser.newContext({ lookTabs: true, viewport: { width: w, height: h }, isMobile: w < 700, hasTouch: true, proFree: true, ...opts.context });
  await ctx.addInitScript(IOS_STUB);
  if (opts.time) await ctx.addInitScript(t => { const D = Date, fixed = new D(t).getTime(); const start = D.now(); globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [fixed + (D.now() - start) * 0])); } static now() { return fixed; } }; }, opts.time);
  return { ctx, page: await ctx.newPage() };
}

async function setLook(page, url, look, extra = {}) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(([l, x]) => { const s = window.suisui.pro.state.settings; s.tipsSeen = true; s.iosSetupSeen = true; s.androidSetupSeen = true; Object.assign(s, x);
    if (['glass', 'paper', 'night'].includes(l)) { s.uiStyle = l; s.proTheme = ''; } else s.proTheme = l === 'pro-night' ? 'night' : l; window.suisui.pro.save(); }, [look, extra]);
}

async function openScreen(page, screen) {
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.querySelectorAll('dialog[open]').forEach(d => d.close()));
  const [kind, tab] = screen.split(':');
  if (kind === 'home') return;
  if (kind === 'add') { await page.evaluate(() => { const a = document.querySelector('.nav-add'); if (a && a.offsetParent) a.click(); }); await page.waitForTimeout(400); await page.evaluate(() => document.querySelector('#task-input').focus()); await page.keyboard.type('买一束花'); return; }
  if (kind === 'review') return page.evaluate(() => document.querySelector('.nav-button[data-view=review]').click());
  if (kind === 'pro') return page.evaluate(() => window.SuiSuiPro.open());
  if (kind === 'pay') return page.evaluate(() => window.SuiSuiPro.openPay());
  await page.locator('.nav-button[data-view=settings]').click();
  if (kind !== 'settings') await page.locator(`[data-settings-page=${kind}]`).first().click();
  if (tab) { const tb = page.locator('[data-look-tab]').nth(+tab); if (await tb.count()) await tb.click(); }
}

module.exports = { LOOKS, SIZES, SCREENS, newPage, setLook, openScreen };
