"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { getSummary } from "@/features/dashboard/api";
import { formatGHS } from "@/lib/format";
import type { DashboardSummary } from "@/types/dashboard";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let alive = true;
    getSummary().then((s) => {
      if (alive) setSummary(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4" aria-live="polite">
          <h1 className="text-xl font-bold">Dashboard</h1>
          {!summary ? (
            <Spinner label="Loading summary…" />
          ) : summary.stale ? (
            <EmptyState
              title="API unavailable"
              description="Could not reach the backend. Showing an empty summary — check NEXT_PUBLIC_API_URL and try again."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card title="Total books">
                <p className="text-2xl font-bold">{summary.totalBooks}</p>
              </Card>
              <Card title="Published">
                <p className="text-2xl font-bold">{summary.publishedBooks}</p>
              </Card>
              <Card title="Contributors">
                <p className="text-2xl font-bold">{summary.totalContributors}</p>
              </Card>
              <Card title="Pending royalties">
                <p className="text-2xl font-bold">{formatGHS(summary.pendingRoyalties)}</p>
              </Card>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
