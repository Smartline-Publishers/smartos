import { z } from "zod";
import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";
import type { TaskItem, TaskPriority, TaskStatus } from "@/types/task";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const satisfies readonly TaskPriority[];

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(5000).optional().or(z.literal("")),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional().or(z.literal("")),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export interface ListTasksParams extends PagedParams {
  status?: TaskStatus | "";
}

export async function listTasks(params: ListTasksParams): Promise<Page<TaskItem>> {
  const q = new URLSearchParams();
  // Backend uses Spring Pageable (0-indexed `page`, `size`); UI is 1-indexed.
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 10));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  const res = await api.get<ApiEnvelope<SpringPage<TaskItem>>>(`/tasks?${q.toString()}`);
  return toPage(res.data);
}

export async function createTask(input: CreateTaskInput): Promise<TaskItem> {
  const parsed = CreateTaskSchema.parse(input);
  const body = {
    title: parsed.title,
    ...(parsed.description ? { description: parsed.description } : {}),
    ...(parsed.priority ? { priority: parsed.priority } : {}),
    ...(parsed.dueDate ? { dueDate: parsed.dueDate } : {}),
  };
  const res = await api.post<ApiEnvelope<TaskItem>>("/tasks", body);
  return res.data;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<TaskItem> {
  const res = await api.patch<ApiEnvelope<TaskItem>>(`/tasks/${encodeURIComponent(id)}`, {
    status,
  });
  return res.data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.del<void>(`/tasks/${encodeURIComponent(id)}`);
}
