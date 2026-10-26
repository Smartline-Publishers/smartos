import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/format";
import type { ActivityItem } from "@/types/dashboard";

/** Recent activity timeline. */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section
      aria-label="Recent activity"
      className="flex min-w-0 flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.05)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none sm:p-5 md:rounded-xl"
    >
      <h2 className="mb-1 text-[15px] font-bold text-slate-900 dark:text-neutral-100">Recent activity</h2>
      {items.length === 0 ? (
        <EmptyState title="No activity yet" description="Actions across the press will appear here." />
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.id} className="relative flex gap-3 py-2.5 pl-1">
              <span
                aria-hidden="true"
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500"
              />
              <p className="min-w-0 flex-1 text-sm leading-snug text-slate-700 dark:text-neutral-300">
                <span className="font-semibold text-slate-900 dark:text-neutral-100">{item.actor}</span> {item.action}
              </p>
              <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-neutral-400">
                {item.timeLabel ?? timeAgo(item.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
