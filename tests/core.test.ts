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
});
