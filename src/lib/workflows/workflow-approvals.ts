import fs from 'node:fs/promises';
import path from 'node:path';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { resolveTeamDir } from '../workspace';
import type { ApprovalRecord } from './workflow-types';
import { enqueueTask } from './workflow-queue';
import { readTextFile, readJsonFile } from './workflow-runner-io';
import {
  asRecord, asString,
  normalizeWorkflow,
  fileExists,
  appendRunLog, writeRunFile, loadRunFile,
  pickNextRunnableNodeIndex,
} from './workflow-utils';

async function approvalsPathFor(teamDir: string, runId: string) {
  const runsDir = path.join(teamDir, 'shared-context', 'workflow-runs');
  return path.join(runsDir, runId, 'approvals', 'approval.json');
}

export async function pollWorkflowApprovals(api: OpenClawPluginApi, opts: {
  teamId: string;
  limit?: number;
}) {
  const teamId = String(opts.teamId);
  const teamDir = resolveTeamDir(api, teamId);
  const runsDir = path.join(teamDir, 'shared-context', 'workflow-runs');

  if (!(await fileExists(runsDir))) {
    return { ok: true as const, teamId, polled: 0, resumed: 0, skipped: 0, message: 'No workflow-runs directory present.' };
  }

  const approvalPaths: string[] = [];
  const entries = await fs.readdir(runsDir);
  for (const e of entries) {
    const p = path.join(runsDir, e, 'approvals', 'approval.json');
    if (await fileExists(p)) approvalPaths.push(p);
  }

  const limitedPaths = approvalPaths.slice(0, typeof opts.limit === 'number' && opts.limit > 0 ? opts.limit : undefined);
  if (!limitedPaths.length) {
    return { ok: true as const, teamId, polled: 0, resumed: 0, skipped: 0, message: 'No approval records present.' };
  }

  let resumed = 0;
  let skipped = 0;
  const results: Array<{ runId: string; status: string; action: 'resumed' | 'skipped' | 'error'; message?: string }> = [];

  for (const approvalPath of limitedPaths) {
    let approval: ApprovalRecord;
    try {
      approval = await readJsonFile<ApprovalRecord>(approvalPath);
    } catch (e) {
      skipped++;
      results.push({ runId: path.basename(path.dirname(path.dirname(approvalPath))), status: 'unknown', action: 'error', message: `Failed to parse: ${(e as Error).message}` });
      continue;
    }

    if (approval.status === 'pending') {
      skipped++;
      results.push({ runId: approval.runId, status: approval.status, action: 'skipped' });
      continue;
    }

    if (approval.resumedAt) {
      skipped++;
      results.push({ runId: approval.runId, status: approval.status, action: 'skipped', message: 'Already resumed.' });
      continue;
    }

    try {
      const res = await resumeWorkflowRun(api, { teamId, runId: approval.runId });
      resumed++;
      results.push({ runId: approval.runId, status: approval.status, action: 'resumed', message: `resume status=${(res as { status?: string }).status ?? 'ok'}` });
      const next: ApprovalRecord = {
        ...approval,
        resumedAt: new Date().toISOString(),
        resumedStatus: String((res as { status?: string }).status ?? 'ok'),
      };
      await fs.writeFile(approvalPath, JSON.stringify(next, null, 2), 'utf8');
    } catch (e) {
      results.push({ runId: approval.runId, status: approval.status, action: 'error', message: (e as Error).message });
      const next: ApprovalRecord = {
        ...approval,
        resumedAt: new Date().toISOString(),
        resumedStatus: 'error',
        resumeError: (e as Error).message,
      };
      await fs.writeFile(approvalPath, JSON.stringify(next, null, 2), 'utf8');
    }
  }

  return { ok: true as const, teamId, polled: limitedPaths.length, resumed, skipped, results };
}

export async function approveWorkflowRun(api: OpenClawPluginApi, opts: {
  teamId: string;
  runId: string;
  approved: boolean;
  note?: string;
}) {
  const teamId = String(opts.teamId);
  const runId = String(opts.runId);
  const teamDir = resolveTeamDir(api, teamId);

  const approvalPath = await approvalsPathFor(teamDir, runId);
  if (!(await fileExists(approvalPath))) {
    throw new Error(`Approval file not found for runId=${runId}: ${path.relative(teamDir, approvalPath)}`);
  }
  const raw = await readTextFile(approvalPath);
  const cur = JSON.parse(raw) as ApprovalRecord;
  const next: ApprovalRecord = {
    ...cur,
    status: opts.approved ? 'approved' : 'rejected',
    decidedAt: new Date().toISOString(),
    ...(opts.note ? { note: String(opts.note) } : {}),
  };
  await fs.writeFile(approvalPath, JSON.stringify(next, null, 2), 'utf8');

  return { ok: true as const, runId, status: next.status, approvalFile: path.relative(teamDir, approvalPath) };
}

