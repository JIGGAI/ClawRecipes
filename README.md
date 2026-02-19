# ClawRecipes (OpenClaw Recipes Plugin)

<p align="center">
  <img src="https://github.com/JIGGAI/ClawRecipes/blob/main/clawcipes_cook.jpg" alt="ClawRecipes logo" width="240" />
</p>

ClawRecipes is an OpenClaw plugin that provides **CLI-first recipes** for scaffolding specialist agents and teams from Markdown.

If you like durable workflows: ClawRecipes is built around a **file-first team workspace** (inbox/backlog/in-progress/testing/done) that plays nicely with git.

## Quickstart
### 1) Install
#### Option A (preferred): install from npm
When published on npm:

```bash
openclaw plugins install @jiggai/recipes

# If you use a plugin allowlist (plugins.allow), you must explicitly trust it:
openclaw config get plugins.allow --json
# then add "recipes" and set it back, e.g.
openclaw config set plugins.allow --json '["memory-core","telegram","recipes"]'

openclaw gateway restart
openclaw plugins list
```

#### Option B: install from GitHub
```bash
git clone https://github.com/JIGGAI/ClawRecipes.git ~/clawrecipes
openclaw plugins install --link ~/clawrecipes
openclaw gateway restart
openclaw plugins list
```

### 2) List available recipes
```bash
openclaw recipes list
```

### 3) Scaffold a team
```bash
openclaw recipes scaffold-team development-team \
  --team-id development-team-team \
  --overwrite \
  --apply-config
```

### 4) Dispatch a request into work artifacts
```bash
openclaw recipes dispatch \
  --team-id development-team-team \
  --request "Add a new recipe for a customer-support team" \
  --owner lead
```

## License

ClawRecipes is licensed under **Apache-2.0**.

Attribution requirement (practical): if you redistribute ClawRecipes (or a derivative work), you must retain the license and attribution notices (see `LICENSE` and `NOTICE`).

Branding note: the license does not grant permission to use JIGGAI trademarks except as required for reasonable and customary attribution. See `TRADEMARK.md`.

Contributions: we welcome PRs. By contributing, you agree that your contributions are licensed under the project’s Apache-2.0 license.

## Commands (high level)
- `openclaw recipes list|show|status`
- `openclaw recipes scaffold` (agent → `workspace-<agentId>` + writes workspace recipe `~/.openclaw/workspace/recipes/<agentId>.md` by default)
- `openclaw recipes scaffold-team` (team → `workspace-<teamId>` + `roles/<role>/` + writes workspace recipe `~/.openclaw/workspace/recipes/<teamId>.md` by default)
- `openclaw recipes install-skill <idOrSlug> [--yes] [--global|--agent-id <id>|--team-id <id>]` (skills: global or scoped)
- `openclaw recipes install <slug>` (marketplace recipe)
- `openclaw recipes bind|unbind|bindings` (multi-agent routing)
- `openclaw recipes dispatch ...` (request → inbox + ticket + assignment)
- `openclaw recipes tickets|move-ticket|assign|take|handoff|complete` (file-first ticket workflow)
- `openclaw recipes cleanup-workspaces` (safe cleanup of temporary test/scaffold workspaces)

For full details, see `docs/COMMANDS.md`.

## Configuration
The plugin supports these config keys (with defaults):
- `workspaceRecipesDir` (default: `recipes`)
- `workspaceAgentsDir` (default: `agents`)
- `workspaceSkillsDir` (default: `skills`)
- `workspaceTeamsDir` (default: `teams`)
- `autoInstallMissingSkills` (default: `false`)
- `confirmAutoInstall` (default: `true`)
- `cronInstallation` (default: `prompt`; values: `off|prompt|on`)

Config schema is defined in `openclaw.plugin.json`.

## Documentation
**For users:**
- [Installation](docs/INSTALLATION.md) — install the plugin
- [Agents & skills](docs/AGENTS_AND_SKILLS.md) — mental model, tool policies
- [Tutorial](docs/TUTORIAL_CREATE_RECIPE.md) — create your first recipe
- [Commands](docs/COMMANDS.md) — full command reference
- [Team workflow](docs/TEAM_WORKFLOW.md) — file-first workflow

**For contributors:**
- [Architecture](docs/ARCHITECTURE.md) — codebase structure
- [Contributing](CONTRIBUTING.md) — setup, tests, PR workflow

## Development
### Unit tests (vitest)
Run:
- `npm test`
- `npm run test:coverage` — coverage with CI thresholds (see `vitest.config.ts`)
- `npm run smell-check` — quality checks (ESLint, jscpd, pattern grep)

### Pre-commit hooks
Husky runs on commit. Run `npm ci` first to install hooks.

