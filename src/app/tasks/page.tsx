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
import { Pagination } from "@/components/ui/Pagination";
import {
  CreateTaskSchema,
  createTask,
  deleteTask,
  listTasks,
  updateTaskStatus,
  type CreateTaskInput,
} from "@/features/tasks/api";
import { nextStatus, statusLabel, type TaskItem, type TaskStatus } from "@/types/task";
import { usePagedQuery } from "@/hooks/use-paged-query";
import type { Page } from "@/types/api";
import { formatDate } from "@/lib/format";

export default function TasksPage() {
  const query = usePagedQuery({ pageSize: 10 });
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [data, setData] = useState<Page<TaskItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const params = query.toParams();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listTasks({ ...params, ...(status ? { status } : {}) }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize, params.search, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = useCallback(
    async (fn: () => Promise<unknown>, failure: string) => {
      setActionError(null);
      try {
        await fn();
        await refresh();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? `${failure}: ${e.message}` : failure);
      }
    },
    [refresh],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: { title: "", description: "", priority: "MEDIUM", dueDate: "" },
  });

  const onCreate = async (values: CreateTaskInput) => {
    await runAction(async () => {
      await createTask(values);
      reset();
      query.setPage(1);
    }, "Could not create task");
  };

  return (
    <ProtectedRoute>
      <TopBar />
      <AppShell>
        <div className="flex flex-col gap-4">
          <PageHeader
            title="Tasks"
            description="Editorial and operational assignments with owners and due dates."
          />
          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {actionError}
            </p>
          ) : null}
          <Card title="New task">
            <form
              onSubmit={handleSubmit(onCreate)}
              className="grid gap-3 sm:grid-cols-[1fr_160px_180px_auto]"
              aria-label="New task form"
            >
              <Input
                label="Title"
                required
                error={errors.title?.message}
                {...register("title")}
              />
              <Select
                label="Priority"
                error={errors.priority?.message}
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                ]}
                {...register("priority")}
              />
              <Input
                label="Due date"
                type="date"
                error={errors.dueDate?.message}
                {...register("dueDate")}
              />
              <div className="flex items-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding…" : "Add task"}
                </Button>
              </div>
            </form>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                label="Search"
                placeholder="Task title…"
                value={query.search}
                onChange={(e) => query.setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-56">
              <Select
                label="Status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as TaskStatus | "");
                  query.setPage(1);
                }}
                options={[
                  { value: "", label: "All statuses" },
                  { value: "TODO", label: "To do" },
                  { value: "IN_PROGRESS", label: "In progress" },
                  { value: "REVIEW", label: "Review" },
                  { value: "DONE", label: "Done" },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <Spinner label="Loading tasks…" />
          ) : error ? (
            <EmptyState title="Could not load tasks" description={error} />
          ) : !data || data.items.length === 0 ? (
            <EmptyState title="No tasks found" description="Try a different search or status filter." />
          ) : (
            <>
              <p className="text-[13px] text-slate-600" aria-live="polite">
                <span className="font-semibold tabular-nums text-slate-900">{data.total}</span>{" "}
                {data.total === 1 ? "task" : "tasks"}
              </p>
              <ul className="flex flex-col gap-2">
                {data.items.map((t) => {
                  const next = nextStatus(t.status);
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-[0_1px_2px_rgb(15_23_42/0.05)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{t.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {t.dueDate ? `Due ${formatDate(t.dueDate)}` : "No due date"}
                        </p>
                      </div>
                      <Badge status={t.priority} />
                      <Badge status={t.status} />
                      <span className="text-xs text-slate-500">{statusLabel(t.status)}</span>
                      {next ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            runAction(() => updateTaskStatus(t.id, next), "Status update failed")
                          }
                          aria-label={`Move ${t.title} to ${statusLabel(next)}`}
                        >
                          → {statusLabel(next)}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (window.confirm(`Delete task "${t.title}"?`)) {
                            void runAction(() => deleteTask(t.id), "Delete failed");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </li>
                  );
                })}
              </ul>
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
