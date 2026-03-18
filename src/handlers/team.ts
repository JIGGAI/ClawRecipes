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
import { renderTemplate } from "../lib/template";
import { reconcileRecipeCronJobs } from "./cron";
import { lintRecipe } from "../lib/recipe-lint";

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
    ensureDir(path.join(sharedContextDir, "memory")),
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

async function writeTeamBootstrapFiles(opts: {
  teamId: string;
  teamDir: string;
  sharedContextDir: string;
  notesDir: string;
  goalsDir: string;
  recipe?: RecipeFrontmatter;
  overwrite: boolean;
  qaChecklist?: boolean;
}) {
  const { teamId, teamDir, sharedContextDir, notesDir, goalsDir, recipe, overwrite, qaChecklist } = opts;
  const mode = overwrite ? "overwrite" : "createOnly";
  await ensureDir(goalsDir);
  await writeFileSafely(
    path.join(sharedContextDir, "priorities.md"),
    `# Priorities — ${teamId}\n\n- (empty)\n\n## Notes\n- Lead curates this file.\n- Non-lead roles should append updates to shared-context/agent-outputs/ instead.\n`,
    mode
  );

  // Team memory (file-first, machine-usable). Non-destructive.
  await ensureDir(path.join(sharedContextDir, "memory"));
  await writeFileSafely(path.join(sharedContextDir, "memory", "team.jsonl"), "", mode);
  await writeFileSafely(path.join(sharedContextDir, "memory", "pinned.jsonl"), "", mode);

  await writeFileSafely(
    path.join(sharedContextDir, "DECISIONS.md"),
    `# Decisions — ${teamId}\n\nAppend-only dated bullets.\n\n- (empty)\n`,
    mode
  );

  await writeFileSafely(
    path.join(sharedContextDir, "GLOSSARY.md"),
    `# Glossary — ${teamId}\n\nTerms, conventions, acronyms.\n\n- (empty)\n`,
    mode
  );
  await writeFileSafely(path.join(notesDir, "plan.md"), `# Plan — ${teamId}\n\n- (empty)\n`, mode);
  await writeFileSafely(path.join(notesDir, "status.md"), `# Status — ${teamId}\n\n- (empty)\n`, mode);
  await writeFileSafely(
    path.join(notesDir, "memory-policy.md"),
    `# Memory Policy — ${teamId}\n\nThis workspace is file-first.\n\n## Where things go\n- **Ticket comments**: decisions/notes specific to a ticket (append under "## Comments").\n- **notes/status.md**: append-only status log for the team.\n- **notes/plan.md**: lead-curated plan + priorities for the team.\n- **shared-context/priorities.md**: lead-curated top priorities.\n- **shared-context/memory/team.jsonl**: team knowledge stream (Kitchen Memory tab).\n- **shared-context/memory/pinned.jsonl**: pinned team facts/decisions (Kitchen Memory tab).\n- **shared-context/agent-outputs/**: append-only artifacts + logs produced by agents.\n\n## End-of-session checklist (everyone)\n- [ ] Update ticket "## Comments" with what changed + next step\n- [ ] Append a dated entry to notes/status.md\n- [ ] Save any artifacts to shared-context/agent-outputs/\n`,
    mode
  );

  // Heartbeat checklist (team-root; lead-owned). Quiet by default.
  // NOTE: this file is read frequently by the lead heartbeat runner.
  await writeFileSafely(
    path.join(teamDir, "HEARTBEAT.md"),
    `# HEARTBEAT — ${teamId}

Keep this file small. It is loaded frequently.

Default behavior: **quiet**. If there is nothing to report, do nothing.

## Checklist
- [ ] Check \`inbox/\` for new requests
- [ ] Scan \`work/in-progress/\` for blocked/stuck tickets
- [ ] If anything materially changed, append a dated bullet to \`notes/status.md\` (append-only)
- [ ] If nothing changed, reply \`HEARTBEAT_OK\`
`,
    mode,
  );

  // Append-only artifacts produced by agents
  await ensureDir(path.join(sharedContextDir, "agent-outputs"));
  await writeFileSafely(
    path.join(sharedContextDir, "agent-outputs", "README.md"),
    `# Agent outputs — ${teamId}\n\nDrop append-only artifacts/logs here.\n\nRecommended:\n- One file per day per role (e.g. "2026-03-05-dev.md")\n- Or one file per ticket (e.g. "0145-memory-policy.md")\n`,
    mode
  );
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

  if (qaChecklist) {
    await writeFileSafely(
      path.join(notesDir, "QA_CHECKLIST.md"),
      `# QA Checklist — ${teamId}\n\nUse this when verifying a ticket before moving it from work/testing/ → work/done/.\n\n## Checklist\n- [ ] Repro steps verified\n- [ ] Acceptance criteria met\n- [ ] No regressions in adjacent flows\n- [ ] Notes/screenshots attached (if relevant)\n\n## Verified by\n- QA: (name)\n- Date: (YYYY-MM-DD)\n\n## Links\n- Ticket: (path or URL)\n- PR/Commit: (optional)\n`,
      mode,
    );
  }
  const defaultTicketsMd = `# Tickets — ${teamId}\n\n## Naming\n- Backlog tickets live in work/backlog/\n- In-progress tickets live in work/in-progress/\n- Testing tickets live in work/testing/\n- Done tickets live in work/done/\n- Filename ordering is the queue: 0001-..., 0002-...\n\n## Stages\n- backlog → in-progress → testing → done\n\n## QA handoff\n- When work is ready for QA: move the ticket to \`work/testing/\` and assign to test.\n\n## QA access (runnable UI)\nIf QA needs a runnable UI (e.g. ClawKitchen) to verify a ticket, include an access block in the ticket (or link to where it lives):\n- Kitchen URL:\n- Auth method: (e.g. HTTP Basic)\n- Username:\n- Password / token:\n- Any required VPN/Tailscale notes:\n\n## Required fields\nEach ticket should include:\n- Title\n- Context\n- Requirements\n- Acceptance criteria\n- Owner (dev/devops/lead/test)\n- Status (queued/in-progress/testing/done)\n\n## Example\n\n\`\`\`md\n# 0001-example-ticket\n\nOwner: dev\nStatus: queued\n\n## Context\n...\n\n## Requirements\n- ...\n\n## Acceptance criteria\n- ...\n\n## QA access (runnable UI)\n- Kitchen URL: http://<host>:7777\n- Auth method: HTTP Basic\n- Username: kitchen\n- Password: <token>\n\`\`\`\n`;

  // Allow team recipes to override the default team-root ticket spec.
  // If the recipe defines templates.tickets, we render it and write it to teamDir/TICKETS.md.
  // Back-compat: if not defined, we write the default content.
  const ticketsTemplate = recipe?.templates?.["tickets"];
  const ticketsMd = typeof ticketsTemplate === "string" ? renderTemplate(ticketsTemplate, { teamId, teamDir }) : defaultTicketsMd;

  await writeFileSafely(path.join(teamDir, "TICKETS.md"), ticketsMd, mode);
}

