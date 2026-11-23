"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Spinner } from "@/components/ui/Spinner";
import { Brand } from "@/components/layout/Brand";
import { useAuth } from "@/hooks/use-auth";
import { useOrg } from "@/hooks/use-org";
import { ApiError } from "@/lib/api-client";
import { bootstrapOrg } from "@/features/organization/api";

const Schema = z.object({
  organizationName: z.string().min(2, "Give your organization a name").max(200),
});

type Input = z.infer<typeof Schema>;

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
      await bootstrapOrg(values.organizationName);
      await reloadSession();
      await refresh();
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) setServerError(e.message);
      else setServerError("Could not create organization. Please try again.");
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
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create organization"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
