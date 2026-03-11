# ClawRecipes

<p align="center">
  <img src="https://github.com/JIGGAI/ClawRecipes/blob/main/clawcipes_cook.jpg" alt="ClawRecipes logo" width="240" />
</p>

ClawRecipes is an **OpenClaw plugin** for scaffolding agents, teams, and file-first workflows from Markdown recipes.

If you want the short version:
- install the plugin
- scaffold a team or agent
- dispatch work into tickets
- run the file-first workflow
- optionally use **ClawKitchen** for a UI on top

ClawRecipes is **CLI-first**. It works without a UI.

---

## What ClawRecipes does

ClawRecipes gives you:
- **recipes** written in Markdown
- **agent scaffolding** (`openclaw recipes scaffold`)
- **team scaffolding** (`openclaw recipes scaffold-team`)
- **file-first ticket workflow** (`dispatch → backlog → in-progress → testing → done`)
- **workflow runner utilities** for scheduled / approval-gated workflows
- **workspace recipe installs** from the marketplace
- **ClawHub skill installs** for agents or teams

It is built for people who want durable artifacts on disk, not hidden app state.

---

## Quickstart

### 1) Install the plugin

**From npm**

```bash
openclaw plugins install @jiggai/recipes
openclaw gateway restart
openclaw plugins list
```

**From a local checkout**

```bash
git clone https://github.com/JIGGAI/ClawRecipes.git ~/ClawRecipes
openclaw plugins install --link ~/ClawRecipes
openclaw gateway restart
openclaw plugins list
```

Then verify the commands exist:

```bash
openclaw recipes list
```

More install details: [docs/INSTALLATION.md](docs/INSTALLATION.md)

---

### 2) See what recipes you have

```bash
openclaw recipes list
openclaw recipes show development-team
openclaw recipes status development-team
```

---

### 3) Scaffold a team

```bash
openclaw recipes scaffold-team development-team \
  --team-id development-team \
  --apply-config \
  --overwrite
```

This creates:
- `~/.openclaw/workspace-development-team/`
- team roles under `roles/`
- ticket lanes under `work/`
- optional OpenClaw agent config entries (when `--apply-config` is used)

---

### 4) Put work into the system

```bash
openclaw recipes dispatch \
  --team-id development-team \
  --owner lead \
  --request "Add a new clinic-team recipe"
```

Then work the ticket flow:

```bash
openclaw recipes tickets --team-id development-team
openclaw recipes take --team-id development-team --ticket 0001 --owner dev
openclaw recipes handoff --team-id development-team --ticket 0001
openclaw recipes complete --team-id development-team --ticket 0001
```

---

## Workflow support

ClawRecipes supports **file-first workflows** with:
- workflow JSON files under `shared-context/workflows/`
- workflow runs under `shared-context/workflow-runs/`
- runner / worker execution model
- approval-gated steps
- tool nodes
- LLM nodes

### Basic workflow commands

```bash
# Run one workflow manually
openclaw recipes workflows run \
  --team-id development-team \
  --workflow-file marketing.workflow.json

# Scheduler / runner
openclaw recipes workflows runner-once --team-id development-team
openclaw recipes workflows runner-tick --team-id development-team --concurrency 2

# Worker / executor
openclaw recipes workflows worker-tick \
  --team-id development-team \
  --agent-id development-team-lead
```

### Approval flow commands

```bash
# approve
openclaw recipes workflows approve \
  --team-id development-team \
  --run-id <runId> \
  --approved true

# reject with note
openclaw recipes workflows approve \
  --team-id development-team \
  --run-id <runId> \
  --approved false \
  --note "Tighten the X post hook"

# resume an awaiting run
openclaw recipes workflows resume \
  --team-id development-team \
  --run-id <runId>
```

See also:
- [docs/WORKFLOW_RUNS_FILE_FIRST.md](docs/WORKFLOW_RUNS_FILE_FIRST.md)
- [docs/OUTBOUND_POSTING.md](docs/OUTBOUND_POSTING.md)

---

## Important workflow posting note

This is the part most people trip over.

