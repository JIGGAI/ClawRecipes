import { describe, expect, test } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { evalIfCondition } from '../workflow-if';

async function tmpRunDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'clawrecipes-run-'));
  await fs.mkdir(path.join(dir, 'node-outputs'), { recursive: true });
  return dir;
}

describe('workflow if node', () => {
  test('truthy on node output path', async () => {
    const runDir = await tmpRunDir();
    const outFile = path.join(runDir, 'node-outputs', '000-prev.json');
    await fs.writeFile(outFile, JSON.stringify({ text: JSON.stringify({ ok: true, count: 2 }) }, null, 2));

    const res = await evalIfCondition({
      runDir,
      condition: { lhs: 'nodes.prev.output.ok', op: 'truthy' },
    });

    expect(res.ok).toBe(true);
    expect(res.value).toBe(true);
  });

  test('numeric comparator', async () => {
    const runDir = await tmpRunDir();
    const outFile = path.join(runDir, 'node-outputs', '000-prev.json');
    await fs.writeFile(outFile, JSON.stringify({ text: JSON.stringify({ count: 2 }) }, null, 2));

    const res = await evalIfCondition({
      runDir,
      condition: { lhs: 'nodes.prev.output.count', op: '>=', rhs: 2 },
    });

    expect(res.value).toBe(true);
  });

  test('contains on string', async () => {
    const runDir = await tmpRunDir();
    const outFile = path.join(runDir, 'node-outputs', '000-prev.json');
    await fs.writeFile(outFile, JSON.stringify({ text: JSON.stringify({ msg: 'hello world' }) }, null, 2));

    const res = await evalIfCondition({
      runDir,
      condition: { lhs: 'nodes.prev.output.msg', op: 'contains', rhs: 'world' },
    });

    expect(res.value).toBe(true);
  });
});
