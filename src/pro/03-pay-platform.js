  /* ---------- How people pay, by platform ----------
     iPhone: App Store in-app purchase (a non-consumable), restored with the Apple account. Apple requires this for
       digital unlocks in an iOS app, and the app may not point to other ways to pay.
     Android (no Google Play in China) and the web: a redeem code bought on a payment page; the code unlocks Pro.
     This build simulates both. Real codes need a small server that issues and checks them (see 基础版与Pro.md). */
  let payPreview = '';
  const payPlatform = () => payPreview || new URLSearchParams(location.search).get('pay') || API.platform || 'web';
  const CODE_ABC = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const codeSum = body => { let h = 7; for (const ch of body) h = (h * 31 + CODE_ABC.indexOf(ch) + 1) % 1024; return CODE_ABC[h >> 5] + CODE_ABC[h & 31]; };
  const normCode = v => String(v || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/^SUISUI/, '');
  /** Preview-only check (a checksum). The real build asks the code server instead. */
  const codeOk = v => { const b = normCode(v); return b.length === 12 && [...b].every(ch => CODE_ABC.includes(ch)) && codeSum(b.slice(0, 10)) === b.slice(10); };
  const demoCode = (() => { const b = 'SUPRWEEK26'; const full = b + codeSum(b); return `SUISUI-${full.slice(0, 4)}-${full.slice(4, 8)}-${full.slice(8)}`; })();
  function redeem(value) {
    if (!codeOk(value)) { API.showToast('兑换码不对，检查一下有没有输错'); return false; }
    info().via = 'code'; info().code = normCode(value); buy(); return true;
  }
