"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/Button";
import { MagnifyingGlass } from "@phosphor-icons/react";

function shortOrg(orgId: string | undefined): string {
  if (!orgId) return "No organization";
  return `Org ${orgId.slice(0, 8)}`;
}

/** Top bar: catalog search, organization indicator, account actions. */
export function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/books${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ""}`);
  };

  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  return (
    <div className="flex items-center gap-3 border-b border-slate-200/90 bg-white px-4 py-2.5 md:px-6">
      <form role="search" aria-label="Catalog search" onSubmit={onSearch} className="min-w-0 flex-1 sm:max-w-sm">
        <label htmlFor="catalog-search" className="sr-only">
          Search books by title or ISBN
        </label>
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <MagnifyingGlass size={16} aria-hidden="true" />
          </span>
          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books…"
            autoComplete="off"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-12 text-sm text-slate-900 placeholder:text-slate-400"
          />
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 text-[11px] font-medium text-slate-400 sm:block"
          >
            ⏎
          </kbd>
        </div>
      </form>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <span
          title={user?.orgId ?? "Signed in without an organization"}
          className="hidden rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 lg:inline-block"
        >
          {shortOrg(user?.orgId)}
        </span>
        {user ? (
          <span className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-press-800 text-sm font-bold text-cream"
            >
              {initial}
            </span>
            <span className="hidden max-w-44 truncate text-sm text-slate-700 md:inline" aria-live="polite">
              {user.email}
            </span>
          </span>
        ) : null}
        <Button variant="ghost" size="sm" onClick={logout} aria-label="Log out">
          Logout
        </Button>
      </div>
    </div>
  );
}
