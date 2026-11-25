  /* ---------- 每周碎片画: a picture only this week of yours could make ---------- */
  /** The weekly picture. Each theme draws the week its own way:
      晨 seven glasses filled with the day's things, 昼 a manuscript page with one character per thing,
      晕 colour drops by hour and day, 乐 seven music-box strips, 印 a two-colour poster, 夜 a star map with one constellation per day. */
  const CN = n => { const D = '零一二三四五六七八九'; return n < 10 ? D[n] : n < 20 ? `十${n % 10 ? D[n % 10] : ''}` : n < 100 ? `${D[Math.floor(n / 10)]}十${n % 10 ? D[n % 10] : ''}` : String(n); };
  const firstChar = s => Array.from(String(s || '').trim())[0] || '·';
  const mixWhite = (c, t) => { const n = parseInt(c.slice(1), 16), m = v => Math.round(v + (255 - v) * t); return `rgb(${m(n >> 16 & 255)},${m(n >> 8 & 255)},${m(n & 255)})`; };
  function weekStats(entries) {
    const focus = entries.reduce((m, e) => m + (e.min || 0), 0), byDay = new Array(7).fill(0);
    entries.forEach(e => { byDay[(new Date(e.at).getDay() + 6) % 7]++; });
    const busiest = entries.length ? '一二三四五六日'[byDay.indexOf(Math.max(...byDay))] : '';
    const focusText = focus ? `专注 ${Math.floor(focus / 60) ? `${Math.floor(focus / 60)} 小时 ` : ''}${focus % 60 ? `${focus % 60} 分钟` : ''}`.trim() : '';
    return { focus, byDay, busiest, focusText };
  }
  function drawArt(entries, start, L = look(), size = 1080) {
    entries = [...entries].sort((a, b) => a.at - b.at);
    const W = size, H = Math.round(size * 1.25), k = W / 1080, sc = v => v * k, mat = L.material || 'plain';
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H; const ctx = canvas.getContext('2d');
    const st = weekStats(entries), end = new Date(start.getTime() + 6 * 864e5), fmt = d => `${d.getMonth() + 1}月${d.getDate()}日`, Pd = sc(84);
    const byDay = Array.from({ length: 7 }, (_, d) => entries.filter(e => (new Date(e.at).getDay() + 6) % 7 === d));
    const th = THEMES[Object.keys(THEMES).find(id => THEMES[id] === L)];
    const summary = entries.length ? [`${entries.length} 件`, [st.focusText, `周${st.busiest}最多`].filter(Boolean).join('，')] : ['这一周还空着', '完成一件事，画就开始长'];
    const caption = (font, title, sub, color = L.ink, subColor = L.muted) => {
      ctx.fillStyle = color; ctx.font = font; ctx.fillText(title, Pd, Pd + sc(70));
      ctx.fillStyle = subColor; ctx.font = `400 ${sc(28)}px ${SANS}`; ctx.fillText(sub, Pd, Pd + sc(122));
    };
    const footer = (bigFont, color = L.ink, subColor = L.muted) => {
      ctx.fillStyle = color; ctx.font = bigFont; ctx.fillText(summary[0], Pd, H - Pd - sc(70));
      ctx.fillStyle = subColor; ctx.font = `400 ${sc(27)}px ${SANS}`; ctx.fillText(summary[1], Pd, H - Pd - sc(24));
      ctx.fillStyle = hex(L.muted, .9); ctx.font = `500 ${sc(24)}px ${SANS}`; ctx.textAlign = 'right'; ctx.fillText('碎碎清单', W - Pd, H - Pd - sc(24)); ctx.textAlign = 'left';
    };
    const range = `${th ? `${th.full}　` : ''}${fmt(start)} 至 ${fmt(end)}`;

    if (mat === 'glass') { /* ---- 晨: seven glasses ---- */
      ctx.fillStyle = L.bg; ctx.fillRect(0, 0, W, H);
      [['#c9c2ff', .15, .12, 760], ['#bfeee2', .9, .45, 700], ['#ffd9c7', .25, .92, 720], ['#d6e4ff', .8, 1, 520]].forEach(([c, x, y, r]) => { const g = ctx.createRadialGradient(x * W, y * H, 0, x * W, y * H, sc(r)); g.addColorStop(0, hex(c, .8)); g.addColorStop(1, hex(c, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); });
      caption(`600 ${sc(76)}px ${SANS}`, `第 ${isoWeek(start)} 周`, range);
      const gw = sc(106), gap = (W - 2 * Pd - 7 * gw) / 6, top = sc(330), bot = sc(1000), most = Math.max(1, ...byDay.map(d => d.reduce((m, e) => m + 1 + Math.min(e.min || 0, 90) / 30, 0)));
      byDay.forEach((list, d) => {
        const x = Pd + d * (gw + gap), inset = sc(8), path = () => { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + inset, bot - sc(26)); ctx.quadraticCurveTo(x + inset, bot, x + inset + sc(26), bot); ctx.lineTo(x + gw - inset - sc(26), bot); ctx.quadraticCurveTo(x + gw - inset, bot, x + gw - inset, bot - sc(26)); ctx.lineTo(x + gw, top); };
        path(); ctx.fillStyle = 'rgba(255,255,255,.38)'; ctx.fill();
        ctx.save(); path(); ctx.closePath(); ctx.clip();
        const room = bot - top - sc(40), unit = room / Math.max(most, 4); let y = bot;
        list.forEach((e, i) => {
          const hgt = unit * (1 + Math.min(e.min || 0, 90) / 30), c = mixWhite(groupColor(e.group), .55), g = ctx.createLinearGradient(x, 0, x + gw, 0);
          g.addColorStop(0, c); g.addColorStop(.5, mixWhite(groupColor(e.group), .72)); g.addColorStop(1, c);
          ctx.fillStyle = g; ctx.fillRect(x, y - hgt, gw, hgt); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(x, y - hgt, gw, sc(i === list.length - 1 ? 3 : 1.4)); y -= hgt;
        });
        ctx.restore();
        path(); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = sc(2.4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + sc(16), top + sc(30)); ctx.lineTo(x + sc(22), bot - sc(60)); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = sc(5); ctx.lineCap = 'round'; ctx.stroke();
        ctx.fillStyle = L.muted; ctx.font = `400 ${sc(26)}px ${SANS}`; ctx.textAlign = 'center'; ctx.fillText(`周${'一二三四五六日'[d]}`, x + gw / 2, bot + sc(56));
        ctx.fillStyle = L.ink; ctx.font = `600 ${sc(30)}px ${SANS}`; ctx.fillText(String(list.length), x + gw / 2, bot + sc(98)); ctx.textAlign = 'left';
      });
      footer(`600 ${sc(44)}px ${SANS}`);
      return canvas;
    }

    if (mat === 'paper') { /* ---- 昼: a manuscript page, written right to left ---- */
      ctx.fillStyle = L.bg; ctx.fillRect(0, 0, W, H);
      { const r = rng(4); for (let i = 0; i < W * H / 40; i++) { ctx.fillStyle = `rgba(90,70,40,${.05 * r()})`; ctx.fillRect(r() * W, r() * H, 1.5, 1.5); } }
      const cell = sc(96), rows = 8, gx = W - Pd - 7 * cell, gy = sc(250), red = '#b43a2c';
      for (let d = 0; d < 7; d++) {
        const x = W - Pd - (d + 1) * cell, list = byDay[d], words = list.length ? Array.from(window.SuiSuiSkins.phrase(Math.min(list.length, rows), `${start.getTime()}`, d).text) : [];
        if (list.length) { ctx.fillStyle = L.muted; ctx.font = `400 ${sc(22)}px ${SONG}`; ctx.textAlign = 'center'; ctx.fillText(`${CN(list.length)}件`, x + cell / 2, gy + rows * cell + sc(42)); }
        ctx.fillStyle = red; ctx.font = `400 ${sc(26)}px ${SONG}`; ctx.textAlign = 'center'; ctx.fillText(`周${'一二三四五六日'[d]}`, x + cell / 2, gy - sc(22));
        for (let r = 0; r < rows; r++) {
          const y = gy + r * cell, cx = x + cell / 2, cy = y + cell / 2;
          ctx.strokeStyle = hex(red, .45); ctx.lineWidth = sc(1.3); ctx.strokeRect(x, y, cell, cell);
          ctx.save(); ctx.setLineDash([sc(4), sc(5)]); ctx.strokeStyle = hex(red, .15); ctx.lineWidth = sc(1); ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + cell, cy); ctx.moveTo(cx, y); ctx.lineTo(cx, y + cell); ctx.stroke(); ctx.restore();
          const e = list[r]; if (!e || !words[r]) continue;
          ctx.fillStyle = '#1d1a16'; ctx.font = `400 ${sc(58)}px ${SONG}`; ctx.fillText(words[r], cx, cy + sc(20));
          if ((e.min || 0) >= 20) { const q = rng(hash(`${e.id}${e.at}`)); ctx.save(); ctx.translate(cx, cy); ctx.rotate((q() - .5) * .8); ctx.strokeStyle = red; ctx.lineWidth = sc(3); ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(0, 0, sc(38), sc(35), 0, .25, Math.PI * 2 - .05); ctx.stroke(); ctx.restore(); }
        }
      }
      ctx.textAlign = 'center';
      Array.from(`第${CN(isoWeek(start))}周`).forEach((ch, i) => { ctx.fillStyle = '#1d1a16'; ctx.font = `400 ${sc(64)}px ${SONG}`; ctx.fillText(ch, Pd + sc(44), gy + sc(60) + i * sc(80)); });
      Array.from(`${CN(start.getMonth() + 1)}月${CN(start.getDate())}日起`).forEach((ch, i) => { ctx.fillStyle = L.muted; ctx.font = `400 ${sc(24)}px ${SONG}`; ctx.fillText(ch, Pd + sc(130), gy + sc(40) + i * sc(34)); });
      // seal
      const sx = Pd + sc(4), sy = gy + rows * cell - sc(150), s = sc(140);
      ctx.save(); ctx.translate(sx + s / 2, sy + s / 2); ctx.rotate(-.05); ctx.fillStyle = red; ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.fillStyle = '#f5f2ec'; ctx.font = `600 ${sc(50)}px ${SONG}`; [['碎', -1, -1], ['碎', -1, 1], ['清', 1, -1], ['单', 1, 1]].forEach(([c, cxk, cyk]) => ctx.fillText(c, -cxk * s * .23, cyk * s * .23 + sc(17)));
      { const r = rng(11); ctx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 180; i++) { ctx.fillStyle = `rgba(0,0,0,${.3 + r() * .5})`; ctx.fillRect((r() - .5) * s, (r() - .5) * s, sc(1 + r() * 3), sc(1 + r() * 2)); } }
      ctx.restore(); ctx.textAlign = 'left';
      ctx.fillStyle = '#1d1a16'; ctx.font = `400 ${sc(40)}px ${SONG}`; ctx.fillText(entries.length ? `${CN(entries.length)}件事${st.focusText ? `，${st.focusText}` : ''}` : '这一页还空着', Pd, H - Pd - sc(70));
      ctx.fillStyle = L.muted; ctx.font = `400 ${sc(26)}px ${SONG}`; ctx.fillText(entries.length ? `周${st.busiest}写得最多。做完几件，写几个字；朱圈是专注过的` : '完成一件事，就写下第一个字', Pd, H - Pd - sc(24));
      return canvas;
    }

    const SK = window.SuiSuiSkins;
    if (mat === 'bloom') { /* ---- 晕: the week as one wash, a band of water per day, each drop a colour ---- */
      const g0 = ctx.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, '#f6f7f6'); g0.addColorStop(1, '#ebedec'); ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
      { const r = rng(51); for (let i = 0; i < W * H / 50; i++) { ctx.fillStyle = `rgba(40,50,60,${.04 * r()})`; ctx.fillRect(r() * W, r() * H, 1.5, 1.5); } }
      caption(`400 ${sc(80)}px ${SONG}`, `第 ${isoWeek(start)} 周`, range, '#2b2b2e', '#636569');
      const top = sc(270), band = sc(108), bx = Pd, bw = W - 2 * Pd;
      ctx.globalCompositeOperation = 'multiply';
      byDay.forEach((list, d) => list.forEach(e => {
        // across: the hour it was done; down: its day; size: how long it was focused on
        const when = new Date(e.at), hr = when.getHours() + when.getMinutes() / 60, r = rng(hash(`${e.id}w`)), c = SK.PIGMENTS[hash(`drop:${e.id}${e.at}`) % SK.PIGMENTS.length][1];
        const R = sc(58 + Math.min(e.min || 0, 90) * .7) * (.85 + r() * .3), x = bx + R * .6 + clamp((hr - 6) / 17) * (bw - sc(90) - R * 1.2), y = top + d * band + band / 2 + (r() - .5) * band * .5;
        for (let k = 0; k < 4; k++) {
          const RR = R * (.86 + r() * .22), xx = x + (r() - .5) * R * .2, yy = y + (r() - .5) * R * .2, g = ctx.createRadialGradient(xx, yy, 0, xx, yy, RR);
          g.addColorStop(0, hex(c, .06)); g.addColorStop(.72, hex(c, .07)); g.addColorStop(.94, hex(c, .1)); g.addColorStop(1, hex(c, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xx, yy, RR, 0, 7); ctx.fill();
        }
      }));
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#636569'; ctx.font = `400 ${sc(22)}px ${SONG}`; '一二三四五六日'.split('').forEach((t, d) => ctx.fillText(`周${t}`, W - Pd - sc(56), top + d * band + band / 2 + sc(8)));
      ctx.fillStyle = '#2b2b2e'; ctx.font = `400 ${sc(40)}px ${SONG}`; ctx.fillText(entries.length ? `${CN(entries.length)}滴颜色` : '一盆清水', Pd, H - Pd - sc(70));
      ctx.fillStyle = '#636569'; ctx.font = `400 ${sc(26)}px ${SONG}`; ctx.fillText(entries.length ? [st.focusText, `周${st.busiest}最浓。专注越久，晕得越大`].filter(Boolean).join('，') : '做完一件事，就滴下第一滴', Pd, H - Pd - sc(24));
      return canvas;
    }
    if (mat === 'tape') { /* ---- 乐: seven strips, one a day; each hole a note at the hour it was done ---- */
      ctx.fillStyle = '#12302a'; ctx.fillRect(0, 0, W, H);
      { const r = rng(21); for (let i = 0; i < W * H / 60; i++) { ctx.fillStyle = `rgba(200,230,215,${.06 * r()})`; ctx.fillRect(r() * W, r() * H, 1.5, 1.5); } }
      caption(`300 ${sc(76)}px ${SANS}`, `第 ${isoWeek(start)} 周`, range, '#f3ecdc', '#9fb5ad');
      const top = sc(280), sh = sc(96), gap = sc(18), lx = Pd + sc(70), rx = W - Pd;
      byDay.forEach((list, d) => {
        const y = top + d * (sh + gap);
        ctx.fillStyle = '#9fb5ad'; ctx.font = `400 ${sc(24)}px ${SANS}`; ctx.fillText(`周${'一二三四五六日'[d]}`, Pd, y + sh / 2 + sc(9));
        const pg = ctx.createLinearGradient(0, y, 0, y + sh); pg.addColorStop(0, '#f6f0e2'); pg.addColorStop(1, '#ebe2cc'); ctx.fillStyle = pg; ctx.fillRect(lx, y, rx - lx, sh);
        for (let r = 0; r < 7; r++) { ctx.fillStyle = `rgba(18,48,42,${r % 2 ? .07 : .13})`; ctx.fillRect(lx, y + sc(10) + r * sc(15), rx - lx, sc(1)); }
        for (let x = lx + sc(8); x < rx; x += sc(16)) { ctx.fillStyle = 'rgba(18,48,42,.5)'; ctx.beginPath(); ctx.arc(x, y + sc(4), sc(1.6), 0, 7); ctx.arc(x, y + sh - sc(4), sc(1.6), 0, 7); ctx.fill(); }
        list.forEach(e => { const when = new Date(e.at), hr = when.getHours() + when.getMinutes() / 60, x = lx + sc(20) + (rx - lx - sc(40)) * clamp((hr - 6) / 18, 0, 1), yy = y + sc(10) + SK.pitchOf(`${e.id}`) * sc(15);
          ctx.fillStyle = '#12302a'; ctx.beginPath(); ctx.arc(x, yy, sc(6.5), 0, 7); ctx.fill(); });
      });
      footer(`500 ${sc(44)}px ${SANS}`, '#f3ecdc', '#9fb5ad');
      return canvas;
    }
    if (mat === 'riso') { /* ---- 印: a two-colour poster, each day a column of little prints ---- */
      ctx.fillStyle = '#f6f4ef'; ctx.fillRect(0, 0, W, H);
      const dots = document.createElement('canvas'); dots.width = dots.height = Math.max(4, Math.round(sc(9))); { const d = dots.getContext('2d'); d.fillStyle = '#ff4fa3'; d.beginPath(); d.arc(dots.width / 2, dots.height / 2, dots.width * .36, 0, 7); d.fill(); }
      const pink = ctx.createPattern(dots, 'repeat');
      ctx.globalCompositeOperation = 'multiply';
      ctx.font = `800 ${sc(300)}px ${SANS}`; ctx.fillStyle = '#2f5fb3'; ctx.fillText(String(isoWeek(start)), Pd - sc(10), sc(345));
      ctx.fillStyle = pink; ctx.fillText(String(isoWeek(start)), Pd + sc(4), sc(335));
      const colW = (W - 2 * Pd) / 7, s0 = Math.min(sc(96), colW * .92);
      byDay.forEach((list, d) => list.slice(0, 6).forEach((e, i) => {
        const m = SK.MOTIFS[SK.motifOf({ id: e.id, title: e.title })], r = rng(hash(`${e.id}${e.at}`)), x = Pd + d * colW + (colW - s0) / 2 + (r() - .5) * sc(10), y = sc(400) + i * (s0 + sc(12)), k = s0 / 40, line = !m.p || /M20 4v6|M4 10l16|M8 32L26/.test(m.p);
        ctx.save(); ctx.translate(x + s0 / 2, y + s0 / 2); ctx.rotate((r() - .5) * .3); ctx.translate(-s0 / 2, -s0 / 2); ctx.scale(k, k);
        ctx.save(); ctx.translate(1.8, -1.3); if (line) { ctx.strokeStyle = '#ff4fa3'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.stroke(new Path2D(m.p)); } else { ctx.fillStyle = pink; ctx.fill(new Path2D(m.p)); ctx.fillStyle = 'rgba(255,79,163,.35)'; ctx.fill(new Path2D(m.p)); } ctx.restore();
        if (/M20 4v6/.test(m.b)) { ctx.strokeStyle = '#2f5fb3'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke(new Path2D(m.b)); } else { ctx.fillStyle = 'rgba(47,95,179,.92)'; ctx.fill(new Path2D(m.b)); }
        ctx.restore();
      }));
      ctx.globalCompositeOperation = 'source-over';
      { const r = rng(5); for (let i = 0; i < W * H / 70; i++) { ctx.fillStyle = 'rgba(246,244,239,.9)'; ctx.fillRect(r() * W, r() * H, sc(1 + r() * 1.5), sc(1 + r())); } }
      ctx.font = `400 ${sc(22)}px ${SANS}`; ctx.fillStyle = '#5d6377'; ctx.textAlign = 'center'; '一二三四五六日'.split('').forEach((t, d) => ctx.fillText(`周${t}`, Pd + d * colW + colW / 2, sc(388))); ctx.textAlign = 'left';
      ctx.fillStyle = '#2f5fb3'; ctx.font = `600 ${sc(24)}px ${SANS}`; ctx.fillText(range, Pd, sc(70));
      footer(`800 ${sc(44)}px ${SANS}`, '#2f5fb3', '#5d6377');
      return canvas;
    }

    if (mat === 'room') { /* ---- 屋: seven little rooms, one a day, furnished by what got done ---- */
      ctx.fillStyle = '#e6eed2'; ctx.fillRect(0, 0, W, H);
      { const r = rng(9); for (let i = 0; i < W * H / 900; i++) { ctx.fillStyle = `rgba(44,58,32,${.02 + r() * .04})`; ctx.fillRect(r() * W, r() * H, sc(1.2), sc(1.2)); } }
      caption(`700 ${sc(72)}px ${SANS}`, `第 ${isoWeek(start)} 周的七间房`, range, '#2c3a20', '#5d6b4c');
      const cw = (W - 2 * Pd) / 4, rw = cw * 1.3, rh = rw * 224 / 200;
      byDay.forEach((list, d) => {
        const row = d < 4 ? 0 : 1, col = row ? d - 4 + .5 : d, x = Pd + col * cw + (cw - rw) / 2, y = sc(240) + row * (rh + sc(96));
        const n = Math.min(list.length, 14), img = SK.roomImg({ done: n, total: Math.max(n, 1), lit: n > 0 });
        if (img.complete && img.naturalWidth) ctx.drawImage(img, x, y, rw, rh);
        ctx.textAlign = 'center'; ctx.fillStyle = '#5d6b4c'; ctx.font = `400 ${sc(24)}px ${SANS}`; ctx.fillText(`周${'一二三四五六日'[d]}`, x + rw / 2, y + rh + sc(14));
        ctx.fillStyle = '#2c3a20'; ctx.font = `700 ${sc(30)}px ${SANS}`; ctx.fillText(list.length ? `${list.length} 件` : '空着', x + rw / 2, y + rh + sc(52)); ctx.textAlign = 'left';
      });
      footer(`700 ${sc(44)}px ${SANS}`, '#2c3a20', '#5d6b4c');
      return canvas;
    }
    if (mat === 'fluff') { /* ---- 毛: seven cats, one a day; the more done, the fluffier; a full day opens its eyes ---- */
      ctx.fillStyle = '#f8f7f4'; ctx.fillRect(0, 0, W, H);
      caption(`400 ${sc(76)}px ${SONG}`, `第 ${isoWeek(start)} 周`, range, '#141416', '#626266');
      const most = Math.max(4, ...byDay.map(l => l.length)), cw = (W - 2 * Pd) / 4, s = cw * 1.2 / 180;
      byDay.forEach((list, d) => {
        const row = d < 4 ? 0 : 1, col = row ? d - 4 + .5 : d, x = Pd + col * cw + (cw - 180 * s) / 2, y = sc(260) + row * (172 * s + sc(150));
        const p = list.length / most, c = SK.furCanvas(Math.min(1, p), list.length >= most);
        ctx.drawImage(c, x, y, 180 * s, 172 * s);
        ctx.textAlign = 'center'; ctx.fillStyle = '#626266'; ctx.font = `400 ${sc(24)}px ${SONG}`; ctx.fillText(`周${'一二三四五六日'[d]}`, x + 90 * s, y + 172 * s + sc(30));
        ctx.fillStyle = '#141416'; ctx.font = `400 ${sc(34)}px ${SONG}`; ctx.fillText(list.length ? `${list.length} 层` : '一个圈', x + 90 * s, y + 172 * s + sc(74)); ctx.textAlign = 'left';
      });
      footer(`400 ${sc(48)}px ${SONG}`, '#141416', '#626266');
      return canvas;
    }

    /* ---- 夜 (and the free preview): a star map, one constellation per day ---- */
    ctx.fillStyle = L.bg; ctx.fillRect(0, 0, W, H);
    { const r = rng(17); for (let i = 0; i < 300; i++) { const s = r() < .05 ? 2 : .5 + r(); ctx.fillStyle = `rgba(225,232,255,${.08 + r() * .4})`; ctx.beginPath(); ctx.arc(r() * W, r() * H, sc(s), 0, 7); ctx.fill(); } }
    const cx = W / 2, cy = sc(680), R = sc(410);
    { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2); g.addColorStop(0, mat === 'plain' ? 'rgba(80,140,255,.10)' : 'rgba(90,110,190,.14)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    ctx.strokeStyle = 'rgba(223,230,255,.18)'; ctx.lineWidth = sc(1.2); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    ctx.save(); ctx.setLineDash([sc(2), sc(10)]); [R * .36, R * .68].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke(); }); ctx.restore();
    ctx.textAlign = 'center'; ctx.font = `400 ${sc(24)}px ${SANS}`;
    for (let d = 0; d < 7; d++) {
      const a0 = -Math.PI / 2 + d / 7 * Math.PI * 2, am = a0 + Math.PI / 7;
      ctx.strokeStyle = 'rgba(223,230,255,.08)'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a0) * sc(40), cy + Math.sin(a0) * sc(40)); ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R); ctx.stroke();
      ctx.fillStyle = byDay[d].length ? 'rgba(223,230,255,.75)' : 'rgba(223,230,255,.3)'; ctx.fillText(`周${'一二三四五六日'[d]}`, cx + Math.cos(am) * (R + sc(42)), cy + Math.sin(am) * (R + sc(42)) + sc(8));
      const pts = byDay[d].map(e => { const when = new Date(e.at), hr = when.getHours() + when.getMinutes() / 60, r = rng(hash(`${e.id}${e.at}`)), a = a0 + (.12 + .76 * (hr / 24) + (r() - .5) * .1) * Math.PI * 2 / 7, rad = sc(70) + (R - sc(100)) * clamp((hr - 5) / 19 + (r() - .5) * .08, .04, 1); return { x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad, e }; });
      if (pts.length > 1) { ctx.strokeStyle = 'rgba(223,230,255,.34)'; ctx.lineWidth = sc(1.4); ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); }
      pts.forEach((p, i) => {
        const s = sc(9 + Math.min(p.e.min || 0, 90) / 7), col = mat === 'plain' ? groupColor(p.e.group) : L.shards[(hash(p.e.id) + i) % 3];
        ctx.save(); ctx.translate(p.x, p.y); ctx.shadowColor = col; ctx.shadowBlur = s * 1.6; ctx.fillStyle = '#f4f6ff';
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * .12, -s * .12, s, 0); ctx.quadraticCurveTo(s * .12, s * .12, 0, s); ctx.quadraticCurveTo(-s * .12, s * .12, -s, 0); ctx.quadraticCurveTo(-s * .12, -s * .12, 0, -s); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = hex(col.startsWith('#') ? col : '#9fb4ff', .25); ctx.beginPath(); ctx.arc(0, 0, s * 1.4, 0, 7); ctx.fill(); ctx.restore();
      });
    }
    ctx.textAlign = 'left';
    caption(`300 ${sc(80)}px ${SANS}`, `第 ${isoWeek(start)} 周`, range);
    footer(`500 ${sc(44)}px ${SANS}`);
    return canvas;
  }

  /** The weekly picture is drawn on a canvas, which does not wait for web fonts: load the theme's fonts for the
      characters it will draw, and tell the caller whether it should draw again. */
  const fontsDone = new Set();
  function artFonts(L, entries) {
    const mat = L.material, faces = mat === 'paper' ? ['400 40px "Noto Serif SC"'] : mat === 'bloom' ? ['400 40px "Noto Serif SC"'] : [];
    const text = `${window.SuiSuiSkins?.phraseChars || ''}第周件事层圈间房空着一二三四五六七八九十日月起至专注小时分钟写得最多朱圈是过的这页还空着完成就下个字碎清单IVX0123456789`;
    if (mat === 'room') { const SK = window.SuiSuiSkins, imgs = Array.from({ length: 15 }, (_, n) => SK.roomImg({ done: n, total: Math.max(n, 1), lit: n > 0 })), waiting = imgs.some(i => !i.complete || !i.naturalWidth); return waiting ? SK.roomReady(imgs).then(() => true) : Promise.resolve(false); }
    if (mat === 'fluff') faces.push('400 40px "Noto Serif SC"');
    const key = faces.join() + text; if (!faces.length || !document.fonts?.load || fontsDone.has(key)) return Promise.resolve(false);
    return Promise.all(faces.map(f => document.fonts.load(f, text))).then(() => { fontsDone.add(key); return true; }, () => false);
  }

