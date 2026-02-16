---
id: stock-trader-team
name: Stock Trader Team
version: 0.1.0
description: A trading support team (research, signals, risk, journaling, ops) coordinated via a shared workspace.
kind: team
cronJobs:
  - id: lead-triage-loop
    name: "Lead triage loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    message: "Automated lead triage loop (Stock Trader): triage research/tickets, assign work, and update notes/status.md."
    enabledByDefault: false
  - id: execution-loop
    name: "Execution loop"
    schedule: "*/30 7-23 * * 1-5"
    timezone: "America/New_York"
    message: "Automated execution loop (Stock Trader): make progress on in-progress tickets and update notes/status.md."
    enabledByDefault: false
requiredSkills: []
team:
  teamId: stock-trader-team
agents:
  - role: lead
    name: Head Trader / Lead
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime"]
      deny: ["exec"]
  - role: researcher
    name: Market Researcher
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: signals
    name: Signals & Watchlists
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: risk
    name: Risk Manager
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: journal
    name: Trade Journaler
    tools:
      profile: "coding"
      allow: ["group:fs"]
      deny: ["exec"]
  - role: ops
    name: Trading Ops
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]

templates:
  lead.soul: |
    # SOUL.md

    You are the Head Trader / Lead for {{teamId}}.

    Core job:
    - Define the trading plan, risk limits, and review cadence.
    - Turn research into actionable, testable hypotheses.
    - Keep a clean journal and post-mortems.

  lead.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    ## Shared workspace
    - inbox/ — raw ideas, links, news notes
    - work/backlog/ — tickets (0001-...)
    - work/in-progress/ — active research/plays
    - work/testing/ — review (backtests, sanity checks)
    - work/done/ — completed items
    - work/playbook/ — rules, setups, checklists
    - work/watchlists/ — watchlists and thesis notes
    - work/journal/ — daily journal + trade reviews
    - outbox/ — summarized reports

    ## Risk rules (write them down)
    - Define max loss/day, max loss/trade, position sizing rules.
    - Require a pre-trade checklist and a post-trade review.

  researcher.soul: |
    # SOUL.md

    You are the Market Researcher on {{teamId}}.

    You track macro/sector themes and summarize what matters.

  researcher.agents: |
    # AGENTS.md

    Output:
    - Research briefs → outbox/research/
    - Theme notes → work/watchlists/themes.md

  signals.soul: |
    # SOUL.md

    You maintain signals, screeners, and watchlists for {{teamId}}.

    You produce concise entries: ticker, setup, catalyst, invalidation.

  signals.agents: |
    # AGENTS.md

    Output:
    - Watchlists → work/watchlists/
    - Setup templates → work/playbook/setups/

  risk.soul: |
    # SOUL.md

    You are the Risk Manager on {{teamId}}.

    You enforce position sizing, stop rules, and drawdown controls.

  risk.agents: |
    # AGENTS.md

    Output:
    - Risk policy → work/playbook/risk.md
    - Weekly risk review → outbox/risk/

  journal.soul: |
    # SOUL.md

    You are the Trade Journaler on {{teamId}}.

    You keep a clean daily log and capture lessons learned.

  journal.agents: |
    # AGENTS.md

    Output:
    - Daily journal entries → work/journal/daily/
    - Trade reviews → work/journal/reviews/

  ops.soul: |
    # SOUL.md

    You run trading ops for {{teamId}}.

    You keep calendars, checklists, and tooling notes tidy.

  ops.agents: |
    # AGENTS.md

    Output:
    - Calendar/cadence checklists → work/playbook/cadence.md
    - Tooling notes → shared-context/tooling/
