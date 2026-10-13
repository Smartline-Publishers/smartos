export interface DashboardSummary {
  totalBooks: number;
  publishedBooks: number;
  totalContributors: number;
  pendingRoyalties: number;
  /** True when the API was unreachable and a fallback was returned. */
  stale?: boolean;
}
