import React from 'react';
import { describe, expect, test, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { DemoProvider } from './DemoContext';
import { Layout } from './components/Layout';
import BoardPage from './pages/BoardPage';
import RecipesPage from './pages/RecipesPage';
import App, { LoginRedirect } from './App';

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>();
  return {
    ...actual,
    fetchAuthStatus: vi.fn().mockResolvedValue({ authRequired: false }),
  };
});
vi.mock('./pages/BoardPage', () => {
  const C = () => <div>BoardPage</div>;
  return { BoardPage: C, default: C };
});
vi.mock('./pages/RecipesPage', () => {
  const C = () => <div>RecipesPage</div>;
  return { RecipesPage: C, default: C };
});
vi.mock('./pages/BindingsPage', () => {
  const C = () => <div>BindingsPage</div>;
  return { BindingsPage: C, default: C };
});

afterEach(() => cleanup());

describe('App', () => {
  test('renders App component', async () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );
    expect(await screen.findByText('BoardPage')).toBeInTheDocument();
  });
});

describe('App routes', () => {
  test('LoginRedirect at /login navigates to board', async () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <DemoProvider>
            <MemoryRouter initialEntries={['/login']}>
              <Routes>
                <Route path="/login" element={<LoginRedirect />} />
                <Route path="/board" element={<BoardPage />} />
                <Route path="*" element={<Navigate to="/board" replace />} />
              </Routes>
            </MemoryRouter>
          </DemoProvider>
        </AuthProvider>
      </ThemeProvider>
    );
    expect(await screen.findByText('BoardPage')).toBeInTheDocument();
  });

  test('renders BoardPage at /board', () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <DemoProvider>
            <MemoryRouter initialEntries={['/board']}>
              <Routes>
                <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/board" replace />} />
                <Route path="board" element={<BoardPage />} />
                <Route path="recipes" element={<RecipesPage />} />
                <Route path="*" element={<Navigate to="/board" replace />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </DemoProvider>
        </AuthProvider>
      </ThemeProvider>
    );
    expect(screen.getByText('BoardPage')).toBeInTheDocument();
  });

  test('renders RecipesPage at /recipes', () => {
    render(
      <ThemeProvider>
        <AuthProvider>
          <DemoProvider>
            <MemoryRouter initialEntries={['/recipes']}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route path="board" element={<BoardPage />} />
                  <Route path="recipes" element={<RecipesPage />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </DemoProvider>
        </AuthProvider>
      </ThemeProvider>
    );
    expect(screen.getByText('RecipesPage')).toBeInTheDocument();
  });
});
