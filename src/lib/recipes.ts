import path from "node:path";
import fs from "node:fs/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { RecipesConfig } from "./config";
import { parseFrontmatter } from "./recipe-frontmatter";
import { fileExists } from "./fs-utils";

export function workspacePath(api: OpenClawPluginApi, ...parts: string[]) {
  const root = api.config.agents?.defaults?.workspace;
  if (!root) throw new Error("agents.defaults.workspace is not set in config");
  return path.join(root, ...parts);
}

/**
 * List recipe markdown files (builtin + workspace).
 * @param api - OpenClaw plugin API
 * @param cfg - Recipes config with workspaceRecipesDir
 * @returns Array of { source, path }
 */
export async function listRecipeFiles(api: OpenClawPluginApi, cfg: Required<RecipesConfig>) {
  const builtinDir = path.resolve(__dirname, "..", "..", "recipes", "default");
  const workspaceDir = workspacePath(api, cfg.workspaceRecipesDir);

  const out: Array<{ source: "builtin" | "workspace"; path: string }> = [];

  if (await fileExists(builtinDir)) {
    const files = await fs.readdir(builtinDir);
    for (const f of files) if (f.endsWith(".md")) out.push({ source: "builtin", path: path.join(builtinDir, f) });
  }

  if (await fileExists(workspaceDir)) {
    const files = await fs.readdir(workspaceDir);
    for (const f of files) if (f.endsWith(".md")) out.push({ source: "workspace", path: path.join(workspaceDir, f) });
  }

  return out;
}

import { getRecipesConfig } from "./config";

/**
 * Load a recipe by id (builtin or workspace).
 * @param api - OpenClaw plugin API
 * @param recipeId - Recipe id
 * @returns Parsed recipe { file, md, frontmatter, body }
 * @throws If recipe not found
 */
export async function loadRecipeById(api: OpenClawPluginApi, recipeId: string) {
  const cfg = getRecipesConfig(api.config);
  const files = await listRecipeFiles(api, cfg);
  for (const f of files) {
    const md = await fs.readFile(f.path, "utf8");
    const { frontmatter } = parseFrontmatter(md);
    if (frontmatter.id === recipeId) return { file: f, md, ...parseFrontmatter(md) };
  }
  throw new Error("Recipe not found: " + recipeId);
}
