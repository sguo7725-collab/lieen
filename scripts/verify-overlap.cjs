// Overlap audit (1.22, user report: 「穿模」). For every look × screen × device size, find
//  1. text that runs into other text,
//  2. text covered by a check/lock badge (the ::before badge of a chip, or a .pro-lock-badge),
//  3. text inside the selection ring (box-shadow spread) of an active tile it does not belong to,
//  4. text sticking out of its own clipping box (cut off).
// Usage: node scripts/verify-overlap.cjs   (server on LOCKTODO_URL, default :8793)
//        SIZES=phone,ipad,ipad-land LOOKS=glass,dawn node scripts/verify-overlap.cjs
const { chromium, url, launchOptions } = require('./test-environment.cjs');

const { LOOKS: ALL_LOOKS, SCREENS, newPage, setLook, openScreen } = require('./screens.cjs');
const LOOKS = process.env.LOOKS ? process.env.LOOKS.split(',') : ALL_LOOKS;
const SIZES = (process.env.SIZES || 'phone,small,ipad,ipad-land').split(',');

const audit = () => {
  const vis = el => { if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false; const s = getComputedStyle(el); if (s.visibility === 'hidden' || +s.opacity === 0 || s.display === 'none') return false;
    for (let p = el; p; p = p.parentElement) { const ps = getComputedStyle(p); if (ps.display === 'none' || +ps.opacity === 0 || ps.visibility === 'hidden') return false; if (p.closest('[hidden],[inert],dialog:not([open])') ) return false; } return true; };
  const onScreen = r => r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const name = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.'); return s; };
  // share of a box left after every clipping ancestor (collapsed panels, scrollers) cuts it
  const shown = (el, r) => { let L = r.left, T = r.top, R = r.right, B = r.bottom;
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) { const s = getComputedStyle(p); if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      const c = p.getBoundingClientRect(); L = Math.max(L, c.left); T = Math.max(T, c.top); R = Math.min(R, c.right); B = Math.min(B, c.bottom); }
    return Math.max(0, R - L) * Math.max(0, B - T) / (r.width * r.height); };
  // the part of a run that is painted (ellipsis / overflow:hidden on the element itself or an ancestor cut the rest)
  const clip = (el, r) => { let L = r.left, T = r.top, R = r.right, B = r.bottom;
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) { const s = getComputedStyle(p); if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      const c = p.getBoundingClientRect(); L = Math.max(L, c.left); T = Math.max(T, c.top); R = Math.min(R, c.right); B = Math.min(B, c.bottom); }
    return { left: L, top: T, right: Math.max(L, R), bottom: Math.max(T, B), width: Math.max(0, R - L), height: Math.max(0, B - T) }; };
  // visible text runs (per text node, glyph boxes)
  const texts = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    if (!n.nodeValue.trim()) continue; const el = n.parentElement; if (!el || el.closest('script,style,svg,canvas,.sr-only,[aria-hidden=true] .fx-piece')) continue;
    if (!vis(el)) continue; const rg = document.createRange(); rg.selectNodeContents(n);
    for (const r0 of rg.getClientRects()) if (onScreen(r0) && r0.width > 2 && shown(el, r0) > .5) { const r = clip(el, r0); if (r.right - r.left > 2) texts.push({ el, r, t: n.nodeValue.trim().slice(0, 16) }); }
  }
  // drop text that something else (a sheet, a dialog) covers: hit test the centre of each run
  const top = t => { const x = (t.r.left + t.r.right) / 2, y = (t.r.top + t.r.bottom) / 2; const h = document.elementFromPoint(x, y); if (!h || t.el.contains(h) || h.contains(t.el)) return true;
    const layer = e => e.closest('dialog,[role=dialog],[class*=sheet],[class*=modal],[class*=overlay]'); if (layer(h) !== layer(t.el)) return false;
    for (let q = h; q; q = q.parentElement) { const ps = getComputedStyle(q).position; if ((ps === 'sticky' || ps === 'fixed') && !q.contains(t.el)) return false; } return true; };
  for (let i = texts.length - 1; i >= 0; i--) if (!top(texts[i])) texts.splice(i, 1);
  const out = [];
  // 1 text on text
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j]; if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
    // compare the ink, not the line box: big display type (a lock-screen clock) has tall empty space above its figures
    const ink = r => { const d = r.height * .2; return { left: r.left, right: r.right, top: r.top + d, bottom: r.bottom - d, width: r.width, height: r.height * .6 }; };
    const ov = inter(ink(a.r), ink(b.r)); if (ov > 6 && ov > 0.12 * Math.min(a.r.width * a.r.height, b.r.width * b.r.height)) {
      // ignore stacks where one is fully covered by an opaque layer (e.g. hidden under a sheet): hit test the centre
      const cx = (Math.max(a.r.left, b.r.left) + Math.min(a.r.right, b.r.right)) / 2, cy = (Math.max(a.r.top, b.r.top) + Math.min(a.r.bottom, b.r.bottom)) / 2;
      const hit = document.elementFromPoint(cx, cy); if (hit && !(a.el.contains(hit) || b.el.contains(hit) || hit.contains(a.el) || hit.contains(b.el))) continue;
      out.push(`文字重叠: 「${a.t}」(${name(a.el)}) × 「${b.t}」(${name(b.el)})`);
    }
  }
  // 2 badges and 3 rings
  const badges = [], rings = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!(el instanceof HTMLElement) || !el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
    const r = el.getBoundingClientRect(); if (!onScreen(r)) continue;
    for (const pseudo of ['::before', '::after']) {
      const s = getComputedStyle(el, pseudo); if (s.content === 'none' || s.content === 'normal' || s.position !== 'absolute' || s.display === 'none' || +s.opacity < .05) continue;
      const W = parseFloat(s.width), H = parseFloat(s.height); if (!(W >= 8 && W <= 40 && H >= 8 && H <= 40)) continue; // only badge-sized things
      if (!vis(el) || shown(el, r) < .5) continue;
      const bl = parseFloat(getComputedStyle(el).borderLeftWidth) || 0, bt = parseFloat(getComputedStyle(el).borderTopWidth) || 0;
      let left = s.left !== 'auto' ? r.left + bl + parseFloat(s.left) : r.right - (parseFloat(getComputedStyle(el).borderRightWidth) || 0) - parseFloat(s.right) - W;
      let top = s.top !== 'auto' ? r.top + bt + parseFloat(s.top) : r.bottom - parseFloat(s.bottom) - H;
      if (isNaN(left) || isNaN(top)) continue;
      badges.push({ el, r: { left, top, right: left + W, bottom: top + H }, what: name(el) + pseudo });
    }
    if (el.matches('.pro-lock-badge') && vis(el)) badges.push({ el, r, what: name(el) });
    const bs = getComputedStyle(el).boxShadow; if (bs && bs !== 'none' && vis(el)) {
      let spread = 0; for (const part of bs.split(/,(?![^(]*\))/)) { if (/inset/.test(part)) continue; const nums = part.replace(/rgba?\([^)]*\)|color-mix\([^)]*\)|#[0-9a-f]+/gi, '').trim().split(/\s+/).map(parseFloat).filter(x => !isNaN(x)); if (nums.length >= 4 && nums[0] === 0 && nums[1] === 0 && nums[2] === 0) spread = Math.max(spread, nums[3]); }
      if (spread >= 2) rings.push({ el, r, spread, what: name(el) });
    }
  }
  for (const b of badges) for (const t of texts) {
    if (b.el.contains(t.el) && b.what.includes('::') === false) continue;
    if (t.el === b.el && !b.what.includes('::')) continue;
    const ov = inter(b.r, t.r); if (ov > 4) out.push(`角标压字: ${b.what} 盖住「${t.t}」(${name(t.el)})`);
  }
  for (const g of rings) {
    const R = { left: g.r.left - g.spread, top: g.r.top - g.spread, right: g.r.right + g.spread, bottom: g.r.bottom + g.spread };
    for (const t of texts) { if (g.el.contains(t.el)) continue; if (inter(R, t.r) - inter(g.r, t.r) > 2) out.push(`选中框压字: ${g.what} 的外框碰到「${t.t}」(${name(t.el)})`); }
  }
  // 5 a button's decoration (::before/::after) far larger than the button: its positioned box is some ancestor (1.22 iPad + button)
  for (const el of document.querySelectorAll('button,a,[role=button]')) {
    if (!vis(el)) continue; const r = el.getBoundingClientRect(); if (!onScreen(r) || r.width < 8) continue;
    for (const pseudo of ['::before', '::after']) { const s = getComputedStyle(el, pseudo); if (s.content === 'none' || s.content === 'normal' || s.position !== 'absolute' || s.display === 'none') continue;
      const W = parseFloat(s.width), H = parseFloat(s.height); if (W > r.width * 1.6 + 16 || H > r.height * 1.6 + 16) out.push(`装饰跑出按钮: ${name(el)}${pseudo} ${Math.round(W)}×${Math.round(H)}，按钮只有 ${Math.round(r.width)}×${Math.round(r.height)}`); }
  }
  // 4 clipped text
  for (const t of texts) {
    for (let p = t.el; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p); if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      if (/auto|scroll/.test(s.overflowX + s.overflowY)) break; // scrollers may legitimately hide content
      if (s.textOverflow === 'ellipsis' || getComputedStyle(t.el).textOverflow === 'ellipsis' || p.matches('.font-sample,.theme-shot,.pro-thumb,.pro-mock,.lock-preview,[class*=preview],[class*=thumb],[class*=mock],[class*=demo]')) break;
      const c = p.getBoundingClientRect(); const cut = Math.max(c.left - t.r.left, t.r.right - c.right, c.top - t.r.top, t.r.bottom - c.bottom);
      if (cut > 3) out.push(`文字被截断: 「${t.t}」(${name(t.el)}) 超出 ${name(p)} ${Math.round(cut)}px`);
      break;
    }
  }
  return [...new Set(out)];
};

(async () => {
  const browser = await chromium.launch({ ...launchOptions, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const report = {}; let n = 0;
  for (const size of SIZES) for (const look of LOOKS) {
    const { ctx, page } = await newPage(browser, size);
    await setLook(page, url, look);
    for (const screen of SCREENS) {
      try {
        await openScreen(page, screen);
        await page.waitForTimeout(700);
        const found = await page.evaluate(audit);
        if (found.length) { report[`${size} ${look} ${screen}`] = found; if (process.env.SHOTS) { require('node:fs').mkdirSync(process.env.SHOTS, { recursive: true }); await page.screenshot({ path: `${process.env.SHOTS}/${size}-${look}-${screen.replace(':', '_')}.png`, fullPage: false }); } }
        n++;
      } catch (e) { report[`${size} ${look} ${screen}`] = ['(脚本没能打开这一屏) ' + e.message.split('\n')[0]]; }
    }
    await ctx.close();
  }
  await browser.close();
  const keys = Object.keys(report);
  for (const k of keys) { console.log('■ ' + k); for (const line of report[k]) console.log('   ' + line); }
  console.log(`\n检查了 ${n} 个画面，有问题的 ${keys.length} 个。`);
  process.exitCode = keys.length ? 1 : 0;
})();
