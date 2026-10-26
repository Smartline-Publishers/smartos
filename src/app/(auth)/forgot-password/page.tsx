"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Brand } from "@/components/layout/Brand";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { requestPasswordReset } from "@/features/auth/api";
import { ApiError } from "@/lib/api-client";

const ForgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type ForgotInput = z.infer<typeof ForgotSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInput>({ resolver: zodResolver(ForgotSchema) });

  const onSubmit = async (values: ForgotInput) => {
    setServerError(null);
    try {
      const result = await requestPasswordReset(values.email.trim());
      setDevToken(result.devToken ?? null);
      setSent(true);
    } catch (e) {
      setServerError(
        e instanceof ApiError
          ? e.message
          : "Could not send the reset email. Please try again.",
      );
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8 sm:py-10"
      style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
    >
      <h1 className="sr-only">Reset your SmartOS password</h1>
      <Brand tone="light" className="mb-6 text-center" />
      <Card title={sent ? "Check your email" : "Forgot your password?"}>
        {sent ? (
          <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-neutral-400">
            <p>
              If an account exists for that email address, we sent a link that lets you
              choose a new password. The link expires in 30 minutes and works once.
            </p>
            <p>
              Nothing arrived? Check your spam folder, or{" "}
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setDevToken(null);
                }}
                className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
              >
                try another email
              </button>
              .
            </p>
            {devToken ? (
              <Alert tone="warning" title="Local development only">
                <p>
                  Email delivery is disabled, so the API returned a one-time link.
                </p>
                <Link
                  href={`/reset-password?token=${encodeURIComponent(devToken)}`}
                  className="mt-2 inline-block font-semibold underline"
                >
                  Open the reset link
                </Link>
              </Alert>
            ) : null}
            <Link
              href="/login"
              className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" aria-label="Forgot password form">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-neutral-400">
              Enter the email address on your account. We will send a single-use link to
              choose a new password.
            </p>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register("email")}
            />
            {serverError ? <Alert tone="error">{serverError}</Alert> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
            <Link
              href="/login"
              className="text-center text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Back to sign in
            </Link>
          </form>
        )}
      </Card>
    </main>
  );
}
