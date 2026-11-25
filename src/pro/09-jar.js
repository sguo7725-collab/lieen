  /* ---------- 碎片罐: today's completions as shards in a glass jar ---------- */
  function jarShape(x, y, w, h) {
    const neck = w * .44, nx = x + (w - neck) / 2, bodyTop = y + h * .2, r = w * .24;
    return { x, y, w, h, nx, neck, bodyTop, r, path(ctx) {
      ctx.beginPath(); ctx.moveTo(nx, y + h * .06); ctx.lineTo(nx, y + h * .14);
      ctx.quadraticCurveTo(nx, bodyTop, x + r * .5, bodyTop + r * .15); ctx.quadraticCurveTo(x, bodyTop + r * .4, x, bodyTop + r);
      ctx.lineTo(x, y + h - r); ctx.quadraticCurveTo(x, y + h, x + r, y + h); ctx.lineTo(x + w - r, y + h); ctx.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
      ctx.lineTo(x + w, bodyTop + r); ctx.quadraticCurveTo(x + w, bodyTop + r * .4, x + w - r * .5, bodyTop + r * .15); ctx.quadraticCurveTo(nx + neck, bodyTop, nx + neck, y + h * .14);
      ctx.lineTo(nx + neck, y + h * .06); ctx.closePath();
    } };
  }
  /** Lays the shards in a pile, deterministically: the same day always looks the same. */
  function pile(entries, J, per, sz, colorOf = shardColor) {
    const cols = Math.max(4, Math.round(J.w / (sz * .95))), cw = (J.w - sz * .6) / cols, level = new Array(cols).fill(0), out = [];
    let full = false;
    entries.forEach(e => {
      const r = rng(hash(`${e.id}${e.at}`));
      for (let k = 0; k < per; k++) {
        const a = Math.floor(r() * cols), b = Math.floor(r() * cols), col = level[a] <= level[b] ? a : b;
        const x = J.x + sz * .3 + (col + .5) * cw + (r() - .5) * cw * .7, y = J.y + J.h - sz * .55 - level[col] * sz * .5 - r() * sz * .15;
        if (y < J.bodyTop + sz * .9) { full = true; continue; }
        level[col] += 1;
        out.push({ x, y, rot: r() * 6.28, s: sz * (.9 + r() * .5), color: colorOf(e, k), seed: hash(`${e.id}${e.at}${k}`) });
      }
    });
    return { shards: out, full };
  }
  const pageDark = () => { const t = activeTheme(), st = document.documentElement.dataset.style; return t ? t !== 'ink' : st === 'night' || (st === 'glass' && matchMedia('(prefers-color-scheme: dark)').matches); };
  const jarKind = () => activeTheme() || 'plain';
  function drawJar(ctx, x, y, w, h, entries, { per = 4, sz = w / 7, ms = 0, lid = true, dark } = {}) {
    const kind = jarKind(), J = jarShape(x, y, w, h), onDark = dark ?? !LIGHT.includes(kind);
    const { shards } = pile(entries, J, per, sz);
    window.SuiSuiSkins.jar(kind, ctx, x, y, w, h, shards, { ms, lid, onDark });
    return shards.length;
  }

