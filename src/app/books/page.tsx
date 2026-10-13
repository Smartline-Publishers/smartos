"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { BookTable } from "@/features/books/BookTable";
import { listBooks } from "@/features/books/api";
import { usePagedQuery } from "@/hooks/use-paged-query";
import type { Book, BookStatus } from "@/types/book";
import type { Page } from "@/types/api";

export default function BooksPage() {
  const query = usePagedQuery({ pageSize: 10 });
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
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">Books</h1>
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
              <BookTable books={data.items} />
              <Pagination
                page={query.page}
                pageSize={query.pageSize}
                total={data.total}
                onPageChange={query.setPage}
              />
            </>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
