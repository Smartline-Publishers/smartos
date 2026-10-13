import type { Role } from "@/types/auth";

const ACCESS_KEY = "smartos.accessToken";
const REFRESH_KEY = "smartos.refreshToken";

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
}

export interface JwtClaims {
  sub: string;
  email: string;
  orgId: string;
  roles: Role[];
  exp: number;
}

/** Decode a JWT payload client-side (no verification — server is authoritative). */
export function parseJwt(token: string): JwtClaims | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const raw = JSON.parse(json) as Record<string, unknown>;
    if (
      typeof raw["sub"] !== "string" ||
      typeof raw["email"] !== "string" ||
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
      email: raw["email"] as string,
      orgId: raw["orgId"] as string,
      roles,
      exp: typeof raw["exp"] === "number" ? (raw["exp"] as number) : 0,
    };
  } catch {
    return null;
  }
}