### Scaffold smoke test (regression)
A lightweight smoke check validates scaffold-team output contains the required testing workflow docs (ticket 0004).

Run:
- `npm run test:smoke` (or `npm run scaffold:smoke`)

Notes:
- Creates a temporary `workspace-smoke-<timestamp>-team` under `~/.openclaw/` and then deletes it.
- Exits non-zero on mismatch.
- Requires OpenClaw and workspace config.

### For contributors
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — codebase structure
- [CONTRIBUTING.md](CONTRIBUTING.md) — setup, commands, pre-commit, CI

Reference:
- Commands: `docs/COMMANDS.md`
- Recipe format: `docs/RECIPE_FORMAT.md`
- Bundled recipes: `docs/BUNDLED_RECIPES.md`
- Team workflow: `docs/TEAM_WORKFLOW.md`
- ClawRecipes Kitchen (UI): `docs/CLAWCIPES_KITCHEN.md`

(Also see: GitHub repo https://github.com/JIGGAI/ClawRecipes)
## Notes / principles
- Workspaces:
  - Standalone agents: `~/.openclaw/workspace-<agentId>/`
  - Teams: `~/.openclaw/workspace-<teamId>/` with `roles/<role>/...`
- Skills:
  - Global (shared): `~/.openclaw/skills/<skill>`
  - Scoped (agent/team): `~/.openclaw/workspace-*/skills/<skill>`
- Team IDs end with `-team`; agent IDs are namespaced: `<teamId>-<role>`.
- Recipe template rendering is intentionally simple: `{{var}}` replacement only.

## Removing (uninstalling) a scaffolded team
ClawRecipes includes a safe uninstall command:

```bash
openclaw recipes remove-team --team-id <teamId> --plan --json
openclaw recipes remove-team --team-id <teamId> --yes
openclaw gateway restart
```

Notes:
- The command is confirmation-gated by default (use `--yes` to apply).
- Cron cleanup is conservative: it removes only cron jobs that are explicitly **stamped** with `recipes.teamId=<teamId>`.
- If you need a manual fallback, you can still delete `~/.openclaw/workspace-<teamId>` and remove `<teamId>-*` agents from `agents.list[]` in `~/.openclaw/openclaw.json`.

## Links
- GitHub: https://github.com/JIGGAI/ClawRecipes
- Docs:
  - [Installation](https://github.com/JIGGAI/ClawRecipes/blob/main/docs/INSTALLATION.md): `docs/INSTALLATION.md`
  - [Commands](https://github.com/JIGGAI/ClawRecipes/blob/main/docs/COMMANDS.md): `docs/COMMANDS.md`
  - [Recipe format](https://github.com/JIGGAI/ClawRecipes/blob/main/docs/RECIPE_FORMAT.md): `docs/RECIPE_FORMAT.md`
  - [Team workflow](https://github.com/JIGGAI/ClawRecipes/blob/main/docs/TEAM_WORKFLOW.md): `docs/TEAM_WORKFLOW.md`
  - [Agents & Skills](https://github.com/JIGGAI/ClawRecipes/blob/main/docs/AGENTS_AND_SKILLS.md): `docs/AGENTS_AND_SKILLS.md`
  - [Architecture](https://github.com/JIGGAI/ClawRecipes/blob/main/docs/ARCHITECTURE.md): `docs/ARCHITECTURE.md`
  - [Bundled](https://github.com/JIGGAI/ClawRecipes/blob/main/docs/BUNDLED_RECIPES.md): `docs/BUNDLED_RECIPES.md`
  - [Create Recipe Tutorial](https://github.com/JIGGAI/ClawRecipes/blob/main/docs/TUTORIAL_CREATE_RECIPE.md): `docs/TUTORIAL_CREATE_RECIPE.md`
  - [Contributing](https://github.com/JIGGAI/ClawRecipes/blob/main/CONTRIBUTING.md): `CONTRIBUTING.md`

## Note
ClawRecipes is meant to be *installed* and then used to build **agents + teams**.

Most users should focus on:
- authoring recipes in their OpenClaw workspace (`<workspace>/recipes/*.md`)
- scaffolding teams (`openclaw recipes scaffold-team ...`)
- running the file-first workflow (dispatch → backlog → in-progress → testing → done)

## Goals
- Release Clawmarket, https://github.com/JIGGAI/ClawMarket, public url https://clawkitchen.ai
- Release ClawKitchen, https://github.com/JIGGAI/ClawKitchen
- Merge at least 1 community pull request
- Daily shipping/pull requests of ClawRecipes features
- Improve recipes with more detailed agent files
- Add ability to install skills for agents through ClawKitchen