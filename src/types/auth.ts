/**
 * Mirrors the backend `Permission` enum. The web app never invents its own
 * access rules: the server sends the caller's effective permission list in
 * `GET /api/v1/auth/me`, and the UI renders from that.
 */
export type Permission =
  | "books.read"
  | "books.write"
  | "books.delete"
  | "manuscripts.read"
  | "manuscripts.write"
  | "manuscripts.delete"
  | "contributors.read"
  | "contributors.write"
  | "contributors.delete"
  | "tasks.read"
  | "tasks.write"
  | "production.read"
  | "production.write"
  | "inventory.read"
  | "inventory.write"
  | "warehouses.read"
  | "warehouses.write"
  | "orders.read"
  | "orders.write"
  | "customers.read"
  | "customers.write"
  | "finance.read"
  | "finance.write"
  | "royalties.read"
  | "royalties.write"
  | "reports.sales.read"
  | "reports.editorial.read"
  | "users.read"
  | "users.write"
  | "invites.manage"
  | "audit.read"
  | "org.settings.write"
  | "org.plan.write";

/** Mirrors the backend `Role` enum. */
export type Role =
  | "PLATFORM_ADMIN"
  | "ORG_ADMIN"
  | "EDITOR"
  | "DESIGNER"
  | "PRODUCTION"
  | "WAREHOUSE"
  | "SALES"
  | "FINANCE"
  | "AUTHOR"
  | "VIEWER";

export interface SessionInfo {
  userId: string;
  organizationId: string;
  email: string;
  fullName: string;
  role: Role;
  roles: Role[];
  /** Effective permissions for the caller's role, from the server. */
  permissions: Permission[];
  /** Roles the caller may assign to other users in their organization. */
  assignableRoles: Role[];
}

export interface User {
  id: string;
  email: string;
  orgId: string;
  roles: Role[];
  displayName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
