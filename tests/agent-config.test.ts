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

  test("deep-merges tools (preserves existing deny when snippet omits deny)", () => {
    const cfg: any = {
      agents: {
        list: [
          {
            id: "a1",
            workspace: "/w1",
            tools: { profile: "coding", allow: ["group:fs"], deny: ["exec"] },
          },
        ],
      },
    };

    upsertAgentInConfig(cfg, { id: "a1", workspace: "/w1", tools: { allow: ["group:web"] } });

    expect(cfg.agents.list[0].tools).toEqual({ profile: "coding", allow: ["group:web"], deny: ["exec"] });
  });

  test("allows explicit clearing when snippet sets deny:[]", () => {
    const cfg: any = {
      agents: {
        list: [{ id: "a1", workspace: "/w1", tools: { deny: ["exec"] } }],
      },
    };

    upsertAgentInConfig(cfg, { id: "a1", workspace: "/w1", tools: { deny: [] } });

    expect(cfg.agents.list[0].tools).toEqual({ deny: [] });
  });
});
