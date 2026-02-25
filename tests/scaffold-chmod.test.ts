import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, test } from "vitest";
import { __internal } from "../index";

async function setupWorkspace() {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "scaffold-chmod-test-"));
  const workspaceRoot = path.join(base, "workspace");
  await fs.mkdir(workspaceRoot, { recursive: true });
  await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
  return { base, workspaceRoot };
}

function mockApi(workspaceRoot: string) {
  return {
    config: {
      agents: { defaults: { workspace: workspaceRoot } },
      // keep tests hermetic: don't attempt to install cron jobs
      plugins: { entries: { recipes: { config: { cronInstallation: "off" } } } },
    },
  } as any;
}

function modeOct(stat: { mode: number }) {
  return stat.mode & 0o777;
}

describe("scaffold chmod", () => {
  test("applies chmod from recipe files entries", async () => {
    const { base, workspaceRoot } = await setupWorkspace();
    const api = mockApi(workspaceRoot);

    const agentId = "chmod-agent";
    const res = await __internal.handleScaffold(api, {
      recipeId: "swarm-orchestrator",
      agentId,
      overwrite: true,
    });
    expect(res.ok).toBe(true);

    // handleScaffold resolves to ../workspace-<agentId>
    const agentWorkspace = path.resolve(workspaceRoot, "..", `workspace-${agentId}`);

    const spawn = await fs.stat(path.join(agentWorkspace, ".clawdbot", "spawn.sh"));
    const checkAgents = await fs.stat(path.join(agentWorkspace, ".clawdbot", "check-agents.sh"));
    const cleanup = await fs.stat(path.join(agentWorkspace, ".clawdbot", "cleanup.sh"));
    const env = await fs.stat(path.join(agentWorkspace, ".clawdbot", "env.sh"));

    expect(modeOct(spawn)).toBe(0o755);
    expect(modeOct(checkAgents)).toBe(0o755);
    expect(modeOct(cleanup)).toBe(0o755);
    expect(modeOct(env)).toBe(0o644);

    await fs.rm(base, { recursive: true, force: true });
  });
});
