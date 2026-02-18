import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { __internal } from "../index";
import { saveCronStore } from "../src/lib/remove-team";

describe("index.ts handlers (remove-team)", () => {
  describe("handleRemoveTeam", () => {
    test("returns plan when --plan", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "remove-team-test-"));
      const workspaceRoot = path.join(base, "workspace");
      const workspaceDir = path.join(base, "workspace-qa-removal-team");
      const cronPath = path.join(base, "cron", "jobs.json");
      await fs.mkdir(path.dirname(cronPath), { recursive: true });
      await fs.mkdir(workspaceDir, { recursive: true });
      const cfgObj = { agents: { list: [{ id: "qa-removal-team-lead" }] } };
      const cronStore = { version: 1, jobs: [] };
      await saveCronStore(cronPath, cronStore);
      const api = {
        config: { agents: { defaults: { workspace: workspaceRoot } } },
        runtime: {
          config: {
            loadConfig: () => ({ cfg: cfgObj }),
            writeConfigFile: async () => {},
          },
        },
      } as any;
      try {
        const out = await __internal.handleRemoveTeam(api, { teamId: "qa-removal-team", plan: true });
        expect(out.ok).toBe(true);
        expect("plan" in out).toBe(true);
        expect((out as any).plan.teamId).toBe("qa-removal-team");
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("returns aborted when TTY and user declines prompt", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "remove-team-test-"));
      const workspaceRoot = path.join(base, "workspace");
      const cronPath = path.join(base, "cron", "jobs.json");
      await fs.mkdir(path.dirname(cronPath), { recursive: true });
      await saveCronStore(cronPath, { version: 1, jobs: [] });
      const cfgObj = { agents: { list: [] } };
      const api = {
        config: { agents: { defaults: { workspace: workspaceRoot } } },
        runtime: { config: { loadConfig: () => ({ cfg: cfgObj }), writeConfigFile: async () => {} } },
      } as any;
      const origTTY = process.stdin.isTTY;
      Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
      const promptMod = await import("../src/lib/prompt");
      const promptSpy = vi.spyOn(promptMod, "promptYesNo").mockResolvedValue(false);
      try {
        const out = await __internal.handleRemoveTeam(api, { teamId: "qa-decline-team", yes: false });
        expect(out.ok).toBe(false);
        expect((out as any).aborted).toBe("user-declined");
        expect(promptSpy).toHaveBeenCalled();
      } finally {
        Object.defineProperty(process.stdin, "isTTY", { value: origTTY, configurable: true });
        promptSpy.mockRestore();
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("returns aborted when !yes and !TTY", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "remove-team-test-"));
      const workspaceRoot = path.join(base, "workspace");
      const cronPath = path.join(base, "cron", "jobs.json");
      await fs.mkdir(path.dirname(cronPath), { recursive: true });
      await saveCronStore(cronPath, { version: 1, jobs: [] });
      const cfgObj = { agents: { list: [] } };
      const api = {
        config: { agents: { defaults: { workspace: workspaceRoot } } },
        runtime: { config: { loadConfig: () => ({ cfg: cfgObj }), writeConfigFile: async () => {} } },
      } as any;
      const orig = process.stdin.isTTY;
      Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
      try {
        const out = await __internal.handleRemoveTeam(api, { teamId: "qa-removal-team", yes: false });
        expect(out.ok).toBe(false);
        expect((out as any).aborted).toBe("non-interactive");
      } finally {
        Object.defineProperty(process.stdin, "isTTY", { value: orig, configurable: true });
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("executes when yes", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "remove-team-test-"));
      const workspaceRoot = path.join(base, "workspace");
      const workspaceDir = path.join(base, "workspace-qa-exec-team");
      const cronPath = path.join(base, "cron", "jobs.json");
      await fs.mkdir(path.dirname(cronPath), { recursive: true });
      await fs.mkdir(workspaceDir, { recursive: true });
      const cfgObj = { agents: { list: [{ id: "qa-exec-team-lead" }] } };
      const cronStore = { version: 1, jobs: [] };
      await saveCronStore(cronPath, cronStore);
      const api = {
        config: { agents: { defaults: { workspace: workspaceRoot } } },
        runtime: {
          config: {
            loadConfig: () => ({ cfg: cfgObj }),
            writeConfigFile: async (c: any) => {
              Object.assign(cfgObj, c);
            },
          },
        },
      } as any;
      try {
        const out = await __internal.handleRemoveTeam(api, { teamId: "qa-exec-team", yes: true });
        expect(out.ok).toBe(true);
        expect("result" in out).toBe(true);
        expect((out as any).result.removed.workspaceDir).toBe("deleted");
        expect(cfgObj.agents.list).toHaveLength(0);
        await expect(fs.access(workspaceDir)).rejects.toThrow();
      } finally {
        await fs.rm(base, { recursive: true, force: true }).catch(() => {});
      }
    });
  });

  describe("handleDispatch", () => {
    test("returns plan when dryRun", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "dispatch-test-"));
      const workspaceRoot = path.join(base, "workspace");
      const teamDir = path.join(base, "workspace-test-dispatch-team");
      await fs.mkdir(workspaceRoot, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });
      const api = {
        config: { agents: { defaults: { workspace: workspaceRoot } } },
        runtime: { system: { enqueueSystemEvent: () => {} } },
      } as any;
      try {
        const out = await __internal.handleDispatch(api, {
          teamId: "test-dispatch-team",
          requestText: "Implement feature X",
          owner: "dev",
          dryRun: true,
        });
        expect(out.ok).toBe(true);
        expect((out as any).plan.teamId).toBe("test-dispatch-team");
        expect((out as any).plan.files).toHaveLength(3);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("writes files when not dryRun", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "dispatch-test-"));
      const workspaceRoot = path.join(base, "workspace");
      const teamDir = path.join(base, "workspace-test-dispatch-team");
      await fs.mkdir(workspaceRoot, { recursive: true });
      await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });
      const api = {
        config: { agents: { defaults: { workspace: workspaceRoot } } },
        runtime: { system: { enqueueSystemEvent: () => {} } },
      } as any;
      try {
        const out = await __internal.handleDispatch(api, {
          teamId: "test-dispatch-team",
          requestText: "Fix bug",
          owner: "dev",
        });
        expect(out.ok).toBe(true);
        expect(out.wrote).toHaveLength(3);
        const inboxDir = path.join(teamDir, "inbox");
        const files = await fs.readdir(inboxDir);
        expect(files.some((f) => f.includes("fix-bug"))).toBe(true);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws when --owner is invalid", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "dispatch-test-"));
      const workspaceRoot = path.join(base, "workspace");
      await fs.mkdir(workspaceRoot, { recursive: true });
      await fs.mkdir(path.join(base, "workspace-test-dispatch-team", "work", "backlog"), { recursive: true });
      const api = { config: { agents: { defaults: { workspace: workspaceRoot } } } } as any;
      try {
        await expect(
          __internal.handleDispatch(api, {
            teamId: "test-dispatch-team",
            requestText: "Fix bug",
            owner: "invalid-role",
          })
        ).rejects.toThrow(/--owner must be one of/);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });

  describe("handleInstallMarketplaceRecipe", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            json: () =>
              Promise.resolve({
                ok: true,
                recipe: { sourceUrl: "https://cdn.example.com/install-test.md" },
              }),
          })
          .mockResolvedValueOnce({
            ok: true,
            text: () => Promise.resolve("# Test Recipe\n\nContent for install test"),
          })
      );
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });
    test("fetches and writes recipe to workspace recipes dir", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "install-recipe-test-"));
      const workspaceRoot = path.join(base, "workspace");
      await fs.mkdir(workspaceRoot, { recursive: true });
      const api = {
        config: {
          agents: { defaults: { workspace: workspaceRoot } },
          plugins: { entries: { recipes: { config: { workspaceRecipesDir: "recipes" } } } },
        },
      } as any;
      try {
        const res = await __internal.handleInstallMarketplaceRecipe(api, {
          slug: "install-test",
          registryBase: "https://registry.example.com",
        });
        expect(res.ok).toBe(true);
        expect(res.slug).toBe("install-test");
        expect(res.wrote).toContain("recipes");
        expect(res.wrote).toContain("install-test.md");
        const content = await fs.readFile(res.wrote, "utf8");
        expect(content).toContain("# Test Recipe");
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws when workspace not set", async () => {
      const api = { config: { agents: { defaults: {} } } } as any;
      await expect(
        __internal.handleInstallMarketplaceRecipe(api, { slug: "x" })
      ).rejects.toThrow(/workspace is not set/);
    });
  });
});
