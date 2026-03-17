---
id: development-team
name: Development Team
version: 0.2.1
description: A small engineering team with a shared workspace (lead, dev, devops, test) using file-first tickets.
kind: team
cronJobs:
  - id: lead-triage-loop
    name: "Lead triage loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    agentId: "{{teamId}}-lead"
    message: |
      Automated lead triage loop: triage inbox/tickets, assign work, and update notes/status.md.

      QA-gated PR rule:
      - Dev/DevOps must NOT open PRs.
      - QA (test) verifies first.
      - After `QA: PASS`, ticket stays in work/testing but is assigned `Owner: lead` (ready-for-pr).
      - Lead opens PR only for testing-lane tickets owned by lead with QA PASS evidence.

      CWD guardrail (team root): run:
        cd "$(bash ../../scripts/team-root.sh 2>/dev/null || bash ./scripts/team-root.sh)"
      before any relative-path commands (e.g. work/, notes/, scripts/).

      Anti-stuck: if lowest in-progress is HARD BLOCKED, advance the next unblocked ticket (or pull from backlog).
      If in-progress is stale (>12h no dated update), comment or move it back.
      Guardrail: run ./scripts/ticket-hygiene.sh each loop; if it fails, fix lane/status/owner mismatches before proceeding (assignment stubs are deprecated).

    enabledByDefault: true

  # Safe-idle role loops (enabled by default): roles do not "wake up" unless they have their own heartbeat schedule or cron.
  - id: dev-work-loop
    name: "Dev work loop (safe-idle)"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    agentId: "{{teamId}}-dev"
    message: |
      Safe-idle loop: work dev-assigned tickets.

      Constraints:
      - Do NOT open PRs. Dev hands off to QA by moving ticket to work/testing and setting Owner=test.
      - Ensure ticket contains `## PR-ready` (repo + branch + sha) + verification steps.

    enabledByDefault: true

  - id: devops-work-loop
    name: "DevOps work loop (safe-idle)"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    agentId: "{{teamId}}-devops"
    message: "Safe-idle loop: check for devops-assigned tickets/runs, make small progress, and write outputs under roles/devops/agent-outputs/."
    enabledByDefault: true

  - id: test-work-loop
    name: "Test/QA work loop (safe-idle)"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    agentId: "{{teamId}}-test"
    message: |
      Safe-idle loop: drain work/testing tickets assigned to test.

      Workflow:
      - On PASS: keep ticket in work/testing but set Owner=lead (ready-for-pr) and add a `QA: PASS` comment + evidence.
      - On FAIL: move back to work/in-progress, set Owner=dev, add `QA: FAIL` + repro.

      Constraints:
      - QA happens BEFORE PR creation.

    enabledByDefault: true

  # Optional generic executor loop (off by default): can be enabled later if you want an extra catch-all.
  - id: execution-loop
    name: "Execution loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    agentId: "{{teamId}}-lead"
    message: |
      Automated execution loop: make progress on in-progress tickets, keep changes small/safe, and update notes/status.md.

      CWD guardrail (team root): run:
        cd "$(bash ../../scripts/team-root.sh 2>/dev/null || bash ./scripts/team-root.sh)"
      before any relative-path commands (e.g. work/, notes/, scripts/).

      Guardrail: run ./scripts/ticket-hygiene-dev.sh each loop; if it fails, fix lane/status/owner mismatches before proceeding (assignment stubs are deprecated).

      LEAD-OWNED TICKETS RULE (must follow)
      - Do NOT automatically move a ticket just because Owner=lead “expects backlog”.
      - If you encounter a lead-owned ticket in work/in-progress or work/testing that seems misassigned:
        - LEAVE IT IN PLACE.
        - Add a dated comment to the ticket explaining what you observed and what should change.
        - If the ticket failed QA, set Owner=dev (and keep it in work/in-progress).

    enabledByDefault: false

  - id: workflow-runner-loop
    name: "Workflow runner loop (runs queue)"
    # 6-field cron with seconds; runs every 15s
    schedule: "*/5 * * * *"
    timezone: "UTC"
    agentId: "{{teamId}}-workflow-runner"
    message: |
      Workflow runner loop: claim + execute queued workflow runs for this team.

      Guardrails:
      - This loop should be safe to run frequently; keep it short and idempotent.
      - Do NOT execute runs without a valid lease/claim.

      Command:
        openclaw recipes workflows runner-tick --team-id {{teamId}} --concurrency 2 --lease-seconds 45

    enabledByDefault: false

  - id: pr-watcher
    name: "PR watcher (ticket-linked)"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    agentId: "{{teamId}}-lead"
    message: |
      PR watcher (ticket-linked): scan active in-progress/testing tickets for GitHub PR URLs.

      Team-level default (recommended): on merge, MOVE ticket to TESTING (never DONE).
      Per-ticket override markers (literal strings, anywhere in the ticket body):
      - [pr-watcher:comment-only]       -> on merge, comment only (no lane move)
      - [pr-watcher:move-to-testing]    -> on merge, move to TESTING (if not already)
      - [pr-watcher:close]              -> on merge, ticket may be eligible for DONE (see guardrails)

      Always do:
      - Summarize checks/review/mergeable status in ticket comments.
      - If PR merged, comment "PR merged" + link + merge commit SHA (if available).

      Lane-move rules on merge:
      - NEVER move to DONE by default.
      - Only move to DONE if BOTH:
        1) ticket contains [pr-watcher:close]
        2) all Tasks checkboxes are completed ("- [x]" for every item under ## Tasks)
      - If DONE is NOT allowed, leave lane unchanged and comment WHY (missing marker and/or tasks incomplete).
      - If move-to-testing is selected (default or marker), move to TESTING when verification remains.

      Do NOT:
      - Do NOT create/update assignment stubs (work/assignments/* is deprecated).
    enabledByDefault: false

  - id: testing-lane-loop
    name: "Testing lane loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    agentId: "{{teamId}}-test"
    message: |
      Testing lane loop (QA gate): drain work/testing tickets.

      Rules:
      - On PASS: keep lane as work/testing, set Owner=lead, and add `QA: PASS` + evidence.
      - On FAIL: move back to work/in-progress, set Owner=dev, add `QA: FAIL` + repro.
      - Do NOT move tickets to DONE on PASS. Lead will open PR after PASS.

    enabledByDefault: false

  - id: backup-devteam-work
    name: "Backup dev-team work (every 3h, off-hours avoided)"
    # Every 3h during 07:00–22:00 America/New_York (avoids 02:00–07:00 blackout)
    schedule: "0 7,10,13,16,19,22 * * *"
    timezone: "America/New_York"
    agentId: "{{teamId}}-lead"
    message: "Backup job: run ./scripts/backup-work.sh to create a timestamped tarball of work/notes/scripts."
    enabledByDefault: true
requiredSkills: []
team:
  teamId: development-team
agents:
  - role: lead
    name: Dev Team Lead
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime", "group:automation"]
      deny: []
  - role: dev
    name: Software Engineer
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime", "group:automation"]
      deny: []
  - role: devops
    name: DevOps / SRE
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime", "group:automation"]
      deny: []
  - role: test
    name: QA / Tester
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime"]
      deny: []

  - role: workflow-runner
    name: Workflow Runner
    tools:
      profile: "coding"
      allow: ["group:fs", "group:runtime", "group:automation"]
      deny: []

templates:
  sharedContext.ticketFlow: |
    {
      "laneByOwner": {
        "lead": "backlog",
        "dev": "in-progress",
        "devops": "in-progress",
        "test": "testing",
        "qa": "testing"
      },
      "defaultLane": "in-progress",
      "notes": [
        "Ready-for-PR state lives in work/testing but uses Owner: lead after QA PASS.",
        "ticket-hygiene.sh special-cases lead in testing to allow this without failing hygiene."
      ]
    }

  sharedContext.memoryPolicy: |
    # Team Memory Policy (File-first)

    Quick link: see `shared-context/MEMORY_PLAN.md` for the canonical “what goes where” map.

    This team is run **file-first**. Chat is not the system of record.

    ## Where memory lives (and what it’s for)

    ### 1) Team knowledge memory (Kitchen UI)
    - `shared-context/memory/team.jsonl` (append-only)
    - `shared-context/memory/pinned.jsonl` (append-only)

    Kitchen’s Team Editor → Memory tab reads/writes these JSONL streams.

    ### 2) Per-role continuity memory (agents)
    Each role keeps its own continuity memory:
    - `roles/<role>/memory/YYYY-MM-DD.md` (daily log)
    - `roles/<role>/MEMORY.md` (curated long-term memory)

    These files are what the role agent uses to “remember” decisions and context across sessions.

    ## Where to write things
    - Ticket = source of truth for a unit of work.
    - `../notes/plan.md` + `../shared-context/priorities.md` are **lead-curated**.
    - `../notes/status.md` is **append-only** and updated after each work session (3–5 bullets).

    ## Outputs / artifacts
    - Role-level raw output (append-only): `roles/<role>/agent-outputs/`
    - Team-level raw output (append-only, optional): `../shared-context/agent-outputs/`

    Guardrail: do **not** create or rely on `roles/<role>/shared-context/**`.

    ## Role work loop contract (safe-idle)
    When a role’s cron/heartbeat runs:
    - **No-op unless explicit queued work exists** for that role (ticket assigned/owned by role, or workflow run nodes assigned to the role agentId).
    - If work happens, write back in this order:
      1) Update the relevant ticket(s) (source of truth).
      2) Append 1–3 bullets to `../notes/status.md` (team roll-up).
      3) Write raw logs/artifacts under `roles/<role>/agent-outputs/` and reference them from the ticket.
    - Team memory JSONL policy:
      - Non-lead roles must **not** write directly to `shared-context/memory/pinned.jsonl`.
      - Non-leads may propose memory items in ticket comments or role outputs; lead pins.
      - Optional: roles may append non-pinned learnings to dedicated streams (e.g. `shared-context/memory/<topic>.jsonl`) if the recipe/workflow opts in.

    ## End-of-session checklist (everyone)
    After meaningful work:
    1) Update the ticket with what changed + how to verify + rollback.
    2) Add a dated note in the ticket `## Comments`.
    3) Append 3–5 bullets to `../notes/status.md`.
    4) Append logs/output to `roles/<role>/agent-outputs/`.

  tickets: |
    # Tickets — {{teamId}}

    ## Workflow stages
    - backlog → in-progress → testing → done

    ## Roles / responsibility
    - dev/devops: implement + handoff to test (NO PR creation)
    - test: verify + record PASS/FAIL
    - lead: creates PR **only after QA PASS**

    ## “Ready for PR” (no extra lane)
    This team does **not** add a separate lane.

    Instead, a ticket is considered **ready for PR** when:
    - it is in `work/testing/`
    - `Owner: lead`
    - ticket contains a `QA: PASS` comment + evidence

    ## Handoff rules

    ### Dev → Test
    When implementation is ready:
    - Move ticket to `work/testing/`
    - Set `Owner: test`
    - Ensure the ticket contains:
      - verification steps (“How to test”)
      - links to branch/commit under `## PR-ready`

    ### Test → Lead (QA PASS)
    On PASS:
    - Add a dated ticket comment: `QA: PASS` + evidence
    - Keep lane as `work/testing/`
    - Set `Owner: lead`

    On FAIL:
    - Add `QA: FAIL` + repro
    - Move ticket back to `work/in-progress/` and set `Owner: dev`

    ### Lead → PR
    Lead creates a PR only after QA PASS.
    When creating the PR:
    - Link the PR URL in the ticket
    - Add `[pr-watcher:close]` marker if the ticket is eligible to auto-move to DONE on merge.

    ## Required fields
    Each ticket must include:
    - Owner: lead|dev|devops|test
    - Status: backlog|in-progress|testing|done
    - Context
    - Requirements
    - Acceptance criteria


  sharedContext.qaAccess: |
    # QA Access — {{teamId}}

    This file exists to prevent QA tickets being bounced due to missing environment access.

    ## ClawKitchen (hosted)
    - URL: http://localhost:7777

    ### HTTP Basic Auth
    - Username: `kitchen`
    - Password: <AUTH_TOKEN> (obtain from your deployment secret / host config)

    ### QA token bootstrap
    Open once to set QA cookie:
    - http://localhost:7777/tickets?qaToken=<QA_TOKEN>

    ## Notes
    - Do NOT commit real credentials to git.
    - When a ticket requires hosted Kitchen verification, link this file from the ticket.

  sharedContext.plan: |
    # Plan (lead-curated)

    - (empty)

  sharedContext.status: |
    # Status (append-only)

    - (empty)

  sharedContext.memoryPlan: |
    # Memory Plan (Team)

    This team is file-first. Chat is not the system of record.

    ## Source of truth
    - Tickets (`work/*/*.md`) are the source of truth for a unit of work.

    ## Team knowledge memory (Kitchen UI)
    - `shared-context/memory/team.jsonl` (append-only)
    - `shared-context/memory/pinned.jsonl` (append-only, curated/high-signal)

    Policy:
    - Lead may pin to `pinned.jsonl`.
    - Non-leads propose memory items via ticket comments or role outputs; lead pins.

    ## Per-role continuity memory (agent startup)
    - `roles/<role>/MEMORY.md` (curated long-term)
    - `roles/<role>/memory/YYYY-MM-DD.md` (daily log)

    ## Plan vs status (team coordination)
    - `../notes/plan.md` + `../shared-context/priorities.md` are lead-curated
    - `../notes/status.md` is append-only roll-up (everyone appends)

    ## Outputs / artifacts
    - `roles/<role>/agent-outputs/` (append-only)
    - `../shared-context/agent-outputs/` (team-level, read/write from role via `../`)

    ## Role work loop contract (safe-idle)
    - No-op unless explicit queued work exists for the role.
    - If work happens, write back in order: ticket → `../notes/status.md` → `roles/<role>/agent-outputs/`.

  sharedContext.priorities: |
    # Priorities (lead-curated)

    - (empty)

  sharedContext.agentOutputsReadme: |
    # Agent Outputs (append-only)

    Put raw logs, command output, and investigation notes here.
    Prefer filenames like: `YYYY-MM-DD-topic.md`.


  sharedContext.teamRootScript: |
    #!/usr/bin/env bash
    set -euo pipefail

    # Team root resolver
    # Prints the absolute path to the team workspace root from any subdir (e.g. roles/<role>/).
    # Heuristic: find the nearest ancestor containing work/, roles/, and shared-context/.

    d="$(pwd -P)"
    while true; do
      if [[ -d "$d/work" && -d "$d/roles" && -d "$d/shared-context" ]]; then
        echo "$d"
        exit 0
      fi
      if [[ "$d" == "/" ]]; then
        echo "team-root.sh: could not find team root from $(pwd -P)" >&2
        exit 1
      fi
      d="$(dirname "$d")"
    done

  lead.ticketHygiene: |
    #!/usr/bin/env bash
    set -euo pipefail

    # ticket-hygiene.sh
    # Guardrail script used by lead triage + execution loops.
    # Assignment stubs are deprecated.
    #
    # Checks (ACTIVE lanes only):
    # - Ticket file location (lane) must match Status:
    # - Ticket Owner should be in the expected lane per shared-context/ticket-flow.json (best-effort)
    #
    # Notes:
    # - We intentionally do NOT enforce mapping for work/done/ because historical tickets may have old Owner/Status.

    cd "$(dirname "$0")/.."

    fail=0
    flow="shared-context/ticket-flow.json"

    lane_from_rel() {
      # expects work/<lane>/<file>.md
      echo "$1" | sed -E 's#^work/([^/]+)/.*$#\\1#'
    }

    field_from_md() {
      local file="$1"
      local key="$2"
      # Extract first matching header line like: Key: value
      local line
      line="$(grep -m1 -E "^${key}:[[:space:]]*" "$file" 2>/dev/null || true)"
      echo "${line#${key}:}" | sed -E 's/^\s+//'
    }

    expected_lane_for_owner() {
      local owner="$1"
      local currentLane="$2"

      # Special-case: lead may own BACKLOG (triage) OR TESTING (ready-for-pr) without hygiene failure.
      if [[ "$owner" == "lead" && ( "$currentLane" == "backlog" || "$currentLane" == "testing" ) ]]; then
        echo "$currentLane"
        return 0
      fi

      # If jq or the mapping file isn't available, do not block progress.
      if [[ ! -f "$flow" ]]; then
        echo "$currentLane"
        return 0
      fi
      if ! command -v jq >/dev/null 2>&1; then
        echo "$currentLane"
        return 0
      fi

      local out
      out="$(jq -r --arg o "$owner" '.laneByOwner[$o] // .defaultLane // empty' "$flow" 2>/dev/null || true)"
      if [[ -n "$out" ]]; then
        echo "$out"
      else
        echo "$currentLane"
      fi
    }

    check_ticket() {
      local file="$1"
      local rel="$file"
      rel="${rel#./}"

      local lane
      lane="$(lane_from_rel "$rel")"

      # Ignore done lane for owner/status enforcement.
      if [[ "$lane" == "done" ]]; then
        return 0
      fi

      local owner status
      owner="$(field_from_md "$file" "Owner")"
      status="$(field_from_md "$file" "Status")"

      if [[ -n "$status" && "$status" != "$lane" ]]; then
        echo "[FAIL] $rel: Status mismatch (has: $status, lane: $lane)" >&2
        fail=1
      fi

      if [[ -n "$owner" ]]; then
        local expected
        expected="$(expected_lane_for_owner "$owner" "$lane")"
        if [[ -n "$expected" && "$expected" != "$lane" ]]; then
          echo "[FAIL] $rel: Owner '$owner' expects lane '$expected' per $flow (currently in '$lane')" >&2
          fail=1
        fi
      fi
    }

    shopt -s nullglob
    for file in work/backlog/*.md work/in-progress/*.md work/testing/*.md work/done/*.md; do
      [[ -f "$file" ]] || continue
      check_ticket "$file"
    done

    if [[ "$fail" -ne 0 ]]; then
      exit 1
    fi

    echo "OK"

  lead.ticketHygieneDevShim: |
    #!/usr/bin/env bash
    set -euo pipefail
    # Compatibility shim: automation expects ticket-hygiene-dev.sh
    DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    exec "$DIR/ticket-hygiene.sh" "$@"

  lead.backupWork: |
    #!/usr/bin/env bash
    set -euo pipefail

    # Backup the dev-team ticket folders (work + notes + scripts) into a timestamped tarball.
    # Safe-by-default: never deletes tickets; only prunes old backup archives.

    ROOT="$HOME/.openclaw/workspace-{{teamId}}"
    OUTDIR="$HOME/.openclaw/workspace/_backups"
    mkdir -p "$OUTDIR"

    TS="$(date -u +%Y%m%dT%H%M%SZ)"
    OUT="$OUTDIR/workspace-{{teamId}}-${TS}.tgz"

    tar -czf "$OUT" -C "$ROOT" work notes scripts

    echo "$OUT"

    # Keep the most recent 60 backups (~7.5 days at 1 per 3h). Adjust as needed.
    ls -1t "$OUTDIR"/workspace-{{teamId}}-*.tgz 2>/dev/null | tail -n +61 | xargs -r rm -f

  # Expose the same root scripts under every role namespace
  # (scaffold-team applies the same `files:` list for each agent role).

  dev.ticketHygiene: |
    #!/usr/bin/env bash
    set -euo pipefail

    # ticket-hygiene.sh
    # Guardrail script used by lead triage + execution loops.
    # Assignment stubs are deprecated.
    #
    # Checks (ACTIVE lanes only):
    # - Ticket file location (lane) must match Status:
    # - Ticket Owner should be in the expected lane per shared-context/ticket-flow.json (best-effort)
    #
    # Notes:
    # - We intentionally do NOT enforce mapping for work/done/ because historical tickets may have old Owner/Status.

    cd "$(dirname "$0")/.."

    fail=0
    flow="shared-context/ticket-flow.json"

    lane_from_rel() {
      # expects work/<lane>/<file>.md
      echo "$1" | sed -E 's#^work/([^/]+)/.*$#\\1#'
    }

    field_from_md() {
      local file="$1"
      local key="$2"
      # Extract first matching header line like: Key: value
      local line
      line="$(grep -m1 -E "^${key}:[[:space:]]*" "$file" 2>/dev/null || true)"
      echo "${line#${key}:}" | sed -E 's/^\s+//'
    }

    expected_lane_for_owner() {
      local owner="$1"
      local currentLane="$2"

      # Special-case: lead may own BACKLOG (triage) OR TESTING (ready-for-pr) without hygiene failure.
      if [[ "$owner" == "lead" && ( "$currentLane" == "backlog" || "$currentLane" == "testing" ) ]]; then
        echo "$currentLane"
        return 0
      fi

      # If jq or the mapping file isn't available, do not block progress.
      if [[ ! -f "$flow" ]]; then
        echo "$currentLane"
        return 0
      fi
      if ! command -v jq >/dev/null 2>&1; then
        echo "$currentLane"
        return 0
      fi

      local out
      out="$(jq -r --arg o "$owner" '.laneByOwner[$o] // .defaultLane // empty' "$flow" 2>/dev/null || true)"
      if [[ -n "$out" ]]; then
        echo "$out"
      else
        echo "$currentLane"
      fi
    }

    check_ticket() {
      local file="$1"
      local rel="$file"
      rel="${rel#./}"

      local lane
      lane="$(lane_from_rel "$rel")"

      # Ignore done lane for owner/status enforcement.
      if [[ "$lane" == "done" ]]; then
        return 0
      fi

      local owner status
      owner="$(field_from_md "$file" "Owner")"
      status="$(field_from_md "$file" "Status")"

      if [[ -n "$status" && "$status" != "$lane" ]]; then
        echo "[FAIL] $rel: Status mismatch (has: $status, lane: $lane)" >&2
        fail=1
      fi

      if [[ -n "$owner" ]]; then
        local expected
        expected="$(expected_lane_for_owner "$owner" "$lane")"
        if [[ -n "$expected" && "$expected" != "$lane" ]]; then
          echo "[FAIL] $rel: Owner '$owner' expects lane '$expected' per $flow (currently in '$lane')" >&2
          fail=1
        fi
      fi
    }

    shopt -s nullglob
    for file in work/backlog/*.md work/in-progress/*.md work/testing/*.md work/done/*.md; do
      [[ -f "$file" ]] || continue
      check_ticket "$file"
    done

    if [[ "$fail" -ne 0 ]]; then
      exit 1
    fi

    echo "OK"

  dev.ticketHygieneDevShim: |
    #!/usr/bin/env bash
    set -euo pipefail
    # Compatibility shim: automation expects ticket-hygiene-dev.sh
    DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    exec "$DIR/ticket-hygiene.sh" "$@"

  dev.backupWork: |
    #!/usr/bin/env bash
    set -euo pipefail

    # Backup the dev-team ticket folders (work + notes + scripts) into a timestamped tarball.
    # Safe-by-default: never deletes tickets; only prunes old backup archives.

    ROOT="$HOME/.openclaw/workspace-{{teamId}}"
    OUTDIR="$HOME/.openclaw/workspace/_backups"
    mkdir -p "$OUTDIR"

    TS="$(date -u +%Y%m%dT%H%M%SZ)"
    OUT="$OUTDIR/workspace-{{teamId}}-${TS}.tgz"

    tar -czf "$OUT" -C "$ROOT" work notes scripts

    echo "$OUT"

    # Keep the most recent 60 backups (~7.5 days at 1 per 3h). Adjust as needed.
    ls -1t "$OUTDIR"/workspace-{{teamId}}-*.tgz 2>/dev/null | tail -n +61 | xargs -r rm -f

  workflow-runner.ticketHygiene: |
    #!/usr/bin/env bash
    set -euo pipefail

  workflow-runner.ticketHygieneDevShim: |
    #!/usr/bin/env bash
    set -euo pipefail
    # Compatibility shim: automation expects ticket-hygiene-dev.sh
    DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    exec "$DIR/ticket-hygiene.sh" "$@"

  workflow-runner.backupWork: |
    #!/usr/bin/env bash
    set -euo pipefail

  devops.ticketHygiene: |
    #!/usr/bin/env bash
    set -euo pipefail

    # ticket-hygiene.sh
    # Guardrail script used by lead triage + execution loops.
    # Assignment stubs are deprecated.
    #
    # Checks (ACTIVE lanes only):
    # - Ticket file location (lane) must match Status:
    # - Ticket Owner should be in the expected lane per shared-context/ticket-flow.json (best-effort)
    #
    # Notes:
    # - We intentionally do NOT enforce mapping for work/done/ because historical tickets may have old Owner/Status.

    cd "$(dirname "$0")/.."

    fail=0
    flow="shared-context/ticket-flow.json"

    lane_from_rel() {
      # expects work/<lane>/<file>.md
      echo "$1" | sed -E 's#^work/([^/]+)/.*$#\\1#'
    }

    field_from_md() {
      local file="$1"
      local key="$2"
      # Extract first matching header line like: Key: value
      local line
      line="$(grep -m1 -E "^${key}:[[:space:]]*" "$file" 2>/dev/null || true)"
      echo "${line#${key}:}" | sed -E 's/^\s+//'
    }

    expected_lane_for_owner() {
      local owner="$1"
      local currentLane="$2"

      # Special-case: lead may own BACKLOG (triage) OR TESTING (ready-for-pr) without hygiene failure.
      if [[ "$owner" == "lead" && ( "$currentLane" == "backlog" || "$currentLane" == "testing" ) ]]; then
        echo "$currentLane"
        return 0
      fi

      # If jq or the mapping file isn't available, do not block progress.
      if [[ ! -f "$flow" ]]; then
        echo "$currentLane"
        return 0
      fi
      if ! command -v jq >/dev/null 2>&1; then
        echo "$currentLane"
        return 0
      fi

      local out
      out="$(jq -r --arg o "$owner" '.laneByOwner[$o] // .defaultLane // empty' "$flow" 2>/dev/null || true)"
      if [[ -n "$out" ]]; then
        echo "$out"
      else
        echo "$currentLane"
      fi
    }

    check_ticket() {
      local file="$1"
      local rel="$file"
      rel="${rel#./}"

      local lane
      lane="$(lane_from_rel "$rel")"

      # Ignore done lane for owner/status enforcement.
      if [[ "$lane" == "done" ]]; then
        return 0
      fi

      local owner status
      owner="$(field_from_md "$file" "Owner")"
      status="$(field_from_md "$file" "Status")"

      if [[ -n "$status" && "$status" != "$lane" ]]; then
        echo "[FAIL] $rel: Status mismatch (has: $status, lane: $lane)" >&2
        fail=1
      fi

      if [[ -n "$owner" ]]; then
        local expected
        expected="$(expected_lane_for_owner "$owner" "$lane")"
        if [[ -n "$expected" && "$expected" != "$lane" ]]; then
          echo "[FAIL] $rel: Owner '$owner' expects lane '$expected' per $flow (currently in '$lane')" >&2
          fail=1
        fi
      fi
    }

    shopt -s nullglob
    for file in work/backlog/*.md work/in-progress/*.md work/testing/*.md work/done/*.md; do
      [[ -f "$file" ]] || continue
      check_ticket "$file"
    done

    if [[ "$fail" -ne 0 ]]; then
      exit 1
    fi

    echo "OK"

  devops.ticketHygieneDevShim: |
    #!/usr/bin/env bash
    set -euo pipefail
    # Compatibility shim: automation expects ticket-hygiene-dev.sh
    DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    exec "$DIR/ticket-hygiene.sh" "$@"

  devops.backupWork: |
    #!/usr/bin/env bash
    set -euo pipefail

    # Backup the dev-team ticket folders (work + notes + scripts) into a timestamped tarball.
    # Safe-by-default: never deletes tickets; only prunes old backup archives.

    ROOT="$HOME/.openclaw/workspace-{{teamId}}"
    OUTDIR="$HOME/.openclaw/workspace/_backups"
    mkdir -p "$OUTDIR"

    TS="$(date -u +%Y%m%dT%H%M%SZ)"
    OUT="$OUTDIR/workspace-{{teamId}}-${TS}.tgz"

    tar -czf "$OUT" -C "$ROOT" work notes scripts

    echo "$OUT"

    # Keep the most recent 60 backups (~7.5 days at 1 per 3h). Adjust as needed.
    ls -1t "$OUTDIR"/workspace-{{teamId}}-*.tgz 2>/dev/null | tail -n +61 | xargs -r rm -f

  test.ticketHygiene: |
    #!/usr/bin/env bash
    set -euo pipefail

    # ticket-hygiene.sh
    # Guardrail script used by lead triage + execution loops.
    # Assignment stubs are deprecated.
    #
    # Checks (ACTIVE lanes only):
    # - Ticket file location (lane) must match Status:
    # - Ticket Owner should be in the expected lane per shared-context/ticket-flow.json (best-effort)
    #
    # Notes:
    # - We intentionally do NOT enforce mapping for work/done/ because historical tickets may have old Owner/Status.

    cd "$(dirname "$0")/.."

    fail=0
    flow="shared-context/ticket-flow.json"

    lane_from_rel() {
      # expects work/<lane>/<file>.md
      echo "$1" | sed -E 's#^work/([^/]+)/.*$#\\1#'
    }

    field_from_md() {
      local file="$1"
      local key="$2"
      # Extract first matching header line like: Key: value
      local line
      line="$(grep -m1 -E "^${key}:[[:space:]]*" "$file" 2>/dev/null || true)"
      echo "${line#${key}:}" | sed -E 's/^\s+//'
    }

    expected_lane_for_owner() {
      local owner="$1"
      local currentLane="$2"

      # Special-case: lead may own BACKLOG (triage) OR TESTING (ready-for-pr) without hygiene failure.
      if [[ "$owner" == "lead" && ( "$currentLane" == "backlog" || "$currentLane" == "testing" ) ]]; then
        echo "$currentLane"
        return 0
      fi

      # If jq or the mapping file isn't available, do not block progress.
      if [[ ! -f "$flow" ]]; then
        echo "$currentLane"
        return 0
      fi
      if ! command -v jq >/dev/null 2>&1; then
        echo "$currentLane"
        return 0
      fi

      local out
      out="$(jq -r --arg o "$owner" '.laneByOwner[$o] // .defaultLane // empty' "$flow" 2>/dev/null || true)"
      if [[ -n "$out" ]]; then
        echo "$out"
      else
        echo "$currentLane"
      fi
    }

    check_ticket() {
      local file="$1"
      local rel="$file"
      rel="${rel#./}"

      local lane
      lane="$(lane_from_rel "$rel")"

      # Ignore done lane for owner/status enforcement.
      if [[ "$lane" == "done" ]]; then
        return 0
      fi

      local owner status
      owner="$(field_from_md "$file" "Owner")"
      status="$(field_from_md "$file" "Status")"

      if [[ -n "$status" && "$status" != "$lane" ]]; then
        echo "[FAIL] $rel: Status mismatch (has: $status, lane: $lane)" >&2
        fail=1
      fi

      if [[ -n "$owner" ]]; then
        local expected
        expected="$(expected_lane_for_owner "$owner" "$lane")"
        if [[ -n "$expected" && "$expected" != "$lane" ]]; then
          echo "[FAIL] $rel: Owner '$owner' expects lane '$expected' per $flow (currently in '$lane')" >&2
          fail=1
        fi
      fi
    }

    shopt -s nullglob
    for file in work/backlog/*.md work/in-progress/*.md work/testing/*.md work/done/*.md; do
      [[ -f "$file" ]] || continue
      check_ticket "$file"
    done

    if [[ "$fail" -ne 0 ]]; then
      exit 1
    fi

    echo "OK"

  test.ticketHygieneDevShim: |
    #!/usr/bin/env bash
    set -euo pipefail
    # Compatibility shim: automation expects ticket-hygiene-dev.sh
    DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    exec "$DIR/ticket-hygiene.sh" "$@"

  test.backupWork: |
    #!/usr/bin/env bash
    set -euo pipefail

    # Backup the dev-team ticket folders (work + notes + scripts) into a timestamped tarball.
    # Safe-by-default: never deletes tickets; only prunes old backup archives.

    ROOT="$HOME/.openclaw/workspace-{{teamId}}"
    OUTDIR="$HOME/.openclaw/workspace/_backups"
    mkdir -p "$OUTDIR"

    TS="$(date -u +%Y%m%dT%H%M%SZ)"
    OUT="$OUTDIR/workspace-{{teamId}}-${TS}.tgz"

    tar -czf "$OUT" -C "$ROOT" work notes scripts

    echo "$OUT"

    # Keep the most recent 60 backups (~7.5 days at 1 per 3h). Adjust as needed.
    ls -1t "$OUTDIR"/workspace-{{teamId}}-*.tgz 2>/dev/null | tail -n +61 | xargs -r rm -f

  lead.soul: |
    # SOUL.md

    You are the Team Lead / Dispatcher for {{teamId}}.

    Core job:
    - Convert new requests into scoped tickets.
    - Assign work to Dev or DevOps.
    - Monitor progress and unblock.
    - Report completions.

  lead.agents: |
    # AGENTS.md

    Team: {{teamId}}
    Shared workspace: {{teamDir}}

    ## Guardrails (read → act → write)

    Before you act:
    1) Read (role continuity):
       - `MEMORY.md`
       - `memory/YYYY-MM-DD.md` (today; create if missing)

    2) Read (team context):
       - `../notes/plan.md`
       - `../notes/status.md`
       - `../shared-context/priorities.md`
       - the relevant ticket(s)

    Optional (team knowledge memory, Kitchen UI):
       - `shared-context/memory/pinned.jsonl`
       - `shared-context/memory/team.jsonl`

    After you act:
    1) Write back:
       - Update tickets with decisions/assignments.
       - Keep `../notes/status.md` current (3–5 bullets per active ticket).

    ## Curator model

    You are the curator of:
    - `../notes/plan.md`
    - `../shared-context/priorities.md`

    Everyone else should append to:
    - `../shared-context/agent-outputs/` (append-only)
    - `shared-context/feedback/`

    Your job is to periodically distill those inputs into the curated files.

    ## File-first workflow (tickets)

    Source of truth is the shared team workspace.

    Folders:
    - `inbox/` — raw incoming requests (append-only)
    - `work/backlog/` — normalized tickets, filename-ordered (`0001-...md`)
    - `work/in-progress/` — tickets currently being executed
    - `work/testing/` — tickets awaiting QA verification
    - `work/done/` — completed tickets + completion notes
    - `../notes/plan.md` — current plan / priorities (curated)
    - `../notes/status.md` — current status snapshot
    - `shared-context/` — shared context + append-only outputs

    ### Ticket numbering (critical)
    - Backlog tickets MUST be named `0001-...md`, `0002-...md`, etc.
    - The developer pulls the lowest-numbered ticket assigned to them.

    ### Ticket format
    See `TICKETS.md` in the team root. Every ticket should include:
    - Context
    - Requirements
    - Acceptance criteria
    - Owner (dev/devops)
    - Status

    ### Your responsibilities
    - For every new request in `inbox/`, create a normalized ticket in `work/backlog/`.
    - Curate `../notes/plan.md` and `../shared-context/priorities.md`.
    - Keep `../notes/status.md` updated.
    - When work is ready for QA, move the ticket to `work/testing/` and assign it to the tester.
    - When QA passes a ticket, QA will keep it in `work/testing/` but set `Owner: lead` (ready-for-pr).
    - As lead, create the PR **only** for testing-lane tickets with `Owner: lead` + `QA: PASS` evidence.
      - PRs must stay specific to a single ticket/problem.
      - If a PR depends on another ticket/PR, the PR description must clearly say so (for example: `Depends on 0xxx`).
      - On PR creation, link PR in the ticket and add `[pr-watcher:close]` if eligible for auto-close on merge.
    - After PR merge, pr-watcher may move ticket to DONE if `[pr-watcher:close]` is present and tasks are complete.

  dev.soul: |
    # SOUL.md

    You are a Software Engineer on {{teamId}}.
    You implement features with clean, maintainable code and small PR-sized changes.

  dev.agents: |
    # AGENTS.md

    Shared workspace: {{teamDir}}

    ## Core workflow (QA gated)
    - Your job: implement changes and hand off to QA.
    - You MUST NOT open pull requests. PR creation is owned by the team lead after QA PASS.
    - When work is ready: move the ticket to `work/testing/` and set `Owner: test`.

    ## Guardrails (read → act → write)

    Before you change anything:
    1) Read (role continuity):
       - `MEMORY.md`
       - `memory/YYYY-MM-DD.md` (today; create if missing)

    2) Read (team context):
       - `../notes/plan.md`
       - `../notes/status.md`
       - `../shared-context/priorities.md`
       - the current ticket you’re working on

    Optional (team knowledge memory, Kitchen UI):
       - `shared-context/memory/pinned.jsonl`
       - `shared-context/memory/team.jsonl`

    While working:
    - Keep changes small and safe.
    - Prefer file-first coordination over chat.

    After you finish a work session (even if not done):
    1) Write back:
       - Update the ticket with what you did and what’s next.
       - Add **3–5 bullets** to `../notes/status.md` (what changed / what’s blocked).
       - Append detailed output to `../shared-context/agent-outputs/` (append-only).

    Curator model:
    - Lead curates `../notes/plan.md` and `../shared-context/priorities.md`.
    - You should NOT edit curated files; propose changes via `agent-outputs/`.

    ## How you work (pull system)

    1) Look in `work/in-progress/` for any ticket already assigned to you.
       - If present: continue it.

    2) Otherwise, pick the next ticket from `work/backlog/`:
       - Choose the lowest-numbered `0001-...md` ticket assigned to `dev`.

    3) Move the ticket file from `work/backlog/` → `work/in-progress/`.

    4) Do the work.

    5) Handoff to QA (required):
       - Ensure the ticket has verification steps (“How to test”).
       - Add a `## PR-ready` section with repo + branch + commit SHA (if known).
       - Move the ticket to `work/testing/`.
       - Set `Owner: test`.

    Notes:
    - Do NOT move tickets to `work/done/`.
    - Do NOT open PRs. Lead opens PR only after QA PASS.
    - Keep PR scope specific to the current ticket only.
    - If you discover a second issue, track it separately and keep it out of the current PR unless the dependency is explicit.
    - If one PR depends on another ticket/PR, make that dependency explicit in the PR description (for example: `Depends on 0xxx`).

  devops.soul: |
    # SOUL.md

    You are a DevOps/SRE on {{teamId}}.
    You focus on reliability, deployments, observability, and safe automation.

  devops.agents: |
    # AGENTS.md

    Shared workspace: {{teamDir}}

    ## Guardrails (read → act → write)

    Before you change anything:
    1) Read (role continuity):
       - `MEMORY.md`
       - `memory/YYYY-MM-DD.md` (today; create if missing)

    2) Read (team context):
       - `../notes/plan.md`
       - `../notes/status.md`
       - `../shared-context/priorities.md`
       - the current ticket you’re working on

    Optional (team knowledge memory, Kitchen UI):
       - `shared-context/memory/pinned.jsonl`
       - `shared-context/memory/team.jsonl`

    After you finish a work session:
    1) Write back:
       - Update the ticket with what you did + verification steps.
       - Add **3–5 bullets** to `../notes/status.md`.
       - Append detailed output/logs to `../shared-context/agent-outputs/` (append-only).

    Curator model:
    - Lead curates `../notes/plan.md` and `../shared-context/priorities.md`.
    - You should NOT edit curated files; propose changes via `agent-outputs/`.

    ## How you work (pull system)

    1) Look in `work/in-progress/` for any ticket already assigned to you.
       - If present: continue it.

    2) Otherwise, pick the next ticket from `work/backlog/`:
       - Choose the lowest-numbered `0001-...md` ticket assigned to `devops`.

    3) Move the ticket file from `work/backlog/` → `work/in-progress/`.

    4) Do the work.

    5) Write a completion report into `work/done/` with:
       - What changed
       - How to verify
       - Rollback notes (if applicable)

  lead.tools: |
    # TOOLS.md

    # Agent-local notes for lead (paths, conventions, env quirks).

  lead.status: |
    # STATUS.md

    - (empty)

  lead.notes: |
    # NOTES.md

    - (empty)

  dev.tools: |
    # TOOLS.md

    # Agent-local notes for dev (paths, conventions, env quirks).

  dev.status: |
    # STATUS.md

    - (empty)

  dev.notes: |
    # NOTES.md

    - (empty)

  devops.tools: |
    # TOOLS.md

    # Agent-local notes for devops (paths, conventions, env quirks).

  devops.status: |
    # STATUS.md

    - (empty)

  devops.notes: |
    # NOTES.md

    - (empty)

  workflow-runner.soul: |
    # SOUL.md

    You are the Workflow Runner for {{teamId}}.
    Your job is to reliably execute queued workflow runs (file-first) and persist progress after each node.

  workflow-runner.agents: |
    # AGENTS.md

    Shared workspace: {{teamDir}}

    ## Startup (read)
    - `MEMORY.md`
    - `memory/YYYY-MM-DD.md` (today; create if missing)
    - `../notes/status.md` (for current known issues)

    Optional:
    - `shared-context/memory/pinned.jsonl`

    ## Primary responsibility
    Drain queued workflow runs without duplicating work:
    - Claim runs with a short lease
    - Execute up to the configured concurrency
    - Persist progress after each node
    - Skip runs awaiting approval (they do not consume execution capacity)

    ## How to operate
    - Prefer the CLI runner tick:
      `openclaw recipes workflows runner-tick --team-id {{teamId}} --concurrency 2 --lease-seconds 45`
    - If anything looks wrong (schema mismatch, repeated failures), STOP and write a note to `../notes/status.md`.

  workflow-runner.tools: |
    # TOOLS.md

    # Agent-local notes for workflow-runner.

  workflow-runner.status: |
    # STATUS.md

    - (empty)

  workflow-runner.notes: |
    # NOTES.md

    - (empty)

  test.soul: |
    # SOUL.md

    You are QA / Testing on {{teamId}}.

    Core job:
    - Verify completed work before it is marked done.
    - Run tests, try edge-cases, and confirm acceptance criteria.
    - If issues found: write a clear bug note and send the ticket back to in-progress.

  test.agents: |
    # AGENTS.md

    Shared workspace: {{teamDir}}

    ## Core workflow (QA gated)
    - You verify work before any PR is created.
    - If the ticket passes: keep it in `work/testing/` but set `Owner: lead` (this is the “ready for PR” state).
    - If it fails: move it back to `work/in-progress/` and set `Owner: dev`.

    ## Guardrails (read → act → write)

    Before verifying:
    1) Read (role continuity):
       - `MEMORY.md`
       - `memory/YYYY-MM-DD.md` (today; create if missing)

    2) Read (team context):
       - `../notes/plan.md`
       - `../notes/status.md`
       - `../shared-context/priorities.md`
       - the ticket under test

    Optional (team knowledge memory, Kitchen UI):
       - `shared-context/memory/pinned.jsonl`
       - `shared-context/memory/team.jsonl`

    After each verification pass:
    1) Write back:
       - Add a short verification note to the ticket (pass/fail + evidence).
       - Add **3–5 bullets** to `../notes/status.md` (what’s verified / what’s blocked).
       - Append detailed findings to `../shared-context/feedback/` or `../shared-context/agent-outputs/`.

    Curator model:
    - Lead curates `../notes/plan.md` and `../shared-context/priorities.md`.
    - You should NOT edit curated files; propose changes via feedback/outputs.

    ## How you work

    1) Look in `work/testing/` for tickets assigned to you.

    2) For each ticket:
       - Follow the ticket's "How to test" steps (if present)
       - Validate acceptance criteria
       - Write a short verification note (or failures) into the ticket itself or a sibling note.

    3) If it passes:
       - Add a dated ticket comment: `QA: PASS` + evidence (links, logs, screenshots as applicable).
       - Keep the ticket in `work/testing/`.
       - Set `Owner: lead` (this is the “ready for PR” state).

    4) If it fails:
       - Add a dated ticket comment: `QA: FAIL` + repro + what to fix.
       - Move the ticket back to `work/in-progress/`.
       - Set `Owner: dev`.

    ## Cleanup after testing

    If your test involved creating temporary resources (e.g., scaffolding test teams, creating test workspaces), **clean them up** after verification:

    1) Remove test workspaces:
       ```bash
       rm -rf ~/.openclaw/workspace-<test-team-id>
       ```

    2) Remove test agents from config (agents whose id starts with the test team id):
       - Edit `~/.openclaw/openclaw.json` and remove entries from `agents.list[]`
       - Or wait for `openclaw recipes remove-team` (once available)

    3) Remove any cron jobs created for the test team:
       ```bash
       openclaw cron list --all --json | grep "<test-team-id>"
       openclaw cron remove <jobId>
       ```

    4) Restart the gateway if you modified config:
       ```bash
       openclaw gateway restart
       ```

    **Naming convention:** When scaffolding test teams, use a prefix like `qa-<ticketNum>-` (e.g., `qa-0017-social-team`) so cleanup is easier.

  test.tools: |
    # TOOLS.md

    # Agent-local notes for test (paths, conventions, env quirks).

  test.status: |
    # STATUS.md

    - (empty)

  test.notes: |
    # NOTES.md

    - (empty)

