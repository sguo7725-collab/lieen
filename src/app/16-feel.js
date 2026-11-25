  /* ---------- Feel: haptics, swipe rows ---------- */
  // A short tick when a gesture arms and when a task is done. Android app: native haptics; Android Chrome: vibrate.
  function haptic(kind = 'tick') {
    try { if (NATIVE?.haptic) NATIVE.haptic(kind); else navigator.vibrate?.(kind === 'done' ? 14 : 6); } catch { /* optional */ }
  }
  function deleteTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const index = state.tasks.indexOf(task);
    if (state.timer?.id === id) { state.timer = null; syncNativeTimer(); }
    state.tasks.splice(index, 1); closeEdit(); save(); render();
    showToast('已删除待办', () => { state.tasks.splice(Math.min(index, state.tasks.length), 0, task); save(); render(); });
  }
  // Swipe a row right to finish it, left to delete it (undo in the toast). Vertical scrolling is untouched.
  const SWIPE_ARM = 84;
  let swipe = null, swallowClick = false;
  function endSwipe(commit) {
    if (!swipe) return;
    const { row, dx, armed } = swipe;
    swipe = null;
    row.classList.remove('swiping');
    if (commit && armed) {
      swallowClick = true; setTimeout(() => { swallowClick = false; }, 350);
      row.style.removeProperty('--dx'); delete row.dataset.swipe; row.classList.remove('armed');
      const id = row.dataset.taskId;
      if (dx > 0) complete(id, row.querySelector('.check-task'));
      else { haptic('done'); deleteTask(id); }
      return;
    }
    if (Math.abs(dx) > 6) { swallowClick = true; setTimeout(() => { swallowClick = false; }, 350); }
    row.classList.add('settling'); row.style.setProperty('--dx', '0px');
    setTimeout(() => { row.classList.remove('settling', 'armed'); delete row.dataset.swipe; row.style.removeProperty('--dx'); }, 220);
  }
  // Long press (or right click) on a task: quick actions without opening the editor.
  let pressTimer = null;
  const cancelPress = () => { clearTimeout(pressTimer); pressTimer = null; };
  function openQuickMenu(id) {
    const t = state.tasks.find(x => x.id === id);
    if (!t) return;
    haptic();
    const today = dayKey(), running = state.timer?.id === id;
    const actions = [
      t.duration && !t.done ? ['timer', running ? (state.timer.endsAt ? 'pause' : 'play') : 'play', running ? (state.timer.endsAt ? '暂停计时' : '继续计时') : `开始计时 · ${durationText(t.duration)}`] : null,
      ['pin', 'pin', t.pinned ? '取消置顶' : '置顶'],
      t.repeat === 'none' && t.date !== addDays(today, 1) ? ['tomorrow', 'sunrise', '明天再做'] : null,
      t.repeat === 'none' && t.date && t.date > today ? ['today', 'sun', '改到今天'] : null,
      ['edit', 'pencil', '编辑'],
      ['delete', 'trash-2', '删除', 'danger']
    ].filter(Boolean);
    $('quick-title').textContent = t.title;
    $('quick-actions').innerHTML = actions.map(([key, ic, label, cls]) => `<button class="quick-action${cls ? ` ${cls}` : ''}" data-quick="${key}" data-id="${esc(id)}">${icon(ic)}<span>${label}</span></button>`).join('');
    $('quick-menu').showModal(); icons($('quick-menu'));
  }
  $('quick-actions').addEventListener('click', event => {
    const b = event.target.closest('[data-quick]');
    if (!b) return;
    const id = b.dataset.id, t = state.tasks.find(x => x.id === id);
    $('quick-menu').close();
    if (!t) return;
    const before = { date: t.date, pinned: t.pinned };
    switch (b.dataset.quick) {
      case 'timer': startTimer(id); break;
      case 'pin': t.pinned = !t.pinned; save(); render(); showToast(t.pinned ? '已置顶' : '已取消置顶'); break;
      case 'tomorrow': t.date = addDays(dayKey(), 1); save(); render(); showToast('已移到明天', () => { t.date = before.date; save(); render(); }); break;
      case 'today': t.date = ''; save(); render(); showToast('已改到今天', () => { t.date = before.date; save(); render(); }); break;
      case 'edit': openEdit(id); break;
      case 'delete': deleteTask(id); break;
    }
  });
  document.addEventListener('contextmenu', event => {
    const row = event.target.closest('#task-list .task-row, #later-list .task-row');
    if (!row || LOCK_MODE) return;
    event.preventDefault(); cancelPress(); openQuickMenu(row.dataset.taskId);
  });
  // Long press lifts a row in today's list: drag to reorder (drag to the top to pin), or let go to get the menu.
  let drag = null;
  function liftRow(row, y, pointer) {
    swipe = null; swallowClick = true;
    haptic();
    const rows = [...$('task-list').querySelectorAll('.task-row')];
    drag = { row, id: row.dataset.taskId, y, pointer, dy: 0, moved: false, rows, from: rows.indexOf(row), to: rows.indexOf(row), h: row.offsetHeight };
    row.classList.add('lifted');
  }
  function moveDrag(y) {
    const d = drag; d.dy = y - d.y;
    if (Math.abs(d.dy) > 6) d.moved = true;
    d.row.style.transform = `translateY(${d.dy}px) scale(1.02)`;
    const center = d.row.offsetTop + d.h / 2 + d.dy;
    let to = 0;
    d.rows.forEach((r, i) => { if (r !== d.row && r.offsetTop + r.offsetHeight / 2 < center) to++; });
    if (to !== d.to) { d.to = to; haptic(); }
    d.rows.forEach((r, i) => {
      if (r === d.row) return;
      const shift = d.from < d.to ? (i > d.from && i <= d.to ? -d.h : 0) : (i >= d.to && i < d.from ? d.h : 0);
      r.style.transform = shift ? `translateY(${shift}px)` : '';
    });
  }
  function endDrag(cancelled) {
    const d = drag; drag = null;
    if (!d) return;
    setTimeout(() => { swallowClick = false; }, 400);
    d.rows.forEach(r => { r.style.transform = ''; r.classList.remove('lifted'); });
    if (cancelled) return;
    if (!d.moved) { openQuickMenu(d.id); return; }
    if (d.to === d.from) return;
    const ids = d.rows.map(r => r.dataset.taskId);
    ids.splice(d.to, 0, ids.splice(d.from, 1)[0]);
    const task = state.tasks.find(t => t.id === d.id);
    // Dropped among the pinned rows → pinned; dragged below them → unpinned.
    const pinnedOthers = ids.filter(id => id !== d.id && state.tasks.find(t => t.id === id)?.pinned).length;
    if (task && pinnedOthers) task.pinned = d.to < pinnedOthers;
    // Put the visible tasks back into the slots they occupy in the full list, in the new order.
    const slots = state.tasks.map((t, i) => ids.includes(t.id) ? i : -1).filter(i => i >= 0);
    const moved = ids.map(id => state.tasks.find(t => t.id === id));
    slots.forEach((slot, k) => { state.tasks[slot] = moved[k]; });
    save(); render(); showToast('已调整顺序');
  }
  document.addEventListener('touchmove', event => { if (drag) event.preventDefault(); }, { passive: false });
  document.addEventListener('pointerdown', event => {
    const row = event.target.closest('#task-list .task-row, #later-list .task-row');
    if (!row || event.button !== 0 || completing.has(row.dataset.taskId) || LOCK_MODE) return;
    swipe = { row, x: event.clientX, y: event.clientY, dx: 0, horizontal: null, armed: false, pointer: event.pointerId };
    cancelPress();
    const y = event.clientY, pointer = event.pointerId, today = !!row.closest('#task-list');
    pressTimer = setTimeout(() => {
      pressTimer = null;
      if (!swipe || swipe.horizontal) return;
      if (today) liftRow(row, y, pointer);
      else { swipe = null; swallowClick = true; setTimeout(() => { swallowClick = false; }, 600); openQuickMenu(row.dataset.taskId); }
    }, 450);
  });
  document.addEventListener('pointermove', event => { if (drag && event.pointerId === drag.pointer) moveDrag(event.clientY); });
  document.addEventListener('pointerup', event => { cancelPress(); if (drag && event.pointerId === drag.pointer) endDrag(false); });
  document.addEventListener('pointercancel', () => { cancelPress(); if (drag) endDrag(true); });
  document.addEventListener('pointermove', event => {
    if (!swipe || event.pointerId !== swipe.pointer) return;
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) cancelPress();
    if (swipe.horizontal === null) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      swipe.horizontal = Math.abs(dx) > Math.abs(dy) * 1.3;
      if (!swipe.horizontal) { swipe = null; return; }
      swipe.row.classList.add('swiping');
      try { swipe.row.setPointerCapture(event.pointerId); } catch { /* ignore */ }
    }
    const limit = swipe.row.clientWidth * .6;
    swipe.dx = Math.max(-limit, Math.min(limit, dx));
    swipe.row.dataset.swipe = swipe.dx > 0 ? 'done' : 'delete';
    swipe.row.style.setProperty('--dx', `${swipe.dx}px`);
    const armed = Math.abs(swipe.dx) >= SWIPE_ARM;
    if (armed !== swipe.armed) { swipe.armed = armed; swipe.row.classList.toggle('armed', armed); if (armed) haptic(); }
  });
  document.addEventListener('pointerup', event => { if (swipe && event.pointerId === swipe.pointer) endSwipe(swipe.horizontal === true); });
  document.addEventListener('pointercancel', () => endSwipe(false));
  document.addEventListener('click', event => { if (swallowClick && event.target.closest('.task-row')) { event.stopPropagation(); event.preventDefault(); } }, true);

