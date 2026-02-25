---
id: swarm-orchestrator
name: Swarm Orchestrator
version: 0.1.0
description: Scaffold an OpenClaw “orchestrator” workspace that spawns coding agents in tmux+git worktrees, monitors them, and notifies when PRs are ready.
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

    You are **Zoe**, an orchestration agent.

    Your job is to:
    - translate business context into sharp prompts
    - spawn focused coding agents (Codex / Claude Code) into isolated git worktrees
    - monitor them (tmux + logs + PR/CI status)
    - request reviews and notify a human only when a PR is actually “ready”

    **Guardrails**
    - Prefer small, safe steps.
    - Don’t delete worktrees/branches unless the user explicitly opts in.
    - Keep the task registry (`.clawdbot/active-tasks.json`) accurate.

  agents: |
    # AGENTS.md

    ## Operating loop

    1) Read `.clawdbot/active-tasks.json`.
    2) For each task:
       - confirm tmux session is alive
       - confirm branch/worktree exists
       - check PR status (if any)
       - check CI status (if any)
    3) Only ping the human when:
       - a task is blocked and needs a decision
       - a PR meets the “ready” checklist

    ## Files

    - `.clawdbot/active-tasks.json` — registry of in-flight work
    - `.clawdbot/check-agents.sh` — deterministic monitor
    - `.clawdbot/spawn.sh` — create worktree + start tmux agent
    - `.clawdbot/cleanup.sh` — optional cleanup (safe-by-default)

  readme: |
    # Swarm Orchestrator (Recipe)

    This recipe scaffolds a lightweight “agent swarm” workflow inspired by Elvis Sun’s writeup.

    Core idea:
    - **Orchestrator (you)** holds business context + decides *what* to do next.
    - **Coding agents** get narrow, code-only prompts and work in isolated **git worktrees**.
    - **tmux sessions** make mid-flight steering easy.
    - A simple monitor loop reads `.clawdbot/active-tasks.json` and checks:
      - tmux liveness
      - PR existence
      - CI status
      - “ready for human review” checklist

    ## Quick start

    1) Create a task entry in `.clawdbot/active-tasks.json`.
    2) Run:

       ```bash
       ./.clawdbot/spawn.sh feat/my-change codex my-session "gpt-5.3-codex" high
       ```

    3) Monitor:

       ```bash
       ./.clawdbot/check-agents.sh
       ```

    ## Model CLIs (examples)

    - Codex CLI:

      ```bash
      codex --model gpt-5.3-codex -c "model_reasoning_effort=high" "<prompt>"
      ```

    - Claude Code:

      ```bash
      claude --model claude-opus-4.5 -p "<prompt>"
      ```

    ## Notes

    - This scaffold does **not** assume your repo layout. You’ll need to set env vars in `.clawdbot/env.sh`.
    - PR/CI checks require `gh auth login` and appropriate permissions.

  env: |
    # .clawdbot/env.sh
    #
    # Configure these for your environment.

    # Absolute path to the repo you want to operate on.
    export SWARM_REPO_DIR=""

    # Base directory where worktrees are created.
    # Example: /Users/you/Documents/GitHub/myrepo-worktrees
    export SWARM_WORKTREE_ROOT=""

    # Default base branch to branch from.
    export SWARM_BASE_REF="origin/main"

    # Optional: path to your agent runner wrapper.
    # For example, a script that executes `codex ...` or `claude ...`
    export SWARM_AGENT_RUNNER=""

  activeTasks: |
    [
      {
        "id": "example-task",
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
        "pr": null,
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

    # Create worktree + branch
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

    # NOTE: this is intentionally simple and token-efficient.
    # It’s a scaffold: customize to add gh PR/CI checks and richer state updates.

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

    HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    # shellcheck disable=SC1091
    source "$HERE/env.sh"

    echo "[swarm] Cleanup scaffold (safe-by-default)."
    echo "- This script currently does NOT delete anything automatically."
    echo "- Extend it to prune worktrees only after PRs are merged and branches are removed."

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
  - path: .clawdbot/env.sh
    template: env
    mode: createOnly
    chmod: "644"
  - path: .clawdbot/active-tasks.json
    template: activeTasks
    mode: createOnly
  - path: .clawdbot/spawn.sh
    template: spawn
    mode: createOnly
    chmod: "755"
  - path: .clawdbot/check-agents.sh
    template: checkAgents
    mode: createOnly
    chmod: "755"
  - path: .clawdbot/cleanup.sh
    template: cleanup
    mode: createOnly
    chmod: "755"

tools:
  profile: "coding"
  allow: ["group:fs", "group:web", "group:runtime", "group:automation", "cron", "message"]
  deny: []
---
# Swarm Orchestrator

This is a *workflow scaffold* recipe. It creates scripts and a small task registry to help you run a tmux+worktree “agent swarm” with an OpenClaw orchestrator in the loop.

## What you get
- `.clawdbot/active-tasks.json` registry
- `.clawdbot/spawn.sh` worktree + tmux launcher
- `.clawdbot/check-agents.sh` monitor loop (skeleton)
- `.clawdbot/cleanup.sh` safe cleanup scaffold

## What you’ll likely customize
- The agent runner wrapper (`SWARM_AGENT_RUNNER`) to call Codex or Claude Code.
- The monitor script to also check:
  - PR exists for branch (`gh pr view`)
  - CI status (`gh run list` / checks)
  - multi-model review gates
- The notify behavior (Telegram) — currently left as a reminder-driven loop.
