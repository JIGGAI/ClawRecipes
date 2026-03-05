# Command reference

All commands live under:

```bash
openclaw recipes <command>
```

## `list`
List available recipes (builtin + workspace).

```bash
openclaw recipes list
```

Outputs JSON rows:
- `id`, `name`, `kind`, `source`

## `show <id>`
Print the raw recipe markdown.

```bash
openclaw recipes show development-team
```

## `status [id]`
Check missing skills for a recipe (or all recipes).

```bash
openclaw recipes status
openclaw recipes status development-team
```

## `scaffold <recipeId>`
Scaffold a single agent workspace from an **agent** recipe.

```bash
openclaw recipes scaffold project-manager --agent-id pm --name "Project Manager" --apply-config
```

Options:
- `--agent-id <id>` (required)
- `--name <name>`
- `--recipe-id <recipeId>` (workspace recipe id to write; default: `<agentId>`)
- `--auto-increment` (if the workspace recipe id is taken, pick `<agentId>-2/-3/...`)
- `--overwrite-recipe` (overwrite the generated workspace recipe file if it already exists)
- `--overwrite` (overwrite recipe-managed files)
- `--apply-config` (write/update `agents.list[]` in OpenClaw config)
- Cron: see Cron installation under scaffold-team.

Also writes a workspace recipe file:
- `~/.openclaw/workspace/recipes/<recipeId>.md`

## `scaffold-team <recipeId>`

Scaffold a shared **team workspace** + multiple agents from a **team** recipe.

```bash
openclaw recipes scaffold-team development-team \
  --team-id development-team-team \
  --overwrite \
  --apply-config
```

Options:
- `--team-id <teamId>` (required)
  - **Must end with `-team`** (enforced)
- `--recipe-id <recipeId>` (workspace recipe id to write; default: `<teamId>`)
- `--auto-increment` (if the workspace recipe id is taken, pick `<teamId>-2/-3/...`)
- `--overwrite-recipe` (overwrite the generated workspace recipe file if it already exists)
- `--overwrite`
- `--apply-config`

Also writes a workspace recipe file:
- `~/.openclaw/workspace/recipes/<recipeId>.md`

Creates a shared team workspace root:

- `~/.openclaw/workspace-<teamId>/...`

Standard folders:
- `inbox/`, `outbox/`, `shared/`, `notes/`
- `work/{backlog,in-progress,testing,done,assignments}`
- `roles/<role>/...` (role-specific recipe files)

Also creates agent config entries under `agents.list[]` (when `--apply-config`), with agent ids:
- `<teamId>-<role>`

### Cron installation
If a recipe declares `cronJobs`, scaffold and scaffold-team reconcile those jobs using the plugin config key:
- `plugins.entries.recipes.config.cronInstallation`: `off | prompt | on`
  - `off`: never install/reconcile
  - `prompt` (default): prompt each run (default answer is **No**)
  - `on`: install/reconcile; new jobs follow `enabledByDefault`

Applies to both `scaffold` and `scaffold-team` when the recipe declares `cronJobs`.

## `install-skill <idOrSlug> [--yes]`
Install skills from ClawHub (confirmation-gated).

Default: **global** into `~/.openclaw/skills`.

```bash
# Global (shared across all agents)
openclaw recipes install-skill agentchat --yes

# Agent-scoped (into workspace-<agentId>/skills)
openclaw recipes install-skill agentchat --yes --agent-id dev

# Team-scoped (into workspace-<teamId>/skills)
openclaw recipes install-skill agentchat --yes --team-id development-team-team
```

Options:
- `--yes` — skip confirmation
- `--global` — install into global skills (default when no scope flags)
- `--agent-id <id>` — install into agent workspace
- `--team-id <id>` — install into team workspace

Behavior:
- If `idOrSlug` matches a recipe id, installs that recipe’s `requiredSkills` + `optionalSkills`.
- Otherwise treats it as a ClawHub skill slug.
- Installs via `npx clawhub@latest ...`. Confirmation-gated unless `--yes`. In non-interactive mode (no TTY), requires `--yes`.

## `install <slug>`
Install a marketplace recipe into your workspace recipes dir (by slug).

```bash
openclaw recipes install development-team
openclaw recipes install development-team --overwrite
```

Options:
- `--registry-base <url>` — Marketplace API base URL (default: `https://clawkitchen.ai`)
- `--overwrite` — overwrite existing recipe file

Use `install-recipe` as an alias for this command.

## `bind`
Add/update a multi-agent routing binding (writes `bindings[]` in `~/.openclaw/openclaw.json`).

Examples:

```bash
# Route one Telegram DM to an agent
openclaw recipes bind --agent-id dev --channel telegram --peer-kind dm --peer-id 6477250615

# Route all Telegram traffic to an agent (broad match)
openclaw recipes bind --agent-id dev --channel telegram
```

Notes:
- `peer.kind` must be one of: `dm|group|channel`.
- Peer-specific bindings are inserted first (more specific wins).

## `unbind`
Remove routing binding(s) from OpenClaw config (`bindings[]`).

Examples:

```bash
# Remove a specific DM binding for an agent
openclaw recipes unbind --agent-id dev --channel telegram --peer-kind dm --peer-id 6477250615

# Remove ALL bindings that match this peer (any agent)
openclaw recipes unbind --channel telegram --peer-kind dm --peer-id 6477250615
```

## `bindings`
Print the current `bindings[]` from OpenClaw config.

```bash
openclaw recipes bindings
```

## `migrate-team`
Migrate a legacy team scaffold into the new `workspace-<teamId>` layout.

```bash
openclaw recipes migrate-team --team-id development-team-team --dry-run
openclaw recipes migrate-team --team-id development-team-team --mode move
```

