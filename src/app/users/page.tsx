"use client";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/hooks/use-auth";

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin =
    user !== null &&
    (user.roles.includes("ORG_ADMIN") || user.roles.includes("PLATFORM_ADMIN"));

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Users"
            description="Staff accounts and their access roles."
          />
          {!isAdmin ? (
            <EmptyState
              title="Restricted"
              description="Only organization and platform admins can view the user list."
            />
          ) : (
            <EmptyState
              title="No users loaded"
              description="Wire this table to GET /users once the backend endpoint is available."
            />
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
