# Workflow runs: file-first guide

This document explains how ClawRecipes workflows work in practice.

If you want a copy-paste cookbook after reading this reference, also see:
- [WORKFLOW_EXAMPLES.md](WORKFLOW_EXAMPLES.md)

If you are trying to answer any of these questions, start here:
- Where do workflow files live?
- What node types are available?
- What do triggers do?
- What is a run?
- How do edges work?
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

## What a workflow file looks like

At a high level, a workflow file contains:
- workflow metadata (`id`, optional `name`)
- optional `triggers`
- `nodes`
- optional `edges`

Minimal example:

```json
{
  "id": "demo",
  "name": "Simple demo",
  "nodes": [
    { "id": "start", "kind": "start" },
    {
      "id": "append_log",
      "kind": "tool",
      "assignedTo": { "agentId": "development-team-lead" },
      "action": {
        "tool": "fs.append",
        "args": {
          "path": "shared-context/APPEND_LOG.md",
          "content": "- run={{run.id}}\n"
        }
      }
    },
    { "id": "end", "kind": "end" }
  ],
  "edges": [
    { "from": "start", "to": "append_log", "on": "success" },
    { "from": "append_log", "to": "end", "on": "success" }
  ]
}
```

---

## Available workflow node types

These are the **current first-class node kinds** supported by the runner.

### Quick chooser

Use this when you are deciding what kind of node to add:

- use **`start`** when you want a visible graph entry point
- use **`end`** when you want a visible graph exit point
- use **`llm`** when you want the workflow to generate or transform content with an LLM
- use **`tool`** when you want the workflow to call a tool or side-effecting action
- use **`human_approval`** when a person must approve before the workflow continues
- use **`writeback`** when you want to append workflow breadcrumbs/results into team files

### `start`
Purpose:
- visual or structural start node
- useful in UI-authored workflows
- treated as a no-op by the runner

What it does at runtime:
- marks itself successful
- does not perform work

Example:

```json
{ "id": "start", "kind": "start" }
```

### `end`
Purpose:
- visual or structural end node
- used to make the workflow graph readable
- treated as a no-op by the runner

What it does at runtime:
- marks itself successful
- does not perform work

Example:

```json
{ "id": "end", "kind": "end" }
```

### `llm`
Purpose:
- run an LLM step in the workflow
- generate structured or text-like content and store it as node output JSON

Use it when:
- you want to draft content
- you want to transform or summarize earlier node output
- you want a workflow step to reason over previous results before the next action

Required pieces:
- `assignedTo.agentId`
- either `action.promptTemplatePath` or `action.promptTemplate`

What it does:
- builds a task prompt
- calls `llm-task-fixed` if present, otherwise falls back to `llm-task`
- passes upstream node output when available
- writes result JSON into the run’s `node-outputs/`

Example using an inline prompt:

```json
{
  "id": "draft_post",
  "kind": "llm",
  "assignedTo": { "agentId": "development-team-lead" },
  "action": {
    "promptTemplate": "Write a short product update for X announcing the new workflow runner."
  }
}
```

Example using a prompt template file:

```json
{
  "id": "draft_post",
  "kind": "llm",
  "assignedTo": { "agentId": "development-team-lead" },
  "action": {
    "promptTemplatePath": "shared-context/prompts/draft-post.md"
  }
}
```

Optional output path override:

```json
{
  "id": "draft_post",
  "kind": "llm",
  "assignedTo": { "agentId": "development-team-lead" },
  "action": {
    "promptTemplate": "Write a short changelog entry."
  },
  "output": {
    "path": "node-outputs/custom-draft.json"
  }
}
```

### `tool`
Purpose:
- run a tool action during the workflow

Use it when:
- you want to write a file
- send a message
- publish content
- call another tool after an LLM step

Current behavior:
- supports runner-native special handling for some tools
- otherwise falls back to normal tool invocation by tool name
- stores result/error artifacts in `artifacts/`

Currently important built-in / special-cased tools:

#### `fs.append`
Use when you want to append text into a file in the team workspace.

Required args:
- `path`
- `content`

Example:

```json
{
  "id": "append_log",
  "kind": "tool",
  "assignedTo": { "agentId": "development-team-lead" },
  "action": {
    "tool": "fs.append",
    "args": {
      "path": "shared-context/APPEND_LOG.md",
      "content": "- {{date}} run={{run.id}}\n"
    }
  }
}
```

