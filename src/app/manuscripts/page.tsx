"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import {
  CreateManuscriptSchema,
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateManuscriptInput>({
    resolver: zodResolver(CreateManuscriptSchema),
    defaultValues: { title: "", fileUrl: "", dueDate: "" },
  });

  const onCreate = async (values: CreateManuscriptInput) => {
    await runAction("new", async () => {
      await createManuscript(values);
      reset();
    }, "Could not create manuscript");
  };

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Manuscripts"
            description="Submissions moving through review, editing, proof and approval."
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}
          <Card title="Submit manuscript">
            <form
              onSubmit={handleSubmit(onCreate)}
              className="grid gap-3 sm:grid-cols-[1fr_1fr_180px_auto]"
              aria-label="Submit manuscript form"
            >
              <Input
                label="Title"
                required
                error={errors.title?.message}
                {...register("title")}
              />
              <Input
                label="File URL"
                hint="Optional"
                placeholder="https://…"
                error={errors.fileUrl?.message}
                {...register("fileUrl")}
              />
              <Input
                label="Due date"
                type="date"
                error={errors.dueDate?.message}
                {...register("dueDate")}
              />
              <div className="flex items-end">
                <Button type="submit" disabled={isSubmitting || busyId !== null}>
                  {isSubmitting ? "Submitting…" : "Submit"}
                </Button>
              </div>
            </form>
          </Card>

          {loading ? (
            <Spinner label="Loading manuscripts…" />
          ) : error ? (
            <EmptyState title="Could not load manuscripts" description={error} />
          ) : !grouped || MANUSCRIPT_STAGES.every((s) => grouped[s].length === 0) ? (
            <EmptyState
              title="No manuscripts yet"
              description="Submit the first manuscript with the form above."
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
                  className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200/90 bg-white/60 p-3"
                >
                  <header className="flex items-baseline justify-between gap-2 px-1">
                    <h2 className="text-sm font-bold text-slate-900">{stageLabel(stage)}</h2>
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                      {grouped[stage].length}
                    </span>
                  </header>
                  {grouped[stage].length === 0 ? (
                    <p className="px-1 py-3 text-[13px] text-slate-400">Empty</p>
                  ) : (
                    grouped[stage].map((m) => (
                      <article
                        key={m.id}
                        role="listitem"
                        className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgb(15_23_42/0.05)]"
                      >
                        <h3 className="text-sm font-semibold leading-snug text-slate-900">
                          {m.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          <span className="font-semibold tabular-nums text-slate-700">
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
                            className="text-[13px] font-medium text-brand-700 hover:underline"
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
                            className="text-red-700 hover:bg-red-50"
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
