# Workflow Approvals

Human approval nodes (`human_approval`) pause workflow execution for manual review. This document covers the runtime behavior, state management, and approval flow.

## Approval Flow Overview

1. **Node Execution** — Worker reaches approval node
2. **Pause State** — Run status changes to `awaiting_approval`
3. **Message Sent** — Approval request sent to configured channel
4. **Human Decision** — User replies with approve/decline command
5. **State Update** — Approval recorded to disk
6. **Resume** — Workflow continues or loops back for revision

## Runtime Behavior

### Node Status Transition

When a workflow worker processes a `human_approval` node:

```
node.status: undefined → waiting → waiting_approval
run.status: running → awaiting_approval
```

The worker:
1. Creates approval directory: `workflow-runs/{runId}/approvals/`
2. Generates random approval code (6-char uppercase)
3. Writes `approval.json` with pending status
4. Sends message to configured channel with approval code
5. Marks node as waiting in run state
6. Pauses execution (no further nodes enqueued)

### State Files Written

**Run Log Update** (`workflow-runs/{runId}/run.json`):
```json
{
  "status": "awaiting_approval",
  "nodeStates": {
    "approval_node": {"status": "waiting", "ts": "2025-04-04T03:53:15.000Z"}
  },
  "events": [
    {
      "ts": "2025-04-04T03:53:15.000Z", 
      "type": "node.awaiting_approval",
      "nodeId": "approval_node",
      "bindingId": "telegram:account:mybot",
      "approvalFile": "workflow-runs/2025-04-04T03-53-00-123Z/approvals/approval.json"
    }
  ],
  "nodeResults": [
    {
      "nodeId": "approval_node",
      "kind": "human_approval", 
      "approvalBindingId": "telegram:account:mybot",
      "approvalFile": "workflow-runs/2025-04-04T03-53-00-123Z/approvals/approval.json"
    }
  ]
}
```

**Approval Record** (`workflow-runs/{runId}/approvals/approval.json`):
```json
{
  "runId": "2025-04-04T03-53-00-123Z",
  "teamId": "marketing-team",
  "workflowFile": "content-pipeline.workflow.json",
  "nodeId": "approval_node",
  "bindingId": "telegram:account:mybot",
  "requestedAt": "2025-04-04T03:53:15.000Z",
  "status": "pending",
  "code": "XY4K91",
  "ticket": "work/in-progress/0042-social-media-campaign.md",
  "runLog": "workflow-runs/2025-04-04T03-53-00-123Z/run.json"
}
```

## Message Template Rendering

The approval message includes template variable substitution:

**Template Variables Available:**
- `{{workflow.name}}` — Workflow display name
- `{{code}}` — Generated approval code  
- `{{ticket}}` — Relative path to ticket file
- Proposed content preview (from prior node outputs)

**Default Message Template:**
```
Approval requested: {{workflow.name}}
Ticket: {{ticket}}
Code: {{code}}

---
PROPOSED POST (X)
---
{{proposed_content}}

Reply with:
- approve {{code}}
- decline {{code}} <what to change>

(You can also review in Kitchen: http://localhost:7777/teams/{{teamId}}/workflows/{{workflow.id}})
```

**Proposed Content Logic:**
1. Look for `qc_brand` node output first
2. Fall back to most recent prior LLM node
3. Extract `text` field and sanitize for preview
4. Show "(Warning: no proposed text found)" if unavailable

## Human Response Handling

### Command Format

Users reply in the configured channel:

```
approve XY4K91
decline XY4K91 needs better headlines
```

**Parsing Rules:**
- Case-insensitive verb matching: `approve|decline`
- Code must be exact (uppercase)
- Optional note after code for decline responses
- Parser checks multiple lines, prefers last match

### Auto-Processing

When a user replies with a valid approval command:

1. **Event Detection** — Plugin listener matches approval format
2. **Code Lookup** — Searches all team runs for matching pending approval
3. **Decision Recording** — Updates approval.json status and note
4. **Auto-Resume** — Calls resume workflow to continue execution

**Supported Channels:**
- Telegram (primary)
- Other channels with conditional processing based on metadata

## Resume and Continuation

### Approval Resume

**Approved Flows:**
```
approval.status: pending → approved
node.status: waiting → success  
run.status: awaiting_approval → running
→ Next node enqueued
```

**Rejection Flows:**
```
approval.status: pending → rejected
node.status: waiting → error
run.status: awaiting_approval → needs_revision
→ Loop back to revision node
```

### Revision Logic

When an approval is declined:

