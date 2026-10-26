"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useOrg } from "@/hooks/use-org";
import { updateOnboarding } from "@/features/settings/api";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import type { OnboardingChecklist } from "@/features/settings/api";

/**
 * Where the "Complete Setup" button should send the user: the first required
 * step they have not finished yet. Falls back to the profile section, which
 * every role can open.
 */
function nextHref(onboarding: OnboardingChecklist): string {
  const nextRequired = onboarding.items.find((i) => !i.optional && !i.completed);
  if (nextRequired) return nextRequired.href;
  const anyOpen = onboarding.items.find((i) => !i.completed);
  return anyOpen ? anyOpen.href : "/settings?section=profile";
}

/**
 * Full onboarding checklist card for the profile screen: every step with
 * its description, status, optional marker, and deep link, plus Complete
 * Setup and dismiss controls. Progress itself is derived live on the
 * backend; this card only persists explicit dismiss/skip choices.
 * Every user sees their own independent checklist.
 */
export function OnboardingChecklistCard() {
  const { onboarding, refresh } = useOrg();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dismiss = async (dismissed: boolean) => {
    setBusy(true);
    setError(null);
    try {
      await updateOnboarding({ dismissed });
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update the checklist.");
    } finally {
      setBusy(false);
    }
  };

  if (!onboarding) return null;

  if (onboarding.dismissed) {
    return (
      <Card title="Getting started">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600 dark:text-neutral-400">
            Setup checklist dismissed. You can resume it any time.
          </p>
          <Button size="sm" variant="ghost" onClick={() => dismiss(false)} disabled={busy}>
            {busy ? "Working…" : "Resume checklist"}
          </Button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </Card>
    );
  }

  if (onboarding.complete) return null;

  // Progress counts required steps only: optional tasks are shown for
  // guidance but never hold the user back.
  const requiredTotal = onboarding.requiredTotal;
  const requiredDone = onboarding.requiredCompleted;
  const percent = requiredTotal === 0 ? 100 : Math.round((requiredDone / requiredTotal) * 100);

  return (
    <Card
      title="Getting started"
      action={
        <span className="text-[13px] font-semibold tabular-nums text-muted dark:text-neutral-400">
          {requiredDone} of {requiredTotal} required complete
        </span>
      }
    >
      <div
        role="progressbar"
        aria-valuenow={requiredDone}
        aria-valuemin={0}
        aria-valuemax={requiredTotal}
        aria-label="Onboarding progress"
        className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <ul className="flex flex-col divide-y divide-line dark:divide-neutral-800">
        {onboarding.items.map((item) => (
          <li key={item.key} className="flex items-center gap-3 py-2.5">
            {item.completed ? (
              <CheckCircle size={20} aria-hidden="true" className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle size={20} aria-hidden="true" className="shrink-0 text-slate-400 dark:text-neutral-500" />
            )}
            <div className="min-w-0 flex-1">
              {/* The status pill is a sibling of the label, not part of it, so
                  the accessible name reads "Add an organization logo" and the
                  status is announced separately rather than as one run-together
                  string. */}
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink dark:text-neutral-100">
                <span className={cn(item.completed && "line-through opacity-70")}>
                  {item.label}
                </span>
                {item.optional ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                    Optional
                  </span>
                ) : null}
                {item.completed ? (
                  <>
                    <span aria-hidden="true" className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Done
                    </span>
                    <span className="sr-only">Completed</span>
                  </>
                ) : null}
              </p>
              <p className="mt-0.5 text-[13px] text-slate-600 dark:text-neutral-400">
                {item.description}
              </p>
            </div>
            {item.completed ? null : (
              <Link
                href={item.href}
                className="shrink-0 text-[13px] font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
              >
                Go
              </Link>
            )}
          </li>
        ))}
      </ul>
      {onboarding.optionalTotal > 0 ? (
        <p className="mt-2 text-[13px] text-muted dark:text-neutral-400">
          {onboarding.optionalTotal} optional{" "}
          {onboarding.optionalTotal === 1 ? "step is" : "steps are"} listed for guidance and do
          not affect completion.
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Link
          href={nextHref(onboarding)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-brand-600 bg-brand-600 px-[13px] text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Complete Setup
        </Link>
        <Button variant="ghost" onClick={() => dismiss(true)} disabled={busy}>
          {busy ? "Working…" : "Dismiss"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
