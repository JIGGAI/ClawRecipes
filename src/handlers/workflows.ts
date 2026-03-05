import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { approveWorkflowRun, enqueueWorkflowRun, pollWorkflowApprovals, resumeWorkflowRun, runWorkflowRunnerOnce, runWorkflowRunnerTick, runWorkflowWorkerTick } from '../lib/workflows/workflow-runner';

export async function handleWorkflowsRun(api: OpenClawPluginApi, opts: {
  teamId: string;
  workflowFile: string;
}) {
  if (!opts.teamId) throw new Error('--team-id is required');
  if (!opts.workflowFile) throw new Error('--workflow-file is required');
  return enqueueWorkflowRun(api, {
    teamId: opts.teamId,
    workflowFile: opts.workflowFile,
    trigger: { kind: 'manual', at: new Date().toISOString() },
  });
}

export async function handleWorkflowsRunnerOnce(api: OpenClawPluginApi, opts: {
  teamId: string;
  leaseSeconds?: number;
}) {
  if (!opts.teamId) throw new Error('--team-id is required');
  return runWorkflowRunnerOnce(api, { teamId: opts.teamId, leaseSeconds: opts.leaseSeconds });
}




export async function handleWorkflowsRunnerTick(api: OpenClawPluginApi, opts: {
  teamId: string;
  concurrency?: number;
  leaseSeconds?: number;
}) {
  if (!opts.teamId) throw new Error('--team-id is required');
  return runWorkflowRunnerTick(api, { teamId: opts.teamId, concurrency: opts.concurrency, leaseSeconds: opts.leaseSeconds });
}

export async function handleWorkflowsWorkerTick(api: OpenClawPluginApi, opts: {
  teamId: string;
  agentId: string;
  limit?: number;
  workerId?: string;
}) {
  if (!opts.teamId) throw new Error('--team-id is required');
  if (!opts.agentId) throw new Error('--agent-id is required');
  return runWorkflowWorkerTick(api, { teamId: opts.teamId, agentId: opts.agentId, limit: opts.limit, workerId: opts.workerId });
}


export async function handleWorkflowsApprove(api: OpenClawPluginApi, opts: {
  teamId: string;
  runId: string;
  approved: boolean;
  note?: string;
}) {
  if (!opts.teamId) throw new Error('--team-id is required');
  if (!opts.runId) throw new Error('--run-id is required');
  return approveWorkflowRun(api, {
    teamId: opts.teamId,
    runId: opts.runId,
    approved: !!opts.approved,
    ...(opts.note ? { note: opts.note } : {}),
  });
}

export async function handleWorkflowsResume(api: OpenClawPluginApi, opts: {
  teamId: string;
  runId: string;
}) {
  if (!opts.teamId) throw new Error('--team-id is required');
  if (!opts.runId) throw new Error('--run-id is required');
  return resumeWorkflowRun(api, { teamId: opts.teamId, runId: opts.runId });
}

export async function handleWorkflowsPollApprovals(api: OpenClawPluginApi, opts: {
  teamId: string;
  limit?: number;
}) {
  if (!opts.teamId) throw new Error('--team-id is required');
  return pollWorkflowApprovals(api, { teamId: opts.teamId, limit: opts.limit });
}
