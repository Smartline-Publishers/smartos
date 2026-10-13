import { api } from "@/lib/api-client";
import type { ApiEnvelope } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

const EMPTY: DashboardSummary = {
  totalBooks: 0,
  publishedBooks: 0,
  totalContributors: 0,
  pendingRoyalties: 0,
};

/** Fetch dashboard summary; returns a well-typed empty summary with `stale:true` when the API is down. */
export async function getSummary(): Promise<DashboardSummary> {
  try {
    const res = await api.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary");
    return res.data;
  } catch {
    return { ...EMPTY, stale: true };
  }
}
