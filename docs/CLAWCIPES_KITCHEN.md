# ClawKitchen and ClawRecipes

ClawKitchen is the UI companion for ClawRecipes.

Use this doc if you want to understand the relationship between the two.

---

## Short version

- **ClawRecipes** = the plugin, commands, file-first workspaces, workflows, ticket flow
- **ClawKitchen** = the UI on top

You do **not** need ClawKitchen to use ClawRecipes.

You **can** use ClawKitchen to make ClawRecipes easier to manage.

---

## What ClawKitchen is good at

ClawKitchen is useful for:
- browsing teams and roles
- managing scaffolded teams
- seeing ticket lanes visually
- viewing workflow activity
- reviewing approvals
- guiding setup with a UI instead of raw files/CLI

---

## What still lives in ClawRecipes

Even if you use ClawKitchen, the source of truth is still mostly file-first.

ClawRecipes owns:
- recipe scaffolding
- workspace layout
- ticket files
- workflow files
- workflow run artifacts
- CLI commands

ClawKitchen is the management layer, not a replacement for the plugin.

---

## Workflow note

Workflows depend on ClawRecipes features being present and, for some setups, on optional plugin/tooling being enabled after install.

Examples:
- LLM nodes may require the built-in `llm-task` plugin to be enabled
- publish/posting behavior may require outbound posting config or a local patch

So when a user says "I installed everything, why doesn't the workflow fully work?" the answer is often:
- the plugin is installed
- but an optional workflow dependency still needs to be enabled/configured

---

## Good mental model

Think of it like this:

- ClawRecipes builds and runs the machine
- ClawKitchen gives you the dashboard

Both matter.

But if you are debugging behavior, always confirm the underlying ClawRecipes files/commands first.
