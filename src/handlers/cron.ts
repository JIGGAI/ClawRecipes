import path from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { RecipeFrontmatter } from "../lib/recipe-frontmatter";
import { cronKey, hashSpec, loadCronMappingState } from "../lib/cron-utils";
import { writeJsonFile } from "../lib/json-utils";
import { promptYesNo } from "../lib/prompt";
import { normalizeCronJobs } from "../lib/recipe-frontmatter";

export type CronInstallMode = "off" | "prompt" | "on";

function interpolateTemplate(input: string | undefined, vars: Record<string, string>): string | undefined {
  if (input == null) return undefined;
  let out = String(input);
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

function applyCronJobVars(
  scope: CronReconcileScope,
  j: { id: string; name?: string; schedule?: string; timezone?: string; channel?: string; to?: string; agentId?: string; description?: string; message?: string; enabledByDefault?: boolean },
): typeof j {
  const vars: Record<string, string> = {
    recipeId: scope.recipeId,
    ...(scope.kind === "team" ? { teamId: scope.teamId } : { agentId: scope.agentId }),
  };
  return {
    ...j,
    name: interpolateTemplate(j.name, vars),
    schedule: interpolateTemplate(j.schedule, vars),
    timezone: interpolateTemplate(j.timezone, vars),
    channel: interpolateTemplate(j.channel, vars),
    to: interpolateTemplate(j.to, vars),
    agentId: interpolateTemplate(j.agentId, vars),
    description: interpolateTemplate(j.description, vars),
    message: interpolateTemplate(j.message, vars),
  };
}

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

function isCronUnavailableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  // Backward-compat: older builds routed cron through tools/invoke.
  if (/Tool not available:\s*cron/i.test(msg)) return true;
  // Some builds may not expose cron RPC methods.
  if (/unknown method/i.test(msg) && /cron\./i.test(msg)) return true;
  if (/method not found/i.test(msg) && /cron\./i.test(msg)) return true;
  if (/cron/i.test(msg) && /not available/i.test(msg)) return true;
  return false;
}

type CronAddResponse = { id?: string; job?: { id?: string } } | null;

type GatewayCaller = <T = unknown>(opts: {
  api: OpenClawPluginApi;
  method: string;
  params?: unknown;
}) => Promise<T>;

