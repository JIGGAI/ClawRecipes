import { describe, expect, test, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

const toolCalls: Array<{ tool: string; args?: any; action?: string }> = [];

// The workflow runner/worker uses toolsInvoke for message sends (human approval) and llm-task.
// For unit tests, mock it so we can exercise approval + revision flows without a gateway.
vi.mock("../src/toolsInvoke", () => {
  return {
    toolsInvoke: async (api: any, req: any) => {
      toolCalls.push({ tool: String(req?.tool ?? ""), args: req?.args, action: req?.action });
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

      // Execute draft_assets and approval (approval will be executed by the worker and set awaiting_approval).
      const w1 = await runWorkflowWorkerTick(api, { teamId, agentId: "agent-writer", limit: 10, workerId: "worker-writer" });
      expect(w1.ok).toBe(true);

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
});
