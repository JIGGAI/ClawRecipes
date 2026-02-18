import path from "node:path";
import fs from "node:fs/promises";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { ensureDir, fileExists, writeFileSafely } from "../lib/fs-utils";
import { findTicketFile, handoffTicket, takeTicket } from "../lib/ticket-workflow";
import { ticketStageDir } from "../lib/lanes";
import { computeNextTicketNumber, TICKET_FILENAME_REGEX } from "../lib/ticket-finder";
import { resolveTeamContext } from "../lib/workspace";
import { DEFAULT_TICKET_NUMBER, VALID_ROLES, VALID_STAGES } from "../lib/constants";

export function patchTicketField(md: string, key: string, value: string): string {
  const lineRe = new RegExp(`^${key}:\\s.*$`, "m");
  if (md.match(lineRe)) return md.replace(lineRe, `${key}: ${value}`);
  return md.replace(/^(# .+\n)/, `$1\n${key}: ${value}\n`);
}

export function patchTicketOwner(md: string, owner: string): string {
  return patchTicketField(md, "Owner", owner);
}

export function patchTicketStatus(md: string, status: string): string {
  return patchTicketField(md, "Status", status);
}

type TicketRow = { stage: "backlog" | "in-progress" | "testing" | "done"; number: number | null; id: string; file: string };

/**
 * List tickets for a team (backlog, in-progress, testing, done).
 * @param api - OpenClaw plugin API
 * @param options - teamId
 * @returns Grouped tickets by stage
 */
export async function handleTickets(api: OpenClawPluginApi, options: { teamId: string }) {
  const teamId = String(options.teamId);
  const { teamDir } = await resolveTeamContext(api, teamId);
  const dirs = {
    backlog: ticketStageDir(teamDir, "backlog"),
    inProgress: ticketStageDir(teamDir, "in-progress"),
    testing: ticketStageDir(teamDir, "testing"),
    done: ticketStageDir(teamDir, "done"),
  } as const;
  const readTickets = async (dir: string, stage: "backlog" | "in-progress" | "testing" | "done") => {
    if (!(await fileExists(dir))) return [] as TicketRow[];
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".md")).sort();
    return files.map((f) => {
      const m = f.match(TICKET_FILENAME_REGEX);
      return {
        stage,
        number: m ? Number(m[1]) : null,
        id: m ? `${m[1]}-${m[2]}` : f.replace(/\.md$/, ""),
        file: path.join(dir, f),
      };
    });
  };
  const backlog = await readTickets(dirs.backlog, "backlog");
  const inProgress = await readTickets(dirs.inProgress, "in-progress");
  const testing = await readTickets(dirs.testing, "testing");
  const done = await readTickets(dirs.done, "done");
  return {
    teamId,
    tickets: [...backlog, ...inProgress, ...testing, ...done],
    backlog,
    inProgress,
    testing,
    done,
  };
}

/**
 * Move a ticket between backlog/in-progress/testing/done.
 * @param api - OpenClaw plugin API
 * @param options - teamId, ticket, to stage, optional completed, dryRun
 * @returns Plan (dryRun) or result with from/to paths
 */
