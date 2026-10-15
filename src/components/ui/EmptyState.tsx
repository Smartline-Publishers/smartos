import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-[35px] text-center">
      <p className="text-sm font-semibold text-ink dark:text-neutral-100">{title}</p>
      {description ? <p className="max-w-sm text-[13px] text-muted dark:text-neutral-400">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
