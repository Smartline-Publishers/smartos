import type { ReactNode } from "react";
import { CheckCircle, Info, WarningCircle, XCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export type AlertTone = "info" | "success" | "warning" | "error";

const TONES: Record<
  AlertTone,
  { wrapper: string; icon: string; Icon: typeof Info }
> = {
  info: {
    wrapper:
      "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100",
    icon: "text-sky-600 dark:text-sky-300",
    Icon: Info,
  },
  success: {
    wrapper:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    icon: "text-emerald-600 dark:text-emerald-300",
    Icon: CheckCircle,
  },
  warning: {
    wrapper:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-300",
    Icon: WarningCircle,
  },
  error: {
    wrapper:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
    icon: "text-red-600 dark:text-red-300",
    Icon: XCircle,
  },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Standard inline feedback for forms and settings: error, success, info, warning. */
export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const { wrapper, icon, Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-relaxed",
        wrapper,
        className,
      )}
    >
      <Icon size={18} aria-hidden="true" className={cn("mt-0.5 shrink-0", icon)} />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
    </div>
  );
}
