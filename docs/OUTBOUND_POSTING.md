# Outbound posting (publish) via `outbound.post`

ClawRecipes intentionally avoids shipping “side-effect” tools (social posting, etc.) that require credentials inside a workflow.

Instead, workflows should call an **Outbound Posting Service** that owns credentials and enforces:
- auth (API key)
- idempotency (no double posts on retries)
- audit logging
- optional human approval proof

ClawRecipes provides the runner-native tool **`outbound.post`** to call that service.

## Configure the Outbound Service (plugin config)

`outbound.post` requires two plugin config values:

- `outbound.baseUrl` (e.g. `http://localhost:8787`)
- `outbound.apiKey` (API key issued by your outbound service)

Where you set this depends on your OpenClaw deployment. In general, configure these in the ClawRecipes plugin configuration used by your Kitchen / gateway.

If either is missing, workflow execution will fail with a clear error:
- `outbound.post requires plugin config outbound.baseUrl`
- `outbound.post requires plugin config outbound.apiKey`

## Tool arguments

`outbound.post` expects:

```json
{
  "platform": "x" ,
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
- `platform`, `text`, and `idempotencyKey` are required.
- `idempotencyKey` should be stable across retries. Recommended: `"<workflowRunId>:<nodeId>"`.
- `runContext` is strongly recommended (used for audit logging + traceability).
- `approval` is optional, but if your outbound service is configured to require approval proof, requests missing approval will be rejected.

## Example workflow node

```json
{
  "id": "publish_x",
  "kind": "tool",
  "assignedTo": { "agentId": "{{team.id}}-lead" },
  "action": {
    "tool": "outbound.post",
    "args": {
      "platform": "x",
      "text": "{{nodes.qc_brand.output.text}}",
      "idempotencyKey": "{{run.id}}:publish_x",
      "runContext": {
        "teamId": "{{team.id}}",
        "workflowId": "{{workflow.id}}",
        "workflowRunId": "{{run.id}}",
        "nodeId": "publish_x"
      }
    }
  }
}
```

## Expected outbound service API

ClawRecipes expects an HTTP API shaped like:

- `POST /v1/<platform>/publish`
  - `Authorization: Bearer <apiKey>`
  - `Idempotency-Key: <string>`

Success response (example):

```json
{ "ok": true, "platform": "x", "id": "...", "url": "https://..." }
```

If the same idempotency key is re-used with a different payload, the service should return a 409-style conflict error (to prevent accidental double posting).

## Security notes

- Do not store platform credentials in workflow files.
- Prefer running the outbound service on the same machine/tailnet as OpenClaw.
- For managed outbound service (SaaS), do **not** rely on filesystem-based approval proof. Use signed receipts (planned).
