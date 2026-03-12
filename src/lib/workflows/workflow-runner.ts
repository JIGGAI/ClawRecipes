import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { resolveWorkspaceRoot } from '../workspace';
import type { ToolTextResult } from '../../toolsInvoke';
import { toolsInvoke } from '../../toolsInvoke';
import { loadOpenClawConfig } from '../recipes-config';
import type { Workflow, WorkflowEdge, WorkflowLane, WorkflowNode } from './workflow-types';
import { dequeueNextTask, enqueueTask } from './workflow-queue';
import { outboundPublish, type OutboundApproval, type OutboundMedia, type OutboundPlatform } from './outbound-client';
import { sanitizeOutboundPostText } from './outbound-sanitize';
import { loadPriorLlmInput, loadProposedPostTextFromPriorNode } from './workflow-node-output-readers';
import { readJsonFile, readTextFile } from './workflow-runner-io';

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v == 'object' && !Array.isArray(v);
}

function asRecord(v: unknown): Record<string, unknown> {
  return isRecord(v) ? v : {};
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : (v == null ? fallback : String(v));
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}


function normalizeWorkflow(raw: unknown): Workflow {
  const w = asRecord(raw);
  const id = asString(w['id']).trim();
  if (!id) throw new Error('Workflow missing required field: id');

  const meta = asRecord(w['meta']);
  const approvalBindingId = asString(meta['approvalBindingId']).trim();

  // Accept both canonical schema (node.kind/assignedTo/action/output) and ClawKitchen UI schema
  // (node.type + node.config). Normalize into the canonical in-memory shape.
  const nodes: WorkflowNode[] = asArray(w['nodes']).map((nRaw) => {
    const n = asRecord(nRaw);
    const config = asRecord(n['config']);

    const kind = asString(n['kind'] ?? n['type']).trim();

    const assignedToRec = asRecord(n['assignedTo']);
    const agentId = asString(assignedToRec['agentId'] ?? config['agentId']).trim();
    const assignedTo = agentId ? { agentId } : undefined;

    const actionRaw = asRecord(n['action']);
    const action = {
      ...actionRaw,
      // LLM: allow either promptTemplatePath (preferred) or inline promptTemplate string
      ...(config['promptTemplate'] != null ? { promptTemplate: asString(config['promptTemplate']) } : {}),
      ...(config['promptTemplatePath'] != null ? { promptTemplatePath: asString(config['promptTemplatePath']) } : {}),

      // Tool
      ...(config['tool'] != null ? { tool: asString(config['tool']) } : {}),
      ...(isRecord(config['args']) ? { args: config['args'] } : {}),

      // Human approval
      ...(config['approvalBindingId'] != null ? { approvalBindingId: asString(config['approvalBindingId']) } : {}),
    };

    // Prefer explicit per-node approval binding, else fall back to workflow meta.approvalBindingId.
    if (kind == 'human_approval' && !asString(action['approvalBindingId']).trim() && approvalBindingId) {
      action['approvalBindingId'] = approvalBindingId;
    }

    return {
      ...n,
      id: asString(n['id']).trim(),
      kind,
      assignedTo,
      action,
      // Keep config around for debugging/back-compat, but don't depend on it.
      config,
    } as WorkflowNode;
  });

  const edges: WorkflowEdge[] | undefined = Array.isArray(w['edges'])
    ? asArray(w['edges']).map((eRaw) => {
        const e = asRecord(eRaw);
        return {
          ...e,
          from: asString(e['from']).trim(),
          to: asString(e['to']).trim(),
          on: (asString(e['on']).trim() || 'success') as WorkflowEdge['on'],
        } as WorkflowEdge;
      })
    : undefined;

  return { ...w, id, nodes, ...(edges ? { edges } : {}) } as Workflow;
}

