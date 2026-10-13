"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Warning } from "@phosphor-icons/react";
import { Sparkline } from "@/components/charts/Sparkline";
import { Donut, type DonutSegment } from "@/components/charts/Donut";
import { BriefingHero } from "@/components/dashboard/BriefingHero";
import { StatCard } from "@/components/dashboard/StatCard";
import { AttentionList } from "@/components/dashboard/AttentionList";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { getSummary } from "@/features/dashboard/api";
import { useAuth } from "@/hooks/use-auth";
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

function displayName(email: string | undefined): string {
  if (!email) return "there";
  const raw = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "there";
}

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let alive = true;
    getSummary().then((s) => {
      if (alive) setSummary(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <h1 className="sr-only">Dashboard</h1>
        {!summary ? (
          <Spinner label="Loading summary…" />
        ) : (
          <div className="flex flex-col gap-4 md:gap-5" aria-live="polite">
            {summary.stale ? (
              <p
                role="status"
                className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                <Warning size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                <span>
                  Showing sample figures — the API is unreachable. Check{" "}
                  <code className="font-mono text-[13px]">NEXT_PUBLIC_API_URL</code> and the
                  backend will replace them with live data.
                </span>
              </p>
            ) : null}

            <BriefingHero
              summary={summary}
              userName={displayName(user?.email)}
              dateLabel={dateLabel}
              greeting={greetingFor(now.getHours())}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              />
              <StatCard
                label="Manuscripts in review"
                value={String(
                  (summary.manuscriptPipeline ?? [])
                    .filter((p) => p.stage === "Submitted" || p.stage === "In review")
                    .reduce((n, p) => n + p.count, 0),
                )}
                sub="Submitted or in review"
                href="/books"
                linkLabel="Review queue"
              />
              <StatCard
                label="Contributors"
                value={String(summary.totalContributors)}
                sub="Authors, editors and more"
                href="/contributors"
                linkLabel="Open contributors"
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
              />
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-3">
              <Card
                title="Title pipeline"
                action={
                  <Link
                    href="/books"
                    className="text-[13px] font-semibold text-brand-700 hover:underline"
                  >
                    Open catalog
                  </Link>
                }
                className="xl:col-span-2"
              >
                <PipelineDonut summary={summary} />
              </Card>
              <AttentionList items={summary.attention ?? []} />
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-3">
              <ActivityFeed items={summary.activity ?? []} />
              <Card title="Royalty outlook" className="xl:col-span-2">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                      {formatGHS(summary.pendingRoyalties)}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-600">
                      Payable to contributors this quarter
                    </p>
                  </div>
                  {summary.trends ? (
                    <Sparkline
                      data={summary.trends.royalties}
                      label="Royalties payable trend over the quarter"
                      width={220}
                      height={56}
                      className="h-14 w-52 text-emerald-700"
                    />
                  ) : null}
                </div>
              </Card>
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
    />
  );
}
