/** Mirrors backend Book.BookStatus (serialized as SCREAMING_SNAKE). */
export type BookStatus =
  | "DRAFT"
  | "IN_EDIT"
  | "DESIGNED"
  | "PRINTING"
  | "PUBLISHED"
  | "ARCHIVED";

/** Mirrors backend Contributor.ContributorType. */
export type ContributorType =
  | "AUTHOR"
  | "EDITOR"
  | "ILLUSTRATOR"
  | "TRANSLATOR"
  | "OTHER";

export interface Contributor {
  id: string;
  organizationId: string;
  fullName: string;
  type: ContributorType;
  email?: string;
  bio?: string;
}

export interface Contribution {
  contributorId: string;
  contributor?: Contributor;
  role: string;
  sharePercent: number;
}

export interface Book {
  id: string;
  organizationId: string;
  title: string;
  subtitle?: string;
  isbn?: string;
  imprint?: string;
  status: BookStatus;
  language?: string;
  pageCount?: number;
  createdAt?: string;
  updatedAt?: string;
  contributors?: Contribution[];
}
