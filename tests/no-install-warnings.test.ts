import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, test } from "vitest";

// Regression guard: keep plugin install/scaffold output warning-free.
// OpenClaw (and users) treat warnings as potential unsafe patterns.
//
// NOTE: This is a lightweight static check. It prevents us from shipping
// obvious "warning" strings in the plugin entrypoint.

describe("install output guardrails", () => {
  test("plugin entrypoint should not emit warning/error phrasing", async () => {
    const entry = path.resolve(__dirname, "..", "index.ts");
    const text = await fs.readFile(entry, "utf8");

    // Disallow explicit warning prefixes.
    expect(text).not.toMatch(/\[recipes\]\s*warning:/i);
    // If we need to log, use neutral phrasing (note/info) and keep it rare.
  });
});
