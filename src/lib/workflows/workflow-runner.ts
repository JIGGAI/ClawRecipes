import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { resolveWorkspaceRoot } from '../workspace';
import type { ToolTextResult } from '../../toolsInvoke';
import { toolsInvoke } from '../../toolsInvoke';
import { loadOpenClawConfig } from '../recipes-config';
import type { WorkflowLane, WorkflowNode, WorkflowV1 } from './workflow-types';

function isoCompact(ts = new Date()) {
  return ts.toISOString().replace(/[:.]/g, '-');
}

function assertLane(lane: string): asserts lane is WorkflowLane {
  if (lane !== 'backlog' && lane !== 'in-progress' && lane !== 'testing' && lane !== 'done') {
    throw new Error(`Invalid lane: ${lane}`);
  }
}

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

async function listTicketNumbers(teamDir: string): Promise<number[]> {
  const workDir = path.join(teamDir, 'work');
  const lanes = ['backlog', 'in-progress', 'testing', 'done'];
  const nums: number[] = [];

  for (const lane of lanes) {
    const laneDir = path.join(workDir, lane);
    if (!(await fileExists(laneDir))) continue;
    const files = await fs.readdir(laneDir);
    for (const f of files) {
      const m = f.match(/^(\d{4})-/);
      if (m) nums.push(Number(m[1]));
    }
  }
  return nums;
}

async function nextTicketNumber(teamDir: string) {
  const nums = await listTicketNumbers(teamDir);
  const max = nums.length ? Math.max(...nums) : 0;
  const next = max + 1;
  return String(next).padStart(4, '0');
}

function laneToStatus(lane: WorkflowLane) {
  if (lane === 'backlog') return 'queued';
  if (lane === 'in-progress') return 'in-progress';
  if (lane === 'testing') return 'testing';
  return 'done';
}

function toolText(result: ToolTextResult | null | undefined): string {
  const text = result?.content?.find((c) => c.type === 'text')?.text;
  return String(text ?? '').trim();
}

async function moveRunTicket(opts: {
  teamDir: string;
  ticketPath: string;
  toLane: WorkflowLane;
}): Promise<{ ticketPath: string }> {
  const { teamDir, ticketPath, toLane } = opts;
  const workDir = path.join(teamDir, 'work');
  const toDir = path.join(workDir, toLane);
  await ensureDir(toDir);
  const file = path.basename(ticketPath);
  const dest = path.join(toDir, file);

  if (path.resolve(ticketPath) !== path.resolve(dest)) {
    await fs.rename(ticketPath, dest);
  }

  // Best-effort: update Status: line.
  try {
    const md = await fs.readFile(dest, 'utf8');
    const next = md.replace(/^Status: .*$/m, `Status: ${laneToStatus(toLane)}`);
    if (next !== md) await fs.writeFile(dest, next, 'utf8');
  } catch {
    // ignore
  }

  return { ticketPath: dest };
}

type RunEvent = Record<string, unknown> & { ts: string; type: string };

type RunLog = {
  runId: string;
  createdAt: string;
  teamId: string;
  workflow: { file: string; id: string | null; name: string | null };
  ticket: { file: string; number: string; lane: WorkflowLane };
  trigger: { kind: string; at?: string };
  status: string;
  events: RunEvent[];
  nodeResults?: Array<Record<string, unknown>>;
};

async function appendRunLog(runLogPath: string, fn: (cur: RunLog) => RunLog) {
  const raw = await fs.readFile(runLogPath, 'utf8');
  const cur = JSON.parse(raw) as RunLog;
  const next = fn(cur);
  await fs.writeFile(runLogPath, JSON.stringify(next, null, 2), 'utf8');
}

function nodeLabel(n: WorkflowNode) {
  return `${n.kind}:${n.id}${n.name ? ` (${n.name})` : ''}`;
}

