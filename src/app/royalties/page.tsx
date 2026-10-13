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
  CreateContractSchema,
  GenerateStatementSchema,
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
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Royalties"
            description="Author contracts and computed statements, approved and paid forward only."
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}
          {loading ? (
            <Spinner label="Loading royalties…" />
          ) : error ? (
            <EmptyState title="Could not load royalties" description={error} />
          ) : (
            <>
              <div className="grid items-start gap-4 xl:grid-cols-2">
                <ContractCard
                  contracts={contracts}
                  books={books}
                  contributors={contributors}
                  onAction={runAction}
                />
                <StatementGenerateCard contracts={contracts} onAction={runAction} />
              </div>
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
                          className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.05)]"
                        >
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {s.periodStart} → {s.periodEnd}
                            </p>
                            <Badge status={s.status} />
                            <span className="ml-auto text-sm tabular-nums text-slate-600">
                              Net {formatGHS(s.netSales)} × {(s.rateSnapshot * 100).toFixed(1)}% ={" "}
                              <span className="text-base font-bold text-slate-900">
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
                              <span className="text-xs text-slate-500">
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
      </AppShell>
    </ProtectedRoute>
  );
}

function ContractCard({
  contracts,
  books,
  contributors,
  onAction,
}: {
  contracts: Contract[];
  books: Book[];
  contributors: Contributor[];
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateContractInput>({
    resolver: zodResolver(CreateContractSchema),
    defaultValues: { contributorId: "", bookId: "", royaltyRate: 0.1, startDate: "", endDate: "" },
  });

  return (
    <Card title="Contracts">
      <form
        onSubmit={handleSubmit(async (v) => {
          await onAction(async () => {
            await createContract(v);
            reset();
          }, "Could not create contract");
        })}
        className="grid gap-3 sm:grid-cols-2"
        aria-label="New contract form"
      >
        <Select
          label="Contributor"
          required
          error={errors.contributorId?.message}
          options={[
            { value: "", label: "Choose a contributor" },
            ...contributors.map((c) => ({ value: c.id, label: c.fullName })),
          ]}
          {...register("contributorId")}
        />
        <Select
          label="Book (optional — empty means all the contributor's books)"
          error={errors.bookId?.message}
          options={[{ value: "", label: "All books" }, ...books.map((b) => ({ value: b.id, label: b.title }))]}
          {...register("bookId")}
        />
        <Input
          label="Royalty rate (0–1)"
          type="number"
          min={0}
          max={1}
          step="0.01"
          required
          hint="0.10 = 10%"
          error={errors.royaltyRate?.message}
          {...register("royaltyRate")}
        />
        <Input label="Start date" type="date" required error={errors.startDate?.message} {...register("startDate")} />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create contract"}
          </Button>
        </div>
      </form>
      <ul className="mt-3 flex flex-col divide-y divide-slate-100">
        {contracts.length === 0 ? (
          <li className="py-2 text-sm text-slate-400">No contracts yet</li>
        ) : (
          contracts.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {c.contributorName ?? "Contributor"}
                </p>
                <p className="text-xs tabular-nums text-slate-500">
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
                    className="text-red-700 hover:bg-red-50"
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

function StatementGenerateCard({
  contracts,
  onAction,
}: {
  contracts: Contract[];
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GenerateStatementInput>({
    resolver: zodResolver(GenerateStatementSchema),
    defaultValues: { contractId: "", periodStart: "", periodEnd: "" },
  });

  return (
    <Card title="Generate statement">
      <form
        onSubmit={handleSubmit(async (v) => {
          await onAction(async () => {
            await generateStatement(v);
            reset();
          }, "Generation failed");
        })}
        className="grid gap-3 sm:grid-cols-2"
        aria-label="Generate statement form"
      >
        <div className="sm:col-span-2">
          <Select
            label="Contract"
            required
            error={errors.contractId?.message}
            options={[
              { value: "", label: "Choose a contract" },
              ...contracts
                .filter((c) => c.status === "ACTIVE")
                .map((c) => ({
                  value: c.id,
                  label: `${c.contributorName ?? "Contributor"} · ${(c.royaltyRate * 100).toFixed(1)}%`,
                })),
            ]}
            {...register("contractId")}
          />
        </div>
        <Input label="Period start" type="date" required error={errors.periodStart?.message} {...register("periodStart")} />
        <Input label="Period end" type="date" required error={errors.periodEnd?.message} {...register("periodEnd")} />
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs text-slate-500">
            Net = fulfilled sales minus refunds in the period; payable = net × rate. Snapshotted at generation.
          </p>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Generating…" : "Generate"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
