# marketing-image-generation-handoff

A marketing cadence that researches, drafts copy, **generates an image**,
QCs brand compliance, prepares a packet, waits for human approval, then
**hands off to a separate social-publish workflow** (expected to be the
`social-media-publish` example, running in its own team).

This is the "research → image → approve → handoff" pattern.

## Flow

```
start
 └─ research            (analyst)
     └─ draft_assets    (copywriter)
         └─ generate_image    (designer, media-image)
             └─ qc_brand      (compliance)
                 └─ instagram_packet  (lead)
                     └─ approval      (human_approval)
                         └─ handoff_social_instagram  (lead, handoff)
                             ├─ write_post_log   (analyst, tool)
                             └─ write_learnings  (analyst, tool)
                                 └─ update_ticket (lead)
                                     └─ end
```

## What you need before installing

1. **A team scaffolded with `teamId=marketing-team`** (or rename team references
   in the workflow + cron files to match yours).

2. **These agents present in that team:**
   - `marketing-team-analyst`
   - `marketing-team-copywriter`
   - `marketing-team-designer`
   - `marketing-team-compliance`
   - `marketing-team-lead`

3. **A media-image driver available** for the `generate_image` node. The
   workflow is configured to use `provider: nano-banana-image`. You can either:
   - Install the `nano-banana-image` skill (see `docs/MEDIA_GENERATION.md`), or
   - Edit `generate_image.config.provider` in the workflow JSON to point at
     another image driver (e.g. `openai-image-gen`, or any generic skill slug).

   Don't forget the provider's API key in `env.vars` (`GEMINI_API_KEY`,
   `OPENAI_API_KEY`, etc.) — see `docs/MEDIA_DRIVERS.md` for the full list.

4. **A handoff target workflow** for the `handoff_social_instagram` node. By
   default it hands off to:
   - `targetTeamId: social-team`
   - `targetWorkflowId: social-media-publish`

   That's the `social-media-publish` example in the sibling directory — it's a
   drop-in target. Install it into a team with `teamId=social-team` before
   running this workflow end-to-end. If your social team uses a different
   `teamId`, edit `handoff_social_instagram.config.targetTeamId` accordingly.

   The handoff also passes through a `variableMapping.integrationIds` value
   that's set to a placeholder (`<your-postiz-integration-id>`). Replace it
   with your actual Postiz integration id before running, or your
   `social-media-publish` run will not know which account to publish to.

5. **A human approval provider** configured via `workflow.meta.approvalProvider`
   (Telegram/Slack/web UI).

6. **Gateway concurrency.** This workflow uses 5 distinct worker-tick crons per
   team; combined with your other workflows you may need to raise
   `agents.defaults.maxConcurrent` beyond the default `8`. See
   `docs/WORKFLOW_EXAMPLES_BUNDLED.md` for details.

## Install

### 1. Drop the workflow JSON into your team's workspace

```bash
cp marketing-image-generation-handoff.workflow.json \
  ~/.openclaw/workspace-<your-team-id>/shared-context/workflows/
```

### 2. Install the required crons

Shell script:
```bash
bash install-crons.sh
TEAM_ID=my-marketing-team bash install-crons.sh
MODEL=openai/gpt-5.4 bash install-crons.sh   # optional model pin
```

JSON bulk import:
```bash
openclaw cron import --from-file cron-jobs.example.json
```

Either installs:
- **1× runner-tick** (`workflow-runner-tick:marketing-team`) — every 5 min
- **5× worker-tick** — analyst, copywriter, designer, compliance, lead — every 5 min

## Run it

```bash
openclaw recipes workflows enqueue \
  --team-id <your-team-id> \
  --workflow-id marketing-image-generation-handoff
```

Or via the ClawKitchen UI: teams → workflows → Run.

## Notes

- The `handoff` node is fire-and-forget: the source run completes as soon as
  the target run is enqueued. It does NOT wait for the social publish to
  succeed. Check the target team's runs page for the downstream status.
- If the handoff target workflow is missing or its team hasn't been scaffolded,
  the handoff node will error. Install the `social-media-publish` example in a
  separate social team before running this one end-to-end.
