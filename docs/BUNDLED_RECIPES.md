# Bundled recipes

Clawcipes ships with a few recipes in `recipes/default/`.

You can:
- list them: `openclaw recipes list`
- inspect them: `openclaw recipes show <id>`

Below is a guided explanation of what each bundled recipe does.

## 1) `project-manager` (agent)
**Kind:** agent

**Use when:** you want a lightweight agent that keeps plans tidy and maintains a cadence.

Scaffold:
```bash
openclaw recipes scaffold project-manager --agent-id pm --name "Project Manager" --apply-config
```

What it writes:
- `agents/pm/SOUL.md`
- `agents/pm/AGENTS.md`

Default tool policy (recipe-defined):
- allows: `group:fs`, `group:web`, plus `cron` and `message`
- denies: `exec`

## 2) `social-team` (team)
**Kind:** team

**Use when:** you want a multi-role social pipeline: lead + research + writer + editor.

Scaffold:
```bash
openclaw recipes scaffold-team social-team --team-id social-team-team --apply-config
```

What it creates:
- `teams/social-team-team/` shared workspace
- agents:
  - `agents/social-team-team-lead/`
  - `agents/social-team-team-research/`
  - `agents/social-team-team-writer/`
  - `agents/social-team-team-editor/`

Notes:
- Default `tools` in the recipe deny `exec` (safer by default).

## 3) `development-team` (team)
**Kind:** team

**Use when:** you want a small engineering team with a file-first ticket queue.

Scaffold:
```bash
openclaw recipes scaffold-team development-team --team-id development-team-team --apply-config
```

What it creates:
- `teams/development-team-team/` shared workspace
- agents:
  - `agents/development-team-team-lead/`
  - `agents/development-team-team-dev/`
  - `agents/development-team-team-devops/`

Special features:
- A strict ticket workflow documented in the lead’s `AGENTS.md`.
- Recommended ticket naming: `0001-...md`, `0002-...md`, etc.
- Tool policies intended for real work:
  - lead: includes runtime + automation
  - dev: includes runtime
  - devops: includes runtime + automation

## Copying and modifying bundled recipes
A good workflow is:
1) Inspect:
```bash
openclaw recipes show development-team > /tmp/development-team.md
```

2) Copy into your workspace recipes folder:
```bash
cp /tmp/development-team.md ~/.openclaw/workspace/recipes/my-dev-team.md
```

3) Edit the new recipe file and scaffold it.
