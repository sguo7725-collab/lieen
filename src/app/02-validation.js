  /* ---------- Validation: one path for stored data, imports and native apps ---------- */
  function normalizeTask(t) {
    if (!t || typeof t.id !== 'string' || !t.id || typeof t.title !== 'string' || !t.title.trim()) return null;
    const repeat = repeats[t.repeat] ? t.repeat : 'none';
    return {
      id: t.id.slice(0, 80), title: t.title.trim().slice(0, 120),
      group: typeof t.group === 'string' && t.group ? t.group.slice(0, 40) : 'work',
      pinned: !!t.pinned, done: !!t.done, completedAt: Number.isFinite(t.completedAt) ? t.completedAt : 0,
      repeat, repeatDay: repeat === 'weekly' && Number.isInteger(t.repeatDay) && t.repeatDay >= 0 && t.repeatDay <= 6 ? t.repeatDay : (repeat === 'weekly' ? weekday(dayKey()) : null),
      date: repeat === 'none' && isDayKey(t.date) ? t.date : '',
      // Optional time box in minutes: tasks with one get a start button and a countdown.
      duration: Number.isInteger(t.duration) && t.duration > 0 && t.duration <= 600 ? t.duration : 0,
      focusMs: Number.isFinite(t.focusMs) && t.focusMs > 0 ? Math.min(t.focusMs, 864e5) : 0,
      // Reminder time on the day the task is due (HH:MM), a note, and a small checklist.
      time: typeof t.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t.time) ? t.time : '',
      // 1.18: a time is only shown on the task unless the user picked 响铃 for it.
      ring: !!t.ring && typeof t.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t.time),
      note: typeof t.note === 'string' ? t.note.slice(0, 2000) : '',
      subtasks: (Array.isArray(t.subtasks) ? t.subtasks : []).filter(s => s && typeof s.title === 'string' && s.title.trim()).slice(0, 30)
        .map((s, i) => ({ id: typeof s.id === 'string' && s.id ? s.id.slice(0, 40) : `s${i}`, title: s.title.trim().slice(0, 120), done: !!s.done })),
      createdAt: Number.isFinite(t.createdAt) ? t.createdAt : 0
    };
  }
  /** Completion log: one line per finish, kept after repeating tasks reset, for the weekly/monthly review. */
  function normalizeLog(list) {
    return (Array.isArray(list) ? list : []).filter(e => e && typeof e.id === 'string' && typeof e.title === 'string' && Number.isFinite(e.at) && e.at > 0)
      .map(e => ({ id: e.id.slice(0, 80), title: e.title.slice(0, 120), group: typeof e.group === 'string' ? e.group.slice(0, 40) : 'work', at: e.at, min: Number.isFinite(e.min) && e.min > 0 ? Math.round(e.min) : 0 }))
      .sort((a, b) => a.at - b.at).slice(-LOG_LIMIT);
  }
  function backfillLog(tasks, archive) {
    return normalizeLog([...tasks, ...archive].filter(t => t.done && t.completedAt > 1e12).map(t => ({ id: t.id, title: t.title, group: t.group, at: t.completedAt, min: 0 })));
  }
  function normalizeTimer(t, tasks) {
    if (!t || typeof t.id !== 'string' || !tasks.some(x => x.id === t.id && !x.done)) return null;
    const total = Number(t.total) || 0, endsAt = Number(t.endsAt) || 0, left = Number(t.left) || 0;
    if (total <= 0 || (!endsAt && left <= 0)) return null;
    return { id: t.id, total, endsAt, left: endsAt ? 0 : Math.min(left, total) };
  }
  function normalizeArchived(t) {
    const task = normalizeTask(t);
    return task && { ...task, done: true, archivedAt: Number.isFinite(t.archivedAt) ? t.archivedAt : Date.now() };
  }
  function uniqueTasks(list, normalizer = normalizeTask) {
    const ids = new Set();
    return (Array.isArray(list) ? list : []).map(normalizer).filter(t => t && !ids.has(t.id) && ids.add(t.id));
  }
  function normalizeGroups(list) {
    const ids = new Set();
    const out = (Array.isArray(list) ? list : []).filter(g => g && typeof g.id === 'string' && g.id && typeof g.name === 'string' && g.name.trim() && !ids.has(g.id) && ids.add(g.id))
      .slice(0, 12).map(g => ({ id: g.id.slice(0, 40), name: g.name.trim().slice(0, 12), color: /^#[0-9a-f]{6}$/i.test(g.color) ? g.color : GROUP_COLORS[ids.size % GROUP_COLORS.length],
        // 1.12: a line icon in front of the group's card title on the lock screen; the two built-in groups get one.
        icon: GROUP_ICONS.includes(g.icon) ? g.icon : g.icon === '' ? '' : ({ work: 'briefcase', life: 'leaf' }[g.id] || '') }));
    return out.length ? out : structuredClone(DEFAULT_GROUPS);
  }
  function groupOf(id) { return state.groups.find(g => g.id === id) || state.groups[0]; }
  function cleanSettings(raw) {
    const s = { ...defaults, ...(raw && typeof raw === 'object' ? raw : {}) };
    if (raw && typeof raw === 'object' && !raw.palette2) {
      // 1.7 palette: the old default green becomes 墨黑 (and so does the old default lock card colour).
      if (OLD_ACCENT[s.accent]) s.accent = OLD_ACCENT[s.accent];
      if (String(s.cardColor).toLowerCase() === '#112b24' && Number(s.cardTransparency) === 15) { s.cardColor = '#1c1c1e'; s.cardTransparency = 18; }
      s.palette2 = true;
    }
    if (!palette[s.accent]) s.accent = defaults.accent;
    if (!UI_STYLES[s.uiStyle]) s.uiStyle = defaults.uiStyle;
    if (!['zh', 'en'].includes(s.lang)) s.lang = defaults.lang;
    if (!['compact', 'comfortable'].includes(s.density)) s.density = defaults.density;
    if (!['system', 'custom'].includes(s.wallpaper) && !WALLPAPERS.some(w => w.id === s.wallpaper)) s.wallpaper = 'lake';
    if (typeof s.photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(s.photo)) s.photo = '';
    if (s.wallpaper === 'custom' && !s.photo) s.wallpaper = 'lake';
    s.intensity = Math.min(3, Math.max(1, Number(s.intensity) || 2));
    if (!FONTS[s.font]) s.font = 'system';
    s.textSize = Number.isInteger(s.textSize) && s.textSize >= 0 && s.textSize <= 3 ? s.textSize : 1;
    if (!['frosted', 'glass', 'flat'].includes(s.cardMaterial)) s.cardMaterial = defaults.cardMaterial;
    if (typeof s.cardColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(s.cardColor)) s.cardColor = defaults.cardColor;
    if (!['auto', 'light', 'dark'].includes(s.cardText)) s.cardText = 'auto';
    s.cardTransparency = Math.min(90, Math.max(0, Number(s.cardTransparency) || 0));
    ['palette2', 'motion', 'autoArchive', 'lockNotify', 'lockScreen', 'lockPrivacy', 'installDismissed', 'androidSetupSeen', 'iosSetupSeen', 'tipsSeen', 'wallpaperPicked', 'remindRing'].forEach(k => { s[k] = !!s[k]; });
    return s;
  }
  function applySaved(saved) {
    if (!saved || !Array.isArray(saved.tasks)) return false;
    state.groups = normalizeGroups(saved.groups);
    state.tasks = uniqueTasks(saved.tasks);
    state.archive = uniqueTasks(saved.archive, normalizeArchived).slice(-ARCHIVE_LIMIT);
    state.settings = cleanSettings(saved.settings);
    // Records from schema 1 have no day marker: treat them as today so nothing is archived on upgrade.
    state.day = isDayKey(saved.day) ? saved.day : dayKey();
    // Every save bumps rev; the Android side refuses a save older than what it has (a stale page in the background).
    state.rev = Number.isFinite(saved.rev) ? saved.rev : 0;
    state.log = Array.isArray(saved.log) ? normalizeLog(saved.log) : backfillLog(state.tasks, state.archive);
    state.timer = normalizeTimer(saved.timer, state.tasks);
    return true;
  }

  // Android app shell (android/): the native side keeps a copy for the lock-screen card and may change it
  // (a "完成" tap on the lock screen). The wallpaper photo stays in localStorage only.
  const ANDROID = SHOWCASE ? null : window.SuiSuiAndroid || null;
  // iPhone app shell (ios/): the same page in a WKWebView with the same bridge, plus native widgets and Live Activity.
  const IOS_APP = SHOWCASE ? null : window.SuiSuiIOS || null;
  // the iPhone app's web view runs under the status bar: styles.css pads the pages that have no home header
  if (IOS_APP) document.documentElement.classList.add('ios-shell');
  const NATIVE = ANDROID || IOS_APP;
  let lastNativeRaw = '';
  function readNative() { try { return NATIVE ? NATIVE.load() || '' : ''; } catch { return ''; } }
  let hadSaved = false;
  let savedPhoto = null, photoOK = true, lastContent = null;
  const contentOf = () => JSON.stringify({ ...state, rev: 0, settings: { ...state.settings, photo: '' } });
  try {
    const local = SHOWCASE ? null : JSON.parse(localStorage.getItem(STORE) || 'null');
    let photo = '';
    try { photo = SHOWCASE ? '' : localStorage.getItem(PHOTO_KEY) || local?.settings?.photo || ''; } catch { /* ignore */ }
    const nativeRaw = readNative();
    const native = nativeRaw ? JSON.parse(nativeRaw) : null;
    let bootRecord = null;
    if (native && Array.isArray(native.tasks)) {
      bootRecord = native;
      lastNativeRaw = nativeRaw;
      native.settings = { ...(native.settings || {}), photo };
      hadSaved = applySaved(native);
    } else {
      if (local) local.settings = { ...(local.settings || {}), photo };
      hadSaved = applySaved(local);
      bootRecord = local;
    }
    // What is stored now; the first save only writes (and bumps rev) if loading changed anything (upgrades, new defaults).
    lastContent = hadSaved ? JSON.stringify({ ...bootRecord, rev: 0, settings: { ...bootRecord.settings, photo: '' } }) : null;
    savedPhoto = state.settings.photo;
  } catch { storageOK = false; }
  // On Android the lock screen is the main feature, so it starts switched on.
  if (ANDROID && !hadSaved) { state.settings.lockNotify = true; state.settings.lockScreen = true; }
  // Android 1.1+: the window shows the phone's own wallpaper behind the page, so previews use the real wallpaper.
  let SYSTEM_WALLPAPER = false;
  try { SYSTEM_WALLPAPER = !!ANDROID && !!ANDROID.hasSystemWallpaper(); } catch { SYSTEM_WALLPAPER = false; }
  // Until the user picks one from the library, the Android app uses the phone's own wallpaper.
  if (SYSTEM_WALLPAPER && !state.settings.wallpaperPicked) state.settings.wallpaper = 'system';
  // Pro: while a Pro theme is on, its own wallpaper can stand in for the chosen one (window.SuiSuiPro.wallpaper()).
  const proPaper = () => { try { return window.SuiSuiPro?.wallpaper?.() || null; } catch { return null; } };
  const useSystemWallpaper = () => SYSTEM_WALLPAPER && state.settings.wallpaper === 'system' && !proPaper();
  let LOCK_MODE = false;
  try { LOCK_MODE = !!ANDROID && (ANDROID.isLockMode() || new URLSearchParams(location.search).get('mode') === 'lock'); } catch { LOCK_MODE = false; }
  if (SHOWCASE && SHOW_VIEW === 'lock') LOCK_MODE = true;

  function icon(name, attrs = '') { return `<i data-lucide="${name}" ${attrs}></i>`; }
  function icons(root = document) { window.lucide.createIcons({ root, attrs: { 'aria-hidden': 'true' } }); }
  function esc(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
  function storageCopy() { return storageOK ? (persisted ? '保存在本机 · 已开启长期保存' : '保存在本机') : '未能保存，请先导出备份'; }
  function save() {
    if (SHOWCASE) return; // a picture of the app, nothing to keep
    state.schema = SCHEMA;
    const content = contentOf();
    if (content === lastContent && savedPhoto === state.settings.photo) { $('storage-status').textContent = storageCopy(); scheduleLockNotification(); return; }
    // Bump the revision only for real changes, so an untouched page never claims to be newer.
    if (content !== lastContent) state.rev = (state.rev || 0) + 1;
    const record = JSON.stringify({ ...state, settings: { ...state.settings, photo: '' } });
    if (NATIVE) {
      let accepted = true;
      try { accepted = NATIVE.save(record) !== false; } catch { /* bridge unavailable */ }
      if (!accepted) {
        // Another screen (lock view, lock-screen card) saved newer data: take it instead of overwriting it.
        syncFromNative(true);
        return;
      }
      lastNativeRaw = record;
    }
    lastContent = content;
    try { localStorage.setItem(STORE, record); storageOK = true; }
    catch { storageOK = false; }
    if (savedPhoto !== state.settings.photo) {
      try { state.settings.photo ? localStorage.setItem(PHOTO_KEY, state.settings.photo) : localStorage.removeItem(PHOTO_KEY); photoOK = true; savedPhoto = state.settings.photo; }
      catch { photoOK = false; }
    }
    $('storage-status').textContent = storageCopy();
    scheduleLockNotification();
  }
  // Called by the Android shell when the lock-screen card changed the data (or on resume).
  // Take the stored native copy if it changed since this page last read or wrote it.
  function syncFromNative(force = false) {
    if (!NATIVE || (isBusy() && !force)) return false;
    const raw = readNative();
    if (!raw || (raw === lastNativeRaw && !force)) return false;
    try {
      const native = JSON.parse(raw);
      native.settings = { ...(native.settings || {}), photo: state.settings.photo };
      if (!applySaved(native)) return false;
      lastNativeRaw = raw;
      lastContent = contentOf();
      try { localStorage.setItem(STORE, raw); } catch { /* ignore */ }
      if (typeof render === 'function' && document.readyState !== 'loading') { closeEdit(); render(); applySettings(); }
      return true;
    } catch { return false; }
  }
  window.suisuiNativeChanged = () => { syncFromNative(); };

