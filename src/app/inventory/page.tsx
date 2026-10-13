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
  CreateMovementSchema,
  CreateWarehouseSchema,
  TransferSchema,
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
    void refreshMovements();
  }, [refreshMovements]);

  const runAction = useCallback(
    async (fn: () => Promise<unknown>, failure: string) => {
      setActionError(null);
      try {
        await fn();
        await refreshAll();
        await refreshMovements();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? `${failure}: ${e.message}` : failure);
      }
    },
    [refreshAll, refreshMovements],
  );

  const bookName = (id: string | null) =>
    books.find((b) => b.id === id)?.title ?? (id ? id.slice(0, 8) : "—");
  const warehouseName = (id: string | null) =>
    warehouses.find((w) => w.id === id)?.name ?? (id ? id.slice(0, 8) : "—");

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Inventory"
            description="Finished-book stock across warehouses, derived from an immutable movement ledger."
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}
          {loading ? (
            <Spinner label="Loading inventory…" />
          ) : error ? (
            <EmptyState title="Could not load inventory" description={error} />
          ) : (
            <>
              <div className="grid items-start gap-4 xl:grid-cols-3">
                <WarehouseCard
                  warehouses={warehouses}
                  onAction={runAction}
                />
                <Card
                  title="Stock levels"
                  className="xl:col-span-2"
                  action={
                    <div className="flex items-center gap-2">
                      <label htmlFor="low-threshold" className="text-xs text-slate-500">
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
                        className="h-8 w-20 rounded-md border border-slate-300 bg-white px-2 text-sm"
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
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <caption className="sr-only">Stock levels by book and warehouse</caption>
                        <thead className="bg-slate-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Book</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Warehouse</th>
                            <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700">Qty</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {levels.map((l) => {
                            const low =
                              threshold.trim() !== "" && l.quantity < Number(threshold);
                            return (
                              <tr key={`${l.bookId}-${l.warehouseId}`} className="border-t border-slate-200">
                                <td className="px-3 py-2 text-slate-900">{l.bookTitle}</td>
                                <td className="px-3 py-2 text-slate-700">{l.warehouseName}</td>
                                <td className="px-3 py-2 text-right font-semibold tabular-nums text-slate-900">
                                  {l.quantity.toLocaleString()}
                                </td>
                                <td className="px-3 py-2">
                                  {low ? (
                                    <>
                                      <Badge status="LOW" />
                                      <span className="sr-only">Low stock</span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-slate-500">OK</span>
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

              <div className="grid items-start gap-4 xl:grid-cols-2">
                <MovementFormCard books={books} warehouses={warehouses} onAction={runAction} />
                <TransferFormCard books={books} warehouses={warehouses} onAction={runAction} />
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
                    <div className="overflow-x-auto rounded-md border border-slate-200">
                      <table className="w-full border-collapse text-left text-sm">
                        <caption className="sr-only">Stock movements</caption>
                        <thead className="bg-slate-50">
                          <tr>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Book</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Warehouse</th>
                            <th scope="col" className="px-3 py-2 text-right font-semibold text-slate-700">Qty</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Type</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Reference</th>
                            <th scope="col" className="px-3 py-2 font-semibold text-slate-700">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movements.items.map((m) => (
                            <tr key={m.id} className="border-t border-slate-200">
                              <td className="px-3 py-2 text-slate-900">{bookName(m.bookId)}</td>
                              <td className="px-3 py-2 text-slate-700">{warehouseName(m.warehouseId)}</td>
                              <td
                                className={`px-3 py-2 text-right font-semibold tabular-nums ${m.qtyDelta >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                              >
                                {m.qtyDelta >= 0 ? `+${m.qtyDelta}` : m.qtyDelta}
                              </td>
                              <td className="px-3 py-2">
                                <Badge status={m.type} />
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-500">
                                {m.referenceType ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-500">
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
      </AppShell>
    </ProtectedRoute>
  );
}

function WarehouseCard({
  warehouses,
  onAction,
}: {
  warehouses: Warehouse[];
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWarehouseInput>({
    resolver: zodResolver(CreateWarehouseSchema),
    defaultValues: { name: "", location: "" },
  });

  return (
    <Card title="Warehouses">
      <form
        onSubmit={handleSubmit(async (v) => {
          await onAction(async () => {
            await createWarehouse(v);
            reset();
          }, "Could not create warehouse");
        })}
        className="flex flex-col gap-2"
        aria-label="New warehouse form"
      >
        <Input label="Name" required error={errors.name?.message} {...register("name")} />
        <Input label="Location" hint="Optional" error={errors.location?.message} {...register("location")} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding…" : "Add warehouse"}
        </Button>
      </form>
      <ul className="mt-3 flex flex-col divide-y divide-slate-100">
        {warehouses.length === 0 ? (
          <li className="py-2 text-sm text-slate-400">No warehouses yet</li>
        ) : (
          warehouses.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{w.name}</p>
                {w.location ? <p className="text-xs text-slate-500">{w.location}</p> : null}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm(`Delete warehouse "${w.name}"?`)) {
                    void onAction(() => deleteWarehouse(w.id), "Delete failed");
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

function MovementFormCard({
  books,
  warehouses,
  onAction,
}: {
  books: Book[];
  warehouses: Warehouse[];
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMovementInput>({
    resolver: zodResolver(CreateMovementSchema),
    defaultValues: { bookId: "", warehouseId: "", qtyDelta: 0, type: "IN", reason: "" },
  });

  return (
    <Card title="Record movement">
      <form
        onSubmit={handleSubmit(async (v) => {
          await onAction(async () => {
            await recordMovement(v);
            reset();
          }, "Could not record movement");
        })}
        className="grid gap-3 sm:grid-cols-2"
        aria-label="Record stock movement form"
      >
        <Select
          label="Book"
          required
          error={errors.bookId?.message}
          options={[{ value: "", label: "Choose a book" }, ...books.map((b) => ({ value: b.id, label: b.title }))]}
          {...register("bookId")}
        />
        <Select
          label="Warehouse"
          required
          error={errors.warehouseId?.message}
          options={[{ value: "", label: "Choose a warehouse" }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
          {...register("warehouseId")}
        />
        <Select
          label="Type"
          error={errors.type?.message}
          options={[
            { value: "IN", label: "Receipt (IN)" },
            { value: "OUT", label: "Dispatch (OUT)" },
            { value: "ADJUSTMENT", label: "Adjustment" },
          ]}
          {...register("type")}
        />
        <Input
          label="Quantity (signed)"
          hint="IN positive, OUT negative"
          type="number"
          required
          error={errors.qtyDelta?.message}
          {...register("qtyDelta")}
        />
        <div className="sm:col-span-2">
          <Input label="Reason" hint="Optional" error={errors.reason?.message} {...register("reason")} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Recording…" : "Record movement"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function TransferFormCard({
  books,
  warehouses,
  onAction,
}: {
  books: Book[];
  warehouses: Warehouse[];
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransferInput>({
    resolver: zodResolver(TransferSchema),
    defaultValues: { bookId: "", fromWarehouseId: "", toWarehouseId: "", quantity: 1, reason: "" },
  });

  return (
    <Card title="Transfer between warehouses">
      <form
        onSubmit={handleSubmit(async (v) => {
          await onAction(async () => {
            await transferStock(v);
            reset();
          }, "Transfer failed");
        })}
        className="grid gap-3 sm:grid-cols-2"
        aria-label="Transfer stock form"
      >
        <div className="sm:col-span-2">
          <Select
            label="Book"
            required
            error={errors.bookId?.message}
            options={[{ value: "", label: "Choose a book" }, ...books.map((b) => ({ value: b.id, label: b.title }))]}
            {...register("bookId")}
          />
        </div>
        <Select
          label="From"
          required
          error={errors.fromWarehouseId?.message}
          options={[{ value: "", label: "Source warehouse" }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
          {...register("fromWarehouseId")}
        />
        <Select
          label="To"
          required
          error={errors.toWarehouseId?.message}
          options={[{ value: "", label: "Destination warehouse" }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
          {...register("toWarehouseId")}
        />
        <Input
          label="Quantity"
          type="number"
          min={1}
          required
          error={errors.quantity?.message}
          {...register("quantity")}
        />
        <Input label="Reason" hint="Optional" error={errors.reason?.message} {...register("reason")} />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Transferring…" : "Transfer"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
