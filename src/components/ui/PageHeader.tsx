import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Hide header actions on phones when a contextual FAB owns the CTA. */
  hideActionsOnMobile?: boolean;
  className?: string;
}

/** Page heading: title, supporting line, optional action slot on the right. */
export function PageHeader({
  title,
  description,
  actions,
  hideActionsOnMobile = false,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3 md:mb-5 md:gap-[14px]", className)}>
      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <h1 className="text-[23px] font-bold leading-tight tracking-[-0.5px] text-ink dark:text-neutral-100 md:text-[25px] md:tracking-[-0.6px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm leading-snug text-muted dark:text-neutral-400 md:mt-[5px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={cn(
            "flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap",
            hideActionsOnMobile && "hidden md:flex",
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
