import fs from 'node:fs/promises';
import path from 'node:path';

export type CleanupDecision =
  | { kind: 'candidate'; teamId: string; dirName: string; absPath: string }
  | { kind: 'skip'; teamId?: string; dirName: string; absPath: string; reason: string };

export type CleanupPlan = {
  rootDir: string;
  prefixes: string[];
  protectedTeamIds: string[];
  decisions: CleanupDecision[];
};

export const DEFAULT_ALLOWED_PREFIXES = ['smoke-', 'qa-', 'tmp-', 'test-'] as const;
export const DEFAULT_PROTECTED_TEAM_IDS = ['development-team'] as const;

async function isDir(p: string) {
  try {
    const st = await fs.stat(p);
    return st.isDirectory();
  } catch {
    return false;
  }
}

/** Refuse to operate on symlinks (for safety). */
async function isSymlink(p: string) {
  try {
    const st = await fs.lstat(p);
    return st.isSymbolicLink();
  } catch {
    return false;
  }
}

export function parseTeamIdFromWorkspaceDirName(dirName: string) {
  if (!dirName.startsWith('workspace-')) return null;
  const teamId = dirName.slice('workspace-'.length);
  return teamId || null;
}

export function isEligibleTeamId(opts: { teamId: string; prefixes: string[]; protectedTeamIds: string[] }) {
  const { teamId, prefixes, protectedTeamIds } = opts;

  if (!teamId.endsWith('-team')) return { ok: false, reason: 'teamId does not end with -team' } as const;

  if (protectedTeamIds.includes(teamId.replace(/-team$/, ''))) {
    // Back-compat: protect by base id too if someone passes development-team-team etc.
    return { ok: false, reason: 'protected teamId' } as const;
  }
  if (protectedTeamIds.includes(teamId)) return { ok: false, reason: 'protected teamId' } as const;

  const okPrefix = prefixes.some((p) => teamId.startsWith(p));
  if (!okPrefix) return { ok: false, reason: `teamId does not start with an allowed prefix (${prefixes.join(', ')})` } as const;

  return { ok: true } as const;
}

/**
 * Build a safe cleanup plan for workspace-<teamId> directories under rootDir.
 *
 * Safety rails:
 * - only directories named workspace-<teamId>
 * - teamId must end with -team and start with an allowed prefix
 * - protected teamIds are always skipped
 * - refuses symlinks
 * - resolved path must remain within rootDir
 */
export async function planWorkspaceCleanup(opts: {
  rootDir: string;
  prefixes?: string[];
  protectedTeamIds?: string[];
}) {
  const rootDir = path.resolve(opts.rootDir);
  const prefixes = (opts.prefixes?.length ? opts.prefixes : [...DEFAULT_ALLOWED_PREFIXES]) as string[];
  const protectedTeamIds = (opts.protectedTeamIds?.length ? opts.protectedTeamIds : [...DEFAULT_PROTECTED_TEAM_IDS]) as string[];

  const decisions: CleanupDecision[] = [];

  let entries: string[] = [];
  try {
    entries = await fs.readdir(rootDir);
  } catch (e: unknown) {
    return {
      rootDir,
      prefixes,
      protectedTeamIds,
      decisions: [
        {
          kind: 'skip',
          dirName: rootDir,
          absPath: rootDir,
          reason: `failed to read rootDir: ${e instanceof Error ? e.message : String(e)}`,
        },
      ],
    } satisfies CleanupPlan;
  }

  for (const dirName of entries) {
    if (!dirName.startsWith('workspace-')) continue;

    const absPath = path.join(rootDir, dirName);

    if (!(await isDir(absPath))) continue;

    const teamId = parseTeamIdFromWorkspaceDirName(dirName);
    if (!teamId) {
      decisions.push({ kind: 'skip', dirName, absPath, reason: 'could not parse teamId' });
      continue;
    }

    if (await isSymlink(absPath)) {
      decisions.push({ kind: 'skip', teamId, dirName, absPath, reason: 'refusing to operate on symlink' });
      continue;
    }

    const real = await fs.realpath(absPath);
    const rootReal = await fs.realpath(rootDir);
    if (!real.startsWith(rootReal + path.sep) && real !== rootReal) {
      decisions.push({ kind: 'skip', teamId, dirName, absPath, reason: 'resolved path escapes rootDir' });
      continue;
    }

    const elig = isEligibleTeamId({ teamId, prefixes, protectedTeamIds });
    if (!elig.ok) {
      decisions.push({ kind: 'skip', teamId, dirName, absPath, reason: elig.reason });
      continue;
    }

    decisions.push({ kind: 'candidate', teamId, dirName, absPath });
  }

  return { rootDir, prefixes, protectedTeamIds, decisions } satisfies CleanupPlan;
}

export async function executeWorkspaceCleanup(plan: CleanupPlan, opts: { yes: boolean }) {
  const candidates = plan.decisions.filter((d): d is Extract<CleanupDecision, { kind: 'candidate' }> => d.kind === 'candidate');
  const skipped = plan.decisions.filter((d): d is Extract<CleanupDecision, { kind: 'skip' }> => d.kind === 'skip');

  if (!opts.yes) {
    return {
      ok: true,
      dryRun: true,
      rootDir: plan.rootDir,
      candidates,
      skipped,
      deleted: [] as string[],
    };
  }

  const deleted: string[] = [];
  const deleteErrors: Array<{ path: string; error: string }> = [];

  for (const c of candidates) {
    try {
      await fs.rm(c.absPath, { recursive: true, force: true });
      deleted.push(c.absPath);
    } catch (e: unknown) {
      deleteErrors.push({ path: c.absPath, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return {
    ok: deleteErrors.length === 0,
    dryRun: false,
    rootDir: plan.rootDir,
    candidates,
    skipped,
    deleted,
    deleteErrors,
  };
}
