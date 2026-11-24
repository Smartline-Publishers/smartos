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
import type { AuthTokens, Permission, Role, SessionInfo, User } from "@/types/auth";
import type { LoginResult } from "@/features/auth/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/** Delay between `/auth/me` retries while the Clerk session picks up an org. */
const ORG_SYNC_RETRY_MS = 300;
const ORG_SYNC_ATTEMPTS = 5;

export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut, setActive } = useClerk();
  const { organization: activeOrganization, isLoaded: orgLoaded } = useOrganization();
  const router = useRouter();

  const [session, setSession] = useState<SessionInfo | null>(() => {
    // Restore the last known backend session optimistically so a refresh does
    // not flash the wrong screen while /auth/me is revalidated.
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem("smartos.session");
      return raw ? (JSON.parse(raw) as SessionInfo) : null;
    } catch {
      return null;
    }
  });
  const [sessionLoading, setSessionLoading] = useState(false);
  /** True while we activate an existing Clerk membership the session has not picked up yet. */
  const [activatingOrg, setActivatingOrg] = useState(false);
  const activationFor = useRef<string | null>(null);

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

  /**
   * Fetches `/auth/me`. When `requireOrg` is set, retries briefly because the
   * backend only links an organization after the Clerk session token carries
   * the `org_id` claim, which lands a moment after `setActive()`.
   */
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
  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) {
      setSession(null);
      return;
    }
    let alive = true;
    setSessionLoading(true);
    getSessionInfo()
      .then((s) => {
        if (alive) setSession(s);
      })
      .catch(() => {
        if (alive) setSession(null);
      })
      .finally(() => {
        if (alive) setSessionLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [isLoaded, clerkUser?.id]);

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

    // Prefer an admin membership so the first landing has full access; Clerk
    // returns the most recent membership first.
    const preferred =
      memberships.find((m) => m.role.toLowerCase().includes("admin")) ?? memberships[0];

    activationFor.current = clerkUser.id;
    setActivatingOrg(true);
    void setActive({ organization: preferred.organization.id })
      .then(() => loadSession({ requireOrg: true }))
      .catch(() => undefined)
      .finally(() => setActivatingOrg(false));
  }, [isLoaded, clerkUser, orgLoaded, activeOrganization, setActive, loadSession]);

  const loading =
    !isLoaded ||
    (clerkUser !== null && ((sessionLoading && session === null) || !orgLoaded || activatingOrg));

  const permissions: Permission[] = useMemo(
    () => session?.permissions ?? [],
    [session],
  );

  // Persist the backend session so a refresh restores it without a flash.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (session) window.sessionStorage.setItem("smartos.session", JSON.stringify(session));
      else window.sessionStorage.removeItem("smartos.session");
    } catch {
      // ignore
    }
  }, [session]);

  const logout = useCallback(
    (redirectTo: string = "/sign-in") => {
      if (typeof window !== "undefined") {
        try { window.sessionStorage.removeItem("smartos.session"); } catch { /* ignore */ }
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
    user: session
      ? { id: session.userId, email: session.email, orgId: session.organizationId, roles: session.roles as Role[] }
      : user,
    session,
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
