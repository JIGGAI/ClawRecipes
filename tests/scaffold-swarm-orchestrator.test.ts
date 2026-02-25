import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, test } from "vitest";
import { __internal } from "../index";

async function setupWorkspace() {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "swarm-orchestrator-test-"));
  const workspaceRoot = path.join(base, "workspace");
  await fs.mkdir(workspaceRoot, { recursive: true });
  await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
  return { base, workspaceRoot };
}

function mockApi(workspaceRoot: string) {
  return {
    config: {
      agents: { defaults: { workspace: workspaceRoot } },
      // Keep scaffold integration tests hermetic: don't attempt to hit gateway cron tools.
      plugins: { entries: { recipes: { config: { cronInstallation: "off" } } } },
    },
  } as any;
}

function modeBits(m: number) {
  return m & 0o777;
}

describe("swarm-orchestrator recipe", () => {
  test("scaffolds expected files with executable scripts", async () => {
    const { base, workspaceRoot } = await setupWorkspace();
    const api = mockApi(workspaceRoot);
    const agentId = "test-swarm-orchestrator";

    try {
      const res = await __internal.handleScaffold(api, {
        recipeId: "swarm-orchestrator",
        agentId,
      });
      expect(res.ok).toBe(true);

      // Derive the agent directory from scaffold results (don't assume layout).
      const soul = res.ok ? res.fileResults.find((r: any) => String(r.path).endsWith("SOUL.md")) : null;
      expect(soul).toBeTruthy();
      const agentDir = path.dirname(String((soul as any).path));
      const mustExist = [
        "SOUL.md",
        "AGENTS.md",
        ".clawdbot/README.md",
        ".clawdbot/env.sh",
        ".clawdbot/active-tasks.json",
        ".clawdbot/spawn.sh",
        ".clawdbot/check-agents.sh",
        ".clawdbot/cleanup.sh",
      ];
      for (const rel of mustExist) {
        await expect(fs.access(path.join(agentDir, rel))).resolves.toBeUndefined();
      }

      const statSpawn = await fs.stat(path.join(agentDir, ".clawdbot/spawn.sh"));
      const statCheck = await fs.stat(path.join(agentDir, ".clawdbot/check-agents.sh"));
      const statCleanup = await fs.stat(path.join(agentDir, ".clawdbot/cleanup.sh"));
      const statEnv = await fs.stat(path.join(agentDir, ".clawdbot/env.sh"));

      // Scripts should be executable.
      expect(modeBits(statSpawn.mode) & 0o111).toBeTruthy();
      expect(modeBits(statCheck.mode) & 0o111).toBeTruthy();
      expect(modeBits(statCleanup.mode) & 0o111).toBeTruthy();

      // env.sh should NOT be executable (chmod 644 requested by recipe).
      expect(modeBits(statEnv.mode) & 0o111).toBe(0);
    } finally {
      await fs.rm(base, { recursive: true, force: true });
    }
  });
});
