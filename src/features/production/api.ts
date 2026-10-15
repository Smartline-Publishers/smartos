import { z } from "zod";
import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";
import type { JobStatus, PrintRun, ProductionJob } from "@/types/production";

export const CreateJobSchema = z.object({
  bookId: z.string().min(1, "Choose a book"),
  manuscriptId: z.string().optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1, "At least 1 copy"),
  printer: z.string().max(255).optional().or(z.literal("")),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional().or(z.literal("")),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;

export const CreateRunSchema = z.object({
  quantity: z.coerce.number().int().min(1, "At least 1 copy"),
});

export type CreateRunInput = z.infer<typeof CreateRunSchema>;

export interface ListJobsParams extends PagedParams {
  status?: JobStatus | "";
  bookId?: string;
}

export async function listJobs(params: ListJobsParams): Promise<Page<ProductionJob>> {
  const q = new URLSearchParams();
  // Backend uses Spring Pageable (0-indexed `page`, `size`); UI is 1-indexed.
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 50));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  if (params.bookId) q.set("bookId", params.bookId);
  const res = await api.get<ApiEnvelope<SpringPage<ProductionJob>>>(
    `/production/jobs?${q.toString()}`,
  );
  return toPage(res.data);
}

function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined),
  ) as Partial<T>;
}

export async function createJob(input: CreateJobInput): Promise<ProductionJob> {
  const parsed = CreateJobSchema.parse(input);
  const res = await api.post<ApiEnvelope<ProductionJob>>("/production/jobs", clean(parsed));
  return res.data;
}

async function jobAction(id: string, action: "start" | "complete" | "cancel"): Promise<ProductionJob> {
  const res = await api.post<ApiEnvelope<ProductionJob>>(
    `/production/jobs/${encodeURIComponent(id)}/${action}`,
  );
  return res.data;
}

export const startJob = (id: string) => jobAction(id, "start");
export const completeJob = (id: string) => jobAction(id, "complete");
export const cancelJob = (id: string) => jobAction(id, "cancel");

export async function deleteJob(id: string): Promise<void> {
  await api.del<void>(`/production/jobs/${encodeURIComponent(id)}`);
}

export async function createRun(jobId: string, quantity: number): Promise<PrintRun> {
  const parsed = CreateRunSchema.parse({ quantity });
  const res = await api.post<ApiEnvelope<PrintRun>>(
    `/production/jobs/${encodeURIComponent(jobId)}/runs`,
    parsed,
  );
  return res.data;
}

export async function postRun(runId: string, warehouseId: string): Promise<PrintRun> {
  const res = await api.post<ApiEnvelope<PrintRun>>(
    `/production/jobs/runs/${encodeURIComponent(runId)}/post`,
    { warehouseId },
  );
  return res.data;
}

export async function deleteRun(runId: string): Promise<void> {
  await api.del<void>(`/production/jobs/runs/${encodeURIComponent(runId)}`);
}
