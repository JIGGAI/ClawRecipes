---
id: workflow-runner-addon
kind: agent
name: Workflow runner (team add-on)

# Install into an existing team workspace via:
#   openclaw recipes add-role --team-id <teamId> --role workflow-runner --recipe workflow-runner-addon --apply-config

cronJobs:
  - id: workflow-runner-loop
    name: "{{teamId}} • workflow runner loop (runs queue)"
    schedule: "*/5 * * * *"
    agentId: "{{teamId}}-workflow-runner"
    enabledByDefault: false
    message: |
      [cron] Workflow runner loop (runs queue)

      Goal: claim and execute queued workflow runs for {{teamId}}.

      Run:
        openclaw recipes workflows runner-tick --team-id {{teamId}} --concurrency 2 --lease-seconds 45

templates:
  soul: |
    # SOUL.md

    You are the Workflow Runner for {{teamId}}.
    Your job is to reliably execute queued workflow runs (file-first) and persist progress after each node.

  agents: |
    # AGENTS.md

    Shared workspace: {{teamDir}}

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

  tools: |
    # TOOLS.md

    # Agent-local notes for workflow-runner.

  status: |
    # STATUS.md

    - (empty)

  notes: |
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

---
