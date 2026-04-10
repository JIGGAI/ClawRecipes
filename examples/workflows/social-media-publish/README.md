# social-media-publish

A minimal social-posting workflow. Takes a handoff payload (content, mediaUrl,
scheduled time, platform, integration), looks up the matching account, then
stores the post in the Content Library and publishes it via the configured
backend.

This is the workflow the marketing-side `handoff_*` nodes hand off **to**.

## ⚠️ Plugin + account requirements

This workflow **will not run out of the box**. It has two hard dependencies
that must be satisfied first:

1. **`kitchen-plugin-marketing` must be installed and enabled** in your
   ClawKitchen/OpenClaw setup. The workflow's `store_and_publish` node calls
   the plugin's HTTP endpoints:
   - `POST /api/plugins/marketing/media` — upload the media file
   - `POST /api/plugins/marketing/posts` — create the Content Library row
   - `POST /api/plugins/marketing/publish` — actually publish to the backend

   Install instructions: see the kitchen-plugin-marketing README
   (<https://github.com/JIGGAI/kitchen-plugin-marketing>).

2. **A Postiz account** (or another supported backend) configured in the
   marketing plugin. Postiz is the default publish backend. You need:
   - A Postiz API key (`x-postiz-api-key` header OR DB-stored via the
     Accounts tab in the marketing plugin UI)
   - A connected Instagram / X / TikTok / etc. integration on your Postiz
     account, with its integration id recorded in your workflow handoff
     payload (`integrationIds` variable)

   Without this, the publish step will fail with a `fetch failed` /
   `backend error` and the run will enter `error` status.

Additional prerequisites:
- `CK_BASE_URL` env var set on the gateway pointing at a URL that the
  gateway process can reach to call its own Kitchen HTTP endpoints (e.g.
  `http://127.0.0.1:7777` if Kitchen binds loopback, or your Tailscale/LAN
  IP otherwise). This is what the plugin uses internally to fetch local
  media for Postiz upload.
- Shell basic-auth credentials for the Kitchen API. Set `CK_AUTH` to
  `<user>:<password>` matching your Kitchen basic-auth setup. The
  `store_and_publish` command requires both `CK_BASE_URL` and `CK_AUTH` to
  be set — there are no fallback defaults.

## Flow

```
start
 └─ select_account       (lead, llm — looks up the right Postiz account from handoff payload)
     └─ store_and_publish (lead, tool/exec — upload media, create post, call /publish)
         └─ end
```

The `select_account` LLM node reads the handoff trigger input
(`content`, `mediaUrl`, `scheduledAt`, `integrationIds`, `kitchenTeamId`)
and chooses which configured platform/account to publish to. The
`store_and_publish` tool node runs a bash script that calls the marketing
plugin's HTTP API.

## What you need before installing

1. **A team scaffolded with `teamId=social-team`** (or rename references).
2. **A `social-team-lead` agent** in that team.
3. **kitchen-plugin-marketing + Postiz** (see above).
4. **Gateway env vars:**
   - `CK_BASE_URL` — URL the plugin uses to fetch its own media
   - Optionally `CK_AUTH` if your Kitchen credentials differ from the default

## Install

### 1. Drop the workflow JSON into your team's workspace

```bash
cp social-media-publish.workflow.json \
  ~/.openclaw/workspace-<your-social-team-id>/shared-context/workflows/
```

### 2. Install the required crons

```bash
bash install-crons.sh
# or
TEAM_ID=my-social-team bash install-crons.sh
# or
openclaw cron import --from-file cron-jobs.example.json
```

Either installs:
- **1× runner-tick** (`workflow-runner-tick:social-team`) — every 5 min
- **1× worker-tick** for `social-team-lead` — every 5 min

## Trigger it

This workflow is designed to be triggered by a **handoff** from another
workflow (e.g. `marketing-image-generation-handoff`). Point your upstream
handoff node at:

```json
{
  "config": {
    "targetTeamId": "social-team",
    "targetWorkflowId": "social-media-publish",
    "mode": "fire-and-forget",
    "variableMapping": {
      "content": "{{upstream_node.content}}",
      "mediaUrl": "{{upstream_node.mediaUrl}}",
      "scheduledAt": "{{upstream_node.scheduledAt}}",
      "kitchenTeamId": "marketing-team",
      "integrationIds": "<postiz-integration-id>"
    }
  }
}
```

You can also manually enqueue a run with the payload in `triggerInput`:

```bash
openclaw recipes workflows enqueue \
  --team-id social-team \
  --workflow-id social-media-publish \
  --input '{"content":"...","mediaUrl":"...","integrationIds":"..."}'
```

## Notes

- This workflow has **no human approval step** — it publishes immediately.
  If you want a review gate, add a `human_approval` node between
  `select_account` and `store_and_publish`.
- If the `store_and_publish` tool errors with `Media upload to Postiz failed:
  fetch failed`, the gateway process can't reach its own Kitchen HTTP
  endpoint via the URL in the `host` header. Set `CK_BASE_URL` in the
  gateway's `env.vars` to a URL that IS reachable from inside the gateway
  process.
