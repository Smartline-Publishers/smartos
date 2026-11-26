"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useClerk, useOrganization, useUser } from "@clerk/nextjs";
import { getSessionInfo } from "@/features/auth/api";
import { invalidateClerkTokenCache } from "@/lib/api-client";
import type { AuthTokens, Permission, Role, SessionInfo, User } from "@/types/auth";
import type { LoginResult } from "@/features/auth/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Delay between `/auth/me` retries while the Clerk session picks up an org. */
const ORG_SYNC_RETRY_MS = 300;
const ORG_SYNC_ATTEMPTS = 5;

const SESSION_CACHE_KEY = "smartos.session";

interface CachedSession {
  uid: string;
  session: SessionInfo;
}

function readCachedSession(uid: string): SessionInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSession;
    if (parsed?.uid !== uid || !parsed.session) return null;
    return parsed.session;
  } catch {
    return null;
  }
}

function writeCachedSession(uid: string, session: SessionInfo | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.sessionStorage.setItem(
        SESSION_CACHE_KEY,
        JSON.stringify({ uid, session } satisfies CachedSession),
      );
    } else {
      window.sessionStorage.removeItem(SESSION_CACHE_KEY);
    }
  } catch {
    // ignore
  }
}

export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut, setActive } = useClerk();
  const { organization: activeOrganization, isLoaded: orgLoaded } = useOrganization();
  const router = useRouter();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  /** True while we activate an existing Clerk membership the session has not picked up yet. */
  const [activatingOrg, setActivatingOrg] = useState(false);
  const activationFor = useRef<string | null>(null);
  const hydratedFor = useRef<string | null>(null);

  const user: User | null = useMemo(() => {
    if (!isLoaded || !clerkUser) return null;
    const meta = (clerkUser.publicMetadata ?? {}) as Record<string, unknown>;
    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
      orgId: typeof meta.orgId === "string" ? meta.orgId : "",
      roles: Array.isArray(meta.roles) ? (meta.roles as Role[]) : [],
    };
  }, [isLoaded, clerkUser]);

  /** The session object exposed to consumers: prefers the live session, falls
   * back to a cached one only while the first fetch is in flight. */
  const effectiveSession = useMemo(() => {
    if (session) return session;
    if (!isLoaded || !clerkUser) return null;
    return readCachedSession(clerkUser.id);
  }, [session, isLoaded, clerkUser]);

  const loadSession = useCallback(
    async (options?: { requireOrg?: boolean }): Promise<SessionInfo | null> => {
      const attempts = options?.requireOrg ? ORG_SYNC_ATTEMPTS : 1;
      let last: SessionInfo | null = null;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          last = await getSessionInfo();
          setSession(last);
          if (!options?.requireOrg || last.organizationId) return last;
        } catch {
          last = null;
          setSession(null);
        }
        if (attempt < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, ORG_SYNC_RETRY_MS));
        }
      }
      return last;
    },
    [],
  );

  // Load the live role/permission context from the backend once Clerk signs in.
  // Hydrate from cache first so the UI can paint the previous (correct) user
  // while revalidating, but never trust a cache belonging to another user.
  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) {
      setSession(null);
      setSessionResolved(true);
      hydratedFor.current = null;
      if (typeof window !== "undefined") {
        try { window.sessionStorage.removeItem(SESSION_CACHE_KEY); } catch { /* ignore */ }
      }
      return;
    }

    // Hydrate synchronously on first sight of this user.
    if (hydratedFor.current !== clerkUser.id) {
      hydratedFor.current = clerkUser.id;
      const cached = readCachedSession(clerkUser.id);
      if (cached) setSession(cached);
    }

    let alive = true;
    setSessionLoading(true);
    getSessionInfo()
      .then((s) => {
        if (alive) {
          setSession(s);
          writeCachedSession(clerkUser.id, s);
        }
      })
      .catch(() => {
        if (alive) setSession(null);
      })
      .finally(() => {
        if (alive) {
          setSessionLoading(false);
          setSessionResolved(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [isLoaded, clerkUser?.id, clerkUser]);

  /**
   * Adopt an existing Clerk organization instead of asking the user to create
   * one. Organizations created in Clerk (or accepted via invitation) are
   * memberships, not an *active* organization: until one is activated the
   * session token has no `org_id`, the backend cannot link the user, and the
   * app would send them to /onboarding to create a duplicate.
   */
  useEffect(() => {
    if (!isLoaded || !clerkUser || !orgLoaded) return;
    if (activeOrganization) {
      activationFor.current = null;
      return;
    }
    if (activationFor.current === clerkUser.id) return;
    const memberships = clerkUser.organizationMemberships ?? [];
    if (memberships.length === 0) return;

    const preferred =
      memberships.find((m) => m.role.toLowerCase().includes("admin")) ?? memberships[0];

    activationFor.current = clerkUser.id;
    setActivatingOrg(true);
    invalidateClerkTokenCache();
    void setActive({ organization: preferred.organization.id })
      .then(() => loadSession({ requireOrg: true }))
      .catch(() => undefined)
      .finally(() => setActivatingOrg(false));
  }, [isLoaded, clerkUser, orgLoaded, activeOrganization, setActive, loadSession]);

  /**
   * When the active Clerk organization changes (e.g. via the switcher), the
   * backend session is stale: it still points at the previous org's role and
   * permissions. Force a fresh token and re-fetch /auth/me.
   */
  useEffect(() => {
    if (!isLoaded || !clerkUser || !orgLoaded) return;
    if (!activeOrganization || !effectiveSession) return;
    if (activeOrganization.id === effectiveSession.organizationId) return;
    invalidateClerkTokenCache();
    void loadSession({ requireOrg: true });
  }, [isLoaded, clerkUser, orgLoaded, activeOrganization, effectiveSession, loadSession]);

  const loading =
    !isLoaded ||
    (clerkUser !== null &&
      (!sessionResolved || !orgLoaded || activatingOrg));

  const permissions: Permission[] = useMemo(
    () => effectiveSession?.permissions ?? [],
    [effectiveSession],
  );

  // Persist the backend session so a refresh restores it without a flash.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (effectiveSession && clerkUser) {
        window.sessionStorage.setItem(
          SESSION_CACHE_KEY,
          JSON.stringify({ uid: clerkUser.id, session: effectiveSession } satisfies CachedSession),
        );
      } else if (!clerkUser) {
        window.sessionStorage.removeItem(SESSION_CACHE_KEY);
      }
    } catch {
      // ignore
    }
  }, [effectiveSession, clerkUser?.id]);

  const logout = useCallback(
    (redirectTo: string = "/sign-in") => {
      if (typeof window !== "undefined") {
        try { window.sessionStorage.removeItem(SESSION_CACHE_KEY); } catch { /* ignore */ }
      }
      void signOut({ redirectUrl: redirectTo });
    },
    [signOut],
  );

  const reloadSession = useCallback(
    async (options?: { requireOrg?: boolean }): Promise<SessionInfo | null> => {
      if (!clerkUser) return null;
      return loadSession(options);
    },
    [clerkUser, loadSession],
  );

  return {
    user: effectiveSession
      ? { id: effectiveSession.userId, email: effectiveSession.email, orgId: effectiveSession.organizationId, roles: effectiveSession.roles as Role[] }
      : user,
    session: effectiveSession,
    permissions,
    loading,
    login: async (_email?: string, _password?: string): Promise<LoginResult> => {
      router.push("/sign-in");
      return { kind: "tokens", tokens: { accessToken: "", refreshToken: "" } as AuthTokens };
    },
    loginWithPasskey: async (_email?: string): Promise<LoginResult> => {
      router.push("/sign-in");
      return { kind: "tokens", tokens: { accessToken: "", refreshToken: "" } as AuthTokens };
    },
    loginWithTwoFactor: async (_challengeToken?: string, _code?: string, _fallbackEmail?: string) => {},
    logout,
    refreshSession: (fallbackEmail?: string) => {
      void reloadSession();
    },
    reloadSession,
  };
}

export function usePrimaryRole(): Role | null {
  const roles = useRoles();
  return roles[0] ?? null;
}

export function useRoles(): Role[] {
  const { session, user } = useAuth();
  if (session?.roles?.length) return session.roles as Role[];
  return user?.roles ?? [];
}