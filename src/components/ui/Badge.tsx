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
