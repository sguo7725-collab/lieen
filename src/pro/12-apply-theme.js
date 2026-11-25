  /* ---------- Applying a theme to the app ---------- */
  /** The theme's own lock-screen wallpaper (scripts/make-pro-wallpapers.py) while a theme is on, unless 主题壁纸 is
      off. app.js asks for it wherever it shows the wallpaper (lock view, previews, the glass background). */
  const wallpaper = () => { const id = activeTheme(); return id && S().proWall !== false ? { src: `assets/wallpapers/pro-${id}.jpg`, thumb: `assets/wallpapers/pro-${id}-thumb.jpg`, pos: '50% 50%' } : null; };
  let wallShown = null;
  function syncWall() {
    const w = wallpaper(), html = document.documentElement;
    if (w) html.dataset.proWall = activeTheme(); else delete html.dataset.proWall;
    const key = w ? w.src : '';
    // app.js may have drawn the wallpaper before Pro loaded, so the first call redraws too when a theme wallpaper is due
    if (key !== (wallShown ?? '')) { wallShown = key; API.applySettings(); } else wallShown = key;
  }
  /** Save the theme's wallpaper as an image, to set as the phone's own lock screen. */
  function saveWallpaper(id = activeTheme() || ORDER[0]) {
    const img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); API.saveImage(c, `碎碎清单-${THEMES[id].full.replace(' · ', '')}-壁纸.jpg`); };
    img.onerror = () => API.showToast('壁纸没能读取，请再试一次');
    img.src = `assets/wallpapers/pro-${id}.jpg`;
  }
  function applyTheme() {
    const html = document.documentElement, id = activeTheme(), t = THEMES[id];
    if (API.lockMode) {
      // the lock screen follows the theme unless turned off in Pro settings
      const lock = t && S().proLock !== false ? id : '';
      if (lock) html.dataset.proLock = lock; else delete html.dataset.proLock;
      window.SuiSuiSkins.lockStrip(lock);
      syncWall();
      return;
    }
    if (!t) {
      delete html.dataset.proPreview;
      if (html.dataset.proTheme) { delete html.dataset.proTheme; window.SuiSuiSkins.unmount(); API.applySettings(); }
      syncWall();
      return;
    }
    html.dataset.proTheme = id; html.dataset.style = t.base; html.dataset.palette = 'pro';
    if (S().proLock !== false) html.dataset.proPreview = id; else delete html.dataset.proPreview;
    const r = html.style;
    r.setProperty('--accent', t.accent); r.setProperty('--accent-fill', t.accent); r.setProperty('--accent-soft', t.soft); r.setProperty('--on-accent', t.on);
    r.setProperty('--pro-font', t.font);
    if (id === 'day') r.setProperty('--app-font', t.font);
    window.SuiSuiSkins.mount(id);
    syncWall();
  }
  function setTheme(id) {
    if (!isPro()) { startTry(id === 'auto' ? byTime() : id); return; }
    S().proTheme = S().proTheme === id ? '' : id; persist(); applyTheme(); refreshAll();
  }
  let tryTimer = 0;
  function startTry(id) {
    if (id === 'auto') id = byTime();
    tryOn = id; applyTheme(); closeSheet();
    const bar = $('pro-tryon'); bar.hidden = false;
    bar.querySelector('b').textContent = `正在试穿「${THEMES[id].full}」`;
    clearTimeout(tryTimer); tryTimer = setTimeout(() => endTry(true), 90000);
    API.render(); refreshAll();
  }
  function endTry(announce) {
    if (!tryOn) return;
    tryOn = ''; clearTimeout(tryTimer); $('pro-tryon').hidden = true; applyTheme(); API.render(); refreshAll();
    if (announce) API.showToast('试穿结束，已换回原来的样子');
  }

