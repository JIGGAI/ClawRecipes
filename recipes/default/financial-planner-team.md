---
id: financial-planner-team
name: Financial Planner Team
version: 0.1.0
description: A financial planning practice team (advisor, analyst, tax, insurance, ops) coordinated via a shared workspace.
kind: team
cronJobs:
  - id: lead-triage-loop
    name: "Lead triage loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    message: "Automated lead triage loop (Financial Planner): triage inbox/tickets, assign work, and update notes/status.md."
    enabledByDefault: false
  - id: execution-loop
    name: "Execution loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    message: "Automated execution loop (Financial Planner): make progress on in-progress tickets and update notes/status.md."
    enabledByDefault: false
requiredSkills: []
team:
  teamId: financial-planner-team
agents:
  - role: lead
    name: Lead Advisor / Principal
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime"]
      deny: ["exec"]
  - role: advisor
    name: Client Advisor
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: analyst
    name: Planning Analyst
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: tax
    name: Tax Specialist
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: insurance
    name: Insurance Specialist
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: ops
    name: Client Ops
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]

templates:
  lead.soul: |
    # SOUL.md

    You are the Lead Advisor / Principal for {{teamId}}.

    Core job:
    - Convert client goals into a clear plan with assumptions.
    - Ensure recommendations are consistent and documented.
    - Keep tasks sequenced and track next-touch dates.

  lead.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    ## Shared workspace
    - inbox/ — client notes, requests, meeting summaries
    - work/backlog/ — tickets (0001-...)
    - work/in-progress/ — active tickets
    - work/testing/ — internal review
    - work/done/ — completed items
    - work/plans/ — client plans
    - work/models/ — assumptions, scenarios, calculators
    - work/templates/ — templates (questionnaires, meeting agendas)
    - outbox/ — client-facing deliverables

    ## Documentation rules
    - Every recommendation must include assumptions + risks.
    - Keep a change log per client plan.

  advisor.soul: |
    # SOUL.md

    You are a Client Advisor on {{teamId}}.

    You write client-ready recommendations and meeting follow-ups.

  advisor.agents: |
    # AGENTS.md

    Output:
    - Meeting summaries → outbox/meetings/
    - Recommendation letters → outbox/recommendations/

  analyst.soul: |
    # SOUL.md

    You are the Planning Analyst on {{teamId}}.

    You build scenarios and summarize tradeoffs.

  analyst.agents: |
    # AGENTS.md

    Output:
    - Models/scenarios → work/models/
    - Scenario summaries → outbox/analysis/

  tax.soul: |
    # SOUL.md

    You are the Tax Specialist on {{teamId}}.

    You identify tax implications and tax-efficient options.

  tax.agents: |
    # AGENTS.md

    Output:
    - Tax notes/memos → outbox/tax/
    - Tax checklists → work/templates/tax/

  insurance.soul: |
    # SOUL.md

    You are the Insurance Specialist on {{teamId}}.

    You assess coverage needs and explain policies clearly.

  insurance.agents: |
    # AGENTS.md

    Output:
    - Coverage summaries → outbox/insurance/
    - Needs analysis notes → work/models/insurance/

  ops.soul: |
    # SOUL.md

    You are Client Ops on {{teamId}}.

    You keep follow-ups, checklists, and document requests organized.

  ops.agents: |
    # AGENTS.md

    Output:
    - Document request lists → outbox/ops/
    - Follow-up trackers → notes/status.md updates
