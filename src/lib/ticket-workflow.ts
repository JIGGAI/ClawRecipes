import fs from "node:fs/promises";
import path from "node:path";

import { ensureLaneDir } from "./lanes";
import { findTicketFile as findTicketFileFromFinder } from "./ticket-finder";

function patchTicketFields(
  md: string,
  opts: { ownerSafe: string; status: string }
): string {
  let out = md;
  if (out.match(/^Owner:\s.*$/m)) out = out.replace(/^Owner:\s.*$/m, `Owner: ${opts.ownerSafe}`);
  else out = out.replace(/^(# .+\n)/, `$1\nOwner: ${opts.ownerSafe}\n`);

  if (out.match(/^Status:\s.*$/m)) out = out.replace(/^Status:\s.*$/m, `Status: ${opts.status}`);
  else out = out.replace(/^(# .+\n)/, `$1\nStatus: ${opts.status}\n`);

  // Assignment stubs are deprecated; do not write/update Assignment: here.
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

  // Previously parsed filename for assignment-stub ids; no longer needed.

  const alreadyInProgress = srcPath === destPath;

  const md = await fs.readFile(srcPath, 'utf8');
  const nextMd = patchTicketFields(md, { ownerSafe, status: 'in-progress' });
  await fs.writeFile(srcPath, nextMd, 'utf8');

  if (!alreadyInProgress) {
    await fs.rename(srcPath, destPath);
  }

  // Assignment stubs are deprecated; do not create/update work/assignments/*.md.
  return { srcPath, destPath, moved: !alreadyInProgress };
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

  // Previously parsed filename for assignment-stub ids; no longer needed.

  const alreadyInTesting = srcPath === destPath;

  const md = await fs.readFile(srcPath, 'utf8');
  const nextMd = patchTicketFields(md, { ownerSafe: testerSafe, status: 'testing' });
  await fs.writeFile(srcPath, nextMd, 'utf8');

  if (!alreadyInTesting) {
    await fs.rename(srcPath, destPath);
  }

  // Assignment stubs are deprecated; do not create/update work/assignments/*.md.
  return { srcPath, destPath, moved: !alreadyInTesting };
}
