# Tutorial: create your first recipe

This tutorial shows how to create a simple **team recipe** from scratch.

By the end, you will:
- create a recipe file
- scaffold a team
- dispatch a ticket
- move work through the file-first flow

---

## Step 0 — confirm ClawRecipes is installed

```bash
openclaw plugins list
openclaw recipes list
```

If that fails, go back to [INSTALLATION.md](INSTALLATION.md).

---

## Step 1 — create a recipe file

Create this file:

```text
~/.openclaw/workspace/recipes/my-first-team.md
```

Paste this in:

```md
---
id: my-first-team
name: My First Team
kind: team
version: 0.1.0
description: A tiny demo team
requiredSkills: []

team:
  teamId: my-first-team
  name: My First Team

agents:
  - role: lead
    name: Team Lead
    tools:
      profile: coding
      allow: ["group:fs", "group:web"]
      deny: ["exec"]

  - role: worker
    name: Worker
    tools:
      profile: coding
      allow: ["group:fs", "group:web"]
      deny: ["exec"]

templates:
  lead.soul: |
    # SOUL.md

    You are the lead for {{teamId}}.
    Turn requests into clear tickets.

  lead.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    Do this:
    - check inbox/
    - create backlog tickets
    - assign work clearly

  worker.soul: |
    # SOUL.md

    You are a worker on {{teamId}}.

  worker.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    Do this:
    - pick assigned work
    - move it to in-progress
    - do the work
    - hand off to testing when ready

files:
  - path: SOUL.md
    template: soul
    mode: createOnly
  - path: AGENTS.md
    template: agents
    mode: createOnly

tools:
  profile: coding
  allow: ["group:fs", "group:web"]
  deny: ["exec"]
---

# My First Team

This is a tutorial recipe.
```

---

## Step 2 — scaffold the team

```bash
openclaw recipes scaffold-team my-first-team \
  --team-id my-first-team \
  --apply-config
```

You should now have a shared workspace like:

```text
~/.openclaw/workspace-my-first-team/
```

Look around:

```bash
find ~/.openclaw/workspace-my-first-team -maxdepth 3 -type f | sort | head -n 50
```

---

## Step 3 — create work

Dispatch a request into the team:

```bash
openclaw recipes dispatch \
  --team-id my-first-team \
  --owner lead \
  --request "Draft a welcome README for this team"
```

Now inspect tickets:

```bash
openclaw recipes tickets --team-id my-first-team
```

---

## Step 4 — move work through the lanes

Start the ticket:

```bash
openclaw recipes take --team-id my-first-team --ticket 0001 --owner worker
```

Hand it to testing:

```bash
openclaw recipes handoff --team-id my-first-team --ticket 0001
```

Complete it:

```bash
openclaw recipes complete --team-id my-first-team --ticket 0001
```

---

## Step 5 — inspect the generated workspace

Useful commands:

```bash
find ~/.openclaw/workspace-my-first-team/work -maxdepth 2 -type f | sort
cat ~/.openclaw/workspace-my-first-team/work/done/0001-*.md
```

This is the whole point: the team’s work is visible and durable on disk.

---

## Common mistakes

### Using the wrong team id
Use a stable team id and keep it consistent.

### Forgetting `--apply-config`
If you want agent config entries written automatically, include `--apply-config`.

### Expecting magic after install
ClawRecipes gives you the scaffolding and workflow system, but optional workflow features (LLM nodes, posting, etc.) may still require extra setup depending on your environment.

---

## Next steps

Read these next:
- [RECIPE_FORMAT.md](RECIPE_FORMAT.md)
- [TEAM_WORKFLOW.md](TEAM_WORKFLOW.md)
- [WORKFLOW_RUNS_FILE_FIRST.md](WORKFLOW_RUNS_FILE_FIRST.md)

And inspect a bundled recipe:

```bash
openclaw recipes show development-team
```
