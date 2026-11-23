import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/format";
import type { ActivityItem, ActivityScope } from "@/types/dashboard";

interface ActivityFeedProps {
  items: ActivityItem[];
  /**
   * Backend-declared scope. Defaults to `SELF` so a missing field can never be
   * presented as organisation-wide activity.
   */
  scope?: ActivityScope;
  /** False when the surrounding Card already supplies the heading. */
  showHeading?: boolean;
}

/**
 * Recent activity timeline.
 *
 * <p>The backend decides what this contains — personal entries for ordinary
 * users, organisation entries for holders of `audit.read`. This component only
 * labels the data it was given; it never fetches or widens the scope.
 */
export function ActivityFeed({ items, scope = "SELF", showHeading = true }: ActivityFeedProps) {
  const organisationWide = scope === "ORGANIZATION";
  const title = organisationWide ? "Recent activity" : "Your recent activity";
  return (
    <section aria-label={title} className="flex min-w-0 flex-col">
      {showHeading ? (
        <h2 className="mb-1 text-[15px] font-bold text-slate-900 dark:text-neutral-100">{title}</h2>
      ) : null}
      {items.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description={
            organisationWide
              ? "Actions across your organisation will appear here."
              : "Actions you take will appear here."
          }
        />
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
