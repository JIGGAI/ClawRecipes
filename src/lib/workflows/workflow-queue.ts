import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export type QueueTask = {
  id: string;
  ts: string;
  teamId: string;
  runId: string;
  nodeId: string;
  kind: 'execute_node';
};

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function fileExists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

function queueDir(teamDir: string) {
  return path.join(teamDir, 'shared-context', 'workflow-queues');
}

export function queuePathFor(teamDir: string, agentId: string) {
  return path.join(queueDir(teamDir), `${agentId}.jsonl`);
}

function statePathFor(teamDir: string, agentId: string) {
  return path.join(queueDir(teamDir), `${agentId}.state.json`);
}

export async function enqueueTask(teamDir: string, agentId: string, task: Omit<QueueTask, 'id' | 'ts'>) {
  await ensureDir(queueDir(teamDir));
  const entry: QueueTask = {
    id: crypto.randomBytes(8).toString('hex'),
    ts: new Date().toISOString(),
    ...task,
  };
  const p = queuePathFor(teamDir, agentId);
  await fs.appendFile(p, JSON.stringify(entry) + '\n', 'utf8');
  return { ok: true as const, path: p, task: entry };
}

type QueueState = {
  offsetBytes: number;
  updatedAt: string;
};

async function loadState(teamDir: string, agentId: string): Promise<QueueState> {
  const p = statePathFor(teamDir, agentId);
  if (!(await fileExists(p))) return { offsetBytes: 0, updatedAt: new Date().toISOString() };
  try {
    const raw = await fs.readFile(p, 'utf8');
    const parsed = JSON.parse(raw) as QueueState;
    if (!parsed || typeof parsed.offsetBytes !== 'number') throw new Error('invalid');
    return parsed;
  } catch {
    return { offsetBytes: 0, updatedAt: new Date().toISOString() };
  }
}

async function writeState(teamDir: string, agentId: string, st: QueueState) {
  await ensureDir(queueDir(teamDir));
  const p = statePathFor(teamDir, agentId);
  await fs.writeFile(p, JSON.stringify(st, null, 2), 'utf8');
}

export async function readNextTasks(teamDir: string, agentId: string, opts?: { limit?: number }) {
  const limit = typeof opts?.limit === 'number' && opts.limit > 0 ? Math.floor(opts.limit) : 10;
  const qPath = queuePathFor(teamDir, agentId);
  if (!(await fileExists(qPath))) {
    return { ok: true as const, tasks: [] as QueueTask[], consumed: 0, message: 'Queue file not present.' };
  }

  const st = await loadState(teamDir, agentId);
  const fh = await fs.open(qPath, 'r');
  try {
    const stat = await fh.stat();
    if (st.offsetBytes >= stat.size) {
      return { ok: true as const, tasks: [] as QueueTask[], consumed: 0, message: 'No new tasks.' };
    }

    const toRead = Math.min(stat.size - st.offsetBytes, 256 * 1024);
    const buf = Buffer.alloc(toRead);
    const { bytesRead } = await fh.read(buf, 0, toRead, st.offsetBytes);
    const chunk = buf.subarray(0, bytesRead).toString('utf8');

    // Only consume full lines.
    const lines = chunk.split('\n');
    const fullLines = lines.slice(0, -1);
    const tasks: QueueTask[] = [];

    let consumedBytes = 0;
    for (const line of fullLines) {
      consumedBytes += Buffer.byteLength(line + '\n');
      if (!line.trim()) continue;
      try {
        const t = JSON.parse(line) as QueueTask;
        if (t && t.runId && t.nodeId) tasks.push(t);
      } catch {
        // ignore malformed line
      }
      if (tasks.length >= limit) break;
    }

    const nextOffset = st.offsetBytes + consumedBytes;
    await writeState(teamDir, agentId, { offsetBytes: nextOffset, updatedAt: new Date().toISOString() });

    return { ok: true as const, tasks, consumed: tasks.length };
  } finally {
    await fh.close();
  }
}
