"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CaretDown,
  CaretRight,
  Compass,
  FileText,
  Lifebuoy,
  MagnifyingGlass,
  Printer,
  Question,
  RocketLaunch,
  Scales,
  ShoppingCart,
  SquaresFour,
  Warehouse,
  WarningOctagon,
  Wrench,
  X,
} from "@phosphor-icons/react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/cn";
import type { Permission } from "@/types/auth";
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  searchHelp,
  type HelpArticle,
  type HelpCategory,
} from "@/features/help/content";

const QUICK_LINKS: Array<{
  href: string;
  label: string;
  description: string;
  icon: typeof BookOpen;
  permission?: Permission;
}> = [
  {
    href: "/books",
    label: "Catalogue basics",
    description: "Titles, ISBNs and statuses",
    icon: BookOpen,
    permission: "books.read",
  },
  {
    href: "/production",
    label: "Print runs and stock",
    description: "Plan, post and complete",
    icon: Printer,
    permission: "production.read",
  },
  {
    href: "/inventory",
    label: "Warehouses and transfers",
    description: "The immutable stock ledger",
    icon: Warehouse,
    permission: "inventory.read",
  },
  {
    href: "/orders",
    label: "Orders and fulfilment",
    description: "From draft to stock deduction",
    icon: ShoppingCart,
    permission: "orders.read",
  },
  {
    href: "/royalties",
    label: "Royalty statements",
    description: "Contracts, approval and payment",
    icon: FileText,
    permission: "royalties.read",
  },
  {
    href: "/legal",
    label: "Legal centre",
    description: "Terms, privacy and versions",
    icon: Scales,
  },
];

const CATEGORY_META: Record<
  HelpCategory,
  { description: string; icon: typeof BookOpen }
> = {
  "Getting started": {
    description: "Set up the workspace, invite the right people and understand the role model.",
    icon: RocketLaunch,
  },
  "Feature guides": {
    description: "Step-by-step workflows for books, manuscripts, production, stock, sales and royalties.",
    icon: BookOpen,
  },
  "Use cases": {
    description: "End-to-end scenarios that show how SmartOS modules fit together.",
    icon: Compass,
  },
  "Edge cases": {
    description: "Reversals, limits and unusual states that need extra care.",
    icon: WarningOctagon,
  },
  Troubleshooting: {
    description: "Diagnose blocked actions, missing data and sign-in problems.",
    icon: Wrench,
  },
  FAQs: {
    description: "Short answers to the questions teams ask most.",
    icon: Question,
  },
  Support: {
    description: "Who to contact and what to include in a request.",
    icon: Lifebuoy,
  },
};

const CATEGORY_COUNTS = HELP_CATEGORIES.reduce(
  (counts, category) => {
    counts[category] = HELP_ARTICLES.filter((article) => article.category === category).length;
    return counts;
  },
  {} as Record<HelpCategory, number>,
);

function categorySlug(category: HelpCategory): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function categoryFromSlug(slug: string | null): HelpCategory | null {
  if (!slug) return null;
  return HELP_CATEGORIES.find((category) => categorySlug(category) === slug) ?? null;
}

