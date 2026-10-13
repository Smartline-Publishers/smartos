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
    <section className={cn("rounded-lg border border-slate-200 bg-white p-4 shadow-sm", className)}>
      {title || action ? (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : <span />}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
