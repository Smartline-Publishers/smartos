"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookTable } from "@/features/books/BookTable";
import { listBooks } from "@/features/books/api";
import { usePagedQuery } from "@/hooks/use-paged-query";
import type { Book, BookStatus } from "@/types/book";
import type { Page } from "@/types/api";

export default function BooksPage() {
  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Books"
            description="Every title in the catalog, by publication status."
          />
          <Suspense fallback={<Spinner label="Loading books…" />}>
            <BooksContent />
          </Suspense>
        </div>
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
  const params = query.toParams();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    listBooks({ ...params, ...(status ? { status } : {}) })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize, params.search, status]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
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
      </div>

      {loading ? (
        <Spinner label="Loading books…" />
      ) : error ? (
        <EmptyState title="Could not load books" description={error} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No books found" description="Try a different search or status filter." />
      ) : (
        <>
          <p className="text-[13px] text-slate-600" aria-live="polite">
            <span className="font-semibold tabular-nums text-slate-900">{data.total}</span>{" "}
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
    </>
  );
}
