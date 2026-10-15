import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Page heading: title, supporting line, optional action slot on the right. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-start justify-between gap-[14px]", className)}>
      <div className="min-w-0">
        <h1 className="text-[25px] font-bold tracking-[-0.6px] text-ink dark:text-neutral-100">{title}</h1>
        {description ? <p className="mt-[5px] text-sm text-muted dark:text-neutral-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
