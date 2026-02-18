import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { reconcileRecipeCronJobs } from "../src/handlers/cron";
import { cronKey } from "../src/lib/cron-utils";

const api = {
  config: { gateway: { port: 18789, auth: { token: "secret" } }, agents: { defaults: { workspace: "/x" } } },
} as any;

/** toolsInvoke returns json.result; cron expects result.content[].text to be JSON. */
function makeCronResult(content: unknown) {
  return {
    ok: true,
    result: {
      content: [{ type: "text", text: JSON.stringify(content) }],
    },
  };
}

describe("cron handler", () => {
  let stateDir: string;

  beforeEach(async () => {
    stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "cron-handler-"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(stateDir, { recursive: true, force: true }).catch(() => {});
  });

  describe("reconcileRecipeCronJobs", () => {
    test("cron-installation-on creates new job when none exist", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(makeCronResult({ id: "cron-new-1" })),
        })
      );
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
      let callCount = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve(
                  makeCronResult({ jobs: [{ id: "cron-existing", enabled: true }] })
                ),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(makeCronResult({})),
          });
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

    test("cron-installation-prompt logs non-interactive when !TTY and user accepted", async () => {
      const promptMod = await import("../src/lib/prompt");
      vi.spyOn(promptMod, "promptYesNo").mockResolvedValue(true);
      const origTTY = process.stdin.isTTY;
      Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(makeCronResult({ id: "cron-non-tty" })),
        })
      );
      try {
        const result = await reconcileRecipeCronJobs({
          api,
          recipe: { id: "test", kind: "agent", cronJobs: [{ id: "j1", schedule: "0 9 * * *", message: "run" }] } as any,
          scope: { kind: "agent", agentId: "a", recipeId: "test", stateDir },
          cronInstallation: "prompt",
        });
        expect(result.ok).toBe(true);
        expect(errSpy).toHaveBeenCalledWith("Non-interactive mode: defaulting cron install to disabled.");
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
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(makeCronResult({ id: "cron-from-prompt" })),
        })
      );
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
          expect.objectContaining({ action: "created", installedCronId: "cron-from-prompt" })
        );
      } finally {
        Object.defineProperty(process.stdin, "isTTY", { value: origTTY, configurable: true });
      }
    });

    test("creates job with agentId, timezone, channel, to (delivery block)", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve(
              makeCronResult({ job: { id: "cron-delivery" } })
            ),
        })
      );
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
        expect.objectContaining({ action: "created", installedCronId: "cron-delivery" })
      );
    });

    test("disables orphaned job when recipe removes it", async () => {
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
      let callCount = 0;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              ok: true,
              json: () =>
                Promise.resolve(
                  makeCronResult({
                    jobs: [
                      { id: "cron-orphan", enabled: true },
                      { id: "cron-kept", enabled: true },
                    ],
                  })
                ),
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(makeCronResult({})),
          });
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
