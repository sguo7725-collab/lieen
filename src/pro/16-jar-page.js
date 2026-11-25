  /* ---------- The jar page ---------- */
  let jarRaf = 0, weekOffset = 0;
  function openJar() { weekOffset = 0; const s = $('pro-jar-sheet'); renderJar(); s.hidden = false; s.scrollTop = 0; document.body.classList.add('pro-open'); }
  function closeJar() { const s = $('pro-jar-sheet'); s.hidden = true; document.body.classList.remove('pro-open'); cancelAnimationFrame(jarRaf); tiltOff?.(); }
  function renderJar() {
    const s = $('pro-jar-sheet'), L = look(); s.style.setProperty('--js-bg', L.bg); s.style.setProperty('--js-ink', L.ink); s.style.setProperty('--js-muted', L.muted); s.dataset.light = LIGHT.includes(activeTheme()) ? '1' : '';
    const today = todayLog(), ws = new Date(weekStart().getTime() + weekOffset * 7 * 864e5), we = ws.getTime() + 7 * 864e5, week = logBetween(ws.getTime(), we);
    const days = Array.from({ length: 7 }, (_, d) => logBetween(ws.getTime() + d * 864e5, ws.getTime() + (d + 1) * 864e5));
    s.innerHTML = `
      <header class="pro-jar-top"><button type="button" class="pro-close" id="pro-jar-close" aria-label="关闭">${icon('x')}</button><h1>碎片罐</h1></header>
      <div class="pro-jar-big"><canvas id="pro-jar-big" aria-hidden="true"></canvas><p><b>${today.length}</b> 件今天完成${today.length ? '' : '，第一片还在路上'}</p>${today.length ? '<small>拖动罐子，或倾斜手机，碎片会滚动</small>' : ''}</div>
      <div class="pro-week-nav"><button type="button" class="icon-button" id="pro-week-prev" aria-label="上一周">${icon('chevron-left')}</button><strong>${weekOffset ? `第 ${isoWeek(ws)} 周` : '这一周'}</strong><button type="button" class="icon-button" id="pro-week-next" aria-label="下一周" ${weekOffset >= 0 ? 'disabled' : ''}>${icon('chevron-right')}</button></div>
      <div class="pro-week">${days.map((d, i) => `<span><canvas data-day-jar="${i}" aria-hidden="true"></canvas><small>周${'一二三四五六日'[i]}</small><b>${d.length}</b></span>`).join('')}</div>
      <div class="pro-art"><img id="pro-art-img" alt="本周碎片画"><button type="button" class="primary-button" id="pro-art-save">${icon('image-down')}保存这幅碎片画</button></div>`;
    API.icons(s);
    $('pro-jar-close').addEventListener('click', closeJar);
    $('pro-week-prev').addEventListener('click', () => { weekOffset--; renderJar(); });
    $('pro-week-next').addEventListener('click', () => { if (weekOffset < 0) { weekOffset++; renderJar(); } });
    s.querySelectorAll('[data-day-jar]').forEach(c => { const ctx = canvasFor(c, 34, 44); drawJar(ctx, 2, 2, 30, 40, days[Number(c.dataset.dayJar)], { per: 2, sz: 6, lid: false }); });
    let art = drawArt(week, ws, look(), 1080);
    $('pro-art-img').src = art.toDataURL('image/png');
    artFonts(look(), week).then(fresh => { if (fresh && $('pro-art-img')) { art = drawArt(week, ws, look(), 1080); $('pro-art-img').src = art.toDataURL('image/png'); } });
    $('pro-art-save').addEventListener('click', () => API.saveImage(art, `碎碎清单-第${isoWeek(ws)}周碎片画.png`));
    physicsJar($('pro-jar-big'), today, s);
  }
  /** The big jar: shards fall in one by one, pile up, and roll when the jar is dragged or the phone is tilted. */
  let tiltOff = null;
  function physicsJar(canvas, entries, sheet) {
    cancelAnimationFrame(jarRaf); tiltOff?.();
    const W = 220, H = 280, ctx = canvasFor(canvas, W, H), jx = 20, jy = 8, jw = 180, jh = 264, J = jarShape(jx, jy, jw, jh), kind = jarKind();
    const vase = false, L = look(), neckL = vase ? jx + jw * .35 : J.nx, neckR = vase ? jx + jw * .65 : J.nx + J.neck;
    const left = jx + (vase ? jw * .1 : 4), right = jx + jw - (vase ? jw * .1 : 4), bottom = jy + jh - 5, bodyTop = vase ? jy + jh * .24 : J.bodyTop + J.r * .5, R = vase ? jw * .32 : J.r;
    const queue = []; entries.forEach(e => { const r = rng(hash(`${e.id}${e.at}`)); for (let k = 0; k < 5; k++) queue.push({ s: 20 * (.85 + r() * .5), color: shardColor(e, k, L), seed: hash(`${e.id}${e.at}${k}`), rot: r() * 6.28 }); });
    queue.splice(150);
    const bodies = []; let spawnAt = 0, g = [0, 1], calm = 0, last = performance.now(), t0 = last;
    if (reduce()) { // no motion: the settled pile, drawn once
      ctx.clearRect(0, 0, W, H); drawJar(ctx, jx, jy, jw, jh, entries, { per: 5, sz: 22 }); return;
    }
    const spawn = () => { const q = queue.shift(); if (!q) return; bodies.push({ ...q, x: (neckL + neckR) / 2 + (Math.random() - .5) * 14, y: jy + jh * .08, vx: (Math.random() - .5) * 40, vy: 60, vr: (Math.random() - .5) * 6, r: q.s * .38 }); };
    const wall = b => {
      const top = b.y < bodyTop, lo = top ? neckL : left, hi = top ? neckR : right;
      if (b.x < lo + b.r) { b.x = lo + b.r; b.vx = Math.abs(b.vx) * .25; b.vr += b.vy * .004; }
      if (b.x > hi - b.r) { b.x = hi - b.r; b.vx = -Math.abs(b.vx) * .25; b.vr -= b.vy * .004; }
      if (b.y > bottom - b.r) { b.y = bottom - b.r; b.vy = -Math.abs(b.vy) * .2; b.vx *= .9; b.vr = b.vr * .8 + b.vx * .02; }
      if (b.y < jy + 6) { b.y = jy + 6; b.vy = Math.abs(b.vy) * .2; }
      for (const cx of [left + R, right - R]) { // rounded bottom corners
        const cy = bottom - R; if ((cx < (left + right) / 2 ? b.x < cx : b.x > cx) && b.y > cy) { const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy), max = R - b.r; if (d > max) { const nx = dx / d, ny = dy / d; b.x = cx + nx * max; b.y = cy + ny * max; const vn = b.vx * nx + b.vy * ny; if (vn > 0) { b.vx -= 1.25 * vn * nx; b.vy -= 1.25 * vn * ny; } } }
      }
    };
    const step = dt => {
      for (const b of bodies) { b.vx += g[0] * 1500 * dt; b.vy += g[1] * 1500 * dt; b.vx *= .998; b.vy *= .998; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vr * dt; b.vr *= .985; }
      for (let it = 0; it < 3; it++) {
        for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j], dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r, d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 === 0) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, push = (min - d) / 2;
          a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) { const imp = -1.15 * rv / 2; a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny; const tx = -ny, ty = nx, rt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty; a.vr += rt * .01; b.vr -= rt * .01; a.vx += tx * rt * .05; b.vx -= tx * rt * .05; }
        }
        bodies.forEach(wall);
      }
    };
    const frame = now => {
      if (sheet.hidden) return;
      const dt = Math.min(.033, (now - last) / 1000); last = now;
      if (queue.length && now - t0 > spawnAt) { spawn(); spawnAt += queue.length > 40 ? 45 : 90; }
      step(dt / 2); step(dt / 2);
      ctx.clearRect(0, 0, W, H);
      window.SuiSuiSkins.jar(kind, ctx, jx, jy, jw, jh, bodies, { ms: now - t0, onDark: !LIGHT.includes(kind) });
      const moving = bodies.some(b => Math.abs(b.vx) + Math.abs(b.vy) > 12);
      calm = moving || queue.length ? 0 : calm + dt;
      jarRaf = requestAnimationFrame(frame);
    };
    jarRaf = requestAnimationFrame(frame);
    // Drag to shake; tilt to pour
    let drag = null;
    canvas.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture?.(e.pointerId); };
    canvas.onpointermove = e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY }; bodies.forEach(b => { b.vx += dx * 14; b.vy += dy * 14; b.vr += dx * .05; }); };
    canvas.onpointerup = canvas.onpointercancel = () => { drag = null; };
    const tilt = e => { if (e.gamma == null) return; const gx = Math.sin((e.gamma || 0) * Math.PI / 180), gy = Math.max(.25, Math.cos((e.gamma || 0) * Math.PI / 180) * Math.sign(Math.cos(((e.beta ?? 90) - 0) * Math.PI / 180) || 1)); const n = Math.hypot(gx, gy) || 1; g = [gx / n, gy / n]; };
    addEventListener('deviceorientation', tilt); tiltOff = () => removeEventListener('deviceorientation', tilt);
    const ask = window.DeviceOrientationEvent?.requestPermission; if (ask) canvas.addEventListener('click', () => ask().catch(() => {}), { once: true });
  }
  function drawMiniJar(bump) {
    const c = $('pro-jar-mini'); if (!c) return;
    const ctx = canvasFor(c, 30, 38); ctx.clearRect(0, 0, 30, 38);
    drawJar(ctx, 2, 1, 26, 36, todayLog(), { per: 2, sz: 5, dark: pageDark() });
    $('pro-jar-lock').hidden = isPro();
    if (bump && !reduce()) $('pro-jar-button').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16) rotate(-4deg)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.34,1.56,.64,1)' });
  }
  function flyToJar(rect) {
    const jar = $('pro-jar-button'); if (!jar || reduce()) { drawMiniJar(false); return; }
    const j = jar.getBoundingClientRect(); if (!j.width || j.bottom < 0 || j.top > innerHeight) { drawMiniJar(false); return; }
    const L = look(), from = { x: rect.left + rect.width * .35, y: rect.top + rect.height / 2 }, to = { x: j.left + j.width / 2, y: j.top + j.height * .45 };
    const bits = Array.from({ length: 7 }, (_, i) => ({ d: i * 45, dx: (rng(i + 5)() - .5) * 60, c: L.shards[i % L.shards.length] }));
    overlay(900, (ctx, ms) => {
      for (const b of bits) {
        const t = clamp((ms - b.d) / 620); if (t <= 0 || t >= 1) continue;
        const e = easeOut(t), x = from.x + b.dx * (1 - e) + (to.x - from.x) * e, y = from.y + (to.y - from.y) * e - Math.sin(t * Math.PI) * 70;
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 5); ctx.globalAlpha = 1 - t * .3; ctx.fillStyle = b.c; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(4, 3); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill(); ctx.restore();
      }
    }, 0);
    setTimeout(() => drawMiniJar(true), 640);
  }

  /** The task's pieces fly from its row into the theme's picture of today, and land at `to`.
      晨: droplets fall into the glass. 昼: a drop of red ink arcs to the character's cell. 晕: a drop of ink falls into the water. 乐: a paper dot to its column. 印: pink and blue ink dots. 夜: a spark with a tail flies up to its star. Resolves when they land. */
  function flyToHead(rect, to, theme) {
    const from = { x: rect.left + Math.min(rect.width * .3, 120), y: rect.top + rect.height / 2 }, dur = theme === 'night' ? 520 : 480; // 精致利落: a quick, low arc
    const lift = Math.min(110, Math.max(50, Math.abs(from.y - to.y) * .28));
    const path = (t, dx = 0, lag = 0) => { const e = easeInOut(clamp(t)), x = from.x + dx * (1 - e) + (to.x - from.x) * e, y = from.y + (to.y - from.y) * e - Math.sin(clamp(t) * Math.PI) * (lift + lag); return { x, y }; };
    let draw;
    if (theme === 'dawn') {
      const drops = Array.from({ length: 5 }, (_, i) => { const r = rng(i * 7 + 3); return { d: i * 26, dx: (r() - .5) * 90, s: 2.6 + r() * 2.8, lag: r() * 30, c: ['#a99fff', '#86dcc6', '#ffb99b'][i % 3] }; });
      draw = (ctx, ms) => drops.forEach(b => {
        const t = (ms - b.d) / dur; if (t <= 0 || t >= 1) return; const p = path(t, b.dx, b.lag);
        const g = ctx.createRadialGradient(p.x - b.s * .35, p.y - b.s * .4, 0, p.x, p.y, b.s); g.addColorStop(0, '#fff'); g.addColorStop(.45, b.c); g.addColorStop(1, hex(b.c, .55));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, b.s, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = .8; ctx.stroke();
      });
    } else if (theme === 'day') {
      draw = (ctx, ms) => { for (let k = 14; k >= 0; k--) { const t = (ms - k * 9) / dur; if (t <= 0 || t >= 1) continue; const p = path(t); ctx.globalAlpha = (1 - k / 15) * .9; ctx.fillStyle = '#b43a2c'; ctx.beginPath(); ctx.arc(p.x, p.y, 4.2 * (1 - k / 18), 0, 7); ctx.fill(); } ctx.globalAlpha = 1; };
    } else if (theme === 'bloom') {
      const col = window.SuiSuiSkins?.PIGMENTS?.[0]?.[1] || '#3b5a87';
      draw = (ctx, ms) => { const t = ms / dur; if (t >= 1) return; const p = path(t), q = path(Math.max(0, t - .04)), a = Math.atan2(p.y - q.y, p.x - q.x) - Math.PI / 2, s = 5;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a); ctx.fillStyle = 'rgba(43,43,46,.85)'; ctx.beginPath(); ctx.moveTo(0, -s * 1.9); ctx.bezierCurveTo(s * .9, -s * .5, s, s * .6, 0, s); ctx.bezierCurveTo(-s, s * .6, -s * .9, -s * .5, 0, -s * 1.9); ctx.fill(); ctx.restore(); void col; };
    } else if (theme === 'tape') {
      draw = (ctx, ms) => { for (let k = 10; k >= 0; k--) { const t = (ms - k * 10) / dur; if (t <= 0 || t >= 1) continue; const p = path(t); ctx.fillStyle = `rgba(243,236,220,${(1 - k / 11) * .9})`; ctx.beginPath(); ctx.arc(p.x, p.y, 4.6 * (1 - k / 14), 0, 7); ctx.fill(); } };
    } else if (theme === 'riso') {
      const dots = Array.from({ length: 8 }, (_, i) => { const r = rng(i * 17 + 3); return { d: i * 18, dx: (r() - .5) * 110, s: 2.4 + r() * 3, lag: r() * 40, c: i % 2 ? 'rgba(255,79,163,.85)' : 'rgba(47,95,179,.85)' }; });
      draw = (ctx, ms) => { ctx.globalCompositeOperation = 'multiply'; dots.forEach(b => { const t = (ms - b.d) / dur; if (t <= 0 || t >= 1) return; const p = path(t, b.dx, b.lag); ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(p.x, p.y, b.s, 0, 7); ctx.fill(); }); ctx.globalCompositeOperation = 'source-over'; };
    } else if (theme === 'room') { // a little box tumbles into the room
      draw = (ctx, ms) => { const t = ms / dur; if (t >= 1) return; const p = path(t), a = t * Math.PI * 1.5, s = 7;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a * .3); ctx.lineJoin = 'round'; ctx.lineWidth = 1.1; ctx.strokeStyle = '#2c3a20';
        [[[0, -s], [s * .87, -s / 2], [0, 0], [-s * .87, -s / 2], '#f1d55a'], [[-s * .87, -s / 2], [0, 0], [0, s], [-s * .87, s / 2], '#c99a52'], [[0, 0], [s * .87, -s / 2], [s * .87, s / 2], [0, s], '#a87a3a']].forEach(f => { ctx.beginPath(); f.slice(0, 4).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = f[4]; ctx.fill(); ctx.stroke(); });
        ctx.restore(); };
    } else if (theme === 'fluff') { // a few loose hairs drift over
      const hairs = Array.from({ length: 7 }, (_, i) => { const r = rng(i * 13 + 5); return { d: i * 15, dx: (r() - .5) * 70, lag: r() * 30, a: r() * 6, l: 6 + r() * 7 }; });
      draw = (ctx, ms) => hairs.forEach(h => { const t = (ms - h.d) / dur; if (t <= 0 || t >= 1) return; const p = path(t, h.dx, h.lag), a = h.a + t * 4;
        ctx.strokeStyle = 'rgba(20,20,22,.85)'; ctx.lineWidth = .9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x + Math.cos(a + .6) * h.l * .6, p.y + Math.sin(a + .6) * h.l * .6, p.x + Math.cos(a) * h.l, p.y + Math.sin(a) * h.l); ctx.stroke(); });
    } else {
      draw = (ctx, ms) => {
        const t = ms / dur; if (t >= 1) return;
        for (let k = 22; k >= 1; k--) { const q = path(t - k * .012); if (t - k * .012 <= 0) continue; ctx.fillStyle = `rgba(201,214,255,${(1 - k / 23) * .5})`; ctx.beginPath(); ctx.arc(q.x, q.y, 2.6 * (1 - k / 26), 0, 7); ctx.fill(); }
        const p = path(t); const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 14); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(201,214,255,.8)'); g.addColorStop(1, 'rgba(159,180,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, 7); ctx.fill();
      };
    }
    const span = theme === 'dawn' ? dur + 5 * 26 : theme === 'riso' ? dur + 8 * 18 : theme === 'fluff' ? dur + 7 * 15 : dur + 100;
    const landAt = ['dawn', 'riso', 'fluff'].includes(theme) ? dur + 40 : dur;
    setTimeout(() => land(to, theme), landAt - 30);
    return overlay(span, draw, landAt);
  }

