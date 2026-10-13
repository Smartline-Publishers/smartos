"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateBookSchema, type CreateBookInput } from "@/features/books/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export interface BookFormProps {
  defaultValues?: Partial<CreateBookInput>;
  onSubmit: (values: CreateBookInput) => Promise<void> | void;
  submitting?: boolean;
}

export function BookForm({ defaultValues, onSubmit, submitting }: BookFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBookInput>({
    resolver: zodResolver(CreateBookSchema),
    defaultValues: { title: "", isbn: "", status: "DRAFT", ...defaultValues },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Book form"
    >
      <Input
        label="Title"
        required
        error={errors.title?.message}
        {...register("title")}
      />
      <Input
        label="ISBN"
        hint="Optional"
        error={errors.isbn?.message}
        {...register("isbn")}
      />
      <Select
        label="Status"
        options={[
          { value: "DRAFT", label: "Draft" },
          { value: "IN_EDIT", label: "In edit" },
          { value: "DESIGNED", label: "Designed" },
          { value: "PRINTING", label: "Printing" },
          { value: "PUBLISHED", label: "Published" },
          { value: "ARCHIVED", label: "Archived" },
        ]}
        {...register("status")}
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save book"}
      </Button>
    </form>
  );
}
