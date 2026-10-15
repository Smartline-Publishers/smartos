"use client";

import { use, useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import {
  cancelOrder,
  confirmOrder,
  fulfilOrder,
  getOrder,
} from "@/features/sales/api";
import { listWarehouses } from "@/features/inventory/api";
import { orderStatusLabel, type Order } from "@/types/sales";
import type { Warehouse } from "@/types/inventory";
import { formatGHS } from "@/lib/format";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, whs] = await Promise.all([getOrder(id), listWarehouses()]);
      setOrder(o);
      setWarehouses(whs);
      if (whs.length === 1) setWarehouseId(whs[0].id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = async (fn: () => Promise<Order>, failure: string) => {
    setBusy(true);
    setActionError(null);
    try {
      setOrder(await fn());
    } catch (e: unknown) {
      setActionError(e instanceof Error ? `${failure}: ${e.message}` : failure);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        {loading ? (
          <Spinner label="Loading order…" />
        ) : error || !order ? (
          <EmptyState title="Order not found" description={error ?? "No order with this id."} />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                Order for {order.customerName ?? "customer"}
              </h1>
              <Badge status={order.status} />
              <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-neutral-100">
                {formatGHS(order.total)}
              </span>
            </div>
            {actionError ? (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {actionError}
              </p>
            ) : null}
            <Card title={`Items (${order.items.length})`}>
              {order.items.length === 0 ? (
                <EmptyState title="No items" description="This order has no lines." />
              ) : (
                <div className="shell-scroll overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <caption className="sr-only">Order lines</caption>
                    <thead className="bg-slate-50 dark:bg-neutral-800/60">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Book</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-neutral-300">Qty</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-neutral-300">Unit price</th>
                        <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-neutral-300">Line total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-t border-slate-200 dark:border-neutral-800">
                          <td className="px-3 py-2 text-slate-900 dark:text-neutral-100">{item.bookTitle ?? item.bookId}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-900 dark:text-neutral-100">{item.quantity}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-neutral-300">
                            {formatGHS(item.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-neutral-100">
                            {formatGHS(item.lineTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
            <Card title="Actions">
              <div className="flex flex-wrap items-end gap-3">
                <p className="w-full text-sm text-slate-600 dark:text-neutral-400">
                  Status: <span className="font-semibold">{orderStatusLabel(order.status)}</span>
                </p>
                {order.status === "DRAFT" ? (
                  <Button disabled={busy} onClick={() => runAction(() => confirmOrder(order.id), "Confirm failed")}>
                    Confirm order
                  </Button>
                ) : null}
                {order.status === "CONFIRMED" ? (
                  <>
                    <div className="w-56">
                      <Select
                        label="Dispatch warehouse"
                        value={warehouseId}
                        onChange={(e) => setWarehouseId(e.target.value)}
                        options={[
                          { value: "", label: "Choose a warehouse" },
                          ...warehouses.map((w) => ({ value: w.id, label: w.name })),
                        ]}
                      />
                    </div>
                    <Button
                      disabled={busy || !warehouseId}
                      title={warehouseId ? "Dispatch stock and post the sale" : "Choose a warehouse first"}
                      onClick={() => runAction(() => fulfilOrder(order.id, warehouseId), "Fulfilment failed")}
                    >
                      Fulfil order
                    </Button>
                  </>
                ) : null}
                {(order.status === "DRAFT" || order.status === "CONFIRMED") && (
                  <Button
                    variant="ghost"
                    className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("Cancel this order?")) {
                        void runAction(() => cancelOrder(order.id), "Cancel failed");
                      }
                    }}
                  >
                    Cancel order
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
