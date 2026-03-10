# Outbound posting for workflows

If you want ClawRecipes workflows to actually publish content, read this doc.

This is the difference between:
- "the workflow ran"
- and
- "the workflow posted something externally"

Those are not the same thing.

---

## The recommended way: `outbound.post`

ClawRecipes supports workflow publishing through the runner-native tool:

```text
outbound.post
```

This tool sends a request to a separate **Outbound Posting Service** that owns the actual platform credentials.

Why this is the preferred path:
- better separation of concerns
- credentials stay out of workflow files
- easier audit logging
- better idempotency / retry safety
- approval proof can be enforced

---

## What you need to configure

`outbound.post` needs two plugin config values:
- `outbound.baseUrl`
- `outbound.apiKey`

If either is missing, the workflow will fail with a clear message.

Example conceptual config values:

```json
{
  "outbound": {
    "baseUrl": "http://localhost:8787",
    "apiKey": "your-service-key"
  }
}
```

Exact config placement depends on how your OpenClaw deployment manages plugin config.

---

## Example workflow node

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
      "idempotencyKey": "<workflowRunId>:publish_x",
      "runContext": {
        "teamId": "development-team",
        "workflowId": "marketing",
        "workflowRunId": "<workflowRunId>",
        "nodeId": "publish_x"
      }
    }
  }
}
```

---

## Tool arguments

Expected arguments:

```json
{
  "platform": "x",
  "text": "...",
  "idempotencyKey": "<stable string>",
  "runContext": {
    "teamId": "...",
    "workflowId": "...",
    "workflowRunId": "...",
    "nodeId": "..."
  },
  "approval": {
    "code": "...",
    "approvalFileRel": "shared-context/workflow-runs/.../approvals/approval.json"
  }
}
```

Notes:
- `platform`, `text`, and `idempotencyKey` are required
- use a stable `idempotencyKey` across retries
- `approval` is optional unless your outbound service requires proof

A good default idempotency key:

```text
<workflowRunId>:<nodeId>
```

---

## Important note about installs and posting

A normal ClawRecipes install does **not** automatically mean posting is active.

### Supported path
If you configure `outbound.post`, great — that is the supported path.

### Local custom patch path
If your controller relies on a custom local patch (for example, a local posting helper wired directly into workflow execution), that patch may need to be reapplied after install/update.

That means after installing or updating ClawRecipes, you may need to:
- reapply your local workflow posting patch, or
- tell your assistant to turn workflow posting back on for your local controller

This is especially important if:
- workflows run successfully
- approvals succeed
- but nothing actually gets posted

---

## Example post-install checklist

After a fresh install or update:

```bash
# 1) confirm plugin is installed
openclaw plugins list

# 2) confirm workflow commands exist
openclaw recipes workflows --help

# 3) confirm your posting path is configured or patched
#    (depends on your environment)

# 4) run a test workflow
openclaw recipes workflows run \
  --team-id development-team \
  --workflow-file marketing.workflow.json
```

If you use a local patch, this is the moment to reapply it.

---

## Expected outbound service API

ClawRecipes expects something like:

- `POST /v1/<platform>/publish`
- `Authorization: Bearer <apiKey>`
- `Idempotency-Key: <string>`

Example success response:

```json
{
  "ok": true,
  "platform": "x",
  "id": "123",
  "url": "https://x.com/..."
}
```

---

## Security notes

- do **not** put platform credentials in workflow files
- prefer a local/tailnet-only outbound service
- treat outbound publishing as a side-effecting action that should usually be approval-gated
- use idempotency keys so retries do not double-post
