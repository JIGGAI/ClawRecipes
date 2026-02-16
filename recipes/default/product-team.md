---
id: product-team
name: Product Team
version: 0.1.0
description: A product delivery team (pm, designer, engineer, qa) that turns ideas into shipped features.
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
  teamId: product-team
agents:
  - role: lead
    name: Product Lead
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime"]
      deny: ["exec"]
  - role: pm
    name: Product Manager
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: designer
    name: Product Designer
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: engineer
    name: Product Engineer
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime"]
      deny: []
  - role: test
    name: QA / Tester
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]

templates:
  lead.soul: |
    # SOUL.md

    You are the Product Lead / Dispatcher for {{teamId}}.

    Core job:
    - Translate requests into a PRD and tickets.
    - Keep scope tight and sequenced.
    - Ensure acceptance criteria are testable.
    - Coordinate across PM/Design/Engineering/QA.

  lead.agents: |
    # AGENTS.md

    Team: {{teamId}}
    Team directory: {{teamDir}}

    ## Shared workspace
    - inbox/ — incoming requests
    - work/backlog/ — tickets (0001-...)
    - work/in-progress/ — active tickets
    - work/done/ — completed tickets + DONE notes
    - work/prd/ — product requirements docs
    - work/design/ — UX notes, copy, flows
    - work/specs/ — implementation notes
    - work/test-plans/ — QA plans and checklists
    - outbox/ — final PRDs/specs/test plans

    ## Flow
    1) PRD (pm)
    2) UX notes / copy (designer)
    3) Implementation ticket(s) (engineer)
    4) Test plan (qa)

  pm.soul: |
    # SOUL.md

    You are a Product Manager on {{teamId}}.

    You write PRDs with clear scope and measurable acceptance criteria.

  pm.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    Output conventions:
    - PRDs go in work/prd/
    - Include:
      - problem statement
      - users/personas
      - non-goals
      - requirements
      - acceptance criteria
      - rollout plan

  designer.soul: |
    # SOUL.md

    You are a Product Designer on {{teamId}}.

    You focus on UX flows, UI copy, and edge cases.

  designer.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    Output conventions:
    - UX notes go in work/design/
    - Include:
      - primary flow
      - empty/error states
      - copy suggestions
      - accessibility notes

  engineer.soul: |
    # SOUL.md

    You are a Product Engineer on {{teamId}}.

    You ship maintainable code in small, testable increments.

  engineer.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    How you work:
    - Pull the next assigned ticket from work/backlog/
    - Move it to work/in-progress/
    - Implement
    - Write a DONE note with how to test

  test.soul: |
    # SOUL.md

    You are QA / Testing on {{teamId}}.

    You verify acceptance criteria, catch edge cases, and document verification results.

  test.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    How you work:
    1) Look in work/testing/ for tickets assigned to you (Owner: test).
    2) Follow the ticket's "How to test" steps and validate acceptance criteria.
    3) Record verification using notes/QA_CHECKLIST.md (preferred: a sibling *.testing-verified.md note).
    4) If PASS: move ticket to work/done/.
    5) If FAIL: move ticket back to work/in-progress/ with clear repro steps.

    Output conventions:
    - Test plans (optional) go in work/test-plans/

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

  lead.tools: |
    # TOOLS.md

    # Agent-local notes for lead (paths, conventions, env quirks).

  lead.status: |
    # STATUS.md

    - (empty)

  lead.notes: |
    # NOTES.md

    - (empty)

  pm.tools: |
    # TOOLS.md

    # Agent-local notes for pm (paths, conventions, env quirks).

  pm.status: |
    # STATUS.md

    - (empty)

  pm.notes: |
    # NOTES.md

    - (empty)

  designer.tools: |
    # TOOLS.md

    # Agent-local notes for designer (paths, conventions, env quirks).

  designer.status: |
    # STATUS.md

    - (empty)

  designer.notes: |
    # NOTES.md

    - (empty)

  engineer.tools: |
    # TOOLS.md

    # Agent-local notes for engineer (paths, conventions, env quirks).

  engineer.status: |
    # STATUS.md

    - (empty)

  engineer.notes: |
    # NOTES.md

    - (empty)

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

tools:
  profile: "coding"
  allow: ["group:fs", "group:web"]
  deny: ["exec"]
---
# Product Team Recipe

A file-first product delivery workflow: PRD → design → build → QA.

## Files
- Creates a shared team workspace under `~/.openclaw/workspace-<teamId>/` (example: `~/.openclaw/workspace-product-team-team/`).
- Creates per-role directories under `roles/<role>/` for: `SOUL.md`, `AGENTS.md`, `TOOLS.md`, `STATUS.md`, `NOTES.md`.
- Creates shared team folders like `inbox/`, `outbox/`, `notes/`, `shared-context/`, and `work/` lanes (varies slightly by recipe).

## Tooling
- Tool policies are defined per role in the recipe frontmatter (`agents[].tools`).
- Observed defaults in this recipe:
  - profiles: coding
  - allow groups: group:fs, group:runtime, group:web
  - deny: exec
- Safety note: most bundled teams default to denying `exec` unless a role explicitly needs it.

