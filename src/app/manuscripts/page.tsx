"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ManuscriptForm } from "@/features/manuscripts/ManuscriptForm";
import {
  createManuscript,
  deleteManuscript,
  listManuscripts,
  transitionManuscript,
  type CreateManuscriptInput,
} from "@/features/manuscripts/api";
import {
  MANUSCRIPT_STAGES,
  NEXT_STAGES,
  stageLabel,
  type Manuscript,
  type ManuscriptStage,
} from "@/types/manuscript";
import { formatDate } from "@/lib/format";

export default function ManuscriptsPage() {
  const [grouped, setGrouped] = useState<Record<ManuscriptStage, Manuscript[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formDirty, setFormDirty] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await listManuscripts({ page: 1, pageSize: 100 });
      const next: Record<ManuscriptStage, Manuscript[]> = {
        SUBMITTED: [],
        REVIEW: [],
        EDITING: [],
        PROOF: [],
        APPROVED: [],
      };
      for (const m of page.items) next[m.stage].push(m);
      setGrouped(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load manuscripts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = useCallback(
    async (id: string, fn: () => Promise<unknown>, failure: string) => {
      setBusyId(id);
      setActionError(null);
      try {
        await fn();
        await refresh();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? `${failure}: ${e.message}` : failure);
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  const onCreate = async (values: CreateManuscriptInput) => {
    setSubmitting(true);
    try {
      await createManuscript(values);
      setSubmitOpen(false);
      setFormDirty(false);
      await refresh();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? `Could not create manuscript: ${e.message}` : "Could not create manuscript");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Manuscripts"
            description="Submissions moving through review, editing, proof and approval."
            actions={
              <Button onClick={() => setSubmitOpen(true)}>
                New manuscript
              </Button>
            }
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {actionError}
            </p>
          ) : null}
          <Modal
            open={submitOpen}
            title="New manuscript"
            description="Submit a manuscript for review."
            onClose={() => setSubmitOpen(false)}
            isDirty={formDirty}
          >
            <ManuscriptForm
              key={submitOpen ? "manuscript-new" : "manuscript-closed"}
              onSubmit={onCreate}
              submitting={submitting || busyId !== null}
              onCancel={() => setSubmitOpen(false)}
              onDirtyChange={setFormDirty}
            />
          </Modal>

          {loading ? (
            <Spinner label="Loading manuscripts…" />
          ) : error ? (
            <EmptyState title="Could not load manuscripts" description={error} />
          ) : !grouped || MANUSCRIPT_STAGES.every((s) => grouped[s].length === 0) ? (
            <EmptyState
              title="No manuscripts yet"
              description="Submit the first manuscript with the New manuscript button."
            />
          ) : (
            <div
              className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-5"
              role="list"
              aria-label="Manuscripts by stage"
            >
              {MANUSCRIPT_STAGES.map((stage) => (
                <section
                  key={stage}
                  aria-label={`${stageLabel(stage)} manuscripts`}
                  className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200/90 bg-white/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/60"
                >
                  <header className="flex items-baseline justify-between gap-2 px-1">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">{stageLabel(stage)}</h2>
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
                      {grouped[stage].length}
                    </span>
                  </header>
                  {grouped[stage].length === 0 ? (
                    <p className="px-1 py-3 text-[13px] text-slate-400 dark:text-neutral-500">Empty</p>
                  ) : (
                    grouped[stage].map((m) => (
                      <article
                        key={m.id}
                        role="listitem"
                        className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgb(15_23_42/0.05)] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-none"
                      >
                        <h3 className="text-sm font-semibold leading-snug text-slate-900 dark:text-neutral-100">
                          {m.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-neutral-400">
                          <span className="font-semibold tabular-nums text-slate-700 dark:text-neutral-300">
                            v{m.version}
                          </span>
                          {" · "}
                          {m.dueDate ? `Due ${formatDate(m.dueDate)}` : "No due date"}
                        </p>
                        {m.fileUrl ? (
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[13px] font-medium text-brand-700 hover:underline dark:text-brand-300"
                          >
                            Open file
                          </a>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {NEXT_STAGES[m.stage].map((next) => (
                            <Button
                              key={next}
                              size="sm"
                              variant="ghost"
                              disabled={busyId === m.id}
                              onClick={() =>
                                runAction(
                                  m.id,
                                  () => transitionManuscript(m.id, { toStage: next }),
                                  "Transition failed",
                                )
                              }
                              aria-label={`Move ${m.title} to ${stageLabel(next)}`}
                            >
                              → {stageLabel(next)}
                            </Button>
                          ))}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                            disabled={busyId === m.id}
                            onClick={() => {
                              if (window.confirm(`Delete manuscript "${m.title}"?`)) {
                                void runAction(m.id, () => deleteManuscript(m.id), "Delete failed");
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </article>
                    ))
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
