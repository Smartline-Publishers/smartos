"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/use-auth";
import { useOrg } from "@/hooks/use-org";
import { OnboardingChecklistCard } from "@/features/settings/OnboardingChecklistCard";

function isAdmin(roles: string[] | undefined): boolean {
  return !!roles?.some((r) => r === "ORG_ADMIN" || r === "PLATFORM_ADMIN");
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { org, profile } = useOrg();

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Profile"
            description="Your account and organization."
            actions={
              <Link
                href="/settings"
                className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-brand-600 bg-brand-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Settings
              </Link>
            }
          />
          <Card title="Account">            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500 dark:text-neutral-400">Name</dt>
                <dd className="mt-0.5 font-semibold text-ink dark:text-neutral-100">
                  {profile?.fullName || user?.email?.split("@")[0] || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-neutral-400">Email</dt>
                <dd className="mt-0.5 font-semibold text-ink dark:text-neutral-100">
                  {user?.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-neutral-400">Organization</dt>
                <dd className="mt-0.5 font-semibold text-ink dark:text-neutral-100">
                  {org ? `${org.name} (${org.slug})` : (user?.orgId ?? "—")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-neutral-400">Two-factor authentication</dt>
                <dd className="mt-0.5 font-semibold text-ink dark:text-neutral-100">
                  {profile?.totpEnabled ? "On" : "Off"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-500 dark:text-neutral-400">Roles</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {user && user.roles.length > 0 ? (
                    user.roles.map((role) => <Badge key={role} status={role} />)
                  ) : (
                    <span className="text-slate-500 dark:text-neutral-400">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </Card>
          <div id="checklist" className="scroll-mt-4">
            <OnboardingChecklistCard isAdmin={isAdmin(user?.roles)} />
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