function isoCompact(ts = new Date()) {
  // Runner runIds appear in filenames + URLs. Keep them conservative + URL-safe.
  // - lowercase
  // - no ':' or '.'
  // - avoid 'T'/'Z' uppercase markers from ISO strings
  return ts
    .toISOString()
    .toLowerCase()
    .replace(/[:.]/g, '-');
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

function templateReplace(input: string, vars: Record<string, string>) {
  let out = String(input ?? '');
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

function sanitizeDraftOnlyText(text: string): string {
  // Back-compat: older workflow nodes mention 'draft only'.
  // New canonical sanitizer also strips other internal-only disclaimer lines.
  return sanitizeOutboundPostText(text);
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
    const md = await readTextFile(dest);
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
  updatedAt?: string;
  teamId: string;
  workflow: { file: string; id: string | null; name: string | null };
  ticket: { file: string; number: string; lane: WorkflowLane };
  trigger: { kind: string; at?: string };
  status: string;
  // Scheduler/runner fields
  priority?: number;
  claimedBy?: string | null;
  claimExpiresAt?: string | null;
  nextNodeIndex?: number;
  // File-first workflow run state (graph-friendly)
  nodeStates?: Record<string, { status: 'success' | 'error' | 'waiting'; ts: string; message?: string }>;
  events: RunEvent[];
  nodeResults?: Array<Record<string, unknown>>;
};

function loadNodeStatesFromRun(run: RunLog): Record<string, { status: 'success' | 'error' | 'waiting'; ts: string }> {
  const out: Record<string, { status: 'success' | 'error' | 'waiting'; ts: string }> = {};

  const cur = run.nodeStates;
  if (cur) {
    for (const [nodeId, st] of Object.entries(cur)) {
      if (st?.status === 'success' || st?.status === 'error' || st?.status === 'waiting') {
        out[String(nodeId)] = { status: st.status, ts: st.ts };
      }
    }
  }

  for (const evRaw of Array.isArray(run.events) ? run.events : []) {
    const ev = asRecord(evRaw);
    const nodeId = asString(ev['nodeId']).trim();
    if (!nodeId) continue;
    const ts = asString(ev['ts']) || new Date().toISOString();
    const type = asString(ev['type']).trim();

    if (type === 'node.completed') out[nodeId] = { status: 'success', ts };
    if (type === 'node.error') out[nodeId] = { status: 'error', ts };
    if (type === 'node.awaiting_approval') out[nodeId] = { status: 'waiting', ts };
    if (type === 'node.approved') out[nodeId] = { status: 'success', ts };
  }

  return out;
}

function pickNextRunnableNodeIndex(opts: { workflow: Workflow; run: RunLog }): number | null {
  const { workflow, run } = opts;
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  if (!nodes.length) return null;

  const hasEdges = Array.isArray(workflow.edges) && workflow.edges.length > 0;
  if (!hasEdges) {
    // Sequential fallback for legacy/no-edge workflows.
    const start = typeof run.nextNodeIndex === 'number' ? run.nextNodeIndex : 0;
    for (let i = Math.max(0, start); i < nodes.length; i++) {
      const n = nodes[i]!;
      const id = asString(n.id).trim();
      if (!id) continue;
      const st = (run.nodeStates ?? {})[id]?.status;
      if (st === 'success' || st === 'error' || st === 'waiting') continue;
      return i;
    }
    return null;
  }

  const nodeStates = loadNodeStatesFromRun(run);

  // Revision semantics: if the run is in needs_revision, we intentionally allow
  // re-execution of nodes from nextNodeIndex onward even if they previously
  // completed in an earlier attempt. Events are append-only, so earlier
  // node.completed events would otherwise make the graph think everything is
  // already satisfied and incorrectly mark the run completed.
  if (run.status === 'needs_revision' && typeof run.nextNodeIndex === 'number') {
    for (let i = Math.max(0, run.nextNodeIndex); i < nodes.length; i++) {
      const id = asString(nodes[i]?.id).trim();
      if (id) delete nodeStates[id];
    }
  }

  const incomingEdgesByNodeId = new Map<string, WorkflowEdge[]>();
  const edges = Array.isArray(workflow.edges) ? workflow.edges : [];
  for (const e of edges) {
    const to = asString(e.to).trim();
    if (!to) continue;
    const list = incomingEdgesByNodeId.get(to) ?? [];
    list.push(e);
    incomingEdgesByNodeId.set(to, list);
  }

  function edgeSatisfied(e: WorkflowEdge): boolean {
    const fromId = asString(e.from).trim();
    const from = nodeStates[fromId]?.status;
    const on = (e.on ?? 'success') as string;
    if (!from) return false;
    if (on === 'always') return from === 'success' || from === 'error';
    if (on === 'error') return from === 'error';
    return from === 'success';
  }

  function nodeReady(node: WorkflowNode): boolean {
    const nodeId = asString(node.id).trim();
    if (!nodeId) return false;

    const st = nodeStates[nodeId]?.status;
    if (st === 'success' || st === 'error' || st === 'waiting') return false;

    const inputFrom = node.input?.from;
    if (Array.isArray(inputFrom) && inputFrom.length) {
      return inputFrom.every((dep) => nodeStates[asString(dep)]?.status === 'success');
    }

    const incoming = incomingEdgesByNodeId.get(nodeId) ?? [];
    if (!incoming.length) return true;
    return incoming.some(edgeSatisfied);
  }

  for (let i = 0; i < nodes.length; i++) {
    if (nodeReady(nodes[i]!)) return i;
  }
  return null;
}

async function appendRunLog(runLogPath: string, fn: (cur: RunLog) => RunLog) {
  const raw = await readTextFile(runLogPath);
  const cur = JSON.parse(raw) as RunLog;
  const next0 = fn(cur);
  const next = {
    ...next0,
    updatedAt: new Date().toISOString(),
  };
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
  workflow: Workflow;
  workflowPath: string;
  workflowFile: string;
  runId: string;
  runLogPath: string;
  ticketPath: string;
  initialLane: WorkflowLane;
  startNodeIndex?: number;
}): Promise<{ ticketPath: string; lane: WorkflowLane; status: 'completed' | 'awaiting_approval' | 'rejected' }> {
  const { api, teamId, teamDir, workflow, workflowFile, runId, runLogPath } = opts;

  const hasEdges = Array.isArray(workflow.edges) && workflow.edges.length > 0;

  let curLane: WorkflowLane = opts.initialLane;
  let curTicketPath = opts.ticketPath;

  // Load the current run log so we can resume deterministically (approval resumes, partial runs, etc.).
  const curRunRaw = await readTextFile(runLogPath);
  const curRun = JSON.parse(curRunRaw) as RunLog;

  const nodeIndexById = new Map<string, number>();
  for (let i = 0; i < workflow.nodes.length; i++) nodeIndexById.set(String(workflow.nodes[i]?.id ?? ''), i);

  const nodeStates = loadNodeStatesFromRun(curRun);

  const incomingEdgesByNodeId = new Map<string, WorkflowEdge[]>();
  const edges = Array.isArray(workflow.edges) ? workflow.edges : [];
  for (const e of edges) {
    const to = String(e?.to ?? '');
    if (!to) continue;
    const list = incomingEdgesByNodeId.get(to) ?? [];
    list.push(e as WorkflowEdge);
    incomingEdgesByNodeId.set(to, list);
  }

  function edgeSatisfied(e: WorkflowEdge): boolean {
    const fromId = String(e.from ?? '');
    const from = nodeStates[fromId]?.status;
    const on = String(e.on ?? 'success');
    if (!from) return false;
    if (on === 'always') return from === 'success' || from === 'error';
    if (on === 'error') return from === 'error';
    return from === 'success';
  }

  function nodeReady(node: WorkflowNode): boolean {
    const nodeId = String(node?.id ?? '');
    if (!nodeId) return false;
    const st = nodeStates[nodeId]?.status;
    if (st === 'success' || st === 'error' || st === 'waiting') return false;

    // Explicit input dependencies are AND semantics.
    const inputFrom = node.input?.from;
    if (Array.isArray(inputFrom) && inputFrom.length) {
      return inputFrom.every((dep) => nodeStates[String(dep)]?.status === 'success');
    }

    if (!hasEdges) return true;

    const incoming = incomingEdgesByNodeId.get(nodeId) ?? [];
    if (!incoming.length) return true; // root

    // Minimal semantics: OR. If any incoming edge condition is satisfied, the node can run.
    return incoming.some(edgeSatisfied);
  }

  function pickNextIndex(): number | null {
    if (!hasEdges) {
      const start = opts.startNodeIndex ?? 0;
      for (let i = start; i < workflow.nodes.length; i++) {
        const nodeId = String(workflow.nodes[i]?.id ?? '');
        if (!nodeId) continue;
        const st = nodeStates[nodeId]?.status;
        if (st === 'success' || st === 'error' || st === 'waiting') continue;
        return i;
      }
      return null;
    }

    const ready: number[] = [];
    for (let i = 0; i < workflow.nodes.length; i++) {
      const n = workflow.nodes[i]!;
      if (nodeReady(n)) ready.push(i);
    }
    if (!ready.length) return null;
    ready.sort((a, b) => a - b);
    return ready[0] ?? null;
  }

  // Execute until we either complete or hit a wait state.
  while (true) {
    const i = pickNextIndex();
    if (i === null) break;

    const node = workflow.nodes[i]!;
    const ts = new Date().toISOString();

    const laneRaw = node?.lane ? String(node.lane) : null;
    if (laneRaw) {
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

    const kind = String(node.kind ?? '');

    // ClawKitchen workflows include explicit start/end nodes; treat them as no-op.
    if (kind === 'start' || kind === 'end') {
      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        nextNodeIndex: i + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts } },
        events: [...cur.events, { ts, type: 'node.completed', nodeId: node.id, kind }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, noop: true }],
      }));
      nodeStates[String(node.id)] = { status: 'success', ts };
      continue;
    }


    if (kind === 'llm') {
      const agentId = String(node?.assignedTo?.agentId ?? '');
      const action = asRecord(node.action);
      const promptTemplatePath = asString(action['promptTemplatePath']).trim();
      const promptTemplateInline = asString(action['promptTemplate']).trim();
      if (!agentId) throw new Error(`Node ${nodeLabel(node)} missing assignedTo.agentId`);
      if (!promptTemplatePath && !promptTemplateInline) throw new Error(`Node ${nodeLabel(node)} missing action.promptTemplatePath or action.promptTemplate`);

      const promptPathAbs = promptTemplatePath ? path.resolve(teamDir, promptTemplatePath) : '';
      const runDir = path.dirname(runLogPath);
      const defaultNodeOutputRel = path.join('node-outputs', `${String(i).padStart(3, '0')}-${node.id}.json`);
      const nodeOutputRel = String(node?.output?.path ?? '').trim() || defaultNodeOutputRel;
      const nodeOutputAbs = path.resolve(runDir, nodeOutputRel);
      if (!nodeOutputAbs.startsWith(runDir + path.sep) && nodeOutputAbs !== runDir) {
        throw new Error(`Node output.path must be within the run directory: ${nodeOutputRel}`);
      }
      await ensureDir(path.dirname(nodeOutputAbs));

      const prompt = promptTemplateInline ? promptTemplateInline : await readTextFile(promptPathAbs);
      const task = [
        `You are executing a workflow run for teamId=${teamId}.`,
        `Workflow: ${workflow.name ?? workflow.id ?? workflowFile}`,
        `RunId: ${runId}`,
        `Node: ${nodeLabel(node)}`,
        `\n---\nPROMPT TEMPLATE\n---\n`,
        prompt.trim(),
        `\n---\nOUTPUT FORMAT\n---\n`,
        `Return ONLY the final content (the runner will store it as JSON).`,
      ].join('\n');

      // Prefer llm-task-fixed when installed; fall back to llm-task.
      // Avoid depending on sessions_spawn (not always exposed via gateway tools/invoke).
      let text = '';
      try {
        let llmRes: unknown;
        const priorInput = await loadPriorLlmInput({ runDir, workflow, currentNode: node, currentNodeIndex: i });
        try {
          llmRes = await toolsInvoke<unknown>(api, {
            tool: 'llm-task-fixed',
            action: 'json',
            args: {
              prompt: task,
              input: { teamId, runId, nodeId: node.id, agentId, ...priorInput },
            },
          });
        } catch {
          llmRes = await toolsInvoke<unknown>(api, {
            tool: 'llm-task',
            action: 'json',
            args: {
              prompt: task,
              input: { teamId, runId, nodeId: node.id, agentId, ...priorInput },
            },
          });
        }

        const llmRec = asRecord(llmRes);
        const details = asRecord(llmRec['details']);
        const payload = details['json'] ?? (Object.keys(details).length ? details : llmRes) ?? null;
        text = JSON.stringify(payload, null, 2);
      } catch (e) {
        throw new Error(`LLM execution failed for node ${nodeLabel(node)}: ${e instanceof Error ? e.message : String(e)}`);
      }

      const outputObj = {
        runId,
        teamId,
        nodeId: node.id,
        kind: node.kind,
        agentId,
        completedAt: new Date().toISOString(),
        text,
      };
      await fs.writeFile(nodeOutputAbs, JSON.stringify(outputObj, null, 2) + '\n', 'utf8');

      const completedTs = new Date().toISOString();
      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        nextNodeIndex: i + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
        events: [...cur.events, { ts: completedTs, type: 'node.completed', nodeId: node.id, kind: node.kind, nodeOutputPath: path.relative(teamDir, nodeOutputAbs) }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, agentId, nodeOutputPath: path.relative(teamDir, nodeOutputAbs), bytes: Buffer.byteLength(text, 'utf8') }],
      }));
      nodeStates[String(node.id)] = { status: 'success', ts: completedTs };

      continue;
    }

    if (kind === 'human_approval') {
      const agentId = String(node?.assignedTo?.agentId ?? '');
      const approvalBindingId = String(node?.action?.approvalBindingId ?? '');
      if (!agentId) throw new Error(`Node ${nodeLabel(node)} missing assignedTo.agentId`);
      if (!approvalBindingId) throw new Error(`Node ${nodeLabel(node)} missing action.approvalBindingId`);

      const { channel, target, accountId } = await resolveApprovalBindingTarget(api, approvalBindingId);

      // Write a durable approval request file (runner can resume later via CLI).
          // n8n-inspired: approvals live inside the run folder.
      const runDir = path.dirname(runLogPath);
      const approvalsDir = path.join(runDir, 'approvals');
      await ensureDir(approvalsDir);
      const approvalPath = path.join(approvalsDir, 'approval.json');
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

      // Include the proposed post text in the approval request (what will actually be posted).
      const nodeOutputsDir = path.join(runDir, 'node-outputs');
      let proposed = '';
      try {
        // Heuristic: use qc_brand output if present (finalized drafts), otherwise use the immediately prior node.
        const qcId = 'qc_brand';
        const hasQc = (await fileExists(nodeOutputsDir)) && (await fs.readdir(nodeOutputsDir)).some((f) => f.endsWith(`-${qcId}.json`));
        const priorId = hasQc ? qcId : String(workflow.nodes?.[Math.max(0, i - 1)]?.id ?? '');
        if (priorId) proposed = await loadProposedPostTextFromPriorNode({ runDir, nodeOutputsDir, priorNodeId: priorId });
      } catch {
        proposed = '';
      }
      proposed = sanitizeDraftOnlyText(proposed);

      const msg = [
        `Approval requested for workflow run: ${workflow.name ?? workflow.id ?? workflowFile}`,
        `RunId: ${runId}`,
        `Node: ${node.name ?? node.id}`,
        `Ticket: ${path.relative(teamDir, curTicketPath)}`,
        `Run log: ${path.relative(teamDir, runLogPath)}`,
        `Approval file: ${path.relative(teamDir, approvalPath)}`,
        proposed ? `\n---\nPROPOSED POST (X)\n---\n${proposed}` : `\n(Warning: no proposed text found to preview)`,
        `\nTo approve/reject:`,
        `- approve ${String(approvalObj['code'] ?? '').trim() || '(code in approval file)'}`,
        `- decline ${String(approvalObj['code'] ?? '').trim() || '(code in approval file)'}`,
        `\n(Or via CLI)`,
        `- openclaw recipes workflows approve --team-id ${teamId} --run-id ${runId} --approved true`,
        `- openclaw recipes workflows approve --team-id ${teamId} --run-id ${runId} --approved false --note "<what to change>"`,
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

      const waitingTs = new Date().toISOString();
      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        status: 'awaiting_approval',
        nextNodeIndex: i + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'waiting', ts: waitingTs } },
        events: [...cur.events, { ts: waitingTs, type: 'node.awaiting_approval', nodeId: node.id, bindingId: approvalBindingId, approvalFile: path.relative(teamDir, approvalPath) }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, approvalBindingId, approvalFile: path.relative(teamDir, approvalPath) }],
      }));

      nodeStates[String(node.id)] = { status: 'waiting', ts: waitingTs };
      return { ticketPath: curTicketPath, lane: curLane, status: 'awaiting_approval' };
    }

    if (kind === 'writeback') {
      const agentId = String(node?.assignedTo?.agentId ?? '');
      const writebackPaths = Array.isArray(node?.action?.writebackPaths) ? node.action.writebackPaths.map(String) : [];
      if (!agentId) throw new Error(`Node ${nodeLabel(node)} missing assignedTo.agentId`);
      if (!writebackPaths.length) throw new Error(`Node ${nodeLabel(node)} missing action.writebackPaths[]`);

      const stamp = `\n\n---\nWorkflow writeback (${runId}) @ ${new Date().toISOString()}\n---\n`;
      const content = `${stamp}Run log: ${path.relative(teamDir, runLogPath)}\nTicket: ${path.relative(teamDir, curTicketPath)}\n`;

      for (const p of writebackPaths) {
        const abs = path.resolve(teamDir, p);
        await ensureDir(path.dirname(abs));
        const prev = (await fileExists(abs)) ? await readTextFile(abs) : '';
        await fs.writeFile(abs, prev + content, 'utf8');
      }

      const completedTs = new Date().toISOString();
      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        nextNodeIndex: i + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
        events: [...cur.events, { ts: completedTs, type: 'node.completed', nodeId: node.id, kind: node.kind, writebackPaths }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, writebackPaths }],
      }));
      nodeStates[String(node.id)] = { status: 'success', ts: completedTs };

      continue;
    }

    if (kind === 'tool') {
      const toolName = String(node?.action?.tool ?? '');
      const toolArgs = (node?.action?.args ?? {}) as Record<string, unknown>;
      if (!toolName) throw new Error(`Node ${nodeLabel(node)} missing action.tool`);

      const runDir = path.dirname(runLogPath);
      const artifactsDir = path.join(runDir, 'artifacts');
      await ensureDir(artifactsDir);
      const artifactPath = path.join(artifactsDir, `${String(i).padStart(3, '0')}-${node.id}.tool.json`);

      const vars = {
        date: new Date().toISOString(),
        'run.id': runId,
        'workflow.id': String(workflow.id ?? ''),
        'workflow.name': String(workflow.name ?? workflow.id ?? workflowFile),
      };

      try {
        // Runner-native tools (preferred): do NOT depend on gateway tool exposure.
        if (toolName === 'fs.append') {
          const relPathRaw = String(toolArgs.path ?? '').trim();
          const contentRaw = String(toolArgs.content ?? '');
          if (!relPathRaw) throw new Error('fs.append requires args.path');
          if (!contentRaw) throw new Error('fs.append requires args.content');

          const relPath = templateReplace(relPathRaw, vars);
          const abs = path.resolve(teamDir, relPath);
          if (!abs.startsWith(teamDir + path.sep) && abs !== teamDir) {
            throw new Error('fs.append path must be within the team workspace');
          }

          await ensureDir(path.dirname(abs));
          const content = templateReplace(contentRaw, vars);
          await fs.appendFile(abs, content, 'utf8');

          const result = { appendedTo: path.relative(teamDir, abs), bytes: Buffer.byteLength(content, 'utf8') };
          await fs.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: toolArgs, result }, null, 2), 'utf8');

          const completedTs = new Date().toISOString();
          await appendRunLog(runLogPath, (cur) => ({
            ...cur,
            nextNodeIndex: i + 1,
            nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
            events: [...cur.events, { ts: completedTs, type: 'node.completed', nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
            nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
          }));
          nodeStates[String(node.id)] = { status: 'success', ts: completedTs };

          continue;
        }



        if (toolName === 'outbound.post') {
          // Outbound posting (local-first v0.1): publish via an external HTTP service.
          // IMPORTANT: this runner-native tool intentionally does NOT read draft text from disk.
          // Provide `args.text` directly from upstream LLM nodes, and (optionally) an approval receipt.
          const pluginCfg = asRecord(asRecord(api)['pluginConfig']);
          const outboundCfg = asRecord(pluginCfg['outbound']);

          const baseUrl = String(outboundCfg['baseUrl'] ?? '').trim();
          const apiKey = String(outboundCfg['apiKey'] ?? '').trim();
          if (!baseUrl) throw new Error('outbound.post requires plugin config outbound.baseUrl');
          if (!apiKey) throw new Error('outbound.post requires plugin config outbound.apiKey');
          const platform = String(toolArgs.platform ?? '').trim();
          const textRaw = String(toolArgs.text ?? '');
          const text = sanitizeOutboundPostText(textRaw);
          const idempotencyKey = String(toolArgs.idempotencyKey ?? `${task.runId}:${node.id}`).trim();
          const runContext = asRecord(toolArgs.runContext);
          const approval = toolArgs.approval ? asRecord(toolArgs.approval) : undefined;
          const media = Array.isArray(toolArgs.media) ? toolArgs.media : undefined;
          const dryRun = toolArgs.dryRun === true;

          if (!platform) throw new Error('outbound.post requires args.platform');
          if (!text) throw new Error('outbound.post requires args.text');
          if (!idempotencyKey) throw new Error('outbound.post requires args.idempotencyKey');

          const workflowId = String(workflow.id ?? '');

          const result = await outboundPublish({
            baseUrl,
            apiKey,
            platform: platform as OutboundPlatform,
            idempotencyKey,
            request: {
              text,
              media: media as unknown as OutboundMedia[],
              runContext: {
                teamId: String(runContext.teamId ?? ''),
                workflowId: String(runContext.workflowId ?? workflowId),
                workflowRunId: String(runContext.workflowRunId ?? task.runId),
                nodeId: String(runContext.nodeId ?? node.id),
                ticketPath: typeof runContext.ticketPath === 'string' ? runContext.ticketPath : undefined,
              },
              approval: approval as unknown as OutboundApproval,
              dryRun,
            },
          });

          await fs.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: toolArgs, result }, null, 2), 'utf8');

          const completedTs = new Date().toISOString();
          await appendRunLog(runLogPath, (cur) => ({
            ...cur,
            nextNodeIndex: i + 1,
            nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
            events: [...cur.events, { ts: completedTs, type: 'node.completed', nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
            nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
          }));
          nodeStates[String(node.id)] = { status: 'success', ts: completedTs };

          continue;
        }

                // Fallback: attempt to invoke a gateway tool by name.
        const result = await toolsInvoke(api, { tool: toolName, args: toolArgs });
        await fs.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: toolArgs, result }, null, 2), 'utf8');

        const completedTs = new Date().toISOString();
        await appendRunLog(runLogPath, (cur) => ({
          ...cur,
          nextNodeIndex: i + 1,
          nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
          events: [...cur.events, { ts: completedTs, type: 'node.completed', nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
          nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
        }));
        nodeStates[String(node.id)] = { status: 'success', ts: completedTs };

        continue;
      } catch (e) {
        await fs.writeFile(artifactPath, JSON.stringify({ ok: false, tool: toolName, args: toolArgs, error: (e as Error).message }, null, 2), 'utf8');
        const errTs = new Date().toISOString();
        await appendRunLog(runLogPath, (cur) => ({
          ...cur,
          nextNodeIndex: i + 1,
          nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'error', ts: errTs, message: (e as Error).message } },
          events: [...cur.events, { ts: errTs, type: 'node.error', nodeId: node.id, kind, tool: toolName, message: (e as Error).message, artifactPath: path.relative(teamDir, artifactPath) }],
          nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, tool: toolName, error: (e as Error).message, artifactPath: path.relative(teamDir, artifactPath) }],
        }));
        nodeStates[String(node.id)] = { status: 'error', ts: errTs };
        throw e;
      }
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


