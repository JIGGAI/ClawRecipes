# Agents and skills

This doc explains the practical mental model behind agents, teams, tools, and skills in ClawRecipes.

---

## What is an agent?

In OpenClaw, an agent is a configured assistant with:
- a workspace
- an identity/persona
- tool permissions
- a model/runtime configuration

In ClawRecipes, an **agent recipe** scaffolds that into a folder like:

```text
~/.openclaw/workspace-<agentId>/
```

Typical files include:
- `SOUL.md`
- `AGENTS.md`
- `TOOLS.md`

---

## What is a team?

A team is a set of role agents sharing one workspace root.

Example:

```text
~/.openclaw/workspace-development-team/
```

Inside that workspace you usually get:
- `work/` ticket lanes
- `roles/` role folders
- `shared/` artifacts
- `notes/` planning/status docs

Role agent ids usually look like:

```text
development-team-lead
development-team-dev
development-team-test
```

---

## What is a skill?

A skill is a packaged capability.

Examples:
- Gmail / Calendar tools
- web / places integrations
- social/X tooling
- helper CLIs or packaged instructions

Skills can expose tools, configuration, scripts, or helper behavior.

---

## Tool policy: what an agent is allowed to do

Recipes can define tool policy and apply it into OpenClaw config when you scaffold with `--apply-config`.

Common patterns:

### Safe-by-default

```yaml
tools:
  profile: coding
  allow: ["group:fs", "group:web"]
  deny: ["exec"]
```

### Dev / devops style

```yaml
tools:
  profile: coding
  allow: ["group:fs", "group:web", "group:runtime"]
  deny: []
```

### About `exec`
`exec` is the shell-command tool.

If an agent needs to run commands like:
- `npm test`
- `git status`
- `pnpm build`
- `pytest`

then its runtime/tool policy must allow that capability.

---

## How to change an agent after scaffolding

There are two layers.

### 1) Workspace files
Edit the agent/team files directly:
- `SOUL.md`
- `AGENTS.md`
- `TOOLS.md`
- notes/status docs

### 2) OpenClaw config
If you need to change permissions, identity, or config-level behavior, update the OpenClaw agent config.

A common way is to re-run scaffold with `--apply-config`.

Examples:

```bash
openclaw recipes scaffold project-manager --agent-id pm --overwrite --apply-config
openclaw recipes scaffold-team development-team --team-id development-team --overwrite --apply-config
openclaw gateway restart
```

---

## Installing skills

### Install a single skill globally

```bash
openclaw recipes install-skill agentchat --yes
```

### Install a skill for one agent

```bash
openclaw recipes install-skill agentchat --yes --agent-id dev
```

### Install a skill for one team

```bash
openclaw recipes install-skill agentchat --yes --team-id development-team
```

### Install the skills declared by a recipe

```bash
openclaw recipes install-skill development-team --yes
```

---

## Where skills get installed

By default:
- global skills → `~/.openclaw/skills/`
- agent-scoped skills → `~/.openclaw/workspace-<agentId>/skills/`
- team-scoped skills → `~/.openclaw/workspace-<teamId>/skills/`

---

## Removing skills

There is not currently a first-class ClawRecipes remove-skill command.

For now, remove the skill folder manually and restart the gateway.

---

## Removing a team

```bash
openclaw recipes remove-team --team-id development-team --plan --json
openclaw recipes remove-team --team-id development-team --yes
openclaw gateway restart
```

This is safer than manually deleting everything by hand.

---

## Good practical advice

- keep high-risk tools limited to the roles that actually need them
- encode durable tool-policy changes in the recipe, not just ad hoc config edits
- use team workspaces when you want collaboration and durable ticket lanes
- use single agents when you want one specialized role without the extra team machinery

---

## Useful next reads

- [TEAM_WORKFLOW.md](TEAM_WORKFLOW.md)
- [RECIPE_FORMAT.md](RECIPE_FORMAT.md)
- [COMMANDS.md](COMMANDS.md)
