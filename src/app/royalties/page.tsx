"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { RouteGuard } from "@/components/layout/RoleGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { MobileFab } from "@/components/ui/MobileFab";
import { Coins, FileText } from "@phosphor-icons/react";
import { ContractForm } from "@/features/royalties/ContractForm";
import { StatementForm } from "@/features/royalties/StatementForm";
import {
  approveStatement,
  createContract,
  deleteContract,
  generateStatement,
  listContracts,
  listStatements,
  payStatement,
  terminateContract,
  type CreateContractInput,
  type GenerateStatementInput,
} from "@/features/royalties/api";
import { listContributors } from "@/features/contributors/api";
import { listBooks } from "@/features/books/api";
import type { Book } from "@/types/book";
import type { Contributor } from "@/types/book";
import type { Contract, RoyaltyStatement, StatementStatus } from "@/types/finance";
import type { Page } from "@/types/api";
import { usePagedQuery } from "@/hooks/use-paged-query";
import { formatGHS } from "@/lib/format";

export default function RoyaltiesPage() {
  const query = usePagedQuery({ pageSize: 10 });
  const [status, setStatus] = useState<StatementStatus | "">("");
  const [statements, setStatements] = useState<Page<RoyaltyStatement> | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [contractOpen, setContractOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const params = query.toParams();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stmts, contractPage, bookPage, contributorPage] = await Promise.all([
        listStatements({ ...params, ...(status ? { status } : {}) }),
        listContracts({ page: 1, pageSize: 100 }),
        listBooks({ page: 1, pageSize: 100 }),
        listContributors({ page: 1, pageSize: 100 }),
      ]);
      setStatements(stmts);
      setContracts(contractPage.items);
      setBooks(bookPage.items);
      setContributors(contributorPage.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load royalties");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = useCallback(
    async (fn: () => Promise<unknown>, failure: string) => {
      setActionError(null);
      try {
        await fn();
        await refresh();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? `${failure}: ${e.message}` : failure);
      }
    },
    [refresh],
  );

  return (
    <ProtectedRoute>
      <AppShell>
        <RouteGuard><div className="flex flex-col gap-4">
          <PageHeader
            title="Royalties"
            description="Author contracts and computed statements, approved and paid forward only."
            hideActionsOnMobile
            actions={
              <>
                <Button variant="ghost" onClick={() => setStatementOpen(true)}>
                  Generate statement
                </Button>
                <Button onClick={() => setContractOpen(true)}>
                  New contract
                </Button>
              </>
            }
          />
          <MobileFab
            menuLabel="Royalty actions"
            actions={[
              {
                label: "New contract",
                icon: Coins,
                onClick: () => setContractOpen(true),
              },
              {
                label: "Generate statement",
                icon: FileText,
                onClick: () => setStatementOpen(true),
              },
            ]}
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {actionError}
            </p>
          ) : null}
          <Modal
            open={contractOpen}
            title="New contract"
            description="Agree a royalty rate with a contributor."
            onClose={() => setContractOpen(false)}
            isDirty={formDirty}
          >
            <ContractForm
              key={contractOpen ? "contract-new" : "contract-closed"}
              books={books}
              contributors={contributors}
              onSubmit={async (v: CreateContractInput) => {
                setSubmitting(true);
                try {
                  await createContract(v);
                  setContractOpen(false);
                  setFormDirty(false);
                  await refresh();
                } catch (e: unknown) {
                  setActionError(e instanceof Error ? `Could not create contract: ${e.message}` : "Could not create contract");
                } finally {
                  setSubmitting(false);
                }
              }}
              submitting={submitting}
              onCancel={() => setContractOpen(false)}
              onDirtyChange={setFormDirty}
            />
          </Modal>
          <Modal
            open={statementOpen}
            title="Generate statement"
            description="Compute a royalty statement for a contract and period."
            onClose={() => setStatementOpen(false)}
            isDirty={formDirty}
          >
            <StatementForm
              key={statementOpen ? "statement-new" : "statement-closed"}
              contracts={contracts}
              onSubmit={async (v: GenerateStatementInput) => {
                setSubmitting(true);
                try {
                  await generateStatement(v);
                  setStatementOpen(false);
                  setFormDirty(false);
                  await refresh();
                } catch (e: unknown) {
                  setActionError(e instanceof Error ? `Generation failed: ${e.message}` : "Generation failed");
                } finally {
                  setSubmitting(false);
                }
              }}
              submitting={submitting}
              onCancel={() => setStatementOpen(false)}
              onDirtyChange={setFormDirty}
            />
          </Modal>
          {loading ? (
            <Spinner label="Loading royalties…" />
          ) : error ? (
            <EmptyState title="Could not load royalties" description={error} />
          ) : (
            <>
              <ContractsCard
                contracts={contracts}
                onAction={runAction}
              />
              <Card
                title="Statements"
                action={
                  <div className="w-44">
                    <Select
                      label="Status"
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value as StatementStatus | "");
                        query.setPage(1);
                      }}
                      options={[
                        { value: "", label: "All statuses" },
                        { value: "DRAFT", label: "Draft" },
                        { value: "APPROVED", label: "Approved" },
                        { value: "PAID", label: "Paid" },
                      ]}
                    />
                  </div>
                }
              >
                {!statements || statements.items.length === 0 ? (
                  <EmptyState title="No statements" description="Generate the first statement above." />
                ) : (
                  <>
                    <ul className="flex flex-col gap-3">
                      {statements.items.map((s) => (
                        <li
                          key={s.id}
                          className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.05)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
                        >
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                              {s.periodStart} → {s.periodEnd}
                            </p>
                            <Badge status={s.status} />
                            <span className="ml-auto text-sm tabular-nums text-slate-600 dark:text-neutral-400">
                              Net {formatGHS(s.netSales)} × {(s.rateSnapshot * 100).toFixed(1)}% ={" "}
                              <span className="text-base font-bold text-slate-900 dark:text-neutral-100">
                                {formatGHS(s.payable)}
                              </span>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {s.status === "DRAFT" ? (
                              <Button
                                size="sm"
                                onClick={() => runAction(() => approveStatement(s.id), "Approve failed")}
                              >
                                Approve
                              </Button>
                            ) : null}
                            {s.status === "APPROVED" ? (
                              <Button
                                size="sm"
                                onClick={() => runAction(() => payStatement(s.id), "Payment failed")}
                              >
                                Pay now
                              </Button>
                            ) : null}
                            {s.status === "PAID" ? (
                              <span className="text-xs text-slate-500 dark:text-neutral-400">
                                Paid{s.paidAt ? ` ${new Date(s.paidAt).toLocaleDateString("en-GH")}` : ""}
                              </span>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3">
                      <Pagination
                        page={query.page}
                        pageSize={query.pageSize}
                        total={statements.total}
                        onPageChange={query.setPage}
                      />
                    </div>
                  </>
                )}
              </Card>
            </>
          )}
        </div>
      </RouteGuard>
      </AppShell>
    </ProtectedRoute>
  );
}

function ContractsCard({
  contracts,
  onAction,
}: {
  contracts: Contract[];
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
}) {
  return (
    <Card title="Contracts">
      <ul className="flex flex-col divide-y divide-slate-100 dark:divide-neutral-800">
        {contracts.length === 0 ? (
          <li className="py-2 text-sm text-slate-400 dark:text-neutral-500">No contracts yet</li>
        ) : (
          contracts.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">
                  {c.contributorName ?? "Contributor"}
                </p>
                <p className="text-xs tabular-nums text-slate-500 dark:text-neutral-400">
                  {(c.royaltyRate * 100).toFixed(1)}% · since {c.startDate}
                </p>
              </div>
              <Badge status={c.status} />
              {c.status === "ACTIVE" ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAction(() => terminateContract(c.id), "Terminate failed")}
                  >
                    Terminate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    onClick={() => {
                      if (window.confirm("Delete this contract?")) {
                        void onAction(() => deleteContract(c.id), "Delete failed");
                      }
                    }}
                  >
                    Delete
                  </Button>
                </>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
