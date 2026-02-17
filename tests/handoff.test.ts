import { describe, expect, test, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { handoffTicket } from '../src/lib/ticket-workflow';

async function mkTeamDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'clawcipes-test-'));
  await fs.mkdir(path.join(dir, 'work', 'backlog'), { recursive: true });
  await fs.mkdir(path.join(dir, 'work', 'in-progress'), { recursive: true });
  // Intentionally omit work/testing to simulate older workspaces.
  await fs.mkdir(path.join(dir, 'work', 'done'), { recursive: true });
  await fs.mkdir(path.join(dir, 'work', 'assignments'), { recursive: true });
  return dir;
}

describe('ticket workflow: handoff', () => {
  test('moves ticket to testing, patches headers, writes assignment (idempotent)', async () => {
    const teamDir = await mkTeamDir();
    try {
      const ticketPath = path.join(teamDir, 'work', 'in-progress', '0001-sample.md');
      await fs.writeFile(
        ticketPath,
        `# 0001-sample\n\nOwner: dev\nStatus: in-progress\n\n## Context\nTest\n`,
        'utf8',
      );

      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const r1 = await handoffTicket({ teamDir, ticket: '0001', tester: 'test', overwriteAssignment: false });
      expect(errSpy).toHaveBeenCalled();
      expect(errSpy.mock.calls.map((c) => String(c[0])).join('\n')).toMatch(/migration: created work\/testing\//);
      errSpy.mockRestore();
      expect(r1.moved).toBe(true);
      expect(r1.destPath).toContain(path.join('work', 'testing'));

      const nextTicket = await fs.readFile(r1.destPath, 'utf8');
      expect(nextTicket).toMatch(/^Owner:\s*test$/m);
      expect(nextTicket).toMatch(/^Status:\s*testing$/m);
      expect(nextTicket).toMatch(/^Assignment:\s*work\/assignments\/0001-assigned-test\.md$/m);

      const assignmentPath = path.join(teamDir, 'work', 'assignments', '0001-assigned-test.md');
      const assignment = await fs.readFile(assignmentPath, 'utf8');
      expect(assignment).toMatch(/Created by: openclaw recipes handoff/);
      expect(assignment).toMatch(/work\/testing\/0001-sample\.md/);

      const r2 = await handoffTicket({ teamDir, ticket: '0001', tester: 'test', overwriteAssignment: true });
      expect(r2.moved).toBe(false);
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });

  test('throws when ticket not found', async () => {
    const teamDir = await mkTeamDir();
    try {
      await expect(
        handoffTicket({ teamDir, ticket: '9999', tester: 'test', overwriteAssignment: false })
      ).rejects.toThrow(/Ticket not found/);
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });
});
