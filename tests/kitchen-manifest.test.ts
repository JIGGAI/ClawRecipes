import { describe, expect, test } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { generateKitchenManifest, type KitchenManifest } from "../src/lib/kitchen-manifest";

async function tmpDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "manifest-test-"));
  return dir;
}

function mockApi(overrides?: { runCommandResult?: { code: number; stdout: string; stderr: string } }) {
  const defaultResult = { code: 0, stdout: "[]", stderr: "" };
  const result = overrides?.runCommandResult ?? defaultResult;
  return {
    config: {},
    runtime: {
      system: {
        runCommandWithTimeout: async () => result,
      },
    },
  } as any;
}

describe("kitchen-manifest", () => {
  test("generates manifest with empty workspace", async () => {
    const dir = await tmpDir();
    const outputPath = path.join(dir, "manifest.json");
    const openclawDir = path.join(dir, "openclaw");
    await fs.mkdir(openclawDir, { recursive: true });

    // Temporarily override the homedir so OPENCLAW_DIR resolves to our temp dir.
    // Since generateKitchenManifest uses os.homedir() at import time, we instead
    // pass a custom outputPath and accept that the team scan will use the real homedir.
    // For a truly isolated test, we test the output structure.
    const manifest = await generateKitchenManifest({
      api: mockApi(),
      outputPath,
    });

    expect(manifest.version).toBe(1);
    expect(manifest.generatedAt).toBeTruthy();
    expect(typeof manifest.teams).toBe("object");
    expect(Array.isArray(manifest.agents)).toBe(true);
    expect(Array.isArray(manifest.recipes)).toBe(true);

    // Verify file was written atomically
    const raw = await fs.readFile(outputPath, "utf8");
    const parsed = JSON.parse(raw) as KitchenManifest;
    expect(parsed.version).toBe(1);
    expect(parsed.generatedAt).toBe(manifest.generatedAt);

    // Verify no tmp file left behind
    const files = await fs.readdir(dir);
    expect(files).not.toContain("manifest.json.tmp");

    await fs.rm(dir, { recursive: true, force: true });
  });

  test("generates manifest with agents and recipes from CLI", async () => {
    const dir = await tmpDir();
    const outputPath = path.join(dir, "manifest.json");

    const agents = [{ id: "agent-1", identityName: "Agent 1" }];
    const recipes = [{ id: "my-team", name: "My Team", kind: "team", source: "builtin" }];

    // First call returns agents, second returns recipes
    let callCount = 0;
    const api = {
      config: {},
      runtime: {
        system: {
          runCommandWithTimeout: async () => {
            callCount++;
            if (callCount === 1) return { code: 0, stdout: JSON.stringify(agents), stderr: "" };
            return { code: 0, stdout: JSON.stringify(recipes), stderr: "" };
          },
        },
      },
    } as any;

    const manifest = await generateKitchenManifest({ api, outputPath });

    expect(manifest.agents).toEqual(agents);
    expect(manifest.recipes).toEqual(recipes);

    await fs.rm(dir, { recursive: true, force: true });
  });

  test("handles CLI failures gracefully", async () => {
    const dir = await tmpDir();
    const outputPath = path.join(dir, "manifest.json");

    const api = mockApi({ runCommandResult: { code: 1, stdout: "", stderr: "error" } });
    const manifest = await generateKitchenManifest({ api, outputPath });

    // Should still produce a valid manifest with empty arrays
    expect(manifest.version).toBe(1);
    expect(manifest.agents).toEqual([]);
    expect(manifest.recipes).toEqual([]);

    await fs.rm(dir, { recursive: true, force: true });
  });

  test("counts tickets in team workspace", async () => {
    // This test uses the real filesystem since it scans ~/.openclaw/workspace-*
    // We verify the manifest structure contains expected fields for any team found
    const dir = await tmpDir();
    const outputPath = path.join(dir, "manifest.json");

    const manifest = await generateKitchenManifest({
      api: mockApi(),
      outputPath,
    });

    for (const [teamId, team] of Object.entries(manifest.teams)) {
      expect(team.teamId).toBe(teamId);
      expect(typeof team.ticketCounts.backlog).toBe("number");
      expect(typeof team.ticketCounts["in-progress"]).toBe("number");
      expect(typeof team.ticketCounts.testing).toBe("number");
      expect(typeof team.ticketCounts.done).toBe("number");
      expect(team.ticketCounts.total).toBe(
        team.ticketCounts.backlog + team.ticketCounts["in-progress"] +
        team.ticketCounts.testing + team.ticketCounts.done,
      );
      expect(typeof team.activeRunCount).toBe("number");
      expect(Array.isArray(team.roles)).toBe(true);
    }

    await fs.rm(dir, { recursive: true, force: true });
  });
});
