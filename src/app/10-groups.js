  /* ---------- Groups ---------- */
  function addGroup() {
    if (state.groups.length >= 12) return;
    const used = new Set(state.groups.map(g => g.color));
    const group = { id: newId('g'), name: `分组 ${state.groups.length + 1}`, color: GROUP_COLORS.find(c => !used.has(c)) || GROUP_COLORS[state.groups.length % GROUP_COLORS.length] };
    editingGroup = group.id;
    state.groups.push(group); save(); render();
    const input = document.querySelector(`.group-name[data-group-id="${group.id}"]`);
    input?.focus(); input?.select();
  }
  function deleteGroup(id) {
    if (state.groups.length <= 1) { showToast('至少保留一个分组'); return; }
    const before = structuredClone({ groups: state.groups, tasks: state.tasks, archive: state.archive });
    const group = state.groups.find(g => g.id === id);
    state.groups = state.groups.filter(g => g.id !== id);
    const fallback = state.groups[0];
    let moved = 0;
    for (const t of [...state.tasks, ...state.archive]) if (t.group === id) { t.group = fallback.id; moved++; }
    if (filter === id) filter = 'all';
    save(); render();
    showToast(`已删除“${group?.name || '分组'}”${moved ? `，${moved} 件移到“${fallback.name}”` : ''}`, () => { Object.assign(state, before); save(); render(); });
  }

