"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/hooks/use-auth";
import { listAuditLogs, type AuditLog } from "@/features/audit/api";
import type { Page } from "@/types/api";
import { usePagedQuery } from "@/hooks/use-paged-query";
import { formatDateTime } from "@/lib/format";

export default function AuditPage() {
  const { user } = useAuth();
  const isAdmin =
    user !== null &&
    (user.roles.includes("ORG_ADMIN") || user.roles.includes("PLATFORM_ADMIN"));
  const query = usePagedQuery({ pageSize: 20 });
  const [data, setData] = useState<Page<AuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = query.toParams();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listAuditLogs(params));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize]);

  useEffect(() => {
    if (isAdmin) void refresh();
    else setLoading(false);
  }, [refresh, isAdmin]);

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Audit log"
            description="Who changed what, and when. Newest first; entries are append-only."
          />
          {!isAdmin ? (
            <EmptyState
              title="Restricted"
              description="Only organization and platform admins can view the audit log."
            />
          ) : loading ? (
            <Spinner label="Loading audit log…" />
          ) : error ? (
            <EmptyState title="Could not load audit log" description={error} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="No audit entries yet" description="Mutations across the system will appear here." />
          ) : (
            <Card title="Entries">
              <div className="shell-scroll overflow-x-auto rounded-md border border-slate-200 dark:border-neutral-800">
                <table className="w-full border-collapse text-left text-sm">
                  <caption className="sr-only">Audit log entries</caption>
                  <thead className="bg-slate-50 dark:bg-neutral-800/60">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Actor</th>
                      <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Action</th>
                      <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Record</th>
                      <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((entry) => (
                      <tr key={entry.id} className="border-t border-slate-200 dark:border-neutral-800">
                        <td className="px-3 py-2 text-slate-900 dark:text-neutral-100">
                          {entry.actorName ?? "System"}
                        </td>
                        <td className="px-3 py-2 font-mono text-[13px] text-slate-700 dark:text-neutral-300">
                          {entry.action}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500 dark:text-neutral-400">
                          {[entry.entityType, entry.entityId?.slice(0, 8)]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs tabular-nums text-slate-500 dark:text-neutral-400">
                          {formatDateTime(entry.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <Pagination
                  page={query.page}
                  pageSize={query.pageSize}
                  total={data.total}
                  onPageChange={query.setPage}
                />
              </div>
            </Card>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
