#!/usr/bin/env node
// Pixel comparison of every look × screen × size — the safety net for CSS clean-ups.
//   node scripts/visual-diff.cjs save    DIR     take the reference pictures (before a change)
//   node scripts/visual-diff.cjs compare DIR     take them again and report every picture that differs
// The clock is frozen and motion is off, so two runs of unchanged code give identical pictures.
// SIZES=phone,ipad LOOKS=glass,dawn SCREENS=home,add narrow it down. Differences are written next to
// the reference as NAME.now.png and NAME.diff.png (changed pixels in red).
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium, url, launchOptions } = require('./test-environment.cjs');
const S = require('./screens.cjs');

const [mode, dir] = process.argv.slice(2);
if (!['save', 'compare'].includes(mode) || !dir) { console.error('usage: visual-diff.cjs save|compare DIR'); process.exit(2); }
const pick = (env, all) => (process.env[env] ? process.env[env].split(',') : all);
const LOOKS = pick('LOOKS', S.LOOKS), SIZES = pick('SIZES', ['phone', 'ipad', 'ipad-land']), SCREENS = pick('SCREENS', S.SCREENS);
const TIME = '2026-11-24T09:41:00+08:00';

// count pixels whose colour moved by more than a hair (anti-aliasing noise is ignored)
async function diff(page, a, b, out) {
  const r = await page.evaluate(async ([A, B]) => {
    const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
    const [ia, ib] = await Promise.all([load(A), load(B)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { size: true };
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height; const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, c.width, c.height);
    g.clearRect(0, 0, c.width, c.height); g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, c.width, c.height);
    let n = 0; const o = g.createImageData(c.width, c.height);
    for (let i = 0; i < da.data.length; i += 4) {
      const d = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2]));
      if (d > 24) { n++; o.data[i] = 255; o.data[i + 3] = 255; } else { o.data[i] = o.data[i + 1] = o.data[i + 2] = da.data[i] * .3 + 180; o.data[i + 3] = 255; }
    }
    g.putImageData(o, 0, 0);
    return { n, png: n ? c.toDataURL('image/png') : '' };
  }, [a, b].map(f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64')));
  if (r.png) fs.writeFileSync(out, Buffer.from(r.png.split(',')[1], 'base64'));
  return r;
}

(async () => {
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({ ...launchOptions, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const changed = []; let n = 0;
  for (const size of SIZES) for (const look of LOOKS) {
    const { ctx, page } = await S.newPage(browser, size, { time: TIME, context: { reducedMotion: 'reduce', deviceScaleFactor: 1 } });
    await S.setLook(page, url, look, { motion: false });
    for (const screen of SCREENS) {
      const name = `${size}-${look}-${screen.replace(':', '_')}`;
      const ref = path.join(dir, `${name}.png`), now = mode === 'save' ? ref : path.join(dir, `${name}.now.png`);
      try { await S.openScreen(page, screen); } catch { continue; }
      await page.waitForTimeout(900);
      await page.evaluate(() => document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))); // lazily loaded fonts
      await page.evaluate(() => document.activeElement?.blur?.()); // no blinking caret
      await page.screenshot({ path: now, animations: 'disabled', caret: 'hide' });
      n++;
      if (mode === 'compare') {
        if (!fs.existsSync(ref)) { changed.push(`${name}: 没有基准图`); continue; }
        const r = await diff(page, ref, now, path.join(dir, `${name}.diff.png`));
        if (r.size) changed.push(`${name}: 尺寸变了`);
        else if (r.n) changed.push(`${name}: ${r.n} 个像素不同`);
        else { fs.unlinkSync(now); fs.rmSync(path.join(dir, `${name}.diff.png`), { force: true }); }
      }
    }
    await ctx.close();
  }
  await browser.close();
  if (mode === 'save') { console.log(`存了 ${n} 张基准图到 ${dir}`); return; }
  for (const c of changed) console.log('  ' + c);
  console.log(changed.length ? `\n${n} 个画面里有 ${changed.length} 个和基准不同` : `\n${n} 个画面和基准完全一致`);
  process.exitCode = changed.length ? 1 : 0;
})();
