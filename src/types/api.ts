/** Standard envelope returned by the backend: { success, data, meta, error }. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: unknown;
  error?: { code: string; message: string; fields?: Record<string, string> } | null;
}

/** Canonical paginated list used by UI components (1-indexed page). */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Raw Spring PageResponse shape from the backend (0-indexed page). */
export interface SpringPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Map a backend Spring page to the UI Page shape. */
export function toPage<T>(s: SpringPage<T>): Page<T> {
  return {
    items: s.content,
    total: s.totalElements,
    page: s.page + 1,
    pageSize: s.size,
  };
}

export interface PagedParams {
  page?: number;
  pageSize?: number;
  search?: string;
}
