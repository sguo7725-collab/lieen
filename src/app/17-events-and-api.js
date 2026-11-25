  /* ---------- Events ---------- */
  document.addEventListener('click', (event) => {
    const b = event.target.closest('button');
    if (!b) return;
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.settingsPage) openSettingsPage(b.dataset.settingsPage);
    if (b.dataset.period) { review.period = b.dataset.period; review.offset = 0; renderReview(); }
    if (b.dataset.shift) { review.offset = Math.min(0, review.offset + Number(b.dataset.shift)); renderReview(); }
    if (b.dataset.reviewGroup) { review.group = b.dataset.reviewGroup; renderReview(); }
    if (b.dataset.editPanel) { editPanel = editPanel === b.dataset.editPanel ? '' : b.dataset.editPanel; renderEditSummary(); }
    if (b.dataset.subQuick) {
      const task = state.tasks.find(t => t.id === b.dataset.subQuick), sub = task?.subtasks?.find(x => x.id === b.dataset.subId);
      if (sub) { sub.done = !sub.done; haptic(); save(); render(); }
    }
    if (b.dataset.addGroup) { addGroupId = b.dataset.addGroup; renderAddChips(); icons($('add-form')); }
    if (b.dataset.addGroupNew) {
      addNaming = true; renderAddChips(); icons($('add-form'));
      $('add-group-name').focus();
    }
    if (b.dataset.addWhen) {
      $('task-when').value = addManual.when = b.dataset.addWhen; renderAddChips(); icons($('add-form'));
      if (b.dataset.addWhen === 'pick') { const d = $('task-date'); d.min = dayKey(); if (!d.value) d.value = addDays(dayKey(), 2); syncPickers(); try { d.showPicker(); } catch { d.focus(); } }
    }
    if (b.dataset.addRepeat) { $('task-repeat').value = addManual.repeat = b.dataset.addRepeat; renderAddChips(); icons($('add-form')); }
    if (b.dataset.addTime !== undefined) {
      addManual.customTime = b.dataset.addTime === 'custom';
      $('task-time').value = addManual.time = addManual.customTime ? ($('task-time-custom').value || '') : b.dataset.addTime;
      renderAddChips();
      if (addManual.customTime) { try { $('task-time-custom').showPicker(); } catch { $('task-time-custom').focus(); } }
    }
    if (b.dataset.editTime !== undefined) { $('edit-time').value = ''; syncPickers(); }
    if (b.dataset.addRing !== undefined) { $('task-ring').value = b.dataset.addRing; renderAddChips(); }
    if (b.dataset.editRing !== undefined) { $('edit-ring').value = b.dataset.editRing; syncPickers(); }
    if (b.dataset.addDuration) {
      customDuration.add = b.dataset.addDuration === 'custom';
      $('task-duration').value = customDuration.add ? String(readCustom($('task-duration-custom')) || 0) : b.dataset.addDuration;
      addManual.duration = Number($('task-duration').value) || 0; addManual.custom = customDuration.add;
      renderAddChips();
      if (customDuration.add) $('task-duration-custom').focus();
    }
    if (b.dataset.editDuration) {
      const form = $('edit-form');
      customDuration.edit = b.dataset.editDuration === 'custom';
      form.elements.duration.value = customDuration.edit ? String(readCustom($('edit-duration-custom')) || 0) : b.dataset.editDuration;
      durationChips('edit', Number(form.elements.duration.value) || 0, $('edit-duration-custom'));
      if (customDuration.edit) $('edit-duration-custom').focus();
    }
    if (b.dataset.editGroup || b.dataset.editRepeat || b.dataset.editWhen) {
      const form = $('edit-form'), task = state.tasks.find(t => t.id === form.dataset.editId);
      if (b.dataset.editWhen) $('edit-date').value = b.dataset.editWhen === 'tomorrow' ? addDays(dayKey(), 1) : '';
      editChips(task, b.dataset.editGroup || form.elements.group.value, b.dataset.editRepeat || form.elements.repeat.value);
    }
    if (b.dataset.filter) { filter = b.dataset.filter; editing = null; render(); }
    if (b.dataset.font) { state.settings.font = b.dataset.font; save(); applySettings(); }
    if (b.dataset.font) { state.settings.font = b.dataset.font; save(); applySettings(); }
    if (b.dataset.density) { state.settings.density = b.dataset.density; save(); applySettings(); }
    if (b.dataset.wallpaper) { state.settings.wallpaper = b.dataset.wallpaper; state.settings.wallpaperPicked = true; save(); applySettings(); icons($('wallpaper-library')); }
    if (b.dataset.material) { state.settings.cardMaterial = b.dataset.material; save(); applyCardAppearance(); applySettings(); }
    if (b.dataset.cardText) { state.settings.cardText = b.dataset.cardText; save(); applyCardAppearance(); }
    if (b.dataset.cardColor) { state.settings.cardColor = b.dataset.cardColor; save(); applySettings(); }
    if (b.dataset.uiStyle) {
      const st = state.settings, next = b.dataset.uiStyle;
      // 夜光 comes with its own 荧光; leaving it gives 墨黑 back. Other colours are kept as chosen.
      if (next === 'night' && st.accent === 'ink') st.accent = 'lime';
      if (next !== 'night' && st.accent === 'lime') st.accent = 'ink';
      st.uiStyle = next; save(); applySettings(); render();
    }
    if (b.dataset.themePreset) {
      const { name, ...values } = THEMES[b.dataset.themePreset];
      Object.assign(state.settings, values); save(); applySettings(); showToast(`锁屏卡片已换成“${name}”`);
    }
    if (b.dataset.groupColor) { const g = state.groups.find(x => x.id === b.dataset.groupId); if (g) { g.color = b.dataset.groupColor; save(); render(); } }
    if (b.dataset.groupDelete) deleteGroup(b.dataset.groupDelete);
    if (b.dataset.groupIconPick) { iconPicking = iconPicking === b.dataset.groupIconPick ? '' : b.dataset.groupIconPick; renderGroupSettings(); icons($('group-list')); }
    if (b.dataset.groupToggle) {
      editingGroup = editingGroup === b.dataset.groupToggle ? '' : b.dataset.groupToggle;
      document.querySelectorAll('.group-row').forEach(r => { const on = r.dataset.groupId === editingGroup; r.classList.toggle('is-open', on); r.querySelector('.group-head').setAttribute('aria-expanded', String(on)); });
    }
    if (b.dataset.groupIcon !== undefined && b.dataset.groupId) { const g = state.groups.find(x => x.id === b.dataset.groupId); if (g) { g.icon = b.dataset.groupIcon; iconPicking = ''; save(); render(); renderGroupSettings(); icons($('group-list')); } }
    const id = b.dataset.id, task = state.tasks.find(t => t.id === id);
    switch (b.dataset.action) {
      case 'complete': complete(id, b); break;
      case 'pin': if (task) { task.pinned = !task.pinned; save(); render(); } break;
      case 'edit': openEdit(id); break;
      case 'timer': startTimer(id); break;
      case 'first-add': openAdd(); break;
      case 'timer-stop': stopTimer(); break;
      case 'cancel-edit': closeEdit(); break;
      case 'restore': if (task) { unmarkDone(task); save(); render(); const restored = [...$('activity-list').querySelectorAll('button')].find(el => el.dataset.id === id); if (b.classList.contains('lock-task')) restored?.focus({ preventScroll: true }); showToast('已恢复到待完成'); } break;
      case 'delete': deleteTask(id); break;
      case 'unarchive': {
        const index = state.archive.findIndex(t => t.id === id);
        if (index < 0) break;
        const [item] = state.archive.splice(index, 1);
        const { archivedAt, ...restored } = item;
        if (state.tasks.some(t => t.id === restored.id)) restored.id = newId();
        state.tasks.push({ ...restored, done: false, completedAt: 0, date: '' });
        save(); render(); showToast('已放回今天');
        break;
      }
    }
  });
  function chosenDate() {
    const when = $('task-when').value;
    if (when === 'tomorrow') return addDays(dayKey(), 1);
    if (when === 'pick') return isDayKey($('task-date').value) ? $('task-date').value : null;
    return '';
  }
  $('add-form').addEventListener('submit', event => {
    event.preventDefault();
    const parsed = applyQuickParse();
    const title = (parsed.title || $('task-input').value).trim();
    if (!title) { $('form-error').textContent = '请先写下待办内容。'; return; }
    const date = chosenDate();
    if (date === null) { $('form-error').textContent = '请选择一个日期。'; return; }
    const repeat = repeats[$('task-repeat').value] ? $('task-repeat').value : 'none';
    const task = normalizeTask({ id: newId(), title, group: addGroupId, duration: Number($('task-duration').value) || 0, time: $('task-time').value, ring: $('task-ring').value === '1', repeat, repeatDay: quickRepeatDay ?? weekday(date || dayKey()), date: repeat === 'none' ? date : '', createdAt: Date.now() });
    state.tasks.push(task);
    if (filter !== 'all' && filter !== task.group) filter = 'all';
    $('task-input').value = ''; $('form-error').textContent = '';
    // Back to the defaults for the next one; the group stays (people add several to one group).
    $('task-when').value = 'today'; $('task-repeat').value = 'none'; $('task-date').value = '';
    $('task-duration').value = '0'; $('task-duration-custom').value = ''; customDuration.add = false;
    Object.assign(addManual, { when: 'today', date: '', repeat: 'none', duration: 0, custom: false, time: '', customTime: false }); quickRepeatDay = null; quickOff = false;
    $('task-time').value = ''; $('task-time-custom').value = ''; $('task-ring').value = '0';
    $('parse-hint').hidden = true; addPanel = '';
    save(); render(); $('task-input').focus();
    const added = document.querySelector(`.task-row[data-task-id="${CSS.escape(task.id)}"]`);
    if (added && state.settings.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches) window.anime.animate(added, { opacity: [0, 1], y: [-10, 0], duration: 360, ease: 'outCubic' });
    showToast(dueToday(task) ? '待办已添加' : `已添加到“以后”：${repeat === 'none' ? dateLabel(task.date) : repeatLabel(task)}`);
    requestPersistence();
  });
  function onEditSubmit(event) {
    event.preventDefault();
    const task = state.tasks.find(t => t.id === event.target.dataset.editId);
    const data = new FormData(event.target), title = String(data.get('title')).trim();
    if (!task || !title) return;
    const repeat = repeats[data.get('repeat')] ? data.get('repeat') : 'none';
    const date = isDayKey(data.get('date')) ? data.get('date') : '';
    task.title = title.slice(0, 120);
    task.pinned = data.get('pinned') === 'on';
    task.time = /^([01]\d|2[0-3]):[0-5]\d$/.test(String(data.get('time'))) ? String(data.get('time')) : '';
    task.ring = !!task.time && data.get('ring') === '1';
    task.note = String(data.get('note') || '').slice(0, 2000);
    const duration = Math.round(Number(data.get('duration')) || 0);
    task.duration = duration > 0 && duration <= 600 ? duration : 0;
    if (state.timer?.id === task.id && !task.duration) { settleTimer(false); }
    task.group = groupOf(data.get('group')).id;
    if (repeat === 'weekly' && task.repeat !== 'weekly') task.repeatDay = weekday(date || dayKey());
    task.repeat = repeat;
    task.date = repeat === 'none' ? date : '';
    if (repeat !== 'weekly') task.repeatDay = null;
    closeEdit();
    save(); render(); showToast(dueToday(task) ? '已保存修改' : `已保存，${task.repeat === 'none' ? dateLabel(task.date) : repeatLabel(task)}出现`);
  }
  $('edit-form').addEventListener('submit', onEditSubmit);
  $('edit-subtasks').addEventListener('click', event => {
    const task = editingTask(); if (!task) return;
    const toggle = event.target.closest('[data-sub-toggle]'), del = event.target.closest('[data-sub-delete]');
    if (toggle) { const s = task.subtasks.find(x => x.id === toggle.dataset.subToggle); if (s) { s.done = !s.done; haptic(); } }
    else if (del) task.subtasks = task.subtasks.filter(x => x.id !== del.dataset.subDelete);
    else return;
    renderSubtasks(task); save(); render();
  });
  $('subtask-input').addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    const task = editingTask(), title = $('subtask-input').value.trim();
    if (!task || !title || task.subtasks.length >= 30) return;
    task.subtasks.push({ id: newId('s'), title: title.slice(0, 120), done: false });
    $('subtask-input').value = '';
    renderSubtasks(task); save(); render();
  });
  $('edit-note').addEventListener('input', () => { const task = editingTask(); if (task) { task.note = $('edit-note').value.slice(0, 2000); clearTimeout(window.__noteTimer); window.__noteTimer = setTimeout(() => { save(); render(); }, 500); } });
  $('task-duration-custom').addEventListener('input', () => { $('task-duration').value = String(readCustom($('task-duration-custom'))); addManual.duration = Number($('task-duration').value) || 0; });
  $('task-date').addEventListener('change', () => { addManual.date = $('task-date').value; });
  $('task-time-custom').addEventListener('change', () => { $('task-time').value = addManual.time = $('task-time-custom').value; });
  $('task-input').addEventListener('input', () => { if (!$('task-input').value.trim()) quickOff = false; applyQuickParse(); });
  $('parse-hint').addEventListener('click', event => { if (event.target.closest('#parse-off')) { quickOff = true; applyQuickParse(); $('task-input').focus(); } });
  $('edit-duration-custom').addEventListener('input', () => { $('edit-form').elements.duration.value = String(readCustom($('edit-duration-custom'))); });
  $('edit-sheet').addEventListener('close', () => { editing = null; });
  $('edit-date').addEventListener('change', () => { const f = $('edit-form'); editChips(null, f.elements.group.value, f.elements.repeat.value); });
  $('group-list').addEventListener('change', event => {
    const emoji = event.target.closest('.group-emoji');
    if (emoji) {
      const g = state.groups.find(x => x.id === emoji.dataset.groupId);
      if (g) { g.emoji = Array.from(emoji.value.trim()).slice(0, 2).join(''); save(); render(); }
      return;
    }
    const input = event.target.closest('.group-name');
    if (!input) return;
    const g = state.groups.find(x => x.id === input.dataset.groupId);
    const name = input.value.trim().slice(0, 12);
    if (!g) return;
    if (!name) { input.value = g.name; return; }
    g.name = name; input.blur(); save(); render();
  });
  $('group-list').addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.matches('.group-name')) event.target.blur(); });
  $('group-list').addEventListener('focusout', event => { if (event.target.matches('.group-name')) setTimeout(renderGroupSettings, 0); });
  $('add-group').addEventListener('click', addGroup);
  $('undo-button').addEventListener('click', () => { const action = undoAction; hideToast(); action?.(); });
  $('close-toast').addEventListener('click', hideToast);
  ['see-all', 'preview-list-button'].forEach(id => $(id).addEventListener('click', () => setView('tasks')));
  $('fab-add').addEventListener('click', openAdd);
  $('focus-toggle').addEventListener('click', () => state.timer && startTimer(state.timer.id));
  $('focus-stop').addEventListener('click', stopTimer);
  $('focus-done').addEventListener('click', () => {
    const id = state.timer?.id, task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const button = document.querySelector(`.task-row[data-task-id="${CSS.escape(id)}"] .check-task`) || document.querySelector(`.lock-task[data-id="${CSS.escape(id)}"]`);
    if (button) complete(id, button); else { markDone(task); save(); render(); showToast('已完成一项待办', () => { unmarkDone(task); save(); render(); }); }
  });
  $('open-review').addEventListener('click', () => setView('review'));
  $('open-search').addEventListener('click', openSearch);
  $('search-cancel').addEventListener('click', closeSearch);
  $('search-input').addEventListener('input', renderSearch);
  $('review-back').addEventListener('click', () => setView('tasks'));
  $('review-export').addEventListener('click', exportPoster);
  $('poster-save').addEventListener('click', savePoster);
  $('close-poster').addEventListener('click', () => $('poster-dialog').close());
  $('tips-close').addEventListener('click', () => { state.settings.tipsSeen = true; save(); render(); });
  darkScheme.addEventListener?.('change', applySettings);
  $('add-backdrop').addEventListener('click', closeAdd);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAdd(); });
  // Swipe the sheet down to close it.
  let sheetStart = null;
  $('add-form').addEventListener('touchstart', event => { sheetStart = event.target.closest('.sheet-grip, .add-input-line') ? event.touches[0].clientY : null; }, { passive: true });
  $('add-form').addEventListener('touchend', event => { if (sheetStart !== null && event.changedTouches[0].clientY - sheetStart > 60) closeAdd(); sheetStart = null; });
  $('settings-back').addEventListener('click', () => openSettingsPage('index'));
  const openAbout = () => $('about-dialog').showModal();
  $('about-button').addEventListener('click', openAbout);
  $('about-row').addEventListener('click', openAbout);
  $('home-hero').addEventListener('click', () => openSettingsPage('look'));
  document.querySelectorAll('[name="lang"]').forEach(input => input.addEventListener('change', () => { state.settings.lang = input.value; save(); location.reload(); }));
  $('close-about').addEventListener('click', () => $('about-dialog').close());
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog && (event.offsetX < 0 || event.offsetY < 0 || event.offsetX > dialog.offsetWidth || event.offsetY > dialog.offsetHeight)) dialog.close(); }));
  document.querySelectorAll('[name="accent"]').forEach(input => input.addEventListener('change', () => { state.settings.accent = input.value; save(); applySettings(); }));
  $('text-size').addEventListener('input', () => { state.settings.textSize = Number($('text-size').value); save(); applySettings(); });
  $('motion-toggle').addEventListener('change', () => { state.settings.motion = $('motion-toggle').checked; save(); applySettings(); });
  $('intensity').addEventListener('input', () => { state.settings.intensity = Number($('intensity').value); save(); applySettings(); });
  $('card-color').addEventListener('input', () => { state.settings.cardColor = $('card-color').value; applyCardAppearance(); save(); });
  $('card-transparency').addEventListener('input', () => { state.settings.cardTransparency = Number($('card-transparency').value); applyCardAppearance(); save(); });

  $('archive-toggle').addEventListener('change', () => { state.settings.autoArchive = $('archive-toggle').checked; save(); });
  // Reminders are silent by default; this rings with the phone's ringtone (the native apps re-plan on save)
  $('privacy-toggle').addEventListener('change', () => { state.settings.lockPrivacy = $('privacy-toggle').checked; lastNotified = ''; save(); renderPreview(); icons(); showToast(state.settings.lockPrivacy ? '锁屏上只显示数量，解锁后才能看到内容' : '锁屏上会显示待办内容'); });
  $('notify-toggle').addEventListener('change', () => enableLockNotify($('notify-toggle').checked));
  if (IOS_APP) {
    $('live-toggle').addEventListener('change', () => {
      const on = $('live-toggle').checked;
      try { IOS_APP.liveActivity(on); } catch { /* ignore */ }
      showToast(on ? '已在锁屏显示今天的待办' : '已从锁屏移除');
    });
    $('ios-notify-button').addEventListener('click', () => { try { IOS_APP.requestNotifications(); } catch { /* ignore */ } });
    $('open-ios-setup').addEventListener('click', openIOSSetup);
    $('close-ios-setup').addEventListener('click', () => { state.settings.iosSetupSeen = true; save(); $('ios-setup').close(); });
    $('finish-ios-setup').addEventListener('click', () => { state.settings.iosSetupSeen = true; save(); $('ios-setup').close(); showToast(pending().length ? '好了，锁上手机看看' : '好了，加一件待办后锁上手机看看'); });
    $('ios-setup').addEventListener('click', event => {
      const step = event.target.closest('[data-ios-setup]')?.dataset.iosSetup; if (!step) return;
      const st = iosStatus();
      try {
        if (step === 'notify') IOS_APP.requestNotifications();
        if (step === 'live') { if (st.liveAllowed === false) IOS_APP.openSettings?.(); else IOS_APP.liveActivity(true); }
      } catch { /* ignore */ }
    });
  } else document.getElementById('open-ios-setup')?.remove();
  if (ANDROID) {
    $('lockscreen-toggle').addEventListener('change', () => {
      state.settings.lockScreen = $('lockscreen-toggle').checked; save(); renderAndroidLock();
      if (state.settings.lockScreen) { const p = androidPermissions(); if (!p.overlay || !p.notifications) openAndroidSetup(); else showToast('已开启锁屏显示，熄屏后再亮屏看看'); }
      else showToast('已关闭锁屏显示');
    });
    $('open-android-setup').addEventListener('click', openAndroidSetup);
    $('close-android-setup').addEventListener('click', () => $('android-setup').close());
    $('finish-android-setup').addEventListener('click', () => { state.settings.androidSetupSeen = true; save(); $('android-setup').close(); showToast('设置好了，熄屏后再亮屏看看'); });
    $('android-setup').addEventListener('click', event => {
      const step = event.target.closest('[data-setup]')?.dataset.setup;
      try {
        if (step === 'notify') ANDROID.requestNotificationPermission();
        if (step === 'overlay') ANDROID.openOverlaySettings();
        if (step === 'brand') ANDROID.openAppPermissions();
        if (step === 'battery') ANDROID.requestBatteryExemption();
        if (step === 'fullscreen') ANDROID.openFullScreenSettings();
      } catch { /* ignore */ }
    });
    window.suisuiAndroidResume = () => { renderNotifySetting(); save(); };
  }
  window.suisuiAndroidPermission = granted => { renderNotifySetting(); if (!granted && state.settings.lockNotify) showToast('没有通知权限，锁屏卡片无法显示'); };
  window.suisuiExportDone = ok => showToast(ok ? '已导出待办备份' : '没有导出');
  $('notify-test').addEventListener('click', () => {
    if (ANDROID) { try { ANDROID.openNotificationSettings(); } catch { /* ignore */ } return; }
    updateLockNotification(true); showToast(pending().length ? '已刷新锁屏通知，锁屏即可看到' : '全部完成，没有需要提醒的事项');
  });
  $('reset-settings').addEventListener('click', () => {
    const { autoArchive, lockNotify, lockScreen, lockPrivacy, installDismissed, androidSetupSeen, iosSetupSeen, tipsSeen } = state.settings;
    state.settings = { ...defaults, autoArchive, lockNotify, lockScreen, lockPrivacy, installDismissed, androidSetupSeen, iosSetupSeen, tipsSeen }; save(); applySettings(); showToast('已恢复默认外观');
  });
  $('wallpaper-file').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    $('wallpaper-error').textContent = '';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) { $('wallpaper-error').textContent = '请选择 3MB 以内的 JPG、PNG 或 WebP 图片。'; return; }
    const reader = new FileReader();
    reader.onload = () => { state.settings.photo = reader.result; state.settings.wallpaper = 'custom'; state.settings.wallpaperPicked = true; save(); applySettings(); if (!photoOK) $('wallpaper-error').textContent = '图片太大，本机存储放不下，请换一张小一些的照片。'; };
    reader.onerror = () => { $('wallpaper-error').textContent = '未能读取这张图片，请重新选择。'; };
    reader.readAsDataURL(file);
    event.target.value = '';
  });
  $('reset-button').hidden = !DEMO || !!SHOWCASE; // sample list only in demo/test builds
  $('reset-button').addEventListener('click', () => {
    const previous = structuredClone({ tasks: state.tasks, groups: state.groups });
    state.tasks = examples(); state.groups = structuredClone(DEFAULT_GROUPS); closeEdit(); filter = 'all'; save(); render();
    showToast('已恢复示例清单', () => { state.tasks = previous.tasks; state.groups = previous.groups; save(); render(); });
  });
  $('clear-done').addEventListener('click', moveDoneToArchive);
  // 外观 has two tabs: App 界面 / 锁屏卡片. (Automated checks can show both at once with SUISUI_LOOK_ALL.)
  const lookPage = document.querySelector('.settings-page[data-page=look]');
  function setLookTab(tab) {
    lookPage.dataset.tab = window.SUISUI_LOOK_ALL ? 'all' : tab;
    document.querySelectorAll('[data-look-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.lookTab === tab)));
    $('settings-scroll').scrollTop = 0;
  }
  document.querySelectorAll('[data-look-tab]').forEach(b => b.addEventListener('click', () => setLookTab(b.dataset.lookTab)));
  setLookTab('app');
  $('export-button').addEventListener('click', exportBackup);
  $('import-button').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', event => { openImport(event.target.files[0]); event.target.value = ''; });
  $('import-merge').addEventListener('click', () => applyImport('merge'));
  $('import-replace').addEventListener('click', () => applyImport('replace'));
  $('import-cancel').addEventListener('click', () => { pendingImport = null; $('import-dialog').close(); });
  $('install-howto').addEventListener('click', () => $('install-dialog').showModal());
  $('install-native').addEventListener('click', async () => { const prompt = installPrompt; installPrompt = null; renderInstallBanner(); try { await prompt?.prompt(); } catch { /* dismissed */ } });
  $('install-later').addEventListener('click', () => { state.settings.installDismissed = true; save(); renderInstallBanner(); });
  $('close-install').addEventListener('click', () => $('install-dialog').close());
  $('settings-install').addEventListener('click', () => $('install-dialog').showModal());
  if (NATIVE) { $('settings-install').hidden = true; document.querySelector('.links-row a[href="iphone.html"]')?.remove(); }
  if (IOS_APP) document.documentElement.classList.add('ios-app');
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; renderInstallBanner(); });
  window.addEventListener('appinstalled', () => { installPrompt = null; renderInstallBanner(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') updateLockNotification();
    else { clock(); renderNotifySetting(); }
  });
  window.addEventListener('pagehide', () => updateLockNotification());
  // 丙午年九月廿六: the Chinese calendar date for the lock screen, when the browser knows it.
  function lunar(date) {
    try {
      const parts = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', { year: 'numeric', month: 'long', day: 'numeric' }).formatToParts(date);
      const get = type => parts.find(p => p.type === type)?.value || '';
      const d = Number(get('day')), month = get('month'), year = get('yearName');
      if (!d || !month) return '';
      const n = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
      const day = d <= 10 ? `初${n[d]}` : d < 20 ? `十${n[d - 10]}` : d === 20 ? '二十' : d < 30 ? `廿${n[d - 20]}` : '三十';
      return `${year ? `${year}年` : ''}${month}${day}`;
    } catch { return ''; }
  }
  function clock() {
    const date = new Date();
    $('header-date').textContent = new Intl.DateTimeFormat(LOC(), { month: 'long', day: 'numeric', weekday: 'long' }).format(date);
    $('lock-date').textContent = LOC() === 'zh-CN'
      ? `${new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(date)}${lunar(date) ? ` · ${lunar(date)}` : ''}`
      : new Intl.DateTimeFormat(LOC(), { month: 'long', day: 'numeric', weekday: 'long' }).format(date);
    $('lock-time').textContent = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    // the settings strip is short: date and weekday only (the lock screen itself also shows the lunar date)
    $('hero-lock-date').textContent = $('lock-date').textContent.split(' · ')[0]; $('hero-lock-time').textContent = $('lock-time').textContent;
    if (rollover()) render();
  }
  // Lock mode (Android LockActivity): only the designed lock screen, over the system lock screen.
  if (LOCK_MODE) {
    document.body.classList.add('lock-mode');
    $('lock-exit').hidden = false;
    const leave = openApp => { try { ANDROID.unlock(openApp); } catch { /* ignore */ } };
    $('lock-exit').addEventListener('click', () => leave(false));
    ['see-all', 'preview-list-button'].forEach(id => $(id).addEventListener('click', event => { event.stopImmediatePropagation(); leave(true); }, true));
    $('activity-list').addEventListener('click', event => { if (event.target.closest('#lock-reveal')) leave(true); });
    let startY = null;
    $('lockscreen').addEventListener('touchstart', event => { startY = event.target.closest('#activity') ? null : event.touches[0].clientY; }, { passive: true });
    $('lockscreen').addEventListener('touchend', event => { if (startY !== null && startY - event.changedTouches[0].clientY > 90) leave(false); startY = null; });
    // the lock view stays loaded between screen-offs (Android keeps it in the background): catch up on a new day too
    window.suisuiLockShown = () => { rollover({ announce: false }); $('activity-list').scrollTop = 0; clock(); };
  }
  let booted = false;
  rollover({ announce: false });
  booted = true;
  const params = new URLSearchParams(location.search);
  window.SuiSuiI18n?.setLang(state.settings.lang);
  setupPickers();
  placeChrome(); phoneQuery.addEventListener?.('change', placeChrome);
  setView(LOCK_MODE ? 'tasks' : params.get('view')); if (params.get('page')) openSettingsPage(params.get('page')); render(); applySettings(); clock(); save(); renderInstallBanner();
  if (ANDROID && !LOCK_MODE && state.settings.lockScreen && !state.settings.androidSetupSeen) setTimeout(openAndroidSetup, 600);
  if (!LOCK_MODE) {
    const addFromLock = () => {
      let at = 0; try { at = Number(localStorage.getItem('suisui-open-add')) || 0; localStorage.removeItem('suisui-open-add'); } catch { /* ignore */ }
      if (at && Date.now() - at < 60000) setTimeout(openAdd, 250);
    };
    addFromLock();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) addFromLock(); });
  }
  renderBackupState();
  if (!LOCK_MODE && !PREVIEW) backupNudge();
  if (isStandalone()) requestPersistence();
  else navigator.storage?.persisted?.().then(value => { persisted = value; $('storage-status').textContent = storageCopy(); }).catch(() => {});
  setInterval(clock, 30000);
  // Test and support hook: lets automated checks and support staff inspect the state without touching storage.
  window.suisui = { dayKey, rollover: () => rollover(), notificationContent, dueToday, version: SCHEMA };
  // Pro (app/pro.js) reads and changes state through this; the base app runs the same without it.
  window.suisui.pro = {
    get state() { return state; }, save, render, applySettings, showToast, hideToast, icons, esc, dayKey, addDays, pending, groupOf, haptic, lunar,
    native: NATIVE, platform: IOS_APP ? 'ios' : ANDROID ? 'android' : 'web', isPreview: PREVIEW, lockMode: LOCK_MODE,
    saveImage(canvas, name) { posterBlob = null; return new Promise(resolve => canvas.toBlob(async blob => { posterBlob = blob; posterName = name; $('poster-image').src = canvas.toDataURL('image/png'); await savePoster(); resolve(); }, 'image/png')); }
  };
  window.dispatchEvent(new Event('suisui:ready'));
