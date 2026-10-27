#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import YAML from "yaml";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const opsRoot = path.resolve(process.argv[2] ?? "/home/control/.openclaw/workspace-development-team");
const outputPath = path.resolve(process.argv[3] ?? path.join(repoRoot, "recipes/default/development-team.md"));

const activeAssets = [
  "AGENTS.md",
  "config/openclaw-disk-guard.json",
  "config/pr-ready-telegram.json",
  "notes/runbooks/albert-runtime-release.md",
  "notes/runbooks/openclaw-controller-low-space.md",
  "notes/runbooks/pr-ready-telegram-alerts.md",
  "notes/runbooks/release-deployment.md",
  "notes/runbooks/worktree-retention.md",
  "scripts/albert-release-adapter.py",
  "scripts/albert-runtime-release-adapter.py",
  "scripts/backup-work.sh",
  "scripts/closeout-snapshot.py",
  "scripts/lead-merge-pr.py",
  "scripts/merge-email-notify.py",
  "scripts/mock-outbound-server.mjs",
  "scripts/openclaw-disk-guard.py",
  "scripts/pr-ready-telegram-notify.py",
  "scripts/pr-state-sync.py",
  "scripts/pr-watcher-dedupe.py",
  "scripts/release-deploy.py",
  "scripts/team-root.sh",
  "scripts/test-albert-release-adapter.py",
  "scripts/test-albert-runtime-release-adapter.py",
  "scripts/test-openclaw-disk-guard.py",
  "scripts/test-pr-ready-telegram-notify.py",
  "scripts/test-pr-watcher-dedupe.sh",
  "scripts/test-release-deploy.py",
  "scripts/test-ticket-pipeline.py",
  "scripts/test-worktree-retention.py",
  "scripts/ticket-hygiene-dev.sh",
  "scripts/ticket-hygiene.sh",
  "scripts/ticket-transition.py",
  "scripts/worktree-retention.py",
  "shared-context/delivery-closeout.json",
  "shared-context/deployment-adapters.json",
  "shared-context/RELEASE_DEPLOYMENT.md",
  "shared-context/ticket-flow.json",
  "shared-context/WORKFLOW_RULES.md",
];

const roles = ["lead", "dev", "dev-2", "devops", "test", "workflow-runner"];
const roleSource = { "dev-2": "dev" };
const ticketsTemplate = fs.readFileSync(path.join(opsRoot, "TICKETS.md"), "utf8")
  .replaceAll("dev/devops", "dev/dev-2/devops")
  .replaceAll("lead|dev|devops|test", "lead|dev|dev-2|devops|test");

const templates = {
  tickets: ticketsTemplate,
  "role.soul": "# SOUL.md\n\nYou are a member of {{teamId}}. Follow AGENTS.md and HEARTBEAT.md.\n",
  "role.tools": "# TOOLS.md\n\nRole-local environment notes.\n",
  "role.status": "# STATUS.md\n\n- (empty)\n",
  "role.notes": "# NOTES.md\n\n- (empty)\n",
};

for (const role of roles) {
  const sourceRole = roleSource[role] ?? role;
  for (const filename of ["AGENTS.md", "HEARTBEAT.md"]) {
    const source = path.join(opsRoot, "roles", sourceRole, filename);
    let content;
    if (fs.existsSync(source)) {
      content = fs.readFileSync(source, "utf8");
    } else {
      content = "# HEARTBEAT — {{teamId}} " + role + "\n\nNo autonomous loop is configured for this role.\n";
    }
    content = content
      .replaceAll("development-team", "{{teamId}}")
      .replaceAll("Dev and DevOps", "Dev 1, Dev 2, and DevOps")
      .replaceAll("lead/dev/devops/test", "lead/dev/dev-2/devops/test");
    if (role === "dev-2") {
      content = content
        .replaceAll("{{teamId}} dev", "{{teamId}} dev-2")
        .replaceAll("dev-owned", "dev-2-owned")
        .replaceAll("assigned to \`dev\`", "assigned to \`dev-2\`")
        .replaceAll("notes for dev (", "notes for dev-2 (");
    }
    templates[role + "." + filename.toLowerCase().replace(".md", "")] = content;
  }
  templates[role + ".soul"] = templates["role.soul"];
  templates[role + ".tools"] = templates["role.tools"];
  templates[role + ".status"] = templates["role.status"];
  templates[role + ".notes"] = templates["role.notes"];
}

