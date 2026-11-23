"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Brand } from "@/components/layout/Brand";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { AcceptInviteSchema, acceptInvite, type AcceptInviteInput } from "@/features/invites/api";
import { LegalConsent, legalVersions } from "@/features/legal/LegalConsent";
import { useLegalDocuments } from "@/features/legal/useLegalDocuments";

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InviteAcceptContent />
    </Suspense>
  );
}

function InviteAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const legal = useLegalDocuments();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
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
    setConsentError(null);
    const versions = legalVersions(legal.documents);
    if (legal.loading || legal.error || !versions.termsVersion || !versions.privacyVersion) {
      setConsentError("The current legal documents are unavailable. Retry before joining.");
      return;
    }
    if (!acceptedTerms || !acceptedPrivacy) {
      setConsentError("Accept both the Terms of Service and the Privacy Policy to continue.");
      return;
    }
    try {
      await acceptInvite({
        ...values,
        termsVersion: versions.termsVersion,
        privacyVersion: versions.privacyVersion,
      });
      refreshSession();
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) {
        setServerError(e.message);
        const legalField = e.fields?.termsVersion?.[0] ?? e.fields?.privacyVersion?.[0];
        if (legalField) setConsentError(legalField);
      } else {
        setServerError("Could not accept the invitation. Please try again.");
      }
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8 sm:py-10"
      style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
    >
      <h1 className="sr-only">Accept organization invitation</h1>
      <Brand tone="light" className="mb-6 text-center" />
      <Card title="You've been invited">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" aria-label="Accept invitation form">
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
          <LegalConsent
            documents={legal.documents}
            loading={legal.loading}
            error={legal.error}
            onRetry={() => void legal.reload()}
            acceptedTerms={acceptedTerms}
            acceptedPrivacy={acceptedPrivacy}
            onChange={({ terms, privacy }) => {
              setAcceptedTerms(terms);
              setAcceptedPrivacy(privacy);
              setConsentError(null);
            }}
            errorMessage={consentError}
          />
          {serverError ? <Alert tone="error">{serverError}</Alert> : null}
          <Button
            type="submit"
            disabled={isSubmitting || legal.loading || legal.error !== null}
          >
            {isSubmitting ? "Joining…" : "Accept invitation"}
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-neutral-400">
        Already have an account? <Link href="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">Log in</Link>
      </p>
    </main>
  );
}