Notes:
- path must stay within the team workspace
- simple template vars are supported in args like `{{date}}`, `{{run.id}}`, `{{workflow.id}}`

#### `outbound.post`
Use when you want a workflow to publish externally through the supported outbound posting service.

Required args:
- `platform`
- `text`
- `idempotencyKey`

Required plugin config:
- `outbound.baseUrl`
- `outbound.apiKey`

Example:

```json
{
  "id": "publish_x",
  "kind": "tool",
  "assignedTo": { "agentId": "development-team-lead" },
  "action": {
    "tool": "outbound.post",
    "args": {
      "platform": "x",
      "text": "Hello from ClawRecipes",
      "idempotencyKey": "{{run.id}}:publish_x",
      "runContext": {
        "teamId": "development-team",
        "workflowId": "marketing",
        "workflowRunId": "{{run.id}}",
        "nodeId": "publish_x"
      }
    }
  }
}
```

For full posting details, see [OUTBOUND_POSTING.md](OUTBOUND_POSTING.md).

#### Other tool names
If a tool node references some other tool name, the runner will try to invoke that tool by name.

Example:

```json
{
  "id": "some_tool_step",
  "kind": "tool",
  "assignedTo": { "agentId": "development-team-lead" },
  "action": {
    "tool": "message",
    "args": {
      "action": "send",
      "channel": "telegram",
      "target": "123456",
      "message": "Workflow says hello"
    }
  }
}
```

Whether that works depends on your actual runtime/tool exposure.

### `human_approval`
Purpose:
- pause a workflow until a human approves or rejects

Use it when:
- the workflow might publish externally
- a human needs to review copy or generated content
- the next step is risky enough that you do not want it to happen automatically

Required pieces:
- `assignedTo.agentId`
- `action.approvalBindingId` (or workflow-level fallback metadata that resolves to one)

What it does:
- writes `approvals/approval.json`
- sends an approval request message through the bound messaging target
- changes run status to `awaiting_approval`
- waits until you record a decision

Example:

```json
{
  "id": "approval",
  "kind": "human_approval",
  "assignedTo": { "agentId": "development-team-lead" },
  "action": {
    "approvalBindingId": "marketing-approval"
  }
}
```

### `writeback`
Purpose:
- append workflow run information back into one or more workspace files

Use it when:
- you want a durable audit note in `notes/` or `shared-context/`
- you want workflow output to leave a breadcrumb for humans
- you want the run to update a team file after the main work finishes

Required pieces:
- `assignedTo.agentId`
- `action.writebackPaths[]`

What it does:
- appends a stamped workflow note with run/ticket context into the target file(s)

Example:

```json
{
  "id": "write_summary",
  "kind": "writeback",
  "assignedTo": { "agentId": "development-team-lead" },
  "action": {
    "writebackPaths": [
      "notes/status.md",
      "shared-context/last-run.md"
    ]
  }
}
```

---

## What is **not** currently a first-class built-in node type?

People often expect nodes like:
- `if`
- `delay`
- `switch`
- `loop`

Those are **not currently first-class built-in node kinds** in the runner code.

So if you want branching today, use:
- edges (`success`, `error`, `always`)
- multiple nodes
- approval or tool-mediated control flow

If you want waiting/delay behavior today, do it outside the runner with:
- cron triggers
- scheduled reruns
- approval pause/resume

I’m calling this out explicitly so we don’t imply features that do not yet exist as first-class nodes.

---

## Triggers

Triggers answer the question:

**“What causes a workflow run to be created?”**

In the current schema, a workflow may include `triggers[]`.

Current workflow type shape:

```json
{
  "kind": "cron",
  "cron": "0 14 * * 1-5",
  "tz": "America/New_York"
}
```

### What is currently supported in the type layer?
- `cron` is the clearly documented trigger kind in the current workflow types
- manual runs are also supported operationally via CLI, even though that is a run-time invocation mode rather than a trigger stored in the workflow file

### Example trigger block

```json
{
  "id": "weekday-summary",
  "triggers": [
    {
      "kind": "cron",
      "cron": "0 14 * * 1-5",
      "tz": "America/New_York"
    }
  ],
  "nodes": [
    { "id": "start", "kind": "start" },
    { "id": "end", "kind": "end" }
  ]
}
```

