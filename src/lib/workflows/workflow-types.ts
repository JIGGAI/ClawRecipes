export type WorkflowLane = 'backlog' | 'in-progress' | 'testing' | 'done';

export type WorkflowNodeKind = 'llm' | 'human_approval' | 'writeback' | 'tool' | string;

export type WorkflowNodeConfig = {
  agentId?: string;
  lane?: WorkflowLane;
  promptTemplatePath?: string;
  outputPath?: string;
  approvalBindingId?: string;
  writebackPaths?: string[];
  // future-proofing
  [k: string]: unknown;
};

export type WorkflowNode = {
  id: string;
  // New runner schema uses `kind`; ClawKitchen workflow.v1 uses `type` (start/end/tool/etc).
  // We accept both and normalize at runtime.
  kind?: WorkflowNodeKind;
  type?: string;
  name?: string;
  config?: WorkflowNodeConfig;
  [k: string]: unknown;
};

export type WorkflowTrigger = {
  kind: 'cron' | string;
  cron?: string;
  tz?: string;
  [k: string]: unknown;
};

export type WorkflowV1 = {
  version?: string;
  id?: string;
  name?: string;
  triggers?: WorkflowTrigger[];
  nodes: WorkflowNode[];
  edges?: Array<{ from: string; to: string; [k: string]: unknown }>;
  [k: string]: unknown;
};
