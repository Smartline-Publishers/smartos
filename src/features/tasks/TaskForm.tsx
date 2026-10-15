"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateTaskSchema, type CreateTaskInput } from "@/features/tasks/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function TaskForm({
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  onSubmit: (values: CreateTaskInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: { title: "", description: "", priority: "MEDIUM", dueDate: "" },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Task form"
    >
      <Input
        label="Title"
        required
        error={errors.title?.message}
        {...register("title")}
      />
      <Textarea
        label="Description"
        hint="Optional"
        error={errors.description?.message}
        {...register("description")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Priority"
          error={errors.priority?.message}
          options={[
            { value: "LOW", label: "Low" },
            { value: "MEDIUM", label: "Medium" },
            { value: "HIGH", label: "High" },
          ]}
          {...register("priority")}
        />
        <Input
          label="Due date"
          type="date"
          error={errors.dueDate?.message}
          {...register("dueDate")}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add task"}
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
