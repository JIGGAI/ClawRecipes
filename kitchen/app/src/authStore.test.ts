import { describe, expect, test, beforeEach, vi } from "vitest";
import * as authStore from "./authStore";

describe("authStore", () => {
  const storageKey = "kitchen-auth";
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
    });
    authStore.clear();
  });

  test("getAuthHeader returns undefined when empty", () => {
    expect(authStore.getAuthHeader()).toBeUndefined();
  });

  test("setAuthHeader and getAuthHeader roundtrip", () => {
    authStore.setAuthHeader("abc123");
    expect(authStore.getAuthHeader()).toBe("abc123");
  });

  test("getAuthHeader uses memory when set", () => {
    authStore.setAuthHeader("mem");
    storage[storageKey] = "stale";
    expect(authStore.getAuthHeader()).toBe("mem");
  });

  test("getAuthHeader falls back to storage when memory undefined", () => {
    storage[storageKey] = "from-storage";
    expect(authStore.getAuthHeader()).toBe("from-storage");
  });

  test("clear removes header", () => {
    authStore.setAuthHeader("x");
    authStore.clear();
    expect(authStore.getAuthHeader()).toBeUndefined();
  });

  test("setAuthHeader handles storage exception", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {},
    });
    authStore.setAuthHeader("val");
    expect(authStore.getAuthHeader()).toBe("val"); // memory still set
  });

  test("clear handles storage exception", () => {
    authStore.setAuthHeader("x");
    vi.stubGlobal("sessionStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {
        throw new Error("locked");
      },
    });
    authStore.clear();
    expect(authStore.getAuthHeader()).toBeUndefined(); // memory cleared
  });

  test("getAuthHeader handles storage getItem exception", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {},
      removeItem: () => {},
    });
    expect(authStore.getAuthHeader()).toBeUndefined();
  });
});
