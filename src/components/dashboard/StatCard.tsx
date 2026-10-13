import Link from "next/link";
import { cn } from "@/lib/cn";
import { Sparkline } from "@/components/charts/Sparkline";

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
}

const DELTA_TONE: Record<StatDelta["tone"], string> = {
  up: "bg-emerald-50 text-emerald-800",
  down: "bg-rose-50 text-rose-800",
  flat: "bg-slate-100 text-slate-700",
};

const DELTA_MARK: Record<StatDelta["tone"], string> = { up: "▲", down: "▼", flat: "•" };

/** KPI card: label, tabular figure, text delta chip (never color-only), optional sparkline. */
export function StatCard({ label, value, sub, delta, spark, href, linkLabel }: StatCardProps) {
  return (
    <section
      aria-label={label}
      className="flex min-w-0 flex-col gap-1 rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42/0.05)]"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-[13px] font-semibold text-slate-600">{label}</h2>
        {delta ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              DELTA_TONE[delta.tone],
            )}
          >
            <span aria-hidden="true">{DELTA_MARK[delta.tone]}</span>
            {delta.text}
          </span>
        ) : null}
      </div>
      <p className="text-[28px] font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
      <div className="mt-auto flex items-end justify-between gap-3">
        <div className="min-w-0">
          {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
          {href && linkLabel ? (
            <Link
              href={href}
              className="mt-1 inline-block text-[13px] font-semibold text-brand-700 hover:underline"
            >
              {linkLabel}
            </Link>
          ) : null}
        </div>
        {spark ? (
          <Sparkline
            data={spark.data}
            label={spark.label}
            className="shrink-0 text-brand-600"
          />
        ) : null}
      </div>
    </section>
  );
}
