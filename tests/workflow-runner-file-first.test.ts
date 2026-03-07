import { describe, expect, test, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

// The workflow runner/worker uses toolsInvoke for message sends (human approval) and llm-task.
// For unit tests, mock it so we can exercise approval + revision flows without a gateway.
vi.mock("../src/toolsInvoke", () => {
  return {
    toolsInvoke: async () => ({ ok: true }),
  };
});

import {
  approveWorkflowRun,
  enqueueWorkflowRun,
  resumeWorkflowRun,
  runWorkflowRunnerOnce,
  runWorkflowWorkerTick,
} from "../src/lib/workflows/workflow-runner";

async function mkTmpWorkspace() {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "clawrecipes-workflow-runner-test-"));
  const workspaceRoot = path.join(base, "workspace");
  await fs.mkdir(workspaceRoot, { recursive: true });
  return { base, workspaceRoot };
}

function stubApi(): OpenClawPluginApi {
  // Only api.config is used by workflow runner/worker in these tests.
  return { config: {} } as any;
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
});
