# Workflow runs: file-first guide

This document explains how ClawRecipes workflows work in practice.

If you are trying to answer any of these questions, start here:
- Where do workflow files live?
- How do I run one manually?
- What does the runner do?
- What does the worker do?
- How do approvals work?
- Why did a run fail or stop?
- Why is posting still off after install?

---

## Mental model

ClawRecipes workflows are **file-first**.

That means:
- workflow definitions live on disk
- workflow runs live on disk
- approvals live on disk
- node outputs live on disk
- debugging usually starts by reading files, not opening a database

This is intentional.

---

## Where workflow files live

Workflow definitions live here inside a team workspace:

```text
~/.openclaw/workspace-<teamId>/shared-context/workflows/
```

Example:

```text
~/.openclaw/workspace-development-team/shared-context/workflows/marketing.workflow.json
```

---

## Where workflow runs live

Every workflow run gets its own folder under:

```text
shared-context/workflow-runs/
```

Layout:

```text
shared-context/
  workflow-runs/
    <runId>/
      run.json
      node-outputs/
        001-<nodeId>.json
        002-<nodeId>.json
      artifacts/
      approvals/
        approval.json
    <runId>.run.json
```

Important files:
- `run.json` — the canonical run record
- `node-outputs/*.json` — structured output from executed nodes
- `artifacts/` — tool output, payloads, or generated files
- `approvals/approval.json` — approval record when the run is waiting on a human

---

## The two moving parts: runner and worker

ClawRecipes splits workflow execution into two roles.

### Runner
The runner is the scheduler.

It:
- claims queued runs
- reads the workflow graph
- decides what node can run next
- enqueues node work for workers
- records state transitions

Useful commands:

```bash
openclaw recipes workflows runner-once --team-id development-team
openclaw recipes workflows runner-tick --team-id development-team --concurrency 2
```

### Worker
The worker is the executor.

It:
- pulls queued node tasks for one agent
- runs the node
- writes node output
- updates run state

Useful command:

```bash
openclaw recipes workflows worker-tick \
  --team-id development-team \
  --agent-id development-team-lead
```

---

## Run a workflow manually

If you want to trigger one run yourself:

```bash
openclaw recipes workflows run \
  --team-id development-team \
  --workflow-file marketing.workflow.json
```

This reads the workflow file from:

```text
shared-context/workflows/
```

Then you usually follow with runner / worker execution:

```bash
openclaw recipes workflows runner-once --team-id development-team
openclaw recipes workflows worker-tick --team-id development-team --agent-id development-team-lead
```

---

## Approval flows

Approval is a first-class workflow state.

When a workflow reaches a human-approval node:
- the run moves to `awaiting_approval`
- ClawRecipes writes `approvals/approval.json`
- the run stops until a decision is recorded

### Approve a run

```bash
openclaw recipes workflows approve \
  --team-id development-team \
  --run-id <runId> \
  --approved true
```

### Reject a run

```bash
openclaw recipes workflows approve \
  --team-id development-team \
  --run-id <runId> \
  --approved false \
  --note "Rewrite the hook and shorten the post"
```

### Resume a run after approval

```bash
openclaw recipes workflows resume \
  --team-id development-team \
  --run-id <runId>
```

### Auto-resume recorded approvals

```bash
openclaw recipes workflows poll-approvals \
  --team-id development-team \
  --limit 20
```

---

## What `run.json` tells you

`run.json` is where you should look first when a workflow behaves strangely.

It records:
- workflow metadata
- current run status
- node state by node id
- timestamps
- append-only event history
- error details when something fails

If you are debugging, read this before guessing.

---

## Common debugging commands

### Inspect recent runs on disk

```bash
ls -lah ~/.openclaw/workspace-development-team/shared-context/workflow-runs/
```

### Inspect one run

```bash
cat ~/.openclaw/workspace-development-team/shared-context/workflow-runs/<runId>/run.json
```

### Inspect node outputs

```bash
ls ~/.openclaw/workspace-development-team/shared-context/workflow-runs/<runId>/node-outputs/
cat ~/.openclaw/workspace-development-team/shared-context/workflow-runs/<runId>/node-outputs/001-some-node.json
```

### Inspect approval record

```bash
cat ~/.openclaw/workspace-development-team/shared-context/workflow-runs/<runId>/approvals/approval.json
```

---

## Posting / publish behavior after install

This matters.

A successful install gives you workflow support, but it does **not** guarantee that workflow publishing side effects are enabled in your environment.

### Recommended supported path
Use the runner-native `outbound.post` tool with a configured outbound posting service.

See: [OUTBOUND_POSTING.md](OUTBOUND_POSTING.md)

### Local patched path
If you rely on a controller-local custom posting patch:
- you may need to reapply that patch after install/update
- you may need to tell your assistant to turn workflow posting back on
- RJ's current public gist for the `marketing.post_all` patch is: <https://gist.github.com/rjdjohnston/7a8824ae16f347a4642fc7782fe66219>

So if a workflow runs but does not actually post, check your posting path before blaming the runner.

---

## Typical end-to-end example

```bash
# 1) trigger a run
openclaw recipes workflows run \
  --team-id development-team \
  --workflow-file marketing.workflow.json

# 2) schedule work
openclaw recipes workflows runner-once --team-id development-team

# 3) execute agent work
openclaw recipes workflows worker-tick \
  --team-id development-team \
  --agent-id development-team-lead

# 4) if approval is required, record a decision
openclaw recipes workflows approve \
  --team-id development-team \
  --run-id <runId> \
  --approved true

# 5) resume
openclaw recipes workflows resume \
  --team-id development-team \
  --run-id <runId>
```
