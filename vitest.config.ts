import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Upstream refactored to handler-based __internal; these tests expect that API.
    // Our branch keeps monolithic index.ts. Exclude until we adopt handler structure.
    exclude: [
      "tests/cov-10.test.ts",
      "tests/index-handlers.test.ts",
      "tests/recipes-commands.test.ts",
      "tests/recipes-internal.test.ts",
      "tests/scaffold-commands.test.ts",
      "tests/ticket-commands.test.ts",
    ],
  },
  coverage: {
    provider: "v8",
    reporter: ["text", "html"],
    include: ["./index.ts", "src/**/*.ts"],
    exclude: [
      "**/*.test.ts",
      "**/node_modules/**",
      "**/scripts/**",
      "**/*.mjs",
      "scripts/**",
      "src/lib/index.ts",
      "src/lib/bindings.ts",
    ],
    // index.ts is thin CLI wiring; logic tested via __internal handlers
    thresholds: {
      lines: 60,
      functions: 90,
      branches: 65,
      statements: 60,
    },
  },
});
