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
  j: { id: string; name?: string; schedule?: string; timezone?: string; channel?: string; to?: string; agentId?: string; description?: string; message?: string; enabledByDefault?: boolean; delivery?: 'none' | 'announce' },
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
  j: { id: string; name?: string; schedule?: string; timezone?: string; channel?: string; to?: string; agentId?: string; description?: string; message?: string; enabledByDefault?: boolean; delivery?: 'none' | 'announce' },
  wantEnabled: boolean
): Record<string, unknown> {
  const name =
    j.name ?? `${scope.kind === "team" ? scope.teamId : scope.agentId} • ${scope.recipeId} • ${j.id}`;

  // Default cron agent targeting:
  // - Team scaffolds should wake the team lead by default.
  // - Agent scaffolds should wake the agent being installed by default.
  // - Recipe can override with an explicit agentId.
  const effectiveAgentId =
    typeof j.agentId === "string" && j.agentId.trim()
      ? j.agentId.trim()
      : scope.kind === "team"
        ? `${scope.teamId}-lead`
        : scope.agentId;

  const sessionTarget = effectiveAgentId ? "isolated" : "main";
  return {
    name,
    agentId: effectiveAgentId ?? null,
    description: j.description ?? "",
    enabled: wantEnabled,
    wakeMode: "next-heartbeat",
    sessionTarget,
    schedule: { kind: "cron", expr: j.schedule, ...(j.timezone ? { tz: j.timezone } : {}) },
    payload: effectiveAgentId ? { kind: "agentTurn", message: j.message } : { kind: "systemEvent", text: j.message },
    ...(j.delivery === 'none'
      ? { delivery: { mode: "none" } }
      : j.channel || j.to
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
  j: { name?: string; schedule?: string; timezone?: string; channel?: string; to?: string; agentId?: string; description?: string; message?: string; delivery?: 'none' | 'announce' },
  name: string
): CronJobPatch {
  const effectiveAgentId = typeof j.agentId === "string" && j.agentId.trim() ? j.agentId.trim() : undefined;

  const patch: CronJobPatch = {
    name,
    agentId: effectiveAgentId ?? null,
    description: j.description ?? "",
    sessionTarget: effectiveAgentId ? "isolated" : "main",
    wakeMode: "next-heartbeat",
    schedule: { kind: "cron", expr: j.schedule, ...(j.timezone ? { tz: j.timezone } : {}) },
    payload: effectiveAgentId ? { kind: "agentTurn", message: j.message } : { kind: "systemEvent", text: j.message },
  };
  if (j.delivery === 'none') {
    patch.delivery = { mode: "none" };
  } else if (j.channel || j.to) {
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
  // Use the stable OpenClaw CLI (cron is managed by the Gateway subsystem).
  // This avoids relying on a non-existent `cron` *tool*.
  const result = await api.runtime.system.runCommandWithTimeout(["openclaw", "cron", "list", "--all", "--json"], {
    timeoutMs: 30_000,
  });
  if (result.code !== 0) {
    throw new Error(`openclaw cron list failed (code=${result.code}): ${result.stderr || result.stdout}`);
  }
  const parsed = JSON.parse(result.stdout || "{}") as { jobs?: OpenClawCronJob[] };
  return { jobs: parsed.jobs ?? [] };
}

function isCronToolUnavailableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Tool not available:\s*cron/i.test(msg);
}

type CronAddResponse = { id?: string; job?: { id?: string } } | null;

async function cronAdd(api: OpenClawPluginApi, job: Record<string, unknown>): Promise<CronAddResponse> {
  const argv: string[] = ["openclaw", "cron", "add", "--json"];

  type CronAddJob = {
    name?: string;
    description?: string;
    enabled?: boolean;
    agentId?: string | null;
    sessionTarget?: "main" | "isolated";
    schedule?: { kind: "cron"; expr: string; tz?: string } | { kind: "every"; every: string } | { kind: "at"; at: string };
    payload?: { kind: "agentTurn"; message: string } | { kind: "systemEvent"; text: string };
    delivery?: { mode: "announce"; channel?: string; to?: string; bestEffort?: boolean };
  };

  const j = job as unknown as CronAddJob;

  // name/description
  if (typeof j.name === "string" && j.name.trim()) argv.push("--name", j.name.trim());
  if (typeof j.description === "string" && j.description.trim())
    argv.push("--description", j.description.trim());

  // schedule: require exactly one of --cron/--every/--at
  const schedule = j.schedule;
  if (schedule && typeof schedule === "object") {
    const kind = String(schedule.kind ?? "");
    if (kind === "cron") {
      argv.push("--cron", String(schedule.expr ?? ""));
      if (schedule.tz) argv.push("--tz", String(schedule.tz));
    } else if (kind === "every") {
      argv.push("--every", String(schedule.every ?? ""));
    } else if (kind === "at") {
      argv.push("--at", String(schedule.at ?? ""));
    }
  }

  // enabled
  if (j.enabled === false) argv.push("--disabled");

  // agentId + sessionTarget
  if (typeof j.agentId === "string" && j.agentId.trim())
    argv.push("--agent", String(j.agentId).trim());
  const sessionTarget = j.sessionTarget;
  if (sessionTarget === "main" || sessionTarget === "isolated") argv.push("--session", sessionTarget);

  // payload
  const payload = j.payload;
  if (payload && typeof payload === "object") {
    const pk = String(payload.kind ?? "");
    if (pk === "agentTurn" && payload.message) argv.push("--message", String(payload.message));
    if (pk === "systemEvent" && payload.text) argv.push("--system-event", String(payload.text));
  }

  // delivery
  const delivery = j.delivery;
  if (delivery && typeof delivery === "object") {
    const deliveryMode = String(delivery.mode ?? "");
    if (deliveryMode === "announce") {
      argv.push("--announce");
      if (delivery.channel) argv.push("--channel", String(delivery.channel));
      if (delivery.to) argv.push("--to", String(delivery.to));
      if (delivery.bestEffort) argv.push("--best-effort-deliver");
    } else if (deliveryMode === "none") {
      argv.push("--no-deliver");
    }
  }

  const result = await api.runtime.system.runCommandWithTimeout(argv, { timeoutMs: 30_000 });
  if (result.code !== 0) {
    throw new Error(`openclaw cron add failed (code=${result.code}): ${result.stderr || result.stdout}`);
  }
  return (result.stdout ? (JSON.parse(result.stdout) as CronAddResponse) : null) ?? null;
}


async function cronUpdate(api: OpenClawPluginApi, jobId: string, patch: CronJobPatch) {
  const argv: string[] = ["openclaw", "cron", "edit", jobId];

  if (patch.name) argv.push("--name", String(patch.name));
  if (patch.description) argv.push("--description", String(patch.description));
  if (patch.cron) argv.push("--cron", String(patch.cron));
  if (patch.every) argv.push("--every", String(patch.every));
  if (patch.at) argv.push("--at", String(patch.at));
  if (patch.tz) argv.push("--tz", String(patch.tz));
  if (patch.agentId) argv.push("--agent", String(patch.agentId));
  if (patch.sessionKey === null) argv.push("--clear-session-key");
  if (patch.message) argv.push("--message", String(patch.message));
  if (patch.systemEvent) argv.push("--system-event", String(patch.systemEvent));
  if (patch.channel) argv.push("--channel", String(patch.channel));
  if (patch.to) argv.push("--to", String(patch.to));
  if (typeof patch.enabled === "boolean") argv.push(patch.enabled ? "--enable" : "--disable");

  const result = await api.runtime.system.runCommandWithTimeout(argv, { timeoutMs: 30_000 });
  if (result.code !== 0) {
    throw new Error(`openclaw cron edit failed (code=${result.code}): ${result.stderr || result.stdout}`);
  }
  return result.stdout?.trim() ? JSON.parse(result.stdout) : null;
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

  // Cron is managed by the Gateway subsystem. Some OpenClaw builds do not expose it via toolsInvoke.
  // In that case, cron reconciliation must be best-effort and must NOT block scaffolds.
  let list: { jobs: OpenClawCronJob[] } = { jobs: [] };
  if (hasAnyInstalled) {
    try {
      list = await cronList(opts.api);
    } catch (err) {
      if (isCronToolUnavailableError(err)) {
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
    if (isCronToolUnavailableError(err)) {
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
