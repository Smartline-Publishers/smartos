"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { clearOrgTheme, updateCurrentOrg } from "@/features/organization/api";
import { updateOnboarding } from "@/features/settings/api";
import { ApiError } from "@/lib/api-client";
import {
  buildScale,
  contrastRatio,
  foregroundFor,
  isHexColor,
  normalizeHex,
} from "@/lib/org-theme";
import type { OrgTheme, ThemeModeColors, ThemeSlot } from "@/types/theme";
import { THEME_SLOTS } from "@/types/theme";

const SLOT_LABELS: Record<ThemeSlot, { label: string; hint: string }> = {
  primary: { label: "Primary", hint: "Buttons and key interactive elements" },
  shell: { label: "Shell / Background", hint: "Page and shell backgrounds" },
  secondary: { label: "Secondary", hint: "Supporting elements" },
  tertiary: { label: "Tertiary", hint: "Accents and highlights" },
  sidebar: { label: "Sidebar", hint: "Navigation sidebar background" },
};

const DEFAULT_LIGHT: ThemeModeColors = {
  primary: "#dc2626",
  shell: "#f5f7fb",
  secondary: "#262626",
  tertiary: "#2563eb",
  sidebar: "#0a0a0a",
};

const DEFAULT_DARK: ThemeModeColors = {
  primary: "#f87171",
  shell: "#0a0a0a",
  secondary: "#a3a3a3",
  tertiary: "#60a5fa",
  sidebar: "#0a0a0a",
};

function toColorInput(hex: string): string {
  return isHexColor(hex) ? normalizeHex(hex).slice(0, 7) : "#000000";
}

function ModeEditor({
  mode,
  colors,
  onChange,
}: {
  mode: "light" | "dark";
  colors: ThemeModeColors;
  onChange: (next: ThemeModeColors) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold capitalize text-ink dark:text-neutral-100">
        {mode} mode
      </h3>
      {THEME_SLOTS.map((slot) => (
        <div key={slot} className="flex items-center gap-3">
          <input
            type="color"
            aria-label={`${mode} ${slot} color picker`}
            value={toColorInput(colors[slot])}
            onChange={(e) => onChange({ ...colors, [slot]: e.target.value })}
            className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <div className="min-w-0 flex-1">
            <label
              htmlFor={`theme-${mode}-${slot}`}
              className="block text-xs font-bold text-ink dark:text-neutral-200"
            >
              {SLOT_LABELS[slot].label}
            </label>
            <p className="truncate text-[11px] text-muted dark:text-neutral-400">
              {SLOT_LABELS[slot].hint}
            </p>
          </div>
          <input
            id={`theme-${mode}-${slot}`}
            value={colors[slot]}
            onChange={(e) => onChange({ ...colors, [slot]: e.target.value })}
            spellCheck={false}
            placeholder="#rrggbb"
            aria-label={`${mode} ${slot} hex value`}
            className="h-10 w-24 shrink-0 rounded-lg border border-[#d8e0ec] bg-white px-2 font-mono text-xs text-ink dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
      ))}
    </div>
  );
}

function PreviewPane({ mode, colors }: { mode: "light" | "dark"; colors: ThemeModeColors }) {
  const dark = mode === "dark";
  const brand = buildScale(colors.primary);
  const tertiary = buildScale(colors.tertiary);
  const sidebarFg = foregroundFor(colors.sidebar);
  const onPrimary = foregroundFor(colors.primary);
  const style = {
    backgroundColor: colors.shell,
    color: dark ? "#e5e5e5" : "#172033",
  } as const;
  return (
    <div
      aria-label={`${mode} preview`}
      className="overflow-hidden rounded-xl border border-line dark:border-neutral-700"
      style={style}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 text-xs font-bold"
        style={{ backgroundColor: colors.sidebar, color: sidebarFg }}
      >
        <span
          className="inline-block h-3 w-3 rounded"
          style={{ backgroundColor: colors.primary }}
          aria-hidden="true"
        />
        {dark ? "Dark" : "Light"} preview · sidebar
      </div>
      <div className="flex flex-col gap-2 p-3">
        <div className="flex gap-2">
          <span
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: brand["600"], color: onPrimary }}
          >
            Button
          </span>
          <span
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: tertiary["100"], color: tertiary["700"] }}
          >
            Accent
          </span>
        </div>
        <div
          className="rounded-lg border p-2 text-xs"
          style={{
            backgroundColor: dark ? "#171717" : "#ffffff",
            borderColor: dark ? "#404040" : "#e4eaf2",
          }}
        >
          Card surface with supporting text
        </div>
        <input
          aria-label={`${mode} preview input`}
          placeholder="Form input"
          readOnly
          className="h-8 rounded-lg border px-2 text-xs"
          style={{
            backgroundColor: dark ? "#171717" : "#ffffff",
            borderColor: dark ? "#404040" : "#d8e0ec",
          }}
        />
      </div>
    </div>
  );
}

