import path from "node:path";
import fs from "node:fs/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { type AgentConfigSnippet } from "../lib/agent-config";
import { applyAgentSnippetsToOpenClawConfig, loadOpenClawConfig, writeOpenClawConfig } from "../lib/recipes-config";
import { ensureDir, fileExists, writeFileSafely } from "../lib/fs-utils";
import { writeJsonFile } from "../lib/json-utils";
import { type RecipeFrontmatter } from "../lib/recipe-frontmatter";
import { promptYesNo } from "../lib/prompt";
import { buildRemoveTeamPlan, executeRemoveTeamPlan, loadCronStore, saveCronStore } from "../lib/remove-team";
import { resolveWorkspaceRoot } from "../lib/workspace";
import { pickRecipeId } from "../lib/recipe-id";
import { recipeIdTakenForTeam, validateRecipeAndSkills, writeWorkspaceRecipeFile } from "../lib/scaffold-utils";
import { scaffoldAgentFromRecipe } from "./scaffold";
import { reconcileRecipeCronJobs } from "./cron";

async function ensureTeamDirectoryStructure(
  teamDir: string,
  sharedContextDir: string,
  notesDir: string,
  workDir: string
) {
  await Promise.all([
    ensureDir(path.join(teamDir, "shared")),
    ensureDir(sharedContextDir),
    ensureDir(path.join(sharedContextDir, "agent-outputs")),
    ensureDir(path.join(sharedContextDir, "feedback")),
    ensureDir(path.join(sharedContextDir, "kpis")),
    ensureDir(path.join(sharedContextDir, "calendar")),
    ensureDir(path.join(teamDir, "inbox")),
    ensureDir(path.join(teamDir, "outbox")),
    ensureDir(notesDir),
    ensureDir(workDir),
    ensureDir(path.join(workDir, "backlog")),
    ensureDir(path.join(workDir, "in-progress")),
    ensureDir(path.join(workDir, "testing")),
    ensureDir(path.join(workDir, "done")),
    ensureDir(path.join(workDir, "assignments")),
  ]);
}

async function writeTeamBootstrapFiles(
  teamId: string,
  teamDir: string,
  sharedContextDir: string,
  notesDir: string,
  goalsDir: string,
  overwrite: boolean
) {
  const mode = overwrite ? "overwrite" : "createOnly";
  await ensureDir(goalsDir);
  await writeFileSafely(
    path.join(sharedContextDir, "priorities.md"),
    `# Priorities — ${teamId}\n\n- (empty)\n\n## Notes\n- Lead curates this file.\n- Non-lead roles should append updates to shared-context/agent-outputs/ instead.\n`,
    mode
  );
  await writeFileSafely(path.join(notesDir, "plan.md"), `# Plan — ${teamId}\n\n- (empty)\n`, mode);
  await writeFileSafely(path.join(notesDir, "status.md"), `# Status — ${teamId}\n\n- (empty)\n`, mode);
  await writeFileSafely(
    path.join(notesDir, "GOALS.md"),
    `# Goals — ${teamId}\n\nThis folder is the canonical home for goals.\n\n## How to use\n- Create one markdown file per goal under: notes/goals/\n- Add a link here for discoverability\n\n## Goals\n- (empty)\n`,
    mode
  );
  await writeFileSafely(
    path.join(goalsDir, "README.md"),
    `# Goals folder — ${teamId}\n\nCreate one markdown file per goal in this directory.\n\nRecommended file naming:\n- short, kebab-case, no leading numbers (e.g. \`reduce-support-backlog.md\`)\n\nLink goals from:\n- notes/GOALS.md\n`,
    mode
  );
  const ticketsMd = `# Tickets — ${teamId}\n\n## Naming\n- Backlog tickets live in work/backlog/\n- In-progress tickets live in work/in-progress/\n- Testing tickets live in work/testing/\n- Done tickets live in work/done/\n- Filename ordering is the queue: 0001-..., 0002-...\n\n## Stages\n- backlog → in-progress → testing → done\n\n## QA handoff\n- When work is ready for QA: move the ticket to \`work/testing/\` and assign to test.\n\n## Required fields\nEach ticket should include:\n- Title\n- Context\n- Requirements\n- Acceptance criteria\n- Owner (dev/devops/lead/test)\n- Status (queued/in-progress/testing/done)\n\n## Example\n\n\`\`\`md\n# 0001-example-ticket\n\nOwner: dev\nStatus: queued\n\n## Context\n...\n\n## Requirements\n- ...\n\n## Acceptance criteria\n- ...\n\`\`\`\n`;
  await writeFileSafely(path.join(teamDir, "TICKETS.md"), ticketsMd, mode);
}

