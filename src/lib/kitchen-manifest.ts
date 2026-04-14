import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';

// ── Manifest types ──────────────────────────────────────────────────────────

export interface KitchenManifest {
  version: 1;
  generatedAt: string;
  teams: Record<string, TeamManifestEntry>;
  agents: AgentManifestEntry[];
  recipes: RecipeManifestEntry[];
}

export interface TeamManifestEntry {
  teamId: string;
  displayName: string | null;
  roles: string[];
  ticketCounts: {
    backlog: number;
    'in-progress': number;
    testing: number;
    done: number;
    total: number;
  };
  activeRunCount: number;
}

export interface AgentManifestEntry {
  id: string;
  identityName?: string;
  workspace?: string;
  model?: string;
  isDefault?: boolean;
}

export interface RecipeManifestEntry {
  id: string;
  name: string;
  kind: 'agent' | 'team';
  source: 'builtin' | 'workspace';
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const OPENCLAW_DIR = path.join(os.homedir(), '.openclaw');
const MANIFEST_FILENAME = 'kitchen-manifest.json';

export function defaultManifestPath(): string {
  return path.join(OPENCLAW_DIR, MANIFEST_FILENAME);
}

async function countMdFiles(dir: string): Promise<number> {
  try {
    const entries = await fs.readdir(dir);
    return entries.filter((e) => e.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

async function countActiveRuns(teamDir: string): Promise<number> {
  const runsDir = path.join(teamDir, 'shared-context', 'workflow-runs');
  let runDirs: string[];
  try {
    runDirs = await fs.readdir(runsDir);
  } catch {
    return 0;
  }

  let count = 0;
  for (const d of runDirs) {
    const runJson = path.join(runsDir, d, 'run.json');
    try {
      const raw = await fs.readFile(runJson, 'utf8');
      const run = JSON.parse(raw) as { status?: string };
      const s = run.status ?? '';
      if (s === 'running' || s === 'waiting_workers' || s === 'waiting_for_approval') {
        count++;
      }
    } catch {
      // run.json missing or malformed — skip
    }
  }
  return count;
}

async function listRoles(teamDir: string): Promise<string[]> {
  const rolesDir = path.join(teamDir, 'roles');
  try {
    const entries = await fs.readdir(rolesDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

async function readTeamDisplayName(teamDir: string): Promise<string | null> {
  const teamJsonPath = path.join(teamDir, 'shared-context', 'workflows', 'team.json');
  try {
    const raw = await fs.readFile(teamJsonPath, 'utf8');
    const parsed = JSON.parse(raw) as { recipeName?: string };
    return parsed.recipeName?.trim() || null;
  } catch {
    return null;
  }
}

// ── Generator ───────────────────────────────────────────────────────────────

export interface GenerateManifestOptions {
  api: OpenClawPluginApi;
  outputPath?: string;
}

export async function generateKitchenManifest(opts: GenerateManifestOptions): Promise<KitchenManifest> {
  const { api } = opts;
  const outputPath = opts.outputPath ?? defaultManifestPath();

  // Discover teams
  let dirEntries: string[];
  try {
    dirEntries = await fs.readdir(OPENCLAW_DIR);
  } catch {
    dirEntries = [];
  }

  const teamDirNames = dirEntries.filter((e) => e.startsWith('workspace-'));
  const teams: Record<string, TeamManifestEntry> = {};

  for (const dirName of teamDirNames) {
    const teamId = dirName.slice('workspace-'.length);
    if (!teamId) continue;

    const teamDir = path.join(OPENCLAW_DIR, dirName);
    const workDir = path.join(teamDir, 'work');

    const [backlog, inProgress, testing, done, activeRunCount, roles, displayName] = await Promise.all([
      countMdFiles(path.join(workDir, 'backlog')),
      countMdFiles(path.join(workDir, 'in-progress')),
      countMdFiles(path.join(workDir, 'testing')),
      countMdFiles(path.join(workDir, 'done')),
      countActiveRuns(teamDir),
      listRoles(teamDir),
      readTeamDisplayName(teamDir),
    ]);

    teams[teamId] = {
      teamId,
      displayName,
      roles,
      ticketCounts: {
        backlog,
        'in-progress': inProgress,
        testing,
        done,
        total: backlog + inProgress + testing + done,
      },
      activeRunCount,
    };
  }

  // Read agents directly from config (avoids subprocess which can silently fail)
  let agents: AgentManifestEntry[] = [];
  try {
    const list = (api.config as { agents?: { list?: Array<Record<string, unknown>> } }).agents?.list;
    if (Array.isArray(list)) {
      agents = list.map((a) => ({
        id: String(a.id ?? ''),
        identityName: typeof (a.identity as Record<string, unknown> | undefined)?.name === 'string'
          ? (a.identity as { name: string }).name
          : undefined,
        workspace: typeof a.workspace === 'string' ? a.workspace : undefined,
        model: typeof a.model === 'string' ? a.model : undefined,
        isDefault: a.default === true,
      })).filter((a) => a.id);
    }
  } catch { /* best-effort */ }

  // Read recipes from filesystem (avoids subprocess which can silently fail)
  const recipes: RecipeManifestEntry[] = [];
  try {
    const { listRecipeFiles } = await import('./recipes');
    const { getRecipesConfig } = await import('./config');
    const { parseFrontmatter } = await import('./recipe-frontmatter');
    const cfg = getRecipesConfig(api.config);
    const files = await listRecipeFiles(api, cfg);
    for (const f of files) {
      const md = await fs.readFile(f.path, 'utf8');
      const { frontmatter } = parseFrontmatter(md);
      if (frontmatter.id && frontmatter.name) {
        recipes.push({
          id: frontmatter.id,
          name: frontmatter.name,
          kind: frontmatter.kind === 'team' ? 'team' : 'agent',
          source: f.source,
        });
      }
    }
  } catch { /* best-effort */ }

  const manifest: KitchenManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    teams,
    agents,
    recipes,
  };

  // Atomic write: tmp file + rename
  const tmpPath = outputPath + '.tmp';
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(tmpPath, JSON.stringify(manifest, null, 2), 'utf8');
  await fs.rename(tmpPath, outputPath);

  return manifest;
}

// ── Debounced regeneration ──────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 500;

/**
 * Schedule a manifest regeneration. Multiple calls within DEBOUNCE_MS are
 * coalesced into a single generation. Fire-and-forget — errors are logged
 * but never propagated.
 */
export function scheduleManifestRegeneration(api: OpenClawPluginApi): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    generateKitchenManifest({ api }).catch((err) => {
      console.error('[kitchen-manifest] regeneration failed:', err instanceof Error ? err.message : String(err));
    });
  }, DEBOUNCE_MS);
}
