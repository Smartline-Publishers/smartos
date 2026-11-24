"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationList } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/hooks/use-auth";
import { useOrg } from "@/hooks/use-org";

const Schema = z.object({
  organizationName: z.string().min(2, "Give your organization a name").max(200),
});

type Input = z.infer<typeof Schema>;

/** Extracts a readable message from a Clerk API error. */
function clerkMessage(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const errors = (error as { errors?: Array<{ message?: string; longMessage?: string }> }).errors;
  const first = errors?.[0];
  return first?.longMessage ?? first?.message ?? null;
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <OnboardingContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const { refresh } = useOrg();
  const { reloadSession } = useAuth();
  const { createOrganization, setActive, isLoaded } = useOrganizationList();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Input>({
    resolver: zodResolver(Schema),
    defaultValues: { organizationName: "" },
  });

  const onSubmit = async (values: Input) => {
    setServerError(null);
    setSubmitting(true);
    try {
      if (!isLoaded || !createOrganization || !setActive) {
        setServerError("Organization management is still loading. Please try again.");
        return;
      }

      // Clerk owns organizations: create it there, then activate it so the
      // session token carries `org_id` and the backend can link it.
      const org = await createOrganization({ name: values.organizationName.trim() });
      await setActive({ organization: org.id });

      const session = await reloadSession({ requireOrg: true });
      await refresh();

      if (!session?.organizationId) {
        setServerError(
          "Your organization was created, but the app is still syncing with it. Refresh in a moment — you won't be asked to create another one.",
        );
        return;
      }
      router.push("/dashboard");
    } catch (e) {
      setServerError(
        clerkMessage(e) ??
          (e instanceof Error ? e.message : "Could not create organization. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col justify-center gap-4 px-4 py-8">
      <PageHeader
        title="Create your organization"
        description="You need an organization to access the dashboard. You'll become its admin."
      />
      <Card title="Name your organization">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" aria-label="Organization creation form">
          <Input
            label="Organization name"
            required
            placeholder="Smartline Publishers"
            error={form.formState.errors.organizationName?.message}
            {...form.register("organizationName")}
          />
          {serverError ? <Alert tone="error">{serverError}</Alert> : null}
          <Button type="submit" disabled={submitting || !isLoaded}>
            {submitting ? "Creating…" : "Create organization"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
