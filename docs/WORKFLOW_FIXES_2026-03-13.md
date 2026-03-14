# Workflow fixes (2026-03-13)

This note summarizes the workflow reliability fixes merged on 2026-03-13.

## Kitchen (workflow editor)
- Persist real approval binding ids when saving workflows.
  - Prevents saving synthetic ids like `telegram:dm:<peer>`.
  - Ensures `meta.approvalBindingId` and the `human_approval` node config stay in sync.

## Recipes / workflow runner
### Approval ingestion
- Robust parsing of approval replies (plain text and formatted/wrapped text).
- Use the runtime hook name (`message_received`) and scan the canonical workspace root so approval lookup works even when the inbound message is routed to a role workspace (e.g. `workspace-<teamId>/roles/copywriter`).

### Queue / worker durability
- Skip stale recovered tasks so expired claim recovery cannot replay old nodes on runs that already advanced.

### Worker cron execution
- Removed `tools.deny: ["exec"]` from the default `marketing-team` recipe so isolated worker loops can actually execute `worker-tick` commands.

## Known remaining issues / follow-ups
- Completion Telegram notifier is still somewhat intermittent. When it fires, it includes the X URL and runId.
  - If it remains flaky, likely fix is to add a deterministic notification node (workflow-level) or a runner-level `run.completed` notifier that uses the `post_to_platforms` artifact URLs.
