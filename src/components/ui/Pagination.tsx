"use client";

import { Button } from "@/components/ui/Button";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return (
    <nav aria-label="Pagination" className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={safePage <= 1}
        onClick={() => onPageChange(safePage - 1)}
        aria-label="Previous page"
      >
        Prev
      </Button>
      <span aria-live="polite" className="text-sm text-slate-600 dark:text-neutral-400">
        Page {safePage} of {totalPages} ({total} items)
      </span>
      <Button
        variant="ghost"
        size="sm"
        disabled={safePage >= totalPages}
        onClick={() => onPageChange(safePage + 1)}
        aria-label="Next page"
      >
        Next
      </Button>
    </nav>
  );
}
