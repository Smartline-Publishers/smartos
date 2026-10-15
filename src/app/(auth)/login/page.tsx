"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Brand } from "@/components/layout/Brand";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithTwoFactor } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [challengeEmail, setChallengeEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      const result = await login(values.email, values.password);
      if (result.kind === "challenge") {
        setChallengeToken(result.challengeToken);
        setChallengeEmail(values.email);
        setCode("");
        return;
      }
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) setServerError(e.message);
      else setServerError("Login failed. Please try again.");
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;
    setServerError(null);
    setVerifying(true);
    try {
      await loginWithTwoFactor(challengeToken, code.trim(), challengeEmail);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) setServerError(err.message);
      else setServerError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <main id="main-content" className="mx-auto max-w-md py-10">
      <h1 className="sr-only">Log in to SmartOS</h1>
      <Brand tone="light" className="mb-6 text-center" />
      <Card title={challengeToken ? "Two-factor authentication" : "Log in"}>
        {challengeToken ? (
          <form onSubmit={onVerify} className="flex flex-col gap-3" aria-label="Two-factor form">
            <p className="text-sm text-slate-600 dark:text-neutral-400">
              Enter the 6-digit code from the authenticator app, or a backup code.
            </p>
            <Input
              label="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={16}
              required
            />
            {serverError ? (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {serverError}
              </p>
            ) : null}
            <Button type="submit" disabled={verifying || code.trim().length === 0}>
              {verifying ? "Verifying…" : "Verify"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setChallengeToken(null);
                setCode("");
                setServerError(null);
              }}
            >
              Back to sign in
            </Button>
          </form>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" aria-label="Login form">
          <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" autoComplete="current-password" required error={errors.password?.message} {...register("password")} />
          {serverError ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {serverError}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        )}
      </Card>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-neutral-400">
        New to SmartOS?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Create your organization
        </Link>
      </p>
    </main>
  );
}
