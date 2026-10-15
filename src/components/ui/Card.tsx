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
    <section className={cn("rounded-[13px] border border-line bg-white p-[17px] dark:border-neutral-800 dark:bg-neutral-900", className)}>
      {title || action ? (
        <header className="mb-[14px] flex items-center justify-between gap-2">
          {title ? <h2 className="text-[15px] font-semibold text-ink dark:text-neutral-100">{title}</h2> : <span />}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
