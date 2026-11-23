/** Mirrors backend ProductionJob.JobStatus. */
export type JobStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const JOB_STATUSES: readonly JobStatus[] = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export function jobStatusLabel(status: JobStatus): string {
  switch (status) {
    case "PLANNED":
      return "Planned";
    case "IN_PROGRESS":
      return "In progress";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
  }
}

export interface PrintRun {
  id: string;
  jobId: string | null;
  quantity: number;
  posted: boolean;
  postedAt?: string;
}

export interface ProductionJob {
  id: string;
  organizationId: string;
  bookId: string | null;
  bookTitle?: string | null;
  manuscriptId?: string | null;
  status: JobStatus;
  quantity: number;
  printer?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  runs: PrintRun[];
}
