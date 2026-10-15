"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserSchema, type CreateUserInput } from "@/features/users/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const ROLE_OPTIONS = [
  { value: "VIEWER", label: "Viewer" },
  { value: "AUTHOR", label: "Author" },
  { value: "EDITOR", label: "Editor" },
  { value: "DESIGNER", label: "Designer" },
  { value: "PRODUCTION", label: "Production" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "SALES", label: "Sales" },
  { value: "FINANCE", label: "Finance" },
  { value: "ORG_ADMIN", label: "Org admin" },
];

export function UserForm({
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  onSubmit: (values: CreateUserInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { email: "", password: "", fullName: "", role: "VIEWER" },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="User form"
    >
      <Input label="Full name" required error={errors.fullName?.message} {...register("fullName")} />
      <Input label="Email" type="email" required autoComplete="email" error={errors.email?.message} {...register("email")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Temporary password"
          type="password"
          required
          autoComplete="new-password"
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <Select
          label="Role"
          error={errors.role?.message}
          options={ROLE_OPTIONS}
          {...register("role")}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add user"}
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
