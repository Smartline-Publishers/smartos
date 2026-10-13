"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import {
  CreateBudgetSchema,
  CreateTransactionSchema,
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
  SALE: "text-emerald-700",
  REFUND: "text-amber-700",
  EXPENSE: "text-rose-700",
  ROYALTY_PAYOUT: "text-violet-700",
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
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Finance"
            description="Immutable transaction ledger and budgets with planned-versus-actual tracking."
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}
          {loading ? (
            <Spinner label="Loading finance…" />
          ) : error ? (
            <EmptyState title="Could not load finance" description={error} />
          ) : (
            <>
              <div className="grid items-start gap-4 xl:grid-cols-2">
                <RecordFormCard
                  fulfilledOrders={fulfilledOrders}
                  onAction={runAction}
                />
                <BudgetCard budgets={budgets} onAction={runAction} />
              </div>
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
                    <div className="overflow-x-auto rounded-md border border-slate-200">
                      <table className="w-full border-collapse text-left text-sm">
                        <caption className="sr-only">Financial transactions</caption>
                        <thead className="bg-slate-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Type</th>
                            <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700">Amount</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Category</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Description</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.items.map((t) => (
                            <tr key={t.id} className="border-t border-slate-200">
                              <td className="px-3 py-2">
                                <Badge status={t.type} />
                              </td>
                              <td className={`px-3 py-2 text-right font-semibold tabular-nums ${TYPE_TONE[t.type]}`}>
                                {formatGHS(t.amount)}
                              </td>
                              <td className="px-3 py-2 text-slate-700">{t.category ?? "—"}</td>
                              <td className="max-w-56 truncate px-3 py-2 text-slate-600">{t.description ?? "—"}</td>
                              <td className="px-3 py-2 text-xs text-slate-500">
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

function RecordFormCard({
  fulfilledOrders,
  onAction,
}: {
  fulfilledOrders: Order[];
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: { type: "EXPENSE", amount: 0, category: "", referenceId: "", description: "" },
  });
  const kind = watch("type");

  return (
    <Card title="Record expense or refund">
      <form
        onSubmit={handleSubmit(async (v) => {
          await onAction(async () => {
            await recordTransaction(v);
            reset();
          }, "Could not record transaction");
        })}
        className="grid gap-3 sm:grid-cols-2"
        aria-label="Record transaction form"
      >
        <Select
          label="Type"
          error={errors.type?.message}
          options={[
            { value: "EXPENSE", label: "Expense" },
            { value: "REFUND", label: "Refund (needs order)" },
          ]}
          {...register("type")}
        />
        <Input
          label="Amount (GHS)"
          type="number"
          min={0}
          step="0.01"
          required
          error={errors.amount?.message}
          {...register("amount")}
        />
        {kind === "REFUND" ? (
          <div className="sm:col-span-2">
            <Select
              label="Fulfilled order"
              required
              error={errors.referenceId?.message}
              options={[
                { value: "", label: "Choose an order" },
                ...fulfilledOrders.map((o) => ({
                  value: o.id,
                  label: `${o.customerName ?? "Order"} · ${formatGHS(o.total)}`,
                })),
              ]}
              {...register("referenceId")}
            />
          </div>
        ) : null}
        <Input label="Category" hint="Optional" error={errors.category?.message} {...register("category")} />
        <Input label="Description" hint="Optional" error={errors.description?.message} {...register("description")} />
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs text-slate-500">
            Sales and royalty payouts are posted by the system, never by hand.
          </p>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Recording…" : "Record"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function BudgetCard({
  budgets,
  onAction,
}: {
  budgets: Budget[];
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateBudgetInput>({
    resolver: zodResolver(CreateBudgetSchema),
    defaultValues: { name: "", category: "", periodStart: "", periodEnd: "", plannedAmount: 0 },
  });

  return (
    <Card title="Budgets">
      <form
        onSubmit={handleSubmit(async (v) => {
          await onAction(async () => {
            await createBudget(v);
            reset();
          }, "Could not create budget");
        })}
        className="grid gap-3 sm:grid-cols-2"
        aria-label="New budget form"
      >
        <div className="sm:col-span-2">
          <Input label="Name" required error={errors.name?.message} {...register("name")} />
        </div>
        <Input label="Category" hint="Matches expense category" error={errors.category?.message} {...register("category")} />
        <Input
          label="Planned (GHS)"
          type="number"
          min={0}
          step="0.01"
          required
          error={errors.plannedAmount?.message}
          {...register("plannedAmount")}
        />
        <Input label="Period start" type="date" required error={errors.periodStart?.message} {...register("periodStart")} />
        <Input label="Period end" type="date" required error={errors.periodEnd?.message} {...register("periodEnd")} />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create budget"}
          </Button>
        </div>
      </form>
      <ul className="mt-3 flex flex-col divide-y divide-slate-100">
        {budgets.length === 0 ? (
          <li className="py-2 text-sm text-slate-400">No budgets yet</li>
        ) : (
          budgets.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{b.name}</p>
                <p className="text-xs tabular-nums text-slate-500">
                  Planned {formatGHS(b.plannedAmount)} · Actual {formatGHS(b.actualAmount)} ·
                  Variance{" "}
                  <span className={b.variance >= 0 ? "text-emerald-700" : "text-rose-700"}>
                    {formatGHS(b.variance)}
                  </span>
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm(`Delete budget "${b.name}"?`)) {
                    void onAction(() => deleteBudget(b.id), "Delete failed");
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