async function writeTeamMetadataAndConfig(opts: {
  api: OpenClawPluginApi;
  teamId: string;
  teamDir: string;
  recipe: RecipeFrontmatter;
  results: AgentScaffoldResult[];
  applyConfig: boolean;
  overwrite: boolean;
}) {
  const { api, teamId, teamDir, recipe, results, applyConfig, overwrite } = opts;
  const mode = overwrite ? "overwrite" : "createOnly";
  await writeFileSafely(
    path.join(teamDir, "TEAM.md"),
    `# ${teamId}\n\nShared workspace for this agent team.\n\n## Folders\n- inbox/ — requests\n- outbox/ — deliverables\n- shared-context/ — curated shared context + append-only agent outputs\n- shared/ — legacy shared artifacts (back-compat)\n- notes/ — plan + status\n- work/ — working files\n`,
    mode
  );
  await writeJsonFile(path.join(teamDir, "team.json"), {
    teamId,
    recipeId: recipe.id,
    recipeName: recipe.name ?? "",
    scaffoldedAt: new Date().toISOString(),
  });
  if (applyConfig) {
    await applyAgentSnippetsToOpenClawConfig(api, results.map((x) => x.next.configSnippet));
  }
}

type AgentScaffoldResult = Awaited<ReturnType<typeof scaffoldAgentFromRecipe>> & { role: string; agentId: string };

async function scaffoldTeamAgents(
  api: OpenClawPluginApi,
  recipe: RecipeFrontmatter,
  teamId: string,
  teamDir: string,
  rolesDir: string,
  overwrite: boolean
): Promise<AgentScaffoldResult[]> {
  const agents = recipe.agents ?? [];
  if (!agents.length) throw new Error("Team recipe must include agents[]");
  const results: AgentScaffoldResult[] = [];
  for (const a of agents) {
    const role = a.role;
    const agentId = a.agentId ?? `${teamId}-${role}`;
    const agentName = a.name ?? `${teamId} ${role}`;
    const scopedRecipe: RecipeFrontmatter = {
      id: `${recipe.id}:${role}`,
      name: agentName,
      kind: "agent",
      requiredSkills: recipe.requiredSkills,
      optionalSkills: recipe.optionalSkills,
      templates: recipe.templates,
      files: (recipe.files ?? []).map((f) => ({
        ...f,
        template: f.template.includes(".") ? f.template : `${role}.${f.template}`,
      })),
      tools: a.tools ?? recipe.tools,
    };
    const roleDir = path.join(rolesDir, role);
    const r = await scaffoldAgentFromRecipe(api, scopedRecipe, {
      agentId,
      agentName,
      update: overwrite,
      filesRootDir: roleDir,
      workspaceRootDir: teamDir,
      vars: { teamId, teamDir, role, agentId, agentName, roleDir },
    });
    results.push({ role, agentId, ...r });
  }
  return results;
}

/**
 * Scaffold a team (shared workspace + multiple agents) from a team recipe.
 * @param api - OpenClaw plugin API
 * @param options - recipeId, teamId, recipeIdExplicit, overwrite, overwriteRecipe, autoIncrement, applyConfig
 * @returns ok with teamId, teamDir, agents, cron, or missingSkills with installCommands
 */
