  /* ---------- 清空时刻 ---------- */
  /* ---------- 清空时刻: each theme ends the day its own way (canvas, about 3.5 s, then holds still) ---------- */
  const easeOutBack = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const CEL_SPEED = 1.7;
  /** Where the piece lands in the header picture: one thin ring in the theme's ink opens and fades (about 0.4 s). */
  const LAND_INK = { dawn: '#86dcc6', day: '#b43a2c', night: '#c9d6ff', bloom: '#3b5a87', riso: '#ff4fa3', room: '#2c3a20', fluff: '#141416' };
  function land(to, theme) {
    if (!to || reduce()) return;
    const d = document.createElement('div'); d.className = 'pro-land';
    Object.assign(d.style, { left: `${to.x}px`, top: `${to.y}px`, '--land': LAND_INK[theme] || '#ffffff' });
    document.body.append(d); setTimeout(() => d.remove(), 520);
  }
  const FINALES = {
    dawn(ctx, W, H, ms, items = []) { // a layered drink: every thing done is one band of colour, poured in the order it was done
      const n = Math.max(1, Math.min(8, items.length || 5)), PAL = ['#b9b1ff', '#94e0cc', '#ffc4a8', '#a9d4ff', '#f6b6d0', '#d6f0a8', '#c9b8ff', '#9fe6e0'];
      const gw = 132, gh = 214, cx = W / 2, y = H / 2 - gh / 2 - 22, top = gw / 2, bot = gw / 2 - 12, foot = 16;
      const edge = t => top + (bot - top) * t; // half width at depth t (0 top .. 1 bottom of the liquid space)
      const inner = h => { ctx.beginPath(); ctx.moveTo(cx - top + 5, y); ctx.lineTo(cx - bot + 5, y + h); ctx.lineTo(cx + bot - 5, y + h); ctx.lineTo(cx + top - 5, y); ctx.closePath(); };
      const per = 1500 / n, space = gh - foot - 14, band = space / n;
      // soft shadow and a caustic of the colours on the table
      const sh = ctx.createRadialGradient(cx, y + gh + 6, 4, cx, y + gh + 6, gw * .75); sh.addColorStop(0, 'rgba(60,56,90,.16)'); sh.addColorStop(1, 'rgba(60,56,90,0)');
      ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(cx, y + gh + 6, gw * .75, 14, 0, 0, 7); ctx.fill();
      const fillT = clamp(ms / (per * n + 300));
      if (fillT > .2) { const ca = ctx.createRadialGradient(cx + 18, y + gh + 8, 2, cx + 18, y + gh + 8, 70); ca.addColorStop(0, `rgba(255,196,168,${.35 * fillT})`); ca.addColorStop(.5, `rgba(148,224,204,${.18 * fillT})`); ca.addColorStop(1, 'rgba(185,177,255,0)'); ctx.fillStyle = ca; ctx.beginPath(); ctx.ellipse(cx + 18, y + gh + 8, 70, 12, 0, 0, 7); ctx.fill(); }
      // liquid bands, bottom up, each poured in turn with a little wave that settles
      ctx.save(); inner(gh - foot); ctx.clip();
      let level = y + gh - foot;
      for (let k = 0; k < n; k++) { const t = easeOut(clamp((ms - k * per) / (per * 1.3))); if (t <= 0) break;
        const h = band * t, yTop = level - h, wave = (1 - t) * 5, c = PAL[k % PAL.length], c2 = PAL[(k + 1) % PAL.length];
        const g = ctx.createLinearGradient(0, level, 0, yTop - 6); g.addColorStop(0, c); g.addColorStop(1, hex(c2, .92));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - top - 4, level + 1); for (let x = -top - 4; x <= top + 4; x += 4) ctx.lineTo(cx + x, yTop + Math.sin(x / 13 + ms / 170 + k) * wave); ctx.lineTo(cx + top + 4, level + 1); ctx.fill();
        level = yTop; }
      // meniscus + inner glow
      if (level < y + gh - foot - 1) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(cx, level + 1, edge((level - y) / (gh - foot)) - 6, 2.2, 0, 0, 7); ctx.fill(); }
      const gl = ctx.createLinearGradient(cx - top, 0, cx + top, 0); gl.addColorStop(0, 'rgba(255,255,255,.28)'); gl.addColorStop(.25, 'rgba(255,255,255,0)'); gl.addColorStop(.8, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,.18)'); ctx.fillStyle = gl; ctx.fillRect(cx - top, y, gw, gh);
      // a few slow bubbles
      for (let b = 0; b < 7; b++) { const r = rng(b + 11), by = y + gh - foot - ((ms / 22 * (.6 + r()) + r() * gh) % (gh - foot)); if (by < level + 4) continue; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(cx - bot + 14 + r() * (bot * 2 - 28), by, .9 + r() * 1.4, 0, 7); ctx.fill(); }
      ctx.restore();
      // the glass: thick base, two hairlines, long highlights
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(cx - bot - 1, y + gh - foot); ctx.lineTo(cx + bot + 1, y + gh - foot); ctx.lineTo(cx + bot + 1, y + gh - 4); ctx.quadraticCurveTo(cx + bot + 1, y + gh, cx + bot - 4, y + gh); ctx.lineTo(cx - bot + 4, y + gh); ctx.quadraticCurveTo(cx - bot - 1, y + gh, cx - bot - 1, y + gh - 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - top, y); ctx.lineTo(cx - bot - 1, y + gh - 4); ctx.quadraticCurveTo(cx - bot - 1, y + gh, cx - bot + 4, y + gh); ctx.lineTo(cx + bot - 4, y + gh); ctx.quadraticCurveTo(cx + bot + 1, y + gh, cx + bot + 1, y + gh - 4); ctx.lineTo(cx + top, y);
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = 'rgba(40,40,70,.2)'; ctx.lineWidth = .8; ctx.stroke();
      ctx.strokeStyle = 'rgba(40,40,70,.14)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, y, top, 3.2, 0, 0, 7); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.ellipse(cx, y, top, 3.2, 0, Math.PI, 0); ctx.stroke();
      const hl = ctx.createLinearGradient(0, y + 12, 0, y + gh - 30); hl.addColorStop(0, 'rgba(255,255,255,.9)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hl; ctx.beginPath(); ctx.moveTo(cx - top + 12, y + 12); ctx.lineTo(cx - top + 17, y + 12); ctx.lineTo(cx - bot + 14, y + gh - 34); ctx.lineTo(cx - bot + 11, y + gh - 34); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(cx + top - 16, y + 18, 2, 40);
      // tick marks, one per thing
      ctx.strokeStyle = 'rgba(40,40,70,.25)'; ctx.lineWidth = 1; for (let k = 1; k <= n; k++) { const yy = y + gh - foot - band * k, hw = edge((yy - y) / (gh - foot)); ctx.beginPath(); ctx.moveTo(cx + hw - 12, yy); ctx.lineTo(cx + hw - 4, yy); ctx.stroke(); }
    },
    day(ctx, W, H, ms, items) { // the line is written out, then the seal comes down
      const P = window.SuiSuiSkins.phrase(items.length === 6 ? 6 : Math.max(1, items.length), items.length === 6 ? '' : API.dayKey()), chars = Array.from(P.text), n = chars.length;
      const cell = Math.min(44, (W - 60) / Math.min(7, n)), per = Math.min(7, n), rows = Math.ceil(n / per), x0 = W / 2 - per * cell / 2, y0 = 70;
      chars.forEach((ch, i) => { const cx = x0 + (i % per) * cell, cy = y0 + Math.floor(i / per) * cell, t = clamp((ms - i * 140) / 300);
        ctx.strokeStyle = 'rgba(180,58,44,.45)'; ctx.lineWidth = 1; ctx.strokeRect(cx, cy, cell, cell);
        ctx.globalAlpha = .3 + .7 * t; ctx.fillStyle = t < 1 ? '#b43a2c' : '#1d1a16'; ctx.font = `400 ${cell * .62}px ${SONG}`; ctx.textAlign = 'center'; ctx.fillText(ch, cx + cell / 2, cy + cell * .72); ctx.globalAlpha = 1; });
      const t = clamp((ms - n * 140 - 300) / 420), s = 96, sx = W / 2 + per * cell / 2 - s * .4, sy = y0 + rows * cell + 30;
      if (t > 0) { const k = 1.7 - .7 * easeIn(t); ctx.save(); ctx.translate(sx, sy + s / 2); ctx.rotate(-.08); ctx.scale(k, k); ctx.globalAlpha = Math.min(1, t * 2);
        ctx.fillStyle = '#b43a2c'; ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, 8); ctx.fill(); ctx.strokeStyle = '#f5f2ec'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-s / 2 + 8, -s / 2 + 8, s - 16, s - 16, 4); ctx.stroke();
        ctx.fillStyle = '#f5f2ec'; ctx.font = `700 ${s * .52}px ${SONG}`; ctx.textAlign = 'center'; ctx.fillText('毕', 0, s * .18);
        ctx.globalCompositeOperation = 'destination-out'; const r = rng(3); for (let i = 0; i < 90; i++) { ctx.fillStyle = `rgba(0,0,0,${.4 + r() * .5})`; ctx.fillRect((r() - .5) * s, (r() - .5) * s, 1 + r() * 3, 1 + r() * 2); } ctx.restore(); }
      ctx.textAlign = 'left';
    },
    night(ctx, W, H, ms, items) { // the stars light up in the order things were done and join into one constellation, named for today
      const n = Math.max(2, items.length), cx = W / 2, cy = H * .42, R = Math.min(W * .34, H * .3);
      // place on a soft ring so the lines never cross: angle by order, radius by the id
      const pts = items.map((e, i) => { const r = rng(hash(`cel:${e.id}`)), a = -Math.PI * .85 + (i / Math.max(1, n - 1)) * Math.PI * 1.55 + (r() - .5) * .35, rr = R * (.62 + r() * .42); return { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * .78, m: .75 + r() * .5 }; });
      // nebula and dust, very faint
      const neb = (x, y, r, c) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
      const fade = clamp(ms / 1200); ctx.globalAlpha = fade; neb(cx - R * .5, cy - R * .2, R * 1.3, 'rgba(96,110,220,.16)'); neb(cx + R * .6, cy + R * .3, R, 'rgba(170,110,220,.10)'); ctx.globalAlpha = 1;
      const bg = rng(9); for (let i = 0; i < 110; i++) { const x = bg() * W, y = bg() * H, a = .08 + bg() * .35, tw = .6 + .4 * Math.sin(ms / 500 + i); ctx.fillStyle = `rgba(223,230,255,${a * tw})`; ctx.beginPath(); ctx.arc(x, y, .35 + bg() * .75, 0, 7); ctx.fill(); }
      const per = 2000 / Math.max(1, pts.length);
      // lines: thin, brighter in the middle
      pts.forEach((p, i) => { if (!i) return; const t = easeOut(clamp((ms - i * per) / per)); if (t <= 0) return; const a = pts[i - 1], ex = a.x + (p.x - a.x) * t, ey = a.y + (p.y - a.y) * t;
        const g = ctx.createLinearGradient(a.x, a.y, ex, ey); g.addColorStop(0, 'rgba(201,214,255,.15)'); g.addColorStop(.5, 'rgba(223,230,255,.6)'); g.addColorStop(1, 'rgba(201,214,255,.2)');
        ctx.strokeStyle = g; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ex, ey); ctx.stroke(); });
      const pulse = ms > 2300 ? .5 + .5 * Math.sin((ms - 2300) / 380) : 0;
      pts.forEach((p, i) => { const t = clamp((ms - i * per) / 320); if (t <= 0) return; const s = 5.5 * p.m * easeOutBack(t) * (1 + pulse * .12);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 4.2); g.addColorStop(0, 'rgba(214,224,255,.55)'); g.addColorStop(.35, 'rgba(160,180,255,.18)'); g.addColorStop(1, 'rgba(159,180,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, s * 4.2, 0, 7); ctx.fill();
        // diffraction spikes
        ctx.strokeStyle = 'rgba(235,240,255,.55)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(p.x - s * 3.2, p.y); ctx.lineTo(p.x + s * 3.2, p.y); ctx.moveTo(p.x, p.y - s * 3.2); ctx.lineTo(p.x, p.y + s * 3.2); ctx.stroke();
        ctx.fillStyle = '#f8faff'; ctx.beginPath(); ctx.arc(p.x, p.y, s * .42, 0, 7); ctx.fill(); });
      // the constellation's name, small and spaced, under its lowest star
      const nt = clamp((ms - 2100) / 600); if (nt > 0) { const low = pts.reduce((m, p) => p.y > m.y ? p : m, pts[0]), d = new Date(); ctx.globalAlpha = nt * .8; ctx.fillStyle = '#c9d6ff'; ctx.font = `500 11px ${SANS}`; ctx.textAlign = 'center';
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '3px'; ctx.fillText(`碎碎座 · ${d.getMonth() + 1}.${d.getDate()}`, cx, Math.min(H - 14, low.y + 34)); if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
      const st = clamp((ms - 2500) / 800); if (st > 0 && st < 1) { const sx = W * (1.05 - st * 1.2), sy = 26 + st * 90, gr = ctx.createLinearGradient(sx, sy, sx + 80, sy - 34); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.strokeStyle = gr; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 80, sy - 34); ctx.stroke(); }
    },
    bloom(ctx, W, H, ms, items) { // every colour is one petal; together they open into a flower, then the seal
      const n = Math.max(3, items.length), cx = W / 2, cy = H * .44, L = Math.min(92, H * .22), PAL = ['#e48ea0', '#f0b47c', '#86b4dc', '#9cc39a', '#b29ad6', '#f1cf6e', '#e7a2c4', '#7fc2c0'];
      const wet = (c, a) => hex(c, a);
      // stem and one leaf first, in grey-green ink
      const stT = easeOut(clamp(ms / 700)); ctx.strokeStyle = 'rgba(94,120,92,.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, cy + 12); ctx.quadraticCurveTo(cx + 10, cy + 70, cx - 4, cy + 12 + (H * .5) * stT); ctx.stroke();
      if (stT > .6) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(140,178,128,.35)'; ctx.beginPath(); ctx.ellipse(cx + 22, cy + 96, 24 * stT, 8 * stT, -.5, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
      ctx.globalCompositeOperation = 'multiply';
      for (let i = 0; i < n; i++) { const t = easeOut(clamp((ms - 250 - i * 180) / 1100)); if (t <= 0) continue;
        const a = -Math.PI / 2 + i * (Math.PI * 2 / n), c = PAL[i % PAL.length], len = L * (.35 + .65 * t), wd = len * .46, px = cx + Math.cos(a) * len * .55, py = cy + Math.sin(a) * len * .55;
        ctx.save(); ctx.translate(px, py); ctx.rotate(a);
        for (let k = 0; k < 3; k++) { const g = ctx.createRadialGradient(-len * .1, 0, 0, 0, 0, len * .62); g.addColorStop(0, wet(c, .12)); g.addColorStop(.72, wet(c, .2)); g.addColorStop(.94, wet(c, .42)); g.addColorStop(1, wet(c, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse((k - 1) * 1.5, (k - 1) * 1.2, len * .58, wd * (.9 + k * .05), 0, 0, 7); ctx.fill(); }
        // a vein of darker pigment where the water dried
        ctx.strokeStyle = wet(c, .28); ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-len * .45, 0); ctx.quadraticCurveTo(0, wd * .1, len * .4, 0); ctx.stroke();
        ctx.restore(); }
      // the heart
      const ht = clamp((ms - 250 - n * 180) / 500); if (ht > 0) { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14); g.addColorStop(0, `rgba(196,140,52,${.75 * ht})`); g.addColorStop(1, 'rgba(196,140,52,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 7); ctx.fill();
        const r = rng(5); ctx.fillStyle = `rgba(120,80,30,${.55 * ht})`; for (let k = 0; k < 9; k++) { const a = r() * 7, d = 3 + r() * 7; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, .9, 0, 7); ctx.fill(); } }
      ctx.globalCompositeOperation = 'source-over';
      // seal and date, like a signed painting
      const t = clamp((ms - n * 180 - 1300) / 400); if (t > 0) { const s = 30, sx = cx + L + 14, sy = cy + L + 46; ctx.save(); ctx.globalAlpha = t; ctx.translate(sx, sy); ctx.rotate(-.04);
        ctx.fillStyle = '#b8475a'; ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, 3); ctx.fill(); ctx.fillStyle = '#f7f8f7'; ctx.font = `700 ${s * .36}px ${SONG}`; ctx.textAlign = 'center'; ctx.fillText('碎', 0, -1); ctx.fillText('碎', 0, s * .36);
        const d = new Date(); ctx.fillStyle = 'rgba(43,43,46,.55)'; ctx.font = `400 11px ${SONG}`; ctx.textAlign = 'right'; ctx.fillText(`${d.getMonth() + 1}月${d.getDate()}日`, -s / 2 - 8, 4); ctx.restore(); ctx.textAlign = 'left'; }
    },
    tape(ctx, W, H, ms, items) { // the strip runs past the playhead; every hole sends a note up
      const SK = window.SuiSuiSkins, sh = 120, sy = H - sh - 50, gap = 64, scroll = ms * .09, px = W * .35;
      ctx.fillStyle = '#f3ecdc'; ctx.fillRect(0, sy, W, sh);
      for (let r = 0; r < 7; r++) { ctx.fillStyle = `rgba(18,48,42,${r % 2 ? .07 : .13})`; ctx.fillRect(0, sy + 18 + r * 14, W, 1); }
      for (let x = (-scroll % 14 + 14) % 14; x < W; x += 14) { ctx.fillStyle = 'rgba(18,48,42,.5)'; ctx.beginPath(); ctx.arc(x, sy + 6, 1.5, 0, 7); ctx.arc(x, sy + sh - 6, 1.5, 0, 7); ctx.fill(); }
      items.forEach((e, i) => { const x = px + 40 + i * gap - scroll, p = SK.pitchOf(e.id), y = sy + 18 + p * 14 * 1.0; if (x < -10 || x > W + 10) return; ctx.fillStyle = '#0b1f1b'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
        const passed = (px - x) / 260; if (passed > 0 && passed < 1) { ctx.globalAlpha = 1 - passed; ctx.fillStyle = '#f3ecdc'; ctx.beginPath(); ctx.ellipse(x - 4, sy - 20 - passed * 120, 5, 4, -.4, 0, 7); ctx.fill(); ctx.fillRect(x, sy - 46 - passed * 120, 1.6, 26); ctx.globalAlpha = 1; } });
      ctx.fillStyle = '#e2725b'; ctx.fillRect(px - 1, sy - 6, 2, sh + 12);
    },
    riso(ctx, W, H, ms, items) { // the poster slides out of the press: the blue pass, then the pink settles into register
      const SK = window.SuiSuiSkins, pw = Math.min(250, W - 70), ph = Math.min(H - 40, pw * 1.32), x0 = W / 2 - pw / 2, out = easeOut(clamp(ms / 1000)), y0 = 18 - (1 - out) * (ph * .4);
      const BLUE = '#2f5fb3', PINK = '#ff4fa3', reg = 5 * (1 - easeOut(clamp((ms - 1100) / 900))), d = new Date();
      ctx.globalAlpha = out;
      ctx.fillStyle = '#fbfaf6'; ctx.shadowColor = 'rgba(31,42,68,.22)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10; ctx.fillRect(x0, y0, pw, ph); ctx.shadowColor = 'transparent';
      // paper grain
      const gr = rng(4); ctx.fillStyle = 'rgba(31,42,68,.05)'; for (let k = 0; k < 160; k++) ctx.fillRect(x0 + gr() * pw, y0 + gr() * ph, 1, 1);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, pw, ph); ctx.clip(); ctx.globalCompositeOperation = 'multiply';
      // pink halftone sun in the corner
      if (ms > 700) { const a = clamp((ms - 700) / 500) * .9; for (let yy = 0; yy < 90; yy += 7) for (let xx = 0; xx < 90; xx += 7) { const dd = Math.hypot(xx - 70, yy - 18); if (dd > 64) continue; ctx.fillStyle = hex(PINK, a * .85); ctx.beginPath(); ctx.arc(x0 + pw - 90 + xx + reg, y0 + yy - reg * .6, 2.6 * (1 - dd / 70), 0, 7); ctx.fill(); } }
      // big title in two passes
      ctx.font = `900 46px ${SANS}`; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = hex(BLUE, .95); ctx.fillText('TODAY', x0 + 18, y0 + 62);
      if (ms > 900) { ctx.fillStyle = hex(PINK, .8 * clamp((ms - 900) / 400)); ctx.fillText('TODAY', x0 + 18 + 2.5 + reg, y0 + 62 - 1.5 - reg * .6); }
      ctx.font = `700 11px ${SANS}`; ctx.fillStyle = BLUE; ctx.fillText(`${items.length} THINGS DONE · 今日已印好`, x0 + 20, y0 + 82);
      // the motifs in a tidy grid
      const list = items.slice(0, 9), cols = list.length <= 4 ? 2 : 3, rows = Math.ceil(list.length / cols), gap = 10, gx = x0 + 18, gw = pw - 36, cell = Math.min((gw - gap * (cols - 1)) / cols, (ph - 140 - gap * (rows - 1)) / rows), gy = y0 + 100 + ((ph - 140) - rows * cell - (rows - 1) * gap) / 2, gxo = gx + (gw - (cols * cell + (cols - 1) * gap)) / 2;
      list.forEach((e, i) => { const m = SK.MOTIFS[SK.motifOf(e)], x = gxo + (i % cols) * (cell + gap), y = gy + Math.floor(i / cols) * (cell + gap), k = (cell - 16) / 40, line = /M20 4v6|M4 10l16|M8 32L26/.test(m.p), it = clamp((ms - 300 - i * 90) / 300); if (it <= 0) return;
        ctx.fillStyle = hex(BLUE, .07); ctx.fillRect(x, y, cell, cell);
        ctx.save(); ctx.globalAlpha = out * it; ctx.translate(x + 8, y + 8); ctx.scale(k, k);
        if (/M20 4v6/.test(m.b)) { ctx.strokeStyle = BLUE; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke(new Path2D(m.b)); } else { ctx.fillStyle = hex(BLUE, .92); ctx.fill(new Path2D(m.b)); }
        if (ms > 900) { ctx.globalAlpha = out * it * clamp((ms - 900) / 400); ctx.translate(1.6 + reg / k * .4, -1.2 - reg / k * .25); if (line) { ctx.strokeStyle = PINK; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.stroke(new Path2D(m.p)); } else { ctx.fillStyle = hex(PINK, .85); ctx.fill(new Path2D(m.p)); } }
        ctx.restore(); });
      ctx.restore();
      // footer rule, date, edition
      ctx.fillStyle = BLUE; ctx.fillRect(x0 + 18, y0 + ph - 34, pw - 36, 1.5);
      ctx.font = `800 12px ${SANS}`; ctx.fillText(`${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`, x0 + 18, y0 + ph - 16);
      ctx.textAlign = 'right'; ctx.fillStyle = PINK; ctx.fillText(`No.${String(items.length).padStart(2, '0')}`, x0 + pw - 18, y0 + ph - 16); ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
  };

  Object.assign(FINALES, {
    room(ctx, W, H, ms, items) { // the empty room, then each thing drops in, then the lamp comes on
      const SK = window.SuiSuiSkins, n = Math.min(items.length, SK.ROOM_ORDER.length), s = Math.min(1.5, (H - 30) / 224), w = 200 * s, h = 224 * s, x = (W - w) / 2, y = (H - h) / 2 - 6;
      const shell = SK.roomImg({ only: 'shell' }); if (!shell.complete) return;
      const keys = SK.ROOM_ORDER.slice(0, n); if (!keys.includes('lamp')) keys.push('lamp');
      const gap = Math.min(220, 2200 / keys.length), at = k => 500 + keys.indexOf(k) * gap, lightAt = 500 + keys.length * gap + 300;
      const t0 = easeOut(clamp(ms / 500)); ctx.globalAlpha = t0; ctx.drawImage(shell, x, y + (1 - t0) * 20, w, h); ctx.globalAlpha = 1;
      ['rug', 'window', 'picture', 'clock', 'shelf', 'desk', 'mug', 'lamp', 'chair', 'bed', 'cushion', 'books', 'plant', 'shoes'].forEach(k => { if (!keys.includes(k)) return;
        const img = SK.roomImg({ only: k, done: 1, total: 2 }); if (!img.complete) return;
        const t = clamp((ms - at(k)) / 420); if (t <= 0) return; ctx.globalAlpha = clamp(t * 3); ctx.drawImage(img, x, y - (1 - easeOutBack(t)) * 26, w, h); ctx.globalAlpha = 1; });
      const on = clamp((ms - lightAt) / 500);
      if (on > 0) { const lit = SK.roomImg({ only: 'lamp', done: 1, total: 1, lit: true }); if (lit.complete) { ctx.globalAlpha = on; ctx.drawImage(lit, x, y, w, h); ctx.globalAlpha = 1; }
        const lx = x + 153 * s, ly = y + 98 * s, g = ctx.createRadialGradient(lx, ly, 0, lx, ly, w * .7); g.addColorStop(0, `rgba(255,226,140,${.4 * on})`); g.addColorStop(1, 'rgba(255,226,140,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    },
    fluff(ctx, W, H, ms, items) { // the cat is drawn stroke by stroke, then blinks awake
      const SK = window.SuiSuiSkins, s = Math.min(1.7, (H - 40) / 172), w = 180 * s, x = (W - w) / 2, y = 8;
      const total = SK.furTotal(), p = easeInOut(clamp((ms - 200) / 2600)), n = Math.round(total * p);
      if (!this._fur || this._fur.W !== W) { const c = document.createElement('canvas'), k = s * Math.min(devicePixelRatio || 1, 2); c.width = 180 * k; c.height = 172 * k; const cx = c.getContext('2d'); cx.scale(k, k); this._fur = { c, cx, n: 0, W }; }
      const F = this._fur; if (n < F.n) { F.cx.clearRect(0, 0, 180, 172); F.n = 0; }
      if (n > F.n) { SK.furStrokes(F.cx, F.n, n); F.n = n; }
      // a soft shadow under the cat, so it sits on something
      const shy = y + 160 * s, sh = ctx.createRadialGradient(W / 2, shy, 2, W / 2, shy, w * .42); sh.addColorStop(0, `rgba(20,20,22,${.16 * p})`); sh.addColorStop(1, 'rgba(20,20,22,0)'); ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(W / 2, shy, w * .42, 10 * s, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); SK.furOutlineDraw(ctx, .42 * (1 - p)); ctx.restore();
      ctx.drawImage(F.c, x, y, w, 172 * s);
      const t = ms - 3000, open = t <= 0 ? 0 : t < 260 ? t / 260 : t < 900 ? 1 : t < 1000 ? 1 - (t - 900) / 100 : t < 1120 ? (t - 1000) / 120 : 1;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); SK.furFace(ctx, p, open); ctx.restore();
    }
  });

  function celebrate() {
    if (!isPro() || API.lockMode) return;
    const key = API.dayKey(); if (S().proCelebrated === key) return;
    S().proCelebrated = key; persist();
    const box = $('pro-celebrate'), today = todayLog(), focus = today.reduce((n, e) => n + (e.min || 0), 0), L = look();
    box.style.setProperty('--cel-bg', L.bg); box.style.setProperty('--cel-ink', L.ink); box.style.setProperty('--cel-muted', L.muted);
    const th = activeTheme(), focusText = focus ? `，专注 ${focus} 分钟` : '';
    const words = { dawn: ['杯子满了。', `今天 ${today.length} 件${focusText}，一滴不剩。`, '收好了'], day: ['今日事，今日毕。', `${today.length} 件${focusText}，这一页写完了。`, '收笔'], night: ['今天的星座，连好了。', `${today.length} 颗星${focusText}，晚安。`, '晚安'],
      bloom: ['晕好了。', `${today.length} 滴颜色${focusText}，今天这幅画干了。`, '落款'], tape: ['曲子打好了。', `${today.length} 个音${focusText}，八音盒弹给你听。`, '好听'], riso: ['印完了。', `${today.length} 张小画${focusText}，今天这张海报印好了。`, '收藏'],
      room: ['房间布置好了。', `${today.length} 件家具${focusText}，开灯，住进来吧。`, '开灯'], fluff: ['它醒了。', `${today.length} 层毛${focusText}，今天画完了。`, '摸摸它'] }[th] || ['今天的事，全部完成。', `${today.length} 件${focusText}，都收进碎片罐了。`, '收好了'];
    box.className = `pro-celebrate${th ? ` pro-cel-${th}` : ''}`;
    box.innerHTML = `<canvas id="pro-cel-canvas" aria-hidden="true"></canvas><div class="pro-cel-text"><h2>${words[0]}</h2><p>${words[1]}</p><button type="button" id="pro-cel-close">${words[2]}</button></div>`;
    box.hidden = false;
    $('pro-cel-close').addEventListener('click', closeCelebrate);
    box.addEventListener('click', e => { if (e.target === box) closeCelebrate(); });
    playSound(themeSound()); setTimeout(() => playSound(themeSound()), 260);
    const c = $('pro-cel-canvas'), W = Math.min(innerWidth, 520), H = 360, ctx = canvasFor(c, W, H), t0 = performance.now(), still = reduce();
    const finale = FINALES[th];
    // the room is drawn from pictures: wait until they are decoded, or a still (reduced-motion) frame would be empty
    const ready = th === 'room' ? (SK => SK.roomReady([SK.roomImg({ only: 'shell' }), SK.roomImg({ only: 'lamp', done: 1, total: 1, lit: true }), ...SK.ROOM_ORDER.map(k => SK.roomImg({ only: k, done: 1, total: 2 }))]))(window.SuiSuiSkins) : Promise.resolve();
    if (th === 'fluff') FINALES.fluff._fur = null;
    if (finale) {
      if (th === 'tape') window.SuiSuiSkins.playTune?.(today.map(e => e.id));
      let start = t0;
      // 1.18: the same picture, played about 1.7× faster (done in ~2 s instead of ~3.5 s), so the moment lands and gets out of the way
      const frame = now => { const ms = still ? 9000 : (now - start) * CEL_SPEED; ctx.clearRect(0, 0, W, H); finale(ctx, W, H, ms, today); if (!box.hidden && !still && ms < 5200) requestAnimationFrame(frame); };
      ready.then(() => { start = performance.now(); requestAnimationFrame(frame); });
      return;
    }
    const rain = Array.from({ length: 24 }, (_, i) => { const r = rng(i * 7 + 1); return { x: W / 2 + (r() - .5) * 120, d: r() * 520, rot: r() * 6, c: L.shards[i % L.shards.length] }; });
    const frame = now => {
      const ms = now - t0; ctx.clearRect(0, 0, W, H);
      drawJar(ctx, W / 2 - 80, 110, 160, 230, today, { per: 6, sz: 20, ms: still ? 0 : ms });
      if (!still) for (const r of rain) { const t = clamp((ms - r.d) / 620); if (t <= 0 || t >= 1) continue; const y = -20 + easeIn(t) * 270; ctx.save(); ctx.translate(r.x, y); ctx.rotate(r.rot + t * 6); ctx.globalAlpha = 1 - t * .2; ctx.fillStyle = r.c; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5, 4); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill(); ctx.restore(); }
      if (!box.hidden && !still && ms < 2600) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  function closeCelebrate() { $('pro-celebrate').hidden = true; }
  function celebrateUnlock() { API.showToast('Pro 已解锁，去“外观”或“今天”页的罐子看看'); }

