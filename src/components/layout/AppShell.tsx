"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useOrg } from "@/hooks/use-org";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasPermission } from "@/lib/permissions";
import { permissionForPath } from "@/components/layout/navigation";
import { Brand } from "@/components/layout/Brand";
import { TopBar } from "@/components/layout/TopBar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileNav } from "@/components/layout/MobileNav";
import { AccountMenuPanel } from "@/components/layout/AccountMenu";
import { OnboardingChecklist } from "@/components/layout/OnboardingChecklist";
import { Button } from "@/components/ui/Button";
import { CaretDoubleLeft, CaretDoubleRight, CaretDown, SignOut } from "@phosphor-icons/react";
import {
  NAV_SECTIONS,
  isRouteActive,
  sectionForPath,
  visibleChildren,
  visibleSections,
  getAllAccessibleItems,
  shouldUseSimpleNavigation,
  type NavSection,
} from "@/components/layout/navigation";

const SIDEBAR_KEY = "smartos.sidebarCollapsed";

function readCollapsedInitial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage.getItem(SIDEBAR_KEY);
    // An explicit user choice always wins. Otherwise tablet (<lg) starts
    // collapsed to maximize the content area; desktop starts expanded.
    if (stored === "1" || stored === "0") return stored === "1";
  } catch {
    // Storage unavailable — fall through to the breakpoint default.
  }
  return window.innerWidth < 1024;
}

/** Single top-level link row (sections without children, e.g. Dashboard). */
function SidebarLink({
  href,
  label,
  icon: ItemIcon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: NavSection["icon"];
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center rounded-[9px] text-sm",
        collapsed ? "justify-center px-0 py-[11px]" : "gap-2 px-3 py-[11px]",
        active ? "bg-brand-600 font-semibold text-[rgb(var(--org-on-primary,255_255_255))]" : "text-[rgb(var(--org-sidebar-muted,219_230_247))] hover:bg-navy-700 hover:text-[rgb(var(--org-sidebar-fg,255_255_255))]",
      )}
    >
      <ItemIcon size={18} aria-hidden="true" className="shrink-0" />
      {collapsed ? null : label}
    </Link>
  );
}

/** Icon-only destination link for the collapsed rail (with tooltip). */
function RailLink({
  href,
  label,
  icon: ItemIcon,
}: {
  href: string;
  label: string;
  icon: NavSection["icon"];
}) {
  const pathname = usePathname();
  const active = isRouteActive(pathname, href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center justify-center rounded-[9px] px-0 py-[11px] text-sm",
        active
          ? "bg-brand-600 font-semibold text-[rgb(var(--org-on-primary,255_255_255))]"
          : "text-[rgb(var(--org-sidebar-muted,219_230_247))] hover:bg-navy-700 hover:text-[rgb(var(--org-sidebar-fg,255_255_255))]",
      )}
    >
      <ItemIcon size={18} aria-hidden="true" className="shrink-0" />
    </Link>
  );
}

