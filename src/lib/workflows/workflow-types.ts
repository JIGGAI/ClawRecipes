export type WorkflowLane = 'backlog' | 'in-progress' | 'testing' | 'done';

export type WorkflowNodeKind = 'llm' | 'human_approval' | 'writeback' | 'tool' | 'start' | 'end' | string;

export type WorkflowEdgeOn = 'success' | 'error' | 'always';

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
