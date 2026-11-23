"use client";

import Link from "next/link";
import { useState } from "react";
import { CaretDown, CheckCircle, Circle, X } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/use-auth";
import { useOrg } from "@/hooks/use-org";
import { updateOnboarding } from "@/features/settings/api";
import { cn } from "@/lib/cn";
import type { OnboardingChecklist as OnboardingChecklistData } from "@/features/settings/api";

const COLLAPSED_KEY = "smartos.onboardingCollapsed";

/**
 * Where "Complete Setup" should go: the first required step still outstanding.
 * Every role can open the profile and security sections, so this never lands
 * a user on a screen their role cannot access.
 */
function nextHref(onboarding: OnboardingChecklistData): string {
  const nextRequired = onboarding.items.find((i) => !i.optional && !i.completed);
  if (nextRequired) return nextRequired.href;
  const anyOpen = onboarding.items.find((i) => !i.completed);
  return anyOpen ? anyOpen.href : "/settings?section=profile";
}

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Compact, collapsible onboarding summary for the sidebar. Stays a fixed
 * small height so it never squeezes the nav or pushes the profile footer
 * out of view; the full checklist lives on the profile page.
 */
export function OnboardingChecklist() {
  const { user } = useAuth();
  const { onboarding, refresh } = useOrg();
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const [dismissing, setDismissing] = useState(false);

  if (!onboarding || onboarding.dismissed || onboarding.complete) return null;

  // Progress counts required steps only, matching the API's completion rule.
  const done = onboarding.requiredCompleted;
  const total = onboarding.requiredTotal;
  const percent = total === 0 ? 100 : Math.round((done / total) * 100);
  // The list shows the steps still outstanding, required ones first.
  const remaining = [...onboarding.items]
    .filter((i) => !i.completed)
    .sort((a, b) => Number(a.optional) - Number(b.optional));

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // Storage unavailable — session-only state still works.
      }
      return next;
    });
  };

  const dismiss = async () => {
    setDismissing(true);
    try {
      await updateOnboarding({ dismissed: true });
      await refresh();
    } finally {
      setDismissing(false);
    }
  };

  return (
    <section
      aria-label="Onboarding summary"
      className="mb-2 rounded-[10px] border border-white/10 bg-navy-800 p-2.5"
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand onboarding summary" : "Collapse onboarding summary"}
          title={collapsed ? "Expand" : "Collapse"}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-[rgb(var(--org-sidebar-fg,255_255_255))]">
            Finish setup · {done}/{total}
          </span>
          <CaretDown
            size={14}
            aria-hidden="true"
            className={cn(
              "shrink-0 text-[rgb(var(--org-sidebar-muted,212_212_212))] transition-transform duration-200",
              collapsed && "-rotate-90",
            )}
          />
        </button>
        <button
          type="button"
          onClick={dismiss}
          disabled={dismissing}
          aria-label="Dismiss onboarding checklist"
          title="Dismiss"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[rgb(var(--org-sidebar-muted,212_212_212))] transition-colors hover:bg-navy-700 hover:text-[rgb(var(--org-sidebar-fg,255_255_255))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Onboarding progress"
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy-700"
      >
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {collapsed ? null : (
        <div className="mt-1.5">
          <ul className="flex flex-col" aria-label="Remaining setup steps">
            {remaining
              .slice(0, 3)
              .map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    title={item.description}
                    className="flex items-center gap-2 rounded-lg px-1 py-1 text-xs text-[rgb(var(--org-sidebar-muted,219_230_247))] transition-colors hover:bg-navy-700 hover:text-[rgb(var(--org-sidebar-fg,255_255_255))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <Circle size={14} aria-hidden="true" className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.optional ? (
                      <span className="shrink-0 rounded-full bg-navy-700 px-1.5 py-px text-[10px] font-bold text-[rgb(var(--org-on-secondary,255_255_255))]">
                        Optional
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
          </ul>
          <div className="mt-1 flex items-center justify-between gap-2 px-1">
            <Link
              href="/profile#checklist"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[rgb(var(--org-sidebar-fg,255_255_255))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <CheckCircle size={14} aria-hidden="true" className="text-emerald-400" />
              Full checklist
            </Link>
            <Link
              href={nextHref(onboarding)}
              className="text-xs font-semibold text-[rgb(var(--org-sidebar-muted,212_212_212))] hover:text-[rgb(var(--org-sidebar-fg,255_255_255))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Complete Setup
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
