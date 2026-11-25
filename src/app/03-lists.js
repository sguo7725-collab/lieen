  /* ---------- Lists ---------- */
  function pending() { return state.tasks.filter(t => !t.done && dueToday(t)).sort((a, b) => Number(b.pinned) - Number(a.pinned)); }
  function later() { const today = dayKey(); return state.tasks.filter(t => !t.done && !dueToday(t, today)).sort((a, b) => nextDue(a, today).localeCompare(nextDue(b, today))); }
  function doneList() { return state.tasks.filter(t => t.done).sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0)); }
  /** Lock card order: today's pending (pinned first), then finished items in completion order. */
  function cardTasks() { return [...pending(), ...doneList()]; }

  const isPhone = () => matchMedia('(max-width:760px)').matches;
  // Small entrance motion for views and settings pages (skipped with reduced motion).
  function enter(el, cls) {
    if (!el || !state.settings.motion || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // restarting a running entrance needs a reflow; starting a fresh one does not (that reflow cost a whole frame on phones)
    if (el.classList.contains('view-enter') || el.classList.contains('page-enter') || el.classList.contains('page-back')) { el.classList.remove('view-enter', 'page-enter', 'page-back'); void el.offsetWidth; }
    el.classList.add(cls);
    // Children animate inside the page (rows cascade); only the page's own animation ends the entrance, with a timer as backstop.
    const token = el._enter = {};
    const done = e => { if (e && e.target !== el) return; el.removeEventListener('animationend', done); if (el._enter === token) el.classList.remove(cls); };
    el.addEventListener('animationend', done); setTimeout(done, 1100);
  }
  // Large title collapses into the top bar once it scrolls away (phones).
  window.addEventListener('scroll', () => { document.body.classList.toggle('scrolled', window.scrollY > 72); }, { passive: true });
  function setView(view) {
    if (!['tasks', 'settings', 'review'].includes(view)) view = 'tasks';
    // back to the top first, while layout is clean; scrollY is cached, so checking it costs nothing
    if (isPhone() && window.scrollY) window.scrollTo({ top: 0, behavior: 'instant' });
    closeAdd(); closeSearch();
    document.body.dataset.view = view;
    document.querySelectorAll('.nav-button[data-view]').forEach(b => { b.classList.toggle('selected', b.dataset.view === view); b.setAttribute('aria-pressed', String(b.dataset.view === view)); });
    const settings = view === 'settings';
    const changed = document.body.dataset.shown !== view;
    document.body.dataset.shown = view;
    $('settings-panel').hidden = !settings;
    $('review-panel').hidden = view !== 'review';
    $('tasks-panel').hidden = view !== 'tasks';
    if (changed) enter({ tasks: $('tasks-panel'), settings: $('settings-panel'), review: $('review-panel') }[view], 'view-enter');
    if (view === 'review') renderReview();
    if (settings) openSettingsPage('index', changed);
    else updateWallpaperHole();
  }
  /* Settings: an index of four pages instead of one long scroll. */
  const SETTINGS_TITLES = { index: '设置', look: '外观', lock: '锁屏与隐私', list: '分组与每日整理', data: '数据与备份', language: '语言' };
  function openSettingsPage(page, fresh = false) {
    if (!SETTINGS_TITLES[page]) page = 'index';
    const deeper = page !== 'index' && settingsPage === 'index', back = page === 'index' && settingsPage !== 'index';
    settingsPage = page;
    if (!fresh) $('settings-scroll').scrollTop = 0; // before the pages change, while layout is still clean (a panel that was hidden starts at the top anyway)
    document.body.dataset.settingsPage = page;
    $('settings-index').hidden = page !== 'index';
    document.querySelectorAll('.settings-page').forEach(p => { p.hidden = p.dataset.page !== page; });
    $('settings-title').textContent = SETTINGS_TITLES[page];
    $('settings-back').hidden = page === 'index';
    if (deeper) enter(document.querySelector(`.settings-page[data-page="${page}"]`), 'page-enter');
    if (back) enter($('settings-index'), 'page-back');
    if (page === 'index') renderSettingsSummary();
    if (page === 'lock') renderNotifySetting();
    if (page === 'look') ensureCuteFonts();
    updateWallpaperHole();
    icons($('settings-panel'));
  }
  // Android: leave a transparent hole where the settings preview is, so the real wallpaper shows in it.
  function updateWallpaperHole() {
    const on = useSystemWallpaper() && !LOCK_MODE && document.body.dataset.view === 'settings' && ['look', 'lock'].includes(settingsPage);
    document.documentElement.classList.toggle('wallpaper-hole', on);
  }
  function themeName() {
    const s = state.settings;
    const hit = Object.values(THEMES).find(t => ['cardColor', 'cardMaterial', 'cardTransparency', 'cardText'].every(k => String(t[k]).toLowerCase() === String(s[k]).toLowerCase()));
    return hit ? hit.name : '自定义';
  }
  function renderSettingsSummary() {
    const s = state.settings;
    // Settings home: a live preview of the lock card on the wallpaper, then one line per section with its current value.
    $('sum-look').textContent = (() => { try { return window.SuiSuiPro?.themeLabel?.() || ''; } catch { return ''; } })() || `${UI_STYLES[s.uiStyle]} · ${themeName()}`;
    const photo = proPaper()?.src || (s.wallpaper === 'custom' && s.photo ? s.photo : s.wallpaper === 'system' ? '' : wallpaperOf(s.wallpaper).src);
    const img = $('tile-look-photo');
    if (photo) { if (img.getAttribute('src') !== photo) img.src = photo; img.hidden = false; img.classList.toggle('monochrome', s.wallpaper === 'mono'); } else img.hidden = true;
    const card = $('home-card'), mini = $('mini-card');
    ['--card-bg', '--card-ink', '--card-blur', '--card-check', '--card-on-check'].forEach(k => card.style.setProperty(k, mini.style.getPropertyValue(k) || $('activity').style.getPropertyValue(k)));
    const open = pending();
    $('home-card-count').textContent = $('activity-count').textContent;
    // 1.18: the settings strip is a small glance — plain rows, also when the lock screen groups them (the 外观 preview shows the groups)
    card.classList.remove('grouped');
    $('home-card-rows').outerHTML = `<span id="home-card-rows">${s.lockPrivacy ? `<span>${open.length ? `今天还有 ${open.length} 件待办` : '今天的事都完成了'}</span>` : (open.length ? open.slice(0, 3).map(t => `<span>${esc(t.title)}</span>`).join('') : '<span>今天，留一点空白。</span>')}</span>`;
    const on = IOS_APP ? !!iosStatus().live : ANDROID ? (s.lockScreen || s.lockNotify) : s.lockNotify;
    $('tile-lock-state').textContent = s.lockPrivacy ? '隐藏内容' : on ? '已开启' : '未开启';
    $('tile-lock').classList.toggle('is-on', !!on);
    $('sum-list').innerHTML = `${state.groups.slice(0, 4).map(g => `<span class="dot" style="background:${g.color}"></span>`).join('')}${state.groups.length} 个`;
    $('sum-lang').textContent = s.lang === 'en' ? 'English' : '简体中文';
    renderBackupState();
  }

