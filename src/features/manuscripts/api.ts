import { z } from "zod";
import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";
import type { Manuscript, ManuscriptStage } from "@/types/manuscript";
import { MANUSCRIPT_STAGES } from "@/types/manuscript";

export const CreateManuscriptSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  fileUrl: z.string().max(1024).optional().or(z.literal("")),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional().or(z.literal("")),
});

export type CreateManuscriptInput = z.infer<typeof CreateManuscriptSchema>;

export const TransitionSchema = z.object({
  toStage: z.enum(MANUSCRIPT_STAGES),
  comment: z.string().max(2000).optional().or(z.literal("")),
});

export type TransitionInput = z.infer<typeof TransitionSchema>;

export interface ListManuscriptsParams extends PagedParams {
  stage?: ManuscriptStage | "";
}

export async function listManuscripts(params: ListManuscriptsParams): Promise<Page<Manuscript>> {
  const q = new URLSearchParams();
  // Backend uses Spring Pageable (0-indexed `page`, `size`); UI is 1-indexed.
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 50));
  if (params.search) q.set("search", params.search);
  if (params.stage) q.set("stage", params.stage);
  const res = await api.get<ApiEnvelope<SpringPage<Manuscript>>>(`/manuscripts?${q.toString()}`);
  return toPage(res.data);
}

export async function getManuscript(id: string): Promise<Manuscript> {
  const res = await api.get<ApiEnvelope<Manuscript>>(`/manuscripts/${encodeURIComponent(id)}`);
  return res.data;
}

export async function createManuscript(input: CreateManuscriptInput): Promise<Manuscript> {
  const parsed = CreateManuscriptSchema.parse(input);
  const body = {
    title: parsed.title,
    ...(parsed.fileUrl ? { fileUrl: parsed.fileUrl } : {}),
    ...(parsed.dueDate ? { dueDate: parsed.dueDate } : {}),
  };
  const res = await api.post<ApiEnvelope<Manuscript>>("/manuscripts", body);
  return res.data;
}

export async function transitionManuscript(
  id: string,
  input: TransitionInput,
): Promise<Manuscript> {
  const parsed = TransitionSchema.parse(input);
  const res = await api.post<ApiEnvelope<Manuscript>>(
    `/manuscripts/${encodeURIComponent(id)}/transitions`,
    { toStage: parsed.toStage, ...(parsed.comment ? { comment: parsed.comment } : {}) },
  );
  return res.data;
}

export async function deleteManuscript(id: string): Promise<void> {
  await api.del<void>(`/manuscripts/${encodeURIComponent(id)}`);
}
