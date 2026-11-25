  /* ---------- Reminders: tasks with a time ring on the day they are due ---------- */
  // Android schedules real alarms natively (works with the app closed); here the open app shows them too.
  const fired = new Set();
  function reminderAt(t, key = dayKey()) { if (!t.time) return 0; const [y, m, d] = key.split('-').map(Number), [hh, mm] = t.time.split(':').map(Number); return new Date(y, m - 1, d, hh, mm).getTime(); }
  function checkReminders() {
    const now = Date.now();
    for (const t of pending()) {
      if (!t.ring) continue; // 只显示时间: nothing happens at that time
      const at = reminderAt(t); const key = `${t.id}@${at}`;
      if (!at || now < at || now - at > 120000 || fired.has(key)) continue;
      fired.add(key);
      haptic('done');
      try { navigator.vibrate?.([80, 60, 80]); } catch { /* optional */ }
      showToast(`⏰ ${t.time} ${t.title}`, () => {
        const button = document.querySelector(`.task-row[data-task-id="${CSS.escape(t.id)}"] .check-task`);
        if (button) complete(t.id, button); else if (!t.done) { markDone(t); save(); render(); }
      }, '完成', 60000);
      if (!NATIVE && document.visibilityState === 'hidden' && notifySupported() && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(r => r.showNotification(`⏰ ${t.time} ${t.title}`, { tag: `remind-${t.id}`, icon: 'icons/icon-192.png', silent: false, requireInteraction: true, data: { url: './' } })).catch(() => {});
      }
    }
  }
  setInterval(checkReminders, 15000);

