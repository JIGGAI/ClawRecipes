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
  } catch { // intentional: best-effort file existence check
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

async function loadClaim(teamDir: string, agentId: string, taskId: string) {
  const p = claimPathFor(teamDir, agentId, taskId);
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw) as { workerId?: string; claimedAt?: string; leaseSeconds?: number };
  } catch { // intentional: best-effort JSON parse
    return null;
  }
}

function isExpiredClaim(claim: { claimedAt?: string; leaseSeconds?: number } | null | undefined, fallbackLeaseSeconds?: number) {
  if (!claim) return false;
  const effectiveLease = typeof claim.leaseSeconds === 'number' ? claim.leaseSeconds : fallbackLeaseSeconds;
  const claimedAtMs = claim.claimedAt ? Date.parse(String(claim.claimedAt)) : NaN;
  return typeof effectiveLease === 'number' && Number.isFinite(claimedAtMs) && Date.now() - claimedAtMs > effectiveLease * 1000;
}

export async function releaseTaskClaim(teamDir: string, agentId: string, taskId: string) {
  try {
    await fs.unlink(claimPathFor(teamDir, agentId, taskId));
  } catch { // intentional: best-effort claim cleanup
    // ignore missing claims
  }
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
  } catch { // intentional: best-effort state parse, reset to defaults
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
      } catch { // intentional: skip malformed queue line
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
  const workerId = String(opts?.workerId ?? `worker:${process.pid}`);
  const leaseSeconds = typeof opts?.leaseSeconds === 'number' ? opts.leaseSeconds : undefined;

  async function tryClaimTask(t: QueueTask, startOffsetBytes: number, endOffsetBytes: number, advanceState: boolean) {
    await ensureDir(claimsDir(teamDir));
    const claimPath = claimPathFor(teamDir, agentId, t.id);

    async function writeClaim(overwrite: boolean) {
      const claim = {
        taskId: t.id,
        agentId,
        workerId,
        claimedAt: new Date().toISOString(),
        leaseSeconds,
      };
      await fs.writeFile(claimPath, JSON.stringify(claim, null, 2), { encoding: 'utf8', flag: overwrite ? 'w' : 'wx' });
    }

    try {
      await writeClaim(false);
    } catch { // intentional: lock contention — check existing claim
      const existing = await loadClaim(teamDir, agentId, t.id);
      if (String(existing?.workerId ?? '') !== workerId) {
        if (!isExpiredClaim(existing, leaseSeconds)) {
          if (advanceState) {
            await writeState(teamDir, agentId, { offsetBytes: endOffsetBytes, updatedAt: new Date().toISOString() });
          }
          return null;
        }
        await writeClaim(true);
      }
    }

    if (advanceState) {
      await writeState(teamDir, agentId, { offsetBytes: endOffsetBytes, updatedAt: new Date().toISOString() });
    }
    return {
      ok: true as const,
      task: { task: t, startOffsetBytes, endOffsetBytes },
    };
  }

  const fh = await fs.open(qPath, 'r');
  try {
    const stat = await fh.stat();
    if (st.offsetBytes < stat.size) {
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
        } catch { // intentional: skip malformed queue line
          await writeState(teamDir, agentId, { offsetBytes: cursor, updatedAt: new Date().toISOString() });
          continue;
        }

        if (!t || !t.id || !t.runId || !t.nodeId) {
          await writeState(teamDir, agentId, { offsetBytes: cursor, updatedAt: new Date().toISOString() });
          continue;
        }

        const claimed = await tryClaimTask(t, startOffsetBytes, endOffsetBytes, true);
        if (claimed) return claimed;
      }
    }

    // Recovery scan: if the cursor has already advanced, revisit older tasks that still have
    // a live claim file and whose lease has expired. This prevents claimed-then-crashed workers
    // from permanently orphaning tasks behind offsetBytes.
    const fullRaw = await fs.readFile(qPath, 'utf8');
    let cursor = 0;
    for (const line of fullRaw.split('\n')) {
      const lineBytes = Buffer.byteLength(line + '\n');
      const startOffsetBytes = cursor;
      const endOffsetBytes = cursor + lineBytes;
      cursor = endOffsetBytes;
      if (!line.trim()) continue;
      let t: QueueTask | null = null;
      try {
        t = JSON.parse(line) as QueueTask;
      } catch { // intentional: skip malformed queue line
        continue;
      }
      if (!t || !t.id || !t.runId || !t.nodeId) continue;
      const existing = await loadClaim(teamDir, agentId, t.id);
      if (!existing) continue;
      if (String(existing.workerId ?? '') !== workerId && !isExpiredClaim(existing, leaseSeconds)) continue;
      const claimed = await tryClaimTask(t, startOffsetBytes, endOffsetBytes, false);
      if (claimed) return claimed;
    }

    return { ok: true as const, task: null as DequeuedTask | null, message: 'No new or recoverable tasks.' };
  } finally {
    await fh.close();
  }
}

/**
 * Compact a per-agent queue file by discarding all entries before the current cursor offset.
 * This prevents unbounded queue growth from old processed/stale entries.
 *
 * Safe to call periodically (e.g. at the end of a worker-tick).
 * Only compacts when the consumed prefix exceeds `minWasteBytes` (default 4 KB).
 */
export async function compactQueue(teamDir: string, agentId: string, opts?: { minWasteBytes?: number }) {
  const minWaste = typeof opts?.minWasteBytes === 'number' ? opts.minWasteBytes : 4096;
  const qPath = queuePathFor(teamDir, agentId);
  if (!(await fileExists(qPath))) return { ok: true as const, compacted: false, reason: 'no queue file' };

  const st = await loadState(teamDir, agentId);
  if (st.offsetBytes < minWaste) return { ok: true as const, compacted: false, reason: 'below threshold' };

  // Read the full file, keep only the portion after the cursor.
  const raw = await fs.readFile(qPath);
  const remaining = raw.subarray(st.offsetBytes);

  // Atomic-ish write: write to temp then rename.
  const tmpPath = qPath + '.compact.tmp';
  await fs.writeFile(tmpPath, remaining);
  await fs.rename(tmpPath, qPath);

  // Reset offset to 0 since we removed the consumed prefix.
  await writeState(teamDir, agentId, { offsetBytes: 0, updatedAt: new Date().toISOString() });

  // Also clean up stale claim files for this agent (expired leases with no matching pending task).
  try {
    const claimsBase = claimsDir(teamDir);
    if (await fileExists(claimsBase)) {
      const prefix = `${agentId}.`;
      const files = (await fs.readdir(claimsBase)).filter((f) => f.startsWith(prefix) && f.endsWith('.json'));
      for (const f of files) {
        try {
          const claimRaw = await fs.readFile(path.join(claimsBase, f), 'utf8');
          const claim = JSON.parse(claimRaw) as { claimedAt?: string; leaseSeconds?: number };
          if (isExpiredClaim(claim, 120)) {
            await fs.unlink(path.join(claimsBase, f));
          }
        } catch { /* intentional: best-effort stale claim cleanup */ }
      }
    }
  } catch { /* intentional: best-effort claims cleanup */ }

  return { ok: true as const, compacted: true, removedBytes: st.offsetBytes, remainingBytes: remaining.length };
}
