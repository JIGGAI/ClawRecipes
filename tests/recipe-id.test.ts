import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, expect, test } from "vitest";
import { pickRecipeId } from "../src/lib/recipe-id";

describe("pickRecipeId", () => {
  test("returns baseId when not taken", async () => {
    const recipesDir = path.join(os.tmpdir(), "pick-recipe-id-1");
    await fs.mkdir(recipesDir, { recursive: true });
    try {
      const result = await pickRecipeId({
        baseId: "free-id",
        recipesDir,
        overwriteRecipe: false,
        autoIncrement: false,
        isTaken: async () => false,
        getSuggestions: () => ["a", "b"],
        getConflictError: (id, s) => `Conflict: ${id} (${s.join(", ")})`,
      });
      expect(result).toBe("free-id");
    } finally {
      await fs.rm(recipesDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  test("returns baseId when overwriteRecipe true", async () => {
    const recipesDir = path.join(os.tmpdir(), "pick-recipe-id-2");
    await fs.mkdir(recipesDir, { recursive: true });
    try {
      const result = await pickRecipeId({
        baseId: "taken-id",
        recipesDir,
        overwriteRecipe: true,
        autoIncrement: false,
        isTaken: async () => true,
        getSuggestions: () => [],
        getConflictError: () => "",
      });
      expect(result).toBe("taken-id");
    } finally {
      await fs.rm(recipesDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  test("throws overwriteRecipeError when overwriteRecipe but id taken by non-workspace", async () => {
    const recipesDir = path.join(os.tmpdir(), "pick-recipe-id-3");
    await fs.mkdir(recipesDir, { recursive: true });
    try {
      await expect(
        pickRecipeId({
          baseId: "builtin-id",
          recipesDir,
          overwriteRecipe: true,
          autoIncrement: false,
          isTaken: async () => true,
          overwriteRecipeError: (id) => `Non-workspace: ${id}`,
          getSuggestions: () => [],
          getConflictError: () => "",
        })
      ).rejects.toThrow("Non-workspace: builtin-id");
    } finally {
      await fs.rm(recipesDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  test("returns candidate when autoIncrement finds free slot", async () => {
    const recipesDir = path.join(os.tmpdir(), "pick-recipe-id-4");
    await fs.mkdir(recipesDir, { recursive: true });
    await fs.writeFile(path.join(recipesDir, "base-id.md"), "", "utf8");
    try {
      const result = await pickRecipeId({
        baseId: "base-id",
        recipesDir,
        overwriteRecipe: false,
        autoIncrement: true,
        isTaken: async (id) => {
          const p = path.join(recipesDir, `${id}.md`);
          try {
            await fs.stat(p);
            return true;
          } catch {
            return false;
          }
        },
        getSuggestions: () => [],
        getConflictError: () => "",
      });
      expect(result).toBe("base-id-2");
    } finally {
      await fs.rm(recipesDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  test("throws when id taken and no overwrite/autoIncrement", async () => {
    const recipesDir = path.join(os.tmpdir(), "pick-recipe-id-5");
    await fs.mkdir(recipesDir, { recursive: true });
    try {
      await expect(
        pickRecipeId({
          baseId: "taken",
          recipesDir,
          overwriteRecipe: false,
          autoIncrement: false,
          isTaken: async () => true,
          getSuggestions: (id) => [`${id}-v2`],
          getConflictError: (id, suggestions) => `Exists: ${id} → ${suggestions.join(", ")}`,
        })
      ).rejects.toThrow("Exists: taken → taken-v2");
    } finally {
      await fs.rm(recipesDir, { recursive: true, force: true }).catch(() => {});
    }
  });
});
