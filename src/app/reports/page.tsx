"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import {
  downloadSalesCsv,
  getEditorialReport,
  getRoyaltyLiability,
  getSalesReport,
  type EditorialReport,
  type RoyaltyLiability,
  type SalesReport,
} from "@/features/reports/api";
import { listBooks } from "@/features/books/api";
import type { Book } from "@/types/book";
import { formatGHS } from "@/lib/format";

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export default function ReportsPage() {
  const [range, setRange] = useState(defaultRange);
  const [bookId, setBookId] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [liability, setLiability] = useState<RoyaltyLiability | null>(null);
  const [editorial, setEditorial] = useState<EditorialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, l, e, b] = await Promise.all([
        getSalesReport({ ...range, ...(bookId ? { bookId } : {}) }),
        getRoyaltyLiability(),
        getEditorialReport(30),
        listBooks({ page: 1, pageSize: 100 }),
      ]);
      setSales(s);
      setLiability(l);
      setEditorial(e);
      setBooks(b.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to, bookId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onExport = async () => {
    setExporting(true);
    setActionError(null);
    try {
      await downloadSalesCsv({ ...range, ...(bookId ? { bookId } : {}) });
    } catch (e: unknown) {
      setActionError(e instanceof Error ? `Export failed: ${e.message}` : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Reports"
            description="Sales, royalty liability and editorial throughput, computed live from system records."
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {actionError}
            </p>
          ) : null}
          {loading ? (
            <Spinner label="Loading reports…" />
          ) : error ? (
            <EmptyState title="Could not load reports" description={error} />
          ) : (
            <>
              <Card
                title="Sales by title"
                action={
                  <Button size="sm" variant="ghost" disabled={exporting} onClick={() => void onExport()}>
                    {exporting ? "Exporting…" : "Export CSV"}
                  </Button>
                }
              >
                <div className="mb-3 grid gap-3 sm:grid-cols-[180px_180px_1fr]">
                  <Input
                    label="From"
                    type="date"
                    value={range.from}
                    onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                  />
                  <Input
                    label="To"
                    type="date"
                    value={range.to}
                    onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                  />
                  <Select
                    label="Book"
                    value={bookId}
                    onChange={(e) => setBookId(e.target.value)}
                    options={[
                      { value: "", label: "All books" },
                      ...books.map((b) => ({ value: b.id, label: b.title })),
                    ]}
                  />
                </div>
                {!sales || sales.rows.length === 0 ? (
                  <EmptyState title="No sales in period" description="Fulfilled orders in the range appear here." />
                ) : (
                  <div className="shell-scroll overflow-x-auto rounded-md border border-slate-200 dark:border-neutral-800">
                    <table className="w-full border-collapse text-left text-sm">
                      <caption className="sr-only">Sales by title</caption>
                      <thead className="bg-slate-50 dark:bg-neutral-800/60">
                        <tr>
                          <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Book</th>
                          <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-neutral-300">Qty</th>
                          <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-neutral-300">Revenue</th>
                          <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-neutral-300">Refunds</th>
                          <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-neutral-300">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.rows.map((r) => (
                          <tr key={r.bookId} className="border-t border-slate-200 dark:border-neutral-800">
                            <td className="px-3 py-2 text-slate-900 dark:text-neutral-100">{r.bookTitle}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-900 dark:text-neutral-100">{r.quantity}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-neutral-300">{formatGHS(r.revenue)}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-amber-700 dark:text-amber-400">{formatGHS(r.refunds)}</td>
                            <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-neutral-100">{formatGHS(r.net)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold dark:border-neutral-600 dark:bg-neutral-800/60">
                          <td className="px-3 py-2 text-slate-900 dark:text-neutral-100">Total</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-900 dark:text-neutral-100">{sales.totalQuantity}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-900 dark:text-neutral-100">{formatGHS(sales.totalRevenue)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-amber-700 dark:text-amber-400">{formatGHS(sales.totalRefunds)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-900 dark:text-neutral-100">{formatGHS(sales.totalNet)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <div className="grid items-start gap-4 xl:grid-cols-2">
                <Card title="Royalty liability">
                  {!liability ? (
                    <EmptyState title="No data" description="Royalty statements will summarise here." />
                  ) : (
                    <dl className="grid gap-2 text-sm sm:grid-cols-3">
                      <div className="rounded-lg bg-slate-50 p-3 dark:bg-neutral-800/60">
                        <dt className="text-xs text-slate-500 dark:text-neutral-400">Draft</dt>
                        <dd className="text-lg font-bold tabular-nums text-slate-900 dark:text-neutral-100">
                          {formatGHS(liability.draftTotal)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 dark:bg-neutral-800/60">
                        <dt className="text-xs text-slate-500 dark:text-neutral-400">Approved</dt>
                        <dd className="text-lg font-bold tabular-nums text-slate-900 dark:text-neutral-100">
                          {formatGHS(liability.approvedTotal)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 dark:bg-neutral-800/60">
                        <dt className="text-xs text-slate-500 dark:text-neutral-400">Paid (all time)</dt>
                        <dd className="text-lg font-bold tabular-nums text-slate-900 dark:text-neutral-100">
                          {formatGHS(liability.paidTotal)}
                        </dd>
                      </div>
                    </dl>
                  )}
                  {liability && liability.byContributor.length > 0 ? (
                    <ul className="mt-3 flex flex-col divide-y divide-slate-100 dark:divide-neutral-800">
                      {liability.byContributor.map((c) => (
                        <li key={c.contributorId} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                          <span className="font-medium text-slate-900 dark:text-neutral-100">{c.contributorName}</span>
                          <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">
                            {formatGHS(c.pending)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Card>
                <Card title="Editorial throughput (30 days)">
                  {!editorial ? (
                    <EmptyState title="No data" description="Manuscript activity will summarise here." />
                  ) : (
                    <>
                      <p className="text-sm text-slate-600 dark:text-neutral-400">
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">{editorial.submitted}</span>{" "}
                        submitted ·{" "}
                        <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">{editorial.approved}</span>{" "}
                        approved
                      </p>
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {editorial.transitions.map((t) => (
                          <li key={t.stage} className="flex items-center gap-2 text-sm">
                            <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />
                            <span className="flex-1 text-slate-700 dark:text-neutral-300">
                              Moved to {t.stage.replace(/_/g, " ").toLowerCase()}
                            </span>
                            <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">{t.count}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
