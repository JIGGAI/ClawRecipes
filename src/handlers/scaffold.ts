import path from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { type AgentConfigSnippet } from "../lib/agent-config";
import { applyAgentSnippetsToOpenClawConfig } from "../lib/recipes-config";
import { ensureDir, writeFileSafely } from "../lib/fs-utils";
import { type RecipeFrontmatter } from "../lib/recipe-frontmatter";
import { renderTemplate } from "../lib/template";
import { pickRecipeId } from "../lib/recipe-id";
import { recipeIdTakenForAgent, validateRecipeAndSkills, writeWorkspaceRecipeFile } from "../lib/scaffold-utils";
import { reconcileRecipeCronJobs } from "./cron";

/**
 * Scaffold agent files from a recipe (templates, config snippet).
 * @param api - OpenClaw plugin API
 * @param recipe - Recipe frontmatter
 * @param opts - agentId, agentName, update, vars, filesRootDir, workspaceRootDir
 * @returns File results and configSnippet for agents.list
 */
export async function scaffoldAgentFromRecipe(
  api: OpenClawPluginApi,
  recipe: RecipeFrontmatter,
  opts: {
    agentId: string;
    agentName?: string;
    update?: boolean;
    vars?: Record<string, string>;

    // Where to write the scaffolded files (may be a shared team workspace role folder)
    filesRootDir: string;

    // What to set in agents.list[].workspace (may be shared team workspace root)
    workspaceRootDir: string;
  },
) {
  await ensureDir(opts.filesRootDir);

  const templates = recipe.templates ?? {};
  const files = recipe.files ?? [];
  const vars = opts.vars ?? {};

  const fileResults: Array<{ path: string; wrote: boolean; reason: string }> = [];
  for (const f of files) {
    const raw = templates[f.template];
    if (typeof raw !== "string") throw new Error(`Missing template: ${f.template}`);
    const rendered = renderTemplate(raw, vars);
    const target = path.join(opts.filesRootDir, f.path);
    const mode = opts.update ? (f.mode ?? "overwrite") : (f.mode ?? "createOnly");
    const r = await writeFileSafely(target, rendered, mode);
    fileResults.push({ path: target, wrote: r.wrote, reason: r.reason });
  }

  const configSnippet: AgentConfigSnippet = {
    id: opts.agentId,
    workspace: opts.workspaceRootDir,
    identity: { name: opts.agentName ?? recipe.name ?? opts.agentId },
    tools: recipe.tools,
  };

  return {
    filesRootDir: opts.filesRootDir,
    workspaceRootDir: opts.workspaceRootDir,
    fileResults,
    next: {
      configSnippet,
    },
  };
}

/**
 * Scaffold an agent from a recipe (full flow: validate, write recipe, scaffold, cron).
 * @param api - OpenClaw plugin API
 * @param options - recipeId, agentId, name, recipeIdExplicit, overwrite, overwriteRecipe, autoIncrement, applyConfig
 * @returns ok with fileResults and cron, or missingSkills with installCommands
 */
export async function handleScaffold(
  api: OpenClawPluginApi,
  options: {
    recipeId: string;
    agentId: string;
    name?: string;
    recipeIdExplicit?: string;
    overwrite?: boolean;
    overwriteRecipe?: boolean;
    autoIncrement?: boolean;
    applyConfig?: boolean;
  },
) {
  const validation = await validateRecipeAndSkills(api, options.recipeId, "agent");
  if (!validation.ok) {
    return {
      ok: false as const,
      missingSkills: validation.missingSkills,
      installCommands: validation.installCommands,
    };
  }
  const { loaded, recipe, cfg, workspaceRoot } = validation;
  const agentId = String(options.agentId);
  const baseWorkspace = api.config.agents?.defaults?.workspace ?? "~/.openclaw/workspace";
  const resolvedWorkspaceRoot = path.resolve(baseWorkspace, "..", `workspace-${agentId}`);
  const recipesDir = path.join(workspaceRoot, cfg.workspaceRecipesDir);
  await ensureDir(recipesDir);
  const overwriteRecipe = !!options.overwriteRecipe;
  const autoIncrement = !!options.autoIncrement;

  const explicitRecipeId = typeof options.recipeIdExplicit === "string" ? String(options.recipeIdExplicit).trim() : "";
  const baseRecipeId = explicitRecipeId || agentId;
  const workspaceRecipeId = await pickRecipeId({
    baseId: baseRecipeId,
    recipesDir,
    overwriteRecipe,
    autoIncrement,
    isTaken: (id) => recipeIdTakenForAgent(api, recipesDir, id),
    overwriteRecipeError: (id) =>
      `Recipe id is already taken by a non-workspace recipe: ${id}. Choose a different id (e.g. ${id}-2) or pass --auto-increment.`,
    getSuggestions: (id) => [`${id}-2`, `${id}-3`, `${id}-4`],
    getConflictError: (id, suggestions) =>
      `Recipe id already exists: ${id}. Refusing to overwrite. Suggestions: ${suggestions.join(", ")}. Re-run with --recipe-id, --auto-increment, or --overwrite-recipe.`,
  });
  await writeWorkspaceRecipeFile(loaded, recipesDir, workspaceRecipeId, overwriteRecipe);
  const result = await scaffoldAgentFromRecipe(api, recipe, {
    agentId,
    agentName: options.name,
    update: !!options.overwrite,
    filesRootDir: resolvedWorkspaceRoot,
    workspaceRootDir: resolvedWorkspaceRoot,
    vars: {
      agentId,
      agentName: options.name ?? recipe.name ?? agentId,
    },
  });
  if (options.applyConfig) {
    await applyAgentSnippetsToOpenClawConfig(api, [result.next.configSnippet]);
  }
  const cron = await reconcileRecipeCronJobs({
    api,
    recipe,
    scope: { kind: "agent", agentId, recipeId: recipe.id, stateDir: resolvedWorkspaceRoot },
    cronInstallation: cfg.cronInstallation,
  });
  return { ok: true as const, ...result, cron };
}
