import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { resolveTeamDir } from '../workspace';
import type { WorkflowLane, RunLog } from './workflow-types';
import { enqueueTask } from './workflow-queue';
import { readTextFile } from './workflow-runner-io';
import {
  normalizeWorkflow,
  isoCompact, assertLane,
  ensureDir, fileExists,
  nextTicketNumber, laneToStatus,
  appendRunLog, writeRunFile, loadRunFile,
  pickNextRunnableNodeIndex,
} from './workflow-utils';
import { executeWorkflowNodes } from './workflow-node-executor';

// Re-export all decomposed modules so existing consumers don't break.
export * from './workflow-utils';
export * from './workflow-node-executor';
export * from './workflow-worker';
export * from './workflow-tick';
export * from './workflow-approvals';
export * from './workflow-if';

export async function enqueueWorkflowRun(api: OpenClawPluginApi, opts: {
  teamId: string;
  workflowFile: string; // filename under shared-context/workflows/
  trigger?: { kind: string; at?: string };
}) {
  const teamId = String(opts.teamId);
  const teamDir = resolveTeamDir(api, teamId);
  const sharedContextDir = path.join(teamDir, 'shared-context');
  const workflowsDir = path.join(sharedContextDir, 'workflows');
  const runsDir = path.join(sharedContextDir, 'workflow-runs');

  const workflowPath = path.join(workflowsDir, opts.workflowFile);
  const raw = await readTextFile(workflowPath);
  const workflow = normalizeWorkflow(JSON.parse(raw));

  if (!workflow.nodes?.length) throw new Error('Workflow has no nodes');

  // Determine initial lane from first node that declares lane.
  const firstLaneRaw = String(workflow.nodes.find(n => n?.config && typeof n.config === 'object' && 'lane' in n.config)?.config?.lane ?? 'backlog');
  assertLane(firstLaneRaw);
  const initialLane: WorkflowLane = firstLaneRaw;

  const runId = `${isoCompact()}-${crypto.randomBytes(4).toString('hex')}`;
  await ensureDir(runsDir);

  // n8n-inspired: one folder per run.
  const runDir = path.join(runsDir, runId);
  await ensureDir(runDir);
  await Promise.all([
    ensureDir(path.join(runDir, 'node-outputs')),
    ensureDir(path.join(runDir, 'artifacts')),
    ensureDir(path.join(runDir, 'approvals')),
  ]);

  const runLogPath = path.join(runDir, 'run.json');

  const ticketNum = await nextTicketNumber(teamDir);
  const slug = `workflow-run-${(workflow.id ?? path.basename(opts.workflowFile, path.extname(opts.workflowFile))).replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}`;
  const ticketFile = `${ticketNum}-${slug}.md`;

  const laneDir = path.join(teamDir, 'work', initialLane);
  await ensureDir(laneDir);
  const ticketPath = path.join(laneDir, ticketFile);

  const header = `# ${ticketNum} — Workflow run: ${workflow.name ?? workflow.id ?? opts.workflowFile}\n\n`;
  const md = [
    header,
    `Owner: lead`,
    `Status: ${laneToStatus(initialLane)}`,
    `\n## Run`,
    `- workflow: ${path.relative(teamDir, workflowPath)}`,
    `- run dir: ${path.relative(teamDir, path.dirname(runLogPath))}`,
    `- run file: ${path.relative(teamDir, runLogPath)}`,
    `- trigger: ${opts.trigger?.kind ?? 'manual'}${opts.trigger?.at ? ` @ ${opts.trigger.at}` : ''}`,
    `- runId: ${runId}`,
    `\n## Notes`,
    `- Created by: openclaw recipes workflows run (enqueue-only)`,
    ``,
  ].join('\n');

  const createdAt = new Date().toISOString();
  const trigger = opts.trigger ?? { kind: 'manual' };

  const initialLog: RunLog = {
    runId,
    createdAt,
    updatedAt: createdAt,
    teamId,
    workflow: { file: opts.workflowFile, id: workflow.id ?? null, name: workflow.name ?? null },
    ticket: { file: path.relative(teamDir, ticketPath), number: ticketNum, lane: initialLane },
    trigger,
    status: 'queued',
    priority: 0,
    claimedBy: null,
    claimExpiresAt: null,
    nextNodeIndex: 0,
    events: [{ ts: createdAt, type: 'run.enqueued', lane: initialLane }],
    nodeResults: [],
  };

  await Promise.all([
    fs.writeFile(ticketPath, md, 'utf8'),
    fs.writeFile(runLogPath, JSON.stringify(initialLog, null, 2), 'utf8'),
  ]);

  return {
    ok: true as const,
    teamId,
    teamDir,
    workflowPath,
    runId,
    runLogPath,
    ticketPath,
    lane: initialLane,
    status: 'queued' as const,
  };
}

