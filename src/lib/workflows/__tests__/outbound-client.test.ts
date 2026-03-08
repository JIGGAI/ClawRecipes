import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { outboundPublish } from '../outbound-client';

function mockFetchOnce(res: { ok: boolean; status: number; statusText: string; body: string }) {
  const fetchMock = vi.fn(async () => ({
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    text: async () => res.body,
  })) as any;
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('outboundPublish', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs to /v1/:platform/publish with auth + idempotency headers', async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      body: JSON.stringify({ ok: true, platform: 'x', id: '1', url: 'https://x.com/1' }),
    });

    const result = await outboundPublish({
      baseUrl: 'http://localhost:8787/',
      apiKey: 'test-key',
      platform: 'x',
      idempotencyKey: 'run:node',
      request: {
        text: 'hello',
        runContext: { teamId: 't', workflowId: 'w', workflowRunId: 'r', nodeId: 'n' },
      },
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8787/v1/x/publish');
    expect(init.method).toBe('POST');
    expect(init.headers.authorization).toBe('Bearer test-key');
    expect(init.headers['idempotency-key']).toBe('run:node');
    expect(init.headers['content-type']).toBe('application/json');
  });

  it('throws with status and response text on non-2xx', async () => {
    mockFetchOnce({
      ok: false,
      status: 501,
      statusText: 'Not Implemented',
      body: JSON.stringify({ ok: false, error: 'not_implemented', platform: 'youtube' }),
    });

    await expect(
      outboundPublish({
        baseUrl: 'http://localhost:8787',
        apiKey: 'test-key',
        platform: 'youtube',
        idempotencyKey: 'abc',
        request: {
          text: 'hello',
          runContext: { teamId: 't', workflowId: 'w', workflowRunId: 'r', nodeId: 'n' },
          dryRun: true,
        },
      }),
    ).rejects.toThrow(/501 Not Implemented/);
  });
});
