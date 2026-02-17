# Remaining Code Smells — TODO

## Type safety (`as any` / `any`) — DONE

- [x] **cron.ts** — Replaced with OpenClawCronJob, CronJobPatch, OpenClawPluginApi
- [x] **team.ts** — AgentScaffoldResult, MigrateStep types
- [x] **recipes-config.ts** — OpenClawConfigMutable
- [x] **remove-team.ts** — Record<string, unknown>
- [ ] **index.ts** — ~16 options: any remain (partial: install, scaffold use typed opts)
- [x] **Misc** — recipes, tickets, agent-config, config, cron-utils, marketplaceFetch, toolsInvoke, lanes, cleanup-workspaces, recipe-frontmatter

## Duplicate code (jscpd) — DONE

- [x] **ticket-workflow.ts** — patchTicketFields extracted
- [x] **tickets.ts** — dryRunTicketMove extracted
- [x] **index.ts** — runInstallRecipe, logScaffoldResult extracted

## Remaining (deferred)

- [ ] **Complexity** — reconcileRecipeCronJobs (55), handleScaffoldTeam (27), etc.
- [ ] **Long functions** — handleScaffoldTeam (163), reconcileRecipeCronJobs (139)
- [ ] **scaffold.ts ↔ team.ts** — pickRecipeId already shared; further unification optional
- [ ] **Console in src/lib** — Logging abstraction
