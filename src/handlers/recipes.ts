import path from "node:path";
import fs from "node:fs/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { BindingMatch } from "../lib/recipes-config";
import {
  applyBindingSnippetsToOpenClawConfig,
  loadOpenClawConfig,
  removeBindingsInConfig,
  writeOpenClawConfig,
} from "../lib/recipes-config";
import { getRecipesConfig } from "../lib/config";
import { listRecipeFiles, loadRecipeById } from "../lib/recipes";
import { parseFrontmatter } from "../lib/recipe-frontmatter";
import { detectMissingSkills, skillInstallCommands } from "../lib/skill-install";
import { resolveWorkspaceRoot } from "../lib/workspace";

/**
 * List available recipes (builtin + workspace).
 * @param api - OpenClaw plugin API
 * @returns Rows with id, name, kind, source
 */
export async function handleRecipesList(api: OpenClawPluginApi) {
  const cfg = getRecipesConfig(api.config);
  const files = await listRecipeFiles(api, cfg);
  const rows: Array<{ id: string; name?: string; kind?: string; source: string }> = [];
  for (const f of files) {
    try {
      const md = await fs.readFile(f.path, "utf8");
      const { frontmatter } = parseFrontmatter(md);
      rows.push({ id: frontmatter.id, name: frontmatter.name, kind: frontmatter.kind, source: f.source });
    } catch (e) {
      rows.push({
        id: path.basename(f.path),
        name: `INVALID: ${(e as Error).message}`,
        kind: "invalid",
        source: f.source,
      });
    }
  }
  return rows;
}

/**
 * Show a recipe by id (returns raw markdown).
 * @param api - OpenClaw plugin API
 * @param id - Recipe id
 * @returns Recipe markdown content
 */
export async function handleRecipesShow(api: OpenClawPluginApi, id: string) {
  const r = await loadRecipeById(api, id);
  return r.md;
}

/**
 * Check for missing skills for a recipe (or all recipes).
 * @param api - OpenClaw plugin API
 * @param id - Optional recipe id to filter
 * @returns Per-recipe status with requiredSkills, missingSkills, installCommands
 */
export async function handleRecipesStatus(api: OpenClawPluginApi, id?: string) {
  const cfg = getRecipesConfig(api.config);
  const files = await listRecipeFiles(api, cfg);
  const workspaceRoot = resolveWorkspaceRoot(api);
  const installDir = path.join(workspaceRoot, cfg.workspaceSkillsDir);
  const out: Array<{ id: string; requiredSkills: string[]; missingSkills: string[]; installCommands: string[] }> = [];
  for (const f of files) {
    const md = await fs.readFile(f.path, "utf8");
    const { frontmatter } = parseFrontmatter(md);
    if (id && frontmatter.id !== id) continue;
    const req = frontmatter.requiredSkills ?? [];
    const missing = await detectMissingSkills(installDir, req);
    out.push({
      id: frontmatter.id,
      requiredSkills: req,
      missingSkills: missing,
      installCommands: missing.length ? skillInstallCommands(cfg, missing) : [],
    });
  }
  return out;
}

/**
 * Add/update a multi-agent routing binding in openclaw config.
 * @param api - OpenClaw plugin API
 * @param opts - agentId and match (channel, optional peer/guild/team)
 * @returns Result with updatedBindings
 */
export async function handleRecipesBind(api: OpenClawPluginApi, opts: { agentId: string; match: BindingMatch }) {
  if (!opts.match?.channel) throw new Error("match.channel is required");
  return applyBindingSnippetsToOpenClawConfig(api, [{ agentId: opts.agentId, match: opts.match }]);
}

/**
 * Remove routing binding(s) from openclaw config.
 * @param api - OpenClaw plugin API
 * @param opts - Optional agentId and match
 * @returns Removed count and list
 */
export async function handleRecipesUnbind(api: OpenClawPluginApi, opts: { agentId?: string; match: BindingMatch }) {
  if (!opts.match?.channel) throw new Error("match.channel is required");
  const cfgObj = await loadOpenClawConfig(api);
  const res = removeBindingsInConfig(cfgObj, { agentId: opts.agentId, match: opts.match });
  await writeOpenClawConfig(api, cfgObj);
  return res;
}

/**
 * Show current bindings from openclaw config.
 * @param api - OpenClaw plugin API
 * @returns Array of binding entries
 */
/** @returns Array of binding entries from openclaw config */
export async function handleRecipesBindings(
  api: OpenClawPluginApi
): Promise<Array<{ agentId?: string; match?: Record<string, unknown> }>> {
  const cfgObj = await loadOpenClawConfig(api);
  const bindings = cfgObj.bindings;
  return Array.isArray(bindings) ? (bindings as Array<{ agentId?: string; match?: Record<string, unknown> }>) : [];
}
