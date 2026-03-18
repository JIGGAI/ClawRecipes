import fs from 'node:fs/promises';
import path from 'node:path';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import type { ToolTextResult } from '../../toolsInvoke';
import { toolsInvoke } from '../../toolsInvoke';
import { resolveTeamDir } from '../workspace';
import type { WorkflowLane } from './workflow-types';
import { dequeueNextTask, enqueueTask, releaseTaskClaim } from './workflow-queue';
import { loadPriorLlmInput, loadProposedPostTextFromPriorNode } from './workflow-node-output-readers';
import { readTextFile } from './workflow-runner-io';
import { resolveApprovalBindingTarget } from './workflow-node-executor';
import {
  asRecord, asString, isRecord,
  normalizeWorkflow,
  assertLane, ensureDir, fileExists,
  moveRunTicket, appendRunLog, writeRunFile, loadRunFile,
  runFilePathFor, nodeLabel,
  loadNodeStatesFromRun, pickNextRunnableNodeIndex,
  sanitizeDraftOnlyText, templateReplace,
} from './workflow-utils';

// eslint-disable-next-line complexity, max-lines-per-function
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

  const teamDir = resolveTeamDir(api, teamId);
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
    const runPath = runFilePathFor(runsDir, task.runId);
    const runDir = path.dirname(runPath);
    const lockDir = path.join(runDir, 'locks');
    const lockPath = path.join(lockDir, `${task.nodeId}.lock`);
    let lockHeld = false;

    try {
      if (task.kind !== 'execute_node') continue;

      await ensureDir(lockDir);

      // Node-level lock to prevent double execution.
      try {
        await fs.writeFile(lockPath, JSON.stringify({ workerId, taskId: task.id, claimedAt: new Date().toISOString() }, null, 2), { encoding: 'utf8', flag: 'wx' });
        lockHeld = true;
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
        } catch { // intentional: best-effort stale lock removal
          // ignore
        }

        if (unlocked) {
          try {
            await fs.writeFile(lockPath, JSON.stringify({ workerId, taskId: task.id, claimedAt: new Date().toISOString() }, null, 2), { encoding: 'utf8', flag: 'wx' });
            lockHeld = true;
          } catch { // intentional: lock contention, skip task
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

      const runId = task.runId;

      const { run } = await loadRunFile(teamDir, runsDir, runId);
    const workflowFile = String(run.workflow.file);
    const workflowPath = path.join(workflowsDir, workflowFile);
    const workflowRaw = await readTextFile(workflowPath);
    const workflow = normalizeWorkflow(JSON.parse(workflowRaw));

    const nodeIdx = workflow.nodes.findIndex((n) => String(n.id) === String(task.nodeId));
    if (nodeIdx < 0) throw new Error(`Node not found in workflow: ${task.nodeId}`);
    const node = workflow.nodes[nodeIdx]!;

    // Stale-task guard: expired claim recovery can surface older queue entries from behind the
    // cursor. Before executing a dequeued task, verify that this node is still actually runnable
    // for the current run state. Otherwise we can resurrect pre-approval work and overwrite
    // canonical node outputs for runs that already advanced.
    const currentRun = (await loadRunFile(teamDir, runsDir, task.runId)).run;
    const currentNodeStates = loadNodeStatesFromRun(currentRun);
    const currentStatus = currentNodeStates[String(node.id)]?.status;
    const currentlyRunnableIdx = pickNextRunnableNodeIndex({ workflow, run: currentRun });
    if (
      currentStatus === 'success' ||
      currentStatus === 'error' ||
      currentStatus === 'waiting' ||
      currentlyRunnableIdx === null ||
      String(workflow.nodes[currentlyRunnableIdx]?.id ?? '') !== String(node.id)
    ) {
      results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'skipped_stale' });
      continue;
    }

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
        } catch { // intentional: fallback from llm-task-fixed to llm-task
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
      } catch { // intentional: best-effort proposed text load
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
      if (lockHeld) {
        try {
          await fs.unlink(lockPath);
        } catch { // intentional: best-effort lock cleanup
          // ignore
        }
      }
      try {
        await releaseTaskClaim(teamDir, agentId, task.id);
      } catch { // intentional: best-effort claim release
        // ignore
      }
    }

  }

  return { ok: true as const, teamId, agentId, workerId, results };
}
