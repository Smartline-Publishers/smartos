import type { Role } from "@/types/auth";

const ACCESS_KEY = "smartos.accessToken";
const REFRESH_KEY = "smartos.refreshToken";
const EMAIL_KEY = "smartos.userEmail";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAccessToken(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACCESS_KEY, access);
  window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(EMAIL_KEY);
}

export function getStoredEmail(): string | null {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(EMAIL_KEY);
}

export function setStoredEmail(email: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(EMAIL_KEY, email);
}

export interface JwtClaims {
  sub: string;
  email: string;
  orgId: string;
  roles: Role[];
  exp: number;
}

/** Decode a JWT payload client-side (no verification — server is authoritative).
 *
 * NOTE: the backend access token contains only `sub`, `orgId`, `roles`
 * (see JwtService.buildToken) — it does NOT include `email`. Requiring
 * `email` here makes every real token parse as null, which leaves `user`
 * as null and makes ProtectedRoute bounce straight back to /login.
 * So `email` is optional and defaults to "" (caller may supply a fallback
 * such as the login form value or stored email).
 */
export function parseJwt(token: string): JwtClaims | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    const raw = JSON.parse(json) as Record<string, unknown>;
    if (
      typeof raw["sub"] !== "string" ||
      typeof raw["orgId"] !== "string"
    ) {
      return null;
    }
    const roles = Array.isArray(raw["roles"])
      ? (raw["roles"] as unknown[]).filter(
          (r): r is Role => typeof r === "string",
        )
      : [];
    return {
      sub: raw["sub"] as string,
      email: typeof raw["email"] === "string" ? raw["email"] : "",
      orgId: raw["orgId"] as string,
      roles,
      exp: typeof raw["exp"] === "number" ? (raw["exp"] as number) : 0,
    };
  } catch {
    return null;
  }
}
