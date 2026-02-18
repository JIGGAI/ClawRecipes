# Code Smells Tracker

| # | Smell | Status | Priority | Notes |
|---|-------|--------|----------|-------|
| 1 | fileExists duplicated (index, ticket-finder, ticket-workflow, lanes, remove-team) | done | high | Extracted to src/lib/fs-utils |
| 2 | stableStringify duplicated (index, bindings) | done | high | Extracted to src/lib/stable-stringify |
| 3 | parseFrontmatter/normalizeCronJobs duplicated (index, recipe-frontmatter) | done | high | Unified; recipe-frontmatter extended with message/task/prompt |
| 4 | Magic numbers in toolsInvoke (30_000, 150*attempt) | done | medium | Extracted as TOOLS_INVOKE_TIMEOUT_MS, RETRY_DELAY_BASE_MS |
| 5 | index.ts god file (~2500 lines) | done | low | Extracted handlers to src/handlers/; index now ~670 lines (Phase 3) |
| 6 | Duplicate ticket-finding logic (ticket-workflow vs ticket-finder) | done | medium | ticket-workflow now delegates to ticket-finder |
| 7 | Duplicated ticket regex patterns | done | low | TICKET_FILENAME_REGEX in ticket-finder; tickets uses it |
| 8 | Hardcoded "recipes" in scaffold | done | low | scaffold uses cfg.workspaceRecipesDir |
| 9 | Lane path duplication in tickets | done | low | tickets uses ticketStageDir from lanes |
| 10 | Magic numbers (1000, 18789, 0000) | done | low | MAX_RECIPE_ID_AUTO_INCREMENT, GATEWAY_DEFAULT_PORT, DEFAULT_TICKET_NUMBER in constants |
| 11 | Overlapping TicketLane/TicketStage types | done | low | TicketLane = Exclude<TicketStage, "assignments"> in lanes; ticket-finder re-exports |
| 12 | Config load/write duplicated | done | medium | loadOpenClawConfig, writeOpenClawConfig in recipes-config; all callers use them |
| 13 | nextTicketNumber inline in dispatch | done | low | Extracted computeNextTicketNumber to ticket-finder |
| 14 | bindings.ts vs recipes-config duplication | done | low | bindings re-exports from recipes-config; bindings.test uses recipes-config |
| 15 | Silent catch in handleDispatch | done | low | Documented: non-critical enqueueSystemEvent, nudgeQueued reflects skip |
| 16 | Duplicate pickRecipeId (scaffold vs team) | done | medium | Extracted to src/lib/recipe-id |
| 17 | Hardcoded "recipes" in team | done | low | team uses cfg.workspaceRecipesDir |
| 18 | as any in recipe-frontmatter normalizeCronJobs | done | low | CronJobInput type |
| 19 | as any in cron.ts (scope, created response) | done | low | Proper types; CronAddResponse, CronReconcileResult |
| 20 | getCfg trivial wrapper in recipes | done | very low | Inlined getRecipesConfig |
| 21 | results: any[] in cron | done | low | CronReconcileResult union type |

## Automated smell detection

Run `npm run smell-check` to:
- **ESLint**: `no-explicit-any`, `complexity`, `max-lines-per-function`, `max-params` (src/; index.ts exempt from complexity/lines)
- **jscpd**: Duplicate code detection (≥8 lines, ≥50 tokens)
- **Pattern grep**: `as any` in src/ (max 10), TODO/FIXME/XXX (max 20)

Scripts: `npm run lint`, `npm run lint:fix`, `npm run jscpd`, `npm run smell-check`

## Resolution log

- **Smell 5**: Index handler extraction (Phase 2–3) moved ~1200 lines to src/handlers/{cron,recipes,scaffold,team,tickets,install}.ts. index.ts now thin CLI wiring only.
- **Smells 6–11**: Additional cleanup: consolidated ticket-finding, extracted regex/constants, used config for recipes dir, ticketStageDir, magic-number constants, unified lane types.
- **Smells 12–15**: Config helpers (load/write), computeNextTicketNumber, bindings consolidation, silent-catch documentation.
- **Smells 16–21**: pickRecipeId extracted to recipe-id; team uses workspaceRecipesDir; CronJobInput type; cron types (CronAddResponse, CronReconcileResult); getCfg inlined; config double-lookup comment.
- **Post-cleanup complete** (Feb 2026): All 21 smells resolved; smell-check passes with 0 warnings. Additional quality improvements: pre-commit hooks (husky + lint-staged), CI coverage enforcement, tsconfig.json, JSDoc for public APIs.
