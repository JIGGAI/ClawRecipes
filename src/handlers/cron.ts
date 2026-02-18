import path from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { RecipeFrontmatter } from "../lib/recipe-frontmatter";
import { cronKey, hashSpec, loadCronMappingState, parseToolTextJson } from "../lib/cron-utils";
import { writeJsonFile } from "../lib/json-utils";
import { promptYesNo } from "../lib/prompt";
import { normalizeCronJobs } from "../lib/recipe-frontmatter";
import { toolsInvoke, type ToolTextResult } from "../toolsInvoke";

export type CronInstallMode = "off" | "prompt" | "on";

type OpenClawCronJob = {
  id: string;
  name?: string;
  enabled?: boolean;
  schedule?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  delivery?: Record<string, unknown>;
  agentId?: string | null;
  description?: string;
};

type CronJobPatch = Record<string, unknown>;

type CronReconcileResult =
  | { action: "created"; key: string; installedCronId: string; enabled: boolean }
  | { action: "updated"; key: string; installedCronId: string }
  | { action: "unchanged"; key: string; installedCronId: string }
  | { action: "disabled"; key: string; installedCronId: string }
  | { action: "disabled-removed"; key: string; installedCronId: string };

type CronReconcileScope =
  | { kind: "team"; teamId: string; recipeId: string; stateDir: string }
  | { kind: "agent"; agentId: string; recipeId: string; stateDir: string };

function buildCronJobForCreate(
  scope: CronReconcileScope,
  j: { id: string; name?: string; schedule?: string; timezone?: string; channel?: string; to?: string; agentId?: string; description?: string; message?: string; enabledByDefault?: boolean },
  wantEnabled: boolean
): Record<string, unknown> {
  const name =
    j.name ?? `${scope.kind === "team" ? scope.teamId : scope.agentId} • ${scope.recipeId} • ${j.id}`;
  const sessionTarget = j.agentId ? "isolated" : "main";
  return {
    name,
    agentId: j.agentId ?? null,
    description: j.description ?? "",
    enabled: wantEnabled,
    wakeMode: "next-heartbeat",
    sessionTarget,
    schedule: { kind: "cron", expr: j.schedule, ...(j.timezone ? { tz: j.timezone } : {}) },
    payload: j.agentId
      ? { kind: "agentTurn", message: j.message }
      : { kind: "systemEvent", text: j.message },
    ...(j.channel || j.to
      ? {
          delivery: {
            mode: "announce",
            ...(j.channel ? { channel: j.channel } : {}),
            ...(j.to ? { to: j.to } : {}),
            bestEffort: true,
          },
        }
      : {}),
  };
}

function buildCronJobPatch(
  j: { name?: string; schedule?: string; timezone?: string; channel?: string; to?: string; agentId?: string; description?: string; message?: string },
  name: string
): CronJobPatch {
  const patch: CronJobPatch = {
    name,
    agentId: j.agentId ?? null,
    description: j.description ?? "",
    sessionTarget: j.agentId ? "isolated" : "main",
    wakeMode: "next-heartbeat",
    schedule: { kind: "cron", expr: j.schedule, ...(j.timezone ? { tz: j.timezone } : {}) },
    payload: j.agentId ? { kind: "agentTurn", message: j.message } : { kind: "systemEvent", text: j.message },
  };
  if (j.channel || j.to) {
    patch.delivery = {
      mode: "announce",
      ...(j.channel ? { channel: j.channel } : {}),
      ...(j.to ? { to: j.to } : {}),
      bestEffort: true,
    };
  }
  return patch;
}

async function disableOrphanedCronJobs(opts: {
  api: OpenClawPluginApi;
  state: { entries: Record<string, { installedCronId: string; specHash: string; updatedAtMs: number; orphaned?: boolean }> };
  byId: Map<string, OpenClawCronJob>;
  recipeId: string;
  desiredIds: Set<string>;
  now: number;
  results: CronReconcileResult[];
}) {
  const { api, state, byId, recipeId, desiredIds, now, results } = opts;
  for (const [key, entry] of Object.entries(state.entries)) {
    if (!key.includes(`:recipe:${recipeId}:cron:`)) continue;
    const cronId = key.split(":cron:")[1] ?? "";
    if (!cronId || desiredIds.has(cronId)) continue;

    const job = byId.get(entry.installedCronId);
    if (job && job.enabled) {
      await cronUpdate(api, job.id, { enabled: false });
      results.push({ action: "disabled-removed", key, installedCronId: job.id });
    }

    state.entries[key] = { ...entry, orphaned: true, updatedAtMs: now };
  }
}