templates["team.memory_policy"] = "# Memory Policy\n\nQuick link: see `shared-context/MEMORY_PLAN.md` for the canonical map.\n\nTickets are the source of truth. Role memory is continuity only; record decisions and material state changes in the ticket first.\n";
templates["sharedContext.memoryPlan"] = "# Memory Plan\n\n- Ticket: authoritative work record\n- notes/status.md: append-only state changes\n- roles/<role>/memory/: role continuity\n- shared-context/memory/: curated team knowledge\n";
templates["team.plan"] = "# Plan\n\n- (lead-curated)\n";
templates["team.status"] = "# Status\n\n- (append-only)\n";
templates["team.priorities"] = "# Priorities\n\n- (lead-curated)\n";
templates["team.agent_outputs"] = "# Agent Outputs\n\nAppend-only shared artifacts and logs.\n";
templates["team.qa_access"] = "# QA Access\n\nDocument non-secret test URLs and setup here. Never commit credentials.\n";

const files = [
  { path: "SOUL.md", template: "soul", mode: "createOnly" },
  { path: "AGENTS.md", template: "agents", mode: "overwrite" },
  { path: "HEARTBEAT.md", template: "heartbeat", mode: "overwrite" },
  { path: "TOOLS.md", template: "tools", mode: "createOnly" },
  { path: "STATUS.md", template: "status", mode: "createOnly" },
  { path: "NOTES.md", template: "notes", mode: "createOnly" },
  { path: "notes/memory-policy.md", template: "team.memory_policy", scope: "team", mode: "overwrite" },
  { path: "notes/QA_ACCESS.md", template: "team.qa_access", scope: "team", mode: "overwrite" },
  { path: "notes/plan.md", template: "team.plan", scope: "team", mode: "createOnly" },
  { path: "notes/status.md", template: "team.status", scope: "team", mode: "createOnly" },
  { path: "shared-context/MEMORY_PLAN.md", template: "sharedContext.memoryPlan", scope: "team", mode: "overwrite" },
  { path: "shared-context/priorities.md", template: "team.priorities", scope: "team", mode: "createOnly" },
  { path: "shared-context/agent-outputs/README.md", template: "team.agent_outputs", scope: "team", mode: "overwrite" },
];

for (const asset of activeAssets) {
  const templateKey = "team." + asset.replaceAll(/[^A-Za-z0-9]+/g, "_");
  let content = fs.readFileSync(path.join(opsRoot, asset), "utf8");
  content = content.replaceAll(opsRoot, "{{teamDir}}");
  if (asset === "config/pr-ready-telegram.json") {
    const config = JSON.parse(content);
    config.route.accountId = "<configure-account-id>";
    content = JSON.stringify(config, null, 2) + "\n";
  }
  if (asset === "shared-context/delivery-closeout.json") {
    const config = JSON.parse(content);
    config["operational-no-pr"].authoritativeRoots = ["{{teamDir}}"];
    config["operational-no-pr"].tickets = {};
    if (config["scope-parent"]) config["scope-parent"].tickets = {};
    if (config["legacy-roadmap-parent"]) config["legacy-roadmap-parent"].tickets = {};
    content = JSON.stringify(config, null, 2) + "\n";
  }
  templates[templateKey] = content;
  files.push({ path: asset, template: templateKey, scope: "team", mode: "overwrite" });
}

const agentTools = {
  profile: "coding",
  allow: ["group:fs", "group:web", "group:runtime", "group:automation"],
  deny: [],
};
const testTools = {
  profile: "coding",
  allow: ["group:fs", "group:web", "group:runtime"],
  deny: [],
};

