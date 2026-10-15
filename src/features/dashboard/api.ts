import { api, ApiError } from "@/lib/api-client";
import type { ApiEnvelope } from "@/types/api";
import type { DashboardSummary } from "@/types/dashboard";

/**
 * Illustrative sample shown only when the backend is unreachable
 * (GET /api/v1/dashboard/summary lands in Phase 5). The page badges it as
 * sample data; live responses render without the badge.
 */
const SAMPLE: DashboardSummary = {
  totalBooks: 48,
  publishedBooks: 21,
  totalContributors: 63,
  pendingRoyalties: 18450,
  manuscriptPipeline: [
    { stage: "Submitted", count: 6 },
    { stage: "In review", count: 4 },
    { stage: "Editing", count: 5 },
    { stage: "Proof", count: 3 },
    { stage: "Approved", count: 2 },
  ],
  titlePipeline: [
    { stage: "Draft", count: 9 },
    { stage: "In edit", count: 8 },
    { stage: "Designed", count: 4 },
    { stage: "Printing", count: 3 },
    { stage: "Published", count: 21 },
    { stage: "Archived", count: 3 },
  ],
  attention: [
    {
      id: "a1",
      kind: "approval",
      title: "Approve proof — Akan Folk Tales",
      detail: "Final proof returned by the typesetter with 2 queries outstanding.",
      severity: "high",
      dueLabel: "Due tomorrow",
      href: "/books",
    },
    {
      id: "a2",
      kind: "approval",
      title: "Sign off print run — New Ship Mathematics 4",
      detail: "5,000 copies · quoted press slot held until Friday.",
      severity: "high",
      dueLabel: "Due Friday",
      href: "/books",
    },
    {
      id: "a3",
      kind: "stock",
      title: "Low stock — Bright Ewe Reader 2",
      detail: "34 copies left at the Accra warehouse, term orders pending.",
      severity: "medium",
      href: "/books",
    },
    {
      id: "a4",
      kind: "royalty",
      title: "Q3 royalty statements ready for review",
      detail: "12 statements computed, 3 with adjustments awaiting sign-off.",
      severity: "medium",
      href: "/contributors",
    },
    {
      id: "a5",
      kind: "task",
      title: "Assign editor — Ga Proverbs manuscript",
      detail: "Submitted 6 days ago, still unassigned.",
      severity: "low",
      href: "/manuscripts",
    },
  ],
  activity: [
    { id: "e1", actor: "Ama Serwaa", action: "approved the proof for Our World Readers 3", timeLabel: "2h ago" },
    { id: "e2", actor: "Kwame Mensah", action: "received 5,000 copies of Science in Focus 5", timeLabel: "5h ago" },
    { id: "e3", actor: "Efua Owusu", action: "submitted Ga Proverbs for review", timeLabel: "Yesterday" },
    { id: "e4", actor: "Finance", action: "paid Q2 royalties to 9 contributors", timeLabel: "Yesterday" },
    { id: "e5", actor: "Yaw Darko", action: "moved Twi Grammar to proof stage", timeLabel: "2 days ago" },
  ],
  trends: {
    books: [30, 32, 33, 35, 36, 38, 40, 41, 43, 44, 46, 48],
    royalties: [9.2, 10.1, 9.8, 11.4, 12.0, 11.6, 13.1, 14.0, 13.5, 15.2, 16.8, 18.4],
  },
  stale: true,
};

/**
 * Fetch the dashboard summary.
 *
 * Authentication failures (401/403) are rethrown so the caller can redirect
 * to login — masking them as sample data would strand expired sessions on a
 * fake dashboard. Other failures (backend down, 500s) fall back to labelled
 * sample data so the page still renders with the "stale" badge.
 */
export async function getSummary(): Promise<DashboardSummary> {
  try {
    const res = await api.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary");
    return { ...res.data, stale: false };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) throw e;
    return SAMPLE;
  }
}
