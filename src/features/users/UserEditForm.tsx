"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateUserSchema, type UpdateUserInput } from "@/features/users/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { OrgUser } from "@/features/users/api";
import type { Role } from "@/types/auth";

/**
 * Roles the current user may assign. The server sends the authoritative list
 * (`assignableRoles`); it is filtered against the role options below so an
 * org admin can never be offered a role the API would reject.
 */
export function roleOptions(assignable: Role[] | undefined): { value: Role; label: string }[] {
  const labels: Record<Role, string> = {
    PLATFORM_ADMIN: "Platform admin",
    ORG_ADMIN: "Organization admin",
    EDITOR: "Editor",
    DESIGNER: "Designer",
    PRODUCTION: "Production",
    WAREHOUSE: "Warehouse",
    SALES: "Sales",
    FINANCE: "Finance",
    AUTHOR: "Author",
    VIEWER: "Viewer",
  };
  const allowed = new Set<Role>(assignable ?? []);
  return (Object.keys(labels) as Role[])
    .filter((r) => allowed.has(r))
    .map((r) => ({ value: r, label: labels[r] }));
}

export function UserEditForm({
  user,
  assignableRoles,
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  user: OrgUser;
  assignableRoles: Role[] | undefined;
  onSubmit: (values: UpdateUserInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const options = roleOptions(assignableRoles);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      fullName: user.fullName,
      role: user.role,
      active: user.active,
    },
  });

  // Re-seed the form when a different user is selected.
  useEffect(() => {
    reset({ fullName: user.fullName, role: user.role, active: user.active });
  }, [reset, user]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label={`Edit ${user.email}`}
    >
      <Input
        label="Full name"
        required
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Role"
          hint="Determines what this person can see and do."
          error={errors.role?.message}
          options={options}
          {...register("role")}
        />
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink dark:text-neutral-100">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            {...register("active")}
          />
          Account is active
        </label>
      </div>
      <p className="text-[13px] text-muted dark:text-neutral-400">
        {user.email}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
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
