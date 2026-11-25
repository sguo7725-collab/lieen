  /* ---------- Search: tasks, notes, subtasks and history ---------- */
  function openSearch() {
    if (document.body.dataset.view !== 'tasks') setView('tasks');
    document.body.classList.add('searching');
    $('search-bar').hidden = false; $('search-input').value = ''; renderSearch();
    $('search-input').focus();
  }
  function closeSearch() {
    if (!document.body.classList.contains('searching')) return false;
    document.body.classList.remove('searching'); $('search-bar').hidden = true; $('search-results').hidden = true; $('search-input').blur();
    return true;
  }
  function renderSearch() {
    const q = $('search-input').value.trim().toLowerCase();
    const box = $('search-results');
    box.hidden = false;
    if (!q) { box.innerHTML = `<p class="search-tip">${icon('sparkles')}可以搜标题、备注、子任务，也能搜到历史里完成过的事。</p>`; icons(box); return; }
    const hit = t => [t.title, t.note, ...(t.subtasks || []).map(s => s.title)].some(v => v && v.toLowerCase().includes(q));
    const open = state.tasks.filter(t => !t.done && hit(t)), done = state.tasks.filter(t => t.done && hit(t)), old = state.archive.filter(hit).slice(-30).reverse();
    const doneRow = (t, label) => `<div class="done-row">${icon('circle-check')}<s class="done-text">${esc(t.title)}</s><span class="archive-date">${label}</span></div>`;
    const fmt = new Intl.DateTimeFormat(LOC(), { month: 'numeric', day: 'numeric' });
    box.innerHTML = (open.length ? `<div class="list-heading"><span>待完成</span><span>${open.length}</span></div><div class="task-list">${open.map(row).join('')}</div>` : '')
      + (done.length ? `<div class="list-heading"><span>今天已完成</span><span>${done.length}</span></div>${done.map(t => doneRow(t, '今天')).join('')}` : '')
      + (old.length ? `<div class="list-heading"><span>历史</span><span>${old.length}</span></div>${old.map(t => doneRow(t, fmt.format(t.completedAt || t.archivedAt))).join('')}` : '')
      || `<div class="empty-state">${icon('search-x')}<span>没有找到“${esc($('search-input').value.trim())}”</span></div>`;
    icons(box);
  }

