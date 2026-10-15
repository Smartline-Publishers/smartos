"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TransferSchema, type TransferInput } from "@/features/inventory/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Book } from "@/types/book";
import type { Warehouse } from "@/types/inventory";

export function TransferForm({
  books,
  warehouses,
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  books: Book[];
  warehouses: Warehouse[];
  onSubmit: (values: TransferInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<TransferInput>({
    resolver: zodResolver(TransferSchema),
    defaultValues: { bookId: "", fromWarehouseId: "", toWarehouseId: "", quantity: 1, reason: "" },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Transfer form"
    >
      <Select
        label="Book"
        required
        error={errors.bookId?.message}
        options={[{ value: "", label: "Choose a book" }, ...books.map((b) => ({ value: b.id, label: b.title }))]}
        {...register("bookId")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Transferring…" : "Transfer"}
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
