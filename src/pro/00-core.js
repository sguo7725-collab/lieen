  const API = window.suisui?.pro;
  if (!API) return;
  const $ = id => document.getElementById(id);
  const S = () => API.state.settings;
  const reduce = () => !S().motion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 39.9 to keep, 28 for the first month after launch
  const PRICE = '¥28', LIST_PRICE = '¥39.9', PRICE_NOTE = '首发价', TRIAL_DAYS = 3;

