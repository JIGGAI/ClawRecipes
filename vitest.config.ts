import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
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