function SearchField({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <MagnifyingGlass
        size={17}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        className="h-11 w-full rounded-xl border border-[#d8e0ec] bg-white pl-9 pr-9 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <X size={15} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function ArticleBody({ article }: { article: HelpArticle }) {
  return (
    <div className="flex flex-col gap-3 pb-4 pr-1">
      {article.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="text-[13px] leading-relaxed text-slate-700 dark:text-neutral-300">
          {paragraph}
        </p>
      ))}

      {article.steps && article.steps.length > 0 ? (
        <ol className="flex list-none flex-col gap-2">
          {article.steps.map((step, index) => (
            <li key={step} className="flex gap-2.5 text-[13px] leading-relaxed text-slate-700 dark:text-neutral-300">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300"
              >
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {article.bullets && article.bullets.length > 0 ? (
        <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-slate-700 dark:text-neutral-300">
          {article.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}

      {article.note ? (
        <Alert tone="info">
          <span className="font-semibold">Note: </span>
          {article.note}
        </Alert>
      ) : null}
    </div>
  );
}

function ArticleItem({
  article,
  openByDefault,
  canOpenHref,
}: {
  article: HelpArticle;
  openByDefault: boolean;
  canOpenHref: boolean;
}) {
  return (
    <details
      id={article.id}
      open={openByDefault}
      className="group scroll-mt-6 border-b border-line last:border-b-0 dark:border-neutral-800"
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 px-1 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-snug text-ink dark:text-neutral-100">
            {article.title}
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted dark:text-neutral-400">
            {article.summary}
          </span>
        </span>
        <CaretDown
          size={17}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-slate-400 transition-transform duration-150 group-open:rotate-180 dark:text-neutral-500"
        />
      </summary>
      <div className="pl-1">
        <ArticleBody article={article} />
        {article.href && canOpenHref ? (
          <Link
            href={article.href}
            className="mb-4 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
          >
            Open the relevant page
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </details>
  );
}

function CategoryNav({
  selected,
  onNavigate,
}: {
  selected: HelpCategory | null;
  onNavigate: () => void;
}) {
  const linkBase =
    "flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:min-h-0 lg:w-full lg:gap-2 lg:rounded-lg lg:border-transparent lg:px-2.5 lg:py-2 lg:text-[12.5px]";
  const active = "border-brand-600 bg-brand-600 text-[rgb(var(--org-on-primary,255_255_255))]";
  const idle =
    "border-line bg-white text-slate-600 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800";

  return (
    <div className="rounded-2xl border border-line bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto shell-scroll">
      <p className="hidden px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted dark:text-neutral-500 lg:block">
        Browse topics
      </p>
      <nav
        aria-label="Help categories"
        className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0"
      >
        <Link
          href="/help"
          onClick={onNavigate}
          aria-current={selected === null ? "page" : undefined}
          className={cn(linkBase, selected === null ? active : idle)}
        >
          <SquaresFour size={16} aria-hidden="true" className="shrink-0" />
          <span className="min-w-0 flex-1">All topics</span>
          <span
            aria-hidden="true"
            className="hidden shrink-0 text-[11px] font-semibold tabular-nums opacity-75 lg:inline"
          >
            {HELP_ARTICLES.length}
          </span>
        </Link>
        {HELP_CATEGORIES.map((category) => {
          const Icon = CATEGORY_META[category].icon;
          const current = selected === category;
          return (
            <Link
              key={category}
              href={`/help?category=${categorySlug(category)}`}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={cn(linkBase, current ? active : idle)}
            >
              <Icon size={16} aria-hidden="true" className="shrink-0" />
              <span className="min-w-0 flex-1">{category}</span>
              <span
                aria-hidden="true"
                className="hidden shrink-0 text-[11px] font-semibold tabular-nums opacity-75 lg:inline"
              >
                {CATEGORY_COUNTS[category]}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function HelpHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { permissions } = useAuth();
  const [query, setQuery] = useState("");
  const [hash, setHash] = useState("");
  const selected = categoryFromSlug(searchParams.get("category"));
  const searching = query.trim().length > 0;

  const searched = useMemo(() => searchHelp(HELP_ARTICLES, query), [query]);
  const categoryArticles = useMemo(
    () => (selected ? searched.filter((article) => article.category === selected) : []),
    [searched, selected],
  );
  const searchGroups = useMemo(
    () =>
      HELP_CATEGORIES.map((name) => ({
        name,
        articles: searched.filter((article) => article.category === name),
      })).filter((group) => group.articles.length > 0),
    [searched],
  );

  const canOpenHref = (article: HelpArticle) =>
    !article.permission || hasPermission(permissions, article.permission);

  const quickLinks = QUICK_LINKS.filter(
    (link) => !link.permission || hasPermission(permissions, link.permission),
  );

  useEffect(() => {
    const sync = () => setHash(window.location.hash.replace(/^#/, ""));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    document.title = selected ? `${selected} | Help Hub | SmartOS` : "Help Hub | SmartOS";
  }, [selected]);

  // A bare /help#article link still lands on the right category.
  useEffect(() => {
    if (selected || !hash) return;
    const article = HELP_ARTICLES.find((entry) => entry.id === hash);
    if (!article) return;
    router.replace(`/help?category=${categorySlug(article.category)}#${hash}`, {
      scroll: false,
    });
  }, [hash, router, selected]);

  // Category switches start a new reading context. Deep links scroll to the
  // requested article once that category has rendered.
  useEffect(() => {
    const main = document.getElementById("main-content");
    const targetId = window.location.hash.replace(/^#/, "");
    const frame = requestAnimationFrame(() => {
      if (targetId) {
        document.getElementById(targetId)?.scrollIntoView({ block: "start" });
      } else {
        main?.scrollTo({ top: 0 });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [selected]);

  const goToHub = () => {
    setQuery("");
    router.push("/help", { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4">
      {selected ? (
        <div>
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex list-none flex-wrap items-center gap-1.5 text-xs">
              <li>
                <Link
                  href="/help"
                  onClick={() => setQuery("")}
                  className="font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
                >
                  Help Hub
                </Link>
              </li>
              <li aria-hidden="true">
                <CaretRight size={10} className="text-slate-400 dark:text-neutral-500" />
              </li>
              <li aria-current="page" className="font-medium text-slate-600 dark:text-neutral-300">
                {selected}
              </li>
            </ol>
          </nav>
          <PageHeader
            title={selected}
            description={CATEGORY_META[selected].description}
            className="mb-0"
          />
        </div>
      ) : (
        <PageHeader
          title="Help Hub"
          description={`Browse by topic, or search all ${HELP_ARTICLES.length} guides for this workspace.`}
        />
      )}

      {!selected ? (
        <Card className="overflow-hidden p-0 md:p-0">
          <div className="border-b border-line bg-gradient-to-br from-brand-50 via-white to-tertiary-50 p-4 dark:border-neutral-800 dark:from-brand-950/40 dark:via-neutral-900 dark:to-neutral-900 md:p-5">
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm"
              >
                <Lifebuoy size={21} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold text-ink dark:text-neutral-100">
                  What do you need help with?
                </h2>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted dark:text-neutral-400">
                  Search by task, module, role or error. Every guide is written for this
                  product, not a generic template.
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <SearchField
                value={query}
                onChange={setQuery}
                label="Search help articles"
                placeholder="Try “posted run”, “refund”, “invite” or “role”"
              />
              <span className="hidden shrink-0 text-xs text-muted dark:text-neutral-400 sm:block">
                {searching
                  ? `${searched.length} of ${HELP_ARTICLES.length}`
                  : `${HELP_ARTICLES.length} guides`}
              </span>
            </div>
          </div>
        </Card>
      ) : null}

      {!selected && !searching ? (
        <>
          <section aria-labelledby="help-topics" className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <h2
                id="help-topics"
                className="text-[15px] font-semibold text-ink dark:text-neutral-100"
              >
                Browse by topic
              </h2>
              <p className="text-xs text-muted dark:text-neutral-400">
                {HELP_CATEGORIES.length} topics · {HELP_ARTICLES.length} guides
              </p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {HELP_CATEGORIES.map((category) => {
                const Icon = CATEGORY_META[category].icon;
                return (
                  <Link
                    key={category}
                    href={`/help?category=${categorySlug(category)}`}
                    className="group flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-[0_6px_16px_rgb(15_23_42/0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none dark:hover:border-brand-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                      >
                        <Icon size={20} />
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {CATEGORY_COUNTS[category]} guides
                      </span>
                    </div>
                    <h3 className="mt-3 text-[15px] font-semibold text-ink dark:text-neutral-100">
                      {category}
                    </h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted dark:text-neutral-400">
                      {CATEGORY_META[category].description}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[12.5px] font-semibold text-brand-700 dark:text-brand-300">
                      Explore {category.toLowerCase()}
                      <ArrowRight
                        size={13}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {quickLinks.length > 0 ? (
            <section aria-labelledby="help-quick-links">
              <h2
                id="help-quick-links"
                className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted dark:text-neutral-500"
              >
                Quick links
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex items-center gap-3 rounded-xl border border-line bg-white p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-800 dark:hover:bg-brand-950/20"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-slate-100 text-slate-600 group-hover:bg-brand-100 group-hover:text-brand-700 dark:bg-neutral-800 dark:text-neutral-300 dark:group-hover:bg-brand-950 dark:group-hover:text-brand-300"
                      >
                        <Icon size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-semibold text-ink dark:text-neutral-100">
                          {link.label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted dark:text-neutral-400">
                          {link.description}
                        </span>
                      </span>
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-neutral-600"
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}

          <Card title="Still stuck?">
            <div className="flex flex-col gap-3 text-[13px] leading-relaxed text-slate-700 dark:text-neutral-300">
              <p>
                Contact your organisation administrator first for access or role problems. For
                product issues, send the workspace, record, time and exact error message to your
                agreed support channel.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/help?category=troubleshooting#trouble-support-request"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <Lifebuoy size={16} aria-hidden="true" />
                  Support request checklist
                </Link>
                <Link
                  href="/legal"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  <Scales size={16} aria-hidden="true" />
                  Legal centre
                </Link>
              </div>
            </div>
          </Card>
        </>
      ) : null}

      {!selected && searching ? (
        searched.length === 0 ? (
          <Card>
            <EmptyState
              title="No matching help articles"
              description="Try a broader term such as books, stock, order, royalty, invite or permission."
              action={
                <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-ink dark:text-neutral-100">
                Search results
              </h2>
              <p className="text-xs text-muted dark:text-neutral-400">
                {searched.length} {searched.length === 1 ? "guide" : "guides"} for “
                {query.trim()}”
              </p>
            </div>
            {searchGroups.map((group) => (
              <section
                key={group.name}
                aria-labelledby={`help-search-${categorySlug(group.name)}`}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3
                    id={`help-search-${categorySlug(group.name)}`}
                    className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted dark:text-neutral-500"
                  >
                    {group.name}
                  </h3>
                  <Link
                    href={`/help?category=${categorySlug(group.name)}`}
                    onClick={() => setQuery("")}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
                  >
                    Open topic
                    <ArrowRight size={12} aria-hidden="true" />
                  </Link>
                </div>
                <Card className="p-2 md:p-2">
                  {group.articles.map((article) => (
                    <ArticleItem
                      key={article.id}
                      article={article}
                      openByDefault={article.id === hash || group.articles.length === 1}
                      canOpenHref={canOpenHref(article)}
                    />
                  ))}
                </Card>
              </section>
            ))}
          </div>
        )
      ) : null}

      {selected ? (
        <div className="grid items-start gap-4 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-6">
          <aside className="min-w-0">
            <CategoryNav selected={selected} onNavigate={() => setQuery("")} />
          </aside>

          <div className="flex min-w-0 flex-col gap-4">
            <Card className="p-3 md:p-4">
              <SearchField
                value={query}
                onChange={setQuery}
                label={`Search ${selected} help articles`}
                placeholder={`Search in ${selected.toLowerCase()}`}
              />
              <p className="mt-2 text-xs leading-relaxed text-muted dark:text-neutral-400">
                {searching
                  ? `Showing ${categoryArticles.length} of ${CATEGORY_COUNTS[selected]} guides.`
                  : `${CATEGORY_COUNTS[selected]} guides in this topic.`}
              </p>
            </Card>

            {categoryArticles.length === 0 ? (
              <Card>
                <EmptyState
                  title={searching ? "No matches in this topic" : "No guides in this topic"}
                  description={
                    searching
                      ? "Try a different word, or search every topic instead."
                      : "This topic does not have any guides yet."
                  }
                  action={
                    searching ? (
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push("/help", { scroll: false })}
                        >
                          Search all topics
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
                          Clear search
                        </Button>
                      </div>
                    ) : undefined
                  }
                />
              </Card>
            ) : (
              <Card className="p-2 md:p-2">
                {categoryArticles.map((article) => (
                  <ArticleItem
                    key={article.id}
                    article={article}
                    openByDefault={article.id === hash || categoryArticles.length === 1}
                    canOpenHref={canOpenHref(article)}
                  />
                ))}
              </Card>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted dark:text-neutral-400">
              <button
                type="button"
                onClick={goToHub}
                className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
              >
                <ArrowLeft size={13} aria-hidden="true" />
                Back to all topics
              </button>
              <span aria-hidden="true" className="text-slate-300 dark:text-neutral-700">
                ·
              </span>
              <Link
                href="/legal"
                className="font-semibold text-slate-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-neutral-300"
              >
                Legal centre
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function HelpPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense
          fallback={
            <div className="flex min-h-[320px] items-center justify-center">
              <Spinner label="Loading the Help Hub…" />
            </div>
          }
        >
          <HelpHubContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}
