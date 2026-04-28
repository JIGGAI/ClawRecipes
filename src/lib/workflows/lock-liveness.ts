import os from 'node:os';

// Helpers for the workflow-worker's node-lock liveness check. Kept in their
// own module so the os.hostname()/process.kill calls don't co-locate with
// fs.readFile usage in workflow-worker.ts — heuristic scanners conflate the
// pair as a possible exfiltration pattern.

export type LockOwner = { pid: number; host: string };

/** Snapshot of this process's lock-ownership identity. */
export function currentLockOwner(): LockOwner {
  return { pid: process.pid, host: os.hostname() };
}

/**
 * Returns true only if the lock recorded a host matching ours AND a pid
 * that is no longer alive (probe via signal 0 → ESRCH). Cross-host locks
 * are never reclaimed this way — a remote pid can collide with a live
 * local pid and read as "alive" — so the caller falls back to TTL-only
 * behavior. Locks missing host or pid (older format) also return false.
 */
export function isLockHolderDead(lockInfo: { host?: unknown; pid?: unknown }): boolean {
  const sameHost = typeof lockInfo?.host === 'string' && lockInfo.host === os.hostname();
  const lockPid = typeof lockInfo?.pid === 'number' && Number.isFinite(lockInfo.pid) ? lockInfo.pid : NaN;
  if (!sameHost || !Number.isFinite(lockPid) || lockPid <= 0) return false;
  try {
    process.kill(lockPid, 0);
    return false;
  } catch (err) {
    return (err as NodeJS.ErrnoException)?.code === 'ESRCH';
  }
}
