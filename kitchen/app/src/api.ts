import * as authStore from "./authStore";

/** Callback when API returns 401; used to redirect to login */
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

function getAuthHeaders(): Record<string, string> {
  const value = authStore.getAuthHeader();
  if (!value) return {};
  return { Authorization: `Basic ${value}` };
}

export type Team = {
  teamId: string;
  recipeId: string;
  recipeName: string;
  scaffoldedAt: string;
};

export type Ticket = {
  stage: string;
  number: number | null;
  id: string;
  file: string;
  title?: string;
  owner?: string;
};

export type TicketsResponse = {
  teamId: string;
  tickets: Ticket[];
  backlog: Ticket[];
  inProgress: Ticket[];
  testing: Ticket[];
  done: Ticket[];
};

async function parseApiError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (typeof data?.error === "string") return data.error;
  } catch {
    /* not JSON */
  }
  return text;
}

/**
 * Fetch JSON from API; throws on !res.ok with parsed error message.
 * Adds auth headers when available. On 401, clears auth store and calls onUnauthorized.
 */
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = { ...getAuthHeaders(), ...((init?.headers as Record<string, string>) ?? {}) };
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    authStore.clear();
    onUnauthorized?.();
    throw new Error(await parseApiError(res));
  }
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function fetchTeams(): Promise<Team[]> {
  return fetchJson<Team[]>("/api/teams");
}

export async function removeTeam(teamId: string): Promise<void> {
  await fetchJson(`/api/teams/${encodeURIComponent(teamId)}`, { method: "DELETE" });
}

export async function fetchTickets(teamId: string): Promise<TicketsResponse> {
  return fetchJson(`/api/teams/${encodeURIComponent(teamId)}/tickets`);
}

export async function moveTicket(
  teamId: string,
  ticketId: string,
  to: string,
  completed?: boolean
): Promise<void> {
  await fetchJson(
    `/api/teams/${encodeURIComponent(teamId)}/tickets/${encodeURIComponent(ticketId)}/move`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, completed }),
    }
  );
}

export async function assignTicket(
  teamId: string,
  ticketId: string,
  owner: string
): Promise<void> {
  await fetchJson(
    `/api/teams/${encodeURIComponent(teamId)}/tickets/${encodeURIComponent(ticketId)}/assign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner }),
    }
  );
}

export async function takeTicket(
  teamId: string,
  ticketId: string,
  owner: string
): Promise<void> {
  await fetchJson(
    `/api/teams/${encodeURIComponent(teamId)}/tickets/${encodeURIComponent(ticketId)}/take`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner }),
    }
  );
}

export async function handoffTicket(teamId: string, ticketId: string, tester?: string): Promise<void> {
  await fetchJson(
    `/api/teams/${encodeURIComponent(teamId)}/tickets/${encodeURIComponent(ticketId)}/handoff`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tester: tester ?? "test" }),
    }
  );
}

export async function completeTicket(teamId: string, ticketId: string): Promise<void> {
  await fetchJson(
    `/api/teams/${encodeURIComponent(teamId)}/tickets/${encodeURIComponent(ticketId)}/complete`,
    { method: "POST" }
  );
}

export async function dispatchTicket(
  teamId: string,
  request: string,
  owner?: string
): Promise<void> {
  await fetchJson(`/api/teams/${encodeURIComponent(teamId)}/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request, owner: owner ?? "dev" }),
  });
}

export type InboxItem = {
  id: string;
  title?: string;
  received?: string;
};

export async function fetchInbox(teamId: string): Promise<InboxItem[]> {
  return fetchJson(`/api/teams/${encodeURIComponent(teamId)}/inbox`);
}

export async function fetchInboxContent(teamId: string, itemId: string): Promise<string> {
  const data = await fetchJson<{ content: string }>(
    `/api/teams/${encodeURIComponent(teamId)}/inbox/${encodeURIComponent(itemId)}/content`
  );
  return data.content;
}

export async function fetchTicketContent(teamId: string, ticketId: string): Promise<string> {
  const data = await fetchJson<{ content: string }>(
    `/api/teams/${encodeURIComponent(teamId)}/tickets/${encodeURIComponent(ticketId)}/content`
  );
  return data.content;
}