async function cronList(api: OpenClawPluginApi) {
  const result = await toolsInvoke<ToolTextResult>(api, {
    tool: "cron",
    args: { action: "list", includeDisabled: true },
  });
  const text = result?.content?.find((c) => c.type === "text")?.text;
  const parsed = text ? (parseToolTextJson(text, "cron.list") as { jobs?: OpenClawCronJob[] }) : null;
  return { jobs: parsed?.jobs ?? [] };
}

type CronAddResponse = { id?: string; job?: { id?: string } } | null;

async function cronAdd(api: OpenClawPluginApi, job: Record<string, unknown>): Promise<CronAddResponse> {
  const result = await toolsInvoke<ToolTextResult>(api, { tool: "cron", args: { action: "add", job } });
  const text = result?.content?.find((c) => c.type === "text")?.text;
  return text ? parseToolTextJson<CronAddResponse>(text, "cron.add") : null;
}

async function cronUpdate(api: OpenClawPluginApi, jobId: string, patch: CronJobPatch) {
  const result = await toolsInvoke<ToolTextResult>(api, {
    tool: "cron",
    args: { action: "update", jobId, patch },
  });
  const text = result?.content?.find((c) => c.type === "text")?.text;
  return text ? parseToolTextJson(text, "cron.update") : null;
}

async function resolveCronUserOptIn(
  mode: CronInstallMode,
  recipeId: string,
  desiredCount: number
): Promise<{ userOptIn: boolean } | { return: { ok: true; changed: false; note: string; desiredCount: number } }> {
  if (mode === "off") return { return: { ok: true, changed: false, note: "cron-installation-off" as const, desiredCount } };
  if (mode === "on") return { userOptIn: true };

  const header = `Recipe ${recipeId} defines ${desiredCount} cron job(s).\nThese run automatically on a schedule. Install them?`;
  const userOptIn = await promptYesNo(header);
  if (!userOptIn) return { return: { ok: true, changed: false, note: "cron-installation-declined" as const, desiredCount } };
  if (!process.stdin.isTTY) console.error("Non-interactive mode: defaulting cron install to disabled.");
  return { userOptIn };
}

async function createNewCronJob(opts: {
  api: OpenClawPluginApi;
  scope: CronReconcileScope;
  j: (ReturnType<typeof normalizeCronJobs>)[number];
  wantEnabled: boolean;
  key: string;
  specHash: string;
  now: number;
  state: Awaited<ReturnType<typeof loadCronMappingState>>;
  results: CronReconcileResult[];
}) {
  const { api, scope, j, wantEnabled, key, specHash, now, state, results } = opts;
  const created = await cronAdd(api, buildCronJobForCreate(scope, j, wantEnabled));
  const newId = created?.id ?? created?.job?.id;
  if (!newId) throw new Error("Failed to parse cron add output (missing id)");
  state.entries[key] = { installedCronId: newId, specHash, updatedAtMs: now, orphaned: false };
  results.push({ action: "created", key, installedCronId: newId, enabled: wantEnabled });
}

async function updateExistingCronJob(opts: {
  api: OpenClawPluginApi;
  j: (ReturnType<typeof normalizeCronJobs>)[number];
  name: string;
  existing: OpenClawCronJob;
  prevSpecHash: string | undefined;
  specHash: string;
  userOptIn: boolean;
  key: string;
  now: number;
  state: Awaited<ReturnType<typeof loadCronMappingState>>;
  results: CronReconcileResult[];
}) {
  const { api, j, name, existing, prevSpecHash, specHash, userOptIn, key, now, state, results } = opts;
  if (prevSpecHash !== specHash) {
    await cronUpdate(api, existing.id, buildCronJobPatch(j, name));
    results.push({ action: "updated", key, installedCronId: existing.id });
  } else {
    results.push({ action: "unchanged", key, installedCronId: existing.id });
  }
  if (!userOptIn && existing.enabled) {
    await cronUpdate(api, existing.id, { enabled: false });
    results.push({ action: "disabled", key, installedCronId: existing.id });
  }
  state.entries[key] = { installedCronId: existing.id, specHash, updatedAtMs: now, orphaned: false };
}

