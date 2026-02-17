import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { upsertAgentInConfig, type AgentConfigSnippet } from "./agent-config";
import { stableStringify } from "./stable-stringify";

/** Runtime API shape for config access (plugin SDK may not expose types). */
interface OpenClawRuntimeConfig {
  loadConfig?: () => { cfg?: unknown } | unknown;
  writeConfigFile?: (cfg: unknown) => Promise<void>;
}

/**
 * Load OpenClaw config via runtime API.
 * @param api - OpenClaw plugin API
 * @returns Config object (mutable)
 * @throws If loadConfig fails
 */
export async function loadOpenClawConfig(api: OpenClawPluginApi): Promise<Record<string, unknown>> {
  const runtime = api.runtime as { config?: OpenClawRuntimeConfig };
  const current = runtime.config?.loadConfig?.();
  if (!current) throw new Error("Failed to load config via api.runtime.config.loadConfig()");
  const cfgObj = (current as { cfg?: unknown }).cfg ?? current;
  return cfgObj as Record<string, unknown>;
}

/**
 * Write OpenClaw config via runtime API.
 * @param api - OpenClaw plugin API
 * @param cfgObj - Config object to write
 */
export async function writeOpenClawConfig(api: OpenClawPluginApi, cfgObj: Record<string, unknown>): Promise<void> {
  const runtime = api.runtime as { config?: OpenClawRuntimeConfig };
  await runtime.config?.writeConfigFile?.(cfgObj);
}

export type BindingMatch = {
  channel: string;
  accountId?: string;
  peer?: { kind: "dm" | "group" | "channel"; id: string };
  guildId?: string;
  teamId?: string;
};

export type BindingSnippet = {
  agentId: string;
  match: BindingMatch;
};

/** Mutable config shape used by ensure/upsert/remove functions. */
type OpenClawConfigMutable = Record<string, unknown> & {
  agents?: { list?: Array<{ id?: string; default?: boolean; workspace?: string; sandbox?: unknown }>; defaults?: { workspace?: string } };
  bindings?: Array<{ agentId?: string; match?: BindingMatch }>;
};

function getWorkspaceRoot(cfgObj: OpenClawConfigMutable, api: OpenClawPluginApi): string {
  return cfgObj.agents?.defaults?.workspace ?? api.config.agents?.defaults?.workspace ?? "~/.openclaw/workspace";
}

function buildMainAgentEntry(
  prevMain: Partial<{ id?: string; workspace?: string; sandbox?: unknown }>,
  workspaceRoot: string
) {
  return {
    ...prevMain,
    id: "main",
    default: true,
    workspace: prevMain?.workspace ?? workspaceRoot,
    sandbox: prevMain?.sandbox ?? { mode: "off" },
  };
}

/**
 * Ensure main agent is first in agents.list with default workspace.
 * Mutates cfgObj in place.
 * @param cfgObj - OpenClaw config object
 * @param api - OpenClaw plugin API (for defaults)
 */
export function ensureMainFirstInAgentsList(cfgObj: OpenClawConfigMutable, api: OpenClawPluginApi) {
  if (!cfgObj.agents) cfgObj.agents = {};
  if (!Array.isArray(cfgObj.agents.list)) cfgObj.agents.list = [];

  const list = cfgObj.agents.list;
  const workspaceRoot = getWorkspaceRoot(cfgObj, api);
  const idx = list.findIndex((a) => a?.id === "main");
  const prevMain = idx >= 0 ? list[idx] ?? {} : {};
  const main = buildMainAgentEntry(prevMain, workspaceRoot);

  for (const a of list) {
    if (a?.id !== "main" && a?.default) a.default = false;
  }
  if (idx >= 0) list.splice(idx, 1);
  list.unshift(main);
}

/**
 * Add or update a binding in config bindings array.
 * @param cfgObj - OpenClaw config object
 * @param binding - Binding to add/update
 * @returns changed and note
 */
export function upsertBindingInConfig(cfgObj: OpenClawConfigMutable, binding: BindingSnippet) {
  if (!Array.isArray(cfgObj.bindings)) cfgObj.bindings = [];
  const list = cfgObj.bindings;

  const sig = stableStringify({ agentId: binding.agentId, match: binding.match });
  const idx = list.findIndex((b) => stableStringify({ agentId: b?.agentId, match: b?.match }) === sig);

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...binding };
    return { changed: false, note: "already-present" as const };
  }

  if (binding.match?.peer) list.unshift(binding);
  else list.push(binding);

  return { changed: true, note: "added" as const };
}

/**
 * Remove matching bindings from config.
 * @param cfgObj - OpenClaw config object
 * @param opts - Optional agentId and match
 * @returns removedCount and removed list
 */
export function removeBindingsInConfig(cfgObj: OpenClawConfigMutable, opts: { agentId?: string; match: BindingMatch }) {
  if (!Array.isArray(cfgObj.bindings)) cfgObj.bindings = [];
  const list = cfgObj.bindings;
  const targetMatchSig = stableStringify(opts.match);
  const before = list.length;
  const kept: typeof list = [];
  const removed: typeof list = [];

  for (const b of list) {
    const sameAgent = opts.agentId ? String(b?.agentId ?? "") === opts.agentId : true;
    const sameMatch = stableStringify(b?.match ?? {}) === targetMatchSig;
    if (sameAgent && sameMatch) removed.push(b);
    else kept.push(b);
  }

  cfgObj.bindings = kept;
  return { removedCount: before - kept.length, removed };
}

/**
 * Apply agent snippets to openclaw config (ensure main first, upsert agents).
 * @param api - OpenClaw plugin API
 * @param snippets - Agent config snippets to add/update
 * @returns updatedAgents ids
 */
export async function applyAgentSnippetsToOpenClawConfig(api: OpenClawPluginApi, snippets: AgentConfigSnippet[]) {
  const cfgObj = await loadOpenClawConfig(api);
  ensureMainFirstInAgentsList(cfgObj, api);
  for (const s of snippets) upsertAgentInConfig(cfgObj, s);
  ensureMainFirstInAgentsList(cfgObj, api);
  await writeOpenClawConfig(api, cfgObj);
  return { updatedAgents: snippets.map((s) => s.id) };
}

export async function applyBindingSnippetsToOpenClawConfig(api: OpenClawPluginApi, snippets: BindingSnippet[]) {
  const cfgObj = await loadOpenClawConfig(api);
  const results: Array<BindingSnippet & { result: ReturnType<typeof upsertBindingInConfig> }> = [];
  for (const s of snippets) {
    results.push({ ...s, result: upsertBindingInConfig(cfgObj, s) });
  }
  await writeOpenClawConfig(api, cfgObj);
  return { updatedBindings: results };
}
