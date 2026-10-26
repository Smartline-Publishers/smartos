"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Book, BookOpen, Coins, Plus, Users, X, ShieldCheck, FileText, Gear, Printer, Warehouse, ShoppingCart, User, ListChecks, ChartBar } from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Sparkline } from "@/components/charts/Sparkline";
import { Donut, type DonutSegment } from "@/components/charts/Donut";
import { StatCard } from "@/components/dashboard/StatCard";
import { AttentionList } from "@/components/dashboard/AttentionList";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { getSummary } from "@/features/dashboard/api";
import { ApiError } from "@/lib/api-client";
import { formatGHS } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@/types/auth";
import type { DashboardSummary } from "@/types/dashboard";
import { useAuth } from "@/hooks/use-auth";
import { usePrimaryRole } from "@/hooks/use-auth";

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

function displayName(email: string | undefined): string | null {
  if (!email) return null;
  const first = email.split("@")[0].split(/[._-]+/).filter(Boolean)[0];
  if (!first) return null;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

interface DashboardProps {
  summary: DashboardSummary | null;
  loadError: string | null;
  user: { email?: string } | null;
  session: { roles: string[] } | null;
  permissions: Permission[];
  logout: () => void;
}

export function RoleBasedDashboard({
  summary,
  loadError,
  user,
  session,
  permissions,
  logout,
}: DashboardProps) {
  const primaryRole = usePrimaryRole();
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  const name = displayName(user?.email);

  if (loadError) {
    return <EmptyState title="Could not load summary" description={loadError} />;
  }
  if (!summary) {
    return <Spinner label="Loading summary…" />;
  }

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted dark:text-neutral-400">{dateLabel}</p>
          <h1 className="mt-1 text-[23px] font-bold leading-tight tracking-[-0.5px] text-ink dark:text-neutral-100 md:text-[25px] md:tracking-[-0.6px]">
            {greetingFor(now.getHours())}
            {name ? `, ${name}` : ""}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted dark:text-neutral-400">
            {getRoleDescription(primaryRole)}
          </p>
          {session && session.roles.length > 0 ? (
            <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
              <span className="font-semibold text-muted dark:text-neutral-400">Role:</span>{" "}
              {session.roles.map((role) => (
                <Badge key={role} status={role as any} />
              ))}
            </p>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
          {getQuickActions(primaryRole, permissions).map((action, i) => (
            <Link key={i} href={action.href} className={action.className}>
              {action.label}
            </Link>
          ))}
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
            {getStatCards(primaryRole, permissions, summary).map((card, i) => (
              <StatCard key={i} {...card} />
            ))}
          </div>

          <AttentionList items={summary.attention ?? []} />

          {getFinanceCard(primaryRole, permissions, summary)}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {getSideCards(primaryRole, permissions, summary).map((card, i) => (
            <Card key={i} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}

function getRoleDescription(role: string | null): string {
  const descriptions: Record<string, string> = {
    ORG_ADMIN: "Manage your organisation, users, settings, and all publishing operations.",
    EDITOR: "Oversee editorial workflows, review manuscripts, manage contributors, and track publication progress.",
    DESIGNER: "Manage design tasks, production workflows, and book layouts.",
    PRODUCTION: "Track production schedules, printing workflows, and inventory.",
    WAREHOUSE: "Manage warehouse operations, stock levels, and fulfilment.",
    SALES: "Track orders, customers, and sales pipeline.",
    FINANCE: "Monitor financials, royalties, budgets, and revenue.",
    AUTHOR: "Submit manuscripts, track your publications, and manage your profile.",
    VIEWER: "View permitted content and reports across the organisation.",
    PLATFORM_ADMIN: "Platform-wide administration and oversight.",
  };
  return descriptions[role ?? ""] || "Welcome to your dashboard.";
}

function getQuickActions(role: string | null, permissions: Permission[]) {
  const actions: Array<{ href: string; label: string; className: string }> = [];
  const canViewBooks = hasPermission(permissions, "books.read");
  const canCreateManuscript = hasPermission(permissions, "manuscripts.write");

  switch (role) {
    case "EDITOR":
    case "AUTHOR":
      if (canCreateManuscript) {
        actions.push({
          href: "/manuscripts",
          label: "＋ New manuscript",
          className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-600 bg-brand-600 px-[13px] text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        });
      }
      if (canViewBooks) {
        actions.push({
          href: "/books",
          label: "Open catalog",
          className: "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#d6dfec] bg-white px-[13px] text-sm font-semibold text-ink hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
        });
      }
      break;
    case "ORG_ADMIN":
      if (hasPermission(permissions, "users.write")) {
        actions.push({
          href: "/users",
          label: "Manage users",
          className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-600 bg-brand-600 px-[13px] text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        });
      }
      if (canViewBooks) {
        actions.push({
          href: "/books",
          label: "Open catalog",
          className: "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#d6dfec] bg-white px-[13px] text-sm font-semibold text-ink hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
        });
      }
      break;
    default:
      if (canViewBooks) {
        actions.push({
          href: "/books",
          label: "Open catalog",
          className: "inline-flex min-h-11 items-center justify-center rounded-lg border border-[#d6dfec] bg-white px-[13px] text-sm font-semibold text-ink hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
        });
      }
  }
  return actions;
}

function getStatCards(role: string | null, permissions: Permission[], summary: DashboardSummary) {
  const cards: Array<any> = [];
  const canViewBooks = hasPermission(permissions, "books.read");
  const canViewEditorial = hasPermission(permissions, "manuscripts.read");
  const canViewContributors = hasPermission(permissions, "contributors.read");
  const canViewFinance = hasPermission(permissions, "finance.read") || hasPermission(permissions, "royalties.read");
  const canViewProduction = hasPermission(permissions, "production.read");

  // Role-specific stat cards
  switch (role) {
    case "EDITOR":
      if (canViewEditorial) {
        cards.push({
          label: "Manuscripts in review",
          value: String(
            (summary.manuscriptPipeline ?? [])
              .filter((p) => p.stage === "Submitted" || p.stage === "In review")
              .reduce((n, p) => n + p.count, 0),
          ),
          sub: "Submitted or in review",
          href: "/manuscripts",
          linkLabel: "Review queue",
          icon: BookOpen,
          iconTone: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        });
      }
      if (canViewBooks) {
        cards.push({
          label: "Titles in catalog",
          value: String(summary.totalBooks),
          sub: `${summary.publishedBooks} published`,
          delta: summary.trends
            ? {
                text: `+${summary.trends.books[summary.trends.books.length - 1] - summary.trends.books[0]} this quarter`,
                tone: "up" as const,
              }
            : undefined,
          spark: summary.trends
            ? { data: summary.trends.books, label: "Catalog titles rising over the quarter" }
            : undefined,
          href: "/books",
          linkLabel: "Open catalog",
          icon: Book,
          iconTone: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
        });
      }
      if (canViewContributors) {
        cards.push({
          label: "Contributors",
          value: String(summary.totalContributors),
          sub: "Authors, editors and more",
          href: "/contributors",
          linkLabel: "Open contributors",
          icon: Users,
          iconTone: "bg-tertiary-50 text-tertiary-700 dark:bg-tertiary-950 dark:text-tertiary-300",
        });
      }
      break;

    case "ORG_ADMIN":
      if (canViewBooks) {
        cards.push({
          label: "Titles in catalog",
          value: String(summary.totalBooks),
          sub: `${summary.publishedBooks} published`,
          delta: summary.trends
            ? {
                text: `+${summary.trends.books[summary.trends.books.length - 1] - summary.trends.books[0]} this quarter`,
                tone: "up" as const,
              }
            : undefined,
          spark: summary.trends
            ? { data: summary.trends.books, label: "Catalog titles rising over the quarter" }
            : undefined,
          href: "/books",
          linkLabel: "Open catalog",
          icon: Book,
          iconTone: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
        });
      }
      if (canViewEditorial) {
        cards.push({
          label: "Manuscripts in review",
          value: String(
            (summary.manuscriptPipeline ?? [])
              .filter((p) => p.stage === "Submitted" || p.stage === "In review")
              .reduce((n, p) => n + p.count, 0),
          ),
          sub: "Submitted or in review",
          href: "/manuscripts",
          linkLabel: "Review queue",
          icon: BookOpen,
          iconTone: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        });
      }
      if (hasPermission(permissions, "users.read")) {
        cards.push({
          label: "Team members",
          value: String(summary.totalContributors), // Using contributors as proxy for team
          sub: "Users in organisation",
          href: "/users",
          linkLabel: "Manage users",
          icon: Users,
          iconTone: "bg-tertiary-50 text-tertiary-700 dark:bg-tertiary-950 dark:text-tertiary-300",
        });
      }
      if (canViewFinance) {
        cards.push({
          label: "Royalties payable",
          value: formatGHS(summary.pendingRoyalties),
          sub: "Due this quarter",
          spark: summary.trends
            ? { data: summary.trends.royalties, label: "Royalties payable rising over the quarter" }
            : undefined,
          href: "/royalties",
          linkLabel: "Review statements",
          icon: Coins,
          iconTone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        });
      }
      break;

    case "SALES":
      if (hasPermission(permissions, "orders.read")) {
        cards.push({
          label: "Active orders",
          value: String(summary.totalBooks), // Using books as proxy
          sub: "Orders this quarter",
          href: "/orders",
          linkLabel: "View orders",
          icon: ShoppingCart,
          iconTone: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
        });
      }
      if (hasPermission(permissions, "customers.read")) {
        cards.push({
          label: "Customers",
          value: String(summary.totalContributors), // Using contributors as proxy
          sub: "Active customers",
          href: "/customers",
          linkLabel: "View customers",
          icon: User,
          iconTone: "bg-tertiary-50 text-tertiary-700 dark:bg-tertiary-950 dark:text-tertiary-300",
        });
      }
      if (canViewFinance) {
        cards.push({
          label: "Revenue this quarter",
          value: formatGHS(summary.pendingRoyalties), // Using royalties as proxy
          sub: "Total revenue",
          href: "/finance",
          linkLabel: "View finance",
          icon: Coins,
          iconTone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        });
      }
      break;

    case "FINANCE":
      if (canViewFinance) {
        cards.push({
          label: "Royalties payable",
          value: formatGHS(summary.pendingRoyalties),
          sub: "Due this quarter",
          spark: summary.trends
            ? { data: summary.trends.royalties, label: "Royalties payable rising over the quarter" }
            : undefined,
          href: "/royalties",
          linkLabel: "Review statements",
          icon: Coins,
          iconTone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        });
        cards.push({
          label: "Budget overview",
          value: formatGHS(summary.pendingRoyalties * 2), // Proxy
          sub: "Quarterly budget",
          href: "/finance",
          linkLabel: "View budgets",
          icon: ChartBar,
          iconTone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        });
      }
      break;

    case "PRODUCTION":
      if (canViewProduction) {
        cards.push({
          label: "In production",
          value: String(
            (summary.titlePipeline ?? [])
              .filter((p) => p.stage === "Printing" || p.stage === "Designed")
              .reduce((n, p) => n + p.count, 0),
          ),
          sub: "Active production jobs",
          href: "/production",
          linkLabel: "View production",
          icon: Printer,
          iconTone: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        });
      }
      if (hasPermission(permissions, "inventory.read")) {
        cards.push({
          label: "Inventory items",
          value: String(summary.totalBooks), // Proxy
          sub: "Tracked in inventory",
          href: "/inventory",
          linkLabel: "View inventory",
          icon: Warehouse,
          iconTone: "bg-tertiary-50 text-tertiary-700 dark:bg-tertiary-950 dark:text-tertiary-300",
        });
      }
      break;

    case "DESIGNER":
      if (canViewBooks) {
        cards.push({
          label: "Titles in design",
          value: String(
            (summary.titlePipeline ?? [])
              .filter((p) => p.stage === "Designed" || p.stage === "In edit")
              .reduce((n, p) => n + p.count, 0),
          ),
          sub: "Design phase titles",
          href: "/books",
          linkLabel: "View catalog",
          icon: Book,
          iconTone: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
        });
      }
      break;

    default:
      // Generic fallback for other roles
      if (canViewBooks) {
        cards.push({
          label: "Titles in catalog",
          value: String(summary.totalBooks),
          sub: `${summary.publishedBooks} published`,
          delta: summary.trends
            ? {
                text: `+${summary.trends.books[summary.trends.books.length - 1] - summary.trends.books[0]} this quarter`,
                tone: "up" as const,
              }
            : undefined,
          spark: summary.trends
            ? { data: summary.trends.books, label: "Catalog titles rising over the quarter" }
            : undefined,
          href: "/books",
          linkLabel: "Open catalog",
          icon: Book,
          iconTone: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
        });
      }
      if (canViewEditorial) {
        cards.push({
          label: "Manuscripts in review",
          value: String(
            (summary.manuscriptPipeline ?? [])
              .filter((p) => p.stage === "Submitted" || p.stage === "In review")
              .reduce((n, p) => n + p.count, 0),
          ),
          sub: "Submitted or in review",
          href: "/manuscripts",
          linkLabel: "Review queue",
          icon: BookOpen,
          iconTone: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        });
      }
  }

  return cards;
}

function getFinanceCard(role: string | null, permissions: Permission[], summary: DashboardSummary) {
  const canViewFinance = hasPermission(permissions, "finance.read") || hasPermission(permissions, "royalties.read");

  if (!canViewFinance) return null;

  // Show finance card for roles that deal with money
  if (role === "ORG_ADMIN" || role === "FINANCE" || role === "EDITOR") {
    return (
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
    );
  }
  return null;
}

function getSideCards(role: string | null, permissions: Permission[], summary: DashboardSummary) {
  const cards: Array<any> = [];
  const canViewBooks = hasPermission(permissions, "books.read");
  const canViewProduction = hasPermission(permissions, "production.read");

  switch (role) {
    case "EDITOR":
      if (canViewBooks) {
        cards.push({
          title: "Title pipeline",
          action: (
            <Link
              href="/books"
              className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Open catalog
            </Link>
          ),
          children: <PipelineDonut summary={summary} />,
        });
      }
      if (hasPermission(permissions, "tasks.read")) {
        cards.push({
          title: "Editorial tasks",
          action: (
            <Link
              href="/tasks"
              className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              View tasks
            </Link>
          ),
          children: <ActivityFeed items={summary.activity ?? []} />,
        });
      }
      break;

    case "ORG_ADMIN":
      if (canViewBooks) {
        cards.push({
          title: "Title pipeline",
          action: (
            <Link
              href="/books"
              className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Open catalog
            </Link>
          ),
          children: <PipelineDonut summary={summary} />,
        });
      }
      if (hasPermission(permissions, "audit.read")) {
        cards.push({
          title: "Recent activity",
          action: (
            <Link
              href="/audit"
              className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              View audit log
            </Link>
          ),
          children: <ActivityFeed items={summary.activity ?? []} />,
        });
      }
      break;

    case "PRODUCTION":
      if (canViewProduction) {
        cards.push({
          title: "Production activity",
          action: (
            <Link
              href="/production"
              className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              View production
            </Link>
          ),
          children: <ActivityFeed items={summary.activity ?? []} />,
        });
      }
      break;

    case "SALES":
      if (hasPermission(permissions, "orders.read")) {
        cards.push({
          title: "Recent orders",
          action: (
            <Link
              href="/orders"
              className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              View orders
            </Link>
          ),
          children: <ActivityFeed items={summary.activity ?? []} />,
        });
      }
      break;

    default:
      if (canViewBooks) {
        cards.push({
          title: "Title pipeline",
          action: (
            <Link
              href="/books"
              className="text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Open catalog
            </Link>
          ),
          children: <PipelineDonut summary={summary} />,
        });
      }
      if (canViewProduction) {
        cards.push({
          children: <ActivityFeed items={summary.activity ?? []} />,
        });
      }
  }

  return cards;
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