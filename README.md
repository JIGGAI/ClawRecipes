# Clawcipes (OpenClaw Recipes Plugin)

Clawcipes is an OpenClaw plugin that provides **CLI-first "recipes"** for scaffolding specialist agents and teams from Markdown.

## Features
- `openclaw recipes list|show|status` — discover and inspect recipes
- `openclaw recipes scaffold` — scaffold a single agent from a recipe
- `openclaw recipes scaffold-team` — scaffold a team workspace + multiple agents
- `openclaw recipes install <idOrSlug> [--yes]` — confirmation-gated, workspace-local skill installs via ClawHub
- `openclaw recipes dispatch --team-id <teamId> ...` — dispatcher flow: request → inbox + backlog ticket + assignment stub

## Install (dev)
This repo is typically installed into OpenClaw via a local path install:

```bash
openclaw plugins install -l ~/Sites/clawcipes
openclaw plugins list
```

## Notes
- Workspace-local skills directory is `~/.openclaw/workspace/skills` by default.
- Team workspaces live under `~/.openclaw/workspace/teams/<teamId>/`.

## Development
```bash
npm install
# (OpenClaw loads the plugin from index.ts directly)
```
