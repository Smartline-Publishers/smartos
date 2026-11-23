const fs = require('fs');
const path = require('path');
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}
for (const f of walk('src')) {
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('PageSkeleton') && !/from ['"]@\/components\/ui\/Skeleton['"]/.test(c)) {
    console.log('MISSING IMPORT:', f);
  }
}
console.log('done');