export async function runWorkflowRunnerOnce(api: OpenClawPluginApi, opts: {
  teamId: string;
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

  const leaseSeconds = typeof opts.leaseSeconds === 'number' && opts.leaseSeconds > 0 ? opts.leaseSeconds : 60;
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
    if (pa != pb) return pb - pa;
    return String(a.run.createdAt).localeCompare(String(b.run.createdAt));
  });

  const chosen = candidates[0]!;
  const runnerId = `workflow-runner:${process.pid}`;
  const claimExpiresAt = new Date(Date.now() + leaseSeconds * 1000).toISOString();

  await writeRunFile(chosen.file, (cur) => ({
    ...cur,
    updatedAt: new Date().toISOString(),
    status: 'running',
    claimedBy: runnerId,
    claimExpiresAt,
    events: [...cur.events, { ts: new Date().toISOString(), type: 'run.claimed', claimedBy: runnerId, claimExpiresAt }],
  }));

  const workflowFile = String(chosen.run.workflow.file);
  const workflowPath = path.join(workflowsDir, workflowFile);
  const workflowRaw = await readTextFile(workflowPath);
  const workflow = normalizeWorkflow(JSON.parse(workflowRaw));


  try {
    // Scheduler-only: enqueue the next runnable node onto the assigned agent's pull queue.
    // Graph-aware: if workflow.edges exist, choose the next runnable node by edge conditions.

    let runCur = (await loadRunFile(teamDir, runsDir, chosen.run.runId)).run;
    let idx = pickNextRunnableNodeIndex({ workflow, run: runCur });

    // Auto-complete start/end nodes (they exist in UI workflows but are no-op for the runner).
    while (idx !== null) {
      const n = workflow.nodes[idx]!;
      const k = String(n.kind ?? '');
      if (k !== 'start' && k !== 'end') break;
      const ts = new Date().toISOString();
      await appendRunLog(chosen.file, (cur) => ({
        ...cur,
        nextNodeIndex: idx! + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [n.id]: { status: 'success', ts } },
        events: [...cur.events, { ts, type: 'node.completed', nodeId: n.id, kind: k, noop: true }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: n.id, kind: k, noop: true }],
      }));
      runCur = (await loadRunFile(teamDir, runsDir, chosen.run.runId)).run;
      idx = pickNextRunnableNodeIndex({ workflow, run: runCur });
    }

    if (idx === null) {
      await writeRunFile(chosen.file, (cur) => ({
        ...cur,
        updatedAt: new Date().toISOString(),
        status: 'completed',
        claimedBy: null,
        claimExpiresAt: null,
        nextNodeIndex: cur.nextNodeIndex,
        events: [...cur.events, { ts: new Date().toISOString(), type: 'run.completed' }],
      }));
      return { ok: true as const, teamId, claimed: 1, runId: chosen.run.runId, status: 'completed' as const };
    }

    const node = workflow.nodes[idx]!;
    const assignedAgentId = String(node?.assignedTo?.agentId ?? '').trim();
    if (!assignedAgentId) throw new Error(`Node ${node.id} missing assignedTo.agentId (required for pull-based execution)`);

    await enqueueTask(teamDir, assignedAgentId, {
      teamId,
      runId: chosen.run.runId,
      nodeId: node.id,
      kind: 'execute_node',
    });

    await writeRunFile(chosen.file, (cur) => ({
      ...cur,
      updatedAt: new Date().toISOString(),
      status: 'waiting_workers',
      claimedBy: null,
      claimExpiresAt: null,
      nextNodeIndex: idx,
      events: [...cur.events, { ts: new Date().toISOString(), type: 'node.enqueued', nodeId: node.id, agentId: assignedAgentId }],
    }));

    return { ok: true as const, teamId, claimed: 1, runId: chosen.run.runId, status: 'waiting_workers' as const };
  } catch (e) {
    await writeRunFile(chosen.file, (cur) => ({
      ...cur,
      updatedAt: new Date().toISOString(),
      status: 'error',
      claimedBy: null,
      claimExpiresAt: null,
      events: [...cur.events, { ts: new Date().toISOString(), type: 'run.error', message: (e as Error).message }],
    }));
    throw e;
  }
}

