# Bundled recipes

ClawRecipes ships with a few recipes in `recipes/default/`.

You can:
- list them: `openclaw recipes list`
- inspect them: `openclaw recipes show <id>`

Below is a guided explanation of what each bundled recipe does.

## 1) `project-manager` (agent)
**Kind:** agent

**Use when:** you want a lightweight agent that keeps plans tidy and maintains a cadence.

Scaffold:
```bash
openclaw recipes scaffold project-manager --agent-id pm --name "Project Manager" --apply-config
```

What it writes:
- `agents/pm/SOUL.md`
- `agents/pm/AGENTS.md`

Default tool policy (recipe-defined):
- allows: `group:fs`, `group:web`, plus `cron` and `message`
- denies: `exec`

## 2) `social-team` (team)
**Kind:** team

**Use when:** you want platform-specialist social execution (not copywriting): distribution + listening + platform SEO + community + reporting back to marketing.

Scaffold:
```bash
openclaw recipes scaffold-team social-team --team-id social-team-team --apply-config
```

What it creates:
- shared team workspace
- agents:
  - `lead`
  - `research`
  - `listening`
  - `social-seo`
  - `editorial`
  - `community`
  - `distributor`
  - platform roles: `tiktok`, `instagram`, `youtube`, `facebook`, plus defaults `x`, `linkedin`

Notes:
- Copy + creative live in `marketing-team` (not here).
- Default `tools` in the recipe deny `exec` (safer by default).

## 3) `development-team` (team)
**Kind:** team

**Use when:** you want a small engineering team with a file-first ticket queue.

Scaffold:
```bash
openclaw recipes scaffold-team development-team --team-id development-team-team --apply-config
```

What it creates:
- `teams/development-team-team/` shared workspace
- agents:
  - `agents/development-team-team-lead/`
  - `agents/development-team-team-dev/`
  - `agents/development-team-team-devops/`

Special features:
- A strict ticket workflow documented in the lead’s `AGENTS.md`.
- Recommended ticket naming: `0001-...md`, `0002-...md`, etc.
- Tool policies intended for real work:
  - lead: includes runtime + automation
  - dev: includes runtime
  - devops: includes runtime + automation

## 4) `research-team` (team)
**Kind:** team

**Use when:** you need repeatable, citations-first research output.

Scaffold:
```bash
openclaw recipes scaffold-team research-team --team-id research-team-team --apply-config
```

What it creates:
- shared team workspace with conventional research folders:
  - `work/sources/`, `work/notes/`, `work/briefs/`
- agents:
  - lead (dispatch + quality bar)
  - researcher (web sourcing + notes)
  - fact-checker (verification)
  - summarizer (brief writing)

Default tool policy:
- allows web access + file operations
- denies `exec` (safe-by-default)

## 5) `writing-team` (team)
**Kind:** team

**Use when:** you want a writing pipeline from brief → outline → draft → edit.

Scaffold:
```bash
openclaw recipes scaffold-team writing-team --team-id writing-team-team --apply-config
```

What it creates:
- shared team workspace with writing pipeline folders:
  - `work/briefs/`, `work/outlines/`, `work/drafts/`, `work/edited/`
- agents:
  - lead
  - outliner
  - writer
  - editor

Default tool policy:
- allows web access + file operations
- denies `exec` (safe-by-default)

## 6) `customer-support-team` (team)
**Kind:** team

**Use when:** you want a repeatable support workflow: triage → resolution → KB.

Scaffold:
```bash
openclaw recipes scaffold-team customer-support-team --team-id customer-support-team-team --apply-config
```

What it creates:
- shared workspace conventions:
  - `work/cases/`, `work/replies/`, `work/kb/`
- agents:
  - lead, triage, resolver, kb-writer

Default tool policy:
- allows web access + file operations
- denies `exec` (safe-by-default)

## 7) `product-team` (team)
**Kind:** team

**Use when:** you want a PRD → design → build → QA delivery loop.

