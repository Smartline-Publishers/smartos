import { z } from "zod";
import { api } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth";
import type { ApiEnvelope } from "@/types/api";

export interface SalesRow {
  bookId: string;
  bookTitle: string;
  quantity: number;
  revenue: number;
  refunds: number;
  net: number;
}

export interface SalesReport {
  from: string;
  to: string;
  rows: SalesRow[];
  totalQuantity: number;
  totalRevenue: number;
  totalRefunds: number;
  totalNet: number;
}

export interface ContributorLiability {
  contributorId: string;
  contributorName: string;
  pending: number;
}

export interface RoyaltyLiability {
  draftTotal: number;
  approvedTotal: number;
  paidTotal: number;
  byContributor: ContributorLiability[];
}

export interface EditorialReport {
  from: string;
  to: string;
  submitted: number;
  approved: number;
  transitions: { stage: string; count: number }[];
}

export const ReportRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional().or(z.literal("")),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").optional().or(z.literal("")),
  bookId: z.string().optional().or(z.literal("")),
});

export type ReportRangeInput = z.infer<typeof ReportRangeSchema>;

function rangeQuery(input: ReportRangeInput): string {
  const parsed = ReportRangeSchema.parse(input);
  const q = new URLSearchParams();
  if (parsed.from) q.set("from", parsed.from);
  if (parsed.to) q.set("to", parsed.to);
  if (parsed.bookId) q.set("bookId", parsed.bookId);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function getSalesReport(input: ReportRangeInput = {}): Promise<SalesReport> {
  const res = await api.get<ApiEnvelope<SalesReport>>(`/reports/sales${rangeQuery(input)}`);
  return res.data;
}

/** Downloads the sales CSV through an authenticated request. */
export async function downloadSalesCsv(input: ReportRangeInput = {}): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
  const res = await fetch(`${base}/reports/sales.csv${rangeQuery(input)}`, {
    headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` },
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sales.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function getRoyaltyLiability(): Promise<RoyaltyLiability> {
  const res = await api.get<ApiEnvelope<RoyaltyLiability>>("/reports/royalties");
  return res.data;
}

export async function getEditorialReport(days = 30): Promise<EditorialReport> {
  const res = await api.get<ApiEnvelope<EditorialReport>>(`/reports/editorial?days=${days}`);
  return res.data;
}
