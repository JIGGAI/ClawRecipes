import { describe, expect, test, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expandFileIncludes, FILE_INCLUDE_MAX_BYTES_DEFAULT } from "../src/lib/workflows/workflow-utils";

let teamDir: string;

beforeEach(async () => {
  teamDir = await fs.mkdtemp(path.join(os.tmpdir(), "fileinc-"));
});

afterEach(async () => {
  await fs.rm(teamDir, { recursive: true, force: true });
});

describe("expandFileIncludes", () => {
  test("passes through text with no markers unchanged", async () => {
    const out = await expandFileIncludes("just some prompt text", teamDir);
    expect(out).toBe("just some prompt text");
  });

  test("inlines a single file under teamDir", async () => {
    await fs.mkdir(path.join(teamDir, "shared-context"), { recursive: true });
    await fs.writeFile(path.join(teamDir, "shared-context", "calendar.md"), "CAL_BODY");
    const out = await expandFileIncludes("before {{file:shared-context/calendar.md}} after", teamDir);
    expect(out).toBe("before CAL_BODY after");
  });

  test("deduplicates repeated includes and still substitutes each occurrence", async () => {
    await fs.writeFile(path.join(teamDir, "a.txt"), "A");
    const out = await expandFileIncludes("{{file:a.txt}} | {{file:a.txt}}", teamDir);
    expect(out).toBe("A | A");
  });

  test("tolerates whitespace inside the marker", async () => {
    await fs.writeFile(path.join(teamDir, "a.txt"), "A");
    const out = await expandFileIncludes("x {{ file:a.txt }} y", teamDir);
    expect(out).toBe("x A y");
  });

  test("rejects absolute paths", async () => {
    await fs.writeFile(path.join(teamDir, "a.txt"), "A");
    const abs = path.resolve(teamDir, "a.txt");
    const out = await expandFileIncludes(`x {{file:${abs}}} y`, teamDir);
    expect(out).toContain("[[file-include rejected: unsafe path");
  });

  test("rejects paths containing ..", async () => {
    await fs.writeFile(path.join(teamDir, "a.txt"), "A");
    const out = await expandFileIncludes("{{file:../a.txt}}", teamDir);
    expect(out).toContain("[[file-include rejected: unsafe path");
  });

  test("rejects missing files gracefully (does not throw)", async () => {
    const out = await expandFileIncludes("{{file:nope.md}}", teamDir);
    expect(out).toContain("[[file-include failed:");
    expect(out).toContain("nope.md");
  });

  test("rejects directories", async () => {
    await fs.mkdir(path.join(teamDir, "adir"));
    const out = await expandFileIncludes("{{file:adir}}", teamDir);
    expect(out).toContain("[[file-include rejected: not a regular file");
  });

  test("enforces a per-include size cap", async () => {
    const big = "x".repeat(11);
    await fs.writeFile(path.join(teamDir, "big.txt"), big);
    const out = await expandFileIncludes("{{file:big.txt}}", teamDir, { maxBytes: 10 });
    expect(out).toContain("exceeds 10B cap");
  });

  test("rejects symlinks that escape teamDir", async () => {
    // Create a file outside teamDir and symlink it inside
    const outside = await fs.mkdtemp(path.join(os.tmpdir(), "outside-"));
    try {
      await fs.writeFile(path.join(outside, "secret.txt"), "LEAK");
      await fs.symlink(path.join(outside, "secret.txt"), path.join(teamDir, "sym.txt"));
      const out = await expandFileIncludes("{{file:sym.txt}}", teamDir);
      expect(out).toContain("[[file-include rejected: symlink escapes team workspace");
    } finally {
      await fs.rm(outside, { recursive: true, force: true });
    }
  });

  test("default size cap is 256KB", () => {
    expect(FILE_INCLUDE_MAX_BYTES_DEFAULT).toBe(256 * 1024);
  });

  test("does not re-expand {{...}} markers inside included content", async () => {
    // File content is treated as opaque text; it should not be re-substituted.
    await fs.writeFile(path.join(teamDir, "has-markers.txt"), "inner {{run.id}} marker");
    const out = await expandFileIncludes("{{file:has-markers.txt}}", teamDir);
    expect(out).toBe("inner {{run.id}} marker");
  });

  test("leaves unrelated marker shapes alone", async () => {
    const out = await expandFileIncludes("{{notafile}} and {{file}}", teamDir);
    expect(out).toBe("{{notafile}} and {{file}}");
  });
});
