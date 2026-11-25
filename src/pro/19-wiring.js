  /* ---------- Wiring ---------- */
  function refreshAll() {
    if (API.lockMode) { renderCountdowns(); return; } // the lock view has no settings, banner or Pro sheet to fill
    renderLookInline(); renderCountdowns(); drawMiniJar(false);
    const st = $('pro-banner-state'); if (st) st.textContent = isPro() ? (owns() || FREE ? '已开通' : `试用 ${trialLeft()} 天`) : PRICE;
    const sub = document.querySelector('#pro-banner .pro-banner-text small'); if (sub) sub.textContent = isPro() && themeLabel() ? `正在用「${themeLabel()}」` : isPro() ? '主题、碎片罐、动效都已打开' : '主题、碎片罐、完成动效';
    const bj = $('pro-banner-jar'); if (bj) { const ctx = canvasFor(bj, 24, 30); drawJarWith(BRAND, ctx, 2, 1, 20, 28, demoEntries(startOfDay(), 6), 0); }
    if (!$('pro-sheet').hidden) { const top = $('pro-sheet').scrollTop; renderSheet(); $('pro-sheet').scrollTop = top; startHero(); }
  }
  window.SuiSuiPro = { simOutcome: v => { payOutcome = v; }, effect, isPro, themeLabel, freeForTesters: FREE, redeem, demoCode, payPlatform, openPay, closePay, wallpaper, saveWallpaper, open: openSheet, openJar, drawArt, THEMES, EFFECTS, buy, startTrial, reset: resetLocal, tryTheme: startTry, endTry };
  // Back (Android back button, iPhone edge swipe): close the Pro layers first, top-most first
  const baseBack = window.suisuiBack;
  window.suisuiBack = () => {
    const open = id => $(id) && !$(id).hidden;
    if (open('pro-stage')) { closeStage(); return true; }
    if (open('pro-pay')) { if (payStep !== 'working') closePay(); return true; }
    if (open('pro-celebrate')) { closeCelebrate(); return true; }
    if (open('pro-jar-sheet')) { closeJar(); return true; }
    if (open('pro-sheet')) { closeSheet(); return true; }
    return baseBack ? baseBack() : false;
  };
  // listen first: refreshAll() can make app.js re-apply its settings, and the theme has to win again afterwards
  window.addEventListener('suisui:settings', () => { applyTheme(); renderLookInline(); });
  if (SHOW && THEMES[SHOW]) Object.assign(S(), { proTheme: SHOW, proLock: true, proWall: true, proEffect: 'auto' });
  mount();
  applyTheme(); refreshAll();
  // release builds: check the licence, finish an order confirmed while the app was closed
  if (LIVE && !API.lockMode) { liveBoot(); document.addEventListener('visibilitychange', () => { if (!document.hidden && info().order && !owns()) pollOrder().then(st => { if (st === 'paid') API.showToast('付款已确认，Pro 已开通。谢谢支持！'); }); }); }
  // In the effect frame, the first thing gets done and comes back, over and over, so the theme's finishing can be watched
  if (SHOW && SHOW_VIEW === 'fx') {
    const cycle = () => {
      const row = document.querySelector('#task-list .task-row:not(.is-done) .check-task');
      if (row) row.click();
      setTimeout(() => document.querySelector('#completed-list [data-action=restore]')?.click(), 1900);
    };
    setTimeout(cycle, 700); setInterval(cycle, 3400);
  }
  window.addEventListener('suisui:render', () => { if (API.lockMode) { window.SuiSuiSkins.lockStrip(document.documentElement.dataset.proLock || ''); return; } window.SuiSuiSkins.head(); renderCountdowns(); drawMiniJar(false); });
  window.addEventListener('suisui:completing', () => { if (isPro() || tryOn) playSound(themeSound()); });
  window.addEventListener('suisui:done', e => {
    const { id, rect, allDone } = e.detail || {}, skin = window.SuiSuiSkins, theme = activeTheme();
    if (theme && skin?.arriving?.(id)) {
      const to = rect && !reduce() ? skin.target(id) : null;
      if (to) flyToHead(rect, to, theme).then(() => { skin.arrive(id); drawMiniJar(true); });
      else { skin.arrive(id); drawMiniJar(true); }
    } else if (rect) flyToJar(rect); else drawMiniJar(true);
    if (allDone) setTimeout(celebrate, 760);
  });
  // A trial that ends while the app is open: the free look comes back.
  setInterval(() => { const was = document.documentElement.dataset.proTheme || ''; if (was !== activeTheme()) { applyTheme(); API.render(); refreshAll(); } }, 60000);
