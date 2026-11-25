  /* ---------- Add sheet (phones) / inline form (wider screens) ---------- */
  let addGroupId = '';
  let addNaming = false;
  // finish naming a group made from the add sheet: an empty name just closes the field
  function commitAddGroup(keep) {
    if (!addNaming) return;
    const name = ($('add-group-name')?.value || '').trim().slice(0, 12);
    addNaming = false;
    if (keep && name && state.groups.length < 12) {
      const used = new Set(state.groups.map(g => g.color));
      const group = { id: newId('g'), name, color: GROUP_COLORS.find(c => !used.has(c)) || GROUP_COLORS[state.groups.length % GROUP_COLORS.length] };
      state.groups.push(group); addGroupId = group.id; save(); render(); haptic();
    }
    renderAddChips(); icons($('add-form'));
    $('task-input')?.focus({ preventScroll: true });
  }
  function renderAddChips() {
    if (!state.groups.some(g => g.id === addGroupId)) addGroupId = state.groups[0].id;
    $('task-group').value = addGroupId;
    // 1.22: a group can be made right here, without leaving the add sheet for 设置 > 清单
    const newGroup = state.groups.length >= 12 ? ''
      : addNaming ? `<span class="chip chip-new-group is-editing"><input id="add-group-name" maxlength="12" placeholder="分组名" aria-label="新分组的名字" enterkeyhint="done" autocomplete="off"></span>`
      : `<button type="button" class="chip chip-new-group" data-add-group-new="1">${icon('plus')}新建分组</button>`;
    const typing = $('add-group-name'), typed = typing?.value || '', hadFocus = typing && document.activeElement === typing;
    $('add-group-chips').innerHTML = state.groups.map(g => `<button type="button" class="chip${g.id === addGroupId ? ' active' : ''}" data-add-group="${esc(g.id)}" aria-pressed="${g.id === addGroupId}"><span class="dot" style="background:${g.color}"></span>${esc(g.name)}</button>`).join('') + newGroup;
    const naming = $('add-group-name');
    if (naming) {
      naming.value = typed;
      naming.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); commitAddGroup(true); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); commitAddGroup(false); }
      });
      naming.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== $('add-group-name')) commitAddGroup(true); }, 0));
      if (hadFocus) naming.focus({ preventScroll: true });
    }
    icons($('add-group-chips'));
    const when = $('task-when').value, repeat = $('task-repeat').value;
    const dateless = repeat === 'daily' || repeat === 'weekdays';
    document.querySelectorAll('[data-add-when]').forEach(b => { const on = b.dataset.addWhen === when; b.classList.toggle('active', on && !dateless); b.setAttribute('aria-pressed', String(on)); b.disabled = dateless; });
    document.querySelectorAll('[data-add-repeat]').forEach(b => { const on = b.dataset.addRepeat === repeat; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    $('task-date').hidden = when !== 'pick' || dateless;
    durationChips('add', Number($('task-duration').value) || 0, $('task-duration-custom'));
    const time = $('task-time').value, presetTime = ['', '09:00', '12:00', '18:00', '21:00'].includes(time);
    const customTime = addManual.customTime || !presetTime;
    document.querySelectorAll('[data-add-time]').forEach(b => { const on = b.dataset.addTime === 'custom' ? customTime : !customTime && b.dataset.addTime === time; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    $('task-time-custom').hidden = !customTime;
    const ring = $('task-ring').value === '1';
    $('add-ring-row').hidden = !time;
    document.querySelectorAll('[data-add-ring]').forEach(b => { const on = (b.dataset.addRing === '1') === ring; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    if (customTime && time && document.activeElement !== $('task-time-custom')) $('task-time-custom').value = time;
    syncPickers();
    renderAddToolbar();
    markAddDefaults();
  }
  // One compact toolbar instead of five rows of options: each tool shows its current value and opens its own row.
  let addPanel = '', editPanel = '';
  const durLabel = m => m ? durationText(m) : '';
  const repeatText = (repeat, day) => repeat === 'weekly' ? `每${WEEK[Number.isInteger(day) ? day : 1]}` : repeat !== 'none' ? repeats[repeat] : '';
  // 1.18: one row of value pills; tapping a pill opens only its options (most of the time you just type and send).
  function renderAddToolbar() {
    const form = $('add-form'); if (!form) return;
    const when = $('task-when').value, repeat = $('task-repeat').value, time = $('task-time').value, minutes = Number($('task-duration').value) || 0, g = groupOf(addGroupId), today = dayKey();
    const dateless = repeat === 'daily' || repeat === 'weekdays', picked = $('task-date').value;
    const put = (name, text, set) => { const el = $(`ap-${name}`); if (!el) return; el.textContent = text; el.parentElement.classList.toggle('is-set', !!set); };
    put('when', dateless ? '按重复' : when === 'tomorrow' ? '明天' : when === 'pick' && picked ? (picked === today ? '今天' : picked === addDays(today, 1) ? '明天' : dateLabel(picked)) : '今天', !dateless && when !== 'today');
    put('time', time ? `${time}${$('task-ring').value === '1' ? ' · 响铃' : ''}` : '时间', !!time);
    put('repeat', repeatText(repeat, weekday(today)) || '重复', repeat !== 'none');
    put('duration', durLabel(minutes) || '时长', minutes > 0);
    const gp = $('ap-group'); if (gp) { gp.innerHTML = `<span class="dot" style="background:${g.color}"></span>${esc(g.name)}`; gp.parentElement.classList.toggle('is-set', state.groups.length > 1 && g.id !== state.groups[0].id); }
    form.dataset.open = addPanel;
    document.querySelectorAll('[data-add-panel]').forEach(b => { const on = b.dataset.addPanel === addPanel; b.setAttribute('aria-expanded', String(on)); b.classList.toggle('open', on); });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add-panel]'); if (!b) return;
    addPanel = addPanel === b.dataset.addPanel ? '' : b.dataset.addPanel; renderAddToolbar();
  });
  // The edit sheet lists one line per setting (icon, name, value); tapping a line opens its options under it.
  function renderEditSummary() {
    const form = $('edit-form'); if (!form) return;
    const repeat = form.elements.repeat.value || 'none', today = dayKey(), date = $('edit-date').value, time = $('edit-time').value;
    const minutes = Number(form.elements.duration.value) || 0, g = groupOf(form.elements.group.value);
    const task = state.tasks.find(t => t.id === editing);
    const day = repeat === 'weekly' ? (task?.repeat === 'weekly' && Number.isInteger(task.repeatDay) ? task.repeatDay : weekday(date || today)) : null;
    const put = (name, text, on) => { const el = $(`fv-${name}`); el.textContent = text; el.classList.toggle('is-set', !!on); };
    put('when', repeat === 'daily' || repeat === 'weekdays' ? '按重复出现' : !date || date === today ? '今天' : date === addDays(today, 1) ? '明天' : dateLabel(date), !!date && date !== today);
    put('time', time ? `${time}${form.elements.ring.value === '1' ? ' · 响铃' : ''}` : '不设', !!time);
    put('repeat', repeatText(repeat, day) || '不重复', repeat !== 'none');
    put('duration', durLabel(minutes) || '不计时', minutes > 0);
    $('fv-group').innerHTML = `<span class="dot" style="background:${g.color}"></span>${esc(g.name)}`;
    document.querySelectorAll('[data-edit-panel]').forEach(b => { const on = b.dataset.editPanel === editPanel; b.closest('.edit-field').classList.toggle('open', on); b.setAttribute('aria-expanded', String(on)); });
  }
  // Duration chips (add and edit): preset minutes, or "自定" with a number field.
  let customDuration = { add: false, edit: false };
  function durationChips(which, minutes, input) {
    const preset = minutes === 0 || DURATIONS.includes(minutes);
    const custom = customDuration[which] || !preset;
    document.querySelectorAll(`[data-${which}-duration]`).forEach(b => {
      const v = b.dataset[`${which}Duration`], on = v === 'custom' ? custom : !custom && Number(v) === minutes;
      b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on));
    });
    input.hidden = !custom;
    if (custom && minutes && document.activeElement !== input) input.value = String(minutes);
    if (which === 'edit') renderEditSummary(); else markAddDefaults();
  }
  // In the add sheet the untouched choices stay light; only what you changed turns dark, so a glance shows what you set.
  function markAddDefaults() {
    const defaults = { addWhen: 'today', addTime: '', addRepeat: 'none', addDuration: '0', addGroup: state.groups[0]?.id, addRing: '0' };
    document.querySelectorAll('#add-form .chip').forEach(b => {
      const key = Object.keys(defaults).find(k => k in b.dataset);
      b.classList.toggle('is-default', !!key && b.dataset[key] === defaults[key]);
    });
  }
  function readCustom(input) { const n = Math.round(Number(input.value)); return Number.isFinite(n) && n >= 1 && n <= 600 ? n : 0; }
  function openAdd() {
    if (document.body.dataset.view !== 'tasks') setView('tasks');
    if (filter !== 'all' && state.groups.some(g => g.id === filter)) addGroupId = filter;
    renderAddChips();
    if (isPhone()) { document.body.classList.add('adding'); $('add-backdrop').hidden = false; }
    else $('add-form').scrollIntoView({ block: 'nearest' });
    $('task-input').focus();
  }
  function closeAdd() {
    if (!document.body.classList.contains('adding')) return false;
    document.body.classList.remove('adding'); $('add-backdrop').hidden = true; $('form-error').textContent = '';
    if (document.activeElement === $('task-input')) $('task-input').blur();
    return true;
  }
  // iOS keeps the layout viewport under the keyboard; lift the sheet by the covered height.
  if (window.visualViewport) {
    const lift = () => { const covered = Math.max(0, window.innerHeight - visualViewport.height - visualViewport.offsetTop); document.documentElement.style.setProperty('--kb', `${Math.round(covered)}px`); };
    visualViewport.addEventListener('resize', lift); visualViewport.addEventListener('scroll', lift);
  }

  /* ---------- Phone chrome ----------
     On phones there is no tab bar: search, review and settings sit in the top bar, the add button floats
     bottom-right, and settings close with “完成”. The same buttons go back to the sidebar on wide screens. */
  const phoneQuery = matchMedia('(max-width: 760px)');
  const chromeHomes = new Map();
  function placeChrome() {
    const moves = [[$('open-search'), $('header-actions')], [$('open-review'), $('header-actions')],
      [document.querySelector('.nav-button[data-view=settings]'), $('header-actions')], [document.querySelector('.nav-button[data-view=tasks]'), document.querySelector('.settings-top')]];
    moves.forEach(([el, phoneHome]) => {
      if (!el || !phoneHome) return;
      if (!chromeHomes.has(el)) { const mark = document.createComment('home'); el.before(mark); chromeHomes.set(el, mark); }
      if (phoneQuery.matches) phoneHome.append(el); else chromeHomes.get(el).after(el);
    });
  }

  /* ---------- Date and time pickers ----------
     The native inputs stay (they open the phone's own wheel/calendar), but they sit invisibly on top of a chip
     that shows the value in words, so the sheet never shows a raw “mm/dd/yyyy” or “--:--” field. */
  const PICKERS = ['task-date', 'task-time-custom', 'edit-date', 'edit-time'];
  function setupPickers() {
    PICKERS.forEach(id => {
      const input = $(id), wrap = document.createElement('span'), label = document.createElement('span');
      wrap.className = 'chip pick-chip'; wrap.dataset.pick = id; label.className = 'pick-label';
      wrap.innerHTML = icon(input.type === 'time' ? 'clock-3' : 'calendar-days');
      input.before(wrap); wrap.append(label, input);
      input.addEventListener('click', () => { try { input.showPicker(); } catch { /* the tap itself opens it on phones */ } });
      ['input', 'change'].forEach(e => input.addEventListener(e, syncPickers));
    });
  }
  function syncPickers() {
    const today = dayKey();
    PICKERS.forEach(id => {
      const input = $(id), wrap = input.parentElement;
      if (!wrap?.classList.contains('pick-chip')) return;
      wrap.hidden = input.hidden;
      wrap.classList.toggle('is-disabled', input.disabled);
      const v = input.value;
      let text, on;
      if (input.type === 'date') {
        // In the edit sheet 今天/明天 have their own chips; this one names any other day.
        const plain = id === 'edit-date' && (!v || v === today || v === addDays(today, 1));
        on = !!v && !plain;
        text = on ? dateLabel(v) : id === 'edit-date' ? '其他日期' : '选日期';
      } else { on = !!v; text = v || '选时间'; }
      wrap.querySelector('.pick-label').textContent = text;
      wrap.classList.toggle('active', on);
    });
    const noTime = !$('edit-time').value, eRing = $('edit-ring').value === '1';
    document.querySelectorAll('[data-edit-time]').forEach(b => { b.classList.toggle('active', noTime); b.setAttribute('aria-pressed', String(noTime)); });
    $('edit-ring-chips').hidden = noTime;
    document.querySelectorAll('[data-edit-ring]').forEach(b => { const on = (b.dataset.editRing === '1') === eRing; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    renderEditSummary();
  }

