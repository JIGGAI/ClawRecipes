import { describe, expect, test } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureDir, fileExists, writeFileSafely } from "../src/lib/fs-utils";

describe("fs-utils", () => {
  describe("fileExists", () => {
    test("returns true for existing directory", async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), "fs-utils-test-"));
      try {
        expect(await fileExists(dir)).toBe(true);
      } finally {
        await fs.rm(dir, { recursive: true, force: true });
      }
    });

    test("returns true for existing file", async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), "fs-utils-test-"));
      const file = path.join(dir, "foo.txt");
      await fs.writeFile(file, "hello", "utf8");
      try {
        expect(await fileExists(file)).toBe(true);
      } finally {
        await fs.rm(dir, { recursive: true, force: true });
      }
    });

    test("returns false for missing path", async () => {
      const missing = path.join(os.tmpdir(), "nonexistent-" + Date.now());
      expect(await fileExists(missing)).toBe(false);
    });

    test("returns false for path in non-existent parent", async () => {
      const missing = path.join(os.tmpdir(), "nope", "child");
      expect(await fileExists(missing)).toBe(false);
    });
  });

  describe("ensureDir", () => {
    test("creates nested directory", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "fs-utils-test-"));
      const nested = path.join(base, "a", "b", "c");
      try {
        await ensureDir(nested);
        expect(await fileExists(nested)).toBe(true);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });

  describe("writeFileSafely", () => {
    test("overwrite mode writes file", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "fs-utils-test-"));
      const file = path.join(base, "subdir", "file.txt");
      try {
        const r = await writeFileSafely(file, "content", "overwrite");
        expect(r).toEqual({ wrote: true, reason: "ok" });
        expect(await fs.readFile(file, "utf8")).toBe("content");
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });

    test("createOnly skips when exists", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "fs-utils-test-"));
      const file = path.join(base, "existing.txt");
      await fs.writeFile(file, "original", "utf8");
      try {
        const r = await writeFileSafely(file, "new", "createOnly");
        expect(r).toEqual({ wrote: false, reason: "exists" });
        expect(await fs.readFile(file, "utf8")).toBe("original");
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });
});
