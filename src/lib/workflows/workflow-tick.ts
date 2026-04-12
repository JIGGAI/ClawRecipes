import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { resolveTeamDir } from '../workspace';
import type { RunLog } from './workflow-types';
import { enqueueTask } from './workflow-queue';
import { readTextFile } from './workflow-runner-io';
import {
  normalizeWorkflow,
  fileExists,
  appendRunLog, writeRunFile, loadRunFile,
  pickNextRunnableNodeIndex,
} from './workflow-utils';

// eslint-disable-next-line complexity, max-lines-per-function
export async function runWorkflowRunnerTick(api: OpenClawPluginApi, opts: {
  teamId: string;
  concurrency?: number;
  leaseSeconds?: number;
}) {
  const teamId = String(opts.teamId);
  const teamDir = resolveTeamDir(api, teamId);
  const sharedContextDir = path.join(teamDir, 'shared-context');
  const runsDir = path.join(sharedContextDir, 'workflow-runs');
  const workflowsDir = path.join(sharedContextDir, 'workflows');

  if (!(await fileExists(runsDir))) {
    return { ok: true as const, teamId, claimed: 0, message: 'No workflow-runs directory present.' };
  }

  const concurrency = typeof opts.concurrency === 'number' && opts.concurrency > 0 ? Math.floor(opts.concurrency) : 1;
  const leaseSeconds = typeof opts.leaseSeconds === 'number' && opts.leaseSeconds > 0 ? opts.leaseSeconds : 300;
  const now = Date.now();

  const entries = await fs.readdir(runsDir);
  const candidates: Array<{ file: string; run: RunLog }> = [];

  for (const e of entries) {
    const abs = path.join(runsDir, e);

    let runPath: string | null = null;
    try {
      const st = await fs.stat(abs);
      if (st.isDirectory()) {
        const p = path.join(abs, 'run.json');
        if (await fileExists(p)) runPath = p;
      }
    } catch { // intentional: best-effort directory traversal
      // ignore
    }

    if (!runPath) continue;

    try {
      const run = JSON.parse(await readTextFile(runPath)) as RunLog;
      const st = String(run.status ?? '');
      if (st !== 'queued' && st !== 'paused') continue;

      // Paused runs (delay node): only resume once resumeAt has passed.
      if (st === 'paused') {
        const resumeAtRaw = String(run.resumeAt ?? '').trim();
        const resumeMs = resumeAtRaw ? Date.parse(resumeAtRaw) : NaN;
        if (!Number.isFinite(resumeMs) || Date.now() < resumeMs) continue;
      }

      const exp = run.claimExpiresAt ? Date.parse(String(run.claimExpiresAt)) : 0;
      const claimed = !!run.claimedBy && exp > now;
      if (claimed) continue;
      candidates.push({ file: runPath, run });
    } catch { // intentional: skip malformed run.json
      // ignore parse errors
    }
  }

  if (!candidates.length) {
    return { ok: true as const, teamId, claimed: 0, message: 'No queued runs available.' };
  }

  candidates.sort((a, b) => {
    const pa = typeof a.run.priority === 'number' ? a.run.priority : 0;
    const pb = typeof b.run.priority === 'number' ? b.run.priority : 0;
    if (pa !== pb) return pb - pa;
    return String(a.run.createdAt).localeCompare(String(b.run.createdAt));
  });

  const runnerIdBase = `workflow-runner:${process.pid}`;

  async function tryClaim(runPath: string): Promise<RunLog | null> {
    const raw = await readTextFile(runPath);
    const cur = JSON.parse(raw) as RunLog;
    const st = String(cur.status ?? '');
    if (st !== 'queued' && st !== 'paused') return null;
    if (st === 'paused') {
      const resumeAtRaw = String(cur.resumeAt ?? '').trim();
      const resumeMs = resumeAtRaw ? Date.parse(resumeAtRaw) : NaN;
      if (!Number.isFinite(resumeMs) || Date.now() < resumeMs) return null;
    }
    const exp = cur.claimExpiresAt ? Date.parse(String(cur.claimExpiresAt)) : 0;
    const claimed = !!cur.claimedBy && exp > Date.now();
    if (claimed) return null;

    const claimExpiresAt = new Date(Date.now() + leaseSeconds * 1000).toISOString();
    const claimedBy = `${runnerIdBase}:${crypto.randomBytes(3).toString('hex')}`;

    const next: RunLog = {
      ...cur,
      updatedAt: new Date().toISOString(),
      status: 'running',
      resumeAt: null,
      claimedBy,
      claimExpiresAt,
      events: [...(cur.events ?? []), { ts: new Date().toISOString(), type: 'run.claimed', claimedBy, claimExpiresAt }],
    };

    await fs.writeFile(runPath, JSON.stringify(next, null, 2), 'utf8');
    return next;
  }

  const claimed: Array<{ file: string; run: RunLog }> = [];
  for (const c of candidates) {
    if (claimed.length >= concurrency) break;
    const run = await tryClaim(c.file);
    if (run) claimed.push({ file: c.file, run });
  }

  if (!claimed.length) {
    return { ok: true as const, teamId, claimed: 0, message: 'No queued runs available (raced on claim).' };
  }

  async function execClaimed(runPath: string, run: RunLog) {
    const workflowFile = String(run.workflow.file);
    const workflowPath = path.join(workflowsDir, workflowFile);
    const workflowRaw = await readTextFile(workflowPath);
    const workflow = normalizeWorkflow(JSON.parse(workflowRaw));

    try {
      // Scheduler-only: do NOT execute nodes directly here.
      // Instead, enqueue the next runnable node onto the assigned agent's pull queue.
      // Graph-aware: if workflow.edges exist, choose the next runnable node by edge conditions.

      let runCur = (await loadRunFile(teamDir, runsDir, run.runId)).run;
      let idx = pickNextRunnableNodeIndex({ workflow, run: runCur });

      // Auto-complete start/end nodes.
      while (idx !== null) {
        const n = workflow.nodes[idx]!;
        const k = String(n.kind ?? '');
        if (k !== 'start' && k !== 'end') break;
        const ts = new Date().toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          nextNodeIndex: idx! + 1,
          nodeStates: { ...(cur.nodeStates ?? {}), [n.id]: { status: 'success', ts } },
          events: [...cur.events, { ts, type: 'node.completed', nodeId: n.id, kind: k, noop: true }],
          nodeResults: [...(cur.nodeResults ?? []), { nodeId: n.id, kind: k, noop: true }],
        }));
        runCur = (await loadRunFile(teamDir, runsDir, run.runId)).run;
        idx = pickNextRunnableNodeIndex({ workflow, run: runCur });
      }

      if (idx === null) {
        await writeRunFile(runPath, (cur) => ({
          ...cur,
          updatedAt: new Date().toISOString(),
          status: 'completed',
          claimedBy: null,
          claimExpiresAt: null,
          nextNodeIndex: cur.nextNodeIndex,
          events: [...cur.events, { ts: new Date().toISOString(), type: 'run.completed' }],
        }));
        return { runId: run.runId, status: 'completed' };
      }

      const node = workflow.nodes[idx]!;
      const assignedAgentId = String(node?.assignedTo?.agentId ?? '').trim();
      if (!assignedAgentId) throw new Error(`Node ${node.id} missing assignedTo.agentId (required for pull-based execution)`);

      await enqueueTask(teamDir, assignedAgentId, {
        teamId,
        runId: run.runId,
        nodeId: node.id,
        kind: 'execute_node',
      });

      await writeRunFile(runPath, (cur) => ({
        ...cur,
        updatedAt: new Date().toISOString(),
        status: 'waiting_workers',
        claimedBy: null,
        claimExpiresAt: null,
        nextNodeIndex: idx,
        events: [...cur.events, { ts: new Date().toISOString(), type: 'node.enqueued', nodeId: node.id, agentId: assignedAgentId }],
      }));

      return { runId: run.runId, status: 'waiting_workers' };
    } catch (e) {
      await writeRunFile(runPath, (cur) => ({
        ...cur,
        updatedAt: new Date().toISOString(),
        status: 'error',
        claimedBy: null,
        claimExpiresAt: null,
        events: [...cur.events, { ts: new Date().toISOString(), type: 'run.error', message: (e as Error).message }],
      }));
      return { runId: run.runId, status: 'error', error: (e as Error).message };
    }
  }

  const results = await Promise.all(claimed.map((c) => execClaimed(c.file, c.run)));
  return { ok: true as const, teamId, claimed: claimed.length, results };
}
