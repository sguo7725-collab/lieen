  /* ---------- Entitlement (simulated purchase in this build) ---------- */
  const info = () => { const p = S().pro; return p && typeof p === 'object' ? p : (S().pro = { owned: false, trialEnds: 0, trialUsed: false }); };
  /** Test builds (app/pro-config.js): all of Pro is free; payment pages stay visible and only simulate. */
  // Showcase frames (the Pro page shows the real app in a theme): ?showcase=<theme>&view=home|lock|fx
  const SHOW = (() => { try { return new URLSearchParams(location.search).get('showcase') || ''; } catch { return ''; } })();
  const SHOW_VIEW = (() => { try { return new URLSearchParams(location.search).get('view') || 'home'; } catch { return 'home'; } })();
  const FREE = !!(window.SUISUI_PRO_CONFIG || {}).freeForTesters || !!SHOW;
  /* A release build talks to the 碎碎清单 Pro server (server/, set in app/pro-config.js); test builds simulate payment. */
  const CFG = window.SUISUI_PRO_CONFIG || {};
  const LIVE = !FREE && !!CFG.server && !!CFG.publicKey;
  const SERVER = String(CFG.server || '').replace(/\/$/, '');
  // with a server, owning Pro means holding a licence it signed (checked again on every start)
  const isPro = () => FREE || (!!info().owned && (!LIVE || !!info().licence)) || (info().trialEnds || 0) > Date.now();
  const trialLeft = () => Math.max(0, Math.ceil(((info().trialEnds || 0) - Date.now()) / 864e5));
  const status = () => info().owned ? '已开通' : FREE ? '' : isPro() ? `试用中 · 剩 ${trialLeft()} 天` : '';
  let tryOn = '';
  const savedTheme = () => ['dusk', 'tape'].includes(S().proTheme) ? 'night' : S().proTheme;
  const activeTheme = () => tryOn || (!isPro() ? '' : savedTheme() === 'auto' ? byTime() : THEMES[savedTheme()] ? savedTheme() : '');
  const look = () => THEMES[activeTheme()] || PLAIN;
  /** What finishing a task does in each theme, and how it sounds (Pro page theme cards). */
  const FX_LINE = { dawn: '碎成玻璃，落进量杯', day: '碎成纸屑，写下一个字', night: '化成光点，连成星座', bloom: '化成一滴颜色', riso: '印成一张小画', room: '变成一件家具', fluff: '多长一层毛' };
  /** The Pro theme in use, for summaries elsewhere ('' when none). */
  const themeLabel = () => { const id = activeTheme(); if (!id) return ''; return !tryOn && savedTheme() === 'auto' ? `随光 · ${THEMES[id].full}` : THEMES[id].full; };
  function persist() { API.save(); }
  function buy() { info().owned = true; if (!info().via) info().via = payPlatform() === 'ios' ? 'appstore' : 'code'; persist(); endTry(false); applyTheme(); refreshAll(); }
  function startTrial() { const p = info(); if (p.trialUsed) return; p.trialUsed = true; p.trialEnds = Date.now() + TRIAL_DAYS * 864e5; persist(); endTry(false); applyTheme(); refreshAll(); API.showToast(`已开始 ${TRIAL_DAYS} 天免费试用，Pro 全部可用`); }
  function restore() { API.showToast(info().owned ? '已恢复购买' : '没有找到购买记录'); }
