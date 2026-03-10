# Recipe format

ClawRecipes recipes are Markdown files with YAML frontmatter.

They come in two flavors:
- **agent** recipes — scaffold one agent workspace
- **team** recipes — scaffold a shared team workspace plus role agents

This doc explains the format you actually need to write.

---

## Where recipes live

Recipes are discovered from:
- built-in plugin recipes: `recipes/default/*.md`
- workspace recipes: `~/.openclaw/workspace/recipes/*.md`

You can inspect available recipes with:

```bash
openclaw recipes list
openclaw recipes show development-team
```

---

## Smallest useful recipe

```md
---
id: project-manager
name: Project Manager
kind: agent
version: 0.1.0
description: A lightweight planning agent
---

# Project Manager

This is a simple recipe.
```

---

## Common frontmatter fields

```yaml
---
id: development-team
name: Development Team
kind: team
version: 0.1.0
description: File-first engineering team
requiredSkills:
  - some-skill
optionalSkills:
  - another-skill
---
```

### Field meanings
- `id` — stable recipe id
- `name` — human-readable name
- `kind` — `agent` or `team`
- `version` — recipe version string
- `description` — short summary
- `requiredSkills` — skills the recipe really needs
- `optionalSkills` — nice-to-have skills

---

## Agent recipe example

```md
---
id: project-manager
name: Project Manager
kind: agent
version: 0.1.0
description: Keeps plans and tasks organized

templates:
  soul: |
    # SOUL.md

    You are a project manager.

  agents: |
    # AGENTS.md

    Track work clearly.

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

# Project Manager
```

Scaffold it with:

```bash
openclaw recipes scaffold project-manager --agent-id pm --apply-config
```

---

## Team recipe example

```md
---
id: my-team
name: My Team
kind: team
version: 0.1.0
description: Tiny file-first team

team:
  teamId: my-team
  name: My Team

agents:
  - role: lead
    name: Team Lead
  - role: dev
    name: Developer

templates:
  lead.soul: |
    # SOUL.md
    You are the lead.

  dev.soul: |
    # SOUL.md
    You are the developer.

files:
  - path: SOUL.md
    template: soul
    mode: createOnly
---

# My Team
```

Scaffold it with:

```bash
openclaw recipes scaffold-team my-team --team-id my-team --apply-config
```

---

## Team ids and agent ids

Important rule:
- team ids used with `scaffold-team` must end with `-team` in many real setups / conventions

Role agent ids normally become:

```text
<teamId>-<role>
```

Examples:
- `development-team-lead`
- `development-team-dev`
- `development-team-test`

---

## Templates and files

### `templates`
`templates` is a string map of template names to template bodies.

### `files`
`files` tells ClawRecipes which files to write into the scaffolded workspace.

Example:

```yaml
files:
  - path: SOUL.md
    template: soul
    mode: createOnly
  - path: AGENTS.md
    template: agents
    mode: overwrite
```

### Template rendering
Rendering is intentionally simple:
- `{{var}}` replacement only
- no conditionals
- no code execution

Common variables include:
- `agentId`
- `agentName`
- `teamId`
- `teamDir`

---

## Tools policy

Recipes can write tool policy into agent config when you scaffold with `--apply-config`.

Example:

```yaml
tools:
  profile: coding
  allow:
    - group:fs
    - group:web
    - group:runtime
  deny: []
```

Team recipes can also define per-agent tool policies.

---

## Cron jobs

Recipes can optionally define cron jobs.

Example:

```yaml
cronJobs:
  - id: daily-review
    schedule: "0 14 * * 1-5"
    message: "Review inbox and summarize priorities."
    enabledByDefault: false
    timezone: "America/New_York"
```

Notes:
- use valid **5-field cron**
- keep `id` stable
- ClawRecipes can install/reconcile these during scaffold

---

## Skill declarations

If a recipe declares skills, you can install them with:

```bash
openclaw recipes install-skill my-team --yes
```

That installs the recipe’s declared `requiredSkills` / `optionalSkills`.

---

## Recommended conventions

- keep recipes small and readable
- keep `requiredSkills` minimal
- use `optionalSkills` for non-essential extras
- prefer file-first workflows
- make the generated workspace obvious to a human reader
- include enough commands/examples in generated docs that a user can actually run the system

---

## Good next steps

After reading this, do one of these:

```bash
openclaw recipes show development-team
openclaw recipes show workflow-runner-addon
```

Then read:
- [TUTORIAL_CREATE_RECIPE.md](TUTORIAL_CREATE_RECIPE.md)
- [BUNDLED_RECIPES.md](BUNDLED_RECIPES.md)
