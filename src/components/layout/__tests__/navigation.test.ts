import { describe, expect, it } from "vitest";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@/lib/permissions";
import {
  NAV_SECTIONS,
  getAllAccessibleItems,
  getMenuGroups,
  getMobileTabs,
  isVisible,
  permissionForPath,
  visibleChildren,
  visibleSections,
} from "@/components/layout/navigation";
import type { Permission } from "@/types/auth";

/**
 * Mirrors the backend role matrix for the roles the UI is asserted against.
 * The server sends the real permission list at runtime; these fixtures keep
 * the navigation expectations explicit and readable.
 */
const EDITOR_PERMISSIONS: Permission[] = [
  "books.read",
  "books.write",
  "books.delete",
  "manuscripts.read",
  "manuscripts.write",
  "manuscripts.delete",
  "contributors.read",
  "contributors.write",
  "contributors.delete",
  "tasks.read",
  "tasks.write",
  "reports.editorial.read",
];

const SALES_PERMISSIONS: Permission[] = [
  "books.read",
  "orders.read",
  "orders.write",
  "customers.read",
  "customers.write",
  "inventory.read",
  "warehouses.read",
  "tasks.read",
];

const ORG_ADMIN_PERMISSIONS: Permission[] = [
  ...EDITOR_PERMISSIONS,
  "production.read",
  "production.write",
  "inventory.read",
  "inventory.write",
  "warehouses.read",
  "warehouses.write",
  "orders.read",
  "orders.write",
  "customers.read",
  "customers.write",
  "finance.read",
  "finance.write",
  "royalties.read",
  "royalties.write",
  "reports.sales.read",
  "users.read",
  "users.write",
  "invites.manage",
  "audit.read",
  "org.settings.write",
];

function hrefs(permissions: Permission[]): string[] {
  return visibleSections(permissions)
    .flatMap((s) => (s.children ?? []).filter((c) => isVisible(c, permissions)))
    .map((c) => c.href);
}

describe("permission checks", () => {
  it("grants only the permissions the server sent", () => {
    expect(hasPermission(EDITOR_PERMISSIONS, "manuscripts.write")).toBe(true);
    expect(hasPermission(EDITOR_PERMISSIONS, "orders.read")).toBe(false);
    expect(hasPermission(undefined, "books.read")).toBe(false);
    expect(hasPermission([], "books.read")).toBe(false);
  });

  it("supports any/all matching", () => {
    expect(hasAnyPermission(EDITOR_PERMISSIONS, ["orders.read", "books.read"])).toBe(true);
    expect(hasAnyPermission(EDITOR_PERMISSIONS, ["orders.read", "finance.read"])).toBe(false);
    expect(hasAllPermissions(EDITOR_PERMISSIONS, ["books.read", "tasks.read"])).toBe(true);
    expect(hasAllPermissions(EDITOR_PERMISSIONS, ["books.read", "orders.read"])).toBe(false);
  });
});