async function reconcileOneCronJob(
  ctx: {
    api: OpenClawPluginApi;
    scope: CronReconcileScope;
    state: Awaited<ReturnType<typeof loadCronMappingState>>;
    byId: Map<string, OpenClawCronJob>;
    now: number;
    results: CronReconcileResult[];
  },
  j: (ReturnType<typeof normalizeCronJobs>)[number],
  userOptIn: boolean
) {
  const { api, scope, state, byId, now, results } = ctx;
  const key = cronKey(scope, j.id);
  const name = j.name ?? `${scope.kind === "team" ? scope.teamId : scope.agentId} • ${scope.recipeId} • ${j.id}`;
  const specHash = hashSpec({
    schedule: j.schedule,
    message: j.message,
    timezone: j.timezone ?? "",
    channel: j.channel ?? "last",
    to: j.to ?? "",
    agentId: j.agentId ?? "",
    name,
    description: j.description ?? "",
  });

  const prev = state.entries[key];
  const existing = prev?.installedCronId ? byId.get(prev.installedCronId) : undefined;
  const wantEnabled = userOptIn ? Boolean(j.enabledByDefault) : false;

  if (!existing) {
    await createNewCronJob({ api, scope, j, wantEnabled, key, specHash, now, state, results });
    return;
  }
  await updateExistingCronJob({ api, j, name, existing, prevSpecHash: prev?.specHash, specHash, userOptIn, key, now, state, results });
}

async function reconcileDesiredCronJobs(opts: {
  api: OpenClawPluginApi;
  scope: CronReconcileScope;
  desired: ReturnType<typeof normalizeCronJobs>;
  userOptIn: boolean;
  state: Awaited<ReturnType<typeof loadCronMappingState>>;
  byId: Map<string, OpenClawCronJob>;
  now: number;
  results: CronReconcileResult[];
}) {
  const ctx = {
    api: opts.api,
    scope: opts.scope,
    state: opts.state,
    byId: opts.byId,
    now: opts.now,
    results: opts.results,
  };
  for (const j of opts.desired) {
    await reconcileOneCronJob(ctx, j, opts.userOptIn);
  }
}

/**
 * Reconcile recipe cron jobs with gateway (create, update, disable orphans).
 * @param opts - api, recipe, scope (agent|team), cronInstallation (off|prompt|on)
 * @returns ok with changed flag and results, or early return with note
 */
export async function reconcileRecipeCronJobs(opts: {
  api: OpenClawPluginApi;
  recipe: RecipeFrontmatter;
  scope:
    | { kind: "team"; teamId: string; recipeId: string; stateDir: string }
    | { kind: "agent"; agentId: string; recipeId: string; stateDir: string };
  cronInstallation: CronInstallMode;
}) {
  const desired = normalizeCronJobs(opts.recipe);
  if (!desired.length) return { ok: true, changed: false, note: "no-cron-jobs" as const };

  const optIn = await resolveCronUserOptIn(opts.cronInstallation, opts.scope.recipeId, desired.length);
  if ("return" in optIn) return optIn.return;

  const statePath = path.join(opts.scope.stateDir, "notes", "cron-jobs.json");
  const state = await loadCronMappingState(statePath);
  const hasAnyInstalled = desired.some((j) => Boolean(state.entries[cronKey(opts.scope, j.id)]?.installedCronId));
  const list = hasAnyInstalled ? await cronList(opts.api) : { jobs: [] };
  const byId = new Map((list?.jobs ?? []).map((j) => [j.id, j] as const));
  const now = Date.now();
  const desiredIds = new Set(desired.map((j) => j.id));
  const results: CronReconcileResult[] = [];

  await reconcileDesiredCronJobs({ ...opts, desired, userOptIn: optIn.userOptIn, state, byId, now, results });
  await disableOrphanedCronJobs({
    api: opts.api,
    state,
    byId,
    recipeId: opts.scope.recipeId,
    desiredIds,
    now,
    results,
  });
  await writeJsonFile(statePath, state);

  const changed = results.some(
    (r) => r.action === "created" || r.action === "updated" || r.action?.startsWith("disabled")
  );
  return { ok: true, changed, results };
}
