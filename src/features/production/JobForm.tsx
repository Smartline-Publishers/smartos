"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateJobSchema, type CreateJobInput } from "@/features/production/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Book } from "@/types/book";

export function JobForm({
  books,
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  books: Book[];
  onSubmit: (values: CreateJobInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateJobInput>({
    resolver: zodResolver(CreateJobSchema),
    defaultValues: { bookId: "", manuscriptId: "", quantity: 1000, printer: "", dueDate: "" },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Print job form"
    >
      <Select
        label="Book"
        required
        error={errors.bookId?.message}
        options={[
          { value: "", label: "Choose a book" },
          ...books.map((b) => ({ value: b.id, label: b.title })),
        ]}
        {...register("bookId")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Quantity"
          type="number"
          min={1}
          required
          error={errors.quantity?.message}
          {...register("quantity")}
        />
        <Input
          label="Due date"
          type="date"
          error={errors.dueDate?.message}
          {...register("dueDate")}
        />
      </div>
      <Input
        label="Printer"
        hint="Optional"
        error={errors.printer?.message}
        {...register("printer")}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create job"}
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
