import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdcff",
          300: "#8ec5ff",
          400: "#59a5ff",
          500: "#3383fc",
          600: "#1d63f1",
          700: "#164fde",
          800: "#183fb4",
          900: "#193a8d",
          950: "#122352",
        },
        // SmartOS editorial identity: warm paper surfaces, press-ink dark panels.
        paper: "#f6f5f1",
        cream: "#f5f1e3",
        press: {
          700: "#1d4a3e",
          800: "#14382e",
          900: "#0e2a22",
          950: "#0a1f19",
        },
        gold: "#d9a93b",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
