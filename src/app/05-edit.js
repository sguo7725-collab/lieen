  /* ---------- Edit sheet ---------- */
  function editChips(task, group, repeat) {
    $('edit-group-chips').innerHTML = state.groups.map(g => `<button type="button" class="chip${g.id === group ? ' active' : ''}" data-edit-group="${esc(g.id)}" aria-pressed="${g.id === group}"><span class="dot" style="background:${g.color}"></span>${esc(g.name)}</button>`).join('');
    document.querySelectorAll('[data-edit-repeat]').forEach(b => { const on = b.dataset.editRepeat === repeat; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    const form = $('edit-form'), dateless = repeat === 'daily' || repeat === 'weekdays', date = $('edit-date').value, today = dayKey();
    form.elements.group.value = group; form.elements.repeat.value = repeat;
    $('edit-date').disabled = dateless;
    document.querySelectorAll('[data-edit-when]').forEach(b => { b.disabled = dateless; const on = !dateless && (b.dataset.editWhen === 'today' ? (!date || date === today) : date === addDays(today, 1)); b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    $('edit-date-field').querySelector('.field-head>span').textContent = repeat === 'weekly' ? '从哪天' : '日期';
    syncPickers();
  }
  function openEdit(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    editing = id; if (!$('edit-sheet').open) editPanel = '';
    const form = $('edit-form');
    form.dataset.editId = id;
    $('edit-title').value = task.title;
    $('edit-date').value = task.date || '';
    $('edit-pinned').checked = task.pinned;
    $('edit-delete').dataset.id = id;
    form.elements.duration.value = String(task.duration || 0);
    $('edit-time').value = task.time || '';
    $('edit-ring').value = task.ring ? '1' : '0';
    $('edit-note').value = task.note || '';
    renderSubtasks(task);
    customDuration.edit = false; $('edit-duration-custom').value = '';
    durationChips('edit', task.duration || 0, $('edit-duration-custom'));
    editChips(task, groupOf(task.group).id, task.repeat);
    if (!$('edit-sheet').open) $('edit-sheet').showModal();
    icons($('edit-sheet'));
    if (!isPhone()) $('edit-title').focus();
  }
  // Subtasks change immediately (ticking one should never need a 保存).
  function renderSubtasks(task) {
    $('edit-subtasks').innerHTML = (task.subtasks || []).map(s => `<div class="subtask${s.done ? ' is-done' : ''}" data-sub="${esc(s.id)}"><button type="button" class="sub-check" data-sub-toggle="${esc(s.id)}" aria-label="${s.done ? '取消完成' : '完成'}：${esc(s.title)}"><span class="check-circle">${s.done ? icon('check') : ''}</span></button><span class="sub-title">${esc(s.title)}</span><button type="button" class="icon-button" data-sub-delete="${esc(s.id)}" aria-label="删除子任务：${esc(s.title)}">${icon('x')}</button></div>`).join('');
    icons($('edit-subtasks'));
  }
  function editingTask() { return state.tasks.find(t => t.id === $('edit-form').dataset.editId); }
  function closeEdit() {
    editing = null;
    if ($('edit-sheet').open) { $('edit-sheet').close(); return true; }
    return false;
  }
  // Android back button: close what is open before leaving the app.
  window.suisuiBack = () => {
    for (const d of document.querySelectorAll('dialog[open]')) { d.close(); return true; }
    if (closeAdd()) return true;
    if (closeSearch()) return true;
    if (document.body.dataset.view === 'settings') { settingsPage !== 'index' ? openSettingsPage('index') : setView('tasks'); return true; }
    if (document.body.dataset.view === 'review') { setView('tasks'); return true; }
    return false;
  };
  // iPhone: no system back gesture inside the app, so a swipe from the left edge goes back like the Android back button.
  // The page being left follows the finger; letting go past about a third of the screen goes back.
  (function edgeSwipeBack() {
    const iphone = IOS_APP || (/iPhone|iPad|iPod/.test(navigator.userAgent) && (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true)) || window.SUISUI_EDGE_SWIPE;
    if (!iphone) return;
    const layer = () => {
      const pro = ['pro-pay', 'pro-celebrate', 'pro-jar-sheet', 'pro-sheet'].map(id => document.getElementById(id)).find(el => el && !el.hidden);
      if (pro) return { el: pro.id === 'pro-pay' ? pro.querySelector('.pro-pay-card') : pro };
      const dialog = document.querySelector('dialog[open]'); if (dialog) return { el: dialog };
      if (document.body.classList.contains('adding') || document.body.classList.contains('searching')) return { el: null };
      const view = document.body.dataset.view;
      if (view === 'settings') return { el: document.querySelector('.settings-panel') };
      if (view === 'review') return { el: document.getElementById('review-panel') };
      return null;
    };
    let start = null;
    const reset = el => { if (!el) return; el.style.transition = ''; el.style.transform = ''; el.style.boxShadow = ''; };
    addEventListener('touchstart', e => {
      const t = e.touches[0];
      if (e.touches.length !== 1 || t.clientX > 22) return;
      const l = layer(); if (!l) return;
      start = { x: t.clientX, y: t.clientY, dx: 0, el: l.el, decided: false };
    }, { passive: true });
    addEventListener('touchmove', e => {
      if (!start) return;
      const t = e.touches[0], dx = t.clientX - start.x, dy = t.clientY - start.y;
      if (!start.decided) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; if (Math.abs(dy) > Math.abs(dx)) { start = null; return; } start.decided = true; }
      start.dx = Math.max(0, dx);
      if (start.el) { start.el.style.transition = 'none'; start.el.style.transform = `translateX(${start.dx}px)`; start.el.style.boxShadow = '-12px 0 28px -16px rgba(0,0,0,.35)'; }
    }, { passive: true });
    const end = () => {
      if (!start) return;
      const s = start; start = null;
      const go = s.decided && s.dx > Math.min(120, innerWidth * .3);
      if (!s.el) { if (go) window.suisuiBack?.(); return; }
      if (go) {
        s.el.style.transition = 'transform .2s cubic-bezier(.2,.8,.2,1)'; s.el.style.transform = `translateX(${innerWidth}px)`;
        setTimeout(() => { window.suisuiBack?.(); requestAnimationFrame(() => reset(s.el)); }, 190);
        try { navigator.vibrate?.(8); } catch {}
      } else { s.el.style.transition = 'transform .22s cubic-bezier(.2,.8,.2,1)'; s.el.style.transform = ''; setTimeout(() => reset(s.el), 240); }
    };
    addEventListener('touchend', end, { passive: true });
    addEventListener('touchcancel', end, { passive: true });
  })();
  function showToast(message, undo = null, label = '撤销', ms = 0) {
    clearTimeout(toastTimer);
    undoAction = undo;
    $('toast-message').textContent = message;
    $('undo-button').textContent = label;
    $('undo-button').hidden = !undo;
    $('toast').hidden = false;
    toastTimer = setTimeout(hideToast, ms || (undo ? 8000 : 4500));
  }
  function hideToast() { $('toast').hidden = true; clearTimeout(toastTimer); undoAction = null; }
  function metaFlags(t) {
    const today = dayKey();
    let flags = '';
    if (t.repeat !== 'none') flags += `<span class="meta-flag meta-repeat">${icon('repeat')}${repeatLabel(t)}</span>`;
    if (t.repeat === 'none' && t.date && t.date !== today) flags += `<span class="meta-flag${t.date < today ? ' overdue' : ''}">${icon('calendar')}${t.date < today ? '已过期 · ' : ''}${dateLabel(t.date)}</span>`;
    if (t.time) flags += `<span class="meta-flag meta-time${t.ring ? ' is-ring' : ''}" title="${t.ring ? '到点响铃' : '只显示时间'}">${icon(t.ring ? 'bell-ring' : 'clock')}${t.time}</span>`;
    if (t.subtasks?.length) flags += `<span class="meta-flag">${icon('list-checks')}${t.subtasks.filter(s => s.done).length}/${t.subtasks.length}</span>`;
    if (t.note) flags += `<span class="meta-flag" title="有备注">${icon('sticky-note')}</span>`;
    return flags;
  }
  // Tap the circle to finish; tap the text to edit (group, date, repeat, pin, delete in one sheet).
  function row(t) {
    return `<div class="task-row${completing.has(t.id) ? ' is-completing' : ''}${t.pinned ? ' is-pinned' : ''}" data-task-id="${esc(t.id)}" style="--g:${groupOf(t.group).color}"><button class="check-task" data-action="complete" data-id="${esc(t.id)}" aria-label="完成：${esc(t.title)}"><span class="check-circle"></span></button><button class="task-body" data-action="edit" data-id="${esc(t.id)}" aria-label="编辑：${esc(t.title)}（${esc(groupOf(t.group).name)}）"><span class="task-title">${esc(t.title)}${t.pinned ? `<span class="pin-mark" title="置顶">${icon('pin')}</span>` : ''}</span>${(m => m ? `<span class="task-meta">${m}</span>` : '')(metaFlags(t))}</button>${timerPill(t)}</div>`;
  }
  // First use: no sample tasks, a calm invitation instead (the dots echo the logo).
  const FIRST_RUN = `<div class="first-run"><svg class="first-art" viewBox="0 0 120 120" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => { const a = (-80 + i * 24.3) * Math.PI / 180, t = i / 13; return `<circle cx="${(60 + 44 * Math.cos(a)).toFixed(1)}" cy="${(60 + 44 * Math.sin(a)).toFixed(1)}" r="${(2 + t * 4).toFixed(1)}" opacity="${(.3 + t * .7).toFixed(2)}"/>`; }).join('')}<path d="M44 61l11 11 22-23" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg><h2>从第一件小事开始</h2><p>点下面的 + 写下今天想做的事。<br>需要专注的事可以设个时长，点开始就倒计时。</p><button class="primary-button" data-action="first-add">${icon('plus')}添加第一件</button></div>`;
  function renderFilters(todo) {
    const repeating = state.tasks.filter(t => t.repeat !== 'none').length;
    if (filter === 'repeat' && !repeating) filter = 'all';
    if (filter !== 'all' && filter !== 'repeat' && !state.groups.some(g => g.id === filter)) filter = 'all';
    const count = id => todo.filter(t => id === 'all' || groupOf(t.group).id === id).length;
    // "重复" lists every repeating task, including ones that are not due today, so a daily/weekly setting can always be found again.
    $('filter-tabs').innerHTML = `<button data-filter="all">全部 <span id="count-all">${count('all')}</span></button>` +
      state.groups.map(g => `<button data-filter="${esc(g.id)}"><span class="dot" style="background:${g.color}"></span>${esc(g.name)} <span id="count-${esc(g.id)}">${count(g.id)}</span></button>`).join('') +
      (repeating ? `<button data-filter="repeat" class="filter-repeat" title="所有每天、工作日、每周重复的事">${icon('repeat')}重复 <span id="count-repeat">${repeating}</span></button>` : '');
    document.querySelectorAll('[data-filter]').forEach(b => { b.classList.toggle('active', b.dataset.filter === filter); b.setAttribute('aria-pressed', String(b.dataset.filter === filter)); });
  }
  function render() {
    // the lock view (opened every time the screen wakes) only shows the lock card: skip the list, filters and settings
    if (LOCK_MODE) { renderPreview(); renderFocusBar(); icons($('lockscreen') || document); window.dispatchEvent(new Event('suisui:render')); return; }
    const glide = window.SuiSuiMotion?.capture?.();
    const todo = pending(), done = doneList(), upcoming = later();
    const inFilter = t => filter === 'all' || (filter === 'repeat' ? t.repeat !== 'none' : groupOf(t.group).id === filter);
    const visible = todo.filter(inFilter);
    const fmt = new Intl.DateTimeFormat(LOC(), { month: 'long', day: 'numeric', weekday: 'short' });
    $('progress-copy').textContent = `${fmt.format(new Date())} · ${todo.length ? (done.length ? `还有 ${todo.length} 件，完成 ${done.length} 件` : `今天 ${todo.length} 件`) : (done.length ? `${done.length} 件都完成了` : '给今天留一件想做的事')}`;
    const total = todo.length + done.length;
    $('progress-number').textContent = total ? `${done.length}/${total}` : '0';
    $('header-title').textContent = total ? `今天 · ${done.length}/${total}` : '今天';
    $('progress-arc').style.strokeDasharray = `${total ? (done.length / total) * 97.4 : 0} 97.4`;
    // Hero for 纸墨 (big day number) and 夜光 (big count + segments); 玻璃 keeps the title and ring.
    const now = new Date();
    $('hero-day').textContent = String(now.getDate()).padStart(2, '0');
    $('hero-week').textContent = new Intl.DateTimeFormat(LOC(), { weekday: 'long' }).format(now);
    $('hero-sub').textContent = `${new Intl.DateTimeFormat(LOC(), { month: LOC() === 'en-US' ? 'short' : 'numeric' }).format(now).replace(/^(\d+)$/, '$1月')} · ${todo.length ? `还有 ${todo.length} 件` : total ? '都完成了' : '还没有待办'}`;
    $('hero-count').innerHTML = `${done.length}<small>/${total}</small>`;
    const seg = Math.min(total, 16);
    $('today-meter').innerHTML = state.settings.uiStyle === 'night'
      ? Array.from({ length: seg || 1 }, (_, i) => `<i class="${total && i < Math.round(done.length / total * seg) ? 'on' : ''}"></i>`).join('')
      : `<span>${done.length} / ${total}</span><i><b style="width:${total ? Math.round(done.length / total * 100) : 0}%"></b></i><span>${total ? Math.round(done.length / total * 100) : 0}%</span>`;
    renderFilters(todo);
    renderAddChips();
    $('gesture-tips').hidden = !!state.settings.tipsSeen || !todo.length;
    if (editing && !state.tasks.some(t => t.id === editing)) closeEdit();
    $('pending-count').textContent = String(visible.length);
    const firstRun = !state.tasks.length && !state.log.length;
    document.querySelector('.list-heading').hidden = firstRun;
    $('filter-tabs').hidden = firstRun;
    $('completed-section').hidden = !done.length;
    $('task-list').innerHTML = visible.length ? visible.map(row).join('') : firstRun ? FIRST_RUN : `<div class="empty-state">${icon(todo.length ? 'list-filter' : 'circle-check')}<span>${filter === 'repeat' ? '今天要做的重复事项都做完了' : todo.length ? '这个分组今天没有待办' : done.length ? '都完成了，给自己一点空白。' : '今天从一件小事开始。'}</span></div>`;
    const laterVisible = upcoming.filter(inFilter);
    $('later-section').hidden = !laterVisible.length;
    $('later-count').textContent = String(laterVisible.length);
    $('later-list').innerHTML = laterVisible.map(row).join('');
    $('done-count').textContent = String(done.length);
    $('clear-done').hidden = !done.some(t => t.repeat === 'none');
    $('completed-list').innerHTML = done.map(t => `<div class="done-row" data-completed-id="${esc(t.id)}">${icon('circle-check')}<s class="done-text completed-title">${esc(t.title)}</s>${t.repeat !== 'none' ? `<span class="done-flag" title="下次该做时自动重新出现">${icon('repeat')}${repeatLabel(t)}</span>` : ''}<button class="icon-button" data-action="restore" data-id="${esc(t.id)}" aria-label="恢复：${esc(t.title)}" title="恢复待办">${icon('rotate-ccw')}</button><button class="icon-button" data-action="delete" data-id="${esc(t.id)}" aria-label="删除：${esc(t.title)}" title="删除">${icon('trash-2')}</button></div>`).join('');
    renderArchive();
    renderGroupSettings();
    renderPreview();
    if (settingsPage === 'index') renderSettingsSummary();
    if (document.body.dataset.view === 'review') renderReview();
    if (document.body.classList.contains('searching')) renderSearch();
    renderFocusBar();
    icons();
    $('storage-status').textContent = storageCopy();
    glide?.();
    window.dispatchEvent(new Event('suisui:render'));
  }
  function renderArchive() {
    const items = [...state.archive].sort((a, b) => b.archivedAt - a.archivedAt);
    $('archive-section').hidden = !items.length;
    $('archive-count').textContent = String(items.length);
    const fmt = new Intl.DateTimeFormat(LOC(), { month: 'numeric', day: 'numeric' });
    $('archive-list').innerHTML = items.slice(0, 60).map(t => `<div class="done-row archive-row" data-archived-id="${esc(t.id)}">${icon('archive')}<s class="done-text">${esc(t.title)}</s><span class="archive-date">${fmt.format(t.completedAt || t.archivedAt)}</span><button class="icon-button" data-action="unarchive" data-id="${esc(t.id)}" aria-label="放回待办：${esc(t.title)}" title="放回待办">${icon('rotate-ccw')}</button></div>`).join('') + (items.length > 60 ? `<p class="archive-more">只显示最近 60 条，导出备份可查看全部 ${items.length} 条。</p>` : '');
  }
  let iconPicking = '', editingGroup = '';
  function renderGroupSettings() {
    const list = $('group-list');
    if (list.contains(document.activeElement) && document.activeElement.matches('input')) return; // don't rebuild while the user is typing a name
    // 1.16: each group is one quiet row (icon, name, how many open, chevron); tapping it opens its editor below:
    // name field, colour (selected = ring), icon grid and delete. One group open at a time.
    const open = id => state.tasks.filter(t => !t.done && groupOf(t.group).id === id).length;
    list.innerHTML = state.groups.map(g => { const on = editingGroup === g.id; return `<div class="group-row${on ? ' is-open' : ''}" data-group-id="${esc(g.id)}"><button type="button" class="group-head" data-group-toggle="${esc(g.id)}" aria-expanded="${on}"><span class="group-icon-btn" style="--g:${g.color}" aria-hidden="true">${g.icon ? icon(g.icon) : '<span class="dot"></span>'}</span><span class="group-head-name">${esc(g.name)}</span><span class="group-head-count">${open(g.id)} 件</span>${icon('chevron-down')}</button><div class="group-editor"><label class="group-field"><span>名称</span><input class="group-name" id="group-name-${esc(g.id)}" value="${esc(g.name)}" maxlength="12" data-group-id="${esc(g.id)}" aria-label="分组名称"></label><div class="group-field"><span>颜色</span><div class="group-colors" role="group" aria-label="${esc(g.name)}的颜色">${GROUP_COLORS.map(c => `<button class="group-color${c === g.color ? ' active' : ''}" style="--c:${c}" data-group-color="${c}" data-group-id="${esc(g.id)}" aria-label="颜色 ${c}" aria-pressed="${c === g.color}"></button>`).join('')}</div></div><div class="group-field"><span>图标</span><div class="group-icons" role="group" aria-label="选择图标"><button type="button" class="group-icon-choice${!g.icon ? ' active' : ''}" data-group-icon="" data-group-id="${esc(g.id)}" aria-label="不用图标">${icon('circle-off')}</button>${GROUP_ICONS.map(n => `<button type="button" class="group-icon-choice${g.icon === n ? ' active' : ''}" data-group-icon="${n}" data-group-id="${esc(g.id)}" aria-label="${n}" style="--g:${g.color}">${icon(n)}</button>`).join('')}</div></div><button type="button" class="group-delete" data-group-delete="${esc(g.id)}" aria-label="删除分组：${esc(g.name)}" title="删除分组">${icon('trash-2')}删除分组</button></div></div>`; }).join('');
    $('add-group').disabled = state.groups.length >= 12;
  }
  // Lock screen (1.11, Android lock view): one frosted card per group, like the user's reference — group emoji, name and
  // done/total on top, open items, subtasks indented under their task, finished items (filled check) at the bottom.
  // A group with nothing today gets no card. Rows are the same .lock-task buttons, so completing and restoring work as before.
  function lockButton(t) {
    return `<button class="lock-task${t.done ? ' is-done' : ''}${completing.has(t.id) ? ' is-completing' : ''}" data-action="${t.done ? 'restore' : 'complete'}" data-id="${esc(t.id)}" aria-label="${t.done ? '恢复' : '完成'}：${esc(t.title)}" aria-pressed="${t.done}"><span class="check-circle">${t.done ? icon('check') : ''}</span><span class="lock-task-label">${t.done ? `<s class="completed-title">${esc(t.title)}</s>` : esc(t.title)}</span>${t.repeat !== 'none' ? `<span class="lock-repeat" title="${repeatLabel(t)}">${icon('repeat')}</span>` : ''}</button>`;
  }
  function lockGroups(items) {
    return state.groups.map(g => {
      const mine = items.filter(t => groupOf(t.group).id === g.id);
      if (!mine.length) return '';
      const done = mine.filter(t => t.done).length;
      const subs = t => t.done || !t.subtasks?.length ? '' : `<div class="lock-subs">${t.subtasks.map(x => `<button class="lock-sub${x.done ? ' is-done' : ''}" data-sub-quick="${esc(t.id)}" data-sub-id="${esc(x.id)}" aria-pressed="${x.done}" aria-label="${x.done ? '取消完成' : '完成'}：${esc(x.title)}"><span class="check-circle">${x.done ? icon('check') : ''}</span><span class="lock-task-label">${esc(x.title)}</span></button>`).join('')}</div>`;
      return `<section class="lock-group" data-lock-group="${esc(g.id)}"><header class="lock-group-head">${g.icon ? `<span class="lock-group-icon" aria-hidden="true">${icon(g.icon)}</span>` : ''}<b>${esc(g.name)}</b><span class="lock-group-count">${done}/${mine.length}</span></header>${mine.map(t => lockRow(t, lockButton(t)) + subs(t)).join('')}</section>`;
    }).join('');
  }
  // A lock-card row with a duration gets its own start button next to it (buttons cannot nest).
  function lockRow(t, button) { const pill = timerPill(t, 'lock-timer'); return pill ? `<div class="lock-row">${button}${pill}</div>` : button; }
  function renderPreview() {
    const todo = pending(), done = doneList().length;
    const list = $('activity-list'), scrollTop = list.scrollTop;
    const items = cardTasks();
    const max = state.settings.density === 'compact' ? 4 : 3;
    const total = todo.length + done;
    $('activity').classList.toggle('compact', max === 4);
    $('activity-count').textContent = `${done}/${total}`;
    const hide = LOCK_MODE && state.settings.lockPrivacy;
    $('activity').classList.toggle('is-private', hide);
    list.innerHTML = hide
      ? `<div class="lock-private">${icon('lock-keyhole')}<span>${todo.length ? `今天还有 ${todo.length} 件待办` : '今天的事都完成了'}</span><button class="lock-reveal" id="lock-reveal">解锁查看</button></div>`
      : LOCK_MODE && items.length ? lockGroups(items)
      : items.length ? items.map(t => lockRow(t, `<button class="lock-task${t.done ? ' is-done' : ''}${completing.has(t.id) ? ' is-completing' : ''}" data-action="${t.done ? 'restore' : 'complete'}" data-id="${esc(t.id)}" aria-label="${t.done ? '恢复' : '完成'}：${esc(t.title)}" aria-pressed="${t.done}"><span class="check-circle">${t.done ? icon('check') : ''}</span><span class="lock-task-label">${t.done ? `<s class="completed-title">${esc(t.title)}</s>` : esc(t.title)}</span>${t.repeat !== 'none' ? `<span class="lock-repeat" title="${repeatLabel(t)}">${icon('repeat')}</span>` : ''}</button>`)).join('') : `<div class="lock-empty">${icon('circle-check')}<span>今天，留一点空白。</span></div>`;
    list.scrollTop = scrollTop;
    $('remaining-label').textContent = todo.length ? `剩余 ${todo.length} 项 · 已完成 ${done} 项` : (done ? `全部完成 · ${done} 项` : '暂无待办');
    $('preview-footer-copy').textContent = `碎碎清单 · ${todo.length} 项待完成`;
    document.querySelectorAll('[data-action="complete"]').forEach(b => { b.disabled = completing.has(b.dataset.id); });
    renderMiniPreview(items, max, todo.length);
  }
  // Read-only copy of the card at the top of Settings, so appearance and privacy changes are visible while adjusting them.
  // On Android the real lock screen is the grouped view, so both settings previews draw the same thing in miniature:
  // the heading line, one small frosted card per group, and the remaining/done line under the cards.
  const miniRow = t => `<div class="mini-row${t.done ? ' is-done' : ''}"><span class="check-circle">${t.done ? icon('check') : ''}</span><span class="mini-row-label">${t.done ? `<s class="completed-title">${esc(t.title)}</s>` : esc(t.title)}</span>${t.repeat !== 'none' ? `<span class="lock-repeat">${icon('repeat')}</span>` : ''}${t.duration && !t.done ? `<span class="mini-timer">${icon('play')}${t.duration}分</span>` : ''}</div>`;
  function miniGroups(items) {
    return state.groups.map(g => {
      const mine = items.filter(t => groupOf(t.group).id === g.id);
      if (!mine.length) return '';
      return `<div class="mini-group" data-mini-group="${esc(g.id)}"><div class="mini-group-head">${g.icon ? icon(g.icon) : ''}<b>${esc(g.name)}</b><span>${mine.filter(t => t.done).length}/${mine.length}</span></div>${mine.map(miniRow).join('')}</div>`;
    }).join('');
  }
  const groupedLock = () => !!ANDROID && !state.settings.lockPrivacy;
  function renderMiniPreview(items, rows, open) {
    $('mini-card').classList.toggle('grouped', groupedLock() && items.length > 0);
    $('mini-card').classList.toggle('compact', rows === 4);
    $('mini-count').textContent = $('activity-count').textContent;
    $('mini-remaining').textContent = $('remaining-label').textContent;
    $('mini-list').innerHTML = state.settings.lockPrivacy
      ? `<div class="lock-private">${icon('lock-keyhole')}<span>${open ? `今天还有 ${open} 件待办` : '今天的事都完成了'}</span><span class="lock-reveal">解锁查看</span></div>`
      : groupedLock() && items.length ? miniGroups(items)
      : items.length ? items.slice(0, rows).map(miniRow).join('') : `<div class="lock-empty">${icon('circle-check')}<span>今天，留一点空白。</span></div>`;
  }
  // 玻璃 background: the wallpaper shrunk to a few dozen pixels (and a little more colourful), then stretched by CSS.
  // Upscaling a tiny image gives the blur for free, so no live CSS blur filter has to run on every frame.
  let wallFor = '';
  function glassWall(src) {
    if (wallFor === src) return; wallFor = src;
    // the shrunken picture is kept, so the lock view (opened every time the screen wakes) does not redo it
    const key = src.length + ':' + src.slice(-80);
    try { const hit = JSON.parse(localStorage.getItem('suisui-wall-cache') || 'null'); if (hit && hit.key === key) { document.documentElement.style.setProperty('--wall', `url("${hit.url}")`); return; } } catch {}
    const img = new Image();
    img.onload = () => {
      if (wallFor !== src) return;
      try {
        const w = 36, h = Math.max(1, Math.round(w * img.naturalHeight / img.naturalWidth));
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
        const px = ctx.getImageData(0, 0, w, h), d = px.data;
        for (let i = 0; i < d.length; i += 4) {
          const g = (d[i] + d[i + 1] + d[i + 2]) / 3;
          for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, g + (d[i + k] - g) * 1.45 + 8));
        }
        ctx.putImageData(px, 0, 0);
        const url = c.toDataURL('image/jpeg', .9);
        document.documentElement.style.setProperty('--wall', `url("${url}")`);
        try { localStorage.setItem('suisui-wall-cache', JSON.stringify({ key, url })); } catch {}
      } catch { document.documentElement.style.setProperty('--wall', `url("${src}")`); }
    };
    img.onerror = () => { if (wallFor === src) document.documentElement.style.setProperty('--wall', `url("${src}")`); };
    img.src = src;
  }
  function applySettings() {
    const s = state.settings, accent = accentOf(s), colors = palette[accent], dark = darkScheme.matches || s.uiStyle === 'night', root = document.documentElement.style;
    document.documentElement.dataset.style = LOCK_MODE ? 'lock' : s.uiStyle;
    document.documentElement.dataset.motion = s.motion ? 'on' : 'off';
    root.setProperty('--on-accent', accent === 'lime' ? '#0a0a0b' : '#ffffff');
    $('swatch-lime').hidden = s.uiStyle !== 'night';
    document.querySelectorAll('[data-ui-style]').forEach(b => { const on = b.dataset.uiStyle === s.uiStyle; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    root.setProperty('--accent', dark ? colors[2] : colors[0]);
    root.setProperty('--accent-fill', dark ? colors[4] : colors[0]);
    ramps[accent].forEach((c, i) => root.setProperty(`--a-${RAMP_STEPS[i]}`, c));
    document.documentElement.dataset.palette = accent;
    root.setProperty('--accent-soft', dark ? colors[3] : colors[1]);
    const paper = proPaper() || (s.wallpaper === 'custom' && s.photo ? { src: s.photo, pos: '50% 50%' } : wallpaperOf(s.wallpaper));
    // 玻璃 lays the (blurred) wallpaper under the whole app; with the phone's own wallpaper the page lets it show through.
    glassWall(paper.src);
    document.documentElement.classList.toggle('glass-hole', s.uiStyle === 'glass' && !LOCK_MODE && useSystemWallpaper());
    ['wallpaper', 'mini-wallpaper'].forEach(id => {
      const img = $(id);
      if (img.getAttribute('src') !== paper.src) img.src = paper.src;
      img.style.objectPosition = paper.pos;
      img.classList.toggle('monochrome', !!paper.mono);
    });
    if (CUTE.includes(s.font)) ensureCuteFonts();
    root.setProperty('--app-font', `var(--font-${s.font})`);
    root.setProperty('--ts', String(TEXT_SIZES[s.textSize][1]));
    document.querySelectorAll('[data-font]').forEach(b => { b.classList.toggle('active', b.dataset.font === s.font); b.setAttribute('aria-pressed', String(b.dataset.font === s.font)); });
    $('text-size').value = s.textSize;
    $('text-size').style.setProperty('--fill', `${s.textSize / 3 * 100}%`);
    $('text-size-value').textContent = TEXT_SIZES[s.textSize][0];
    document.documentElement.classList.toggle('system-wallpaper', useSystemWallpaper());
    updateWallpaperHole();
    $('mini-tag-label').textContent = useSystemWallpaper() ? '实时预览 · 手机壁纸' : '实时预览';
    renderWallpaperLibrary();
    document.querySelectorAll('[name="accent"]').forEach(i => { i.checked = i.value === accentOf(s); });
    document.querySelectorAll('[name="lang"]').forEach(i => { i.checked = i.value === s.lang; });
    document.querySelectorAll('[data-density]').forEach(b => { b.classList.toggle('active', b.dataset.density === s.density); b.setAttribute('aria-pressed', String(b.dataset.density === s.density)); });

    document.querySelectorAll('[data-theme-preset]').forEach(b => {
      const t = THEMES[b.dataset.themePreset];
      const on = ['cardColor', 'cardMaterial', 'cardTransparency', 'cardText'].every(k => String(t[k]).toLowerCase() === String(s[k]).toLowerCase());
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
    });
    // 自己调 shows the card's own colour, and says so when the card no longer matches a preset
    const custom = !document.querySelector('[data-theme-preset].active');
    $('custom-dot').style.background = s.cardColor;
    $('custom-state').textContent = custom ? `${({ frosted: '磨砂', glass: '玻璃', flat: '平面' })[s.cardMaterial] || ''} · ${s.cardColor.toUpperCase()} · 透明 ${s.cardTransparency}%` : '材质、颜色、透明度、文字';
    $('more-appearance').classList.toggle('is-custom', custom);
    $('motion-toggle').checked = !!s.motion;
    $('intensity').value = s.intensity;
    $('intensity-value').textContent = ['轻柔', '适中', '强烈'][s.intensity - 1];
    $('intensity').disabled = !s.motion;
    $('archive-toggle').checked = !!s.autoArchive;
    $('privacy-toggle').checked = !!s.lockPrivacy;
    renderNotifySetting();
    applyCardAppearance();
    renderPreview();
    if (settingsPage === 'index') renderSettingsSummary();
    icons();
    window.dispatchEvent(new Event('suisui:settings'));
  }
  function renderWallpaperLibrary() {
    const s = state.settings, list = $('wallpaper-library');
    const tile = (id, name, inner, extra = '') => `<button class="wallpaper-choice${extra}${s.wallpaper === id ? ' active' : ''}" data-wallpaper="${id}" aria-pressed="${s.wallpaper === id}" aria-label="${name}壁纸">${inner}<span>${name}</span></button>`;
    list.innerHTML = (SYSTEM_WALLPAPER ? tile('system', '手机壁纸', `<i data-lucide="smartphone"></i>`, ' system') : '') +
      (s.photo ? tile('custom', '我的照片', `<img src="${esc(s.photo)}" alt="" decoding="async">`) : '') +
      WALLPAPERS.map(w => tile(w.id, w.name, `<img src="${w.thumb}" alt="" decoding="async" style="object-position:${w.pos}">`, w.mono ? ' mono' : '')).join('');
    $('wallpaper-legend').textContent = SYSTEM_WALLPAPER ? '锁屏壁纸' : '预览壁纸';
    $('wallpaper-note').textContent = SYSTEM_WALLPAPER ? '默认用手机自己的壁纸，也可以单独换一张。' : '网页读不到手机壁纸，这里只影响预览。';
  }
  function applyCardAppearance() {
    const s = state.settings;
    const rgb = [1, 3, 5].map(i => parseInt(s.cardColor.slice(i, i + 2), 16));
    // Materials differ in more than blur: glass lets more through and adds a sheen and a light rim,
    // frosted blurs heavily, flat is a solid colour (transparency still applies, scaled per material).
    const MATERIAL = { frosted: { blur: '26px', sat: '1.25', see: .8 }, glass: { blur: '4px', sat: '1.8', see: .55 }, flat: { blur: '0px', sat: '1', see: 1 } };
    // Color-based automatic contrast; the explicit text option covers unusual wallpapers.
    const luminance = values => values.reduce((sum, v, i) => sum + (v / 255 <= .04045 ? v / 255 / 12.92 : ((v / 255 + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i], 0);
    const lum = luminance(rgb);
    const contrast = ink => (Math.max(ink, lum) + .05) / (Math.min(ink, lum) + .05);
    const light = s.cardText === 'light' || (s.cardText === 'auto' && contrast(luminance([244, 251, 247])) >= contrast(luminance([24, 43, 34])));
    for (const card of [$('activity'), $('mini-card'), ...document.querySelectorAll('.mat-card')]) {
      const m = MATERIAL[card.dataset.mat || s.cardMaterial];
      card.dataset.surface = card.dataset.mat || s.cardMaterial;
      card.style.setProperty('--card-bg', `rgba(${rgb.join(',')},${((1 - s.cardTransparency / 100) * m.see).toFixed(3)})`);
      card.style.setProperty('--card-blur', m.blur);
      card.style.setProperty('--card-saturate', m.sat);
      card.style.setProperty('--card-ink', light ? '#f5f5f7' : '#1d1d1f');
      card.style.setProperty('--card-muted', light ? '#e3e3e8' : '#48484c');
      card.style.setProperty('--card-rule', light ? '#ffffff38' : '#0000002a');
      card.style.setProperty('--card-check', light ? '#ececf0' : '#3a3a3c');
      card.style.setProperty('--card-on-check', light ? '#1d1d1f' : '#f5f5f7');
    }
    $('card-color').value = s.cardColor;
    $('card-color-value').textContent = s.cardColor.toUpperCase();
    $('card-transparency').value = s.cardTransparency;
    $('card-transparency').style.setProperty('--fill', `${s.cardTransparency / 90 * 100}%`);
    $('intensity').style.setProperty('--fill', `${(s.intensity - 1) / 2 * 100}%`);
    $('card-transparency-value').textContent = `${s.cardTransparency}%`;
    $('card-text').value = s.cardText;
    document.querySelectorAll('[data-card-text]').forEach(b => { b.classList.toggle('active', b.dataset.cardText === s.cardText); b.setAttribute('aria-pressed', String(b.dataset.cardText === s.cardText)); });
    const paper = proPaper()?.thumb || (s.wallpaper === 'custom' && s.photo ? s.photo : s.wallpaper === 'system' ? '' : wallpaperOf(s.wallpaper).thumb);
    document.querySelectorAll('.mat-photo').forEach(img => { if (paper) { if (img.getAttribute('src') !== paper) img.src = paper; img.hidden = false; } else img.hidden = true; img.classList.toggle('monochrome', s.wallpaper === 'mono'); });
    document.querySelectorAll('[data-material]').forEach(b => { b.classList.toggle('active', b.dataset.material === s.cardMaterial); b.setAttribute('aria-pressed', String(b.dataset.material === s.cardMaterial)); });
    document.querySelectorAll('[data-card-color]').forEach(b => { b.classList.toggle('active', b.dataset.cardColor.toLowerCase() === s.cardColor.toLowerCase()); b.setAttribute('aria-pressed', String(b.dataset.cardColor.toLowerCase() === s.cardColor.toLowerCase())); });
  }

