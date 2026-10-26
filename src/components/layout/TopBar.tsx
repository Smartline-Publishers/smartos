"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useOrg } from "@/hooks/use-org";
import { ThemeSelector } from "@/components/layout/ThemeSelector";
import { labelForPath } from "@/components/layout/navigation";

function shortOrg(orgId: string | undefined): string {
  if (!orgId) return "No organization";
  return `Org ${orgId.slice(0, 8)}`;
}

/** Top bar: section crumb, catalog search, org badge, theme switcher.
 *  Fixed at the top of the shell's right column (shrink-0) — it never scrolls.
 *
 *  Account identity + logout live in the sidebar footer; they are intentionally
 *  not repeated here (mobile keeps a compact logout icon button since the
 *  sidebar footer is desktop-only).
 */
export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { org } = useOrg();
  const [query, setQuery] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/books${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ""}`);
  };

  const crumb = labelForPath(pathname);

  return (
    <div className="hidden shrink-0 items-center gap-3 border-b border-line bg-white px-4 py-[13px] dark:border-neutral-800 dark:bg-neutral-900 md:flex md:gap-4 md:px-7 md:py-[17px]">
      <p className="shrink-0 text-[16px] font-bold text-ink dark:text-neutral-100" aria-current="page">
        {crumb === "Dashboard" ? "Overview" : crumb}
      </p>
      <form
        role="search"
        aria-label="Catalog search"
        onSubmit={onSearch}
        className="hidden min-w-0 flex-1 sm:block sm:max-w-xs"
      >
        <label htmlFor="catalog-search" className="sr-only">
          Search books by title or ISBN
        </label>
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books…"
          autoComplete="off"
          className="h-9 w-full rounded-lg border border-[#d8e0ec] bg-white px-3 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
        />
      </form>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <span
          title={org ? `${org.name} (${org.slug})` : (user?.orgId ?? "Signed in without an organization")}
          className="hidden items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-muted dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 lg:inline-flex"
        >
          {org?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoUrl} alt="" aria-hidden="true" className="h-4 w-4 rounded object-contain" />
          ) : null}
          {org ? org.slug : shortOrg(user?.orgId)}
        </span>
        <ThemeSelector />
      </div>
    </div>
  );
}
