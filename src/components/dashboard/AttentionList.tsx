import Link from "next/link";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AttentionItem, AttentionSeverity } from "@/types/dashboard";

const SEVERITY_PILL: Record<AttentionSeverity, string> = {
  high: "bg-rose-100 text-rose-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
};

const SEVERITY_DOT: Record<AttentionSeverity, string> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
};

const KIND_LABEL: Record<AttentionItem["kind"], string> = {
  approval: "Approval",
  task: "Task",
  stock: "Stock",
  royalty: "Royalty",
};

/** "Needs you" rail: prioritised operational items with text severity and due labels. */
export function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <section
      aria-label="Needs your attention"
      className="flex min-w-0 flex-col rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42/0.05)]"
    >
      <header className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-bold text-slate-900">
          Needs you{" "}
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
            {items.length}
          </span>
        </h2>
        <Link href="/books" className="text-[13px] font-semibold text-brand-700 hover:underline">
          View all
        </Link>
      </header>
      {items.length === 0 ? (
        <EmptyState title="All clear" description="Nothing needs your decision right now." />
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3">
              <span
                aria-hidden="true"
                className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEVERITY_DOT[item.severity])}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-slate-600">{item.detail}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-semibold capitalize",
                      SEVERITY_PILL[item.severity],
                    )}
                  >
                    {item.severity}
                  </span>
                  <span className="text-slate-500">{KIND_LABEL[item.kind]}</span>
                  {item.dueLabel ? (
                    <span className="font-medium text-slate-700">· {item.dueLabel}</span>
                  ) : null}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="ml-auto font-semibold text-brand-700 hover:underline"
                    >
                      Open
                    </Link>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
