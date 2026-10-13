"use client";

import { use, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { getBook } from "@/features/books/api";
import { formatDate } from "@/lib/format";
import type { Book } from "@/types/book";

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getBook(id)
      .then((b) => {
        if (alive) setBook(b);
      })
      .catch((e: Error) => {
        if (alive) setError(e.message ?? "Failed to load book");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        {loading ? (
          <Spinner label="Loading book…" />
        ) : error || !book ? (
          <EmptyState title="Book not found" description={error ?? "No book with this id."} />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{book.title}</h1>
              <Badge status={book.status} />
            </div>
            <Card title="Details">
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">ISBN</dt>
                  <dd>{book.isbn ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Updated</dt>
                  <dd>{formatDate(book.updatedAt)}</dd>
                </div>
              </dl>
            </Card>
            <Card title="Contributors">
              {!book.contributors || book.contributors.length === 0 ? (
                <EmptyState title="No contributors" description="No contributors linked to this book yet." />
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {book.contributors.map((c) => (
                    <li key={c.contributorId} className="flex items-center justify-between border-b border-slate-100 py-1">
                      <span>{c.contributor?.fullName ?? c.contributorId}</span>
                      <span className="text-slate-600">
                        {c.role} · {c.sharePercent}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
