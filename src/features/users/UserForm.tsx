"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserSchema, type CreateUserInput } from "@/features/users/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { roleOptions } from "@/features/users/UserEditForm";
import type { Role } from "@/types/auth";

export function UserForm({
  assignableRoles,
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  /** Roles the current user may assign, as reported by the server. */
  assignableRoles: Role[] | undefined;
  onSubmit: (values: CreateUserInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const options = roleOptions(assignableRoles);

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
          hint="Determines what this person can see and do."
          error={errors.role?.message}
          options={options}
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