const gatewayCall: GatewayCaller = async ({ api, method, params }) => {
  // Prefer the first-class SDK gateway caller when it's available in the runtime.
  // In some builds `callGatewayLeastPrivilege` is not exported (or plugin-sdk isn't resolvable in unit tests),
  // so we fall back to the stable CLI surface: `openclaw gateway call <method> --json --params <json>`.

  try {
    // NOTE: dynamic import keeps unit tests runnable (openclaw/plugin-sdk is provided by the OpenClaw runtime,
    // not installed as an NPM dependency of this plugin repo).
    const mod = (await import("openclaw/plugin-sdk")) as unknown as {
      callGatewayLeastPrivilege?: <T = unknown>(opts: {
        config: unknown;
        method: string;
        params?: unknown;
        timeoutMs?: number;
      }) => Promise<T>;
    };

    if (typeof mod.callGatewayLeastPrivilege === "function") {
      return await mod.callGatewayLeastPrivilege({
        config: api.config,
        method,
        params,
        timeoutMs: 30_000,
      });
    }
  } catch {
    // ignore and fall through to CLI fallback
  }

  const runner = (api as unknown as any)?.runtime?.system?.runCommandWithTimeout;
  if (typeof runner !== "function") {
    throw new Error(`Cron gateway call fallback unavailable (missing api.runtime.system.runCommandWithTimeout) for method ${method}`);
  }

  const cmd = [
    "openclaw",
    "gateway",
    "call",
    method,
    "--json",
    "--timeout",
    String(30_000),
    "--params",
    JSON.stringify((params ?? {}) as unknown),
  ];

  const res = await runner({
    command: cmd,
    timeoutMs: 35_000,
  });

  const stdout = String(res?.stdout ?? "").trim();
  if (!stdout) return null as any;

  try {
    return JSON.parse(stdout);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to parse gateway CLI JSON for ${method}: ${msg}\nstdout=${stdout}`);
  }
};

async function cronList(api: OpenClawPluginApi) {
  const result = await gatewayCall<{ jobs?: OpenClawCronJob[] }>({ api, method: "cron.list", params: { includeDisabled: true } });
  return { jobs: result?.jobs ?? [] };
}

async function cronAdd(api: OpenClawPluginApi, job: Record<string, unknown>): Promise<CronAddResponse> {
  // cron.add returns { id } in some builds; { job: { id } } in others.
  return await gatewayCall<CronAddResponse>({ api, method: "cron.add", params: job });
}

async function cronUpdate(api: OpenClawPluginApi, jobId: string, patch: CronJobPatch) {
  return await gatewayCall({ api, method: "cron.update", params: { id: jobId, patch } });
}

async function resolveCronUserOptIn(
  mode: CronInstallMode,
  recipeId: string,
  desiredCount: number
): Promise<
  | { userOptIn: boolean; enableInstalled: boolean }
  | { return: { ok: true; changed: false; note: string; desiredCount: number } }
> {
  if (mode === "off") return { return: { ok: true, changed: false, note: "cron-installation-off" as const, desiredCount } };
  if (mode === "on") return { userOptIn: true, enableInstalled: true };

  // mode === "prompt"
  // In non-interactive runs we still reconcile (create/update) cron jobs, but always DISABLED.
  // This keeps scaffold idempotent and avoids silently skipping cron job stamping.
  if (!process.stdin.isTTY) {
    console.error(
      `Non-interactive mode: cronInstallation=prompt; reconciling ${desiredCount} cron job(s) as disabled (no prompt).`
    );
    return { userOptIn: false, enableInstalled: false };
  }

  const header = `Recipe ${recipeId} defines ${desiredCount} cron job(s).\nThese run automatically on a schedule. Install them?`;
  const userOptIn = await promptYesNo(header);
  if (!userOptIn) return { return: { ok: true, changed: false, note: "cron-installation-declined" as const, desiredCount } };

  const enableInstalled = await promptYesNo("Enable the installed cron jobs now? (You can always enable later)");
  return { userOptIn, enableInstalled };
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
  enableInstalled: boolean;
  key: string;
  now: number;
  state: Awaited<ReturnType<typeof loadCronMappingState>>;
  results: CronReconcileResult[];
}) {
  const { api, j, name, existing, prevSpecHash, specHash, userOptIn, enableInstalled, key, now, state, results } = opts;
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

  if (userOptIn && enableInstalled && !existing.enabled) {
    await cronUpdate(api, existing.id, { enabled: true });
    results.push({ action: "updated", key, installedCronId: existing.id });
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
  userOptIn: boolean,
  enableInstalled: boolean
) {
  const { api, scope, state, byId, now, results } = ctx;
  const jj = applyCronJobVars(scope, j);
  const key = cronKey(scope, jj.id);
  const name =
    jj.name ?? `${scope.kind === "team" ? scope.teamId : scope.agentId} • ${scope.recipeId} • ${jj.id}`;
  const specHash = hashSpec({
    schedule: jj.schedule,
    message: jj.message,
    timezone: jj.timezone ?? "",
    channel: jj.channel ?? "last",
    to: jj.to ?? "",
    agentId: jj.agentId ?? "",
    name,
    description: jj.description ?? "",
  });

  const prev = state.entries[key];
  const existing = prev?.installedCronId ? byId.get(prev.installedCronId) : undefined;
  const wantEnabled = userOptIn ? (enableInstalled ? true : Boolean(jj.enabledByDefault)) : false;

  if (!existing) {
    await createNewCronJob({ api, scope, j: jj, wantEnabled, key, specHash, now, state, results });
    return;
  }
  await updateExistingCronJob({
    api,
    j: jj,
    name,
    existing,
    prevSpecHash: prev?.specHash,
    specHash,
    userOptIn,
    enableInstalled,
    key,
    now,
    state,
    results,
  });
}

async function reconcileDesiredCronJobs(opts: {
  api: OpenClawPluginApi;
  scope: CronReconcileScope;
  desired: ReturnType<typeof normalizeCronJobs>;
  userOptIn: boolean;
  enableInstalled: boolean;
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
    await reconcileOneCronJob(ctx, j, opts.userOptIn, opts.enableInstalled);
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

  // Cron is managed by the Gateway subsystem. Some OpenClaw builds may not expose the cron RPC methods.
  // In that case, cron reconciliation must be best-effort and must NOT block scaffolds.
  let list: { jobs: OpenClawCronJob[] } = { jobs: [] };
  if (hasAnyInstalled) {
    try {
      list = await cronList(opts.api);
    } catch (err) {
      if (isCronUnavailableError(err)) {
        console.error('[recipes] note: cron tool unavailable; skipping cron reconciliation (scaffold will proceed).');
        return { ok: true as const, changed: false as const, note: "cron-tool-unavailable" as const, desiredCount: desired.length };
      }
      throw err;
    }
  }
  const byId = new Map((list?.jobs ?? []).map((j) => [j.id, j] as const));
  const now = Date.now();
  const desiredIds = new Set(desired.map((j) => j.id));
  const results: CronReconcileResult[] = [];

  try {
  await reconcileDesiredCronJobs({
    ...opts,
    desired,
    userOptIn: optIn.userOptIn,
    enableInstalled: optIn.enableInstalled,
    state,
    byId,
    now,
    results,
  });
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
  } catch (err) {
    if (isCronUnavailableError(err)) {
      console.error('[recipes] note: cron tool unavailable; skipping cron reconciliation (scaffold will proceed).');
      return { ok: true as const, changed: false as const, note: "cron-tool-unavailable" as const, desiredCount: desired.length };
    }
    throw err;
  }

  const changed = results.some(
    (r) => r.action === "created" || r.action === "updated" || r.action?.startsWith("disabled")
  );
  return { ok: true, changed, results };
}
