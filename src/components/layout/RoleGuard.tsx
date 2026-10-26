"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/permissions";
import { permissionForPath } from "@/components/layout/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

/**
 * Blocks a destination the caller's role may not open.
 *
 * <p>Hiding a link is not access control — a user can still type the URL, or
 * call the API directly. The API enforces the same rules independently; this
 * guard makes the UI honest about them, so a restricted page shows a clear
 * explanation instead of a broken screen.
 */
export function RoleGuard({
  permission,
  children,
}: {
  /** Permission required to view this destination. */
  permission: string;
  children: ReactNode;
}) {
  const { permissions, session, loading } = useAuth();
  const router = useRouter();

  // The session (and therefore the permission list) is still loading.
  if (loading) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center p-6">
        <Spinner label="Checking your access…" />
      </div>
    );
  }

  if (hasPermission(permissions as never, permission as never)) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col gap-4">
      <EmptyState
        title="Not available for your role"
        description={
          session
            ? `Your role (${session.role.replace(/_/g, " ").toLowerCase()}) does not include access to this area. Ask an organization administrator if you need it.`
            : "Your role does not include access to this area. Ask an organization administrator if you need it."
        }
      />
      <div>
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}

/**
 * Guards the current route using the permission declared for it in the
 * navigation map. Applied to pages whose access is role-scoped.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const permission = permissionForPath(pathname);
  if (!permission) return <>{children}</>;
  return <RoleGuard permission={permission}>{children}</RoleGuard>;
}
