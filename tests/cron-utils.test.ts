import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, test } from "vitest";
import { cronKey, hashSpec, loadCronMappingState, parseToolTextJson } from "../src/lib/cron-utils";

describe("cron-utils", () => {
  describe("cronKey", () => {
    test("formats team scope", () => {
      expect(cronKey({ kind: "team", teamId: "qa-team", recipeId: "dev" }, "job1")).toBe(
        "team:qa-team:recipe:dev:cron:job1"
      );
    });
    test("formats agent scope", () => {
      expect(cronKey({ kind: "agent", agentId: "qa-lead", recipeId: "dev" }, "job1")).toBe(
        "agent:qa-lead:recipe:dev:cron:job1"
      );
    });
  });

  describe("parseToolTextJson", () => {
    test("parses valid JSON", () => {
      expect(parseToolTextJson('{"jobs":[]}', "test")).toEqual({ jobs: [] });
    });
    test("returns null for empty string", () => {
      expect(parseToolTextJson("", "test")).toBeNull();
      expect(parseToolTextJson("   ", "test")).toBeNull();
    });
    test("throws for invalid JSON", () => {
      expect(() => parseToolTextJson("not json", "label")).toThrow(/Failed parsing JSON from tool text \(label\)/);
    });
  });

  describe("hashSpec", () => {
    test("returns stable hex hash", () => {
      const h = hashSpec({ a: 1, b: 2 });
      expect(h).toMatch(/^[a-f0-9]{64}$/);
      expect(hashSpec({ a: 1, b: 2 })).toBe(h);
      expect(hashSpec({ b: 2, a: 1 })).toBe(h);
    });
  });

  describe("loadCronMappingState", () => {
    test("returns default when file missing", async () => {
      const p = path.join(os.tmpdir(), "cron-state-missing-" + Date.now() + ".json");
      const state = await loadCronMappingState(p);
      expect(state).toEqual({ version: 1, entries: {} });
    });
    test("returns existing v1 state", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "cron-state-"));
      const p = path.join(base, "state.json");
      const data = { version: 1, entries: { "key1": { installedCronId: "id1", specHash: "abc", updatedAtMs: 123 } } };
      await fs.writeFile(p, JSON.stringify(data), "utf8");
      try {
        const state = await loadCronMappingState(p);
        expect(state.version).toBe(1);
        expect(state.entries.key1.installedCronId).toBe("id1");
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("returns default for invalid or non-v1 content", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "cron-state-"));
      const p = path.join(base, "state.json");
      await fs.writeFile(p, '{"version":2}', "utf8");
      try {
        const state = await loadCronMappingState(p);
        expect(state).toEqual({ version: 1, entries: {} });
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });
});
