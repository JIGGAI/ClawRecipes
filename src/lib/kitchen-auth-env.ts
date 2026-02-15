/**
 * Read/write kitchen/.env for optional Basic Auth credentials.
 */
import fs from "node:fs/promises";
import path from "node:path";

const AUTH_KEYS = [
  "KITCHEN_AUTH_ENABLED",
  "KITCHEN_AUTH_USER",
  "KITCHEN_AUTH_PASSWORD",
  "KITCHEN_AUTH_PASSWORD_FILE",
] as const;

export type KitchenAuthEnv = {
  KITCHEN_AUTH_ENABLED?: string;
  KITCHEN_AUTH_USER?: string;
  KITCHEN_AUTH_PASSWORD?: string;
  KITCHEN_AUTH_PASSWORD_FILE?: string;
};

export function getKitchenEnvPath(pluginDir: string): string {
  return path.join(pluginDir, "kitchen", ".env");
}

function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      try {
        val = JSON.parse(val);
      } catch {
        val = val.slice(1, -1);
      }
    }
    out[key] = val;
  }
  return out;
}

function serializeEnv(vars: Record<string, string>, preserveComments: string[] = []): string {
  const lines: string[] = [...preserveComments];
  for (const key of AUTH_KEYS) {
    const v = vars[key];
    if (v !== undefined && v !== "") {
      const escaped = JSON.stringify(v);
      lines.push(`${key}=${escaped}`);
    }
  }
  return lines.join("\n") + (lines.length ? "\n" : "");
}

export async function readKitchenAuthEnv(pluginDir: string): Promise<KitchenAuthEnv> {
  const envPath = getKitchenEnvPath(pluginDir);
  try {
    const content = await fs.readFile(envPath, "utf8");
    const parsed = parseEnv(content);
    return {
      KITCHEN_AUTH_ENABLED: parsed.KITCHEN_AUTH_ENABLED,
      KITCHEN_AUTH_USER: parsed.KITCHEN_AUTH_USER,
      KITCHEN_AUTH_PASSWORD: parsed.KITCHEN_AUTH_PASSWORD,
      KITCHEN_AUTH_PASSWORD_FILE: parsed.KITCHEN_AUTH_PASSWORD_FILE,
    };
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException)?.code === "ENOENT") return {};
    throw e;
  }
}

export async function writeKitchenAuthEnv(
  pluginDir: string,
  updates: Partial<KitchenAuthEnv>
): Promise<void> {
  const envPath = getKitchenEnvPath(pluginDir);
  let existing: Record<string, string> = {};
  let preserveComments: string[] = [];

  try {
    const content = await fs.readFile(envPath, "utf8");
    existing = parseEnv(content);
    preserveComments = content
      .split("\n")
      .filter((line) => {
        const t = line.trim();
        return t.startsWith("#") || (!t.startsWith("KITCHEN_AUTH_") && t.includes("="));
      });
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException)?.code !== "ENOENT") throw e;
    await fs.mkdir(path.dirname(envPath), { recursive: true });
  }

  const merged = { ...existing };
  for (const key of AUTH_KEYS) {
    const v = updates[key as keyof KitchenAuthEnv];
    if (v !== undefined) merged[key] = v;
  }

  const out = serializeEnv(merged, preserveComments);
  await fs.writeFile(envPath, out, "utf8");
}
