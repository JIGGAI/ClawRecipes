import crypto from "node:crypto";
import { readJsonFile } from "./json-utils";
import { stableStringify } from "./stable-stringify";

export type CronMappingStateV1 = {
  version: 1;
  entries: Record<
    string,
    {
      installedCronId: string;
      specHash: string;
      orphaned?: boolean;
      updatedAtMs: number;
    }
  >;
};

export async function loadCronMappingState(statePath: string): Promise<CronMappingStateV1> {
  const existing = await readJsonFile<CronMappingStateV1>(statePath);
  if (existing && existing.version === 1 && existing.entries && typeof existing.entries === "object") return existing;
  return { version: 1, entries: {} };
}

export function cronKey(
  scope:
    | { kind: "team"; teamId: string; recipeId: string }
    | { kind: "agent"; agentId: string; recipeId: string },
  cronJobId: string
): string {
  return scope.kind === "team"
    ? `team:${scope.teamId}:recipe:${scope.recipeId}:cron:${cronJobId}`
    : `agent:${scope.agentId}:recipe:${scope.recipeId}:cron:${cronJobId}`;
}

export function hashSpec(spec: unknown): string {
  const json = stableStringify(spec);
  return crypto.createHash("sha256").update(json, "utf8").digest("hex");
}

/**
 * Parse JSON from tool text output. Throws with label and cause on parse error.
 */
export function parseToolTextJson<T = unknown>(text: string, label: string): T | null {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch (e) {
    const err = new Error(`Failed parsing JSON from tool text (${label})`);
    (err as Error & { text?: string; cause?: unknown }).text = text;
    (err as Error & { text?: string; cause?: unknown }).cause = e;
    throw err;
  }
}