async function resolveApprovalBindingTarget(api: OpenClawPluginApi, bindingId: string): Promise<{ channel: string; target: string; accountId?: string }> {
  const cfgObj = await loadOpenClawConfig(api);
  const bindings = (cfgObj as { bindings?: Array<{ agentId?: string; match?: { channel?: string; accountId?: string; peer?: { id?: string } } }> }).bindings;
  const m = Array.isArray(bindings)
    ? bindings.find((b) => String(b?.agentId ?? '') === String(bindingId) && b?.match?.channel && b?.match?.peer?.id)
    : null;
  if (!m?.match?.channel || !m.match.peer?.id) {
    throw new Error(
      `Missing approval binding: approvalBindingId=${bindingId}. Expected an openclaw config binding entry like {agentId: "${bindingId}", match: {channel, peer:{id}}}.`
    );
  }
  return { channel: String(m.match.channel), target: String(m.match.peer.id), ...(m.match.accountId ? { accountId: String(m.match.accountId) } : {}) };
}

// eslint-disable-next-line complexity, max-lines-per-function
async function executeWorkflowNodes(opts: {
  api: OpenClawPluginApi;
  teamId: string;
  teamDir: string;
  workflow: WorkflowV1;
  workflowPath: string;
  workflowFile: string;
  runId: string;
  runLogPath: string;
  ticketPath: string;
  initialLane: WorkflowLane;
  startNodeIndex?: number;
}): Promise<{ ticketPath: string; lane: WorkflowLane; status: 'completed' | 'awaiting_approval' | 'rejected' }> {
  const { api, teamId, teamDir, workflow, workflowFile, runId, runLogPath } = opts;

  // MVP: execute nodes in declared order (ignore edges).
  let curLane: WorkflowLane = opts.initialLane;
  let curTicketPath = opts.ticketPath;

  for (let i = 0; i < workflow.nodes.length; i++) {
    if (i < (opts.startNodeIndex ?? 0)) continue;
    const node = workflow.nodes[i]!;
    const ts = new Date().toISOString();
    const laneRaw = node?.config?.lane ? String(node.config.lane) : null;
    if (laneRaw) {
      assertLane(laneRaw);
      if (laneRaw !== curLane) {
        const moved = await moveRunTicket({ teamDir, ticketPath: curTicketPath, toLane: laneRaw });
        curLane = laneRaw;
        curTicketPath = moved.ticketPath;
        await appendRunLog(runLogPath, (cur) => ({
          ...cur,
          ticket: { ...cur.ticket, file: path.relative(teamDir, curTicketPath), lane: curLane },
          events: [...cur.events, { ts, type: 'ticket.moved', lane: curLane, nodeId: node.id }],
        }));
      }
    }

    if (node.kind === 'llm') {
      const agentId = String(node?.config?.agentId ?? '');
      const promptTemplatePath = String(node?.config?.promptTemplatePath ?? '');
      const outputPath = String(node?.config?.outputPath ?? '');
      if (!agentId) throw new Error(`Node ${nodeLabel(node)} missing config.agentId`);
      if (!promptTemplatePath) throw new Error(`Node ${nodeLabel(node)} missing config.promptTemplatePath`);
      if (!outputPath) throw new Error(`Node ${nodeLabel(node)} missing config.outputPath`);

      const promptPathAbs = path.resolve(teamDir, promptTemplatePath);
      const outPathAbs = path.resolve(teamDir, outputPath);
      await ensureDir(path.dirname(outPathAbs));

      const prompt = await fs.readFile(promptPathAbs, 'utf8');
      const task = [
        `You are executing a workflow run for teamId=${teamId}.`,
        `Workflow: ${workflow.name ?? workflow.id ?? workflowFile}`,
        `RunId: ${runId}`,
        `Node: ${nodeLabel(node)}`,
        `\n---\nPROMPT TEMPLATE\n---\n`,
        prompt.trim(),
        `\n---\nOUTPUT FORMAT\n---\n`,
        `Return ONLY the final content to be written to: ${outputPath}`,
      ].join('\n');

      const result = await toolsInvoke<ToolTextResult>(api, {
        tool: 'sessions_spawn',
        args: {
          agentId,
          task,
          label: `workflow:${teamId}:${workflow.id ?? 'workflow'}:${runId}:${node.id}`,
          cleanup: 'delete',
          runTimeoutSeconds: 300,
        },
      });

      const text = toolText(result) || '[no output]';
      await fs.writeFile(outPathAbs, text + (text.endsWith('\n') ? '' : '\n'), 'utf8');

      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        events: [...cur.events, { ts: new Date().toISOString(), type: 'node.completed', nodeId: node.id, kind: node.kind, outputPath }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, agentId, outputPath, bytes: text.length }],
      }));

      continue;
    }

    if (node.kind === 'human_approval') {
      const agentId = String(node?.config?.agentId ?? '');
      const approvalBindingId = String(node?.config?.approvalBindingId ?? '');
      if (!agentId) throw new Error(`Node ${nodeLabel(node)} missing config.agentId`);
      if (!approvalBindingId) throw new Error(`Node ${nodeLabel(node)} missing config.approvalBindingId`);

      const { channel, target, accountId } = await resolveApprovalBindingTarget(api, approvalBindingId);

      // Write a durable approval request file (runner can resume later via CLI).
      const approvalsDir = path.join(teamDir, 'shared-context', 'workflow-approvals');
      await ensureDir(approvalsDir);
      const approvalPath = path.join(approvalsDir, `${runId}.json`);
      const approvalObj = {
        runId,
        teamId,
        workflowFile,
        nodeId: node.id,
        bindingId: approvalBindingId,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        ticket: path.relative(teamDir, curTicketPath),
        runLog: path.relative(teamDir, runLogPath),
      };
      await fs.writeFile(approvalPath, JSON.stringify(approvalObj, null, 2), 'utf8');

      const msg = [
        `Approval requested for workflow run: ${workflow.name ?? workflow.id ?? workflowFile}`,
        `RunId: ${runId}`,
        `Node: ${node.name ?? node.id}`,
        `Ticket: ${path.relative(teamDir, curTicketPath)}`,
        `Run log: ${path.relative(teamDir, runLogPath)}`,
        `Approval file: ${path.relative(teamDir, approvalPath)}`,
        `\nMVP: To approve/reject, run one of:`,
        `- openclaw recipes workflows approve --team-id ${teamId} --run-id ${runId} --approved true`,
        `- openclaw recipes workflows approve --team-id ${teamId} --run-id ${runId} --approved false`,
        `Then resume:`,
        `- openclaw recipes workflows resume --team-id ${teamId} --run-id ${runId}`,
      ].join('\n');

      await toolsInvoke<ToolTextResult>(api, {
        tool: 'message',
        args: {
          action: 'send',
          channel,
          target,
          ...(accountId ? { accountId } : {}),
          message: msg,
        },
      });

      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        status: 'awaiting_approval',
        events: [...cur.events, { ts: new Date().toISOString(), type: 'node.awaiting_approval', nodeId: node.id, bindingId: approvalBindingId, approvalFile: path.relative(teamDir, approvalPath) }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, approvalBindingId, approvalFile: path.relative(teamDir, approvalPath) }],
      }));

      return { ticketPath: curTicketPath, lane: curLane, status: 'awaiting_approval' };
    }

    if (node.kind === 'writeback') {
      const agentId = String(node?.config?.agentId ?? '');
      const writebackPaths = Array.isArray(node?.config?.writebackPaths) ? node.config.writebackPaths.map(String) : [];
      if (!agentId) throw new Error(`Node ${nodeLabel(node)} missing config.agentId`);
      if (!writebackPaths.length) throw new Error(`Node ${nodeLabel(node)} missing config.writebackPaths[]`);

      const stamp = `\n\n---\nWorkflow writeback (${runId}) @ ${new Date().toISOString()}\n---\n`;
      const content = `${stamp}Run log: ${path.relative(teamDir, runLogPath)}\nTicket: ${path.relative(teamDir, curTicketPath)}\n`;

      for (const p of writebackPaths) {
        const abs = path.resolve(teamDir, p);
        await ensureDir(path.dirname(abs));
        const prev = (await fileExists(abs)) ? await fs.readFile(abs, 'utf8') : '';
        await fs.writeFile(abs, prev + content, 'utf8');
      }

      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        events: [...cur.events, { ts: new Date().toISOString(), type: 'node.completed', nodeId: node.id, kind: node.kind, writebackPaths }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, writebackPaths }],
      }));

      continue;
    }

    // Tool nodes are currently stubbed (explicitly recorded).
    if (node.kind === 'tool') {
      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        events: [...cur.events, { ts, type: 'node.skipped', nodeId: node.id, kind: node.kind, reason: 'integration stub' }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, skipped: true, reason: 'integration stub' }],
      }));
      continue;
    }

    throw new Error(`Unsupported node kind: ${node.kind} (${nodeLabel(node)})`);
  }

  await appendRunLog(runLogPath, (cur) => ({
    ...cur,
    status: 'completed',
    events: [...cur.events, { ts: new Date().toISOString(), type: 'run.completed', lane: curLane }],
  }));

  return { ticketPath: curTicketPath, lane: curLane, status: 'completed' };
}

