"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { TransactionForm } from "@/features/finance/TransactionForm";
import { BudgetForm } from "@/features/finance/BudgetForm";
import {
  createBudget,
  deleteBudget,
  listBudgets,
  listTransactions,
  recordTransaction,
  type CreateBudgetInput,
  type CreateTransactionInput,
} from "@/features/finance/api";
import { listOrders } from "@/features/sales/api";
import type { Budget, Transaction, TransactionType } from "@/types/finance";
import type { Order } from "@/types/sales";
import type { Page } from "@/types/api";
import { usePagedQuery } from "@/hooks/use-paged-query";
import { formatGHS } from "@/lib/format";

const TYPE_TONE: Record<TransactionType, string> = {
  SALE: "text-emerald-700 dark:text-emerald-400",
  REFUND: "text-amber-700 dark:text-amber-400",
  EXPENSE: "text-rose-700 dark:text-rose-400",
  ROYALTY_PAYOUT: "text-violet-700 dark:text-violet-400",
};

export default function FinancePage() {
  const query = usePagedQuery({ pageSize: 10 });
  const [type, setType] = useState<TransactionType | "">("");
  const [data, setData] = useState<Page<Transaction> | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [fulfilledOrders, setFulfilledOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const params = query.toParams();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txns, budgetPage, orders] = await Promise.all([
        listTransactions({ ...params, ...(type ? { type } : {}) }),
        listBudgets({ page: 1, pageSize: 50 }),
        listOrders({ page: 1, pageSize: 100, status: "FULFILLED" }),
      ]);
      setData(txns);
      setBudgets(budgetPage.items);
      setFulfilledOrders(orders.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load finance data");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize, type]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onRecord = async (values: CreateTransactionInput) => {
    setSubmitting(true);
    try {
      await recordTransaction(values);
      setRecordOpen(false);
      setFormDirty(false);
      await refresh();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? `Could not record transaction: ${e.message}` : "Could not record transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const onCreateBudget = async (values: CreateBudgetInput) => {
    setSubmitting(true);
    try {
      await createBudget(values);
      setBudgetOpen(false);
      setFormDirty(false);
      await refresh();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? `Could not create budget: ${e.message}` : "Could not create budget");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Finance"
            description="Immutable transaction ledger and budgets with planned-versus-actual tracking."
            actions={
              <>
                <Button variant="ghost" onClick={() => setBudgetOpen(true)}>
                  New budget
                </Button>
                <Button onClick={() => setRecordOpen(true)}>
                  Record transaction
                </Button>
              </>
            }
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {actionError}
            </p>
          ) : null}
          <Modal
            open={recordOpen}
            title="Record transaction"
            description="Record an expense or a refund against a fulfilled order."
            onClose={() => setRecordOpen(false)}
            isDirty={formDirty}
          >
            <TransactionForm
              key={recordOpen ? "txn-new" : "txn-closed"}
              fulfilledOrders={fulfilledOrders}
              onSubmit={onRecord}
              submitting={submitting}
              onCancel={() => setRecordOpen(false)}
              onDirtyChange={setFormDirty}
            />
          </Modal>
          <Modal
            open={budgetOpen}
            title="New budget"
            description="Plan spending for a category and period."
            onClose={() => setBudgetOpen(false)}
            isDirty={formDirty}
          >
            <BudgetForm
              key={budgetOpen ? "budget-new" : "budget-closed"}
              onSubmit={onCreateBudget}
              submitting={submitting}
              onCancel={() => setBudgetOpen(false)}
              onDirtyChange={setFormDirty}
            />
          </Modal>
          {loading ? (
            <Spinner label="Loading finance…" />
          ) : error ? (
            <EmptyState title="Could not load finance" description={error} />
          ) : (
            <>
              <BudgetsCard
                budgets={budgets}
                onDelete={async (id) => {
                  setActionError(null);
                  try {
                    await deleteBudget(id);
                    await refresh();
                  } catch (e: unknown) {
                    setActionError(e instanceof Error ? `Delete failed: ${e.message}` : "Delete failed");
                  }
                }}
              />
              <Card
                title="Ledger"
                action={
                  <div className="w-44">
                    <Select
                      label="Type"
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value as TransactionType | "");
                        query.setPage(1);
                      }}
                      options={[
                        { value: "", label: "All types" },
                        { value: "SALE", label: "Sales" },
                        { value: "REFUND", label: "Refunds" },
                        { value: "EXPENSE", label: "Expenses" },
                        { value: "ROYALTY_PAYOUT", label: "Royalty payouts" },
                      ]}
                    />
                  </div>
                }
              >
                {!data || data.items.length === 0 ? (
                  <EmptyState title="No transactions" description="Sales post automatically on fulfilment; expenses and refunds are recorded manually." />
                ) : (
                  <>
                    <div className="shell-scroll overflow-x-auto rounded-md border border-slate-200 dark:border-neutral-800">
                      <table className="w-full border-collapse text-left text-sm">
                        <caption className="sr-only">Financial transactions</caption>
                        <thead className="bg-slate-50 dark:bg-neutral-800/60">
                          <tr>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Type</th>
                            <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-neutral-300">Amount</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Category</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Description</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.items.map((t) => (
                            <tr key={t.id} className="border-t border-slate-200 dark:border-neutral-800">
                              <td className="px-3 py-2">
                                <Badge status={t.type} />
                              </td>
                              <td className={`px-3 py-2 text-right font-semibold tabular-nums ${TYPE_TONE[t.type]}`}>
                                {formatGHS(t.amount)}
                              </td>
                              <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{t.category ?? "—"}</td>
                              <td className="max-w-56 truncate px-3 py-2 text-slate-600 dark:text-neutral-400">{t.description ?? "—"}</td>
                              <td className="px-3 py-2 text-xs text-slate-500 dark:text-neutral-400">
                                {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-GH") : "—"}
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
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function BudgetsCard({
  budgets,
  onDelete,
}: {
  budgets: Budget[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <Card title="Budgets">
      <ul className="flex flex-col divide-y divide-slate-100 dark:divide-neutral-800">
        {budgets.length === 0 ? (
          <li className="py-2 text-sm text-slate-400 dark:text-neutral-500">No budgets yet</li>
        ) : (
          budgets.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">{b.name}</p>
                <p className="text-xs tabular-nums text-slate-500 dark:text-neutral-400">
                  Planned {formatGHS(b.plannedAmount)} · Actual {formatGHS(b.actualAmount)} ·
                  Variance{" "}
                  <span className={b.variance >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}>
                    {formatGHS(b.variance)}
                  </span>
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                onClick={() => {
                  if (window.confirm(`Delete budget "${b.name}"?`)) {
                    void onDelete(b.id);
                  }
                }}
              >
                Delete
              </Button>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}
