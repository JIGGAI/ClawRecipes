import { describe, expect, test, vi } from 'vitest';
import { validateMatch } from '../server/middleware.js';

describe('validateMatch', () => {
  test('returns false when match is null', () => {
    const jsonMock = vi.fn();
    const res = { status: () => ({ json: jsonMock }), json: jsonMock };
    const result = validateMatch(null, res as never);
    expect(result).toBe(false);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'match must be a plain object' });
  });

  test('returns false when match is an array', () => {
    const res = { status: vi.fn(() => ({ json: vi.fn() })), json: vi.fn() };
    const result = validateMatch(['channel', 'x'], res as never);
    expect(result).toBe(false);
  });

  test('returns true for valid plain object', () => {
    const res = { status: vi.fn(() => ({ json: vi.fn() })), json: vi.fn() };
    const result = validateMatch({ channel: 'telegram' }, res as never);
    expect(result).toBe(true);
  });
});
