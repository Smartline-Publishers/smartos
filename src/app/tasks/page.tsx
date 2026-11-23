"use client";

import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { RouteGuard } from "@/components/layout/RoleGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MobileFab } from "@/components/ui/MobileFab";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Pagination } from "@/components/ui/Pagination";
import { TaskForm } from "@/features/tasks/TaskForm";
import {
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
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
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

  const onCreate = async (values: CreateTaskInput) => {
    setCreating(true);
    try {
      await createTask(values);
      setCreateOpen(false);
      setFormDirty(false);
      // Refetch through the paging effect when possible to avoid a double
      // request; reload directly only if already on page 1.
      if (params.page === 1) await refresh();
      else query.setPage(1);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? `Could not create task: ${e.message}` : "Could not create task");
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <RouteGuard><div className="flex flex-col gap-4">
          <PageHeader
            title="Tasks"
            description="Editorial and operational assignments with owners and due dates."
            hideActionsOnMobile
            actions={
              <Button onClick={() => setCreateOpen(true)}>
                New task
              </Button>
            }
          />
          <MobileFab label="New task" onClick={() => setCreateOpen(true)} />          {actionError ? (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {actionError}
            </p>
          ) : null}
          <Modal
            open={createOpen}
            title="New task"
            description="Create an assignment with an owner and due date."
            onClose={() => setCreateOpen(false)}
            isDirty={formDirty}
          >
            <TaskForm
              key={createOpen ? "task-new" : "task-closed"}
              onSubmit={onCreate}
              submitting={creating}
              onCancel={() => setCreateOpen(false)}
              onDirtyChange={setFormDirty}
            />
          </Modal>

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
              <p className="text-[13px] text-slate-600 dark:text-neutral-400" aria-live="polite">
                <span className="font-semibold tabular-nums text-slate-900 dark:text-neutral-100">{data.total}</span>{" "}
                {data.total === 1 ? "task" : "tasks"}
              </p>
              <ul className="flex flex-col gap-2">
                {data.items.map((t) => {
                  const next = nextStatus(t.status);
                  return (
                    <li
                      key={t.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-[0_1px_2px_rgb(15_23_42/0.05)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">{t.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
                          {t.dueDate ? `Due ${formatDate(t.dueDate)}` : "No due date"}
                        </p>
                      </div>
                      <Badge status={t.priority} />
                      <Badge status={t.status} />
                      <span className="text-xs text-slate-500 dark:text-neutral-400">{statusLabel(t.status)}</span>
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
                        className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
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
      </RouteGuard>
      </AppShell>
    </ProtectedRoute>
  );
}
