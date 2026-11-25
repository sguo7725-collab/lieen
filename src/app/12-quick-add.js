  /* ---------- Quick add: understands 明天 / 周五 / 11月5日 / 每天 / 工作日 / 每周三 / 30分钟 / 1小时 / #分组 ---------- */
  const CN_NUM = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  function cnNumber(s) {
    if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
    if (s === '半') return .5;
    if (!/^[零一二两三四五六七八九十]+$/.test(s)) return NaN;
    if (s.includes('十')) { const [a, b] = s.split('十'); return (a ? CN_NUM[a] : 1) * 10 + (b ? CN_NUM[b] : 0); }
    return [...s].reduce((n, c) => n * 10 + CN_NUM[c], 0);
  }
  const DAY_CN = { 日: 0, 天: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6 };
  const DAY_EN = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  function parseQuick(text) {
    let rest = ` ${text} `;
    const found = {}, hits = [];
    const take = (re, fn) => { const m = rest.match(re); if (!m) return; if (fn(m) !== false) { rest = rest.replace(m[0], ' '); hits.push(m[0].trim()); } };
    const today = dayKey();
    // Clock time: 下午3点 / 3点半 / 晚上8点15 / 15:30 / 9：00
    take(/(明早|明晚|明天早上|明天晚上|早上|早晨|上午|中午|下午|傍晚|晚上|今晚|凌晨)?\s*(\d{1,2}|[一二两三四五六七八九十]+)\s*(?:[:：](\d{2})|点(?:钟)?\s*(半|一刻|三刻|(\d{1,2}|[一二三四五六七八九十]+)\s*分?(?!钟))?)/, m => {
      let h = cnNumber(m[2]); if (!(h >= 0 && h <= 24)) return false;
      if (!m[1] && !m[3] && !/点/.test(m[0])) return false;
      let min = m[3] ? Number(m[3]) : m[4] === '半' ? 30 : m[4] === '一刻' ? 15 : m[4] === '三刻' ? 45 : m[5] ? cnNumber(m[5]) : 0;
      if (!(min >= 0 && min < 60)) return false;
      if (/下午|傍晚|晚上|今晚|明晚/.test(m[1] || '') && h < 12) h += 12;
      if (m[1] === '中午' && h < 11) h += 12;
      if (h === 24) h = 0;
      found.time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      if (m[1] === '今晚') found.date = today;
      if (/^明/.test(m[1] || '')) found.date = addDays(today, 1);
    });
    // English: 3pm, 3:30 pm, at 9am, noon
    if (!found.time) take(/(?:\bat\s+)?\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/i, m => {
      let h = Number(m[1]), min = Number(m[2] || 0); if (h < 1 || h > 12 || min > 59) return false;
      if (/p/i.test(m[3]) && h < 12) h += 12; if (/a/i.test(m[3]) && h === 12) h = 0;
      found.time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    });
    if (!found.time) take(/\b(?:at\s+)?noon\b/i, () => { found.time = '12:00'; });
    take(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i, m => { const n = Number(m[1]); if (!(n > 0) || n > 10) return false; found.duration = Math.round(n * 60); });
    if (!found.duration) take(/\b(\d+)\s*(?:minutes?|mins?)\b/i, m => { const n = Number(m[1]); if (!(n > 0) || n > 600) return false; found.duration = n; });
    if (!found.duration) take(/(\d+(?:\.\d+)?|[一二两三四五六七八九十半]+)\s*(?:个)?\s*(小时|钟头|h)(?:半)?/i, m => { const n = cnNumber(m[1]); if (!(n > 0)) return false; found.duration = Math.round(n * 60 + (m[0].endsWith('半') ? 30 : 0)); });
    if (!found.duration) take(/半小时/, () => { found.duration = 30; });
    if (!found.duration) take(/(\d+|[一二两三四五六七八九十]+)\s*(分钟|分|min|m)(?![a-z])/i, m => { const n = cnNumber(m[1]); if (!(n > 0) || n > 600) return false; found.duration = Math.round(n); });
    take(/每(?:个)?工作日|工作日|\b(?:every\s+)?weekdays?\b/i, () => { found.repeat = 'weekdays'; });
    if (!found.repeat) take(/\b(?:every\s*day|everyday|daily)\b/i, () => { found.repeat = 'daily'; });
    if (!found.repeat) take(/\bevery\s+(sun|mon|tue|wed|thu|fri|sat)[a-z]*\b/i, m => { found.repeat = 'weekly'; found.repeatDay = DAY_EN[m[1].toLowerCase()]; });
    if (!found.repeat) take(/每天|每日|天天/, () => { found.repeat = 'daily'; });
    if (!found.repeat) take(/每(?:周|星期|礼拜)([一二三四五六日天])/, m => { found.repeat = 'weekly'; found.repeatDay = DAY_CN[m[1]]; });
    if (!found.repeat) {
      take(/大后天/, () => { found.date = addDays(today, 3); });
      if (!found.date) take(/后天/, () => { found.date = addDays(today, 2); });
      if (!found.date) take(/明天|明日/, () => { found.date = addDays(today, 1); });
      if (!found.date) take(/今天|今日/, () => { found.date = today; });
      if (!found.date) take(/\b(?:tomorrow|tmr|tmrw)\b/i, () => { found.date = addDays(today, 1); });
      if (!found.date) take(/\btoday\b|\btonight\b/i, () => { found.date = today; });
      if (!found.date) take(/\b(?:(next)\s+|on\s+)?(sun|mon|tue|wed|thu|fri|sat)(?:day|sday|nesday|rsday|urday|s)?\b/i, m => {
        const target = DAY_EN[m[2].toLowerCase()], now = weekday(today);
        let diff = (target - now + 7) % 7; if (m[1] && diff === 0) diff = 7; else if (m[1]) diff += diff < 7 && diff > 0 ? 0 : 0;
        found.date = addDays(today, diff || 0);
      });
      else take(/今天|今日/, () => {});
      if (!found.date) take(/(下)?(?:周|星期|礼拜)([一二三四五六日天])/, m => {
        const target = DAY_CN[m[2]], now = weekday(today), mondayOffset = (now + 6) % 7;
        let diff = ((target + 6) % 7) - mondayOffset; // days from today within this Mon–Sun week
        if (m[1]) diff += 7; else if (diff < 0) diff += 7;
        found.date = addDays(today, diff);
      });
      if (!found.date) take(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]?|(\d{1,2})\/(\d{1,2})(?!\d)/, m => {
        const mo = Number(m[1] || m[3]), d = Number(m[2] || m[4]); if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
        const y = new Date().getFullYear(); let key = dayKey(new Date(y, mo - 1, d)); if (key < today) key = dayKey(new Date(y + 1, mo - 1, d));
        found.date = key;
      });
    }
    take(/[#＃](\S+)/, m => { const g = state.groups.find(x => x.name === m[1] || x.name.toLowerCase() === m[1].toLowerCase()); if (!g) return false; found.group = g.id; });
    const title = rest.replace(/\s+/g, ' ').trim().replace(/^[，,、\s]+|[，,、\s]+$/g, '');
    return { ...found, title, hits };
  }
  // Keeps what the user tapped in the chips, so typing only overrides what the text actually says.
  const addManual = { when: 'today', date: '', repeat: 'none', duration: 0, custom: false, time: '', customTime: false };
  let quickOff = false;
  function applyQuickParse() {
    const raw = $('task-input').value;
    const p = quickOff ? { title: raw.trim(), hits: [] } : parseQuick(raw);
    const date = p.date ?? null;
    if (date === null) { $('task-when').value = addManual.when; $('task-date').value = addManual.date; }
    else if (date === dayKey()) { $('task-when').value = 'today'; }
    else if (date === addDays(dayKey(), 1)) { $('task-when').value = 'tomorrow'; }
    else { $('task-when').value = 'pick'; $('task-date').value = date; }
    $('task-repeat').value = p.repeat || addManual.repeat;
    const duration = p.duration ?? addManual.duration;
    $('task-duration').value = String(duration);
    customDuration.add = p.duration ? !DURATIONS.includes(p.duration) : addManual.custom;
    if (customDuration.add) $('task-duration-custom').value = String(duration || '');
    if (p.group) addGroupId = p.group;
    $('task-time').value = p.time || addManual.time;
    quickRepeatDay = p.repeat === 'weekly' ? p.repeatDay : null;
    const bits = [];
    if (p.repeat) bits.push(p.repeat === 'weekly' ? `每周${WEEK[p.repeatDay].slice(1)}` : repeats[p.repeat]);
    if (p.date) bits.push(dateLabel(p.date));
    if (p.time) bits.push(p.time);
    if (p.duration) bits.push(durationText(p.duration));
    if (p.group) bits.push(groupOf(p.group).name);
    $('parse-hint').hidden = !bits.length;
    $('parse-hint').innerHTML = bits.length ? `${icon('sparkles')}<span>已识别：${bits.map(esc).join(' · ')}</span><button type="button" class="parse-off" id="parse-off">保留原文</button>` : '';
    renderAddChips(); icons($('add-form'));
    return p;
  }
  let quickRepeatDay = null;

