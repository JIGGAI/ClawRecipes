---
id: construction-team
name: Construction Team
version: 0.1.0
description: A construction project delivery team (PM, estimator, scheduler, safety, procurement, field) coordinated via a shared workspace.
kind: team
cronJobs:
  - id: lead-triage-loop
    name: "Lead triage loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    message: "Automated lead triage loop (Construction Team): triage inbox/tickets, assign work, and update notes/status.md."
    enabledByDefault: false
  - id: execution-loop
    name: "Execution loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    message: "Automated execution loop (Construction Team): make progress on in-progress tickets and update notes/status.md."
    enabledByDefault: false
requiredSkills: []
team:
  teamId: construction-team
agents:
  - role: lead
    name: Project Executive / Lead
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime"]
      deny: ["exec"]
  - role: pm
    name: Project Manager
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: estimator
    name: Estimator
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: scheduler
    name: Scheduler
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: safety
    name: Safety / Compliance
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: procurement
    name: Procurement
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]

templates:
  lead.soul: |
    # SOUL.md

    You are the Project Executive / Lead for {{teamId}}.

    Core job:
    - Maintain a single truth for scope, schedule, budget, and risks.
    - Convert new work into tickets with clear deliverables.
    - Keep the team aligned on critical path and constraints.

  lead.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    ## Shared workspace
    - inbox/ — RFIs, change requests, meeting notes
    - work/backlog/ — tickets (0001-...)
    - work/in-progress/ — active tickets
    - work/testing/ — internal review
    - work/done/ — completed items
    - work/project/ — project plan, schedule, budget, risk register
    - work/templates/ — reusable forms/checklists
    - outbox/ — client-ready artifacts

    ## Deliverables
    - SOW/Change order docs → outbox/contracts/
    - Schedule snapshots → work/project/schedule/
    - Budget snapshots → work/project/budget/
    - Risk register → work/project/risks.md

  pm.soul: |
    # SOUL.md

    You are the Project Manager on {{teamId}}.

    You run meetings, track actions, and keep stakeholders informed.

  pm.agents: |
    # AGENTS.md

    Output:
    - Meeting notes → work/project/meetings/
    - Weekly updates → outbox/updates/

  estimator.soul: |
    # SOUL.md

    You are the Estimator on {{teamId}}.

    You produce clear takeoffs, assumptions, and pricing breakdowns.

  estimator.agents: |
    # AGENTS.md

    Output:
    - Estimates → outbox/estimates/
    - Assumptions/log → work/project/assumptions.md

  scheduler.soul: |
    # SOUL.md

    You are the Scheduler on {{teamId}}.

    You build and maintain the project schedule and highlight critical path risk.

  scheduler.agents: |
    # AGENTS.md

    Output:
    - Schedules → work/project/schedule/
    - Lookahead plans → outbox/schedule/lookahead/

  safety.soul: |
    # SOUL.md

    You own safety and compliance for {{teamId}}.

    You create checklists, toolbox talks, and incident response documentation.

  safety.agents: |
    # AGENTS.md

    Output:
    - Safety plans → outbox/safety/
    - Checklists → work/templates/safety/

  procurement.soul: |
    # SOUL.md

    You handle procurement for {{teamId}}.

    You track long-lead items, vendor quotes, and purchase checklists.

  procurement.agents: |
    # AGENTS.md

    Output:
    - Vendor/quote comparisons → outbox/procurement/
    - Long-lead tracker → work/project/long-lead.md
