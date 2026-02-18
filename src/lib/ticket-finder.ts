import path from "node:path";
import fs from "node:fs/promises";
import { fileExists } from "./fs-utils";
import { ticketStageDir, type TicketLane } from "./lanes";

export type { TicketLane };

export function laneDir(teamDir: string, lane: TicketLane) {
  return ticketStageDir(teamDir, lane);
}

const LANE_SEARCH_ORDER: TicketLane[] = ["backlog", "in-progress", "testing", "done"];

export function allLaneDirs(teamDir: string) {
  return LANE_SEARCH_ORDER.map((lane) => ticketStageDir(teamDir, lane));
}

/**
 * Compute the next ticket number (max existing + 1) by scanning ticket lane dirs.
 * Used when creating new tickets (e.g. dispatch).
 */
export async function computeNextTicketNumber(teamDir: string): Promise<number> {
  let max = 0;
  for (const lane of LANE_SEARCH_ORDER) {
    const dir = ticketStageDir(teamDir, lane);
    if (!(await fileExists(dir))) continue;
    const files = await fs.readdir(dir);
    for (const f of files) {
      const m = f.match(TICKET_FILENAME_REGEX);
      if (m) max = Math.max(max, Number(m[1]));
    }
  }
  return max + 1;
}

/** Regex for ticket filenames: 0001-slug.md */
export const TICKET_FILENAME_REGEX = /^(\d{4})-(.+)\.md$/;

export function parseTicketArg(ticketArgRaw: string) {
  const raw = String(ticketArgRaw ?? "").trim();

  // Accept "30" as shorthand for ticket 0030.
  const padded = raw.match(/^\d+$/) && raw.length < 4 ? raw.padStart(4, "0") : raw;

  const idMatch = padded.match(/^(\d{4})-/);
  const ticketNum = padded.match(/^\d{4}$/) ? padded : (idMatch ? idMatch[1] : null);

  return { ticketArg: padded, ticketNum };
}

/** Parse ticket number and slug from filename. Returns null if not a valid ticket filename. */
export function parseTicketFilename(filename: string): { ticketNumStr: string; slug: string } | null {
  const m = filename.match(TICKET_FILENAME_REGEX);
  if (!m) return null;
  return { ticketNumStr: m[1], slug: m[2] };
}

export async function findTicketFile(opts: {
  teamDir: string;
  ticket: string;
  lanes?: TicketLane[];
}) {
  const lanes = opts.lanes ?? LANE_SEARCH_ORDER;
  const { ticketArg, ticketNum } = parseTicketArg(String(opts.ticket));

  for (const lane of lanes) {
    const dir = laneDir(opts.teamDir, lane);
    if (!(await fileExists(dir))) continue;
    const files = await fs.readdir(dir);
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      if (ticketNum && f.startsWith(`${ticketNum}-`)) return path.join(dir, f);
      if (!ticketNum && f.replace(/\.md$/, '') === ticketArg) return path.join(dir, f);
    }
  }

  return null;
}

export function parseOwnerFromMd(md: string): string | null {
  const m = md.match(/^Owner:\s*(.+)\s*$/m);
  return m?.[1]?.trim() ?? null;
}
