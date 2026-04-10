# Bundled workflow examples

ClawRecipes ships four ready-to-run workflow examples under
[`examples/workflows/`](../examples/workflows/). Each example is a copy of a
workflow currently running in production, with all team-specific ids,
credentials, and secrets replaced by placeholders. You can drop any of them
into a freshly scaffolded team, install the matching crons, and run it
end-to-end.

Unlike the hand-rolled snippets in [`WORKFLOW_EXAMPLES.md`](./WORKFLOW_EXAMPLES.md),
these are complete, multi-node, multi-agent workflows. Use this doc if you
want to:

- See what a full production cadence looks like (research → draft → QC →
  approve → post, with optional image/video generation and social-team
  handoff)
- Bootstrap your own team's workflows by copying and adapting one
- Understand the cron setup a real workflow needs

## The four examples at a glance

| Example | Media | Pattern | Agents used |
|---|---|---|---|
| [`marketing-cadence-v1`](../examples/workflows/marketing-cadence-v1/) | none | Self-posting (text only) | analyst, copywriter, compliance, lead |
| [`marketing-image-generation-handoff`](../examples/workflows/marketing-image-generation-handoff/) | image | **Handoff** to social-team workflow | analyst, copywriter, **designer**, compliance, lead |
| [`marketing-video-generation-handoff`](../examples/workflows/marketing-video-generation-handoff/) | video | Self-posting (see note in README) | analyst, copywriter, **designer**, compliance, lead |
| [`social-media-publish`](../examples/workflows/social-media-publish/) | passthrough | Handoff target — publishes via kitchen-plugin-marketing + Postiz | social-team-lead |

Each example directory contains:

- `*.workflow.json` — the workflow definition, ready to copy into a team's
  `shared-context/workflows/` directory
- `cron-jobs.example.json` — the cron jobs required for the workflow, in a
  format suitable for `openclaw cron import --from-file` bulk import
- `install-crons.sh` — the same cron jobs as an idempotent shell script
  using individual `openclaw cron add` calls
- `README.md` — per-example prerequisites, install steps, gotchas, and
  configuration points

## Quick start

### 1. Scaffold the teams

The marketing examples expect `teamId=marketing-team`; the social example
expects `teamId=social-team`. ClawRecipes' built-in recipes create all the
required agents:

```bash
openclaw recipes scaffold --recipe marketing-team --team-id marketing-team
openclaw recipes scaffold --recipe social-team     --team-id social-team
```

If you want different team ids, edit the relevant fields in the workflow
JSON (all `*-team-*` agentId references) and set `TEAM_ID` before running
`install-crons.sh`.

### 2. Copy a workflow into the team's workspace

```bash
cp examples/workflows/marketing-image-generation-handoff/marketing-image-generation-handoff.workflow.json \
  ~/.openclaw/workspace-marketing-team/shared-context/workflows/

cp examples/workflows/social-media-publish/social-media-publish.workflow.json \
  ~/.openclaw/workspace-social-team/shared-context/workflows/
```

### 3. Install the required crons

```bash
bash examples/workflows/marketing-image-generation-handoff/install-crons.sh
bash examples/workflows/social-media-publish/install-crons.sh
```

Or bulk-import via JSON:

```bash
openclaw cron import --from-file examples/workflows/marketing-image-generation-handoff/cron-jobs.example.json
openclaw cron import --from-file examples/workflows/social-media-publish/cron-jobs.example.json
```

### 4. Tune placeholders

Before running, **edit the workflow JSON** to replace the placeholders left
in the examples:

- `<your-telegram-user-id>` — the `approvalTarget` in the marketing examples'
  `meta` block and on the `approval` node
- `<your-postiz-integration-id>` — the `integrationIds` in
  `marketing-image-generation-handoff`'s handoff variable mapping

And (for `social-media-publish`) set the gateway env vars:

- `CK_BASE_URL` — a URL the gateway process can use to reach its own Kitchen
  HTTP endpoints (e.g. `http://127.0.0.1:7777`)
