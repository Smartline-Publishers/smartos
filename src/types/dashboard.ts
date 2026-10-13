export interface PipelineSlice {
  stage: string;
  count: number;
}

export type AttentionSeverity = "high" | "medium" | "low";

export interface AttentionItem {
  id: string;
  kind: "approval" | "task" | "stock" | "royalty";
  title: string;
  detail: string;
  severity: AttentionSeverity;
  dueLabel?: string;
  /** In-app route for the item, if any. */
  href?: string;
}

export interface ActivityItem {
  id: string;
  actor: string;
  action: string;
  /** Pre-formatted label (sample data). Live items carry createdAt instead. */
  timeLabel?: string;
  /** ISO timestamp from the API; the UI renders a relative label from it. */
  createdAt?: string;
}

/** Shape of GET /api/v1/dashboard/summary. Sections are optional for forward-compat. */
export interface DashboardSummary {
  totalBooks: number;
  publishedBooks: number;
  totalContributors: number;
  pendingRoyalties: number;
  manuscriptPipeline?: PipelineSlice[];
  titlePipeline?: PipelineSlice[];
  attention?: AttentionItem[];
  activity?: ActivityItem[];
  trends?: {
    books: number[];
    royalties: number[];
  };
  /** True when the API was unreachable and illustrative sample data was returned. */
  stale?: boolean;
}
