"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/cn";
import { Book, BookOpen, ListChecks, Printer, ShieldCheck, SquaresFour, Users, Warehouse, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { Role } from "@/types/auth";

interface NavItem {
  href: string;
  label: string;
  icon: PhosphorIcon;
  roles?: Role[];
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: SquaresFour }],
  },
  {
    section: "Catalog",
    items: [
      { href: "/books", label: "Books", icon: Book },
      { href: "/manuscripts", label: "Manuscripts", icon: BookOpen },
      { href: "/contributors", label: "Contributors", icon: Users },
    ],
  },
  {
    section: "Operations",
    items: [
      { href: "/tasks", label: "Tasks", icon: ListChecks },
      { href: "/production", label: "Production", icon: Printer },
      { href: "/inventory", label: "Inventory", icon: Warehouse },
    ],
  },
  {
    section: "People",
    items: [
      {
        href: "/users",
        label: "Users",
        icon: ShieldCheck,
        roles: ["PLATFORM_ADMIN", "ORG_ADMIN"],
      },
    ],
  },
];

function isVisible(item: NavItem, roles: Role[] | undefined): boolean {
  if (!item.roles) return true;
  if (!roles) return false;
  return roles.some((r) => item.roles?.includes(r));
}

function NavList({ items, orientation }: { items: NavItem[]; orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <ul
      className={cn(
        orientation === "vertical" ? "flex flex-col gap-0.5" : "flex gap-1 overflow-x-auto",
      )}
    >
      {items
        .filter((item) => isVisible(item, user?.roles))
        .map((item) => {
          const active = pathname === item.href;
          const ItemIcon = item.icon;
          return (
            <li key={item.href} className={cn(orientation === "horizontal" && "shrink-0")}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-press-900 text-cream"
                    : "text-slate-700 hover:bg-slate-900/5",
                )}
              >
                <ItemIcon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
    </ul>
  );
}

/** Authenticated app shell: sidebar navigation plus the main content landmark. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex items-start">
      <nav
        aria-label="Primary"
        className="sticky top-0 hidden h-[calc(100vh-7.5rem)] w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r border-slate-200/90 bg-white/60 p-4 md:flex"
      >
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="mb-1.5 px-3 text-xs font-semibold text-slate-500">{group.section}</p>
            <NavList items={group.items} orientation="vertical" />
          </div>
        ))}
        {user ? (
          <div className="mt-auto rounded-lg border border-slate-200/90 bg-white p-3">
            <p className="truncate text-[13px] font-semibold text-slate-900">{user.email}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {user.roles.join(" · ").replace(/_/g, " ")}
            </p>
          </div>
        ) : null}
      </nav>
      <div className="min-w-0 flex-1">
        <nav aria-label="Sections" className="border-b border-slate-200/90 bg-white/60 px-4 py-2 md:hidden">
          <NavList items={NAV.flatMap((group) => group.items)} orientation="horizontal" />
        </nav>
        <main id="main-content" className="min-w-0 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