describe("role-aware navigation", () => {
  it("hides commerce from editors", () => {
    const links = hrefs(EDITOR_PERMISSIONS);

    // The reported symptom: editors saw commerce navigation.
    expect(links).not.toContain("/orders");
    expect(links).not.toContain("/customers");
    expect(links).not.toContain("/finance");
    expect(links).not.toContain("/royalties");
  });

  it("gives editors the editorial workflow and their tasks", () => {
    const links = hrefs(EDITOR_PERMISSIONS);

    expect(links).toContain("/books");
    expect(links).toContain("/manuscripts");
    expect(links).toContain("/tasks");
    expect(links).toContain("/contributors");
  });

  it("hides administrative destinations from editors", () => {
    const links = hrefs(EDITOR_PERMISSIONS);

    expect(links).not.toContain("/users");
    expect(links).not.toContain("/audit");
    expect(links).not.toContain("/reports");
  });

  it("gives sales the order desk but not the ledger", () => {
    const links = hrefs(SALES_PERMISSIONS);

    expect(links).toContain("/orders");
    expect(links).toContain("/customers");
    expect(links).not.toContain("/finance");
    expect(links).not.toContain("/royalties");
    expect(links).not.toContain("/users");
  });

  it("gives org admins user management", () => {
    const links = hrefs(ORG_ADMIN_PERMISSIONS);

    expect(links).toContain("/users");
    expect(links).toContain("/audit");
    expect(links).toContain("/finance");
    expect(links).toContain("/reports");
  });

  it("hides every gated section from a user with no permissions", () => {
    // Only the ungated destinations remain: the dashboard (every role has
    // one) and the profile/settings pages.
    expect(visibleSections([]).map((s) => s.id)).toEqual(["dashboard", "more"]);
    expect(hrefs([])).toEqual(["/profile", "/settings"]);
    expect(visibleSections(undefined).map((s) => s.id)).toEqual(["dashboard", "more"]);
  });

  it("always leaves the profile and settings reachable", () => {
    for (const perms of [EDITOR_PERMISSIONS, SALES_PERMISSIONS, ORG_ADMIN_PERMISSIONS]) {
      const links = hrefs(perms);
      expect(links).toContain("/profile");
      expect(links).toContain("/settings");
    }
  });
});

describe("mobile navigation model", () => {
  it("promotes at most four destinations and adds a More slot", () => {
    const { tabs, showMore } = getMobileTabs(ORG_ADMIN_PERMISSIONS);

    expect(tabs.map((tab) => tab.href)).toEqual([
      "/dashboard",
      "/books",
      "/tasks",
      "/orders",
    ]);
    expect(showMore).toBe(true);
  });

  it("keeps every accessible destination reachable between the bar and More", () => {
    const { tabs } = getMobileTabs(ORG_ADMIN_PERMISSIONS);
    const grouped = getMenuGroups(
      ORG_ADMIN_PERMISSIONS,
      tabs.map((tab) => tab.href),
    ).flatMap((group) => group.items.map((item) => item.href));
    const reachable = new Set([...tabs.map((tab) => tab.href), ...grouped]);
    const all = getAllAccessibleItems(ORG_ADMIN_PERMISSIONS).map((item) => item.href);

    expect(reachable).toEqual(new Set(all));
  });

  it("filters the More sheet by role as well", () => {
    const { tabs } = getMobileTabs(EDITOR_PERMISSIONS);
    const grouped = getMenuGroups(
      EDITOR_PERMISSIONS,
      tabs.map((tab) => tab.href),
    ).flatMap((group) => group.items.map((item) => item.href));

    expect(grouped).not.toContain("/finance");
    expect(grouped).not.toContain("/users");
  });
});

describe("route permissions", () => {  it("maps restricted routes to the permission that guards them", () => {
    expect(permissionForPath("/orders")).toBe("orders.read");
    expect(permissionForPath("/orders/abc")).toBe("orders.read");
    expect(permissionForPath("/customers")).toBe("customers.read");
    expect(permissionForPath("/finance")).toBe("finance.read");
    expect(permissionForPath("/royalties")).toBe("royalties.read");
    expect(permissionForPath("/users")).toBe("users.read");
    expect(permissionForPath("/audit")).toBe("audit.read");
    expect(permissionForPath("/books")).toBe("books.read");
    expect(permissionForPath("/manuscripts")).toBe("manuscripts.read");
  });

  it("leaves unrestricted routes ungated", () => {
    expect(permissionForPath("/dashboard")).toBeUndefined();
    expect(permissionForPath("/profile")).toBeUndefined();
    expect(permissionForPath("/settings")).toBeUndefined();
  });

  it("declares a permission for every gated destination", () => {
    for (const section of NAV_SECTIONS) {
      for (const child of section.children ?? []) {
        if (child.href === "/profile" || child.href === "/settings") continue;
        expect(child.permission, `${child.href} must declare a permission`).toBeTruthy();
      }
    }
  });
});
