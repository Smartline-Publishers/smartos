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
import { login as loginRequest, verifyTwoFactor } from "@/features/auth/api";
import type { LoginResult } from "@/features/auth/api";
import {
  clearTokens,
  getAccessToken,
  getStoredEmail,
  parseJwt,
  setStoredEmail,
} from "@/lib/auth";
import type { User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  loginWithTwoFactor: (challengeToken: string, code: string, fallbackEmail: string) => Promise<void>;
  logout: () => void;
  /** Re-read the stored token (e.g. after register/invite-accept set tokens directly). */
  refreshSession: (fallbackEmail?: string) => void;
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(userFromToken(getAccessToken(), getStoredEmail()));
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    if (result.kind === "challenge") return result;
    setStoredEmail(email);
    setUser(userFromToken(getAccessToken(), email));
    return result;
  }, []);

  const loginWithTwoFactor = useCallback(
    async (challengeToken: string, code: string, fallbackEmail: string) => {
      await verifyTwoFactor(challengeToken, code);
      setStoredEmail(fallbackEmail);
      setUser(userFromToken(getAccessToken(), fallbackEmail));
    },
    [],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push("/login");
  }, [router]);

  const refreshSession = useCallback((fallbackEmail?: string) => {
    if (fallbackEmail) setStoredEmail(fallbackEmail);
    setUser(userFromToken(getAccessToken(), fallbackEmail ?? getStoredEmail()));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, loginWithTwoFactor, logout, refreshSession }),
    [user, loading, login, loginWithTwoFactor, logout, refreshSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
