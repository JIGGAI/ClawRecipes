import { describe, expect, test } from "vitest";
import { upsertBindingInConfig } from "../src/lib/recipes-config";

describe("bindings precedence", () => {
  test("most-specific (peer match) bindings are inserted first", () => {
    const cfg: Record<string, unknown> = { bindings: [] };

    upsertBindingInConfig(cfg, {
      agentId: "a",
      match: { channel: "telegram" },
    });

    upsertBindingInConfig(cfg, {
      agentId: "a",
      match: { channel: "telegram", peer: { kind: "dm", id: "user123" } },
    });

    expect((cfg.bindings as unknown[]).length).toBe(2);
    expect((cfg.bindings as { match: { peer?: { id: string } } }[])[0].match.peer?.id).toBe("user123");
  });

  test("upsert returns already-present when binding exists", () => {
    const cfg: Record<string, unknown> = {
      bindings: [{ agentId: "a", match: { channel: "telegram" } }],
    };
    const res = upsertBindingInConfig(cfg, {
      agentId: "a",
      match: { channel: "telegram" },
    });
    expect(res).toEqual({ changed: false, note: "already-present" });
    expect((cfg.bindings as unknown[]).length).toBe(1);
  });
});
