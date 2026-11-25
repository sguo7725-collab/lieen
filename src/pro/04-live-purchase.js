  /* ---------- Live purchase (Android and web, release builds) ----------
     The server signs a licence (ECDSA P-256) for this device; the app checks the signature with the public key in
     pro-config.js, so Pro keeps working offline. Three ways in, as set in the admin page:
       扫码付款 — the app opens an order; the buyer pays your QR code with the order number in the note; you confirm
                  it in the admin page; the app (polling while the sheet is open, and on every start) gets the licence.
       爱发电   — the buyer pays on afdian and pastes the order number; the server checks it with afdian.
       兑换码   — any code you made; one code works on up to N devices (set in the admin page). */
  /** Cheap check, no crypto: the licence names this device. The signature itself is checked by readLicence(). */
  function licenceForThisDevice(lic) {
    // (its own base64url decode: this runs at start-up, before the helpers further down exist)
    try { const body = String(lic || '').split('.')[0]; if (!body) return false; const bin = atob(body.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(body.length / 4) * 4, '='));
      const p = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)))); return !!p.dev && p.dev === localStorage.getItem('suisui-device'); } catch { return false; }
  }
  const deviceId = () => { try { let d = localStorage.getItem('suisui-device'); if (!d) { d = (crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`).replace(/[^\w-]/g, ''); localStorage.setItem('suisui-device', d); } return d; } catch { return 'nostore'; } };
  /* Test builds have no server: the same checkout runs against this stand-in, so it can be tried without paying.
     Only test builds: a build with no server refuses every purchase and code (see CLOSED). */
  let simMode = 'qr', simPaidAt = 0, simOrder = '';
  const randAbc = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), x => CODE_ABC[x & 31]).join('');
  const simCode = () => `SUISUI-${randAbc(4)}-${randAbc(4)}-${randAbc(4)}`;
  function simCall(path, body = {}) {
    const wait = ms => new Promise(r => setTimeout(r, ms)), no = (code, message) => Promise.reject(Object.assign(new Error(message), { code }));
    if (path === '/api/config') return wait(250).then(() => ({ price: 2800, listPrice: 3990, priceNote: '首发价', maxDevices: 3, contact: '', pay: { mode: simMode, qrLabel: '支付宝扫码付款', instructions: '我们核对到账后为你开通，通常需要几分钟。', hasQr: true, afdianUrl: 'https://afdian.com/' } }));
    if (path === '/api/orders') return wait(400).then(() => ({ id: simOrder ||= 'S' + randAbc(6), amount: 2800, status: 'pending' }));
    if (/^\/api\/orders\/.+\/status$/.test(path)) return wait(300).then(() => (simPaidAt && Date.now() - simPaidAt > 4000 ? { status: 'paid', licence: 'preview', code: simCode() } : { status: 'pending' }));
    if (path === '/api/redeem') return wait(700).then(() => (codeOk(body.code) ? { licence: 'preview', code: `SUISUI-${normCode(body.code).match(/.{4}/g).join('-')}` } : no('bad', '兑换码不存在。请检查是否输入有误。')));
    if (path === '/api/afdian/claim') return wait(900).then(() => (String(body.tradeNo).length >= 18 ? { licence: 'preview', code: simCode() } : no('not-found', '没有找到这个订单号。请确认已付款，并复制完整的订单号。')));
    if (path === '/api/check') return Promise.resolve({ ok: true });
    return no('http', '服务器暂时不可用，请稍后再试。');
  }
  async function shopCall(path, body) {
    if (TESTING) return simCall(path, body);
    if (!LIVE) throw Object.assign(new Error('Pro 还没开放购买，敬请期待。'), { code: 'closed' });
    let r;
    try { r = await fetch(SERVER + path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ device: deviceId(), platform: API.platform, version: document.querySelector('meta[name=app-version]')?.content || '', ...body }) } : {}); }
    catch { throw Object.assign(new Error('连不上服务器。检查网络后再试一次。'), { code: 'offline' }); }
    let j = {}; try { j = await r.json(); } catch {}
    if (!r.ok) throw Object.assign(new Error(j.message || '服务器暂时不可用，请稍后再试。'), { code: j.error || 'http' });
    return j;
  }
  let pubKey = null;
  const unb64 = v => Uint8Array.from(atob(v.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(v.length / 4) * 4, '=')), c => c.charCodeAt(0));
  /** The licence's contents when the signature is ours and it belongs to this device; otherwise null. */
  async function readLicence(lic) {
    try {
      const [body, sig] = String(lic || '').split('.'); if (!body || !sig) return null;
      pubKey ||= await crypto.subtle.importKey('jwk', { ...CFG.publicKey, ext: true }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      if (!(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pubKey, unb64(sig), new TextEncoder().encode(body)))) return null;
      const p = JSON.parse(new TextDecoder().decode(unb64(body)));
      return p.dev === deviceId() ? p : null;
    } catch { return null; }
  }
  async function takeLicence(res, via) {
    if (TESTING) { const i = info(); Object.assign(i, { owned: true, via, code: res.code || '' }); delete i.order; buy(); return; }
    if (!LIVE) throw Object.assign(new Error('Pro 还没开放购买，敬请期待。'), { code: 'closed' });
    const p = await readLicence(res.licence);
    if (!p) throw Object.assign(new Error('开通凭证没有通过校验。请联系我们处理。'), { code: 'licence' });
    const i = info(); Object.assign(i, { owned: true, via, licence: res.licence, lid: p.lid, code: res.code || i.code || '', checkedAt: Date.now() }); delete i.order;
    buy();
  }
  let shop = null, shopAt = 0;
  async function loadShop() { if (!shop || Date.now() - shopAt > 3e5) { shop = await shopCall('/api/config'); shopAt = Date.now(); } return shop; }
  const yuan = fen => `¥${(fen / 100).toFixed(fen % 100 ? 2 : 0)}`;
  const priceText = () => (LIVE && shop ? yuan(shop.price) : PRICE);
  const listText = () => (LIVE && shop ? (shop.listPrice > shop.price ? yuan(shop.listPrice) : '') : LIST_PRICE);
  /** Ask whether the open QR order was confirmed; returns its status. */
  async function pollOrder() {
    const o = info().order; if (!o) return '';
    try {
      const r = await shopCall(`/api/orders/${o.id}/status`, {});
      if (r.status === 'paid' && r.licence) { await takeLicence(r, 'order'); return 'paid'; }
      if (r.status === 'rejected') { o.status = 'rejected'; persist(); }
      return r.status;
    } catch (e) { if (e.code === 'not-found') { delete info().order; persist(); } return 'error'; }
  }
  /** On start: check the licence; finish an order confirmed while the app was closed; now and then ask about refunds. */
  async function liveBoot() {
    if (!LIVE) return;
    const i = info();
    if (i.owned && !(await readLicence(i.licence))) { Object.assign(i, { owned: false }); delete i.licence; persist(); endTry(false); applyTheme(); refreshAll(); }
    if (i.order && !owns()) { const st = await pollOrder(); if (st === 'paid') API.showToast('付款已确认，Pro 已开通。谢谢支持！'); }
    if (i.owned && i.lid && Date.now() - (i.checkedAt || 0) > 3 * 864e5) {
      try { const r = await shopCall('/api/check', { lid: i.lid }); i.checkedAt = Date.now();
        if (r.ok === false) { i.owned = false; delete i.licence; persist(); endTry(false); applyTheme(); refreshAll(); API.showToast('这台设备的 Pro 已被撤销（订单退款或设备解绑）'); } else persist();
      } catch {}
    }
  }
