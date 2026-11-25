  /* ---------- Review: what got done this week / month, as a table and as a designed image ---------- */
  const review = { period: 'week', offset: 0, group: 'all' };
  const WEEK_SHORT = ['日', '一', '二', '三', '四', '五', '六'];
  function reviewRange() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let start, end;
    if (review.period === 'week') {
      start = new Date(today); start.setDate(today.getDate() - (today.getDay() + 6) % 7 + review.offset * 7);
      end = new Date(start); end.setDate(start.getDate() + 7);
    } else if (review.period === 'year') {
      start = new Date(today.getFullYear() + review.offset, 0, 1);
      end = new Date(today.getFullYear() + review.offset + 1, 0, 1);
    } else {
      start = new Date(today.getFullYear(), today.getMonth() + review.offset, 1);
      end = new Date(today.getFullYear(), today.getMonth() + review.offset + 1, 1);
    }
    const days = [];
    for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    return { start, end, days };
  }
  function reviewData() {
    const { start, end, days } = reviewRange();
    const inRange = state.log.filter(e => e.at >= start.getTime() && e.at < end.getTime());
    const entries = inRange.filter(e => review.group === 'all' || groupOf(e.group).id === review.group);
    const perDay = days.map(d => { const k = dayKey(d); return { date: d, key: k, items: entries.filter(e => dayKey(new Date(e.at)) === k) }; });
    const minutes = entries.reduce((sum, e) => sum + (e.min || 0), 0);
    const mix = state.groups.map(g => ({ group: g, count: inRange.filter(e => groupOf(e.group).id === g.id).length })).filter(m => m.count);
    const md = new Intl.DateTimeFormat(LOC(), { month: 'long', day: 'numeric' });
    const last = new Date(end); last.setDate(last.getDate() - 1);
    const title = review.period === 'week' ? `${md.format(start)} – ${md.format(last)}`
      : review.period === 'year' ? (LOC() === 'en-US' ? String(start.getFullYear()) : `${start.getFullYear()}年`)
      : (LOC() === 'en-US' ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(start) : `${start.getFullYear()}年${start.getMonth() + 1}月`);
    const relative = review.period === 'week' ? ['本周', '上周'][-review.offset] || `${-review.offset} 周前`
      : review.period === 'year' ? ['今年', '去年'][-review.offset] || `${-review.offset} 年前`
      : ['本月', '上个月'][-review.offset] || `${-review.offset} 个月前`;
    // the chart: one bar a day, or one a month for a year
    const buckets = review.period === 'year'
      ? Array.from({ length: 12 }, (_, m) => ({ date: new Date(start.getFullYear(), m, 1), month: m, key: `m${m}`, items: entries.filter(e => new Date(e.at).getMonth() === m), now: start.getFullYear() === new Date().getFullYear() && m === new Date().getMonth() }))
      : perDay.map(x => ({ ...x, now: x.key === dayKey() }));
    const elapsed = Math.max(1, Math.min(days.length, Math.ceil((Math.min(Date.now(), end.getTime()) - start.getTime()) / 864e5)));
    return { start, end, last, days, perDay, buckets, entries, minutes, mix, title, relative, activeDays: perDay.filter(d => d.items.length).length, elapsed, groupName: review.group === 'all' ? '全部' : groupOf(review.group).name };
  }
  const focusText = min => min >= 60 ? { value: (min / 60).toFixed(min % 60 ? 1 : 0), unit: '小时专注' } : { value: String(min), unit: '分钟专注' };
  function renderReview() {
    const d = reviewData();
    document.querySelectorAll('[data-period]').forEach(b => { b.classList.toggle('active', b.dataset.period === review.period); b.setAttribute('aria-pressed', String(b.dataset.period === review.period)); });
    $('review-range').textContent = d.title;
    $('review-range-sub').textContent = d.relative;
    $('review-next').disabled = review.offset >= 0;
    if (review.group !== 'all' && !state.groups.some(g => g.id === review.group)) review.group = 'all';
    $('review-groups').innerHTML = [{ id: 'all', name: '全部' }, ...state.groups].map(g => `<button type="button" class="chip${review.group === g.id ? ' active' : ''}" data-review-group="${esc(g.id)}" aria-pressed="${review.group === g.id}">${g.color ? `<span class="dot" style="background:${g.color}"></span>` : ''}${esc(g.name)}</button>`).join('');
    $('rs-count').textContent = String(d.entries.length);
    const f = focusText(d.minutes);
    $('rs-focus').textContent = f.value; $('rs-focus-unit').textContent = f.unit;
    $('rs-days').innerHTML = `${Number(d.activeDays)}<small>/${Number(d.elapsed)}</small>`; $('rs-days-unit').textContent = '天有完成';
    const max = Math.max(1, ...d.buckets.map(x => x.items.length));
    const month = review.period === 'month', year = review.period === 'year';
    $('review-chart').classList.toggle('is-month', month);
    $('review-chart').classList.toggle('is-year', year);
    $('review-chart').previousElementSibling.textContent = year ? '每月完成' : '每天完成';
    $('review-chart').innerHTML = d.buckets.map(x => { const n = x.items.length, day = x.date.getDate(); const label = year ? `${x.month + 1}` : month ? ([1, 5, 10, 15, 20, 25, 30].includes(day) ? day : '') : WEEK_SHORT[x.date.getDay()]; const tip = year ? `${x.month + 1}月` : new Intl.DateTimeFormat(LOC(), { month: LOC() === 'en-US' ? 'short' : 'long', day: 'numeric' }).format(x.date); return `<div class="bar${n === max && n ? ' is-top' : ''}${x.now ? ' is-today' : ''}" title="${tip} · ${n} 件"><span class="bar-val">${n || ''}</span><i style="--h:${n / max}"></i><span class="bar-label">${label}</span></div>`; }).join('');
    const mixTotal = d.mix.reduce((s, m) => s + m.count, 0);
    $('review-mix-card').hidden = !mixTotal;
    $('review-mix').innerHTML = d.mix.map(m => `<i style="flex:${m.count};background:${m.group.color}"></i>`).join('');
    $('review-legend').innerHTML = d.mix.map(m => `<span><span class="dot" style="background:${m.group.color}"></span>${esc(m.group.name)} ${m.count} · ${Math.round(m.count / mixTotal * 100)}%</span>`).join('');
    const wd = new Intl.DateTimeFormat(LOC(), { month: 'long', day: 'numeric', weekday: 'short' });
    const daysWith = [...d.perDay].reverse().filter(x => x.items.length);
    $('review-table').innerHTML = daysWith.length ? daysWith.map(x => `<div class="rt-day"><div class="rt-date"><span>${wd.format(x.date)}</span><span>${x.items.length} 件</span></div>${x.items.map(e => `<div class="rt-row"><span class="dot" style="background:${groupOf(e.group).color}"></span><span class="rt-title">${esc(e.title)}</span><span class="rt-min">${e.min ? durationText(e.min) : ''}</span></div>`).join('')}</div>`).join('')
      : `<div class="review-empty">${icon('calendar-check')}<span>${review.offset === 0 ? '这段时间还没有完成的事，完成后会出现在这里。' : '这段时间没有完成记录。'}</span></div>`;
    $('review-export').disabled = !d.entries.length;
    icons($('review-panel'));
  }

  /* Poster: a 1080px-wide image drawn on a canvas, so it looks the same on every phone. */
  function loadImage(src) { return new Promise(resolve => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src; }); }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function fitText(ctx, text, width) { if (ctx.measureText(text).width <= width) return text; let t = text; while (t.length && ctx.measureText(`${t}…`).width > width) t = t.slice(0, -1); return `${t}…`; }
  async function drawPoster(d) {
    const W = 1080, P = 72, F = '-apple-system, "PingFang SC", "HarmonyOS Sans SC", "MiSans", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
    const font = (w, s) => `${w} ${s}px ${F}`;
    const ac = accentOf(state.settings), accent = ac === 'lime' ? '#1d1d1f' : palette[ac][0], R = Object.fromEntries(RAMP_STEPS.map((k, i) => [k, ramps[ac === 'lime' ? 'ink' : ac][i]]));
    const daysWith = [...d.perDay].reverse().filter(x => x.items.length);
    const MAX_ROWS = 36;
    let rows = 0; const blocks = [];
    for (const x of daysWith) { if (rows >= MAX_ROWS) break; const items = x.items.slice(0, MAX_ROWS - rows); rows += items.length; blocks.push({ ...x, items }); }
    const hidden = d.entries.length - rows;
    const tableH = blocks.reduce((h, b) => h + 70 + b.items.length * 66, 0) + (hidden > 0 ? 64 : 0) + 120;
    const H = 640 + 420 + (d.mix.length ? 230 : 0) + tableH + 200;
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    // paper
    ctx.fillStyle = '#f5f5f3'; ctx.fillRect(0, 0, W, H);
    // hero
    const g = ctx.createLinearGradient(0, 0, W, 640); g.addColorStop(0, R['700']); g.addColorStop(.6, R['800']); g.addColorStop(1, R['950']);
    ctx.fillStyle = g; roundRect(ctx, 0, 0, W, 640, [0, 0, 56, 56]); ctx.fill();
    // fragments ring (the 碎点 mark), large and faint on the right
    for (let i = 0; i < 18; i++) { const a = (-80 + i * 19) * Math.PI / 180, t = i / 17; ctx.globalAlpha = .08 + t * .22; ctx.fillStyle = R['200']; ctx.beginPath(); ctx.arc(860 + 210 * Math.cos(a), 250 + 210 * Math.sin(a), 6 + t * 16, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    const logo = await loadImage('icons/icon-192.png');
    if (logo) { ctx.save(); roundRect(ctx, P, 74, 72, 72, 18); ctx.clip(); ctx.drawImage(logo, P, 74, 72, 72); ctx.restore(); }
    ctx.fillStyle = '#ffffffcc'; ctx.font = font(600, 28); ctx.fillText('碎碎清单', P + 92, 122);
    const P_WORD = { week: ['WEEKLY  REVIEW', ['本周', '上周'], '每周回顾'], month: ['MONTHLY  REVIEW', ['本月', '上月'], '每月回顾'], year: ['YEARLY  REVIEW', ['今年', '去年'], '每年回顾'] }[review.period];
    ctx.fillStyle = R['300']; ctx.font = font(700, 24); ctx.fillText(P_WORD[0].split('').join(String.fromCharCode(8202)), P, 232);
    ctx.fillStyle = '#fff'; ctx.font = font(800, 92); ctx.fillText(P_WORD[1][-review.offset] ? `${P_WORD[1][-review.offset]}回顾` : P_WORD[2], P, 336);
    ctx.fillStyle = '#ffffffb3'; ctx.font = font(500, 34); ctx.fillText(`${d.title}${d.groupName !== '全部' ? ` · ${d.groupName}` : ''}`, P, 396);
    const f = focusText(d.minutes);
    [[String(d.entries.length), '件完成'], [f.value, f.unit], [`${d.activeDays}/${d.elapsed}`, '天有完成']].forEach(([v, u], i) => {
      const x = P + i * 330;
      ctx.fillStyle = '#fff'; ctx.font = font(800, 84); ctx.fillText(v, x, 540);
      ctx.fillStyle = '#ffffffa6'; ctx.font = font(500, 28); ctx.fillText(u, x, 588);
    });
    // chart card
    let y = 680;
    const card = (h) => { ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#00000014'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; roundRect(ctx, 40, y, W - 80, h, 40); ctx.fill(); ctx.shadowColor = 'transparent'; };
    card(380);
    ctx.fillStyle = '#1c1c1e'; ctx.font = font(700, 34); ctx.fillText(review.period === 'year' ? '每月完成' : '每天完成', P + 8, y + 70);
    const max = Math.max(1, ...d.buckets.map(x => x.items.length));
    const n = d.buckets.length, cx0 = P + 8, cw = W - 2 * (P + 8), slot = cw / n, bw = Math.min(64, slot * .62), base = y + 300;
    d.buckets.forEach((x, i) => {
      const c = x.items.length, h = c ? Math.max(10, (c / max) * 170) : 6, bx = cx0 + i * slot + (slot - bw) / 2;
      ctx.fillStyle = c === max && c ? accent : (c ? R['200'] : '#ececef'); roundRect(ctx, bx, base - h, bw, h, Math.min(16, bw / 2)); ctx.fill();
      if (c && (n <= 12 || c === max)) { ctx.fillStyle = '#3a3a3c'; ctx.font = font(700, n <= 12 ? 28 : 22); ctx.textAlign = 'center'; ctx.fillText(String(c), bx + bw / 2, base - h - 14); ctx.textAlign = 'left'; }
      const day = x.date.getDate(); const lab = review.period === 'year' ? `${x.month + 1}月` : n <= 7 ? `周${WEEK_SHORT[x.date.getDay()]}` : ([1, 5, 10, 15, 20, 25, 30].includes(day) ? String(day) : '');
      if (lab) { ctx.fillStyle = '#8e8e93'; ctx.font = font(500, 24); ctx.textAlign = 'center'; ctx.fillText(lab, bx + bw / 2, base + 44); ctx.textAlign = 'left'; }
    });
    y += 420;
    // mix card
    if (d.mix.length) {
      card(190);
      ctx.fillStyle = '#1c1c1e'; ctx.font = font(700, 34); ctx.fillText('分组占比', P + 8, y + 70);
      const total = d.mix.reduce((s, m) => s + m.count, 0); let bx = P + 8; const bwid = W - 2 * (P + 8);
      ctx.save(); roundRect(ctx, bx, y + 96, bwid, 22, 11); ctx.clip();
      d.mix.forEach(m => { const w = bwid * m.count / total; ctx.fillStyle = m.group.color; ctx.fillRect(bx, y + 96, w + 1, 22); bx += w; });
      ctx.restore();
      let lx = P + 8; ctx.font = font(500, 26);
      d.mix.forEach(m => { const label = `${m.group.name} ${m.count} · ${Math.round(m.count / total * 100)}%`; ctx.fillStyle = m.group.color; ctx.beginPath(); ctx.arc(lx + 8, y + 155, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#4a5550'; ctx.fillText(label, lx + 24, y + 164); lx += ctx.measureText(label).width + 64; });
      y += 230;
    }
    // table card
    card(tableH);
    ctx.fillStyle = '#1c1c1e'; ctx.font = font(700, 34); ctx.fillText('做了什么', P + 8, y + 70);
    let ty = y + 120;
    const wd = new Intl.DateTimeFormat(LOC(), { month: 'numeric', day: 'numeric', weekday: 'short' });
    if (!blocks.length) { ctx.fillStyle = '#8e8e93'; ctx.font = font(500, 28); ctx.fillText('这段时间还没有完成记录', P + 8, ty + 20); }
    blocks.forEach(b => {
      ctx.fillStyle = '#8e8e93'; ctx.font = font(600, 24); ctx.fillText(wd.format(b.date), P + 8, ty + 28);
      ctx.textAlign = 'right'; ctx.fillText(`${b.items.length} 件`, W - P - 8, ty + 28); ctx.textAlign = 'left';
      ty += 54;
      b.items.forEach((e, i) => {
        if (i) { ctx.fillStyle = '#ededf0'; ctx.fillRect(P + 40, ty - 4, W - 2 * P - 48, 2); }
        ctx.fillStyle = groupOf(e.group).color; ctx.beginPath(); ctx.arc(P + 16, ty + 28, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1d1d1f'; ctx.font = font(500, 32);
        const minText = e.min ? durationText(e.min) : '';
        ctx.fillText(fitText(ctx, e.title, W - 2 * P - 80 - (minText ? 150 : 0)), P + 44, ty + 40);
        if (minText) { ctx.fillStyle = accent; ctx.font = font(600, 26); ctx.textAlign = 'right'; ctx.fillText(minText, W - P - 8, ty + 38); ctx.textAlign = 'left'; }
        ty += 66;
      });
      ty += 16;
    });
    if (hidden > 0) { ctx.fillStyle = '#8e8e93'; ctx.font = font(500, 26); ctx.fillText(`… 还有 ${hidden} 件`, P + 44, ty + 24); }
    // footer
    const fy = H - 96;
    ctx.fillStyle = '#a1a1a6'; ctx.font = font(500, 24);
    ctx.fillText('碎碎清单 · 小事一件一件做完', P, fy);
    ctx.textAlign = 'right'; ctx.fillText(`生成于 ${new Intl.DateTimeFormat(LOC(), { year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date())}`, W - P, fy); ctx.textAlign = 'left';
    return canvas;
  }
  let posterBlob = null, posterName = '';
  async function exportPoster() {
    const d = reviewData();
    const canvas = await drawPoster(d);
    posterName = `碎碎清单-${review.period === 'week' ? '周' : '月'}回顾-${dayKey(d.start)}.png`;
    const url = canvas.toDataURL('image/png');
    posterBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    $('poster-image').src = url;
    $('poster-note').textContent = PREVIEW ? '预览页不能直接保存：在手机上长按图片即可保存到相册。' : NATIVE ? '' : isIOS() ? '点“保存图片”后选“存储图像”，或长按图片保存到相册。' : '';
    $('poster-save').hidden = PREVIEW;
    $('poster-dialog').showModal(); icons($('poster-dialog'));
  }
  async function savePoster() {
    if (!posterBlob) return;
    if (NATIVE?.saveImage) {
      const url = $('poster-image').src;
      try { NATIVE.saveImage(url.slice(url.indexOf(',') + 1), posterName); } catch { showToast('保存失败，请长按图片保存'); }
      return;
    }
    const file = new File([posterBlob], posterName, { type: 'image/png' });
    try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: '碎碎清单回顾' }); return; } } catch (error) { if (error?.name === 'AbortError') return; }
    const url = URL.createObjectURL(posterBlob), a = document.createElement('a');
    a.href = url; a.download = posterName; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    showToast('图片已保存');
  }
  window.suisuiImageSaved = ok => showToast(ok ? '已保存到相册（图片 / 碎碎清单）' : '没有保存');