export async function handleScaffoldTeam(
  api: OpenClawPluginApi,
  options: {
    recipeId: string;
    teamId: string;
    recipeIdExplicit?: string;
    overwrite?: boolean;
    overwriteRecipe?: boolean;
    autoIncrement?: boolean;
    applyConfig?: boolean;
  },
) {
  const validation = await validateRecipeAndSkills(api, options.recipeId, "team");
  if (!validation.ok) {
    return {
      ok: false as const,
      missingSkills: validation.missingSkills,
      installCommands: validation.installCommands,
    };
  }
  const { loaded, recipe, cfg, workspaceRoot: baseWorkspace } = validation;
  const teamId = String(options.teamId);
  const teamDir = path.resolve(baseWorkspace, "..", `workspace-${teamId}`);
  await ensureDir(teamDir);
  const recipesDir = path.join(baseWorkspace, cfg.workspaceRecipesDir);
  await ensureDir(recipesDir);
  const overwriteRecipe = !!options.overwriteRecipe;
  const autoIncrement = !!options.autoIncrement;

  const explicitRecipeId = typeof options.recipeIdExplicit === "string" ? String(options.recipeIdExplicit).trim() : "";
  const baseRecipeId = explicitRecipeId || teamId;
  const workspaceRecipeId = await pickRecipeId({
    baseId: baseRecipeId,
    recipesDir,
    overwriteRecipe,
    autoIncrement,
    isTaken: (id) => recipeIdTakenForTeam(recipesDir, id),
    getSuggestions: (id) => {
      const today = new Date().toISOString().slice(0, 10);
      return [`${id}-v2`, `${id}-${today}`, `${id}-alt`];
    },
    getConflictError: (id, suggestions) =>
      `Workspace recipe already exists: recipes/${id}.md. Choose --recipe-id (e.g. ${suggestions.join(", ")}) or --auto-increment or --overwrite-recipe.`,
  });
  await writeWorkspaceRecipeFile(loaded, recipesDir, workspaceRecipeId, overwriteRecipe);

  const rolesDir = path.join(teamDir, "roles");
  const notesDir = path.join(teamDir, "notes");
  const workDir = path.join(teamDir, "work");
  const overwrite = !!options.overwrite;
  const sharedContextDir = path.join(teamDir, "shared-context");
  const goalsDir = path.join(notesDir, "goals");

  await ensureTeamDirectoryStructure(teamDir, sharedContextDir, notesDir, workDir);
  await writeTeamBootstrapFiles(teamId, teamDir, sharedContextDir, notesDir, goalsDir, overwrite);

  const results = await scaffoldTeamAgents(api, recipe, teamId, teamDir, rolesDir, overwrite);
  await writeTeamMetadataAndConfig({ api, teamId, teamDir, recipe, results, applyConfig: !!options.applyConfig, overwrite });

  const cron = await reconcileRecipeCronJobs({
    api,
    recipe,
    scope: { kind: "team", teamId, recipeId: recipe.id, stateDir: teamDir },
    cronInstallation: cfg.cronInstallation,
  });
  return {
    ok: true as const,
    teamId,
    teamDir,
    agents: results,
    cron,
    next: {
      note: options.applyConfig ? "agents.list[] updated in openclaw config" : "Run again with --apply-config to write agents into openclaw config.",
    },
  };
}

/**
 * Generate a plan to migrate a legacy team scaffold into workspace-<teamId> layout.
 * @param api - OpenClaw plugin API
 * @param options - teamId (must end with -team), mode (move|copy), overwrite
 * @returns Migration plan with legacy/dest paths and steps
 */
export async function handleMigrateTeamPlan(api: OpenClawPluginApi, options: { teamId: string; mode?: string; overwrite?: boolean }) {
  const teamId = String(options.teamId);
  if (!teamId.endsWith("-team")) throw new Error("teamId must end with -team");
  const mode = String(options.mode ?? "move");
  if (mode !== "move" && mode !== "copy") throw new Error("--mode must be move|copy");
  const baseWorkspace = resolveWorkspaceRoot(api);
  const legacyTeamDir = path.resolve(baseWorkspace, "teams", teamId);
  const legacyAgentsDir = path.resolve(baseWorkspace, "agents");
  const destTeamDir = path.resolve(baseWorkspace, "..", `workspace-${teamId}`);
  const destRolesDir = path.join(destTeamDir, "roles");
  const exists = async (p: string) => fileExists(p);
  type MigrateStep = { kind: string; from?: string; to?: string; agentId?: string; role?: string };
  const plan: {
    teamId: string;
    mode: string;
    legacy: { teamDir: string; agentsDir: string };
    dest: { teamDir: string; rolesDir: string };
    steps: MigrateStep[];
    agentIds: string[];
  } = {
    teamId,
    mode,
    legacy: { teamDir: legacyTeamDir, agentsDir: legacyAgentsDir },
    dest: { teamDir: destTeamDir, rolesDir: destRolesDir },
    steps: [] as MigrateStep[],
    agentIds: [] as string[],
  };
  const legacyTeamExists = await exists(legacyTeamDir);
  if (!legacyTeamExists) throw new Error(`Legacy team directory not found: ${legacyTeamDir}`);
  const destExists = await exists(destTeamDir);
  if (destExists && !options.overwrite) throw new Error(`Destination already exists: ${destTeamDir} (re-run with --overwrite to merge)`);
  plan.steps.push({ kind: "teamDir", from: legacyTeamDir, to: destTeamDir });
  const legacyAgentsExist = await exists(legacyAgentsDir);
  let legacyAgentFolders: string[] = [];
  if (legacyAgentsExist) {
    legacyAgentFolders = (await fs.readdir(legacyAgentsDir)).filter((x) => x.startsWith(`${teamId}-`));
  }
  for (const folder of legacyAgentFolders) {
    const agentId = folder;
    const role = folder.slice((teamId + "-").length);
    const from = path.join(legacyAgentsDir, folder);
    const to = path.join(destRolesDir, role);
    plan.agentIds.push(agentId);
    plan.steps.push({ kind: "roleDir", agentId, role, from, to });
  }
  return plan;
}

