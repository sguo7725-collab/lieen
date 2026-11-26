  /* ---------- The Pro page ---------- */
  function openSheet(section = '') {
    if (LIVE && !shop) loadShop().then(() => { if (!$('pro-sheet').hidden) { const top = $('pro-sheet').scrollTop; renderSheet(); $('pro-sheet').scrollTop = top; startHero(); } }).catch(() => {});
    loadThumbFonts();
    const s = $('pro-sheet'); renderSheet(); s.hidden = false; document.body.classList.add('pro-open');
    s.scrollTop = 0; startHero();
    if (section) requestAnimationFrame(() => s.querySelector(`[data-pro-section=${section}]`)?.scrollIntoView({ block: 'start' }));
  }
  function closeSheet() { const s = $('pro-sheet'); if (s.hidden) return; s.hidden = true; document.body.classList.remove('pro-open'); stopHero(); }
  function renderSheet() {
    const s = $('pro-sheet'), pro = isPro(), owned = owns(), cur = activeTheme(), curE = S().proEffect || 'auto';
    s.innerHTML = `
      <header class="pro-hero">
        <button type="button" class="pro-close" id="pro-close" aria-label="关闭">${icon('x')}</button>
        <canvas id="pro-hero-jar" aria-hidden="true"></canvas>
        <h1>碎碎清单 Pro</h1>
        <p>七套完整主题、七种完成动效与每周碎片画。<br>一次购买，永久使用；此后上线的新主题同样包含在内。</p>
        ${pro && status() ? `<span class="pro-state">${status()}</span>` : ''}
      </header>

      <section class="pro-part" data-pro-section="themes">
        <h2>七套主题</h2>
        <p class="pro-lead">每套主题同时改变 App 界面、锁屏卡片与完成动效，当天全部完成时生成专属画面。左右滑动查看，点击「查看界面」预览。</p>
        <div class="pro-themes pro-showcase" id="pro-showcase">${['auto', ...ORDER].map(id => { const t = THEMES[id], on = (pro ? savedTheme() : tryOn) === id;
          if (id === 'auto') return `<article class="pro-theme pro-tcard is-auto${on ? ' active' : ''}" data-theme-card="auto"><div class="pro-tcard-shots"><figure class="pro-tcard-shot"><img src="assets/themes/auto-wide${SHOT()}.jpg" alt="" decoding="async"></figure></div><div class="pro-tcard-body"><h3>随光</h3><p>早上 5 点用琉璃，10 点用素笺，晚上 6 点用星河。</p><small>现在是${THEMES[byTime()].full}</small></div><div class="pro-tcard-actions"><button type="button" data-pro-theme="auto">${pro ? (on ? '使用中' : '使用') : '试穿'}</button></div></article>`;
          return `<article class="pro-theme pro-tcard${on ? ' active' : ''}" data-theme-card="${id}">
            <div class="pro-tcard-shots" data-pro-stage="${id}" role="button" tabindex="0" aria-label="查看${t.full}的界面"><figure class="pro-tcard-shot"><img src="assets/themes/${id}${SHOT()}.jpg" alt="" decoding="async"><figcaption>界面</figcaption></figure><figure><canvas class="pro-tcard-fin" data-fin="${id}" aria-label="${t.full}：全部做完的画面"></canvas><figcaption>全部做完</figcaption></figure></div>
            <div class="pro-tcard-body"><h3>${t.full}</h3><p>${t.line}</p>
              <div class="pro-tcard-fx"><span class="pro-tcard-fx-check" aria-hidden="true"></span><span class="pro-tcard-fx-text" data-fx-text="${id}">完成时：${FX_LINE[id] || EFFECTS[t.effect]}</span></div></div>
            <div class="pro-tcard-actions"><button type="button" class="pro-tcard-play" data-pro-stage="${id}">${icon('play')}查看界面</button><button type="button" data-pro-theme="${id}">${pro ? (on ? '使用中' : '使用') : '试穿'}</button></div></article>`; }).join('')}</div>
      </section>

      <section class="pro-part" data-pro-section="effects">
        <h2>完成动效</h2>
        <p class="pro-lead">完成一件事时的反馈。点击圆圈即可预览；选择「跟随主题」时，由当前主题决定。</p>
        <div class="pro-demo-row"><button type="button" class="pro-demo-check" id="pro-demo-check" aria-label="试一下完成动效"><span class="check-circle"></span></button><span class="pro-demo-title" id="pro-demo-title">把锁屏待办的想法做出来</span></div>
        <div class="pro-effect-grid">${Object.keys(EFFECTS).filter(id => id !== 'auto').map(id => `<button type="button" class="pro-effect${(pro ? curE === id : id === (demoPick || 'shards')) ? ' active' : ''}" data-pro-effect="${id}"><b>${EFFECTS[id]}</b><small>${EFFECT_LINE[id]}</small></button>`).join('')}
        ${pro ? `<button type="button" class="pro-effect${curE === 'auto' ? ' active' : ''}" data-pro-effect="auto"><b>跟随主题</b><small>每个主题用自己的动效</small></button>` : ''}</div>
      </section>

      <section class="pro-part" data-pro-section="jar">
        <h2>碎片罐与每周碎片画</h2>
        <p class="pro-lead">每天完成的事项收进碎片罐；每周结束时，按完成时间与分组生成一幅画，可保存为图片。</p>
        <div class="pro-jar-demo"><canvas id="pro-demo-jar" aria-hidden="true"></canvas><img id="pro-demo-art" alt="每周碎片画示例"></div>
        <p class="pro-fine">${pro ? '在「今天」页点击碎片罐即可查看。' : '图示为演示数据。'}</p>
      </section>

      <section class="pro-part">
        <h2>同样包含</h2>
        <ul class="pro-more">
          <li>${icon('calendar-clock')}<span><b>倒数日</b>考试、生日、出发等重要日子，显示在清单与锁屏上</span></li>
          <li>${icon('party-popper')}<span><b>清空时刻</b>当天事项全部完成时，播放专属庆祝动画</span></li>
          <li>${icon('gift')}<span><b>后续新主题</b>此后上线的主题，无需再次付费</span></li>
        </ul>
      </section>

      ${pro ? `<section class="pro-part" data-pro-section="settings">
        <h2>Pro 设置</h2>
        <label class="pro-switch"><span><b>锁屏也用主题</b><small>安卓锁屏上的卡片跟着换</small></span><input type="checkbox" class="switch" id="pro-lock" ${S().proLock !== false ? 'checked' : ''}></label>
        <label class="pro-switch"><span><b>锁屏用主题壁纸</b><small>每套主题有自己的壁纸，换主题时一起换</small></span><input type="checkbox" class="switch" id="pro-wall" ${S().proWall !== false ? 'checked' : ''}></label>
        <h3 class="pro-sub">倒数日</h3>
        <div class="pro-cd-list" id="pro-cd-list"></div>
        <form class="pro-cd-add" id="pro-cd-add"><input id="pro-cd-title" maxlength="12" placeholder="比如：考试" aria-label="倒数日名称" required><input type="date" id="pro-cd-date" aria-label="日期" required><button type="submit" class="primary-button">添加</button></form>
      </section>` : ''}

      <footer class="pro-buy" data-pay="${payPlatform()}">
        ${owned ? `<p class="pro-owned">${icon('badge-check')}Pro 已开通，感谢支持。${info().code ? `<small>兑换码 ${esc(info().code)} · 可在其他设备上开通</small>` : info().via === 'appstore' ? '<small>通过 App Store 购买</small>' : info().via ? '<small>兑换码开通</small>' : ''}</p>`
          : `<div class="pro-price"><b>${priceText()}</b>${listText() ? `<s>${listText()}</s>` : ''}<span>${LIVE && shop ? esc(shop.priceNote || '') + (shop.priceNote ? ' · ' : '') : PRICE_NOTE + ' · '}一次购买 · 永久使用 · 无订阅</span></div>
             <div class="pro-actions">${info().trialUsed || FREE || STORE ? '' : `<button type="button" class="pro-trial" id="pro-trial">免费试用 ${TRIAL_DAYS} 天</button>`}<button type="button" class="pro-cta" id="pro-buy">${payPlatform() === 'ios' && (TESTING || STORE) ? `购买 · ${PRICE}` : `开通 Pro · ${priceText()}`}</button></div>`}
        <p class="pro-legal">${owned ? '<span></span>' : payPlatform() === 'ios' && TESTING ? '<button type="button" id="pro-restore">恢复购买</button>' : '<button type="button" id="pro-have-code">已有兑换码</button>'}<a href="terms.html" target="_blank" rel="noopener">购买须知</a><a href="privacy.html" target="_blank" rel="noopener">隐私政策</a></p>
      </footer>`;
    API.icons(s);
    $('pro-close').addEventListener('click', closeSheet);
    $('pro-demo-check').addEventListener('click', playDemo);
    s.querySelectorAll('[data-pro-effect]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.proEffect;
      if (isPro()) { S().proEffect = id; persist(); renderLookInline(); } else demoPick = id;
      s.querySelectorAll('[data-pro-effect]').forEach(x => x.classList.toggle('active', x === b));
      if (id !== 'auto') playDemo();
    }));
    s.querySelectorAll('[data-pro-theme]').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.proTheme)));
    s.querySelectorAll('[data-pro-stage]').forEach(b => b.addEventListener('click', () => openStage(b.dataset.proStage)));
    drawFinaleThumbs(s);
    $('pro-buy')?.addEventListener('click', () => openPay());
    $('pro-have-code')?.addEventListener('click', () => { openPay(); $('pro-pay-code')?.focus(); });
    s.querySelectorAll('[data-pay-preview]').forEach(b => b.addEventListener('click', () => { payPreview = b.dataset.payPreview; renderSheet(); s.querySelector('.pro-buy')?.scrollIntoView({ block: 'end' }); }));
    $('pro-trial')?.addEventListener('click', startTrial);
    $('pro-restore')?.addEventListener('click', () => { openPay(); $('pro-pay-restore')?.click(); });
    $('pro-reset')?.addEventListener('click', resetLocal);
    $('pro-lock')?.addEventListener('change', e => { S().proLock = e.target.checked; persist(); applyTheme(); });
    $('pro-wall')?.addEventListener('change', e => { S().proWall = e.target.checked; persist(); applyTheme(); });
    $('pro-cd-add')?.addEventListener('submit', addCountdown);
    renderCountdownList();
    // Demo jar + art
    const dj = $('pro-demo-jar'); if (dj) { const ctx = canvasFor(dj, 132, 168); drawJarWith(BRAND, ctx, 8, 6, 116, 156, demoEntries(startOfDay(), 9), 0); }
    const entries = pro && logBetween(weekStart().getTime(), Date.now() + 1).length ? logBetween(weekStart().getTime(), weekStart().getTime() + 7 * 864e5) : demoEntries();
    $('pro-demo-art').src = drawArt(entries, weekStart(), look(), 540).toDataURL('image/png');
    artFonts(look(), entries).then(fresh => { if (fresh && $('pro-demo-art')) $('pro-demo-art').src = drawArt(entries, weekStart(), look(), 540).toDataURL('image/png'); });
  }
  /** Pro sheet showcase: each theme card shows its end-of-day picture (the finished frame) and can play its effect. */
  const FIN_BG = { dawn: '#eef0f6', day: '#f5f2ec', night: '#07080d', bloom: '#f4f5f4', riso: '#f3f1ea', room: '#e7efd6', fluff: '#f8f7f4' };
  function drawFinaleThumbs(root) {
    const items = Array.from({ length: 5 }, (_, i) => ({ id: `showcase-${i}`, title: ['写周报', '买菜', '跑步', '回邮件', '整理照片'][i], group: i % 2 ? 'life' : 'work', at: Date.now() - i * 3600e3 }));
    root.querySelectorAll('canvas[data-fin]').forEach(c => {
      const id = c.dataset.fin, draw = FINALES[id]; if (!draw) return;
      const W = 360, H = 420, k = Math.min(devicePixelRatio || 1, 2), w = c.clientWidth || 120, h = c.clientHeight || 140;
      c.width = w * k; c.height = h * k; const ctx = c.getContext('2d');
      ctx.fillStyle = FIN_BG[id] || '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      const sc = Math.min(c.width / W, c.height / H); ctx.save(); ctx.translate((c.width - W * sc) / 2, (c.height - H * sc) / 2); ctx.scale(sc, sc);
      try { draw.call(FINALES, ctx, W, H, 9000, items); } catch { /* thumbnail only */ }
      ctx.restore();
    });
    // the room is drawn from images: draw it again once they are decoded
    const SK = window.SuiSuiSkins, room = root.querySelector('canvas[data-fin=room]');
    if (room && SK && !room._waited) { room._waited = true; SK.roomReady([SK.roomImg({ only: 'shell' }), SK.roomImg({ only: 'lamp', done: 1, total: 1, lit: true }), ...SK.ROOM_ORDER.map(k => SK.roomImg({ only: k, done: 1, total: 2 }))]).then(() => { if (room.isConnected) drawFinaleThumbs(root); }); }
  }
  function tryCardEffect(id) {
    const text = document.querySelector(`[data-fx-text="${id}"]`), row = text?.parentElement; if (!text || text.dataset.busy) return;
    const fx = THEMES[id]?.effect || 'shards'; text.dataset.busy = '1'; row.classList.add('done');
    if (reduce() || !FX[fx]) { setTimeout(() => { row.classList.remove('done'); delete text.dataset.busy; }, 700); return; }
    let run; try { run = FX[fx](text, sampleText(text, fx === 'dots' ? 4 : fx === 'stardust' ? 2 : fx === 'shards' ? 6 : 3)); } catch { run = null; }
    text.style.visibility = 'hidden';
    Promise.resolve(run).then(() => setTimeout(() => { text.style.visibility = ''; row.classList.remove('done'); delete text.dataset.busy; text.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 300 }); }, 500));
  }
