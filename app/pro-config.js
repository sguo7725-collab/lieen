/* 碎碎清单 Pro build switch.
   As committed (no server): Pro cannot be bought or redeemed yet — the Pro page says it opens soon; only the free trial
     works. No build is ever free for everyone.
   Release builds: the packaging workflows write this file from the repository variables PRO_SERVER and PRO_PUBLIC_KEY
     (scripts/write-pro-config.cjs), e.g. { server: 'https://suisuiqingdan.com', publicKey: { kty: 'EC', crv: 'P-256', x, y } }.
     Then each phone needs its own licence, signed by that server for that phone: buying once, or a redeem code
     (a code works on as many phones as the admin page allows). A copied APK/IPA carries no licence.
   Tests set window.SUISUI_PRO_CONFIG themselves before this file runs (freeForTesters / simulate are test-only). */
window.SUISUI_PRO_CONFIG = window.SUISUI_PRO_CONFIG || {};
