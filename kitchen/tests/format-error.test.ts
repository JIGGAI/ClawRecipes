import { describe, expect, test } from 'vitest';
import { formatError } from '../server/index.js';
import { getErrorStatus } from '../server/validation.js';

describe('formatError', () => {
  test('maps ETIMEDOUT code to "Operation timed out"', () => {
    expect(formatError({ code: 'ETIMEDOUT' })).toBe('Operation timed out');
  });

  test('maps message containing ETIMEDOUT to "Operation timed out"', () => {
    expect(formatError(new Error('connect ETIMEDOUT'))).toBe('Operation timed out');
  });

  test('returns error message for other errors', () => {
    expect(formatError(new Error('other'))).toBe('other');
  });

  test('handles non-Error values', () => {
    expect(formatError('string error')).toBe('string error');
  });

  test('handles null and undefined', () => {
    expect(formatError(null)).toBe('null');
    expect(formatError(undefined)).toBe('undefined');
  });

  test('sanitizes path in ENOENT error when NODE_ENV=production', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(formatError(new Error("ENOENT: no such file or directory, open '/tmp/secret'"))).toBe('File not found');
      expect(formatError(new Error('ENOENT: something failed'))).toBe('File not found');
      expect(formatError(new Error("Error: open '/home/user/secret.dat'"))).toBe('File not found');
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  test('getErrorStatus returns 400 for Invalid/Missing/required', () => {
    expect(getErrorStatus(new Error('Invalid format'))).toBe(400);
    expect(getErrorStatus(new Error('Missing field'))).toBe(400);
    expect(getErrorStatus(new Error('Field required'))).toBe(400);
  });

  test('getErrorStatus returns 502 for other errors', () => {
    expect(getErrorStatus(new Error('CLI failed'))).toBe(502);
  });

  test('returns raw message for ENOENT when not in production', () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      const msg = "ENOENT: no such file or directory, open '/tmp/secret'";
      expect(formatError(new Error(msg))).toBe(msg);
    } finally {
      process.env.NODE_ENV = original;
    }
  });
});
