import { describe, expect, test } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { dequeueNextTask, enqueueTask, hasPendingTaskFor, queuePathFor, releaseTaskClaim } from "../src/lib/workflows/workflow-queue";

async function tmpTeamDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-queue-test-"));
  return dir;
}

describe("workflow-queue", () => {
  test("dequeueNextTask returns a task and advances cursor", async () => {
    const teamDir = await tmpTeamDir();
    try {
      await enqueueTask(teamDir, "agent-a", { teamId: "t1", runId: "r1", nodeId: "n1", kind: "execute_node" });
      await enqueueTask(teamDir, "agent-a", { teamId: "t1", runId: "r2", nodeId: "n2", kind: "execute_node" });

      const dq1 = await dequeueNextTask(teamDir, "agent-a", { workerId: "w1" });
      expect(dq1.ok).toBe(true);
      expect(dq1.task?.task.runId).toBe("r1");
      await releaseTaskClaim(teamDir, "agent-a", dq1.task!.task.id);

      const dq2 = await dequeueNextTask(teamDir, "agent-a", { workerId: "w1" });
      expect(dq2.ok).toBe(true);
      expect(dq2.task?.task.runId).toBe("r2");
      await releaseTaskClaim(teamDir, "agent-a", dq2.task!.task.id);

      const dq3 = await dequeueNextTask(teamDir, "agent-a", { workerId: "w1" });
      expect(dq3.ok).toBe(true);
      expect(dq3.task).toBeNull();
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });

  test("dequeueNextTask skips a task claimed by another worker when lease not expired", async () => {
    const teamDir = await tmpTeamDir();
    try {
      const enq = await enqueueTask(teamDir, "agent-a", { teamId: "t1", runId: "r1", nodeId: "n1", kind: "execute_node" });

      // Create a claim by worker A with a long lease.
      const claimsDir = path.join(teamDir, "shared-context", "workflow-queues", "claims");
      await fs.mkdir(claimsDir, { recursive: true });
      const claimPath = path.join(claimsDir, `agent-a.${enq.task.id}.json`);
      await fs.writeFile(
        claimPath,
        JSON.stringify({ taskId: enq.task.id, agentId: "agent-a", workerId: "worker-a", claimedAt: new Date().toISOString(), leaseSeconds: 3600 }, null, 2),
        "utf8"
      );

      const dq = await dequeueNextTask(teamDir, "agent-a", { workerId: "worker-b", leaseSeconds: 1 });
      expect(dq.ok).toBe(true);
      expect(dq.task).toBeNull();

      // Cursor should have advanced; queue file still exists.
      expect(await fs.readFile(queuePathFor(teamDir, "agent-a"), "utf8")).toContain("r1");
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });

  test("dequeueNextTask steals an expired lease claim", async () => {
    const teamDir = await tmpTeamDir();
    try {
      const enq = await enqueueTask(teamDir, "agent-a", { teamId: "t1", runId: "r1", nodeId: "n1", kind: "execute_node" });

      const claimsDir = path.join(teamDir, "shared-context", "workflow-queues", "claims");
      await fs.mkdir(claimsDir, { recursive: true });
      const claimPath = path.join(claimsDir, `agent-a.${enq.task.id}.json`);

      const old = new Date(Date.now() - 10_000).toISOString();
      await fs.writeFile(
        claimPath,
        JSON.stringify({ taskId: enq.task.id, agentId: "agent-a", workerId: "worker-a", claimedAt: old, leaseSeconds: 1 }, null, 2),
        "utf8"
      );

      const dq = await dequeueNextTask(teamDir, "agent-a", { workerId: "worker-b", leaseSeconds: 1 });
      expect(dq.ok).toBe(true);
      expect(dq.task?.task.runId).toBe("r1");

      const raw = await fs.readFile(claimPath, "utf8");
      const claim = JSON.parse(raw) as { workerId: string };
      expect(claim.workerId).toBe("worker-b");
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });

  test("dequeueNextTask recovers expired claimed task behind the cursor", async () => {
    const teamDir = await tmpTeamDir();
    try {
      const enq = await enqueueTask(teamDir, "agent-a", { teamId: "t1", runId: "r1", nodeId: "n1", kind: "execute_node" });
      const dq1 = await dequeueNextTask(teamDir, "agent-a", { workerId: "worker-a", leaseSeconds: 1 });
      expect(dq1.task?.task.id).toBe(enq.task.id);

      const claimsDir = path.join(teamDir, "shared-context", "workflow-queues", "claims");
      const claimPath = path.join(claimsDir, `agent-a.${enq.task.id}.json`);
      const old = new Date(Date.now() - 10_000).toISOString();
      await fs.writeFile(
        claimPath,
        JSON.stringify({ taskId: enq.task.id, agentId: "agent-a", workerId: "worker-a", claimedAt: old, leaseSeconds: 1 }, null, 2),
        "utf8"
      );

      const dq2 = await dequeueNextTask(teamDir, "agent-a", { workerId: "worker-b", leaseSeconds: 1 });
      expect(dq2.ok).toBe(true);
      expect(dq2.task?.task.id).toBe(enq.task.id);
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });

  test("hasPendingTaskFor finds a matching task past the cursor", async () => {
    const teamDir = await tmpTeamDir();
    try {
      await enqueueTask(teamDir, "agent-a", { teamId: "t1", runId: "r1", nodeId: "n1", kind: "execute_node" });
      await enqueueTask(teamDir, "agent-a", { teamId: "t1", runId: "r2", nodeId: "n2", kind: "execute_node" });

      expect(await hasPendingTaskFor(teamDir, "agent-a", { runId: "r1", nodeId: "n1" })).toBe(true);
      expect(await hasPendingTaskFor(teamDir, "agent-a", { runId: "r2", nodeId: "n2" })).toBe(true);
      expect(await hasPendingTaskFor(teamDir, "agent-a", { runId: "rX", nodeId: "nX" })).toBe(false);
      // runId matches but nodeId does not:
      expect(await hasPendingTaskFor(teamDir, "agent-a", { runId: "r1", nodeId: "n2" })).toBe(false);
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });

  test("hasPendingTaskFor ignores tasks already consumed (behind the cursor)", async () => {
    const teamDir = await tmpTeamDir();
    try {
      await enqueueTask(teamDir, "agent-a", { teamId: "t1", runId: "r1", nodeId: "n1", kind: "execute_node" });
      const dq = await dequeueNextTask(teamDir, "agent-a", { workerId: "w1" });
      expect(dq.task?.task.runId).toBe("r1");
      await releaseTaskClaim(teamDir, "agent-a", dq.task!.task.id);

      // The task is now behind the cursor -- hasPendingTaskFor should not see it.
      expect(await hasPendingTaskFor(teamDir, "agent-a", { runId: "r1", nodeId: "n1" })).toBe(false);
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });

  test("hasPendingTaskFor returns false when queue file does not exist", async () => {
    const teamDir = await tmpTeamDir();
    try {
      expect(await hasPendingTaskFor(teamDir, "agent-a", { runId: "r1", nodeId: "n1" })).toBe(false);
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });

  test("releaseTaskClaim removes a completed claim so finished work is not recovered", async () => {
    const teamDir = await tmpTeamDir();
    try {
      const enq = await enqueueTask(teamDir, "agent-a", { teamId: "t1", runId: "r1", nodeId: "n1", kind: "execute_node" });
      const dq1 = await dequeueNextTask(teamDir, "agent-a", { workerId: "worker-a", leaseSeconds: 1 });
      expect(dq1.task?.task.id).toBe(enq.task.id);
      await releaseTaskClaim(teamDir, "agent-a", enq.task.id);

      const dq2 = await dequeueNextTask(teamDir, "agent-a", { workerId: "worker-b", leaseSeconds: 1 });
      expect(dq2.ok).toBe(true);
      expect(dq2.task).toBeNull();
    } finally {
      await fs.rm(teamDir, { recursive: true, force: true });
    }
  });
});
