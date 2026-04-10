# marketing-cadence-v1

A marketing content cadence that researches → drafts → QCs → previews → waits for
human approval → posts → logs learnings. **No media generation** — it uses the
draft copy only.

## Flow

```
start
 └─ research          (analyst)
     └─ draft_assets  (copywriter)
         └─ qc_brand  (compliance)
             └─ post_preview (lead, tool)
                 └─ approval (human_approval)
                     └─ post_to_platforms (lead, tool)
                         ├─ write_post_log   (analyst, tool)
                         └─ write_learnings  (analyst, tool)
                             └─ update_ticket (lead)
                                 └─ end
```

## What you need before installing

1. **A team scaffolded with `teamId=marketing-team`** (or rename the references
   in the files below to match your team's id).

2. **These agents present in that team:**
   - `marketing-team-analyst`
   - `marketing-team-copywriter`
   - `marketing-team-compliance`
   - `marketing-team-lead`

   (`ClawRecipes`' built-in `marketing-team` recipe creates all of these.)

3. **A gateway running on this host** (`openclaw gateway status` should report
   `running`).

4. **Enough agent concurrency.** Every workflow cron job spawns an isolated agent
   session. With the default `agents.defaults.maxConcurrent: 8`, running multiple
   workflow crons (plus any other crons on your system) will back up. If you have
   more than ~6 workflow-related crons across all your teams, raise the limit in
   `~/.openclaw/openclaw.json`:

   ```json
   "agents": {
     "defaults": {
       "maxConcurrent": 24,
       "subagents": { "maxConcurrent": 24 }
     }
   }
   ```

   Restart the gateway after editing: `openclaw gateway restart`.

## Install

### 1. Drop the workflow definition into your team's workspace

```bash
cp marketing-cadence-v1.workflow.json \
  ~/.openclaw/workspace-<your-team-id>/shared-context/workflows/
```

### 2. Install the required crons

**Option A — shell script** (runs `openclaw cron add` for each job):
```bash
bash install-crons.sh
# or with a custom team id:
TEAM_ID=my-marketing-team bash install-crons.sh
# or pin a specific model (otherwise the gateway default is used):
MODEL=openai/gpt-5.4 bash install-crons.sh
```

**Option B — JSON bulk import**:
```bash
openclaw cron import --from-file cron-jobs.example.json
```

Either option installs:
- **1× runner-tick** (`workflow-runner-tick:marketing-team`) — every 5 min
- **4× worker-tick** — one for each agent (`analyst`, `copywriter`, `compliance`, `lead`) — every 5 min

No `model` is set on the crons by default — the gateway picks its configured
default model. Set `MODEL=...` (shell) or uncomment the `model` field in the
JSON to override.

## Run it

Open ClawKitchen in your browser, pick your team, and trigger
`marketing-cadence-v1` from the workflows tab. Or from the CLI:

```bash
openclaw recipes workflows enqueue \
  --team-id <your-team-id> \
  --workflow-id marketing-cadence-v1
```

## Notes

- The `approval` node pauses the run until a human approves (or rejects) it.
  Configure your approval provider (Telegram, Slack, web UI) in
  `workflow.meta.approvalProvider`.
- The `post_to_platforms` tool node is a shell command stub — you need to fill
  in the actual posting logic for your platforms (or replace it with a
  `handoff` node pointing at the `social-media-publish` example workflow).
