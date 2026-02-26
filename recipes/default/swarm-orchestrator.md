---
id: swarm-orchestrator
name: Swarm Orchestrator
version: 0.2.0
description: Scaffold an OpenClaw “orchestrator” workspace that spawns coding agents in tmux + git worktrees and monitors them via a lightweight task registry.
kind: agent
requiredSkills: []
cronJobs:
  - id: swarm-monitor-loop
    name: "Swarm monitor loop"
    schedule: "*/10 * * * *"
    timezone: "America/New_York"
    message: "Reminder: swarm monitor loop — run .clawdbot/check-agents.sh to detect stuck/failed tmux agents, PR/CI state, and decide whether to notify or retry. Update .clawdbot/active-tasks.json as needed."
    enabledByDefault: false
  - id: swarm-cleanup-loop
    name: "Swarm cleanup loop"
    schedule: "17 4 * * *"
    timezone: "America/New_York"
    message: "Reminder: swarm cleanup loop — consider running .clawdbot/cleanup.sh to prune completed worktrees, closed PR branches, and dead tmux sessions (safe-by-default; no deletes unless explicitly enabled)."
    enabledByDefault: false

templates:
  soul: |
    # SOUL.md

    You are an orchestration agent (“swarm orchestrator”).

    You do NOT primarily write code.

    Your job is to:
    - translate business context into sharp prompts + constraints
    - spawn focused coding agents into isolated git worktrees + tmux sessions
    - monitor them and steer when needed
    - only notify a human when a PR is truly ready for review

    Guardrails:
    - Keep changes small and PR-shaped.
    - Don’t delete worktrees/branches unless the user explicitly opts in.
    - Always use the prompt template in `.clawdbot/PROMPT_TEMPLATE.md`.

  agents: |
    # AGENTS.md

    ## Operating loop

    1) Read `.clawdbot/active-tasks.json`.
    2) For each task:
       - confirm tmux session is alive
       - confirm branch/worktree exists
       - if configured, check PR/CI status
    3) Only ping the human when:
       - a task is blocked and needs a decision
       - a PR meets the default Definition of Done

    ## Key files

    - `.clawdbot/README.md` — setup + how to use
    - `.clawdbot/CONVENTIONS.md` — default naming + how to change
    - `.clawdbot/PROMPT_TEMPLATE.md` — required spawn prompt template
    - `.clawdbot/TEMPLATE.md` — copy/paste helper for new tasks
    - `.clawdbot/env.sh` — portable env configuration
    - `.clawdbot/active-tasks.json` — task registry
    - `.clawdbot/spawn.sh` — create worktree + start tmux session
    - `.clawdbot/check-agents.sh` — monitor loop (token-efficient)
    - `.clawdbot/cleanup.sh` — safe-by-default cleanup scaffold

  readme: |
    # Swarm Orchestrator

    This scaffold gives you a lightweight “swarm” workflow:

    - each coding agent runs in its own **git worktree** + **branch**
    - each agent runs in its own **tmux session** (attach + steer mid-flight)
    - a simple JSON registry (`active-tasks.json`) makes monitoring deterministic

    The orchestrator’s job is to:
    1) translate a request into a tight prompt + constraints
    2) spawn 1+ coding agents in parallel
    3) monitor progress until a PR is truly ready for review

    ---

    ## 0) Prerequisites

    Required:
    - `git`
    - `tmux`
    - `jq`

    Optional (recommended):
    - GitHub CLI `gh` (for PR + CI status checks)
      - run `gh auth login` to authenticate

    Quick check:

    ```bash
    command -v git  >/dev/null || echo "missing: git"
    command -v tmux >/dev/null || echo "missing: tmux"
    command -v jq   >/dev/null || echo "missing: jq"

    # optional:
    command -v gh   >/dev/null || echo "optional missing: gh (PR/CI monitoring)"
    ```

    ---

    ## 1) One-time setup

    ### 1.1 Make scripts executable (manual)

    This scaffold does **not** change file permissions automatically.

    Run:

    ```bash
    chmod +x .clawdbot/*.sh
    ```

    ### 1.2 Configure environment

    Edit: `.clawdbot/env.sh`

    Set:
    - `SWARM_REPO_DIR` — absolute path to the repo you want agents to work on
    - `SWARM_WORKTREE_ROOT` — absolute path where worktrees will be created
      - recommended: a dedicated folder (NOT inside your repo folder, and NOT inside the OpenClaw workspace)
    - `SWARM_BASE_REF` — base ref to branch from (default: `origin/main`)

    Optional:
    - `SWARM_AGENT_RUNNER` — wrapper to start your chosen coding agent CLI (Codex / Claude Code / etc.)

    ---

    ## 2) Conventions (defaults)

    Default conventions are in:
    - `.clawdbot/CONVENTIONS.md`

    If you want to customize naming or the Definition of Done, change it there.

    ---

    ## 3) Spawning agents

    ### 3.1 CLI-first (recommended)

    Start a task (writes a spec file, creates worktree/branch, starts tmux, updates registry):

    ```bash
    ./.clawdbot/task.sh start \
      --task-id 0082-attempt-a \
      --spec-file /path/to/spec.md
    ```

    To see task status (registry + best-effort tmux checks):

    ```bash
    ./.clawdbot/task.sh status
    ```

    ### 3.2 Low-level spawn (manual)

    ```bash
    ./.clawdbot/spawn.sh <branch-slug> <codex|claude> <tmux-session> [model] [reasoning]
    ```

    Example:

    ```bash
    ./.clawdbot/spawn.sh feat/0082-attempt-a codex swarm-0082-a gpt-5.3-codex high
    ```

    Attach:

    ```bash
    tmux attach -t swarm-0082-a
    ```

    Spawning more than one agent = run `spawn.sh` multiple times with different branch slugs + tmux session names.

    ---

    ## 4) Task registry

    File: `.clawdbot/active-tasks.json`

    Keep it accurate. Monitoring should read the registry, not guess.

    ---

    ## 5) Monitoring

    ```bash
    ./.clawdbot/check-agents.sh
    ```

    This is intentionally simple and deterministic. Extend it to include PR/CI checks if desired.

    ---

    ## 6) Default Definition of Done (notify-ready)

    A PR is **ready for human review** when:
    - PR exists
    - branch is mergeable and up to date with base
    - CI is green (lint/types/tests as appropriate)
    - if the PR includes **UI changes**, include screenshots in the PR description
    - a human still performs the final review + merge decision (default gate)

  conventions: |
    # Swarm Conventions (Defaults)

    These defaults are designed to be portable across users and repos.

    ## Naming

    ### Branch naming

    Recommended:
    - `feat/<ticket>-<slug>`
    - `fix/<ticket>-<slug>`

    Examples:
    - `feat/0082-swarm-orchestrator`
    - `fix/0141-login-redirect`

    If you do not use tickets:
    - `feat/<slug>` / `fix/<slug>` is fine.

    ### tmux session naming

    Recommended:
    - `swarm-<ticket>-<suffix>`

    Examples:
    - `swarm-0082-a`
    - `swarm-0082-b`

    ## Directory layout

    - Orchestrator workspace: OpenClaw agent workspace (scaffold output)
    - Worktrees root: set via `SWARM_WORKTREE_ROOT` (recommended: dedicated folder outside repo + outside OpenClaw workspace)

    ## Definition of Done (default)

    A PR is ready for human review when:
    - PR exists
    - mergeable + up-to-date
    - CI green
    - screenshots included *only if UI changes*
    - human gate remains (default)

  promptTemplate: |
    # Swarm Coding-Agent Prompt Template

    Copy this template when spawning a coding agent.

    IMPORTANT:
    - Do not freestyle prompts.
    - Keep scope tight.
    - Optimize for a small, reviewable PR.

    ---

    ## Ticket / Goal

    - Ticket (optional): <NNNN>
    - Goal: <one sentence>

    ## Context

    <why this matters / user story / product intent>

    ## Requirements

    - <requirement 1>
    - <requirement 2>

    ## Constraints (very important)

    - Keep changes small and PR-shaped.
    - Avoid refactors unless required to meet the requirements.
    - If you need clarification, STOP and ask.
    - If you touch UI, screenshots are required (otherwise omit screenshots).

    ## Definition of Done (default)

    - Code compiles/builds.
    - CI is green (lint/types/tests as appropriate for this repo).
    - PR is opened with a clear description.
    - If UI changed: include before/after screenshots in the PR description.
    - Do NOT merge. Leave it for human review.

    ## File / Area hints (optional)

    - Focus files:
      - <path>
      - <path>

    ## Suggested plan

    1) <step>
    2) <step>

    ## Deliverables

    - A PR implementing the requirements.
    - Notes in the PR description: what changed + how to verify.

  taskTemplate: |
    # Swarm Task Template

    Use this as a starting point for a new entry in `active-tasks.json`.

    - Decide the branch name using `CONVENTIONS.md`.
    - Decide a unique tmux session name.

    ```json
    {
      "id": "0082-attempt-a",
      "ticket": "0082",
      "description": "<short description>",
      "branch": "feat/0082-attempt-a",
      "worktree": "feat/0082-attempt-a",
      "tmuxSession": "swarm-0082-a",
      "agent": "codex",
      "model": "gpt-5.3-codex",
      "startedAt": 0,
      "status": "queued",
      "notifyOnComplete": true,
      "prUrl": null,
      "checks": {}
    }
    ```

  env: |
    # .clawdbot/env.sh
    #
    # Configure these for your environment.

    # Absolute path to the repo you want to operate on.
    export SWARM_REPO_DIR=""

    # Absolute path where worktrees will be created.
    # Recommended: a dedicated folder (NOT inside the repo folder, NOT inside the OpenClaw workspace).
    export SWARM_WORKTREE_ROOT=""

    # Default base ref to branch from.
    export SWARM_BASE_REF="origin/main"

    # Optional: path to your agent runner wrapper.
    # This script/command should start Codex/Claude Code/etc inside the worktree.
    export SWARM_AGENT_RUNNER=""

  empty: |
    

  activeTasks: |
    [
      {
        "id": "example-task",
        "ticket": "",
        "description": "Replace me",
        "repo": "",
        "worktree": "",
        "branch": "",
        "tmuxSession": "",
        "agent": "codex",
        "model": "",
        "startedAt": 0,
        "status": "queued",
        "notifyOnComplete": true,
        "prUrl": null,
        "checks": {}
      }
    ]

  spawn: |
    #!/usr/bin/env bash
    set -euo pipefail

    HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    # shellcheck disable=SC1091
    source "$HERE/env.sh"

    if [[ -z "${SWARM_REPO_DIR:-}" || -z "${SWARM_WORKTREE_ROOT:-}" || -z "${SWARM_BASE_REF:-}" ]]; then
      echo "Missing env. Edit $HERE/env.sh (SWARM_REPO_DIR, SWARM_WORKTREE_ROOT, SWARM_BASE_REF)." >&2
      exit 2
    fi

    BRANCH_SLUG="${1:-}"
    AGENT_KIND="${2:-codex}"          # codex|claude
    TMUX_SESSION="${3:-}"
    MODEL="${4:-}"
    REASONING="${5:-medium}"

    if [[ -z "$BRANCH_SLUG" || -z "$TMUX_SESSION" ]]; then
      echo "Usage: $0 <branch-slug> <codex|claude> <tmux-session> [model] [reasoning]" >&2
      exit 2
    fi

    WORKTREE_DIR="$SWARM_WORKTREE_ROOT/$BRANCH_SLUG"

    echo "[swarm] Creating worktree: $WORKTREE_DIR"
    mkdir -p "$SWARM_WORKTREE_ROOT"
    cd "$SWARM_REPO_DIR"

    git worktree add "$WORKTREE_DIR" -b "$BRANCH_SLUG" "$SWARM_BASE_REF"

    echo "[swarm] Starting tmux session: $TMUX_SESSION"
    if [[ -z "${SWARM_AGENT_RUNNER:-}" ]]; then
      echo "SWARM_AGENT_RUNNER not set. Starting a shell in tmux; run your agent CLI manually." >&2
      tmux new-session -d -s "$TMUX_SESSION" -c "$WORKTREE_DIR" "bash"
    else
      tmux new-session -d -s "$TMUX_SESSION" -c "$WORKTREE_DIR" \
        "$SWARM_AGENT_RUNNER $AGENT_KIND ${MODEL:-} ${REASONING:-medium}"
    fi

    echo "[swarm] Done. Attach with: tmux attach -t $TMUX_SESSION"

  checkAgents: |
    #!/usr/bin/env bash
    set -euo pipefail

    HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    REG="$HERE/active-tasks.json"

    if [[ ! -f "$REG" ]]; then
      echo "Missing $REG" >&2
      exit 2
    fi

    echo "[swarm] Checking tmux sessions listed in active-tasks.json ..."

    if ! command -v jq >/dev/null 2>&1; then
      echo "jq is required" >&2
      exit 2
    fi

    mapfile -t sessions < <(jq -r '.[].tmuxSession // empty' "$REG" | sort -u)
    if [[ ${#sessions[@]} -eq 0 ]]; then
      echo "[swarm] No tmux sessions found in registry."
      exit 0
    fi

    for s in "${sessions[@]}"; do
      if tmux has-session -t "$s" 2>/dev/null; then
        echo "[ok] tmux session alive: $s"
      else
        echo "[dead] tmux session missing: $s"
      fi
    done

  cleanup: |
    #!/usr/bin/env bash
    set -euo pipefail

    echo "[swarm] Cleanup scaffold (safe-by-default)."
    echo "- This script currently does NOT delete anything automatically."
    echo "- Extend it to prune worktrees only after PRs are merged and branches are removed."

  taskCli: |
    #!/usr/bin/env bash
    set -euo pipefail

    HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    # shellcheck disable=SC1091
    source "$HERE/env.sh"

    REG="$HERE/active-tasks.json"
    TASKS_DIR="$HERE/tasks"

    usage() {
      cat <<'USAGE'
      Usage:
        ./.clawdbot/task.sh start --task-id <id> (--spec <text> | --spec-file <path>) [--base-ref <ref>] [--branch <branch>] [--tmux-session <name>] [--agent <codex|claude>] [--model <model>] [--reasoning <low|medium|high>]
        ./.clawdbot/task.sh status

      Notes:
        - Requires: git, tmux, jq
        - Requires env in .clawdbot/env.sh: SWARM_REPO_DIR, SWARM_WORKTREE_ROOT, SWARM_BASE_REF
        - Recommended: set SWARM_AGENT_RUNNER so the tmux session starts your coding agent automatically.
      USAGE
    }

    require_cmd() {
      if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1" >&2
        exit 2
      fi
    }

    safe_id() {
      [[ "$1" =~ ^[a-z0-9][a-z0-9-]{0,62}$ ]]
    }

    cmd="${1:-}"
    shift || true

    case "$cmd" in
      start)
        require_cmd git
        require_cmd tmux
        require_cmd jq

        if [[ -z "${SWARM_REPO_DIR:-}" || -z "${SWARM_WORKTREE_ROOT:-}" || -z "${SWARM_BASE_REF:-}" ]]; then
          echo "Missing env. Edit $HERE/env.sh (SWARM_REPO_DIR, SWARM_WORKTREE_ROOT, SWARM_BASE_REF)." >&2
          exit 2
        fi

        task_id=""
        spec_text=""
        spec_file_in=""
        base_ref="${SWARM_BASE_REF}"
        branch=""
        tmux_session=""
        agent_kind="codex"
        model=""
        reasoning="medium"

        while [[ $# -gt 0 ]]; do
          case "$1" in
            --task-id) task_id="${2:-}"; shift 2;;
            --spec) spec_text="${2:-}"; shift 2;;
            --spec-file) spec_file_in="${2:-}"; shift 2;;
            --base-ref) base_ref="${2:-}"; shift 2;;
            --branch) branch="${2:-}"; shift 2;;
            --tmux-session) tmux_session="${2:-}"; shift 2;;
            --agent) agent_kind="${2:-codex}"; shift 2;;
            --model) model="${2:-}"; shift 2;;
            --reasoning) reasoning="${2:-medium}"; shift 2;;
            -h|--help) usage; exit 0;;
            *) echo "Unknown arg: $1" >&2; usage; exit 2;;
          esac
        done

        if [[ -z "$task_id" ]]; then
          echo "--task-id is required" >&2
          usage
          exit 2
        fi
        if ! safe_id "$task_id"; then
          echo "task-id must match ^[a-z0-9][a-z0-9-]{0,62}$ (lowercase letters, numbers, dashes)" >&2
          exit 2
        fi
        if [[ -n "$spec_text" && -n "$spec_file_in" ]]; then
          echo "Provide exactly one of --spec or --spec-file" >&2
          exit 2
        fi
        if [[ -z "$spec_text" && -z "$spec_file_in" ]]; then
          echo "One of --spec or --spec-file is required" >&2
          exit 2
        fi
        if [[ -n "$spec_file_in" && ! -f "$spec_file_in" ]]; then
          echo "spec-file not found: $spec_file_in" >&2
          exit 2
        fi

        mkdir -p "$TASKS_DIR"
        task_file="$TASKS_DIR/$task_id.md"

        if [[ -n "$spec_file_in" ]]; then
          cp "$spec_file_in" "$task_file"
        else
          printf "%s\n" "$spec_text" > "$task_file"
        fi

        branch="${branch:-feat/$task_id}"
        tmux_session="${tmux_session:-swarm-$task_id}"
        worktree_dir="$SWARM_WORKTREE_ROOT/$branch"

        echo "[swarm] taskId=$task_id"
        echo "[swarm] taskFile=$task_file"
        echo "[swarm] branch=$branch"
        echo "[swarm] worktree=$worktree_dir"
        echo "[swarm] tmuxSession=$tmux_session"

        mkdir -p "$SWARM_WORKTREE_ROOT"

        # Create worktree + branch.
        cd "$SWARM_REPO_DIR"
        if git show-ref --verify --quiet "refs/heads/$branch"; then
          echo "Branch already exists locally: $branch" >&2
          exit 2
        fi
        if [[ -d "$worktree_dir" ]]; then
          echo "Worktree directory already exists: $worktree_dir" >&2
          exit 2
        fi
        git worktree add "$worktree_dir" -b "$branch" "$base_ref"

        # Start tmux session.
        if tmux has-session -t "$tmux_session" 2>/dev/null; then
          echo "tmux session already exists: $tmux_session" >&2
          exit 2
        fi

        if [[ -z "${SWARM_AGENT_RUNNER:-}" ]]; then
          echo "SWARM_AGENT_RUNNER not set. Starting bash in tmux (spec is still written to file)." >&2
          tmux new-session -d -s "$tmux_session" -c "$worktree_dir" "bash"
        else
          tmux new-session -d -s "$tmux_session" -c "$worktree_dir" \
            "$SWARM_AGENT_RUNNER $agent_kind ${model:-} ${reasoning:-medium}"
          # Best-effort injection: instruct agent to read the spec file.
          tmux send-keys -t "$tmux_session" -l "Please follow the task spec at: $task_file" C-m || true
        fi

        # Update registry (atomic).
        now="$(date +%s)"
        mkdir -p "$(dirname "$REG")"
        if [[ ! -f "$REG" ]]; then
          echo "[]" > "$REG"
        fi

        tmp="$REG.tmp"
        jq --arg id "$task_id" \
           --arg taskFile "$task_file" \
           --arg branch "$branch" \
           --arg worktreePath "$worktree_dir" \
           --arg tmuxSession "$tmux_session" \
           --arg startedAt "$now" \
           '([.[] | select(.id != $id)] + [{
              id: $id,
              taskId: $id,
              taskFile: $taskFile,
              branch: $branch,
              worktreePath: $worktreePath,
              tmuxSession: $tmuxSession,
              startedAt: ($startedAt|tonumber),
              prUrl: (.prUrl // null),
              status: "running"
            }])' "$REG" > "$tmp"
        mv "$tmp" "$REG"

        echo "[swarm] Started. Attach with: tmux attach -t $tmux_session"
        ;;

      status)
        require_cmd tmux
        require_cmd jq

        if [[ ! -f "$REG" ]]; then
          echo "Missing registry: $REG" >&2
          exit 2
        fi

        echo "[swarm] Registry: $REG"
        jq -r '.[] | "- \(.id): tmux=\(.tmuxSession // "") branch=\(.branch // "") worktree=\(.worktreePath // "") status=\(.status // "") prUrl=\(.prUrl // "")"' "$REG" || true

        echo ""
        echo "[swarm] tmux session check:"
        mapfile -t sessions < <(jq -r '.[].tmuxSession // empty' "$REG" | sort -u)
        if [[ ${#sessions[@]} -eq 0 ]]; then
          echo "(none)"
          exit 0
        fi
        for s in "${sessions[@]}"; do
          if tmux has-session -t "$s" 2>/dev/null; then
            echo "[ok] $s"
          else
            echo "[dead] $s"
          fi
        done
        ;;

      ""|-h|--help)
        usage
        exit 0
        ;;

      *)
        echo "Unknown command: $cmd" >&2
        usage
        exit 2
        ;;
    esac

files:
  - path: SOUL.md
    template: soul
    mode: createOnly
  - path: AGENTS.md
    template: agents
    mode: createOnly
  - path: .clawdbot/README.md
    template: readme
    mode: createOnly
  - path: .clawdbot/CONVENTIONS.md
    template: conventions
    mode: createOnly
  - path: .clawdbot/PROMPT_TEMPLATE.md
    template: promptTemplate
    mode: createOnly
  - path: .clawdbot/TEMPLATE.md
    template: taskTemplate
    mode: createOnly
  - path: .clawdbot/env.sh
    template: env
    mode: createOnly
  - path: .clawdbot/tasks/.keep
    template: empty
    mode: createOnly
  - path: .clawdbot/task.sh
    template: taskCli
    mode: createOnly
  - path: .clawdbot/active-tasks.json
    template: activeTasks
    mode: createOnly
  - path: .clawdbot/spawn.sh
    template: spawn
    mode: createOnly
  - path: .clawdbot/check-agents.sh
    template: checkAgents
    mode: createOnly
  - path: .clawdbot/cleanup.sh
    template: cleanup
    mode: createOnly

tools:
  profile: "coding"
  allow: ["group:fs", "group:web", "group:runtime", "group:automation", "cron", "message"]
  deny: []
---
# Swarm Orchestrator

This is a workflow scaffold recipe. It creates a portable, file-first setup for running multiple coding agents in parallel using git worktrees + tmux.
