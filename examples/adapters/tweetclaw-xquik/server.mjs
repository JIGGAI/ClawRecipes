#!/usr/bin/env node

import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const DEFAULT_API_BASE_URL = 'https://xquik.com/api/v1/';
const DEFAULT_API_CONTRACT = '2026-04-29';
const DEFAULT_MAX_POLL_ATTEMPTS = 15;
const MAX_BODY_BYTES = 256 * 1024;
const MAX_MEDIA_ITEMS = 4;
const MAX_POLL_DELAY_MS = 5_000;
const MIN_POLL_DELAY_MS = 250;
const MAX_UPSTREAM_RESPONSE_BYTES = 1024 * 1024;

class AdapterError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

function required(value, name) {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`${name} is required`);
  return normalized;
}

function positiveInteger(value, fallback, name) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function safeEqual(actual, expected) {
  const actualBytes = Buffer.from(String(actual ?? ''));
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function createTweetClawApprovalReceipt({ approvalToken, idempotencyKey, requestBody }) {
  const token = required(approvalToken, 'approvalToken');
  const key = required(idempotencyKey, 'idempotencyKey');
  return createHmac('sha256', token)
    .update(`${key}\n${JSON.stringify(requestBody)}`)
    .digest('base64url');
}

function jsonResponse(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...extraHeaders,
  });
  response.end(`${JSON.stringify(payload)}\n`);
}

function parseApiBaseUrl(value) {
  const url = new URL(value.endsWith('/') ? value : `${value}/`);
  if (url.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(url.hostname)) {
    throw new Error('XQUIK_API_BASE_URL must use HTTPS unless it targets loopback');
  }
  if (url.username || url.password) throw new Error('XQUIK_API_BASE_URL must not include credentials');
  return url;
}

async function readJson(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) {
      throw new AdapterError(413, 'payload_too_large', 'Request body exceeds 256 KiB.');
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new AdapterError(400, 'invalid_json', 'Request body must be valid JSON.');
  }
}

function normalizeMedia(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_MEDIA_ITEMS) {
    throw new AdapterError(400, 'invalid_media', 'media must contain at most 4 items.');
  }

  const media = value.map((item) => {
    if (!item || typeof item !== 'object' || !['image', 'video'].includes(item.type)) {
      throw new AdapterError(400, 'invalid_media', 'Each media item needs an image or video type.');
    }
    let url;
    try {
      url = new URL(item.url);
    } catch {
      throw new AdapterError(400, 'invalid_media', 'Each media item needs a valid HTTPS URL.');
    }
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new AdapterError(400, 'invalid_media', 'Each media item needs a public HTTPS URL.');
    }
    return { type: item.type, url: url.toString() };
  });

  const videos = media.filter((item) => item.type === 'video');
  if (videos.length > 1 || (videos.length === 1 && media.length > 1)) {
    throw new AdapterError(400, 'invalid_media', 'Use up to 4 images or exactly 1 video.');
  }
  return media;
}

function normalizePublishRequest(payload, idempotencyKey, config) {
  if (!/^[\x21-\x7e]{1,255}$/.test(idempotencyKey)) {
    throw new AdapterError(400, 'invalid_idempotency_key', 'Idempotency-Key must use 1-255 visible ASCII characters.');
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new AdapterError(400, 'invalid_request', 'Request body must be a JSON object.');
  }

  const text = String(payload.text ?? '').trim();
  const media = normalizeMedia(payload.media);
  if (!text && media.length === 0) {
    throw new AdapterError(400, 'invalid_request', 'text or media is required.');
  }
  if (text.length > 25_000) {
    throw new AdapterError(400, 'invalid_request', 'text exceeds the adapter safety limit.');
  }

  const requestBody = {
    account: config.account,
    ...(text ? { text } : {}),
    ...(media.length ? { media: media.map((item) => item.url) } : {}),
  };
  if (config.requireApproval && payload.dryRun !== true) {
    const expectedReceipt = createTweetClawApprovalReceipt({
      approvalToken: config.approvalToken,
      idempotencyKey,
      requestBody,
    });
    if (!safeEqual(payload.approval?.receipt, expectedReceipt)) {
      throw new AdapterError(403, 'approval_required', 'A valid payload-bound approval receipt is required.');
    }
  }

  return { dryRun: payload.dryRun === true, idempotencyKey, requestBody };
}

async function requestXquik(config, url, init) {
  let response;
  try {
    response = await config.fetchImpl(url, {
      ...init,
      headers: {
        accept: 'application/json',
        'user-agent': 'clawrecipes-tweetclaw-outbound-adapter',
        'x-api-key': config.apiKey,
        'xquik-api-contract': config.apiContract,
        ...(init.headers ?? {}),
      },
      redirect: 'error',
      signal: AbortSignal.timeout(config.requestTimeoutMs),
    });
  } catch {
    throw new AdapterError(502, 'xquik_unavailable', 'Xquik request failed before a response arrived.');
  }

  const chunks = [];
  let bytes = 0;
  if (response.body) {
    for await (const chunk of response.body) {
      bytes += chunk.length;
      if (bytes > MAX_UPSTREAM_RESPONSE_BYTES) {
        throw new AdapterError(502, 'xquik_response_too_large', 'Xquik response exceeds 1 MiB.');
      }
      chunks.push(chunk);
    }
  }
  const text = Buffer.concat(chunks).toString('utf8');
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new AdapterError(502, 'invalid_xquik_response', 'Xquik returned an invalid response.');
  }
  if (!response.ok) {
    throw new AdapterError(502, `xquik_http_${response.status}`, `Xquik rejected the request with HTTP ${response.status}.`);
  }
  return body;
}

