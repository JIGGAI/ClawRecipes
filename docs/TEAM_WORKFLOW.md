# Team workflow

This is the practical guide to how a ClawRecipes team is meant to work.

If you scaffold a team and then ask, “okay, what do we actually do now?” this is the answer.

---

## The core idea

A ClawRecipes team is a **shared workspace** with a **file-first work queue**.

That means:
- requests land in files
- tickets live in files
- agents coordinate through files
- nothing important depends on a specific UI being available

---

## Team workspace layout

A scaffolded team usually looks like this:

```text
~/.openclaw/workspace-<teamId>/
  inbox/
  outbox/
  shared/
  notes/
  work/
    backlog/
    in-progress/
    testing/
    done/
    assignments/
  roles/
    <role>/
```

Common meaning:
- `inbox/` — raw incoming requests
- `work/backlog/` — ready-to-pick tickets
- `work/in-progress/` — active work
- `work/testing/` — QA / verification
- `work/done/` — completed work
- `work/assignments/` — assignment stubs / ownership breadcrumbs
- `shared/` — shared artifacts
- `notes/` — team notes, plans, status

---

## The normal workflow

### 1) Intake
A new request lands in `inbox/`.

This can happen by hand, or through:

```bash
openclaw recipes dispatch \
  --team-id development-team \
  --owner lead \
  --request "Add a new clinic-team recipe"
```

That usually creates:
- an inbox item
- a numbered backlog ticket
- an assignment stub

---

### 2) Triage
The lead reviews new requests and turns them into clean tickets.

Good tickets should include:
- context
- requirements
- acceptance criteria
- tasks
- owner
- status
- verification steps
- `## Comments`

Ticket comments matter. If an agent is assigned to a ticket or mentioned in comments, that agent should respond there.

---

### 3) Execution
A dev or devops agent picks up a backlog ticket.

Typical command:

```bash
openclaw recipes take --team-id development-team --ticket 0007 --owner dev
```

That assigns the ticket and moves it to `in-progress`.

During execution, the working agent should:
- do the work
- update the ticket
- leave verification notes
- write any needed artifacts to `shared/` or team files

---

### 4) Testing
When the change is ready for QA:

```bash
openclaw recipes handoff --team-id development-team --ticket 0007
```

That moves the ticket to `testing` and assigns it to the tester role.

The tester should:
- follow the verification steps
- confirm expected behavior
- move it to done if it passes
- or bounce it back to in-progress if it fails

---

### 5) Completion
When work is done:

```bash
openclaw recipes complete --team-id development-team --ticket 0007
```

That moves the ticket to `done` and stamps completion metadata.

---

## Helpful commands

### See current tickets

```bash
openclaw recipes tickets --team-id development-team
```

### Move a ticket manually

```bash
openclaw recipes move-ticket --team-id development-team --ticket 0007 --to in-progress
openclaw recipes move-ticket --team-id development-team --ticket 0007 --to testing
openclaw recipes move-ticket --team-id development-team --ticket 0007 --to done --completed
```

### Assign without taking

```bash
openclaw recipes assign --team-id development-team --ticket 0007 --owner devops
```

### Clean up stale assignment stubs for closed work

```bash
openclaw recipes cleanup-closed-assignments --team-id development-team
```

---

## Who picks what up?

The simple rule:
- **backlog** = ready for the implementation owner to pick up
- **lead** = scope/triage/handoff
- **dev/devops/test** = execute their lane of work

If a ticket is sitting in backlog, it should not need repeated human pep talks to become real.

---

## How agents get nudged

There are a few ways a team actually wakes up and does work:

1. a human opens or messages the relevant agent
2. a cron loop runs
3. the lead sees inbox/backlog work and acts
4. a best-effort system nudge reaches the lead session

So if you say, “I dispatched a ticket but nobody picked it up,” the real question is usually: **what is waking the team up?**

---

## Why file-first is useful

Because it gives you:
- durable history
- easy grep/search
- easy git review
- easy debugging
- easy automation
- less dependency on one UI or one database

Related:
- [MEMORY_SYSTEM.md](MEMORY_SYSTEM.md)
- [SWARM_ORCHESTRATOR.md](SWARM_ORCHESTRATOR.md)

---

## Recommended daily commands

```bash
# See current workload
openclaw recipes tickets --team-id development-team

# Create work from a request
openclaw recipes dispatch --team-id development-team --owner lead --request "Do a thing"

# Start work
openclaw recipes take --team-id development-team --ticket 0001 --owner dev

# Hand off to QA
openclaw recipes handoff --team-id development-team --ticket 0001

# Complete
openclaw recipes complete --team-id development-team --ticket 0001
```
