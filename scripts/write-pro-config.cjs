#!/usr/bin/env node
// Writes app/pro-config.js for a release build from the repository variables PRO_SERVER and PRO_PUBLIC_KEY,
// then restamps the cache version (scripts/build-web.cjs). Without both, it leaves the committed file alone:
// that build has Pro 未开放 (nothing can unlock it). It never writes a free-for-everyone build.
//   PRO_SERVER=https://suisuiqingdan.com PRO_PUBLIC_KEY='{"kty":"EC","crv":"P-256","x":"…","y":"…"}' node scripts/write-pro-config.cjs
// PRO_PUBLIC_KEY is the public key shown in the admin page (设置 → 接到 App 上). It is public; the private key stays on the server.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const server = (process.env.PRO_SERVER || '').trim().replace(/\/$/, '');
const raw = (process.env.PRO_PUBLIC_KEY || '').trim();
if (!server || !raw) { console.log('PRO_SERVER / PRO_PUBLIC_KEY not set: Pro stays 未开放 in this build.'); process.exit(0); }
if (!/^https:\/\/[\w.-]+(:\d+)?$/.test(server)) { console.error(`PRO_SERVER must be an https:// address, got ${server}`); process.exit(1); }
let key;
try { key = JSON.parse(raw); } catch { console.error('PRO_PUBLIC_KEY is not JSON'); process.exit(1); }
if (key.kty !== 'EC' || key.crv !== 'P-256' || !key.x || !key.y || key.d) { console.error('PRO_PUBLIC_KEY must be the P-256 PUBLIC key {kty, crv, x, y} — never the private key (d)'); process.exit(1); }

const out = `/* 碎碎清单 Pro — release build, written by scripts/write-pro-config.cjs. Each phone needs its own licence. */
window.SUISUI_PRO_CONFIG = window.SUISUI_PRO_CONFIG || ${JSON.stringify({ server, publicKey: { kty: 'EC', crv: 'P-256', x: key.x, y: key.y } })};
`;
fs.writeFileSync(path.join(__dirname, '..', 'app', 'pro-config.js'), out);
execFileSync(process.execPath, [path.join(__dirname, 'build-web.cjs')], { stdio: 'inherit' });
console.log(`Pro server for this build: ${server}`);
