import path from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { ensureDir } from "./fs-utils";
import { ticketStageDir } from "./lanes";

export function resolveWorkspaceRoot(api: OpenClawPluginApi): string {
  const root = api.config.agents?.defaults?.workspace;
  if (!root) throw new Error("agents.defaults.workspace is not set in config");
  return root;
}

export function resolveTeamDir(api: OpenClawPluginApi, teamId: string): string {
  const workspaceRoot = resolveWorkspaceRoot(api);
  return path.resolve(workspaceRoot, "..", "workspace-" + teamId);
}

export async function ensureTicketStageDirs(teamDir: string): Promise<void> {
  await Promise.all([
    ensureDir(path.join(teamDir, "work")),
    ensureDir(ticketStageDir(teamDir, "backlog")),
    ensureDir(ticketStageDir(teamDir, "in-progress")),
    ensureDir(ticketStageDir(teamDir, "testing")),
    ensureDir(ticketStageDir(teamDir, "done")),
    ensureDir(ticketStageDir(teamDir, "assignments")),
  ]);
}

export async function resolveTeamContext(api: OpenClawPluginApi, teamId: string): Promise<{ workspaceRoot: string; teamDir: string }> {
  const workspaceRoot = resolveWorkspaceRoot(api);
  const teamDir = path.resolve(workspaceRoot, "..", "workspace-" + teamId);
  await ensureTicketStageDirs(teamDir);
  return { workspaceRoot, teamDir };
}
