"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateContractSchema, type CreateContractInput } from "@/features/royalties/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Book, Contributor } from "@/types/book";

export function ContractForm({
  books,
  contributors,
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  books: Book[];
  contributors: Contributor[];
  onSubmit: (values: CreateContractInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateContractInput>({
    resolver: zodResolver(CreateContractSchema),
    defaultValues: { contributorId: "", bookId: "", royaltyRate: 0.1, startDate: "", endDate: "" },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Contract form"
    >
      <Select
        label="Contributor"
        required
        error={errors.contributorId?.message}
        options={[
          { value: "", label: "Choose a contributor" },
          ...contributors.map((c) => ({ value: c.id, label: c.fullName })),
        ]}
        {...register("contributorId")}
      />
      <Select
        label="Book (optional — empty means all the contributor's books)"
        error={errors.bookId?.message}
        options={[{ value: "", label: "All books" }, ...books.map((b) => ({ value: b.id, label: b.title }))]}
        {...register("bookId")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Royalty rate (0–1)"
          type="number"
          min={0}
          max={1}
          step="0.01"
          required
          hint="0.10 = 10%"
          error={errors.royaltyRate?.message}
          {...register("royaltyRate")}
        />
        <Input label="Start date" type="date" required error={errors.startDate?.message} {...register("startDate")} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create contract"}
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
