import React from 'react';
import { describe, expect, test, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '../ThemeContext';
import { AuthProvider } from '../AuthContext';
import { DemoProvider } from '../DemoContext';
import { Layout } from './Layout';
import * as authStore from '../authStore';

function renderLayout(initialEntries: string[]) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <DemoProvider>
          <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="board" element={<div>Board</div>} />
              <Route path="recipes" element={<div>Recipes</div>} />
              <Route path="bindings" element={<div>Bindings</div>} />
              <Route path="*" element={<div>Other</div>} />
            </Route>
          </Routes>
          </MemoryRouter>
        </DemoProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe('Layout', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  test('sets document.title to Board when at /board', () => {
    renderLayout(['/board']);
    expect(document.title).toBe('Board – ClawRecipes Kitchen');
  });

  test('sets document.title to Recipes when at /recipes', () => {
    renderLayout(['/recipes']);
    expect(document.title).toBe('Recipes – ClawRecipes Kitchen');
  });

  test('sets document.title to Bindings when at /bindings', () => {
    renderLayout(['/bindings']);
    expect(document.title).toBe('Bindings – ClawRecipes Kitchen');
  });

  test('sets document.title to base when at other path', () => {
    renderLayout(['/other']);
    expect(document.title).toBe('ClawRecipes Kitchen');
  });

  test('does not show Logout button when not authenticated', () => {
    vi.spyOn(authStore, 'getAuthHeader').mockReturnValue(undefined);
    renderLayout(['/board']);
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  test('shows Logout button when authenticated and triggers logout on click', async () => {
    const user = userEvent.setup();
    vi.spyOn(authStore, 'getAuthHeader').mockReturnValue(btoa('u:p'));
    vi.spyOn(authStore, 'clear').mockImplementation(() => {});
    renderLayout(['/board']);
    const logoutBtn = screen.getByText('Logout');
    expect(logoutBtn).toBeInTheDocument();
    await user.click(logoutBtn);
    expect(authStore.clear).toHaveBeenCalled();
  });

  test('shows demo badge and Exit demo button when demo mode', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <AuthProvider>
          <DemoProvider initialDemoMode>
            <MemoryRouter initialEntries={['/board']}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route path="board" element={<div>Board</div>} />
                  <Route path="*" element={<div>Other</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </DemoProvider>
        </AuthProvider>
      </ThemeProvider>
    );
    expect(screen.getByText('demo')).toBeInTheDocument();
    const exitBtn = screen.getByText('Exit demo');
    await user.click(exitBtn);
    expect(screen.queryByText('Exit demo')).not.toBeInTheDocument();
  });
});
