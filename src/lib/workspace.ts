import os from "node:os";
import path from "node:path";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { ensureDir } from "./fs-utils";
import { ticketStageDir } from "./lanes";

/**
 * Resolve the OpenClaw workspace root.
 *
 * Priority:
 *  1) config: agents.defaults.workspace
 *  2) env: OPENCLAW_WORKSPACE
 *  3) default: ~/.openclaw/workspace
 */
export function resolveWorkspaceRoot(api: OpenClawPluginApi): string {
  const root = api.config.agents?.defaults?.workspace;
  if (root) return root;

  const envRoot = process.env.OPENCLAW_WORKSPACE;
  if (envRoot) return envRoot;

  return path.join(os.homedir(), ".openclaw", "workspace");
}

/**
 * Resolve the canonical OpenClaw workspace root even when the current agent workspace
 * is nested under `workspace-<teamId>/roles/<role>`.
 */
export function resolveCanonicalWorkspaceRoot(api: OpenClawPluginApi): string {
  const candidate = api.config.agents?.defaults?.workspace;
  if (candidate) {
    const abs = path.resolve(candidate);
    const parts = abs.split(path.sep).filter(Boolean);
    const idx = [...parts].reverse().findIndex((p) => p.startsWith('workspace-'));
    if (idx >= 0) {
      const segIdx = parts.length - 1 - idx;
      const teamDir = path.isAbsolute(abs) ? path.sep + path.join(...parts.slice(0, segIdx + 1)) : path.join(...parts.slice(0, segIdx + 1));
      return path.resolve(teamDir, '..', 'workspace');
    }
  }

  return resolveWorkspaceRoot(api);
}

function tryResolveTeamDirFromAnyDir(dir: string, teamId: string): string | undefined {
  const seg = `workspace-${teamId}`;
  const abs = path.resolve(dir);

  // Walk up the directory tree looking for a path segment named workspace-<teamId>
  const parts = abs.split(path.sep).filter(Boolean);
  const idx = parts.lastIndexOf(seg);
  if (idx >= 0) {
    const prefix = parts.slice(0, idx + 1);
    return path.isAbsolute(abs) ? path.sep + path.join(...prefix) : path.join(...prefix);
  }

  return undefined;
}

/**
 * Resolve a team's directory (`.../workspace-<teamId>`) even when the agent workspace
 * is nested under `workspace-<teamId>/roles/<role>`.
 */
export function resolveTeamDir(api: OpenClawPluginApi, teamId: string): string {
  // Explicit override (useful for testing or specialized deployments)
  const envTeamDir = process.env.OPENCLAW_TEAM_DIR;
  if (envTeamDir) return path.resolve(envTeamDir);

  const agentWorkspace = api.config.agents?.defaults?.workspace;
  if (agentWorkspace) {
    const resolved = tryResolveTeamDirFromAnyDir(agentWorkspace, teamId);
    if (resolved) return resolved;
  }

  // Best-effort fallback using current working directory (some plugin invocations
  // may not have agents.defaults.workspace populated)
  const cwdResolved = tryResolveTeamDirFromAnyDir(process.cwd(), teamId);
  if (cwdResolved) return cwdResolved;

  // Default historical behavior: assume agentWorkspaceRoot is ~/.openclaw/workspace
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

export async function resolveTeamContext(
  api: OpenClawPluginApi,
  teamId: string
): Promise<{ workspaceRoot: string; teamDir: string }> {
  const teamDir = resolveTeamDir(api, teamId);

  // Canonical workspaceRoot is the sibling of workspace-<teamId>
  // Example: ~/.openclaw/workspace-my-team -> ~/.openclaw/workspace
  const workspaceRoot = path.resolve(teamDir, "..", "workspace");

  await ensureTicketStageDirs(teamDir);
  return { workspaceRoot, teamDir };
}
