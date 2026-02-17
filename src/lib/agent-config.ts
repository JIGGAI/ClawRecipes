export type AgentConfigSnippet = {
  id: string;
  workspace: string;
  identity?: { name?: string };
  tools?: { profile?: string; allow?: string[]; deny?: string[] };
};

type AgentsConfigMutable = Record<string, unknown> & {
  agents?: { list?: Array<{ id?: string; workspace?: string; identity?: Record<string, unknown>; tools?: unknown }> };
};

export function upsertAgentInConfig(cfgObj: AgentsConfigMutable, snippet: AgentConfigSnippet) {
  if (!cfgObj.agents) cfgObj.agents = {};
  if (!Array.isArray(cfgObj.agents.list)) cfgObj.agents.list = [];

  const list = cfgObj.agents.list;
  const idx = list.findIndex((a) => a?.id === snippet.id);
  const prev = idx >= 0 ? list[idx] : {};
  const prevTools = (prev as any)?.tools as undefined | { profile?: string; allow?: string[]; deny?: string[] };
  const nextTools =
    snippet.tools === undefined
      ? prevTools
      : {
          ...(prevTools ?? {}),
          ...(snippet.tools ?? {}),
          ...(Object.prototype.hasOwnProperty.call(snippet.tools, "profile") ? { profile: snippet.tools.profile } : {}),
          ...(Object.prototype.hasOwnProperty.call(snippet.tools, "allow") ? { allow: snippet.tools.allow } : {}),
          ...(Object.prototype.hasOwnProperty.call(snippet.tools, "deny") ? { deny: snippet.tools.deny } : {}),
        };

  const nextAgent = {
    ...prev,
    id: snippet.id,
    workspace: snippet.workspace,
    identity: {
      ...(prev?.identity ?? {}),
      ...(snippet.identity ?? {}),
    },
    tools: nextTools,
  };

  if (idx >= 0) {
    list[idx] = nextAgent;
    return;
  }

  list.push(nextAgent);
}