Human translation of that example:
- run on weekdays
- at 2:00 PM
- in New York time

### Manual trigger example
You can always create a run manually:

```bash
openclaw recipes workflows run \
  --team-id development-team \
  --workflow-file weekday-summary.workflow.json
```

---

## Runs

A **run** is one concrete execution of a workflow.

If your workflow is the recipe, the run is the actual cooking session.

### What a run records
A run stores:
- workflow id/name/file
- team id
- run id
- trigger information
- current run status
- node states
- event history
- node results
- ticket/lane context when used

### Common run statuses you will see
Examples include:
- `queued` — the run exists and is waiting to be claimed
- `running` — the runner/worker is actively moving it forward
- `awaiting_approval` — the run is paused for human review
- `completed` — the run finished successfully
- `rejected` — approval was rejected and the run stopped there
- `needs_revision` — a rejection pushed the run back into a revise-and-try-again path

### Where a run lives

```text
shared-context/workflow-runs/<runId>/run.json
```

### What else is inside the run folder?
- `node-outputs/` — output from nodes
- `artifacts/` — tool result payloads
- `approvals/approval.json` — approval state when needed

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

## Edges

Edges define how the workflow graph moves from one node to another.

Current edge shape:

```json
{
  "from": "draft_post",
  "to": "approval",
  "on": "success"
}
```

### Supported `on` values
- `success`
- `error`
- `always`

### What they mean
#### `success`
Move to the target node if the source node completed successfully.

```json
{ "from": "draft_post", "to": "approval", "on": "success" }
```

#### `error`
Move to the target node if the source node failed.

```json
{ "from": "publish_x", "to": "notify_failure", "on": "error" }
```

#### `always`
Move to the target node whether the source node succeeded or failed.

```json
{ "from": "publish_x", "to": "write_summary", "on": "always" }
```

### Important current semantics
The current runner behavior is intentionally simple:

- if a node has explicit `input.from`, those dependencies behave like **AND**
- if a node has incoming edges, edge satisfaction behaves like **OR**
  - meaning: if **any** incoming edge condition is satisfied, the node can run

Human translation:
- `input.from` is "wait for all of these upstream node outputs"
- incoming edges are "if any of these paths became valid, go ahead"

That is important. Do not assume complex boolean graph semantics unless you have built them explicitly.

### Example: success path + failure path

```json
{
  "edges": [
    { "from": "draft_post", "to": "approval", "on": "success" },
    { "from": "draft_post", "to": "notify_failure", "on": "error" },
    { "from": "approval", "to": "publish_x", "on": "success" },
    { "from": "publish_x", "to": "write_summary", "on": "always" }
  ]
}
```

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

This is the operational sequence most people mean when they say, "run the workflow":

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

---

## End-to-end example: draft → approve → publish

Use this pattern when you want:
- an LLM to draft content
- a human to approve it
- a tool step to publish it only after approval

```json
{
  "id": "marketing-demo",
  "name": "Marketing demo",
  "nodes": [
    { "id": "start", "kind": "start" },
    {
      "id": "draft_post",
      "kind": "llm",
      "assignedTo": { "agentId": "development-team-lead" },
      "action": {
        "promptTemplate": "Write a short X post announcing our new workflow system."
      }
    },
    {
      "id": "approval",
      "kind": "human_approval",
      "assignedTo": { "agentId": "development-team-lead" },
      "action": {
        "approvalBindingId": "marketing-approval"
      }
    },
    {
      "id": "publish_x",
      "kind": "tool",
      "assignedTo": { "agentId": "development-team-lead" },
      "action": {
        "tool": "outbound.post",
        "args": {
          "platform": "x",
          "text": "Hello from ClawRecipes",
          "idempotencyKey": "demo:publish_x"
        }
      }
    },
    { "id": "end", "kind": "end" }
  ],
  "edges": [
    { "from": "start", "to": "draft_post", "on": "success" },
    { "from": "draft_post", "to": "approval", "on": "success" },
    { "from": "approval", "to": "publish_x", "on": "success" },
    { "from": "publish_x", "to": "end", "on": "success" }
  ]
}
```
