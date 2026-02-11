import { describe, expect, test } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { executeWorkspaceCleanup, planWorkspaceCleanup } from '../src/lib/cleanup-workspaces';

async function mkRoot() {
  return await fs.mkdtemp(path.join(os.tmpdir(), 'clawcipes-cleanup-test-'));
}

describe('cleanup-workspaces', () => {
  test('dry-run: finds only eligible workspace-* candidates (prefix + -team), skips protected', async () => {
    const root = await mkRoot();
    try {
      // Eligible
      await fs.mkdir(path.join(root, 'workspace-smoke-123-team'), { recursive: true });
      await fs.mkdir(path.join(root, 'workspace-qa-abc-team'), { recursive: true });

      // Not eligible (no -team)
      await fs.mkdir(path.join(root, 'workspace-smoke-zzz'), { recursive: true });

      // Protected
      await fs.mkdir(path.join(root, 'workspace-development-team'), { recursive: true });
      await fs.mkdir(path.join(root, 'workspace-development-team-team'), { recursive: true });

      const plan = await planWorkspaceCleanup({ rootDir: root });
      const res = await executeWorkspaceCleanup(plan, { yes: false });

      expect(res.dryRun).toBe(true);
      expect(res.candidates.map((c) => c.dirName).sort()).toEqual(['workspace-qa-abc-team', 'workspace-smoke-123-team']);

      const skippedNames = res.skipped.map((s) => s.dirName);
      expect(skippedNames).toContain('workspace-smoke-zzz');
      expect(skippedNames).toContain('workspace-development-team');
      expect(skippedNames).toContain('workspace-development-team-team');
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  test('delete mode: requires yes=true and deletes only candidates', async () => {
    const root = await mkRoot();
    try {
      const c1 = path.join(root, 'workspace-smoke-123-team');
      const c2 = path.join(root, 'workspace-qa-abc-team');
      const protectedDir = path.join(root, 'workspace-development-team');
      await fs.mkdir(c1, { recursive: true });
      await fs.mkdir(c2, { recursive: true });
      await fs.mkdir(protectedDir, { recursive: true });

      const plan = await planWorkspaceCleanup({ rootDir: root });

      const dry = await executeWorkspaceCleanup(plan, { yes: false });
      expect(await fs.stat(c1)).toBeTruthy();
      expect(dry.deleted.length).toBe(0);

      const del = await executeWorkspaceCleanup(plan, { yes: true });
      expect(del.dryRun).toBe(false);

      // candidates removed
      await expect(fs.stat(c1)).rejects.toBeTruthy();
      await expect(fs.stat(c2)).rejects.toBeTruthy();

      // protected remains
      expect(await fs.stat(protectedDir)).toBeTruthy();
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  test('refuses symlink workspaces (never candidates)', async () => {
    const root = await mkRoot();
    try {
      const realDir = path.join(root, 'workspace-smoke-real-team');
      await fs.mkdir(realDir, { recursive: true });

      const linkName = path.join(root, 'workspace-smoke-link-team');
      await fs.symlink(realDir, linkName);

      const plan = await planWorkspaceCleanup({ rootDir: root });
      const candidates = plan.decisions.filter((d) => d.kind === 'candidate').map((d: any) => d.dirName);
      expect(candidates).toContain('workspace-smoke-real-team');
      expect(candidates).not.toContain('workspace-smoke-link-team');

      const skipped = plan.decisions.filter((d) => d.kind === 'skip').map((d: any) => `${d.dirName}:${d.reason}`);
      expect(skipped.join('\n')).toMatch(/workspace-smoke-link-team:refusing to operate on symlink/);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