function runFilePathFor(runsDir: string, runId: string) {
  // File-first: one directory per run.
  return path.join(runsDir, runId, 'run.json');
}

async function loadRunFile(teamDir: string, runsDir: string, runId: string): Promise<{ path: string; run: RunLog }> {
  const runPath = runFilePathFor(runsDir, runId);
  if (!(await fileExists(runPath))) throw new Error(`Run file not found: ${path.relative(teamDir, runPath)}`);
  const raw = await readTextFile(runPath);
  return { path: runPath, run: JSON.parse(raw) as RunLog };
}

async function writeRunFile(runPath: string, fn: (cur: RunLog) => RunLog) {
  const raw = await readTextFile(runPath);
  const cur = JSON.parse(raw) as RunLog;
  const next = fn(cur);
  await fs.writeFile(runPath, JSON.stringify(next, null, 2), 'utf8');
}

export async function enqueueWorkflowRun(api: OpenClawPluginApi, opts: {
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
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, '..', `workspace-${teamId}`);
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
    } catch {
      // ignore
    }

    if (!runPath) continue;

    try {
      const run = JSON.parse(await readTextFile(runPath)) as RunLog;
      if (run.status !== 'queued') continue;
      const exp = run.claimExpiresAt ? Date.parse(String(run.claimExpiresAt)) : 0;
      const claimed = !!run.claimedBy && exp > now;
      if (claimed) continue;
      candidates.push({ file: runPath, run });
    } catch {
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


export async function runWorkflowRunnerTick(api: OpenClawPluginApi, opts: {
  teamId: string;
  concurrency?: number;
  leaseSeconds?: number;
}) {
  const teamId = String(opts.teamId);
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, '..', `workspace-${teamId}`);
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
    } catch {
      // ignore
    }

    if (!runPath) continue;

    try {
      const run = JSON.parse(await readTextFile(runPath)) as RunLog;
      if (run.status !== 'queued') continue;
      const exp = run.claimExpiresAt ? Date.parse(String(run.claimExpiresAt)) : 0;
      const claimed = !!run.claimedBy && exp > now;
      if (claimed) continue;
      candidates.push({ file: runPath, run });
    } catch {
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
    if (cur.status !== 'queued') return null;
    const exp = cur.claimExpiresAt ? Date.parse(String(cur.claimExpiresAt)) : 0;
    const claimed = !!cur.claimedBy && exp > Date.now();
    if (claimed) return null;

    const claimExpiresAt = new Date(Date.now() + leaseSeconds * 1000).toISOString();
    const claimedBy = `${runnerIdBase}:${crypto.randomBytes(3).toString('hex')}`;

    const next: RunLog = {
      ...cur,
      updatedAt: new Date().toISOString(),
      status: 'running',
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
  const runsDir = path.join(teamDir, 'shared-context', 'workflow-runs');
  return path.join(runsDir, runId, 'approvals', 'approval.json');
}

export async function pollWorkflowApprovals(api: OpenClawPluginApi, opts: {
  teamId: string;
  limit?: number;
}) {
  const teamId = String(opts.teamId);
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, '..', `workspace-${teamId}`);
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
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, '..', `workspace-${teamId}`);

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
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, '..', `workspace-${teamId}`);
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

  // Find the approval node index; resume after it.
  const approvalIdx = workflow.nodes.findIndex((n) => n.kind === 'human_approval' && String(n.id) === String(approval.nodeId));
  if (approvalIdx < 0) throw new Error(`Approval node not found in workflow: nodeId=${approval.nodeId}`);
  const startNodeIndex = approvalIdx + 1;

  if (approval.status === 'rejected') {
    // Denial flow: mark run as needs_revision and loop back to the draft step (or closest prior llm node).
    // This keeps workflows non-terminal on rejection.

    const approvalNote = String(approval.note ?? '').trim();

    // Find a reasonable "revise" node: prefer a node with id=draft_assets, else the closest prior llm node.
    const approvalIdx = workflow.nodes.findIndex((n) => n.kind === 'human_approval' && String(n.id) === String(approval.nodeId));
    if (approvalIdx < 0) throw new Error(`Approval node not found in workflow: nodeId=${approval.nodeId}`);

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
        } catch {
          // ignore
        }
      }
    } catch {
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

  // Pull-based execution: enqueue the next node and return.
  const idx0 = Math.max(0, Number(startNodeIndex ?? 0));
  if (idx0 >= (workflow.nodes?.length ?? 0)) {
    await writeRunFile(runLogPath, (cur) => ({
      ...cur,
      updatedAt: new Date().toISOString(),
      status: 'completed',
      events: [...cur.events, { ts: new Date().toISOString(), type: 'run.completed' }],
    }));
    return { ok: true as const, runId, status: 'completed' as const, ticketPath, runLogPath };
  }

  const node = workflow.nodes[idx0]!;
  const nextAgentId = String(node?.assignedTo?.agentId ?? '').trim();
  if (!nextAgentId) throw new Error(`Node ${node.id} missing assignedTo.agentId (required for pull-based execution)`);

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
    nextNodeIndex: idx0,
    events: [...cur.events, { ts: new Date().toISOString(), type: 'node.enqueued', nodeId: node.id, agentId: nextAgentId }],
  }));

  return { ok: true as const, runId, status: 'waiting_workers' as const, ticketPath, runLogPath };
}

