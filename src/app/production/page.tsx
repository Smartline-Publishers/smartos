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
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import {
  CreateJobSchema,
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateJobInput>({
    resolver: zodResolver(CreateJobSchema),
    defaultValues: { bookId: "", manuscriptId: "", quantity: 1000, printer: "", dueDate: "" },
  });

  const onCreate = async (values: CreateJobInput) => {
    await runAction("new", async () => {
      await createJob(values);
      reset();
    }, "Could not create job");
  };

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Production"
            description="Print jobs from planning to completion, with print runs posted into stock."
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}
          <Card title="New print job">
            <form
              onSubmit={handleSubmit(onCreate)}
              className="grid gap-3 sm:grid-cols-[1fr_140px_1fr_180px_auto]"
              aria-label="New print job form"
            >
              <Select
                label="Book"
                required
                error={errors.bookId?.message}
                options={[
                  { value: "", label: "Choose a book" },
                  ...books.map((b) => ({ value: b.id, label: b.title })),
                ]}
                {...register("bookId")}
              />
              <Input
                label="Quantity"
                type="number"
                min={1}
                required
                error={errors.quantity?.message}
                {...register("quantity")}
              />
              <Input
                label="Printer"
                hint="Optional"
                error={errors.printer?.message}
                {...register("printer")}
              />
              <Input
                label="Due date"
                type="date"
                error={errors.dueDate?.message}
                {...register("dueDate")}
              />
              <div className="flex items-end">
                <Button type="submit" disabled={isSubmitting || busyId !== null}>
                  {isSubmitting ? "Creating…" : "Create job"}
                </Button>
              </div>
            </form>
          </Card>

          {loading ? (
            <Spinner label="Loading production jobs…" />
          ) : error ? (
            <EmptyState title="Could not load production" description={error} />
          ) : !jobs || jobs.length === 0 ? (
            <EmptyState title="No jobs yet" description="Create the first print job above." />
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
                    className="flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200/90 bg-white/60 p-3"
                  >
                    <header className="flex items-baseline justify-between gap-2 px-1">
                      <h2 className="text-sm font-bold text-slate-900">{jobStatusLabel(status)}</h2>
                      <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                        {column.length}
                      </span>
                    </header>
                    {column.length === 0 ? (
                      <p className="px-1 py-3 text-[13px] text-slate-400">Empty</p>
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
      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgb(15_23_42/0.05)]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-slate-900">
          {job.bookTitle ?? "Untitled book"}
        </h3>
        <Badge status={job.status} />
      </div>
      <p className="text-xs text-slate-500">
        <span className="font-semibold tabular-nums text-slate-700">{job.quantity}</span> copies
        {job.printer ? ` · ${job.printer}` : ""}
        {job.dueDate ? ` · due ${formatDate(job.dueDate)}` : ""}
      </p>
      <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-2">
        <p className="text-xs font-semibold text-slate-600">
          Runs ({job.runs.filter((r) => r.posted).length}/{job.runs.length} posted)
        </p>
        {job.runs.length === 0 ? (
          <p className="text-xs text-slate-400">No runs yet</p>
        ) : (
          job.runs.map((run) => (
            <div key={run.id} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold tabular-nums text-slate-900">
                {run.quantity.toLocaleString()}
              </span>
              {run.posted ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 font-semibold text-green-800">
                  Posted{run.postedAt ? ` ${formatDate(run.postedAt)}` : ""}
                </span>
              ) : (
                <>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                    Unposted
                  </span>
                  {editable && warehouses.length > 0 ? (
                    <>
                      <select
                        aria-label={`Warehouse for posting run of ${run.quantity} copies`}
                        value={postWh}
                        onChange={(e) => onPostWh(e.target.value)}
                        disabled={busy}
                        className="h-8 max-w-32 rounded-md border border-slate-300 bg-white px-1 text-xs"
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
                      className="text-red-700 hover:bg-red-50"
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
              className="h-8 w-24 rounded-md border border-slate-300 bg-white px-2 text-xs"
            />
            <Button size="sm" variant="ghost" type="submit" disabled={busy || !runQty}>
              Add run
            </Button>
          </form>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
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
              className="text-red-700 hover:bg-red-50"
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