export function ThemeCustomizer({
  initial,
  onSaved,
}: {
  initial: OrgTheme | null | undefined;
  onSaved: () => Promise<void>;
}) {
  const [light, setLight] = useState<ThemeModeColors>(initial?.light ?? DEFAULT_LIGHT);
  const [dark, setDark] = useState<ThemeModeColors>(initial?.dark ?? DEFAULT_DARK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const issues = useMemo(() => {
    const list: string[] = [];
    for (const [mode, colors] of [["light", light], ["dark", dark]] as const) {
      for (const slot of THEME_SLOTS) {
        if (!isHexColor(colors[slot])) {
          list.push(`${mode}.${slot} must be a hex color like #dc2626`);
        }
      }
      if (isHexColor(colors.primary) && isHexColor(colors.shell)) {
        const ratio = contrastRatio(colors.primary, colors.shell);
        if (ratio < 3) {
          list.push(
            `${mode}: primary on shell contrast is ${ratio.toFixed(1)}:1 (needs at least 3:1)`,
          );
        }
      }
    }
    return list;
  }, [light, dark]);

  const advisories = useMemo(() => {
    const list: string[] = [];
    for (const [mode, colors] of [["light", light], ["dark", dark]] as const) {
      for (const slot of ["secondary", "tertiary"] as const) {
        if (isHexColor(colors[slot]) && isHexColor(colors.shell)) {
          const ratio = contrastRatio(colors[slot], colors.shell);
          if (ratio < 3) {
            list.push(
              `${mode}.${slot} on shell is ${ratio.toFixed(1)}:1 — below 3:1, may be hard to read`,
            );
          }
        }
      }
    }
    return list;
  }, [light, dark]);

  const save = async (skip = false) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      if (skip) {
        await updateOnboarding({ themeSkipped: true });
        setNotice("Theme setup skipped — the default theme stays active.");
      } else {
        if (issues.length > 0) {
          setError(issues[0]);
          return;
        }
        await updateCurrentOrg({ theme: { light, dark } });
        setNotice("Theme saved and applied.");
      }
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the theme.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await clearOrgTheme();
      setLight(initial?.light ?? DEFAULT_LIGHT);
      setDark(initial?.dark ?? DEFAULT_DARK);
      setNotice("Custom theme removed — the default theme applies.");
      await onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not reset the theme.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Light mode">
          <ModeEditor mode="light" colors={light} onChange={setLight} />
        </Card>
        <Card title="Dark mode">
          <ModeEditor mode="dark" colors={dark} onChange={setDark} />
        </Card>
      </div>

      <Card title="Live preview">
        <div className="grid gap-4 md:grid-cols-2">
          <PreviewPane mode="light" colors={light} />
          <PreviewPane mode="dark" colors={dark} />
        </div>
        {advisories.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1" aria-label="Contrast advisories">
            {advisories.map((a) => (
              <li key={a} className="text-xs text-amber-700 dark:text-amber-300">
                {a}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      {issues.length > 0 ? (
        <EmptyState
          title="Fix theme values to save"
          description={issues.join(" ")}
        />
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
          {notice}
        </p>
      ) : null}
      {saving ? <Spinner label="Saving theme…" /> : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save(false)} disabled={saving || issues.length > 0}>
          {saving ? "Saving…" : "Save theme"}
        </Button>
        <Button variant="ghost" onClick={() => save(true)} disabled={saving}>
          Skip for now (optional)
        </Button>
        {initial ? (
          <Button variant="ghost" onClick={reset} disabled={saving}>
            Reset to default
          </Button>
        ) : null}
      </div>
    </div>
  );
}
