"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/hooks/use-auth";
import { useOrg } from "@/hooks/use-org";
import { cn } from "@/lib/cn";
import { OrganizationSettings } from "@/features/settings/OrganizationSettings";
import { ThemeCustomizer } from "@/features/settings/ThemeCustomizer";
import { ProfileSettings } from "@/features/settings/ProfileSettings";
import { AppearanceSettings } from "@/features/settings/AppearanceSettings";
import { SecuritySettings } from "@/features/settings/SecuritySettings";
import { Card } from "@/components/ui/Card";

const SECTIONS = ["organization", "profile", "appearance", "security"] as const;
type Section = (typeof SECTIONS)[number];

const SECTION_LABELS: Record<Section, string> = {
  organization: "Organization",
  profile: "Profile",
  appearance: "Appearance",
  security: "Security",
};

function isAdmin(roles: string[] | undefined): boolean {
  return !!roles?.some((r) => r === "ORG_ADMIN" || r === "PLATFORM_ADMIN");
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Settings"
            description="Organization, profile, appearance, and security."
          />
          <Suspense fallback={<Spinner label="Loading settings…" />}>
            <SettingsContent />
          </Suspense>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { org, profile, loading, refresh } = useOrg();
  const admin = isAdmin(user?.roles);
  const requested = searchParams.get("section");
  const section: Section =
    requested === "organization" ||
    requested === "profile" ||
    requested === "appearance" ||
    requested === "security"
      ? requested
      : admin
        ? "organization"
        : "profile";
  const visible: Section[] = admin
    ? ["organization", "profile", "appearance", "security"]
    : ["profile", "appearance", "security"];

  if (loading && !org && !profile) {
    return <Spinner label="Loading settings…" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <nav
        aria-label="Settings sections"
        className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900"
      >
        {visible.map((s) => (
          <Link
            key={s}
            href={`/settings?section=${s}`}
            aria-current={section === s ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              section === s
                ? "bg-brand-600 text-white"
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

      {section === "profile" ? (
        profile ? (
          <ProfileSettings profile={profile} onSaved={refresh} />
        ) : (
          <Spinner label="Loading profile…" />
        )
      ) : null}

      {section === "appearance" ? <AppearanceSettings isAdmin={admin} /> : null}

      {section === "security" ? <SecuritySettings onChanged={refresh} /> : null}
    </div>
  );
}
