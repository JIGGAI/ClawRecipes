import { describe, expect, test } from "vitest";
import { __internal } from "../index";

describe("cov-10: reconcileRecipeCronJobs, promptYesNo, applyAgentSnippets", () => {
  describe("promptYesNo", () => {
    test("returns false when stdin is not TTY", async () => {
      const orig = process.stdin.isTTY;
      Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
      try {
        const result = await __internal.promptYesNo("test");
        expect(result).toBe(false);
      } finally {
        Object.defineProperty(process.stdin, "isTTY", { value: orig, configurable: true });
      }
    });
  });

  describe("reconcileRecipeCronJobs", () => {
    test("returns no-cron-jobs when recipe has no cronJobs", async () => {
      const api = { config: { agents: { defaults: { workspace: "/x" } } } } as any;
      const recipe = { id: "test", kind: "agent" as const };
      const result = await __internal.reconcileRecipeCronJobs({
        api,
        recipe: recipe as any,
        scope: { kind: "agent", agentId: "a", recipeId: "test", stateDir: "/tmp" },
        cronInstallation: "on",
      });
      expect(result).toEqual({ ok: true, changed: false, note: "no-cron-jobs" });
    });
    test("returns cron-installation-off when mode is off", async () => {
      const api = { config: { agents: { defaults: { workspace: "/x" } } } } as any;
      const recipe = {
        id: "test",
        kind: "agent" as const,
        cronJobs: [{ id: "j1", schedule: "0 9 * * *", message: "run" }],
      };
      const result = await __internal.reconcileRecipeCronJobs({
        api,
        recipe: recipe as any,
        scope: { kind: "agent", agentId: "a", recipeId: "test", stateDir: "/tmp" },
        cronInstallation: "off",
      });
      expect(result.ok).toBe(true);
      expect(result.changed).toBe(false);
      expect((result as any).note).toBe("cron-installation-off");
      expect((result as any).desiredCount).toBe(1);
    });
  });

  describe("applyAgentSnippetsToOpenClawConfig", () => {
    test("upserts agent into config and writes", async () => {
      const cfgObj = { agents: { list: [], defaults: { workspace: "/ws" } } };
      const api = {
        config: { agents: { defaults: { workspace: "/ws" } } },
        runtime: {
          config: {
            loadConfig: () => ({ cfg: cfgObj }),
            writeConfigFile: async (c: any) => {
              Object.assign(cfgObj, c);
            },
          },
        },
      } as any;
      const res = await __internal.applyAgentSnippetsToOpenClawConfig(api, [
        { id: "test-agent", workspace: "/ws/test", identity: { name: "Test" } },
      ]);
      expect(res.updatedAgents).toEqual(["test-agent"]);
      expect(cfgObj.agents.list.some((a: any) => a.id === "test-agent")).toBe(true);
    });
    test("preserves existing tools.deny when recipe omits tools", async () => {
      const cfgObj = {
        agents: {
          list: [
            {
              id: "dev-agent",
              workspace: "/ws/dev",
              tools: { deny: ["exec"] },
            },
          ],
        },
      };
      const api = {
        config: { agents: { defaults: { workspace: "/ws" } } },
        runtime: {
          config: {
            loadConfig: () => ({ cfg: cfgObj }),
            writeConfigFile: async (c: unknown) => {
              Object.assign(cfgObj, c);
            },
          },
        },
      } as any;
      await __internal.applyAgentSnippetsToOpenClawConfig(api, [
        { id: "dev-agent", workspace: "/ws/dev", identity: { name: "Dev" } },
      ]);
      const agent = cfgObj.agents.list.find((a: { id?: string }) => a.id === "dev-agent");
      expect(agent?.tools).toEqual({ deny: ["exec"] });
    });
    test("does not invent deny rules when recipe omits tools and agent has none", async () => {
      const cfgObj = {
        agents: {
          list: [{ id: "fresh-agent", workspace: "/ws/fresh" }],
        },
      };
      const api = {
        config: { agents: { defaults: { workspace: "/ws" } } },
        runtime: {
          config: {
            loadConfig: () => ({ cfg: cfgObj }),
            writeConfigFile: async (c: unknown) => {
              Object.assign(cfgObj, c);
            },
          },
        },
      } as any;
      await __internal.applyAgentSnippetsToOpenClawConfig(api, [
        { id: "fresh-agent", workspace: "/ws/fresh", identity: { name: "Fresh" } },
      ]);
      const agent = cfgObj.agents.list.find((a: { id?: string }) => a.id === "fresh-agent");
      expect(agent?.tools).toBeUndefined();
    });
  });
});
