"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateInviteSchema, type CreateInviteInput } from "@/features/invites/api";
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

export function InviteForm({
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  onSubmit: (values: CreateInviteInput) => Promise<{ token?: string } | void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateInviteInput>({
    resolver: zodResolver(CreateInviteSchema),
    defaultValues: { email: "", role: "VIEWER", daysValid: 7 },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Invite form"
    >
      <Input label="Email" type="email" required error={errors.email?.message} {...register("email")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Role"
          error={errors.role?.message}
          options={ROLE_OPTIONS}
          {...register("role")}
        />
        <Input
          label="Valid for (days)"
          type="number"
          min={1}
          max={30}
          error={errors.daysValid?.message}
          {...register("daysValid")}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Inviting…" : "Invite"}
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
