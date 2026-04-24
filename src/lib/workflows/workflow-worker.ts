import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import type { ToolTextResult } from '../../toolsInvoke';
import { toolsInvoke } from '../../toolsInvoke';
import { classifyError, errorCategoryLabel } from './workflow-error-classify';
import { resolveTeamDir } from '../workspace';
import { getDriver } from './media-drivers/registry';
import { GenericDriver } from './media-drivers/generic.driver';
import type { WorkflowLane, WorkflowNode, RunLog } from './workflow-types';
import { dequeueNextTask, enqueueTask, hasPendingTaskFor, releaseTaskClaim, compactQueue } from './workflow-queue';
import { loadPriorLlmInput, loadProposedPostTextFromPriorNode } from './workflow-node-output-readers';
import { readTextFile } from './workflow-runner-io';
import { resolveApprovalBindingTarget } from './workflow-node-executor';
import { buildKitchenWorkflowReviewUrl } from './kitchen-review-url';
import {
  asRecord, asString, isRecord,
  normalizeWorkflow,
  assertLane, ensureDir, fileExists,
  isoCompact, nextTicketNumber, laneToStatus,
  moveRunTicket, appendRunLog, writeRunFile, loadRunFile,
  runFilePathFor, nodeLabel,
  loadNodeStatesFromRun, pickNextRunnableNodeIndex,
  sanitizeDraftOnlyText, templateReplace, expandFileIncludes,
} from './workflow-utils';

/**
 * Build memory context for LLM nodes by reading team memory files
 */