1. **Find revision target** — Prefers `draft_assets` node, else closest prior LLM node
2. **Clear node states** — Remove status for revision node onward
3. **Clear locks** — Remove any stale node lock files  
4. **Enqueue revision** — Send revision task to appropriate agent
5. **Include feedback** — Pass human note in task packet

**Revision Node Selection:**
```typescript
// Preferred: explicit draft_assets node
let reviseIdx = workflow.nodes.findIndex(n => n.id === 'draft_assets');

// Fallback: most recent LLM node before approval  
if (reviseIdx < 0) {
  for (let i = approvalIdx - 1; i >= 0; i--) {
    if (workflow.nodes[i]?.kind === 'llm') {
      reviseIdx = i;
      break;
    }
  }
}
```

## Configuration

### Node Configuration

```json
{
  "id": "final_approval",
  "kind": "human_approval",
  "action": {
    "approvalBindingId": "telegram:account:mybot"
  },
  "config": {
    "provider": "telegram",
    "target": "6477250615",
    "accountId": "mybot", 
    "agentId": "marketing-team-lead"
  }
}
```

**Configuration Hierarchy:**
1. `approvalBindingId` → Look up in OpenClaw config bindings
2. `config.target` → Direct channel target
3. Back-compat fallbacks for known account IDs

### Agent Assignment

Approval nodes are executed by:
1. **Explicit `config.agentId`** — Workflow author override
2. **Team lead** — `${teamId}-lead` (default orchestrator)  
3. **Current agent** — Fallback for backwards compatibility

## Command Line Interface

### Manual Approval
```bash
openclaw recipes workflows approve \
  --team-id marketing-team \
  --run-id 2025-04-04T03-53-00-123Z \
  --approved true

openclaw recipes workflows approve \
  --team-id marketing-team \
  --run-id 2025-04-04T03-53-00-123Z \
  --approved false \
  --note "Headlines need work"
```

### Resume Workflow  
```bash
openclaw recipes workflows resume \
  --team-id marketing-team \
  --run-id 2025-04-04T03-53-00-123Z
```

### Poll Approvals
```bash
# Auto-resume any decided approvals
openclaw recipes workflows poll-approvals \
  --team-id marketing-team \
  --limit 20
```

## Implementation Details

### Code Locations

**Primary Approval Logic:**
- `src/lib/workflows/workflow-approvals.ts`
  - `approveWorkflowRun()` — Record approval decision
  - `resumeWorkflowRun()` — Continue/revise after decision
  - `pollWorkflowApprovals()` — Auto-resume decided approvals

**Worker Execution:**
- `src/lib/workflows/workflow-worker.ts`
  - Approval node execution in `runWorkflowWorkerTick()`
  - Message sending and state management

**Event Handling:**
- `index.ts` — Auto-approval reply handler in plugin registration

### File Structure
```
workspace-{teamId}/
└── shared-context/
    └── workflow-runs/
        └── {runId}/
            ├── run.json              # Main run state
            ├── approvals/
            │   └── approval.json     # Approval record
            ├── locks/                # Node execution locks
            └── node-outputs/         # Node result files
```

## Error Handling

### Missing Targets
```
Node final_approval missing approval target (provide config.target or binding mapping)
```

**Solution:** Configure `config.target` or add binding in OpenClaw config.

### Code Not Found
```
[recipes] approval reply not matched: code=XY4K91
```

**Causes:**
- Code already processed/expired
- Wrong team workspace searched  
- Approval file corrupted

### Resume Failures
```
Approval still pending. Update approval.json first.
```

**Solution:** Record decision with `workflows approve` before resuming.

## Best Practices

### Node Placement
- Place approval nodes after content generation but before publishing
- Use descriptive node IDs: `final_approval`, `brand_review`, `legal_check`

### Message Configuration  
- Always configure approval binding in OpenClaw config for production
- Test approval flow with known test accounts/channels
- Include meaningful context in approval messages

### Error Recovery
- Monitor approval files for stuck `pending` status
- Use `poll-approvals` for automated processing
- Set up alerting for approval timeouts

### Workflow Design
- Design clear revision loops with identifiable `draft_assets` nodes
- Keep approval criteria specific and actionable
- Document approval responsibilities in team workflows

## Related Documentation

- [WORKFLOW_NODES.md](WORKFLOW_NODES.md) — All node types and configuration
- [TEMPLATE_VARIABLES.md](TEMPLATE_VARIABLES.md) — Message template variables
- [OUTBOUND_POSTING.md](OUTBOUND_POSTING.md) — Publishing after approval
- [COMMANDS.md](COMMANDS.md) — CLI workflow commands