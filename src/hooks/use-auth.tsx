"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  login as loginRequest,
  loginWithPasskey as loginWithPasskeyRequest,
  verifyTwoFactor,
  getSessionInfo,
} from "@/features/auth/api";
import type { LoginResult } from "@/features/auth/api";
import {
  clearTokens,
  getAccessToken,
  getStoredEmail,
  parseJwt,
  setStoredEmail,
} from "@/lib/auth";
import type { Permission, Role, SessionInfo, User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  /** Live role/permission context from the server; null until it loads. */
  session: SessionInfo | null;
  /** Effective permissions of the caller. */
  permissions: Permission[];
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  loginWithPasskey: (email?: string) => Promise<LoginResult>;
  loginWithTwoFactor: (challengeToken: string, code: string, fallbackEmail: string) => Promise<void>;
  /** Clears tokens and returns to the sign-in page. */
  logout: (redirectTo?: string) => void;
  /** Re-read the stored token (e.g. after register/invite-accept set tokens directly). */
  refreshSession: (fallbackEmail?: string) => void;
  /** Reload the live session (role/permissions) from the server. */
  reloadSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromToken(token: string | null, fallbackEmail?: string | null): User | null {
  if (!token) return null;
  const claims = parseJwt(token);
  if (!claims) return null;
  // Backend JWT has no `email` claim — prefer the token value, then the
  // explicit fallback (login form), then the persisted email from a prior login.
  const email = claims.email || fallbackEmail || getStoredEmail() || "";
  return {
    id: claims.sub,
    email,
    orgId: claims.orgId,
    roles: claims.roles,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // The server is the authority on the caller's role and permissions. They are
  // loaded on mount (and after a role change) so the UI reflects them
  // immediately rather than whatever the access token happened to carry.
  const reloadSession = useCallback(async () => {
    if (!getAccessToken()) {
      setSession(null);
      return;
    }
    try {
      setSession(await getSessionInfo());
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    const current = userFromToken(getAccessToken(), getStoredEmail());
    setUser(current);
    setLoading(false);
    if (current) void reloadSession();
  }, [reloadSession]);

const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    if (result.kind === "challenge") return result;
    setStoredEmail(email);
    setUser(userFromToken(getAccessToken(), email));
    await reloadSession();
    return result;
}, [reloadSession]);

  const loginWithPasskey = useCallback(async (email?: string) => {
    const result = await loginWithPasskeyRequest(email);
    if (result.kind === "challenge") return result;
    const token = getAccessToken();
    const resolved = email || parseJwt(token ?? "")?.email || getStoredEmail() || "";
    if (resolved) setStoredEmail(resolved);
    setUser(userFromToken(token, resolved));
    await reloadSession();
    return result;
  }, [reloadSession]);

  const loginWithTwoFactor = useCallback(
    async (challengeToken: string, code: string, fallbackEmail: string) => {
      await verifyTwoFactor(challengeToken, code);
      setStoredEmail(fallbackEmail);
      setUser(userFromToken(getAccessToken(), fallbackEmail));
      await reloadSession();
    },
    [reloadSession],
  );

  const logout = useCallback((redirectTo: string = "/login") => {
    clearTokens();
    setUser(null);
    setSession(null);
    router.push(redirectTo);
  }, [router]);

  const refreshSession = useCallback(
    (fallbackEmail?: string) => {
      if (fallbackEmail) setStoredEmail(fallbackEmail);
      setUser(userFromToken(getAccessToken(), fallbackEmail ?? getStoredEmail()));
      void reloadSession();
    },
    [reloadSession],
  );

  const permissions = useMemo<Permission[]>(
    () => session?.permissions ?? [],
    [session],
  );

  const value = useMemo(
    () => ({
      user,
      session,
      permissions,
      loading,
      login,
      loginWithPasskey,
      loginWithTwoFactor,
      logout,
      refreshSession,
      reloadSession,
    }),
    [user, session, permissions, loading, login, loginWithPasskey, loginWithTwoFactor, logout,
      refreshSession, reloadSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/**
 * The caller's primary role. Prefers the live role from the server and
 * falls back to the token claims while the session is still loading.
 * Returns the first role (typically the user's primary role in the org).
 */
export function usePrimaryRole(): Role | null {
  const roles = useRoles();
  return roles[0] ?? null;
}

/**
 * The caller's effective roles. Prefers the live role from the server and
 * falls back to the token claims while the session is still loading.
 */
export function useRoles(): Role[] {
  const { session, user } = useAuth();
  if (session?.roles?.length) return session.roles;
  return user?.roles ?? [];
}