/**
 * Write team-level files from the recipe files[] array.
 *
 * Per-role scaffolding (scaffoldTeamAgents) filters out paths starting with
 * "shared-context/" and "notes/" because those belong to the team workspace root,
 * not individual role directories. This function picks up those filtered paths
 * and writes them to teamDir using the recipe's templates.
 */
async function writeTeamLevelRecipeFiles(opts: {
  recipe: RecipeFrontmatter;
  teamId: string;
  teamDir: string;
  overwrite: boolean;
}) {
  const { recipe, teamId, teamDir, overwrite } = opts;
  const files = recipe.files ?? [];
  if (!files.length) return;
  const mode = overwrite ? "overwrite" : "createOnly";
  const templates = (recipe.templates ?? {}) as Record<string, unknown>;
  const vars = { teamId, teamDir };

  for (const f of files) {
    const filePath = String(f.path ?? "").trim();
    if (!filePath) continue;
    // Only process paths that are team-scoped (filtered out of per-role scaffolding).
    if (!filePath.startsWith("shared-context/") && !filePath.startsWith("notes/")) continue;

    const templateKey = String(f.template ?? "").trim();
    if (!templateKey) continue;

    const templateContent = templates[templateKey];
    if (typeof templateContent !== "string") continue;

    const rendered = renderTemplate(templateContent, vars);
    const target = path.join(teamDir, filePath);
    await writeFileSafely(target, rendered, mode);
  }
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
  overwrite: boolean,
  heartbeatEnabledRoles: Set<string>
): Promise<AgentScaffoldResult[]> {
  const agents = recipe.agents ?? [];
  if (!agents.length) throw new Error("Team recipe must include agents[]");

  // Resilience: some custom recipes may define templates but forget files[].
  // In that case, scaffold a minimal per-role file set.
  const baseFiles = (recipe.files ?? []).length
    ? (recipe.files ?? [])
    : [
        { path: "SOUL.md", template: "soul", mode: "createOnly" },
        { path: "AGENTS.md", template: "agents", mode: "createOnly" },
        { path: "TOOLS.md", template: "tools", mode: "createOnly" },
        { path: "STATUS.md", template: "status", mode: "createOnly" },
        { path: "NOTES.md", template: "notes", mode: "createOnly" },
      ];

  const results: AgentScaffoldResult[] = [];
  for (const a of agents) {
    const role = a.role;
    const agentId = a.agentId ?? `${teamId}-${role}`;
    const agentName = a.name ?? `${teamId} ${role}`;
    const roleFiles = baseFiles
      // Guardrail: role workspaces should not create role-local shared-context.
      // Team-level shared-context lives at <teamDir>/shared-context/.
      .filter((f) => !String(f.path).startsWith("shared-context/"))
      .map((f) => ({
        ...f,
        template: String(f.template).includes(".") ? f.template : `${role}.${f.template}`,
      }));

    const scopedRecipe: RecipeFrontmatter = {
      id: `${recipe.id}:${role}`,
      name: agentName,
      kind: "agent",
      requiredSkills: recipe.requiredSkills,
      optionalSkills: recipe.optionalSkills,
      templates: recipe.templates,
      files: roleFiles,
      tools: a.tools ?? recipe.tools,
    };
    const roleDir = path.join(rolesDir, role);
    const r = await scaffoldAgentFromRecipe(api, scopedRecipe, {
      agentId,
      agentName,
      update: overwrite,
      filesRootDir: roleDir,
      // IMPORTANT: non-lead roles use per-role workspaces so the Kitchen UI / agent files panel reads role files.
      // Lead uses the team root so the lead heartbeat reads team-root HEARTBEAT.md.
      workspaceRootDir: role === "lead" ? teamDir : roleDir,
      vars: { teamId, teamDir, role, agentId, agentName, roleDir },
    });

    // Standard per-role continuity + outputs (file-first).
    // These must exist even if the team recipe omits them.
    {
      const mode = overwrite ? "overwrite" : "createOnly";
      const yyyyMmDd = new Date().toISOString().slice(0, 10);
      await ensureDir(path.join(roleDir, "memory"));
      await writeFileSafely(
        path.join(roleDir, "MEMORY.md"),
        `# MEMORY — ${teamId} (${role})

Curated long-term memory for this role.

- (empty)
`,
        mode
      );
      await writeFileSafely(
        path.join(roleDir, "memory", `${yyyyMmDd}.md`),
        `# ${yyyyMmDd} — ${teamId} (${role})

- (empty)
`,
        mode
      );
      await ensureDir(path.join(roleDir, "agent-outputs"));
      await writeFileSafely(
        path.join(roleDir, "agent-outputs", "README.md"),
        `# Agent outputs — ${teamId} (${role})

Append-only artifacts/logs produced by this role.

Recommended:
- One file per day (e.g. "${yyyyMmDd}.md")
- Or one file per ticket (e.g. "0175-run-detail-timeline.md")
`,
        mode
      );
    }


    // Heartbeat scaffold (opt-in for non-lead roles): drop a minimal HEARTBEAT.md in the role workspace.
    // The lead uses the team-root HEARTBEAT.md.
    if (role !== "lead" && heartbeatEnabledRoles.has(String(role))) {
      const mode = overwrite ? "overwrite" : "createOnly";
      const hb = `# HEARTBEAT — ${teamId} (${role})

Keep this file small. It is loaded frequently.

## Checklist
- [ ] Check \`inbox/\` for new requests
- [ ] Check \`work/in-progress/\` for stuck tickets (blocked? needs review?)
- [ ] Append any material updates to \`notes/status.md\` (append-only)
- [ ] If nothing changed, stay quiet (no message)
`;
      await writeFileSafely(path.join(roleDir, "HEARTBEAT.md"), hb, mode);
    }
    results.push({ role, agentId, ...r });
  }
  return results;
}

