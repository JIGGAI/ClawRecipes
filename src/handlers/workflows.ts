import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { approveWorkflowRun, resumeWorkflowRun, runWorkflowOnce } from '../lib/workflows/workflow-runner';

export async function handleWorkflowsRun(api: OpenClawPluginApi, opts: {
  teamId: string;
  workflowFile: string;
}) {
  if (!opts.teamId) throw new Error('--team-id is required');
  if (!opts.workflowFile) throw new Error('--workflow-file is required');
  return runWorkflowOnce(api, {
    teamId: opts.teamId,
    workflowFile: opts.workflowFile,
    trigger: { kind: 'manual', at: new Date().toISOString() },
  });
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