export type Recipe = {
  id: string;
  name?: string;
  kind?: string;
  source: string;
};

export async function fetchRecipes(): Promise<Recipe[]> {
  return fetchJson("/api/recipes");
}

export async function fetchRecipe(id: string): Promise<{ md: string }> {
  return fetchJson(`/api/recipes/${encodeURIComponent(id)}`);
}

export type RecipeStatus = {
  id: string;
  requiredSkills: string[];
  missingSkills: string[];
  installCommands: string[];
};

export async function fetchRecipeStatus(id?: string): Promise<RecipeStatus[]> {
  const url = id
    ? `/api/recipes/${encodeURIComponent(id)}/status`
    : "/api/recipes/status";
  const data = await fetchJson<RecipeStatus[] | RecipeStatus>(url);
  return Array.isArray(data) ? data : [data];
}

export async function scaffoldRecipeTeam(
  recipeId: string,
  teamId: string,
  overwrite?: boolean
): Promise<void> {
  await fetchJson(`/api/recipes/${encodeURIComponent(recipeId)}/scaffold-team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamId, overwrite }),
  });
}

export async function installRecipeSkills(
  recipeId: string,
  options: { scope?: "global" | "team" | "agent"; teamId?: string; agentId?: string }
): Promise<{ ok: boolean; installed: string[]; errors?: Array<{ skill: string; error: string }> }> {
  return fetchJson(`/api/recipes/${encodeURIComponent(recipeId)}/install`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
}

export async function scaffoldRecipeAgent(
  recipeId: string,
  agentId: string,
  options?: { name?: string; overwrite?: boolean }
): Promise<void> {
  await fetchJson(`/api/recipes/${encodeURIComponent(recipeId)}/scaffold-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId,
      name: options?.name,
      overwrite: options?.overwrite,
    }),
  });
}

export type Binding = {
  agentId: string;
  match: {
    channel: string;
    accountId?: string;
    guildId?: string;
    teamId?: string;
    peer?: { kind: string; id: string };
  };
};

export async function fetchBindings(): Promise<Binding[]> {
  return fetchJson("/api/bindings");
}

export async function addBindingAPI(
  agentId: string,
  match: Binding["match"]
): Promise<void> {
  await fetchJson("/api/bindings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, match }),
  });
}

export async function removeBindingAPI(
  match: Binding["match"],
  agentId?: string
): Promise<void> {
  await fetchJson("/api/bindings", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, match }),
  });
}

export type ActivityEvent = {
  id: string;
  type: string;
  teamId?: string;
  ticketId?: string;
  message: string;
  timestamp: string;
};

export async function fetchActivity(limit?: number): Promise<ActivityEvent[]> {
  const url = limit ? `/api/activity?limit=${limit}` : "/api/activity";
  return fetchJson(url);
}

export async function fetchCleanupPlan(): Promise<{
  ok: boolean;
  dryRun: boolean;
  rootDir: string;
  candidates: Array<{ teamId: string; absPath: string }>;
  skipped: Array<{ teamId?: string; dirName: string; reason: string }>;
}> {
  return fetchJson("/api/cleanup/plan");
}

export async function executeCleanup(): Promise<{
  ok: boolean;
  dryRun: boolean;
  rootDir: string;
  candidates: Array<{ teamId: string; absPath: string }>;
  skipped: Array<{ teamId?: string; dirName: string; reason: string }>;
  deleted: string[];
  deleteErrors?: Array<{ path: string; error: string }>;
}> {
  return fetchJson("/api/cleanup/execute", { method: "POST" });
}

export async function fetchHealth(): Promise<{ ok: boolean; openclaw: boolean }> {
  return fetchJson("/api/health");
}

export async function fetchAuthStatus(): Promise<{ authRequired: boolean }> {
  return fetchJson("/api/auth/status");
}

/** Demo data for when running Kitchen without OpenClaw (e.g. standalone or plugin demo). */
export const DEMO_TEAM_ID = "demo-team";

export const DEMO_TEAMS: Team[] = [
  { teamId: DEMO_TEAM_ID, recipeId: "development-team", recipeName: "Development Team (demo)", scaffoldedAt: "" },
];
