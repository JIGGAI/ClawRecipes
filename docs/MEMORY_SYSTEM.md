# Memory System

This document explains the ClawRecipes memory system in practical terms, especially as it appears in the team editor.

If you want the short version:
- memory is **file-first**
- not all memory is the same
- private continuity, team coordination, team knowledge, and role memory should stay separate
- the team editor should help you see and manage the right layer without mixing them up

This doc builds on the canonical memory model doc:
- [MEMORY_MODEL.md](MEMORY_MODEL.md)

---

## Why this exists

Without a clear memory system, teams end up dumping everything everywhere:
- private context leaks into shared files
- ticket status gets mixed with durable knowledge
- role-specific learnings get lost
- nobody knows where to put anything

ClawRecipes avoids that by being explicit about memory layers.

---

## The four memory layers

ClawRecipes uses four memory layers:

1. assistant continuity memory
2. team coordination docs
3. team knowledge memory
4. role memory

The canonical explanation lives here:
- [MEMORY_MODEL.md](MEMORY_MODEL.md)

This page is the easier operational guide.

---

## Layer 1: assistant continuity memory

What it is:
- the assistant’s own continuity
- preferences
- personal working context
- long-running private context

Typical files:
- `SOUL.md`
- `USER.md`
- `memory/YYYY-MM-DD.md`
- `MEMORY.md`

Important rule:
- this does **not** belong in the team workspace

Use this for:
- assistant continuity
- private context
- user-specific preferences

Do not use it for:
- shared team knowledge
- team ticket history
- shared operational docs

---

## Layer 2: team coordination docs

What it is:
- the team’s operating surface
- plans, tickets, status, assignments, checklists

Typical files:
- `work/backlog/`
- `work/in-progress/`
- `work/testing/`
- `work/done/`
- `notes/plan.md`
- `notes/status.md`
- `TICKETS.md`
- `AGENTS.md`

Use this for:
- what the team is doing right now
- blockers
- decisions attached to tickets
- ongoing work coordination

Do not use it for:
- curated long-term knowledge base entries
- private assistant memory

---

## Layer 3: team knowledge memory

What it is:
- shared durable knowledge for the whole team
- facts worth keeping
- canonical links
- runbooks
- known fixes
- decisions worth reusing later

Typical files:

```text
shared-context/memory/
  team.jsonl
  pinned.jsonl
```

Use this for:
- reusable knowledge
- facts the whole team should remember
- high-signal decisions worth pinning

This is the memory layer most closely associated with a memory tab in the team editor.

---

## Layer 4: role memory

What it is:
- continuity for one role inside the team
- role-specific learnings and playbooks

Typical files:

```text
roles/<role>/
  MEMORY.md
  memory/YYYY-MM-DD.md
```

Use this for:
- role-specific learnings
- role runbooks
- role continuity that should not become global team knowledge yet

Examples:
- QA-specific release checks
- dev-specific implementation gotchas
- lead-specific prioritization habits

---

## Team editor angle

From the team editor point of view, the memory system should feel like a set of clearly separated panels, not one giant dumping ground.

A good team editor should help you understand:
- what belongs in team memory vs role memory
- what is operational status vs durable knowledge
- what is pinned vs append-only
- what should stay private and never move into team memory

### The most useful things the team editor can surface

#### Memory overview
- short explanation of the memory layers
- link to the canonical memory model doc

#### Team memory
- `shared-context/memory/team.jsonl`
- `shared-context/memory/pinned.jsonl`
- counts / recent entries / pinned items

#### Coordination docs
- `notes/status.md`
- `notes/plan.md`
- current ticket lanes

#### Role memory
- links into `roles/<role>/MEMORY.md`
- links into role daily memory files

#### Policy docs
- `notes/memory-policy.md`
- any team-specific memory conventions

In other words:
- the editor should help you navigate the memory system
- the files remain the real source of truth

---

## What goes where?

### Put it in team coordination docs when...
- it is about current work
- it is ticket-specific
- it is a progress update
- it is a blocker or immediate plan

### Put it in team knowledge memory when...
- it is reusable later
- the whole team should know it
- it is a known fix / canonical answer / stable reference

### Put it in role memory when...
- it mainly belongs to one role
- it is useful continuity for that role
- it is not yet broad enough to become team-wide knowledge

### Keep it in assistant continuity memory when...
- it is private context
- it is user/assistant specific
- it should not leak into the team workspace

---

## Pinned vs append-only memory

### Append-only memory
This is the stream of memory as things are learned.

Examples:
- `team.jsonl`
- daily memory files
- status logs

### Pinned memory
This is the smaller curated set of high-signal items worth keeping easy to find.

Example:
- `pinned.jsonl`

Rule of thumb:
- append everything useful first
- pin only the things you expect to matter again later

---

## Suggested habits

### After finishing work
- update the ticket comments
- append to `notes/status.md`
- save artifacts to `shared-context/agent-outputs/`
- if a reusable lesson emerged, write it to team memory
- if it is especially important, pin it

### During triage or lead review
- move short-lived work chatter into tickets/status docs
- move durable lessons into team knowledge memory
- curate pinned memory so it stays high-signal

### For role agents
- keep role-specific continuity in role memory
- escalate broadly useful knowledge into team memory

---

## Common mistakes

### 1) Treating status logs like a knowledge base
`notes/status.md` is for operational history, not your long-term memory system.

### 2) Dumping private context into shared memory
Private assistant continuity should stay private.

### 3) Pinning too much
If everything is pinned, nothing is pinned.

### 4) Never promoting useful knowledge
If good lessons stay buried in tickets forever, the team never really learns.

### 5) Skipping role memory
Role memory is useful because not every lesson belongs at the whole-team level.

---

## Simple example

Imagine a team learns these three things:

1. “Ticket 0042 is blocked waiting on API credentials.”
2. “The fix for workflow-runner approval retries is to clear stale locks before requeue.”
3. “QA should always capture screenshots for UI changes.”

Where should they go?

- #1 → ticket comments / `notes/status.md`
- #2 → team knowledge memory (`team.jsonl`, maybe pin it)
- #3 → role memory for QA, and maybe team memory too if it is now a team-wide rule

---

## How this connects to the canonical doc

This page is the practical operating guide.

The canonical model and boundaries remain here:
- [MEMORY_MODEL.md](MEMORY_MODEL.md)

If you want the philosophy and the exact layer definitions, read that doc.
If you want to know how to use the memory system day-to-day, start here.
