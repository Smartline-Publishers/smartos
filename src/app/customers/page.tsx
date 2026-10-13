"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import {
  CreateCustomerSchema,
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: { name: "", type: "INDIVIDUAL", email: "", phone: "", creditLimit: 0 },
  });

  const onCreate = async (values: CreateCustomerInput) => {
    setActionError(null);
    try {
      await createCustomer(values);
      reset();
      query.setPage(1);
      await refresh();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? `Could not create customer: ${e.message}` : "Could not create customer");
    }
  };

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Customers"
            description="Schools, bookshops, distributors and direct buyers."
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}
          <Card title="New customer">
            <form
              onSubmit={handleSubmit(onCreate)}
              className="grid gap-3 sm:grid-cols-[1fr_170px_1fr_140px_auto]"
              aria-label="New customer form"
            >
              <Input label="Name" required error={errors.name?.message} {...register("name")} />
              <Select
                label="Type"
                error={errors.type?.message}
                options={[
                  { value: "INDIVIDUAL", label: "Individual" },
                  { value: "SCHOOL", label: "School" },
                  { value: "BOOKSHOP", label: "Bookshop" },
                  { value: "DISTRIBUTOR", label: "Distributor" },
                  { value: "OTHER", label: "Other" },
                ]}
                {...register("type")}
              />
              <Input label="Email" type="email" hint="Optional" error={errors.email?.message} {...register("email")} />
              <Input
                label="Credit limit (GHS)"
                type="number"
                min={0}
                error={errors.creditLimit?.message}
                {...register("creditLimit")}
              />
              <div className="flex items-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding…" : "Add customer"}
                </Button>
              </div>
            </form>
          </Card>

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
              <p className="text-[13px] text-slate-600" aria-live="polite">
                <span className="font-semibold tabular-nums text-slate-900">{data.total}</span>{" "}
                {data.total === 1 ? "customer" : "customers"}
              </p>
              <ul className="flex flex-col gap-2">
                {data.items.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-[0_1px_2px_rgb(15_23_42/0.05)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                      <p className="text-xs capitalize text-slate-500">
                        {c.type.toLowerCase().replace("_", " ")}
                        {c.email ? ` · ${c.email}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">
                      Credit{" "}
                      <span className="font-semibold tabular-nums text-slate-900">
                        {formatGHS(c.creditLimit)}
                      </span>
                    </span>
                    <Link
                      href="/orders"
                      className="text-[13px] font-semibold text-brand-700 hover:underline"
                    >
                      Orders
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-700 hover:bg-red-50"
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
