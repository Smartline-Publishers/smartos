"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Book, BookOpen, Coins, Plus, Users, X } from "@phosphor-icons/react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Sparkline } from "@/components/charts/Sparkline";
import { Donut, type DonutSegment } from "@/components/charts/Donut";
import { StatCard } from "@/components/dashboard/StatCard";
import { AttentionList } from "@/components/dashboard/AttentionList";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { getSummary } from "@/features/dashboard/api";
import { ApiError } from "@/lib/api-client";
import { formatGHS } from "@/lib/format";
import type { DashboardSummary } from "@/types/dashboard";

const TITLE_COLORS: Record<string, string> = {
  Draft: "#94a3b8",
  "In edit": "#3383fc",
  Designed: "#8b5cf6",
  Printing: "#d9a93b",
  Published: "#059669",
  Archived: "#cbd5e1",
};

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** "admin@smartline.test" -> "Admin"; falls back to a generic greeting. */
function displayName(email: string | undefined): string | null {
  if (!email) return null;
  const first = email.split("@")[0].split(/[._-]+/).filter(Boolean)[0];
  if (!first) return null;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    let alive = true;
    // getSummary only throws for 401/403 (everything else degrades to
    // badged sample data). Expired sessions land back on /login instead of
    // spinning forever or showing fake figures as if authenticated.
    getSummary().then(
      (s) => {
        if (alive) setSummary(s);
      },
      (e: unknown) => {
        if (!alive) return;
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          logout();
        } else {
          setLoadError(e instanceof Error ? e.message : "Failed to load summary");
        }
      },
    );
    return () => {
      alive = false;
    };
  }, [logout]);

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  const name = displayName(user?.email);

  return (
    <ProtectedRoute>
      <AppShell>
        {loadError ? (
          <EmptyState title="Could not load summary" description={loadError} />
        ) : !summary ? (
          <Spinner label="Loading summary…" />
        ) : (
          <div className="flex flex-col gap-4" aria-live="polite">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-muted dark:text-neutral-400">{dateLabel}</p>
                <h1 className="mt-1 text-[25px] font-bold tracking-[-0.6px] text-ink dark:text-neutral-100">
                  {greetingFor(now.getHours())}
                  {name ? `, ${name}` : ""}
                </h1>
                <p className="mt-1 text-sm text-muted dark:text-neutral-400">
                  A single place to track Smartline&apos;s books and manuscripts.
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <Link
                  href="/books"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-[#d6dfec] bg-white px-[13px] text-sm font-semibold text-ink hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                >
                  Open catalog
                </Link>
                <Link
                  href="/manuscripts"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-brand-600 bg-brand-600 px-[13px] text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  ＋ New manuscript
                </Link>
              </div>
            </div>
            {summary.stale ? (
              <p
                role="status"
                className="rounded-[9px] border border-[#f1d49a] bg-[#fff8e9] px-[13px] py-[11px] text-xs text-[#7b571b] dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
              >
                Showing sample figures — the API is unreachable. Check{" "}
                <code className="font-mono">NEXT_PUBLIC_API_URL</code> and the
                backend will replace them with live data.
              </p>
            ) : null}
            <div className="grid items-start gap-4 lg:grid-cols-3">
              <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard
                    label="Titles in catalog"
                    value={String(summary.totalBooks)}
                    sub={`${summary.publishedBooks} published`}
                    delta={
                      summary.trends
                        ? {
                            text: `+${summary.trends.books[summary.trends.books.length - 1] - summary.trends.books[0]} this quarter`,
                            tone: "up",
                          }
                        : undefined
                    }
                    spark={
                      summary.trends
                        ? { data: summary.trends.books, label: "Catalog titles rising over the quarter" }
                        : undefined
                    }
                    href="/books"
                    linkLabel="Open catalog"
                    icon={Book}
                    iconTone="bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  />
                  <StatCard
                    label="Manuscripts in review"
                    value={String(
                      (summary.manuscriptPipeline ?? [])
                        .filter((p) => p.stage === "Submitted" || p.stage === "In review")
                        .reduce((n, p) => n + p.count, 0),
                    )}
                    sub="Submitted or in review"
                    href="/manuscripts"
                    linkLabel="Review queue"
                    icon={BookOpen}
                    iconTone="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  />
                  <StatCard
                    label="Contributors"
                    value={String(summary.totalContributors)}
                    sub="Authors, editors and more"
                    href="/contributors"
                    linkLabel="Open contributors"
                    icon={Users}
                    iconTone="bg-tertiary-50 text-tertiary-700 dark:bg-tertiary-950 dark:text-tertiary-300"
                  />
                  <StatCard
                    label="Royalties payable"
                    value={formatGHS(summary.pendingRoyalties)}
                    sub="Due this quarter"
                    spark={
                      summary.trends
                        ? { data: summary.trends.royalties, label: "Royalties payable rising over the quarter" }
                        : undefined
                    }
                    href="/contributors"
                    linkLabel="Review statements"
                    icon={Coins}
                    iconTone="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  />
                </div>

                <AttentionList items={summary.attention ?? []} />

                <Card title="Royalty outlook">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-neutral-100">
                        {formatGHS(summary.pendingRoyalties)}
                      </p>
                      <p className="mt-1 text-[13px] text-slate-600 dark:text-neutral-400">
                        Payable to contributors this quarter
                      </p>
                    </div>
                    {summary.trends ? (
                      <Sparkline
                        data={summary.trends.royalties}
                        label="Royalties payable trend over the quarter"
                        width={220}
                        height={56}
                        className="h-14 w-52 text-emerald-700 dark:text-emerald-400"
                      />
                    ) : null}
                  </div>
                </Card>
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <Card
                  title="Title pipeline"
                  action={
                    <Link
                      href="/books"
                      className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
                    >
                      Open catalog
                    </Link>
                  }
                >
                  <PipelineDonut summary={summary} />
                </Card>
                <ActivityFeed items={summary.activity ?? []} />
              </div>
            </div>

            {/* Mobile quick actions: expanding FAB replaces the header buttons. */}
            <div className="sm:hidden">
              {fabOpen ? (
                <button
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setFabOpen(false)}
                  className="fixed inset-0 z-40 cursor-default bg-transparent"
                />
              ) : null}
              {fabOpen ? (
                <div
                  className="fixed right-4 z-50 flex w-52 flex-col gap-2"
                  style={{ bottom: "calc(11.5rem + env(safe-area-inset-bottom))" }}
                >
                  <Link
                    href="/manuscripts"
                    className="flex min-h-[48px] items-center gap-3 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    <Plus size={18} aria-hidden="true" className="shrink-0 text-brand-600 dark:text-brand-400" />
                    New manuscript
                  </Link>
                  <Link
                    href="/books"
                    className="flex min-h-[48px] items-center gap-3 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    <Book size={18} aria-hidden="true" className="shrink-0 text-brand-600 dark:text-brand-400" />
                    Open catalog
                  </Link>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setFabOpen((v) => !v)}
                aria-expanded={fabOpen}
                aria-label={fabOpen ? "Close quick actions" : "Open quick actions"}
                className="fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                style={{ bottom: "calc(7rem + env(safe-area-inset-bottom))" }}
              >
                {fabOpen ? (
                  <X size={22} aria-hidden="true" />
                ) : (
                  <Plus size={22} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

function PipelineDonut({ summary }: { summary: DashboardSummary }) {
  const slices = summary.titlePipeline ?? [];
  const total = slices.reduce((n, s) => n + s.count, 0);
  const segments: DonutSegment[] = slices.map((s) => ({
    label: s.stage,
    value: s.count,
    color: TITLE_COLORS[s.stage] ?? "#64748b",
  }));
  return (
    <Donut
      segments={segments}
      label={`Title pipeline: ${slices.map((s) => `${s.count} ${s.stage}`).join(", ") || "no data"}`}
      centerTop={String(total)}
      centerBottom="titles"
      size={144}
      thickness={22}
    />
  );
}
