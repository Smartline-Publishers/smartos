"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { AcceptInviteSchema, acceptInvite, type AcceptInviteInput } from "@/features/invites/api";

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={<Spinner label="Loading invitation…" />}>
      <InviteAcceptContent />
    </Suspense>
  );
}

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(AcceptInviteSchema),
    defaultValues: {
      token: searchParams.get("token") ?? "",
      fullName: "",
      password: "",
    },
  });

  const onSubmit = async (values: AcceptInviteInput) => {
    setServerError(null);
    try {
      await acceptInvite(values);
      refreshSession();
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) setServerError(e.message);
      else setServerError("Could not accept the invitation. Please try again.");
    }
  };

  return (
    <main id="main-content" className="mx-auto max-w-md py-10">
      <h1 className="sr-only">Accept organization invitation</h1>
      <Card title="You've been invited">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" aria-label="Accept invitation form">
          <Input
            label="Invitation token"
            required
            hint="From your invite link"
            error={errors.token?.message}
            {...register("token")}
          />
          <Input
            label="Full name"
            required
            autoComplete="name"
            error={errors.fullName?.message}
            {...register("fullName")}
          />
          <Input
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            hint="At least 8 characters"
            error={errors.password?.message}
            {...register("password")}
          />
          {serverError ? (
            <p role="alert" className="text-sm text-red-600">
              {serverError}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Joining…" : "Accept invitation"}
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link>
      </p>
    </main>
  );
}
