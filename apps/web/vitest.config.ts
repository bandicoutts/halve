import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    // Only pure-logic units — no jsdom/Next runtime needed.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
