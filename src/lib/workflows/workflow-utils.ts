import fs from 'node:fs/promises';
import path from 'node:path';
import type { Workflow, WorkflowEdge, WorkflowLane, WorkflowNode, RunLog } from './workflow-types';
import { sanitizeOutboundPostText } from './outbound-sanitize';
import { readTextFile } from './workflow-runner-io';
import { lastIfValueFromRun } from './workflow-if';

export function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v == 'object' && !Array.isArray(v);
}

export function asRecord(v: unknown): Record<string, unknown> {
  return isRecord(v) ? v : {};
}

export function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : (v == null ? fallback : String(v));
}

export function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}


export function normalizeWorkflow(raw: unknown): Workflow {
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

export function isoCompact(ts = new Date()) {
  // Runner runIds appear in filenames + URLs. Keep them conservative + URL-safe.
  // - lowercase
  // - no ':' or '.'
  // - avoid 'T'/'Z' uppercase markers from ISO strings
  return ts
    .toISOString()
    .toLowerCase()
    .replace(/[:.]/g, '-');
}

export function assertLane(lane: string): asserts lane is WorkflowLane {
  if (lane !== 'backlog' && lane !== 'in-progress' && lane !== 'testing' && lane !== 'done') {
    throw new Error(`Invalid lane: ${lane}`);
  }
}

export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function fileExists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch { // intentional: best-effort file existence check
    return false;
  }
}

export async function listTicketNumbers(teamDir: string): Promise<number[]> {
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

export async function nextTicketNumber(teamDir: string) {
  const nums = await listTicketNumbers(teamDir);
  const max = nums.length ? Math.max(...nums) : 0;
  const next = max + 1;
  return String(next).padStart(4, '0');
}

export function laneToStatus(lane: WorkflowLane) {
  if (lane === 'backlog') return 'queued';
  if (lane === 'in-progress') return 'in-progress';
  if (lane === 'testing') return 'testing';
  return 'done';
}

export function templateReplace(input: string, vars: Record<string, string>) {
  let out = String(input ?? '');
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

export function sanitizeDraftOnlyText(text: string): string {
  // Back-compat: older workflow nodes mention 'draft only'.
  // New canonical sanitizer also strips other internal-only disclaimer lines.
  return sanitizeOutboundPostText(text);
}

export async function moveRunTicket(opts: {
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
    // intentional: best-effort status update
  }

  return { ticketPath: dest };
}

export function loadNodeStatesFromRun(run: RunLog): Record<string, { status: 'success' | 'error' | 'waiting'; ts: string }> {
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

export function pickNextRunnableNodeIndex(opts: { workflow: Workflow; run: RunLog }): number | null {
  const { workflow, run } = opts;
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  if (!nodes.length) return null;

  // Delay/pause semantics: when a run is paused, do not schedule further nodes
  // until resumeAt has passed.
  if (String(run.status ?? '') === 'paused') {
    const resumeAtRaw = String(run.resumeAt ?? '').trim();
    const resumeMs = resumeAtRaw ? Date.parse(resumeAtRaw) : NaN;
    if (!Number.isFinite(resumeMs) || Date.now() < resumeMs) return null;
  }

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

    // Branching semantics (v1): allow edges on true/false for `if` nodes.
    if (on === 'true' || on === 'false') {
      if (from !== 'success') return false;
      const v = lastIfValueFromRun(run, fromId);
      if (v === null) return false;
      return on === 'true' ? v === true : v === false;
    }

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

export async function appendRunLog(runLogPath: string, fn: (cur: RunLog) => RunLog) {
  const raw = await readTextFile(runLogPath);
  const cur = JSON.parse(raw) as RunLog;
  const next0 = fn(cur);
  const next = {
    ...next0,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(runLogPath, JSON.stringify(next, null, 2), 'utf8');
}

export function nodeLabel(n: WorkflowNode) {
  return `${n.kind}:${n.id}${n.name ? ` (${n.name})` : ''}`;
}

export function runFilePathFor(runsDir: string, runId: string) {
  // File-first: one directory per run.
  return path.join(runsDir, runId, 'run.json');
}

export async function loadRunFile(teamDir: string, runsDir: string, runId: string): Promise<{ path: string; run: RunLog }> {
  const runPath = runFilePathFor(runsDir, runId);
  if (!(await fileExists(runPath))) throw new Error(`Run file not found: ${path.relative(teamDir, runPath)}`);
  const raw = await readTextFile(runPath);
  return { path: runPath, run: JSON.parse(raw) as RunLog };
}

export async function writeRunFile(runPath: string, fn: (cur: RunLog) => RunLog) {
  const raw = await readTextFile(runPath);
  const cur = JSON.parse(raw) as RunLog;
  const next = fn(cur);
  await fs.writeFile(runPath, JSON.stringify(next, null, 2), 'utf8');
}
