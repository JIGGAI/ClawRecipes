import { describe, expect, test } from "vitest";
import { __internal } from "../index";

describe("recipes plugin core behaviors", () => {
  test("agent ordering: main is first and is the only default", () => {
    const cfgObj: any = {
      agents: {
        defaults: { workspace: "~/.openclaw/workspace" },
        list: [
          { id: "a", default: true },
          { id: "main", default: false },
          { id: "b" },
        ],
      },
    };

    __internal.ensureMainFirstInAgentsList(cfgObj, { config: { agents: { defaults: { workspace: "~/.openclaw/workspace" } } } } as any);

    expect(cfgObj.agents.list[0].id).toBe("main");
    expect(cfgObj.agents.list[0].default).toBe(true);
    expect(cfgObj.agents.list.filter((a: any) => a.default).map((a: any) => a.id)).toEqual(["main"]);
  });

  test("bindings precedence: peer-specific bindings are inserted before generic ones", () => {
    const cfgObj: any = {
      bindings: [
        { agentId: "x", match: { channel: "telegram" } },
      ],
    };

    const res = __internal.upsertBindingInConfig(cfgObj, {
      agentId: "y",
      match: { channel: "telegram", peer: { kind: "dm", id: "123" } },
    });

    expect(res.changed).toBe(true);
    expect(cfgObj.bindings[0].agentId).toBe("y");
    expect(cfgObj.bindings[0].match.peer.id).toBe("123");
  });

  test("ticket patching is idempotent (Owner + Status)", () => {
    const md = `# 0001-example\n\n## Context\n...\n`;

    const once = __internal.patchTicketStatus(__internal.patchTicketOwner(md, "test"), "testing");
    const twice = __internal.patchTicketStatus(__internal.patchTicketOwner(once, "test"), "testing");

    expect(twice).toBe(once);
    expect(once).toContain("Owner: test");
    expect(once).toContain("Status: testing");
  });

  test("ensureMainFirstInAgentsList creates main in the current entries shape when agents are missing", () => {
    const cfgObj: any = {};
    __internal.ensureMainFirstInAgentsList(cfgObj, { config: { agents: { defaults: { workspace: "/ws" } } } } as any);
    expect(cfgObj.agents).toBeDefined();
    expect(cfgObj.agents.entries.main).toBeDefined();
    expect(cfgObj.agents.entries.main.workspace).toBe("/ws");
    // The id is the key in this shape, and the per-entry default marker is retired.
    expect(cfgObj.agents.entries.main.id).toBeUndefined();
    expect(cfgObj.agents.entries.main.default).toBeUndefined();
    expect(cfgObj.agents.defaults.systemAgent.agentId).toBe("main");
    expect(cfgObj.agents.list).toBeUndefined();
  });

  test("ensureMainFirstInAgentsList uses the entries shape when list is not a usable array", () => {
    const cfgObj: any = { agents: { list: null } };
    __internal.ensureMainFirstInAgentsList(cfgObj, { config: { agents: { defaults: { workspace: "/ws" } } } } as any);
    expect(cfgObj.agents.entries.main).toBeDefined();
    expect(cfgObj.agents.defaults.systemAgent.agentId).toBe("main");
    // A malformed legacy key must not survive, or OpenClaw migrates it back over entries.
    expect(cfgObj.agents.list).toBeUndefined();
  });

  test("ensureMainFirstInAgentsList preserves existing entries and their settings", () => {
    const cfgObj: any = {
      agents: {
        defaults: { workspace: "/ws" },
        entries: {
          main: { workspace: "/ws", identity: { name: "Seven" }, tools: { profile: "full" } },
          other: { workspace: "/ws-other", identity: { name: "Other" } },
        },
      },
    };
    __internal.ensureMainFirstInAgentsList(cfgObj, { config: { agents: { defaults: { workspace: "/ws" } } } } as any);
    expect(cfgObj.agents.entries.main.identity.name).toBe("Seven");
    expect(cfgObj.agents.entries.main.tools.profile).toBe("full");
    expect(cfgObj.agents.entries.other.identity.name).toBe("Other");
    expect(Object.keys(cfgObj.agents.entries).sort()).toEqual(["main", "other"]);
  });

  test("ensureMainFirstInAgentsList is idempotent on an entries config", () => {
    const cfgObj: any = {
      agents: { defaults: { workspace: "/ws", systemAgent: { agentId: "main" } }, entries: { main: { workspace: "/ws", sandbox: { mode: "off" } } } },
    };
    const api = { config: { agents: { defaults: { workspace: "/ws" } } } } as any;
    __internal.ensureMainFirstInAgentsList(cfgObj, api);
    const first = JSON.stringify(cfgObj.agents);
    __internal.ensureMainFirstInAgentsList(cfgObj, api);
    // A second pass must be a no-op, or the gateway_start hook rewrites config on every start.
    expect(JSON.stringify(cfgObj.agents)).toBe(first);
  });

  test("removeBindingsInConfig removes matching binding by agentId and match", () => {
    const cfgObj: any = {
      bindings: [
        { agentId: "x", match: { channel: "telegram" } },
        { agentId: "y", match: { channel: "telegram", peer: { kind: "dm", id: "123" } } },
      ],
    };
    const res = __internal.removeBindingsInConfig(cfgObj, {
      agentId: "y",
      match: { channel: "telegram", peer: { kind: "dm", id: "123" } },
    });
    expect(res.removedCount).toBe(1);
    expect(res.removed[0].agentId).toBe("y");
    expect(cfgObj.bindings).toHaveLength(1);
    expect(cfgObj.bindings[0].agentId).toBe("x");
  });

  test("removeBindingsInConfig removes by match only when agentId omitted", () => {
    const cfgObj: any = {
      bindings: [
        { agentId: "a", match: { channel: "slack" } },
        { agentId: "b", match: { channel: "slack" } },
      ],
    };
    const res = __internal.removeBindingsInConfig(cfgObj, { match: { channel: "slack" } });
    expect(res.removedCount).toBe(2);
    expect(cfgObj.bindings).toHaveLength(0);
  });

  test("removeBindingsInConfig initializes bindings when missing", () => {
    const cfgObj: any = {};
    const res = __internal.removeBindingsInConfig(cfgObj, { match: { channel: "x" } });
    expect(res.removedCount).toBe(0);
    expect(cfgObj.bindings).toEqual([]);
  });
});
