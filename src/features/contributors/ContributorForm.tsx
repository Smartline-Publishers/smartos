"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CONTRIBUTOR_TYPES, ContributorSchema, type ContributorInput } from "@/features/contributors/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function ContributorForm({
  defaultValues,
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  defaultValues?: Partial<ContributorInput>;
  onSubmit: (v: ContributorInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ContributorInput>({
    resolver: zodResolver(ContributorSchema),
    defaultValues: { fullName: "", type: "AUTHOR", email: "", bio: "", ...defaultValues },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" aria-label="Contributor form">
      <Input
        label="Full name"
        required
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <Select
        label="Type"
        options={CONTRIBUTOR_TYPES.map((t) => ({
          value: t,
          label: t.charAt(0) + t.slice(1).toLowerCase(),
        }))}
        {...register("type")}
      />
      <Input
        label="Email"
        type="email"
        hint="Optional"
        error={errors.email?.message}
        {...register("email")}
      />
      <Textarea
        label="Bio"
        hint="Optional"
        error={errors.bio?.message}
        {...register("bio")}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save contributor"}
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
