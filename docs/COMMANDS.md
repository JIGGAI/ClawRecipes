# ClawRecipes command reference

All commands are under:

```bash
openclaw recipes <command>
```

This page is organized by the jobs humans actually need to do.

---

## 1) Browse recipes

### List all recipes

```bash
openclaw recipes list
```

### Show one recipe

```bash
openclaw recipes show development-team
```

### Check recipe status / missing skills

```bash
openclaw recipes status
openclaw recipes status development-team
```

---

## 2) Install recipes and skills

### Install a marketplace recipe into your workspace

```bash
openclaw recipes install development-team
openclaw recipes install clinic-team --overwrite
```

Optional:
- `--registry-base <url>`
- `--overwrite`

Alias:

```bash
openclaw recipes install-recipe development-team
```

### Install a skill from ClawHub

```bash
# global
openclaw recipes install-skill agentchat --yes

# scoped to one agent
openclaw recipes install-skill agentchat --yes --agent-id dev

# scoped to one team
openclaw recipes install-skill agentchat --yes --team-id development-team
```

Options:
- `--yes`
- `--global`
- `--agent-id <id>`
- `--team-id <id>`

---

## 3) Scaffold agents and teams

### Scaffold a single agent

```bash
openclaw recipes scaffold project-manager \
  --agent-id pm \
  --name "Project Manager" \
  --apply-config
```

Useful options:
- `--agent-id <id>`
- `--name <name>`
- `--recipe-id <recipeId>`
- `--auto-increment`
- `--overwrite-recipe`
- `--overwrite`
- `--apply-config`

What it writes:
- `~/.openclaw/workspace-<agentId>/...`
- workspace recipe file under `~/.openclaw/workspace/recipes/`

### Scaffold a team

```bash
openclaw recipes scaffold-team development-team \
  --team-id development-team \
  --apply-config \
  --overwrite
```

Useful options:
- `--team-id <teamId>`
- `--recipe-id <recipeId>`
- `--auto-increment`
- `--overwrite-recipe`
- `--overwrite`
- `--apply-config`

What it writes:
- `~/.openclaw/workspace-<teamId>/...`
- role folders under `roles/`
- ticket lanes under `work/`
- workspace recipe file under `~/.openclaw/workspace/recipes/`

### Add a role to an existing team

```bash
openclaw recipes add-role \
  --team-id development-team \
  --role workflow-runner \
  --recipe workflow-runner-addon \
  --apply-config
```

Useful options:
- `--team-id <teamId>`
- `--role <role>`
- `--recipe <recipeId>`
- `--agent-id <agentId>`
- `--apply-config`
- `--overwrite`
- `--no-cron`

---

## 4) Work the file-first ticket flow

The normal lane flow is:

```text
backlog → in-progress → testing → done
```

### Turn a request into a ticket

```bash
openclaw recipes dispatch \
  --team-id development-team \
  --owner lead \
  --request "Add a customer-support team recipe"
```

Options:
- `--team-id <teamId>`
- `--request <text>`
- `--owner dev|devops|lead|test`
- `--yes`

### List tickets

```bash
openclaw recipes tickets --team-id development-team
openclaw recipes tickets --team-id development-team --json
```

### Move a ticket between lanes

```bash
openclaw recipes move-ticket --team-id development-team --ticket 0007 --to in-progress
openclaw recipes move-ticket --team-id development-team --ticket 0007 --to testing
openclaw recipes move-ticket --team-id development-team --ticket 0007 --to done --completed
```

Options:
- `--team-id <teamId>`
- `--ticket <ticket>`
- `--to backlog|in-progress|testing|done`
- `--completed`
- `--yes`

### Assign a ticket

```bash
openclaw recipes assign --team-id development-team --ticket 0007 --owner dev
openclaw recipes assign --team-id development-team --ticket 0007 --owner lead
```

Options:
- `--team-id <teamId>`
- `--ticket <ticket>`
- `--owner dev|devops|lead|test`
- `--overwrite`
- `--yes`

### Take a ticket

Shortcut for assign + move to in-progress.

