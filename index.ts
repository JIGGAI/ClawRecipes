import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import path from "node:path";
import JSON5 from "json5";
import {
  applyAgentSnippetsToOpenClawConfig,
  ensureMainFirstInAgentsList,
  loadOpenClawConfig,
  removeBindingsInConfig,
  type BindingMatch,
  upsertBindingInConfig,
  writeOpenClawConfig,
} from "./src/lib/recipes-config";
import { stableStringify } from "./src/lib/stable-stringify";
import { promptConfirmWithPlan, promptYesNo } from "./src/lib/prompt";
import {
  handleRecipesBind,
  handleRecipesBindings,
  handleRecipesList,
  handleRecipesShow,
  handleRecipesStatus,
  handleRecipesUnbind,
} from "./src/handlers/recipes";
import {
  handleInstallMarketplaceRecipe,
  handleInstallSkill,
} from "./src/handlers/install";
import {
  handleAssign,
  handleCleanupClosedAssignments,
  handleDispatch,
  handleHandoff,
  handleMoveTicket,
  handleTake,
  handleTickets,
  patchTicketField,
  patchTicketOwner,
  patchTicketStatus,
} from "./src/handlers/tickets";
import {
  handleMigrateTeamPlan,
  handleRemoveTeam,
  handleScaffoldTeam,
  executeMigrateTeamPlan,
} from "./src/handlers/team";
import { handleScaffold, scaffoldAgentFromRecipe } from "./src/handlers/scaffold";
import { reconcileRecipeCronJobs } from "./src/handlers/cron";
import { listRecipeFiles, loadRecipeById, workspacePath } from "./src/lib/recipes";
import {
  executeWorkspaceCleanup,
  planWorkspaceCleanup,
} from "./src/lib/cleanup-workspaces";
import { resolveWorkspaceRoot } from "./src/lib/workspace";