function statusUrl(record, config) {
  if (typeof record?.statusUrl !== 'string' || !record.statusUrl) {
    throw new AdapterError(502, 'missing_status_url', 'Xquik accepted the write without a status URL.');
  }
  const url = new URL(record.statusUrl, config.apiBaseUrl);
  if (url.origin !== config.apiBaseUrl.origin || !url.pathname.startsWith(config.apiBaseUrl.pathname)) {
    throw new AdapterError(502, 'invalid_status_url', 'Xquik returned an unexpected status URL.');
  }
  return url;
}

async function waitForTerminalWrite(record, config) {
  let current = record;
  for (let attempt = 0; !current?.terminal && attempt < config.maxPollAttempts; attempt += 1) {
    const delay = Math.min(MAX_POLL_DELAY_MS, Math.max(MIN_POLL_DELAY_MS, Number(current.pollAfterMs) || 1_000));
    await config.sleep(delay);
    current = await requestXquik(config, statusUrl(current, config), { method: 'GET' });
  }
  if (!current?.terminal) {
    throw new AdapterError(503, 'xquik_write_pending', 'Xquik write is still pending. Retry with the same idempotency key.');
  }
  if (current.success !== true) {
    throw new AdapterError(502, 'xquik_write_failed', 'Xquik could not complete the write. Review its action status.');
  }
  return current;
}

function publishResult(record) {
  const resultId = typeof record?.result?.id === 'string' ? record.result.id : undefined;
  const tweetId = record.tweetId || (record?.result?.type === 'tweet' ? resultId : undefined);
  const id = tweetId || resultId || record.writeActionId || record.id;
  return {
    ok: true,
    platform: 'x',
    ...(id ? { id: String(id) } : {}),
    ...(tweetId ? { url: `https://x.com/i/status/${encodeURIComponent(tweetId)}` } : {}),
    message: 'Tweet published through the Xquik write-action API.',
  };
}

function loadConfig(options) {
  const requireApproval = options.requireApproval
    ?? String(process.env.TWEETCLAW_REQUIRE_APPROVAL ?? 'true').toLowerCase() !== 'false';
  const apiBaseUrl = parseApiBaseUrl(options.apiBaseUrl ?? process.env.XQUIK_API_BASE_URL ?? DEFAULT_API_BASE_URL);
  return {
    account: required(options.account ?? process.env.XQUIK_X_ACCOUNT, 'XQUIK_X_ACCOUNT'),
    adapterKey: required(options.adapterKey ?? process.env.TWEETCLAW_ADAPTER_KEY, 'TWEETCLAW_ADAPTER_KEY'),
    apiBaseUrl,
    apiContract: options.apiContract ?? process.env.XQUIK_API_CONTRACT ?? DEFAULT_API_CONTRACT,
    apiKey: required(options.apiKey ?? process.env.XQUIK_API_KEY, 'XQUIK_API_KEY'),
    approvalToken: requireApproval
      ? required(options.approvalToken ?? process.env.TWEETCLAW_APPROVAL_TOKEN, 'TWEETCLAW_APPROVAL_TOKEN')
      : '',
    fetchImpl: options.fetchImpl ?? globalThis.fetch,
    maxPollAttempts: positiveInteger(
      options.maxPollAttempts ?? process.env.TWEETCLAW_MAX_POLL_ATTEMPTS,
      DEFAULT_MAX_POLL_ATTEMPTS,
      'TWEETCLAW_MAX_POLL_ATTEMPTS',
    ),
    requestTimeoutMs: positiveInteger(options.requestTimeoutMs, 15_000, 'requestTimeoutMs'),
    requireApproval,
    sleep: options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))),
  };
}

export function createTweetClawOutboundAdapter(options = {}) {
  const config = loadConfig(options);
  return createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      if (requestUrl.pathname !== '/v1/x/publish') {
        throw new AdapterError(404, 'not_found', 'Route not found.');
      }
      if (request.method !== 'POST') {
        jsonResponse(response, 405, { ok: false, error: 'method_not_allowed' }, { allow: 'POST' });
        return;
      }
      const authorization = String(request.headers.authorization ?? '');
      if (!authorization.startsWith('Bearer ') || !safeEqual(authorization.slice(7), config.adapterKey)) {
        throw new AdapterError(401, 'unauthorized', 'Valid adapter authentication is required.');
      }
      if (!String(request.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
        throw new AdapterError(415, 'unsupported_media_type', 'Content-Type must be application/json.');
      }

      const payload = await readJson(request);
      const normalized = normalizePublishRequest(payload, String(request.headers['idempotency-key'] ?? ''), config);
      if (normalized.dryRun) {
        jsonResponse(response, 200, { ok: true, platform: 'x', id: 'dry-run', message: 'Dry run validated. No post was sent.' });
        return;
      }

      const initial = await requestXquik(config, new URL('x/tweets', config.apiBaseUrl), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': normalized.idempotencyKey,
        },
        body: JSON.stringify(normalized.requestBody),
      });
      const completed = await waitForTerminalWrite(initial, config);
      jsonResponse(response, 200, publishResult(completed));
    } catch (error) {
      const statusCode = error instanceof AdapterError ? error.statusCode : 500;
      const code = error instanceof AdapterError ? error.code : 'internal_error';
      const message = error instanceof AdapterError ? error.message : 'Adapter request failed.';
      jsonResponse(response, statusCode, { ok: false, error: code, message });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const host = process.env.TWEETCLAW_ADAPTER_HOST ?? '127.0.0.1';
  const port = positiveInteger(process.env.TWEETCLAW_ADAPTER_PORT, 8787, 'TWEETCLAW_ADAPTER_PORT');
  const server = createTweetClawOutboundAdapter();
  server.listen(port, host, () => {
    process.stdout.write(`TweetClaw outbound adapter listening on http://${host}:${port}\n`);
  });
}
