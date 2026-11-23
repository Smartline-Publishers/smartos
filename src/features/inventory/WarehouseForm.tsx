"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateWarehouseSchema, type CreateWarehouseInput } from "@/features/inventory/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function WarehouseForm({
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  onSubmit: (values: CreateWarehouseInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateWarehouseInput>({
    resolver: zodResolver(CreateWarehouseSchema),
    defaultValues: { name: "", location: "" },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Warehouse form"
    >
      <Input label="Name" required error={errors.name?.message} {...register("name")} />
      <Input label="Location" hint="Optional" error={errors.location?.message} {...register("location")} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add warehouse"}
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
