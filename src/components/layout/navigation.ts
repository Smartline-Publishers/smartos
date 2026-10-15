import {
  Book,
  BookOpen,
  Books,
  ChartBar,
  Coins,
  DotsThree,
  FileText,
  Gear,
  GearSix,
  ListChecks,
  Printer,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Storefront,
  SquaresFour,
  User,
  UserCircle,
  Users,
  Warehouse,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import type { Role } from "@/types/auth";

export type SectionId = "dashboard" | "content" | "operations" | "commerce" | "more";

export interface NavChild {
  href: string;
  label: string;
  icon: PhosphorIcon;
  roles?: Role[];
}

export interface NavSection {
  id: SectionId;
  label: string;
  icon: PhosphorIcon;
  /** Landing destination when the section itself is activated. */
  href: string;
  /** Nested destinations; absent for single-page sections. */
  children?: NavChild[];
}

const ADMIN_ONLY: Role[] = ["PLATFORM_ADMIN", "ORG_ADMIN"];

/**
 * Single source of truth for primary navigation across desktop sidebar,
 * in-page section tabs, and the mobile bottom dock. Every app destination
 * appears exactly once.
 */
export const NAV_SECTIONS: NavSection[] = [
  { id: "dashboard", label: "Dashboard", icon: SquaresFour, href: "/dashboard" },
  {
    id: "content",
    label: "Content",
    icon: Books,
    href: "/books",
    children: [
      { href: "/books", label: "Books", icon: Book },
      { href: "/manuscripts", label: "Manuscripts", icon: BookOpen },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Gear,
    href: "/tasks",
    children: [
      { href: "/tasks", label: "Tasks", icon: ListChecks },
      { href: "/production", label: "Production", icon: Printer },
      { href: "/contributors", label: "Contributors", icon: Users },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    icon: Storefront,
    href: "/orders",
    children: [
      { href: "/orders", label: "Orders", icon: ShoppingCart },
      { href: "/inventory", label: "Inventory", icon: Warehouse },
      { href: "/customers", label: "Customers", icon: User },
      { href: "/finance", label: "Ledger & budgets", icon: Receipt },
      { href: "/royalties", label: "Royalties", icon: Coins },
    ],
  },
  {
    id: "more",
    label: "More",
    icon: DotsThree,
    href: "/reports",
    children: [
      { href: "/reports", label: "Reports", icon: ChartBar },
      { href: "/users", label: "Users", icon: ShieldCheck, roles: ADMIN_ONLY },
      { href: "/audit", label: "Audit log", icon: FileText, roles: ADMIN_ONLY },
      { href: "/profile", label: "Profile", icon: UserCircle },
      { href: "/settings", label: "Settings", icon: GearSix },
    ],
  },
];

/** Tabs shown in the mobile bottom dock (More lives in a separate button). */
export const DOCK_SECTIONS: NavSection[] = NAV_SECTIONS.filter((s) => s.id !== "more");

export function isRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Section owning a route (matches children, incl. nested dynamic routes). */
export function sectionForPath(pathname: string): NavSection | undefined {
  return NAV_SECTIONS.find(
    (s) =>
      isRouteActive(pathname, s.href) ||
      s.children?.some((c) => isRouteActive(pathname, c.href)),
  );
}

export function isVisible(item: { roles?: Role[] }, roles: Role[] | undefined): boolean {
  if (!item.roles) return true;
  if (!roles) return false;
  return roles.some((r) => item.roles?.includes(r));
}

export function visibleChildren(section: NavSection, roles: Role[] | undefined): NavChild[] {
  return (section.children ?? []).filter((c) => isVisible(c, roles));
}
