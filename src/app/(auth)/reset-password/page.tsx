"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Brand } from "@/components/layout/Brand";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { resetPassword, validateResetToken } from "@/features/auth/api";
import { ApiError } from "@/lib/api-client";
import { checkPassword, PASSWORD_MIN_LENGTH } from "@/lib/password";
import { PasswordStrength } from "@/components/ui/PasswordStrength";

type State = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Spinner label="Checking reset link…" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<State>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const strength = checkPassword(newPassword);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState("invalid");
      setError("This reset link is missing its token. Request a new link.");
      return;
    }
    validateResetToken(token)
      .then(() => {
        if (!cancelled) setState("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        setState("invalid");
        setError(
          e instanceof ApiError
            ? e.message
            : "This reset link is invalid or has expired. Request a new one.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!strength.valid) {
      setError(strength.issues[0] ?? "Choose a stronger password.");
      return;
    }
    if (newPassword !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword({ token, newPassword, confirmPassword: confirm });
      setState("done");
      window.setTimeout(() => router.push("/login?reset=1"), 2500);
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : "Could not reset the password. Request a new link and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8 sm:py-10"
      style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
    >
      <h1 className="sr-only">Choose a new SmartOS password</h1>
      <Brand tone="light" className="mb-6 text-center" />
      <Card title={state === "done" ? "Password updated" : "Choose a new password"}>
        {state === "checking" ? (
          <Spinner label="Checking reset link…" />
        ) : state === "invalid" ? (
          <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-neutral-400">
            <Alert tone="error">
              {error ?? "This reset link is invalid or has expired."}
            </Alert>
            <Link
              href="/forgot-password"
              className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Request a new reset link
            </Link>
          </div>
        ) : state === "done" ? (
          <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-neutral-400">
            <Alert tone="success">
              Your password has been changed and all existing sessions were signed out.
            </Alert>
            <p>Taking you to the sign-in page…</p>
            <Link
              href="/login"
              className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Sign in now
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Reset password form">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-neutral-400">
              Choose a password you have not used before. This link can only be used once.
            </p>
            <div>
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
                required
              />
              <PasswordStrength check={strength} />
            </div>
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {error ? <Alert tone="error">{error}</Alert> : null}
            <Button type="submit" disabled={busy || !strength.valid || !confirm}>
              {busy ? "Updating…" : "Update password"}
            </Button>
            <Link
              href="/login"
              className="min-h-9 py-1.5 text-center text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Back to sign in
            </Link>
          </form>
        )}
      </Card>
    </main>
  );
}