export async function runWorkflowWorkerTick(api: OpenClawPluginApi, opts: {
  teamId: string;
  agentId: string;
  limit?: number;
  workerId?: string;
}) {
  const teamId = String(opts.teamId);
  const agentId = String(opts.agentId);
  if (!teamId) throw new Error('--team-id is required');
  if (!agentId) throw new Error('--agent-id is required');

  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, '..', `workspace-${teamId}`);
  const sharedContextDir = path.join(teamDir, 'shared-context');
  const workflowsDir = path.join(sharedContextDir, 'workflows');
  const runsDir = path.join(sharedContextDir, 'workflow-runs');

  const workerId = String(opts.workerId ?? `workflow-worker:${process.pid}`);
  const limit = typeof opts.limit === 'number' && opts.limit > 0 ? Math.floor(opts.limit) : 1;

  const results: Array<{ taskId: string; runId: string; nodeId: string; status: string }> = [];

  for (let i = 0; i < limit; i++) {
    const dq = await dequeueNextTask(teamDir, agentId, { workerId, leaseSeconds: 120 });
    if (!dq.ok || !dq.task) break;

    const { task } = dq.task;
    if (task.kind !== 'execute_node') continue;

    const runPath = runFilePathFor(runsDir, task.runId);
    const runDir = path.dirname(runPath);
    const lockDir = path.join(runDir, 'locks');
    await ensureDir(lockDir);

    // Node-level lock to prevent double execution.
    const lockPath = path.join(lockDir, `${task.nodeId}.lock`);
    try {
      await fs.writeFile(lockPath, JSON.stringify({ workerId, taskId: task.id, claimedAt: new Date().toISOString() }, null, 2), { encoding: 'utf8', flag: 'wx' });
    } catch {
      // Lock exists. Treat it as contention unless it looks stale.
      // (If a worker crashed, the lock file can stick around and block retries/revisions forever.)
      let unlocked = false;
      try {
        const raw = await readTextFile(lockPath);
        const parsed = JSON.parse(raw) as { claimedAt?: string };
        const claimedAtMs = parsed?.claimedAt ? Date.parse(String(parsed.claimedAt)) : NaN;
        const ageMs = Number.isFinite(claimedAtMs) ? Date.now() - claimedAtMs : NaN;
        const stale = Number.isFinite(ageMs) && ageMs > 10 * 60 * 1000;
        if (stale) {
          await fs.unlink(lockPath);
          unlocked = true;
        }
      } catch {
        // ignore
      }

      if (unlocked) {
        try {
          await fs.writeFile(lockPath, JSON.stringify({ workerId, taskId: task.id, claimedAt: new Date().toISOString() }, null, 2), { encoding: 'utf8', flag: 'wx' });
        } catch {
          results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'skipped_locked' });
          continue;
        }
      } else {
        // Requeue to avoid task loss since dequeueNextTask already advanced the queue cursor.
        await enqueueTask(teamDir, agentId, {
          teamId,
          runId: task.runId,
          nodeId: task.nodeId,
          kind: 'execute_node',
        });
        results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'skipped_locked' });
        continue;
      }
    }

    try {
      const runId = task.runId;

      const { run } = await loadRunFile(teamDir, runsDir, runId);
    const workflowFile = String(run.workflow.file);
    const workflowPath = path.join(workflowsDir, workflowFile);
    const workflowRaw = await readTextFile(workflowPath);
    const workflow = normalizeWorkflow(JSON.parse(workflowRaw));

    const nodeIdx = workflow.nodes.findIndex((n) => String(n.id) === String(task.nodeId));
    if (nodeIdx < 0) throw new Error(`Node not found in workflow: ${task.nodeId}`);
    const node = workflow.nodes[nodeIdx]!;

    // Determine current lane + ticket path.
    const laneRaw = String(run.ticket.lane);
    assertLane(laneRaw);
    let curLane: WorkflowLane = laneRaw as WorkflowLane;
    let curTicketPath = path.join(teamDir, run.ticket.file);

    // Lane transitions.
    const laneNodeRaw = node?.lane ? String(node.lane) : null;
    if (laneNodeRaw) {
      assertLane(laneNodeRaw);
      if (laneNodeRaw !== curLane) {
        const moved = await moveRunTicket({ teamDir, ticketPath: curTicketPath, toLane: laneNodeRaw });
        curLane = laneNodeRaw;
        curTicketPath = moved.ticketPath;
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          ticket: { ...cur.ticket, file: path.relative(teamDir, curTicketPath), lane: curLane },
          events: [...cur.events, { ts: new Date().toISOString(), type: 'ticket.moved', lane: curLane, nodeId: node.id }],
        }));
      }
    }

    const kind = String(node.kind ?? '');

    // start/end are no-op.
    if (kind === 'start' || kind === 'end') {
      const completedTs = new Date().toISOString();
      await appendRunLog(runPath, (cur) => ({
        ...cur,
        nextNodeIndex: nodeIdx + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
        events: [...cur.events, { ts: completedTs, type: 'node.completed', nodeId: node.id, kind, noop: true }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, noop: true }],
      }));
    } else if (kind === 'llm') {
      // Reuse the existing runner logic by executing just this node (sequential model).
      // This keeps the worker deterministic and file-first.
      const runLogPath = runPath;
      const runId = task.runId;

      const agentIdExec = String(node?.assignedTo?.agentId ?? '');
      const action = asRecord(node.action);
      const promptTemplatePath = asString(action['promptTemplatePath']).trim();
      const promptTemplateInline = asString(action['promptTemplate']).trim();
      if (!agentIdExec) throw new Error(`Node ${nodeLabel(node)} missing assignedTo.agentId`);
      if (!promptTemplatePath && !promptTemplateInline) throw new Error(`Node ${nodeLabel(node)} missing action.promptTemplatePath or action.promptTemplate`);

      const promptPathAbs = promptTemplatePath ? path.resolve(teamDir, promptTemplatePath) : '';
      const defaultNodeOutputRel = path.join('node-outputs', `${String(nodeIdx).padStart(3, '0')}-${node.id}.json`);
      const nodeOutputRel = String(node?.output?.path ?? '').trim() || defaultNodeOutputRel;
      const nodeOutputAbs = path.resolve(runDir, nodeOutputRel);
      if (!nodeOutputAbs.startsWith(runDir + path.sep) && nodeOutputAbs !== runDir) {
        throw new Error(`Node output.path must be within the run directory: ${nodeOutputRel}`);
      }
      await ensureDir(path.dirname(nodeOutputAbs));

      const prompt = promptTemplateInline ? promptTemplateInline : await readTextFile(promptPathAbs);
      const taskText = [
        `You are executing a workflow run for teamId=${teamId}.`,
        `Workflow: ${workflow.name ?? workflow.id ?? workflowFile}`,
        `RunId: ${runId}`,
        `Node: ${nodeLabel(node)}`,
        `\n---\nPROMPT TEMPLATE\n---\n`,
        prompt.trim(),
        `\n---\nOUTPUT FORMAT\n---\n`,
        `Return ONLY the final content (the worker will store it as JSON).`,
      ].join('\n');

      let text = '';
      try {
        let llmRes: unknown;
        const priorInput = await loadPriorLlmInput({ runDir, workflow, currentNode: node, currentNodeIndex: nodeIdx });
        try {
          llmRes = await toolsInvoke<unknown>(api, {
            tool: 'llm-task-fixed',
            action: 'json',
            args: {
              prompt: taskText,
              input: { teamId, runId, nodeId: node.id, agentId, ...priorInput },
            },
          });
        } catch {
          llmRes = await toolsInvoke<unknown>(api, {
            tool: 'llm-task',
            action: 'json',
            args: {
              prompt: taskText,
              input: { teamId, runId, nodeId: node.id, agentId, ...priorInput },
            },
          });
        }

        const llmRec = asRecord(llmRes);
        const details = asRecord(llmRec['details']);
        const payload = details['json'] ?? (Object.keys(details).length ? details : llmRes) ?? null;
        text = JSON.stringify(payload, null, 2);
      } catch (e) {
        throw new Error(`LLM execution failed for node ${nodeLabel(node)}: ${e instanceof Error ? e.message : String(e)}`);
      }

      const outputObj = {
        runId,
        teamId,
        nodeId: node.id,
        kind: node.kind,
        agentId: agentIdExec,
        completedAt: new Date().toISOString(),
        text,
      };
      await fs.writeFile(nodeOutputAbs, JSON.stringify(outputObj, null, 2) + '\n', 'utf8');

      const completedTs = new Date().toISOString();
      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        nextNodeIndex: nodeIdx + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
        events: [...cur.events, { ts: completedTs, type: 'node.completed', nodeId: node.id, kind: node.kind, nodeOutputPath: path.relative(teamDir, nodeOutputAbs) }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, agentId: agentIdExec, nodeOutputPath: path.relative(teamDir, nodeOutputAbs), bytes: Buffer.byteLength(text, 'utf8') }],
      }));
    } else if (kind === 'human_approval') {
      // For now, approval nodes are executed by workers (message send + awaiting state).
      // Note: approval files live inside the run folder.
      const approvalBindingId = String(node?.action?.approvalBindingId ?? '');
      const config = asRecord((node as unknown as Record<string, unknown>)['config']);
      const action = asRecord(node.action);
      const provider = asString(config['provider'] ?? action['provider']).trim();
      const targetRaw = config['target'] ?? action['target'];
      const accountIdRaw = config['accountId'] ?? action['accountId'];

      let channel = provider || 'telegram';
      let target = String(targetRaw ?? '');
      let accountId = accountIdRaw ? String(accountIdRaw) : undefined;

      // ClawKitchen UI sometimes stores placeholder targets like "(set in UI)".
      // Treat these as unset.
      if (target && /^\(set in ui\)$/i.test(target.trim())) {
        target = '';
      }

      if (approvalBindingId) {
        try {
          const resolved = await resolveApprovalBindingTarget(api, approvalBindingId);
          channel = resolved.channel;
          target = resolved.target;
          accountId = resolved.accountId;
        } catch {
          // Back-compat for ClawKitchen UI: treat approvalBindingId as an inline provider/target hint if it looks like one.
          // Example: "telegram:account:shawnjbot".
          if (!target && approvalBindingId.startsWith('telegram:')) {
            channel = 'telegram';
            accountId = approvalBindingId.replace(/^telegram:account:/, '');
          } else {
            // If it's a telegram account hint, we can still proceed as long as we can derive a target.
            // Otherwise, fail loudly.
            throw new Error(
              `Missing approval binding: approvalBindingId=${approvalBindingId}. Expected a config binding entry OR provide config.target.`
            );
          }
        }
      }

      if (!target && channel === 'telegram') {
        // Back-compat shims (dev/testing):
        // - If Kitchen stored a telegram account hint (telegram:account:<id>) without a full binding,
        //   use known chat ids for local testing.
        if (accountId === 'shawnjbot') target = '6477250615';
      }

      if (!target) {
        throw new Error(`Node ${nodeLabel(node)} missing approval target (provide config.target or binding mapping)`);
      }

      const approvalsDir = path.join(runDir, 'approvals');
      await ensureDir(approvalsDir);
      const approvalPath = path.join(approvalsDir, 'approval.json');

      const code = Math.random().toString(36).slice(2, 8).toUpperCase();

      const approvalObj = {
        runId: task.runId,
        teamId,
        workflowFile,
        nodeId: node.id,
        bindingId: approvalBindingId || undefined,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        code,
        ticket: path.relative(teamDir, curTicketPath),
        runLog: path.relative(teamDir, runPath),
      };
      await fs.writeFile(approvalPath, JSON.stringify(approvalObj, null, 2), 'utf8');

      // Include a proposed-post preview in the approval request.
      let proposed = '';
      try {
        const nodeOutputsDir = path.join(runDir, 'node-outputs');
        // Prefer qc_brand output if present; otherwise use the most recent prior node.
        const qcId = 'qc_brand';
        const hasQc = (await fileExists(nodeOutputsDir)) && (await fs.readdir(nodeOutputsDir)).some((f) => f.endsWith(`-${qcId}.json`));
        const priorId = hasQc ? qcId : String(workflow.nodes?.[Math.max(0, nodeIdx - 1)]?.id ?? '');
        if (priorId) proposed = await loadProposedPostTextFromPriorNode({ runDir, nodeOutputsDir, priorNodeId: priorId });
      } catch {
        proposed = '';
      }
      proposed = sanitizeDraftOnlyText(proposed);

      const msg = [
        `Approval requested: ${workflow.name ?? workflow.id ?? workflowFile}`,
        `Ticket: ${path.relative(teamDir, curTicketPath)}`,
        `Code: ${code}`,
        proposed ? `\n---\nPROPOSED POST (X)\n---\n${proposed}` : `\n(Warning: no proposed text found to preview)`,
        `\nReply with:`,
        `- approve ${code}`,
        `- decline ${code} <what to change>`,
        `\n(You can also review in Kitchen: http://localhost:7777/teams/${teamId}/workflows/${workflow.id ?? ''})`,
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

      const waitingTs = new Date().toISOString();
      await appendRunLog(runPath, (cur) => ({
        ...cur,
        status: 'awaiting_approval',
        nextNodeIndex: nodeIdx + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'waiting', ts: waitingTs } },
        events: [...cur.events, { ts: waitingTs, type: 'node.awaiting_approval', nodeId: node.id, bindingId: approvalBindingId, approvalFile: path.relative(teamDir, approvalPath) }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, approvalBindingId, approvalFile: path.relative(teamDir, approvalPath) }],
      }));

      results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'awaiting_approval' });
      continue;
    } else if (kind === 'tool') {
      const action = asRecord(node.action);
      const toolName = asString(action['tool']).trim();
      const toolArgs = isRecord(action['args']) ? (action['args'] as Record<string, unknown>) : {};
      if (!toolName) throw new Error(`Node ${nodeLabel(node)} missing action.tool`);

      const artifactsDir = path.join(runDir, 'artifacts');
      await ensureDir(artifactsDir);
      const artifactPath = path.join(artifactsDir, `${String(nodeIdx).padStart(3, '0')}-${node.id}.tool.json`);
      try {
        // Runner-native tools (preferred): do NOT depend on gateway tool exposure.
        if (toolName === 'fs.append') {
          const relPathRaw = String(toolArgs.path ?? '').trim();
          const contentRaw = String(toolArgs.content ?? '');
          if (!relPathRaw) throw new Error('fs.append requires args.path');
          if (!contentRaw) throw new Error('fs.append requires args.content');

          const vars = {
            date: new Date().toISOString(),
            'run.id': runId,
            'workflow.id': String(workflow.id ?? ''),
            'workflow.name': String(workflow.name ?? workflow.id ?? workflowFile),
          };
          const relPath = templateReplace(relPathRaw, vars);
          const content = templateReplace(contentRaw, vars);

          const abs = path.resolve(teamDir, relPath);
          if (!abs.startsWith(teamDir + path.sep) && abs !== teamDir) {
            throw new Error('fs.append path must be within the team workspace');
          }

          await ensureDir(path.dirname(abs));
          await fs.appendFile(abs, content, 'utf8');

          const result = { appendedTo: path.relative(teamDir, abs), bytes: Buffer.byteLength(content, 'utf8') };
          await fs.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: toolArgs, result }, null, 2) + '\n', 'utf8');


        } else if (toolName === 'marketing.post_all') {
          // Disabled by default: do not ship plugins that spawn local processes for posting.
          // Use an approval-gated workflow node that calls a dedicated posting tool/plugin instead.
          throw new Error(
            'marketing.post_all is disabled in this build (install safety). Use an external posting tool/plugin (approval-gated) instead.'
          );
        } else {
          const toolRes = await toolsInvoke<unknown>(api, {
            tool: toolName,
            args: toolArgs,
          });

          await fs.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, result: toolRes }, null, 2) + '\n', 'utf8');
        }

        const defaultNodeOutputRel = path.join('node-outputs', `${String(nodeIdx).padStart(3, '0')}-${node.id}.json`);
        const nodeOutputRel = String(node?.output?.path ?? '').trim() || defaultNodeOutputRel;
        const nodeOutputAbs = path.resolve(runDir, nodeOutputRel);
        await ensureDir(path.dirname(nodeOutputAbs));
        await fs.writeFile(nodeOutputAbs, JSON.stringify({
          runId: task.runId,
          teamId,
          nodeId: node.id,
          kind: node.kind,
          completedAt: new Date().toISOString(),
          tool: toolName,
          artifactPath: path.relative(teamDir, artifactPath),
        }, null, 2) + '\n', 'utf8');

        const completedTs = new Date().toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          nextNodeIndex: nodeIdx + 1,
          nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
          events: [...cur.events, { ts: completedTs, type: 'node.completed', nodeId: node.id, kind: node.kind, artifactPath: path.relative(teamDir, artifactPath), nodeOutputPath: path.relative(teamDir, nodeOutputAbs) }],
          nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath), nodeOutputPath: path.relative(teamDir, nodeOutputAbs) }],
        }));
      } catch (e) {
        await fs.writeFile(artifactPath, JSON.stringify({ ok: false, tool: toolName, error: (e as Error).message }, null, 2) + '\n', 'utf8');
        const errorTs = new Date().toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: 'error',
          nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'error', ts: errorTs } },
          events: [...cur.events, { ts: errorTs, type: 'node.error', nodeId: node.id, kind: node.kind, tool: toolName, message: (e as Error).message, artifactPath: path.relative(teamDir, artifactPath) }],
          nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, tool: toolName, error: (e as Error).message, artifactPath: path.relative(teamDir, artifactPath) }],
        }));
        results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'error', error: (e as Error).message });
        continue;
      }
    } else {
      throw new Error(`Worker does not yet support node kind: ${kind}`);
    }

    // After node completion, enqueue next node.
    // Graph-aware: if workflow.edges exist, compute the next runnable node from nodeStates + edges.

    let updated = (await loadRunFile(teamDir, runsDir, task.runId)).run;

    if (updated.status === 'awaiting_approval') {
      results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'awaiting_approval' });
      continue;
    }

    let enqueueIdx = pickNextRunnableNodeIndex({ workflow, run: updated });

    // Auto-complete start/end nodes.
    while (enqueueIdx !== null) {
      const n = workflow.nodes[enqueueIdx]!;
      const k = String(n.kind ?? '');
      if (k !== 'start' && k !== 'end') break;
      const ts = new Date().toISOString();
      await appendRunLog(runPath, (cur) => ({
        ...cur,
        nextNodeIndex: enqueueIdx! + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [n.id]: { status: 'success', ts } },
        events: [...cur.events, { ts, type: 'node.completed', nodeId: n.id, kind: k, noop: true }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: n.id, kind: k, noop: true }],
      }));
      updated = (await loadRunFile(teamDir, runsDir, task.runId)).run;
      enqueueIdx = pickNextRunnableNodeIndex({ workflow, run: updated });
    }

    if (enqueueIdx === null) {
      await writeRunFile(runPath, (cur) => ({
        ...cur,
        updatedAt: new Date().toISOString(),
        status: 'completed',
        events: [...cur.events, { ts: new Date().toISOString(), type: 'run.completed' }],
      }));
      results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'completed' });
      continue;
    }

    const nextNode = workflow.nodes[enqueueIdx]!;

    // Some nodes (human approval) may not have an assigned agent; they are executed
    // by the runner/worker loop itself (they send a message + set awaiting state).
    const nextKind = String(nextNode.kind ?? '');
    if (nextKind === 'human_approval' || nextKind === 'start' || nextKind === 'end') {
      // Re-enqueue onto the same agent so it can execute the next node deterministically.
      await enqueueTask(teamDir, agentId, {
        teamId,
        runId: task.runId,
        nodeId: nextNode.id,
        kind: 'execute_node',
      });

      await writeRunFile(runPath, (cur) => ({
        ...cur,
        updatedAt: new Date().toISOString(),
        status: 'waiting_workers',
        nextNodeIndex: enqueueIdx,
        events: [...cur.events, { ts: new Date().toISOString(), type: 'node.enqueued', nodeId: nextNode.id, agentId }],
      }));

      results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'ok' });
      continue;
    }

    const nextAgentId = String(nextNode?.assignedTo?.agentId ?? '').trim();
    if (!nextAgentId) throw new Error(`Next node ${nextNode.id} missing assignedTo.agentId`);

    await enqueueTask(teamDir, nextAgentId, {
      teamId,
      runId: task.runId,
      nodeId: nextNode.id,
      kind: 'execute_node',
    });

    await writeRunFile(runPath, (cur) => ({
      ...cur,
      updatedAt: new Date().toISOString(),
      status: 'waiting_workers',
      nextNodeIndex: enqueueIdx,
      events: [...cur.events, { ts: new Date().toISOString(), type: 'node.enqueued', nodeId: nextNode.id, agentId: nextAgentId }],
    }));

    results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'ok' });
    } finally {
      try {
        await fs.unlink(lockPath);
      } catch {
        // ignore
      }
    }

  }

  return { ok: true as const, teamId, agentId, workerId, results };
}
