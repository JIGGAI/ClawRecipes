import fs from "node:fs/promises";
import path from "node:path";

import { fileExists } from "./fs-utils";

export class RecipesCliError extends Error {
  code: string;
  command?: string;
  missingPath?: string;
  suggestedFix?: string;

  constructor(opts: { message: string; code: string; command?: string; missingPath?: string; suggestedFix?: string }) {
    super(opts.message);
    this.name = 'RecipesCliError';
    this.code = opts.code;
    this.command = opts.command;
    this.missingPath = opts.missingPath;
    this.suggestedFix = opts.suggestedFix;
  }
}

export type TicketStage = "backlog" | "in-progress" | "testing" | "done" | "assignments";

/** Subset of TicketStage excluding assignments (used for lane search order). */
export type TicketLane = Exclude<TicketStage, "assignments">;

export function ticketStageDir(teamDir: string, stage: TicketStage): string {
  return stage === "assignments"
    ? path.join(teamDir, "work", "assignments")
    : path.join(teamDir, "work", stage);
}

/**
 * Ensure a lane dir exists, with a one-line migration hint for older workspaces.
 *
 * If creation fails, throws a RecipesCliError with an actionable message.
 */
export async function ensureLaneDir(opts: { teamDir: string; lane: TicketLane; command?: string; quiet?: boolean }) {
  const laneDir = path.join(opts.teamDir, 'work', opts.lane);
  const existed = await fileExists(laneDir);

  if (!existed) {
    try {
      await fs.mkdir(laneDir, { recursive: true });
    } catch (e: unknown) {
      throw new RecipesCliError({
        code: 'LANE_DIR_CREATE_FAILED',
        command: opts.command,
        missingPath: laneDir,
        suggestedFix: `mkdir -p ${path.join('work', opts.lane)}`,
        message:
          `Failed to create required lane directory: ${laneDir}` +
          (opts.command ? ` (command: ${opts.command})` : '') +
          (e instanceof Error ? `\nUnderlying error: ${e.message}` : ''),
      });
    }

    if (!opts.quiet) {
      const rel = path.join('work', opts.lane);
      console.error(`[recipes] migration: created ${rel}/ (older workspace missing this lane)`);
    }
  }

  return { path: laneDir, created: !existed };
}
