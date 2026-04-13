import type { OpenClawPluginApi } from 'openclaw/plugin-sdk';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : (v == null ? '' : String(v));
}

function asPort(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  if (typeof v === 'string' && v.trim()) {
    const parsed = Number(v.trim());
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function buildBaseUrl(host: string, port: number | null): string {
  const trimmedHost = host.trim();
  if (!trimmedHost) return 'http://localhost:7777';
  if (/^https?:\/\//i.test(trimmedHost)) return trimTrailingSlash(trimmedHost);
  const safeHost = trimmedHost.includes(':') && !trimmedHost.startsWith('[') ? `[${trimmedHost}]` : trimmedHost;
  return trimTrailingSlash(`http://${safeHost}${port ? `:${port}` : ''}`);
}

export function getKitchenBaseUrl(api: OpenClawPluginApi): string {
  const config = asRecord((api as unknown as { config?: unknown }).config) ?? {};
  const envVars = asRecord(asRecord(config.env)?.vars);
  const envBaseUrl = asString(envVars?.CK_BASE_URL).trim();
  if (envBaseUrl) return trimTrailingSlash(envBaseUrl);

  const kitchenConfig = asRecord(asRecord(asRecord(config.plugins)?.entries)?.kitchen)?.config;
  const host = asString(kitchenConfig?.host).trim();
  const port = asPort(kitchenConfig?.port);
  if (host) return buildBaseUrl(host, port);

  return 'http://localhost:7777';
}

export function buildKitchenWorkflowReviewUrl(api: OpenClawPluginApi, teamId: string, workflowId: string): string {
  const baseUrl = getKitchenBaseUrl(api);
  return `${baseUrl}/teams/${encodeURIComponent(teamId)}/workflows/${encodeURIComponent(workflowId)}`;
}
