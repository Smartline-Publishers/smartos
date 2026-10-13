"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
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
  CreateOrderSchema,
  cancelOrder,
  confirmOrder,
  createOrder,
  listCustomers,
  listOrders,
} from "@/features/sales/api";
import { listBooks } from "@/features/books/api";
import type { Book } from "@/types/book";
import type { Customer } from "@/types/sales";
import { ORDER_STATUSES, orderStatusLabel, type Order, type OrderStatus } from "@/types/sales";
import type { Page } from "@/types/api";
import { usePagedQuery } from "@/hooks/use-paged-query";
import { formatGHS } from "@/lib/format";

interface OrderRow {
  bookId: string;
  quantity: string;
  unitPrice: string;
}

const EMPTY_ROW: OrderRow = { bookId: "", quantity: "1", unitPrice: "" };

export default function OrdersPage() {
  const query = usePagedQuery({ pageSize: 10 });
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [data, setData] = useState<Page<Order> | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [rows, setRows] = useState<OrderRow[]>([{ ...EMPTY_ROW }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const params = query.toParams();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orders, bookPage, customerPage] = await Promise.all([
        listOrders({ ...params, ...(status ? { status } : {}) }),
        listBooks({ page: 1, pageSize: 100 }),
        listCustomers({ page: 1, pageSize: 100 }),
      ]);
      setData(orders);
      setBooks(bookPage.items);
      setCustomers(customerPage.items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
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

  const previewTotal = rows.reduce(
    (n, r) => n + (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0),
    0,
  );

  const setRow = (i: number, patch: Partial<OrderRow>) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = CreateOrderSchema.safeParse({
      customerId,
      items: rows.map((r) => ({
        bookId: r.bookId,
        quantity: Number(r.quantity),
        unitPrice: Number(r.unitPrice),
      })),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the order form");
      return;
    }
    setCreating(true);
    try {
      await runAction(async () => {
        await createOrder(parsed.data);
        setCustomerId("");
        setRows([{ ...EMPTY_ROW }]);
        query.setPage(1);
      }, "Could not create order");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Orders"
            description="Customer orders from draft to fulfilment. Totals are computed by the server."
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}
          <Card title="New order">
            <form onSubmit={onCreate} className="flex flex-col gap-3" aria-label="New order form">
              <div className="max-w-sm">
                <Select
                  label="Customer"
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  options={[
                    { value: "", label: "Choose a customer" },
                    ...customers.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>
              {rows.map((row, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-[1fr_110px_140px_auto]">
                  <Select
                    label={i === 0 ? "Book" : `Item ${i + 1} book`}
                    value={row.bookId}
                    onChange={(e) => setRow(i, { bookId: e.target.value })}
                    options={[
                      { value: "", label: "Choose a book" },
                      ...books.map((b) => ({ value: b.id, label: b.title })),
                    ]}
                  />
                  <Input
                    label={i === 0 ? "Qty" : `Item ${i + 1} quantity`}
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => setRow(i, { quantity: e.target.value })}
                  />
                  <Input
                    label={i === 0 ? "Unit price (GHS)" : `Item ${i + 1} unit price`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.unitPrice}
                    onChange={(e) => setRow(i, { unitPrice: e.target.value })}
                  />
                  <div className="flex items-end">
                    {rows.length > 1 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                        aria-label={`Remove item ${i + 1}`}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {formError ? (
                <p role="alert" className="text-sm text-red-600">
                  {formError}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="ghost" onClick={() => setRows((prev) => [...prev, { ...EMPTY_ROW }])}>
                  + Add item
                </Button>
                <p className="text-sm text-slate-600" aria-live="polite">
                  Estimate:{" "}
                  <span className="font-semibold tabular-nums text-slate-900">
                    {formatGHS(previewTotal)}
                  </span>{" "}
                  <span className="text-xs">(server computes the final total)</span>
                </p>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create order"}
                </Button>
              </div>
            </form>
          </Card>

          <div className="w-full sm:w-56">
            <Select
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as OrderStatus | "");
                query.setPage(1);
              }}
              options={[
                { value: "", label: "All statuses" },
                ...ORDER_STATUSES.map((s) => ({ value: s, label: orderStatusLabel(s) })),
              ]}
            />
          </div>

          {loading ? (
            <Spinner label="Loading orders…" />
          ) : error ? (
            <EmptyState title="Could not load orders" description={error} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="No orders found" description="Try a different status filter." />
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {data.items.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-[0_1px_2px_rgb(15_23_42/0.05)]"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-sm font-semibold text-brand-700 hover:underline"
                      >
                        {o.customerName ?? "Order"} · {o.items.length}{" "}
                        {o.items.length === 1 ? "item" : "items"}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-GH") : ""}
                      </p>
                    </div>
                    <Badge status={o.status} />
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      {formatGHS(o.total)}
                    </span>
                    {o.status === "DRAFT" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => runAction(() => confirmOrder(o.id), "Confirm failed")}
                      >
                        Confirm
                      </Button>
                    ) : null}
                    {o.status === "DRAFT" || o.status === "CONFIRMED" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (window.confirm("Cancel this order?")) {
                            void runAction(() => cancelOrder(o.id), "Cancel failed");
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
              <Pagination
                page={query.page}
                pageSize={query.pageSize}
                total={data.total}
                onPageChange={query.setPage}
              />
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
