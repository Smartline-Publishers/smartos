"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { RouteGuard } from "@/components/layout/RoleGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/hooks/use-auth";
import { listAuditLogs, type AuditLog } from "@/features/audit/api";
import { listLegalAcceptances, type LegalAcceptance } from "@/features/legal/api";
import type { Page } from "@/types/api";
import { usePagedQuery } from "@/hooks/use-paged-query";
import { formatDateTime } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";

export default function AuditPage() {
  const { permissions } = useAuth();
  const canViewAudit = hasPermission(permissions, "audit.read");
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
    if (canViewAudit) void refresh();
    else setLoading(false);
  }, [refresh, canViewAudit]);

  return (
    <ProtectedRoute>
      <AppShell>
        <RouteGuard><div className="flex flex-col gap-4">
          <PageHeader
            title="Audit log"
            description="Who changed what, and when. Newest first; entries are append-only."
          />
          {!canViewAudit ? (
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
          {canViewAudit ? <LegalAcceptanceEvidence /> : null}
        </div>
      </RouteGuard>
      </AppShell>
    </ProtectedRoute>
  );
}

const CONTEXT_LABEL: Record<LegalAcceptance["context"], string> = {
  REGISTRATION: "Registration",
  INVITE_ACCEPTANCE: "Invite acceptance",
};

/**
 * Immutable consent evidence, kept separate from the mutation audit log.
 * Records the exact document version and content hash the user accepted.
 */
function LegalAcceptanceEvidence() {
  const query = usePagedQuery({ pageSize: 10 });
  const [data, setData] = useState<Page<LegalAcceptance> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = query.toParams();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listLegalAcceptances(params));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load legal acceptances");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Card title="Legal acceptance evidence">
      <p className="mb-3 text-[13px] leading-relaxed text-muted dark:text-neutral-400">
        Immutable records of the exact Terms of Service and Privacy Policy version each user
        accepted, captured during registration or invitation acceptance. Content hashes let you
        verify that a published version has not been altered.
      </p>
      {loading ? (
        <Spinner label="Loading legal acceptances…" />
      ) : error ? (
        <EmptyState title="Could not load legal acceptances" description={error} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No legal acceptances yet"
          description="Acceptances appear here as users register or join the organization."
        />
      ) : (
        <>
          <div className="shell-scroll overflow-x-auto rounded-md border border-slate-200 dark:border-neutral-800">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Legal acceptance evidence</caption>
              <thead className="bg-slate-50 dark:bg-neutral-800/60">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">User</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Document</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Version</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Context</th>
                  <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Accepted</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-200 dark:border-neutral-800">
                    <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-neutral-300">
                      {entry.userId.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2 text-slate-900 dark:text-neutral-100">
                      {entry.documentCode === "TERMS_OF_SERVICE" ? "Terms of Service" : "Privacy Policy"}
                    </td>
                    <td className="px-3 py-2 font-mono text-[13px] text-slate-700 dark:text-neutral-300">
                      {entry.documentVersion}
                      <span
                        className="mt-0.5 block text-[10.5px] text-slate-400 dark:text-neutral-500"
                        title={entry.contentHash}
                      >
                        hash {entry.contentHash.slice(0, 10)}…
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500 dark:text-neutral-400">
                      {CONTEXT_LABEL[entry.context] ?? entry.context}
                    </td>
                    <td className="px-3 py-2 text-xs tabular-nums text-slate-500 dark:text-neutral-400">
                      {formatDateTime(entry.acceptedAt)}
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
        </>
      )}
    </Card>
  );
}
