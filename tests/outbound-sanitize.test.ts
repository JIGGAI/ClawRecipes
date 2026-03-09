import { describe, expect, test } from 'vitest';
import { sanitizeOutboundPostText } from '../src/lib/workflows/outbound-sanitize';

describe('sanitizeOutboundPostText', () => {
  test('removes common disclaimer lines and preserves the rest', () => {
    const input = [
      'Draft only — do not post without approval.',
      '',
      'Hook line',
      '',
      'Body line 1',
      'Body line 2',
    ].join('\n');

    expect(sanitizeOutboundPostText(input)).toBe(['Hook line', '', 'Body line 1', 'Body line 2'].join('\n'));
  });

  test('is whitespace-stable and trims extra blank lines', () => {
    const input = [
      'Internal only',
      '',
      '',
      'Hello world',
      '',
      '',
      '',
      'Do not publish',
      '',
    ].join('\n');

    expect(sanitizeOutboundPostText(input)).toBe('Hello world');
  });
});
