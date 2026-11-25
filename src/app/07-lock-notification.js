  /* ---------- Lock-screen notification (web): the closest a home-screen web app gets to the lock screen ---------- */
  // Set by the embedded preview build (Claude artifact), where installing, notifications and downloads are unavailable.
  const PREVIEW = !!window.SUISUI_PREVIEW;
  const notifySupported = () => !PREVIEW && !NATIVE && 'Notification' in window && 'serviceWorker' in navigator && window.isSecureContext;
  const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let notifyTimer = null, lastNotified = '';
  try { lastNotified = sessionStorage.getItem('suisui-last-notified') || ''; } catch { /* private mode */ }
  function notificationContent() {
    const todo = pending();
    if (!todo.length) return null;
    if (state.settings.lockPrivacy) return { title: `今天还有 ${todo.length} 件待办`, body: '打开碎碎清单查看' };
    const lines = todo.slice(0, 6).map(t => `○ ${t.title}`);
    if (todo.length > 6) lines.push(`…还有 ${todo.length - 6} 件`);
    return { title: `今天还有 ${todo.length} 件待办`, body: lines.join('\n') };
  }
  async function updateLockNotification(force = false) {
    clearTimeout(notifyTimer);
    const pendingCount = pending().length;
    try { if ('setAppBadge' in navigator && state.settings.lockNotify) pendingCount ? await navigator.setAppBadge(pendingCount) : await navigator.clearAppBadge(); } catch { /* badge is optional */ }
    if (!state.settings.lockNotify || !notifySupported() || Notification.permission !== 'granted') return;
    const content = notificationContent();
    const signature = content ? `${content.title}|${content.body}` : '';
    if (!force && signature === lastNotified) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!content) (await registration.getNotifications({ tag: 'suisui-today' })).forEach(n => n.close());
      else await registration.showNotification(content.title, { body: content.body, tag: 'suisui-today', renotify: false, silent: true, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: './' } });
      lastNotified = signature;
      try { sessionStorage.setItem('suisui-last-notified', signature); } catch { /* ignore */ }
    } catch { /* notification refresh is best effort */ }
  }
  function scheduleLockNotification() {
    if (!state.settings.lockNotify) return;
    clearTimeout(notifyTimer);
    // Update while the app is hidden; when visible, wait so the banner does not compete with the user.
    notifyTimer = setTimeout(() => { if (document.visibilityState === 'hidden') updateLockNotification(); }, 400);
  }
  function renderNotifySetting() {
    const toggle = $('notify-toggle'), status = $('notify-status'), test = $('notify-test');
    toggle.checked = !!state.settings.lockNotify;
    let copy;
    if (IOS_APP) { renderIOSLock(); return; }
    if (ANDROID) {
      let allowed = false;
      try { allowed = ANDROID.notificationsAllowed(); } catch { /* ignore */ }
      toggle.disabled = false;
      test.hidden = !(state.settings.lockNotify && !allowed);
      test.lastChild.textContent = '打开通知权限';
      renderAndroidLock();
      status.textContent = !state.settings.lockNotify ? '开启后，锁屏上会常驻“今天的待办”卡片，每件都有“完成”按钮，亮屏直接点。'
        : allowed ? '已开启：锁屏上常驻今天的待办，点“✓”即可完成。若锁屏看不到，请在系统设置里允许碎碎清单在锁屏显示通知。'
        : '还没有通知权限，锁屏卡片无法显示。点下方按钮去开启。';
      return;
    }
    if (!notifySupported()) {
      toggle.disabled = true;
      copy = PREVIEW ? '这是预览页。用 iPhone Safari 打开正式网站并添加到主屏幕后可开启。' : isIOS() && !isStandalone() ? '需要先“添加到主屏幕”，再从桌面图标打开（iOS 16.4 及以上）。' : '当前浏览器不支持网页通知。';
    } else {
      toggle.disabled = false;
      const p = Notification.permission;
      if (p === 'denied') copy = '通知权限已被拒绝。请到系统设置 > 通知 > 碎碎清单 中打开。';
      else if (state.settings.lockNotify && p === 'granted') copy = '已开启。每次离开碎碎清单，锁屏通知会更新为最新的未完成事项；全部完成后自动移除。';
      else copy = '开启后，离开应用时把未完成事项放到锁屏通知里。点通知回到清单（通知里不能直接勾选）。';
    }
    status.textContent = copy;
    test.hidden = !(state.settings.lockNotify && notifySupported() && Notification.permission === 'granted');
  }
  // iPhone app: the lock screen is the Live Activity (and lock-screen widgets); the native side reports its status.
  function iosStatus() { try { return IOS_APP.status || {}; } catch { return {}; } }
  // 1.22 iPad: iPadOS shows no Live Activities on the Lock Screen, so the lock screen is the widgets there.
  const IPAD_LOCK = 'iPad 的锁屏不显示实时活动。长按锁屏点“自定”，或在主屏幕长按空白处，添加“碎碎清单”小组件，就能看到今天的待办。';
  function renderIOSLock() {
    const st = iosStatus();
    $('notify-row').hidden = true; $('notify-status').hidden = true; $('notify-test').hidden = true; $('notify-section').hidden = true; // the iPhone app keeps to-dos on the Lock Screen through the Live Activity instead
    $('ios-lock-settings').hidden = false;
    $('live-toggle').checked = !!st.liveWanted;
    $('live-toggle').disabled = st.liveAllowed === false || !!st.pad;
    $('live-status').textContent = st.pad ? IPAD_LOCK
      : st.liveAllowed === false ? '实时活动在系统里被关闭了：设置 > 碎碎清单 > 实时活动，打开后回来再开。'
      : st.live ? '已开启：锁屏和灵动岛上显示今天的待办，点圆圈直接完成。系统限制每次最多显示 8 小时，打开碎碎清单会自动续上。'
      : st.liveWanted ? '已开启，有待办时会在锁屏显示；全部完成或超过 8 小时后会自动收起，打开应用即恢复。'
      : '开启后，锁屏和灵动岛上显示今天的待办，点圆圈直接完成。';
    const n = st.notifications;
    $('ios-notify-status').textContent = n === 'granted' ? '已允许：到点提醒和计时结束会准时通知你，通知里能直接点“完成”。'
      : n === 'denied' ? '通知被关闭了，到点提醒不会响。点下方按钮去系统设置里打开。' : '设了提醒时间的待办会到点通知你。第一次设置提醒时会请求通知权限。';
    $('ios-notify-button').hidden = n === 'granted';
    $('ios-notify-button').lastChild.textContent = n === 'denied' ? '去系统设置打开通知' : '允许通知';
  }
  /** First run on iPhone: the permissions and the two lock-screen pieces, each ticked off as it is done. */
  function renderIOSSetup() {
    if (!IOS_APP) return;
    const st = iosStatus(), notify = st.notifications === 'granted', liveOff = st.liveAllowed === false, live = !liveOff && !!st.liveWanted;
    $('ios-setup-notify').classList.toggle('done', notify);
    $('ios-setup-notify').querySelector('button').hidden = notify;
    $('ios-setup-notify').querySelector('button').textContent = st.notifications === 'denied' ? '去设置' : '允许';
    $('ios-setup-live').classList.toggle('done', live);
    $('ios-setup-live').hidden = !!st.pad;
    $('ios-setup-live').querySelector('button').hidden = live;
    $('ios-setup-live').querySelector('button').textContent = liveOff ? '去设置' : '打开';
    $('ios-setup-live-copy').textContent = liveOff ? '实时活动在系统里被关掉了：点“去设置”，打开“实时活动”后回来。' : '有待办时，锁屏和灵动岛上显示今天的清单；全部做完会自动收起。';
  }
  function openIOSSetup() { renderIOSSetup(); if (!$('ios-setup').open) $('ios-setup').showModal(); icons($('ios-setup')); }
  let iosSetupAsked = false;
  window.suisuiIOSStatus = () => {
    if (typeof render === 'function') { renderNotifySetting(); renderSettingsSummary(); }
    renderIOSSetup();
    // first launch: ask once, after the native side has said what is allowed
    if (IOS_APP && !state.settings.iosSetupSeen && !iosSetupAsked && !document.querySelector('dialog[open]')) { iosSetupAsked = true; setTimeout(openIOSSetup, 400); }
  };
  function androidPermissions() {
    try { return JSON.parse(ANDROID.permissions()); } catch { return { notifications: false, overlay: false, lockScreenRunning: false, brand: '' }; }
  }
  function renderAndroidLock() {
    if (!ANDROID) return;
    const p = androidPermissions();
    $('android-lock-settings').hidden = false;
    $('lockscreen-toggle').checked = !!state.settings.lockScreen;
    $('lockscreen-status').textContent = !state.settings.lockScreen ? '开启后，熄屏再亮屏会先显示碎碎清单的锁屏：壁纸、时钟和待办，点圆圈完成，上滑进入手机。'
      : p.overlay && p.notifications ? '已开启。熄屏后再亮屏试试；若没出现，点“检查锁屏权限”，按品牌打开“锁屏显示”和“后台弹出界面”。'
      : '还差权限：点“检查锁屏权限”，按提示打开。';
    const steps = { notify: p.notifications, overlay: p.overlay, battery: p.battery, fullscreen: p.fullScreen };
    $('setup-fullscreen').hidden = !p.needsFullScreenSetting;
    const stats = $('lock-stats');
    stats.hidden = !(state.settings.lockScreen && p.screenOffs > 0);
    if (!stats.hidden) {
      const missed = p.screenOffs - p.shown;
      stats.textContent = `最近 ${p.screenOffs} 次熄屏，碎碎清单锁屏出现了 ${p.shown} 次。` + (missed > 0 ? (p.battery === false ? '有漏掉的：请在“检查锁屏权限”里打开“不限制电池”。' : '有漏掉的：请在“检查锁屏权限”里按品牌打开“后台弹出界面”和“锁屏显示”。') : '');
    }
    Object.entries(steps).forEach(([key, ok]) => {
      const li = $(`setup-${key}`);
      if (!li || ok === undefined) return;
      li.classList.toggle('done', !!ok);
      li.querySelector('button').textContent = ok ? '已开启' : '去开启';
      li.querySelector('button').disabled = !!ok;
    });
  }
  function openAndroidSetup() { renderAndroidLock(); $('android-setup').showModal(); icons($('android-setup')); $('finish-android-setup').focus(); }
  async function enableLockNotify(on) {
    if (ANDROID) {
      state.settings.lockNotify = on; save(); renderNotifySetting();
      if (on) { try { ANDROID.requestNotificationPermission(); } catch { /* ignore */ } }
      showToast(on ? '已开启锁屏待办卡片' : '已关闭锁屏待办卡片');
      return;
    }
    if (!on) {
      state.settings.lockNotify = false; save();
      try { (await (await navigator.serviceWorker.ready).getNotifications({ tag: 'suisui-today' })).forEach(n => n.close()); await navigator.clearAppBadge?.(); } catch { /* ignore */ }
      renderNotifySetting(); return;
    }
    if (!notifySupported()) { renderNotifySetting(); return; }
    let permission = Notification.permission;
    if (permission === 'default') { try { permission = await Notification.requestPermission(); } catch { permission = 'denied'; } }
    state.settings.lockNotify = permission === 'granted';
    save(); renderNotifySetting();
    if (state.settings.lockNotify) { lastNotified = ''; showToast('已开启锁屏通知，离开应用后生效'); }
    else showToast('没有获得通知权限');
  }

