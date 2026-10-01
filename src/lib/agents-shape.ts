/**
 * OpenClaw changed how configured agents are stored.
 *
 * Older hosts used an array at `agents.list`. Since the 2026.9 line the
 * canonical shape is a keyed map at `agents.entries`, where the agent id is the
 * key and is *not* repeated inside the value. OpenClaw still accepts a legacy
 * `agents.list` on input and migrates it on load, which is precisely why we
 * must not keep writing it: a stale `agents.list` gets folded back over
 * `agents.entries` and can clobber live agent settings.
 *
 * This module is the single place that knows about both shapes. Readers get a
 * normalized array; writers put the data back in whichever shape the config
 * already uses, so a plugin build works against old and new hosts alike
 * (`package.json` declares `pluginApiRange: ">=2026.5"`).
 */

/** One agent as the rest of the codebase handles it: a record carrying `id`. */
export type AgentRecord = Record<string, unknown> & { id?: string };

export type AgentsShape = 'entries' | 'list';

export type AgentsConfigMutable = Record<string, unknown> & {
  agents?: {
    entries?: Record<string, Record<string, unknown>>;
    list?: AgentRecord[];
    defaults?: Record<string, unknown>;
  };
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Which shape a config uses. A config with neither key is treated as the
 * current shape, so fresh installs start on `agents.entries`.
 */
export function detectAgentsShape(cfgObj: AgentsConfigMutable | undefined): AgentsShape {
  const agents = cfgObj?.agents;
  if (isRecord(agents)) {
    if (isRecord(agents.entries)) return 'entries';
    if (Array.isArray(agents.list)) return 'list';
  }
  return 'entries';
}

/**
 * Every configured agent, normalized to records carrying `id`, from whichever
 * shape is present. Entries without a usable id are dropped.
 */
export function readAgents(cfgObj: AgentsConfigMutable | undefined): AgentRecord[] {
  const agents = cfgObj?.agents;
  if (!isRecord(agents)) return [];

  if (isRecord(agents.entries)) {
    return Object.entries(agents.entries)
      .filter(([id]) => id)
      .map(([id, entry]) => ({ ...(isRecord(entry) ? entry : {}), id }));
  }

  if (Array.isArray(agents.list)) {
    return agents.list.filter(isRecord).filter((a) => String(a.id ?? '')) as AgentRecord[];
  }

  return [];
}

/**
 * Replace the full agent set, writing back in the config's existing shape.
 * Mutates `cfgObj` in place. For the keyed shape the `id` becomes the key and
 * is stripped from the value, matching what OpenClaw writes itself.
 */
export function writeAgents(cfgObj: AgentsConfigMutable, agents: AgentRecord[]): void {
  if (!isRecord(cfgObj.agents)) cfgObj.agents = {};
  const container = cfgObj.agents;
  const shape = detectAgentsShape(cfgObj);

  if (shape === 'list') {
    container.list = agents.filter((a) => String(a.id ?? ''));
    return;
  }

  const next: Record<string, Record<string, unknown>> = {};
  for (const agent of agents) {
    const id = String(agent.id ?? '');
    if (!id) continue;
    const rest = { ...agent };
    delete rest.id;
    next[id] = rest;
  }
  container.entries = next;
  // A config that just gained `entries` must not keep a legacy array around;
  // OpenClaw would migrate it back over what we just wrote.
  delete container.list;
}

/**
 * The default ("system") agent id. The keyed shape records this at
 * `agents.defaults.systemAgent.agentId` — the per-entry `default: true` marker
 * was retired — so fall back to that marker only for legacy configs.
 */
export function readDefaultAgentId(cfgObj: AgentsConfigMutable | undefined): string | undefined {
  const defaults = cfgObj?.agents?.defaults;
  if (isRecord(defaults)) {
    const systemAgent = defaults.systemAgent;
    if (isRecord(systemAgent) && typeof systemAgent.agentId === 'string' && systemAgent.agentId) {
      return systemAgent.agentId;
    }
  }
  const marked = readAgents(cfgObj).find((a) => a.default === true);
  return marked ? String(marked.id ?? '') || undefined : undefined;
}

/**
 * Record which agent is the default, in the way this config's shape expects.
 * Mutates `cfgObj` in place.
 */
export function writeDefaultAgentId(cfgObj: AgentsConfigMutable, agentId: string): void {
  if (!isRecord(cfgObj.agents)) cfgObj.agents = {};
  const container = cfgObj.agents;

  if (detectAgentsShape(cfgObj) === 'list') {
    for (const agent of container.list ?? []) {
      if (isRecord(agent)) agent.default = agent.id === agentId;
    }
    return;
  }

  if (!isRecord(container.defaults)) container.defaults = {};
  const defaults = container.defaults as Record<string, unknown>;
  const systemAgent = isRecord(defaults.systemAgent) ? defaults.systemAgent : {};
  defaults.systemAgent = { ...systemAgent, agentId };
}
