"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DotsThree, SignOut, X } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { AccountMenuPanel } from "@/components/layout/AccountMenu";
import {
  DOCK_SECTIONS,
  NAV_SECTIONS,
  isRouteActive,
  sectionForPath,
  visibleChildren,
} from "@/components/layout/navigation";

/** iOS-style floating bottom navigation (mobile only). */
export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Dismiss the sheet on navigation.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const moreSection = NAV_SECTIONS.find((s) => s.id === "more")!;
  const moreActive = sectionForPath(pathname)?.id === "more";

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-3 z-40 md:hidden"
        style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-stretch gap-2">
          <div className="flex flex-1 items-stretch gap-1 rounded-2xl border border-line/70 bg-white/80 p-1.5 shadow-[0_8px_30px_rgb(2_6_23/0.12)] backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-900/80">
            {DOCK_SECTIONS.map((section) => {
              const active =
                isRouteActive(pathname, section.href) ||
                (section.children ?? []).some((c) => isRouteActive(pathname, c.href));
              const SectionIcon = section.icon;
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={section.label}
                  className={cn(
                    "flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    active
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "text-slate-500 hover:bg-slate-100 hover:text-ink dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
                  )}
                >
                  <SectionIcon size={22} aria-hidden="true" weight={active ? "fill" : "regular"} />
                  <span className="max-w-full truncate px-0.5">{section.label}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-1 w-1 rounded-full",
                      active ? "bg-brand-600 dark:bg-brand-400" : "bg-transparent",
                    )}
                  />
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            aria-label="Open menu"
            title="Menu"
            className={cn(
              "flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-semibold text-white shadow-[0_8px_30px_rgb(2_6_23/0.18)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              moreActive ? "bg-brand-600" : "bg-navy-900 dark:bg-neutral-800",
            )}
          >
            <DotsThree size={22} aria-hidden="true" weight="bold" />
            <span>More</span>
          </button>
        </div>
      </nav>
      {moreOpen ? (
        <MoreSheet
          onClose={() => setMoreOpen(false)}
          sectionId={moreSection.id}
        />
      ) : null}
    </>
  );
}

function MoreSheet({ onClose, sectionId }: { onClose: () => void; sectionId: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const section = NAV_SECTIONS.find((s) => s.id === sectionId)!;
  const items = visibleChildren(section, user?.roles);
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "?";
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 animate-[fade-in_.18s_ease-out] bg-black/45"
      />
      <div
        className="absolute inset-x-3 animate-[sheet-up_.22s_ease-out] rounded-2xl border border-line bg-white p-2 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        style={{ bottom: "calc(5.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between px-2 pb-1 pt-2">
          <p className="text-sm font-bold text-ink dark:text-neutral-100">Menu</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <ul className="flex flex-col">
          {items.map((item) => {
            const active = isRouteActive(pathname, item.href);
            const ItemIcon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    active
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                      : "text-ink hover:bg-slate-100 dark:text-neutral-100 dark:hover:bg-neutral-800",
                  )}
                >
                  <ItemIcon size={20} aria-hidden="true" className="shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="relative mt-1 border-t border-line px-2 pb-2 pt-3 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Account: ${user?.email ?? "signed in"}`}
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-neutral-800"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white dark:bg-neutral-800"
              >
                {initial}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-700 dark:text-neutral-300">
                {user?.email ?? "Signed in"}
              </span>
            </button>
            <Button variant="ghost" size="sm" onClick={logout} aria-label="Log out">
              <SignOut size={16} aria-hidden="true" />
              Logout
            </Button>
          </div>
          {menuOpen ? (
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              onClick={closeMenu}
              className="fixed inset-0 z-40 cursor-default bg-transparent"
            />
          ) : null}
          {menuOpen ? (
            <AccountMenuPanel onClose={closeMenu} className="absolute inset-x-2 bottom-full z-50 mb-2" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
