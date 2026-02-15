import React from "react";
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../AuthContext";
import { LoginPage } from "./LoginPage";
import * as authStore from "../authStore";

describe("LoginPage", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(undefined);
    vi.spyOn(authStore, "setAuthHeader").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  async function renderAndFill(user: string, pass: string) {
    const userEv = userEvent.setup();
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );
    await userEv.type(screen.getByLabelText(/username/i), user);
    await userEv.type(screen.getByLabelText(/password/i), pass);
    return userEv;
  }

  test("renders sign in form", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );
    expect(screen.getByText("ClawRecipes Kitchen")).toBeInTheDocument();
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  test("successful login navigates to board", async () => {
    const userEv = userEvent.setup();
    const { container } = render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );
    await userEv.type(container.querySelector('input[type="text"]')!, "admin");
    await userEv.type(container.querySelector('input[type="password"]')!, "secret");
    await userEv.click(container.querySelector('button[type="submit"]')!);
    expect(authStore.setAuthHeader).toHaveBeenCalledWith(btoa("admin:secret"));
  });

  test("login failure shows error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve("") });
    const userEv = userEvent.setup();
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );
    await userEv.type(container.querySelector('input[type="text"]')!, "bad");
    await userEv.type(container.querySelector('input[type="password"]')!, "bad");
    await userEv.click(container.querySelector('button[type="submit"]')!);
    expect(await vi.waitFor(() => container.querySelector('.alert-danger'))).toHaveTextContent("Invalid username or password");
  });

  test("clears password on failed login", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve("Server error") });
    const userEv = userEvent.setup();
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );
    const passInput = container.querySelector('input[type="password"]')!;
    await userEv.type(container.querySelector('input[type="text"]')!, "x");
    await userEv.type(passInput, "y");
    await userEv.click(container.querySelector('button[type="submit"]')!);
    await vi.waitFor(() => expect(container.querySelector('.alert-danger')).toBeInTheDocument());
    expect(passInput).toHaveValue("");
  });
});
