"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ThemeSelector } from "@/components/layout/ThemeSelector";
import { useTheme } from "@/hooks/use-theme";

export function AppearanceSettings({ isAdmin }: { isAdmin: boolean }) {
  const { choice } = useTheme();
  return (
    <div className="flex flex-col gap-4">
      <Card title="Appearance">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-bold text-ink dark:text-neutral-200">Color mode</p>
            <p className="mt-0.5 text-[13px] text-slate-600 dark:text-neutral-400">
              Applies on this device immediately{choice === "system" ? " (following the OS)" : ""}.
            </p>
          </div>
          <ThemeSelector />
        </div>
      </Card>
      {isAdmin ? (
        <Card
          title="Organization theme"
          action={
            <Link
              href="/settings?section=organization"
              className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Customize
            </Link>
          }
        >
          <p className="text-sm text-slate-600 dark:text-neutral-400">
            Brand colors for light and dark mode are configured with the organization settings and
            apply to everyone in the organization.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