const recipesPlugin = {
  id: "recipes",
  name: "Recipes",
  description: "Markdown recipes that scaffold agents and teams.",
  configSchema: {
    type: "object",
    additionalProperties: false,
    properties: {},
  },
  register(api: OpenClawPluginApi) {
    // On plugin load, ensure multi-agent config has an explicit agents.list with main at top.
    // This is idempotent and only writes if a change is required.
    (async () => {
      try {
        const cfgObj = await loadOpenClawConfig(api);
        const before = JSON.stringify(cfgObj.agents?.list ?? null);
        ensureMainFirstInAgentsList(cfgObj, api);
        const after = JSON.stringify(cfgObj.agents?.list ?? null);

        if (before !== after) {
          await writeOpenClawConfig(api, cfgObj);
          console.error("[recipes] ensured agents.list includes main as first/default");
        }
      } catch (e) {
        // Keep install/scaffold warning-free; this is non-critical and can fail on locked-down configs.
        // (If needed, diagnose via debug logs instead of emitting warnings.)
        console.error(`[recipes] note: failed to ensure main agent in agents.list: ${(e as Error).message}`);
      }
    })();

    api.registerCli(
      ({ program }) => {
        const cmd = program.command("recipes").description("Manage markdown recipes (scaffold agents/teams)");

        cmd
          .command("list")
          .description("List available recipes (builtin + workspace)")
          .action(async () => {
            const rows = await handleRecipesList(api);
            console.log(JSON.stringify(rows, null, 2));
          });

        cmd
          .command("show")
          .description("Show a recipe by id")
          .argument("<id>", "Recipe id")
          .action(async (id: string) => {
            const md = await handleRecipesShow(api, id);
            console.log(md);
          });

        cmd
          .command("status")
          .description("Check for missing skills for a recipe (or all)")
          .argument("[id]", "Recipe id")
          .action(async (id?: string) => {
            const out = await handleRecipesStatus(api, id);
            console.log(JSON.stringify(out, null, 2));
          });

        type BindOptions = {
          match?: string;
          channel?: string;
          accountId?: string;
          guildId?: string;
          teamId?: string;
          peerKind?: string;
          peerId?: string;
        };

        const parseMatchFromOptions = (options: BindOptions): BindingMatch => {
          if (options.match) {
            return JSON5.parse(String(options.match)) as BindingMatch;
          }

          const match: BindingMatch = {
            channel: String(options.channel),
          };
          if (options.accountId) match.accountId = String(options.accountId);
          if (options.guildId) match.guildId = String(options.guildId);
          if (options.teamId) match.teamId = String(options.teamId);

          if (options.peerKind || options.peerId) {
            if (!options.peerKind || !options.peerId) {
              throw new Error("--peer-kind and --peer-id must be provided together");
            }
            let kind = String(options.peerKind);
            // Back-compat alias
            if (kind === "direct") kind = "dm";
            if (kind !== "dm" && kind !== "group" && kind !== "channel") {
              throw new Error("--peer-kind must be dm|group|channel (or direct as alias for dm)");
            }
            match.peer = { kind, id: String(options.peerId) };
          }

          return match;
        };

        cmd
          .command("bind")
          .description("Add/update a multi-agent routing binding (writes openclaw.json bindings[])")
          .requiredOption("--agent-id <agentId>", "Target agent id")
          .requiredOption("--channel <channel>", "Channel name (telegram|whatsapp|discord|slack|...) ")
          .option("--account-id <accountId>", "Channel accountId (if applicable)")
          .option("--peer-kind <kind>", "Peer kind (dm|group|channel) (aliases: direct->dm)")
          .option("--peer-id <id>", "Peer id (DM number/id, group id, or channel id)")
          .option("--guild-id <guildId>", "Discord guildId")
          .option("--team-id <teamId>", "Slack teamId")
          .option("--match <json>", "Full match object as JSON/JSON5 (overrides flags)")
          .action(async (options: BindOptions & { agentId?: string }) => {
            if (!options.agentId) throw new Error("--agent-id is required");
            const match = parseMatchFromOptions(options);
            const res = await handleRecipesBind(api, { agentId: options.agentId, match });
            console.log(JSON.stringify(res, null, 2));
            console.error("Binding written. Restart gateway if required for changes to take effect.");
          });

        cmd
          .command("unbind")
          .description("Remove routing binding(s) from openclaw.json bindings[]")
          .requiredOption("--channel <channel>", "Channel name")
          .option("--agent-id <agentId>", "Optional agent id; when set, removes only bindings for this agent")
          .option("--account-id <accountId>", "Channel accountId")
          .option("--peer-kind <kind>", "Peer kind (dm|group|channel)")
          .option("--peer-id <id>", "Peer id")
          .option("--guild-id <guildId>", "Discord guildId")
          .option("--team-id <teamId>", "Slack teamId")
          .option("--match <json>", "Full match object as JSON/JSON5 (overrides flags)")
          .action(async (options: BindOptions & { agentId?: string }) => {
            const match = parseMatchFromOptions(options);
            const res = await handleRecipesUnbind(api, { agentId: typeof options.agentId === "string" ? options.agentId : undefined, match });
            console.log(JSON.stringify({ ok: true, ...res }, null, 2));
            console.error("Binding(s) removed. Restart gateway if required for changes to take effect.");
          });

        cmd
          .command("bindings")
          .description("Show current bindings from openclaw config")
          .action(async () => {
            const bindings = await handleRecipesBindings(api);
            console.log(JSON.stringify(bindings, null, 2));
          });

        cmd
          .command("migrate-team")
          .description("Migrate a legacy team scaffold into the new workspace-<teamId> layout")
          .requiredOption("--team-id <teamId>", "Team id (must end with -team)")
          .option("--mode <mode>", "move|copy", "move")
          .option("--dry-run", "Print the plan without writing anything", false)
          .option("--overwrite", "Allow merging into an existing destination (dangerous)", false)
          .action(async (options: { teamId?: string; mode?: string; dryRun?: boolean; overwrite?: boolean }) => {
            if (!options.teamId) throw new Error("--team-id is required");
            const plan = await handleMigrateTeamPlan(api, { teamId: options.teamId, mode: options.mode, overwrite: options.overwrite });
            const dryRun = !!options.dryRun;
            if (dryRun) {
              console.log(JSON.stringify({ ok: true, dryRun: true, plan }, null, 2));
              return;
            }
            const result = await executeMigrateTeamPlan(api, plan);
            console.log(JSON.stringify(result, null, 2));
          });

        cmd
          .command("cleanup-workspaces")
          .description(
            "List (dry-run, default) or delete (with --yes) temporary test/scaffold team workspaces under your OpenClaw home directory"
          )
          .option("--yes", "Actually delete eligible workspaces")
          .option("--prefix <prefix>", "Allowed team id prefix (repeatable)", (v: string, acc: string[]) => [...(acc ?? []), v], [])
          .option("--json", "Output JSON")
          .action(async (options: { yes?: boolean; prefix?: string[]; json?: boolean }) => {
            const workspaceRoot = resolveWorkspaceRoot(api);
            const rootDir = path.resolve(workspaceRoot, "..");
            const prefixes = Array.isArray(options.prefix) && options.prefix.length
              ? options.prefix
              : undefined;
            const plan = await planWorkspaceCleanup({ rootDir, prefixes });
            const yes = !!options.yes;
            const result = await executeWorkspaceCleanup(plan, { yes });
            if (options.json) {
              console.log(JSON.stringify(result, null, 2));
              return;
            }
            if (result.dryRun) {
              const candidates = result.candidates;
              const skipped = result.skipped;
              if (candidates.length === 0 && skipped.length === 0) {
                console.log("No workspace-* directories found matching cleanup criteria.");
                return;
              }
              if (candidates.length) {
                console.log(`Would delete (${candidates.length}):`);
                for (const c of candidates) console.log(`  - ${c.dirName}`);
              }
              if (skipped.length) {
                console.log(`Skipped (${skipped.length}):`);
                for (const s of skipped) console.log(`  - ${s.dirName}: ${s.reason}`);
              }
            } else {
              if (result.deleted?.length) {
                console.log(`Deleted: ${result.deleted.join(", ")}`);
              }
              if (result.deleteErrors?.length) {
                for (const e of result.deleteErrors) {
                  console.error(`Error deleting ${e.path}: ${e.error}`);
                }
                process.exitCode = 1;
              }
            }
          });

        cmd
          .command("install-skill")
          .description(
            "Install a skill from ClawHub (confirmation-gated). Default: global (~/.openclaw/skills). Use --agent-id or --team-id for scoped installs.",
          )
          .argument("<skill>", "ClawHub skill slug (e.g. github)")
          .option("--yes", "Skip confirmation prompt")
          .option("--global", "Install into global shared skills (~/.openclaw/skills) (default when no scope flags)")
          .option("--agent-id <agentId>", "Install into a specific agent workspace (workspace-<agentId>)")
          .option("--team-id <teamId>", "Install into a team workspace (workspace-<teamId>)")
          .action(async (idOrSlug: string, options: { yes?: boolean; global?: boolean; agentId?: string; teamId?: string }) => {
            const res = await handleInstallSkill(api, {
              idOrSlug,
              yes: options.yes,
              global: options.global,
              agentId: options.agentId,
              teamId: options.teamId,
            });

            if (res.ok) {
              console.log(JSON.stringify(res, null, 2));
              return;
            }

            if (res.aborted === "non-interactive") {
              console.error("Refusing to prompt (non-interactive). Re-run with --yes.");
              process.exitCode = 2;
              return;
            }

            if (res.aborted === "user-declined") {
              console.error("Aborted; nothing installed.");
              return;
            }

            if (res.needCli) {
              console.error("\nSkill install requires the ClawHub CLI. Run the following then re-run this command:\n");
              for (const cmd of res.installCommands) {
                console.error("  " + cmd);
              }
              process.exitCode = 2;
              return;
            }
          });

        const runInstallRecipe = async (slug: string, opts: { registryBase?: string; overwrite?: boolean }) => {
          const res = await handleInstallMarketplaceRecipe(api, {
            slug,
            registryBase: opts.registryBase,
            overwrite: opts.overwrite,
          });
          console.log(JSON.stringify(res, null, 2));
        };

        cmd
          .command("install")
          .description("Install a marketplace recipe into your workspace recipes dir (by slug)")
          .argument("<idOrSlug>", "Marketplace recipe slug (e.g. development-team)")
          .option("--registry-base <url>", "Marketplace API base URL", "https://clawkitchen.ai")
          .option("--overwrite", "Overwrite existing recipe file")
          .action((slug: string, options: { registryBase?: string; overwrite?: boolean }) =>
            runInstallRecipe(slug, options)
          );

        cmd
          .command("install-recipe")
          .description("Alias for: recipes install <slug>")
          .argument("<slug>", "Marketplace recipe slug (e.g. development-team)")
          .option("--registry-base <url>", "Marketplace API base URL", "https://clawkitchen.ai")
          .option("--overwrite", "Overwrite existing recipe file")
          .action((slug: string, options: { registryBase?: string; overwrite?: boolean }) =>
            runInstallRecipe(slug, options)
          );

        cmd
          .command("dispatch")
          .description("Lead/dispatcher: turn a natural-language request into inbox + backlog ticket(s) + assignment stubs")
          .requiredOption("--team-id <teamId>", "Team id (workspace folder under teams/)")
          .option("--request <text>", "Natural-language request (if omitted, will prompt in TTY)")
          .option("--owner <owner>", "Ticket owner: dev|devops|lead|test", "dev")
          .option("--yes", "Skip review and write files without prompting")
          .action(async (options: { teamId?: string; request?: string; owner?: string; yes?: boolean }) => {
            if (!options.teamId) throw new Error("--team-id is required");
            let requestText = typeof options.request === "string" ? options.request.trim() : "";
            if (!requestText) {
              if (!process.stdin.isTTY) {
                throw new Error("Missing --request in non-interactive mode");
              }
              const readline = await import("node:readline/promises");
              const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
              try {
                requestText = (await rl.question("Request: ")).trim();
              } finally {
                rl.close();
              }
            }
            const dry = await handleDispatch(api, {
              teamId: options.teamId,
              requestText,
              owner: options.owner,
              dryRun: true,
            });
            const plan = (dry as { plan: unknown }).plan;
            const ok = await promptConfirmWithPlan(plan, "Write these files? (y/N)", { yes: options.yes });
            if (!ok) {
              if (!options.yes && !process.stdin.isTTY) {
                process.exitCode = 2;
                console.error("Refusing to prompt (non-interactive). Re-run with --yes.");
              } else {
                console.error("Aborted; no files written.");
              }
              return;
            }
            const res = await handleDispatch(api, {
              teamId: options.teamId,
              requestText,
              owner: options.owner,
            });
            if (res.nudgeQueued) {
              console.error(`[dispatch] Nudge queued: system event → agent:${options.teamId}-lead:main`);
            } else {
              console.error(`[dispatch] NOTE: Could not auto-nudge ${options.teamId}-lead (best-effort). Next steps:`);
              console.error(`- Option A (recommended): ensure the lead triage cron job is installed/enabled (lead-triage-loop).`);
              console.error(`  - If you declined cron installation during scaffold, re-run scaffold with cron installation enabled, or enable it in settings.`);
              console.error(`- Option B: manually run/open the lead once so it sees inbox/backlog updates.`);
              console.error(`- Option C (advanced): allow subagent messaging (if you want direct pings). Add allowAgents in config and restart gateway.`);
              console.error(`  { agents: { list: [ { id: "main", subagents: { allowAgents: ["${options.teamId}-lead"] } } ] } }`);
            }
            console.log(JSON.stringify({ ok: true, wrote: res.wrote }, null, 2));
          });

        cmd
          .command("remove-team")
          .description("Safe uninstall: remove a scaffolded team workspace + agents + stamped cron jobs")
          .requiredOption("--team-id <teamId>", "Team id")
          .option("--plan", "Print plan and exit")
          .option("--json", "Output JSON")
          .option("--yes", "Skip confirmation (apply destructive changes)")
          .option("--include-ambiguous", "Also remove cron jobs that only loosely match the team (dangerous)")
          .action(async (options: { teamId?: string; plan?: boolean; yes?: boolean; includeAmbiguous?: boolean }) => {
            if (!options.teamId) throw new Error("--team-id is required");
            const out = await handleRemoveTeam(api, {
              teamId: options.teamId,
              plan: options.plan,
              yes: options.yes,
              includeAmbiguous: options.includeAmbiguous,
            });
            if (out.ok === false && out.aborted === "non-interactive") {
              console.error("Refusing to prompt (non-interactive). Re-run with --yes or --plan.");
              process.exitCode = 2;
            }
            if (out.ok === false && out.aborted === "user-declined") {
              console.error("Aborted; no changes made.");
            }
            const payload = "result" in out ? out.result : out;
            console.log(JSON.stringify(payload, null, 2));
            if (out.ok && "result" in out) {
              console.error("Restart required: openclaw gateway restart");
            }
          });

        cmd
          .command("tickets")
          .description("List tickets for a team (backlog / in-progress / testing / done)")
          .requiredOption("--team-id <teamId>", "Team id")
          .option("--json", "Output JSON")
          .action(async (options: { teamId?: string; json?: boolean }) => {
            if (!options.teamId) throw new Error("--team-id is required");
            const out = await handleTickets(api, { teamId: options.teamId });
            if (options.json) {
              console.log(JSON.stringify(out, null, 2));
              return;
            }
            const print = (label: string, items: Array<{ id: string }>) => {
              console.log(`\n${label} (${items.length})`);
              for (const t of items) console.log(`- ${t.id}`);
            };
            console.log(`Team: ${out.teamId}`);
            print("Backlog", out.backlog);
            print("In progress", out.inProgress);
            print("Testing", out.testing);
            print("Done", out.done);
          });

        cmd
          .command("move-ticket")
          .description("Move a ticket between backlog/in-progress/testing/done (updates Status: line)")
          .requiredOption("--team-id <teamId>", "Team id")
          .requiredOption("--ticket <ticket>", "Ticket id or number (e.g. 0007 or 0007-some-slug)")
          .requiredOption("--to <stage>", "Destination stage: backlog|in-progress|testing|done")
          .option("--completed", "When moving to done, add Completed: timestamp")
          .option("--yes", "Skip confirmation")
          .action(async (options: { teamId?: string; ticket?: string; to?: string; completed?: boolean; yes?: boolean }) => {
            if (!options.teamId || !options.ticket || !options.to) throw new Error("--team-id, --ticket, and --to are required");
            const dry = await handleMoveTicket(api, {
              teamId: options.teamId,
              ticket: options.ticket,
              to: options.to,
              completed: options.completed,
              dryRun: true,
            });
            const plan = (dry as { plan: { from: string; to: string } }).plan;
            const ok = await promptConfirmWithPlan(plan, `Move ticket to ${options.to}? (y/N)`, { yes: options.yes });
            if (!ok) {
              if (!options.yes && !process.stdin.isTTY) {
                process.exitCode = 2;
                console.error("Refusing to move without confirmation in non-interactive mode. Re-run with --yes.");
              } else {
                console.error("Aborted; no changes made.");
              }
              return;
            }
            const res = await handleMoveTicket(api, {
              teamId: options.teamId,
              ticket: options.ticket,
              to: options.to,
              completed: options.completed,
            });
            console.log(JSON.stringify({ ok: true, moved: { from: res.from, to: res.to } }, null, 2));
          });

        cmd
          .command("cleanup-closed-assignments")
          .description("Archive assignment stubs for tickets already in work/done (prevents done work resurfacing)")
          .requiredOption("--team-id <teamId>", "Team id")
          .option("--ticket <ticketNums...>", "Optional ticket numbers to target (e.g. 0050 0064)")
          .action(async (options: { teamId?: string; ticket?: string[] }) => {
            if (!options.teamId) throw new Error("--team-id is required");
            const res = await handleCleanupClosedAssignments(api, {
              teamId: options.teamId,
              ticketNums: options.ticket,
            });
            console.log(JSON.stringify(res, null, 2));
          });

        cmd
          .command("assign")
          .description("Assign a ticket to an owner (writes assignment stub + updates Owner: in ticket)")
          .requiredOption("--team-id <teamId>", "Team id")
          .requiredOption("--ticket <ticket>", "Ticket id or number (e.g. 0007 or 0007-some-slug)")
          .requiredOption("--owner <owner>", "Owner: dev|devops|lead|test")
          .option("--overwrite", "Overwrite existing assignment file")
          .option("--yes", "Skip confirmation")
          .action(async (options: { teamId?: string; ticket?: string; owner?: string; overwrite?: boolean; yes?: boolean }) => {
            if (!options.teamId || !options.ticket || !options.owner) throw new Error("--team-id, --ticket, and --owner are required");
            const { plan } = await handleAssign(api, {
              teamId: options.teamId,
              ticket: options.ticket,
              owner: options.owner,
              overwrite: options.overwrite,
              dryRun: true,
            });
            const ok = await promptConfirmWithPlan(plan, `Assign ticket to ${options.owner}? (y/N)`, { yes: options.yes });
            if (!ok) {
              if (!options.yes && !process.stdin.isTTY) {
                process.exitCode = 2;
                console.error("Refusing to assign without confirmation in non-interactive mode. Re-run with --yes.");
              } else {
                console.error("Aborted; no changes made.");
              }
              return;
            }
            const res = await handleAssign(api, {
              teamId: options.teamId,
              ticket: options.ticket,
              owner: options.owner,
              overwrite: options.overwrite,
            });
            console.log(JSON.stringify(res, null, 2));
          });

        cmd
          .command("take")
          .description("Shortcut: assign ticket to owner + move to in-progress")
          .requiredOption("--team-id <teamId>", "Team id")
          .requiredOption("--ticket <ticket>", "Ticket id or number")
          .option("--owner <owner>", "Owner: dev|devops|lead|test", "dev")
          .option("--yes", "Skip confirmation")
          .action(async (options: { teamId?: string; ticket?: string; owner?: string; overwrite?: boolean; yes?: boolean }) => {
            if (!options.teamId || !options.ticket) throw new Error("--team-id and --ticket are required");
            const dry = await handleTake(api, {
              teamId: options.teamId,
              ticket: options.ticket,
              owner: options.owner,
              overwrite: options.overwrite,
              dryRun: true,
            });
            const plan = (dry as { plan: { from: string; to: string; owner: string } }).plan;
            const ok = await promptConfirmWithPlan(plan, `Assign to ${plan.owner} and move to in-progress? (y/N)`, { yes: options.yes });
            if (!ok) {
              if (!options.yes && !process.stdin.isTTY) {
                process.exitCode = 2;
                console.error("Refusing to take without confirmation in non-interactive mode. Re-run with --yes.");
              } else {
                console.error("Aborted; no changes made.");
              }
              return;
            }
            const res = await handleTake(api, {
              teamId: options.teamId,
              ticket: options.ticket,
              owner: options.owner,
              overwrite: options.overwrite,
            });
            if (!("srcPath" in res)) throw new Error("Unexpected take result");
            console.log(
              JSON.stringify(
                { ok: true, plan: { from: res.srcPath, to: res.destPath, owner: options.owner ?? "dev" }, assignmentPath: res.assignmentPath },
                null,
                2
              )
            );
          });


        cmd
          .command("handoff")
          .description("QA handoff: move ticket to testing + assign to tester")
          .requiredOption("--team-id <teamId>", "Team id")
          .requiredOption("--ticket <ticket>", "Ticket id or number")
          .option("--tester <owner>", "Tester owner (default: test)", "test")
          .option("--overwrite", "Overwrite destination ticket file / assignment stub if they already exist")
          .option("--yes", "Skip confirmation")
          .action(async (options: { teamId?: string; ticket?: string; tester?: string; overwrite?: boolean; yes?: boolean }) => {
            if (!options.teamId || !options.ticket) throw new Error("--team-id and --ticket are required");
            const dry = await handleHandoff(api, {
              teamId: options.teamId,
              ticket: options.ticket,
              tester: options.tester,
              overwrite: options.overwrite,
              dryRun: true,
            });
            const plan = (dry as { plan: { from: string; to: string; tester: string; note?: string } }).plan;
            const ok = await promptConfirmWithPlan(plan, `Move to testing + assign to ${plan.tester}? (y/N)`, { yes: options.yes });
            if (!ok) {
              if (!options.yes && !process.stdin.isTTY) {
                process.exitCode = 2;
                console.error("Refusing to handoff without confirmation in non-interactive mode. Re-run with --yes.");
              } else {
                console.error("Aborted; no changes made.");
              }
              return;
            }
            const res = await handleHandoff(api, {
              teamId: options.teamId,
              ticket: options.ticket,
              tester: options.tester,
              overwrite: options.overwrite,
            });
            if (!("srcPath" in res)) throw new Error("Unexpected handoff result");
            console.log(
              JSON.stringify(
                { ok: true, plan: { from: res.srcPath, to: res.destPath, tester: options.tester ?? "test" }, assignmentPath: res.assignmentPath },
                null,
                2
              )
            );
          });

        cmd
          .command("complete")
          .description("Complete a ticket (move to done, set Status: done, and add Completed: timestamp). No confirmation prompt.")
          .requiredOption("--team-id <teamId>", "Team id")
          .requiredOption("--ticket <ticket>", "Ticket id or number")
          .option("--yes", "No-op for backward compatibility (complete has no confirmation)")
          .action(async (options: { teamId?: string; ticket?: string }) => {
            if (!options.teamId || !options.ticket) throw new Error("--team-id and --ticket are required");
            try {
              const res = await handleMoveTicket(api, {
                teamId: options.teamId,
                ticket: options.ticket,
                to: "done",
                completed: true,
              });
              console.log(JSON.stringify({ ok: true, moved: { from: res.from, to: res.to } }, null, 2));
            } catch (e) {
              process.exitCode = 1;
              throw e;
            }
          });

        const logScaffoldResult = (
          res: { ok: boolean; missingSkills?: string[]; installCommands?: string[] },
          recipeId: string
        ) => {
          if (res.ok === false && res.missingSkills && res.installCommands) {
            console.error(`Missing skills for recipe ${recipeId}: ${res.missingSkills.join(", ")}`);
            console.error(`Install commands (workspace-local):\n${res.installCommands.join("\n")}`);
            process.exitCode = 2;
            return;
          }
          console.log(JSON.stringify(res, null, 2));
        };

        cmd
          .command("scaffold")
          .description("Scaffold an agent from a recipe")
          .argument("<recipeId>", "Recipe id")
          .requiredOption("--agent-id <id>", "Agent id")
          .option("--name <name>", "Agent display name")
          .option("--recipe-id <recipeId>", "Custom workspace recipe id to write (default: <agentId>)")
          .option("--overwrite", "Overwrite existing recipe-managed files")
          .option("--overwrite-recipe", "Overwrite the generated workspace recipe file (workspace/recipes/<agentId>.md) if it already exists")
          .option("--auto-increment", "If the workspace recipe id is taken, pick the next available <agentId>-2/-3/...")
          .option("--apply-config", "Write the agent into openclaw config (agents.list)")
          .action(async (recipeId: string, options: { agentId: string; name?: string; recipeId?: string; overwrite?: boolean; overwriteRecipe?: boolean; autoIncrement?: boolean; applyConfig?: boolean }) => {
            const res = await handleScaffold(api, {
              recipeId,
              agentId: options.agentId,
              name: options.name,
              recipeIdExplicit: options.recipeId,
              overwrite: options.overwrite,
              overwriteRecipe: options.overwriteRecipe,
              autoIncrement: options.autoIncrement,
              applyConfig: options.applyConfig,
            });
            logScaffoldResult(res, recipeId);
          });

        cmd
          .command("scaffold-team")
          .description("Scaffold a team (shared workspace + multiple agents) from a team recipe")
          .argument("<recipeId>", "Recipe id")
          .requiredOption("-t, --team-id <teamId>", "Team id")
          .option("--recipe-id <recipeId>", "Custom workspace recipe id to write (default: <teamId>)")
          .option("--overwrite", "Overwrite existing recipe-managed files")
          .option("--overwrite-recipe", "Overwrite the generated workspace recipe file (workspace/recipes/<teamId>.md) if it already exists")
          .option("--auto-increment", "If the workspace recipe id is taken, pick the next available <teamId>-2/-3/...")
          .option("--apply-config", "Write all team agents into openclaw config (agents.list)")
          .action(async (recipeId: string, options: { teamId: string; recipeId?: string; overwrite?: boolean; overwriteRecipe?: boolean; autoIncrement?: boolean; applyConfig?: boolean }) => {
            const res = await handleScaffoldTeam(api, {
              recipeId,
              teamId: String(options.teamId),
              recipeIdExplicit: options.recipeId,
              overwrite: !!options.overwrite,
              overwriteRecipe: !!options.overwriteRecipe,
              autoIncrement: !!options.autoIncrement,
              applyConfig: !!options.applyConfig,
            });
            logScaffoldResult(res, recipeId);
          });
      },
      { commands: ["recipes"] },
    );
  },
};

// Internal helpers used by unit tests. Not part of the public plugin API.
export const __internal = {
  ensureMainFirstInAgentsList,
  upsertBindingInConfig,
  removeBindingsInConfig,
  stableStringify,
  workspacePath,
  listRecipeFiles,
  loadRecipeById,
  handleRecipesList,
  handleRecipesShow,
  handleRecipesStatus,
  handleRecipesBind,
  handleRecipesUnbind,
  handleRecipesBindings,
  handleTickets,
  handleMoveTicket,
  handleMigrateTeamPlan,
  executeMigrateTeamPlan,
  handleRemoveTeam,
  handleAssign,
  handleTake,
  handleHandoff,
  handleDispatch,
  handleInstallSkill,
  handleInstallMarketplaceRecipe,
  handleScaffold,
  handleScaffoldTeam,
  scaffoldAgentFromRecipe,
  promptYesNo,
  reconcileRecipeCronJobs,
  applyAgentSnippetsToOpenClawConfig,
  patchTicketField,
  patchTicketOwner,
  patchTicketStatus,
};

export default recipesPlugin;
