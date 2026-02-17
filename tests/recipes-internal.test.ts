import { describe, expect, test } from "vitest";
import { __internal } from "../index";
import { getRecipesConfig } from "../src/lib/config";

function mockApi(overrides: { workspace?: string } = {}) {
  const workspace = overrides.workspace ?? "/tmp/test-workspace";
  return {
    config: {
      agents: { defaults: { workspace } },
      plugins: { entries: { recipes: { config: {} } } },
    },
  } as any;
}

describe("__internal recipes helpers", () => {
  describe("workspacePath", () => {
    test("returns joined path when workspace is set", () => {
      const api = mockApi({ workspace: "/home/u/ws" });
      expect(__internal.workspacePath(api, "recipes", "foo")).toBe("/home/u/ws/recipes/foo");
    });
    test("throws when workspace not set", () => {
      const api = mockApi();
      api.config.agents.defaults.workspace = undefined;
      expect(() => __internal.workspacePath(api, "x")).toThrow(/agents\.defaults\.workspace is not set/);
    });
  });

  describe("listRecipeFiles", () => {
    test("returns builtin .md files when builtin dir exists", async () => {
      const api = mockApi();
      const cfg = getRecipesConfig(api.config);
      const files = await __internal.listRecipeFiles(api, cfg);
      const builtin = files.filter((f) => f.source === "builtin");
      expect(builtin.length).toBeGreaterThan(0);
      expect(builtin.every((f) => f.path.endsWith(".md"))).toBe(true);
    });
  });

  describe("loadRecipeById", () => {
    test("loads researcher recipe from builtin", async () => {
      const api = mockApi();
      const loaded = await __internal.loadRecipeById(api, "researcher");
      expect(loaded.frontmatter.id).toBe("researcher");
      expect(loaded.frontmatter.name).toBe("Researcher");
      expect(loaded.file.source).toBe("builtin");
    });
    test("throws when recipe not found", async () => {
      const api = mockApi();
      await expect(__internal.loadRecipeById(api, "nonexistent-recipe-id-xyz")).rejects.toThrow(
        /Recipe not found: nonexistent-recipe-id-xyz/
      );
    });
  });
});
