import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand palette: red primary, black secondary, blue tertiary.
        // Each scale reads CSS variables set by the organization theme
        // (see lib/org-theme.ts); fallbacks preserve the platform defaults
        // when no custom theme is configured.
        brand: {
          50: "rgb(var(--org-brand-50, 254 242 242) / <alpha-value>)",
          100: "rgb(var(--org-brand-100, 254 226 226) / <alpha-value>)",
          200: "rgb(var(--org-brand-200, 254 202 202) / <alpha-value>)",
          300: "rgb(var(--org-brand-300, 252 165 165) / <alpha-value>)",
          400: "rgb(var(--org-brand-400, 248 113 113) / <alpha-value>)",
          500: "rgb(var(--org-brand-500, 239 68 68) / <alpha-value>)",
          600: "rgb(var(--org-brand-600, 220 38 38) / <alpha-value>)",
          700: "rgb(var(--org-brand-700, 185 28 28) / <alpha-value>)",
          800: "rgb(var(--org-brand-800, 153 27 27) / <alpha-value>)",
          900: "rgb(var(--org-brand-900, 127 29 29) / <alpha-value>)",
          950: "rgb(var(--org-brand-950, 69 10 10) / <alpha-value>)",
        },
        navy: {
          100: "#d4d4d4",
          200: "#a3a3a3",
          700: "rgb(var(--org-secondary-700, 38 38 38) / <alpha-value>)",
          800: "rgb(var(--org-secondary-800, 28 28 28) / <alpha-value>)",
          900: "rgb(var(--org-sidebar, 10 10 10) / <alpha-value>)",
          950: "#000000",
        },
        tertiary: {
          50: "rgb(var(--org-tertiary-50, 239 246 255) / <alpha-value>)",
          100: "rgb(var(--org-tertiary-100, 219 234 254) / <alpha-value>)",
          200: "rgb(var(--org-tertiary-200, 191 219 254) / <alpha-value>)",
          300: "rgb(var(--org-tertiary-300, 147 197 253) / <alpha-value>)",
          400: "rgb(var(--org-tertiary-400, 96 165 250) / <alpha-value>)",
          500: "rgb(var(--org-tertiary-500, 59 130 246) / <alpha-value>)",
          600: "rgb(var(--org-tertiary-600, 37 99 235) / <alpha-value>)",
          700: "rgb(var(--org-tertiary-700, 29 78 216) / <alpha-value>)",
          800: "rgb(var(--org-tertiary-800, 30 64 175) / <alpha-value>)",
          900: "rgb(var(--org-tertiary-900, 30 58 138) / <alpha-value>)",
          950: "rgb(var(--org-tertiary-950, 23 37 84) / <alpha-value>)",
        },
        // Kept names, reference hues: paper page bg, cream on-dark text.
        paper: "rgb(var(--org-shell-bg, 245 247 251))",
        cream: "#ffffff",
        ink: "#172033",
        muted: "#64748b",
        line: "#e4eaf2",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
