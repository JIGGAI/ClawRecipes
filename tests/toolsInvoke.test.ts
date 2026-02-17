import { afterEach, describe, expect, test, vi } from "vitest";
import { toolsInvoke, TOOLS_INVOKE_TIMEOUT_MS, RETRY_DELAY_BASE_MS } from "../src/toolsInvoke";

describe("toolsInvoke", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("exports constants for testability", () => {
    expect(TOOLS_INVOKE_TIMEOUT_MS).toBe(30_000);
    expect(RETRY_DELAY_BASE_MS).toBe(150);
  });

  test("throws when gateway.auth.token is missing", async () => {
    const api = { config: { gateway: { port: 18789 } } };
    await expect(toolsInvoke(api, { tool: "cron", args: { action: "list" } })).rejects.toThrow(
      "Missing gateway.auth.token in openclaw config"
    );
  });

  test("returns result on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: { jobs: [] } }),
      })
    );
    const api = { config: { gateway: { port: 18789, auth: { token: "secret" } } } };
    const result = await toolsInvoke(api, { tool: "cron", args: { action: "list" } });
    expect(result).toEqual({ jobs: [] });
  });

  test("throws on HTTP error response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ ok: false, error: "Internal error" }),
      })
    );
    const api = { config: { gateway: { port: 18789, auth: { token: "secret" } } } };
    await expect(toolsInvoke(api, { tool: "cron", args: {} })).rejects.toThrow("Internal error");
  });

  test("retries on failure (3 attempts)", async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: { success: true } }),
      });
    vi.stubGlobal("fetch", mockFetch);
    const api = { config: { gateway: { port: 18789, auth: { token: "secret" } } } };
    const result = await toolsInvoke(api, { tool: "cron", args: {} });
    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
