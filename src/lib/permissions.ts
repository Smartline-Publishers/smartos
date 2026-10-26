import type { Permission, Role } from "@/types/auth";

/**
 * Permission checks for the web app.
 *
 * <p>The caller's permission list comes from the server (`GET /auth/me`), which
 * derives it from the same role matrix the API enforces. The UI therefore
 * never offers an action the API would reject, and never hides one it would
 * allow.
 */
export function hasPermission(
  permissions: Permission[] | undefined,
  permission: Permission,
): boolean {
  return !!permissions?.includes(permission);
}

export function hasAnyPermission(
  permissions: Permission[] | undefined,
  required: Permission[],
): boolean {
  if (!permissions || permissions.length === 0) return false;
  return required.some((p) => permissions.includes(p));
}

export function hasAllPermissions(
  permissions: Permission[] | undefined,
  required: Permission[],
): boolean {
  if (!permissions) return false;
  return required.every((p) => permissions.includes(p));
}

/** True when the caller may administer the organization. */
export function isAdmin(roles: Role[] | undefined): boolean {
  return !!roles?.some((r) => r === "ORG_ADMIN" || r === "PLATFORM_ADMIN");
}

/** Human-readable label for a role, used in badges and menus. */
export function roleLabel(role: string): string {
  return role.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}
