"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CaretRight,
  GearSix,
  Lifebuoy,
  MagnifyingGlass,
  Scales,
  SignOut,
  UserCircle,
} from "@phosphor-icons/react";
import { useAuth } from "@/hooks/use-auth";
import { useOrg } from "@/hooks/use-org";
import { cn } from "@/lib/cn";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ThemeSelector } from "@/components/layout/ThemeSelector";
import { labelForPath } from "@/components/layout/navigation";

/**
 * Compact iOS-style mobile app bar.
 *
 * <p>Owns the screen title, catalogue search and the account sheet on small
 * screens. It sits outside the scrolling region so the title and actions stay
 * put while content moves beneath. Safe-area padding keeps it clear of the
 * notch in standalone/PWA mode.
 */
export function MobileHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { org, profile } = useOrg();
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const label = labelForPath(pathname);
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  useEffect(() => {
    setSearchOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen) return;
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [searchOpen]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    setSearchOpen(false);
    router.push(`/books${value ? `?search=${encodeURIComponent(value)}` : ""}`);
  };

  return (
    <>
      <header
        className="shrink-0 border-b border-line/80 bg-white/90 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/90 md:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-[52px] items-center gap-1.5 px-3">
          <Link
            href="/dashboard"
            aria-label="SmartOS dashboard"
            className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {org?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt=""
                aria-hidden="true"
                className="h-8 w-8 shrink-0 rounded-[10px] border border-line bg-white object-contain"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-tertiary-600 text-[15px] font-extrabold leading-none text-[rgb(var(--org-on-tertiary,255_255_255))]"
              >
                S
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted dark:text-neutral-500">
                SmartOS
              </span>
              <span className="block truncate text-[17px] font-bold leading-tight tracking-[-0.2px] text-ink dark:text-neutral-100">
                {label}
              </span>
            </span>
          </Link>

          <div className="ml-auto flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? "Close catalogue search" : "Search the catalogue"}
              aria-expanded={searchOpen}
              aria-controls="mobile-catalogue-search"
              className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              <MagnifyingGlass size={21} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              aria-label="Account and appearance"
              aria-haspopup="dialog"
              aria-expanded={accountOpen}
              className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-navy-900 text-[13px] font-bold text-white dark:bg-neutral-100 dark:text-neutral-900"
              >
                {profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt="" aria-hidden="true" className="h-8 w-8 object-cover" />
                ) : (
                  initial
                )}
              </span>
            </button>
          </div>
        </div>

        <div
          id="mobile-catalogue-search"
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            searchOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <form
              role="search"
              aria-label="Catalogue search"
              onSubmit={onSubmit}
              className="flex items-center gap-2 border-t border-line/70 px-3 py-2 dark:border-neutral-800"
            >
              <label htmlFor="mobile-catalog-search" className="sr-only">
                Search books by title or ISBN
              </label>
              <input
                ref={searchRef}
                id="mobile-catalog-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search books by title or ISBN"
                autoComplete="off"
                enterKeyHint="search"
                className="h-10 min-w-0 flex-1 rounded-xl border border-[#d8e0ec] bg-white px-3 text-base text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-xl bg-brand-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="h-10 shrink-0 rounded-xl px-2 text-sm font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-neutral-300"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      </header>

      <BottomSheet
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        title="Account"
        description={org?.name ?? "SmartOS"}
        footer={
          <button
            type="button"
            onClick={() => {
              setAccountOpen(false);
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
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-slate-50/80 p-3.5 dark:border-neutral-800 dark:bg-neutral-800/60">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-900 text-lg font-bold text-white dark:bg-neutral-100 dark:text-neutral-900"
            >
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" aria-hidden="true" className="h-12 w-12 object-cover" />
              ) : (
                initial
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-ink dark:text-neutral-100">
                {user?.email ?? "Signed in"}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-muted dark:text-neutral-400">
                {org?.name ?? "Smartline Publishers"}
              </p>
            </div>
          </div>

          <section aria-labelledby="account-links-heading">
            <h3
              id="account-links-heading"
              className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted dark:text-neutral-400"
            >
              Account
            </h3>
            <ul className="overflow-hidden rounded-2xl border border-line bg-white dark:border-neutral-800 dark:bg-neutral-900">
              {[
                { href: "/profile", label: "Profile", icon: UserCircle },
                { href: "/settings", label: "Settings", icon: GearSix },
                { href: "/help", label: "Help & guides", icon: Lifebuoy },
                { href: "/legal", label: "Legal centre", icon: Scales },
              ].map((item) => {
                const ItemIcon = item.icon;
                return (
                  <li
                    key={item.href}
                    className="border-b border-line/70 last:border-b-0 dark:border-neutral-800"
                  >
                    <Link
                      href={item.href}
                      onClick={() => setAccountOpen(false)}
                      className="flex min-h-[52px] items-center gap-3 px-3.5 py-2 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 dark:hover:bg-neutral-800/60"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        <ItemIcon size={19} />
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] font-medium text-ink dark:text-neutral-100">
                        {item.label}
                      </span>
                      <CaretRight size={16} aria-hidden="true" className="text-slate-300 dark:text-neutral-600" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="account-appearance-heading">
            <h3
              id="account-appearance-heading"
              className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted dark:text-neutral-400"
            >
              Appearance
            </h3>
            <div className="rounded-2xl border border-line bg-white p-1.5 dark:border-neutral-800 dark:bg-neutral-900">
              <ThemeSelector size="md" />
            </div>
          </section>
        </div>
      </BottomSheet>
    </>
  );
}
