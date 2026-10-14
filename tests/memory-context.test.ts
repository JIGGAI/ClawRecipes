import { afterEach, describe, expect, test } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildMemoryContext } from '../src/lib/workflows/memory-context';

const tempDirs: string[] = [];

async function tempTeamDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'memory-context-test-'));
  tempDirs.push(dir);
  return dir;
}

async function readMeasurement(teamDir: string): Promise<Record<string, unknown>> {
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(teamDir, 'shared-context', 'agent-outputs', 'memory-injection-log', `${date}.jsonl`);
  const lines = (await fs.readFile(file, 'utf8')).trim().split('\n');
  return JSON.parse(lines.at(-1)!);
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('memory context measurement', () => {
  test('logs an empty invocation when a team has no memory directory', async () => {
    const teamDir = await tempTeamDir();
    const context = await buildMemoryContext(teamDir, { teamId: 'empty-team', runId: 'run-1', nodeId: 'node-1' });
    const measurement = await readMeasurement(teamDir);

    expect(context).toBe('');
    expect(measurement).toMatchObject({
      teamId: 'empty-team',
      runId: 'run-1',
      nodeId: 'node-1',
      tokens_injected: 0,
      items_included: 0,
      items_dropped_by_cap: 0,
      files_scanned_count: 0,
      total_available_tokens: 0,
    });
  });

  test('records included, available, pinned, and file metrics', async () => {
    const teamDir = await tempTeamDir();
    const memoryDir = path.join(teamDir, 'shared-context', 'memory');
    await fs.mkdir(memoryDir, { recursive: true });
    const item = (content: string) => JSON.stringify({ content, type: 'fact', ts: '2026-10-08T00:00:00Z' });
    await fs.writeFile(
      path.join(memoryDir, 'pinned.jsonl'),
      Array.from({ length: 6 }, (_, index) => item(`pinned-${index}`)).join('\n') + '\n',
      'utf8',
    );
    await fs.writeFile(
      path.join(memoryDir, 'team.jsonl'),
      [item('old'), item('recent-1'), item('recent-2'), item('recent-3'), '{bad json'].join('\n') + '\n',
      'utf8',
    );

    const context = await buildMemoryContext(teamDir, { teamId: 'alpha', runId: 'run-2', nodeId: 'node-2' });
    const measurement = await readMeasurement(teamDir);

    expect(context).toContain('pinned-5');
    expect(context).not.toContain('pinned-0');
    expect(measurement).toMatchObject({
      teamId: 'alpha',
      items_included: 7,
      items_dropped_by_cap: 0,
      pinned_included: 5,
      pinned_available: 6,
      files_scanned_count: 2,
      items_available: 10,
    });
    expect(measurement.tokens_injected).toBeGreaterThan(0);
    expect(measurement.total_available_tokens).toBeGreaterThan(measurement.tokens_injected);
    expect(measurement.files_scanned).toEqual(expect.arrayContaining(['pinned.jsonl', 'team.jsonl']));
  });

  test('counts eligible items rejected by the existing cap policy', async () => {
    const teamDir = await tempTeamDir();
    const memoryDir = path.join(teamDir, 'shared-context', 'memory');
    await fs.mkdir(memoryDir, { recursive: true });
    const largeItem = (id: number) => JSON.stringify({ content: `${id}-${'x'.repeat(2000)}`, type: 'fact', ts: '2026-10-08' });
    await fs.writeFile(
      path.join(memoryDir, 'pinned.jsonl'),
      Array.from({ length: 5 }, (_, index) => largeItem(index)).join('\n') + '\n',
      'utf8',
    );
    await fs.writeFile(
      path.join(memoryDir, 'team.jsonl'),
      Array.from({ length: 3 }, (_, index) => largeItem(index + 5)).join('\n') + '\n',
      'utf8',
    );

    await buildMemoryContext(teamDir, { teamId: 'cap-team', runId: 'run-3', nodeId: 'node-3' });
    const measurement = await readMeasurement(teamDir);

    expect(measurement.items_included).toBe(3);
    expect(measurement.pinned_included).toBe(3);
    expect(measurement.items_dropped_by_cap).toBe(5);
  });
});
