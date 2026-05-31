import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // Only pure-logic units — no jsdom/Next runtime needed.
    include: ["src/**/*.test.ts"],
  },
});
