"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/Alert";
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
  serverError,
}: {
  onSubmit: (values: CreateInviteInput) => Promise<{ token?: string } | void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  /** Server-side rejection (e.g. already a member, pending invite exists). */
  serverError?: string;
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
      aria-busy={submitting || undefined}
    >
      {serverError ? (
        <Alert tone="error">
          {serverError}
        </Alert>
      ) : null}
      <Input
        label="Email address"
        type="email"
        placeholder="name@example.com"
        autoComplete="email"
        required
        hint="We'll send them a one-time invitation link."
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Role"
          hint="What they can do in this organisation."
          error={errors.role?.message}
          options={ROLE_OPTIONS}
          {...register("role")}
        />
        <Input
          label="Invitation valid for (days)"
          type="number"
          min={1}
          max={30}
          placeholder="7"
          error={errors.daysValid?.message}
          {...register("daysValid")}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Sending invitation…" : "Send invitation"}
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
