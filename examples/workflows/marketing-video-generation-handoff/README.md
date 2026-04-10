# marketing-video-generation-handoff

A marketing cadence that researches, drafts copy, **generates a video**,
QCs brand compliance, previews, waits for human approval, then posts.

> **Naming note:** This example is a direct copy of `marketing-cadence-v2`,
> which currently uses the `post_to_platforms` self-posting tool pattern — it
> does NOT yet contain a `handoff` node despite the name. If you want a true
> handoff flow (like the image version), replace the `post_to_platforms` node
> with a `handoff` node pointing at the `social-media-publish` example. See
> `marketing-image-generation-handoff` for the handoff-shaped equivalent.

## Flow

```
start
 └─ research              (analyst)
     └─ draft_assets      (copywriter)
         └─ generate_video    (designer, media-video)
             └─ qc_brand      (compliance)
                 └─ post_preview   (lead, tool)
                     └─ approval   (human_approval)
                         └─ post_to_platforms (lead, tool)
                             ├─ write_post_log   (analyst, tool)
                             └─ write_learnings  (analyst, tool)
                                 └─ update_ticket (lead)
                                     └─ end
```

## What you need before installing

1. **A team scaffolded with `teamId=marketing-team`** (or rename references).

2. **These agents present:**
   - `marketing-team-analyst`
   - `marketing-team-copywriter`
   - `marketing-team-designer`
   - `marketing-team-compliance`
   - `marketing-team-lead`

3. **A media-video driver available.** Built-in drivers include:
   - `skill-runway-video` (requires `RUNWAYML_API_SECRET`)
   - `skill-kling-video` (requires `KLING_API_KEY`)
   - `skill-luma-video` (requires `LUMAAI_API_KEY`)

   Edit `generate_video.config.provider` in the workflow JSON to pick your
   driver. See `docs/MEDIA_GENERATION.md` for provider setup.

4. **A working `post_to_platforms` implementation.** The `post_to_platforms`
   node is a shell `exec` tool — you need to fill in the actual posting logic,
   or replace it with a handoff to the `social-media-publish` workflow.

5. **Human approval provider** configured in `workflow.meta.approvalProvider`.

6. **Gateway concurrency:** 5 worker-tick crons — see the bundled docs for
   the suggested `agents.defaults.maxConcurrent` value.

## Install

### 1. Drop the workflow JSON into your team's workspace

```bash
cp marketing-video-generation-handoff.workflow.json \
  ~/.openclaw/workspace-<your-team-id>/shared-context/workflows/
```

### 2. Install the required crons

```bash
bash install-crons.sh
# or
openclaw cron import --from-file cron-jobs.example.json
```

Either installs:
- **1× runner-tick**
- **5× worker-tick** (one per agent)

No model is pinned by default — the gateway picks its configured default.
Set `MODEL=<provider/model>` to override.

## Run it

```bash
openclaw recipes workflows enqueue \
  --team-id <your-team-id> \
  --workflow-id marketing-video-generation-handoff
```

## Notes

- Video generation nodes can take several minutes. The node's lock TTL is
  computed from `config.timeoutMs` — set it appropriately for your driver
  (e.g. Kling/Runway can take 60–180 seconds for short clips).
- If a video generation session dies mid-execution (worker crash, gateway
  restart, etc.), the node lock remains until its TTL expires. Subsequent
  worker ticks will return `skipped_locked` until then.
