import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { describe, expect, test } from "vitest";
import { __internal } from "../index";

function mockApi(overrides: { workspace?: string; cfgObj?: any } = {}) {
  const workspace = overrides.workspace ?? "/tmp/test-ws";
  const cfgObj = overrides.cfgObj ?? { bindings: [] };

  return {
    config: {
      agents: { defaults: { workspace } },
      plugins: { entries: { recipes: { config: {} } } },
    },
    runtime: {
      config: {
        loadConfig: () => ({ cfg: cfgObj }),
        writeConfigFile: async (c: any) => {
          Object.assign(cfgObj, c);
        },
      },
    },
  } as any;
}

describe("recipes command handlers (integration)", () => {
  describe("handleRecipesList", () => {
    test("returns builtin recipe rows", async () => {
      const api = mockApi();
      const rows = await __internal.handleRecipesList(api);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.some((r) => r.id === "researcher" && r.source === "builtin")).toBe(true);
    });
    test("includes INVALID row when parseFrontmatter throws", async () => {
      const base = await fs.mkdtemp(path.join(os.tmpdir(), "recipes-list-"));
      const workspaceRoot = path.join(base, "workspace");
      const recipesDir = path.join(workspaceRoot, "recipes");
      await fs.mkdir(recipesDir, { recursive: true });
      await fs.writeFile(
        path.join(recipesDir, "invalid-no-id.md"),
        `---
name: Bad Recipe
---
body
`,
        "utf8"
      );
      const api = mockApi({ workspace: workspaceRoot });
      try {
        const rows = await __internal.handleRecipesList(api);
        const invalidRow = rows.find((r) => r.id === "invalid-no-id.md" || r.kind === "invalid");
        expect(invalidRow).toBeDefined();
        expect(invalidRow?.kind).toBe("invalid");
        expect(invalidRow?.name).toContain("INVALID");
      } finally {
        await fs.rm(base, { recursive: true, force: true });
      }
    });
  });

  describe("handleRecipesShow", () => {
    test("returns recipe markdown by id", async () => {
      const api = mockApi();
      const md = await __internal.handleRecipesShow(api, "researcher");
      expect(md).toContain("# Researcher");
      expect(md).toContain("id: researcher");
    });
    test("throws when recipe not found", async () => {
      const api = mockApi();
      await expect(__internal.handleRecipesShow(api, "nonexistent-id")).rejects.toThrow(/Recipe not found/);
    });
  });

  describe("handleRecipesStatus", () => {
    test("returns status rows for all recipes", async () => {
      const api = mockApi();
      const rows = await __internal.handleRecipesStatus(api);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveProperty("id");
      expect(rows[0]).toHaveProperty("requiredSkills");
      expect(rows[0]).toHaveProperty("missingSkills");
      expect(rows[0]).toHaveProperty("installCommands");
    });
    test("filters by id when given", async () => {
      const api = mockApi();
      const rows = await __internal.handleRecipesStatus(api, "researcher");
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe("researcher");
    });
  });

  describe("handleRecipesBind", () => {
    test("adds binding and returns result", async () => {
      const cfgObj: { bindings: Array<{ agentId?: string; match?: { channel?: string } }> } = { bindings: [] };
      const api = mockApi({ cfgObj });
      const res = await __internal.handleRecipesBind(api, {
        agentId: "dev",
        match: { channel: "telegram" },
      });
      expect(res.updatedBindings).toHaveLength(1);
      expect(cfgObj.bindings).toHaveLength(1);
      expect(cfgObj.bindings[0]!.agentId).toBe("dev");
      expect(cfgObj.bindings[0]!.match!.channel).toBe("telegram");
    });
  });

  describe("handleRecipesUnbind", () => {
    test("removes matching bindings", async () => {
      const cfgObj = {
        bindings: [
          { agentId: "x", match: { channel: "slack" } },
          { agentId: "y", match: { channel: "slack" } },
        ],
      };
      const api = mockApi({ cfgObj });
      const res = await __internal.handleRecipesUnbind(api, { match: { channel: "slack" } });
      expect(res.removedCount).toBe(2);
      expect(cfgObj.bindings).toHaveLength(0);
    });
  });

  describe("handleRecipesBindings", () => {
    test("returns bindings array", async () => {
      const cfgObj = { bindings: [{ agentId: "a", match: { channel: "x" } }] };
      const api = mockApi({ cfgObj });
      const bindings = await __internal.handleRecipesBindings(api);
      expect(bindings).toHaveLength(1);
      expect(bindings[0].agentId).toBe("a");
    });
    test("returns empty array when no bindings", async () => {
      const api = mockApi({ cfgObj: {} });
      const bindings = await __internal.handleRecipesBindings(api);
      expect(bindings).toEqual([]);
    });
  });
});
