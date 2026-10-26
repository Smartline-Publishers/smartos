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
import type { Permission } from "@/types/auth";

export type SectionId = "dashboard" | "content" | "operations" | "commerce" | "more";

export interface NavChild {
  href: string;
  label: string;
  icon: PhosphorIcon;
  /** Permission required to see and open this destination. */
  permission?: Permission;
}

export interface NavSection {
  id: SectionId;
  label: string;
  icon: PhosphorIcon;
  /** Landing destination when the section itself is activated. */
  href: string;
  /** Nested destinations; absent for single-page sections. */
  children?: NavChild[];
  /** Permission required to see this section at all. */
  permission?: Permission;
}

/**
 * Single source of truth for primary navigation across the desktop sidebar,
 * the mobile bottom dock and its More sheet. Every app destination appears
 * exactly once.
 *
 * Each entry declares the permission that governs it. The permission list
 * comes from the server, so the sidebar shows exactly the destinations the
 * API will serve for the caller's role — an editor sees the editorial
 * workflow and never the order desk.
 */
export const NAV_SECTIONS: NavSection[] = [
  { id: "dashboard", label: "Dashboard", icon: SquaresFour, href: "/dashboard" },
  {
    id: "content",
    label: "Content",
    icon: Books,
    href: "/books",
    permission: "books.read",
    children: [
      { href: "/books", label: "Books", icon: Book, permission: "books.read" },
      { href: "/manuscripts", label: "Manuscripts", icon: BookOpen, permission: "manuscripts.read" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Gear,
    href: "/tasks",
    permission: "tasks.read",
    children: [
      { href: "/tasks", label: "Tasks", icon: ListChecks, permission: "tasks.read" },
      { href: "/production", label: "Production", icon: Printer, permission: "production.read" },
      { href: "/contributors", label: "Contributors", icon: Users, permission: "contributors.read" },
      { href: "/inventory", label: "Inventory", icon: Warehouse, permission: "inventory.read" },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    icon: Storefront,
    href: "/orders",
    permission: "orders.read",
    children: [
      { href: "/orders", label: "Orders", icon: ShoppingCart, permission: "orders.read" },
      { href: "/customers", label: "Customers", icon: User, permission: "customers.read" },
      { href: "/finance", label: "Ledger & budgets", icon: Receipt, permission: "finance.read" },
      { href: "/royalties", label: "Royalties", icon: Coins, permission: "royalties.read" },
    ],
  },
  {
    id: "more",
    label: "More",
    icon: DotsThree,
    href: "/reports",
    children: [
      { href: "/reports", label: "Reports", icon: ChartBar, permission: "reports.sales.read" },
      { href: "/users", label: "Users", icon: ShieldCheck, permission: "users.read" },
      { href: "/audit", label: "Audit log", icon: FileText, permission: "audit.read" },
      { href: "/profile", label: "Profile", icon: UserCircle },
      { href: "/settings", label: "Settings", icon: GearSix },
    ],
  },
];

/** Leaf destination used by the mobile tab bar and More sheet. */
export interface Destination {
  href: string;
  label: string;
  icon: PhosphorIcon;
  sectionId: SectionId;
}

/** A heading + its destinations inside the mobile More sheet. */
export interface MenuGroup {
  id: SectionId;
  label: string;
  items: Destination[];
}

/**
 * Order in which destinations are promoted into the four primary mobile tabs.
 * The first four accessible entries win; remaining roles fall back to the
 * order the server's permission list exposes.
 */
const PRIMARY_ORDER = ["/dashboard", "/books", "/tasks", "/orders"];

/**
 * The four destinations shown directly in the mobile tab bar.
 *
 * <p>Every destination is a leaf screen, so a tab always opens a real page
 * rather than a section landing that hides its children. Roles that cannot
 * open one of the preferred destinations get the next accessible one.
 */
export function getPrimaryDestinations(
  permissions: Permission[] | undefined,
): Destination[] {
  const items = getAllAccessibleItems(permissions);
  const primary: Destination[] = [];

  for (const href of PRIMARY_ORDER) {
    const item = items.find((candidate) => candidate.href === href);
    if (item) primary.push(item);
  }
  for (const item of items) {
    if (primary.length >= 4) break;
    if (!primary.some((chosen) => chosen.href === item.href)) primary.push(item);
  }
  return primary.slice(0, 4);
}

/**
 * Mobile tab-bar model.
 *
 * <p>Five or fewer destinations are shown flat with no More tab — an extra
 * menu would only add a step. Above five, the four primary destinations get
 * their own tabs and the fifth slot becomes More.
 */
export function getMobileTabs(permissions: Permission[] | undefined): {
  tabs: Destination[];
  showMore: boolean;
} {
  const items = getAllAccessibleItems(permissions);
  if (items.length <= 5) {
    return { tabs: items.slice(0, 5), showMore: false };
  }
  return { tabs: getPrimaryDestinations(permissions), showMore: true };
}

/**
 * Remaining destinations grouped by section for the More sheet. Primary tab
 * destinations are omitted because they are already one tap away.
 */
export function getMenuGroups(
  permissions: Permission[] | undefined,
  primaryHrefs: Iterable<string>,
): MenuGroup[] {
  const promoted = new Set(primaryHrefs);
  const groups: MenuGroup[] = [];

  for (const section of visibleSections(permissions)) {
    const children = section.children
      ? visibleChildren(section, permissions)
      : [
          {
            href: section.href,
            label: section.label,
            icon: section.icon,
            permission: section.permission,
          },
        ];

    const items = children
      .filter((child) => !promoted.has(child.href))
      .map((child) => ({
        href: child.href,
        label: child.label,
        icon: child.icon,
        sectionId: section.id,
      }));

    if (items.length > 0) {
      groups.push({ id: section.id, label: section.label, items });
    }
  }

  return groups;
}

/** Accessible label for the current route, used by the mobile app bar. */
export function labelForPath(pathname: string): string {
  for (const section of NAV_SECTIONS) {
    for (const child of section.children ?? []) {
      if (isRouteActive(pathname, child.href)) return child.label;
    }
    if (!section.children && isRouteActive(pathname, section.href)) {
      return section.label;
    }
  }
  return "SmartOS";
}

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

export function isVisible(
  item: { permission?: Permission },
  permissions: Permission[] | undefined,
): boolean {
  if (!item.permission) return true;
  if (!permissions) return false;
  return permissions.includes(item.permission);
}

export function visibleChildren(
  section: NavSection,
  permissions: Permission[] | undefined,
): NavChild[] {
  return (section.children ?? []).filter((c) => isVisible(c, permissions));
}

/** Sections the caller may open at all. */
export function visibleSections(
  permissions: Permission[] | undefined,
): NavSection[] {
  return NAV_SECTIONS.filter((s) => isVisible(s, permissions));
}

/**
 * Get all accessible leaf navigation items (destinations) for a given permission set.
 * This flattens sections and their children into a single list of accessible destinations.
 */
export function getAllAccessibleItems(
  permissions: Permission[] | undefined,
): Array<{ href: string; label: string; icon: PhosphorIcon; sectionId: SectionId }> {
  const sections = visibleSections(permissions);
  const items: Array<{ href: string; label: string; icon: PhosphorIcon; sectionId: SectionId }> = [];

  for (const section of sections) {
    if (section.children) {
      const children = visibleChildren(section, permissions);
      for (const child of children) {
        items.push({ href: child.href, label: child.label, icon: child.icon, sectionId: section.id });
      }
    } else {
      items.push({ href: section.href, label: section.label, icon: section.icon, sectionId: section.id });
    }
  }

  return items;
}

/**
 * Check if the user has fewer than 5 accessible navigation items.
 * Used to determine whether to show a simplified flat navigation.
 */
export function shouldUseSimpleNavigation(permissions: Permission[] | undefined): boolean {
  const items = getAllAccessibleItems(permissions);
  return items.length < 5;
}

/**
 * The permission guarding a route, if any. Used to block direct navigation to
 * a destination the caller's role may not open.
 */
export function permissionForPath(pathname: string): Permission | undefined {
  for (const section of NAV_SECTIONS) {
    for (const child of section.children ?? []) {
      if (isRouteActive(pathname, child.href)) return child.permission;
    }
    if (isRouteActive(pathname, section.href) && !section.children) {
      return section.permission;
    }
  }
  return undefined;
}
