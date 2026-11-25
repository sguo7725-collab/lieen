  /* ---------- UI: entries into Pro ---------- */
  function mount() {
    const shell = document.createElement('div');
    shell.innerHTML = `
      <div class="pro-tryon" id="pro-tryon" hidden role="status"><b></b><span>完成一件事试试效果</span><button type="button" id="pro-tryon-end">换回</button><button type="button" class="pro-tryon-buy" id="pro-tryon-buy">解锁</button></div>
      <section class="pro-sheet" id="pro-sheet" hidden aria-label="碎碎清单 Pro"></section>
      <section class="pro-sheet pro-jar-sheet" id="pro-jar-sheet" hidden aria-label="碎片罐"></section>
      <div class="pro-celebrate" id="pro-celebrate" hidden role="dialog" aria-label="今天全部完成"></div>`;
    document.body.append(...shell.children);
    $('pro-tryon-end').addEventListener('click', () => endTry(false));
    $('pro-tryon-buy').addEventListener('click', () => openSheet());
    // Settings home: the Pro entry under the lock preview
    const hero = $('home-hero');
    if (hero) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pro-banner'; b.id = 'pro-banner';
      b.innerHTML = `<canvas id="pro-banner-jar" aria-hidden="true"></canvas><span class="pro-banner-text"><b>碎碎清单 Pro</b><small>主题、碎片罐、完成动效</small></span><span class="pro-banner-state" id="pro-banner-state"></span>`;
      hero.after(b); b.addEventListener('click', () => openSheet());
    }
    // Today: the jar next to the progress ring
    const side = $('today-side');
    if (side) {
      const j = document.createElement('button'); j.type = 'button'; j.className = 'pro-jar-button'; j.id = 'pro-jar-button'; j.setAttribute('aria-label', '碎片罐');
      j.innerHTML = '<canvas id="pro-jar-mini" aria-hidden="true"></canvas><span class="pro-lock-badge" id="pro-jar-lock">' + icon('lock') + '</span>';
      side.prepend(j); j.addEventListener('click', () => isPro() ? openJar() : openSheet('jar'));
    }
    // Today: countdowns under the heading
    const top = document.querySelector('#tasks-panel .today-top');
    if (top) { const c = document.createElement('div'); c.className = 'pro-countdowns'; c.id = 'pro-countdowns'; top.after(c); }
    // Lock view (Android): countdowns under the clock
    const clock = document.querySelector('.lock-clock');
    if (clock) { const c = document.createElement('div'); c.className = 'pro-countdowns lock-countdowns'; c.id = 'pro-lock-countdowns'; clock.after(c); }
    // 外观: Pro themes and effects stay visible with a lock
    const appLook = document.querySelector('.look-section[data-look=app] .ui-styles');
    if (appLook) { const f = document.createElement('fieldset'); f.className = 'pro-look'; f.id = 'pro-look'; appLook.after(f); }
    const motionSet = document.querySelector('.motion-settings');
    if (motionSet) { const f = document.createElement('div'); f.className = 'pro-effects-inline'; f.id = 'pro-effects-inline'; motionSet.append(f); }
    document.addEventListener('click', e => { if (e.target.closest('[data-settings-page=look]')) loadThumbFonts(); }, true);
    // Choosing a free interface style takes off a Pro theme
    document.addEventListener('click', e => { if (e.target.closest('[data-ui-style]') && S().proTheme) { S().proTheme = ''; setTimeout(() => { applyTheme(); refreshAll(); }, 0); } }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('pro-celebrate').hidden) closeCelebrate(); else if (!$('pro-jar-sheet').hidden) closeJar(); else if (!$('pro-sheet').hidden) closeSheet(); } });
  }

  function themeMock(id) { return window.SuiSuiSkins.mock(id); }
  function loadThumbFonts() { /* the themes use system and bundled fonts only; nothing to wait for */ }
  function renderLookInline() {
    // a Pro theme replaces the free style, so the free style cards show nothing selected while one is on
    if (activeTheme()) document.querySelectorAll('[data-ui-style]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    const f = $('pro-look'), rail = $('theme-rail'); if (!f || !rail) return;
    const pro = isPro(), cur = tryOn || (pro ? savedTheme() || '' : '');
    // One gallery: the three free looks, then 随光 and the Pro themes, each pictured by its real home screen
    rail.querySelectorAll('[data-pro-theme-pick]').forEach(b => b.remove());
    rail.insertAdjacentHTML('beforeend', ['auto', ...ORDER].map(id => {
      const on = cur === id, name = id === 'auto' ? '随光' : THEMES[id].full;
      return `<button type="button" class="theme-card pro-theme-chip${on ? ' active' : ''}" data-pro-theme-pick="${id}" aria-pressed="${on}"><span class="theme-shot"><img src="assets/themes/${id}${SHOT()}.jpg" alt="" decoding="async"></span><strong>${name}</strong><small>${on ? '使用中' : 'Pro'}</small>${pro ? '' : `<span class="pro-lock-badge">${icon('lock')}</span>`}</button>`;
    }).join(''));
    rail.querySelectorAll('[data-pro-theme-pick]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.proThemePick;
      if (isPro() && S().proTheme === id) return; // the gallery picks; it never switches a theme off
      setTheme(id);
    }));
    rail.querySelectorAll('[data-ui-style] img').forEach(i => { const want = `assets/themes/ui-${i.closest('[data-ui-style]').dataset.uiStyle}${SHOT()}.jpg`; if (!i.src.endsWith(want)) i.src = want; });
    rail.querySelectorAll('[data-ui-style]').forEach(b => { b.querySelector('small').textContent = !cur && b.classList.contains('active') ? '使用中' : '免费'; });
    const ABOUT = { glass: '手机壁纸铺在底下，半透明的玻璃质感', paper: '米白纸面，大号日期，像一本手账', night: '纯黑底，荧光色点缀，夜里看不刺眼' };
    const about = $('theme-about');
    if (about) {
      const free = S().uiStyle;
      about.innerHTML = cur === 'auto' ? `<b>随光</b>早上琉璃，白天素笺，晚上星河，跟着时间换`
        : cur ? `<b>${THEMES[cur].full}</b>${THEMES[cur].line}` : `<b>${({ glass: '玻璃', paper: '纸墨', night: '夜光' })[free] || ''}</b>${ABOUT[free] || ''}`;
    }
    // keep the chosen theme in view: when the gallery first appears, and when the choice changes
    const place = smooth => { const sel = rail.querySelector('.theme-card.active'), r = rail.getBoundingClientRect(); if (!sel || !r.width) return false;
      const c = sel.getBoundingClientRect(); if (c.left < r.left + 30 || c.right > r.right - 30) rail.scrollBy({ left: c.left - r.left - 36, behavior: smooth ? 'smooth' : 'auto' }); return true; };
    if (rail.dataset.placed !== (cur || 'free')) { if (place(true)) rail.dataset.placed = cur || 'free'; }
    if (!rail._watch && window.ResizeObserver) { rail._watch = new ResizeObserver(() => { const k = rail.querySelector('.theme-card.active')?.dataset.proThemePick || 'free'; if (rail.dataset.placed !== k && place(false)) rail.dataset.placed = k; }); rail._watch.observe(rail); }
    // the theme's wallpaper: use it on the lock screen, or save it to set as the phone's own wallpaper
    const wid = activeTheme();
    f.innerHTML = ''; f.hidden = !(pro && wid);
    if (pro && wid) {
      f.insertAdjacentHTML('beforeend', `<div class="pro-wall-row"><img src="assets/wallpapers/pro-${wid}-thumb.jpg" alt="" aria-hidden="true"><span><b>「${THEMES[wid].full}」专属壁纸</b><small>锁屏和预览都用它；存到相册，也能设成手机壁纸</small></span>
        <label class="pro-wall-switch"><input type="checkbox" class="switch" id="pro-wall-inline" ${S().proWall !== false ? 'checked' : ''} aria-label="锁屏用主题壁纸"></label><button type="button" class="secondary-button" id="pro-wall-save">保存到相册</button></div>`);
      $('pro-wall-inline').addEventListener('change', e => { S().proWall = e.target.checked; persist(); applyTheme(); });
      $('pro-wall-save').addEventListener('click', () => saveWallpaper(wid));
    }
    const e = $('pro-effects-inline');
    if (e) {
      const curE = S().proEffect || 'auto';
      e.innerHTML = `<div class="ag-row"><h3 class="ag-title">完成动效${pro ? '' : '<span class="pro-pill">Pro</span>'}</h3><span class="fx-hint">点一个，下面先演示一遍</span></div>
        <div class="fx-stage" id="fx-stage" aria-live="polite"><div class="fx-sample" id="fx-sample"><span class="fx-sample-check" aria-hidden="true"></span><span class="fx-sample-text" id="fx-sample-text">写完周报</span></div><button type="button" class="fx-replay" id="fx-replay">${icon('play')}<span>再看一次</span></button></div>
        <div class="pro-effect-row">${Object.keys(EFFECTS).map(id => `<button type="button" class="chip${pro && curE === id ? ' active' : ''}" data-pro-effect-pick="${id}">${EFFECTS[id]}${pro ? '' : icon('lock', 'pro-chip-lock')}</button>`).join('')}</div>`;
      e.querySelectorAll('[data-pro-effect-pick]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.proEffectPick;
        if (!isPro()) { previewEffect(id); return; } // free: see it first; choosing still needs Pro
        S().proEffect = id; persist(); renderLookInline(); previewEffect(id);
      }));
      $('fx-replay').addEventListener('click', () => previewEffect(isPro() ? (S().proEffect || 'auto') : 'auto'));
    }
    API.icons(f); if (e) API.icons(e);
  }

