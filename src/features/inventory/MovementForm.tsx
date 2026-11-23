"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateMovementSchema, type CreateMovementInput } from "@/features/inventory/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Book } from "@/types/book";
import type { Warehouse } from "@/types/inventory";

export function MovementForm({
  books,
  warehouses,
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  books: Book[];
  warehouses: Warehouse[];
  onSubmit: (values: CreateMovementInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateMovementInput>({
    resolver: zodResolver(CreateMovementSchema),
    defaultValues: { bookId: "", warehouseId: "", qtyDelta: 0, type: "IN", reason: "" },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Movement form"
    >
      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>
      <Input label="Reason" hint="Optional" error={errors.reason?.message} {...register("reason")} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Recording…" : "Record movement"}
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
