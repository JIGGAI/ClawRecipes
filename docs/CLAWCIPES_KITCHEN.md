# ClawRecipes Kitchen (UI)

ClawRecipes Kitchen is our UI for managing ClawRecipes workflows.

## What it's for
- **Team dashboards** — backlog / in progress / testing / done (Kanban)
- Activity feed (high-level semantic events)
- Weekly scheduled-task view
- Global search across workspace + memory/docs + tasks
- Agent chat room
- Goals system (file-based source of truth)

## Status
ClawRecipes Kitchen is under active development. Team dashboards are available.

## How to run

### Launch from OpenClaw

From the plugin:

```bash
openclaw recipes kitchen
```

This prints the command to run. Then:

```bash
npx -p @jiggai/recipes clawrecipes-kitchen
```

### From the ClawRecipes repo root

**Prerequisites:**
- `openclaw` on `PATH`
- ClawRecipes plugin installed (`openclaw plugins add ./ClawRecipes`)
- OpenClaw config at `~/.openclaw/openclaw.json` (or `OPENCLAW_STATE_DIR` / `OPENCLAW_CONFIG_PATH` if set)
- `agents.defaults.workspace` set in OpenClaw config (e.g. via `openclaw config set agents.defaults.workspace ~/.openclaw/workspace-my-team-team`)
- At least one scaffolded team (e.g. `openclaw recipes scaffold-team development-team --team-id my-team-team --apply-config`). Or use **demo data** (button when no teams) to try the UI without OpenClaw.

**From the ClawRecipes repo root:**

```bash
npm run kitchen
```

This starts the Kitchen backend (Express on port 3456) and the Vite dev server (port 5174). Open:

- **http://localhost:5174** — Kitchen UI (dev mode with hot reload)
- **http://localhost:3456** — backend API; serves built frontend when running `npm start` in `kitchen/`

**Production simulation** (build + single-server, no Vite dev server; avoids dev-only vulnerabilities):

```bash
npm run kitchen:prod
```

Or from `kitchen/`:
```bash
npm run prod
```

Then open http://localhost:3456. The API and built frontend are served from the same process; no hot reload.

## Security

