  /* ---------- Dates ---------- */
  function dayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function addDays(key, n) { const [y, m, d] = key.split('-').map(Number); return dayKey(new Date(y, m - 1, d + n)); }
  function weekday(key) { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d).getDay(); }
  function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function newId(prefix = 't') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
  function isDayKey(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v); }
  const LOC = () => (state?.settings?.lang === 'en' ? 'en-US' : 'zh-CN');
  function dateLabel(key) {
    const today = dayKey();
    if (key === today) return '今天';
    if (key === addDays(today, 1)) return '明天';
    const [y, m, d] = key.split('-').map(Number);
    if (LOC() === 'en-US') return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d));
    return `${m}月${d}日 ${WEEK[weekday(key)]}`;
  }
  /** Is this task on today's list? Undated one-off tasks always are; overdue ones too. */
  function dueToday(t, today = dayKey()) {
    const w = weekday(today);
    if (t.repeat === 'daily') return true;
    if (t.repeat === 'weekdays') return w >= 1 && w <= 5;
    if (t.repeat === 'weekly') return w === (Number.isInteger(t.repeatDay) ? t.repeatDay : w);
    return !t.date || t.date <= today;
  }
  /** Next day the task appears, for sorting “以后”. */
  function nextDue(t, today = dayKey()) {
    if (t.repeat === 'none') return t.date || today;
    for (let i = 1; i <= 7; i++) { const k = addDays(today, i); if (dueToday(t, k)) return k; }
    return addDays(today, 7);
  }
  function repeatLabel(t) { return t.repeat === 'weekly' ? `每${WEEK[Number.isInteger(t.repeatDay) ? t.repeatDay : 1]}` : repeats[t.repeat]; }

