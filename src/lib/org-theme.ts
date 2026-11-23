import type { OrgTheme, ThemeModeColors } from "@/types/theme";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

export function normalizeHex(hex: string): string {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${h.toLowerCase()}`;
}

export function hexToRgb(hex: string): Rgb {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function toTriplet(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

function toHex({ r, g, b }: Rgb): string {
  const c = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mix two colors; `weight` is the share of `a` (0..1). */
export function mix(a: string, b: string, weight: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const w = Math.min(1, Math.max(0, weight));
  return toHex({
    r: ca.r * w + cb.r * (1 - w),
    g: ca.g * w + cb.g * (1 - w),
    b: ca.b * w + cb.b * (1 - w),
  });
}

const WHITE = "#ffffff";
const BLACK = "#000000";

/**
 * Expand one brand hex into a Tailwind-style 50..950 scale (approximate
 * tints/shades; exact fidelity is unnecessary since defaults apply untouched
 * when no custom theme is set).
 */
export function buildScale(base: string): Record<string, string> {
  const b = normalizeHex(base);
  return {
    "50": mix(b, WHITE, 0.08),
    "100": mix(b, WHITE, 0.16),
    "200": mix(b, WHITE, 0.32),
    "300": mix(b, WHITE, 0.5),
    "400": mix(b, WHITE, 0.7),
    "500": mix(b, WHITE, 0.88),
    "600": b,
    "700": mix(b, BLACK, 0.85),
    "800": mix(b, BLACK, 0.7),
    "900": mix(b, BLACK, 0.55),
    "950": mix(b, BLACK, 0.35),
  };
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const ch = (n: number) => {
    const c = n / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** WCAG contrast ratio between two hex colors (1..21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Dark sidebar surface derived from the shell color (keeps white text readable). */
export function shellStrong(shell: string): string {
  return mix(normalizeHex(shell), BLACK, 0.45);
}

/**
 * Pick readable text for a background: whichever of white or ink contrasts
 * more. Used for sidebar and on-primary text so any brand color stays legible.
 */
export function foregroundFor(bg: string): string {
  const normalized = normalizeHex(bg);
  return contrastRatio("#ffffff", normalized) >= contrastRatio("#172033", normalized)
    ? "#ffffff"
    : "#172033";
}

function modeVars(prefix: string, colors: ThemeModeColors): string {
  const brand = buildScale(colors.primary);
  const tertiary = buildScale(colors.tertiary);
  const secondary = buildScale(colors.secondary);
  const shell = normalizeHex(colors.shell);
  const sidebar = normalizeHex(colors.sidebar);
  const sidebarFg = foregroundFor(sidebar);
  const lines: string[] = [];
  for (const [shade, hex] of Object.entries(brand)) {
    lines.push(`--org-brand-${shade}:${toTriplet(hex)};`);
  }
  for (const [shade, hex] of Object.entries(tertiary)) {
    lines.push(`--org-tertiary-${shade}:${toTriplet(hex)};`);
  }
  lines.push(`--org-secondary-700:${toTriplet(secondary["700"])};`);
  lines.push(`--org-secondary-800:${toTriplet(secondary["800"])};`);
  lines.push(`--org-on-secondary:${toTriplet(foregroundFor(secondary["700"]))};`);
  lines.push(`--org-on-tertiary:${toTriplet(foregroundFor(tertiary["600"]))};`);
  lines.push(`--org-shell-bg:${toTriplet(shell)};`);
  lines.push(`--org-shell-strong:${toTriplet(shellStrong(shell))};`);
  lines.push(`--org-sidebar:${toTriplet(sidebar)};`);
  lines.push(`--org-sidebar-fg:${toTriplet(sidebarFg)};`);
  lines.push(`--org-sidebar-muted:${toTriplet(mix(sidebarFg, sidebar, 0.72))};`);
  lines.push(`--org-on-primary:${toTriplet(foregroundFor(normalizeHex(colors.primary)))};`);
  lines.push(`--brand:${normalizeHex(colors.primary)};`);
  lines.push(`--bg:${shell};`);
  return lines.map((l) => `${prefix}${l}`).join("");
}

/**
 * Render the `<style>` body that applies an org theme. Light values live on
 * `:root`, dark values under `html.dark` (matching the Tailwind dark-mode
 * strategy), so flipping modes instantly re-skins the app.
 */
export function buildOrgThemeCss(theme: OrgTheme): string {
  return (
    `:root{${modeVars("", theme.light)}}` + `html.dark{${modeVars("", theme.dark)}}`
  );
}

const STYLE_ID = "org-theme";

export function applyOrgTheme(theme: OrgTheme | null | undefined): void {
  if (typeof document === "undefined") return;
  const existing = document.getElementById(STYLE_ID);
  if (!theme) {
    existing?.remove();
    return;
  }
  const css = buildOrgThemeCss(theme);
  if (existing) {
    existing.textContent = css;
  } else {
    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.textContent = css;
    document.head.appendChild(tag);
  }
}
