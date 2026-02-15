import React from "react";
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import * as authStore from "./authStore";

function Consumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="user">{auth.user ?? ""}</span>
      <button type="button" onClick={() => auth.logout()}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => cleanup());

  test("useAuth throws when outside AuthProvider", () => {
    expect(() => render(<Consumer />)).toThrow("useAuth must be used within AuthProvider");
  });

  test("syncFromStore sets isAuthenticated when header present", () => {
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(btoa("admin:pass"));
    const { container } = render(<AuthProvider><Consumer /></AuthProvider>);
    expect(container.querySelector('[data-testid="authenticated"]')).toHaveTextContent("true");
    expect(container.querySelector('[data-testid="user"]')).toHaveTextContent("admin");
  });

  test("syncFromStore sets isAuthenticated false when no header", () => {
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(undefined);
    const { container } = render(<AuthProvider><Consumer /></AuthProvider>);
    expect(container.querySelector('[data-testid="authenticated"]')).toHaveTextContent("false");
  });

  test("syncFromStore uses decoded as user when header has no colon", () => {
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(btoa("solo"));
    const { container } = render(<AuthProvider><Consumer /></AuthProvider>);
    expect(container.querySelector('[data-testid="authenticated"]')).toHaveTextContent("true");
    expect(container.querySelector('[data-testid="user"]')).toHaveTextContent("solo");
  });

  test("syncFromStore uses decoded as user when header has no colon", () => {
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(btoa("solo"));
    const { container } = render(<AuthProvider><Consumer /></AuthProvider>);
    expect(container.querySelector('[data-testid="authenticated"]')).toHaveTextContent("true");
    expect(container.querySelector('[data-testid="user"]')).toHaveTextContent("solo");
  });

  test("syncFromStore handles invalid base64 in header", () => {
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue("not-valid-base64!!!");
    const { container } = render(<AuthProvider><Consumer /></AuthProvider>);
    expect(container.querySelector('[data-testid="authenticated"]')).toHaveTextContent("false");
  });

  test("logout clears state", async () => {
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(btoa("u:p"));
    vi.spyOn(authStore, "clear").mockImplementation(() => {});
    const { container } = render(<AuthProvider><Consumer /></AuthProvider>);
    expect(container.querySelector('[data-testid="authenticated"]')).toHaveTextContent("true");
    container.querySelector('button')!.click();
    expect(authStore.clear).toHaveBeenCalled();
    await vi.waitFor(() => expect(container.querySelector('[data-testid="authenticated"]')).toHaveTextContent("false"));
  });

  test("login succeeds and updates state", async () => {
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(undefined);
    vi.spyOn(authStore, "setAuthHeader").mockImplementation(() => {});
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    const TestLogin = () => {
      const { login, isAuthenticated, user } = useAuth();
      return (
        <div>
          <span data-testid="auth">{String(isAuthenticated)}</span>
          <span data-testid="u">{user ?? ""}</span>
          <button type="button" onClick={() => login("alice", "secret")}>Login</button>
        </div>
      );
    };
    const { container } = render(<AuthProvider><TestLogin /></AuthProvider>);
    container.querySelector('button')!.click();
    await vi.waitFor(() => {
      expect(container.querySelector('[data-testid="auth"]')).toHaveTextContent("true");
      expect(container.querySelector('[data-testid="u"]')).toHaveTextContent("alice");
    });
    expect(authStore.setAuthHeader).toHaveBeenCalledWith(btoa("alice:secret"));
  });

  test("login throws on 401", async () => {
    vi.spyOn(authStore, "getAuthHeader").mockReturnValue(undefined);
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve("") });
    const TestLogin = () => {
      const { login } = useAuth();
      const [err, setErr] = React.useState<string | null>(null);
      return (
        <button type="button" onClick={async () => { try { await login("x", "y"); } catch (e) { setErr(String(e)); } }}>
          {err ?? "Login"}
        </button>
      );
    };
    const { container } = render(<AuthProvider><TestLogin /></AuthProvider>);
    container.querySelector('button')!.click();
    await vi.waitFor(() => expect(container.querySelector('button')).toHaveTextContent("Invalid username or password"));
  });
});
