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
import { ArrowsDownUp, ArrowsLeftRight, Warehouse as WarehouseIcon } from "@phosphor-icons/react";
import { WarehouseForm } from "@/features/inventory/WarehouseForm";
import { MovementForm } from "@/features/inventory/MovementForm";
import { TransferForm } from "@/features/inventory/TransferForm";
import {
  createWarehouse,
  deleteWarehouse,
  listLevels,
  listMovements,
  listWarehouses,
  recordMovement,
  transferStock,
  type CreateMovementInput,
  type CreateWarehouseInput,
  type TransferInput,
} from "@/features/inventory/api";
import { listBooks } from "@/features/books/api";
import type { Book } from "@/types/book";
import type { StockLevel, StockMovement, Warehouse } from "@/types/inventory";
import type { Page } from "@/types/api";
import { usePagedQuery } from "@/hooks/use-paged-query";
import { formatDate } from "@/lib/format";

export default function InventoryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [levels, setLevels] = useState<StockLevel[] | null>(null);
  const [threshold, setThreshold] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formDirty, setFormDirty] = useState(false);

  const movementQuery = usePagedQuery({ pageSize: 10 });
  const [movements, setMovements] = useState<Page<StockMovement> | null>(null);
  const [movementBook, setMovementBook] = useState("");
  const [movementWh, setMovementWh] = useState("");
  const mParams = movementQuery.toParams();

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookPage, whs] = await Promise.all([
        listBooks({ page: 1, pageSize: 100 }),
        listWarehouses(),
      ]);
      setBooks(bookPage.items);
      setWarehouses(whs);
      setLevels(await listLevels({}));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMovements = useCallback(async () => {
    try {
      setMovements(
        await listMovements({
          page: mParams.page,
          pageSize: mParams.pageSize,
          ...(movementBook ? { bookId: movementBook } : {}),
          ...(movementWh ? { warehouseId: movementWh } : {}),
        }),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load movements");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mParams.page, mParams.pageSize, movementBook, movementWh]);

  const refreshLevels = useCallback(async () => {
    const below = threshold.trim() === "" ? undefined : Number(threshold);
    setLevels(await listLevels({ ...(below !== undefined ? { below } : {}) }));
  }, [threshold]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const bookName = (id: string | null) =>
    books.find((b) => b.id === id)?.title ?? (id ? id.slice(0, 8) : "—");
  const warehouseName = (id: string | null) =>
    warehouses.find((w) => w.id === id)?.name ?? (id ? id.slice(0, 8) : "—");

  return (
    <ProtectedRoute>
      <AppShell>
        <RouteGuard><div className="flex flex-col gap-4">
          <PageHeader
            title="Inventory"
            description="Finished-book stock across warehouses, derived from an immutable movement ledger."
            hideActionsOnMobile
            actions={
              <>
                <Button variant="ghost" onClick={() => setTransferOpen(true)}>
                  Transfer stock
                </Button>
                <Button variant="ghost" onClick={() => setMovementOpen(true)}>
                  Record movement
                </Button>
                <Button onClick={() => setWarehouseOpen(true)}>
                  New warehouse
                </Button>
              </>
            }
          />
          <MobileFab
            menuLabel="Inventory actions"
            actions={[
              {
                label: "New warehouse",
                icon: WarehouseIcon,
                onClick: () => setWarehouseOpen(true),
              },
              {
                label: "Record movement",
                icon: ArrowsDownUp,
                onClick: () => setMovementOpen(true),
              },
              {
                label: "Transfer stock",
                icon: ArrowsLeftRight,
                onClick: () => setTransferOpen(true),
              },
            ]}
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {actionError}
            </p>
          ) : null}
          <Modal
            open={warehouseOpen}
            title="New warehouse"
            description="Add a storage location."
            onClose={() => setWarehouseOpen(false)}
            isDirty={formDirty}
          >
            <WarehouseForm
              key={warehouseOpen ? "warehouse-new" : "warehouse-closed"}
              onSubmit={async (v: CreateWarehouseInput) => {
                setSubmitting(true);
                try {
                  await createWarehouse(v);
                  setWarehouseOpen(false);
                  setFormDirty(false);
                  await refreshAll();
                  await refreshMovements();
                } catch (e: unknown) {
                  setActionError(e instanceof Error ? `Could not create warehouse: ${e.message}` : "Could not create warehouse");
                } finally {
                  setSubmitting(false);
                }
              }}
              submitting={submitting}
              onCancel={() => setWarehouseOpen(false)}
              onDirtyChange={setFormDirty}
            />
          </Modal>
          <Modal
            open={movementOpen}
            title="Record movement"
            description="Record a receipt, dispatch, or adjustment."
            onClose={() => setMovementOpen(false)}
            isDirty={formDirty}
          >
            <MovementForm
              key={movementOpen ? "movement-new" : "movement-closed"}
              books={books}
              warehouses={warehouses}
              onSubmit={async (v: CreateMovementInput) => {
                setSubmitting(true);
                try {
                  await recordMovement(v);
                  setMovementOpen(false);
                  setFormDirty(false);
                  await refreshAll();
                  await refreshMovements();
                } catch (e: unknown) {
                  setActionError(e instanceof Error ? `Could not record movement: ${e.message}` : "Could not record movement");
                } finally {
                  setSubmitting(false);
                }
              }}
              submitting={submitting}
              onCancel={() => setMovementOpen(false)}
              onDirtyChange={setFormDirty}
            />
          </Modal>
          <Modal
            open={transferOpen}
            title="Transfer stock"
            description="Move copies between warehouses."
            onClose={() => setTransferOpen(false)}
            isDirty={formDirty}
          >
            <TransferForm
              key={transferOpen ? "transfer-new" : "transfer-closed"}
              books={books}
              warehouses={warehouses}
              onSubmit={async (v: TransferInput) => {
                setSubmitting(true);
                try {
                  await transferStock(v);
                  setTransferOpen(false);
                  setFormDirty(false);
                  await refreshAll();
                  await refreshMovements();
                } catch (e: unknown) {
                  setActionError(e instanceof Error ? `Transfer failed: ${e.message}` : "Transfer failed");
                } finally {
                  setSubmitting(false);
                }
              }}
              submitting={submitting}
              onCancel={() => setTransferOpen(false)}
              onDirtyChange={setFormDirty}
            />
          </Modal>
          {loading ? (
            <Spinner label="Loading inventory…" />
          ) : error ? (
            <EmptyState title="Could not load inventory" description={error} />
          ) : (
            <>
              <div className="grid items-start gap-4 xl:grid-cols-3">
                <WarehousesCard
                  warehouses={warehouses}
                  onDelete={async (id: string) => {
                    setActionError(null);
                    try {
                      await deleteWarehouse(id);
                      await refreshAll();
                      await refreshMovements();
                    } catch (e: unknown) {
                      setActionError(e instanceof Error ? `Delete failed: ${e.message}` : "Delete failed");
                    }
                  }}
                />
                <Card
                  title="Stock levels"
                  className="xl:col-span-2"
                  action={
                    <div className="flex items-center gap-2">
                      <label htmlFor="low-threshold" className="text-xs text-slate-500 dark:text-neutral-400">
                        Low below
                      </label>
                      <input
                        id="low-threshold"
                        type="number"
                        min={0}
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        onBlur={() => void refreshLevels().catch(() => undefined)}
                        placeholder="—"
                        className="h-8 w-20 rounded-md border border-slate-300 bg-white px-2 text-sm text-ink dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                  }
                >
                  {!levels || levels.length === 0 ? (
                    <EmptyState
                      title="No stock yet"
                      description="Post a print run or record a receipt to create stock."
                    />
                  ) : (
                    <div className="shell-scroll overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <caption className="sr-only">Stock levels by book and warehouse</caption>
                        <thead className="bg-slate-50 dark:bg-neutral-800/60">
                          <tr>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Book</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Warehouse</th>
                            <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-neutral-300">Qty</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {levels.map((l) => {
                            const low =
                              threshold.trim() !== "" && l.quantity < Number(threshold);
                            return (
                              <tr key={`${l.bookId}-${l.warehouseId}`} className="border-t border-slate-200 dark:border-neutral-800">
                                <td className="px-3 py-2 text-slate-900 dark:text-neutral-100">{l.bookTitle}</td>
                                <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{l.warehouseName}</td>
                                <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-neutral-100">
                                  {l.quantity.toLocaleString()}
                                </td>
                                <td className="px-3 py-2">
                                  {low ? (
                                    <>
                                      <Badge status="LOW" />
                                      <span className="sr-only">Low stock</span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-slate-500 dark:text-neutral-400">OK</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>

              <Card title="Movement history">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row">
                  <div className="flex-1">
                    <Select
                      label="Book"
                      value={movementBook}
                      onChange={(e) => {
                        setMovementBook(e.target.value);
                        movementQuery.setPage(1);
                      }}
                      options={[
                        { value: "", label: "All books" },
                        ...books.map((b) => ({ value: b.id, label: b.title })),
                      ]}
                    />
                  </div>
                  <div className="flex-1">
                    <Select
                      label="Warehouse"
                      value={movementWh}
                      onChange={(e) => {
                        setMovementWh(e.target.value);
                        movementQuery.setPage(1);
                      }}
                      options={[
                        { value: "", label: "All warehouses" },
                        ...warehouses.map((w) => ({ value: w.id, label: w.name })),
                      ]}
                    />
                  </div>
                </div>
                {!movements || movements.items.length === 0 ? (
                  <EmptyState title="No movements" description="Recorded receipts, dispatches and transfers appear here." />
                ) : (
                  <>
                    <div className="shell-scroll overflow-x-auto rounded-md border border-slate-200 dark:border-neutral-800">
                      <table className="w-full border-collapse text-left text-sm">
                        <caption className="sr-only">Stock movements</caption>
                        <thead className="bg-slate-50 dark:bg-neutral-800/60">
                          <tr>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Book</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Warehouse</th>
                            <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-neutral-300">Qty</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Type</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Reference</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700 dark:text-neutral-300">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movements.items.map((m) => (
                            <tr key={m.id} className="border-t border-slate-200 dark:border-neutral-800">
                              <td className="px-3 py-2 text-slate-900 dark:text-neutral-100">{bookName(m.bookId)}</td>
                              <td className="px-3 py-2 text-slate-700 dark:text-neutral-300">{warehouseName(m.warehouseId)}</td>
                              <td
                                className={`px-3 py-2 text-right font-semibold tabular-nums ${m.qtyDelta >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
                              >
                                {m.qtyDelta >= 0 ? `+${m.qtyDelta}` : m.qtyDelta}
                              </td>
                              <td className="px-3 py-2">
                                <Badge status={m.type} />
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-500 dark:text-neutral-400">
                                {m.referenceType ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-500 dark:text-neutral-400">
                                {m.createdAt ? formatDate(m.createdAt) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3">
                      <Pagination
                        page={movementQuery.page}
                        pageSize={movementQuery.pageSize}
                        total={movements.total}
                        onPageChange={movementQuery.setPage}
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

function WarehousesCard({
  warehouses,
  onDelete,
}: {
  warehouses: Warehouse[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <Card title="Warehouses">
      <ul className="flex flex-col divide-y divide-slate-100 dark:divide-neutral-800">
        {warehouses.length === 0 ? (
          <li className="py-2 text-sm text-slate-400 dark:text-neutral-500">No warehouses yet</li>
        ) : (
          warehouses.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">{w.name}</p>
                {w.location ? <p className="text-xs text-slate-500 dark:text-neutral-400">{w.location}</p> : null}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                onClick={() => {
                  if (window.confirm(`Delete warehouse "${w.name}"?`)) {
                    void onDelete(w.id);
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
