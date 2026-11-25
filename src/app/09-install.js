  /* ---------- Install guidance: the web app only becomes durable and notifiable from the Home Screen ---------- */
  function renderInstallBanner() {
    const show = !PREVIEW && !NATIVE && !state.settings.installDismissed && !isStandalone() && (isIOS() || !!installPrompt);
    $('install-banner').hidden = !show;
    $('install-native').hidden = !installPrompt;
    $('install-howto').hidden = !!installPrompt;
  }

  /** The moment of finishing, the same in every theme: the check fills with a small spring, a thin ring
   *  goes out from it, and a glint runs along the row. Quiet and quick (about 0.45 s), no sound. */
  function finishAccent(source, rect) {
    const layer = $('fragments'), check = source.querySelector('.check-circle');
    const c = check ? check.getBoundingClientRect() : { left: rect.left + 18, top: rect.top + rect.height / 2 - 11, width: 22, height: 22 };
    const cx = c.left + c.width / 2, cy = c.top + c.height / 2, size = Math.max(18, c.width);
    const mark = document.createElement('div'); mark.className = 'fx-check';
    Object.assign(mark.style, { left: `${cx - size / 2}px`, top: `${cy - size / 2}px`, width: `${size}px`, height: `${size}px` });
    mark.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.5l3.6 3.6 7.4-8"/></svg>';
    const ring = document.createElement('div'); ring.className = 'fx-ring';
    Object.assign(ring.style, { left: `${cx - size / 2}px`, top: `${cy - size / 2}px`, width: `${size}px`, height: `${size}px` });
    const glint = document.createElement('div'); glint.className = 'fx-glint';
    Object.assign(glint.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    const sparks = Array.from({ length: 6 }, (_, i) => {
      const d = document.createElement('i'); d.className = 'fx-spark';
      const a = (-70 + i * 28 + Math.random() * 10) * Math.PI / 180, r = size * (1.05 + Math.random() * .45);
      Object.assign(d.style, { left: `${cx}px`, top: `${cy}px`, '--sx': `${Math.cos(a) * r}px`, '--sy': `${Math.sin(a) * r}px`, animationDelay: `${40 + i * 12}ms` });
      return d;
    });
    layer.append(glint, ring, mark, ...sparks);
    setTimeout(() => [glint, ring, mark, ...sparks].forEach(n => n.remove()), 720);
  }
  async function shatter(source) {
    if (!state.settings.motion || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = source.getBoundingClientRect(), isLock = source.classList.contains('lock-task');
    const textNode = source.querySelector(isLock ? 'span:last-child' : '.task-title');
    const textRect = textNode.getBoundingClientRect(), style = getComputedStyle(textNode);
    finishAccent(source, rect);
    // Pro: a chosen completion effect replaces the default text shards.
    const custom = window.SuiSuiPro?.effect?.(source, textNode, rect);
    if (custom) { source.style.visibility = 'hidden'; await custom; return; }
    // The text itself breaks into fine slivers that drift a little up and right, in the glint's order.
    const layer = $('fragments'), slow = (navigator.hardwareConcurrency || 8) <= 4;
    const cols = Math.max(9, Math.min(slow ? 12 : 20, Math.round(textRect.width / 12))), rows = 2;
    const strength = [.7, 1, 1.35][state.settings.intensity - 1];
    const box = { left: Math.min(rect.left + 44, textRect.left - 2), top: textRect.top - 2, width: textRect.width + 4, height: textRect.height + 4 };
    const cw = box.width / cols, ch = box.height / rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const p = document.createElement('div');
        p.className = 'shard';
        const skew = (Math.random() - .5) * 30;
        Object.assign(p.style, { left: `${box.left + x * cw}px`, top: `${box.top + y * ch}px`, width: `${cw + .6}px`, height: `${ch + .6}px`, clipPath: `polygon(${18 + skew}% 0,100% 0,${82 + skew}% 100%,0 100%)` });
        const text = document.createElement('span');
        text.className = 'shard-text';
        text.textContent = textNode.textContent;
        Object.assign(text.style, { left: `${textRect.left - box.left - x * cw}px`, top: `${textRect.top - box.top - y * ch}px`, width: `${textRect.width}px`, font: style.font, lineHeight: style.lineHeight, color: style.color, whiteSpace: isLock ? 'nowrap' : 'normal', overflowWrap: 'anywhere' });
        p.append(text); layer.append(p);
        const t = x / (cols - 1), r = Math.random();
        const dx = (14 + t * 46 + r * 26) * strength, dy = (-(10 + r * 26) - (rows - 1 - y) * 8) * strength;
        const delay = 50 + t * 150 + r * 30;
        // Web Animations, not anime.js: anime reads each sliver's computed style when it starts, which made the browser restyle 40 times in one frame
        p.animate([{ transform: 'translate(0,0) rotate(0) scale(1)' }, { transform: `translate(${dx}px,${dy}px) rotate(${(r - .5) * 50}deg) scale(${.55 + r * .2})` }], { duration: 460, delay, easing: 'cubic-bezier(.165,.84,.44,1)', fill: 'both' });
        p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: delay + 80, easing: 'cubic-bezier(.55,.085,.68,.53)', fill: 'both' }).onfinish = () => p.remove();
      }
    }
    source.style.visibility = 'hidden';
    await new Promise(resolve => setTimeout(resolve, 360));
  }
  /** Finish a task: completion time, focus time from its timer, one line in the review log. */
  function markDone(task) {
    if (state.timer?.id === task.id) settleTimer(false);
    task.done = true;
    task.completedAt = Math.max(Date.now(), ...state.tasks.map(t => (t.completedAt || 0) + 1));
    state.log.push({ id: task.id, title: task.title, group: task.group, at: task.completedAt, min: Math.round((task.focusMs || 0) / 60000) });
    if (state.log.length > LOG_LIMIT) state.log = state.log.slice(-LOG_LIMIT);
    task.focusMs = 0;
  }
  function unmarkDone(task) {
    const i = state.log.findLastIndex(e => e.id === task.id && e.at === task.completedAt);
    if (i >= 0) { task.focusMs = state.log[i].min * 60000; state.log.splice(i, 1); }
    task.done = false;
  }
  async function complete(id, button) {
    if (completing.has(id)) return;
    const task = state.tasks.find(t => t.id === id);
    if (!task || task.done) return;
    const source = button.classList.contains('lock-task') ? button : button.closest('.task-row');
    completing.add(id);
    button.disabled = true;
    haptic('done');
    const sourceRect = source.getBoundingClientRect();
    window.dispatchEvent(new CustomEvent('suisui:completing', { detail: { id, rect: sourceRect } }));
    let animationError = false;
    try { await shatter(source); } catch { animationError = true; }
    completing.delete(id);
    if (!state.tasks.includes(task) || task.done) { render(); return; }
    markDone(task);
    if (editing === id) closeEdit();
    save(); render();
    $('completed-section').open = true;
    if (state.settings.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // the rows below slide up through render(): motion.js measures before and after (FLIP); sliding them here as well moved them twice
      document.querySelectorAll('.done-row, .lock-task.is-done').forEach(el => {
        if ((el.dataset.completedId || el.dataset.id) !== id) return;
        el.classList.add('completion-arrival');
        const target = el.classList.contains('lock-task') ? el : el.querySelector('.done-text');
        // CSS draws the line (styles.css .completion-arrival) and Web Animations fades the text: no anime.js setup in this frame
        setTimeout(() => el.classList.remove('completion-arrival'), 460);
        target.animate([{ opacity: 1 }, { opacity: getComputedStyle(target).opacity }], { duration: 460, easing: 'cubic-bezier(.25,.46,.45,.94)' });
      });
    }
    $('completion-note').textContent = pending().length ? '又完成一件。' : '今天的事，圆满完成。';
    setTimeout(() => { $('completion-note').textContent = ''; }, 2400);
    showToast('已完成一项待办', () => { unmarkDone(task); save(); render(); });
    // the theme's flight and picture start on the next frame, so the list's re-render and the flight don't land in the same one
    const allDone = !pending().length;
    requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('suisui:done', { detail: { id, rect: sourceRect, allDone } })));
    if (!isBusy()) {
      const next = button.classList.contains('lock-task') ? $('activity-list').querySelector('[data-action="complete"]') || $('activity-list').querySelector('button') : $('task-list').querySelector('[data-action="complete"]');
      if (next) next.focus({ preventScroll: true });
    }
    if (animationError) console.warn('Animation unavailable; task completed without animation.');
    requestPersistence();
  }
  async function requestPersistence() {
    try {
      if (!navigator.storage?.persist) return;
      persisted = await navigator.storage.persisted() || await navigator.storage.persist();
      $('storage-status').textContent = storageCopy();
    } catch { /* optional */ }
  }

