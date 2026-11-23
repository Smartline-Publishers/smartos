/** Mirrors backend Manuscript.ManuscriptStage (serialized as SCREAMING_SNAKE). */
export type ManuscriptStage =
  | "SUBMITTED"
  | "REVIEW"
  | "EDITING"
  | "PROOF"
  | "APPROVED";

export const MANUSCRIPT_STAGES = [
  "SUBMITTED",
  "REVIEW",
  "EDITING",
  "PROOF",
  "APPROVED",
] as const satisfies readonly ManuscriptStage[];

/** Allowed transitions, mirroring the backend stage machine (backend enforces). */
export const NEXT_STAGES: Record<ManuscriptStage, ManuscriptStage[]> = {
  SUBMITTED: ["REVIEW"],
  REVIEW: ["EDITING", "SUBMITTED"],
  EDITING: ["PROOF", "REVIEW"],
  PROOF: ["APPROVED", "EDITING"],
  APPROVED: [],
};

export function stageLabel(stage: ManuscriptStage): string {
  switch (stage) {
    case "SUBMITTED":
      return "Submitted";
    case "REVIEW":
      return "In review";
    case "EDITING":
      return "Editing";
    case "PROOF":
      return "Proof";
    case "APPROVED":
      return "Approved";
  }
}

export interface ManuscriptEvent {
  id: string;
  fromStage: ManuscriptStage | null;
  toStage: ManuscriptStage;
  actorId?: string;
  comment?: string;
  createdAt?: string;
}

export interface Manuscript {
  id: string;
  organizationId: string;
  bookId?: string;
  title: string;
  contributorId?: string;
  stage: ManuscriptStage;
  assigneeId?: string;
  dueDate?: string;
  version: number;
  fileUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  events: ManuscriptEvent[];
}