function buildHeartbeatCronJobsFromTeamRecipe(opts: {
  teamId: string;
  recipe: RecipeFrontmatter;
  enableHeartbeat: boolean;
}): {
  cronJobs: NonNullable<RecipeFrontmatter["cronJobs"]>;
  enabledRoles: Set<string>;
  note: "disabled" | "defaults" | "explicit";
} {
  const { teamId, recipe, enableHeartbeat } = opts;
  const agents = (recipe.agents ?? []) as Array<Record<string, unknown>>;
  const enabledRoles = new Set<string>();
  if (!enableHeartbeat) return { cronJobs: [], enabledRoles, note: "disabled" };

  const heartbeatPrompt =
    "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.";
  const defaultLeadSchedule = "*/30 * * * *";

  const hasAnyExplicitHeartbeatBlock = agents.some((a) => a && typeof a === "object" && "heartbeat" in a);

  const cronJobs: NonNullable<RecipeFrontmatter["cronJobs"]> = [];
  if (hasAnyExplicitHeartbeatBlock) {
    // Explicit mode: ONLY roles with heartbeat.enabled truthy get a heartbeat cron.
    for (const a of agents) {
      if (!a || typeof a !== "object") continue;
      const obj = a as Record<string, unknown>;

      const role = typeof obj.role === "string" ? obj.role.trim() : "";
      if (!role) continue;

      const hbRaw = obj.heartbeat;
      if (!hbRaw || typeof hbRaw !== "object") continue;
      const hb = hbRaw as Record<string, unknown>;

      if (!hb.enabled) continue;

      const agentId = typeof obj.agentId === "string" && obj.agentId.trim() ? obj.agentId.trim() : `${teamId}-${role}`;
      const schedule = typeof hb.schedule === "string" && hb.schedule.trim() ? hb.schedule.trim() : defaultLeadSchedule;
      const channel =
        hb.channel != null
          ? String(hb.channel)
          : role === "lead"
            ? "last"
            : undefined;

      enabledRoles.add(role);
      cronJobs.push({
        id: `heartbeat-${role}`,
        name: `{{teamId}} • heartbeat • ${role}`,
        schedule,
        message: heartbeatPrompt,
        agentId,
        ...(channel ? { channel } : {}),
      });
    }
    return { cronJobs, enabledRoles, note: "explicit" };
  }

  // Default mode: lead only.
  enabledRoles.add("lead");
  cronJobs.push({
    id: "heartbeat-lead",
    name: "{{teamId}} • heartbeat",
    schedule: defaultLeadSchedule,
    message: heartbeatPrompt,
    agentId: `${teamId}-lead`,
    channel: "last",
  });
  return { cronJobs, enabledRoles, note: "defaults" };
}