ClawRecipes Kitchen has **no authentication by default**. It is intended for local use (e.g. `localhost:3456`). When exposed on a network, enable optional Basic Auth (see [Optional Basic Auth](#optional-basic-auth)) or use a firewall, VPN, or reverse proxy. See [SECURITY.md](../SECURITY.md) for reporting vulnerabilities.

**Production mode** (`NODE_ENV=production`): Rate limiting (100 requests/minute per IP, `/api/health` exempt) and Content-Security-Policy headers are applied. Destructive operations require explicit confirmation (see below). When behind a reverse proxy, ensure only authorized users can call privileged endpoints.

**Production API requirements:** When `NODE_ENV=production`, the following endpoints require the header `X-Confirm-Destructive: true`; otherwise they return 403:
- `POST /api/cleanup/execute` — Execute workspace cleanup
- `DELETE /api/teams/:teamId` — Remove a scaffolded team

Example: `curl -X DELETE -H "X-Confirm-Destructive: true" http://localhost:3456/api/teams/my-team-team`

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3456 | HTTP port for the Kitchen server |
| `OPENCLAW_STATE_DIR` | `~/.openclaw` | OpenClaw state directory (use if your config is elsewhere) |
| `NODE_ENV` | — | Set to `production` for production CORS (same-origin only), CSP, and rate limiting |
| `ACCESS_CONTROL_ALLOW_ORIGIN` | — | When `NODE_ENV=production`, if set, allows this origin for CORS (e.g. if frontend is on a different host) |
| `KITCHEN_AUTH_ENABLED` | — | Set to `true` to enable optional Basic Auth on API routes |
| `KITCHEN_AUTH_USER` | — | Username for Basic Auth (required when `KITCHEN_AUTH_ENABLED=true`) |
| `KITCHEN_AUTH_PASSWORD` | — | Password for Basic Auth (use when `KITCHEN_AUTH_ENABLED=true`; ignored if `KITCHEN_AUTH_PASSWORD_FILE` is set) |
| `KITCHEN_AUTH_PASSWORD_FILE` | — | Path to file containing the password (takes precedence over `KITCHEN_AUTH_PASSWORD`; recommended for Docker secrets, etc.) |

### Optional Basic Auth

When exposing Kitchen on a LAN or trusted network, you can enable Basic Auth instead of using a reverse proxy.

**Via CLI** (recommended):

```bash
openclaw recipes kitchen set-user --username admin --password your-secure-password
```

Or use a password file (e.g. for Docker secrets):

```bash
openclaw recipes kitchen set-user --username admin --password-file /run/secrets/kitchen-password
```

Or edit `kitchen/.env` directly:

```
KITCHEN_AUTH_ENABLED=true
KITCHEN_AUTH_USER=your-username
KITCHEN_AUTH_PASSWORD=your-password
# Or: KITCHEN_AUTH_PASSWORD_FILE=/path/to/password-file
```

If both `KITCHEN_AUTH_PASSWORD` and `KITCHEN_AUTH_PASSWORD_FILE` are set, the file takes precedence. Restrict the password file to mode `0600` (owner read-only) when possible.

Commands: `kitchen status`, `kitchen enable`, `kitchen disable`. **Restart Kitchen after changing credentials**—the password hash is cached at startup.

The UI will show a login page; credentials are stored in `sessionStorage` for the session. Exempt routes: `/api/health`, `/api/auth/status`. For stronger security or public exposure, use a reverse proxy with OAuth or similar.

## API

**Core**
- `GET /api/health` — Returns `{ ok: true, openclaw: boolean }` for monitoring (always unauthenticated)
- `GET /api/auth/status` — Returns `{ authRequired: boolean }` for auth bootstrap (always unauthenticated)
- `GET /api/teams` — List teams
- `DELETE /api/teams/:teamId` — Remove a scaffolded team (non-demo only; privileged; restrict access when behind a reverse proxy)
- `GET /api/teams/:teamId/tickets` — List tickets for a team (with titles from markdown)
- `GET /api/teams/:teamId/tickets/:ticketId/content` — Ticket markdown content
- `GET /api/teams/:teamId/inbox` — List inbox items
- `GET /api/teams/:teamId/inbox/:itemId/content` — Inbox item content

**Ticket actions (POST with JSON body)**
- `POST move` — Move ticket between columns (body: `{ ticketId, to }`)
- `POST assign` — Assign owner (body: `{ ticketId, owner }`)
- `POST take` — Take ticket
- `POST handoff` — Handoff ticket
- `POST complete` — Complete ticket
- `POST dispatch` — Create new ticket from request (body: `{ request, owner }`)

**Recipes**
- `GET /api/recipes` — List recipes
- `GET /api/recipes/:id` — Recipe detail
- `GET /api/recipes/:id/status` — Recipe status (skills, scaffold state)
- `POST /api/recipes/:id/scaffold-team` — Scaffold team from recipe
- `POST /api/recipes/:id/scaffold-agent` — Scaffold agent from recipe
- `POST /api/recipes/:id/install` — Install missing skills

**Bindings**
- `GET /api/bindings` — List bindings
- `POST /api/bindings` — Add binding
- `DELETE /api/bindings` — Remove binding

**Activity & cleanup**
- `GET /api/activity` — Recent activity events
- `GET /api/cleanup/plan` — Plan workspace cleanup
- `POST /api/cleanup/execute` — Execute cleanup (privileged; ensure only authorized users can call when behind a reverse proxy)

**Demo mode** creates real ticket files under `kitchen/demo-data/workspace-demo-team/` on first load.

## Testing (token‑efficient workflow)

To iterate quickly without running coverage each time:

1. **Quick feedback:** Run tests without coverage: `cd kitchen && npm run test` (~20s vs ~95s with coverage).
2. **Single file:** Run only the file you’re editing:  
   `cd kitchen && npm run test -- --run tests/server-api-openclaw.test.ts`
3. **Coverage once:** After batch edits, run:  
   `cd kitchen && npm run coverage:gaps`  
   to validate thresholds and see gaps.

This reduces tool calls and total runtime during development.

## Relationship to the plugin
- The **ClawRecipes plugin** is CLI-first and works without any UI.
- ClawRecipes Kitchen is an optional UI companion for:
  - visibility (activity/search)
  - human review of plans and changes

## Roadmap (high level)
- Recipe browser and scaffold flows
- Team dashboards (backlog/in-progress/testing/done) — **implemented**
- Publishing workflow integration
