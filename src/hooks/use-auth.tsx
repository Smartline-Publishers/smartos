"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { getSessionInfo } from "@/features/auth/api";
import type { AuthTokens, Permission, Role, SessionInfo, User } from "@/types/auth";
import type { LoginResult } from "@/features/auth/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
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

  const loading = !isLoaded || (clerkUser !== null && sessionLoading && session === null);

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

  const reloadSession = useCallback(async () => {
    if (!clerkUser) return;
    try {
      setSession(await getSessionInfo());
    } catch {
      setSession(null);
    }
  }, [clerkUser]);

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
