import { describe, expect, test } from 'vitest';
import { formatReport, summarize } from '../scripts/memory-injection-report.mjs';

describe('memory injection report', () => {
  test('calculates percentiles, cap hits, drops, and team volume', () => {
    const summary = summarize([
      { teamId: 'alpha', tokens_injected: 100, items_dropped_by_cap: 0, token_cap: 2000 },
      { teamId: 'beta', tokens_injected: 2000, items_dropped_by_cap: 1, token_cap: 2000 },
      { teamId: 'alpha', tokens_injected: 300, items_dropped_by_cap: 0, token_cap: 2000 },
      { teamId: 'beta', tokens_injected: 400, items_dropped_by_cap: 3, token_cap: 2000 },
    ]);

    expect(summary).toMatchObject({
      runs: 4,
      p50: 300,
      p95: 2000,
      capHitPercent: 50,
      averageDropped: 1,
    });
    expect(summary.teams).toEqual([
      { teamId: 'beta', tokens: 2400, runs: 2 },
      { teamId: 'alpha', tokens: 400, runs: 2 },
    ]);

    const report = formatReport(summary, ['2026-10-02', '2026-10-08'], 7, 1);
    expect(report).toContain('Tokens injected: p50 300, p95 2000');
    expect(report).toContain('Runs hitting cap: 50.0%');
    expect(report).toContain('Average items dropped by cap: 1.00');
    expect(report).toContain('beta: 2400 tokens across 2 runs');
    expect(report).toContain('1 malformed lines skipped');
  });

  test('formats an empty report', () => {
    const summary = summarize([]);
    const report = formatReport(summary, ['2026-10-08'], 0, 0);
    expect(report).toContain('Runs: 0');
    expect(report).toContain('(no data)');
  });
});
