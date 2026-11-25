  /* ---------- Completion effects (replace the free shatter) ---------- */
  function chosenEffect() {
    if (demoEffect) return demoEffect;
    if (!isPro() && !tryOn) return '';
    const e = S().proEffect || 'auto';
    return e === 'auto' ? (THEMES[activeTheme()]?.effect || 'shards') : e;
  }
  let demoEffect = '';
  function sampleText(textNode, step) {
    const r = textNode.getBoundingClientRect(), cs = getComputedStyle(textNode);
    const w = Math.ceil(r.width) + 8, h = Math.ceil(r.height) + 8, c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d'), text = textNode.textContent.trim(), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.35;
    x.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; x.fillStyle = cs.color; x.textBaseline = 'middle';
    const lines = []; let cur = '';
    for (const ch of text) { if (x.measureText(cur + ch).width > r.width + 1 && cur) { lines.push(cur); cur = ch; } else cur += ch; }
    if (cur) lines.push(cur);
    const top = (h - lines.length * lh) / 2;
    lines.forEach((l, i) => x.fillText(l, 4, top + lh * (i + .5)));
    const data = x.getImageData(0, 0, w, h).data, pts = [];
    for (let y = 0; y < h; y += step) for (let xx = 0; xx < w; xx += step) if (data[(y * w + xx) * 4 + 3] > 110) pts.push({ x: r.left - 4 + xx, y: r.top - 4 + y });
    return { pts, image: c, left: r.left - 4, top: r.top - 4, w, h, color: cs.color, rect: r };
  }
  function overlay(duration, draw, resolveAt = 280) {
    return new Promise(resolve => {
      const c = document.createElement('canvas'); c.className = 'pro-fx';
      const ctx = canvasFor(c, innerWidth, innerHeight, 1.5); document.body.append(c); // full-screen and redrawn every frame: 1.5x keeps the upload light on phones
      const t0 = performance.now();
      const tick = now => { const ms = now - t0; ctx.clearRect(0, 0, innerWidth, innerHeight); draw(ctx, ms); if (ms < duration) requestAnimationFrame(tick); else c.remove(); };
      requestAnimationFrame(tick); setTimeout(resolve, resolveAt);
    });
  }
  const LIGHT = ['dawn', 'day', 'bloom', 'riso', 'room', 'fluff'];
  const dark = () => !LIGHT.includes(activeTheme());
  const FX = {
    /** 碎裂, in the theme's material: glass flies apart, paper scraps flutter down, gold leaf falls, light drifts up. */
    shards(src, s) {
      const L = look(), mat = { bloom: 'paper', tape: 'paper', riso: 'paper', room: 'paper', fluff: 'paper' }[L.material] || L.material || 'glass', cols = Math.max(4, Math.round(s.w / 24)), rows = 2, cw = s.w / cols, ch = s.h / rows, pieces = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) for (let t = 0; t < 2; t++) {
        const x0 = s.left + x * cw, y0 = s.top + y * ch, pts = t ? [[x0 + cw, y0], [x0 + cw, y0 + ch], [x0, y0 + ch]] : [[x0, y0], [x0 + cw, y0], [x0, y0 + ch]];
        const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3, r = rng(x * 31 + y * 7 + t * 3 + 1), spread = x / Math.max(1, cols - 1) - .5;
        const v = mat === 'paper' ? { vx: spread * 70 + (r() - .5) * 40, vy: -24 - r() * 30, g: 300, spin: (r() - .5) * 3.4, sway: 12 + r() * 16 }
          : mat === 'gold' ? { vx: spread * 44 + (r() - .5) * 30, vy: -14 - r() * 20, g: 190, spin: (r() - .5) * 2.6, sway: 9 + r() * 12 }
          : mat === 'light' ? { vx: spread * 60 + (r() - .5) * 30, vy: -40 - r() * 60, g: -8, spin: (r() - .5) * 2, sway: 0 }
          : { vx: spread * (150 + r() * 90), vy: (y - .5) * 50 - 40 - r() * 50, g: 130, spin: (r() - .5) * 5, sway: 0 };
        pieces.push({ pts, cx, cy, ...v, d: Math.abs(spread) * 60 + r() * 40, c: L.shards[(x + y + t) % L.shards.length] });
      }
      const dur = mat === 'paper' || mat === 'gold' ? 820 : 680; // 精致利落: short and quiet
      return overlay(dur, (ctx, ms) => {
        for (const p of pieces) {
          const tt = Math.max(0, (ms - p.d) / 1000), life = clamp((ms - p.d) / (dur - p.d)), a = 1 - life * life;
          if (a <= 0) continue;
          const dx = p.vx * tt + Math.sin(tt * 6 + p.cx) * p.sway * tt, dy = p.vy * tt + .5 * p.g * tt * tt;
          ctx.save(); ctx.globalAlpha = a; ctx.translate(p.cx + dx, p.cy + dy); ctx.rotate(p.spin * tt); ctx.translate(-p.cx, -p.cy);
          ctx.beginPath(); ctx.moveTo(...p.pts[0]); ctx.lineTo(...p.pts[1]); ctx.lineTo(...p.pts[2]); ctx.closePath();
          if (mat === 'paper') { ctx.shadowColor = 'rgba(60,40,20,.2)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2; ctx.fillStyle = L.chip || '#fbf8f1'; ctx.fill(); ctx.shadowColor = 'transparent'; }
          else if (mat === 'gold') { const g = ctx.createLinearGradient(p.pts[0][0], p.pts[0][1], p.pts[1][0], p.pts[2][1]); g.addColorStop(0, '#9c7f47'); g.addColorStop(.5, '#f4e8cc'); g.addColorStop(1, '#c8a66a'); ctx.fillStyle = g; ctx.globalAlpha = a * .8; ctx.fill(); ctx.globalAlpha = a; }
          else if (mat === 'glass') { ctx.fillStyle = hex(p.c, .2); ctx.fill(); }
          else if (mat === 'plain') { ctx.fillStyle = 'rgba(160,200,255,.22)'; ctx.fill(); }
          ctx.save(); ctx.clip(); if (mat === 'light') ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(s.image, s.left, s.top); ctx.restore();
          if (mat === 'light') { ctx.shadowColor = p.c; ctx.shadowBlur = 8; }
          ctx.strokeStyle = mat === 'paper' ? 'rgba(29,26,22,.14)' : mat === 'gold' ? 'rgba(255,240,210,.75)' : mat === 'light' ? hex(p.c, .85) : 'rgba(255,255,255,.8)';
          ctx.lineWidth = mat === 'light' ? 1 : .8; ctx.stroke(); ctx.restore();
        }
      });
    },
    stardust(src, s) {
      const L = look(), parts = s.pts.slice(0, 450).map((p, i) => { const r = rng(i * 977 + 13); return { ...p, vx: (r() - .35) * 46, vy: -(28 + r() * 90), size: 1 + r() * 1.8, c: L.shards[i % L.shards.length], ph: r() * 6, d: (p.x - s.left) / s.w * 260 }; });
      return overlay(820, (ctx, ms) => {
        const sweep = s.left + (ms / 200) * s.w;
        ctx.save(); ctx.beginPath(); ctx.rect(sweep, s.top, s.w + 40, s.h); ctx.clip(); ctx.drawImage(s.image, s.left, s.top); ctx.restore();
        ctx.globalCompositeOperation = dark() ? 'lighter' : 'source-over';
        for (const p of parts) {
          const t = clamp((ms - p.d) / 600); if (t <= 0) continue;
          const e = easeOut(t), a = (1 - t) * (.6 + .4 * Math.sin(p.ph + ms / 60));
          ctx.fillStyle = hex(p.c, clamp(a)); ctx.beginPath(); ctx.arc(p.x + p.vx * e, p.y + p.vy * e, p.size * (1 + .6 * (1 - t)), 0, 7); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
      });
    },
    dots(src, s) {
      const parts = s.pts.map((p, i) => { const r = rng(i * 31 + 7); return { ...p, d: (p.x - s.left) / s.w * 200 + r() * 80, vy: -(8 + r() * 26), vx: (r() - .5) * 16, red: false }; });
      return overlay(720, (ctx, ms) => {
        for (const p of parts) {
          const t = clamp((ms - p.d) / 400), sc = t <= 0 ? 1 : 1 - easeOut(t);
          if (sc <= .02) continue; ctx.fillStyle = p.red ? '#d71921' : s.color;
          ctx.beginPath(); ctx.arc(p.x + p.vx * easeOut(t), p.y + p.vy * easeOut(t), 1.7 * sc + (t > 0 ? .4 : 0), 0, 7); ctx.fill();
        }
      });
    },
    gold(src, s) {
      const parts = s.pts.filter((_, i) => i % 3 === 0).map((p, i) => { const r = rng(i * 13 + 5); return { ...p, d: r() * 260, sway: 8 + r() * 18, ph: r() * 6, sz: 2 + r() * 3.5, spin: (r() - .5) * 8, fall: 60 + r() * 90, c: ['#c8a66a', '#e8d3a4', '#f4e8cc', '#9c7f47'][i % 4] }; });
      return overlay(950, (ctx, ms) => {
        ctx.globalAlpha = clamp(1 - ms / 260); ctx.drawImage(s.image, s.left, s.top); ctx.globalAlpha = 1;
        for (const p of parts) {
          const t = clamp((ms - p.d) / 740); if (t <= 0 || t >= 1) continue;
          const x = p.x + Math.sin(p.ph + t * 5) * p.sway * t, y = p.y + p.fall * t * t + t * 10, a = t < .15 ? t / .15 : 1 - (t - .15) / .85;
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.spin * t); ctx.scale(1, Math.abs(Math.cos(p.ph + t * 7)) * .8 + .2); ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.fillRect(-p.sz / 2, -p.sz / 2, p.sz, p.sz * .7); ctx.restore();
        }
        ctx.globalAlpha = 1;
      });
    },
    ink(src, s) {
      const r = rng(hash(src.textContent || 'x')), blots = Array.from({ length: 7 }, (_, i) => ({ x: s.left + s.w * (.08 + i / 7.4) + (r() - .5) * 10, y: s.top + s.h / 2 + (r() - .5) * s.h * .4, R: 14 + r() * 20, d: i * 40 }));
      const dots = Array.from({ length: 14 }, () => ({ x: s.left + r() * s.w, y: s.top + s.h / 2 + (r() - .5) * s.h * 1.8, R: 1 + r() * 2.6, d: 120 + r() * 200 }));
      const seal = { x: Math.min(innerWidth - 46, s.rect.right + 18), y: s.top + s.h / 2 };
      return overlay(880, (ctx, ms) => {
        const fade = clamp(1 - (ms - 520) / 360);
        ctx.globalAlpha = clamp(1 - (ms - 80) / 320) ; ctx.drawImage(s.image, s.left, s.top); ctx.globalAlpha = 1;
        ctx.filter = 'blur(2.5px)';
        for (const b of [...blots, ...dots]) {
          const t = clamp((ms - b.d) / 380); if (t <= 0) continue;
          const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.R * easeOut(t) + .1);
          g.addColorStop(0, `rgba(29,26,22,${.62 * fade})`); g.addColorStop(.7, `rgba(29,26,22,${.38 * fade})`); g.addColorStop(1, 'rgba(29,26,22,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.R * easeOut(t) + .1, 0, 7); ctx.fill();
        }
        ctx.filter = 'none';
        const st = clamp((ms - 200) / 180); if (st > 0) {
          const k = 1.5 - .5 * easeOut(st); ctx.save(); ctx.translate(seal.x, seal.y); ctx.scale(k, k); ctx.globalAlpha = clamp(st * 1.4) * fade;
          ctx.fillStyle = '#b43a2c'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
        }
      });
    },
    plane(src, s) {
      const P = { x: s.left + 10, y: s.top + s.h / 2 }, end = { x: innerWidth + 60, y: Math.max(-40, s.top - 260) };
      const c1 = { x: P.x + 120, y: P.y + 40 }, c2 = { x: innerWidth * .7, y: P.y - 60 };
      const at = t => { const u = 1 - t; return { x: u * u * u * P.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * end.x, y: u * u * u * P.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * end.y }; };
      const parts = s.pts.filter((_, i) => i % 2 === 0).map((p, i) => ({ ...p, d: rng(i + 9)() * 120 }));
      const L = look(), stroke = L === PLAIN ? '#7fb2ff' : L.accent;
      return overlay(950, (ctx, ms) => {
        ctx.fillStyle = s.color;
        for (const p of parts) { const t = easeIn(clamp((ms - p.d) / 220)); if (t >= 1) continue; ctx.globalAlpha = 1 - t * .6; ctx.fillRect(p.x + (P.x - p.x) * t, p.y + (P.y - p.y) * t, 1.6, 1.6); }
        ctx.globalAlpha = 1;
        const ft = clamp((ms - 220) / 700); if (ft <= 0) return;
        const e = easeIn(ft) * .85 + ft * .15, pos = at(e), nxt = at(Math.min(1, e + .02)), ang = Math.atan2(nxt.y - pos.y, nxt.x - pos.x);
        ctx.setLineDash([3, 6]); ctx.strokeStyle = hex(stroke.length === 7 ? stroke : '#7fb2ff', .35); ctx.lineWidth = 1.2; ctx.beginPath();
        for (let k = 0; k <= 24; k++) { const q = at(e * k / 24); k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.stroke(); ctx.setLineDash([]);
        ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(ang); const k = 1 + .25 * Math.sin(ft * 3);
        ctx.scale(k, k); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = stroke; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-12, -10); ctx.lineTo(-6, 0); ctx.lineTo(-12, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-6, 0); ctx.stroke(); ctx.restore();
      });
    }
  };
  function effect(source, textNode) {
    const id = chosenEffect();
    if (!id || !FX[id]) return null;
    try { const s = sampleText(textNode, id === 'dots' ? 4 : id === 'stardust' ? 2 : id === 'shards' ? 6 : 3); return FX[id](source, s); } catch { return null; }
  }

  /** 外观 → 完成动效: play an effect on the sample row so the choice is seen, not guessed. */
  let previewing = false;
  async function previewEffect(pick) {
    const row = $('fx-sample'), text = $('fx-sample-text'); if (!row || !text || previewing) return;
    const id = pick === 'auto' ? (THEMES[activeTheme()]?.effect || 'shards') : pick;
    const still = reduce() || !S().motion;
    previewing = true; row.classList.remove('is-done', 'is-back'); void row.offsetWidth; row.classList.add('is-done');
    if (!still && FX[id]) {
      try { const smp = sampleText(text, id === 'dots' ? 4 : id === 'stardust' ? 2 : id === 'shards' ? 6 : 3); text.style.visibility = 'hidden'; await FX[id](row, smp); } catch { /* preview only */ }
      await new Promise(r => setTimeout(r, 420));
    } else await new Promise(r => setTimeout(r, 700));
    text.style.visibility = ''; row.classList.remove('is-done'); row.classList.add('is-back'); previewing = false;
  }

