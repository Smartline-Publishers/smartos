"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { RouteGuard } from "@/components/layout/RoleGuard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MobileFab } from "@/components/ui/MobileFab";
import { BookTable } from "@/features/books/BookTable";
import { BookForm } from "@/features/books/BookForm";
import { createBook, listBooks, type CreateBookInput } from "@/features/books/api";
import { ApiError } from "@/lib/api-client";
import { usePagedQuery } from "@/hooks/use-paged-query";
import type { Book, BookStatus } from "@/types/book";
import type { Page } from "@/types/api";

export default function BooksPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <RouteGuard><div className="flex flex-col gap-4">
          <PageHeader
            title="Books"
            description="Every title in the catalog, by publication status."
          />
          <Suspense fallback={<PageSkeleton />}>
            <BooksContent />
          </Suspense>
        </div>
      </RouteGuard>
      </AppShell>
    </ProtectedRoute>
  );
}

function BooksContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";
  const query = usePagedQuery({ pageSize: 10, search: initialSearch });
  const [status, setStatus] = useState<BookStatus | "">("");
  const [data, setData] = useState<Page<Book> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const params = query.toParams();
  // Typing in the search box updates on every keystroke; wait for a pause
  // before hitting the API so a single search issues one request, not one
  // per character. Pagination and status changes still fetch immediately.
  const debouncedSearch = useDebouncedValue(params.search, 400);

  const reload = (page: number = params.page) => {
    let alive = true;
    setLoading(true);
    setError(null);
    listBooks({ ...params, page, search: debouncedSearch, ...(status ? { status } : {}) })
      .then((d) => {
        if (alive) setData(d);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message ?? "Failed to load books");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  };

  useEffect(() => {
    const cancel = reload();
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize, debouncedSearch, status]);

  const handleCreate = async (values: CreateBookInput) => {
    setCreating(true);
    setCreateError(null);
    try {
      await createBook(values);
      setCreateOpen(false);
      setFormDirty(false);
      // Refetch through the paging effect when possible to avoid a double
      // request; reload directly only if already on page 1.
      if (params.page === 1) reload(1);
      else query.setPage(1);
    } catch (e) {
      setCreateError(e instanceof ApiError ? e.message : "Could not create the book.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Search"
            placeholder="Title or ISBN…"
            value={query.search}
            onChange={(e) => query.setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as BookStatus | "");
              query.setPage(1);
            }}
            options={[
              { value: "", label: "All statuses" },
              { value: "DRAFT", label: "Draft" },
              { value: "IN_EDIT", label: "In edit" },
              { value: "DESIGNED", label: "Designed" },
              { value: "PRINTING", label: "Printing" },
              { value: "PUBLISHED", label: "Published" },
              { value: "ARCHIVED", label: "Archived" },
            ]}
          />
        </div>
        <div className="hidden shrink-0 md:block">
          <Button onClick={() => { setCreateError(null); setCreateOpen(true); }}>
            New book
          </Button>
        </div>
      </div>

      <Modal
        open={createOpen}
        title="New book"
        description="Add a title to the catalog."
        onClose={() => setCreateOpen(false)}
        isDirty={formDirty}
      >
        <BookForm
          key="new-book"
          onSubmit={handleCreate}
          submitting={creating}
          onCancel={() => setCreateOpen(false)}
          onDirtyChange={setFormDirty}
        />
        {createError ? (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {createError}
          </p>
        ) : null}
      </Modal>

      {loading ? (
        <Spinner label="Loading books…" />
      ) : error ? (
        <EmptyState title="Could not load books" description={error} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No books found" description="Try a different search or status filter." />
      ) : (
        <>
          <p className="text-[13px] text-slate-600 dark:text-neutral-400" aria-live="polite">
            <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">{data.total}</span>{" "}
            {data.total === 1 ? "title" : "titles"}
          </p>
          <BookTable books={data.items} />
          <Pagination
            page={query.page}
            pageSize={query.pageSize}
            total={data.total}
            onPageChange={query.setPage}
          />
        </>
      )}

      <MobileFab
        label="New book"
        onClick={() => {
          setCreateError(null);
          setCreateOpen(true);
        }}
      />
    </>
  );
}

/** Return `value` delayed until it stops changing for `delayMs`. */
function useDebouncedValue<T>(value: T | undefined, delayMs: number): T | undefined {
  const [debounced, setDebounced] = useState<T | undefined>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