export async function resumeWorkflowRun(api: OpenClawPluginApi, opts: {
  teamId: string;
  runId: string;
}) {
  const teamId = String(opts.teamId);
  const runId = String(opts.runId);
  const teamDir = resolveTeamDir(api, teamId);
  const sharedContextDir = path.join(teamDir, 'shared-context');
  const runsDir = path.join(sharedContextDir, 'workflow-runs');
  const workflowsDir = path.join(sharedContextDir, 'workflows');

  const loaded = await loadRunFile(teamDir, runsDir, runId);
  const runLogPath = loaded.path;
  const runLog = loaded.run;

  if (runLog.status === 'completed' || runLog.status === 'rejected') {
    return { ok: true as const, runId, status: runLog.status, message: 'No-op; run already finished.' };
  }
  if (runLog.status !== 'awaiting_approval' && runLog.status !== 'running') {
    throw new Error(`Run is not awaiting approval (status=${runLog.status}).`);
  }

  const workflowFile = String(runLog.workflow.file);
  const workflowPath = path.join(workflowsDir, workflowFile);
  const workflowRaw = await readTextFile(workflowPath);
  const workflow = normalizeWorkflow(JSON.parse(workflowRaw));

  const approvalPath = await approvalsPathFor(teamDir, runId);
  if (!(await fileExists(approvalPath))) throw new Error(`Missing approval file: ${path.relative(teamDir, approvalPath)}`);
  const approvalRaw = await readTextFile(approvalPath);
  const approval = JSON.parse(approvalRaw) as ApprovalRecord;
  if (approval.status === 'pending') {
    throw new Error(`Approval still pending. Update ${path.relative(teamDir, approvalPath)} first.`);
  }

  const ticketPath = path.join(teamDir, runLog.ticket.file);

  // Find the approval node index.
  const approvalIdx = workflow.nodes.findIndex((n) => n.kind === 'human_approval' && String(n.id) === String(approval.nodeId));
  if (approvalIdx < 0) throw new Error(`Approval node not found in workflow: nodeId=${approval.nodeId}`);

  if (approval.status === 'rejected') {
    // Denial flow: mark run as needs_revision and loop back to the draft step (or closest prior llm node).
    // This keeps workflows non-terminal on rejection.

    const approvalNote = String(approval.note ?? '').trim();

    // Find a reasonable "revise" node: prefer a node with id=draft_assets, else the closest prior llm node.
    let reviseIdx = workflow.nodes.findIndex((n, idx) => idx < approvalIdx && String(n.id) === 'draft_assets');
    if (reviseIdx < 0) {
      for (let i = approvalIdx - 1; i >= 0; i--) {
        if (workflow.nodes[i]?.kind === 'llm') {
          reviseIdx = i;
          break;
        }
      }
    }
    if (reviseIdx < 0) reviseIdx = 0;

    const reviseNode = workflow.nodes[reviseIdx]!;
    const reviseAgentId = String(reviseNode?.assignedTo?.agentId ?? '').trim();
    if (!reviseAgentId) throw new Error(`Revision node ${reviseNode.id} missing assignedTo.agentId`);

    // Mark run state as needing revision, and clear nodeStates for nodes from reviseIdx onward.
    const now = new Date().toISOString();
    await writeRunFile(runLogPath, (cur) => {
      const nextStates: Record<string, { status: 'success' | 'error' | 'waiting'; ts: string; message?: string }> = {
        ...(cur.nodeStates ?? {}),
        [approval.nodeId]: { status: 'error', ts: now, message: 'rejected' },
      };
      for (let i = reviseIdx; i < (workflow.nodes?.length ?? 0); i++) {
        const id = String(workflow.nodes[i]?.id ?? '').trim();
        if (id) delete nextStates[id];
      }
      return {
        ...cur,
        updatedAt: now,
        status: 'needs_revision',
        nextNodeIndex: reviseIdx,
        nodeStates: nextStates,
        events: [
          ...cur.events,
          {
            ts: now,
            type: 'run.revision_requested',
            nodeId: approval.nodeId,
            reviseNodeId: reviseNode.id,
            reviseAgentId,
            ...(approvalNote ? { note: approvalNote } : {}),
          },
        ],
      };
    });

    // Clear any stale node locks from the revise node onward.
    // (A revision is a deliberate re-run; prior locks must not permanently block it.)
    try {
      const runPath = runLogPath;
      const runDir = path.dirname(runPath);
      const lockDir = path.join(runDir, 'locks');
      for (let i = reviseIdx; i < (workflow.nodes?.length ?? 0); i++) {
        const id = String(workflow.nodes[i]?.id ?? '').trim();
        if (!id) continue;
        const lp = path.join(lockDir, `${id}.lock`);
        try {
          await fs.unlink(lp);
        } catch { // intentional: best-effort lock cleanup
          // ignore
        }
      }
    } catch { // intentional: best-effort cleanup
      // ignore
    }

    // Enqueue the revision node.
    await enqueueTask(teamDir, reviseAgentId, {
      teamId,
      runId,
      nodeId: reviseNode.id,
      kind: 'execute_node',
      // Include human feedback in the packet so prompt templates can use it.
      packet: approvalNote ? { revisionNote: approvalNote } : {},
    } as unknown as Record<string, unknown>);

    return { ok: true as const, runId, status: 'needs_revision' as const, ticketPath, runLogPath };
  }

  // Mark node approved if not already recorded.
  const approvedTs = new Date().toISOString();
  await appendRunLog(runLogPath, (cur) => ({
    ...cur,
    status: 'running',
    nodeStates: { ...(cur.nodeStates ?? {}), [approval.nodeId]: { status: 'success', ts: approvedTs } },
    events: (cur.events ?? []).some((eRaw) => {
        const e = asRecord(eRaw);
        return asString(e['type']) === 'node.approved' && asString(e['nodeId']) === String(approval.nodeId);
      })
      ? cur.events
      : [...cur.events, { ts: approvedTs, type: 'node.approved', nodeId: approval.nodeId }],
  }));

  // Pull-based execution: enqueue the next runnable node and return.
  let updated = (await loadRunFile(teamDir, runsDir, runId)).run;
  let enqueueIdx = pickNextRunnableNodeIndex({ workflow, run: updated });

  // Auto-complete start/end nodes.
  while (enqueueIdx !== null) {
    const n = workflow.nodes[enqueueIdx]!;
    const k = String(n.kind ?? '');
    if (k !== 'start' && k !== 'end') break;
    const ts = new Date().toISOString();
    await appendRunLog(runLogPath, (cur) => ({
      ...cur,
      nextNodeIndex: enqueueIdx! + 1,
      nodeStates: { ...(cur.nodeStates ?? {}), [n.id]: { status: 'success', ts } },
      events: [...cur.events, { ts, type: 'node.completed', nodeId: n.id, kind: k, noop: true }],
      nodeResults: [...(cur.nodeResults ?? []), { nodeId: n.id, kind: k, noop: true }],
    }));
    updated = (await loadRunFile(teamDir, runsDir, runId)).run;
    enqueueIdx = pickNextRunnableNodeIndex({ workflow, run: updated });
  }

  if (enqueueIdx === null) {
    await writeRunFile(runLogPath, (cur) => ({
      ...cur,
      updatedAt: new Date().toISOString(),
      status: 'completed',
      events: [...cur.events, { ts: new Date().toISOString(), type: 'run.completed' }],
    }));
    return { ok: true as const, runId, status: 'completed' as const, ticketPath, runLogPath };
  }

  const node = workflow.nodes[enqueueIdx]!;
  const nextKind = String(node.kind ?? '');
  const nextAgentId = String(node?.assignedTo?.agentId ?? '').trim();
  if (!nextAgentId) throw new Error(`Next runnable node ${node.id} (${nextKind}) missing assignedTo.agentId (required for pull-based execution)`);

  await enqueueTask(teamDir, nextAgentId, {
    teamId,
    runId,
    nodeId: node.id,
    kind: 'execute_node',
  });

  await writeRunFile(runLogPath, (cur) => ({
    ...cur,
    updatedAt: new Date().toISOString(),
    status: 'waiting_workers',
    nextNodeIndex: enqueueIdx,
    events: [...cur.events, { ts: new Date().toISOString(), type: 'node.enqueued', nodeId: node.id, agentId: nextAgentId }],
  }));

  return { ok: true as const, runId, status: 'waiting_workers' as const, ticketPath, runLogPath };
}
