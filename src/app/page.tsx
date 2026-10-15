import Link from "next/link";
import { Card } from "@/components/ui/Card";

const MODULES = [
  { href: "/dashboard", title: "Dashboard", desc: "Org overview and pending work." },
  { href: "/books", title: "Books", desc: "Catalog, status and detail." },
  { href: "/contributors", title: "Contributors", desc: "Authors, editors and shares." },
  { href: "/users", title: "Users", desc: "Admin and roles." },
];

export default function Home() {
  return (
    <section aria-labelledby="home-title" className="flex flex-col gap-4">
      <h1 id="home-title" className="text-2xl font-bold text-ink dark:text-neutral-100">
        Welcome to SmartOs
      </h1>
      <p className="text-slate-600 dark:text-neutral-400">Pick a module to get started.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <Card key={m.href + m.title} title={m.title}>
            <p className="mb-3 text-sm text-slate-600 dark:text-neutral-400">{m.desc}</p>
            <Link href={m.href} className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
              Open {m.title} →
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
