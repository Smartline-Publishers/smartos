"use client";

import { useCallback, useEffect, useState } from "react";

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

interface PersistedPagedQuery {
  page: number;
  pageSize: number;
  search: string;
}

function storageKey(): string {
  if (typeof window === "undefined") return "smartos.paged";
  return `smartos.paged.${window.location.pathname}`;
}

function readPersisted(initial?: { page?: number; pageSize?: number; search?: string }): PersistedPagedQuery {
  const fallback: PersistedPagedQuery = {
    page: initial?.page ?? 1,
    pageSize: initial?.pageSize ?? 10,
    search: initial?.search ?? "",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(storageKey());
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedPagedQuery>;
    return {
      page: typeof parsed.page === "number" && parsed.page > 0 ? parsed.page : fallback.page,
      pageSize: typeof parsed.pageSize === "number" && parsed.pageSize > 0 ? parsed.pageSize : fallback.pageSize,
      search: typeof parsed.search === "string" ? parsed.search : fallback.search,
    };
  } catch {
    return fallback;
  }
}

export function usePagedQuery(initial?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): PagedQuery {
  const [state, setState] = useState<PersistedPagedQuery>(() => readPersisted(initial));

  // Persist whenever the query state changes so a refresh restores it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(storageKey(), JSON.stringify(state));
    } catch {
      // Storage unavailable — in-memory state still works for the session.
    }
  }, [state]);

  const setPage = useCallback((p: number) => {
    setState((prev) => ({ ...prev, page: p > 0 ? p : 1 }));
  }, []);

  const setPageSize = useCallback((s: number) => {
    setState((prev) => ({ ...prev, pageSize: s > 0 ? s : prev.pageSize, page: 1 }));
  }, []);

  const setSearch = useCallback((s: string) => {
    setState((prev) => ({ ...prev, search: s, page: 1 }));
  }, []);

  const reset = useCallback(() => {
    setState({
      page: 1,
      pageSize: initial?.pageSize ?? 10,
      search: "",
    });
  }, [initial?.pageSize]);

  const toParams = useCallback(() => {
    const trimmed = state.search.trim();
    return {
      page: state.page,
      pageSize: state.pageSize,
      ...(trimmed.length > 0 ? { search: trimmed } : {}),
    };
  }, [state]);

  return {
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    setPage,
    setPageSize,
    setSearch,
    reset,
    toParams,
  };
}