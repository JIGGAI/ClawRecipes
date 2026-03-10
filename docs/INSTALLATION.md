# Installation

This repo is an **OpenClaw plugin**. After install, its commands show up under:

```bash
openclaw recipes ...
```

This guide is for humans who want a clean install and a quick way to verify it actually works.

---

## Before you start

Make sure these work first:

```bash
openclaw --version
openclaw plugins list
```

You should also know which install path you want:
- **npm install** — best for normal users
- **linked local checkout** — best for development or rapid iteration

---

## Option A — install from npm

```bash
openclaw plugins install @jiggai/recipes
openclaw gateway restart
openclaw plugins list
```

Then confirm the plugin is loaded:

```bash
openclaw recipes list
```

### If you use a plugin allowlist
If your OpenClaw config uses `plugins.allow`, you may need to explicitly allow `recipes`.

Inspect first:

```bash
openclaw config get plugins.allow --json
```

If needed, update it and restart:

```bash
openclaw config set plugins.allow --json '["memory-core","telegram","recipes"]'
openclaw gateway restart
```

---

## Option B — install from a local checkout

```bash
git clone https://github.com/JIGGAI/ClawRecipes.git ~/ClawRecipes
openclaw plugins install --link ~/ClawRecipes
openclaw gateway restart
openclaw plugins list
```

Verify:

```bash
openclaw recipes list
```

---

## Option C — update an existing linked checkout

If you already have a linked local repo:

```bash
cd ~/ClawRecipes
git pull
openclaw gateway restart
```

---

## First commands to run after install

These are the fastest sanity checks:

```bash
openclaw recipes list
openclaw recipes show development-team
openclaw recipes status development-team
```

Then scaffold something small:

```bash
openclaw recipes scaffold project-manager --agent-id pm --apply-config
```

Or scaffold a team:

```bash
openclaw recipes scaffold-team development-team \
  --team-id development-team \
  --apply-config
```

---

## Important workflow note after install

Installing ClawRecipes does **not** automatically mean workflow posting side effects are turned on.

### What is available after a normal install
After install, you have:
- workflow runner commands
- workflow files on disk
- approval flow support
- file-first run storage

### What may still require extra setup
If you want workflows to **publish** content externally:
- you should configure the supported `outbound.post` path, or
- if you rely on a controller-local custom patch, you must reapply that patch after install/update

### Plain-English warning
If you have a workflow that should post to X or another external destination, do **not** assume it will post just because the plugin installed successfully.

After install/update, either:
1. configure the supported outbound posting service, or
2. tell your assistant to turn workflow posting back on / reapply your local patch

See:
- [WORKFLOW_RUNS_FILE_FIRST.md](WORKFLOW_RUNS_FILE_FIRST.md)
- [OUTBOUND_POSTING.md](OUTBOUND_POSTING.md)

---

## Uninstall

```bash
openclaw plugins uninstall recipes
openclaw gateway restart
```

---

## Troubleshooting

### `openclaw recipes ...` commands are missing
Try:

```bash
openclaw plugins list
openclaw gateway restart
openclaw recipes list
```

### Plugin installed but did not load
Check:
- the plugin appears in `openclaw plugins list`
- your allowlist is not blocking `recipes`
- you restarted the gateway after install

### Workflow commands exist, but posting is still off
That is possible and expected.

Check whether you are using:
- the supported `outbound.post` service path, or
- a local custom patch that needs to be reapplied after install/update

### `install-skill` fails
This command uses ClawHub.

Try:

```bash
npx clawhub@latest --help
```

If needed:

```bash
npx clawhub@latest login
```

---

## Quick reference

```bash
# install
openclaw plugins install @jiggai/recipes
openclaw gateway restart

# verify
openclaw recipes list

# scaffold an agent
openclaw recipes scaffold project-manager --agent-id pm --apply-config

# scaffold a team
openclaw recipes scaffold-team development-team --team-id development-team --apply-config
```
