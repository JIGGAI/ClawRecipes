import type { IncomingHttpHeaders } from 'node:http';

export type OutboundPlatform = 'x' | 'discord' | 'youtube' | 'instagram' | 'tiktok';

export type OutboundRunContext = {
  teamId: string;
  workflowId: string;
  workflowRunId: string;
  nodeId: string;
  ticketPath?: string;
};

export type OutboundApproval = {
  bindingId?: string;
  code?: string;
  approvalFileRel?: string;
  requestedAt?: string;
  receipt?: string;
};

export type OutboundMedia = {
  url: string;
  type: 'image' | 'video';
};

export type OutboundPublishRequest = {
  text: string;
  media?: OutboundMedia[];
  runContext: OutboundRunContext;
  approval?: OutboundApproval;
  dryRun?: boolean;
};

export type OutboundPublishResponse = {
  ok: boolean;
  platform: string;
  id?: string;
  url?: string;
  error?: string;
  message?: string;
};

function normalizeBaseUrl(baseUrl: string): string {
  const s = baseUrl.trim().replace(/\/+$/, '');
  if (!s) throw new Error('Outbound baseUrl is required');
  if (!/^https?:\/\//i.test(s)) {
    throw new Error(`Outbound baseUrl must start with http(s):// (got: ${baseUrl})`);
  }
  return s;
}

export async function outboundPublish(args: {
  baseUrl: string;
  apiKey: string;
  platform: OutboundPlatform;
  idempotencyKey: string;
  request: OutboundPublishRequest;
  extraHeaders?: IncomingHttpHeaders;
}): Promise<OutboundPublishResponse> {
  const baseUrl = normalizeBaseUrl(args.baseUrl);
  const apiKey = String(args.apiKey ?? '').trim();
  if (!apiKey) throw new Error('Outbound apiKey is required');

  const platform = String(args.platform ?? '').trim() as OutboundPlatform;
  if (!platform) throw new Error('Outbound platform is required');

  const idempotencyKey = String(args.idempotencyKey ?? '').trim();
  if (!idempotencyKey) throw new Error('Outbound idempotencyKey is required');

  const url = `${baseUrl}/v1/${platform}/publish`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
      'idempotency-key': idempotencyKey,
      ...(args.extraHeaders ?? {}),
    },
    body: JSON.stringify(args.request),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Outbound publish failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`);
  }

  let json: OutboundPublishResponse;
  try {
    json = JSON.parse(text) as OutboundPublishResponse;
  } catch {
    throw new Error(`Outbound publish returned non-JSON: ${text.slice(0, 500)}`);
  }

  if (json && json.ok === false) {
    const err = json.error ? ` (${json.error})` : '';
    const msg = json.message ? ` — ${json.message}` : '';
    throw new Error(`Outbound publish returned ok=false${err}${msg}`);
  }

  return json;
}
