"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CaretRight,
  Check,
  DotsThree,
  SignOut,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/cn";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { getMenuGroups, getMobileTabs, isRouteActive } from "@/components/layout/navigation";

/** Rounded-square icon tile used by rows inside the More sheet. */
function RowIcon({ icon: Icon, active }: { icon: PhosphorIcon; active?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]",
        active
          ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
          : "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300",
      )}
    >
      <Icon size={19} />
    </span>
  );
}

/**
 * Mobile tab bar (iOS 26-inspired).
 *
 * <p>Never more than five tabs. Four primary destinations are promoted into
 * the bar; when more destinations exist the fifth slot opens a grouped More
 * sheet. Roles with five or fewer destinations get a flat bar and no More tab,
 * so nobody pays for a menu they do not need.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { permissions, user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const { tabs, showMore } = getMobileTabs(permissions);
  const groups = showMore ? getMenuGroups(permissions, tabs.map((tab) => tab.href)) : [];
  const primaryActive = tabs.some((tab) => isRouteActive(pathname, tab.href));
  const moreActive = showMore && !primaryActive;
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  // A destination chosen from the sheet changes the route; close the sheet so
  // the new screen is immediately visible.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  if (tabs.length === 0) return null;

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed z-40 md:hidden"
        style={{
          left: "max(0.75rem, env(safe-area-inset-left))",
          right: "max(0.75rem, env(safe-area-inset-right))",
          bottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex items-stretch gap-0.5 rounded-[26px] border border-white/70 bg-white/80 p-1.5 shadow-[0_12px_40px_rgb(2_6_23/0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-neutral-900/85 dark:shadow-[0_12px_40px_#00000080]">
          {tabs.map((tab) => {
            const active = isRouteActive(pathname, tab.href);
            const ItemIcon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                aria-label={tab.label}
                className={cn(
                  "flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] px-0.5",
                  "text-[10px] font-semibold transition-[transform,background-color,color] duration-150 active:scale-[0.96]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
                  active
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-slate-500 dark:text-neutral-400",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                    active
                      ? "bg-brand-50 dark:bg-brand-950"
                      : "bg-transparent",
                  )}
                >
                  <ItemIcon size={22} weight={active ? "fill" : "regular"} />
                </span>
                <span className="max-w-full truncate px-0.5 leading-none">{tab.label}</span>
              </Link>
            );
          })}

          {showMore ? (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-label="More destinations"
              className={cn(
                "flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] px-0.5",
                "text-[10px] font-semibold transition-[transform,background-color,color] duration-150 active:scale-[0.96]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1",
                moreActive
                  ? "text-brand-700 dark:text-brand-300"
                  : "text-slate-500 dark:text-neutral-400",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  moreActive ? "bg-brand-50 dark:bg-brand-950" : "bg-transparent",
                )}
              >
                <DotsThree size={24} weight="bold" />
              </span>
              <span className="leading-none">More</span>
            </button>
          ) : null}
        </div>
      </nav>

      <BottomSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="More"
        description="All destinations for your role"
        footer={
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              logout();
            }}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <SignOut size={18} aria-hidden="true" />
            Log out
          </button>
        }
      >
        <div className="flex flex-col gap-4 pb-1">
          <Link
            href="/profile"
            onClick={() => setMoreOpen(false)}
            className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50/80 p-3 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:hover:bg-neutral-800"
          >
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-900 text-base font-bold text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold text-ink dark:text-neutral-100">
                {user?.email ?? "Signed in"}
              </span>
              <span className="mt-0.5 block text-[12px] text-muted dark:text-neutral-400">
                Profile and account
              </span>
            </span>
            <CaretRight size={16} aria-hidden="true" className="shrink-0 text-slate-400" />
          </Link>

          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`more-group-${group.id}`}>
              <h3
                id={`more-group-${group.id}`}
                className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted dark:text-neutral-400"
              >
                {group.label}
              </h3>
              <ul className="overflow-hidden rounded-2xl border border-line bg-white dark:border-neutral-800 dark:bg-neutral-900">
                {group.items.map((item) => {
                  const active = isRouteActive(pathname, item.href);
                  const ItemIcon = item.icon;
                  return (
                    <li
                      key={item.href}
                      className="border-b border-line/70 last:border-b-0 dark:border-neutral-800"
                    >
                      <Link
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex min-h-[52px] items-center gap-3 px-3 py-2 transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500",
                          active
                            ? "bg-brand-50/80 dark:bg-brand-950/40"
                            : "hover:bg-slate-50 dark:hover:bg-neutral-800/60",
                        )}
                      >
                        <RowIcon icon={ItemIcon} active={active} />
                        <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink dark:text-neutral-100">
                          {item.label}
                        </span>
                        {active ? (
                          <Check
                            size={18}
                            weight="bold"
                            aria-hidden="true"
                            className="shrink-0 text-brand-600 dark:text-brand-400"
                          />
                        ) : (
                          <CaretRight
                            size={16}
                            aria-hidden="true"
                            className="shrink-0 text-slate-300 dark:text-neutral-600"
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
