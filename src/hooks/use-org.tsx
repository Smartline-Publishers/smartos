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
import { useAuth } from "@/hooks/use-auth";
import { getCurrentOrg, type CurrentOrganization } from "@/features/organization/api";
import {
  getOnboarding,
  getProfile,
  type OnboardingChecklist,
  type Profile,
} from "@/features/settings/api";
import { applyOrgTheme } from "@/lib/org-theme";
import { isOrgTheme, type OrgTheme } from "@/types/theme";
import { ApiError } from "@/lib/api-client";

interface OrgContextValue {
  org: CurrentOrganization | null;
  profile: Profile | null;
  onboarding: OnboardingChecklist | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

function themeCacheKey(orgId: string): string {
  return `smartos.orgTheme.${orgId}`;
}

function readCachedTheme(orgId: string): OrgTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(themeCacheKey(orgId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isOrgTheme(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedTheme(orgId: string, theme: OrgTheme | null | undefined): void {
  if (typeof window === "undefined") return;
  try {
    if (theme && isOrgTheme(theme)) {
      window.localStorage.setItem(themeCacheKey(orgId), JSON.stringify(theme));
    } else {
      window.localStorage.removeItem(themeCacheKey(orgId));
    }
  } catch {
    // Storage unavailable — theming still works for the session.
  }
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [org, setOrg] = useState<CurrentOrganization | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingChecklist | null>(null);
  const [loading, setLoading] = useState(false);

  // Instant paint: apply the last known theme for this org before the
  // network round-trips, so navigation never flashes the default theme.
  useEffect(() => {
    if (!user) {
      setOrg(null);
      setProfile(null);
      setOnboarding(null);
      applyOrgTheme(null);
      return;
    }
    applyOrgTheme(readCachedTheme(user.orgId));
  }, [user?.orgId, user === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [nextOrg, nextProfile] = await Promise.all([getCurrentOrg(), getProfile()]);
      setOrg(nextOrg);
      setProfile(nextProfile);
      writeCachedTheme(nextOrg.id, nextOrg.theme);
      applyOrgTheme(nextOrg.theme);
      // Every user has their own independent onboarding checklist; fetch it for all roles.
      try {
        setOnboarding(await getOnboarding());
      } catch (e) {
        if (!(e instanceof ApiError && (e.status === 401 || e.status === 403))) throw e;
        setOnboarding(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let alive = true;
    if (!user) return;
    refresh().catch(() => {
      if (alive) {
        setOrg(null);
        setProfile(null);
        setOnboarding(null);
      }
    });
    return () => {
      alive = false;
    };
  }, [user, refresh]);

  const value = useMemo(
    () => ({ org, profile, onboarding, loading, refresh }),
    [org, profile, onboarding, loading, refresh],
  );
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
