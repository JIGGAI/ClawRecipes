# Bundled recipes

ClawRecipes ships with bundled recipes in:

```text
recipes/default/
```

You can browse them with:

```bash
openclaw recipes list
openclaw recipes show development-team
```

This doc is the human-friendly guide to what each bundled recipe is for.

---

## Quick picks

If you just want a recommendation:
- want a coding team? → `development-team`
- want a marketing org? → `marketing-team`
- want a social distribution team? → `social-team`
- want a research pipeline? → `research-team`
- want a writing pipeline? → `writing-team`
- want a single coding agent? → `developer`
- want a single planning agent? → `project-manager`

---

## Single-agent recipes

### `project-manager`
Use when you want a lightweight planning/coordination agent.

```bash
openclaw recipes scaffold project-manager --agent-id pm --apply-config
```

### `researcher`
Use when you want a single research-focused agent.

```bash
openclaw recipes scaffold researcher --agent-id researcher --apply-config
```

### `editor`
Use when you want a single editing agent.

```bash
openclaw recipes scaffold editor --agent-id editor --apply-config
```

### `developer`
Use when you want a single developer agent with runtime tooling.

```bash
openclaw recipes scaffold developer --agent-id dev --apply-config
```

---

## Team recipes

### `development-team`
Use when you want a small engineering team with file-first tickets and clear role separation.

Typical scaffold:

```bash
openclaw recipes scaffold-team development-team --team-id development-team --apply-config
```

Typical roles:
- lead
- dev
- devops
- test
n
### `marketing-team`
Use when you want a broad marketing org.

Typical roles include:
- lead
- seo
- copywriter
- ads
- social
- designer
- analyst
- video
- compliance

Scaffold:

```bash
openclaw recipes scaffold-team marketing-team --team-id marketing-team --apply-config
```

### `social-team`
Use when you want social execution and platform-specific distribution.

Scaffold:

```bash
openclaw recipes scaffold-team social-team --team-id social-team --apply-config
```

### `research-team`
Use when you want a citations-first research workflow.

```bash
openclaw recipes scaffold-team research-team --team-id research-team --apply-config
```

### `writing-team`
Use when you want a writing pipeline from brief to edited draft.

```bash
openclaw recipes scaffold-team writing-team --team-id writing-team --apply-config
```

### `customer-support-team`
Use when you want triage → resolution → KB workflow.

```bash
openclaw recipes scaffold-team customer-support-team --team-id customer-support-team --apply-config
```

### `product-team`
Use when you want a product planning and delivery loop.

```bash
openclaw recipes scaffold-team product-team --team-id product-team --apply-config
```

---

## Vertical / specialty team packs

ClawRecipes also ships specialty teams for specific business domains.

Examples may include:
- clinic / healthcare-oriented teams
- law-firm teams
- construction teams
- financial-planner teams
- trader teams

To browse what is currently bundled:

```bash
openclaw recipes list
```

Then inspect the exact one you want:

```bash
openclaw recipes show clinic-team
openclaw recipes show law-firm-team
```

---

## Workflow-related bundled recipes

### `workflow-runner-addon`
Use when you already have a team and want to add workflow-runner capability into it.

Example:

```bash
openclaw recipes add-role \
  --team-id development-team \
  --role workflow-runner \
  --recipe workflow-runner-addon \
  --apply-config
```

### `swarm-orchestrator`
Use when you want an orchestrator-style team helper / coordination workspace.

Inspect it first:

```bash
openclaw recipes show swarm-orchestrator
```

More:
- [SWARM_ORCHESTRATOR.md](SWARM_ORCHESTRATOR.md)

---

## Best way to choose a recipe

1. list recipes
2. inspect the one you think you want
3. scaffold into a test team id
4. look at the generated files before going wider

Example:

```bash
openclaw recipes list
openclaw recipes show development-team
openclaw recipes scaffold-team development-team --team-id dev-sandbox-team --apply-config
```