/**
 * Scaffold a team (shared workspace + multiple agents) from a team recipe.
 * @param api - OpenClaw plugin API
 * @param options - recipeId, teamId, recipeIdExplicit, overwrite, overwriteRecipe, autoIncrement, applyConfig
 * @returns ok with teamId, teamDir, agents, cron, or missingSkills with installCommands
 */
// eslint-disable-next-line max-lines-per-function
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
    enableHeartbeat?: boolean;
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

  // Lint (warn-only) for common team scaffolding pitfalls.
  // NOTE: console.warn/error used throughout src/ for [recipes]-prefixed diagnostics.
  // No plugin SDK logger available; these go to stderr which the host captures.
  for (const issue of lintRecipe(recipe)) {
    if (issue.level === "warn") console.warn(`[recipes] WARN ${issue.code}: ${issue.message}`);
    else console.warn(`[recipes] ${issue.code}: ${issue.message}`);
  }

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

  const qaChecklist = Boolean(recipe.qaChecklist ?? false) || (recipe.agents ?? []).some((a) => String(a.role ?? "").toLowerCase() === "test");
  await ensureTeamDirectoryStructure(teamDir, sharedContextDir, notesDir, workDir);
  await writeTeamBootstrapFiles({
    teamId,
    teamDir,
    sharedContextDir,
    notesDir,
    goalsDir,
    recipe,
    overwrite,
    qaChecklist,
  });
  // Write team-level files from the recipe files[] array.
  // Per-role scaffolding filters out shared-context/ and notes/ paths (those belong to teamDir).
  // We render and write them here so recipe-defined team assets are not silently dropped.
  await writeTeamLevelRecipeFiles({ recipe, teamId, teamDir, overwrite });

  const heartbeat = buildHeartbeatCronJobsFromTeamRecipe({
    teamId,
    recipe,
    enableHeartbeat: Boolean(options.enableHeartbeat),
  });

  const results = await scaffoldTeamAgents(api, recipe, teamId, teamDir, rolesDir, overwrite, heartbeat.enabledRoles);
  await writeTeamMetadataAndConfig({ api, teamId, teamDir, recipe, results, applyConfig: !!options.applyConfig, overwrite });



  // When heartbeat opt-in is enabled, we synthesize cronJobs into the reconciled recipe.
  // This keeps the behavior portable for arbitrary teamIds without modifying the upstream recipe file.
  const recipeForCron: RecipeFrontmatter = heartbeat.cronJobs.length
    ? {
        ...recipe,
        cronJobs: [...(recipe.cronJobs ?? []), ...heartbeat.cronJobs],
      }
    : recipe;
  const cron = await reconcileRecipeCronJobs({
    api,
    recipe: recipeForCron,
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

  // IMPORTANT: read cron provenance BEFORE deleting workspace.
  // Teams/recipes track installed cron jobs via notes/cron-jobs.json.
  const teamDir = path.resolve(workspaceRoot, "..", `workspace-${teamId}`);
  const cronMappingPath = path.join(teamDir, "notes", "cron-jobs.json");
  let installedCronIds: string[] = [];
  try {
    const raw = await fs.readFile(cronMappingPath, "utf8");
    const json = JSON.parse(raw) as { entries?: Record<string, { installedCronId?: unknown; orphaned?: unknown }> };
    installedCronIds = Object.values(json.entries ?? {})
      .filter((e) => e && !e.orphaned)
      .map((e) => String(e.installedCronId ?? "").trim())
      .filter(Boolean);
  } catch {
    installedCronIds = [];
  }

  const plan = await buildRemoveTeamPlan({
    teamId,
    workspaceRoot,
    openclawConfigPath: "(managed)",
    cronJobsPath,
    cfgObj,
    cronStore,
    installedCronIds,
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
