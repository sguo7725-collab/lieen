  /* ---------- Checkout ----------
     One sheet, by platform.
     iPhone: what you get → 「用 App Store 购买」 → Apple's own sheet (simulated here) → 已解锁 / 已取消 / 失败 / 等家长同意;
       「恢复购买」 finds an earlier purchase on the same Apple account.
     Android and the web: ① 打开付款页 ② the payment page shows a code ③ paste it here → 验证 → 已解锁, or a clear reason.
     In this preview nothing is charged; the 「模拟结果」 row picks what the store or the code server answers. */
  let payStep = 'start', payNote = '', payOutcome = 'ok';
  const OUTCOMES = { ios: [['ok', '成功'], ['cancel', '取消'], ['fail', '失败'], ['ask', '家长同意']], code: [['ok', '成功'], ['used', '已被用过'], ['offline', '没网']] };
  const INCLUDES = [['palette', '7 套主题', '每套一种看今天的方式，所有界面都换'], ['lock-keyhole', '锁屏也换', '安卓锁屏卡片跟着主题'], ['sparkles', '完成动效', '碎片飞进画面，每套各有一种'], ['archive', '碎片罐与每周画', '一周做完的事，存成一幅画'], ['calendar-clock', '倒数日', '考试、生日，写在头部']];
  function openPay(step = 'start') {
    let el = $('pro-pay');
    if (!el) { el = document.createElement('div'); el.id = 'pro-pay'; el.className = 'pro-pay'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'pro-pay-title'); document.body.append(el);
      el.addEventListener('click', e => { if (e.target === el && payStep !== 'working') closePay(); });
      // drag the top of the card down to close it
      let y0 = null;
      el.addEventListener('pointerdown', e => { const card = el.querySelector('.pro-pay-card'); if (!card || payStep === 'working' || !e.target.closest('.pro-pay-grab, .pro-pay-head')) return; y0 = e.clientY; card.style.transition = 'none'; });
      el.addEventListener('pointermove', e => { if (y0 == null) return; const d = Math.max(0, e.clientY - y0); el.querySelector('.pro-pay-card').style.transform = `translateY(${d}px)`; });
      const end = e => { if (y0 == null) return; const card = el.querySelector('.pro-pay-card'), d = e.clientY - y0; y0 = null; card.style.transition = ''; card.style.transform = ''; if (d > 70) closePay(); };
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); }
    payStep = LIVE && step === 'start' && info().order && !owns() ? 'waiting' : step; payNote = ''; el.hidden = false; renderPay(); document.body.classList.add('pro-paying');
    requestAnimationFrame(() => el.querySelector('.pro-pay-card')?.focus());
  }
  function closePay() { const el = $('pro-pay'); if (el) el.hidden = true; document.body.classList.remove('pro-paying'); clearTimeout(pollTimer); }
  let pollTimer = 0;
  const ios = () => payPlatform() === 'ios';
  function renderPay() {
    const el = $('pro-pay'); if (!el) return;
    // Android, web and the sideloaded iPhone build all buy through the Pro server. The App Store sheet below is only a
    // test-build mock-up for a future App Store release (Apple requires in-app purchase there).
    if (!ios() || !TESTING) return renderLive(el);
    const kind = ios() ? 'ios' : 'code', working = payStep === 'working';
    const head = `<span class="pro-pay-grab" aria-hidden="true"></span><header class="pro-pay-head"><h2 id="pro-pay-title">${payStep === 'done' ? 'Pro 已解锁' : '碎碎清单 Pro'}</h2>${working ? '' : '<button type="button" class="pro-pay-x" id="pro-pay-close" aria-label="关闭">' + icon('x') + '</button>'}</header>`;
    let body = '';
    if (payStep === 'done') {
      body = `<div class="pro-pay-done"><p><span class="pro-pay-badge">${icon('badge-check')}</span>谢谢支持，全部功能已经可以用了。挑一个主题试试：</p>
        <div class="pro-pay-themes">${ORDER.map(id => `<button type="button" data-pay-theme="${id}" aria-label="用「${THEMES[id].full}」">${themeMock(id)}<small>${THEMES[id].full}</small></button>`).join('')}</div>
        <button type="button" class="pro-pay-link" id="pro-pay-finish">以后再说</button></div>`;
    } else if (working) {
      body = `<div class="pro-pay-working" role="status"><span class="pro-spin" aria-hidden="true"></span><p>${ios() ? (payNote === 'restore' ? '正在查找这个 Apple 账户的购买记录…' : '正在连接 App Store…') : '正在验证兑换码…'}</p></div>`;
    } else {
      const price = `<div class="pro-pay-sum"><span class="pro-pay-amt"><b>${PRICE}</b><s>${LIST_PRICE}</s></span><span class="pro-pay-what">一次买断，永久使用<small>${PRICE_NOTE}</small></span></div>`;
      const note = payNote ? `<p class="pro-pay-note${/^(fail|used|offline|bad|none)/.test(payNote) ? ' is-error' : ''}" role="alert">${{ cancel: '已取消，没有扣款。', fail: '没能完成付款：连不上 App Store。检查网络后再试一次。', ask: '已经发给家长了。家长同意后，Pro 会自动解锁。', none: '这个 Apple 账户没有买过 Pro。换手机前用的是别的 Apple 账户吗？', used: '这个兑换码已经在 3 台设备上用过了。需要帮助，就在“关于”里给我们留言。', offline: '验证兑换码要联网。连上网再试一次。', bad: '兑换码不对：应该是 SUISUI 开头，后面 12 位字母和数字。', sent: '本地预览没有真的付款页。付完款，付款页会显示一串兑换码，像这样：' }[payNote] || ''}${payNote === 'sent' ? ` <button type="button" class="pro-pay-code" id="pro-pay-fill">${demoCode}</button>` : ''}</p>` : '';
      body = ios()
        ? `${price}${note}<button type="button" class="pro-pay-main" id="pro-pay-go">用 App Store 购买 ${PRICE}</button>
           <p class="pro-pay-fine">付款由 Apple 处理 · <button type="button" class="pro-pay-link" id="pro-pay-restore">恢复购买</button></p>`
        : `${price}<ol class="pro-pay-steps"><li>付款</li><li>拿到兑换码</li><li>粘贴兑换</li></ol>
           <button type="button" class="pro-pay-main" id="pro-pay-go">打开付款页 · ${PRICE}</button>
           <form class="pro-pay-redeem" id="pro-pay-redeem"><input id="pro-pay-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="已有兑换码？SUISUI-…" aria-label="兑换码"><button type="button" class="pro-pay-paste" id="pro-pay-paste">粘贴</button><button type="submit">兑换</button></form>${note}
           <p class="pro-pay-fine">支付宝、微信都能付 · 一个码最多用在 3 台设备上</p>`;
    }
    const sim = '';
    el.innerHTML = `<div class="pro-pay-card" tabindex="-1">${head}${body}${sim}</div>`;
    API.icons(el);
    $('pro-pay-close')?.addEventListener('click', closePay);
    el.querySelectorAll('[data-pay-outcome]').forEach(b => b.addEventListener('click', () => { payOutcome = b.dataset.payOutcome; renderPay(); }));
    $('pro-pay-go')?.addEventListener('click', () => {
      if (!ios()) { payNote = 'sent'; renderPay(); $('pro-pay-code')?.focus(); return; }
      payStep = 'working'; payNote = ''; renderPay();
      setTimeout(() => { if (payOutcome === 'ok') { buy(); payStep = 'done'; } else { payStep = 'start'; payNote = payOutcome; } renderPay(); }, 1100);
    });
    $('pro-pay-restore')?.addEventListener('click', () => {
      payStep = 'working'; payNote = 'restore'; renderPay();
      setTimeout(() => { if (info().owned || payOutcome === 'ok') { info().via = 'appstore'; buy(); payStep = 'done'; } else { payStep = 'start'; payNote = 'none'; } renderPay(); }, 900);
    });
    $('pro-pay-fill')?.addEventListener('click', () => { $('pro-pay-code').value = demoCode; $('pro-pay-code').focus(); });
    $('pro-pay-paste')?.addEventListener('click', async () => { try { const t = await navigator.clipboard.readText(); if (t) $('pro-pay-code').value = t.trim(); } catch { API.showToast('没能读取剪贴板，请长按输入框粘贴'); } });
    $('pro-pay-code')?.addEventListener('input', e => { const b = normCode(e.target.value).slice(0, 12); e.target.value = b ? `SUISUI-${b.match(/.{1,4}/g).join('-')}` : ''; });
    $('pro-pay-redeem')?.addEventListener('submit', e => {
      e.preventDefault(); const v = $('pro-pay-code').value;
      if (!codeOk(v)) { payNote = 'bad'; renderPay(); if ($('pro-pay-code')) $('pro-pay-code').value = v; return; }
      payStep = 'working'; payNote = ''; renderPay();
      setTimeout(() => { if (payOutcome === 'ok') { redeem(v); payStep = 'done'; } else { payStep = 'start'; payNote = payOutcome; } renderPay(); const input = $('pro-pay-code'); if (payNote && input) input.value = v; }, 900);
    });
    el.querySelectorAll('[data-pay-theme]').forEach(b => b.addEventListener('click', () => { S().proTheme = b.dataset.payTheme; persist(); applyTheme(); refreshAll(); closePay(); closeSheet(); API.showToast(`已换上「${THEMES[b.dataset.payTheme].full}」`); }));
    $('pro-pay-finish')?.addEventListener('click', () => { closePay(); $('pro-sheet')?.querySelector('[data-pro-section=themes]')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
  }

  /** The real checkout (release builds, Android and web). Steps: start → qr → waiting, or start → afdian, then done. */
  /* A release build can ship before its server is online (it goes live when the ICP filing is approved): while the
     shop can't be reached and the phone itself is online, the checkout says 即将开放 instead of a network error. */
  let notOpenYet = false;
  function renderLive(el) {
    if (CLOSED || notOpenYet) { // no Pro server in this build yet (or not online yet): nothing to buy, no code to check
      el.innerHTML = `<div class="pro-pay-card" tabindex="-1"><span class="pro-pay-grab" aria-hidden="true"></span><header class="pro-pay-head"><h2 id="pro-pay-title">Pro 即将开放</h2><button type="button" class="pro-pay-x" id="pro-pay-close" aria-label="关闭">${icon('x')}</button></header>
        <div class="pro-pay-closed"><p>Pro 的购买和兑换码还没有开放，开放后在这里开通。</p><p class="pro-pay-fine">开放后每台手机都要单独开通：购买一次，或用兑换码。安装包转给别人不会带上你的 Pro。</p>
        ${info().trialUsed ? '' : `<button type="button" class="pro-cta" id="pro-pay-trial">先免费试用 ${TRIAL_DAYS} 天</button>`}
        ${notOpenYet ? '<button type="button" class="pro-pay-link" id="pro-pay-recheck">再试一次</button>' : ''}</div></div>`;
      API.icons(el);
      $('pro-pay-close')?.addEventListener('click', closePay);
      $('pro-pay-trial')?.addEventListener('click', () => { closePay(); startTrial(); });
      $('pro-pay-recheck')?.addEventListener('click', () => { notOpenYet = false; shop = null; payNote = ''; renderLive(el); });
      return;
    }
    const st = payStep, cfg = shop, o = info().order;
    const titles = { start: '开通 Pro', qr: '扫码付款', waiting: '等待确认', afdian: '填写爱发电订单号', working: '开通 Pro', done: 'Pro 已开通' };
    const head = `<span class="pro-pay-grab" aria-hidden="true"></span><header class="pro-pay-head"><h2 id="pro-pay-title">${titles[st] || '开通 Pro'}</h2>${st === 'working' ? '' : '<button type="button" class="pro-pay-x" id="pro-pay-close" aria-label="关闭">' + icon('x') + '</button>'}</header>`;
    const note = payNote ? `<p class="pro-pay-note${payNoteBad ? ' is-error' : ''}" role="alert">${esc(payNote)}</p>` : '';
    const contact = cfg?.contact ? `<p class="pro-pay-fine">遇到问题请联系：${esc(cfg.contact)}</p>` : '';
    const redeemForm = `<div class="pro-pay-or"><span>使用兑换码</span></div>
      <form class="pro-pay-redeem" id="pro-pay-redeem"><input id="pro-pay-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="SUISUI-XXXX-XXXX-XXXX" aria-label="兑换码"><button type="button" class="pro-pay-paste" id="pro-pay-paste">粘贴</button><button type="submit">兑换</button></form>`;
    let body = '';
    if (st === 'done') {
      const i = info();
      body = `<div class="pro-pay-done"><p><span class="pro-pay-badge">${icon('badge-check')}</span>感谢支持。Pro 的全部功能已在这台设备上开通。</p>
        ${i.code ? `<div class="pro-pay-code-box"><small>你的兑换码 · 可在其他设备上开通（共 ${cfg?.maxDevices || 3} 台）</small><b>${esc(i.code)}</b><button type="button" class="pro-pay-link" id="pro-pay-copy-code">复制</button></div>` : ''}
        <p class="pro-pay-fine">挑一套主题开始用：</p>
        <div class="pro-pay-themes">${ORDER.map(id => `<button type="button" data-pay-theme="${id}" aria-label="使用「${THEMES[id].full}」">${themeMock(id)}<small>${THEMES[id].full}</small></button>`).join('')}</div>
        <button type="button" class="pro-pay-link" id="pro-pay-finish">稍后再选</button></div>`;
    } else if (st === 'working') {
      body = `<div class="pro-pay-working" role="status"><span class="pro-spin" aria-hidden="true"></span><p>${esc(payWorking || '正在开通…')}</p></div>`;
    } else if (!cfg) {
      body = payNote ? `${note}<button type="button" class="pro-pay-main" id="pro-pay-retry">重新加载</button>${redeemForm}` : `<div class="pro-pay-working" role="status"><span class="pro-spin" aria-hidden="true"></span><p>正在读取价格…</p></div>`;
    } else if (st === 'qr' && o) {
      body = `<figure class="pro-qr">${cfg.pay.hasQr ? `<img id="pro-qr-img" src="${LIVE ? `${SERVER}/api/qr` : simQr()}" alt="付款二维码" crossorigin="anonymous">` : '<span>暂时不能扫码付款</span>'}<figcaption>${esc(cfg.pay.qrLabel || '微信或支付宝扫码')}</figcaption></figure>
        ${cfg.pay.hasQr ? '<button type="button" class="pro-pay-second" id="pro-qr-save">保存二维码到相册</button>' : ''}
        <ol class="pro-pay-howto">
          <li><span>${esc(/支付宝/.test(cfg.pay.qrLabel || '') && !/微信/.test(cfg.pay.qrLabel || '') ? '打开支付宝「扫一扫」，从相册选取这张二维码。' : /微信/.test(cfg.pay.qrLabel || '') && !/支付宝/.test(cfg.pay.qrLabel || '') ? '打开微信「扫一扫」，从相册选取这张二维码。' : '打开微信或支付宝「扫一扫」，从相册选取这张二维码。')}</span></li>
          <li><span>付款 <b>${yuan(o.amount || cfg.price)}</b>，并在付款备注中填写订单号：<span class="pro-order-id"><b>${esc(o.id)}</b><button type="button" id="pro-order-copy">复制</button></span></span></li>
          <li><span>付款完成后，点击下方「我已付款」。</span></li>
        </ol>${note}
        <button type="button" class="pro-pay-main" id="pro-paid">我已付款</button>
        <p class="pro-pay-fine">${esc(cfg.pay.instructions || '我们核对到账后为你开通，通常需要几分钟。')}</p>${contact}`;
    } else if (st === 'waiting' && o) {
      const rejected = o.status === 'rejected';
      body = `<div class="pro-pay-wait"><span class="${rejected ? 'pro-pay-badge is-bad' : 'pro-spin'}" aria-hidden="true">${rejected ? icon('x') : ''}</span>
        <p><b>${rejected ? '没有核对到这笔付款' : '正在等待确认'}</b>订单 ${esc(o.id)} · ${yuan(o.amount || cfg.price)}</p></div>
        <p class="pro-pay-fine">${rejected ? `如果你已经付款，请联系我们并提供订单号${cfg.contact ? `：${esc(cfg.contact)}` : '。'}` : '我们核对到账后会立即为你开通，通常需要几分钟。可以先关闭此页面，开通后自动生效。'}</p>${note}
        <div class="pro-pay-row"><button type="button" class="pro-pay-second" id="pro-refresh">刷新状态</button><button type="button" class="pro-pay-second" id="pro-show-qr">查看付款码</button></div>${contact}`;
    } else if (st === 'afdian') {
      body = `<p class="pro-pay-lead">在爱发电完成付款后，打开订单详情，复制「订单号」粘贴到这里。</p>
        <form class="pro-pay-redeem is-trade" id="pro-afdian-form"><input id="pro-afdian-no" inputmode="numeric" autocomplete="off" placeholder="爱发电订单号" aria-label="爱发电订单号"><button type="button" class="pro-pay-paste" id="pro-afdian-paste">粘贴</button><button type="submit">验证</button></form>${note}
        ${cfg.pay.afdianUrl ? `<a class="pro-pay-link" href="${esc(cfg.pay.afdianUrl)}" target="_blank" rel="noopener">还没付款？前往爱发电</a>` : ''}${contact}`;
    } else {
      const mode = cfg.pay.mode, price = `<div class="pro-pay-sum"><span class="pro-pay-amt"><b>${yuan(cfg.price)}</b>${cfg.listPrice > cfg.price ? `<s>${yuan(cfg.listPrice)}</s>` : ''}</span><span class="pro-pay-what">一次购买，永久使用<small>${esc(cfg.priceNote || '')}</small></span></div>`;
      const main = mode === 'qr' ? `<button type="button" class="pro-pay-main" id="pro-start-qr">扫码付款 · ${yuan(cfg.price)}</button>`
        : mode === 'afdian' && cfg.pay.afdianUrl ? `<a class="pro-pay-main" id="pro-go-afdian" href="${esc(cfg.pay.afdianUrl)}" target="_blank" rel="noopener">前往爱发电付款 · ${yuan(cfg.price)}</a><button type="button" class="pro-pay-link" id="pro-afdian-have">已在爱发电付款？填写订单号</button>` : '';
      body = `${price}${main}${redeemForm}${note}
        <p class="pro-pay-fine">${mode === 'qr' ? '扫码付款经人工核对后开通，通常需要几分钟' : mode === 'afdian' ? '爱发电付款后填写订单号，立即开通' : '兑换码由官方渠道发放'} · 每个兑换码可用于 ${cfg.maxDevices} 台设备</p>${contact}`;
    }
    const sim = ''; // the checkout looks the same in every build: no preview controls
    el.innerHTML = `<div class="pro-pay-card" tabindex="-1">${head}${body}${sim}</div>`;
    API.icons(el);
    el.querySelectorAll('[data-sim-mode]').forEach(b => b.addEventListener('click', () => { simMode = b.dataset.simMode; shop = null; payStep = 'start'; payNote = ''; renderLive(el); }));
    const bad = (e, keep) => { payNote = e.message; payNoteBad = true; payStep = keep; renderLive(el); };
    $('pro-pay-close')?.addEventListener('click', closePay);
    $('pro-pay-retry')?.addEventListener('click', () => { payNote = ''; shop = null; renderLive(el); loadShop().then(() => renderLive(el), e => bad(e, 'start')); });
    $('pro-start-qr')?.addEventListener('click', async () => {
      payStep = 'working'; payWorking = '正在生成订单…'; payNote = ''; renderLive(el);
      try { const r = await shopCall('/api/orders', {}); info().order = { id: r.id, amount: r.amount, at: Date.now() }; persist(); payStep = 'qr'; renderLive(el); } catch (e) { bad(e, 'start'); }
    });
    $('pro-order-copy')?.addEventListener('click', () => copyText(o.id, '订单号已复制，付款时粘贴到备注里'));
    $('pro-qr-save')?.addEventListener('click', () => {
      const img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = () => { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); API.saveImage(c, '碎碎清单-付款码.png'); };
      img.onerror = () => API.showToast('二维码没能保存，可以截屏后再扫');
      img.src = LIVE ? `${SERVER}/api/qr` : simQr();
    });
    const check = async manual => {
      if (manual) { payStep = 'working'; payWorking = '正在查询…'; renderLive(el); }
      const r = await pollOrder();
      if (r === 'paid') { payStep = 'done'; payNote = ''; renderLive(el); return; }
      payStep = 'waiting'; if (manual) { payNote = r === 'error' ? '暂时查询不到，稍后再试。' : r === 'pending' ? '还在等待确认，确认后会自动开通。' : ''; payNoteBad = r === 'error'; }
      if (!info().order) { payStep = 'start'; payNote = '订单已失效，请重新下单。'; payNoteBad = true; }
      renderLive(el);
    };
    $('pro-paid')?.addEventListener('click', () => { if (!LIVE) simPaidAt = Date.now(); payStep = 'waiting'; payNote = ''; renderLive(el); });
    $('pro-refresh')?.addEventListener('click', () => check(true));
    $('pro-show-qr')?.addEventListener('click', () => { payStep = 'qr'; payNote = ''; renderLive(el); });
    $('pro-afdian-have')?.addEventListener('click', () => { payStep = 'afdian'; payNote = ''; renderLive(el); });
    $('pro-go-afdian')?.addEventListener('click', () => setTimeout(() => { payStep = 'afdian'; payNote = ''; renderLive(el); }, 400));
    $('pro-afdian-paste')?.addEventListener('click', async () => { try { const t = await navigator.clipboard.readText(); if (t) $('pro-afdian-no').value = t.replace(/\D/g, ''); } catch { API.showToast('没能读取剪贴板，请长按输入框粘贴'); } });
    $('pro-afdian-form')?.addEventListener('submit', async e => {
      e.preventDefault(); const no = $('pro-afdian-no').value.replace(/\D/g, '');
      if (no.length < 12) { payNote = '订单号是一长串数字，在爱发电的订单详情里可以找到。'; payNoteBad = true; return renderLive(el); }
      payStep = 'working'; payWorking = '正在向爱发电核对订单…'; payNote = ''; renderLive(el);
      try { await takeLicence(await shopCall('/api/afdian/claim', { tradeNo: no }), 'afdian'); payStep = 'done'; renderLive(el); } catch (err) { bad(err, 'afdian'); if ($('pro-afdian-no')) $('pro-afdian-no').value = no; }
    });
    $('pro-pay-paste')?.addEventListener('click', async () => { try { const t = await navigator.clipboard.readText(); if (t) { $('pro-pay-code').value = t.trim(); $('pro-pay-code').dispatchEvent(new Event('input')); } } catch { API.showToast('没能读取剪贴板，请长按输入框粘贴'); } });
    $('pro-pay-code')?.addEventListener('input', e => { const v = normCode(e.target.value).slice(0, 12); e.target.value = v ? `SUISUI-${v.match(/.{1,4}/g).join('-')}` : ''; });
    $('pro-pay-redeem')?.addEventListener('submit', async e => {
      e.preventDefault(); const v = $('pro-pay-code').value;
      if (normCode(v).length !== 12) { payNote = '兑换码是 12 位字母和数字，形如 SUISUI-XXXX-XXXX-XXXX。'; payNoteBad = true; renderLive(el); $('pro-pay-code').value = v; return; }
      const back = payStep; payStep = 'working'; payWorking = '正在验证兑换码…'; payNote = ''; renderLive(el);
      try { await takeLicence(await shopCall('/api/redeem', { code: v }), 'code'); payStep = 'done'; renderLive(el); } catch (err) { bad(err, back === 'working' ? 'start' : back); if ($('pro-pay-code')) $('pro-pay-code').value = v; }
    });
    $('pro-pay-copy-code')?.addEventListener('click', () => copyText(info().code, '兑换码已复制，请妥善保存'));
    el.querySelectorAll('[data-pay-theme]').forEach(b => b.addEventListener('click', () => { S().proTheme = b.dataset.payTheme; persist(); applyTheme(); refreshAll(); closePay(); closeSheet(); API.showToast(`已换上「${THEMES[b.dataset.payTheme].full}」`); }));
    $('pro-pay-finish')?.addEventListener('click', () => { closePay(); $('pro-sheet')?.querySelector('[data-pro-section=themes]')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    // while waiting, ask every 5 seconds; first load the shop
    clearTimeout(pollTimer);
    if (st === 'waiting' && o && o.status !== 'rejected') pollTimer = setTimeout(() => { if (!$('pro-pay').hidden && payStep === 'waiting') check(false); }, 5000);
    if (!cfg && !payNote) loadShop().then(() => { notOpenYet = false; renderLive(el); }, e => {
      // reachable network but no shop answering = the server is not online yet
      if (LIVE && (e.code === 'offline' || e.code === 'http') && navigator.onLine !== false) { notOpenYet = true; renderLive(el); } else bad(e, 'start');
    });
  }
  let payNoteBad = false, payWorking = '';
  /** The collection QR in builds without a server: your own 支付宝 code (app/assets/pay-qr.jpg). Release builds show the
     one uploaded in the admin page instead. simQrDemo() below is the old unscannable stand-in, kept for reference. */
  function simQr() { return 'assets/pay-qr.jpg'; }
  let simQrUrl = '';
  function simQrDemo() {
    if (simQrUrl) return simQrUrl;
    const n = 29, c = document.createElement('canvas'), k = 10; c.width = c.height = (n + 4) * k; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#111';
    let seed = 7; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (r() > .52) g.fillRect((x + 2) * k, (y + 2) * k, k, k);
    for (const [x, y] of [[0, 0], [n - 7, 0], [0, n - 7]]) { g.fillStyle = '#fff'; g.fillRect((x + 2) * k, (y + 2) * k, 7 * k, 7 * k); g.fillStyle = '#111'; g.fillRect((x + 2) * k, (y + 2) * k, 7 * k, 7 * k); g.fillStyle = '#fff'; g.fillRect((x + 3) * k, (y + 3) * k, 5 * k, 5 * k); g.fillStyle = '#111'; g.fillRect((x + 4) * k, (y + 4) * k, 3 * k, 3 * k); }
    g.fillStyle = '#fff'; g.fillRect(c.width / 2 - 46, c.height / 2 - 22, 92, 44); g.fillStyle = '#111'; g.font = '600 26px system-ui,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('示例', c.width / 2, c.height / 2 + 1);
    return (simQrUrl = c.toDataURL('image/png'));
  }
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  async function copyText(t, done) { try { await navigator.clipboard.writeText(t); API.showToast(done); } catch { API.showToast('没能复制，请长按选择'); } }

  function resetLocal() { S().pro = { owned: false, trialEnds: 0, trialUsed: false }; persist(); endTry(false); applyTheme(); refreshAll(); API.showToast('已重置为未购买'); }

