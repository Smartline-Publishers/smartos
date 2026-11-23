import { afterEach, describe, expect, it } from "vitest";
import {
  applyOrgTheme,
  buildOrgThemeCss,
  buildScale,
  contrastRatio,
  foregroundFor,
  isHexColor,
  mix,
  normalizeHex,
} from "@/lib/org-theme";
import type { OrgTheme } from "@/types/theme";

const THEME: OrgTheme = {
  light: { primary: "#1d4ed8", shell: "#ffffff", secondary: "#64748b", tertiary: "#7c3aed", sidebar: "#0a0a0a" },
  dark: { primary: "#93c5fd", shell: "#0b1220", secondary: "#94a3b8", tertiary: "#a78bfa", sidebar: "#7c2d12" },
};

afterEach(() => {
  document.getElementById("org-theme")?.remove();
});

describe("org-theme", () => {
  it("validates hex colors", () => {
    expect(isHexColor("#dc2626")).toBe(true);
    expect(isHexColor("#fff")).toBe(true);
    expect(isHexColor("red")).toBe(false);
    expect(isHexColor("#gggggg")).toBe(false);
    expect(normalizeHex("#FFF")).toBe("#ffffff");
  });

  it("builds a scale anchored at the base color", () => {
    const scale = buildScale("#1d4ed8");
    expect(scale["600"]).toBe("#1d4ed8");
    expect(scale["50"]).not.toBe(scale["950"]);
  });

  it("mixes toward white and black", () => {
    expect(mix("#000000", "#ffffff", 1)).toBe("#000000");
    expect(mix("#000000", "#ffffff", 0)).toBe("#ffffff");
  });

  it("computes black-on-white contrast near 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeGreaterThan(20);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("renders light vars on :root and dark vars under html.dark", () => {
    const css = buildOrgThemeCss(THEME);
    expect(css).toContain(":root{");
    expect(css).toContain("html.dark{");
    expect(css).toContain("--org-brand-600:29 78 216;");
    expect(css).toContain("--org-brand-600:147 197 253;");
    expect(css).toContain("--org-sidebar:10 10 10;");
    expect(css).toContain("--org-sidebar-fg:255 255 255;");
    expect(css).toContain("--bg:#ffffff;");
    expect(css).toContain("--bg:#0b1220;");
  });

  it("picks readable foregrounds automatically", () => {
    expect(foregroundFor("#0a0a0a")).toBe("#ffffff");
    expect(foregroundFor("#ffffff")).toBe("#172033");
  });

  it("applies and clears the style tag", () => {
    applyOrgTheme(THEME);
    const tag = document.getElementById("org-theme");
    expect(tag?.textContent).toContain("--org-brand-600");
    applyOrgTheme(null);
    expect(document.getElementById("org-theme")).toBeNull();
  });
});