// eslint-disable-next-line complexity, max-lines-per-function
export async function runWorkflowOnce(api: OpenClawPluginApi, opts: {
  teamId: string;
  workflowFile: string; // filename under shared-context/workflows/
  trigger?: { kind: string; at?: string };
}) {
  const teamId = String(opts.teamId);
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, '..', `workspace-${teamId}`);
  const sharedContextDir = path.join(teamDir, 'shared-context');
  const workflowsDir = path.join(sharedContextDir, 'workflows');
  const runsDir = path.join(sharedContextDir, 'workflow-runs');

  const workflowPath = path.join(workflowsDir, opts.workflowFile);
  const raw = await fs.readFile(workflowPath, 'utf8');
  const workflow = JSON.parse(raw) as WorkflowV1;

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


type ApprovalRecord = {
  runId: string;
  teamId: string;
  workflowFile: string;
  nodeId: string;
  bindingId: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedAt?: string;
  ticket: string;
  runLog: string;
  note?: string;
  resumedAt?: string;
  resumedStatus?: string;
  resumeError?: string;
};

async function approvalsPathFor(teamDir: string, runId: string) {
  return path.join(teamDir, 'shared-context', 'workflow-approvals', `${runId}.json`);
}

export async function pollWorkflowApprovals(api: OpenClawPluginApi, opts: {
  teamId: string;
  limit?: number;
}) {
  const teamId = String(opts.teamId);
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, '..', `workspace-${teamId}`);
  const approvalsDir = path.join(teamDir, 'shared-context', 'workflow-approvals');

  if (!(await fileExists(approvalsDir))) {
    return { ok: true as const, teamId, polled: 0, resumed: 0, skipped: 0, message: 'No approvals directory present.' };
  }

  const files = (await fs.readdir(approvalsDir))
    .filter((f) => f.endsWith('.json'))
    .slice(0, typeof opts.limit === 'number' && opts.limit > 0 ? opts.limit : undefined);

  let resumed = 0;
  let skipped = 0;
  const results: Array<{ runId: string; status: string; action: 'resumed' | 'skipped' | 'error'; message?: string }> = [];

  for (const f of files) {
    const approvalPath = path.join(approvalsDir, f);
    let approval: ApprovalRecord;
    try {
      approval = JSON.parse(await fs.readFile(approvalPath, 'utf8')) as ApprovalRecord;
    } catch (e) {
      skipped++;
      results.push({ runId: path.basename(f, '.json'), status: 'unknown', action: 'error', message: `Failed to parse: ${(e as Error).message}` });
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

  return { ok: true as const, teamId, polled: files.length, resumed, skipped, results };
}

export async function approveWorkflowRun(api: OpenClawPluginApi, opts: {
  teamId: string;
  runId: string;
  approved: boolean;
  note?: string;
}) {
  const teamId = String(opts.teamId);
  const runId = String(opts.runId);
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, '..', `workspace-${teamId}`);

  const approvalPath = await approvalsPathFor(teamDir, runId);
  if (!(await fileExists(approvalPath))) {
    throw new Error(`Approval file not found for runId=${runId}: ${path.relative(teamDir, approvalPath)}`);
  }
  const raw = await fs.readFile(approvalPath, 'utf8');
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
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, '..', `workspace-${teamId}`);
  const sharedContextDir = path.join(teamDir, 'shared-context');
  const runsDir = path.join(sharedContextDir, 'workflow-runs');
  const workflowsDir = path.join(sharedContextDir, 'workflows');

  const runLogPath = path.join(runsDir, `${runId}.json`);
  if (!(await fileExists(runLogPath))) throw new Error(`Run log not found: ${path.relative(teamDir, runLogPath)}`);
  const runRaw = await fs.readFile(runLogPath, 'utf8');
  const runLog = JSON.parse(runRaw) as RunLog;

  if (runLog.status === 'completed' || runLog.status === 'rejected') {
    return { ok: true as const, runId, status: runLog.status, message: 'No-op; run already finished.' };
  }
  if (runLog.status !== 'awaiting_approval') {
    throw new Error(`Run is not awaiting approval (status=${runLog.status}).`);
  }

  const workflowFile = String(runLog.workflow.file);
  const workflowPath = path.join(workflowsDir, workflowFile);
  const workflowRaw = await fs.readFile(workflowPath, 'utf8');
  const workflow = JSON.parse(workflowRaw) as WorkflowV1;

  const approvalPath = await approvalsPathFor(teamDir, runId);
  if (!(await fileExists(approvalPath))) throw new Error(`Missing approval file: ${path.relative(teamDir, approvalPath)}`);
  const approvalRaw = await fs.readFile(approvalPath, 'utf8');
  const approval = JSON.parse(approvalRaw) as ApprovalRecord;
  if (approval.status === 'pending') {
    throw new Error(`Approval still pending. Update ${path.relative(teamDir, approvalPath)} first.`);
  }

  const ticketPath = path.join(teamDir, runLog.ticket.file);

  // Find the approval node index; resume after it.
  const approvalIdx = workflow.nodes.findIndex((n) => n.kind === 'human_approval' && String(n.id) === String(approval.nodeId));
  if (approvalIdx < 0) throw new Error(`Approval node not found in workflow: nodeId=${approval.nodeId}`);
  const startNodeIndex = approvalIdx + 1;

  if (approval.status === 'rejected') {
    // Mark run rejected and move ticket to done.
    const moved = await moveRunTicket({ teamDir, ticketPath, toLane: 'done' });
    await appendRunLog(runLogPath, (cur) => ({
      ...cur,
      status: 'rejected',
      ticket: { ...cur.ticket, file: path.relative(teamDir, moved.ticketPath), lane: 'done' },
      events: [...cur.events, { ts: new Date().toISOString(), type: 'run.rejected', nodeId: approval.nodeId }],
    }));
    return { ok: true as const, runId, status: 'rejected' as const, ticketPath: moved.ticketPath, runLogPath };
  }

  await appendRunLog(runLogPath, (cur) => ({
    ...cur,
    status: 'running',
    events: [...cur.events, { ts: new Date().toISOString(), type: 'node.approved', nodeId: approval.nodeId }],
  }));

  // Determine current lane from run log.
  const laneRaw = String(runLog.ticket.lane);
  assertLane(laneRaw);
  const initialLane = laneRaw as WorkflowLane;

  const execRes = await executeWorkflowNodes({
    api,
    teamId,
    teamDir,
    workflow,
    workflowPath,
    workflowFile,
    runId,
    runLogPath,
    ticketPath,
    initialLane,
    startNodeIndex,
  });

  return { ok: true as const, runId, status: execRes.status, ticketPath: execRes.ticketPath, runLogPath };
}