const frontmatter = {
  id: "development-team",
  name: "Development Team",
  version: "0.3.0",
  description: "A file-first engineering team with two parallel Dev workers, independent QA, gated PR review/merge, release verification, and reproducible operations.",
  kind: "team",
  cronJobs: [
    {
      id: "lead-triage-loop",
      name: "Dev-team lead triage loop",
      schedule: "0,10,20,30,40,50 * * * *",
      timezone: "America/New_York",
      agentId: "{{teamId}}-lead",
      timeoutSeconds: 900,
      delivery: "none",
      message: "Read HEARTBEAT.md and execute its development-team Lead checklist now. The file-first board is authoritative. Use the locked transition command for every lane/owner change. Test owns focused PR creation after independent QA PASS. Lead reviews and merges only through lead-merge-pr.py after exact-head, scope, conflict, and green-check gates pass; rerun PR sync so the mandatory deduplicated merge email is sent and the ticket closes. Record only material state changes. If there is no actionable work, finish cleanly.",
      enabledByDefault: true,
    },
    {
      id: "dev-work-loop",
      name: "Dev-team dev work loop",
      schedule: "2,12,22,32,42,52 * * * *",
      timezone: "America/New_York",
      agentId: "{{teamId}}-dev",
      timeoutSeconds: 1800,
      delivery: "none",
      message: "Read HEARTBEAT.md and execute its development-team Dev checklist now. The file-first board is authoritative. Continue one actionable in-progress ticket before pulling backlog, use the locked transition command to hand completed work to work/testing with Owner: test, and record only material state changes. Test owns focused PR creation after independent QA PASS; Lead owns gated review and merge. If there is no actionable work, finish cleanly.",
      enabledByDefault: true,
    },
    {
      id: "dev-2-work-loop",
      name: "Dev-team dev 2 work loop",
      schedule: "8,18,28,38,48,58 * * * *",
      timezone: "America/New_York",
      agentId: "{{teamId}}-dev-2",
      timeoutSeconds: 1800,
      delivery: "none",
      message: "Read HEARTBEAT.md and execute its development-team Dev 2 checklist now. The file-first board is authoritative. Continue one actionable dev-2-owned in-progress ticket before pulling backlog, use the locked transition command to hand completed work to work/testing with Owner: test, and record only material state changes. Test owns focused PR creation after independent QA PASS; Lead owns gated review and merge. If there is no actionable work, finish cleanly.",
      enabledByDefault: true,
    },
    {
      id: "devops-work-loop",
      name: "Dev-team devops work loop",
      schedule: "4,14,24,34,44,54 * * * *",
      timezone: "America/New_York",
      agentId: "{{teamId}}-devops",
      timeoutSeconds: 1200,
      delivery: "none",
      message: "Read HEARTBEAT.md and execute its development-team DevOps checklist now. The file-first board is authoritative. Continue one actionable ticket, skip date-gated or externally blocked work without noisy comments, use the locked transition command to hand completed work to work/testing with Owner: test, and record only material state changes. Test owns focused PR creation after independent QA PASS; Lead owns gated review and merge. If there is no actionable work, finish cleanly.",
      enabledByDefault: true,
    },
    {
      id: "test-work-loop",
      name: "Dev-team test work loop",
      schedule: "6,16,26,36,46,56 * * * *",
      timezone: "America/New_York",
      agentId: "{{teamId}}-test",
      timeoutSeconds: 1200,
      delivery: "none",
      message: "Read HEARTBEAT.md and execute its development-team Test checklist now. Independently verify the lowest-numbered test-owned ticket at its exact candidate head. Only after QA PASS, create or update one focused non-duplicate PR, record its URL/head, and hand the ticket to Lead via the locked transition command. Never merge a PR; Lead owns gated review and merge. Record only material state changes. If there is no actionable work, finish cleanly.",
      enabledByDefault: true,
    },
    {
      id: "backup-work",
      name: "Backup dev-team tickets (every 24h)",
      schedule: "0 0 * * *",
      timezone: "UTC",
      command: "{{teamDir}}/scripts/backup-work.sh",
      commandCwd: "{{teamDir}}",
      timeoutSeconds: 120,
      delivery: "none",
      enabledByDefault: true,
    },
  ],
  requiredSkills: [],
  team: { teamId: "development-team" },
  agents: [
    { role: "lead", name: "Dev Team Lead", tools: agentTools },
    { role: "dev", name: "Software Engineer 1", tools: agentTools },
    { role: "dev-2", name: "Software Engineer 2", tools: agentTools },
    { role: "devops", name: "DevOps / SRE", tools: agentTools },
    { role: "test", name: "QA / Tester", tools: testTools },
    { role: "workflow-runner", name: "Workflow Runner", tools: agentTools },
  ],
  templates,
  files,
  tools: agentTools,
};

const body = `# Development Team Recipe

Scaffolds the current development-team operating model:

- Lead, Dev 1, Dev 2, DevOps, Test, and workflow-runner agents with isolated role workspaces.
- 24/7 ten-minute role loops staggered at minute offsets 0/2/4/6/8.
- One actionable ticket per implementation worker, with atomic board locking and worker-specific ownership.
- Dev/DevOps implement; Test independently verifies and creates the focused PR; Lead reviews and may merge only repositories explicitly authorized by policy.
- Changed-state-only PR synchronization, mandatory deduplicated notifications, guarded deployments, and verified closeout.
- Daily command-based ticket backup plus the active operational scripts, tests, configs, and runbooks.

## Files

The recipe embeds the active role instructions, team scripts, tests, JSON policy/configuration, and operational runbooks. Team-scoped files are written once at the team root; role files are rendered into each isolated role workspace.

## Tooling

All roles use the coding profile. Lead, Dev 1, Dev 2, DevOps, and workflow-runner receive filesystem, web, runtime, and automation groups; Test receives filesystem, web, and runtime groups. Cron delivery is silent unless an operational script explicitly sends a deduplicated notification.

The generated recipe intentionally resets ticket-specific closeout state and replaces the Telegram account ID with a configuration placeholder. No credentials are embedded.
`;

const output = "---\n" + YAML.stringify(frontmatter, { lineWidth: 0 }) + "---\n" + body;
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log(outputPath);
