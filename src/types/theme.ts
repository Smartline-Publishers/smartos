/** Organization brand theme: independent palettes for light and dark mode. */
export interface ThemeModeColors {
  primary: string;
  shell: string;
  secondary: string;
  tertiary: string;
  sidebar: string;
}

export interface OrgTheme {
  light: ThemeModeColors;
  dark: ThemeModeColors;
}

export const THEME_SLOTS = ["primary", "shell", "secondary", "tertiary", "sidebar"] as const;
export type ThemeSlot = (typeof THEME_SLOTS)[number];

export function isThemeModeColors(value: unknown): value is ThemeModeColors {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return THEME_SLOTS.every((s) => typeof v[s] === "string");
}

export function isOrgTheme(value: unknown): value is OrgTheme {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return isThemeModeColors(v["light"]) && isThemeModeColors(v["dark"]);
}
