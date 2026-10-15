"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateCustomerSchema, type CreateCustomerInput } from "@/features/sales/api";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export function CustomerForm({
  onSubmit,
  submitting,
  onCancel,
  onDirtyChange,
}: {
  onSubmit: (values: CreateCustomerInput) => Promise<void> | void;
  submitting?: boolean;
  onCancel?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CreateCustomerInput>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: { name: "", type: "INDIVIDUAL", email: "", phone: "", creditLimit: 0 },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      aria-label="Customer form"
    >
      <Input label="Name" required error={errors.name?.message} {...register("name")} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Type"
          error={errors.type?.message}
          options={[
            { value: "INDIVIDUAL", label: "Individual" },
            { value: "SCHOOL", label: "School" },
            { value: "BOOKSHOP", label: "Bookshop" },
            { value: "DISTRIBUTOR", label: "Distributor" },
            { value: "OTHER", label: "Other" },
          ]}
          {...register("type")}
        />
        <Input
          label="Credit limit (GHS)"
          type="number"
          min={0}
          error={errors.creditLimit?.message}
          {...register("creditLimit")}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          hint="Optional"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Phone"
          hint="Optional"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add customer"}
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
