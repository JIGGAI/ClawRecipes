import path from "node:path";
import YAML from "yaml";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { getRecipesConfig } from "./config";
import { fileExists, writeFileSafely } from "./fs-utils";
import { parseFrontmatter } from "./recipe-frontmatter";
import { detectMissingSkills, skillInstallCommands } from "./skill-install";
import { resolveWorkspaceRoot } from "./workspace";
import { loadRecipeById } from "./recipes";

export type RecipeValidationResult =
  | { ok: true; loaded: Awaited<ReturnType<typeof loadRecipeById>>; recipe: import("./recipe-frontmatter").RecipeFrontmatter; cfg: ReturnType<typeof getRecipesConfig>; workspaceRoot: string }
  | { ok: false; missingSkills: string[]; installCommands: string[] };

/**
 * Load a recipe, validate its kind, and check for missing required skills.
 * Shared by agent and team scaffold handlers.
 * @param api - OpenClaw plugin API
 * @param recipeId - Recipe id
 * @param expectedKind - "agent" or "team"
 * @returns ok with loaded/recipe/cfg/workspaceRoot, or missingSkills/installCommands
 */
export async function validateRecipeAndSkills(
  api: OpenClawPluginApi,
  recipeId: string,
  expectedKind: "agent" | "team"
): Promise<RecipeValidationResult> {
  const loaded = await loadRecipeById(api, recipeId);
  const recipe = loaded.frontmatter;
  const kind = recipe.kind ?? expectedKind;
  if (kind !== expectedKind) {
    const article = expectedKind === "agent" ? "an" : "a";
    throw new Error(`Recipe is not ${article} ${expectedKind} recipe: kind=${recipe.kind}`);
  }
  const cfg = getRecipesConfig(api.config);
  const workspaceRoot = resolveWorkspaceRoot(api);
  const installDir = path.join(workspaceRoot, cfg.workspaceSkillsDir);
  const missing = await detectMissingSkills(installDir, recipe.requiredSkills ?? []);
  if (missing.length) {
    return {
      ok: false,
      missingSkills: missing,
      installCommands: skillInstallCommands(cfg, missing),
    };
  }
  return { ok: true, loaded, recipe, cfg, workspaceRoot };
}

/**
 * Write the workspace recipe file after picking an id.
 * Shared by agent and team scaffold handlers.
 * @param loaded - Loaded recipe from loadRecipeById
 * @param recipesDir - Workspace recipes directory
 * @param workspaceRecipeId - Id for the workspace recipe file
 * @param overwriteRecipe - Whether to overwrite existing file
 */
export async function writeWorkspaceRecipeFile(
  loaded: Awaited<ReturnType<typeof loadRecipeById>>,
  recipesDir: string,
  workspaceRecipeId: string,
  overwriteRecipe: boolean
): Promise<void> {
  const parsed = parseFrontmatter(loaded.md);
  const fm = {
    ...parsed.frontmatter,
    id: workspaceRecipeId,
    name: parsed.frontmatter.name ?? loaded.frontmatter.name ?? workspaceRecipeId,
  };
  const nextMd = `---\n${YAML.stringify(fm)}---\n${parsed.body}`;
  const recipeFilePath = path.join(recipesDir, `${workspaceRecipeId}.md`);
  await writeFileSafely(recipeFilePath, nextMd, overwriteRecipe ? "overwrite" : "createOnly");
}

/**
 * Check if a recipe id is taken (workspace file or built-in).
 * Agent scaffold uses stricter check (loadRecipeById for non-workspace).
 */
export async function recipeIdTakenForAgent(api: OpenClawPluginApi, recipesDir: string, id: string): Promise<boolean> {
  const filePath = path.join(recipesDir, `${id}.md`);
  if (await fileExists(filePath)) return true;
  try {
    await loadRecipeById(api, id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a recipe id is taken (workspace file only).
 * Team scaffold uses simpler check.
 */
export async function recipeIdTakenForTeam(recipesDir: string, id: string): Promise<boolean> {
  return fileExists(path.join(recipesDir, `${id}.md`));
}
