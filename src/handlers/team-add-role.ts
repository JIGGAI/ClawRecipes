import path from "node:path";
import fs from "node:fs/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { applyAgentSnippetsToOpenClawConfig } from "../lib/recipes-config";
import { ensureDir } from "../lib/fs-utils";
import { validateRecipeAndSkills } from "../lib/scaffold-utils";
import { scaffoldAgentFromRecipe } from "./scaffold";
import { reconcileRecipeCronJobs } from "./cron";
import { resolveWorkspaceRoot } from "../lib/workspace";

export async function handleAddRoleToTeam(
  api: OpenClawPluginApi,
  options: {
    teamId: string;
    role: string;
    recipeId: string;
    agentId?: string;
    applyConfig?: boolean;
    overwrite?: boolean;
    installCron?: boolean;
  },
) {
  const teamId = String(options.teamId);
  const role = String(options.role);

  const validation = await validateRecipeAndSkills(api, options.recipeId, "agent");
  if (!validation.ok) {
    return {
      ok: false as const,
      missingSkills: validation.missingSkills,
      installCommands: validation.installCommands,
    };
  }

  const { recipe, cfg } = validation;
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, "..", `workspace-${teamId}`);

  // Safety: refuse to create a team workspace implicitly; user should scaffold the team first.
  try {
    const st = await fs.stat(teamDir);
    if (!st.isDirectory()) throw new Error("not a directory");
  } catch {
    throw new Error(`Team workspace not found: ${teamDir}. Scaffold the team first (openclaw recipes scaffold-team ...)`);
  }

  const rolesDir = path.join(teamDir, "roles");
  const roleDir = path.join(rolesDir, role);
  await ensureDir(roleDir);

  const agentId = String(options.agentId ?? `${teamId}-${role}`);

  const scaffold = await scaffoldAgentFromRecipe(api, recipe, {
    agentId,
    agentName: `${teamId} ${role}`,
    update: !!options.overwrite,
    filesRootDir: roleDir,
    workspaceRootDir: teamDir,
    vars: {
      teamId,
      teamDir,
      role,
      agentId,
      agentName: `${teamId} ${role}`,
    },
  });

  if (options.applyConfig) {
    await applyAgentSnippetsToOpenClawConfig(api, [scaffold.next.configSnippet]);
  }

  const cron = options.installCron
    ? await reconcileRecipeCronJobs({
        api,
        recipe,
        scope: { kind: "team", teamId, recipeId: recipe.id, stateDir: teamDir },
        cronInstallation: cfg.cronInstallation,
      })
    : { ok: true as const, changed: false as const, note: "cron-skipped" as const };

  return {
    ok: true as const,
    teamId,
    teamDir,
    role,
    roleDir,
    agentId,
    files: scaffold.fileResults,
    cron,
    next: {
      note: options.applyConfig
        ? "agents.list[] updated in openclaw config (restart gateway if required)."
        : "Re-run with --apply-config to write the agent into openclaw config.",
    },
  };
}
