import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
  // Match Next.js: automatic JSX runtime so component files don't need to
  // import React explicitly.
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
});
