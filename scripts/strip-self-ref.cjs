// Removes the WORKER_SELF_REFERENCE service binding that OpenNext's migrate
// step adds (referencing a non-existent "smartos-web" worker). Run this between
// `opennextjs-cloudflare build` and `wrangler deploy`.
const fs = require('fs');
const targets = ['wrangler.jsonc', '.open-next/wrangler.json'];
for (const p of targets) {
  if (!fs.existsSync(p)) continue;
  let c = fs.readFileSync(p, 'utf8');
  const before = c;
  // Remove a "services" array containing WORKER_SELF_REFERENCE.
  c = c.replace(/,?\s*"services"\s*:\s*\[[^\]]*WORKER_SELF_REFERENCE[^\]]*\]/gs, '');
  // Remove a service binding object referencing WORKER_SELF_REFERENCE / smartos-web.
  c = c.replace(/,?\s*\{[^}]*"binding"\s*:\s*"WORKER_SELF_REFERENCE"[^}]*\}/gs, '');
  c = c.replace(/,?\s*\{[^}]*"service"\s*:\s*"smartos-web"[^}]*\}/gs, '');
  if (c !== before) {
    fs.writeFileSync(p, c);
    console.log('stripped WORKER_SELF_REFERENCE binding from', p);
  }
}
console.log('done');
