import fs from "node:fs/promises";
import path from "node:path";

import { fileExists } from "./fs-utils";
import { ensureLaneDir } from "./lanes";
import { DEFAULT_TICKET_NUMBER } from "./constants";
import { findTicketFile as findTicketFileFromFinder } from "./ticket-finder";
import { parseTicketFilename } from "./ticket-finder";

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

function patchTicketFields(
  md: string,
  opts: { ownerSafe: string; status: string; assignmentRel: string }
): string {
  let out = md;
  if (out.match(/^Owner:\s.*$/m)) out = out.replace(/^Owner:\s.*$/m, `Owner: ${opts.ownerSafe}`);
  else out = out.replace(/^(# .+\n)/, `$1\nOwner: ${opts.ownerSafe}\n`);

  if (out.match(/^Status:\s.*$/m)) out = out.replace(/^Status:\s.*$/m, `Status: ${opts.status}`);
  else out = out.replace(/^(# .+\n)/, `$1\nStatus: ${opts.status}\n`);

  if (out.match(/^Assignment:\s.*$/m)) out = out.replace(/^Assignment:\s.*$/m, `Assignment: ${opts.assignmentRel}`);
  else out = out.replace(/^Owner:.*$/m, (line) => `${line}\nAssignment: ${opts.assignmentRel}`);

  return out;
}

/** Re-export for callers expecting (teamDir, ticketArg) signature. Delegates to ticket-finder. */
export async function findTicketFile(teamDir: string, ticketArgRaw: string) {
  return findTicketFileFromFinder({ teamDir, ticket: ticketArgRaw });
}

export async function takeTicket(opts: { teamDir: string; ticket: string; owner?: string; overwriteAssignment: boolean }) {
  const teamDir = opts.teamDir;
  const owner = (opts.owner ?? 'dev').trim() || 'dev';
  const ownerSafe = owner.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/(^-|-$)/g, '') || 'dev';

  const srcPath = await findTicketFile(teamDir, opts.ticket);
  if (!srcPath) throw new Error(`Ticket not found: ${opts.ticket}`);
  if (srcPath.includes(`${path.sep}work${path.sep}done${path.sep}`)) throw new Error('Cannot take a done ticket (already completed)');

  const inProgressDir = (await ensureLaneDir({ teamDir, lane: 'in-progress', command: 'openclaw recipes take' })).path;

  const filename = path.basename(srcPath);
  const destPath = path.join(inProgressDir, filename);

  const parsed = parseTicketFilename(filename) ?? { ticketNumStr: opts.ticket.match(/^\d{4}$/) ? opts.ticket : DEFAULT_TICKET_NUMBER, slug: "ticket" };
  const { ticketNumStr, slug } = parsed;

  const assignmentsDir = path.join(teamDir, 'work', 'assignments');
  await ensureDir(assignmentsDir);
  const assignmentPath = path.join(assignmentsDir, `${ticketNumStr}-assigned-${ownerSafe}.md`);
  const assignmentRel = path.relative(teamDir, assignmentPath);

  const alreadyInProgress = srcPath === destPath;

  const md = await fs.readFile(srcPath, 'utf8');
  const nextMd = patchTicketFields(md, { ownerSafe, status: 'in-progress', assignmentRel });
  await fs.writeFile(srcPath, nextMd, 'utf8');

  if (!alreadyInProgress) {
    await fs.rename(srcPath, destPath);
  }

  const assignmentMd = `# Assignment — ${ticketNumStr}-${slug}\n\nAssigned: ${ownerSafe}\n\n## Ticket\n${path.relative(teamDir, destPath)}\n\n## Notes\n- Created by: openclaw recipes take\n`;

  const assignmentExists = await fileExists(assignmentPath);
  if (assignmentExists && !opts.overwriteAssignment) {
    // createOnly
  } else {
    await fs.writeFile(assignmentPath, assignmentMd, 'utf8');
  }

  return { srcPath, destPath, moved: !alreadyInProgress, assignmentPath };
}

export async function handoffTicket(opts: { teamDir: string; ticket: string; tester?: string; overwriteAssignment: boolean }) {
  const teamDir = opts.teamDir;
  const tester = (opts.tester ?? 'test').trim() || 'test';
  const testerSafe = tester.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/(^-|-$)/g, '') || 'test';

  const srcPath = await findTicketFile(teamDir, opts.ticket);
  if (!srcPath) throw new Error(`Ticket not found: ${opts.ticket}`);
  if (srcPath.includes(`${path.sep}work${path.sep}done${path.sep}`)) throw new Error('Cannot handoff a done ticket (already completed)');

  const testingDir = (await ensureLaneDir({ teamDir, lane: 'testing', command: 'openclaw recipes handoff' })).path;

  const filename = path.basename(srcPath);
  const destPath = path.join(testingDir, filename);

  const parsed = parseTicketFilename(filename) ?? { ticketNumStr: opts.ticket.match(/^\d{4}$/) ? opts.ticket : DEFAULT_TICKET_NUMBER, slug: "ticket" };
  const { ticketNumStr, slug } = parsed;

  const assignmentsDir = path.join(teamDir, 'work', 'assignments');
  await ensureDir(assignmentsDir);
  const assignmentPath = path.join(assignmentsDir, `${ticketNumStr}-assigned-${testerSafe}.md`);
  const assignmentRel = path.relative(teamDir, assignmentPath);

  const alreadyInTesting = srcPath === destPath;

  const md = await fs.readFile(srcPath, 'utf8');
  const nextMd = patchTicketFields(md, { ownerSafe: testerSafe, status: 'testing', assignmentRel });
  await fs.writeFile(srcPath, nextMd, 'utf8');

  if (!alreadyInTesting) {
    await fs.rename(srcPath, destPath);
  }

  const assignmentMd = `# Assignment — ${ticketNumStr}-${slug}\n\nAssigned: ${testerSafe}\n\n## Ticket\n${path.relative(teamDir, destPath)}\n\n## Notes\n- Created by: openclaw recipes handoff\n`;

  const assignmentExists = await fileExists(assignmentPath);
  if (assignmentExists && !opts.overwriteAssignment) {
    // createOnly: leave as-is
  } else {
    await fs.writeFile(assignmentPath, assignmentMd, 'utf8');
  }

  return { srcPath, destPath, moved: !alreadyInTesting, assignmentPath };
}
