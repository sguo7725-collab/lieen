#!/usr/bin/env node
// One command for everything:  npm test
//   1. app/ is built from src/ (scripts/build-web.cjs --check)
//   2. every behaviour suite, one at a time (in parallel the animation-timing checks fail on a busy machine)
//   3. the overlap audit (穿模) on phone and iPad sizes
// It starts its own static server on a free port, so nothing needs to be running first.
//   npm test                      everything
//   npm test -- add groups        only suites whose name contains one of the words (see scripts/test-map.md)
//   SKIP_OVERLAP=1 npm test       leave out the overlap audit (it takes a few minutes)
'use strict';
const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const net = require('node:net');

const DIR = __dirname;
// name → file. Grouped by what they cover; scripts/test-map.md says which feature lives where.
const SUITES = [
  ['core', 'verify.cjs'],                     // add, complete, undo, edit, groups, pin, export, lock card
  ['completion', 'verify-completion.cjs'],    // completion order, scrolling, animation, restore
  ['beta', 'verify-beta.cjs'],                // import/merge, backup round trip, new day, repeat, history, notification
  ['v1-review', 'verify-v1.cjs'],             // edit sheet, dates/later/overdue, weekly repeats, custom groups, privacy
  ['v2-timer-review', 'verify-v2.cjs'],       // durations + timer, completion log, weekly/monthly review, poster
  ['v17-palette', 'verify-v17.cjs'],          // palette, repeat tag, date/time chips
  ['v19-looks', 'verify-v19.cjs'],            // glass/paper/night, English UI
  ['v116-motion', 'verify-v116.cjs'],         // backup nudges, add-sheet defaults, motion, icon animations
  ['v118', 'verify-v118.cjs'],
  ['layout', 'verify-layout.cjs'],            // every look × screen fits, contrast
  ['pro', 'verify-pro.cjs'],                  // themes, effects, jar, weekly art, countdown, clear moment
  ['pay', 'verify-pay.cjs'],                  // checkout against a local order server
  ['server', 'verify-server.cjs'],            // order / licence server
  ['ios-bridge', 'verify-ios-bridge.cjs'],    // the iPhone shell's bridge script
  ['android-bridge', 'verify-android-bridge.cjs'],
  ['pwa', 'verify-pwa.cjs'],                  // offline, update lifecycle (own server)
];

const freePort = () => new Promise(res => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
const run = (file, env) => new Promise(res => {
  const t = Date.now(); const out = [];
  const p = spawn(process.execPath, [path.join(DIR, file)], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  p.stdout.on('data', d => out.push(d)); p.stderr.on('data', d => out.push(d));
  p.on('close', code => res({ code, secs: Math.round((Date.now() - t) / 1000), log: Buffer.concat(out).toString() }));
});

(async () => {
  const words = process.argv.slice(2);
  const build = spawnSync(process.execPath, [path.join(DIR, 'build-web.cjs'), '--check'], { encoding: 'utf8' });
  process.stdout.write(build.stdout + build.stderr);
  if (build.status) process.exit(1);

  const port = await freePort();
  const server = spawn(process.execPath, [path.join(DIR, 'server.cjs')], { env: { ...process.env, LOCKTODO_PORT: String(port) }, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 600));
  const env = { ...process.env, LOCKTODO_URL: `http://localhost:${port}` };

  let list = SUITES;
  if (words.length) list = SUITES.filter(([n]) => words.some(w => n.includes(w)));
  const jobs = list.map(([n, f]) => [n, f, {}]);
  if (!process.env.SKIP_OVERLAP && (!words.length || words.some(w => 'overlap'.includes(w)))) jobs.push(['overlap', 'verify-overlap.cjs', { SIZES: 'phone,small,ipad,ipad-land' }]);

  const failed = [];
  for (const [name, file, extra] of jobs) {
    process.stdout.write(`${name.padEnd(16)} … `);
    const r = await run(file, { ...env, ...extra });
    console.log(r.code === 0 ? `ok (${r.secs}s)` : `FAILED (${r.secs}s)`);
    if (r.code !== 0) { failed.push(name); console.log(r.log.split('\n').filter(l => !/^\s+at /.test(l)).slice(-25).join('\n')); }
  }
  server.kill();
  console.log(failed.length ? `\n${failed.length} of ${jobs.length} failed: ${failed.join(', ')}` : `\nall ${jobs.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
