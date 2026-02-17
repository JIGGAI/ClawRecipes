import path from "node:path";
import fs from "node:fs/promises";

/**
 * Check if a path exists (file or directory).
 * Uses fs.stat for consistency across the codebase.
 */
export async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(p: string): Promise<void> {
  await fs.mkdir(p, { recursive: true });
}

/**
 * Write content to a file, with optional createOnly mode.
 */
export async function writeFileSafely(
  p: string,
  content: string,
  mode: "createOnly" | "overwrite"
): Promise<{ wrote: boolean; reason: "exists" | "ok" }> {
  if (mode === "createOnly" && (await fileExists(p))) return { wrote: false, reason: "exists" };
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, content, "utf8");
  return { wrote: true, reason: "ok" };
}
