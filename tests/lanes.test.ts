import { describe, expect, test, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureLaneDir, RecipesCliError } from "../src/lib/lanes";

describe("lanes", () => {
  describe("ensureLaneDir", () => {
    test("creates lane dir if it does not exist", async () => {
      const teamDir = await fs.mkdtemp(path.join(os.tmpdir(), "lanes-test-"));
      try {
        const result = await ensureLaneDir({ teamDir, lane: "backlog", quiet: true });
        expect(result.created).toBe(true);
        expect(result.path).toBe(path.join(teamDir, "work", "backlog"));
        const stat = await fs.stat(result.path);
        expect(stat.isDirectory()).toBe(true);
      } finally {
        await fs.rm(teamDir, { recursive: true, force: true });
      }
    });

    test("skips creation if dir already exists", async () => {
      const teamDir = await fs.mkdtemp(path.join(os.tmpdir(), "lanes-test-"));
      const laneDir = path.join(teamDir, "work", "in-progress");
      await fs.mkdir(laneDir, { recursive: true });
      try {
        const result = await ensureLaneDir({ teamDir, lane: "in-progress", quiet: true });
        expect(result.created).toBe(false);
        expect(result.path).toBe(laneDir);
      } finally {
        await fs.rm(teamDir, { recursive: true, force: true });
      }
    });

    test("throws RecipesCliError when mkdir fails", async () => {
      const teamDir = await fs.mkdtemp(path.join(os.tmpdir(), "lanes-test-"));
      const filePath = path.join(teamDir, "blocker");
      await fs.writeFile(filePath, "x", "utf8");
      try {
        await expect(
          ensureLaneDir({ teamDir: filePath, lane: "backlog", command: "test", quiet: true })
        ).rejects.toThrow(RecipesCliError);
        await expect(
          ensureLaneDir({ teamDir: filePath, lane: "backlog", command: "test", quiet: true })
        ).rejects.toMatchObject({ code: "LANE_DIR_CREATE_FAILED" });
      } finally {
        await fs.rm(teamDir, { recursive: true, force: true });
      }
    });

    test("logs migration message when creating (when not quiet)", async () => {
      const teamDir = await fs.mkdtemp(path.join(os.tmpdir(), "lanes-test-"));
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        await ensureLaneDir({ teamDir, lane: "testing", quiet: false });
        expect(errSpy.mock.calls.some((c) => String(c[0]).includes("migration: created work/testing/"))).toBe(true);
      } finally {
        errSpy.mockRestore();
        await fs.rm(teamDir, { recursive: true, force: true });
      }
    });
  });
});
