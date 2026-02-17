import { describe, expect, test } from "vitest";
import { upsertAgentInConfig } from "../src/lib/agent-config";

describe("agent-config", () => {
  test("adds new agent to empty list", () => {
    const cfg: any = { agents: { list: [] } };
    upsertAgentInConfig(cfg, { id: "a1", workspace: "/w1" });
    expect(cfg.agents.list).toHaveLength(1);
    expect(cfg.agents.list[0]).toMatchObject({ id: "a1", workspace: "/w1" });
  });
  test("updates existing agent in place", () => {
    const cfg: any = { agents: { list: [{ id: "a1", workspace: "/old" }] } };
    upsertAgentInConfig(cfg, { id: "a1", workspace: "/new" });
    expect(cfg.agents.list).toHaveLength(1);
    expect(cfg.agents.list[0].workspace).toBe("/new");
  });
});