/** Expandable section group with nested destinations. */
function SidebarGroup({
  section,
  open,
  onToggle,
}: {
  section: NavSection;
  open: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { permissions } = useAuth();
  const children = visibleChildren(section, permissions);
  const active =
    isRouteActive(pathname, section.href) ||
    children.some((c) => isRouteActive(pathname, c.href));
  const SectionIcon = section.icon;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`${open ? "Collapse" : "Expand"} ${section.label} section`}
        title={section.label}
        className={cn(
          "flex w-full items-center gap-2 rounded-[9px] px-3 py-[11px] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          active ? "font-semibold text-[rgb(var(--org-sidebar-fg,255_255_255))]" : "text-[rgb(var(--org-sidebar-muted,219_230_247))] hover:bg-navy-700 hover:text-[rgb(var(--org-sidebar-fg,255_255_255))]",
        )}
      >
        <SectionIcon size={18} aria-hidden="true" className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{section.label}</span>
        <CaretDown
          size={14}
          aria-hidden="true"
          className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <ul className="flex flex-col gap-[3px] py-1 pl-9 pr-1" aria-label={`${section.label} destinations`}>
            {children.map((child) => {
              const childActive = isRouteActive(pathname, child.href);
              const ChildIcon = child.icon;
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    aria-current={childActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                      childActive
                        ? "bg-brand-600 font-semibold text-[rgb(var(--org-on-primary,255_255_255))]"
                        : "text-[rgb(var(--org-sidebar-muted,219_230_247))] hover:bg-navy-700 hover:text-[rgb(var(--org-sidebar-fg,255_255_255))]",
                    )}
                  >
                    <ChildIcon size={16} aria-hidden="true" className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{child.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/** Fixed sidebar footer: profile opens an anchored account menu; logout stays pinned. */
function SidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { user, logout } = useAuth();
  const { profile } = useOrg();
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = user?.email ? user.email.charAt(0).toUpperCase() : "?";
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const dismissLayer = menuOpen ? (
    <button
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      onClick={closeMenu}
      className="fixed inset-0 z-40 cursor-default bg-transparent"
    />
  ) : null;

  if (collapsed) {
    return (
      <div className="relative flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`Account: ${user?.email ?? "signed in"}`}
          title={user?.email ?? "Account"}
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-navy-700 text-sm font-bold text-[rgb(var(--org-on-secondary,255_255_255))] transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" aria-hidden="true" className="h-8 w-8 object-cover" />
          ) : (
            <span aria-hidden="true">{initial}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => logout()}
          aria-label="Log out"
          title="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[rgb(var(--org-sidebar-muted,212_212_212))] transition-colors hover:bg-navy-700 hover:text-[rgb(var(--org-sidebar-fg,255_255_255))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <SignOut size={18} aria-hidden="true" />
        </button>
        {dismissLayer}
        {menuOpen ? (
          <AccountMenuPanel onClose={closeMenu} className="absolute bottom-0 left-full z-50 ml-2" />
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Account: ${user?.email ?? "signed in"}`}
        className="flex w-full items-center gap-2 rounded-[9px] bg-navy-800 px-2.5 py-2 text-left transition-colors hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-700 text-sm font-bold text-[rgb(var(--org-on-secondary,255_255_255))]"
        >
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" aria-hidden="true" className="h-8 w-8 object-cover" />
          ) : (
            initial
          )}
        </span>
        <span
          className="min-w-0 flex-1 truncate text-[13px] text-[rgb(var(--org-sidebar-muted,219_230_247))]"
          title={user?.email ?? "Signed in"}
          aria-live="polite"
        >
          {user?.email ?? "Signed in"}
        </span>
      </button>
      <Button variant="ghost" size="sm" onClick={() => logout()} aria-label="Log out" className="w-full">
        <SignOut size={16} aria-hidden="true" />
        Logout
      </Button>
      {dismissLayer}
      {menuOpen ? (
        <AccountMenuPanel onClose={closeMenu} className="absolute bottom-full left-0 z-50 mb-2" />
      ) : null}
    </div>
  );
}

/**
 * Shared authenticated shell.
 *
 * Desktop/tablet: persistent collapsible sidebar (accordion sections) +
 * fixed app bar. Mobile: slim app bar, floating bottom dock for destination
 * switching, and page-level floating action buttons for the primary CTA.
 * Main content scrolls independently everywhere with clearance for the dock.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  // NOTE: must initialize to `false` so the first client render matches SSR.
  // The persisted/tablet preference is applied post-mount instead.
  const [collapsed, setCollapsed] = useState<boolean>(false);
  // Gates the sidebar width animation: no transition on first paint, so a
  // returning collapsed-sidebar user doesn't see the layout slide/bounce.
  const [mounted, setMounted] = useState<boolean>(false);
  const pathname = usePathname();
  const { permissions } = useAuth();
  const { org } = useOrg();

  // Only sections the caller's role may open are rendered; a role never sees
  // a navigation entry for a destination the API would refuse to serve.
  const sections = visibleSections(permissions);
  const requiredPermission = permissionForPath(pathname);
  const accessDenied = !!requiredPermission && !hasPermission(permissions, requiredPermission);

  // Check if we should use simplified flat navigation (fewer than 5 accessible items)
  const useSimpleNav = shouldUseSimpleNavigation(permissions);
  const allAccessibleItems = getAllAccessibleItems(permissions);

  useEffect(() => {
    setCollapsed(readCollapsedInitial());
    setMounted(true);
  }, []);

  // Expanded accordion sections; the active section opens automatically.
  const [openMap, setOpenMap] = useState<Record<string, boolean>>(() => {
    const active = sectionForPath(pathname);
    return active?.children ? { [active.id]: true } : {};
  });

  useEffect(() => {
    const active = sectionForPath(pathname);
    setOpenMap(active?.children ? { [active.id]: true } : {});
  }, [pathname]);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        // Storage unavailable (private mode) — session-only state still works.
      }
      return next;
    });
  }, []);

  const toggleSection = useCallback((id: string) => {
    // Accordion behavior: opening one section collapses every other section.
    setOpenMap((prev) => (prev[id] ? {} : { [id]: true }));
  }, []);

  const ToggleIcon = collapsed ? CaretDoubleRight : CaretDoubleLeft;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper dark:bg-neutral-950 md:flex-row">
      {/* Desktop/tablet sidebar (fixed width, full viewport height). */}
      <aside
        aria-label="Application sidebar"
        className={cn(
          "hidden h-dvh shrink-0 flex-col border-r border-[#E5E7EB] bg-navy-900 text-[rgb(var(--org-sidebar-fg,255_255_255))] dark:border-neutral-800 md:flex",
          mounted && "transition-[width] duration-200",
          collapsed ? "w-[76px]" : "w-[235px]",
        )}
      >
        {/* Fixed logo header: app wordmark, "by" label, and the Smartline logo
            (expanded). Collapsed shows only the app mark. */}
        <div
          className={cn(
            "flex shrink-0 flex-col border-b border-white/10",
            collapsed ? "items-center gap-1 px-2 pb-3 pt-4" : "gap-1 px-[14px] pb-4 pt-4",
          )}
        >
          {collapsed ? (
            <>
              {/* Collapsed rail always shows the built-in app mark — never a
                  custom logo URL, which may fail and render as a broken image. */}
              <Brand tone="dark" compact />
              <button
                type="button"
                onClick={toggle}
                aria-expanded={!collapsed}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[rgb(var(--org-sidebar-muted,212_212_212))] transition-colors hover:bg-navy-700 hover:text-[rgb(var(--org-sidebar-fg,255_255_255))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <ToggleIcon size={16} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <div className="flex w-full items-center justify-between gap-2">
                <Brand tone="dark" tagline={false} className="min-w-0 flex-1 px-1" logoUrl={org?.logoUrl} />
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={!collapsed}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[rgb(var(--org-sidebar-muted,212_212_212))] transition-colors hover:bg-navy-700 hover:text-[rgb(var(--org-sidebar-fg,255_255_255))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <ToggleIcon size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="flex items-center gap-2 px-1">
                <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[rgb(var(--org-sidebar-muted,163_163_163))]">
                  by
                </p>
                <Image
                  src="/branding/smartline-logo.svg"
                  alt="Smartline Publishers"
                  width={1793}
                  height={814}
                  className="h-[22px] w-auto"
                  priority={false}
                />
              </div>
            </>
          )}
        </div>

        {/* Independently scrollable nav (overscroll contained: no rubber-band bounce). */}
        <nav
          aria-label="Primary"
          className={cn(
            "shell-scroll min-h-0 flex-1 overflow-y-auto overscroll-none overflow-x-hidden py-4",
            collapsed ? "px-2" : "px-[14px]",
          )}
        >
          {collapsed ? (
            /* Collapsed rail: every destination visible as its own icon button,
               grouped with dividers — nothing hidden inside collapsed sections. */
            <>
              {useSimpleNav ? (
                // Simplified flat navigation when fewer than 5 accessible items
                <ul className="flex flex-col gap-[5px]">
                  {allAccessibleItems.map((item) => (
                    <li key={item.href}>
                      <RailLink href={item.href} label={item.label} icon={item.icon} />
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <ul className="flex flex-col gap-[5px]">
                    {sections.filter((s) => !s.children).map((section) => (
                      <li key={section.id}>
                        <RailLink href={section.href} label={section.label} icon={section.icon} />
                      </li>
                    ))}
                  </ul>
                  {sections.filter((s) => s.children).map((section) => {
                    const kids = visibleChildren(section, permissions);
                    if (kids.length === 0) return null;
                    return (
                      <div key={section.id}>
                        <div aria-hidden="true" className="mx-2 mb-[5px] mt-[5px] h-px bg-white/10" />
                        <span className="sr-only">{section.label}</span>
                        <ul className="flex flex-col gap-[5px]">
                          {kids.map((kid) => (
                            <li key={kid.href}>
                              <RailLink href={kid.href} label={kid.label} icon={kid.icon} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          ) : (
            <ul className="flex flex-col gap-[5px]">
              {useSimpleNav ? (
                // Simplified flat navigation when fewer than 5 accessible items
                allAccessibleItems.map((item) => (
                  <li key={item.href}>
                    <SidebarLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isRouteActive(pathname, item.href)}
                      collapsed={collapsed}
                    />
                  </li>
                ))
              ) : (
                // Standard accordion navigation
                sections.map((section) =>
                  section.children ? (
                    <li key={section.id}>
                      <SidebarGroup
                        section={section}
                        open={!!openMap[section.id]}
                        onToggle={() => toggleSection(section.id)}
                      />
                    </li>
                  ) : (
                    <li key={section.id}>
                      <SidebarLink
                        href={section.href}
                        label={section.label}
                        icon={section.icon}
                        active={isRouteActive(pathname, section.href)}
                        collapsed={collapsed}
                      />
                    </li>
                  ),
                )
              )}
            </ul>
          )}
        </nav>

        {/* Fixed footer */}
        <div
          className={cn(
            "shrink-0 border-t border-white/10",
            collapsed ? "px-2 py-3" : "px-[14px] py-3",
          )}
        >
          {collapsed ? null : <OnboardingChecklist />}
          <SidebarFooter collapsed={collapsed} />
        </div>
      </aside>

      {/* Right column: fixed app bar and independently scrolling main. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MobileHeader />
        <TopBar />
        <main
          id="main-content"
          className="shell-scroll min-h-0 flex-1 overflow-y-auto overscroll-none overflow-x-hidden"
        >
          <div className="mx-auto max-w-[1500px] px-4 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-4 md:px-7 md:py-[26px] md:pb-[26px]">
            {accessDenied ? (
              <EmptyState
                title="You don't have access to this page"
                description="Your role doesn't include the permission needed to open this destination. Contact your organization admin if you think this is a mistake."
              />
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
