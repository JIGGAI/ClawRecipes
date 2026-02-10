# Clawcipes Kitchen (UI)

Clawcipes Kitchen is our UI for managing Clawcipes workflows.

## What it’s for

### Primary goal (MVP)
- **Create, add, and edit recipes** (agent + team recipes) from the UI.
  - Rationale: the OpenClaw UI is currently too limited to comfortably manage recipe authoring/editing.

### Related goals
- Create/modify **agents** and **teams** from recipes:
  - scaffold new agents
  - scaffold new teams
  - modify teams / create new ones (team composition, roles)
- Export recipes (so users can share on the marketplace)
- Marketplace integration:
  - publish recipes to the marketplace (ideally automated from the UI)
  - search marketplace recipes
  - install marketplace recipes directly from Kitchen

### Supporting features
- Activity feed (high-level semantic events)
- Weekly scheduled-task view
- Global search across workspace + memory/docs + tasks
- Agent chat room
- Goals system (file-based source of truth)
- Approvals inbox + routing (e.g., Telegram)

## Status
Clawcipes Kitchen is under active development.

## Relationship to the plugin
- The **Clawcipes plugin** is CLI-first and works without any UI.
- Clawcipes Kitchen is an optional UI companion for:
  - visibility (activity/search)
  - approvals
  - human review of plans and changes

## Roadmap (high level)
- Approvals UI (approve/deny + audit trail)
- Recipe browser and scaffold flows
- Team dashboards (backlog/in-progress/done)
- Publishing workflow integration
