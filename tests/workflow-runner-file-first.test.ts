import { describe, expect, test, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const toolCalls: Array<{ tool: string; args?: any; action?: string }> = [];

// Per-test override for what the mocked llm-task should return. Reset between tests.
const llmResponseOverride: { value: unknown | undefined } = { value: undefined };

// The workflow runner/worker uses toolsInvoke for message sends (human approval) and llm-task.
// For unit tests, mock it so we can exercise approval + revision flows without a gateway.
vi.mock("../src/toolsInvoke", () => {
  return {
    toolsInvoke: async (api: any, req: any) => {
      toolCalls.push({ tool: String(req?.tool ?? ""), args: req?.args, action: req?.action });
      if (String(req?.tool ?? "") === "llm-task" && llmResponseOverride.value !== undefined) {
        return llmResponseOverride.value;
      }
      return { ok: true, mocked: true };
    },
  };
});

import {
  approveWorkflowRun,
  enqueueWorkflowRun,
  resumeWorkflowRun,
  runWorkflowRunnerOnce,
  runWorkflowWorkerTick,
} from "../src/lib/workflows/workflow-runner";
import { enqueueTask } from "../src/lib/workflows/workflow-queue";

async function mkTmpWorkspace() {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "clawrecipes-workflow-runner-test-"));
  const workspaceRoot = path.join(base, "workspace");
  await fs.mkdir(workspaceRoot, { recursive: true });
  return { base, workspaceRoot };
}

function stubApi(extra?: { pluginConfig?: any }): OpenClawPluginApi {
  // Only api.config + api.pluginConfig are used by workflow runner/worker in these tests.
  return { config: {}, ...(extra ?? {}) } as any;
}

