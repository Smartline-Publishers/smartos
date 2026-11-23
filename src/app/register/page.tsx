"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Brand } from "@/components/layout/Brand";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { registerOrg } from "@/features/auth/api";
import { LegalConsent, legalVersions } from "@/features/legal/LegalConsent";
import { useLegalDocuments } from "@/features/legal/useLegalDocuments";

const OrgSchema = z.object({
  organizationName: z.string().min(2, "Give your publishing house a name").max(200),
});

const AdminSchema = z.object({
  adminFullName: z.string().min(1, "Your name is required").max(200),
  adminEmail: z.string().email("Enter a valid email"),
  adminPassword: z.string().min(8, "At least 8 characters"),
});

type OrgInput = z.infer<typeof OrgSchema>;
type AdminInput = z.infer<typeof AdminSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [org, setOrg] = useState<OrgInput>({ organizationName: "" });
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const legal = useLegalDocuments();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);

  const orgForm = useForm<OrgInput>({
    resolver: zodResolver(OrgSchema),
    defaultValues: org,
  });
  const adminForm = useForm<AdminInput>({
    resolver: zodResolver(AdminSchema),
    defaultValues: { adminFullName: "", adminEmail: "", adminPassword: "" },
  });

  const onSubmit = async (admin: AdminInput) => {
    setServerError(null);
    setConsentError(null);
    const versions = legalVersions(legal.documents);
    if (legal.loading || legal.error || !versions.termsVersion || !versions.privacyVersion) {
      setConsentError("The current legal documents are unavailable. Retry before creating the organization.");
      return;
    }
    if (!acceptedTerms || !acceptedPrivacy) {
      setConsentError("Accept both the Terms of Service and the Privacy Policy to continue.");
      return;
    }
    setSubmitting(true);
    try {
      await registerOrg({
        ...org,
        ...admin,
        termsVersion: versions.termsVersion,
        privacyVersion: versions.privacyVersion,
      });
      refreshSession(admin.adminEmail);
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) {
        setServerError(e.message);
        const legalField = e.fields?.termsVersion?.[0] ?? e.fields?.privacyVersion?.[0];
        if (legalField) setConsentError(legalField);
      } else {
        setServerError("Registration failed. Please try again.");
      }
      setStep(2);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-8 sm:py-10"
      style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
    >
      <h1 className="sr-only">Create your SmartOS organization</h1>
      <Brand tone="light" className="mb-6 text-center" />
      <ol className="mb-4 flex items-center gap-2 text-sm" aria-label="Registration progress">
        {["Organization", "Your account"].map((label, i) => (
          <li key={label} className="flex items-center gap-2" aria-current={step === i + 1 ? "step" : undefined}>
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step > i + 1
                  ? "bg-emerald-600 text-white"
                  : step === i + 1
                    ? "bg-brand-900 text-cream"
                    : "bg-slate-200 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300"
              }`}
            >
              {i + 1}
            </span>
            <span className={step === i + 1 ? "font-semibold text-slate-900 dark:text-neutral-100" : "text-slate-500 dark:text-neutral-400"}>
              {label}
            </span>
            {i < 1 ? <span aria-hidden="true" className="text-slate-300">→</span> : null}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <Card title="Name your publishing house">
          <form
            onSubmit={orgForm.handleSubmit((v) => {
              setOrg(v);
              setStep(2);
            })}
            className="flex flex-col gap-4"
            aria-label="Organization details form"
          >
            <Input
              label="Organization name"
              required
              placeholder="Smartline Publishers"
              error={orgForm.formState.errors.organizationName?.message}
              {...orgForm.register("organizationName")}
            />
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Your web address slug (e.g. smartline-publishers) is derived from the name.
            </p>
            <Button type="submit">Continue</Button>
          </form>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card title="Create your admin account">
          <form
            onSubmit={adminForm.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            aria-label="Admin account form"
          >
            <Input
              label="Full name"
              required
              autoComplete="name"
              error={adminForm.formState.errors.adminFullName?.message}
              {...adminForm.register("adminFullName")}
            />
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              error={adminForm.formState.errors.adminEmail?.message}
              {...adminForm.register("adminEmail")}
            />
            <Input
              label="Password"
              type="password"
              required
              autoComplete="new-password"
              hint="At least 8 characters"
              error={adminForm.formState.errors.adminPassword?.message}
              {...adminForm.register("adminPassword")}
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
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                type="submit"
                disabled={submitting || legal.loading || legal.error !== null}
                className="flex-1"
              >
                {submitting ? "Creating…" : `Create ${org.organizationName || "organization"}`}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <p className="mt-4 text-center text-sm text-slate-600 dark:text-neutral-400">
        Already have an account? <Link href="/login" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">Log in</Link>
      </p>
    </main>
  );
}
