import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, test } from "vitest";
import {
  ensureTicketStageDirs,
  resolveTeamDir,
  resolveTeamContext,
  resolveWorkspaceRoot,
} from "../src/lib/workspace";

describe("workspace", () => {
  describe("resolveWorkspaceRoot", () => {
    test("returns workspace from config", () => {
      const api = { config: { agents: { defaults: { workspace: "/home/me/ws" } } } } as any;
      expect(resolveWorkspaceRoot(api)).toBe("/home/me/ws");
    });
    test("throws when workspace not set", () => {
      const api = { config: { agents: {} } } as any;
      expect(() => resolveWorkspaceRoot(api)).toThrow("agents.defaults.workspace is not set");
    });
  });

  describe("resolveTeamDir", () => {
    test("returns workspace-<teamId> path relative to workspace parent", () => {
      const api = { config: { agents: { defaults: { workspace: "/base/workspace" } } } } as any;
      const teamDir = resolveTeamDir(api, "my-team");
      expect(teamDir).toBe(path.resolve("/base", "workspace-my-team"));
    });
  });

  describe("ensureTicketStageDirs", () => {
    test("creates work/ and all lane dirs", async () => {
      const teamDir = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-test-"));
      try {
        await ensureTicketStageDirs(teamDir);
        const workDir = path.join(teamDir, "work");
        expect(await fs.access(workDir)).toBeUndefined();
        expect(await fs.access(path.join(workDir, "backlog"))).toBeUndefined();
        expect(await fs.access(path.join(workDir, "in-progress"))).toBeUndefined();
        expect(await fs.access(path.join(workDir, "testing"))).toBeUndefined();
        expect(await fs.access(path.join(workDir, "done"))).toBeUndefined();
        expect(await fs.access(path.join(workDir, "assignments"))).toBeUndefined();
      } finally {
        await fs.rm(teamDir, { recursive: true, force: true });
      }
    });
  });

  describe("resolveTeamContext", () => {
    test("returns workspaceRoot and teamDir after ensuring dirs", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-ctx-"));
      const workspaceRoot = path.join(base, "workspace");
      await fs.mkdir(workspaceRoot, { recursive: true });
      const api = { config: { agents: { defaults: { workspace: workspaceRoot } } } } as any;
      try {
        const ctx = await resolveTeamContext(api, "test-team");
        expect(ctx.workspaceRoot).toBe(workspaceRoot);
        expect(ctx.teamDir).toBe(path.resolve(base, "workspace-test-team"));
        expect(await fs.access(path.join(ctx.teamDir, "work", "backlog"))).toBeUndefined();
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });
});
