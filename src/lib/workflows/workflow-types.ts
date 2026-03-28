export type WorkflowLane = 'backlog' | 'in-progress' | 'testing' | 'done';

export type WorkflowNodeKind = 'llm' | 'human_approval' | 'writeback' | 'tool' | 'start' | 'end' | 'if' | 'delay' | string;

export type WorkflowEdgeOn = 'success' | 'error' | 'always' | 'true' | 'false';

export type WorkflowNodeAssignment = {
  agentId: string;
};

export type WorkflowNodeInput = {
  from: string[]; // nodeIds
};

export type WorkflowNodeOutput = {
  // Relative to the run directory. Defaults to node-outputs/###-<nodeId>.json if omitted.
  path?: string;
  schema?: string;
};

export type WorkflowNodeAction = {
  // LLM
  promptTemplatePath?: string;

  // Tool
  tool?: string;
  args?: Record<string, unknown>;

  // Writeback
  writebackPaths?: string[];

  // Human approval
  approvalBindingId?: string;

  // future-proofing
  [k: string]: unknown;
};

export type WorkflowNode = {
  id: string;
  kind: WorkflowNodeKind;
  name?: string;

  assignedTo?: WorkflowNodeAssignment;
  input?: WorkflowNodeInput;
  action?: WorkflowNodeAction;
  output?: WorkflowNodeOutput;

  // Optional: allow nodes to move the ticket lane as part of execution.
  lane?: WorkflowLane;

  [k: string]: unknown;
};

export type WorkflowTrigger = {
  kind: 'cron' | string;
  cron?: string;
  tz?: string;
  [k: string]: unknown;
};

export type WorkflowEdge = {
  from: string;
  to: string;
  on?: WorkflowEdgeOn; // default: success
  [k: string]: unknown;
};

export type Workflow = {
  id: string;
  name?: string;
  triggers?: WorkflowTrigger[];
  nodes: WorkflowNode[];
  edges?: WorkflowEdge[];
  [k: string]: unknown;
};

export type RunEvent = Record<string, unknown> & { ts: string; type: string };

export type RunLog = {
  runId: string;
  createdAt: string;
  updatedAt?: string;
  teamId: string;
  workflow: { file: string; id: string | null; name: string | null };
  ticket: { file: string; number: string; lane: WorkflowLane };
  trigger: { kind: string; at?: string };
  status: string;
  // Delay/pause support (v1)
  resumeAt?: string | null;
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

export type ApprovalRecord = {
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
