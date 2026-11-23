"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateBudgetSchema, type CreateBudgetInput } from "@/features/finance/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function BudgetForm({
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  onSubmit: (values: CreateBudgetInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateBudgetInput>({
    resolver: zodResolver(CreateBudgetSchema),
    defaultValues: { name: "", category: "", periodStart: "", periodEnd: "", plannedAmount: 0 },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Budget form"
    >
      <Input label="Name" required error={errors.name?.message} {...register("name")} />
      <Input label="Category" hint="Matches expense category" error={errors.category?.message} {...register("category")} />
      <Input
        label="Planned (GHS)"
        type="number"
        min={0}
        step="0.01"
        required
        error={errors.plannedAmount?.message}
        {...register("plannedAmount")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Period start" type="date" required error={errors.periodStart?.message} {...register("periodStart")} />
        <Input label="Period end" type="date" required error={errors.periodEnd?.message} {...register("periodEnd")} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create budget"}
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
