import { api } from "@/lib/api-client";
import { setTokens } from "@/lib/auth";
import type { ApiEnvelope } from "@/types/api";
import type { AuthTokens } from "@/types/auth";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const res = await api.post<ApiEnvelope<LoginResponse>>("/auth/login", {
    email,
    password,
  });
  const tokens: AuthTokens = {
    accessToken: res.data.accessToken,
    refreshToken: res.data.refreshToken,
  };
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const res = await api.post<ApiEnvelope<LoginResponse>>("/auth/refresh", {
    refreshToken,
  });
  const tokens: AuthTokens = {
    accessToken: res.data.accessToken,
    refreshToken: res.data.refreshToken,
  };
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
  const tokens: AuthTokens = {
    accessToken: res.data.accessToken,
    refreshToken: res.data.refreshToken,
  };
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}
