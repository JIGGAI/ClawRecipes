import { describe, expect, test, vi } from 'vitest';
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

  test('skips entry when stat/lstat fails (treats as non-symlink)', async () => {
    const root = await mkRoot();
    const dirPath = path.join(root, 'workspace-smoke-statfail-team');
    await fs.mkdir(dirPath, { recursive: true });
    const lstatSpy = vi.spyOn(fs, 'lstat').mockImplementation(async (p: any) => {
      if (String(p).includes('workspace-smoke-statfail-team')) throw new Error('lstat failed');
      return fs.lstat(p);
    });
    try {
      const plan = await planWorkspaceCleanup({ rootDir: root });
      // Should still find it as candidate (isSymlink returns false on error, so we continue)
      const candidates = plan.decisions.filter((d) => d.kind === 'candidate').map((d: any) => d.dirName);
      expect(candidates).toContain('workspace-smoke-statfail-team');
    } finally {
      lstatSpy.mockRestore();
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

  test('readdir error returns skip decision', async () => {
    const plan = await planWorkspaceCleanup({ rootDir: '/nonexistent-path-xyz-12345' });
    expect(plan.decisions.length).toBe(1);
    expect(plan.decisions[0].kind).toBe('skip');
    expect((plan.decisions[0] as any).reason).toMatch(/failed to read rootDir/);
  });

  test('skips non-directory entries named workspace-*', async () => {
    const root = await mkRoot();
    try {
      const filePath = path.join(root, 'workspace-smoke-file-team');
      await fs.writeFile(filePath, 'x', 'utf8');
      const plan = await planWorkspaceCleanup({ rootDir: root });
      const candidates = plan.decisions.filter((d) => d.kind === 'candidate').map((d: any) => d.dirName);
      expect(candidates).not.toContain('workspace-smoke-file-team');
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  test('skips workspace whose realpath escapes rootDir', async () => {
    const root = await mkRoot();
    const escapeDir = path.join(root, 'workspace-smoke-escape-team');
    await fs.mkdir(escapeDir, { recursive: true });
    const realpathSpy = vi.spyOn(fs, 'realpath').mockImplementation(async (p: any) => {
      const s = String(p);
      if (s.includes('workspace-smoke-escape-team')) {
        return '/outside/escaped/path';
      }
      return path.resolve(p);
    });
    try {
      const plan = await planWorkspaceCleanup({ rootDir: root });
      const skipped = plan.decisions.filter((d) => d.kind === 'skip').map((d: any) => `${d.dirName}:${d.reason}`);
      expect(skipped.some((s) => s.includes('resolved path escapes rootDir'))).toBe(true);
    } finally {
      realpathSpy.mockRestore();
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  test('skips workspace- only (empty teamId)', async () => {
    const root = await mkRoot();
    try {
      await fs.mkdir(path.join(root, 'workspace-'), { recursive: true });
      const plan = await planWorkspaceCleanup({ rootDir: root });
      const skipped = plan.decisions.filter((d) => d.kind === 'skip');
      expect(skipped.some((s: any) => s.reason === 'could not parse teamId')).toBe(true);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  test('executeWorkspaceCleanup handles delete errors', async () => {
    const root = await mkRoot();
    const candDir = path.join(root, 'workspace-smoke-err-team');
    await fs.mkdir(candDir, { recursive: true });
    const plan = await planWorkspaceCleanup({ rootDir: root });
    const rmSpy = vi.spyOn(fs, 'rm').mockRejectedValueOnce(new Error('Permission denied'));
    try {
      const res = await executeWorkspaceCleanup(plan, { yes: true });
      expect(res.ok).toBe(false);
      expect(res.deleteErrors.length).toBeGreaterThan(0);
      expect(res.deleteErrors[0].error).toMatch(/Permission denied/);
    } finally {
      rmSpy.mockRestore();
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
