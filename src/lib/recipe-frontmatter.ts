import YAML from 'yaml';

export type CronJobSpec = {
  id: string;
  schedule: string;
  message: string;
  name?: string;
  description?: string;
  timezone?: string;
  channel?: string;
  to?: string;
  agentId?: string;
  enabledByDefault?: boolean;
};

/** Raw input for a cron job from YAML (supports message/task/prompt for backward compat). */
type CronJobInput = {
  id?: unknown;
  schedule?: unknown;
  message?: unknown;
  task?: unknown;
  prompt?: unknown;
  name?: unknown;
  description?: unknown;
  timezone?: unknown;
  channel?: unknown;
  to?: unknown;
  agentId?: unknown;
  enabledByDefault?: unknown;
};

export type RecipeFrontmatter = {
  id: string;
  kind?: string;
  name?: string;
  cronJobs?: CronJobSpec[];
  [k: string]: unknown;
};

/**
 * Parse YAML frontmatter and body from recipe markdown.
 * @param md - Recipe markdown (must start with ---)
 * @returns frontmatter and body
 * @throws If frontmatter missing or invalid
 */
export function parseFrontmatter(md: string): { frontmatter: RecipeFrontmatter; body: string } {
  if (!md.startsWith('---\n')) throw new Error('Recipe markdown must start with YAML frontmatter (---)');
  const end = md.indexOf('\n---\n', 4);
  if (end === -1) throw new Error('Recipe frontmatter not terminated (---)');
  const yamlText = md.slice(4, end);
  const body = md.slice(end + 5);
  const frontmatter = YAML.parse(yamlText) as RecipeFrontmatter;
  if (!frontmatter?.id) throw new Error('Recipe frontmatter must include id');
  return { frontmatter, body };
}

function validateCronJobInput(j: CronJobInput): void {
  if (!j || typeof j !== "object") throw new Error("cronJobs entries must be objects");
  const id = String(j.id ?? "").trim();
  if (!id) throw new Error("cronJobs[].id is required");
  const schedule = String(j.schedule ?? "").trim();
  const message = String(j.message ?? j.task ?? j.prompt ?? "").trim();
  if (!schedule) throw new Error(`cronJobs[${id}].schedule is required`);
  if (!message) throw new Error(`cronJobs[${id}].message is required`);
}

function buildCronJobSpec(j: CronJobInput, id: string): CronJobSpec {
  return {
    id,
    schedule: String(j.schedule ?? "").trim(),
    message: String(j.message ?? j.task ?? j.prompt ?? "").trim(),
    name: j.name != null ? String(j.name) : undefined,
    description: j.description != null ? String(j.description) : undefined,
    timezone: j.timezone != null ? String(j.timezone) : undefined,
    channel: j.channel != null ? String(j.channel) : undefined,
    to: j.to != null ? String(j.to) : undefined,
    agentId: j.agentId != null ? String(j.agentId) : undefined,
    enabledByDefault: Boolean(j.enabledByDefault ?? false),
  };
}

function normalizeOneCronJob(j: CronJobInput, seen: Set<string>): CronJobSpec {
  validateCronJobInput(j);
  const id = String(j.id ?? "").trim();
  if (seen.has(id)) throw new Error(`Duplicate cronJobs[].id: ${id}`);
  seen.add(id);
  return buildCronJobSpec(j, id);
}

/**
 * Normalize cron job specs from recipe frontmatter.
 * Supports message, task, and prompt fields for backward compatibility.
 * @param frontmatter - Recipe frontmatter with optional cronJobs array
 * @returns Array of validated CronJobSpec
 */
export function normalizeCronJobs(frontmatter: { cronJobs?: CronJobInput[] }): CronJobSpec[] {
  const raw = frontmatter.cronJobs;
  if (!raw) return [];
  if (!Array.isArray(raw)) throw new Error("frontmatter.cronJobs must be an array");

  const seen = new Set<string>();
  return (raw as CronJobInput[]).map((j) => normalizeOneCronJob(j, seen));
}
