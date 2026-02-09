# Agents and skills (OpenClaw + Clawcipes)

This doc explains the mental model: **what an agent is**, how **skills/tools** work, and how Clawcipes helps you build agents + teams.

## What is an agent?
In OpenClaw, an **agent** is a configured assistant persona with:
- a **workspace folder** (where it reads/writes files)
- optional **identity** (name, avatar, emoji, tone)
- a **tool policy** (what tools it is allowed to use)
- a **model** configuration (defaults come from OpenClaw)

In Clawcipes, an agent is typically created by scaffolding a folder like:

```
~/.openclaw/workspace/agents/<agentId>/
  SOUL.md
  AGENTS.md
  ...other recipe files...
```

### Why separate agents?
- Separation of concerns (research vs writing vs devops)
- Cleaner prompts/personas
- Safer tool permissions (e.g., only DevOps gets automation)
- Clear ownership of outputs (each agent writes to its own workspace)

## What is a skill?
A **skill** is a packaged integration or capability (e.g. Gmail, Calendar, Places search, Twitter/X tooling).

Skills can provide:
- tools/actions (e.g., `gog gmail ...`, `local-places ...`)
- configuration schemas / env vars
- helper scripts or CLIs

In OpenClaw, skills are surfaced as tools the agent can use.

## Tool policies (allow/deny)
Every agent can have a tool policy in OpenClaw config (written via `--apply-config` when scaffolding).

Clawcipes recipes commonly use:
- `allow: ["group:fs", "group:web"]` for safe file + web access
- `allow: ["group:runtime"]` when the agent needs to run local commands
- `allow: ["group:automation"]` for automation-oriented tools
- `deny: ["exec"]` for safety on agents that shouldn’t execute commands

The intent:
- Most agents should **not** have `exec`.
- Only agents that truly need it (dev/devops) should get runtime/exec capabilities.

## Installing skills (workspace-local)
Clawcipes favors **workspace-local** installs so each OpenClaw workspace is self-contained.

### Install a skill slug
```bash
openclaw recipes install <skill-slug>
# or non-interactive:
openclaw recipes install <skill-slug> --yes
```

This runs ClawHub under the hood and installs into:
- `~/.openclaw/workspace/skills/<skill-slug>` (by default)

### Install the skills required by a recipe
If a recipe declares skills in `requiredSkills` or `optionalSkills`:

```bash
openclaw recipes install <recipe-id>
```

That installs the recipe’s declared skills.

### Removing a skill
Clawcipes currently does **not** implement a remove command.

To remove a workspace-local skill:
- delete the folder: `~/.openclaw/workspace/skills/<skill-slug>`
- restart: `openclaw gateway restart`

(We can add `openclaw recipes uninstall <slug>` later if you want it to be first-class.)

## Teams: shared workspace + multiple agents
A **team** recipe scaffolds:
- a shared team folder under `teams/<teamId>/...`
- multiple agents under `agents/<teamId>-<role>/...`

The shared workspace is the source of truth for:
- intake (`inbox/`)
- work queue (`work/backlog`, `work/in-progress`, `work/done`)
- assignments (`work/assignments`)
- deliverables (`outbox/`)

## How to create your own agents/teams
You have three main options:

1) Use a bundled recipe (fast start)
- `openclaw recipes scaffold-team development-team --team-id my-dev-team-team --apply-config`

2) Write your own recipe in your workspace
- Create: `~/.openclaw/workspace/recipes/my-team.md`
- Then: `openclaw recipes scaffold-team my-team --team-id my-team-team --apply-config`

3) Copy a bundled recipe and modify it
- Use `openclaw recipes show <id>` to view it
- Copy into your workspace recipes dir and edit

Next: read `docs/TUTORIAL_CREATE_RECIPE.md` for a step-by-step guide.
