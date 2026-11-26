import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/auth";

// Clerk token bridge: a client component (ClerkTokenSync) registers a getter
// that returns the current Clerk session token. When present, the API client
// uses it instead of the legacy localStorage tokens.
export type ClerkTokenGetter = (options?: { skipCache?: boolean }) => Promise<string | null>;
let clerkTokenGetter: ClerkTokenGetter | null = null;
export function setClerkTokenGetter(getter: ClerkTokenGetter | null): void {
  clerkTokenGetter = getter;
}

// Force the next Clerk token fetch to bypass the client cache. Used after an
// organization switch, where the cached token still carries the previous org.
let forceClerkTokenRefresh = false;
export function invalidateClerkTokenCache(): void {
  forceClerkTokenRefresh = true;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getClerkToken(): Promise<string | null> {
  if (!clerkTokenGetter) return null;
  const skipCache = forceClerkTokenRefresh;
  forceClerkTokenRefresh = false;
  // Wait briefly for Clerk to be ready instead of sending an unauthenticated
  // request that the backend (correctly) rejects with 401.
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const token = await clerkTokenGetter(skipCache ? { skipCache: true } : undefined);
      if (token) return token;
    } catch {
      // ignore and retry
    }
    if (attempt < 9) await delay(200);
  }
  return null;
}

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string[]>;

  constructor(status: number, message: string, fields?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

function baseUrl(): string {
  // Must include the version prefix, e.g. http://localhost:8080/api/v1
  // (configured via NEXT_PUBLIC_API_URL in a local .env.local).
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
}

interface BackendErrorBody {
  success?: unknown;
  message?: unknown;
  error?: {
    code?: unknown;
    message?: unknown;
    fields?: unknown;
  } | null;
  errors?: unknown;
}

interface TokenEnvelope {
  data?: {
    accessToken?: unknown;
    refreshToken?: unknown;
  };
  accessToken?: unknown;
  refreshToken?: unknown;
}

async function parseError(res: Response): Promise<never> {
  let message = `Request failed (${res.status})`;
  let fields: Record<string, string[]> | undefined;
  try {
    const data = (await res.json()) as BackendErrorBody;
    // Backend envelope: { success:false, error:{ code, message, fields } }
    const backendMessage = data.error?.message;
    if (typeof backendMessage === "string" && backendMessage.length > 0) {
      message = backendMessage;
    } else if (typeof data.message === "string" && data.message.length > 0) {
      message = data.message;
    }
    const rawFields = data.error?.fields ?? data.errors;
    if (rawFields !== null && typeof rawFields === "object" && !Array.isArray(rawFields)) {
      const entries = Object.entries(rawFields as Record<string, unknown>);
      const normalized: Record<string, string[]> = {};
      for (const [k, v] of entries) {
        if (typeof v === "string") normalized[k] = [v];
        else if (Array.isArray(v)) normalized[k] = v.map(String);
      }
      if (Object.keys(normalized).length > 0) fields = normalized;
    }
  } catch {
    // Non-JSON error body — keep default message.
  }
  throw new ApiError(res.status, message, fields);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${baseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = (await res.json()) as TokenEnvelope;
    // Backend wraps payloads in { data: {...} }; accept bare tokens too.
    const access =
      typeof data.data?.accessToken === "string"
        ? data.data.accessToken
        : typeof data.accessToken === "string"
          ? data.accessToken
          : null;
    if (!access) return null;
    const nextRefresh =
      typeof data.data?.refreshToken === "string"
        ? data.data.refreshToken
        : typeof data.refreshToken === "string"
          ? data.refreshToken
          : refresh;
    setTokens(access, nextRefresh);
    return access;
  } catch {
    return null;
  }
}

/**
 * Single-flight refresh: concurrent 401s share one in-flight refresh instead
 * of each racing POST /auth/refresh with the same token. Racing is not just
 * wasteful — the backend rotates refresh tokens, so the losers present an
 * already-rotated token, which the server treats as compromise and revokes
 * the whole token family (logging the user out).
 */
let inflightRefresh: Promise<string | null> | null = null;

function sharedRefresh(): Promise<string | null> {
  if (!inflightRefresh) {
    inflightRefresh = refreshAccessToken().finally(() => {
      inflightRefresh = null;
    });
  }
  return inflightRefresh;
}

/**
 * Endpoints that must never receive a stale Bearer token. Sending one to
 * /auth/login (for example) used to make a perfectly valid sign-in look
 * broken when localStorage still held an old token.
 */
const PUBLIC_AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/2fa/verify",
  "/auth/refresh",
  "/auth/logout",
  "/auth/register-organization",
  "/auth/password/forgot",
  "/auth/password/reset",
  "/auth/password/reset/validate",
  "/auth/passkeys/options",
  "/auth/passkeys/verify",
]);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isPublicAuth = PUBLIC_AUTH_PATHS.has(path.split("?")[0]);
  const doFetch = async (token: string | null): Promise<Response> => {
    const headers = new Headers(init.headers);
    // Multipart uploads carry their own content type (with boundary);
    // forcing JSON here would corrupt them.
    if (!(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${baseUrl()}${path}`, { ...init, headers });
  };

  const usingClerk = clerkTokenGetter !== null;
  const initialToken = isPublicAuth
    ? null
    : usingClerk
      ? await getClerkToken()
      : getAccessToken();
  let res = await doFetch(initialToken);
  if (res.status === 401 && !isPublicAuth) {
    if (usingClerk) {
      // The cached token may be stale (e.g. after an organization switch).
      // Force a fresh token once and retry before treating this as a logout.
      invalidateClerkTokenCache();
      const fresh = await getClerkToken();
      if (fresh && fresh !== initialToken) {
        res = await doFetch(fresh);
      }
    } else {
      // Legacy path: attempt exactly one (shared) silent refresh, then retry once.
      const next = await sharedRefresh();
      if (next) {
        res = await doFetch(next);
        if (res.status === 401) {
          clearTokens();
        }
      } else {
        await parseError(res);
      }
    }
  }
  if (!res.ok) await parseError(res);
  if (res.status === 204) return undefined as T;
  // Read the body once as text so an empty 200 (some endpoints return no
  // content) is tolerated instead of throwing on res.json(). Fall back to
  // json() for minimal fetch polyfills/mocks that only implement it.
  if (typeof res.text === "function") {
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }
  return (await res.json()) as T;
}

export const api = {
  get<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>(path, { ...init, method: "GET" });
  },
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>(path, {
      ...init,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>(path, {
      ...init,
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>(path, {
      ...init,
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
  del<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>(path, { ...init, method: "DELETE" });
  },
  /** Multipart file upload (e.g. avatars, logos). */
  upload<T>(path: string, form: FormData, init?: RequestInit): Promise<T> {
    return request<T>(path, { ...init, method: "POST", body: form });
  },
};
