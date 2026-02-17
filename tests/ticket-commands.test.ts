import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, test } from "vitest";
import { __internal } from "../index";
import { fileExists } from "../src/lib/fs-utils";

async function setupTeamWorkspace() {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "ticket-cmd-"));
  const workspaceRoot = path.join(base, "workspace");
  const teamId = "test-team";
  const teamDir = path.join(base, `workspace-${teamId}`);
  await fs.mkdir(path.join(workspaceRoot), { recursive: true });
  await fs.mkdir(path.join(teamDir, "work", "backlog"), { recursive: true });
  await fs.mkdir(path.join(teamDir, "work", "in-progress"), { recursive: true });
  await fs.mkdir(path.join(teamDir, "work", "testing"), { recursive: true });
  await fs.mkdir(path.join(teamDir, "work", "done"), { recursive: true });
  return { base, workspaceRoot, teamId, teamDir };
}

function mockApi(workspaceRoot: string) {
  return {
    config: {
      agents: { defaults: { workspace: workspaceRoot } },
      plugins: { entries: { recipes: { config: {} } } },
    },
  } as any;
}

describe("ticket command handlers (integration)", () => {
  describe("handleTickets", () => {
    test("returns ticket structure with backlog/inProgress/testing/done", async () => {
      const { base, workspaceRoot, teamId, teamDir } = await setupTeamWorkspace();
      try {
        await fs.writeFile(path.join(teamDir, "work", "backlog", "0001-sample.md"), "# 0001-sample\n\n## Context\n", "utf8");
        const api = mockApi(workspaceRoot);
        const out = await __internal.handleTickets(api, { teamId });
        expect(out.teamId).toBe(teamId);
        expect(out.tickets).toHaveLength(1);
        expect(out.backlog).toHaveLength(1);
        expect(out.backlog[0].id).toBe("0001-sample");
        expect(out.inProgress).toHaveLength(0);
        expect(out.testing).toHaveLength(0);
        expect(out.done).toHaveLength(0);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws when workspace not set", async () => {
      const api = { config: { agents: { defaults: {} } } } as any;
      await expect(__internal.handleTickets(api, { teamId: "x" })).rejects.toThrow(/workspace is not set/);
    });

    test("returns empty lists when no tickets", async () => {
      const { base, workspaceRoot, teamId } = await setupTeamWorkspace();
      try {
        const api = mockApi(workspaceRoot);
        const out = await __internal.handleTickets(api, { teamId });
        expect(out.backlog).toEqual([]);
        expect(out.inProgress).toEqual([]);
        expect(out.tickets).toEqual([]);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });

  describe("handleMoveTicket", () => {
    test("moves ticket from backlog to in-progress", async () => {
      const { base, workspaceRoot, teamId, teamDir } = await setupTeamWorkspace();
      const ticketPath = path.join(teamDir, "work", "backlog", "0001-sample.md");
      await fs.writeFile(ticketPath, "# 0001-sample\n\nStatus: queued\n\n## Context\n", "utf8");
      try {
        const api = mockApi(workspaceRoot);
        const res = await __internal.handleMoveTicket(api, { teamId, ticket: "0001", to: "in-progress" });
        expect(res.ok).toBe(true);
        expect(res.to).toContain(path.join("work", "in-progress"));
        const moved = await fs.readFile(res.to, "utf8");
        expect(moved).toMatch(/Status:\s*in-progress/);
        expect(await fileExists(ticketPath)).toBe(false);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws when ticket not found", async () => {
      const { base, workspaceRoot, teamId } = await setupTeamWorkspace();
      try {
        const api = mockApi(workspaceRoot);
        await expect(__internal.handleMoveTicket(api, { teamId, ticket: "9999", to: "done" })).rejects.toThrow(
          /Ticket not found/
        );
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws when --to is invalid", async () => {
      const { base, workspaceRoot, teamId } = await setupTeamWorkspace();
      try {
        const api = mockApi(workspaceRoot);
        await expect(__internal.handleMoveTicket(api, { teamId, ticket: "0001", to: "invalid" })).rejects.toThrow(
          /--to must be one of/
        );
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("returns plan when dryRun", async () => {
      const { base, workspaceRoot, teamId, teamDir } = await setupTeamWorkspace();
      const ticketPath = path.join(teamDir, "work", "backlog", "0007-sample.md");
      await fs.writeFile(ticketPath, "# 0007-sample\n\nStatus: queued\n\n## Context\n", "utf8");
      try {
        const api = mockApi(workspaceRoot);
        const res = await __internal.handleMoveTicket(api, {
          teamId,
          ticket: "0007",
          to: "in-progress",
          dryRun: true,
        });
        expect((res as any).ok).toBe(true);
        expect((res as any).plan.from).toContain("0007-sample");
        expect((res as any).plan.to).toContain(path.join("work", "in-progress"));
        expect(await fileExists(ticketPath)).toBe(true);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });

  describe("handleAssign", () => {
    test("assigns ticket to owner and creates assignment stub", async () => {
      const { base, workspaceRoot, teamId, teamDir } = await setupTeamWorkspace();
      const ticketPath = path.join(teamDir, "work", "backlog", "0002-feat.md");
      await fs.writeFile(ticketPath, "# 0002-feat\n\nStatus: queued\n\n## Context\n", "utf8");
      try {
        const api = mockApi(workspaceRoot);
        const res = await __internal.handleAssign(api, { teamId, ticket: "0002", owner: "dev" });
        expect(res.ok).toBe(true);
        expect(res.plan.owner).toBe("dev");
        const ticketContent = await fs.readFile(ticketPath, "utf8");
        expect(ticketContent).toMatch(/Owner:\s*dev/);
        const assignmentPath = path.join(teamDir, "work", "assignments", "0002-assigned-dev.md");
        expect(await fileExists(assignmentPath)).toBe(true);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("returns plan when dryRun", async () => {
      const { base, workspaceRoot, teamId, teamDir } = await setupTeamWorkspace();
      await fs.writeFile(path.join(teamDir, "work", "backlog", "0003-fix.md"), "# 0003-fix\n\n## Context\n", "utf8");
      try {
        const api = mockApi(workspaceRoot);
        const res = await __internal.handleAssign(api, { teamId, ticket: "0003", owner: "test", dryRun: true });
        expect(res.ok).toBe(true);
        expect((res as any).plan.ticketPath).toContain("0003-fix");
        const ticketPath = path.join(teamDir, "work", "backlog", "0003-fix.md");
        const content = await fs.readFile(ticketPath, "utf8");
        expect(content).not.toMatch(/Owner:/);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws when ticket not found", async () => {
      const { base, workspaceRoot, teamId } = await setupTeamWorkspace();
      try {
        const api = mockApi(workspaceRoot);
        await expect(__internal.handleAssign(api, { teamId, ticket: "9999", owner: "dev" })).rejects.toThrow(
          /Ticket not found/
        );
        await expect(__internal.handleAssign(api, { teamId, ticket: "0001", owner: "invalid-role" })).rejects.toThrow(
          /--owner must be one of/
        );
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });

  describe("handleTake", () => {
    test("moves ticket to in-progress and creates assignment", async () => {
      const { base, workspaceRoot, teamId, teamDir } = await setupTeamWorkspace();
      const ticketPath = path.join(teamDir, "work", "backlog", "0004-task.md");
      await fs.writeFile(ticketPath, "# 0004-task\n\nStatus: queued\n\n## Context\n", "utf8");
      try {
        const api = mockApi(workspaceRoot);
        const res = await __internal.handleTake(api, { teamId, ticket: "0004", owner: "dev" });
        expect("srcPath" in res).toBe(true);
        expect(res.srcPath).toBeDefined();
        expect(res.destPath).toContain(path.join("work", "in-progress"));
        expect(res.assignmentPath).toContain("0004-assigned-dev");
        expect(await fileExists(ticketPath)).toBe(false);
        const inProgressPath = path.join(teamDir, "work", "in-progress", "0004-task.md");
        expect(await fileExists(inProgressPath)).toBe(true);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("returns plan when dryRun", async () => {
      const { base, workspaceRoot, teamId, teamDir } = await setupTeamWorkspace();
      await fs.writeFile(path.join(teamDir, "work", "backlog", "0005-bug.md"), "# 0005-bug\n\n## Context\n", "utf8");
      try {
        const api = mockApi(workspaceRoot);
        const res = await __internal.handleTake(api, { teamId, ticket: "0005", owner: "dev", dryRun: true });
        expect((res as any).plan.from).toContain("0005-bug");
        expect((res as any).plan.owner).toBe("dev");
        const ticketPath = path.join(teamDir, "work", "backlog", "0005-bug.md");
        expect(await fileExists(ticketPath)).toBe(true);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws when --owner is invalid", async () => {
      const { base, workspaceRoot, teamId } = await setupTeamWorkspace();
      try {
        const api = mockApi(workspaceRoot);
        await expect(__internal.handleTake(api, { teamId, ticket: "0001", owner: "invalid" })).rejects.toThrow(
          /--owner must be one of/
        );
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });

  describe("handleHandoff", () => {
    test("moves ticket to testing and assigns to tester", async () => {
      const { base, workspaceRoot, teamId, teamDir } = await setupTeamWorkspace();
      const ticketPath = path.join(teamDir, "work", "in-progress", "0006-qa.md");
      await fs.writeFile(ticketPath, "# 0006-qa\n\nStatus: in-progress\nOwner: dev\n\n## Context\n", "utf8");
      try {
        const api = mockApi(workspaceRoot);
        const res = await __internal.handleHandoff(api, { teamId, ticket: "0006", tester: "test" });
        expect("destPath" in res).toBe(true);
        expect(res.destPath).toContain(path.join("work", "testing"));
        expect(await fileExists(ticketPath)).toBe(false);
        const testingPath = path.join(teamDir, "work", "testing", "0006-qa.md");
        expect(await fileExists(testingPath)).toBe(true);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws when ticket not found", async () => {
      const { base, workspaceRoot, teamId } = await setupTeamWorkspace();
      try {
        const api = mockApi(workspaceRoot);
        await expect(__internal.handleHandoff(api, { teamId, ticket: "9999", tester: "test" })).rejects.toThrow(
          /Ticket not found/
        );
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws when --tester is invalid", async () => {
      const { base, workspaceRoot, teamId } = await setupTeamWorkspace();
      try {
        const api = mockApi(workspaceRoot);
        await expect(__internal.handleHandoff(api, { teamId, ticket: "0001", tester: "qa" })).rejects.toThrow(
          /--tester must be one of/
        );
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("returns plan when dryRun", async () => {
      const { base, workspaceRoot, teamId, teamDir } = await setupTeamWorkspace();
      const ticketPath = path.join(teamDir, "work", "in-progress", "0008-qa.md");
      await fs.writeFile(ticketPath, "# 0008-qa\n\nStatus: in-progress\n\n## Context\n", "utf8");
      try {
        const api = mockApi(workspaceRoot);
        const res = await __internal.handleHandoff(api, { teamId, ticket: "0008", tester: "test", dryRun: true });
        expect((res as any).plan.from).toContain("0008-qa");
        expect((res as any).plan.tester).toBe("test");
        expect(await fileExists(ticketPath)).toBe(true);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });
});
