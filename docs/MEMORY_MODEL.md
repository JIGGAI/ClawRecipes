# Memory Model (Assistant vs Team vs Role)

This project uses a **file-first** memory model with clear boundaries so we get:
- continuity where it’s safe (assistant-local)
- shared coordination where it’s needed (team workspace)
- durable knowledge without accidental leakage (team/role scoped)

The system has **4 layers**:

1. **Assistant continuity memory (private, single assistant)**
2. **Team coordination docs (shared, operational)**
3. **Team knowledge memory (shared, durable knowledge base)**
4. **Role memory (scoped to a role inside a team)**

---

## 1) Assistant continuity memory (private)

**What it is:**
Long-term continuity for a *single* assistant persona (preferences, long-running projects, etc.).

**Where it lives (example):**
- `~/.openclaw/workspace/` (the assistant’s own workspace)
  - `SOUL.md` / `USER.md` (persona + user preferences)
  - `memory/YYYY-MM-DD.md` (daily journal)
  - `MEMORY.md` (curated long-term memory)

**Visibility / ownership:**
- **Private** to that assistant.
- Must **not** be copied into team workspaces or role folders.

**Guideline:**
Use this for the assistant’s own continuity only. Never treat it as team knowledge.

---

## 2) Team coordination docs (shared, operational)

**What it is:**
The team’s shared operating system: tickets, plans, status logs, checklists. This is how teams coordinate.

**Where it lives (example team workspace):**
- `<team-workspace>/`
  - `work/` (ticket board: backlog/in-progress/testing/done)
  - `notes/plan.md` (current plan)
  - `notes/status.md` (append-only status log)
  - `TICKETS.md`, `AGENTS.md` (team conventions + guardrails)

**Visibility / ownership:**
- Shared with everyone working in that team workspace.
- Should contain **work facts** and decisions.
- Avoid sensitive assistant/user-specific content.

**Guideline:**
If it’s about *what we’re doing* (tasks, decisions, progress), it belongs here.

---

## 3) Team knowledge memory (shared, durable)

**What it is:**
A shared knowledge base for the team: facts, discoveries, “known good” answers, references.

**Where it lives (example):**
- `<team-workspace>/shared-context/memory/`
  - `team.jsonl` (append-only memory items)
  - `pinned.jsonl` (high-signal, curated pins)
  - Optional: `PINNED.md` (rendered/derived view for humans)

**Visibility / ownership:**
- Shared within the team.
- Treated as **team-owned knowledge**, not assistant-owned.

**Guideline:**
If it’s something we want *any team member/agent* to know later, it belongs here.

---

## 4) Role memory (scoped to a role)

**What it is:**
Memory that belongs to a *role* within a team (e.g., “dev”, “qa”, “lead”). This helps role agents keep continuity without mixing concerns.

**Where it lives (example):**
- `<team-workspace>/roles/<role>/`
  - `memory/YYYY-MM-DD.md` (role daily log)
  - `MEMORY.md` (role curated memory)

**Visibility / ownership:**
- Shared within the team workspace, but conceptually **owned by that role**.
- Should not contain assistant-private continuity memory.

**Guideline:**
If it’s specific to how that role operates, what it learned, or role-specific context, put it here.

---

## Quick “What goes where?”

- **Private assistant preferences / personal user context** → Assistant continuity memory (Layer 1)
- **Ticket status, blockers, decisions, progress updates** → Team coordination docs (Layer 2)
- **Reusable facts, runbooks, known fixes, canonical links** → Team knowledge memory (Layer 3)
- **Role-specific learnings / role playbooks / role continuity** → Role memory (Layer 4)

---

## Linking (canonical doc)

This file is intended to be the **canonical** memory model doc.

UI and scaffolds should **link here** rather than duplicating content:
- Kitchen UI: Team Editor → Memory tab should link to this doc.
- Team scaffolds: include a short pointer (link-out) rather than copying this whole page.

---

## Security / leakage guardrails

- Never paste assistant private continuity files (Layer 1) into team or role memory.
- Prefer links to canonical docs over copy/paste.
- Treat `notes/status.md` as append-only operational history (not a knowledge base).
