#!/usr/bin/env node
// Builds the web app's two big scripts from their feature files, and stamps the offline cache version.
//
//   src/app/_open.js + src/app/NN-*.js (in name order) + "})();\n"  ->  app/app.js
//   src/pro/_open.js + src/pro/NN-*.js (in name order) + "})();\n"  ->  app/pro.js
//   app/sw.js: const VERSION = 'web-<hash of every other file under app/>'
//
// The phone apps and the website still load app/app.js and app/pro.js exactly as before: the feature
// files are only where you edit. All parts of one bundle share one function scope (that is what lets
// them keep sharing `state`, `render()` …), so a part may use anything an earlier part declares.
//
//   node scripts/build-web.cjs           write the files
//   node scripts/build-web.cjs --check   change nothing; exit 1 if app/ is out of date (CI runs this)
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(ROOT, 'app');
const BUNDLES = ['app', 'pro'];
const CLOSE = '})();\n';
const check = process.argv.includes('--check');

function bundle(name) {
  const dir = path.join(ROOT, 'src', name);
  const parts = fs.readdirSync(dir).filter(f => /^\d\d-[\w-]+\.js$/.test(f)).sort();
  if (!parts.length) throw new Error(`no parts in src/${name}`);
  return fs.readFileSync(path.join(dir, '_open.js'), 'utf8') + parts.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('') + CLOSE;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// the cache version changes exactly when something the worker could serve changes
function swVersion(files) {
  const h = crypto.createHash('sha256');
  for (const p of walk(APP).filter(p => path.basename(p) !== 'sw.js').sort()) {
    const rel = path.relative(APP, p).split(path.sep).join('/');
    h.update(rel + '\0'); h.update(files[rel] ?? fs.readFileSync(p)); h.update('\0');
  }
  return 'web-' + h.digest('hex').slice(0, 12);
}

const next = {};
for (const b of BUNDLES) next[`${b}.js`] = bundle(b);
const sw = fs.readFileSync(path.join(APP, 'sw.js'), 'utf8');
if (!/const VERSION = '[^']*';/.test(sw)) throw new Error('app/sw.js: VERSION line not found');
next['sw.js'] = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${swVersion(next)}';`);

const stale = Object.keys(next).filter(f => fs.readFileSync(path.join(APP, f), 'utf8') !== next[f]);
if (check) {
  if (stale.length) { console.error(`app/ is out of date: ${stale.join(', ')}. Run: node scripts/build-web.cjs`); process.exit(1); }
  console.log('app/ is up to date');
} else {
  for (const f of stale) fs.writeFileSync(path.join(APP, f), next[f]);
  console.log(stale.length ? `wrote ${stale.map(f => 'app/' + f).join(', ')}` : 'app/ already up to date');
}
