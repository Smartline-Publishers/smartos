"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { describePasskeyError, isWebAuthnSupported } from "@/lib/webauthn";
import { Card } from "@/components/ui/Card";
import { Brand } from "@/components/layout/Brand";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPasskey, loginWithTwoFactor, user, loading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [challengeEmail, setChallengeEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });
  const emailValue = watch("email");

  // Read the query string client-side (avoids needing a Suspense boundary and
  // keeps the page statically renderable). Never trust it for authorisation.
  useEffect(() => {
    setPasskeySupported(isWebAuthnSupported());
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      setNotice("Your password was reset. Sign in with your new password.");
    } else if (params.get("changed") === "1") {
      setNotice("Your password has changed. Sign in again to continue.");
    }
  }, []);

  // Redirect to dashboard after successful login or session restoration
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      const result = await login(values.email, values.password);
      if (result.kind === "challenge") {
        setChallengeToken(result.challengeToken);
        setChallengeEmail(values.email);
        setCode("");
      }
    } catch (e) {
      if (e instanceof ApiError) setServerError(e.message);
      else setServerError("Login failed. Please try again.");
    }
  };

  const onPasskey = async () => {
    setServerError(null);
    setPasskeyBusy(true);
    try {
      const result = await loginWithPasskey(emailValue?.trim() || undefined);
      if (result.kind === "challenge") {
        setChallengeToken(result.challengeToken);
        setChallengeEmail(emailValue?.trim() ?? "");
        setCode("");
      }
    } catch (e) {
      if (e instanceof ApiError) setServerError(e.message);
      else setServerError(describePasskeyError(e));
    } finally {
      setPasskeyBusy(false);
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;
    setServerError(null);
    setVerifying(true);
    try {
      await loginWithTwoFactor(challengeToken, code.trim(), challengeEmail);
    } catch (err) {
      if (err instanceof ApiError) setServerError(err.message);
      else setServerError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8 sm:py-10"
      style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
    >
      <h1 className="sr-only">Log in to SmartOS</h1>
      <Brand tone="light" className="mb-6 text-center" />
      <Card title={challengeToken ? "Two-factor authentication" : "Log in"}>
        {challengeToken ? (
          <form onSubmit={onVerify} className="flex flex-col gap-4" aria-label="Two-factor form">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-neutral-400">
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
            {serverError ? <Alert tone="error">{serverError}</Alert> : null}
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" aria-label="Login form">
          {notice ? <Alert tone="success">{notice}</Alert> : null}
          <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
          <div className="flex flex-col gap-1.5">
            <Input label="Password" type="password" autoComplete="current-password" required error={errors.password?.message} {...register("password")} />
            <Link
              href="/forgot-password"
              className="min-h-9 self-end py-1.5 text-[13px] font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
            >
              Forgot password?
            </Link>
          </div>
          {serverError ? <Alert tone="error">{serverError}</Alert> : null}
          <Button type="submit" disabled={isSubmitting || passkeyBusy}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-line dark:bg-neutral-800" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted dark:text-neutral-500">
              or
            </span>
            <span className="h-px flex-1 bg-line dark:bg-neutral-800" />
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onPasskey}
            disabled={passkeyBusy || isSubmitting || !passkeySupported}
          >
            {passkeyBusy ? "Waiting for passkey…" : "Sign in with a passkey"}
          </Button>
          {!passkeySupported ? (
            <p className="text-center text-xs leading-relaxed text-muted dark:text-neutral-500">
              This browser does not support passkeys. Use your password instead.
            </p>
          ) : null}
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