- `CK_AUTH` — `<user>:<password>` for Kitchen basic-auth

### 5. Trigger a run

```bash
openclaw recipes workflows enqueue \
  --team-id marketing-team \
  --workflow-id marketing-image-generation-handoff
```

Or use the ClawKitchen UI: **teams → workflows → Run**.

## Cron requirements

Every workflow requires **two classes of crons** running periodically:

### Runner-tick (1 per team)

`workflow-runner-tick:<teamId>` — claims runs in `queued` status, auto-skips
`start`/`end` nodes, and enqueues the first runnable node onto its owning
agent's worker queue. Without this, new runs never leave `queued`.

Default schedule in bundled example cron files: `*/5 * * * *` (every 5 minutes).
Default timeout: 900 seconds.

### Worker-tick (1 per agent referenced in any workflow)

`workflow-worker:<teamId>:<agentId>` — drains that agent's queue and
executes the node work. Each tick:

1. Dequeues up to 5 tasks from the queue
2. For each task: acquires a per-node lock, loads the run file, resolves
   the node config, executes the node (`llm`, `tool`, `media-*`,
   `human_approval`, `handoff`), writes results, and enqueues the next
   runnable node

Default schedule: `*/5 * * * *`. Default timeout: 120 seconds per session.

### How many crons?

Rule of thumb: **1 runner + N workers per team**, where N is the number of
distinct `agentId` values referenced by any node across all workflows
installed in that team. Worker crons are shared between workflows — if two
workflows both use `marketing-team-lead`, you still only need one lead
worker.

The four bundled examples need:

| Team | Workflows installed | Runners | Workers | Total |
|---|---|---|---|---|
| `marketing-team` | v1 only | 1 | 4 (analyst, copywriter, compliance, lead) | 5 |
| `marketing-team` | v1 + image-handoff | 1 | 5 (+designer) | 6 |
| `marketing-team` | v1 + image-handoff + video-handoff | 1 | 5 | 6 |
| `social-team` | social-media-publish | 1 | 1 (lead) | 2 |

## Gateway concurrency — raise `agents.defaults.maxConcurrent`

> ⚠️ **This is the single most common cause of workflow runs appearing
> "stuck"** on first install.

Every workflow cron fires an isolated agent session through the gateway's
agent system. That session invokes the `openclaw recipes workflows
(runner|worker)-tick` CLI command via the `exec` tool, waits for it, then
responds `NO_REPLY`. Each of those in-flight sessions counts against the
gateway's `agents.defaults.maxConcurrent` limit.

The default is:

```json
"agents": {
  "defaults": {
    "maxConcurrent": 8,
    "subagents": { "maxConcurrent": 8 }
  }
}
```

A minimal marketing+social setup (image-handoff + social-publish) already
runs **1 marketing-runner + 5 marketing-workers + 1 social-runner +
1 social-worker = 8 workflow crons**. Add any memory/heartbeat crons on top
and you are over budget. When that happens:

- Crons back up into a scheduler queue and fire 15–30 minutes later than
  intended
- Workflow runs appear to stall mid-pipeline
- Session failures cascade because nothing can retry while the queue is
  saturated

### Recommended setting for example-backed setups

Edit `~/.openclaw/openclaw.json`:

```json
"agents": {
  "defaults": {
    "maxConcurrent": 24,
    "subagents": { "maxConcurrent": 24 }
  }
}
```

Then restart the gateway:

```bash
openclaw gateway restart
```

Adjust higher if you run many workflows or many teams. A reasonable formula:

> `maxConcurrent ≥ (total workflow crons across all teams) + (other crons firing on overlapping schedules) + 4 headroom`

## Model selection

Bundled cron payloads **do not hard-code a model**. When the gateway runs
a tick session, it falls back to its default model (typically configured
under `agents.defaults.model` in `openclaw.json`).

You can pin a specific model in three ways:

1. **Shell install**: `MODEL=openai/gpt-5.4 bash install-crons.sh`

