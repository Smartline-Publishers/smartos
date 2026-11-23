const fs = require('fs');
const files = [
  'src/app/(auth)/reset-password/page.tsx',
  'src/app/books/page.tsx',
  'src/app/invite/accept/page.tsx',
  'src/app/settings/page.tsx',
];
for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('from "@/components/ui/Skeleton"')) {
    // add after Spinner import if present, else append to imports
    if (c.includes('import { Spinner } from "@/components/ui/Spinner";')) {
      c = c.replace('import { Spinner } from "@/components/ui/Spinner";', 'import { Spinner } from "@/components/ui/Spinner";\nimport { PageSkeleton } from "@/components/ui/Skeleton";');
    } else {
      c = c.replace(/(import .* from "@\/components\/ui\/[^"]+";\n)/, '$1import { PageSkeleton } from "@/components/ui/Skeleton";\n');
    }
    fs.writeFileSync(f, c);
    console.log('fixed', f);
  }
}
console.log('done');
