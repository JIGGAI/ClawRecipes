# Team workflow (file-first)

ClawRecipes’ differentiator is the **shared team workspace** + a simple, durable, file-first workflow.

## Team workspace structure
When you scaffold a team:

```
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
  TEAM.md
```

## The loop
1) **Intake**
- New requests land in `inbox/`.

2) **(Optional) Nudge / automation**
- A cron job can periodically ping the team lead to triage `inbox/` and keep work moving.

3) **Plan / triage (lead)**
- Convert the request into a numbered ticket in `work/backlog/`.
- Fill out: Context, Requirements, Acceptance Criteria, Tasks, Owner, Status, and verification steps.
- **Every ticket must include a `## Comments` section.** Agents must check/respond to comments on tickets they’re assigned to **or** where they are mentioned via `@<agentname>`.
- Filename ordering is the priority queue.

4) **Execute (dev/devops)**
- Move ticket file to `work/in-progress/` (or use `take`).
- Do work; write artifacts into `shared/` or agent workspaces.

5) **Test**
- Move ticket to `work/testing/`.
- Assign `Owner: test` (or explicitly tag the tester role) and include clear “Verification steps” in the ticket.
- Tester verifies and either:
  - moves to `work/done/` (pass), or
  - bounces back to `work/in-progress/` with a bug note (fail)

6) **Complete**
- Move ticket to `work/done/` (or use `complete`).
- Add `Completed:` timestamp (automated by `complete` or `move-ticket --completed`).

## Sub-agents + waking up the lead (important)
Two concepts people often mix up:

1) **Chatting with a role agent directly**
- If an agent id exists (configured under `agents.list`), you can start a chat with it directly via UI/CLI.

2) **Asking one agent (usually `main`) to wake/spawn/ping another agent**
- This uses sub-agent/session tooling, and is gated by the requester’s allowlist.

### Why the lead sometimes “never picks it up”
Even if `openclaw recipes dispatch` created an inbox entry + backlog ticket, the lead won’t act unless:
- a human opens the lead agent/chat, **or**
- an automation loop runs (cron triage), **or**
- `main` is allowed to message/spawn the lead agent.

### Allowlisting other agents (subagents.allowAgents)
To allow `main` to target team role agents (like `development-team-lead`), add this to your OpenClaw config:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        subagents: {
          allowAgents: ["development-team-lead"], // or ["*"] for any configured agent
        },
      },
    ],
  },
}
```

Then restart the gateway.

Tip: use the `agents_list` tool to see what’s currently allowed.

## Dispatcher command
The lead can convert a natural-language request into artifacts with:

```bash
openclaw recipes dispatch --team-id <teamId> --request "..." --owner dev
```

This creates:
- an inbox entry
- a backlog ticket
- an assignment stub

## Why file-first?
- Works offline
- Easy to version control
- Easy to audit and search
- Doesn’t depend on any single UI