2. **JSON import**: uncomment the `model` field in the example
   `cron-jobs.example.json` before importing

3. **After install**: `openclaw cron edit <cron-id> --model openai/gpt-5.4`

Worker-tick sessions don't need smart models — they just run one
predictable shell command and respond `NO_REPLY`. A cheap/fast model is
ideal. Runner-ticks similarly just invoke a CLI command.

### ClawKitchen default-cron model override

If you use ClawKitchen's **"Install worker cron(s)"** button in the workflow
editor instead of the bundled example files, you can set a model override
globally via env var on the gateway:

```json
"env": {
  "vars": {
    "KITCHEN_WORKFLOW_CRON_MODEL": "openai/gpt-5.4"
  }
}
```

When set, every workflow cron that Kitchen installs will carry that
`--model` flag. Leave unset to fall back to the gateway default.

You can also override the schedule:

```json
"env": {
  "vars": {
    "KITCHEN_WORKFLOW_CRON_SCHEDULE": "*/10 * * * *"
  }
}
```

## Handoff chain

`marketing-image-generation-handoff` contains a `handoff` node that targets
`social-media-publish`. To use the handoff end-to-end:

1. Install both workflows in their respective teams (`marketing-team` and
   `social-team`)
2. Ensure `social-media-publish`'s runtime prerequisites are satisfied
   (kitchen-plugin-marketing installed, Postiz account configured, gateway
   env vars set — see the example's README)
3. Trigger a run of `marketing-image-generation-handoff`

When the approval step clears, the `handoff_social_instagram` node fires
and enqueues a new run in `social-team`. You'll see it in that team's runs
page (or via `openclaw recipes workflows list-runs --team-id social-team`).

The handoff is **fire-and-forget** by default — the marketing run completes
without waiting for the social publish to succeed. Check the target team's
runs page for downstream status.

## Troubleshooting

### Runs start but nothing happens past the first node
Check that the **worker-tick cron for the agent owning that node** is
installed and enabled. Each agent referenced in the workflow needs its own
worker-tick.

### Worker-tick returns `skipped_locked` on every task
A previous worker session crashed mid-execution and left a lock file in
`workflow-runs/<runId>/locks/<nodeId>.lock`. Locks expire after ~12 minutes.
Either wait, or manually delete the stale lock file.

### `fetch failed` during `store_and_publish` (social-media-publish)
The gateway process can't reach its own Kitchen HTTP endpoint via the URL
in the request's `host` header. Set `CK_BASE_URL` in the gateway env to a
URL that IS reachable from inside the gateway process (e.g.
`http://127.0.0.1:7777` if Kitchen binds loopback).

### Runs hang at `waiting_workers` forever with no new events
Check `openclaw cron list --json` for your workflow crons — are they
firing? If not, the gateway cron scheduler is probably saturated. Bump
`agents.defaults.maxConcurrent` (see the Gateway concurrency section
above) and restart.

### Node locks from crashed workers pile up duplicate queue entries
Fixed in ClawRecipes 0.4.50+ via a `hasPendingTaskFor` guard in the
worker-tick. If you're on an older version, upgrade.

## See also

- [`examples/workflows/README.md`](../examples/workflows/README.md) — top-level
  index with install commands
- [`WORKFLOW_RUNS_FILE_FIRST.md`](./WORKFLOW_RUNS_FILE_FIRST.md) — how the
  runner/worker split works internally
- [`WORKFLOW_NODES.md`](./WORKFLOW_NODES.md) — reference for all node types
  used in these examples
- [`WORKFLOW_APPROVALS.md`](./WORKFLOW_APPROVALS.md) — how the `human_approval`
  node integrates with Telegram, Slack, and the web UI
- [`MEDIA_GENERATION.md`](./MEDIA_GENERATION.md) — provider setup for
  `media-image` / `media-video` nodes
- [`WORKFLOW_EXAMPLES.md`](./WORKFLOW_EXAMPLES.md) — hand-rolled smaller
  workflow examples showing individual node types
