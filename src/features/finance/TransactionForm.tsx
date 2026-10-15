"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTransactionSchema, type CreateTransactionInput } from "@/features/finance/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { formatGHS } from "@/lib/format";
import type { Order } from "@/types/sales";

export function TransactionForm({
  fulfilledOrders,
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  fulfilledOrders: Order[];
  onSubmit: (values: CreateTransactionInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: { type: "EXPENSE", amount: 0, category: "", referenceId: "", description: "" },
  });
  const kind = watch("type");

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Transaction form"
    >
      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>
      {kind === "REFUND" ? (
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
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Category" hint="Optional" error={errors.category?.message} {...register("category")} />
        <Input label="Description" hint="Optional" error={errors.description?.message} {...register("description")} />
      </div>
      <p className="text-xs text-slate-500 dark:text-neutral-400">
        Sales and royalty payouts are posted by the system, never by hand.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Recording…" : "Record"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
