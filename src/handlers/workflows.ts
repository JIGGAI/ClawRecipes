import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';
import { runWorkflowOnce } from '../lib/workflows/workflow-runner';

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
