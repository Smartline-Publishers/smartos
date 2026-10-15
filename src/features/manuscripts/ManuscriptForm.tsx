"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateManuscriptSchema, type CreateManuscriptInput } from "@/features/manuscripts/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ManuscriptForm({
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  onSubmit: (values: CreateManuscriptInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateManuscriptInput>({
    resolver: zodResolver(CreateManuscriptSchema),
    defaultValues: { title: "", fileUrl: "", dueDate: "" },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Manuscript form"
    >
      <Input
        label="Title"
        required
        error={errors.title?.message}
        {...register("title")}
      />
      <Input
        label="File URL"
        hint="Optional"
        placeholder="https://…"
        error={errors.fileUrl?.message}
        {...register("fileUrl")}
      />
      <Input
        label="Due date"
        type="date"
        error={errors.dueDate?.message}
        {...register("dueDate")}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit manuscript"}
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
