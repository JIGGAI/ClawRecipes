import fs from "node:fs/promises";
import path from "node:path";

import { fileExists } from "./fs-utils";

export type CronJob = {
  id: string;
  name?: string;
  enabled?: boolean;
  schedule?: Record<string, unknown>;
  payload?: { kind?: string; message?: string };
  delivery?: Record<string, unknown>;
  agentId?: string;
};

export type CronStore = {
  version: number;
  jobs: CronJob[];
};

export type RemoveTeamPlan = {
  teamId: string;
  workspaceDir: string;
  openclawConfigPath: string;
  cronJobsPath: string;
  agentsToRemove: string[];
  cronJobsExact: Array<{ id: string; name?: string }>;
  cronJobsAmbiguous: Array<{ id: string; name?: string; reason: string }>;
  notes: string[];
};

export type RemoveTeamResult = {
  ok: true;
  plan: RemoveTeamPlan;
  removed: {
    workspaceDir: "deleted" | "missing";
    agentsRemoved: number;
    cronJobsRemoved: number;
  };
};

export function stampTeamId(teamId: string) {
  return `recipes.teamId=${teamId}`;
}

export function isProtectedTeamId(teamId: string) {
  const t = teamId.trim().toLowerCase();
  return t === "development-team" || t === "main";
}

export async function loadCronStore(cronJobsPath: string): Promise<CronStore> {
  const raw = await fs.readFile(cronJobsPath, "utf8");
  const data = JSON.parse(raw) as CronStore;
  if (!data || typeof data !== "object" || !Array.isArray(data.jobs)) {
    throw new Error(`Invalid cron store: ${cronJobsPath}`);
  }
  return data;
}

export async function saveCronStore(cronJobsPath: string, store: CronStore) {
  await fs.writeFile(cronJobsPath, JSON.stringify(store, null, 2) + "\n", "utf8");
}

/**
 * Minimal shape of the OpenClaw plugin API bits we need to reach the cron
 * subsystem. Cron jobs live in the gateway's SQLite state (since 2026.7.x),
 * NOT in the legacy ~/.openclaw/cron/jobs.json file — so we go through the
 * stable `openclaw cron` CLI (same approach as handlers/cron.ts).
 */
type CronCommandApi = {
  runtime: {
    system: {
      runCommandWithTimeout: (
        argv: string[],
        opts?: { timeoutMs?: number },
      ) => Promise<{ code: number; stdout: string; stderr: string }>;
    };
  };
};

/**
 * Loads cron jobs from the live gateway-managed cron subsystem via the CLI.
 * Returns a CronStore so the pure planning helpers can operate unchanged.
 */
export async function loadCronJobsViaCli(api: CronCommandApi): Promise<CronStore> {
  const result = await api.runtime.system.runCommandWithTimeout(
    ["openclaw", "cron", "list", "--all", "--json"],
    { timeoutMs: 30_000 },
  );
  if (result.code !== 0) {
    throw new Error(`openclaw cron list failed (code=${result.code}): ${result.stderr || result.stdout}`);
  }
  const parsed = JSON.parse(result.stdout || "{}") as { jobs?: unknown };
  const rows = Array.isArray(parsed.jobs) ? (parsed.jobs as Array<Record<string, unknown>>) : [];
  const jobs: CronJob[] = rows.map((row) => {
    const payload = (row.payload ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      ...(row.name != null ? { name: String(row.name) } : {}),
      ...(typeof row.enabled === "boolean" ? { enabled: row.enabled } : {}),
      ...(row.agentId != null ? { agentId: String(row.agentId) } : {}),
      payload: {
        ...(payload.kind != null ? { kind: String(payload.kind) } : {}),
        ...(payload.message != null ? { message: String(payload.message) } : {}),
      },
    };
  });
  return { version: 1, jobs };
}

/** Pure helper: the set of cron ids a plan will delete, honoring includeAmbiguous. */
export function collectRemoveCronIds(plan: RemoveTeamPlan, includeAmbiguous?: boolean): string[] {
  const ids = plan.cronJobsExact.map((j) => j.id);
  if (includeAmbiguous) ids.push(...plan.cronJobsAmbiguous.map((j) => j.id));
  return Array.from(new Set(ids.filter(Boolean)));
}

/**
 * Deletes cron jobs from the live subsystem via `openclaw cron rm <id>`.
 * Continues past individual failures and reports them (never aborts the
 * wider team removal for a single flaky delete).
 */
export async function deleteCronJobsViaCli(
  api: CronCommandApi,
  ids: string[],
): Promise<{ removed: number; failed: Array<{ id: string; reason: string }> }> {
  let removed = 0;
  const failed: Array<{ id: string; reason: string }> = [];
  for (const id of ids) {
    try {
      const result = await api.runtime.system.runCommandWithTimeout(
        ["openclaw", "cron", "rm", id, "--json"],
        { timeoutMs: 30_000 },
      );
      if (result.code !== 0) {
        failed.push({ id, reason: (result.stderr || result.stdout || `exit ${result.code}`).trim() });
        continue;
      }
      removed += 1;
    } catch (err) {
      failed.push({ id, reason: err instanceof Error ? err.message : String(err) });
    }
  }
  return { removed, failed };
}

export async function loadOpenClawConfig(openclawConfigPath: string): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(openclawConfigPath, "utf8");
  // NOTE: openclaw.json is JSON5 in some deployments; but we avoid adding dependency here.
  // The main plugin already depends on json5; callers may parse using that. For remove-team, keep strict JSON.
  return JSON.parse(raw) as Record<string, unknown>;
}

