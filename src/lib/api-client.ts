import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/auth";

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
  // (see .env.example and NEXT_PUBLIC_API_URL).
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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const doFetch = async (token: string | null): Promise<Response> => {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${baseUrl()}${path}`, { ...init, headers });
  };

  let res = await doFetch(getAccessToken());
  if (res.status === 401) {
    // Attempt exactly one silent refresh, then retry once.
    const next = await refreshAccessToken();
    if (next) {
      res = await doFetch(next);
    } else {
      await parseError(res);
    }
  }
  if (!res.ok) await parseError(res);
  if (res.status === 204) return undefined as T;
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
};
