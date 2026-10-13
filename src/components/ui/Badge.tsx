import { cn } from "@/lib/cn";

export interface BadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  IN_EDIT: "bg-amber-100 text-amber-800",
  DESIGNED: "bg-blue-100 text-blue-800",
  PRINTING: "bg-violet-100 text-violet-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-slate-200 text-slate-600",
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  REVIEW: "bg-amber-100 text-amber-800",
  DONE: "bg-green-100 text-green-800",
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-rose-100 text-rose-800",
  PLANNED: "bg-slate-100 text-slate-700",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-200 text-slate-600",
  IN: "bg-green-100 text-green-800",
  OUT: "bg-rose-100 text-rose-800",
  ADJUSTMENT: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  FULFILLED: "bg-green-100 text-green-800",
  SALE: "bg-green-100 text-green-800",
  REFUND: "bg-amber-100 text-amber-800",
  EXPENSE: "bg-rose-100 text-rose-700",
  ROYALTY_PAYOUT: "bg-violet-100 text-violet-800",
  ACTIVE: "bg-green-100 text-green-800",
  TERMINATED: "bg-slate-200 text-slate-600",
  APPROVED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-slate-100 text-slate-600",
};

export function Badge({ status, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        style,
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