export async function saveOpenClawConfig(openclawConfigPath: string, cfg: Record<string, unknown>) {
  await fs.writeFile(openclawConfigPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

export function findAgentsToRemove(cfgObj: Record<string, unknown>, teamId: string) {
  const list = (cfgObj?.agents as { list?: Array<{ id?: string }> })?.list;
  if (!Array.isArray(list)) return [] as string[];
  const prefix = `${teamId}-`;
  return list
    .map((a) => String(a?.id ?? ""))
    .filter((id: string) => id && id.startsWith(prefix));
}

export function planCronJobRemovals(
  jobs: CronJob[],
  teamId: string,
  opts?: { installedCronIds?: string[] | null }
) {
  const stamp = stampTeamId(teamId);
  const exact: Array<{ id: string; name?: string }> = [];
  const ambiguous: Array<{ id: string; name?: string; reason: string }> = [];

  const installed = new Set((opts?.installedCronIds ?? []).map((s) => String(s).trim()).filter(Boolean));

  for (const j of jobs) {
    const msg = String(j?.payload?.message ?? "");
    const name = String(j?.name ?? "");

    // Exact (preferred): installedCronIds from the team provenance file.
    if (installed.has(String(j.id))) {
      exact.push({ id: j.id, name: j.name });
      continue;
    }

    // Fallback exact: message contains the stamp.
    if (msg.includes(stamp)) {
      exact.push({ id: j.id, name: j.name });
      continue;
    }

    // Ambiguous: name/message mentions teamId (helpful for manual review).
    if (name.includes(teamId) || msg.includes(teamId)) {
      ambiguous.push({ id: j.id, name: j.name, reason: "mentions-teamId" });
    }
  }

  return { exact, ambiguous };
}

export async function buildRemoveTeamPlan(opts: {
  teamId: string;
  workspaceRoot: string; // e.g. ~/.openclaw/workspace
  openclawConfigPath: string; // e.g. ~/.openclaw/openclaw.json
  cronJobsPath: string; // e.g. ~/.openclaw/cron/jobs.json
  cfgObj: Record<string, unknown>;
  cronStore?: CronStore | null;
  installedCronIds?: string[] | null;
}) {
  const teamId = opts.teamId.trim();
  const workspaceDir = path.resolve(path.join(opts.workspaceRoot, "..", `workspace-${teamId}`));

  const notes: string[] = [];
  if (isProtectedTeamId(teamId)) notes.push(`protected-team:${teamId}`);

  const agentsToRemove = findAgentsToRemove(opts.cfgObj, teamId);

  const jobs = (opts.cronStore?.jobs ?? []) as CronJob[];
  const cron = planCronJobRemovals(jobs, teamId, { installedCronIds: opts.installedCronIds });

  const plan: RemoveTeamPlan = {
    teamId,
    workspaceDir,
    openclawConfigPath: opts.openclawConfigPath,
    cronJobsPath: opts.cronJobsPath,
    agentsToRemove,
    cronJobsExact: cron.exact,
    cronJobsAmbiguous: cron.ambiguous,
    notes,
  };

  return plan;
}

export async function executeRemoveTeamPlan(opts: {
  plan: RemoveTeamPlan;
  includeAmbiguous?: boolean;
  cfgObj: Record<string, unknown>;
  cronStore: CronStore;
}) {
  const { plan } = opts;
  const teamId = plan.teamId;

  if (isProtectedTeamId(teamId)) {
    throw new Error(`Refusing to remove protected team: ${teamId}`);
  }

  // 1) Delete workspace dir
  const workspaceExists = await fileExists(plan.workspaceDir);
  if (workspaceExists) {
    await fs.rm(plan.workspaceDir, { recursive: true, force: true });
  }

  // 2) Remove agents from config
  const agents = opts.cfgObj?.agents as { list?: Array<{ id?: string }> } | undefined;
  const list = agents?.list;
  const before = Array.isArray(list) ? list.length : 0;
  if (Array.isArray(list) && opts.cfgObj.agents) {
    const remove = new Set(plan.agentsToRemove);
    (opts.cfgObj.agents as { list: Array<{ id?: string }> }).list = list.filter((a) => !remove.has(String(a?.id ?? "")));
  }
  const after = Array.isArray(opts.cfgObj?.agents?.list) ? opts.cfgObj.agents.list.length : 0;

  // 3) Remove cron jobs from store
  const exactIds = new Set(plan.cronJobsExact.map((j) => j.id));
  const ambiguousIds = new Set(plan.cronJobsAmbiguous.map((j) => j.id));

  const removeIds = new Set<string>([...exactIds]);
  if (opts.includeAmbiguous) {
    for (const id of ambiguousIds) removeIds.add(id);
  }

  const beforeJobs = opts.cronStore.jobs.length;
  opts.cronStore.jobs = opts.cronStore.jobs.filter((j) => !removeIds.has(j.id));
  const afterJobs = opts.cronStore.jobs.length;

  const result: RemoveTeamResult = {
    ok: true,
    plan,
    removed: {
      workspaceDir: workspaceExists ? "deleted" : "missing",
      agentsRemoved: Math.max(0, before - after),
      cronJobsRemoved: Math.max(0, beforeJobs - afterJobs),
    },
  };

  return result;
}
