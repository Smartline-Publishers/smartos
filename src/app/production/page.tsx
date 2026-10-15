"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { JobForm } from "@/features/production/JobForm";
import {
  cancelJob,
  completeJob,
  createJob,
  createRun,
  deleteJob,
  deleteRun,
  listJobs,
  postRun,
  startJob,
  type CreateJobInput,
} from "@/features/production/api";
import { listBooks } from "@/features/books/api";
import { listWarehouses } from "@/features/inventory/api";
import type { Book } from "@/types/book";
import type { Warehouse } from "@/types/inventory";
import {
  JOB_STATUSES,
  jobStatusLabel,
  type JobStatus,
  type ProductionJob,
} from "@/types/production";
import { formatDate } from "@/lib/format";

export default function ProductionPage() {
  const [jobs, setJobs] = useState<ProductionJob[] | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [runQty, setRunQty] = useState<Record<string, string>>({});
  const [postWh, setPostWh] = useState<Record<string, string>>({});
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formDirty, setFormDirty] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobPage, bookPage, whs] = await Promise.all([
        listJobs({ page: 1, pageSize: 100 }),
        listBooks({ page: 1, pageSize: 100 }),
        listWarehouses(),
      ]);
      setJobs(jobPage.items);
      setBooks(bookPage.items);
      setWarehouses(whs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load production data");
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

  const onCreate = async (values: CreateJobInput) => {
    setCreating(true);
    try {
      await createJob(values);
      setJobModalOpen(false);
      setFormDirty(false);
      await refresh();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? `Could not create job: ${e.message}` : "Could not create job");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Production"
            description="Print jobs from planning to completion, with print runs posted into stock."
            actions={
              <Button onClick={() => setJobModalOpen(true)}>
                New print job
              </Button>
            }
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {actionError}
            </p>
          ) : null}
          <Modal
            open={jobModalOpen}
            title="New print job"
            description="Plan a print run for a catalog title."
            onClose={() => setJobModalOpen(false)}
            isDirty={formDirty}
          >
            <JobForm
              key={jobModalOpen ? "job-new" : "job-closed"}
              books={books}
              onSubmit={onCreate}
              submitting={creating || busyId !== null}
              onCancel={() => setJobModalOpen(false)}
              onDirtyChange={setFormDirty}
            />
          </Modal>

          {loading ? (
            <Spinner label="Loading production jobs…" />
          ) : error ? (
            <EmptyState title="Could not load production" description={error} />
          ) : !jobs || jobs.length === 0 ? (
            <EmptyState title="No jobs yet" description="Create the first print job with the button above." />
          ) : (
            <div
              className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4"
              role="list"
              aria-label="Production jobs by status"
            >
              {JOB_STATUSES.map((status) => {
                const column = jobs.filter((j) => j.status === status);
                return (
                  <section
                    key={status}
                    aria-label={`${jobStatusLabel(status)} jobs`}
                    className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200/90 bg-white/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/60"
                  >
                    <header className="flex items-baseline justify-between gap-2 px-1">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100">{jobStatusLabel(status)}</h2>
                      <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700 dark:bg-neutral-800 dark:text-neutral-300">
                        {column.length}
                      </span>
                    </header>
                    {column.length === 0 ? (
                      <p className="px-1 py-3 text-[13px] text-slate-400 dark:text-neutral-500">Empty</p>
                    ) : (
                      column.map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          warehouses={warehouses}
                          busy={busyId === job.id}
                          runQty={runQty[job.id] ?? ""}
                          onRunQty={(v) => setRunQty((p) => ({ ...p, [job.id]: v }))}
                          postWh={postWh[job.id] ?? warehouses[0]?.id ?? ""}
                          onPostWh={(v) => setPostWh((p) => ({ ...p, [job.id]: v }))}
                          onAction={(fn, failure) => runAction(job.id, fn, failure)}
                        />
                      ))
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

function JobCard({
  job,
  warehouses,
  busy,
  runQty,
  onRunQty,
  postWh,
  onPostWh,
  onAction,
}: {
  job: ProductionJob;
  warehouses: Warehouse[];
  busy: boolean;
  runQty: string;
  onRunQty: (v: string) => void;
  postWh: string;
  onPostWh: (v: string) => void;
  onAction: (fn: () => Promise<unknown>, failure: string) => void;
}) {
  const editable = job.status === "PLANNED" || job.status === "IN_PROGRESS";
  return (
    <article
      role="listitem"
      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgb(15_23_42/0.05)] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-none"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-slate-900 dark:text-neutral-100">
          {job.bookTitle ?? "Untitled book"}
        </h3>
        <Badge status={job.status} />
      </div>
      <p className="text-xs text-slate-500 dark:text-neutral-400">
        <span className="font-semibold tabular-nums text-slate-700 dark:text-neutral-300">{job.quantity}</span> copies
        {job.printer ? ` · ${job.printer}` : ""}
        {job.dueDate ? ` · due ${formatDate(job.dueDate)}` : ""}
      </p>
      <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-2 dark:border-neutral-800">
        <p className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
          Runs ({job.runs.filter((r) => r.posted).length}/{job.runs.length} posted)
        </p>
        {job.runs.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-neutral-500">No runs yet</p>
        ) : (
          job.runs.map((run) => (
            <div key={run.id} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">
                {run.quantity.toLocaleString()}
              </span>
              {run.posted ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800 dark:bg-green-950 dark:text-green-300">
                  Posted{run.postedAt ? ` ${formatDate(run.postedAt)}` : ""}
                </span>
              ) : (
                <>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                    Unposted
                  </span>
                  {editable && warehouses.length > 0 ? (
                    <>
                      <select
                        aria-label={`Warehouse for posting run of ${run.quantity} copies`}
                        value={postWh}
                        onChange={(e) => onPostWh(e.target.value)}
                        disabled={busy}
                        className="h-8 max-w-32 rounded-md border border-slate-300 bg-white px-1 text-xs text-ink dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                      >
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={busy || job.status !== "IN_PROGRESS"}
                        title={
                          job.status !== "IN_PROGRESS"
                            ? "Start the job before posting runs"
                            : "Post run into stock"
                        }
                        onClick={() =>
                          onAction(() => postRun(run.id, postWh), "Posting failed")
                        }
                      >
                        Post
                      </Button>
                    </>
                  ) : null}
                  {editable ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm(`Delete unposted run of ${run.quantity} copies?`)) {
                          onAction(() => deleteRun(run.id), "Delete failed");
                        }
                      }}
                    >
                      Delete
                    </Button>
                  ) : null}
                </>
              )}
            </div>
          ))
        )}
        {editable ? (
          <form
            className="flex items-center gap-2"
            aria-label="Add print run form"
            onSubmit={(e) => {
              e.preventDefault();
              const qty = Number(runQty);
              if (Number.isInteger(qty) && qty > 0) {
                void onAction(() => createRun(job.id, qty), "Adding run failed");
                onRunQty("");
              }
            }}
          >
            <label htmlFor={`run-qty-${job.id}`} className="sr-only">
              Run quantity in copies
            </label>
            <input
              id={`run-qty-${job.id}`}
              type="number"
              min={1}
              placeholder="Copies"
              value={runQty}
              onChange={(e) => onRunQty(e.target.value)}
              disabled={busy}
              className="h-8 w-24 rounded-md border border-slate-300 bg-white px-2 text-xs text-ink dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
            <Button size="sm" variant="ghost" type="submit" disabled={busy || !runQty}>
              Add run
            </Button>
          </form>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-2 dark:border-neutral-800">
        {job.status === "PLANNED" ? (
          <Button size="sm" disabled={busy} onClick={() => onAction(() => startJob(job.id), "Start failed")}>
            Start
          </Button>
        ) : null}
        {job.status === "IN_PROGRESS" ? (
          <Button size="sm" disabled={busy} onClick={() => onAction(() => completeJob(job.id), "Complete failed")}>
            Complete
          </Button>
        ) : null}
        {(job.status === "PLANNED" || job.status === "IN_PROGRESS") && (
          <>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onAction(() => cancelJob(job.id), "Cancel failed")}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              disabled={busy}
              onClick={() => {
                if (window.confirm("Delete this job and its unposted runs?")) {
                  onAction(() => deleteJob(job.id), "Delete failed");
                }
              }}
            >
              Delete
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