Scaffold:
```bash
openclaw recipes scaffold-team product-team --team-id product-team-team --apply-config
```

Notes:
- The `engineer` role allows `group:runtime` and does **not** deny `exec` so it can run local tooling.

## 8) `researcher` (agent)
**Kind:** agent

**Use when:** you want a single, citations-first research agent.

Scaffold:
```bash
openclaw recipes scaffold researcher --agent-id researcher --apply-config
```

Default tool policy:
- allows web access + file operations
- denies `exec`

## 9) `editor` (agent)
**Kind:** agent

**Use when:** you want a single editing agent.

Scaffold:
```bash
openclaw recipes scaffold editor --agent-id editor --apply-config
```

Default tool policy:
- allows web access + file operations
- denies `exec`

## 10) `developer` (agent)
**Kind:** agent

**Use when:** you want a single developer agent with runtime tooling.

Scaffold:
```bash
openclaw recipes scaffold developer --agent-id dev --apply-config
```

Default tool policy:
- allows `group:runtime`
- does not deny `exec`

---

# Teams

## 11) `marketing-team` (team)
**Use when:** you want a full marketing execution loop: SEO + copy + ads + social + design + analytics.

Scaffold:
```bash
openclaw recipes scaffold-team marketing-team --team-id marketing-team-team --apply-config
```

Roles:
- lead, seo, copywriter, ads, social, designer, analyst, video, compliance

---

# Vertical packs (bundled team recipes)

## 12) `business-team` (team)
**Use when:** you want a general-purpose business execution team.

Scaffold:
```bash
openclaw recipes scaffold-team business-team --team-id business-team-team --apply-config
```

Roles:
- lead, ops, sales, marketing, finance, analyst

## 13) `law-firm-team` (team)
**Use when:** you want a legal practice workflow: intake → research → drafting → compliance.

Scaffold:
```bash
openclaw recipes scaffold-team law-firm-team --team-id law-firm-team-team --apply-config
```

Roles:
- lead, intake, researcher, drafter, compliance, ops

## 14) `clinic-team` (team)
**Use when:** you want a clinic ops workflow: intake/scheduling/billing/compliance/patient education.

Scaffold:
```bash
openclaw recipes scaffold-team clinic-team --team-id clinic-team-team --apply-config
```

Roles:
- lead, intake, scheduler, billing, compliance, educator

## 15) `construction-team` (team)
**Use when:** you want a construction delivery workflow: PM/estimation/scheduling/safety/procurement.

Scaffold:
```bash
openclaw recipes scaffold-team construction-team --team-id construction-team-team --apply-config
```

Roles:
- lead, pm, estimator, scheduler, safety, procurement

## 16) `financial-planner-team` (team)
**Use when:** you want a financial planning practice workflow.

Scaffold:
```bash
openclaw recipes scaffold-team financial-planner-team --team-id financial-planner-team-team --apply-config
```

Roles:
- lead, advisor, analyst, tax, insurance, ops

## 17) `stock-trader-team` (team)
**Use when:** you want a trading workflow: research/signals/risk/journaling.

Scaffold:
```bash
openclaw recipes scaffold-team stock-trader-team --team-id stock-trader-team-team --apply-config
```

Roles:
- lead, researcher, signals, risk, journal, ops

## 18) `crypto-trader-team` (team)
**Use when:** you want a crypto trading workflow with onchain research.

Scaffold:
```bash
openclaw recipes scaffold-team crypto-trader-team --team-id crypto-trader-team-team --apply-config
```

Roles:
- lead, onchain, news, risk, ops, journal

## Copying and modifying bundled recipes
A good workflow is:
1) Inspect:
```bash
openclaw recipes show development-team > /tmp/development-team.md
```

2) Copy into your workspace recipes folder:
```bash
cp /tmp/development-team.md ~/.openclaw/workspace/recipes/my-dev-team.md
```

3) Edit the new recipe file and scaffold it.
