import { test, expect } from 'vitest';
import { buildKitchenWorkflowReviewUrl, getKitchenBaseUrl } from '../src/lib/workflows/kitchen-review-url';

function makeApi(config: unknown) {
  return { config } as unknown;
}

test('prefers CK_BASE_URL from config env vars', () => {
  const api = makeApi({
    env: { vars: { CK_BASE_URL: 'https://kitchen.example.com/' } },
    plugins: { entries: { kitchen: { config: { host: '127.0.0.1', port: 7777 } } } },
  });

  expect(getKitchenBaseUrl(api as never)).toBe('https://kitchen.example.com');
  expect(buildKitchenWorkflowReviewUrl(api as never, 'team-a', 'wf-1')).toBe('https://kitchen.example.com/teams/team-a/workflows/wf-1');
});

test('falls back to kitchen plugin host and port when CK_BASE_URL is absent', () => {
  const api = makeApi({
    plugins: { entries: { kitchen: { config: { host: '100.103.210.102', port: 7777 } } } },
  });

  expect(getKitchenBaseUrl(api as never)).toBe('http://100.103.210.102:7777');
});

test('falls back to localhost when kitchen config is unavailable', () => {
  const api = makeApi({});
  expect(buildKitchenWorkflowReviewUrl(api as never, 'team id', 'workflow/id')).toBe('http://localhost:7777/teams/team%20id/workflows/workflow%2Fid');
});