Options:
- `--dry-run`
- `--mode move|copy`
- `--overwrite` (merge into existing destination)

## `remove-team`
Safe uninstall: remove a scaffolded team workspace, agents from config, and stamped cron jobs.

```bash
openclaw recipes remove-team --team-id development-team-team --plan --json
openclaw recipes remove-team --team-id development-team-team --yes
```

Options:
- `--team-id <teamId>` (required)
- `--plan` — print plan and exit without applying
- `--json` — output JSON
- `--yes` — skip confirmation (apply destructive changes)
- `--include-ambiguous` — also remove cron jobs that only loosely match the team (dangerous)

Notes:
- Confirmation-gated by default. Use `--yes` to apply without prompting.
- Cron cleanup removes only cron jobs stamped with `recipes.teamId=<teamId>`.
- Restart required after removal: `openclaw gateway restart`

## `dispatch`
Convert a natural-language request into file-first execution artifacts (inbox + backlog ticket + assignment stubs).

```bash
openclaw recipes dispatch \
  --team-id development-team-team \
  --request "Add a customer-support team recipe" \
  --owner lead
```

Options:
- `--team-id <teamId>` (required)
- `--request <text>` (optional; prompts in TTY)
- `--owner dev|devops|lead|test` (default: `dev`)
- `--yes` (skip review prompt)

Creates:
- `workspace-<teamId>/inbox/<timestamp>-<slug>.md`
- `workspace-<teamId>/work/backlog/<NNNN>-<slug>.md`
- `workspace-<teamId>/work/assignments/<NNNN>-assigned-<owner>.md`

Ticket numbering:
- Scans `work/backlog`, `work/in-progress`, `work/testing`, `work/done` and uses max+1.

Review-before-write:
- Prints a JSON plan and asks for confirmation unless `--yes`.

## Ticket workflow commands

The following commands manage the file-first ticket flow (`work/backlog` → `in-progress` → `testing` → `done`).

### `tickets`
List tickets for a team across the standard workflow stages.

```bash
openclaw recipes tickets --team-id <teamId>
openclaw recipes tickets --team-id <teamId> --json
```

## `cleanup-workspaces`
List (dry-run, default) or delete (with `--yes`) temporary test/scaffold team workspaces under your OpenClaw home directory.

Safety rails:
- Only considers `workspace-<teamId>` directories where `<teamId>`:
  - ends with `-team`
  - starts with an allowed prefix (default: `smoke-`, `qa-`, `tmp-`, `test-`)
- Refuses symlinks
- Protected teams (at minimum: `development-team`) are never deleted

Examples:
```bash
# Dry-run (default): list what would be deleted
openclaw recipes cleanup-workspaces

# Actually delete eligible workspaces
openclaw recipes cleanup-workspaces --yes

# Custom prefixes (repeatable)
openclaw recipes cleanup-workspaces --prefix smoke- --prefix qa- --yes

# JSON output
openclaw recipes cleanup-workspaces --json
```

### `move-ticket`
Move a ticket file between workflow stages and update the ticket’s `Status:` field.

```bash
openclaw recipes move-ticket --team-id <teamId> --ticket 0007 --to in-progress
openclaw recipes move-ticket --team-id <teamId> --ticket 0007 --to testing
openclaw recipes move-ticket --team-id <teamId> --ticket 0007 --to done --completed
```

Stages:
- `backlog` → `Status: queued`
- `in-progress` → `Status: in-progress`
- `testing` → `Status: testing`
- `done` → `Status: done` (optional `Completed:` timestamp)

### `assign`
Assign a ticket to an owner (updates `Owner:` and creates an assignment stub).

```bash
openclaw recipes assign --team-id <teamId> --ticket 0007 --owner dev
openclaw recipes assign --team-id <teamId> --ticket 0007 --owner lead
```

Owners (current): `dev|devops|lead|test`.

### `take`
Shortcut: assign + move to in-progress.

```bash
openclaw recipes take --team-id <teamId> --ticket 0007 --owner dev
```

### `handoff`
QA handoff in one step: move a ticket to `work/testing/`, set `Status: testing`, assign to a tester (default `test`), and write/update the assignment stub.

```bash
openclaw recipes handoff --team-id <teamId> --ticket 0007
openclaw recipes handoff --team-id <teamId> --ticket 0007 --tester test
```

Notes:
- Creates `work/testing/` if missing.
- Idempotent: if the ticket is already in `work/testing/`, it won’t re-move it; it will ensure fields + assignment stub.

### `complete`
Shortcut: move to done + ensure `Status: done` + add `Completed:` timestamp. No confirmation prompt.

```bash
openclaw recipes complete --team-id <teamId> --ticket 0007
```

## `workflows <subcommand>`

Workflow runner utilities (file-first runs, runner/worker model).

```bash
openclaw recipes workflows --help
```

Common commands:

```bash
# Run a workflow once (manual trigger)
openclaw recipes workflows run --team-id <teamId> --workflow-file <file.workflow.json>

# Runner (scheduler)
openclaw recipes workflows runner-once --team-id <teamId>
openclaw recipes workflows runner-tick --team-id <teamId>

# Worker (executor) — pull-based per-agent queue
openclaw recipes workflows worker-tick --team-id <teamId> --agent-id <agentId>

# Approval gating
openclaw recipes workflows approve --team-id <teamId> --run-id <runId> --decision approve
openclaw recipes workflows resume --team-id <teamId> --run-id <runId>
openclaw recipes workflows poll-approvals --team-id <teamId>
```

See: `docs/WORKFLOW_RUNS_FILE_FIRST.md`
