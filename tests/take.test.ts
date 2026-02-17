import { describe, expect, test, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { takeTicket } from '../src/lib/ticket-workflow';

async function mkTeamDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'clawcipes-test-'));
  await fs.mkdir(path.join(dir, 'work', 'backlog'), { recursive: true });
  // Intentionally omit work/in-progress and work/assignments to simulate older workspaces.
  await fs.mkdir(path.join(dir, 'work', 'done'), { recursive: true });
  return dir;
}

describe('ticket workflow: take', () => {
  test('moves ticket to in-progress, patches headers, writes assignment (creates missing lanes)', async () => {
    const teamDir = await mkTeamDir();
    try {
      const ticketPath = path.join(teamDir, 'work', 'backlog', '0007-sample.md');
      await fs.writeFile(ticketPath, `# 0007-sample\n\n## Context\nTest\n`, 'utf8');

      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await takeTicket({ teamDir, ticket: '0007', owner: 'devops', overwriteAssignment: false });
      // should have printed migration for in-progress at least
      expect(errSpy.mock.calls.map((c) => String(c[0])).join('\n')).toMatch(/migration: created work\/in-progress\//);
      errSpy.mockRestore();

      expect(res.destPath).toContain(path.join('work', 'in-progress'));

      const nextTicket = await fs.readFile(res.destPath, 'utf8');
      expect(nextTicket).toMatch(/^Owner:\s*devops$/m);
      expect(nextTicket).toMatch(/^Status:\s*in-progress$/m);
      expect(nextTicket).toMatch(/^Assignment:\s*work\/assignments\/0007-assigned-devops\.md$/m);

      const assignmentPath = path.join(teamDir, 'work', 'assignments', '0007-assigned-devops.md');
      const assignment = await fs.readFile(assignmentPath, 'utf8');
      expect(assignment).toMatch(/Created by: openclaw recipes take/);
      expect(assignment).toMatch(/work\/in-progress\/0007-sample\.md/);
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });

  test('throws when ticket not found', async () => {
    const teamDir = await mkTeamDir();
    try {
      await expect(takeTicket({ teamDir, ticket: '9999', owner: 'dev', overwriteAssignment: false })).rejects.toThrow(
        /Ticket not found/
      );
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });

  test('throws when ticket is in done', async () => {
    const teamDir = await mkTeamDir();
    const donePath = path.join(teamDir, 'work', 'done', '0001-complete.md');
    await fs.writeFile(donePath, '# 0001-complete\n\nStatus: done\n', 'utf8');
    try {
      await expect(takeTicket({ teamDir, ticket: '0001', owner: 'dev', overwriteAssignment: false })).rejects.toThrow(
        /Cannot take a done ticket/
      );
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });

  test('skips overwriting assignment when overwriteAssignment false and assignment exists', async () => {
    const teamDir = await mkTeamDir();
    await fs.mkdir(path.join(teamDir, 'work', 'in-progress'), { recursive: true });
    await fs.mkdir(path.join(teamDir, 'work', 'assignments'), { recursive: true });
    const ticketPath = path.join(teamDir, 'work', 'in-progress', '0002-sample.md');
    await fs.writeFile(ticketPath, '# 0002-sample\n\n## Context\n', 'utf8');
    const assignmentPath = path.join(teamDir, 'work', 'assignments', '0002-assigned-dev.md');
    await fs.writeFile(assignmentPath, 'ORIGINAL', 'utf8');
    try {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const res = await takeTicket({ teamDir, ticket: '0002', owner: 'dev', overwriteAssignment: false });
      errSpy.mockRestore();
      expect(res.moved).toBe(false);
      expect(await fs.readFile(assignmentPath, 'utf8')).toBe('ORIGINAL');
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });
});
