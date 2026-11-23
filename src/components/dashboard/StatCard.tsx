import Link from "next/link";
import { cn } from "@/lib/cn";
import { Sparkline } from "@/components/charts/Sparkline";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export interface StatDelta {
  text: string;
  tone: "up" | "down" | "flat";
}

export interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  delta?: StatDelta;
  spark?: { data: number[]; label: string };
  href?: string;
  linkLabel?: string;
  /** Leading glyph in a tinted chip (e.g. the section icon). */
  icon?: PhosphorIcon;
  /** Chip colors, e.g. "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300". */
  iconTone?: string;
}

const DELTA_TEXT: Record<StatDelta["tone"], string> = {
  up: "text-[#08784f] dark:text-emerald-300",
  down: "text-[#5c6677] dark:text-neutral-300",
  flat: "text-[#5c6677] dark:text-neutral-300",
};

const DELTA_MARK: Record<StatDelta["tone"], string> = { up: "▲", down: "▼", flat: "•" };

/** Compact KPI card: icon chip, label, figure, delta line and sparkline. */
export function StatCard({
  label,
  value,
  sub,
  delta,
  spark,
  href,
  linkLabel,
  icon: CardIcon,
  iconTone,
}: StatCardProps) {
  return (
    <section
      aria-label={label}
      className="flex min-w-0 flex-col gap-0.5 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none md:rounded-[13px] md:p-3"
    >
      {CardIcon ? (
        <span
          aria-hidden="true"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-[10px] md:h-8 md:w-8 md:rounded-lg",
            iconTone ?? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
          )}
        >
          <CardIcon size={17} aria-hidden="true" />
        </span>
      ) : null}
      <h2 className="mt-1.5 truncate text-[13px] text-muted dark:text-neutral-400 md:mt-0 md:text-xs">{label}</h2>
      <p className="text-[24px] font-extrabold tabular-nums leading-tight tracking-tight text-ink dark:text-neutral-100 md:text-[22px]">
        {value}
      </p>
      <div className="mt-auto flex items-end justify-between gap-2 pt-1">
        <div className="min-w-0">
          {delta ? (
            <p className={cn("text-xs font-semibold", DELTA_TEXT[delta.tone])}>
              <span aria-hidden="true">{DELTA_MARK[delta.tone]} </span>
              {delta.text}
            </p>
          ) : null}
          {sub ? <p className="mt-0.5 text-[11px] text-muted dark:text-neutral-400">{sub}</p> : null}
          {href && linkLabel ? (
            <Link
              href={href}
              className="mt-0.5 inline-block text-[13px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              {linkLabel}
            </Link>
          ) : null}
        </div>
        {spark ? (
          <Sparkline
            data={spark.data}
            label={spark.label}
            className="h-8 w-20 shrink-0 text-brand-600 dark:text-brand-400"
          />
        ) : null}
      </div>
    </section>
  );
}
