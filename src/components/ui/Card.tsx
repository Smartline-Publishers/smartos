import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, action, children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42/0.04)]",
        "dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none md:rounded-[13px] md:p-[17px]",
        className,
      )}
    >
      {title || action ? (
        <header className="mb-3 flex items-center justify-between gap-2 md:mb-[14px]">
          {title ? <h2 className="text-[16px] font-semibold text-ink dark:text-neutral-100">{title}</h2> : <span />}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
