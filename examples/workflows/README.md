# Bundled workflow examples

Four copy-and-run workflow examples that ship with ClawRecipes. Each lives in
its own directory and includes:

- `*.workflow.json` — the workflow definition
- `cron-jobs.example.json` — the cron jobs required for the workflow to run
  (bulk-importable via `openclaw cron import --from-file`)
- `install-crons.sh` — the same jobs as a shell script using individual
  `openclaw cron add` calls
- `README.md` — per-example prerequisites, install steps, and gotchas

## The four examples

| Example | What it does | Agents used |
|---|---|---|
| [`marketing-cadence-v1`](./marketing-cadence-v1/) | Text-only marketing cadence: research → draft → QC → preview → approve → post | analyst, copywriter, compliance, lead |
| [`marketing-image-generation-handoff`](./marketing-image-generation-handoff/) | Marketing cadence with image generation, ending in a handoff to a social-publish workflow | analyst, copywriter, **designer**, compliance, lead |
| [`marketing-video-generation-handoff`](./marketing-video-generation-handoff/) | Marketing cadence with video generation, self-publishing pattern (no handoff node; see README) | analyst, copywriter, **designer**, compliance, lead |
| [`social-media-publish`](./social-media-publish/) | Handoff target — takes a payload and publishes to Instagram/etc. via kitchen-plugin-marketing + Postiz | social-team-lead |

## Typical install flow

1. **Scaffold a team** (ClawRecipes `marketing-team` / `social-team` recipes do this):
   ```bash
   openclaw recipes scaffold --recipe marketing-team --team-id marketing-team
   openclaw recipes scaffold --recipe social-team     --team-id social-team
   ```

2. **Copy the workflow file(s) you want** into each team's workspace:
   ```bash
   cp examples/workflows/marketing-image-generation-handoff/marketing-image-generation-handoff.workflow.json \
     ~/.openclaw/workspace-marketing-team/shared-context/workflows/

   cp examples/workflows/social-media-publish/social-media-publish.workflow.json \
     ~/.openclaw/workspace-social-team/shared-context/workflows/
   ```

3. **Install the crons** each workflow needs:
   ```bash
   bash examples/workflows/marketing-image-generation-handoff/install-crons.sh
   bash examples/workflows/social-media-publish/install-crons.sh
   ```

4. **Raise gateway concurrency** if you plan to run multiple workflows in
   parallel — see the section below.

5. **Trigger a run** from ClawKitchen UI or the CLI:
   ```bash
   openclaw recipes workflows enqueue \
     --team-id marketing-team \
     --workflow-id marketing-image-generation-handoff
   ```

## Cron requirements — the short version

Every workflow needs **two kinds of crons**:

1. **`workflow-runner-tick:<teamId>`** (1 per team) — claims queued runs and
   enqueues the first runnable node onto its owning agent's queue. Runs every
   5 minutes.

2. **`workflow-worker:<teamId>:<agentId>`** (1 per agent referenced by any
   workflow node) — drains that agent's queue and executes the nodes. Runs
   every 5 minutes.

Each cron **spawns an isolated agent session** that invokes
`openclaw recipes workflows (runner|worker)-tick` via the `exec` tool. This
means every tick counts against the gateway's `agents.defaults.maxConcurrent`
limit.

For the example workflows in this directory, a marketing-team install needs
**6 crons** (1 runner + 5 workers), and the social-team needs **2 crons**
(1 runner + 1 worker). If you install multiple workflows in the same team,
worker-ticks are shared (one per agent, regardless of how many workflows use
that agent), but each team still needs its own runner-tick.

## Gateway concurrency — raise `maxConcurrent`

The default `agents.defaults.maxConcurrent: 8` in `~/.openclaw/openclaw.json`
is fine for a small setup, but **breaks down quickly** once you have workflow
crons running. A single hmx-style deployment with one marketing team + one
social team using the image-generation-handoff example has:

- 5 marketing worker-ticks (analyst, copywriter, designer, compliance, lead)
- 1 marketing runner-tick
- 1 social worker-tick (lead)
- 1 social runner-tick
- = **8 workflow crons**

Combine with any other crons (memory, heartbeats, etc.) and you're already
over the concurrency limit. When that happens, crons back up, workflows run
15–30 minutes behind schedule, and session failures cascade.

**Recommended value for most setups: `24`.** Edit `~/.openclaw/openclaw.json`:

```json
"agents": {
  "defaults": {
    ...
    "maxConcurrent": 24,
    "subagents": { "maxConcurrent": 24 }
  }
}
```

Then restart: `openclaw gateway restart`.

If you're running many workflows / large teams, scale up further based on
your observed cron count.

## Model selection

The bundled example cron payloads **do not specify a model**. The gateway
falls back to its configured default model (typically `agents.defaults.model`
in `openclaw.json`).

To pin a specific model for a given workflow's crons, use one of:

- **Shell script**: `MODEL=openai/gpt-5.4 bash install-crons.sh`
- **JSON import**: uncomment the `model` line in `cron-jobs.example.json`
  before importing
- **Edit after install**: `openclaw cron edit <id> --model openai/gpt-5.4`

Worker-tick crons don't need smart models — they just run one shell command
and respond with `NO_REPLY`. A cheap/fast model is fine. Runner-ticks similarly
just invoke a CLI command.

## See also

- `docs/WORKFLOW_RUNS_FILE_FIRST.md` — how the runner/worker split works internally
- `docs/WORKFLOW_NODES.md` — the node types these examples use
- `docs/WORKFLOW_APPROVALS.md` — how `human_approval` nodes integrate
- `docs/MEDIA_GENERATION.md` — image/video generation provider setup
- `docs/WORKFLOW_EXAMPLES.md` — hand-rolled smaller workflow examples