export async function handleMoveTicket(
  api: OpenClawPluginApi,
  options: { teamId: string; ticket: string; to: string; completed?: boolean; dryRun?: boolean },
) {
  const teamId = String(options.teamId);
  const { teamDir } = await resolveTeamContext(api, teamId);
  const dest = String(options.to);
  if (!(VALID_STAGES as readonly string[]).includes(dest)) {
    throw new Error("--to must be one of: backlog, in-progress, testing, done");
  }
  const srcPath = await findTicketFile(teamDir, options.ticket);
  if (!srcPath) throw new Error(`Ticket not found: ${options.ticket}`);
  const destDir = ticketStageDir(teamDir, dest as "backlog" | "in-progress" | "testing" | "done");
  await ensureDir(destDir);
  const filename = path.basename(srcPath);
  const destPath = path.join(destDir, filename);
  const plan = { from: srcPath, to: destPath };
  if (options.dryRun) return { ok: true as const, plan };
  const patchStatus = (md: string) => {
    const nextStatus =
      dest === "backlog" ? "queued" : dest === "in-progress" ? "in-progress" : dest === "testing" ? "testing" : "done";
    let out = md;
    if (out.match(/^Status:\s.*$/m)) out = out.replace(/^Status:\s.*$/m, `Status: ${nextStatus}`);
    else out = out.replace(/^(# .+\n)/, `$1\nStatus: ${nextStatus}\n`);
    if (dest === "done" && options.completed) {
      const completed = new Date().toISOString();
      if (out.match(/^Completed:\s.*$/m)) out = out.replace(/^Completed:\s.*$/m, `Completed: ${completed}`);
      else out = out.replace(/^Status:.*$/m, (m) => `${m}\nCompleted: ${completed}`);
    }
    return out;
  };
  const md = await fs.readFile(srcPath, "utf8");
  const patched = patchStatus(md);
  await fs.writeFile(srcPath, patched, "utf8");
  if (srcPath !== destPath) await fs.rename(srcPath, destPath);
  return { ok: true, from: srcPath, to: destPath };
}

/**
 * Assign a ticket to an owner (writes assignment stub + updates Owner:).
 * @param api - OpenClaw plugin API
 * @param options - teamId, ticket, owner, optional overwrite, dryRun
 * @returns Plan (dryRun) or ok with plan
 */
export async function handleAssign(
  api: OpenClawPluginApi,
  options: { teamId: string; ticket: string; owner: string; overwrite?: boolean; dryRun?: boolean },
) {
  const teamId = String(options.teamId);
  const { teamDir } = await resolveTeamContext(api, teamId);
  const owner = String(options.owner);
  if (!(VALID_ROLES as readonly string[]).includes(owner)) {
    throw new Error("--owner must be one of: dev, devops, lead, test");
  }
  const ticketPath = await findTicketFile(teamDir, options.ticket);
  if (!ticketPath) throw new Error(`Ticket not found: ${options.ticket}`);
  const filename = path.basename(ticketPath);
  const m = filename.match(TICKET_FILENAME_REGEX);
  const ticketNumStr = m?.[1] ?? DEFAULT_TICKET_NUMBER;
  const slug = m?.[2] ?? (options.ticket.replace(/^\d{4}-?/, "") || "ticket");
  const assignmentsDir = ticketStageDir(teamDir, "assignments");
  await ensureDir(assignmentsDir);
  const assignmentPath = path.join(assignmentsDir, `${ticketNumStr}-assigned-${owner}.md`);
  const plan = { ticketPath, assignmentPath, owner };
  if (options.dryRun) return { ok: true, plan };
  const patchOwner = (md: string) => {
    if (md.match(/^Owner:\s.*$/m)) return md.replace(/^Owner:\s.*$/m, `Owner: ${owner}`);
    return md.replace(/^(# .+\n)/, `$1\nOwner: ${owner}\n`);
  };
  const md = await fs.readFile(ticketPath, "utf8");
  const nextMd = patchOwner(md);
  await fs.writeFile(ticketPath, nextMd, "utf8");
  const assignmentMd = `# Assignment — ${ticketNumStr}-${slug}\n\nAssigned: ${owner}\n\n## Ticket\n${path.relative(teamDir, ticketPath)}\n\n## Notes\n- Created by: openclaw recipes assign\n`;
  await writeFileSafely(assignmentPath, assignmentMd, options.overwrite ? "overwrite" : "createOnly");
  return { ok: true, plan };
}

async function dryRunTicketMove(
  teamDir: string,
  ticket: string,
  lane: "in-progress" | "testing"
): Promise<{ from: string; to: string }> {
  const srcPath = await findTicketFile(teamDir, ticket);
  if (!srcPath) throw new Error(`Ticket not found: ${ticket}`);
  const filename = path.basename(srcPath);
  const destPath = path.join(ticketStageDir(teamDir, lane), filename);
  return { from: srcPath, to: destPath };
}

async function resolveTeamAndValidateRole(
  api: OpenClawPluginApi,
  teamId: string,
  role: string,
  optionName: string
): Promise<{ teamDir: string }> {
  const { teamDir } = await resolveTeamContext(api, teamId);
  if (!(VALID_ROLES as readonly string[]).includes(role)) {
    throw new Error(`--${optionName} must be one of: dev, devops, lead, test`);
  }
  return { teamDir };
}

/**
 * Assign ticket to owner and move to in-progress.
 * @param api - OpenClaw plugin API
 * @param options - teamId, ticket, optional owner, overwrite, dryRun
 * @returns Plan (dryRun) or result with paths and assignment
 */
export async function handleTake(
  api: OpenClawPluginApi,
  options: { teamId: string; ticket: string; owner?: string; overwrite?: boolean; dryRun?: boolean },
) {
  const teamId = String(options.teamId);
  const owner = String(options.owner ?? "dev");
  const { teamDir } = await resolveTeamAndValidateRole(api, teamId, owner, "owner");
  if (options.dryRun) {
    const plan = await dryRunTicketMove(teamDir, options.ticket, "in-progress");
    return { plan: { ...plan, owner } };
  }
  return takeTicket({
    teamDir,
    ticket: options.ticket,
    owner,
    overwriteAssignment: !!options.overwrite,
  });
}

/**
 * Move ticket to testing and assign to tester (QA handoff).
 * @param api - OpenClaw plugin API
 * @param options - teamId, ticket, optional tester, overwrite, dryRun
 * @returns Plan (dryRun) or result with paths and assignment
 */
export async function handleHandoff(
  api: OpenClawPluginApi,
  options: { teamId: string; ticket: string; tester?: string; overwrite?: boolean; dryRun?: boolean },
) {
  const teamId = String(options.teamId);
  const tester = String(options.tester ?? "test");
  const { teamDir } = await resolveTeamAndValidateRole(api, teamId, tester, "tester");
  if (options.dryRun) {
    const plan = await dryRunTicketMove(teamDir, options.ticket, "testing");
    return {
      plan: { ...plan, tester, note: plan.from.includes("testing") ? "already-in-testing" : "move-to-testing" },
    };
  }
  return handoffTicket({
    teamDir,
    ticket: options.ticket,
    tester,
    overwriteAssignment: !!options.overwrite,
  });
}

/**
 * Turn a request into inbox + backlog ticket(s) + assignment stubs.
 * @param api - OpenClaw plugin API
 * @param options - teamId, requestText, optional owner, dryRun
 * @returns Plan (dryRun) or result with wrote paths and nudgeQueued
 */
export async function handleDispatch(
  api: OpenClawPluginApi,
  options: { teamId: string; requestText: string; owner?: string; dryRun?: boolean },
) {
  const teamId = String(options.teamId);
  const { teamDir } = await resolveTeamContext(api, teamId);
  const owner = String(options.owner ?? "dev");
  if (!(VALID_ROLES as readonly string[]).includes(owner)) {
    throw new Error("--owner must be one of: dev, devops, lead, test");
  }
  const requestText = options.requestText.trim();
  if (!requestText) throw new Error("Request cannot be empty");
  const inboxDir = path.join(teamDir, "inbox");
  const backlogDir = ticketStageDir(teamDir, "backlog");
  const assignmentsDir = ticketStageDir(teamDir, "assignments");
  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "request";
  const nowKey = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  };
  const ticketNum = await computeNextTicketNumber(teamDir);
  const ticketNumStr = String(ticketNum).padStart(4, "0");
  const title = requestText.length > 80 ? requestText.slice(0, 77) + "…" : requestText;
  const baseSlug = slugify(title);
  const inboxPath = path.join(inboxDir, `${nowKey()}-${baseSlug}.md`);
  const ticketPath = path.join(backlogDir, `${ticketNumStr}-${baseSlug}.md`);
  const assignmentPath = path.join(assignmentsDir, `${ticketNumStr}-assigned-${owner}.md`);
  const receivedIso = new Date().toISOString();
  const inboxMd = `# Inbox — ${teamId}\n\nReceived: ${receivedIso}\n\n## Request\n${requestText}\n\n## Proposed work\n- Ticket: ${ticketNumStr}-${baseSlug}\n- Owner: ${owner}\n\n## Links\n- Ticket: ${path.relative(teamDir, ticketPath)}\n- Assignment: ${path.relative(teamDir, assignmentPath)}\n`;
  const ticketMd = `# ${ticketNumStr}-${baseSlug}\n\nCreated: ${receivedIso}\nOwner: ${owner}\nStatus: queued\nInbox: ${path.relative(teamDir, inboxPath)}\nAssignment: ${path.relative(teamDir, assignmentPath)}\n\n## Context\n${requestText}\n\n## Requirements\n- (fill in)\n\n## Acceptance criteria\n- (fill in)\n\n## Tasks\n- [ ] (fill in)\n\n## Comments\n- (use this section for @mentions, questions, decisions, and dated replies)\n`;
  const assignmentMd = `# Assignment — ${ticketNumStr}-${baseSlug}\n\nCreated: ${receivedIso}\nAssigned: ${owner}\n\n## Goal\n${title}\n\n## Ticket\n${path.relative(teamDir, ticketPath)}\n\n## Notes\n- Created by: openclaw recipes dispatch\n`;
  const plan = {
    teamId,
    request: requestText,
    files: [
      { path: inboxPath, kind: "inbox", summary: title },
      { path: ticketPath, kind: "backlog-ticket", summary: title },
      { path: assignmentPath, kind: "assignment", summary: owner },
    ],
  };
  if (options.dryRun) return { ok: true as const, plan };
  await ensureDir(inboxDir);
  await ensureDir(backlogDir);
  await ensureDir(assignmentsDir);
  await writeFileSafely(inboxPath, inboxMd, "createOnly");
  await writeFileSafely(ticketPath, ticketMd, "createOnly");
  await writeFileSafely(assignmentPath, assignmentMd, "createOnly");
  let nudgeQueued = false;
  try {
    const leadAgentId = `${teamId}-lead`;
    api.runtime.system.enqueueSystemEvent(
      [
        `Dispatch created new intake for team: ${teamId}`,
        `- Inbox: ${path.relative(teamDir, inboxPath)}`,
        `- Backlog: ${path.relative(teamDir, ticketPath)}`,
        `- Assignment: ${path.relative(teamDir, assignmentPath)}`,
        `Action: please triage/normalize the ticket (fill Requirements/AC/tasks) and move it through the workflow.`,
      ].join("\n"),
      { sessionKey: `agent:${leadAgentId}:main` },
    );
    nudgeQueued = true;
  } catch {
    // Non-critical: enqueueSystemEvent may be unavailable or fail (e.g. in tests, headless).
    // Dispatch still succeeds; nudgeQueued stays false so caller knows the nudge was skipped.
    nudgeQueued = false;
  }
  return { ok: true as const, wrote: plan.files.map((f) => f.path), nudgeQueued };
}
