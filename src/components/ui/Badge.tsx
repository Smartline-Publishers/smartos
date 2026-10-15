import { cn } from "@/lib/cn";

export interface BadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-[#eef4ff] text-[#2457ba] dark:bg-blue-950 dark:text-blue-300",
  SUBMITTED: "bg-[#eef4ff] text-[#2457ba] dark:bg-blue-950 dark:text-blue-300",
  TODO: "bg-[#eef4ff] text-[#2457ba] dark:bg-blue-950 dark:text-blue-300",
  IN_EDIT: "bg-[#eef4ff] text-[#2457ba] dark:bg-blue-950 dark:text-blue-300",
  DESIGNED: "bg-[#eef4ff] text-[#2457ba] dark:bg-blue-950 dark:text-blue-300",
  PRINTING: "bg-[#eef4ff] text-[#2457ba] dark:bg-blue-950 dark:text-blue-300",
  IN_PROGRESS: "bg-[#eef4ff] text-[#2457ba] dark:bg-blue-950 dark:text-blue-300",
  PLANNED: "bg-[#eef4ff] text-[#2457ba] dark:bg-blue-950 dark:text-blue-300",
  REVIEW: "bg-[#fff4df] text-[#936016] dark:bg-amber-950 dark:text-amber-300",
  MEDIUM: "bg-[#fff4df] text-[#936016] dark:bg-amber-950 dark:text-amber-300",
  HIGH: "bg-[#fff4df] text-[#936016] dark:bg-amber-950 dark:text-amber-300",
  ADJUSTMENT: "bg-[#fff4df] text-[#936016] dark:bg-amber-950 dark:text-amber-300",
  REFUND: "bg-[#fff4df] text-[#936016] dark:bg-amber-950 dark:text-amber-300",
  CONFIRMED: "bg-[#eef4ff] text-[#2457ba] dark:bg-blue-950 dark:text-blue-300",
  PUBLISHED: "bg-[#e7f8f0] text-[#08784f] dark:bg-emerald-950 dark:text-emerald-300",
  APPROVED: "bg-[#e7f8f0] text-[#08784f] dark:bg-emerald-950 dark:text-emerald-300",
  COMPLETED: "bg-[#e7f8f0] text-[#08784f] dark:bg-emerald-950 dark:text-emerald-300",
  DONE: "bg-[#e7f8f0] text-[#08784f] dark:bg-emerald-950 dark:text-emerald-300",
  PAID: "bg-[#e7f8f0] text-[#08784f] dark:bg-emerald-950 dark:text-emerald-300",
  ACTIVE: "bg-[#e7f8f0] text-[#08784f] dark:bg-emerald-950 dark:text-emerald-300",
  FULFILLED: "bg-[#e7f8f0] text-[#08784f] dark:bg-emerald-950 dark:text-emerald-300",
  SALE: "bg-[#e7f8f0] text-[#08784f] dark:bg-emerald-950 dark:text-emerald-300",
  IN: "bg-[#e7f8f0] text-[#08784f] dark:bg-emerald-950 dark:text-emerald-300",
  ARCHIVED: "bg-[#eef1f5] text-[#5c6677] dark:bg-neutral-800 dark:text-neutral-300",
  CANCELLED: "bg-[#eef1f5] text-[#5c6677] dark:bg-neutral-800 dark:text-neutral-300",
  TERMINATED: "bg-[#eef1f5] text-[#5c6677] dark:bg-neutral-800 dark:text-neutral-300",
  INACTIVE: "bg-[#eef1f5] text-[#5c6677] dark:bg-neutral-800 dark:text-neutral-300",
  inactive: "bg-[#eef1f5] text-[#5c6677] dark:bg-neutral-800 dark:text-neutral-300",
  LOW: "bg-[#eef1f5] text-[#5c6677] dark:bg-neutral-800 dark:text-neutral-300",
  OUT: "bg-[#eef1f5] text-[#5c6677] dark:bg-neutral-800 dark:text-neutral-300",
  EXPENSE: "bg-[#eef1f5] text-[#5c6677] dark:bg-neutral-800 dark:text-neutral-300",
  ROYALTY_PAYOUT: "bg-[#eef4ff] text-[#2457ba] dark:bg-blue-950 dark:text-blue-300",
  active: "bg-[#e7f8f0] text-[#08784f] dark:bg-emerald-950 dark:text-emerald-300",
};

export function Badge({ status, className }: BadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-[#eef4ff] text-[#2457ba] dark:bg-blue-950 dark:text-blue-300";
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[30px] px-2 py-1 text-[10px] font-bold",
        style,
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
