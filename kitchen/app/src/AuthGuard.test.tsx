import React from "react";
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { AuthGuard } from "./AuthGuard";
import * as api from "./api";
import * as authStore from "./authStore";

describe("AuthGuard", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchAuthStatus").mockResolvedValue({ authRequired: false });
    vi.spyOn(api, "fetchTeams").mockResolvedValue([]);
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(undefined);
  });

  test("shows loading initially then children when authRequired false", async () => {
    vi.spyOn(api, "fetchAuthStatus").mockResolvedValue({ authRequired: false });
    render(
      <AuthProvider>
        <MemoryRouter>
          <AuthGuard>
            <div>Protected</div>
          </AuthGuard>
        </MemoryRouter>
      </AuthProvider>
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(await screen.findByText("Protected")).toBeInTheDocument();
  });

  test("redirects to login when authRequired and no header", async () => {
    vi.spyOn(api, "fetchAuthStatus").mockResolvedValue({ authRequired: true });
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(undefined);
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/*" element={<AuthGuard><div>Protected</div></AuthGuard>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    expect(await screen.findByText("ClawRecipes Kitchen")).toBeInTheDocument();
  });

  test("shows LoginPage when at /login and auth required", async () => {
    vi.spyOn(api, "fetchAuthStatus").mockResolvedValue({ authRequired: true });
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(undefined);
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/*" element={<AuthGuard><div>Protected</div></AuthGuard>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    expect(await screen.findByText("ClawRecipes Kitchen")).toBeInTheDocument();
  });

  test("shows children when authRequired and valid header and fetchTeams succeeds", async () => {
    vi.spyOn(api, "fetchAuthStatus").mockResolvedValue({ authRequired: true });
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(btoa("u:p"));
    vi.spyOn(api, "fetchTeams").mockResolvedValue([]);
    render(
      <AuthProvider>
        <MemoryRouter>
          <AuthGuard>
            <div>Protected</div>
          </AuthGuard>
        </MemoryRouter>
      </AuthProvider>
    );
    expect(await screen.findByText("Protected")).toBeInTheDocument();
  });

  test("calls authStore.clear when fetchTeams fails", async () => {
    vi.spyOn(api, "fetchAuthStatus").mockResolvedValue({ authRequired: true });
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(btoa("u:p"));
    const clearSpy = vi.spyOn(authStore, "clear").mockImplementation(() => {});
    vi.mocked(api.fetchTeams).mockRejectedValueOnce(new Error("401"));
    render(
      <AuthProvider>
        <MemoryRouter>
          <Routes>
            <Route path="/*" element={<AuthGuard><div>Protected</div></AuthGuard>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    await vi.waitFor(() => expect(clearSpy).toHaveBeenCalled(), { timeout: 2000 });
  });

  test("falls through to no-auth when fetchAuthStatus throws", async () => {
    vi.spyOn(api, "fetchAuthStatus").mockRejectedValue(new Error("network"));
    render(
      <AuthProvider>
        <MemoryRouter>
          <AuthGuard>
            <div>Protected</div>
          </AuthGuard>
        </MemoryRouter>
      </AuthProvider>
    );
    expect(await screen.findByText("Protected")).toBeInTheDocument();
  });
});
