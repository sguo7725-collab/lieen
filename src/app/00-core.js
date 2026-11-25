  const $ = (id) => document.getElementById(id);
  // Keep the original key so existing users keep their data; the record carries its own schema number.
  const STORE = 'suisui-locktodo-v1';
  // The wallpaper photo lives under its own key: a large photo must never stop the to-dos and settings from saving.
  const PHOTO_KEY = 'suisui-wallpaper-photo';
  const SCHEMA = 2;
  const ARCHIVE_LIMIT = 300;
  const DEFAULT_GROUPS = [{ id: 'work', name: '工作', color: '#2f6fd0', icon: 'briefcase' }, { id: 'life', name: '生活', color: '#d2566f', icon: 'leaf' }];
  // Line icons a group can carry on its lock-screen card (same Lucide set as the rest of the app).
  const GROUP_ICONS = ['briefcase', 'leaf', 'house', 'book-open', 'graduation-cap', 'dumbbell', 'heart', 'shopping-bag', 'coffee', 'plane', 'music', 'gamepad-2', 'palette', 'camera', 'wallet', 'sun', 'target', 'sparkles'];
  const GROUP_COLORS = ['#2f6fd0', '#d2566f', '#e0812f', '#13765b', '#7b61c9', '#5f6368'];
  const repeats = { none: '不重复', daily: '每天', weekdays: '工作日', weekly: '每周' };
  const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  // [fill, soft background, text on dark, soft background on dark]
  // [fill, soft background, text on dark, soft background on dark, fill on dark]
  const palette = {
    ink: ['#1d1d1f', '#efeff1', '#f2f2f4', '#2c2c2e', '#48484c'],
    orange: ['#e05a33', '#fdeee8', '#ff9b78', '#3a2219', '#e05a33'],
    indigo: ['#4c5bd4', '#eceffd', '#a3adff', '#23284a', '#5866de'],
    berry: ['#cf3d66', '#fcebf0', '#ff8fae', '#3d1f29', '#d4456d'],
    green: ['#13765b', '#e9f3ee', '#5cc59c', '#1a362c', '#13765b'],
    lime: ['#d8ff3d', '#2a3310', '#d8ff3d', '#232a0c', '#d8ff3d']
  };
  // Interface styles (1.9): the whole app's look. 荧光 (lime) only exists in 夜光, which is always dark.
  const UI_STYLES = { glass: '玻璃', paper: '纸墨', night: '夜光' };
  const accentOf = s => s.accent === 'lime' && s.uiStyle !== 'night' ? 'ink' : s.accent;
  // Accent ramp behind the deep panels (focus bar, lock tiles), glows on dark and tinted shadows; 950 is darkest.
  const RAMP_STEPS = ['50', '100', '200', '300', '500', '700', '800', '900', '950'];
  const ramps = {
    ink: ['#f8f8fa', '#f2f2f4', '#e5e5ea', '#f5f5f7', '#8e8e93', '#3a3a3c', '#242426', '#151516', '#000000'],
    orange: ['#fff6f2', '#fdeee8', '#ffd3c2', '#ffb59a', '#f07a52', '#d9532f', '#7c2a12', '#4a1a0a', '#2a0f05'],
    indigo: ['#f5f6ff', '#eceffd', '#d3d8ff', '#b9c1ff', '#7682ea', '#4553cc', '#1d2470', '#141a4a', '#0b0e2a'],
    berry: ['#fff4f7', '#fcebf0', '#ffd1de', '#ffb3c8', '#e86d8f', '#c7385f', '#6b1430', '#4a1022', '#2a0912'],
    green: ['#f4fbf7', '#e9f5ee', '#c6eed2', '#7fe0b4', '#30b07f', '#1b6e56', '#0f4d3c', '#0b3a2d', '#08291f'],
    lime: ['#f7ffd6', '#eaffa0', '#e2ff73', '#d8ff3d', '#b8e02a', '#3a3a3c', '#242426', '#151516', '#000000']
  };
  // Settings saved before 1.7 used green/rose/blue; green was simply the old default.
  const OLD_ACCENT = { green: 'ink', rose: 'berry', blue: 'indigo' };
  const darkScheme = matchMedia('(prefers-color-scheme: dark)');
  // One-tap looks; the detailed controls stay under “更多外观设置”.
  const THEMES = {
    ink: { name: '墨黑', cardColor: '#1c1c1e', cardMaterial: 'frosted', cardTransparency: 18, cardText: 'auto' },
    graphite: { name: '石墨', cardColor: '#202326', cardMaterial: 'frosted', cardTransparency: 22, cardText: 'auto' },
    mist: { name: '雾白', cardColor: '#f5f7f3', cardMaterial: 'glass', cardTransparency: 28, cardText: 'auto' },
    lake: { name: '湖蓝', cardColor: '#294c64', cardMaterial: 'frosted', cardTransparency: 18, cardText: 'auto' },
    plum: { name: '梅紫', cardColor: '#563746', cardMaterial: 'frosted', cardTransparency: 18, cardText: 'auto' },
    pine: { name: '松林', cardColor: '#112b24', cardMaterial: 'frosted', cardTransparency: 15, cardText: 'auto' }
  };
  // Built-in wallpaper library (scripts/make-wallpapers.py makes the generated ones). "system" = the phone's own wallpaper (Android app).
  const WALLPAPERS = [
    { id: 'lake', name: '湖畔', src: 'assets/lake.jpg', thumb: 'assets/lake.jpg', pos: '52% 82%' },
    { id: 'mono', name: '黑白', src: 'assets/lake.jpg', thumb: 'assets/lake.jpg', pos: '52% 82%', mono: true },
    ...[['mist', '晨雾'], ['dusk', '暮山'], ['forest', '深林'], ['sea', '海面'], ['night', '月夜'], ['aurora', '极光'], ['dunes', '沙丘'], ['pine', '松绿']]
      .map(([id, name]) => ({ id, name, src: `assets/wallpapers/${id}.jpg`, thumb: `assets/wallpapers/${id}-thumb.jpg`, pos: '50% 60%' }))
  ];
  const wallpaperOf = id => WALLPAPERS.find(w => w.id === id) || WALLPAPERS[0];
  const FONTS = { system: '默认', song: '宋体', kai: '楷体', round: '圆体', kuaile: '快乐体', huangyou: '黄油体', shouxie: '手写体' };
  // Bundled cute fonts load their CSS only when needed (it lists ~280 small font pieces).
  const CUTE = ['kai', 'round', 'kuaile', 'huangyou', 'shouxie'];
  function ensureCuteFonts() { if (document.getElementById('cute-fonts')) return; const l = document.createElement('link'); l.id = 'cute-fonts'; l.rel = 'stylesheet'; l.href = 'fonts-cute.css'; document.head.append(l); }
  const TEXT_SIZES = [['小', .9], ['标准', 1], ['大', 1.12], ['特大', 1.26]];
  const defaults = { font: 'system', textSize: 1, tipsSeen: false, wallpaperPicked: false, accent: 'ink', palette2: true, uiStyle: 'glass', lang: 'zh', density: 'comfortable', wallpaper: 'lake', photo: '', motion: !matchMedia('(prefers-reduced-motion: reduce)').matches, intensity: 2, cardMaterial: 'frosted', cardColor: '#1c1c1e', cardTransparency: 18, cardText: 'auto', autoArchive: true, lockNotify: false, lockScreen: false, lockPrivacy: false, installDismissed: false, androidSetupSeen: false, lastBackup: 0, backupNudged: 0, firstUse: 0 };
  const examples = () => [
    { id: 'seed-1', title: '把锁屏待办的想法做出来', group: 'work', pinned: true },
    { id: 'seed-2', title: '整理今天的拍摄素材', group: 'work' },
    { id: 'seed-3', title: '给家里打个电话', group: 'life' },
    { id: 'seed-4', title: '出门走走，至少二十分钟', group: 'life', repeat: 'daily' },
    { id: 'seed-5', title: '把下周的选题记下来', group: 'work' },
    { id: 'seed-6', title: '读完床头的那一章', group: 'life' }
  ].map(normalizeTask);
  // First use starts empty. The sample list exists only for automated checks and demos (window.SUISUI_DEMO).
  // Showcase (1.18): the Pro page shows the real app in a theme inside a frame (?showcase=<theme>&view=home|lock|fx).
  // It uses the sample list and never reads or writes the user's saved data.
  const SHOW_Q = (() => { try { return new URLSearchParams(location.search); } catch { return new URLSearchParams(''); } })();
  const SHOWCASE = SHOW_Q.get('showcase') || '', SHOW_VIEW = SHOW_Q.get('view') || 'home';
  if (SHOWCASE) document.documentElement.classList.add('showcase');
  const DEMO = !!window.SUISUI_DEMO || !!SHOWCASE;
  const LOG_LIMIT = 3000;
  let state = { schema: SCHEMA, rev: 0, tasks: DEMO ? examples() : [], archive: [], groups: structuredClone(DEFAULT_GROUPS), settings: { ...defaults }, day: dayKey(), log: [], timer: null };
  if (SHOWCASE) Object.assign(state.settings, { tipsSeen: true, installDismissed: true, androidSetupSeen: true, iosSetupSeen: true, motion: true, lockScreen: true });
  if (SHOWCASE && new URLSearchParams(location.search).get('lang') === 'en') state.settings.lang = 'en';
  if (SHOWCASE && UI_STYLES[SHOWCASE.replace(/^ui-/, '')]) state.settings.uiStyle = SHOWCASE.replace(/^ui-/, ''); // the free styles get pictured the same way
  let filter = 'all', editing = null, settingsPage = 'index', toastTimer, undoAction = null, storageOK = true, persisted = false, pendingImport = null, installPrompt = null;
  // Tasks whose shatter animation is still playing. Other tasks stay tappable meanwhile.
  const completing = new Set();
  const isBusy = () => completing.size > 0;

