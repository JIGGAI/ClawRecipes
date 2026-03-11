# Swarm Orchestrator

This document explains what the **Swarm Orchestrator** is, when to use it, and how to work with it from the team editor.

If you want the short version:
- a normal team handles work through shared files and ticket lanes
- a swarm orchestrator is for **parallel coding work** using **git worktrees + tmux sessions**
- it is best when one lead wants to fan work out to multiple coding agents at once

---

## What it is

The Swarm Orchestrator is a recipe/scaffold that creates an orchestration workspace for parallel coding work.

Its job is to:
- split work into focused tasks
- spin up multiple coding agents in parallel
- give each one its own branch/worktree/session
- track what is active
- help monitor and clean up those parallel tasks

Think of it as a coordination layer for multi-agent coding, not as a replacement for the normal team workspace.

---

## When to use it

Use Swarm Orchestrator when:
- one ticket can be split into several parallel coding tasks
- you want separate branches/worktrees for isolation
- you want to monitor several coding sessions at once
- you want a lead/orchestrator role to coordinate multiple implementation attempts

Do **not** use it when:
- the work is simple enough for one normal ticket/one agent
- you do not want git worktrees
- you do not want tmux sessions
- the extra orchestration overhead is not worth it

---

## What it creates

The bundled `swarm-orchestrator` recipe creates an orchestrator workspace with files like:

```text
.clawdbot/
  CONVENTIONS.md
  PROMPT_TEMPLATE.md
  TEMPLATE.md
  env.sh
  spawn.sh
  task.sh
  check-agents.sh
  cleanup.sh
  active-tasks.json
```

These files are the operating surface for the orchestrator.

Important ones:
- `CONVENTIONS.md` — naming rules and defaults
- `PROMPT_TEMPLATE.md` — the required base prompt for spawned coding agents
- `TEMPLATE.md` — starter task/spec shape
- `env.sh` — local environment values
- `spawn.sh` / `task.sh` — start work
- `check-agents.sh` — inspect current swarm sessions
- `cleanup.sh` — safe cleanup helpers
- `active-tasks.json` — lightweight task registry

---

## Core concepts

### Worktree
Each coding task gets its own git worktree.

That means one repo can support multiple isolated task directories at the same time.

### Branch
Each task gets its own branch.

That keeps parallel agent work separated and easier to review.

### tmux session
Each coding agent runs in its own tmux session.

That means you can:
- attach to it
- watch it live
- steer it
- recover it if needed

### Registry
The orchestrator keeps a lightweight registry of active tasks in:

```text
.clawdbot/active-tasks.json
```

This is the quick answer to:
- what is running?
- on what branch?
- in which worktree?
- in which tmux session?

---

## Team editor angle

From the team editor point of view, the Swarm Orchestrator is useful when you want a visible place to manage parallel implementation work.

The team editor should help you:
- see whether an orchestrator exists for the team
- see the orchestrator workspace path
- inspect active tasks / sessions / branches
- know where env/config values live
- know which files to edit for conventions and prompts

A good mental model for the team editor is:
- the team editor is the dashboard
- the orchestrator workspace is the operating surface

So if the editor shows a Swarm Orchestrator area, the most useful things it can surface are:
- worktree root
- base ref
- active tasks
- task ids
- tmux session names
- registry status
- links to `.clawdbot/CONVENTIONS.md` and `.clawdbot/PROMPT_TEMPLATE.md`

---

## How to inspect the recipe

```bash
openclaw recipes show swarm-orchestrator
```

This is the fastest way to inspect what the bundled recipe currently scaffolds.

---

## Typical setup flow

### 1) Scaffold the orchestrator

The exact scaffold command depends on how you want to install it, but the first thing is to inspect the recipe and then scaffold it into a workspace.

```bash
openclaw recipes show swarm-orchestrator
```

If you are using it as a standalone workspace recipe, scaffold it like your other recipes.

---

### 2) Configure environment values

The orchestrator relies on values in `.clawdbot/env.sh`.

Common ones include:
- `SWARM_REPO_DIR`
- `SWARM_WORKTREE_ROOT`
- `SWARM_BASE_REF`
- optional agent-runner command settings

Practical advice:
- keep worktrees in a dedicated folder
- keep that folder outside the repo
- keep it outside the OpenClaw workspace if possible

---

### 3) Check prerequisites

Common prerequisites include:
- `git`
- `tmux`
- `jq`

The orchestrator recipe/source docs also mention these directly.

---

## Starting work

The orchestrator’s job is to start focused tasks.

Typical pattern:
- create a task spec
- choose branch/worktree/session names
- spawn the task
- record/update the registry

The scaffolded scripts are designed to help with that.

Example commands from the orchestrator workspace:

```bash
./.clawdbot/task.sh start --task-id 0082 --spec "Implement workflow queue improvements"
```

Or directly:

```bash
./.clawdbot/spawn.sh feat-0082-a codex swarm-0082-a
```

Exact flags may vary with your local scaffold/version, so treat the local generated files as the source of truth.

---

## Monitoring work

To inspect current orchestrated work:

```bash
./.clawdbot/check-agents.sh
```

And for tmux directly:

```bash
tmux ls
tmux attach -t swarm-0082-a
```

Use the registry too:

```bash
cat ./.clawdbot/active-tasks.json
```

This gives you the fastest picture of:
- active tasks
- branch names
- worktree paths
- tmux sessions
- rough task status

---

## Cleanup

There is also a cleanup script in the scaffold.

Typical use:

```bash
./.clawdbot/cleanup.sh
```

Important rule:
- do **not** delete worktrees/branches casually
- cleanup should stay conservative unless explicitly enabled

That caution matters, because orchestrator cleanup can otherwise destroy in-progress work.

---

## Suggested workflow

A practical orchestrator loop looks like this:

1. identify a ticket worth parallelizing
2. break it into 2–N focused tasks
3. create one branch/worktree/session per task
4. monitor progress via tmux + registry
5. review outputs / PRs
6. merge or discard branches intentionally
7. clean up finished worktrees

---

## Common mistakes

### 1) Using swarm for tiny work
If one agent can do it cleanly, swarm is probably overkill.

### 2) Not setting a dedicated worktree root
That turns cleanup and inspection into a mess.

### 3) Letting naming drift
Use the conventions file. Otherwise you end up with branch/session chaos.

### 4) Treating tmux as optional when debugging
If agents are launched into tmux, tmux is the source of truth for what is actually happening live.

### 5) Deleting worktrees too early
Only clean up once branches/PRs/status are clearly done.

---

## How this should relate to the team editor

The team editor should make orchestrator use easier by exposing:
- whether the team has an orchestrator
- the orchestrator workspace location
- key env/config values
- active tasks summary
- links to conventions/prompt files
- where to monitor/clean up

This is the sweet spot:
- editor for visibility and navigation
- orchestrator workspace/scripts for execution

---

## Recommended related docs

- [TEAM_WORKFLOW.md](TEAM_WORKFLOW.md)
- [BUNDLED_RECIPES.md](BUNDLED_RECIPES.md)
- [AGENTS_AND_SKILLS.md](AGENTS_AND_SKILLS.md)
