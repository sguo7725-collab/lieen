  /* ---------- Timer: tasks with a duration get a start button and a countdown ---------- */
  // One timer at a time. state.timer = { id, total, endsAt (running) | left (paused) }; it survives reloads,
  // and the Android app shows it as a countdown notification with an alarm when it ends.
  const DURATIONS = [15, 25, 30, 45, 60];
  const timerLeft = t => t ? (t.endsAt ? Math.max(0, t.endsAt - Date.now()) : t.left) : 0;
  const clockText = ms => { const s = Math.ceil(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const durationText = min => min >= 60 && min % 60 === 0 ? `${min / 60}小时` : `${min}分钟`;
  function syncNativeTimer() {
    if (!NATIVE?.setTimer) return;
    const t = state.timer, task = t && state.tasks.find(x => x.id === t.id);
    try { NATIVE.setTimer(t && task ? JSON.stringify({ id: task.id, title: task.title, endsAt: t.endsAt, left: t.left, total: t.total }) : ''); } catch { /* optional */ }
  }
  /** Stop the current timer and credit the time spent to its task (all of it when it ran out). */
  function settleTimer(finished) {
    const t = state.timer;
    if (!t) return;
    const task = state.tasks.find(x => x.id === t.id);
    if (task) task.focusMs = (task.focusMs || 0) + (finished ? t.total : Math.max(0, t.total - timerLeft(t)));
    state.timer = null;
    syncNativeTimer();
  }
  function startTimer(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task || task.done || !task.duration) return;
    const t = state.timer;
    if (t && t.id === id) { // pause / resume
      if (t.endsAt) { t.left = timerLeft(t); t.endsAt = 0; showToast('已暂停计时'); }
      else { t.endsAt = Date.now() + t.left; t.left = 0; }
    } else {
      if (t) settleTimer(false);
      state.timer = { id, total: task.duration * 60000, endsAt: Date.now() + task.duration * 60000, left: 0 };
      showToast(`开始计时：${task.title} · ${durationText(task.duration)}`);
    }
    haptic();
    syncNativeTimer(); save(); render(); tickTimer();
  }
  function stopTimer() {
    if (!state.timer) return;
    settleTimer(false); save(); render(); showToast('已结束计时');
  }
  function finishTimer() {
    const t = state.timer, task = t && state.tasks.find(x => x.id === t.id);
    settleTimer(true); save(); render();
    if (!task) return;
    haptic('done');
    try { navigator.vibrate?.([120, 80, 120]); } catch { /* optional */ }
    showToast(`时间到：${task.title}`, () => {
      const button = document.querySelector(`.task-row[data-task-id="${CSS.escape(task.id)}"] .check-task`) || document.querySelector(`.lock-task[data-id="${CSS.escape(task.id)}"]`);
      if (button) complete(task.id, button); else if (!task.done) { markDone(task); save(); render(); }
    }, '标记完成', 15000);
  }
  // Live update of every countdown on screen, once a second while a timer runs.
  function tickTimer() {
    const t = state.timer;
    if (!t) return;
    const left = timerLeft(t);
    if (t.endsAt && left <= 0) { finishTimer(); return; }
    document.querySelectorAll('[data-timer-text]').forEach(el => { el.textContent = clockText(left); });
    document.querySelectorAll('[data-timer-progress]').forEach(el => { el.style.setProperty('--p', String(1 - left / t.total)); });
  }
  setInterval(tickTimer, 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tickTimer(); });
  // Always-visible focus bar while a timer runs: above the tab bar in the app, under the clock on the lock view.
  function renderFocusBar() {
    const t = state.timer, task = t && state.tasks.find(x => x.id === t.id);
    const bar = $('focus-bar');
    bar.hidden = !task;
    document.body.classList.toggle('has-focus', !!task);
    if (!task) return;
    $('focus-title').textContent = task.title;
    $('focus-state').textContent = t.endsAt ? '专注中' : '已暂停';
    bar.classList.toggle('is-paused', !t.endsAt);
    $('focus-toggle').innerHTML = icon(t.endsAt ? 'pause' : 'play');
    $('focus-toggle').setAttribute('aria-label', t.endsAt ? '暂停计时' : '继续计时');
    icons(bar);
    tickTimer();
  }
  function timerPill(t, cls = 'timer-pill') {
    if (!t.duration || t.done) return '';
    const run = state.timer?.id === t.id ? state.timer : null;
    if (!run) return `<button class="${cls}" data-action="timer" data-id="${esc(t.id)}" aria-label="开始计时 ${durationText(t.duration)}：${esc(t.title)}">${icon('play')}<span>${t.duration >= 60 && t.duration % 60 === 0 ? `${t.duration / 60}小时` : `${t.duration}分`}</span></button>`;
    const left = timerLeft(run);
    return `<button class="${cls} is-on${run.endsAt ? ' is-running' : ' is-paused'}" data-action="timer" data-id="${esc(t.id)}" data-timer-progress style="--p:${1 - left / run.total}" aria-label="${run.endsAt ? '暂停' : '继续'}计时：${esc(t.title)}">${icon(run.endsAt ? 'pause' : 'play')}<span data-timer-text>${clockText(left)}</span></button>`;
  }

