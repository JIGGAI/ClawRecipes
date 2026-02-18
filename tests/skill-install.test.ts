import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, test } from "vitest";
import { detectMissingSkills, skillInstallCommands } from "../src/lib/skill-install";
import { getRecipesConfig } from "../src/lib/config";

const cfg = getRecipesConfig({});

describe("skill-install", () => {
  describe("skillInstallCommands", () => {
    test("returns cd + npx commands for skills", () => {
      const lines = skillInstallCommands(cfg, ["foo", "bar"]);
      expect(lines[0]).toContain('cd "');
      expect(lines).toContain("npx clawhub@latest install foo");
      expect(lines).toContain("npx clawhub@latest install bar");
    });
    test("returns only cd when no skills", () => {
      const lines = skillInstallCommands(cfg, []);
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain("cd ");
    });
  });

  describe("detectMissingSkills", () => {
    test("returns empty when all skills exist", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "skill-install-"));
      await fs.mkdir(path.join(base, "a"), { recursive: true });
      await fs.mkdir(path.join(base, "b"), { recursive: true });
      try {
        const missing = await detectMissingSkills(base, ["a", "b"]);
        expect(missing).toEqual([]);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("returns only missing skills", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "skill-install-"));
      await fs.mkdir(path.join(base, "exists"), { recursive: true });
      try {
        const missing = await detectMissingSkills(base, ["exists", "missing1", "missing2"]);
        expect(missing).toEqual(["missing1", "missing2"]);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("returns all when install dir empty", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "skill-install-"));
      try {
        const missing = await detectMissingSkills(base, ["a", "b"]);
        expect(missing).toEqual(["a", "b"]);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });
});
