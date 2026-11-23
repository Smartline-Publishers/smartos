"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowSquareOut,
  Printer,
  Scales,
  ShieldCheck,
  Warning,
} from "@phosphor-icons/react";
import { Brand } from "@/components/layout/Brand";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import {
  documentByCode,
  type LegalDocument,
  type LegalSection,
} from "@/features/legal/api";
import { useLegalDocuments } from "@/features/legal/useLegalDocuments";

const DOCUMENTS = [
  { query: "terms", label: "Terms of Service", icon: Scales },
  { query: "privacy", label: "Privacy Policy", icon: ShieldCheck },
] as const;

function formatDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

/**
 * Highlights the section currently in view.
 *
 * <p>The observation band sits just below the app bar, so the active entry
 * changes as a heading reaches reading position rather than when the whole
 * section has scrolled past. It is decoration only: every entry is a normal
 * anchor link and works without JavaScript.
 */
function useActiveSection(ids: string[]): string | null {
  const key = ids.join("|");
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    const sections = key ? key.split("|") : [];
    setActive(sections[0] ?? null);
    if (sections.length === 0) return;

    const elements = sections
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (firstVisible) setActive(firstVisible.target.id);
      },
      { rootMargin: "-88px 0px -62% 0px", threshold: 0 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [key]);

  return active;
}

