#!/usr/bin/env bash
# Install worker-tick and runner-tick crons for the
# "marketing-video-generation-handoff" example workflow.
#
# Usage:
#   bash install-crons.sh                      # install for default teamId="marketing-team"
#   TEAM_ID=my-team bash install-crons.sh      # install for a custom teamId
#   MODEL=anthropic/claude-sonnet-4-5 bash install-crons.sh  # pin a model
#
# By default the cron payloads do not specify a model — the gateway picks
# its configured default. Set MODEL to override on a per-install basis.

set -euo pipefail

TEAM_ID="${TEAM_ID:-marketing-team}"
MODEL="${MODEL:-}"
MODEL_FLAG=""
if [ -n "$MODEL" ]; then
  MODEL_FLAG="--model $MODEL"
fi

echo "Installing crons for team: $TEAM_ID"
if [ -n "$MODEL" ]; then echo "Using model: $MODEL"; else echo "Using gateway default model"; fi
echo

# ------------------------------------------------------------------
# Runner-tick: claims queued workflow runs and enqueues their first
# runnable node onto the assigned agent's worker queue.
# ------------------------------------------------------------------
openclaw cron add \
  --name "workflow-runner-tick:$TEAM_ID" \
  --description "Workflow runner-tick cron" \
  --agent main \
  --session isolated \
  --cron "*/5 * * * *" \
  --no-deliver \
  --timeout-seconds 900 \
  $MODEL_FLAG \
  --message "Runner tick (workflow executor): openclaw recipes workflows runner-tick --team-id $TEAM_ID --concurrency 4 --lease-seconds 900"

# ------------------------------------------------------------------
# Worker-ticks: one per agent that owns a node in this workflow.
# Each worker drains its agent queue and executes node work.
# ------------------------------------------------------------------
openclaw cron add \
  --name "workflow-worker:$TEAM_ID:marketing-team-analyst" \
  --description "Workflow worker cron" \
  --agent main \
  --session isolated \
  --cron "*/5 * * * *" \
  --no-deliver \
  --timeout-seconds 120 \
  $MODEL_FLAG \
  --message "$(cat <<EOF
Workflow worker tick (marketing-team-analyst).

Run exactly one shell command using the exec tool.

Command:
bash -lc 'openclaw recipes workflows worker-tick --team-id $TEAM_ID --agent-id marketing-team-analyst --limit 5 --worker-id cron'

Rules:
- Execute with exec and wait for completion.
- If it succeeds, respond exactly: NO_REPLY
- If it fails, respond with one short error line.
EOF
)"

openclaw cron add \
  --name "workflow-worker:$TEAM_ID:marketing-team-compliance" \
  --description "Workflow worker cron" \
  --agent main \
  --session isolated \
  --cron "*/5 * * * *" \
  --no-deliver \
  --timeout-seconds 120 \
  $MODEL_FLAG \
  --message "$(cat <<EOF
Workflow worker tick (marketing-team-compliance).

Run exactly one shell command using the exec tool.

Command:
bash -lc 'openclaw recipes workflows worker-tick --team-id $TEAM_ID --agent-id marketing-team-compliance --limit 5 --worker-id cron'

Rules:
- Execute with exec and wait for completion.
- If it succeeds, respond exactly: NO_REPLY
- If it fails, respond with one short error line.
EOF
)"

openclaw cron add \
  --name "workflow-worker:$TEAM_ID:marketing-team-copywriter" \
  --description "Workflow worker cron" \
  --agent main \
  --session isolated \
  --cron "*/5 * * * *" \
  --no-deliver \
  --timeout-seconds 120 \
  $MODEL_FLAG \
  --message "$(cat <<EOF
Workflow worker tick (marketing-team-copywriter).

Run exactly one shell command using the exec tool.

Command:
bash -lc 'openclaw recipes workflows worker-tick --team-id $TEAM_ID --agent-id marketing-team-copywriter --limit 5 --worker-id cron'

Rules:
- Execute with exec and wait for completion.
- If it succeeds, respond exactly: NO_REPLY
- If it fails, respond with one short error line.
EOF
)"

openclaw cron add \
  --name "workflow-worker:$TEAM_ID:marketing-team-designer" \
  --description "Workflow worker cron" \
  --agent main \
  --session isolated \
  --cron "*/5 * * * *" \
  --no-deliver \
  --timeout-seconds 120 \
  $MODEL_FLAG \
  --message "$(cat <<EOF
Workflow worker tick (marketing-team-designer).

Run exactly one shell command using the exec tool.

Command:
bash -lc 'openclaw recipes workflows worker-tick --team-id $TEAM_ID --agent-id marketing-team-designer --limit 5 --worker-id cron'

Rules:
- Execute with exec and wait for completion.
- If it succeeds, respond exactly: NO_REPLY
- If it fails, respond with one short error line.
EOF
)"

openclaw cron add \
  --name "workflow-worker:$TEAM_ID:marketing-team-lead" \
  --description "Workflow worker cron" \
  --agent main \
  --session isolated \
  --cron "*/5 * * * *" \
  --no-deliver \
  --timeout-seconds 120 \
  $MODEL_FLAG \
  --message "$(cat <<EOF
Workflow worker tick (marketing-team-lead).

Run exactly one shell command using the exec tool.

Command:
bash -lc 'openclaw recipes workflows worker-tick --team-id $TEAM_ID --agent-id marketing-team-lead --limit 5 --worker-id cron'

Rules:
- Execute with exec and wait for completion.
- If it succeeds, respond exactly: NO_REPLY
- If it fails, respond with one short error line.
EOF
)"

echo
echo "Done. Run 'openclaw cron list' to verify."
