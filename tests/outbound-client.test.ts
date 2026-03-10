import { createServer } from 'node:http';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { outboundPublish } from '../src/lib/workflows/outbound-client';

let baseUrl = '';
let closeServer: (() => Promise<void>) | null = null;

beforeAll(async () => {
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += String(chunk)));
    req.on('end', () => {
      try {
        expect(req.method).toBe('POST');
        expect(req.url).toBe('/v1/x/publish');
        expect(req.headers['authorization']).toBe('Bearer test-key');
        expect(req.headers['idempotency-key']).toBe('idem-123');

        const parsed = JSON.parse(body) as any;
        expect(['hello', 'bad']).toContain(parsed.text);
        expect(parsed.runContext.teamId).toBe('team_1');

        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        if (parsed.text === 'bad') {
          res.end(JSON.stringify({ ok: false, platform: 'x', error: 'not_configured', message: 'missing token' }));
        } else {
          res.end(JSON.stringify({ ok: true, platform: 'x', id: '1', url: 'https://x.com/1' }));
        }
      } catch (e: any) {
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.end(e?.stack || String(e));
      }
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('Unexpected server address');
  baseUrl = `http://127.0.0.1:${addr.port}`;

  closeServer = async () => {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  };
});

afterAll(async () => {
  await closeServer?.();
});

test('outboundPublish posts JSON with auth + idempotency header', async () => {
  const res = await outboundPublish({
    baseUrl,
    apiKey: 'test-key',
    platform: 'x',
    idempotencyKey: 'idem-123',
    request: {
      text: 'hello',
      runContext: { teamId: 'team_1', workflowId: 'wf', workflowRunId: 'run', nodeId: 'node' },
    },
  });

  expect(res.ok).toBe(true);
  expect(res.platform).toBe('x');
});


test('outboundPublish throws when service returns 200 but ok=false', async () => {
  await expect(
    outboundPublish({
      baseUrl,
      apiKey: 'test-key',
      platform: 'x',
      idempotencyKey: 'idem-123',
      request: {
        text: 'bad',
        runContext: { teamId: 'team_1', workflowId: 'wf', workflowRunId: 'run', nodeId: 'node' },
      },
    }),
  ).rejects.toThrow(/ok=false/);
});
