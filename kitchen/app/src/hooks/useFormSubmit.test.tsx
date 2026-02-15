import { describe, expect, test } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormSubmit } from './useFormSubmit';

describe('useFormSubmit', () => {
  test('submit catches errors and sets error state', async () => {
    const { result } = renderHook(() => useFormSubmit());
    await act(async () => {
      const ok = await result.current.submit(async () => {
        throw new Error('Submit failed');
      });
      expect(ok).toBe(null);
    });
    expect(result.current.error).toBe('Error: Submit failed');
  });

  test('clearError resets error state', async () => {
    const { result } = renderHook(() => useFormSubmit());
    await act(async () => {
      await result.current.submit(async () => {
        throw new Error('Fail');
      });
    });
    expect(result.current.error).not.toBeNull();
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