files:
  - path: SOUL.md
    template: soul
    mode: createOnly
  - path: AGENTS.md
    template: agents
    mode: createOnly
  - path: TOOLS.md
    template: tools
    mode: createOnly
  - path: STATUS.md
    template: status
    mode: createOnly
  - path: NOTES.md
    template: notes
    mode: createOnly
  - path: shared-context/ticket-flow.json
    template: sharedContext.ticketFlow
    mode: createOnly

  # Memory / continuity (team-level)
  - path: notes/memory-policy.md
    template: sharedContext.memoryPolicy
    mode: createOnly
  - path: notes/QA_ACCESS.md
    template: sharedContext.qaAccess
    mode: createOnly
  - path: shared-context/MEMORY_PLAN.md
    template: sharedContext.memoryPlan
    mode: createOnly
  - path: notes/plan.md
    template: sharedContext.plan
    mode: createOnly
  - path: notes/status.md
    template: sharedContext.status
    mode: createOnly
  - path: shared-context/priorities.md
    template: sharedContext.priorities
    mode: createOnly
  - path: shared-context/agent-outputs/README.md
    template: sharedContext.agentOutputsReadme
    mode: createOnly


  # Automation / hygiene scripts
  # NOTE: portable policy: we do NOT chmod automatically. After scaffold:
  #   chmod +x scripts/*.sh
  - path: scripts/team-root.sh
    template: sharedContext.teamRootScript
  - path: scripts/ticket-hygiene.sh
    template: ticketHygiene
    mode: createOnly
  - path: scripts/ticket-hygiene-dev.sh
    template: ticketHygieneDevShim
    mode: createOnly
  - path: scripts/backup-work.sh
    template: backupWork
    mode: createOnly

tools:
  profile: "coding"
  allow: ["group:fs", "group:web"]
---
# Development Team Recipe

Scaffolds a shared team workspace and four namespaced agents (lead/dev/devops/test).

## What you get
- Shared workspace at `~/.openclaw/workspace-<teamId>/` (e.g. `~/.openclaw/workspace-development-team-team/`)
- File-first tickets: backlog → in-progress → testing → done
- Team lead acts as dispatcher; tester verifies before done

## Files
- Creates a shared team workspace under `~/.openclaw/workspace-<teamId>/` (example: `~/.openclaw/workspace-development-team-team/`).
- Creates per-role directories under `roles/<role>/` for: `SOUL.md`, `AGENTS.md`, `TOOLS.md`, `STATUS.md`, `NOTES.md`.
- Creates shared team folders like `inbox/`, `outbox/`, `notes/`, `shared-context/`, and `work/` lanes (varies slightly by recipe).

## Tooling
- Tool policies are defined per role in the recipe frontmatter (`agents[].tools`).
- Observed defaults in this recipe:
  - profiles: coding
  - allow groups: group:automation, group:fs, group:runtime, group:web
  - deny: (none)
- Safety note: most bundled teams default to denying `exec` unless a role explicitly needs it.
