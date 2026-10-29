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

/**
 * Who the activity feed covers. The backend decides this from the caller's
 * permissions; the UI only uses it for labelling. Non-admin users always
 * receive `SELF`.
 */
export type ActivityScope = "SELF" | "ORGANIZATION";

/** Shape of GET /api/v1/dashboard/summary. Sections are optional for forward-compat. */
export interface DashboardSummary {
  totalBooks: number;
  publishedBooks: number;
  totalContributors: number;
  pendingRoyalties: number;
  teamMembers?: number;
  pendingInvites?: number;
  totalCustomers?: number;
  activeOrders?: number;
  revenueThisQuarter?: number;
  budgetThisQuarter?: number;
  activeProductionJobs?: number;
  inventoryTitles?: number;
  stockOnHand?: number;
  lowStockItems?: number;
  warehouses?: number;
  manuscriptPipeline?: PipelineSlice[];
  titlePipeline?: PipelineSlice[];
  attention?: AttentionItem[];
  activity?: ActivityItem[];
  /** `SELF` for personal activity, `ORGANIZATION` for admins with audit.read. */
  activityScope?: ActivityScope;
  trends?: {
    books: number[];
    royalties: number[];
  };
  /** True when the API was unreachable and illustrative sample data was returned. */
  stale?: boolean;
}