describe("workflow-runner (file-first + runner/worker)", () => {
  test("worker executes tool fs.append and run completes", async () => {
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t1";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    try {
      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "demo.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);

      const workflow = {
        id: "demo",
        name: "Demo: fs.append via worker",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "append-log",
            kind: "tool",
            assignedTo: { agentId: "agent-a" },
            action: {
              tool: "fs.append",
              args: {
                path: "shared-context/APPEND_LOG.md",
                content: "- {{date}} run={{run.id}}\n",
              },
            },
          },
          { id: "end", kind: "end" },
        ],
        edges: [
          { from: "start", to: "append-log", on: "success" },
          { from: "append-log", to: "end", on: "success" },
        ],
      };

      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi();

      const enq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(enq.ok).toBe(true);

      const r1 = await runWorkflowRunnerOnce(api, { teamId });
      expect(r1.ok).toBe(true);
      expect(r1.claimed).toBe(1);

      // Runner should have enqueued node work for agent-a.
      const w1 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-a", limit: 5, workerId: "worker-a" });
      expect(w1.ok).toBe(true);

      const runRaw = await fs.readFile(enq.runLogPath, "utf8");
      const run = JSON.parse(runRaw) as { status: string };
      expect(run.status).toBe("completed");

      const appended = await fs.readFile(path.join(teamDir, "shared-context", "APPEND_LOG.md"), "utf8");
      expect(appended).toContain("run=");
    } finally {
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  test("fs.append templates args.path (e.g. {{run.id}})", async () => {
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t-path";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    try {
      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "path-templating.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);

      const workflow = {
        id: "path-templating",
        name: "Demo: fs.append path templating",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "append-log",
            kind: "tool",
            assignedTo: { agentId: "agent-a" },
            action: {
              tool: "fs.append",
              args: {
                path: "shared-context/workflow-runs/{{run.id}}/artifacts/fs-append.log",
                content: "hello run={{run.id}}\n",
              },
            },
          },
          { id: "end", kind: "end" },
        ],
        edges: [
          { from: "start", to: "append-log", on: "success" },
          { from: "append-log", to: "end", on: "success" },
        ],
      };

      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi();

      const enq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(enq.ok).toBe(true);

      const r1 = await runWorkflowRunnerOnce(api, { teamId });
      expect(r1.ok).toBe(true);

      const w1 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-a", limit: 5, workerId: "worker-a" });
      expect(w1.ok).toBe(true);

      const runId = enq.runId;

      const rendered = path.join(teamDir, "shared-context", "workflow-runs", runId, "artifacts", "fs-append.log");
      const raw = await fs.readFile(rendered, "utf8");
      expect(raw).toContain(`run=${runId}`);

      // Sanity: we should NOT have created a literal {{run.id}} directory.
      const literal = path.join(teamDir, "shared-context", "workflow-runs", "{{run.id}}", "artifacts", "fs-append.log");
      await expect(fs.stat(literal)).rejects.toThrow();
    } finally {
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });


  test("needs_revision clears downstream completion so revised node re-enqueues downstream nodes", async () => {
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t2";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    try {
      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "revise.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);

      // draft_assets (tool) -> human_approval -> publish (tool)
      const workflow = {
        id: "revise-demo",
        name: "Demo: needs_revision resumes downstream",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "draft_assets",
            kind: "tool",
            assignedTo: { agentId: "agent-writer" },
            action: {
              tool: "fs.append",
              args: { path: "shared-context/DRAFT_LOG.md", content: "draft {{date}} run={{run.id}}\n" },
            },
          },
          {
            id: "approval",
            kind: "human_approval",
            action: { provider: "telegram", target: "123" },
          },
          {
            id: "publish",
            kind: "tool",
            assignedTo: { agentId: "agent-publisher" },
            action: {
              tool: "fs.append",
              args: { path: "shared-context/PUBLISH_LOG.md", content: "publish {{date}} run={{run.id}}\n" },
            },
          },
          { id: "end", kind: "end" },
        ],
        edges: [
          { from: "start", to: "draft_assets", on: "success" },
          { from: "draft_assets", to: "approval", on: "success" },
          { from: "approval", to: "publish", on: "success" },
          { from: "publish", to: "end", on: "success" },
        ],
      };

      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi();

      const enq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(enq.ok).toBe(true);

      // Runner enqueues start->draft_assets on agent-writer.
      const r1 = await runWorkflowRunnerOnce(api, { teamId });
      expect(r1.ok).toBe(true);

      // Execute draft_assets (enqueues approval onto team lead).
      const w1 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-writer", limit: 10, workerId: "worker-writer" });
      expect(w1.ok).toBe(true);

      // Lead picks up the approval node and sets awaiting_approval.
      const wLead1 = await runWorkflowWorkerTick(api, { teamId, agentId: `${teamId}-lead`, limit: 10, workerId: "worker-lead" });
      expect(wLead1.ok).toBe(true);

      // Reject approval and resume -> should enqueue draft_assets again (needs_revision).
      const runId = enq.runId;
      await approveWorkflowRun(api, { teamId, runId, approved: false, note: "change it" });
      const resumed = await resumeWorkflowRun(api, { teamId, runId });
      expect(resumed.ok).toBe(true);
      expect(resumed.status).toBe("needs_revision");

      // Run the writer again to execute the revision draft_assets.
      const w2 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-writer", limit: 10, workerId: "worker-writer-2" });
      expect(w2.ok).toBe(true);

      // After revised draft_assets completes, the run should NOT be completed; it should re-enqueue approval again.
      const runRaw2 = await fs.readFile(enq.runLogPath, "utf8");
      const run2 = JSON.parse(runRaw2) as { status: string; events?: Array<any> };
      expect(run2.status).not.toBe("completed");

      const types = (run2.events ?? []).map((e) => e?.type).filter(Boolean);
      expect(types).toContain("node.enqueued");
    } finally {
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  test("worker releases claim when lock contention causes requeue", async () => {
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t-lock";
    const teamDir = path.join(base, `workspace-${teamId}`);

    try {
      await enqueueTask(teamDir, "agent-a", {
        teamId,
        runId: "run-lock",
        nodeId: "node-lock",
        kind: "execute_node",
      });

      const lockDir = path.join(teamDir, "shared-context", "workflow-runs", "run-lock", "locks");
      await fs.mkdir(lockDir, { recursive: true });
      const lockPath = path.join(lockDir, "node-lock.lock");
      await fs.writeFile(
        lockPath,
        JSON.stringify({ workerId: "other-worker", taskId: "existing", claimedAt: new Date().toISOString() }, null, 2),
        "utf8"
      );

      const api = stubApi();
      const w1 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-a", limit: 1, workerId: "worker-a" });
      expect(w1.ok).toBe(true);
      expect(w1.results[0]?.status).toBe("skipped_locked");

      const claimsDir = path.join(teamDir, "shared-context", "workflow-queues", "claims");
      const claimFiles = await fs.readdir(claimsDir).catch(() => []);
      expect(claimFiles.length).toBe(0);
    } finally {
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  test("resume after approval follows graph runnable node (not approval index + 1)", async () => {
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t-resume-graph";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    try {
      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "resume-graph.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);
      const workflow = {
        id: "resume-graph",
        name: "Resume uses graph successor",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "draft",
            kind: "tool",
            assignedTo: { agentId: "agent-writer" },
            action: { tool: "fs.append", args: { path: "shared-context/DRAFT.md", content: "draft\n" } },
          },
          { id: "approval", kind: "human_approval", action: { provider: "telegram", target: "123" } },
          { id: "end", kind: "end" },
          {
            id: "publish",
            kind: "tool",
            assignedTo: { agentId: "agent-publisher" },
            action: { tool: "fs.append", args: { path: "shared-context/PUBLISH.md", content: "publish\n" } },
          },
        ],
        edges: [
          { from: "start", to: "draft", on: "success" },
          { from: "draft", to: "approval", on: "success" },
          { from: "approval", to: "publish", on: "success" },
          { from: "publish", to: "end", on: "success" },
        ],
      };
      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi();
      const enq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(enq.ok).toBe(true);

      const r1 = await runWorkflowRunnerOnce(api, { teamId });
      expect(r1.ok).toBe(true);
      const w1 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-writer", limit: 10, workerId: "worker-writer" });
      expect(w1.ok).toBe(true);

      // Lead picks up the approval node and sets awaiting_approval.
      const wLead = await runWorkflowWorkerTick(api, { teamId, agentId: `${teamId}-lead`, limit: 10, workerId: "worker-lead" });
      expect(wLead.ok).toBe(true);

      await approveWorkflowRun(api, { teamId, runId: enq.runId, approved: true });
      const resumed = await resumeWorkflowRun(api, { teamId, runId: enq.runId });
      expect(resumed.ok).toBe(true);
      expect(resumed.status).toBe("waiting_workers");

      const w2 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-publisher", limit: 10, workerId: "worker-publisher" });
      expect(w2.ok).toBe(true);

      const runRaw = await fs.readFile(enq.runLogPath, "utf8");
      const run = JSON.parse(runRaw) as { status: string };
      expect(run.status).toBe("completed");
    } finally {
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  test("approval update + resume work when agent workspace is nested under the team dir", async () => {
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base } = await mkTmpWorkspace();
    delete process.env.OPENCLAW_WORKSPACE;

    const teamId = "t-nested-workspace";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const agentWorkspace = path.join(teamDir, "roles", "lead");
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    try {
      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(agentWorkspace, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "nested-approval.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);
      const workflow = {
        id: "nested-approval",
        name: "Nested workspace approval flow",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "draft",
            kind: "tool",
            assignedTo: { agentId: "agent-writer" },
            action: { tool: "fs.append", args: { path: "shared-context/DRAFT.md", content: "draft\n" } },
          },
          { id: "approval", kind: "human_approval", action: { provider: "telegram", target: "123" } },
          {
            id: "publish",
            kind: "tool",
            assignedTo: { agentId: "agent-publisher" },
            action: { tool: "fs.append", args: { path: "shared-context/PUBLISH.md", content: "publish\n" } },
          },
          { id: "end", kind: "end" },
        ],
        edges: [
          { from: "start", to: "draft", on: "success" },
          { from: "draft", to: "approval", on: "success" },
          { from: "approval", to: "publish", on: "success" },
          { from: "publish", to: "end", on: "success" },
        ],
      };
      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi({ config: { agents: { defaults: { workspace: agentWorkspace } } } as any });
      const enq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(enq.ok).toBe(true);

      await runWorkflowRunnerOnce(api, { teamId });
      await runWorkflowWorkerTick(api, { teamId, agentId: "agent-writer", limit: 10, workerId: "worker-writer" });

      // Lead picks up the approval node and sets awaiting_approval.
      await runWorkflowWorkerTick(api, { teamId, agentId: `${teamId}-lead`, limit: 10, workerId: "worker-lead" });

      const approved = await approveWorkflowRun(api, { teamId, runId: enq.runId, approved: true });
      expect(approved.ok).toBe(true);
      const resumed = await resumeWorkflowRun(api, { teamId, runId: enq.runId });
      expect(resumed.ok).toBe(true);
      expect(resumed.status).toBe("waiting_workers");
    } finally {
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  test("worker skips recovered stale task when run already advanced past that node", async () => {
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t-stale-recovery";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    try {
      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "stale-recovery.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);
      const workflow = {
        id: "stale-recovery",
        name: "Recovered stale tasks should not replay old nodes",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "research",
            kind: "tool",
            assignedTo: { agentId: "agent-a" },
            action: { tool: "fs.append", args: { path: "shared-context/RESEARCH.md", content: "research\n" } },
          },
          {
            id: "draft",
            kind: "tool",
            assignedTo: { agentId: "agent-b" },
            action: { tool: "fs.append", args: { path: "shared-context/DRAFT.md", content: "draft\n" } },
          },
          { id: "approval", kind: "human_approval", action: { provider: "telegram", target: "123" } },
          {
            id: "publish",
            kind: "tool",
            assignedTo: { agentId: "agent-c" },
            action: { tool: "fs.append", args: { path: "shared-context/PUBLISH.md", content: "publish\n" } },
          },
          { id: "end", kind: "end" },
        ],
        edges: [
          { from: "start", to: "research", on: "success" },
          { from: "research", to: "draft", on: "success" },
          { from: "draft", to: "approval", on: "success" },
          { from: "approval", to: "publish", on: "success" },
          { from: "publish", to: "end", on: "success" },
        ],
      };
      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi();
      const enq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(enq.ok).toBe(true);
      await runWorkflowRunnerOnce(api, { teamId });
      await runWorkflowWorkerTick(api, { teamId, agentId: "agent-a", limit: 10, workerId: "worker-a" });
      await runWorkflowWorkerTick(api, { teamId, agentId: "agent-b", limit: 10, workerId: "worker-b" });

      // Lead picks up the approval node and sets awaiting_approval.
      await runWorkflowWorkerTick(api, { teamId, agentId: `${teamId}-lead`, limit: 10, workerId: "worker-lead" });

      await approveWorkflowRun(api, { teamId, runId: enq.runId, approved: true });
      const resumed = await resumeWorkflowRun(api, { teamId, runId: enq.runId });
      expect(resumed.ok).toBe(true);

      const staleTask = await enqueueTask(teamDir, "agent-a", {
        teamId,
        runId: enq.runId,
        nodeId: "research",
        kind: "execute_node",
      });
      const claimsDir = path.join(teamDir, "shared-context", "workflow-queues", "claims");
      await fs.mkdir(claimsDir, { recursive: true });
      await fs.writeFile(
        path.join(claimsDir, `agent-a.${staleTask.task.id}.json`),
        JSON.stringify({ taskId: staleTask.task.id, agentId: "agent-a", workerId: "dead-worker", claimedAt: new Date(Date.now() - 10_000).toISOString(), leaseSeconds: 1 }, null, 2),
        "utf8"
      );

      const w3 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-a", limit: 10, workerId: "worker-a2" });
      expect(w3.ok).toBe(true);
      expect(w3.results.some((r) => r.status === "skipped_stale" && r.nodeId === "research")).toBe(true);

      const publishQueue = path.join(teamDir, "shared-context", "workflow-queues", "agent-c.jsonl");
      const publishQueueRaw = await fs.readFile(publishQueue, "utf8");
      expect(publishQueueRaw).toContain(`"nodeId":"publish"`);
    } finally {
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });


  test("llm node chaining passes prior node output forward (INPUT_JSON + previousNodeOutput)", async () => {
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t-llm-chain";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    try {
      toolCalls.length = 0;

      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "llm-chain.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);

      const workflow = {
        id: "llm-chain",
        name: "Demo: LLM chaining",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "draft_assets",
            kind: "llm",
            assignedTo: { agentId: "agent-writer" },
            action: { promptTemplate: "Return JSON." },
          },
          {
            id: "qc_brand",
            kind: "llm",
            assignedTo: { agentId: "agent-qc" },
            action: { promptTemplate: "Use INPUT_JSON." },
          },
          { id: "end", kind: "end" },
        ],
        edges: [
          { from: "start", to: "draft_assets", on: "success" },
          { from: "draft_assets", to: "qc_brand", on: "success" },
          { from: "qc_brand", to: "end", on: "success" },
        ],
      };

      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi();

      const enq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(enq.ok).toBe(true);

      // Runner/worker handshake:
      // - runner claims run + enqueues first runnable node to its agent
      // - worker executes node
      // - runner resumes + enqueues next node
      const r1 = await runWorkflowRunnerOnce(api, { teamId });
      expect(r1.ok).toBe(true);

      const w1 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-writer", limit: 5, workerId: "w-writer" });
      expect(w1.ok).toBe(true);

      const r2 = await runWorkflowRunnerOnce(api, { teamId });
      expect(r2.ok).toBe(true);

      const w2 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-qc", limit: 5, workerId: "w-qc" });
      expect(w2.ok).toBe(true);

      const r3 = await runWorkflowRunnerOnce(api, { teamId });
      expect(r3.ok).toBe(true);

      const llmCalls = toolCalls.filter((c) => c.tool === "llm-task-fixed" || c.tool === "llm-task");
      expect(llmCalls.length).toBe(2);

      const firstInput = llmCalls[0]!.args?.input;
      const secondInput = llmCalls[1]!.args?.input;

      // First node has no prior context.
      expect(firstInput?.previousNodeOutput ?? null).toBe(null);

      // Second node should receive prior node output in structured form + back-compat INPUT_JSON string.
      expect(secondInput?.previousNodeId).toBe("draft_assets");
      expect(secondInput?.previousNodeOutput).toEqual({ ok: true, mocked: true });
      expect(typeof secondInput?.INPUT_JSON).toBe("string");
      expect(String(secondInput?.INPUT_JSON)).toContain('"ok": true');
    } finally {
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  test("worker splits canonical provider/model strings before calling llm-task", async () => {
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t-llm-model";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    try {
      toolCalls.length = 0;
      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "llm-model.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);

      const workflow = {
        id: "llm-model",
        name: "Demo: llm model normalization",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "draft_assets",
            kind: "llm",
            assignedTo: { agentId: "agent-writer" },
            action: {
              promptTemplate: "Write a first draft.",
              model: "anthropic/claude-sonnet-4-20250514",
            },
          },
          { id: "end", kind: "end" },
        ],
        edges: [
          { from: "start", to: "draft_assets", on: "success" },
          { from: "draft_assets", to: "end", on: "success" },
        ],
      };

      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi();
      const enq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(enq.ok).toBe(true);

      const r1 = await runWorkflowRunnerOnce(api, { teamId });
      expect(r1.ok).toBe(true);

      const w1 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-writer", limit: 5, workerId: "w-writer" });
      expect(w1.ok).toBe(true);

      const llmCalls = toolCalls.filter((c) => c.tool === "llm-task-fixed" || c.tool === "llm-task");
      expect(llmCalls.length).toBe(1);
      expect(llmCalls[0]!.args?.provider).toBe("anthropic");
      expect(llmCalls[0]!.args?.model).toBe("claude-sonnet-4-20250514");
    } finally {
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  test("stale-skipped tasks do not consume the worker-tick execution budget", async () => {
    // Regression guard for the Option B fix: when a shared agent queue has
    // stale tasks (for nodes that already advanced past "success") sitting
    // ahead of a real task, a worker-tick with `limit: 1` should STILL
    // reach and execute the real task in a single tick. Previously, stale
    // tasks each consumed a slot in the limit budget, so a queue with 5
    // stale entries followed by 1 real task would take 6 ticks to drain.
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t-stale-budget";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    try {
      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "stale-budget.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);
      const workflow = {
        id: "stale-budget",
        name: "Stale tasks must not starve the execution budget",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "do-work",
            kind: "tool",
            assignedTo: { agentId: "agent-shared" },
            action: {
              tool: "fs.append",
              args: {
                path: "shared-context/REAL_WORK.log",
                content: "did work run={{run.id}}\n",
              },
            },
          },
          { id: "end", kind: "end" },
        ],
        edges: [
          { from: "start", to: "do-work", on: "success" },
          { from: "do-work", to: "end", on: "success" },
        ],
      };
      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi();

      // 1. Run one workflow end-to-end so its `do-work` node is marked
      //    success. After this, any task for that run+node is "stale".
      const firstEnq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(firstEnq.ok).toBe(true);
      await runWorkflowRunnerOnce(api, { teamId });
      await runWorkflowWorkerTick(api, { teamId, agentId: "agent-shared", limit: 5, workerId: "worker-warmup" });
      const firstRun = JSON.parse(await fs.readFile(firstEnq.runLogPath, "utf8")) as { status: string };
      expect(firstRun.status).toBe("completed");

      // 2. Seed 5 stale tasks for the already-completed run's do-work node.
      //    The stale-task guard will reject each (node status === 'success').
      const staleCount = 5;
      for (let i = 0; i < staleCount; i++) {
        await enqueueTask(teamDir, "agent-shared", {
          teamId,
          runId: firstEnq.runId,
          nodeId: "do-work",
          kind: "execute_node",
        });
      }

      // 3. Enqueue a brand-new run. Its do-work task gets enqueued by the
      //    runner BEHIND the stale tasks.
      const secondEnq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(secondEnq.ok).toBe(true);
      await runWorkflowRunnerOnce(api, { teamId });

      // 4. Tick the worker with limit=1. Old behavior: would process 1
      //    stale task and exit, leaving 4 stale + 1 real in the queue.
      //    New behavior: drains all 5 stale tasks AND executes the real
      //    one in a single tick.
      const w = await runWorkflowWorkerTick(api, {
        teamId,
        agentId: "agent-shared",
        limit: 1,
        workerId: "worker-budget",
      });
      expect(w.ok).toBe(true);

      const results = (w as { results: Array<{ status: string; runId: string }> }).results;
      const skippedStale = results.filter((r) => r.status === "skipped_stale").length;
      // A real execution for the new run emits either "ok" (node completed
      // and handed off) or "completed" (node completed and the whole run
      // finished). Both count as "did real work this tick".
      const executedForNewRun = results.filter(
        (r) => r.runId === secondEnq.runId && (r.status === "ok" || r.status === "completed")
      ).length;

      // The key property: even with limit=1 and many stale tasks ahead of
      // the real one, a single tick reaches and executes the real task.
      // (Old code would have exited after the first skipped_stale.)
      expect(skippedStale).toBeGreaterThanOrEqual(staleCount);
      expect(executedForNewRun).toBe(1);

      // 5. The new run's do-work side effect should have landed.
      const secondRun = JSON.parse(await fs.readFile(secondEnq.runLogPath, "utf8")) as { status: string };
      expect(secondRun.status).toBe("completed");
      const appended = await fs.readFile(path.join(teamDir, "shared-context", "REAL_WORK.log"), "utf8");
      // Two real executions — one from the warmup and one from this test.
      expect(appended.match(/did work run=/g)?.length).toBe(2);
    } finally {
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  test("lock contention stays bounded by limit (no within-tick re-enqueue amplification)", async () => {
    // Regression guard for a subtle interaction in the Option B budget fix:
    // `skipped_locked` re-enqueues the task so it isn't lost. If lock
    // contention were allowed to escape the execution budget, a single tick
    // against a stuck lock would dequeue-and-re-enqueue the same task up to
    // `maxDequeues` times, bloating the queue file. Lock contention MUST
    // count against the budget so queue growth is O(limit) per tick.
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t-lock-bound";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    try {
      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "lock-bound.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);
      const workflow = {
        id: "lock-bound",
        name: "Lock contention bounded by limit",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "locked-node",
            kind: "tool",
            assignedTo: { agentId: "agent-locked" },
            action: {
              tool: "fs.append",
              args: { path: "shared-context/WORK.log", content: "work\n" },
            },
          },
          { id: "end", kind: "end" },
        ],
        edges: [
          { from: "start", to: "locked-node", on: "success" },
          { from: "locked-node", to: "end", on: "success" },
        ],
      };
      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi();
      const enq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(enq.ok).toBe(true);
      await runWorkflowRunnerOnce(api, { teamId });

      // Plant a fresh, NON-stale lock file for the locked-node. This simulates
      // another worker currently executing the same node. The running worker
      // tick should dequeue, see the live lock, re-enqueue once, and move on
      // — NOT keep re-enqueuing copies until maxDequeues is exhausted.
      const lockDir = path.join(teamDir, "shared-context", "workflow-runs", enq.runId, "locks");
      await fs.mkdir(lockDir, { recursive: true });
      const claimedAt = new Date().toISOString();
      await fs.writeFile(
        path.join(lockDir, "locked-node.lock"),
        JSON.stringify({
          workerId: "other-worker",
          pid: 999999,
          taskId: "other-task",
          claimedAt,
          ttlMs: 30 * 60 * 1000,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }, null, 2),
        "utf8"
      );

      const queuePath = path.join(teamDir, "shared-context", "workflow-queues", "agent-locked.jsonl");
      const queueBytesBefore = (await fs.readFile(queuePath, "utf8")).length;

      const w = await runWorkflowWorkerTick(api, {
        teamId,
        agentId: "agent-locked",
        limit: 5,
        workerId: "worker-lock-test",
      });
      expect(w.ok).toBe(true);

      const results = (w as { results: Array<{ status: string }> }).results;
      const locked = results.filter((r) => r.status === "skipped_locked").length;

      // With the budget bound, a limit=5 tick against a single stuck lock
      // should produce at most `limit` skipped_locked entries — not
      // maxDequeues (=25). The pre-fix amplification would have made this
      // 20+.
      expect(locked).toBeLessThanOrEqual(5);
      expect(locked).toBeGreaterThanOrEqual(1);

      // Queue growth should also be bounded. One task was originally
      // enqueued; re-enqueuing happens at most once per iteration, bounded
      // by `limit`. Observed growth should be well under maxDequeues.
      const queueBytesAfter = (await fs.readFile(queuePath, "utf8")).length;
      const growthRatio = queueBytesAfter / Math.max(queueBytesBefore, 1);
      expect(growthRatio).toBeLessThan(10); // 10× is generous; real growth is ~5×
    } finally {
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  // Regression: when an LLM node has no outputFields schema, the model returns a
  // plain string (e.g. markdown). Prior to the fix, the worker stored
  // JSON.stringify(string) — which wraps the value in quotes and escapes
  // newlines — so `{{node.text}}` substitution produced `"# ...\n..."` instead
  // of raw markdown, breaking downstream fs.write consumers.
  test("llm node preserves raw string payload in .text (no JSON wrapping)", async () => {
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t-llm-string";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    const markdown = "# Weekly Content Packet\n\n## 1. Executive summary\n- First post\n- Second post\n";

    try {
      toolCalls.length = 0;
      llmResponseOverride.value = markdown;

      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "llm-string.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);

      const workflow = {
        id: "llm-string",
        name: "Demo: LLM returns raw markdown",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "draft_packet",
            kind: "llm",
            assignedTo: { agentId: "agent-writer" },
            action: { promptTemplate: "Return the weekly packet as markdown." },
          },
          { id: "end", kind: "end" },
        ],
        edges: [
          { from: "start", to: "draft_packet", on: "success" },
          { from: "draft_packet", to: "end", on: "success" },
        ],
      };

      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi();
      const enq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(enq.ok).toBe(true);

      const r1 = await runWorkflowRunnerOnce(api, { teamId });
      expect(r1.ok).toBe(true);
      const w1 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-writer", limit: 5, workerId: "w-writer" });
      expect(w1.ok).toBe(true);

      // Locate the node output file for draft_packet under the run directory.
      const runsDir = path.join(shared, "workflow-runs");
      const runDirs = await fs.readdir(runsDir);
      expect(runDirs.length).toBe(1);
      const runDir = path.join(runsDir, runDirs[0]!);
      const nodeOutputsDir = path.join(runDir, "node-outputs");
      const files = await fs.readdir(nodeOutputsDir);
      const outputFile = files.find((f) => f.endsWith("-draft_packet.json"));
      expect(outputFile).toBeDefined();

      const raw = await fs.readFile(path.join(nodeOutputsDir, outputFile!), "utf8");
      const parsed = JSON.parse(raw) as { text: string };

      // The stored text should equal the raw markdown — NOT a JSON-encoded
      // string literal. Before the fix this would have been
      //   "\"# Weekly Content Packet\\n\\n..." (first char = `"`, newlines = `\\n`).
      expect(parsed.text).toBe(markdown);
      expect(parsed.text.startsWith("#")).toBe(true);
      expect(parsed.text.startsWith('"')).toBe(false);
      expect(parsed.text).not.toContain("\\n");
    } finally {
      llmResponseOverride.value = undefined;
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  // Companion: object payloads (structured outputs) still get pretty-printed JSON,
  // so downstream parsers that rely on JSON.parse(.text) continue to work.
  test("llm node still JSON-stringifies object payloads", async () => {
    const prevWorkspace = process.env.OPENCLAW_WORKSPACE;

    const { base, workspaceRoot } = await mkTmpWorkspace();
    process.env.OPENCLAW_WORKSPACE = workspaceRoot;

    const teamId = "t-llm-object";
    const teamDir = path.join(base, `workspace-${teamId}`);
    const shared = path.join(teamDir, "shared-context");
    const workflowsDir = path.join(shared, "workflows");

    try {
      toolCalls.length = 0;
      // Default mock returns { ok: true, mocked: true } — an object payload.
      llmResponseOverride.value = undefined;

      await fs.mkdir(workflowsDir, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });

      const workflowFile = "llm-object.workflow.json";
      const workflowPath = path.join(workflowsDir, workflowFile);

      const workflow = {
        id: "llm-object",
        name: "Demo: LLM returns structured object",
        nodes: [
          { id: "start", kind: "start" },
          {
            id: "qc_brand",
            kind: "llm",
            assignedTo: { agentId: "agent-qc" },
            action: { promptTemplate: "Return JSON." },
          },
          { id: "end", kind: "end" },
        ],
        edges: [
          { from: "start", to: "qc_brand", on: "success" },
          { from: "qc_brand", to: "end", on: "success" },
        ],
      };

      await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2), "utf8");

      const api = stubApi();
      const enq = await enqueueWorkflowRun(api, { teamId, workflowFile });
      expect(enq.ok).toBe(true);

      const r1 = await runWorkflowRunnerOnce(api, { teamId });
      expect(r1.ok).toBe(true);
      const w1 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-qc", limit: 5, workerId: "w-qc" });
      expect(w1.ok).toBe(true);

      const runsDir = path.join(shared, "workflow-runs");
      const runDirs = await fs.readdir(runsDir);
      const runDir = path.join(runsDir, runDirs[0]!);
      const nodeOutputsDir = path.join(runDir, "node-outputs");
      const files = await fs.readdir(nodeOutputsDir);
      const outputFile = files.find((f) => f.endsWith("-qc_brand.json"));
      expect(outputFile).toBeDefined();

      const raw = await fs.readFile(path.join(nodeOutputsDir, outputFile!), "utf8");
      const parsed = JSON.parse(raw) as { text: string };

      // Object payload round-trips as valid JSON in .text.
      const reparsed = JSON.parse(parsed.text) as { ok: boolean; mocked: boolean };
      expect(reparsed.ok).toBe(true);
      expect(reparsed.mocked).toBe(true);
    } finally {
      llmResponseOverride.value = undefined;
      process.env.OPENCLAW_WORKSPACE = prevWorkspace;
      await fs.rm(base, { recursive: true, force: true });
    }
  });
});
