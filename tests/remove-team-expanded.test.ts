import { describe, expect, test } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  buildRemoveTeamPlan,
  collectRemoveCronIds,
  deleteCronJobsViaCli,
  executeRemoveTeamPlan,
  findAgentsToRemove,
  isProtectedTeamId,
  loadCronJobsViaCli,
  loadCronStore,
  loadOpenClawConfig,
  planCronJobRemovals,
  saveCronStore,
  saveOpenClawConfig,
  stampTeamId,
  type CronJob,
  type CronStore,
  type RemoveTeamPlan,
} from "../src/lib/remove-team";

/** Builds a fake plugin api whose CLI stub records argv and returns canned results. */
function makeApiStub(
  handler: (argv: string[]) => { code: number; stdout: string; stderr: string },
) {
  const calls: string[][] = [];
  return {
    calls,
    api: {
      runtime: {
        system: {
          runCommandWithTimeout: async (argv: string[]) => {
            calls.push(argv);
            return handler(argv);
          },
        },
      },
    } as any,
  };
}

describe("remove-team (expanded)", () => {
  describe("stampTeamId", () => {
    test("returns recipes.teamId=<teamId>", () => {
      expect(stampTeamId("qa-team")).toBe("recipes.teamId=qa-team");
    });
  });

  describe("isProtectedTeamId", () => {
    test("protects development-team and main", () => {
      expect(isProtectedTeamId("development-team")).toBe(true);
      expect(isProtectedTeamId("Development-Team")).toBe(true);
      expect(isProtectedTeamId("main")).toBe(true);
      expect(isProtectedTeamId("MAIN")).toBe(true);
    });
    test("allows other teamIds", () => {
      expect(isProtectedTeamId("qa-team")).toBe(false);
      expect(isProtectedTeamId("smoke-123-team")).toBe(false);
    });
  });

  describe("findAgentsToRemove", () => {
    test("returns agents with teamId prefix", () => {
      const cfg = {
        agents: {
          list: [
            { id: "qa-team-lead" },
            { id: "qa-team-writer" },
            { id: "other-agent" },
          ],
        },
      };
      expect(findAgentsToRemove(cfg, "qa-team")).toEqual(["qa-team-lead", "qa-team-writer"]);
    });
    test("returns empty when no agents list", () => {
      expect(findAgentsToRemove({}, "qa-team")).toEqual([]);
      expect(findAgentsToRemove({ agents: {} }, "qa-team")).toEqual([]);
    });
  });

  describe("planCronJobRemovals", () => {
    test("classifies exact (stamped) vs ambiguous", () => {
      const jobs: CronJob[] = [
        { id: "a", payload: { message: "recipes.teamId=qa-team triage" } },
        { id: "b", name: "qa-team daily", payload: { message: "run" } },
        { id: "c", payload: { message: "other" } },
      ];
      const { exact, ambiguous } = planCronJobRemovals(jobs, "qa-team");
      expect(exact).toEqual([{ id: "a" }]);
      expect(ambiguous).toEqual([{ id: "b", name: "qa-team daily", reason: "mentions-teamId" }]);
    });
  });

  describe("loadCronStore / saveCronStore", () => {
    test("round-trips cron store", async () => {
      const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "remove-team-cron-"));
      const storePath = path.join(tmp, "cron.json");
      const store: CronStore = { version: 1, jobs: [{ id: "j1", name: "test" }] };
      try {
        await saveCronStore(storePath, store);
        const loaded = await loadCronStore(storePath);
        expect(loaded).toEqual(store);
      } finally {
        await fs.rm(tmp, { recursive: true, force: true });
      }
    });
    test("loadCronStore throws for invalid store", async () => {
      const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "remove-team-cron-"));
      const storePath = path.join(tmp, "bad.json");
      await fs.writeFile(storePath, '{"not":"valid store"}', "utf8");
      try {
        await expect(loadCronStore(storePath)).rejects.toThrow(/Invalid cron store/);
      } finally {
        await fs.rm(tmp, { recursive: true, force: true });
      }
    });
  });

  describe("loadOpenClawConfig / saveOpenClawConfig", () => {
    test("round-trips config", async () => {
      const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "remove-team-cfg-"));
      const cfgPath = path.join(tmp, "openclaw.json");
      const cfg = { agents: { list: [{ id: "main" }] } };
      try {
        await saveOpenClawConfig(cfgPath, cfg);
        const loaded = await loadOpenClawConfig(cfgPath);
        expect(loaded).toEqual(cfg);
      } finally {
        await fs.rm(tmp, { recursive: true, force: true });
      }
    });
  });

  describe("loadCronJobsViaCli", () => {
    test("maps `openclaw cron list` rows into a CronStore", async () => {
      const rows = [
        { id: "j1", name: "loop", enabled: true, agentId: "qa-team-lead", payload: { kind: "agentTurn", message: "recipes.teamId=qa-team" } },
        { id: "j2", name: "other", payload: { kind: "agentTurn", message: "unrelated" } },
      ];
      const { api, calls } = makeApiStub(() => ({ code: 0, stdout: JSON.stringify({ jobs: rows }), stderr: "" }));
      const store = await loadCronJobsViaCli(api);
      expect(calls[0]).toEqual(["openclaw", "cron", "list", "--all", "--json"]);
      expect(store.version).toBe(1);
      expect(store.jobs.map((j) => j.id)).toEqual(["j1", "j2"]);
      expect(store.jobs[0].payload?.message).toBe("recipes.teamId=qa-team");
      expect(store.jobs[0].agentId).toBe("qa-team-lead");
    });

    test("throws when the CLI exits non-zero", async () => {
      const { api } = makeApiStub(() => ({ code: 1, stdout: "", stderr: "gateway down" }));
      await expect(loadCronJobsViaCli(api)).rejects.toThrow(/cron list failed.*gateway down/);
    });

    test("tolerates empty/absent jobs array", async () => {
      const { api } = makeApiStub(() => ({ code: 0, stdout: "{}", stderr: "" }));
      const store = await loadCronJobsViaCli(api);
      expect(store.jobs).toEqual([]);
    });
  });

  describe("collectRemoveCronIds", () => {
    const plan: RemoveTeamPlan = {
      teamId: "qa-team",
      workspaceDir: "/tmp/workspace-qa-team",
      openclawConfigPath: "(managed)",
      cronJobsPath: "(openclaw cron subsystem)",
      agentsToRemove: [],
      cronJobsExact: [{ id: "exact1" }, { id: "exact2" }],
      cronJobsAmbiguous: [{ id: "amb1", reason: "mentions-teamId" }],
      notes: [],
    };
    test("returns only exact ids by default", () => {
      expect(collectRemoveCronIds(plan)).toEqual(["exact1", "exact2"]);
    });
    test("includes ambiguous ids when requested", () => {
      expect(collectRemoveCronIds(plan, true)).toEqual(["exact1", "exact2", "amb1"]);
    });
  });

  describe("deleteCronJobsViaCli", () => {
    test("issues `openclaw cron rm` per id and counts successes", async () => {
      const { api, calls } = makeApiStub(() => ({ code: 0, stdout: "{}", stderr: "" }));
      const res = await deleteCronJobsViaCli(api, ["a", "b"]);
      expect(res.removed).toBe(2);
      expect(res.failed).toEqual([]);
      expect(calls).toEqual([
        ["openclaw", "cron", "rm", "a", "--json"],
        ["openclaw", "cron", "rm", "b", "--json"],
      ]);
    });

    test("continues past failures and reports them", async () => {
      const { api } = makeApiStub((argv) =>
        argv[3] === "b"
          ? { code: 1, stdout: "", stderr: "not found" }
          : { code: 0, stdout: "{}", stderr: "" },
      );
      const res = await deleteCronJobsViaCli(api, ["a", "b", "c"]);
      expect(res.removed).toBe(2);
      expect(res.failed).toEqual([{ id: "b", reason: "not found" }]);
    });
  });

  describe("executeRemoveTeamPlan includeAmbiguous", () => {
    test("removes ambiguous cron jobs when includeAmbiguous true", async () => {
      const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "remove-team-exec-"));
      const workspaceDir = path.join(tmp, "workspace-qa-removal-team");
      const cronPath = path.join(tmp, "cron.json");
      await fs.mkdir(workspaceDir, { recursive: true });
      const cfgObj = { agents: { list: [{ id: "qa-removal-team-lead" }] } };
      const cronStore: CronStore = {
        version: 1,
        jobs: [
          { id: "exact1", payload: { message: "recipes.teamId=qa-removal-team x" } },
          { id: "amb1", name: "qa-removal-team daily", payload: { message: "other" } },
        ],
      };
      const plan = await buildRemoveTeamPlan({
        teamId: "qa-removal-team",
        workspaceRoot: path.join(tmp, "workspace"),
        openclawConfigPath: path.join(tmp, "openclaw.json"),
        cronJobsPath: cronPath,
        cfgObj,
        cronStore,
      });
      try {
        const res = await executeRemoveTeamPlan({
          plan,
          includeAmbiguous: true,
          cfgObj,
          cronStore,
        });
        expect(res.ok).toBe(true);
        expect(cronStore.jobs).toHaveLength(0);
        expect(cfgObj.agents.list).toHaveLength(0);
      } finally {
        await fs.rm(tmp, { recursive: true, force: true });
      }
    });
  });
});
