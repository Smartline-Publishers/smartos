import { api } from "@/lib/api-client";
import type { ApiEnvelope, Page, PagedParams, SpringPage } from "@/types/api";
import { toPage } from "@/types/api";

export interface AuditLog {
  id: string;
  actorId?: string;
  actorName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  createdAt?: string;
}

export async function listAuditLogs(params: PagedParams): Promise<Page<AuditLog>> {
  const q = new URLSearchParams();
  // Backend uses Spring Pageable (0-indexed `page`, `size`); UI is 1-indexed.
  q.set("page", String(Math.max(0, (params.page ?? 1) - 1)));
  q.set("size", String(params.pageSize ?? 20));
  const res = await api.get<ApiEnvelope<SpringPage<AuditLog>>>(`/audit-logs?${q.toString()}`);
  return toPage(res.data);
}
