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

export type ThemeChoice = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "smartos.theme";

interface ThemeContextValue {
  /** User's selected preference. Defaults to "system". */
  choice: ThemeChoice;
  /** Effective theme after resolving "system" against the OS preference. */
  resolved: ResolvedTheme;
  setChoice: (choice: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function readStoredChoice(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // Storage unavailable — fall through to default.
  }
  return "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // NOTE: initialized without touching the DOM so SSR and first client
  // render agree (light, no `dark` class) — no hydration mismatch. The
  // stored/OS preference is applied post-mount in the effect below.
  const [choice, setChoiceState] = useState<ThemeChoice>("system");
  const [osDark, setOsDark] = useState<boolean>(false);

  useEffect(() => {
    setChoiceState(readStoredChoice());
    setOsDark(systemPrefersDark());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setOsDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved: ResolvedTheme =
    choice === "dark" || (choice === "system" && osDark) ? "dark" : "light";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode) — session-only choice still works.
    }
  }, []);

  const value = useMemo(
    () => ({ choice, resolved, setChoice }),
    [choice, resolved, setChoice],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
