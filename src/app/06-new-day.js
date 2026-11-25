  /* ---------- A new day: reset repeating tasks, archive yesterday's finished items ---------- */
  function rollover({ announce = true } = {}) {
    // A page left open in the background (e.g. the lock view overnight) must not roll over its old copy.
    if (NATIVE && booted) syncFromNative();
    const today = dayKey();
    if (state.day === today || isBusy()) return false;
    const cutoff = startOfToday();
    let reset = 0, archived = 0;
    const keep = [];
    for (const t of state.tasks) {
      if (t.done && t.repeat !== 'none') { t.done = false; t.completedAt = 0; reset++; keep.push(t); }
      else if (t.done && state.settings.autoArchive && (t.completedAt || 0) < cutoff) { state.archive.push({ ...t, archivedAt: Date.now() }); archived++; }
      else keep.push(t);
    }
    state.tasks = keep;
    state.archive = state.archive.slice(-ARCHIVE_LIMIT);
    state.day = today;
    save();
    if (announce && (reset || archived)) {
      render();
      showToast(`新的一天：${[archived && `${archived} 件已完成移入历史`, reset && `${reset} 件重复事项已重置`].filter(Boolean).join('，')}`);
    }
    return true;
  }
  function moveDoneToArchive() {
    const done = state.tasks.filter(t => t.done && t.repeat === 'none');
    if (!done.length) { showToast('重复的事项会在下次该做时自动重置，不需要清理'); return; }
    const before = { tasks: structuredClone(state.tasks), archive: structuredClone(state.archive) };
    const now = Date.now();
    state.archive.push(...done.map(t => ({ ...t, archivedAt: now })));
    state.archive = state.archive.slice(-ARCHIVE_LIMIT);
    state.tasks = state.tasks.filter(t => !done.includes(t));
    save(); render();
    showToast(`已把 ${done.length} 件移入历史`, () => { state.tasks = before.tasks; state.archive = before.archive; save(); render(); });
  }

