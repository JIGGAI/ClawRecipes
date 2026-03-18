/**
 * Smoke tests for team recipe scaffolding.
 *
 * Validates that scaffold-team produces the expected directory structure,
 * team-level files, per-role files, and template variable substitution
 * for each bundled team recipe.
 */
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, test } from "vitest";
import { __internal } from "../index";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function setupWorkspace() {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "smoke-team-"));
  const workspaceRoot = path.join(base, "workspace");
  await fs.mkdir(workspaceRoot, { recursive: true });
  await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
  return { base, workspaceRoot };
}

function mockApi(workspaceRoot: string) {
  return {
    config: {
      agents: { defaults: { workspace: workspaceRoot } },
      plugins: { entries: { recipes: { config: { cronInstallation: "off" } } } },
    },
  } as any;  
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function readText(p: string): Promise<string> {
  return fs.readFile(p, "utf8");
}

// ---------------------------------------------------------------------------
// Shared assertions for any team recipe
// ---------------------------------------------------------------------------

async function assertStandardTeamStructure(teamDir: string, teamId: string, expectedRoles: string[]) {
  // team.json
  const teamJson = JSON.parse(await readText(path.join(teamDir, "team.json")));
  expect(teamJson.teamId).toBe(teamId);

  // Standard team-level directories
  for (const dir of ["work/backlog", "work/in-progress", "work/testing", "work/done", "notes", "shared-context", "inbox", "outbox"]) {
    expect(await fileExists(path.join(teamDir, dir))).toBe(true);
  }

  // Standard team-level bootstrap files
  expect(await readText(path.join(teamDir, "shared-context", "DECISIONS.md"))).toContain("Decisions");
  expect(await readText(path.join(teamDir, "shared-context", "GLOSSARY.md"))).toContain("Glossary");
  expect(await readText(path.join(teamDir, "shared-context", "priorities.md"))).toContain("Priorities");
  expect(await readText(path.join(teamDir, "shared-context", "agent-outputs", "README.md"))).toBeTruthy();
  expect(await readText(path.join(teamDir, "notes", "plan.md"))).toContain("Plan");
  expect(await readText(path.join(teamDir, "notes", "status.md"))).toContain("Status");
  expect(await readText(path.join(teamDir, "notes", "memory-policy.md"))).toContain("Memory Policy");
  expect(await readText(path.join(teamDir, "TICKETS.md"))).toBeTruthy();
  expect(await readText(path.join(teamDir, "HEARTBEAT.md"))).toContain("HEARTBEAT");

  // Team memory (Kitchen-compatible)
  expect(await fileExists(path.join(teamDir, "shared-context", "memory", "team.jsonl"))).toBe(true);
  expect(await fileExists(path.join(teamDir, "shared-context", "memory", "pinned.jsonl"))).toBe(true);

  // All expected roles scaffolded
  for (const role of expectedRoles) {
    const roleDir = path.join(teamDir, "roles", role);
    expect(await fileExists(roleDir)).toBe(true);

    // Per-role standard files
    for (const file of ["SOUL.md", "AGENTS.md", "STATUS.md", "NOTES.md"]) {
      expect(await fileExists(path.join(roleDir, file))).toBe(true);
    }

    // Per-role continuity files
    expect(await fileExists(path.join(roleDir, "MEMORY.md"))).toBe(true);
    expect(await fileExists(path.join(roleDir, "agent-outputs", "README.md"))).toBe(true);

    // Template variable substitution check
    const agentsContent = await readText(path.join(roleDir, "AGENTS.md"));
    expect(agentsContent).toContain(teamId);

    // Guardrail: no role-local shared-context
    expect(await fileExists(path.join(roleDir, "shared-context"))).toBe(false);
  }

  // Lead has TOOLS.md (required per standards)
  expect(await fileExists(path.join(teamDir, "roles", "lead", "TOOLS.md"))).toBe(true);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Recipe definitions: expected roles + recipe-specific team-level files
// ---------------------------------------------------------------------------

const TEAM_RECIPES: Record<string, {
  roles: string[];
  /** Extra team-level files beyond the standard set (paths relative to teamDir) */
  extraTeamFiles?: string[];
  /** Whether QA_CHECKLIST should be present (auto-enabled when test role exists) */
  expectQaChecklist?: boolean;
}> = {
  "marketing-team": {
    roles: ["lead", "seo", "copywriter", "ads", "social", "designer", "analyst", "video", "compliance", "offer", "funnel", "lifecycle"],
    extraTeamFiles: [
      "shared-context/MEMORY_PLAN.md",
      "shared-context/marketing/POST_LOG.md",
      "shared-context/memory/marketing_learnings.jsonl",
    ],
  },
  "development-team": {
    roles: ["lead", "dev", "devops", "test", "workflow-runner"],
    extraTeamFiles: [
      "shared-context/MEMORY_PLAN.md",
      "shared-context/ticket-flow.json",
      "notes/QA_ACCESS.md",
    ],
    expectQaChecklist: true,
  },
  "business-team": {
    roles: ["lead", "ops", "sales", "marketing", "finance", "analyst"],
    extraTeamFiles: ["shared-context/MEMORY_PLAN.md"],
  },
  "customer-support-team": {
    roles: ["lead", "triage", "resolver", "kb-writer"],
    extraTeamFiles: ["shared-context/MEMORY_PLAN.md"],
  },
  "product-team": {
    roles: ["lead", "pm", "designer", "engineer", "test"],
    extraTeamFiles: ["shared-context/MEMORY_PLAN.md"],
    expectQaChecklist: true,
  },
  "research-team": {
    roles: ["lead", "researcher", "fact-checker", "summarizer"],
    extraTeamFiles: ["shared-context/MEMORY_PLAN.md"],
  },
  "social-team": {
    roles: ["lead", "research", "listening", "social-seo", "editorial", "community", "distributor", "tiktok", "instagram", "youtube", "facebook", "x", "linkedin"],
    extraTeamFiles: ["shared-context/MEMORY_PLAN.md"],
  },
  "writing-team": {
    roles: ["lead", "outliner", "writer", "editor"],
    extraTeamFiles: ["shared-context/MEMORY_PLAN.md"],
  },
};

describe("scaffold-team smoke tests", () => {
  // Generate a test for every bundled team recipe
  for (const [recipeId, spec] of Object.entries(TEAM_RECIPES)) {
    test(`${recipeId}: standard structure + recipe-specific files`, async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      const api = mockApi(workspaceRoot);
      const teamId = `smoke-${recipeId.replace("-team", "")}`;
      try {
        const res = await __internal.handleScaffoldTeam(api, {
          recipeId,
          teamId,
          overwrite: true,
        });
        expect(res.ok).toBe(true);
        if (!res.ok) return;

        expect(res.agents.length).toBe(spec.roles.length);
        await assertStandardTeamStructure(res.teamDir, teamId, spec.roles);

        // Recipe-specific team-level files
        for (const relPath of spec.extraTeamFiles ?? []) {
          const abs = path.join(res.teamDir, relPath);
          expect(await fileExists(abs)).toBe(true);
        }

        // MEMORY_PLAN should exist for all recipes that define it
        if (spec.extraTeamFiles?.includes("shared-context/MEMORY_PLAN.md")) {
          expect(await readText(path.join(res.teamDir, "shared-context", "MEMORY_PLAN.md"))).toContain("Memory Plan");
        }

        // QA checklist presence
        if (spec.expectQaChecklist) {
          expect(await fileExists(path.join(res.teamDir, "notes", "QA_CHECKLIST.md"))).toBe(true);
        }

        // All agents have tool config
        for (const a of res.agents) {
          expect(a.next.configSnippet.tools).toBeDefined();
          expect(a.next.configSnippet.tools.profile).toBeTruthy();
        }

        // Cron reconciliation ran (even if off)
        expect(res.cron).toBeDefined();
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  }

  // Keep the original detailed tests for reference/regression coverage
  test("marketing-team: detailed marketing-specific assertions", async () => {
    const { base, workspaceRoot } = await setupWorkspace();
    const api = mockApi(workspaceRoot);
    const teamId = "smoke-marketing";
    try {
      const res = await __internal.handleScaffoldTeam(api, {
        recipeId: "marketing-team",
        teamId,
        overwrite: true,
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const expectedRoles = [
        "lead", "seo", "copywriter", "ads", "social", "designer",
        "analyst", "video", "compliance", "offer", "funnel", "lifecycle",
      ];
      expect(res.agents.length).toBe(expectedRoles.length);

      await assertStandardTeamStructure(res.teamDir, teamId, expectedRoles);

      // Marketing-specific team-level files (from recipe files[])
      expect(await readText(path.join(res.teamDir, "shared-context", "MEMORY_PLAN.md"))).toContain("Memory Plan");
      expect(await readText(path.join(res.teamDir, "shared-context", "marketing", "POST_LOG.md"))).toContain("Post Log");
      expect(await fileExists(path.join(res.teamDir, "shared-context", "memory", "marketing_learnings.jsonl"))).toBe(true);

      // Cron: cronInstallation=off; recipe defines 13 cron jobs (role loops only, no workflow worker crons)
      expect(res.cron).toBeDefined();

      // Config snippet: all agents have correct tool profiles
      for (const a of res.agents) {
        expect(a.next.configSnippet.tools).toBeDefined();
        expect(a.next.configSnippet.tools.profile).toBe("coding");
      }
    } finally {
      await fs.rm(base, { recursive: true, force: true });
    }
  });

  test("development-team: full scaffold with dev-specific files", async () => {
    const { base, workspaceRoot } = await setupWorkspace();
    const api = mockApi(workspaceRoot);
    const teamId = "smoke-devteam";
    try {
      const res = await __internal.handleScaffoldTeam(api, {
        recipeId: "development-team",
        teamId,
        overwrite: true,
      });
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const expectedRoles = ["lead", "dev", "devops", "test", "workflow-runner"];
      expect(res.agents.length).toBe(expectedRoles.length);

      await assertStandardTeamStructure(res.teamDir, teamId, expectedRoles);

      // Dev-specific team-level files
      expect(await readText(path.join(res.teamDir, "shared-context", "MEMORY_PLAN.md"))).toContain("Memory Plan");
      expect(await fileExists(path.join(res.teamDir, "shared-context", "ticket-flow.json"))).toBe(true);
      expect(await readText(path.join(res.teamDir, "notes", "QA_ACCESS.md"))).toBeTruthy();

      // Dev-team has a QA checklist (has test role → qaChecklist auto-enabled)
      expect(await fileExists(path.join(res.teamDir, "notes", "QA_CHECKLIST.md"))).toBe(true);

      // Cron: recipe defines cron jobs
      expect(res.cron).toBeDefined();
    } finally {
      await fs.rm(base, { recursive: true, force: true });
    }
  });
});
