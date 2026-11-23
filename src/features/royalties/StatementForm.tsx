"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GenerateStatementSchema, type GenerateStatementInput } from "@/features/royalties/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Contract } from "@/types/finance";

export function StatementForm({
  contracts,
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  contracts: Contract[];
  onSubmit: (values: GenerateStatementInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<GenerateStatementInput>({
    resolver: zodResolver(GenerateStatementSchema),
    defaultValues: { contractId: "", periodStart: "", periodEnd: "" },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Statement form"
    >
      <Select
        label="Contract"
        required
        error={errors.contractId?.message}
        options={[
          { value: "", label: "Choose a contract" },
          ...contracts
            .filter((c) => c.status === "ACTIVE")
            .map((c) => ({
              value: c.id,
              label: `${c.contributorName ?? "Contributor"} · ${(c.royaltyRate * 100).toFixed(1)}%`,
            })),
        ]}
        {...register("contractId")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Period start" type="date" required error={errors.periodStart?.message} {...register("periodStart")} />
        <Input label="Period end" type="date" required error={errors.periodEnd?.message} {...register("periodEnd")} />
      </div>
      <p className="text-xs text-slate-500 dark:text-neutral-400">
        Net = fulfilled sales minus refunds in the period; payable = net × rate. Snapshotted at generation.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Generating…" : "Generate"}
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
