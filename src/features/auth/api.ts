import { api, ApiError } from "@/lib/api-client";
import { setTokens } from "@/lib/auth";
import type { ApiEnvelope } from "@/types/api";
import type { AuthTokens } from "@/types/auth";

interface LoginResponse {
  accessToken?: string | null;
  refreshToken?: string | null;
  twoFactorRequired?: boolean;
  challengeToken?: string | null;
}

function requireTokens(data: LoginResponse): AuthTokens {
  if (typeof data.accessToken !== "string" || typeof data.refreshToken !== "string") {
    throw new ApiError(500, "Malformed authentication response");
  }
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

export type LoginResult =
  | { kind: "tokens"; tokens: AuthTokens }
  | { kind: "challenge"; challengeToken: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await api.post<ApiEnvelope<LoginResponse>>("/auth/login", {
    email,
    password,
  });
  if (res.data.twoFactorRequired && typeof res.data.challengeToken === "string") {
    return { kind: "challenge", challengeToken: res.data.challengeToken };
  }
  const tokens = requireTokens(res.data);
  setTokens(tokens.accessToken, tokens.refreshToken);
  return { kind: "tokens", tokens };
}

export async function verifyTwoFactor(challengeToken: string, code: string): Promise<AuthTokens> {
  const res = await api.post<ApiEnvelope<LoginResponse>>("/auth/2fa/verify", {
    challengeToken,
    code,
  });
  const tokens = requireTokens(res.data);
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const res = await api.post<ApiEnvelope<LoginResponse>>("/auth/refresh", {
    refreshToken,
  });
  const tokens = requireTokens(res.data);
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function registerOrg(input: {
  organizationName: string;
  slug?: string;
  adminEmail: string;
  adminPassword: string;
  adminFullName: string;
}): Promise<AuthTokens> {
  const slug =
    input.slug ??
    input.organizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  // Backend: POST /api/v1/auth/register-organization -> 201 + token envelope.
  const res = await api.post<ApiEnvelope<LoginResponse>>("/auth/register-organization", {
    organizationName: input.organizationName,
    slug,
    adminEmail: input.adminEmail,
    adminPassword: input.adminPassword,
    adminFullName: input.adminFullName,
  });
  const tokens = requireTokens(res.data);
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}