### What ships by default
Published ClawRecipes builds are intentionally conservative:
- **workflow posting side effects are not automatically turned on for every install**
- the old local `marketing.post_all` posting path is **not something users should assume is active** after install

### What you should do after installing
If you want workflows that actually publish content:

**Recommended path**
- use `outbound.post`
- configure an outbound posting service
- keep approval gates in the workflow

**Local-controller / patched path**
- if you are using a local controller-specific patch for workflow posting, you must **apply that patch after install/update**
- and you may need to **explicitly tell your assistant to turn workflow posting back on** for your local environment

In plain English:
- installing ClawRecipes does **not** mean "workflow posting is live"
- you must either:
  1. configure the supported outbound posting path, or
  2. reapply your local posting patch after install/update

If you are using RJ's local controller flow, document and keep your patch handy.

---

## Common commands

### Recipes

```bash
openclaw recipes list
openclaw recipes show development-team
openclaw recipes install clinic-team
```

### Agents and teams

```bash
# single agent
openclaw recipes scaffold project-manager --agent-id pm --apply-config

# team
openclaw recipes scaffold-team development-team --team-id development-team --apply-config

# add a role into an existing team
openclaw recipes add-role \
  --team-id development-team \
  --role workflow-runner \
  --recipe workflow-runner-addon \
  --apply-config
```

### Ticket workflow

```bash
openclaw recipes tickets --team-id development-team
openclaw recipes move-ticket --team-id development-team --ticket 0007 --to in-progress
openclaw recipes assign --team-id development-team --ticket 0007 --owner dev
openclaw recipes take --team-id development-team --ticket 0007 --owner dev
openclaw recipes handoff --team-id development-team --ticket 0007 --tester test
openclaw recipes complete --team-id development-team --ticket 0007
openclaw recipes cleanup-closed-assignments --team-id development-team
```

### Bindings

```bash
openclaw recipes bindings
openclaw recipes bind --agent-id dev --channel telegram --peer-kind dm --peer-id 6477250615
openclaw recipes unbind --agent-id dev --channel telegram --peer-kind dm --peer-id 6477250615
```

### Cleanup / removal

```bash
openclaw recipes cleanup-workspaces
openclaw recipes cleanup-workspaces --prefix smoke- --yes
openclaw recipes remove-team --team-id development-team --plan --json
openclaw recipes remove-team --team-id development-team --yes
```

Full reference: [docs/COMMANDS.md](docs/COMMANDS.md)

---

## Recommended docs order for humans

If you are new, read these in order:

1. [Installation](docs/INSTALLATION.md)
2. [Commands](docs/COMMANDS.md)
3. [Team workflow](docs/TEAM_WORKFLOW.md)
4. [Workflow runs](docs/WORKFLOW_RUNS_FILE_FIRST.md)
5. [Workflow examples](docs/WORKFLOW_EXAMPLES.md)
6. [Outbound posting](docs/OUTBOUND_POSTING.md)
7. [Memory system](docs/MEMORY_SYSTEM.md)
8. [Swarm Orchestrator](docs/SWARM_ORCHESTRATOR.md)

If you are building recipes:

1. [Recipe format](docs/RECIPE_FORMAT.md)
2. [Create recipe tutorial](docs/TUTORIAL_CREATE_RECIPE.md)
3. [Bundled recipes](docs/BUNDLED_RECIPES.md)

If you are contributing to the codebase:

1. [Architecture](docs/ARCHITECTURE.md)
2. [Contributing](CONTRIBUTING.md)
3. [Releasing](docs/releasing.md)

---

## ClawKitchen

If you want a UI for teams, workflows, goals, approvals, and management, use:
- **ClawKitchen**: https://github.com/JIGGAI/ClawKitchen

ClawKitchen is optional. ClawRecipes works without it.

More: [docs/CLAWCIPES_KITCHEN.md](docs/CLAWCIPES_KITCHEN.md)

---

## Development

```bash
npm test
npm run test:coverage
npm run smell-check
```

---

## License

ClawRecipes is licensed under **Apache-2.0**.
