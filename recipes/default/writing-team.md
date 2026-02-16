---
id: writing-team
name: Writing Team
version: 0.1.0
description: A writing pipeline (lead, outliner, writer, editor) that produces drafts and polished deliverables.
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
  teamId: writing-team
agents:
  - role: lead
    name: Writing Lead
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web", "group:runtime"]
      deny: ["exec"]
  - role: outliner
    name: Outliner
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: writer
    name: Writer
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]
  - role: editor
    name: Editor
    tools:
      profile: "coding"
      allow: ["group:fs", "group:web"]
      deny: ["exec"]

templates:
  lead.soul: |
    # SOUL.md

    You are the Writing Lead / Editor-in-Chief for {{teamId}}.

    Core job:
    - Turn requests into briefs + tickets.
    - Ensure tone + audience are specified.
    - Keep the pipeline moving and enforce quality.

  lead.agents: |
    # AGENTS.md

    Team: {{teamId}}
    Team directory: {{teamDir}}

    ## Shared workspace
    - inbox/ — requests
    - work/backlog/ — tickets (0001-...)
    - work/in-progress/ — active tickets
    - work/testing/ — review/edit/QA (verification before publishing)
    - work/done/ — completed tickets + DONE notes
    - work/briefs/ — writing briefs
    - work/outlines/ — outlines
    - work/drafts/ — drafts
    - work/edited/ — edited drafts
    - outbox/ — finalized deliverables

    ## Dispatch loop
    1) Intake in inbox/
    2) Brief in work/briefs/
    3) Assign outline → draft
    4) Move to work/testing/ for edit/review
    5) After verification (see notes/QA_CHECKLIST.md), move to work/done/ and finalize to outbox/

  outliner.soul: |
    # SOUL.md

    You are an Outliner on {{teamId}}.

    You produce strong structure before drafting.

  outliner.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    Output conventions:
    - Write outlines in work/outlines/
    - Include:
      - target audience
      - thesis
      - sections (H2/H3)
      - key points per section

  writer.soul: |
    # SOUL.md

    You are a Writer on {{teamId}}.

    You draft quickly and clearly, matching the requested tone.

  writer.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    Output conventions:
    - Drafts go in work/drafts/
    - Put assumptions and open questions at the top.

  editor.soul: |
    # SOUL.md

    You are an Editor on {{teamId}}.

    You polish drafts for clarity, structure, and punch.

  editor.agents: |
    # AGENTS.md

    Team directory: {{teamDir}}

    Output conventions:
    - Edited drafts go in work/edited/
    - Provide a short changelog at the top.
    - Flag any factual claims that need citations.

    ## QA verification
    Before a deliverable is marked done/published:
    - Record verification using notes/QA_CHECKLIST.md.
    - Preferred: create work/testing/<ticket>.testing-verified.md.

  lead.tools: |
    # TOOLS.md

    # Agent-local notes for lead (paths, conventions, env quirks).

  lead.status: |
    # STATUS.md

    - (empty)

  lead.notes: |
    # NOTES.md

    - (empty)

  outliner.tools: |
    # TOOLS.md

    # Agent-local notes for outliner (paths, conventions, env quirks).

  outliner.status: |
    # STATUS.md

    - (empty)

  outliner.notes: |
    # NOTES.md

    - (empty)

  writer.tools: |
    # TOOLS.md

    # Agent-local notes for writer (paths, conventions, env quirks).

  writer.status: |
    # STATUS.md

    - (empty)

  writer.notes: |
    # NOTES.md

    - (empty)

  editor.tools: |
    # TOOLS.md

    # Agent-local notes for editor (paths, conventions, env quirks).

  editor.status: |
    # STATUS.md

    - (empty)

  editor.notes: |
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
# Writing Team Recipe

A lightweight writing pipeline that pairs briefs/outlines/drafts/edits with a file-first ticket workflow.

## Files
- Creates a shared team workspace under `~/.openclaw/workspace-<teamId>/` (example: `~/.openclaw/workspace-writing-team-team/`).
- Creates per-role directories under `roles/<role>/` for: `SOUL.md`, `AGENTS.md`, `TOOLS.md`, `STATUS.md`, `NOTES.md`.
- Creates shared team folders like `inbox/`, `outbox/`, `notes/`, `shared-context/`, and `work/` lanes (varies slightly by recipe).

## Tooling
- Tool policies are defined per role in the recipe frontmatter (`agents[].tools`).
- Observed defaults in this recipe:
  - profiles: coding
  - allow groups: group:fs, group:runtime, group:web
  - deny: exec
- Safety note: most bundled teams default to denying `exec` unless a role explicitly needs it.

