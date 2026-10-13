"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/cn";
import type { Role } from "@/types/auth";

interface NavItem {
  href: string;
  label: string;
  roles?: Role[];
  section: string;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", section: "Overview" },
  { href: "/books", label: "Books", section: "Catalog" },
  { href: "/books", label: "Manuscripts", section: "Catalog" },
  { href: "/books", label: "Production", section: "Operations" },
  { href: "/books", label: "Inventory", section: "Operations" },
  { href: "/books", label: "Sales", section: "Operations" },
  { href: "/books", label: "Finance", section: "Operations" },
  { href: "/books", label: "Royalties", section: "Operations" },
  { href: "/contributors", label: "Contributors", section: "People" },
  { href: "/users", label: "Users", section: "People", roles: ["PLATFORM_ADMIN", "ORG_ADMIN"] },
];

const SECTIONS = ["Overview", "Catalog", "Operations", "People"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visible = NAV.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return user.roles.some((r) => item.roles?.includes(r));
  });

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      <aside aria-label="Primary" className="hidden w-60 shrink-0 border-r border-slate-200 bg-slate-50 p-4 md:block">
        {SECTIONS.map((section) => {
          const items = visible.filter((v) => v.section === section);
          if (items.length === 0) return null;
          return (
            <nav key={section} aria-label={section} className="mb-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {section}
              </p>
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const active = pathname === item.href && item.label !== "Manuscripts";
                  return (
                    <li key={`${section}-${item.label}`}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-3 py-1.5 text-sm",
                          active
                            ? "bg-brand-100 font-medium text-brand-900"
                            : "text-slate-700 hover:bg-slate-200",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          );
        })}
      </aside>
      <div className="min-w-0 flex-1 p-4 md:p-6">{children}</div>
    </div>
  );
}
