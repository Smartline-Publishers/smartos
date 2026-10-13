/** Mirrors backend Role enum. */
export type Role =
  | "PLATFORM_ADMIN"
  | "ORG_ADMIN"
  | "EDITOR"
  | "DESIGNER"
  | "PRODUCTION"
  | "WAREHOUSE"
  | "SALES"
  | "FINANCE"
  | "AUTHOR"
  | "VIEWER";

export interface User {
  id: string;
  email: string;
  orgId: string;
  roles: Role[];
  displayName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
