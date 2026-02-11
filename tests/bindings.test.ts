import { describe, expect, test } from 'vitest';
import { upsertBindingInConfig } from '../src/lib/bindings';

describe('bindings precedence', () => {
  test('most-specific (peer match) bindings are inserted first', () => {
    const cfg: any = { bindings: [] };

    upsertBindingInConfig(cfg, {
      agentId: 'a',
      match: { channel: 'telegram' },
      to: { agentId: 'x' },
    } as any);

    upsertBindingInConfig(cfg, {
      agentId: 'a',
      match: { channel: 'telegram', peer: 'user123' },
      to: { agentId: 'y' },
    } as any);

    expect(cfg.bindings).toHaveLength(2);
    expect(cfg.bindings[0].match.peer).toBe('user123');
  });
});
