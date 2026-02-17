import { describe, expect, test } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  buildRemoveTeamPlan,
  executeRemoveTeamPlan,
  findAgentsToRemove,
  isProtectedTeamId,
  loadCronStore,
  loadOpenClawConfig,
  planCronJobRemovals,
  saveCronStore,
  saveOpenClawConfig,
  stampTeamId,
  type CronJob,
  type CronStore,
} from "../src/lib/remove-team";

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
