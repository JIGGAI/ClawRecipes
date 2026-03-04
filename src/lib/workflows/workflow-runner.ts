import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { resolveWorkspaceRoot } from '../workspace';
import type { ToolTextResult } from '../../toolsInvoke';
import { toolsInvoke } from '../../toolsInvoke';
import { loadOpenClawConfig } from '../recipes-config';
import type { WorkflowLane, WorkflowNode, WorkflowV1 } from './workflow-types';

function normalizeWorkflowV1(raw: unknown): WorkflowV1 {
  const w = (raw ?? {}) as any;
  const nodes = Array.isArray(w.nodes) ? w.nodes : [];

  // Normalize ClawKitchen workflow schema: nodes[].type -> nodes[].kind
  // Also treat start/end as no-op nodes the runner can skip.
  w.nodes = nodes.map((n: any) => {
    const kind = n?.kind ?? n?.type;
    return { ...n, kind };
  });

  return w as WorkflowV1;
}

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

function templateReplace(input: string, vars: Record<string, string>) {
  let out = String(input ?? '');
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
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
  events: RunEvent[];
  nodeResults?: Array<Record<string, unknown>>;
};

async function appendRunLog(runLogPath: string, fn: (cur: RunLog) => RunLog) {
  const raw = await fs.readFile(runLogPath, 'utf8');
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

    const kind = String((node as any).kind ?? '');

    // ClawKitchen workflows include explicit start/end nodes; treat them as no-op.
    if (kind === 'start' || kind === 'end') {
      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        nextNodeIndex: i + 1,
        events: [...cur.events, { ts, type: 'node.completed', nodeId: node.id, kind }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, noop: true }],
      }));
      continue;
    }


    if (kind === 'llm') {
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
        nextNodeIndex: i + 1,
        events: [...cur.events, { ts: new Date().toISOString(), type: 'node.completed', nodeId: node.id, kind: node.kind, outputPath }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, agentId, outputPath, bytes: text.length }],
      }));

      continue;
    }

    if (kind === 'human_approval') {
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
        nextNodeIndex: i + 1,
        events: [...cur.events, { ts: new Date().toISOString(), type: 'node.awaiting_approval', nodeId: node.id, bindingId: approvalBindingId, approvalFile: path.relative(teamDir, approvalPath) }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, approvalBindingId, approvalFile: path.relative(teamDir, approvalPath) }],
      }));

      return { ticketPath: curTicketPath, lane: curLane, status: 'awaiting_approval' };
    }

    if (kind === 'writeback') {
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
        nextNodeIndex: i + 1,
        events: [...cur.events, { ts: new Date().toISOString(), type: 'node.completed', nodeId: node.id, kind: node.kind, writebackPaths }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, writebackPaths }],
      }));

      continue;
    }

    if (kind === 'tool') {
      const toolName = String((node as any)?.config?.tool ?? '');
      const toolArgs = ((node as any)?.config?.args ?? {}) as Record<string, unknown>;
      if (!toolName) throw new Error(`Node ${nodeLabel(node)} missing config.tool`);

      const runsRoot = path.dirname(runLogPath);
      const runDir = path.join(runsRoot, runId);
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
          const relPath = String(toolArgs.path ?? '').trim();
          const contentRaw = String(toolArgs.content ?? '');
          if (!relPath) throw new Error('fs.append requires args.path');
          if (!contentRaw) throw new Error('fs.append requires args.content');

          const abs = path.resolve(teamDir, relPath);
          if (!abs.startsWith(teamDir + path.sep) && abs !== teamDir) {
            throw new Error('fs.append path must be within the team workspace');
          }

          await ensureDir(path.dirname(abs));
          const content = templateReplace(contentRaw, vars);
          await fs.appendFile(abs, content, 'utf8');

          const result = { appendedTo: path.relative(teamDir, abs), bytes: Buffer.byteLength(content, 'utf8') };
          await fs.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: toolArgs, result }, null, 2), 'utf8');

          await appendRunLog(runLogPath, (cur) => ({
            ...cur,
            nextNodeIndex: i + 1,
            events: [...cur.events, { ts: new Date().toISOString(), type: 'node.completed', nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
            nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
          }));

          continue;
        }

        if (toolName === 'runtime.exec') {
          // Extra safety gate: runtime.exec must be explicitly enabled (dev/testing only).
          if (process.env.OPENCLAW_WORKFLOW_RUNNER_ENABLE_RUNTIME_EXEC !== '1') {
            throw new Error('runtime.exec denied: OPENCLAW_WORKFLOW_RUNNER_ENABLE_RUNTIME_EXEC!=1');
          }

          const meta = (workflow as any)?.meta ?? {};
          const allowBins = new Set<string>(Array.isArray(meta.execAllowBins) ? meta.execAllowBins.map(String) : []);
          const allowCommands = new Set<string>(Array.isArray(meta.execAllowCommands) ? meta.execAllowCommands.map(String) : []);
          if (allowBins.size === 0 && allowCommands.size === 0) {
            throw new Error(`runtime.exec denied: set workflow meta.execAllowBins[] or meta.execAllowCommands[] (${nodeLabel(node)})`);
          }

          const cmdArray = Array.isArray(toolArgs.commandArray)
            ? toolArgs.commandArray
            : Array.isArray(toolArgs.command)
              ? toolArgs.command
              : null;
          const cmdStr = typeof toolArgs.command === 'string' ? toolArgs.command : '';

          const parts = (cmdArray ? cmdArray.map(String) : cmdStr.split(/\s+/)).map((s) => s.trim()).filter(Boolean);
          if (!parts.length) throw new Error('runtime.exec requires args.command or args.commandArray');

          const bin = path.basename(parts[0]!);
          const fullCommand = cmdArray ? parts.join(' ') : String(cmdStr).trim();

          if (allowCommands.size && !allowCommands.has(fullCommand)) {
            throw new Error(`runtime.exec command not allowlisted: ${fullCommand}`);
          }
          if (!allowCommands.size && !allowBins.has(bin)) {
            throw new Error(`runtime.exec bin not allowlisted: ${bin}`);
          }

          const cwdRel = typeof toolArgs.cwd === 'string' ? toolArgs.cwd : typeof toolArgs.workdir === 'string' ? toolArgs.workdir : '';
          const cwdAbs = cwdRel ? path.resolve(teamDir, cwdRel) : teamDir;
          if (!cwdAbs.startsWith(teamDir + path.sep) && cwdAbs !== teamDir) {
            throw new Error('runtime.exec cwd must be within the team workspace');
          }

          const timeoutMs = Math.max(0, Number(meta.execTimeoutSeconds ?? 60)) * 1000;

          const result = await new Promise<{ stdout: string; stderr: string; exitCode: number | null; signal: string | null }>((resolve, reject) => {
            const child = spawn(parts[0]!, parts.slice(1), { cwd: cwdAbs, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
            let stdout = '';
            let stderr = '';
            const maxBytes = 64 * 1024;
            child.stdout?.on('data', (b: Buffer) => {
              if (stdout.length < maxBytes) stdout += b.toString('utf8').slice(0, maxBytes - stdout.length);
            });
            child.stderr?.on('data', (b: Buffer) => {
              if (stderr.length < maxBytes) stderr += b.toString('utf8').slice(0, maxBytes - stderr.length);
            });

            const t = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
            child.on('error', (e) => {
              clearTimeout(t);
              reject(e);
            });
            child.on('close', (code, signal) => {
              clearTimeout(t);
              resolve({ stdout, stderr, exitCode: code, signal });
            });
          });

          await fs.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: toolArgs, result }, null, 2), 'utf8');
          await appendRunLog(runLogPath, (cur) => ({
            ...cur,
            nextNodeIndex: i + 1,
            events: [...cur.events, { ts: new Date().toISOString(), type: 'node.completed', nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
            nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
          }));

          continue;
        }

        // Fallback: attempt to invoke a gateway tool by name.
        const result = await toolsInvoke(api, { tool: toolName, args: toolArgs } as any);
        await fs.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: toolArgs, result }, null, 2), 'utf8');

        await appendRunLog(runLogPath, (cur) => ({
          ...cur,
          nextNodeIndex: i + 1,
          events: [...cur.events, { ts: new Date().toISOString(), type: 'node.completed', nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
          nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, tool: toolName, artifactPath: path.relative(teamDir, artifactPath) }],
        }));

        continue;
      } catch (e) {
        await fs.writeFile(artifactPath, JSON.stringify({ ok: false, tool: toolName, args: toolArgs, error: (e as Error).message }, null, 2), 'utf8');
        await appendRunLog(runLogPath, (cur) => ({
          ...cur,
          nextNodeIndex: i + 1,
          events: [...cur.events, { ts: new Date().toISOString(), type: 'node.error', nodeId: node.id, kind, tool: toolName, message: (e as Error).message, artifactPath: path.relative(teamDir, artifactPath) }],
          nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, tool: toolName, error: (e as Error).message, artifactPath: path.relative(teamDir, artifactPath) }],
        }));
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
  // Back-compat: prefer new extension, but fall back to old .json if present.
  return {
    primary: path.join(runsDir, `${runId}.run.json`),
    legacy: path.join(runsDir, `${runId}.json`),
  };
}

