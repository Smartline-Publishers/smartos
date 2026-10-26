import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/AppShell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "admin@acme.test", orgId: "o1", roles: ["ORG_ADMIN"] },
    session: {
      userId: "u1",
      organizationId: "o1",
      email: "admin@acme.test",
      fullName: "Admin User",
      role: "ORG_ADMIN",
      roles: ["ORG_ADMIN"],
      permissions: [
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
        "reports.editorial.read",
        "users.read",
        "users.write",
        "invites.manage",
        "audit.read",
        "org.settings.write",
      ],
      assignableRoles: ["ORG_ADMIN", "EDITOR", "VIEWER"],
    },
    permissions: [
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
      "reports.editorial.read",
      "users.read",
      "users.write",
      "invites.manage",
      "audit.read",
      "org.settings.write",
    ],
    loading: false,
    logout: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-org", () => ({
  useOrg: () => ({
    org: null,
    profile: null,
    onboarding: null,
    loading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/components/layout/ThemeSelector", () => ({
  ThemeSelector: () => null,
}));

describe("app shell layout", () => {
  it("places the sidebar beside the scrolling main region on desktop", () => {
    const { container } = render(
      <AppShell>
        <p>content</p>
      </AppShell>,
    );

    // Regression: without md:flex-row the full-height sidebar consumes the
    // column layout and the main region collapses to 0px, producing a blank
    // page behind the sidebar.
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("md:flex-row");
    expect(screen.getByRole("main").contains(screen.getByText("content"))).toBe(true);
  });
});

describe("sidebar sections", () => {
  it("expands only one dropdown at a time", () => {
    render(
      <AppShell>
        <p>content</p>
      </AppShell>,
    );

    const content = screen.getByRole("button", { name: "Expand Content section" });
    const operations = screen.getByRole("button", { name: "Expand Operations section" });

    fireEvent.click(content);
    expect(content.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(operations);
    expect(operations.getAttribute("aria-expanded")).toBe("true");
    expect(content.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(operations);
    expect(operations.getAttribute("aria-expanded")).toBe("false");
  });
});
