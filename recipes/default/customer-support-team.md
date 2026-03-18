---
id: customer-support-team
name: Customer Support Team
version: 0.1.0
description: A support workflow team (triage, resolver, kb-writer) that turns cases into replies and knowledge base articles.
kind: team
cronJobs:
  - id: lead-triage-loop
    name: "Lead triage loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    message: "Automated lead triage loop: triage inbox/tickets, assign work, and update notes/status.md."
    enabledByDefault: false
  - id: execution-loop
    name: "Execution loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    message: "Automated execution loop: make progress on in-progress tickets, keep changes small/safe, and update notes/status.md."
    enabledByDefault: false
  # pr-watcher omitted (enable only when a real PR integration exists)
requiredSkills: []
team:
  teamId: customer-support-team
agents:
  - role: lead
    name: Support Lead
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime"]
      deny: ["exec"]
  - role: triage
    name: Support Triage
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: resolver
    name: Support Resolver
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: kb-writer
    name: KB Writer
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]

templates:
  sharedContext.memoryPolicy: |
    # Team Memory Policy (File-first)

    Quick link: see `shared-context/MEMORY_PLAN.md` for the canonical “what goes where” map.

    This team is run **file-first**. Chat is not the system of record.

    ## Where to write things
    - Ticket = source of truth for a unit of work.
    - `../notes/plan.md` + `../shared-context/priorities.md` are **lead-curated**.
    - `../notes/status.md` is **append-only** and updated after each work session (3–5 bullets).
    - `../shared-context/agent-outputs/` is **append-only** logs/output.

    ## End-of-session checklist (everyone)
    After meaningful work:
    1) Update the ticket with what changed + how to verify + rollback.
    2) Add a dated note in the ticket `## Comments`.
    3) Append 3–5 bullets to `../notes/status.md`.
    4) Append logs/output to `../shared-context/agent-outputs/`.

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
    1) Read:
       - `../notes/plan.md`
       - `../notes/status.md`
       - `../shared-context/priorities.md`
       - the relevant ticket(s)

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
    - Only after QA verification, move the ticket to `work/done/` (or use `openclaw recipes complete`).
    - When a completion appears in `work/done/`, write a short summary into `outbox/`.
  triage.soul: |
    # SOUL.md

    You are Support Triage on {{teamId}}.

    You:
    - clarify the issue
    - request missing information
    - classify severity and category

  triage.agents: |
    # AGENTS.md

    Team: {{teamId}}
    Shared workspace: {{teamDir}}
    Role: triage

    ## Guardrails (read → act → write)
    Before you act:
    1) Read:
       - `../notes/plan.md`
       - `../notes/status.md`
       - relevant ticket(s) in `work/in-progress/`
       - any relevant shared context under `shared-context/`

    After you act:
    1) Write back:
       - Put outputs in the agreed folder (usually `outbox/` or a ticket file).
       - Update the ticket with what you did and where the artifact is.

    ## Workflow
    - Prefer a pull model: wait for a clear task from the lead, or propose a scoped task.
    - Keep work small and reversible.
  resolver.soul: |
    # SOUL.md

    You are Support Resolver on {{teamId}}.

    You propose fixes/workarounds and draft customer-ready replies.

  resolver.agents: |
    # AGENTS.md

    Team: {{teamId}}
    Shared workspace: {{teamDir}}
    Role: resolver

    ## Guardrails (read → act → write)
    Before you act:
    1) Read:
       - `../notes/plan.md`
       - `../notes/status.md`
       - relevant ticket(s) in `work/in-progress/`
       - any relevant shared context under `shared-context/`

    After you act:
    1) Write back:
       - Put outputs in the agreed folder (usually `outbox/` or a ticket file).
       - Update the ticket with what you did and where the artifact is.

    ## Workflow
    - Prefer a pull model: wait for a clear task from the lead, or propose a scoped task.
    - Keep work small and reversible.
  kb-writer.soul: |
    # SOUL.md

    You are a Knowledge Base Writer on {{teamId}}.

    Turn resolved cases into reusable KB entries and macros.

  kb-writer.agents: |
    # AGENTS.md

    Team: {{teamId}}
    Shared workspace: {{teamDir}}
    Role: kb-writer

    ## Guardrails (read → act → write)
    Before you act:
    1) Read:
       - `../notes/plan.md`
       - `../notes/status.md`
       - relevant ticket(s) in `work/in-progress/`
       - any relevant shared context under `shared-context/`

    After you act:
    1) Write back:
       - Put outputs in the agreed folder (usually `outbox/` or a ticket file).
       - Update the ticket with what you did and where the artifact is.

    ## Workflow
    - Prefer a pull model: wait for a clear task from the lead, or propose a scoped task.
    - Keep work small and reversible.
  lead.tools: |
    # TOOLS.md

    # Agent-local notes for lead (paths, conventions, env quirks).

  lead.status: |
    # STATUS.md

    - (empty)

  lead.notes: |
    # NOTES.md

    - (empty)

  triage.tools: |
    # TOOLS.md

    # Agent-local notes for triage (paths, conventions, env quirks).

  triage.status: |
    # STATUS.md

    - (empty)

  triage.notes: |
    # NOTES.md

    - (empty)

  resolver.tools: |
    # TOOLS.md

    # Agent-local notes for resolver (paths, conventions, env quirks).

  resolver.status: |
    # STATUS.md

    - (empty)

  resolver.notes: |
    # NOTES.md

    - (empty)

  kb-writer.tools: |
    # TOOLS.md

    # Agent-local notes for kb-writer (paths, conventions, env quirks).

  kb-writer.status: |
    # STATUS.md

    - (empty)

  kb-writer.notes: |
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


  # Memory / continuity (team-level)
  - path: notes/memory-policy.md
    template: sharedContext.memoryPolicy
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
  - path: shared-context/MEMORY_PLAN.md
    template: sharedContext.memoryPlan
    mode: createOnly
  - path: shared-context/agent-outputs/README.md
    template: sharedContext.agentOutputsReadme
    mode: createOnly


tools:
  profile: "messaging"
  allow: ["group:fs", "group:web"]
  deny: ["exec"]
---
# Customer Support Team Recipe

A file-first support workflow: triage → resolution → KB.

## Files
- Creates a shared team workspace under `~/.openclaw/workspace-<teamId>/` (example: `~/.openclaw/workspace-customer-support-team-team/`).
- Creates per-role directories under `roles/<role>/` for: `SOUL.md`, `AGENTS.md`, `TOOLS.md`, `STATUS.md`, `NOTES.md`.
- Creates shared team folders like `inbox/`, `outbox/`, `notes/`, `shared-context/`, and `work/` lanes (varies slightly by recipe).

## Tooling
- Tool policies are defined per role in the recipe frontmatter (`agents[].tools`).
- Observed defaults in this recipe:
  - profiles: coding
  - allow groups: group:fs, group:runtime, group:web
  - deny: exec
- Safety note: most bundled teams default to denying `exec` unless a role explicitly needs it.

