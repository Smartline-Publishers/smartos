"use client";

import { useCallback, useState } from "react";

export interface PagedQuery {
  page: number;
  pageSize: number;
  search: string;
  setPage: (p: number) => void;
  setPageSize: (s: number) => void;
  setSearch: (s: string) => void;
  reset: () => void;
  toParams: () => { page: number; pageSize: number; search?: string };
}

export function usePagedQuery(initial?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): PagedQuery {
  const [page, setPage] = useState<number>(initial?.page ?? 1);
  const [pageSize, setPageSize] = useState<number>(initial?.pageSize ?? 10);
  const [search, setSearchState] = useState<string>(initial?.search ?? "");

  const setSearch = useCallback((s: string) => {
    setSearchState(s);
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setPage(1);
    setPageSize(initial?.pageSize ?? 10);
    setSearchState("");
  }, [initial?.pageSize]);

  const toParams = useCallback(() => {
    const trimmed = search.trim();
    return {
      page,
      pageSize,
      ...(trimmed.length > 0 ? { search: trimmed } : {}),
    };
  }, [page, pageSize, search]);

  return { page, pageSize, search, setPage, setPageSize, setSearch, reset, toParams };
}
