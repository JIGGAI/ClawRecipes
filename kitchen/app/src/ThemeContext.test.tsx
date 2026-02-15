import React from 'react';
import { describe, expect, test, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from './ThemeContext';

afterEach(() => cleanup());

const Consumer = () => {
  const { preference, setPreference } = useTheme();
  return (
    <div>
      <span data-testid="preference">{preference}</span>
      <button onClick={() => setPreference('dark')}>Set Dark</button>
    </div>
  );
};

describe('ThemeContext', () => {
  test('ThemeProvider provides default preference', () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('preference')).toHaveTextContent(/light|dark|auto/);
  });

  test('setPreference updates preference', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );
    await user.click(screen.getByText('Set Dark'));
    expect(screen.getByTestId('preference')).toHaveTextContent('dark');
  });

  test('useTheme throws when outside provider', () => {
    expect(() => render(<Consumer />)).toThrow(/ThemeProvider/);
  });

  test('getStoredPreference returns auto when localStorage has invalid value', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid');
    render(<ThemeProvider><Consumer /></ThemeProvider>);
    expect(screen.getByTestId('preference')).toHaveTextContent('auto');
  });

  test('resolveTheme returns dark when preference auto and matchMedia prefers dark', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('auto');
    const addListener = vi.fn();
    const removeListener = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn(() => ({ matches: true, media: '', addEventListener: addListener, removeEventListener: removeListener, addListener, removeListener, dispatchEvent: vi.fn() })),
    });
    render(<ThemeProvider><Consumer /></ThemeProvider>);
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  test('matchMedia change handler updates theme when preference is auto', () => {
    const mq = { matches: false, media: '', addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('auto');
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn(() => mq),
    });
    render(<ThemeProvider><Consumer /></ThemeProvider>);
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
    const handler = (mq.addEventListener as ReturnType<typeof vi.fn>).mock.calls[0]?.[1];
    mq.matches = true;
    handler?.();
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  test('resolveTheme returns light when preference auto and matchMedia prefers light', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('auto');
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn(() => ({ matches: false, media: '', addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() })),
    });
    render(<ThemeProvider><Consumer /></ThemeProvider>);
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });
});
