# Workflow examples

This document gives you copyable workflow patterns for ClawRecipes.

Use it together with:
- [WORKFLOW_RUNS_FILE_FIRST.md](WORKFLOW_RUNS_FILE_FIRST.md) — concepts, node kinds, triggers, runs, edges
- [OUTBOUND_POSTING.md](OUTBOUND_POSTING.md) — publishing/posting setup

---

## Example 1: simplest possible workflow

Use this when you just want to prove the runner works.

```json
{
  "id": "append-demo",
  "name": "Append demo",
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
          "content": "- {{date}} run={{run.id}}\n"
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

What it does:
- starts
- appends one line to a file
- ends

---

## Example 2: LLM draft only

Use this when you want the workflow to generate text and stop there.

```json
{
  "id": "draft-only",
  "name": "Draft only",
  "nodes": [
    { "id": "start", "kind": "start" },
    {
      "id": "draft_post",
      "kind": "llm",
      "assignedTo": { "agentId": "development-team-lead" },
      "action": {
        "promptTemplate": "Write a short product update for X announcing a new workflow feature."
      }
    },
    { "id": "end", "kind": "end" }
  ],
  "edges": [
    { "from": "start", "to": "draft_post", "on": "success" },
    { "from": "draft_post", "to": "end", "on": "success" }
  ]
}
```

What it does:
- drafts content with an LLM
- writes the output to `node-outputs/`
- finishes without posting anything

---

## Example 3: draft → approve → publish

Use this when you want a human review step before external posting.

```json
{
  "id": "draft-approve-publish",
  "name": "Draft, approve, publish",
  "nodes": [
    { "id": "start", "kind": "start" },
    {
      "id": "draft_post",
      "kind": "llm",
      "assignedTo": { "agentId": "development-team-lead" },
      "action": {
        "promptTemplate": "Write a short X post announcing our new feature."
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
          "idempotencyKey": "draft-approve-publish:publish_x"
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

What it does:
- drafts text
- pauses for approval
- publishes only after approval

---

## Example 4: writeback after work finishes

Use this when you want the workflow to leave a durable note in team files.

```json
{
  "id": "writeback-demo",
  "name": "Writeback demo",
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
          "content": "- workflow ran at {{date}}\n"
        }
      }
    },
    {
      "id": "write_summary",
      "kind": "writeback",
      "assignedTo": { "agentId": "development-team-lead" },
      "action": {
        "writebackPaths": ["notes/status.md"]
      }
    },
    { "id": "end", "kind": "end" }
  ],
  "edges": [
    { "from": "start", "to": "append_log", "on": "success" },
    { "from": "append_log", "to": "write_summary", "on": "success" },
    { "from": "write_summary", "to": "end", "on": "success" }
  ]
}
```

---

## Example 5: success path and failure path

Use this when you want different behavior after success vs failure.

```json
{
  "id": "success-error-paths",
  "name": "Success and error branches",
  "nodes": [
    { "id": "start", "kind": "start" },
    {
      "id": "publish_x",
      "kind": "tool",
      "assignedTo": { "agentId": "development-team-lead" },
      "action": {
        "tool": "outbound.post",
        "args": {
          "platform": "x",
          "text": "Hello from ClawRecipes",
          "idempotencyKey": "success-error-paths:publish_x"
        }
      }
    },
    {
      "id": "notify_failure",
      "kind": "tool",
      "assignedTo": { "agentId": "development-team-lead" },
      "action": {
        "tool": "message",
        "args": {
          "action": "send",
          "channel": "telegram",
          "target": "123456",
          "message": "Workflow publish step failed"
        }
      }
    },
    { "id": "end", "kind": "end" }
  ],
  "edges": [
    { "from": "start", "to": "publish_x", "on": "success" },
    { "from": "publish_x", "to": "end", "on": "success" },
    { "from": "publish_x", "to": "notify_failure", "on": "error" },
    { "from": "notify_failure", "to": "end", "on": "success" }
  ]
}
```

---

## Example 6: cron-triggered workflow skeleton

Use this when you want a workflow definition that is meant to run on a schedule.

```json
{
  "id": "weekday-summary",
  "name": "Weekday summary",
  "triggers": [
    {
      "kind": "cron",
      "cron": "0 14 * * 1-5",
      "tz": "America/New_York"
    }
  ],
  "nodes": [
    { "id": "start", "kind": "start" },
    {
      "id": "draft_summary",
      "kind": "llm",
      "assignedTo": { "agentId": "development-team-lead" },
      "action": {
        "promptTemplate": "Write a short weekday status summary."
      }
    },
    { "id": "end", "kind": "end" }
  ],
  "edges": [
    { "from": "start", "to": "draft_summary", "on": "success" },
    { "from": "draft_summary", "to": "end", "on": "success" }
  ]
}
```

---

## Common mistakes

### 1) Expecting `if` or `delay` nodes to work as first-class built-ins
They are not first-class built-in node kinds today.

### 2) Forgetting `assignedTo.agentId`
Several node kinds require it.

### 3) Expecting install to automatically enable posting
Workflow support and workflow posting are not the same thing.

### 4) Using paths outside the team workspace
`fs.append` is intentionally constrained.

### 5) Assuming all incoming edges must succeed
Current incoming-edge semantics are OR, not AND.

---

## Suggested learning order

If you are new to workflows, read in this order:
1. [WORKFLOW_RUNS_FILE_FIRST.md](WORKFLOW_RUNS_FILE_FIRST.md)
2. this file
3. [OUTBOUND_POSTING.md](OUTBOUND_POSTING.md)
