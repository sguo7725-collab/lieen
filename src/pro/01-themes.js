  /* ---------- Themes: each one is a whole world (colours, type, shard material, completion effect, sound) ---------- */
  const SANS = 'Geist,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif', SONG = '"Noto Serif SC","Songti SC","STSong","Noto Serif CJK SC","Source Han Serif SC","SimSun",serif';
  const SERIF = '"Bodoni Moda","Didot","Bodoni 72","Playfair Display","Noto Serif","Times New Roman",serif';
  /* Six Pro themes. Each draws today in its own way — 晨 a measuring glass, 昼 a copybook line, 夜 a constellation,
     晕 colour drops blooming in water, 乐 a music-box strip, 印 a risograph print — with its own check, screens and weekly
     picture. Shared: things break into pieces when done, in the theme's material, and the pieces go into the jar.
     (暮 · 金 was removed in v8; a saved 'dusk' shows 夜.) */
  const THEMES = {
    dawn: { name: '晨', full: '琉璃', en: 'Prism', line: '一只玻璃杯，做完一件，倒进一层颜色', base: 'glass', material: 'glass', effect: 'shards', sound: 'glass', accent: '#1b1d24', soft: '#1b1d240f', on: '#ffffff',
      shards: ['#9d97ff', '#7fdcc6', '#ffb79c', '#93b8ff'], bg: '#eef0f4', ink: '#1b1d24', muted: '#5c6170', mode: 'multiply', font: SANS, display: SANS },
    day: { name: '昼', full: '素笺', en: 'Washi', line: '稿纸一格写一字，做完盖一枚红印', base: 'paper', material: 'paper', effect: 'shards', sound: 'paper', accent: '#1d1a16', soft: '#1d1a160f', on: '#f5f2ec',
      shards: ['#fbf8f1', '#e9e2d4', '#d9d0bf', '#1d1a16', '#b43a2c'], bg: '#f5f2ec', ink: '#1d1a16', muted: '#6b645b', mode: 'source-over', font: SONG, display: SONG },
    night: { name: '夜', full: '星河', en: 'Nocturne', line: '每件事是一颗星，做完连成今天的星座', base: 'night', material: 'light', effect: 'shards', sound: 'night', accent: '#dfe6ff', soft: '#dfe6ff1a', on: '#07080d',
      shards: ['#dfe6ff', '#9fb4ff', '#ffffff', '#ffd9a0'], bg: '#07080d', ink: '#e8ecf7', muted: '#959cb0', mode: 'screen', font: SANS, display: SANS },
    bloom: { name: '晕', full: '洇色', en: 'Aquarelle', line: '每做完一件，滴一滴颜色，开成一朵花', base: 'paper', material: 'bloom', effect: 'shards', sound: 'drip', chip: '#fbfbfa', accent: '#2b2b2e', soft: '#2b2b2e12', on: '#f4f5f4',
      shards: ['#3b5a87', '#b8475a', '#d9a43a', '#3f8aa6', '#2b2b2e'], bg: '#f2f3f2', ink: '#2b2b2e', muted: '#636569', mode: 'multiply', font: SANS, display: SONG },
    room: { name: '屋', full: '小筑', en: 'Haven', line: '每做完一件，小屋里添一件家具', base: 'paper', material: 'room', effect: 'shards', sound: 'wood', chip: '#efe7c9', accent: '#2c3a20', soft: '#2c3a2012', on: '#efe7c9',
      shards: ['#f1d55a', '#79a84f', '#c99a52', '#d9673a', '#efe7c9'], bg: '#e6eed2', ink: '#2c3a20', muted: '#57653f', mode: 'source-over', font: SANS, display: SANS },
    fluff: { name: '毛', full: '绒绒', en: 'Velvet', line: '每做完一件多长一层绒毛，全做完它睁眼', base: 'paper', material: 'fluff', effect: 'shards', sound: 'soft', chip: '#f8f7f4', accent: '#141416', soft: '#14141610', on: '#f8f7f4',
      shards: ['#141416', '#3a3a3e', '#6b6b70', '#f8f7f4'], bg: '#f8f7f4', ink: '#141416', muted: '#626266', mode: 'source-over', font: SANS, display: SONG },
    tape: { name: '乐', full: '乐 · 纸带', line: '每做完一件打一个音孔，做完弹给你听', base: 'night', material: 'tape', effect: 'shards', sound: 'punch', chip: '#f3ecdc', accent: '#f3ecdc', soft: '#f3ecdc1a', on: '#12302a',
      shards: ['#f3ecdc', '#e6dcc4', '#cdbf9f', '#ffffff'], bg: '#12302a', ink: '#f3ecdc', muted: '#9fb5ad', mode: 'source-over', font: SANS, display: SANS },
    riso: { name: '印', full: '套色', en: 'Overprint', line: '每做完一件，印上一幅双色小画', base: 'paper', material: 'riso', effect: 'shards', sound: 'press', chip: '#fbfaf6', accent: '#2f5fb3', soft: '#2f5fb314', on: '#f6f4ef',
      shards: ['#ff4fa3', '#2f5fb3', '#8a4fb0', '#f6f4ef'], bg: '#f6f4ef', ink: '#1f2a44', muted: '#5d6377', mode: 'multiply', font: SANS, display: SANS }
  };
  const ORDER = ['dawn', 'day', 'night', 'bloom', 'riso', 'room', 'fluff'];
  /** 跟随时间: 5–10 晨, 10–18 昼, 18–5 夜. */
  const byTime = (d = new Date()) => { const h = d.getHours(); return h >= 5 && h < 10 ? 'dawn' : h >= 10 && h < 18 ? 'day' : 'night'; };
  const BRAND = { shards: ['#d9d6ff', '#c9f0e6', '#ffe0d2', '#f5f5f7'] };
  const PLAIN = { material: 'plain', shards: ['#9fd8ff', '#ffffff', '#a7b4ff', '#7ee0c8'], bg: '#0c0e14', ink: '#f1f3f7', muted: '#8b93a3', accent: '#9fd8ff', mode: 'screen', font: SANS, display: SANS };
  const EFFECTS = { auto: '跟随主题', shards: '碎裂', stardust: '流光', ink: '墨染', plane: '纸飞机', dots: '点阵', gold: '金箔' };
  const EFFECT_LINE = { shards: '按主题的材质碎开', stardust: '化成一缕光', ink: '墨晕开，落一点红', plane: '折成纸飞机飞走', dots: '散成一粒粒点', gold: '金箔慢慢飘落' };

