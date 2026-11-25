  /* ---------- Backup: export and import (also accepts the native apps' exports) ---------- */
  function backupPayload() {
    const { photo, ...settings } = state.settings;
    return { app: 'suisui', version: SCHEMA, exportedAt: new Date().toISOString(), tasks: state.tasks, archive: state.archive, groups: state.groups, log: state.log, settings };
  }
  async function exportBackup() {
    if (PREVIEW) { showToast('预览页不能下载文件，请在正式网站导出'); return; }
    if (NATIVE) { try { NATIVE.exportBackup(JSON.stringify(backupPayload(), null, 2), `suisui-backup-${dayKey()}.json`); markBackup(); } catch { showToast('导出失败，请重试'); } return; }
    const name = `suisui-backup-${dayKey()}.json`;
    const blob = new Blob([JSON.stringify(backupPayload(), null, 2)], { type: 'application/json' });
    try {
      const file = new File([blob], name, { type: 'application/json' });
      if (isIOS() && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: '碎碎清单备份' }); markBackup(); showToast('已生成备份，可存到“文件”'); return; }
    } catch (error) { if (error?.name === 'AbortError') return; }
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    markBackup();
    showToast('已导出待办备份');
  }
  // Everything lives on this device only, so keep track of the last backup and nudge (at most weekly) when it gets old.
  const DAY_MS = 864e5;
  function markBackup() { state.settings.lastBackup = Date.now(); save(); renderBackupState(); }
  function renderBackupState() {
    const at = state.settings.lastBackup, el = $('backup-state');
    if (!el) return;
    const days = at ? Math.floor((Date.now() - at) / DAY_MS) : -1;
    el.textContent = days < 0 ? '还没有备份过' : days === 0 ? '今天已备份' : `上次备份：${days} 天前`;
    el.classList.toggle('is-old', days < 0 || days >= 14);
  }
  function backupNudge() {
    const s = state.settings, now = Date.now();
    if (!s.firstUse) { s.firstUse = now; save(); return; }
    const count = state.tasks.length + state.archive.length;
    const since = Math.max(s.lastBackup || 0, s.firstUse);
    if (count < 5 || now - since < 14 * DAY_MS || now - (s.backupNudged || 0) < 7 * DAY_MS) return;
    s.backupNudged = now; save();
    const days = Math.floor((now - since) / DAY_MS);
    setTimeout(() => showToast(s.lastBackup ? `已经 ${days} 天没备份了，待办只存在这台手机上` : '待办只存在这台手机上，建议备份一份', exportBackup, '备份', 10000), 1500);
  }
  function parseBackup(text) {
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('这个文件不是有效的 JSON 备份。'); }
    const list = Array.isArray(data) ? data : data?.tasks;
    if (!Array.isArray(list)) throw new Error('没有在文件里找到待办列表。');
    const tasks = uniqueTasks(list);
    const archive = uniqueTasks(data?.archive, normalizeArchived);
    if (!tasks.length && !archive.length) throw new Error('文件里没有可导入的待办。');
    const log = Array.isArray(data?.log) ? normalizeLog(data.log) : backfillLog(tasks, archive);
    return { tasks, archive, log, groups: Array.isArray(data?.groups) ? normalizeGroups(data.groups) : null, settings: data?.settings && typeof data.settings === 'object' ? data.settings : null };
  }
  function openImport(file) {
    $('import-error').textContent = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('备份文件过大（超过 2MB）'); return; }
    file.text().then(text => {
      pendingImport = parseBackup(text);
      const ids = new Set(state.tasks.map(t => t.id));
      const fresh = pendingImport.tasks.filter(t => !ids.has(t.id)).length;
      $('import-summary').textContent = `备份里有 ${pendingImport.tasks.length} 件待办${pendingImport.archive.length ? `、${pendingImport.archive.length} 条历史` : ''}。合并会加入其中 ${fresh} 件新的事项；替换会用备份覆盖当前清单。`;
      $('import-settings-row').hidden = !pendingImport.settings;
      $('import-settings').checked = false;
      $('import-dialog').showModal();
    }).catch(error => showToast(error.message || '未能读取这个文件'));
  }
  function mergeGroups(incoming) {
    if (!incoming) return;
    const known = new Set(state.groups.map(g => g.id));
    state.groups = [...state.groups, ...incoming.filter(g => !known.has(g.id))].slice(0, 12);
  }
  function applyImport(mode) {
    if (!pendingImport) return;
    const before = structuredClone(state);
    if (mode === 'replace') {
      state.tasks = pendingImport.tasks;
      state.archive = pendingImport.archive.slice(-ARCHIVE_LIMIT);
      if (pendingImport.groups) state.groups = pendingImport.groups;
      state.log = pendingImport.log;
      if (state.timer && !state.tasks.some(t => t.id === state.timer.id)) { state.timer = null; syncNativeTimer(); }
    } else {
      const ids = new Set(state.tasks.map(t => t.id));
      state.tasks.push(...pendingImport.tasks.filter(t => !ids.has(t.id)));
      const archived = new Set(state.archive.map(t => t.id));
      state.archive = [...state.archive, ...pendingImport.archive.filter(t => !archived.has(t.id) && !ids.has(t.id))].slice(-ARCHIVE_LIMIT);
      mergeGroups(pendingImport.groups);
      const seen = new Set(state.log.map(e => `${e.id}@${e.at}`));
      state.log = normalizeLog([...state.log, ...pendingImport.log.filter(e => !seen.has(`${e.id}@${e.at}`))]);
    }
    // Pro stays with this device: a backup (someone else's, or this phone's from before) never brings an unlock,
    // trial or pending order along — those come only from buying or redeeming here.
    if ($('import-settings').checked && pendingImport.settings) state.settings = cleanSettings({ ...pendingImport.settings, photo: state.settings.photo, wallpaper: pendingImport.settings.wallpaper === 'custom' ? state.settings.wallpaper : pendingImport.settings.wallpaper, pro: state.settings.pro });
    pendingImport = null; filter = 'all'; closeEdit();
    $('import-dialog').close();
    save(); render(); applySettings();
    showToast(mode === 'replace' ? '已用备份替换清单' : '已合并备份', () => { state = before; save(); render(); applySettings(); });
  }