// eslint-disable-next-line complexity, max-lines-per-function
export async function runWorkflowOnce(api: OpenClawPluginApi, opts: {
  teamId: string;
  workflowFile: string; // filename under shared-context/workflows/
  trigger?: { kind: string; at?: string };
}) {
  const teamId = String(opts.teamId);
  const teamDir = resolveTeamDir(api, teamId);
  const sharedContextDir = path.join(teamDir, 'shared-context');
  const workflowsDir = path.join(sharedContextDir, 'workflows');
  const runsDir = path.join(sharedContextDir, 'workflow-runs');

  const workflowPath = path.join(workflowsDir, opts.workflowFile);
  const raw = await readTextFile(workflowPath);
  const workflow = normalizeWorkflow(JSON.parse(raw));

  if (!workflow.nodes?.length) throw new Error('Workflow has no nodes');

  // Determine initial lane from first node that declares lane.
  const firstLaneRaw = String(workflow.nodes.find(n => n?.config && typeof n.config === 'object' && 'lane' in n.config)?.config?.lane ?? 'backlog');
  assertLane(firstLaneRaw);
  const initialLane: WorkflowLane = firstLaneRaw;

  const runId = `${isoCompact()}-${crypto.randomBytes(4).toString('hex')}`;
  await ensureDir(runsDir);
  const runLogPath = path.join(runsDir, `${runId}.json`);

  const ticketNum = await nextTicketNumber(teamDir);
  const slug = `workflow-run-${(workflow.id ?? path.basename(opts.workflowFile, path.extname(opts.workflowFile))).replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}`;
  const ticketFile = `${ticketNum}-${slug}.md`;

  const laneDir = path.join(teamDir, 'work', initialLane);
  await ensureDir(laneDir);
  const ticketPath = path.join(laneDir, ticketFile);

  const header = `# ${ticketNum} — Workflow run: ${workflow.name ?? workflow.id ?? opts.workflowFile}\n\n`;
  const md = [
    header,
    `Owner: lead`,
    `Status: ${laneToStatus(initialLane)}`,
    `\n## Run`,
    `- workflow: ${path.relative(teamDir, workflowPath)}`,
    `- run log: ${path.relative(teamDir, runLogPath)}`,
    `- trigger: ${opts.trigger?.kind ?? 'manual'}${opts.trigger?.at ? ` @ ${opts.trigger.at}` : ''}`,
    `- runId: ${runId}`,
    `\n## Notes`,
    `- Created by: openclaw recipes workflows run`,
    ``,
  ].join('\n');

  const createdAt = new Date().toISOString();
  const trigger = opts.trigger ?? { kind: 'manual' };

  const initialLog: RunLog = {
    runId,
    createdAt,
    teamId,
    workflow: { file: opts.workflowFile, id: workflow.id ?? null, name: workflow.name ?? null },
    ticket: { file: path.relative(teamDir, ticketPath), number: ticketNum, lane: initialLane },
    trigger,
    status: 'running',
    events: [{ ts: createdAt, type: 'run.created', lane: initialLane }],
    nodeResults: [],
  };

  await Promise.all([
    fs.writeFile(ticketPath, md, 'utf8'),
    fs.writeFile(runLogPath, JSON.stringify(initialLog, null, 2), 'utf8'),
  ]);

  const execRes = await executeWorkflowNodes({
    api,
    teamId,
    teamDir,
    workflow,
    workflowPath,
    workflowFile: opts.workflowFile,
    runId,
    runLogPath,
    ticketPath,
    initialLane,
  });

  return {
    ok: true as const,
    teamId,
    teamDir,
    workflowPath,
    runId,
    runLogPath,
    ticketPath: execRes.ticketPath,
    lane: execRes.lane,
    status: execRes.status,
  };
}
