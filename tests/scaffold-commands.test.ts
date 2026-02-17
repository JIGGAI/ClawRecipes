import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, test } from "vitest";
import { __internal } from "../index";

async function setupWorkspace() {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "scaffold-test-"));
  const workspaceRoot = path.join(base, "workspace");
  await fs.mkdir(workspaceRoot, { recursive: true });
  return { base, workspaceRoot };
}

function mockApi(workspaceRoot: string) {
  return {
    config: {
      agents: { defaults: { workspace: workspaceRoot } },
      plugins: { entries: { recipes: { config: {} } } },
    },
  } as any;
}

describe("scaffold command integration", () => {
  describe("handleScaffold", () => {
    test("returns missingSkills when skills not installed", async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      await fs.mkdir(path.join(workspaceRoot, "recipes"), { recursive: true });
      await fs.writeFile(
        path.join(workspaceRoot, "recipes", "custom-needs-skill.md"),
        `---
id: custom-needs-skill
kind: agent
requiredSkills: [non-existent-skill]
templates: {}
files: []
---
# Custom
`,
        "utf8"
      );
      const api = mockApi(workspaceRoot);
      try {
        const res = await __internal.handleScaffold(api, {
          recipeId: "custom-needs-skill",
          agentId: "test-agent",
        });
        expect(res.ok).toBe(false);
        if (res.ok === false) {
          expect(res.missingSkills).toContain("non-existent-skill");
          expect(res.installCommands.length).toBeGreaterThan(0);
        }
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("scaffolds agent when skills present", async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      const api = mockApi(workspaceRoot);
      await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
      try {
        const res = await __internal.handleScaffold(api, {
          recipeId: "researcher",
          agentId: "test-scaffold-handler",
        });
        expect(res.ok).toBe(true);
        if (res.ok) {
          expect(res.fileResults.length).toBeGreaterThan(0);
          expect(res.next.configSnippet.id).toBe("test-scaffold-handler");
        }
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws when recipe is not an agent recipe", async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      const api = mockApi(workspaceRoot);
      await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
      try {
        await expect(
          __internal.handleScaffold(api, {
            recipeId: "development-team",
            agentId: "test-agent",
          })
        ).rejects.toThrow(/Recipe is not an agent recipe/);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("applyConfig writes agent to openclaw config", async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      const cfgObj = { agents: { list: [], defaults: { workspace: workspaceRoot } } };
      const api = {
        ...mockApi(workspaceRoot),
        runtime: {
          config: {
            loadConfig: () => ({ cfg: cfgObj }),
            writeConfigFile: async (c: any) => Object.assign(cfgObj, c),
          },
        },
      } as any;
      await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
      try {
        const res = await __internal.handleScaffold(api, {
          recipeId: "researcher",
          agentId: "test-apply-config",
          applyConfig: true,
        });
        expect(res.ok).toBe(true);
        expect(cfgObj.agents.list.some((a: any) => a.id === "test-apply-config")).toBe(true);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("autoIncrement picks next id when recipe exists", async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
      await fs.mkdir(path.join(workspaceRoot, "recipes"), { recursive: true });
      await fs.writeFile(
        path.join(workspaceRoot, "recipes", "test-auto-agent.md"),
        `---
id: test-auto-agent
kind: agent
templates: {}
files: []
---
`,
        "utf8"
      );
      const api = mockApi(workspaceRoot);
      try {
        const res = await __internal.handleScaffold(api, {
          recipeId: "researcher",
          agentId: "test-auto-agent",
          autoIncrement: true,
        });
        expect(res.ok).toBe(true);
        const recipeFile = path.join(workspaceRoot, "recipes", "test-auto-agent-2.md");
        await expect(fs.access(recipeFile)).resolves.toBeUndefined();
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("overwriteRecipe succeeds when recipe exists in workspace", async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
      await fs.mkdir(path.join(workspaceRoot, "recipes"), { recursive: true });
      await fs.writeFile(
        path.join(workspaceRoot, "recipes", "my-agent.md"),
        `---
id: my-agent
kind: agent
templates: {}
files: []
---
`,
        "utf8"
      );
      const api = mockApi(workspaceRoot);
      try {
        const res = await __internal.handleScaffold(api, {
          recipeId: "researcher",
          agentId: "overwrite-agent",
          recipeIdExplicit: "my-agent",
          overwriteRecipe: true,
        });
        expect(res.ok).toBe(true);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("overwriteRecipe throws when id taken by non-workspace recipe", async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
      const api = mockApi(workspaceRoot);
      try {
        await expect(
          __internal.handleScaffold(api, {
            recipeId: "researcher",
            agentId: "researcher",
            overwriteRecipe: true,
          })
        ).rejects.toThrow(/already taken by a non-workspace recipe/);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws with suggestions when recipe id taken and no overwrite/autoIncrement", async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
      await fs.mkdir(path.join(workspaceRoot, "recipes"), { recursive: true });
      await fs.writeFile(
        path.join(workspaceRoot, "recipes", "taken-agent.md"),
        `---
id: taken-agent
kind: agent
templates: {}
files: []
---
`,
        "utf8"
      );
      const api = mockApi(workspaceRoot);
      try {
        await expect(
          __internal.handleScaffold(api, {
            recipeId: "researcher",
            agentId: "taken-agent",
          })
        ).rejects.toThrow(/Recipe id already exists.*Suggestions.*taken-agent-2/);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });

  describe("scaffoldAgentFromRecipe", () => {
    test("writes agent files from researcher recipe", async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      const api = mockApi(workspaceRoot);
      try {
        const loaded = await __internal.loadRecipeById(api, "researcher");
        const agentDir = path.join(base, "workspace-test-agent");
        const result = await __internal.scaffoldAgentFromRecipe(api, loaded.frontmatter, {
          agentId: "test-agent",
          filesRootDir: agentDir,
          workspaceRootDir: agentDir,
          vars: { agentId: "test-agent", agentName: "Researcher" },
        });
        expect(result.fileResults.length).toBeGreaterThan(0);
        expect(result.fileResults.some((r) => r.path.endsWith("SOUL.md"))).toBe(true);
        const soulPath = path.join(agentDir, "SOUL.md");
        expect(await fs.readFile(soulPath, "utf8")).toContain("You are a researcher");
        expect(result.next.configSnippet.id).toBe("test-agent");
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("createOnly skips existing files", async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      const api = mockApi(workspaceRoot);
      const agentDir = path.join(base, "workspace-test-agent");
      await fs.mkdir(agentDir, { recursive: true });
      await fs.writeFile(path.join(agentDir, "SOUL.md"), "original", "utf8");
      try {
        const loaded = await __internal.loadRecipeById(api, "researcher");
        const result = await __internal.scaffoldAgentFromRecipe(api, loaded.frontmatter, {
          agentId: "test-agent",
          filesRootDir: agentDir,
          workspaceRootDir: agentDir,
          vars: { agentId: "test-agent", agentName: "Researcher" },
        });
        const soulResult = result.fileResults.find((r) => r.path.endsWith("SOUL.md"));
        expect(soulResult?.wrote).toBe(false);
        expect(soulResult?.reason).toBe("exists");
        expect(await fs.readFile(path.join(agentDir, "SOUL.md"), "utf8")).toBe("original");
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("update overwrites existing files when file has mode overwrite", async () => {
      const { base, workspaceRoot } = await setupWorkspace();
      await fs.mkdir(path.join(workspaceRoot, "recipes"), { recursive: true });
      await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
      await fs.writeFile(
        path.join(workspaceRoot, "recipes", "overwrite-recipe.md"),
        `---
id: overwrite-recipe
kind: agent
templates:
  soul: "Custom {{agentName}} persona"
files:
  - path: SOUL.md
    template: soul
---
`,
        "utf8"
      );
      const api = mockApi(workspaceRoot);
      const agentDir = path.join(base, "workspace-overwrite-agent");
      await fs.mkdir(agentDir, { recursive: true });
      await fs.writeFile(path.join(agentDir, "SOUL.md"), "original", "utf8");
      try {
        const loaded = await __internal.loadRecipeById(api, "overwrite-recipe");
        const result = await __internal.scaffoldAgentFromRecipe(api, loaded.frontmatter, {
          agentId: "test-agent",
          filesRootDir: agentDir,
          workspaceRootDir: agentDir,
          update: true,
          vars: { agentId: "test-agent", agentName: "Researcher" },
        });
        const soulResult = result.fileResults.find((r) => r.path.endsWith("SOUL.md"));
        expect(soulResult?.wrote).toBe(true);
        expect(soulResult?.reason).toBe("ok");
        expect(await fs.readFile(path.join(agentDir, "SOUL.md"), "utf8")).toContain("Custom Researcher persona");
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });
});

describe("handleScaffoldTeam", () => {
  test("returns missingSkills when skills not installed", async () => {
    const { base, workspaceRoot } = await setupWorkspace();
    await fs.mkdir(path.join(workspaceRoot, "recipes"), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, "recipes", "custom-team-needs-skill.md"),
      `---
id: custom-team-needs-skill
kind: team
requiredSkills: [non-existent-skill]
agents: [{ role: lead }]
templates: {}
files: []
---
# Custom team
`,
      "utf8"
    );
    const api = mockApi(workspaceRoot);
    try {
      const res = await __internal.handleScaffoldTeam(api, {
        recipeId: "custom-team-needs-skill",
        teamId: "test-team-team",
      });
      expect(res.ok).toBe(false);
      if (res.ok === false) {
        expect(res.missingSkills).toContain("non-existent-skill");
        expect(res.installCommands.length).toBeGreaterThan(0);
      }
    } finally {
      await fs.rm(base, { recursive: true, force: true });
    }
  });
  test("throws when recipe is not a team recipe", async () => {
    const { base, workspaceRoot } = await setupWorkspace();
    const api = mockApi(workspaceRoot);
    try {
      await expect(
        __internal.handleScaffoldTeam(api, {
          recipeId: "researcher",
          teamId: "test-team-team",
        })
      ).rejects.toThrow(/Recipe is not a team recipe/);
    } finally {
      await fs.rm(base, { recursive: true, force: true });
    }
  });
  test("throws when team recipe id exists and no overwrite/autoIncrement", async () => {
    const { base, workspaceRoot } = await setupWorkspace();
    await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
    await fs.mkdir(path.join(workspaceRoot, "recipes"), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, "recipes", "dev-team-existing.md"),
      `---
id: dev-team-existing
kind: team
agents: []
templates: {}
files: []
---
`,
      "utf8"
    );
    const api = mockApi(workspaceRoot);
    try {
      await expect(
        __internal.handleScaffoldTeam(api, {
          recipeId: "development-team",
          teamId: "dev-team-existing",
        })
      ).rejects.toThrow(/Workspace recipe already exists.*dev-team-existing-v2/);
    } finally {
      await fs.rm(base, { recursive: true, force: true });
    }
  });
  test("scaffolds team when skills present", async () => {
    const { base, workspaceRoot } = await setupWorkspace();
    const api = mockApi(workspaceRoot);
    await fs.mkdir(path.join(workspaceRoot, "skills"), { recursive: true });
    try {
      const res = await __internal.handleScaffoldTeam(api, {
        recipeId: "development-team",
        teamId: "test-scaffold-team-team",
        overwrite: true,
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.teamId).toBe("test-scaffold-team-team");
        expect(res.teamDir).toContain("workspace-test-scaffold-team-team");
        expect(res.agents.length).toBeGreaterThan(0);
        expect(res.agents.some((a: any) => a.role === "lead")).toBe(true);
        const teamJsonPath = path.join(res.teamDir, "team.json");
        const teamJson = JSON.parse(await fs.readFile(teamJsonPath, "utf8"));
        expect(teamJson.recipeId).toBe("development-team");
      }
    } finally {
      await fs.rm(base, { recursive: true, force: true });
    }
  });
});

describe("migrate-team integration", () => {
  describe("handleMigrateTeamPlan", () => {
    test("returns plan when legacy team dir exists", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "migrate-test-"));
      const workspaceRoot = path.join(base, "workspace");
      const legacyTeamDir = path.join(workspaceRoot, "teams", "dev-team");
      await fs.mkdir(legacyTeamDir, { recursive: true });
      const api = { config: { agents: { defaults: { workspace: workspaceRoot } } } } as any;
      try {
        const plan = await __internal.handleMigrateTeamPlan(api, { teamId: "dev-team" });
        expect(plan.teamId).toBe("dev-team");
        expect(plan.mode).toBe("move");
        expect(plan.steps.some((s: any) => s.kind === "teamDir")).toBe(true);
        expect(plan.legacy.teamDir).toBe(legacyTeamDir);
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
    test("throws when teamId does not end with -team", async () => {
      const api = { config: { agents: { defaults: { workspace: "/x" } } } } as any;
      await expect(__internal.handleMigrateTeamPlan(api, { teamId: "bad" })).rejects.toThrow(/must end with -team/);
    });
    test("throws when legacy dir not found", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "migrate-test-"));
      const workspaceRoot = path.join(base, "workspace");
      await fs.mkdir(workspaceRoot, { recursive: true });
      const api = { config: { agents: { defaults: { workspace: workspaceRoot } } } } as any;
      try {
        await expect(__internal.handleMigrateTeamPlan(api, { teamId: "nonexistent-team" })).rejects.toThrow(
          /Legacy team directory not found/
        );
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });
  describe("executeMigrateTeamPlan", () => {
    test("moves team dir and role dirs in move mode", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "migrate-move-"));
      const workspaceRoot = path.join(base, "workspace");
      const legacyTeamDir = path.join(workspaceRoot, "teams", "move-mode-team");
      const legacyAgentsDir = path.join(workspaceRoot, "agents");
      const destTeamDir = path.join(base, "workspace-move-mode-team");
      await fs.mkdir(legacyTeamDir, { recursive: true });
      await fs.mkdir(legacyAgentsDir, { recursive: true });
      await fs.writeFile(path.join(legacyTeamDir, "moved.txt"), "moved-content", "utf8");
      const roleDir = path.join(legacyAgentsDir, "move-mode-team-lead");
      await fs.mkdir(roleDir, { recursive: true });
      await fs.writeFile(path.join(roleDir, "role.md"), "role-content", "utf8");
      const cfgObj = { agents: { list: [], defaults: { workspace: workspaceRoot } } };
      const api = {
        config: { agents: { defaults: { workspace: workspaceRoot } } },
        runtime: {
          config: {
            loadConfig: () => ({ cfg: cfgObj }),
            writeConfigFile: async (c: any) => Object.assign(cfgObj, c),
          },
        },
      } as any;
      const plan = await __internal.handleMigrateTeamPlan(api, { teamId: "move-mode-team", mode: "move" });
      try {
        const result = await __internal.executeMigrateTeamPlan(api, plan);
        expect(result.ok).toBe(true);
        expect(result.migrated).toBe("move-mode-team");
        expect(await fs.readFile(path.join(destTeamDir, "moved.txt"), "utf8")).toBe("moved-content");
        expect(await fs.readFile(path.join(destTeamDir, "roles", "lead", "role.md"), "utf8")).toBe("role-content");
        await expect(fs.access(legacyTeamDir)).rejects.toThrow();
      } finally {
        await fs.rm(base, { recursive: true, force: true }).catch(() => {});
      }
    });
    test("copies team dir and role dirs in copy mode", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "migrate-exec-"));
      const workspaceRoot = path.join(base, "workspace");
      const legacyTeamDir = path.join(workspaceRoot, "teams", "migrate-team");
      const legacyAgentsDir = path.join(workspaceRoot, "agents");
      const destTeamDir = path.join(base, "workspace-migrate-team");
      await fs.mkdir(legacyTeamDir, { recursive: true });
      await fs.mkdir(legacyAgentsDir, { recursive: true });
      await fs.writeFile(path.join(legacyTeamDir, "file.txt"), "team-content", "utf8");
      const roleDir = path.join(legacyAgentsDir, "migrate-team-lead");
      await fs.mkdir(roleDir, { recursive: true });
      await fs.writeFile(path.join(roleDir, "role-file.md"), "role-content", "utf8");
      const cfgObj = { agents: { list: [], defaults: { workspace: workspaceRoot } } };
      const api = {
        config: { agents: { defaults: { workspace: workspaceRoot } } },
        runtime: {
          config: {
            loadConfig: () => ({ cfg: cfgObj }),
            writeConfigFile: async (c: any) => Object.assign(cfgObj, c),
          },
        },
      } as any;
      const plan = await __internal.handleMigrateTeamPlan(api, {
        teamId: "migrate-team",
        mode: "copy",
      });
      try {
        const result = await __internal.executeMigrateTeamPlan(api, plan);
        expect(result.ok).toBe(true);
        expect(result.migrated).toBe("migrate-team");
        expect(await fs.readFile(path.join(destTeamDir, "file.txt"), "utf8")).toBe("team-content");
        expect(await fs.readFile(path.join(destTeamDir, "roles", "lead", "role-file.md"), "utf8")).toBe("role-content");
        expect(legacyTeamDir).toBeDefined();
        await expect(fs.access(legacyTeamDir)).resolves.toBeUndefined();
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });
});
