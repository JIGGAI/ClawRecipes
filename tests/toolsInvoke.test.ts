import { afterEach, describe, expect, test, vi } from "vitest";
import { toolsInvoke, TOOLS_INVOKE_TIMEOUT_MS, RETRY_DELAY_BASE_MS } from "../src/toolsInvoke";

describe("toolsInvoke", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("exports constants for testability", () => {
    expect(TOOLS_INVOKE_TIMEOUT_MS).toBe(120_000);
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

  test("uses args.timeoutMs + 30s buffer for fetch abort timer when provided", async () => {
    // Workflow LLM nodes pass timeoutMs in args (e.g. 900_000 for the weekly
    // packet draft). Before this fix, the fetch was hardcoded at 120s and
    // aborted long-running LLM calls even though the node config said 15 min.
    const delays: number[] = [];
    const realSetTimeout = globalThis.setTimeout;
    vi.stubGlobal("setTimeout", (fn: () => void, delay: number) => {
      delays.push(delay);
      return realSetTimeout(fn, delay);
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: { ok: true } }),
      })
    );
    const api = { config: { gateway: { port: 18789, auth: { token: "secret" } } } };
    await toolsInvoke(api, {
      tool: "llm-task",
      action: "json",
      args: { prompt: "x", timeoutMs: 900_000 },
    });
    // 900_000 + 30_000 buffer for HTTP roundtrip/gateway overhead
    expect(delays).toContain(930_000);
  });

  test("falls back to default TOOLS_INVOKE_TIMEOUT_MS when args.timeoutMs missing", async () => {
    const delays: number[] = [];
    const realSetTimeout = globalThis.setTimeout;
    vi.stubGlobal("setTimeout", (fn: () => void, delay: number) => {
      delays.push(delay);
      return realSetTimeout(fn, delay);
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: { ok: true } }),
      })
    );
    const api = { config: { gateway: { port: 18789, auth: { token: "secret" } } } };
    await toolsInvoke(api, { tool: "cron", args: { action: "list" } });
    expect(delays).toContain(TOOLS_INVOKE_TIMEOUT_MS);
  });
});
