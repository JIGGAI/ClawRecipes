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

export type DequeuedTask = {
  task: QueueTask;
  // Absolute byte offsets into the queue file.
  startOffsetBytes: number;
  endOffsetBytes: number;
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

function claimsDir(teamDir: string) {
  return path.join(queueDir(teamDir), 'claims');
}

function claimPathFor(teamDir: string, agentId: string, taskId: string) {
  return path.join(claimsDir(teamDir), `${agentId}.${taskId}.json`);
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

/**
 * Peek-style read. Does NOT advance the queue cursor.
 * Prefer dequeueNextTask() for worker execution.
 */
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

    // Only parse full lines.
    const lines = chunk.split('\n');
    const fullLines = lines.slice(0, -1);
    const tasks: QueueTask[] = [];

    for (const line of fullLines) {
      if (!line.trim()) continue;
      try {
        const t = JSON.parse(line) as QueueTask;
        if (t && t.runId && t.nodeId) tasks.push(t);
      } catch {
        // ignore malformed line
      }
      if (tasks.length >= limit) break;
    }

    return { ok: true as const, tasks, consumed: tasks.length, offsetBytes: st.offsetBytes };
  } finally {
    await fh.close();
  }
}

/**
 * Dequeue exactly one task (advances cursor) and writes a best-effort claim file.
 * This is deliberately simple (file-first); it prevents double-processing within
 * the same per-agent queue when multiple workers accidentally run.
 */
export async function dequeueNextTask(
  teamDir: string,
  agentId: string,
  opts?: { workerId?: string; leaseSeconds?: number }
) {
  const qPath = queuePathFor(teamDir, agentId);
  if (!(await fileExists(qPath))) {
    return { ok: true as const, task: null as DequeuedTask | null, message: 'Queue file not present.' };
  }

  const st = await loadState(teamDir, agentId);
  const fh = await fs.open(qPath, 'r');
  try {
    const stat = await fh.stat();
    if (st.offsetBytes >= stat.size) {
      return { ok: true as const, task: null as DequeuedTask | null, message: 'No new tasks.' };
    }

    const toRead = Math.min(stat.size - st.offsetBytes, 256 * 1024);
    const buf = Buffer.alloc(toRead);
    const { bytesRead } = await fh.read(buf, 0, toRead, st.offsetBytes);
    const chunk = buf.subarray(0, bytesRead).toString('utf8');

    const lines = chunk.split('\n');
    const fullLines = lines.slice(0, -1);
    let cursor = st.offsetBytes;

    for (const line of fullLines) {
      const lineBytes = Buffer.byteLength(line + '\n');
      const startOffsetBytes = cursor;
      const endOffsetBytes = cursor + lineBytes;
      cursor = endOffsetBytes;

      if (!line.trim()) {
        await writeState(teamDir, agentId, { offsetBytes: cursor, updatedAt: new Date().toISOString() });
        continue;
      }

      let t: QueueTask | null = null;
      try {
        t = JSON.parse(line) as QueueTask;
      } catch {
        // Malformed: skip it so we don't get stuck.
        await writeState(teamDir, agentId, { offsetBytes: cursor, updatedAt: new Date().toISOString() });
        continue;
      }

      if (!t || !t.id || !t.runId || !t.nodeId) {
        await writeState(teamDir, agentId, { offsetBytes: cursor, updatedAt: new Date().toISOString() });
        continue;
      }

      await ensureDir(claimsDir(teamDir));
      const claimPath = claimPathFor(teamDir, agentId, t.id);

      // Claim behavior:
      // - If unclaimed: create claim file.
      // - If already claimed by *this* workerId: allow re-processing (idempotent recovery).
      // - If claimed by another workerId:
      //    - if lease is expired: allow this worker to steal the claim
      //    - otherwise: skip
      const workerId = String(opts?.workerId ?? `worker:${process.pid}`);
      const leaseSeconds = typeof opts?.leaseSeconds === 'number' ? opts.leaseSeconds : undefined;
      const now = Date.now();

      async function writeClaim(overwrite: boolean) {
        const claim = {
          taskId: t!.id,
          agentId,
          workerId,
          claimedAt: new Date().toISOString(),
          leaseSeconds,
        };
        await fs.writeFile(claimPath, JSON.stringify(claim, null, 2), { encoding: 'utf8', flag: overwrite ? 'w' : 'wx' });
      }

      try {
        await writeClaim(false);
      } catch {
        try {
          const raw = await fs.readFile(claimPath, 'utf8');
          const existing = JSON.parse(raw) as { workerId?: string; claimedAt?: string; leaseSeconds?: number };

          // Same worker: allow idempotent re-processing.
          if (String(existing?.workerId ?? '') === workerId) {
            // proceed
          } else {
            const existingLease = typeof existing?.leaseSeconds === 'number' ? existing.leaseSeconds : undefined;
            const effectiveLease = typeof leaseSeconds === 'number' ? leaseSeconds : existingLease;
            const claimedAtMs = existing?.claimedAt ? Date.parse(String(existing.claimedAt)) : NaN;
            const expired = typeof effectiveLease === 'number' && Number.isFinite(claimedAtMs) && now - claimedAtMs > effectiveLease * 1000;

            if (!expired) {
              await writeState(teamDir, agentId, { offsetBytes: cursor, updatedAt: new Date().toISOString() });
              continue;
            }

            // Lease expired: steal.
            await writeClaim(true);
          }
        } catch {
          await writeState(teamDir, agentId, { offsetBytes: cursor, updatedAt: new Date().toISOString() });
          continue;
        }
      }

      await writeState(teamDir, agentId, { offsetBytes: cursor, updatedAt: new Date().toISOString() });
      return {
        ok: true as const,
        task: { task: t, startOffsetBytes, endOffsetBytes },
      };
    }

    return { ok: true as const, task: null as DequeuedTask | null, message: 'No full line available yet.' };
  } finally {
    await fh.close();
  }
}