/**
 * Execute a migration plan (move or copy legacy team dir and agent roles).
 * @param api - OpenClaw plugin API
 * @param plan - Plan from handleMigrateTeamPlan
 * @returns ok with migrated teamId, destTeamDir, agentIds
 */
export async function executeMigrateTeamPlan(
  api: OpenClawPluginApi,
  plan: {
    teamId: string;
    mode: string;
    legacy: { teamDir: string; agentsDir: string };
    dest: { teamDir: string; rolesDir: string };
    steps: Array<{ kind: string; from?: string; to?: string; agentId?: string; role?: string }>;
    agentIds: string[];
  },
) {
  const copyDirRecursive = async (src: string, dst: string) => {
    await ensureDir(dst);
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const ent of entries) {
      const s = path.join(src, ent.name);
      const d = path.join(dst, ent.name);
      if (ent.isDirectory()) await copyDirRecursive(s, d);
      else if (ent.isSymbolicLink()) {
        const link = await fs.readlink(s);
        await fs.symlink(link, d);
      } else {
        await ensureDir(path.dirname(d));
        await fs.copyFile(s, d);
      }
    }
  };

  const removeDirRecursive = async (p: string) => {
    await fs.rm(p, { recursive: true, force: true });
  };

  const moveDir = async (src: string, dst: string) => {
    await ensureDir(path.dirname(dst));
    try {
      await fs.rename(src, dst);
    } catch {
      await copyDirRecursive(src, dst);
      await removeDirRecursive(src);
    }
  };

  const { legacy, dest } = plan;
  if (plan.mode === "copy") {
    await copyDirRecursive(legacy.teamDir, dest.teamDir);
  } else {
    await moveDir(legacy.teamDir, dest.teamDir);
  }
  await ensureDir(dest.rolesDir);
  for (const step of plan.steps.filter((s) => s.kind === "roleDir")) {
    if (!step.from || !step.to || !(await fileExists(step.from))) continue;
    if (plan.mode === "copy") await copyDirRecursive(step.from, step.to);
    else await moveDir(step.from, step.to);
  }

  const agentSnippets: AgentConfigSnippet[] = plan.agentIds.map((agentId) => ({
    id: agentId,
    workspace: dest.teamDir,
  }));
  if (agentSnippets.length) {
    await applyAgentSnippetsToOpenClawConfig(api, agentSnippets);
  }

  return { ok: true as const, migrated: plan.teamId, destTeamDir: dest.teamDir, agentIds: plan.agentIds };
}

/**
 * Safe uninstall: remove scaffolded team workspace + agents + stamped cron jobs.
 * @param api - OpenClaw plugin API
 * @param options - teamId, plan (print only), yes (skip confirm), includeAmbiguous
 * @returns ok with result, or plan/aborted
 */
export async function handleRemoveTeam(
  api: OpenClawPluginApi,
  options: { teamId: string; plan?: boolean; yes?: boolean; includeAmbiguous?: boolean },
) {
  const teamId = String(options.teamId);
  const workspaceRoot = resolveWorkspaceRoot(api);
  const cronJobsPath = path.resolve(workspaceRoot, "..", "cron", "jobs.json");
  const cfgObj = await loadOpenClawConfig(api);
  const cronStore = await loadCronStore(cronJobsPath);
  const plan = await buildRemoveTeamPlan({
    teamId,
    workspaceRoot,
    openclawConfigPath: "(managed)",
    cronJobsPath,
    cfgObj,
    cronStore,
  });
  if (options.plan) return { ok: true as const, plan };
  if (!options.yes && !process.stdin.isTTY) {
    return { ok: false as const, plan, aborted: "non-interactive" as const };
  }
  if (!options.yes && process.stdin.isTTY) {
    const ok = await promptYesNo(
      `This will DELETE workspace-${teamId}, remove matching agents from openclaw config, and remove stamped cron jobs.`,
    );
    if (!ok) return { ok: false as const, plan, aborted: "user-declined" as const };
  }
  const result = await executeRemoveTeamPlan({
    plan,
    includeAmbiguous: Boolean(options.includeAmbiguous),
    cfgObj,
    cronStore,
  });
  await writeOpenClawConfig(api, cfgObj);
  await saveCronStore(cronJobsPath, cronStore);
  return { ok: true as const, result };
}
