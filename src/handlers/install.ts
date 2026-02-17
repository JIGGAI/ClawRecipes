import path from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { RecipeFrontmatter } from "../lib/recipe-frontmatter";
import { getRecipesConfig } from "../lib/config";
import { ensureDir, writeFileSafely } from "../lib/fs-utils";
import { detectMissingSkills } from "../lib/skill-install";
import { promptYesNo } from "../lib/prompt";
import { resolveWorkspaceRoot } from "../lib/workspace";
import { loadRecipeById } from "../lib/recipes";

type InstallScope = "global" | "agent" | "team";

function resolveInstallScope(options: { global?: boolean; agentId?: string; teamId?: string }): { scope: InstallScope; agentIdOpt: string; teamIdOpt: string } {
  const scopeFlags = [
    options.global ? "global" : null,
    options.agentId ? "agent" : null,
    options.teamId ? "team" : null,
  ].filter(Boolean);
  if (scopeFlags.length > 1) {
    throw new Error("Use only one of: --global, --agent-id, --team-id");
  }
  return {
    scope: (scopeFlags[0] ?? "global") as InstallScope,
    agentIdOpt: typeof options.agentId === "string" ? options.agentId.trim() : "",
    teamIdOpt: typeof options.teamId === "string" ? options.teamId.trim() : "",
  };
}

function resolveInstallDir(
  stateDir: string,
  cfg: { workspaceSkillsDir: string },
  scope: InstallScope,
  agentIdOpt: string,
  teamIdOpt: string
): { workdir: string; dirName: string; installDir: string } {
  if (scope === "agent") {
    if (!agentIdOpt) throw new Error("--agent-id cannot be empty");
    const agentWorkspace = path.resolve(stateDir, `workspace-${agentIdOpt}`);
    return {
      workdir: agentWorkspace,
      dirName: cfg.workspaceSkillsDir,
      installDir: path.join(agentWorkspace, cfg.workspaceSkillsDir),
    };
  }
  if (scope === "team") {
    if (!teamIdOpt) throw new Error("--team-id cannot be empty");
    const teamWorkspace = path.resolve(stateDir, `workspace-${teamIdOpt}`);
    return {
      workdir: teamWorkspace,
      dirName: cfg.workspaceSkillsDir,
      installDir: path.join(teamWorkspace, cfg.workspaceSkillsDir),
    };
  }
  return {
    workdir: stateDir,
    dirName: "skills",
    installDir: path.join(stateDir, "skills"),
  };
}

/**
 * Install a skill from ClawHub (or skills for a recipe). Returns install commands or aborted.
 * @param api - OpenClaw plugin API
 * @param options - idOrSlug, yes, global, agentId, teamId
 * @returns ok with installed/alreadyInstalled, or needCli with commands, or aborted
 */
export async function handleInstallSkill(
  api: OpenClawPluginApi,
  options: {
    idOrSlug: string;
    yes?: boolean;
    global?: boolean;
    agentId?: string;
    teamId?: string;
  },
) {
  const cfg = getRecipesConfig(api.config);
  let recipe: RecipeFrontmatter | null = null;
  try {
    const loaded = await loadRecipeById(api, options.idOrSlug);
    recipe = loaded.frontmatter;
  } catch {
    recipe = null;
  }

  const baseWorkspace = resolveWorkspaceRoot(api);
  const stateDir = path.resolve(baseWorkspace, "..");
  const { scope, agentIdOpt, teamIdOpt } = resolveInstallScope(options);
  const { workdir, dirName, installDir } = resolveInstallDir(stateDir, cfg, scope, agentIdOpt, teamIdOpt);

  await ensureDir(installDir);

  const skillsToInstall = recipe
    ? Array.from(new Set([...(recipe.requiredSkills ?? []), ...(recipe.optionalSkills ?? [])])).filter(Boolean)
    : [options.idOrSlug];

  if (!skillsToInstall.length) {
    return { ok: true as const, installed: [] as string[], note: "Nothing to install." as const };
  }

  const missing = await detectMissingSkills(installDir, skillsToInstall);
  const already = skillsToInstall.filter((s) => !missing.includes(s));

  if (!missing.length) {
    return { ok: true as const, installed: [] as string[], alreadyInstalled: already };
  }

  const requireConfirm = !options.yes;
  if (requireConfirm && !process.stdin.isTTY) {
    return { ok: false as const, aborted: "non-interactive" as const };
  }

  if (requireConfirm && process.stdin.isTTY) {
    const targetLabel = scope === "agent" ? `agent:${agentIdOpt}` : scope === "team" ? `team:${teamIdOpt}` : "global";
    const header = recipe
      ? `Install skills for recipe ${recipe.id} into ${installDir} (${targetLabel})?\n- ${missing.join("\n- ")}`
      : `Install skill into ${installDir} (${targetLabel})?\n- ${missing.join("\n- ")}`;

    const ok = await promptYesNo(header);
    if (!ok) return { ok: false as const, aborted: "user-declined" as const };
  }

  const installCommands = missing.map(
    (slug) => `npx clawhub@latest --workdir ${JSON.stringify(workdir)} --dir ${JSON.stringify(dirName)} install ${JSON.stringify(slug)}`,
  );
  return {
    ok: false as const,
    needCli: true as const,
    missing,
    workdir,
    dirName,
    installDir,
    installCommands,
  };
}

/**
 * Install a marketplace recipe into workspace recipes dir.
 * @param api - OpenClaw plugin API
 * @param options - slug, optional registryBase, overwrite
 * @returns ok with wrote path, sourceUrl, metaUrl
 */
export async function handleInstallMarketplaceRecipe(
  api: OpenClawPluginApi,
  options: { slug: string; registryBase?: string; overwrite?: boolean },
) {
  const cfg = getRecipesConfig(api.config);
  const baseWorkspace = resolveWorkspaceRoot(api);
  const { fetchMarketplaceRecipeMarkdown } = await import("../marketplaceFetch");
  const { md, metaUrl, sourceUrl } = await fetchMarketplaceRecipeMarkdown({
    registryBase: options.registryBase,
    slug: options.slug,
  });
  const s = String(options.slug ?? "").trim();
  const recipesDir = path.join(baseWorkspace, cfg.workspaceRecipesDir);
  await ensureDir(recipesDir);
  const destPath = path.join(recipesDir, `${s}.md`);
  await writeFileSafely(destPath, md, options.overwrite ? "overwrite" : "createOnly");
  return { ok: true as const, slug: s, wrote: destPath, sourceUrl, metaUrl };
}
