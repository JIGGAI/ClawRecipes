import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  createTweetClawApprovalReceipt,
  createTweetClawOutboundAdapter,
} from '../examples/adapters/tweetclaw-xquik/server.mjs';

const servers: Array<ReturnType<typeof createTweetClawOutboundAdapter>> = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

async function startAdapter(overrides: Record<string, unknown> = {}) {
  const server = createTweetClawOutboundAdapter({
    account: '@clawrecipes',
    adapterKey: 'adapter-key',
    apiKey: 'xq_test',
    approvalToken: 'approved-once',
    maxPollAttempts: 2,
    sleep: async () => {},
    ...overrides,
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

function publish(baseUrl: string, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return fetch(`${baseUrl}/v1/x/publish`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer adapter-key',
      'content-type': 'application/json',
      'idempotency-key': 'run-1:publish-x',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function approvalFor(requestBody: Record<string, unknown>) {
  return {
    receipt: createTweetClawApprovalReceipt({
      approvalToken: 'approved-once',
      idempotencyKey: 'run-1:publish-x',
      requestBody,
    }),
  };
}

describe('TweetClaw X outbound adapter', () => {
  test('publishes once and polls the durable write to completion', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'write-1',
        writeActionId: 'write-1',
        statusUrl: '/api/v1/x/write-actions/write-1',
        pollAfterMs: 1,
        terminal: false,
        success: false,
      }), { status: 202 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'write-1',
        writeActionId: 'write-1',
        action: 'create_tweet',
        statusUrl: '/api/v1/x/write-actions/write-1',
        terminal: true,
        success: true,
        tweetId: '123',
      }), { status: 200 }));
    const baseUrl = await startAdapter({ fetchImpl });

    const requestBody = {
      account: '@clawrecipes',
      text: 'Hello from ClawRecipes',
      media: ['https://example.com/image.png'],
    };
    const response = await publish(baseUrl, {
      text: requestBody.text,
      media: [{ type: 'image', url: requestBody.media[0] }],
      approval: approvalFor(requestBody),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({
      ok: true,
      platform: 'x',
      id: '123',
      url: 'https://x.com/i/status/123',
      message: 'Tweet published through the Xquik write-action API.',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [publishUrl, publishInit] = fetchImpl.mock.calls[0] as [URL, RequestInit];
    expect(publishUrl.toString()).toBe('https://xquik.com/api/v1/x/tweets');
    expect(publishInit.method).toBe('POST');
    expect(publishInit.headers).toMatchObject({
      'idempotency-key': 'run-1:publish-x',
      'x-api-key': 'xq_test',
      'xquik-api-contract': '2026-04-29',
    });
    expect(JSON.parse(String(publishInit.body))).toStrictEqual(requestBody);
    expect(String(fetchImpl.mock.calls[1]?.[0])).toBe('https://xquik.com/api/v1/x/write-actions/write-1');
  });

  test('requires adapter authentication, idempotency, and approval', async () => {
    const fetchImpl = vi.fn();
    const baseUrl = await startAdapter({ fetchImpl });

    const unauthorized = await publish(baseUrl, { text: 'hello' }, { authorization: 'Bearer wrong' });
    expect(unauthorized.status).toBe(401);

    const missingKey = await publish(
      baseUrl,
      { text: 'hello', approval: approvalFor({ account: '@clawrecipes', text: 'hello' }) },
      { 'idempotency-key': '' },
    );
    expect(missingKey.status).toBe(400);

    const missingApproval = await publish(baseUrl, { text: 'hello' });
    expect(missingApproval.status).toBe(403);

    const alteredAfterApproval = await publish(baseUrl, {
      text: 'changed text',
      approval: approvalFor({ account: '@clawrecipes', text: 'original text' }),
    });
    expect(alteredAfterApproval.status).toBe(403);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('validates media shape before contacting Xquik', async () => {
    const fetchImpl = vi.fn();
    const baseUrl = await startAdapter({ fetchImpl });

    const response = await publish(baseUrl, {
      text: 'hello',
      media: [
        { type: 'video', url: 'https://example.com/video.mp4' },
        { type: 'image', url: 'https://example.com/image.png' },
      ],
      approval: { receipt: 'invalid-before-media-validation' },
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, error: 'invalid_media' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('supports a no-network dry run', async () => {
    const fetchImpl = vi.fn();
    const baseUrl = await startAdapter({ fetchImpl });

    const response = await publish(baseUrl, {
      text: 'hello',
      dryRun: true,
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, id: 'dry-run' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('redacts upstream error bodies', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: 'secret-bearing upstream detail' }),
      { status: 401 },
    ));
    const baseUrl = await startAdapter({ fetchImpl });

    const response = await publish(baseUrl, {
      text: 'hello',
      approval: approvalFor({ account: '@clawrecipes', text: 'hello' }),
    });
    const result = await response.text();

    expect(response.status).toBe(502);
    expect(result).toContain('xquik_http_401');
    expect(result).not.toContain('secret-bearing upstream detail');
  });

  test('rejects oversized upstream responses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(`"${'x'.repeat(1024 * 1024)}"`, { status: 200 }));
    const baseUrl = await startAdapter({ fetchImpl });

    const response = await publish(baseUrl, {
      text: 'hello',
      approval: approvalFor({ account: '@clawrecipes', text: 'hello' }),
    });

    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ ok: false, error: 'xquik_response_too_large' });
  });
});
