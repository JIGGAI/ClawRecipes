import { describe, expect, test } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readJsonFile, writeJsonFile } from "../src/lib/json-utils";

describe("json-utils", () => {
  test("writeJsonFile and readJsonFile round-trip", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "json-utils-"));
    const file = path.join(tmp, "nested", "data.json");
    try {
      const data = { a: 1, b: [2, 3] };
      await writeJsonFile(file, data);
      const read = await readJsonFile<typeof data>(file);
      expect(read).toEqual(data);
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });

  test("readJsonFile returns null for missing file", async () => {
    const missing = path.join(os.tmpdir(), "nonexistent-" + Date.now() + ".json");
    expect(await readJsonFile(missing)).toBeNull();
  });

  test("readJsonFile returns null for invalid JSON", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "json-utils-"));
    const file = path.join(tmp, "bad.json");
    await fs.writeFile(file, "not json", "utf8");
    try {
      expect(await readJsonFile(file)).toBeNull();
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});
