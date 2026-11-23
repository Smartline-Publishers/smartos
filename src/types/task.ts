/** Mirrors backend Task.TaskStatus. */
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
] as const satisfies readonly TaskStatus[];

/** Mirrors backend Task.TaskPriority. */
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export function statusLabel(status: TaskStatus): string {
  switch (status) {
    case "TODO":
      return "To do";
    case "IN_PROGRESS":
      return "In progress";
    case "REVIEW":
      return "Review";
    case "DONE":
      return "Done";
  }
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "REVIEW",
  REVIEW: "DONE",
  DONE: null,
};

export function nextStatus(status: TaskStatus): TaskStatus | null {
  return NEXT_STATUS[status];
}

export interface TaskItem {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  bookId?: string;
  manuscriptId?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