function DocumentSwitcher({
  selectedQuery,
  layout,
}: {
  selectedQuery: string;
  layout: "sidebar" | "compact";
}) {
  const sidebar = layout === "sidebar";
  return (
    <div className={sidebar ? "flex flex-col gap-1" : "grid grid-cols-2 gap-1.5"}>
      {DOCUMENTS.map(({ query: docQuery, label, icon: Icon }) => {
        const current = selectedQuery === docQuery;
        return (
          <Link
            key={docQuery}
            href={`/legal?doc=${docQuery}`}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
              sidebar ? "justify-start lg:rounded-lg lg:px-2.5" : "justify-center",
              current
                ? "border-brand-600 bg-brand-600 text-[rgb(var(--org-on-primary,255_255_255))]"
                : "border-line bg-white text-slate-700 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
            )}
          >
            <Icon size={16} aria-hidden="true" className="shrink-0" />
            <span className="min-w-0 truncate">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function ContentsLinks({
  sections,
  activeId,
  layout,
}: {
  sections: LegalSection[];
  activeId: string | null;
  layout: "sidebar" | "chips";
}) {
  const sidebar = layout === "sidebar";
  const listRef = useRef<HTMLOListElement>(null);

  // Keep the highlighted entry visible: the mobile chip strip scrolls
  // horizontally and the desktop rail scrolls vertically, so on long
  // documents the active item can otherwise sit outside the visible area.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !activeId) return;
    const item = list.querySelector<HTMLElement>('[aria-current="location"]');
    if (!item) return;

    const itemRect = item.getBoundingClientRect();
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? "auto"
      : "smooth";

    if (list.scrollWidth > list.clientWidth + 1) {
      const listRect = list.getBoundingClientRect();
      const inside = itemRect.left >= listRect.left && itemRect.right <= listRect.right;
      if (!inside) {
        list.scrollTo({
          left:
            list.scrollLeft +
            (itemRect.left - listRect.left) -
            (list.clientWidth - itemRect.width) / 2,
          behavior,
        });
      }
    }

    let scroller = sidebar ? list.parentElement : null;
    while (scroller && scroller.scrollHeight <= scroller.clientHeight + 1) {
      scroller = scroller.parentElement;
    }
    if (scroller) {
      const scrollerRect = scroller.getBoundingClientRect();
      const inside = itemRect.top >= scrollerRect.top && itemRect.bottom <= scrollerRect.bottom;
      if (!inside) {
        scroller.scrollTo({
          top:
            scroller.scrollTop +
            (itemRect.top - scrollerRect.top) -
            (scroller.clientHeight - itemRect.height) / 2,
          behavior,
        });
      }
    }
  }, [activeId, sections]);

  return (
    <nav aria-label="On this page" className={sidebar ? undefined : "min-w-0 flex-1"}>
      <ol
        ref={listRef}
        className={cn(
          "list-none",
          sidebar
            ? "flex flex-col gap-0.5"
            : "no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5",
        )}
      >
        {sections.map((section) => {
          const current = activeId === section.id;
          return (
            <li key={section.id} className={sidebar ? undefined : "shrink-0"}>
              <a
                href={`#${section.id}`}
                aria-current={current ? "location" : undefined}
                className={cn(
                  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                  sidebar
                    ? "block rounded-lg px-2.5 py-2 text-[12.5px] leading-snug"
                    : "inline-flex min-h-8 items-center whitespace-nowrap rounded-full border px-3 text-xs font-medium",
                  current
                    ? sidebar
                      ? "bg-brand-50 font-semibold text-brand-800 dark:bg-brand-950/60 dark:text-brand-200"
                      : "border-brand-600 bg-brand-600 font-semibold text-[rgb(var(--org-on-primary,255_255_255))]"
                    : sidebar
                      ? "text-slate-600 hover:bg-slate-50 hover:text-ink dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                      : "border-line bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800",
                )}
              >
                {section.heading}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function DocumentBody({ document }: { document: LegalDocument }) {
  return (
    <article
      aria-label={`${document.title} content`}
      className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none sm:p-5 md:p-8 print:border-0 print:bg-white print:p-0 print:shadow-none"
    >
      <header className="border-b border-line pb-4 dark:border-neutral-800 print:border-slate-300">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-200">
            Version {document.version}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
            Effective {formatDate(document.effectiveDate)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="ml-auto shrink-0 print:hidden"
          >
            <Printer size={15} aria-hidden="true" />
            Print
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted dark:text-neutral-500">
          Recorded when you accept it during registration or an invitation.
        </p>
      </header>

      {document.content.reviewFlags && document.content.reviewFlags.length > 0 ? (
        <section
          aria-labelledby="legal-review-heading"
          className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/60 print:border-amber-400 print:bg-white"
        >
          <div className="flex items-start gap-2.5">
            <Warning
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300 print:text-amber-700"
            />
            <div>
              <h2
                id="legal-review-heading"
                className="text-sm font-semibold text-amber-950 dark:text-amber-100 print:text-amber-900"
              >
                Owner and legal review required before launch
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-900 dark:text-amber-200 print:text-amber-900">
                This is a product-specific draft, not a generic placeholder. The following
                deployment and commercial details must be confirmed by the business owner and
                qualified counsel before these documents are relied on.
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-amber-900 dark:text-amber-200 print:text-amber-900">
                {document.content.reviewFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-2 divide-y divide-line dark:divide-neutral-800 print:divide-slate-300">
        {document.content.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            className="scroll-mt-16 py-5 md:scroll-mt-6"
          >
            <h2
              id={`${section.id}-heading`}
              className="text-[17px] font-semibold tracking-[-0.2px] text-ink dark:text-neutral-100"
            >
              {section.heading}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-2 text-[13.5px] leading-relaxed text-slate-700 dark:text-neutral-300 print:text-slate-800"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-slate-700 dark:text-neutral-300 print:text-slate-800">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
            {section.reviewFlags && section.reviewFlags.length > 0 ? (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[12.5px] leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 print:border-amber-400 print:bg-white print:text-amber-900">
                <span className="font-semibold">Review note: </span>
                {section.reviewFlags.join(" ")}
              </div>
            ) : null}
          </section>
        ))}
      </div>

      {document.content.changelog ? (
        <footer className="border-t border-line pt-4 text-xs text-muted dark:border-neutral-800 dark:text-neutral-400 print:border-slate-300 print:text-slate-600">
          <span className="font-semibold text-ink dark:text-neutral-200 print:text-slate-900">
            Change history:{" "}
          </span>
          {document.content.changelog}
        </footer>
      ) : null}
    </article>
  );
}

function LegalContent() {
  const searchParams = useSearchParams();
  const legal = useLegalDocuments();
  const requested = searchParams.get("doc");
  const terms = documentByCode(legal.documents, "TERMS_OF_SERVICE");
  const privacy = documentByCode(legal.documents, "PRIVACY_POLICY");
  const selected = requested === "privacy" ? privacy : terms;
  const selectedQuery = requested === "privacy" ? "privacy" : "terms";
  const sectionIds = selected?.content.sections.map((section) => section.id) ?? [];
  const activeSection = useActiveSection(sectionIds);

  useEffect(() => {
    document.title = selected
      ? `${selected.title} v${selected.version} | SmartOS`
      : "Legal | SmartOS";
  }, [selected]);

  // Switching documents is a fresh read, so start at the top of the content
  // pane rather than leaving the reader halfway down a different agreement.
  useEffect(() => {
    document
      .getElementById("main-content")
      ?.scrollTo({ top: 0, behavior: "auto" });
  }, [selectedQuery]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-paper text-ink dark:bg-neutral-950 dark:text-neutral-100 md:flex-row print:block print:h-auto print:overflow-visible print:bg-white print:text-black">
      {/* Public counterpart of the app sidebar: fixed document navigation,
          independently scrolling contents, fixed help footer. */}
      <aside
        aria-label="Legal navigation"
        className="hidden h-dvh w-[264px] shrink-0 flex-col border-r border-line bg-white dark:border-neutral-800 dark:bg-neutral-900 md:flex print:hidden"
      >
        <div className="shrink-0 border-b border-line px-4 py-4 dark:border-neutral-800">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
            <Scales size={14} aria-hidden="true" />
            Legal centre
          </p>
          <p className="mt-2 truncate text-[13px] font-semibold text-ink dark:text-neutral-100">
            {selected?.title ?? "Legal documents"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted dark:text-neutral-400">
            {selected
              ? `Version ${selected.version} · Effective ${formatDate(selected.effectiveDate)}`
              : legal.loading
                ? "Loading versions…"
                : "No version published"}
          </p>
        </div>

        <div className="shell-scroll min-h-0 flex-1 overflow-y-auto overscroll-none px-3 py-4">
          {selected ? (
            <>
              <DocumentSwitcher selectedQuery={selectedQuery} layout="sidebar" />
              <div className="mt-4">
                <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted dark:text-neutral-500">
                  On this page
                </p>
                <ContentsLinks
                  sections={selected.content.sections}
                  activeId={activeSection}
                  layout="sidebar"
                />
              </div>
            </>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-line px-3 py-3 dark:border-neutral-800">
          <Link
            href="/help"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-semibold text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300 dark:hover:bg-brand-950"
          >
            Need help using SmartOS?
            <ArrowSquareOut size={13} aria-hidden="true" />
          </Link>
        </div>
      </aside>

      {/* Right column mirrors the app shell: fixed bar, scrolling main. */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col print:block">
        <header className="shrink-0 border-b border-line bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 print:hidden">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-4 py-3 md:px-7">
            <Link
              href="/"
              className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="SmartOS home"
            >
              <Brand tone="light" tagline={false} />
            </Link>
            <span
              aria-hidden="true"
              className="hidden h-5 w-px bg-line dark:bg-neutral-800 sm:block"
            />
            <Link
              href="/"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to SmartOS
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <Link
                href="/help"
                className="hidden rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 sm:inline-flex"
              >
                Help centre
              </Link>
              <Link
                href="/login"
                className="rounded-lg px-2.5 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300 dark:hover:bg-brand-950"
              >
                Sign in
              </Link>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="shell-scroll min-h-0 flex-1 overflow-y-auto overscroll-none overflow-x-hidden scroll-smooth motion-reduce:scroll-auto print:overflow-visible"
        >
          <div className="mx-auto w-full max-w-[980px] px-4 pb-12 pt-4 md:px-7 md:py-[26px] print:max-w-none print:p-0">
            {legal.loading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <Spinner label="Loading legal documents…" />
              </div>
            ) : null}

            {!legal.loading && legal.error ? (
              <Alert tone="error" title="Legal documents unavailable">
                <div className="flex flex-col gap-2">
                  <span>{legal.error}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void legal.reload()}
                    className="w-fit"
                  >
                    Try again
                  </Button>
                </div>
              </Alert>
            ) : null}

            {!legal.loading && !legal.error && !selected ? (
              <div className="rounded-2xl border border-line bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <EmptyState
                  title="No legal documents published"
                  description="The current versions have not been published yet. Please contact support."
                />
              </div>
            ) : null}

            {!legal.loading && !legal.error && selected ? (
              <>
                <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300 md:hidden">
                  <Scales size={13} aria-hidden="true" />
                  Legal centre
                </p>
                <div className="mb-4 md:hidden">
                  <DocumentSwitcher selectedQuery={selectedQuery} layout="compact" />
                </div>

                <PageHeader
                  title={selected.title}
                  description={selected.summary ?? undefined}
                />

                <div className="sticky top-0 z-20 -mx-4 mb-4 border-y border-line bg-paper/95 px-4 py-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 md:hidden print:hidden">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted dark:text-neutral-500">
                      Contents
                    </span>
                    <ContentsLinks
                      sections={selected.content.sections}
                      activeId={activeSection}
                      layout="chips"
                    />
                  </div>
                </div>

                <DocumentBody document={selected} />

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted dark:text-neutral-400 print:hidden">
                  <p>
                    Document {selected.code.replace(/_/g, " ").toLowerCase()} · version{" "}
                    {selected.version}
                  </p>
                  <Link
                    href="/help"
                    className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-neutral-300"
                  >
                    Need help? Visit the Help Hub
                    <ArrowSquareOut size={13} aria-hidden="true" />
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-paper dark:bg-neutral-950">
          <Spinner label="Loading legal documents…" />
        </div>
      }
    >
      <LegalContent />
    </Suspense>
  );
}
