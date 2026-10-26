"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { getSummary } from "@/features/dashboard/api";
import { ApiError } from "@/lib/api-client";
import type { DashboardSummary } from "@/types/dashboard";
import { RoleBasedDashboard } from "@/components/dashboard/RoleDashboard";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user, session, permissions, logout } = useAuth();

  useEffect(() => {
    let alive = true;
    getSummary().then(
      (s) => {
        if (alive) setSummary(s);
      },
      (e: unknown) => {
        if (!alive) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          logout();
        } else {
          setLoadError(e instanceof Error ? e.message : "Failed to load summary");
        }
      },
    );
    return () => {
      alive = false;
    };
  }, [logout]);

  return (
    <ProtectedRoute>
      <AppShell>
        <RoleBasedDashboard
          summary={summary}
          loadError={loadError}
          user={user}
          session={session}
          permissions={permissions}
          logout={logout}
        />
      </AppShell>
    </ProtectedRoute>
  );
}