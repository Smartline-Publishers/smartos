"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { CustomerForm } from "@/features/sales/CustomerForm";
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  type CreateCustomerInput,
} from "@/features/sales/api";
import type { Customer } from "@/types/sales";
import type { Page } from "@/types/api";
import { usePagedQuery } from "@/hooks/use-paged-query";
import { formatGHS } from "@/lib/format";

export default function CustomersPage() {
  const query = usePagedQuery({ pageSize: 10 });
  const [data, setData] = useState<Page<Customer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const params = query.toParams();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listCustomers(params));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize, params.search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onCreate = async (values: CreateCustomerInput) => {
    setActionError(null);
    setCreating(true);
    try {
      await createCustomer(values);
      setCreateOpen(false);
      setFormDirty(false);
      if (params.page === 1) await refresh();
      else query.setPage(1);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? `Could not create customer: ${e.message}` : "Could not create customer");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Customers"
            description="Schools, bookshops, distributors and direct buyers."
            actions={
              <Button onClick={() => setCreateOpen(true)}>
                New customer
              </Button>
            }
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {actionError}
            </p>
          ) : null}
          <Modal
            open={createOpen}
            title="New customer"
            description="Add a buyer for orders."
            onClose={() => setCreateOpen(false)}
            isDirty={formDirty}
          >
            <CustomerForm
              key={createOpen ? "customer-new" : "customer-closed"}
              onSubmit={onCreate}
              submitting={creating}
              onCancel={() => setCreateOpen(false)}
              onDirtyChange={setFormDirty}
            />
          </Modal>

          <Input
            label="Search"
            placeholder="Customer name…"
            value={query.search}
            onChange={(e) => query.setSearch(e.target.value)}
          />

          {loading ? (
            <Spinner label="Loading customers…" />
          ) : error ? (
            <EmptyState title="Could not load customers" description={error} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="No customers found" description="Try a different search." />
          ) : (
            <>
              <p className="text-[13px] text-slate-600 dark:text-neutral-400" aria-live="polite">
                <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">{data.total}</span>{" "}
                {data.total === 1 ? "customer" : "customers"}
              </p>
              <ul className="flex flex-col gap-2">
                {data.items.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-[0_1px_2px_rgb(15_23_42/0.05)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">{c.name}</p>
                      <p className="text-xs capitalize text-slate-500 dark:text-neutral-400">
                        {c.type.toLowerCase().replace("_", " ")}
                        {c.email ? ` · ${c.email}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-neutral-400">
                      Credit{" "}
                      <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">
                        {formatGHS(c.creditLimit)}
                      </span>
                    </span>
                    <Link
                      href="/orders"
                      className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
                    >
                      Orders
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      onClick={() => {
                        if (window.confirm(`Delete customer "${c.name}"?`)) {
                          void (async () => {
                            try {
                              await deleteCustomer(c.id);
                              await refresh();
                            } catch (e: unknown) {
                              setActionError(
                                e instanceof Error ? `Delete failed: ${e.message}` : "Delete failed",
                              );
                            }
                          })();
                        }
                      }}
                    >
                      Delete
                    </Button>
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
