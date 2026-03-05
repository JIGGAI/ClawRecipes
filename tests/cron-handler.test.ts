import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { reconcileRecipeCronJobs } from "../src/handlers/cron";
import { cronKey } from "../src/lib/cron-utils";

const runCommandWithTimeout = vi.fn();
const api = {
  config: { gateway: { port: 18789, auth: { token: "secret" } }, agents: { defaults: { workspace: "/x" } } },
  runtime: { system: { runCommandWithTimeout } },
} as any;

function makeCmdResult(stdout: unknown, code = 0, stderr = "") {
  return {
    code,
    stdout: typeof stdout === "string" ? stdout : JSON.stringify(stdout),
    stderr,
  };
}

function setupCronCliMock(impl: (argv: string[]) => { code: number; stdout: string; stderr: string }) {
  runCommandWithTimeout.mockImplementation(async (argv: string[]) => impl(argv));
}

describe("cron handler", () => {
  let stateDir: string;

  beforeEach(async () => {
    runCommandWithTimeout.mockReset();
    setupCronCliMock((argv) => {
      const cmd = argv.slice(0, 3).join(" ");
      if (cmd === "openclaw cron list") return makeCmdResult({ jobs: [] });
      if (cmd === "openclaw cron add") return makeCmdResult({ id: "cron-new-default" });
      if (cmd === "openclaw cron edit") return makeCmdResult({ ok: true });
      return makeCmdResult({}, 1, `unexpected argv: ${argv.join(" ")}`);
    });
    stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "cron-handler-"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(stateDir, { recursive: true, force: true }).catch(() => {});
  });

  describe("reconcileRecipeCronJobs", () => {
    test("cron-installation-on creates new job when none exist", async () => {
      setupCronCliMock((argv) => {
        const cmd = argv.slice(0, 3).join(" ");
        if (cmd === "openclaw cron list") return makeCmdResult({ jobs: [] });
        if (cmd === "openclaw cron add") return makeCmdResult({ id: "cron-new-1" });
        return makeCmdResult({}, 1, `unexpected argv: ${argv.join(" ")}`);
      });
            const recipe = {
        id: "test",
        kind: "agent" as const,
        cronJobs: [{ id: "j1", schedule: "0 9 * * *", message: "run" }],
      };
      const result = await reconcileRecipeCronJobs({
        api,
        recipe: recipe as any,
        scope: { kind: "agent", agentId: "a", recipeId: "test", stateDir },
        cronInstallation: "on",
      });
      expect(result.ok).toBe(true);
      expect(result.changed).toBe(true);
      expect(result.results).toContainEqual(
        expect.objectContaining({ action: "created", key: expect.stringContaining("j1"), installedCronId: "cron-new-1" })
      );
      const statePath = path.join(stateDir, "notes", "cron-jobs.json");
      const state = JSON.parse(await fs.readFile(statePath, "utf8"));
      expect(state.entries[cronKey({ kind: "agent", agentId: "a", recipeId: "test" }, "j1")]).toBeDefined();
    });

    test("cron-installation-prompt returns declined when promptYesNo returns false", async () => {
      const promptMod = await import("../src/lib/prompt");
      const promptSpy = vi.spyOn(promptMod, "promptYesNo").mockResolvedValue(false);
      const origTTY = process.stdin.isTTY;
      Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
      try {
        const result = await reconcileRecipeCronJobs({
          api,
          recipe: { id: "test", kind: "agent", cronJobs: [{ id: "j1", schedule: "0 9 * * *", message: "run" }] } as any,
          scope: { kind: "agent", agentId: "a", recipeId: "test", stateDir },
          cronInstallation: "prompt",
        });
        expect(result.ok).toBe(true);
        expect(result.changed).toBe(false);
        expect((result as any).note).toBe("cron-installation-declined");
        expect(promptSpy).toHaveBeenCalled();
      } finally {
        Object.defineProperty(process.stdin, "isTTY", { value: origTTY, configurable: true });
      }
    });

    test("updates existing job when spec changes", async () => {
      setupCronCliMock((argv) => {
        const cmd = argv.slice(0, 3).join(" ");
        if (cmd === "openclaw cron list") return makeCmdResult({ jobs: [{ id: "cron-existing", enabled: true }] });
        if (cmd === "openclaw cron edit") return makeCmdResult({ ok: true });
        return makeCmdResult({}, 1, `unexpected argv: ${argv.join(" ")}`);
      });
      const statePath = path.join(stateDir, "notes", "cron-jobs.json");
      await fs.mkdir(path.dirname(statePath), { recursive: true });
      const key = cronKey({ kind: "agent", agentId: "a", recipeId: "test" }, "j1");
      await fs.writeFile(
        statePath,
        JSON.stringify({
          version: 1,
          entries: {
            [key]: {
              installedCronId: "cron-existing",
              specHash: "old-hash",
              updatedAtMs: 0,
              orphaned: false,
            },
          },
        })
      );
      const result = await reconcileRecipeCronJobs({
        api,
        recipe: {
          id: "test",
          kind: "agent" as const,
          cronJobs: [{ id: "j1", schedule: "0 10 * * *", message: "updated" }],
        } as any,
        scope: { kind: "agent", agentId: "a", recipeId: "test", stateDir },
        cronInstallation: "on",
      });
      expect(result.ok).toBe(true);
      expect(result.changed).toBe(true);
      expect(result.results).toContainEqual(
        expect.objectContaining({ action: "updated", installedCronId: "cron-existing" })
      );
    });

    test("cron-installation-prompt logs non-interactive and reconciles as disabled when !TTY", async () => {
      const promptMod = await import("../src/lib/prompt");
      vi.spyOn(promptMod, "promptYesNo").mockResolvedValue(true);
      const origTTY = process.stdin.isTTY;
      Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            try {
        const result = await reconcileRecipeCronJobs({
          api,
          recipe: { id: "test", kind: "agent", cronJobs: [{ id: "j1", schedule: "0 9 * * *", message: "run" }] } as any,
          scope: { kind: "agent", agentId: "a", recipeId: "test", stateDir },
          cronInstallation: "prompt",
        });
        expect(result.ok).toBe(true);
        expect(result.changed).toBe(true);
        expect(result.results).toContainEqual(
          expect.objectContaining({ action: "created", enabled: false, installedCronId: "cron-new-default" })
        );
        expect(errSpy).toHaveBeenCalledWith(
          "Non-interactive mode: cronInstallation=prompt; reconciling 1 cron job(s) as disabled (no prompt)."
        );
      } finally {
        Object.defineProperty(process.stdin, "isTTY", { value: origTTY, configurable: true });
        errSpy.mockRestore();
      }
    });

    test("cron-installation-prompt proceeds when promptYesNo returns true", async () => {
      const promptMod = await import("../src/lib/prompt");
      vi.spyOn(promptMod, "promptYesNo").mockResolvedValue(true);
      const origTTY = process.stdin.isTTY;
      Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
            try {
        const result = await reconcileRecipeCronJobs({
          api,
          recipe: { id: "test", kind: "agent", cronJobs: [{ id: "j1", schedule: "0 9 * * *", message: "run" }] } as any,
          scope: { kind: "agent", agentId: "a", recipeId: "test", stateDir },
          cronInstallation: "prompt",
        });
        expect(result.ok).toBe(true);
        expect(result.changed).toBe(true);
        expect(result.results).toContainEqual(
          expect.objectContaining({ action: "created", installedCronId: "cron-new-default" })
        );
      } finally {
        Object.defineProperty(process.stdin, "isTTY", { value: origTTY, configurable: true });
      }
    });



    test("agent scope defaults cron target to the agent being installed when agentId omitted", async () => {
      const seen: string[][] = [];
      setupCronCliMock((argv) => {
        seen.push(argv);
        const cmd = argv.slice(0, 3).join(" ");
        if (cmd === "openclaw cron list") return makeCmdResult({ jobs: [] });
        if (cmd === "openclaw cron add") return makeCmdResult({ id: "cron-new-agent" });
        return makeCmdResult({}, 1, `unexpected argv: ${argv.join(" ")}`);
      });

      const recipe = {
        id: "test",
        kind: "agent" as const,
        cronJobs: [{ id: "j1", schedule: "0 9 * * *", message: "run" }],
      };
      const result = await reconcileRecipeCronJobs({
        api,
        recipe: recipe as any,
        scope: { kind: "agent", agentId: "dev-lead", recipeId: "test", stateDir },
        cronInstallation: "on",
      });
      expect(result.ok).toBe(true);
      const add = seen.find((a) => a.slice(0, 3).join(" ") === "openclaw cron add");
      expect(add).toBeDefined();
      expect(add).toEqual(expect.arrayContaining(["--agent", "dev-lead"]));
      expect(add).toEqual(expect.arrayContaining(["--session", "isolated"]));
      expect(add).toEqual(expect.arrayContaining(["--message", "run"]));
      expect(add).not.toEqual(expect.arrayContaining(["--system-event"]));
    });


    test("team scope defaults cron target to <teamId>-lead when agentId omitted", async () => {
      const seen: string[][] = [];
      setupCronCliMock((argv) => {
        seen.push(argv);
        const cmd = argv.slice(0, 3).join(" ");
        if (cmd === "openclaw cron list") return makeCmdResult({ jobs: [] });
        if (cmd === "openclaw cron add") return makeCmdResult({ id: "cron-new-team" });
        return makeCmdResult({}, 1, `unexpected argv: ${argv.join(" ")}`);
      });

      const recipe = {
        id: "test",
        kind: "team" as const,
        cronJobs: [{ id: "j1", schedule: "0 9 * * *", message: "run" }],
      };
      const result = await reconcileRecipeCronJobs({
        api,
        recipe: recipe as any,
        scope: { kind: "team", teamId: "claw-marketing-team", recipeId: "test", stateDir },
        cronInstallation: "on",
      });
      expect(result.ok).toBe(true);
      const add = seen.find((a) => a.slice(0, 3).join(" ") === "openclaw cron add");
      expect(add).toBeDefined();
      expect(add).toEqual(expect.arrayContaining(["--agent", "claw-marketing-team-lead"]));
      expect(add).toEqual(expect.arrayContaining(["--session", "isolated"]));
      expect(add).toEqual(expect.arrayContaining(["--message", "run"]));
      expect(add).not.toEqual(expect.arrayContaining(["--system-event"]));
    });
    test("creates job with agentId, timezone, channel, to (delivery block)", async () => {
            const recipe = {
        id: "test",
        kind: "team" as const,
        cronJobs: [
          {
            id: "j2",
            schedule: "0 9 * * *",
            message: "reminder",
            timezone: "America/New_York",
            channel: "slack",
            to: "#general",
            agentId: "my-agent",
          },
        ],
      };
      const result = await reconcileRecipeCronJobs({
        api,
        recipe: recipe as any,
        scope: { kind: "team", teamId: "t1", recipeId: "test", stateDir },
        cronInstallation: "on",
      });
      expect(result.ok).toBe(true);
      expect(result.results).toContainEqual(
        expect.objectContaining({ action: "created", installedCronId: "cron-new-default" })
      );
    });

    test("disables orphaned job when recipe removes it", async () => {
      setupCronCliMock((argv) => {
        const cmd = argv.slice(0, 3).join(" ");
        if (cmd === "openclaw cron list") {
          return makeCmdResult({ jobs: [
            { id: "cron-orphan", enabled: true },
            { id: "cron-kept", enabled: true },
          ] });
        }
        if (cmd === "openclaw cron edit") return makeCmdResult({ ok: true });
        return makeCmdResult({}, 1, `unexpected argv: ${argv.join(" ")}`);
      });
      const statePath = path.join(stateDir, "notes", "cron-jobs.json");
      await fs.mkdir(path.dirname(statePath), { recursive: true });
      const keyRemoved = cronKey({ kind: "agent", agentId: "a", recipeId: "test" }, "j-orphan");
      const keyKept = cronKey({ kind: "agent", agentId: "a", recipeId: "test" }, "j1");
      await fs.writeFile(
        statePath,
        JSON.stringify({
          version: 1,
          entries: {
            [keyRemoved]: {
              installedCronId: "cron-orphan",
              specHash: "x",
              updatedAtMs: 0,
              orphaned: false,
            },
            [keyKept]: {
              installedCronId: "cron-kept",
              specHash: "y",
              updatedAtMs: 0,
              orphaned: false,
            },
          },
        })
      );
      const result = await reconcileRecipeCronJobs({
        api,
        recipe: {
          id: "test",
          kind: "agent" as const,
          cronJobs: [{ id: "j1", schedule: "0 9 * * *", message: "run" }],
        } as any,
        scope: { kind: "agent", agentId: "a", recipeId: "test", stateDir },
        cronInstallation: "on",
      });
      expect(result.ok).toBe(true);
      expect(result.results).toContainEqual(
        expect.objectContaining({ action: "disabled-removed", installedCronId: "cron-orphan" })
      );
      const state = JSON.parse(await fs.readFile(statePath, "utf8"));
      expect(state.entries[keyRemoved].orphaned).toBe(true);
    });
  });
});
