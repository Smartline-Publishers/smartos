"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContributorSchema, type ContributorInput } from "@/features/contributors/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ContributorForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (v: ContributorInput) => Promise<void> | void;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContributorInput>({
    resolver: zodResolver(ContributorSchema),
    defaultValues: { fullName: "", email: "", bio: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" aria-label="Contributor form">
      <Input
        label="Full name"
        required
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <Input
        label="Email"
        type="email"
        hint="Optional"
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save contributor"}
      </Button>
    </form>
  );
}
