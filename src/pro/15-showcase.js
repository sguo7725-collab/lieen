  /* ---------- Theme showcase: the real app in that theme — home, lock screen, finishing, and the day's picture ---------- */
  const STAGE_PAGES = [['home', '主页'], ['lock', '锁屏'], ['fx', '完成的那一下'], ['finale', '全部做完']];
  let stageRaf = 0;
  function openStage(id) {
    const t = THEMES[id]; if (!t) return;
    let el = $('pro-stage');
    if (!el) { el = document.createElement('div'); el.id = 'pro-stage'; el.className = 'pro-stage'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.append(el); }
    const on = (isPro() ? savedTheme() : tryOn) === id;
    el.innerHTML = `<header class="pro-stage-top"><button type="button" class="pro-stage-close" id="pro-stage-close" aria-label="返回">${icon('chevron-left')}</button>
        <div class="pro-stage-name"><b>${t.full}</b><span>${t.en || ''}</span></div><span class="pro-stage-spacer"></span></header>
      <p class="pro-stage-line">${t.line}</p>
      <div class="pro-stage-tabs" role="tablist">${STAGE_PAGES.map(([k, n], i) => `<button type="button" role="tab" data-stage-go="${i}" aria-selected="${i === 0}">${n}</button>`).join('')}</div>
      <div class="pro-stage-pager" id="pro-stage-pager">${STAGE_PAGES.map(([k, n]) => `<figure class="pro-stage-frame" data-frame="${k}"><div class="pro-stage-phone">${k === 'finale' ? `<canvas class="pro-stage-fin" aria-label="${t.full}：全部做完"></canvas>` : `<iframe title="${t.full} · ${n}" data-src="index.html?showcase=${id}&view=${k}" loading="lazy" tabindex="-1" aria-hidden="true"></iframe>`}</div><figcaption>${n}</figcaption></figure>`).join('')}</div>
      <footer class="pro-stage-foot"><button type="button" class="pro-stage-use${on ? ' is-on' : ''}" data-pro-theme="${id}">${on ? '正在使用' : isPro() ? `使用「${t.full}」` : '试穿这套'}</button></footer>`;
    API.icons(el);
    el.hidden = false; document.body.classList.add('pro-stage-open');
    const pager = $('pro-stage-pager'), frames = [...pager.querySelectorAll('.pro-stage-frame')];
    const load = i => { const f = frames[i]?.querySelector('iframe[data-src]'); if (f && !f.src) f.src = f.dataset.src; };
    const fit = () => frames.forEach(fr => { const ph = fr.querySelector('.pro-stage-phone'), ifr = ph.querySelector('iframe'); if (ifr) ifr.style.transform = `scale(${ph.clientWidth / 390})`; });
    const go = i => { pager.scrollTo({ left: frames[i].offsetLeft - (pager.clientWidth - frames[i].clientWidth) / 2, behavior: reduce() ? 'auto' : 'smooth' }); };
    const current = () => { const mid = pager.scrollLeft + pager.clientWidth / 2; let best = 0, d = 1e9; frames.forEach((f, i) => { const c = f.offsetLeft + f.clientWidth / 2, dd = Math.abs(c - mid); if (dd < d) { d = dd; best = i; } }); return best; };
    const mark = () => { const i = current(); el.querySelectorAll('[data-stage-go]').forEach((b, k) => b.setAttribute('aria-selected', String(k === i))); load(i); load(i + 1); };
    pager.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
    el.querySelectorAll('[data-stage-go]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.stageGo; load(i); go(i); }));
    $('pro-stage-close').addEventListener('click', closeStage);
    el.querySelector('.pro-stage-use').addEventListener('click', e => { setTheme(id); closeStage(); });
    requestAnimationFrame(() => { fit(); load(0); load(1); mark(); });
    window.addEventListener('resize', fit);
    // the day's picture plays in a loop
    const c = el.querySelector('.pro-stage-fin'), draw = FINALES[id];
    cancelAnimationFrame(stageRaf);
    if (c && draw) {
      const items = Array.from({ length: 5 }, (_, i) => ({ id: `stage-${i}`, title: ['写周报', '买菜', '跑步', '回邮件', '整理照片'][i], group: i % 2 ? 'life' : 'work', at: Date.now() - i * 3600e3 }));
      const k = Math.min(devicePixelRatio || 1, 2), start = performance.now();
      const frame = now => {
        if (el.hidden) return;
        const w = c.clientWidth, h = c.clientHeight; if (c.width !== Math.round(w * k)) { c.width = Math.round(w * k); c.height = Math.round(h * k); }
        const ctx = c.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = FIN_BG[id] || '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        const W = 390, H = 560, sc = Math.min(c.width / W, c.height / H), ms = reduce() ? 9000 : ((now - start) * CEL_SPEED) % 7000;
        ctx.save(); ctx.translate((c.width - W * sc) / 2, (c.height - H * sc) / 2); ctx.scale(sc, sc); try { draw.call(FINALES, ctx, W, H, Math.min(ms, 5200), items); } catch { /* preview */ } ctx.restore();
        stageRaf = requestAnimationFrame(frame);
      };
      stageRaf = requestAnimationFrame(frame);
    }
  }
  function closeStage() { const el = $('pro-stage'); if (!el || el.hidden) return; el.hidden = true; document.body.classList.remove('pro-stage-open'); cancelAnimationFrame(stageRaf); el.querySelectorAll('iframe').forEach(f => f.removeAttribute('src')); }
  let demoPick = '';
  function playDemo() {
    const title = $('pro-demo-title'), check = $('pro-demo-check');
    if (!title || title.dataset.busy) return;
    const pick = isPro() ? ((S().proEffect || 'auto') === 'auto' ? (THEMES[activeTheme()]?.effect || 'shards') : S().proEffect) : (demoPick || 'shards');
    title.dataset.busy = '1'; check.classList.add('done');
    playSound(isPro() && !(S().proEffect && S().proEffect !== 'auto') ? themeSound() : ({ shards: themeSound() === 'soft' ? 'glass' : themeSound(), stardust: 'glass', ink: 'wood', dots: 'click', gold: 'chime' }[pick] || 'soft'));
    const run = pick === 'shatter' ? shatterDemo(title) : (demoEffect = pick, FX[pick](title, sampleText(title, pick === 'dots' ? 4 : pick === 'stardust' ? 2 : pick === 'shards' ? 6 : 3)));
    demoEffect = '';
    title.style.visibility = 'hidden';
    Promise.resolve(run).then(() => setTimeout(() => { title.style.visibility = ''; check.classList.remove('done'); delete title.dataset.busy; title.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 300 }); }, 700));
  }
  function shatterDemo(el) {
    const r = el.getBoundingClientRect(), layer = $('fragments'), cols = 8;
    for (let i = 0; i < cols * 2; i++) {
      const p = document.createElement('div'), x = i % cols, y = Math.floor(i / cols);
      Object.assign(p.style, { position: 'fixed', left: `${r.left + x * r.width / cols}px`, top: `${r.top + y * r.height / 2}px`, width: `${r.width / cols}px`, height: `${r.height / 2}px`, background: 'rgba(160,200,255,.35)', clipPath: i % 3 ? 'polygon(0 0,100% 0,0 100%)' : 'polygon(100% 0,100% 100%,0 100%)' });
      layer.append(p);
      p.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${(x / cols - .5) * 160}px,${-40 - Math.random() * 60}px) rotate(${(Math.random() - .5) * 140}deg) scale(.3)`, opacity: 0 }], { duration: 800, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => p.remove();
    }
    return new Promise(res => setTimeout(res, 520));
  }
  let heroRaf = 0;
  function startHero() {
    stopHero();
    const c = $('pro-hero-jar'); if (!c) return;
    const W = 170, H = 214, ctx = canvasFor(c, W, H), base = demoEntries(startOfDay(), 8), t0 = performance.now(), still = reduce();
    const frame = now => {
      const ms = now - t0, shown = still ? base.length : Math.min(base.length, Math.floor(ms / 700) + 2);
      ctx.clearRect(0, 0, W, H);
      drawJarWith(BRAND, ctx, 22, 12, 126, 190, base.slice(0, shown), still ? 0 : ms);
      if (!still && shown < base.length) { // one shard falling into the jar
        const t = (ms % 700) / 700, x = 85 + Math.sin(shown) * 18, y = -10 + easeIn(t) * 120;
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 4); ctx.fillStyle = hex(BRAND.shards[shown % 4], .85); ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(6, 5); ctx.lineTo(-5, 4); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      if (!still && !$('pro-sheet').hidden) heroRaf = requestAnimationFrame(frame);
    };
    heroRaf = requestAnimationFrame(frame);
  }
  function stopHero() { cancelAnimationFrame(heroRaf); heroRaf = 0; }
  /** The Pro page's own jar: brand colours, whatever theme is on. */
  function drawJarWith(brand, ctx, x, y, w, h, entries, ms) {
    const { shards } = pile(entries, jarShape(x, y, w, h), 4, w / 7, (e, k) => brand.shards[(hash(`${e.id}${e.at}`) + k) % brand.shards.length]);
    window.SuiSuiSkins.jar('plain', ctx, x, y, w, h, shards, { ms, onDark: true }); return shards.length;
  }