async function buildMemoryContext(teamDir: string): Promise<string> {
  try {
    const memoryDir = path.join(teamDir, 'shared-context', 'memory');
    
    // Check if memory directory exists
    if (!await fileExists(memoryDir)) {
      return '';
    }

    const memoryParts: string[] = [];
    const maxTokens = 2000; // Rough token budget
    let currentTokens = 0;

    // Read pinned items first (highest priority)
    const pinnedPath = path.join(memoryDir, 'pinned.jsonl');
    if (await fileExists(pinnedPath)) {
      const pinnedContent = await fs.readFile(pinnedPath, 'utf8');
      const pinnedItems = pinnedContent.trim().split('\n').filter(Boolean);
      
      if (pinnedItems.length > 0) {
        memoryParts.push('[Team Memory — Pinned]');
        for (const line of pinnedItems.slice(-5)) { // Last 5 pinned items
          try {
            const item = JSON.parse(line);
            if (item.content || item.text) {
              const summary = `- ${item.content || item.text} (${item.type || 'note'}, ${(item.ts || '').slice(0, 10)})`;
              if (currentTokens + summary.length * 0.25 < maxTokens) { // Rough token estimate
                memoryParts.push(summary);
                currentTokens += summary.length * 0.25;
              }
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }

    // Read recent items from other JSONL files  
    const files = await fs.readdir(memoryDir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl') && f !== 'pinned.jsonl');
    
    for (const filename of jsonlFiles) {
      if (currentTokens > maxTokens * 0.8) break; // Leave room for recent items
      
      const filePath = path.join(memoryDir, filename);
      const content = await fs.readFile(filePath, 'utf8');
      const items = content.trim().split('\n').filter(Boolean);
      
      if (items.length > 0) {
        const recentItems = items.slice(-3); // Last 3 items from each file
        for (const line of recentItems) {
          try {
            const item = JSON.parse(line);
            if (item.content || item.text) {
              const summary = `- ${item.content || item.text} (${item.type || 'note'}, ${(item.ts || '').slice(0, 10)})`;
              if (currentTokens + summary.length * 0.25 < maxTokens) {
                if (memoryParts.length === 1) { // Only pinned section exists
                  memoryParts.push('', '[Team Memory — Recent]');
                }
                memoryParts.push(summary);
                currentTokens += summary.length * 0.25;
              }
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }

    // If we have memory content, format it properly
    if (memoryParts.length > 1) {
      return memoryParts.join('\n') + '\n\n[Task]';
    }

    return '';
  } catch (error) {
    // Fail gracefully - memory injection is optional
    console.warn('Memory context injection failed:', error);
    return '';
  }
}

/**
 * Build template variables from prior node outputs for prompt/path interpolation.
 * Reused across LLM, media, tool, and fs nodes.
 */
async function buildTemplateVars(
  teamDir: string,
  runsDir: string,
  runId: string,
  workflowFile: string,
  workflow: { id?: string; name?: string },
): Promise<Record<string, string>> {
  const vars = {
    date: new Date().toISOString(),
    'run.id': runId,
    'run.timestamp': runId,
    'workflow.id': String(workflow.id ?? ''),
    'workflow.name': String(workflow.name ?? workflow.id ?? workflowFile),
  } as Record<string, string>;

  const { run: runSnap } = await loadRunFile(teamDir, runsDir, runId);

  // Expose triggerInput as template variables (for handoff-injected data)
  if (runSnap.triggerInput && typeof runSnap.triggerInput === 'object') {
    for (const [key, value] of Object.entries(runSnap.triggerInput)) {
      if (typeof value === 'string') {
        vars[`trigger.${key}`] = value;
      } else if (value !== null && value !== undefined) {
        vars[`trigger.${key}`] = JSON.stringify(value);
      }
    }
  }

  for (const nr of (runSnap.nodeResults ?? [])) {
    const nid = String((nr as Record<string, unknown>).nodeId ?? '');
    const nrOutPath = String((nr as Record<string, unknown>).nodeOutputPath ?? '');
    if (nid && nrOutPath) {
      try {
        const outAbs = path.resolve(teamDir, nrOutPath);
        const outputContent = await fs.readFile(outAbs, 'utf8');
        vars[`${nid}.output`] = outputContent;

        try {
          const parsed = JSON.parse(outputContent.trim());
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            for (const [key, value] of Object.entries(parsed)) {
              if (typeof value === 'string') {
                vars[`${nid}.${key}`] = value;
                if (key === 'text') {
                  try {
                    const nestedParsed = JSON.parse(value);
                    if (nestedParsed && typeof nestedParsed === 'object' && !Array.isArray(nestedParsed)) {
                      for (const [nestedKey, nestedValue] of Object.entries(nestedParsed)) {
                        if (typeof nestedValue === 'string') {
                          vars[`${nid}.${nestedKey}`] = nestedValue;
                        } else if (nestedValue !== null && nestedValue !== undefined) {
                          vars[`${nid}.${nestedKey}`] = JSON.stringify(nestedValue);
                        }
                      }
                    }
                  } catch { /* nested parse fail is fine */ }
                }
              } else if (value !== null && value !== undefined) {
                vars[`${nid}.${key}`] = JSON.stringify(value);
              }
            }
          }
        } catch { /* non-JSON output is fine */ }
      } catch { /* node output may not exist */ }
    }
  }

  return vars;
}

/**
 * Enqueue a workflow run from a handoff node.
 * This is a lightweight version of enqueueWorkflowRun that lives in the worker
 * to avoid circular imports (workflow-runner re-exports workflow-worker).
 */
async function enqueueWorkflowRunForHandoff(api: OpenClawPluginApi, opts: {
  teamId: string;
  workflowFile: string;
  trigger?: { kind: string; at?: string };
  triggerInput?: Record<string, unknown>;
}): Promise<{ runId: string; runLogPath: string }> {
  const teamId = String(opts.teamId);
  const teamDir = resolveTeamDir(api, teamId);
  const sharedContextDir = path.join(teamDir, 'shared-context');
  const workflowsDir = path.join(sharedContextDir, 'workflows');
  const runsDir = path.join(sharedContextDir, 'workflow-runs');

  const workflowPath = path.join(workflowsDir, opts.workflowFile);
  const raw = await readTextFile(workflowPath);
  const workflow = normalizeWorkflow(JSON.parse(raw));

  if (!workflow.nodes?.length) throw new Error('Handoff target workflow has no nodes');

  const firstLaneRaw = String(
    workflow.nodes.find(n => n?.config && typeof n.config === 'object' && 'lane' in n.config)?.config?.lane ?? 'backlog'
  );
  assertLane(firstLaneRaw);
  const initialLane: WorkflowLane = firstLaneRaw;

  const runId = `${isoCompact()}-${crypto.randomBytes(4).toString('hex')}`;
  await ensureDir(runsDir);

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

  const trigger = opts.trigger ?? { kind: 'handoff' };
  const createdAt = new Date().toISOString();
  const handoffMeta = opts.triggerInput?._handoff as Record<string, unknown> | undefined;

  const md = [
    `# ${ticketNum} — Workflow run: ${workflow.name ?? workflow.id ?? opts.workflowFile}\n\n`,
    `Owner: lead`,
    `Status: ${laneToStatus(initialLane)}`,
    `\n## Run`,
    `- workflow: ${path.relative(teamDir, workflowPath)}`,
    `- run dir: ${path.relative(teamDir, runDir)}`,
    `- run file: ${path.relative(teamDir, runLogPath)}`,
    `- trigger: ${trigger.kind}${trigger.at ? ` @ ${trigger.at}` : ''}`,
    `- runId: ${runId}`,
    handoffMeta ? `- handoff from: team=${handoffMeta.sourceTeamId}, workflow=${handoffMeta.sourceWorkflowName}, run=${handoffMeta.sourceRunId}` : '',
    `\n## Notes`,
    `- Created by: handoff node`,
    ``,
  ].filter(Boolean).join('\n');

  const initialLog: RunLog = {
    runId,
    createdAt,
    updatedAt: createdAt,
    teamId,
    workflow: { file: opts.workflowFile, id: workflow.id ?? null, name: workflow.name ?? null },
    ticket: { file: path.relative(teamDir, ticketPath), number: ticketNum, lane: initialLane },
    trigger,
    ...(opts.triggerInput && Object.keys(opts.triggerInput).length > 0 ? { triggerInput: opts.triggerInput } : {}),
    status: 'queued',
    priority: 0,
    claimedBy: null,
    claimExpiresAt: null,
    nextNodeIndex: 0,
    events: [{ ts: createdAt, type: 'run.enqueued', lane: initialLane, trigger: trigger.kind }],
    nodeResults: [],
  };

  await Promise.all([
    fs.writeFile(ticketPath, md, 'utf8'),
    fs.writeFile(runLogPath, JSON.stringify(initialLog, null, 2), 'utf8'),
  ]);

  return { runId, runLogPath };
}

/**
 * Check for waiting_handoff runs and resolve them if the target run has completed.
 * Called at the start of each worker tick before processing the normal queue.
 */
async function checkWaitingHandoffs(api: OpenClawPluginApi, teamId: string, teamDir: string): Promise<Array<{ runId: string; nodeId: string; status: string }>> {
  const results: Array<{ runId: string; nodeId: string; status: string }> = [];
  const runsDir = path.join(teamDir, 'shared-context', 'workflow-runs');

  // Scan all active runs for handoff-waits directories
  let runDirs: string[] = [];
  try {
    const entries = await fs.readdir(runsDir, { withFileTypes: true });
    runDirs = entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch { return results; }

  for (const runDirName of runDirs) {
    const runDir = path.join(runsDir, runDirName);
    const handoffWaitDir = path.join(runDir, 'handoff-waits');

    let waitFiles: string[] = [];
    try {
      const entries = await fs.readdir(handoffWaitDir);
      waitFiles = entries.filter(f => f.endsWith('.json'));
    } catch { continue; } // No handoff-waits dir

    if (waitFiles.length === 0) continue;

    // Load current run to verify it's still waiting_handoff
    const runPath = path.join(runDir, 'run.json');
    let run: RunLog;
    try {
      const raw = await fs.readFile(runPath, 'utf8');
      run = JSON.parse(raw) as RunLog;
    } catch { continue; }

    if (run.status !== 'waiting_handoff') {
      // Clean up stale wait markers
      for (const wf of waitFiles) {
        try { await fs.unlink(path.join(handoffWaitDir, wf)); } catch { /* ignore */ }
      }
      continue;
    }

    for (const waitFile of waitFiles) {
      const waitPath = path.join(handoffWaitDir, waitFile);
      let marker: {
        nodeId: string; nodeIdx: number;
        targetTeamId: string; targetWorkflowId: string; targetWorkflowFile: string;
        targetRunId: string; startedAt: string; timeoutAt: string;
        nodeOutputRel: string;
      };
      try {
        marker = JSON.parse(await fs.readFile(waitPath, 'utf8'));
      } catch { continue; }

      // Check timeout
      const now = Date.now();
      if (new Date(marker.timeoutAt).getTime() <= now) {
        // Timeout — fail the node
        const failTs = new Date().toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: 'error',
          nodeStates: { ...(cur.nodeStates ?? {}), [marker.nodeId]: { status: 'error', ts: failTs, message: 'Handoff wait timed out' } },
          events: [...cur.events, {
            ts: failTs, type: 'node.error', nodeId: marker.nodeId, kind: 'handoff',
            error: `Handoff wait timed out after ${Math.round((now - new Date(marker.startedAt).getTime()) / 1000)}s`,
          }],
        }));
        try { await fs.unlink(waitPath); } catch { /* ignore */ }
        results.push({ runId: run.runId, nodeId: marker.nodeId, status: 'timeout' });
        continue;
      }

      // Check target run status
      const targetTeamDir = resolveTeamDir(api, marker.targetTeamId);
      const targetRunsDir = path.join(targetTeamDir, 'shared-context', 'workflow-runs');
      let targetRun: RunLog;
      try {
        const loaded = await loadRunFile(targetTeamDir, targetRunsDir, marker.targetRunId);
        targetRun = loaded.run;
      } catch {
        // Target run not found — may have been cleaned up; fail
        const failTs = new Date().toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: 'error',
          nodeStates: { ...(cur.nodeStates ?? {}), [marker.nodeId]: { status: 'error', ts: failTs, message: 'Target run not found' } },
          events: [...cur.events, {
            ts: failTs, type: 'node.error', nodeId: marker.nodeId, kind: 'handoff',
            error: `Target run ${marker.targetRunId} not found in team ${marker.targetTeamId}`,
          }],
        }));
        try { await fs.unlink(waitPath); } catch { /* ignore */ }
        results.push({ runId: run.runId, nodeId: marker.nodeId, status: 'error' });
        continue;
      }

      if (targetRun.status === 'completed' || targetRun.status === 'done') {
        // Target completed — resolve handoff node with target's output
        const targetOutput: Record<string, unknown> = {};
        if (Array.isArray(targetRun.nodeResults)) {
          for (const nr of targetRun.nodeResults) {
            if (nr.nodeId && typeof nr.nodeId === 'string') {
              targetOutput[nr.nodeId as string] = nr;
            }
          }
        }

        const nodeOutputAbs = path.resolve(runDir, marker.nodeOutputRel);
        await ensureDir(path.dirname(nodeOutputAbs));
        const outputObj = {
          runId: run.runId,
          teamId,
          nodeId: marker.nodeId,
          kind: 'handoff',
          completedAt: new Date().toISOString(),
          text: JSON.stringify({
            targetTeamId: marker.targetTeamId,
            targetWorkflowId: marker.targetWorkflowId,
            targetRunId: marker.targetRunId,
            status: 'completed',
            targetOutput,
          }, null, 2),
        };
        await fs.writeFile(nodeOutputAbs, JSON.stringify(outputObj, null, 2) + '\n', 'utf8');

        const completedTs = new Date().toISOString();

        // Load workflow to find next node
        const workflowsDir = path.join(teamDir, 'shared-context', 'workflows');
        let workflow;
        try {
          const wfRaw = await fs.readFile(path.join(workflowsDir, run.workflow.file), 'utf8');
          workflow = normalizeWorkflow(JSON.parse(wfRaw));
        } catch { workflow = null; }

        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: 'waiting_workers',
          nextNodeIndex: marker.nodeIdx + 1,
          nodeStates: { ...(cur.nodeStates ?? {}), [marker.nodeId]: { status: 'success', ts: completedTs } },
          events: [...cur.events, {
            ts: completedTs, type: 'node.completed', nodeId: marker.nodeId, kind: 'handoff',
            targetTeamId: marker.targetTeamId, targetWorkflowId: marker.targetWorkflowId,
            targetRunId: marker.targetRunId, mode: 'wait-for-completion',
            nodeOutputPath: marker.nodeOutputRel,
          }],
        }));

        // Enqueue next node if workflow is available
        if (workflow) {
          const updatedRun = (await loadRunFile(teamDir, runsDir, run.runId)).run;
          const nextIdx = pickNextRunnableNodeIndex({ workflow, run: updatedRun });

          if (nextIdx !== null && nextIdx >= 0 && nextIdx < workflow.nodes.length) {
            const nextNode = workflow.nodes[nextIdx];
            if (nextNode.type === 'end' || nextNode.type === 'start') {
              // Auto-complete start/end
              const autoTs = new Date().toISOString();
              await appendRunLog(runPath, (cur) => ({
                ...cur,
                nextNodeIndex: nextIdx + 1,
                nodeStates: { ...(cur.nodeStates ?? {}), [nextNode.id]: { status: 'success', ts: autoTs } },
                events: [...cur.events, { ts: autoTs, type: 'node.completed', nodeId: nextNode.id, kind: nextNode.type }],
              }));
              // Check if run is done
              const afterAutoRun = (await loadRunFile(teamDir, runsDir, run.runId)).run;
              const afterNext = pickNextRunnableNodeIndex({ workflow, run: afterAutoRun });
              if (afterNext === null) {
                const doneTs = new Date().toISOString();
                await appendRunLog(runPath, (cur) => ({
                  ...cur,
                  status: 'completed',
                  events: [...cur.events, { ts: doneTs, type: 'run.completed' }],
                }));
              }
            } else {
              // Enqueue next real node to the appropriate agent's queue
              const assignedAgent = String(nextNode.assignedTo ?? '').trim();
              const targetAgent = assignedAgent || run.claimedBy || '';
              if (targetAgent) {
                await enqueueTask(teamDir, targetAgent, {
                  teamId,
                  runId: run.runId,
                  nodeId: nextNode.id,
                  kind: 'execute_node',
                });
              }
            }
          } else if (nextIdx === null) {
            // All nodes done
            const doneTs = new Date().toISOString();
            await appendRunLog(runPath, (cur) => ({
              ...cur,
              status: 'completed',
              events: [...cur.events, { ts: doneTs, type: 'run.completed' }],
            }));
          }
        }

        try { await fs.unlink(waitPath); } catch { /* ignore */ }
        results.push({ runId: run.runId, nodeId: marker.nodeId, status: 'completed' });
      } else if (targetRun.status === 'error' || targetRun.status === 'failed') {
        // Target failed — fail the handoff node too
        const failTs = new Date().toISOString();
        const lastError = targetRun.events?.filter(e => e.type === 'node.error').pop();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: 'error',
          nodeStates: { ...(cur.nodeStates ?? {}), [marker.nodeId]: {
            status: 'error', ts: failTs,
            message: `Target workflow failed: ${lastError?.error ?? 'unknown error'}`,
          } },
          events: [...cur.events, {
            ts: failTs, type: 'node.error', nodeId: marker.nodeId, kind: 'handoff',
            error: `Target run ${marker.targetRunId} failed`,
          }],
        }));
        try { await fs.unlink(waitPath); } catch { /* ignore */ }
        results.push({ runId: run.runId, nodeId: marker.nodeId, status: 'error' });
      }
      // else: still running — do nothing, check again next tick
    }
  }
  return results;
}

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

  // Check for waiting_handoff runs before processing normal queue
  try {
    const handoffResults = await checkWaitingHandoffs(api, teamId, teamDir);
    for (const hr of handoffResults) {
      results.push({ taskId: '', runId: hr.runId, nodeId: hr.nodeId, status: `handoff:${hr.status}` });
    }
  } catch { /* handoff check is best-effort */ }

  // Default lock TTL (used when we don't know the node config yet).
  // This must be comfortably larger than typical media generation durations.
  const DEFAULT_LOCK_TTL_MS = 30 * 60 * 1000;

  // Once we know the node config, we can set a tighter (but still safe) TTL.
  const MIN_NODE_LOCK_TTL_MS = 10 * 60 * 1000;
  const LOCK_TTL_BUFFER_MS = 2 * 60 * 1000;
  const getNodeLockTtlMs = (node: WorkflowNode): number => {
    const timeoutMsRaw = asRecord(node?.config ?? {})['timeoutMs'];
    const timeoutMs = typeof timeoutMsRaw === 'number' && Number.isFinite(timeoutMsRaw) ? timeoutMsRaw : 0;
    return Math.max(MIN_NODE_LOCK_TTL_MS, timeoutMs + LOCK_TTL_BUFFER_MS);
  };

  // We want to process up to `limit` ACTUAL executions per tick. Stale tasks
  // (runs that are already past the dequeued node — e.g. after a terminal
  // run leaves dead entries in a shared agent queue) don't do any real work,
  // so they shouldn't consume the execution budget; otherwise a backlog of
  // stale tasks can starve in-flight runs for several ticks.
  //
  // Cap the total number of dequeue attempts to keep a pathological queue
  // from turning a single tick into an unbounded scan.
  let executedCount = 0;
  const maxDequeues = Math.max(limit * 4, limit + 20);
  for (let totalDequeues = 0; executedCount < limit && totalDequeues < maxDequeues; totalDequeues++) {
    const dq = await dequeueNextTask(teamDir, agentId, { workerId, leaseSeconds: 120 });
    if (!dq.ok || !dq.task) break;

    const { task } = dq.task;
    const runPath = runFilePathFor(runsDir, task.runId);
    const runDir = path.dirname(runPath);
    const lockDir = path.join(runDir, 'locks');
    const lockPath = path.join(lockDir, `${task.nodeId}.lock`);
    let lockHeld = false;
    // Tracks whether this dequeue should count against the execution budget.
    // Defaults to true; the stale-skip path below flips it to false so stale
    // tasks (queue entries for nodes that already advanced past success)
    // don't starve real work from the `limit` budget.
    //
    // NOTE: `skipped_locked` does NOT flip this flag. Lock contention means
    // real work is pending (just held up by another worker or a ghost lock),
    // and the skipped_locked branch re-enqueues the task to avoid losing it.
    // Letting lock contention escape the budget here would amplify that
    // re-enqueue within a single tick: each dequeue past the cursor would
    // drop a new copy at the tail (hasPendingTaskFor can't see it yet), and
    // the loop would fabricate up to `maxDequeues` duplicates for one stuck
    // lock. Bounding lock contention by the normal limit keeps the queue
    // growth to O(limit) per tick.
    let countedTowardLimit = true;

    try {
      if (task.kind !== 'execute_node') continue;

      await ensureDir(lockDir);

      const claimedAtIso = new Date().toISOString();
      const lockInfo = {
        workerId,
        pid: process.pid,
        taskId: task.id,
        claimedAt: claimedAtIso,
        ttlMs: DEFAULT_LOCK_TTL_MS,
        expiresAt: new Date(Date.now() + DEFAULT_LOCK_TTL_MS).toISOString(),
      };

      // Node-level lock to prevent double execution.
      try {
        await fs.writeFile(lockPath, JSON.stringify(lockInfo, null, 2), { encoding: 'utf8', flag: 'wx' });
        lockHeld = true;
      } catch {
        // Lock exists. Treat it as contention unless it looks stale.
        // (If a worker crashed, the lock file can stick around and block retries/revisions forever.)
        let unlocked = false;
        try {
          const raw = await readTextFile(lockPath);
          const parsed = JSON.parse(raw) as { claimedAt?: string; ttlMs?: number; expiresAt?: string };

          const expiresAtMs = parsed?.expiresAt ? Date.parse(String(parsed.expiresAt)) : NaN;
          const claimedAtMs = parsed?.claimedAt ? Date.parse(String(parsed.claimedAt)) : NaN;
          const parsedTtlMs = typeof parsed?.ttlMs === 'number' && Number.isFinite(parsed.ttlMs) ? parsed.ttlMs : NaN;

          const computedExpiryMs = Number.isFinite(claimedAtMs) && Number.isFinite(parsedTtlMs)
            ? claimedAtMs + parsedTtlMs
            : NaN;

          // Prefer explicit expiresAt from the lock file; otherwise fall back to (claimedAt + ttlMs).
          // If neither exists (older locks), fall back to DEFAULT_LOCK_TTL_MS.
          const effectiveExpiryMs = Number.isFinite(expiresAtMs)
            ? expiresAtMs
            : Number.isFinite(computedExpiryMs)
              ? computedExpiryMs
              : Number.isFinite(claimedAtMs)
                ? claimedAtMs + DEFAULT_LOCK_TTL_MS
                : NaN;

          const stale = Number.isFinite(effectiveExpiryMs) && Date.now() > effectiveExpiryMs;
          if (stale) {
            await fs.unlink(lockPath);
            unlocked = true;
          }
        } catch { // intentional: best-effort stale lock removal
          // ignore
        }

        if (unlocked) {
          try {
            await fs.writeFile(lockPath, JSON.stringify(lockInfo, null, 2), { encoding: 'utf8', flag: 'wx' });
            lockHeld = true;
          } catch { // intentional: lock contention, skip task
            // Counts against the budget — see note on `countedTowardLimit`.
            results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'skipped_locked' });
            continue;
          }
        } else {
          // The lock is still live and held by another worker. The cursor has
          // already advanced past this task, so under naive logic we'd lose it.
          // Re-enqueue — but ONLY if no equivalent task is already pending
          // AND the run still exists. Without the run.json check, a lock-held
          // task for a deleted run gets endlessly re-enqueued, crash-looping
          // every tick that dequeues it.
          const runStillExists = await fileExists(runFilePathFor(runsDir, task.runId));
          if (!runStillExists) {
            countedTowardLimit = false;
            results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'skipped_stale' });
            continue;
          }
          const alreadyPending = await hasPendingTaskFor(teamDir, agentId, {
            runId: task.runId,
            nodeId: task.nodeId,
          });
          if (!alreadyPending) {
            await enqueueTask(teamDir, agentId, {
              teamId,
              runId: task.runId,
              nodeId: task.nodeId,
              kind: 'execute_node',
            });
          }
          // Counts against the budget — see note on `countedTowardLimit`.
          results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'skipped_locked' });
          continue;
        }
      }

      const runId = task.runId;

      // loadRunFile + workflow/node lookup can throw if the run dir was
      // removed out from under us (manual cleanup, workspace reset) or if
      // the workflow JSON renamed/removed this node between enqueue and
      // dequeue. The outer try has only a finally, so a throw here would
      // escape the tick and crash the CLI — which in a 1-minute cron loop
      // means every subsequent tick dies the same way until an operator
      // manually drains the queue. Skip stale instead.
      let run: RunLog;
      let workflow: ReturnType<typeof normalizeWorkflow>;
      let workflowFile: string;
      let nodeIdx: number;
      try {
        ({ run } = await loadRunFile(teamDir, runsDir, runId));
        workflowFile = String(run.workflow.file);
        const workflowPath = path.join(workflowsDir, workflowFile);
        const workflowRaw = await readTextFile(workflowPath);
        workflow = normalizeWorkflow(JSON.parse(workflowRaw));
        nodeIdx = workflow.nodes.findIndex((n) => String(n.id) === String(task.nodeId));
        if (nodeIdx < 0) throw new Error(`Node not found in workflow: ${task.nodeId}`);
      } catch (err) {
        countedTowardLimit = false;
        // Log the reason so operators can diagnose; don't add it to the
        // result shape (kept narrow for downstream consumers).
        try {
          console.warn(`[workflow-worker] skip_stale taskId=${task.id} runId=${task.runId} nodeId=${task.nodeId} reason=${(err as Error)?.message ?? String(err)}`);
        } catch { /* log best-effort */ }
        results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'skipped_stale' });
        continue;
      }
      const node = workflow.nodes[nodeIdx]!;

      // Now that we know the node, tighten the lock TTL based on node.config.timeoutMs.
      try {
        const nodeLockTtlMs = getNodeLockTtlMs(node);
        if (nodeLockTtlMs !== lockInfo.ttlMs) {
          await fs.writeFile(
            lockPath,
            JSON.stringify({ ...lockInfo, ttlMs: nodeLockTtlMs, expiresAt: new Date(Date.now() + nodeLockTtlMs).toISOString() }, null, 2),
            { encoding: 'utf8' },
          );
        }
      } catch { // intentional: best-effort lock metadata update
        // ignore
      }

      // Stale-task guard: expired claim recovery can surface older queue entries from behind the
      // cursor. Before executing a dequeued task, verify that this node is still actually runnable
      // for the current run state. Otherwise we can resurrect pre-approval work and overwrite
      // canonical node outputs for runs that already advanced.
      const currentNodeStates = loadNodeStatesFromRun(run, { workflow });
      const currentStatus = currentNodeStates[String(node.id)]?.status;
      const currentlyRunnableIdx = pickNextRunnableNodeIndex({ workflow, run });
      if (
        currentStatus === 'success' ||
        currentStatus === 'error' ||
        currentStatus === 'waiting' ||
        currentlyRunnableIdx === null ||
        String(workflow.nodes[currentlyRunnableIdx]?.id ?? '') !== String(node.id)
      ) {
        countedTowardLimit = false;
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

      const promptRaw = promptTemplateInline ? promptTemplateInline : await readTextFile(promptPathAbs);

      const vars = await buildTemplateVars(teamDir, runsDir, runId, workflowFile, workflow);
      const promptVarsResolved = templateReplace(promptRaw, vars);
      // Inline `{{file:<relative-path>}}` contents so LLM nodes can see workspace files
      // they cannot fetch themselves (llm-task is one-shot, no tool loop).
      const prompt = await expandFileIncludes(promptVarsResolved, teamDir);

      // Build output format instructions from outputFields when defined
      const nodeConfig = asRecord((node as unknown as Record<string, unknown>)['config']);
      const outputFields = Array.isArray(nodeConfig['outputFields']) ? nodeConfig['outputFields'] as Array<Record<string, string>> : [];
      const validFields = outputFields.filter(f => typeof f === 'object' && f && typeof f['name'] === 'string' && f['name'].trim());

      let outputFormatBlock: string;
      if (validFields.length > 0) {
        const fieldDescriptions = validFields.map(f => {
          const name = String(f['name']).trim();
          const type = String(f['type'] ?? 'text').trim();
          const typeHint = type === 'list' ? '(array of strings)'
                         : type === 'json' ? '(JSON object)'
                         : '(string)';
          return `  - "${name}" ${typeHint}`;
        }).join('\n');
        outputFormatBlock = [
          'Return a JSON object with EXACTLY these fields:',
          fieldDescriptions,
          '',
          'Rules:',
          '- Return ONLY the JSON object, no markdown fences or explanation.',
          '- Every field listed above MUST be present in your response.',
          '- "text" fields → string values.',
          '- "list" fields → arrays of strings.',
          '- "json" fields → nested JSON objects.',
          '- You may include additional fields if genuinely useful, but the listed fields are required.',
        ].join('\n');
      } else {
        outputFormatBlock = 'Return ONLY the final content (the worker will store it as JSON).';
      }

      const taskText = [
        `You are executing a workflow run for teamId=${teamId}.`,
        `Workflow: ${workflow.name ?? workflow.id ?? workflowFile}`,
        `RunId: ${runId}`,
        `Node: ${nodeLabel(node)}`,
        `\n---\nPROMPT TEMPLATE\n---\n`,
        prompt.trim(),
        `\n---\nOUTPUT FORMAT\n---\n`,
        outputFormatBlock,
      ].join('\n');

      let text = '';
      try {

        const priorInput = await loadPriorLlmInput({ runDir, workflow, currentNode: node, currentNodeIndex: nodeIdx });

        const timeoutMsRaw = Number(asString(action['timeoutMs'] ?? (node as unknown as { config?: unknown })?.config?.['timeoutMs'] ?? '120000'));
        const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 120000;
        const configuredModel = asString(action['model'] ?? (node as unknown as { config?: unknown })?.config?.['model']).trim();
        const configuredProvider = asString(action['provider'] ?? (node as unknown as { config?: unknown })?.config?.['provider']).trim();
        let provider = configuredProvider;
        let model = configuredModel;
        if (model) {
          const slash = model.indexOf('/');
          if (slash > 0 && slash < model.length - 1) {
            const modelProvider = model.slice(0, slash).trim();
            const bareModel = model.slice(slash + 1).trim();
            if (!provider) provider = modelProvider;
            if (provider === modelProvider) model = bareModel;
          }
        }

        // Inject team memory context for LLM nodes
        const memoryContext = await buildMemoryContext(teamDir);
        const promptWithMemory = memoryContext ? `${memoryContext}\n\n${taskText}` : taskText;

        // Build JSON Schema from outputFields for structured validation
        let outputSchema: Record<string, unknown> | undefined;
        if (validFields.length > 0) {
          const properties: Record<string, Record<string, unknown>> = {};
          const required: string[] = [];
          for (const f of validFields) {
            const name = String(f['name']).trim();
            const type = String(f['type'] ?? 'text').trim();
            required.push(name);
            if (type === 'list') {
              properties[name] = { type: 'array', items: { type: 'string' } };
            } else if (type === 'json') {
              properties[name] = { type: 'object' };
            } else {
              properties[name] = { type: 'string' };
            }
          }
          outputSchema = {
            type: 'object',
            properties,
            required,
          };
        }

        const llmRes = await toolsInvoke<unknown>(api, {
          tool: 'llm-task',
          action: 'json',
          args: {
            prompt: promptWithMemory,
            input: { teamId, runId, nodeId: node.id, agentId, ...priorInput },
            timeoutMs,
            ...(provider ? { provider } : {}),
            ...(model ? { model } : {}),
            ...(outputSchema ? { schema: outputSchema } : {}),
          },
        });

        const llmRec = asRecord(llmRes);
        const details = asRecord(llmRec['details']);
        const payload = details['json'] ?? (Object.keys(details).length ? details : llmRes) ?? null;
        // Store string payloads (e.g. markdown) as-is so `{{node.text}}` substitutes
        // the original content. JSON.stringify(string) would wrap it in quotes and
        // escape newlines, which breaks downstream fs.write consumers that expect
        // plain text. Object/array payloads still get pretty-printed.
        text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
      } catch (e) {
        const eRec = asRecord(e);
        const errorCategory = classifyError(e);
        const errorDetails = {
          message: e instanceof Error ? e.message : String(e),
          name: e instanceof Error ? e.name : undefined,
          stack: e instanceof Error ? e.stack : undefined,
          error: eRec['error'],
          details: eRec['details'],
          data: eRec['data'],
          cause: e instanceof Error && 'cause' in e ? (e as Error & { cause?: unknown }).cause : undefined,
          errorCategory,
          errorCategoryLabel: errorCategory !== 'unknown' ? errorCategoryLabel(errorCategory) : undefined,
        };
        const errMsg = `LLM execution failed for node ${nodeLabel(node)}: ${errorDetails.message}`;
        const errorTs = new Date().toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: 'error',
          updatedAt: errorTs,
          nodeStates: {
            ...(cur.nodeStates ?? {}),
            [node.id]: { status: 'error', ts: errorTs, error: errMsg, details: errorDetails, errorCategory },
          },
          events: [
            ...cur.events,
            { ts: errorTs, type: 'node.error', nodeId: node.id, kind: node.kind, message: errMsg, details: errorDetails, errorCategory },
          ],
          nodeResults: [
            ...(cur.nodeResults ?? []),
            { nodeId: node.id, kind: node.kind, agentId: agentIdExec, error: errMsg, details: errorDetails, errorCategory },
          ],
        }));
        results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'error', errorCategory });
        continue;
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

      const kitchenReviewUrl = buildKitchenWorkflowReviewUrl(api, teamId, String(workflow.id ?? ''));
      const msg = [
        `Approval requested: ${workflow.name ?? workflow.id ?? workflowFile}`,
        `Ticket: ${path.relative(teamDir, curTicketPath)}`,
        `Code: ${code}`,
        proposed ? `\n---\nPROPOSED POST (X)\n---\n${proposed}` : `\n(Warning: no proposed text found to preview)`,
        `\nReply with:`,
        `- approve ${code}`,
        `- decline ${code} <what to change>`,
        `\n(You can also review in Kitchen: ${kitchenReviewUrl})`,
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
      // Captures the "human-readable output" each tool produced so the post-
      // branch code can surface it as `.text` in the node-output file for
      // downstream `{{nodeId.field}}` templating. Each branch sets this.
      let toolOutputText = '';
      try {
        // Runner-native tools (preferred): do NOT depend on gateway tool exposure.
        if (toolName === 'fs.append') {
          const relPathRaw = String(toolArgs.path ?? '').trim();
          const contentRaw = String(toolArgs.content ?? '');
          if (!relPathRaw) throw new Error('fs.append requires args.path');
          if (!contentRaw) throw new Error('fs.append requires args.content');

          const vars = await buildTemplateVars(teamDir, runsDir, runId, workflowFile, workflow);

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
          toolOutputText = JSON.stringify(result);

        } else if (toolName === 'fs.write') {
          const relPathRaw = String(toolArgs.path ?? '').trim();
          const contentRaw = String(toolArgs.content ?? '');
          if (!relPathRaw) throw new Error('fs.write requires args.path');

          const vars = await buildTemplateVars(teamDir, runsDir, runId, workflowFile, workflow);
          const relPath = templateReplace(relPathRaw, vars);
          const content = templateReplace(contentRaw, vars);

          const abs = path.resolve(teamDir, relPath);
          if (!abs.startsWith(teamDir + path.sep) && abs !== teamDir) {
            throw new Error('fs.write path must be within the team workspace');
          }

          await ensureDir(path.dirname(abs));
          await fs.writeFile(abs, content, 'utf8');

          const result = { writtenTo: path.relative(teamDir, abs), bytes: Buffer.byteLength(content, 'utf8') };
          await fs.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: toolArgs, result }, null, 2) + '\n', 'utf8');
          toolOutputText = JSON.stringify(result);

        } else {
          const vars = await buildTemplateVars(teamDir, runsDir, runId, workflowFile, workflow);

          // Apply template variable replacement to all string values in toolArgs
          const processedToolArgs: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(toolArgs)) {
            if (typeof value === 'string') {
              processedToolArgs[key] = templateReplace(value, vars);
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
              // Recursively process nested objects
              const processedObject: Record<string, unknown> = {};
              for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
                if (typeof nestedValue === 'string') {
                  processedObject[nestedKey] = templateReplace(nestedValue, vars);
                } else {
                  processedObject[nestedKey] = nestedValue;
                }
              }
              processedToolArgs[key] = processedObject;
            } else {
              processedToolArgs[key] = value;
            }
          }

          let toolRes: unknown;
          if (toolName === 'exec') {
            // Route exec tool calls through the plugin SDK runtime instead of
            // the gateway — the gateway exec tool is session-gated and unavailable
            // to most workflow worker sessions.
            const command = String((processedToolArgs as Record<string, unknown>).command ?? '');
            const workdir = String((processedToolArgs as Record<string, unknown>).workdir ?? teamDir);
            // Timeout priority: args.timeout (seconds) > config.timeoutMs (ms) > 120s default
            const nodeConfig = asRecord((node as unknown as Record<string, unknown>)['config']);
            const argsTimeoutSec = Number((processedToolArgs as Record<string, unknown>).timeout) || 0;
            const configTimeoutMs = Number(nodeConfig['timeoutMs']) || 0;
            const timeoutSec = argsTimeoutSec || (configTimeoutMs > 0 ? Math.ceil(configTimeoutMs / 1000) : 120);
            const result = await api.runtime.system.runCommandWithTimeout(
              ['bash', '-c', command],
              { timeoutMs: timeoutSec * 1000, cwd: workdir },
            );
            if (result.code !== 0) {
              const stderr = String(result.stderr ?? '').trim();
              const stdout = String(result.stdout ?? '').trim();
              const combined = [stderr, stdout].filter(Boolean).join('\n---stdout---\n');
              throw new Error(`exec failed (code=${result.code}):\n${combined}`);
            }
            toolRes = { stdout: result.stdout, stderr: result.stderr, code: result.code };
          } else {
            toolRes = await toolsInvoke<unknown>(api, {
              tool: toolName,
              args: processedToolArgs,
            });
          }

          await fs.writeFile(artifactPath, JSON.stringify({ ok: true, tool: toolName, args: processedToolArgs, result: toolRes }, null, 2) + '\n', 'utf8');

          // Surface tool output as `.text` so downstream `{{nodeId.field}}`
          // templating resolves. For `exec`, use stdout (commonly JSON emitted
          // by a script, which buildTemplateVars parses into per-field vars).
          // For other tools, use the raw string or stringified object.
          if (toolName === 'exec' && toolRes && typeof toolRes === 'object' && 'stdout' in (toolRes as Record<string, unknown>)) {
            toolOutputText = String((toolRes as { stdout?: unknown }).stdout ?? '').trim();
          } else if (typeof toolRes === 'string') {
            toolOutputText = toolRes;
          } else {
            toolOutputText = JSON.stringify(toolRes, null, 2);
          }
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
          text: toolOutputText,
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
        const errorCategory = classifyError(e);
        await fs.writeFile(artifactPath, JSON.stringify({ ok: false, tool: toolName, error: (e as Error).message, errorCategory }, null, 2) + '\n', 'utf8');
        const errorTs = new Date().toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: 'error',
          nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'error', ts: errorTs, errorCategory } },
          events: [...cur.events, { ts: errorTs, type: 'node.error', nodeId: node.id, kind: node.kind, tool: toolName, message: (e as Error).message, artifactPath: path.relative(teamDir, artifactPath), errorCategory }],
          nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, tool: toolName, error: (e as Error).message, artifactPath: path.relative(teamDir, artifactPath), errorCategory }],
        }));
        results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'error', error: (e as Error).message, errorCategory });
        continue;
      }
    } else if (kind === 'media-image' || kind === 'media-video' || kind === 'media-audio') {
      // ── Media generation nodes ──────────────────────────────────────────
      // Two-step process:
      //   1. LLM generates a refined prompt (image_prompt / video_prompt)
      //   2. Agent invokes the selected skill to produce the actual media
      const config = asRecord((node as unknown as Record<string, unknown>)['config']);
      const action = asRecord(node.action);

      const mediaType = asString(config['mediaType'] ?? kind.replace('media-', '')).trim() || 'image';
      const provider = asString(config['provider'] ?? action['provider']).trim();
      const promptTemplateRaw = asString(config['promptTemplate'] ?? config['prompt'] ?? action['promptTemplate'] ?? action['prompt']).trim();
      const size = asString(config['size']).trim() || '1024x1024';
      const quality = asString(config['quality']).trim() || 'standard';
      const style = asString(config['style']).trim() || 'natural';
      const outputPathRaw = asString(config['outputPath']).trim();
      const agentIdMedia = asString(config['agentId'] ?? action['agentId'] ?? '').trim();

      if (!promptTemplateRaw) throw new Error(`Node ${nodeLabel(node)} missing prompt or promptTemplate for media generation`);

      const vars = await buildTemplateVars(teamDir, runsDir, task.runId, workflowFile, workflow);
      // Add node-level vars that templateReplace doesn't normally include
      vars['node.id'] = node.id;
      const promptVarsResolved = templateReplace(promptTemplateRaw, vars);
      const prompt = await expandFileIncludes(promptVarsResolved, teamDir);
      const outputRelPath = templateReplace(outputPathRaw, vars);

      const defaultNodeOutputRel = path.join('node-outputs', `${String(nodeIdx).padStart(3, '0')}-${node.id}.json`);
      const nodeOutputRel = String(node?.output?.path ?? '').trim() || defaultNodeOutputRel;
      const nodeOutputAbs = path.resolve(runDir, nodeOutputRel);
      await ensureDir(path.dirname(nodeOutputAbs));

      // Determine the output media directory for the skill to save into
      const mediaDir = outputRelPath
        ? path.resolve(runDir, path.dirname(outputRelPath))
        : path.resolve(runDir, 'media');
      await ensureDir(mediaDir);

      const promptKey = mediaType === 'video' ? 'video_prompt' : 'image_prompt';

      let text = '';
      try {
        // Inject team memory context
        const memoryContext = await buildMemoryContext(teamDir);
        const timeoutMsRaw = Number(asString(config['timeoutMs'] ?? '300000'));
        const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 300000;

        // ── Step 1: Prompt refinement (opt-in) ──
        // addRefinement: explicitly request an LLM refinement pass.
        // Default is OFF — upstream LLM nodes should produce ready-to-use briefs.
        const addRefinement = String(config['addRefinement'] ?? config['add_refinement'] ?? 'false').toLowerCase() === 'true';
        let refinedPrompt = prompt.trim();

        if (addRefinement && mediaType !== 'image') {
          // Use llm-task refinement for non-image media (video/audio)
          const step1Text = [
            `You are a media prompt engineer for teamId=${teamId}.`,
            `Workflow: ${workflow.name ?? workflow.id ?? workflowFile}`,
            `Node: ${nodeLabel(node)} | Media type: ${mediaType}`,
            `Size: ${size} | Quality: ${quality} | Style: ${style}`,
            `\n---\nINPUT PROMPT\n---\n`,
            prompt.trim(),
            `\n---\nINSTRUCTIONS\n---\n`,
            `Refine the input into a detailed, production-ready ${mediaType} generation prompt.`,
            `Return JSON with exactly one key: "${promptKey}" containing the refined prompt string.`,
            `Example: {"${promptKey}": "A detailed description..."}`,
          ].filter(Boolean).join('\n');

          const step1Prompt = memoryContext ? `${memoryContext}\n\n${step1Text}` : step1Text;

          try {
            const step1Res = await toolsInvoke<unknown>(api, {
              tool: 'llm-task',
              action: 'json',
              args: { prompt: step1Prompt, timeoutMs: 60000 },
            });
            const step1Rec = asRecord(step1Res);
            const step1Details = asRecord(step1Rec['details']);
            const step1Json = (step1Details['json'] ?? step1Details ?? step1Res) as Record<string, unknown>;
            const extracted = asString(
              step1Json[promptKey] ?? step1Json['image_prompt'] ?? step1Json['video_prompt'] ?? step1Json['prompt']
            ).trim();
            if (extracted) refinedPrompt = extracted;
          } catch {
            // Prompt refinement failed — fall through with original prompt
          }
        }

        if (!refinedPrompt) throw new Error('Empty prompt for media generation');

        // Truncate prompt to stay within DALL-E 3's 4000 char limit
        const MAX_IMAGE_PROMPT_LEN = 3800; // leave headroom
        if (mediaType === 'image' && refinedPrompt.length > MAX_IMAGE_PROMPT_LEN) {
          refinedPrompt = refinedPrompt.slice(0, MAX_IMAGE_PROMPT_LEN).replace(/\s+\S*$/, '') + '...';
        }

        // ── Step 2: Invoke the media driver to generate actual media ─────
        const providerSlug = provider;

        // Find a registered driver, or fall back to auto-discovered generic driver
        let driver = getDriver(providerSlug);
        if (!driver) {
          const discovered = await GenericDriver.createFromSkill(providerSlug);
          if (discovered) driver = discovered;
        }

        let payload: Record<string, unknown>;
        if (driver) {
          const result = await driver.invoke({
            api,
            prompt: refinedPrompt,
            outputDir: mediaDir,
            timeout: timeoutMs,
            config: node.config as Record<string, unknown> | undefined,
          });

          payload = {
            [promptKey]: refinedPrompt,
            file_path: result.filePath,
            status: result.filePath ? 'success' : 'error',
            skill: driver.slug,
            script_output: (result.metadata as any)?.script_output ?? '',
            error: result.filePath ? null : 'No file path returned from driver',
          };
        } else {
          payload = {
            [promptKey]: refinedPrompt,
            file_path: '',
            status: 'no_driver',
            skill: providerSlug,
            error: `No media driver found for provider "${providerSlug}"`,
          };
        }
        text = JSON.stringify(payload, null, 2);
      } catch (e) {
        const errorCategory = classifyError(e);
        const errDetails = e instanceof Error
          ? { message: e.message, name: e.name, stack: e.stack?.split('\n').slice(0, 5).join(' | ') }
          : { message: String(e) };
        const errMsg = `Media generation failed for node ${nodeLabel(node)}: ${JSON.stringify(errDetails)}`;
        const errorTs = new Date().toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: 'error',
          updatedAt: errorTs,
          nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'error', ts: errorTs, error: errMsg, errorCategory } },
          events: [...cur.events, { ts: errorTs, type: 'node.error', nodeId: node.id, kind: node.kind, message: errMsg, errorCategory }],
          nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, agentId: agentIdMedia || agentId, error: errMsg, errorCategory }],
        }));
        results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'error', errorCategory });
        continue;
      }

      // Save output
      const outputObj = {
        runId: task.runId,
        teamId,
        nodeId: node.id,
        kind: node.kind,
        mediaType,
        provider,
        agentId: agentIdMedia || agentId,
        completedAt: new Date().toISOString(),
        outputPath: outputRelPath,
        mediaDir,
        text,
      };
      await fs.writeFile(nodeOutputAbs, JSON.stringify(outputObj, null, 2) + '\n', 'utf8');

      const completedTs = new Date().toISOString();
      await appendRunLog(runPath, (cur) => ({
        ...cur,
        nextNodeIndex: nodeIdx + 1,
        nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
        events: [...cur.events, { ts: completedTs, type: 'node.completed', nodeId: node.id, kind: node.kind, nodeOutputPath: path.relative(teamDir, nodeOutputAbs) }],
        nodeResults: [...(cur.nodeResults ?? []), { nodeId: node.id, kind: node.kind, mediaType, agentId: agentIdMedia || agentId, nodeOutputPath: path.relative(teamDir, nodeOutputAbs), bytes: new TextEncoder().encode(text).byteLength }],
      }));
    } else if (kind === 'handoff') {
      // ── Handoff node: trigger a run on another workflow (optionally on a different team) ──
      const config = asRecord((node as unknown as Record<string, unknown>)['config']);
      const action = asRecord(node.action);

      const targetTeamId = asString(config['targetTeamId'] ?? action['targetTeamId']).trim() || teamId;
      const targetWorkflowId = asString(config['targetWorkflowId'] ?? action['targetWorkflowId']).trim();
      if (!targetWorkflowId) throw new Error(`Node ${nodeLabel(node)} missing config.targetWorkflowId`);

      // Resolve variable mapping: each key is the target's trigger input key, each value is a {{template}} expression
      const variableMapping = asRecord(config['variableMapping'] ?? action['variableMapping']);

      // Build template vars from prior node outputs
      const vars = await buildTemplateVars(teamDir, runsDir, task.runId, workflowFile, workflow);
      vars['node.id'] = node.id;

      // Resolve mapped variables
      const triggerInput: Record<string, unknown> = {
        _handoff: {
          sourceTeamId: teamId,
          sourceWorkflowId: String(workflow.id ?? ''),
          sourceWorkflowName: String(workflow.name ?? workflow.id ?? workflowFile),
          sourceRunId: task.runId,
          sourceNodeId: node.id,
        },
      };
      for (const [targetKey, templateExpr] of Object.entries(variableMapping)) {
        if (typeof templateExpr === 'string') {
          triggerInput[targetKey] = templateReplace(templateExpr, vars);
        }
      }

      // Find the target workflow file
      const targetTeamDir = resolveTeamDir(api, targetTeamId);
      const targetWorkflowsDir = path.join(targetTeamDir, 'shared-context', 'workflows');
      let targetWorkflowFile = '';

      // Try exact filename match first, then search by workflow id
      const candidateFiles = [
        `${targetWorkflowId}.json`,
        `${targetWorkflowId}`,
      ];
      for (const candidate of candidateFiles) {
        const candidatePath = path.join(targetWorkflowsDir, candidate);
        if (await fileExists(candidatePath)) {
          targetWorkflowFile = candidate;
          break;
        }
      }

      // If not found by filename, scan workflows for matching id
      if (!targetWorkflowFile) {
        try {
          const wfFiles = await fs.readdir(targetWorkflowsDir);
          for (const wf of wfFiles) {
            if (!wf.endsWith('.json')) continue;
            try {
              const wfPath = path.join(targetWorkflowsDir, wf);
              const wfRaw = await fs.readFile(wfPath, 'utf8');
              const wfParsed = JSON.parse(wfRaw);
              if (String(wfParsed.id ?? '') === targetWorkflowId || String(wfParsed.name ?? '') === targetWorkflowId) {
                targetWorkflowFile = wf;
                break;
              }
            } catch { /* skip unparseable workflows */ }
          }
        } catch { /* target workflows dir may not exist */ }
      }

      if (!targetWorkflowFile) {
        throw new Error(`Handoff target workflow "${targetWorkflowId}" not found in team "${targetTeamId}"`);
      }

      // Enqueue the target workflow run with triggerInput
      const enqueueResult = await enqueueWorkflowRunForHandoff(api, {
        teamId: targetTeamId,
        workflowFile: targetWorkflowFile,
        trigger: { kind: 'handoff', at: new Date().toISOString() },
        triggerInput,
      });

      const handoffMode = asString(config['mode'] ?? 'fire-and-forget').trim() || 'fire-and-forget';

      // Save initial handoff output
      const defaultNodeOutputRel = path.join('node-outputs', `${String(nodeIdx).padStart(3, '0')}-${node.id}.json`);
      const nodeOutputRel = String(node?.output?.path ?? '').trim() || defaultNodeOutputRel;
      const nodeOutputAbs = path.resolve(runDir, nodeOutputRel);
      await ensureDir(path.dirname(nodeOutputAbs));

      if (handoffMode === 'wait-for-completion') {
        // Phase 2: Wait for target run to complete
        const waitTimeoutMs = typeof config['waitTimeoutMs'] === 'number' ? config['waitTimeoutMs'] as number : 5 * 60 * 1000;

        const outputObj = {
          runId: task.runId,
          teamId,
          nodeId: node.id,
          kind: 'handoff',
          text: JSON.stringify({
            targetTeamId,
            targetWorkflowId,
            targetWorkflowFile,
            targetRunId: enqueueResult.runId,
            status: 'waiting',
            triggerInputKeys: Object.keys(triggerInput),
          }, null, 2),
        };
        await fs.writeFile(nodeOutputAbs, JSON.stringify(outputObj, null, 2) + '\n', 'utf8');

        // Write handoff wait marker so the polling loop can find it
        const handoffWaitDir = path.join(runDir, 'handoff-waits');
        await ensureDir(handoffWaitDir);
        const waitMarker = {
          nodeId: node.id,
          nodeIdx,
          targetTeamId,
          targetWorkflowId,
          targetWorkflowFile,
          targetRunId: enqueueResult.runId,
          startedAt: new Date().toISOString(),
          timeoutAt: new Date(Date.now() + waitTimeoutMs).toISOString(),
          nodeOutputRel,
        };
        await fs.writeFile(
          path.join(handoffWaitDir, `${node.id}.json`),
          JSON.stringify(waitMarker, null, 2) + '\n',
          'utf8',
        );

        const waitingTs = new Date().toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          status: 'waiting_handoff',
          nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'waiting', ts: waitingTs } },
          events: [...cur.events, {
            ts: waitingTs, type: 'node.waiting_handoff', nodeId: node.id, kind: 'handoff',
            targetTeamId, targetWorkflowId, targetRunId: enqueueResult.runId,
            mode: 'wait-for-completion', timeoutAt: waitMarker.timeoutAt,
          }],
          nodeResults: [...(cur.nodeResults ?? []), {
            nodeId: node.id, kind: 'handoff',
            targetTeamId, targetWorkflowId, targetRunId: enqueueResult.runId,
            nodeOutputPath: path.relative(teamDir, nodeOutputAbs),
          }],
        }));

        results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'waiting_handoff' });
        continue; // Skip the normal next-node enqueue logic
      } else {
        // Fire-and-forget: complete immediately
        const outputObj = {
          runId: task.runId,
          teamId,
          nodeId: node.id,
          kind: 'handoff',
          completedAt: new Date().toISOString(),
          text: JSON.stringify({
            targetTeamId,
            targetWorkflowId,
            targetWorkflowFile,
            targetRunId: enqueueResult.runId,
            status: 'enqueued',
            triggerInputKeys: Object.keys(triggerInput),
          }, null, 2),
        };
        await fs.writeFile(nodeOutputAbs, JSON.stringify(outputObj, null, 2) + '\n', 'utf8');

        const completedTs = new Date().toISOString();
        await appendRunLog(runPath, (cur) => ({
          ...cur,
          nextNodeIndex: nodeIdx + 1,
          nodeStates: { ...(cur.nodeStates ?? {}), [node.id]: { status: 'success', ts: completedTs } },
          events: [...cur.events, {
            ts: completedTs, type: 'node.completed', nodeId: node.id, kind: 'handoff',
            targetTeamId, targetWorkflowId, targetRunId: enqueueResult.runId,
            nodeOutputPath: path.relative(teamDir, nodeOutputAbs),
          }],
          nodeResults: [...(cur.nodeResults ?? []), {
            nodeId: node.id, kind: 'handoff',
            targetTeamId, targetWorkflowId, targetRunId: enqueueResult.runId,
            nodeOutputPath: path.relative(teamDir, nodeOutputAbs),
          }],
        }));
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

    if (updated.status === 'waiting_handoff') {
      results.push({ taskId: task.id, runId: task.runId, nodeId: task.nodeId, status: 'waiting_handoff' });
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
      // Route approval nodes to the correct agent:
      //   1. Explicit agentId on the node config (workflow author override)
      //   2. Team lead (${teamId}-lead) — the natural orchestrator role
      //   3. Fallback to the current agent (backwards compat)
      const nextConfig = (nextNode as unknown as Record<string, unknown>)['config'];
      const nextConfigObj = nextConfig && typeof nextConfig === 'object' && !Array.isArray(nextConfig)
        ? (nextConfig as Record<string, unknown>) : {};
      const explicitAgentId = String(nextConfigObj['agentId'] ?? '').trim();
      const approvalAgentId = explicitAgentId || `${teamId}-lead` || agentId;

      await enqueueTask(teamDir, approvalAgentId, {
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
        events: [...cur.events, { ts: new Date().toISOString(), type: 'node.enqueued', nodeId: nextNode.id, agentId: approvalAgentId }],
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
      if (countedTowardLimit) executedCount++;
    }

  }

  // Compact the queue to prevent unbounded growth from processed entries.
  try {
    await compactQueue(teamDir, agentId);
  } catch { /* intentional: best-effort compaction */ }

  return { ok: true as const, teamId, agentId, workerId, results };
}
