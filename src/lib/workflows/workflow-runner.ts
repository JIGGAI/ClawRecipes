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
}): Promise<{ ticketPath: string; lane: WorkflowLane; status: 'completed' | 'awaiting_approval' }> {
  const { api, teamId, teamDir, workflow, workflowFile, runId, runLogPath } = opts;

  // MVP: execute nodes in declared order (ignore edges).
  let curLane: WorkflowLane = opts.initialLane;
  let curTicketPath = opts.ticketPath;

  for (const node of workflow.nodes) {
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

      const msg = [
        `Approval requested for workflow run: ${workflow.name ?? workflow.id ?? workflowFile}`,
        `RunId: ${runId}`,
        `Node: ${node.name ?? node.id}`,
        `Ticket: ${path.relative(teamDir, curTicketPath)}`,
        `Run log: ${path.relative(teamDir, runLogPath)}`,
        `\nReply in-thread with APPROVE or REJECT (MVP runner does not auto-resume yet).`,
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
        events: [...cur.events, { ts: new Date().toISOString(), type: 'node.awaiting_approval', nodeId: node.id, bindingId: approvalBindingId }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, approvalBindingId }],
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