async function loadRunFile(teamDir: string, runsDir: string, runId: string): Promise<{ path: string; run: RunLog }> {
  const p = runFilePathFor(runsDir, runId);
  const chosen = (await fileExists(p.primary)) ? p.primary : p.legacy;
  if (!(await fileExists(chosen))) throw new Error(`Run file not found: ${path.relative(teamDir, chosen)}`);
  const raw = await fs.readFile(chosen, 'utf8');
  return { path: chosen, run: JSON.parse(raw) as RunLog };
}

async function writeRunFile(runPath: string, fn: (cur: RunLog) => RunLog) {
  const raw = await fs.readFile(runPath, 'utf8');
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
  const raw = await fs.readFile(workflowPath, 'utf8');
  const workflow = normalizeWorkflowV1(JSON.parse(raw));

  if (!workflow.nodes?.length) throw new Error('Workflow has no nodes');

  // Determine initial lane from first node that declares lane.
  const firstLaneRaw = String(workflow.nodes.find(n => n?.config && typeof n.config === 'object' && 'lane' in n.config)?.config?.lane ?? 'backlog');
  assertLane(firstLaneRaw);
  const initialLane: WorkflowLane = firstLaneRaw;

  const runId = `${isoCompact()}-${crypto.randomBytes(4).toString('hex')}`;
  await ensureDir(runsDir);
  const runLogPath = path.join(runsDir, `${runId}.run.json`);

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

  const files = (await fs.readdir(runsDir)).filter((f) => f.endsWith('.run.json'));
  const candidates: Array<{ file: string; run: RunLog }> = [];

  for (const f of files) {
    const abs = path.join(runsDir, f);
    try {
      const run = JSON.parse(await fs.readFile(abs, 'utf8')) as RunLog;
      if (run.status !== 'queued') continue;
      const exp = run.claimExpiresAt ? Date.parse(String(run.claimExpiresAt)) : 0;
      const claimed = !!run.claimedBy && exp > now;
      if (claimed) continue;
      candidates.push({ file: abs, run });
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
  const workflowRaw = await fs.readFile(workflowPath, 'utf8');
  const workflow = normalizeWorkflowV1(JSON.parse(workflowRaw));

  const ticketPath = path.join(teamDir, chosen.run.ticket.file);
  const laneRaw = String(chosen.run.ticket.lane);
  assertLane(laneRaw);
  const initialLane = laneRaw as WorkflowLane;

  let execRes: { ticketPath: string; lane: WorkflowLane; status: 'completed' | 'awaiting_approval' | 'rejected' };
  try {
    execRes = await executeWorkflowNodes({
      api,
      teamId,
      teamDir,
      workflow,
      workflowPath,
      workflowFile,
      runId: chosen.run.runId,
      runLogPath: chosen.file,
      ticketPath,
      initialLane,
      startNodeIndex: typeof chosen.run.nextNodeIndex === 'number' ? chosen.run.nextNodeIndex : 0,
    });
  } catch (e) {
    await writeRunFile(chosen.file, (cur) => ({
      ...cur,
      updatedAt: new Date().toISOString(),
      status: 'error',
      claimedBy: null,
      claimExpiresAt: null,
      events: [...cur.events, { ts: new Date().toISOString(), type: 'run.error', message: (e as Error).message }],
    }));
    throw e
  }

  await writeRunFile(chosen.file, (cur) => ({
    ...cur,
    updatedAt: new Date().toISOString(),
    status: execRes.status === 'awaiting_approval' ? 'awaiting_approval' : execRes.status,
    claimedBy: null,
    claimExpiresAt: null,
    nextNodeIndex: execRes.status === 'awaiting_approval' ? cur.nextNodeIndex : (workflow.nodes?.length ?? cur.nextNodeIndex ?? 0),
  }));

  return { ok: true as const, teamId, claimed: 1, runId: chosen.run.runId, status: execRes.status };
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

  const files = (await fs.readdir(runsDir)).filter((f) => f.endsWith('.run.json'));
  const candidates: Array<{ file: string; run: RunLog }> = [];

  for (const f of files) {
    const abs = path.join(runsDir, f);
    try {
      const run = JSON.parse(await fs.readFile(abs, 'utf8')) as RunLog;
      if (run.status !== 'queued') continue;
      const exp = run.claimExpiresAt ? Date.parse(String(run.claimExpiresAt)) : 0;
      const claimed = !!run.claimedBy && exp > now;
      if (claimed) continue;
      candidates.push({ file: abs, run });
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
    const raw = await fs.readFile(runPath, 'utf8');
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
    const workflowRaw = await fs.readFile(workflowPath, 'utf8');
    const workflow = normalizeWorkflowV1(JSON.parse(workflowRaw));

    const ticketPath = path.join(teamDir, run.ticket.file);
    const laneRaw = String(run.ticket.lane);
    assertLane(laneRaw);
    const initialLane = laneRaw as WorkflowLane;

    try {
      const execRes = await executeWorkflowNodes({
        api,
        teamId,
        teamDir,
        workflow,
        workflowPath,
        workflowFile,
        runId: run.runId,
        runLogPath: runPath,
        ticketPath,
        initialLane,
        startNodeIndex: typeof run.nextNodeIndex === 'number' ? run.nextNodeIndex : 0,
      });

      await writeRunFile(runPath, (cur) => ({
        ...cur,
        updatedAt: new Date().toISOString(),
        status: execRes.status === 'awaiting_approval' ? 'awaiting_approval' : execRes.status,
        claimedBy: null,
        claimExpiresAt: null,
        nextNodeIndex: execRes.status === 'awaiting_approval' ? (cur.nextNodeIndex ?? 0) : (workflow.nodes?.length ?? cur.nextNodeIndex ?? 0),
      }));

      return { runId: run.runId, status: execRes.status };
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
  const raw = await fs.readFile(workflowPath, 'utf8');
  const workflow = normalizeWorkflowV1(JSON.parse(raw));

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

  const loaded = await loadRunFile(teamDir, runsDir, runId);
  const runLogPath = loaded.path;
  const runLog = loaded.run;

  if (runLog.status === 'completed' || runLog.status === 'rejected') {
    return { ok: true as const, runId, status: runLog.status, message: 'No-op; run already finished.' };
  }
  if (runLog.status !== 'awaiting_approval') {
    throw new Error(`Run is not awaiting approval (status=${runLog.status}).`);
  }

  const workflowFile = String(runLog.workflow.file);
  const workflowPath = path.join(workflowsDir, workflowFile);
  const workflowRaw = await fs.readFile(workflowPath, 'utf8');
  const workflow = normalizeWorkflowV1(JSON.parse(workflowRaw));

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
