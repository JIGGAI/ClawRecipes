import fs from 'node:fs/promises';
import path from 'node:path';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import type { ToolTextResult } from '../../toolsInvoke';
import { toolsInvoke } from '../../toolsInvoke';
import { loadOpenClawConfig } from '../recipes-config';
import type { Workflow, WorkflowEdge, WorkflowLane, WorkflowNode, RunLog } from './workflow-types';
import { outboundPublish, type OutboundApproval, type OutboundMedia, type OutboundPlatform } from './outbound-client';
import { sanitizeOutboundPostText } from './outbound-sanitize';
import { loadPriorLlmInput, loadProposedPostTextFromPriorNode } from './workflow-node-output-readers';
import { readTextFile } from './workflow-runner-io';
import { evalIfCondition, lastIfValueFromRun } from './workflow-if';
import {
  asRecord, asString,
  ensureDir, fileExists,
  moveRunTicket, appendRunLog, nodeLabel,
  loadNodeStatesFromRun, sanitizeDraftOnlyText, templateReplace,
} from './workflow-utils';

export async function resolveApprovalBindingTarget(api: OpenClawPluginApi, bindingId: string): Promise<{ channel: string; target: string; accountId?: string }> {
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
export async function executeWorkflowNodes(opts: {
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

    if (on === 'true' || on === 'false') {
      if (from !== 'success') return false;
      const v = lastIfValueFromRun(curRun, fromId);
      if (v === null) return false;
      return on === 'true' ? v === true : v === false;
    }

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

    if (kind === 'if') {
      const runDir = path.dirname(runLogPath);
      const action = asRecord(node.action);
      const lhs = asString(action['lhs']).trim();
      const op = asString(action['op']).trim();
      const rhs = action['rhs'];
      if (!lhs) throw new Error(`Node ${nodeLabel(node)} missing action.lhs`);
      if (!op) throw new Error(`Node ${nodeLabel(node)} missing action.op`);

      const evalRes = await evalIfCondition({ runDir, condition: { lhs, op: op as 'truthy', rhs } });

      const defaultNodeOutputRel = path.join('node-outputs', `${String(i).padStart(3, '0')}-${node.id}.json`);
      const nodeOutputRel = String(node?.output?.path ?? '').trim() || defaultNodeOutputRel;
      const nodeOutputAbs = path.resolve(path.dirname(runLogPath), nodeOutputRel);
      await ensureDir(path.dirname(nodeOutputAbs));
      await fs.writeFile(nodeOutputAbs, JSON.stringify({
        runId, teamId, nodeId: node.id, kind: node.kind,
        completedAt: new Date().toISOString(), value: evalRes.value, detail: evalRes.detail,
      }, null, 2) + '\n', 'utf8');

      const completedTs = new Date().toISOString();
      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        nextNodeIndex: i + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
        events: [...cur.events, { ts: completedTs, type: 'node.completed', nodeId: node.id, kind, value: evalRes.value, nodeOutputPath: path.relative(teamDir, nodeOutputAbs) }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, value: evalRes.value, nodeOutputPath: path.relative(teamDir, nodeOutputAbs) }],
      }));
      nodeStates[String(node.id)] = { status: 'success', ts: completedTs };
      continue;
    }

    if (kind === 'delay') {
      const action = asRecord(node.action);
      const secondsRaw = action['seconds'] ?? action['delaySeconds'] ?? action['durationSeconds'];
      const msRaw = action['ms'] ?? action['delayMs'] ?? action['durationMs'];
      const sec = typeof secondsRaw === 'number' ? secondsRaw : Number(secondsRaw);
      const ms = typeof msRaw === 'number' ? msRaw : Number(msRaw);
      const delayMs = Number.isFinite(ms) && ms > 0 ? ms : Number.isFinite(sec) && sec > 0 ? sec * 1000 : 0;
      if (!delayMs) throw new Error(`Node ${nodeLabel(node)} missing delay duration (action.delaySeconds or action.delayMs)`);

      const maxDelayMs = 7 * 24 * 60 * 60 * 1000;
      const effectiveDelayMs = Math.min(delayMs, maxDelayMs);
      const resumeAt = new Date(Date.now() + effectiveDelayMs).toISOString();

      const completedTs = new Date().toISOString();
      await appendRunLog(runLogPath, (cur) => ({
        ...cur,
        status: 'paused',
        resumeAt,
        nextNodeIndex: i + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
        events: [
          ...cur.events,
          { ts: completedTs, type: 'node.completed', nodeId: node.id, kind, delayMs: effectiveDelayMs, resumeAt },
          { ts: completedTs, type: 'run.paused', nodeId: node.id, resumeAt },
        ],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind, delayMs: effectiveDelayMs, resumeAt }],
      }));
      nodeStates[String(node.id)] = { status: 'success', ts: completedTs };
      return { ticketPath: curTicketPath, lane: curLane, status: 'completed' };
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

      let text = '';
      try {

        const priorInput = await loadPriorLlmInput({ runDir, workflow, currentNode: node, currentNodeIndex: i });

        const timeoutMsRaw = Number(asString(action['timeoutMs'] ?? (node as unknown as { config?: unknown })?.config?.['timeoutMs'] ?? '120000'));
        const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 120000;

        const llmRes = await toolsInvoke<unknown>(api, {
          tool: 'llm-task',
          action: 'json',
          args: {
            prompt: task,
            input: { teamId, runId, nodeId: node.id, agentId, ...priorInput },
            timeoutMs,
          },
        });

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
      } catch { // intentional: best-effort proposed text load
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