```bash
openclaw recipes take --team-id development-team --ticket 0007 --owner dev
```

### Handoff to testing

```bash
openclaw recipes handoff --team-id development-team --ticket 0007
openclaw recipes handoff --team-id development-team --ticket 0007 --tester test
```

### Complete a ticket

```bash
openclaw recipes complete --team-id development-team --ticket 0007
```

### Clean up stale assignment stubs for done work

```bash
openclaw recipes cleanup-closed-assignments --team-id development-team
openclaw recipes cleanup-closed-assignments --team-id development-team --ticket 0050 0064
```

---

## 5) Workflows

Use these when you are running file-first workflows from `shared-context/workflows/`.

### See workflow command help

```bash
openclaw recipes workflows --help
```

### Run one workflow manually

```bash
openclaw recipes workflows run \
  --team-id development-team \
  --workflow-file marketing.workflow.json
```

### Runner commands

```bash
openclaw recipes workflows runner-once --team-id development-team

openclaw recipes workflows runner-tick \
  --team-id development-team \
  --concurrency 2 \
  --lease-seconds 120
```

### Worker commands

```bash
openclaw recipes workflows worker-tick \
  --team-id development-team \
  --agent-id development-team-lead \
  --limit 10
```

### Approval commands

```bash
openclaw recipes workflows approve \
  --team-id development-team \
  --run-id <runId> \
  --approved true

openclaw recipes workflows approve \
  --team-id development-team \
  --run-id <runId> \
  --approved false \
  --note "Rewrite the hook"

openclaw recipes workflows resume \
  --team-id development-team \
  --run-id <runId>

openclaw recipes workflows poll-approvals \
  --team-id development-team \
  --limit 20
```

### Important workflow note

After installing ClawRecipes, workflows may still need optional pieces turned on.

Examples:
- LLM workflows may require the built-in `llm-task` plugin to be enabled
- publishing workflows may require `outbound.post` config or a local posting patch to be reapplied

So if you install the plugin and then say "the workflow exists but does not fully work," check the optional workflow dependencies next.

More:
- [WORKFLOW_RUNS_FILE_FIRST.md](WORKFLOW_RUNS_FILE_FIRST.md) — node kinds, triggers, runs, edges, runner/worker model, approvals
- [WORKFLOW_EXAMPLES.md](WORKFLOW_EXAMPLES.md) — copy-paste workflow patterns
- [OUTBOUND_POSTING.md](OUTBOUND_POSTING.md) — publishing/posting behavior and setup

---

## 6) Bindings

Bindings route messages/traffic to the right agent.

### Show bindings

```bash
openclaw recipes bindings
```

### Add a binding

```bash
openclaw recipes bind \
  --agent-id dev \
  --channel telegram \
  --peer-kind dm \
  --peer-id 6477250615
```

### Remove a binding

```bash
openclaw recipes unbind \
  --agent-id dev \
  --channel telegram \
  --peer-kind dm \
  --peer-id 6477250615
```

---

## 7) Migrate / remove / clean up

### Migrate a legacy team layout

```bash
openclaw recipes migrate-team --team-id development-team --dry-run
openclaw recipes migrate-team --team-id development-team --mode move
```

### Remove a team safely

```bash
openclaw recipes remove-team --team-id development-team --plan --json
openclaw recipes remove-team --team-id development-team --yes
```

### Clean up temporary workspaces

```bash
# dry-run
openclaw recipes cleanup-workspaces

# delete allowed temp prefixes
openclaw recipes cleanup-workspaces --prefix smoke- --prefix qa- --yes

# json output
openclaw recipes cleanup-workspaces --json
```

---

## Fastest useful command set

If you only want the high-value commands:

```bash
openclaw recipes list
openclaw recipes scaffold-team development-team --team-id development-team --apply-config
openclaw recipes dispatch --team-id development-team --owner lead --request "Do a thing"
openclaw recipes tickets --team-id development-team
openclaw recipes take --team-id development-team --ticket 0001 --owner dev
openclaw recipes handoff --team-id development-team --ticket 0001
openclaw recipes complete --team-id development-team --ticket 0001
```
