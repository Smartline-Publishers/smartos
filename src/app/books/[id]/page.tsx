"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { MobileFab } from "@/components/ui/MobileFab";
import { PencilSimple } from "@phosphor-icons/react";
import { BookForm } from "@/features/books/BookForm";
import { getBook, updateBook, type CreateBookInput } from "@/features/books/api";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import type { Book } from "@/types/book";

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = params as unknown as { id: string };
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formDirty, setFormDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { id } = params as unknown as { id: string };
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
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async (values: CreateBookInput) => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateBook(id, values);
      setBook(updated);
      setEditOpen(false);
      setFormDirty(false);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Could not save the book.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        {loading ? (
          <Spinner label="Loading book…" />
        ) : error || !book ? (
          <EmptyState title="Book not found" description={error ?? "No book with this id."} />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="min-w-0 flex-1 text-xl font-bold text-ink dark:text-neutral-100">{book.title}</h1>
              <Badge status={book.status} />
              <Button
                size="sm"
                variant="ghost"
                className="hidden md:inline-flex"
                onClick={() => { setSaveError(null); setEditOpen(true); }}
              >
                Edit
              </Button>
            </div>
            <MobileFab
              label="Edit book"
              icon={PencilSimple}
              onClick={() => {
                setSaveError(null);
                setEditOpen(true);
              }}
            />
            <Modal
              open={editOpen}
              title="Edit book"
              description="Update the catalog entry."
              onClose={() => setEditOpen(false)}
              isDirty={formDirty}
            >
              <BookForm
                key={`edit-book-${book.id}-${book.updatedAt ?? ""}`}
                defaultValues={{ title: book.title, isbn: book.isbn ?? "", status: book.status }}
                onSubmit={handleSave}
                submitting={saving}
                onCancel={() => setEditOpen(false)}
                onDirtyChange={setFormDirty}
              />
              {saveError ? (
                <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {saveError}
                </p>
              ) : null}
            </Modal>
            <Card title="Details">
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500 dark:text-neutral-400">ISBN</dt>
                  <dd className="text-ink dark:text-neutral-200">{book.isbn ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-neutral-400">Updated</dt>
                  <dd className="text-ink dark:text-neutral-200">{formatDate(book.updatedAt)}</dd>
                </div>
              </dl>
            </Card>
            <Card title="Contributors">
              {!book.contributors || book.contributors.length === 0 ? (
                <EmptyState title="No contributors" description="No contributors linked to this book yet." />
              ) : (
                <ul className="flex flex-col gap-2 text-sm text-ink dark:text-neutral-200">
                  {book.contributors.map((c) => (
                    <li key={c.contributorId} className="flex items-center justify-between border-b border-slate-100 py-1 dark:border-neutral-800">
                      <span>{c.contributor?.fullName ?? c.contributorId}</span>
                      <span className="text-slate-600 dark:text-neutral-400">
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
