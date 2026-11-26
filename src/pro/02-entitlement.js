  /* ---------- Entitlement ----------
     Three kinds of build, set by app/pro-config.js:
       正式版 (server + publicKey): Pro only with a licence the server signed for THIS device — buying, or a redeem
                  code, on each phone. A copied APK/IPA carries no licence, so it starts without Pro.
       未开放 (no server yet, the default): nothing can unlock Pro; the page says sales open soon. Only the free trial.
       App Store 版 ({ store: 'appstore' }): Apple in-app purchase on the App Store build; StoreKit decides, per Apple ID.
       测试版 (set only by the tests or an explicit test build): freeForTesters = all of Pro free; simulate = Pro
                  locked but the checkout runs against a stand-in, so the paid flow can be tried without paying.
     Nothing stored in the data (settings.pro.owned, an imported backup, an earlier test build's simulated purchase)
     counts on its own. */
  const info = () => { const p = S().pro; return p && typeof p === 'object' ? p : (S().pro = { owned: false, trialEnds: 0, trialUsed: false }); };
  /** Test builds (app/pro-config.js): all of Pro is free; payment pages stay visible and only simulate. */
  // Showcase frames (the Pro page shows the real app in a theme): ?showcase=<theme>&view=home|lock|fx
  const SHOW = (() => { try { return new URLSearchParams(location.search).get('showcase') || ''; } catch { return ''; } })();
  const SHOW_VIEW = (() => { try { return new URLSearchParams(location.search).get('view') || 'home'; } catch { return 'home'; } })();
  const FREE = !!(window.SUISUI_PRO_CONFIG || {}).freeForTesters || !!SHOW;
  const CFG = window.SUISUI_PRO_CONFIG || {};
  /** App Store build (iPhone/iPad from the App Store): Pro is Apple's in-app purchase, checked by StoreKit (ProStore.swift). */
  const STORE = !FREE && CFG.store === 'appstore';
  const LIVE = !FREE && !STORE && !!CFG.server && !!CFG.publicKey;
  /** A test build: purchases and codes are simulated (never in a shipped build). */
  const TESTING = FREE || (!LIVE && !STORE && !!CFG.simulate);
  /** No server configured and not a test build: Pro cannot be bought or redeemed yet. */
  const CLOSED = !TESTING && !LIVE && !STORE;
  /** App Store builds: what StoreKit says on this Apple ID, reported by the iPhone shell. */
  const storeOwns = () => { try { return window.SuiSuiIOS?.status?.pro === true; } catch { return false; } };
  const SERVER = String(CFG.server || '').replace(/\/$/, '');
  // with a server, owning Pro means holding a licence it signed (checked again on every start)
  /** Bought or redeemed on THIS device: a licence whose device matches (its signature is checked at start by liveBoot()).
      Test builds keep the simulated purchase flag. */
  const owns = () => STORE ? storeOwns() : !!info().owned && (TESTING || (LIVE && licenceForThisDevice(info().licence)));
  const isPro = () => FREE || owns() || (!STORE && (info().trialEnds || 0) > Date.now());
  const trialLeft = () => Math.max(0, Math.ceil(((info().trialEnds || 0) - Date.now()) / 864e5));
  const status = () => owns() ? '已开通' : FREE ? '' : isPro() ? `试用中 · 剩 ${trialLeft()} 天` : '';
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
  function startTrial() { const p = info(); if (p.trialUsed || STORE) return; p.trialUsed = true; p.trialEnds = Date.now() + TRIAL_DAYS * 864e5; persist(); endTry(false); applyTheme(); refreshAll(); API.showToast(`已开始 ${TRIAL_DAYS} 天免费试用，Pro 全部可用`); }
  function restore() { API.showToast(owns() ? '已恢复购买' : '没有找到购买记录'); }
