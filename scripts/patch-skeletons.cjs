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
let changed = 0;
for (const f of walk('src')) {
  let c = fs.readFileSync(f, 'utf8');
  const orig = c;
  c = c.replace(/fallback=\{<Spinner[^>]*\/>\}/g, 'fallback={<PageSkeleton />}');
  if (c !== orig) {
    if (!/from ['"]@\/components\/ui\/Skeleton['"]/.test(c)) {
      c = c.replace('import { Spinner } from "@/components/ui/Spinner";', 'import { Spinner } from "@/components/ui/Spinner";\nimport { PageSkeleton } from "@/components/ui/Skeleton";');
    }
    fs.writeFileSync(f, c);
    changed++;
  }
}
console.log('changed', changed);
