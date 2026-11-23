"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/hooks/use-auth";
import { useOrg } from "@/hooks/use-org";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import { OrganizationSettings } from "@/features/settings/OrganizationSettings";
import { ThemeCustomizer } from "@/features/settings/ThemeCustomizer";
import { AppearanceSettings } from "@/features/settings/AppearanceSettings";
import { Card } from "@/components/ui/Card";
import { UserProfile } from "@clerk/nextjs";

const SECTIONS = ["organization", "account", "appearance"] as const;
type Section = (typeof SECTIONS)[number];

const SECTION_LABELS: Record<Section, string> = {
  organization: "Organization",
  account: "Account",
  appearance: "Appearance",
};

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Settings"
            description="Organization, profile, appearance, and security."
          />
          <Suspense fallback={<PageSkeleton />}>
            <SettingsContent />
          </Suspense>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const { permissions } = useAuth();
  const { org, loading, refresh } = useOrg();
  // Organization settings are only for roles that may administer them.
  const admin = hasPermission(permissions, "org.settings.write");
  const requested = searchParams.get("section");
  const section: Section =
    requested === "organization" ||
    requested === "account" ||
    requested === "appearance"
      ? requested
      : admin
        ? "organization"
        : "account";
  const visible: Section[] = admin
    ? ["organization", "account", "appearance"]
    : ["account", "appearance"];

  if (loading && !org && admin) {
    return <PageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      <nav
        aria-label="Settings sections"
        className="no-scrollbar shell-scroll flex snap-x gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1 shadow-[0_1px_2px_rgb(15_23_42/0.04)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none md:rounded-xl"
      >
        {visible.map((s) => (
          <Link
            key={s}
            href={`/settings?section=${s}`}
            aria-current={section === s ? "page" : undefined}
            className={cn(
              "flex min-h-10 shrink-0 snap-start items-center rounded-xl px-3.5 text-sm font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:min-h-0 md:rounded-lg md:px-3 md:py-2",
              section === s
                ? "bg-brand-600 text-[rgb(var(--org-on-primary,255_255_255))] shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-ink dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
            )}
          >
            {SECTION_LABELS[s]}
          </Link>
        ))}
      </nav>

      {section === "organization" ? (
        admin && org ? (
          <div className="flex flex-col gap-4">
            <OrganizationSettings org={org} onSaved={refresh} />
            <Card title="Brand theme">
              <p className="mb-3 text-sm text-slate-600 dark:text-neutral-400">
                Light and dark palettes are configured together and apply to everyone in the
                organization. Both modes are required; leave the default theme by resetting.
              </p>
              <ThemeCustomizer initial={org.theme} onSaved={refresh} />
            </Card>
          </div>
        ) : (
          <EmptyState
            title="Organization settings unavailable"
            description="Only organization administrators can manage these settings."
          />
        )
      ) : null}

      {section === "account" ? (
        <Suspense fallback={<PageSkeleton />}>
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
            <UserProfile routing="hash" />
          </div>
        </Suspense>
      ) : null}

      {section === "appearance" ? <AppearanceSettings isAdmin={admin} /> : null}
    </div>
  );
}

