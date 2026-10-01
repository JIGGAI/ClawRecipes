import { describe, expect, test } from "vitest";
import {
  detectAgentsShape,
  readAgents,
  readDefaultAgentId,
  writeAgents,
  writeDefaultAgentId,
} from "../src/lib/agents-shape";

describe("agents-shape", () => {
  test("detects the keyed entries shape", () => {
    expect(detectAgentsShape({ agents: { entries: { main: {} } } })).toBe("entries");
  });

  test("detects the legacy list shape", () => {
    expect(detectAgentsShape({ agents: { list: [{ id: "main" }] } })).toBe("list");
  });

  test("an absent or malformed agents section defaults to entries", () => {
    expect(detectAgentsShape({})).toBe("entries");
    expect(detectAgentsShape(undefined)).toBe("entries");
    expect(detectAgentsShape({ agents: { list: null } as never })).toBe("entries");
  });

  test("entries win when both shapes are somehow present", () => {
    expect(detectAgentsShape({ agents: { entries: { a: {} }, list: [{ id: "b" }] } })).toBe("entries");
  });

  test("readAgents normalizes entries into records carrying id", () => {
    const agents = readAgents({
      agents: { entries: { main: { workspace: "/ws" }, zoe: { workspace: "/ws-zoe" } } },
    });
    expect(agents).toEqual([
      { id: "main", workspace: "/ws" },
      { id: "zoe", workspace: "/ws-zoe" },
    ]);
  });

  test("readAgents reads the legacy array unchanged", () => {
    const agents = readAgents({ agents: { list: [{ id: "main", workspace: "/ws" }] } });
    expect(agents).toEqual([{ id: "main", workspace: "/ws" }]);
  });

  test("readAgents drops entries without a usable id", () => {
    expect(readAgents({ agents: { list: [{ id: "" }, { workspace: "/ws" }, { id: "ok" }] } })).toEqual([
      { id: "ok" },
    ]);
  });

  test("readAgents is empty for a config with no agents", () => {
    expect(readAgents({})).toEqual([]);
    expect(readAgents(undefined)).toEqual([]);
  });

  test("writeAgents keys entries by id and strips the inline id", () => {
    const cfgObj: Record<string, unknown> = { agents: { entries: { main: { workspace: "/old" } } } };
    writeAgents(cfgObj, [{ id: "main", workspace: "/new" }, { id: "zoe", workspace: "/ws-zoe" }]);
    expect(cfgObj.agents).toEqual({
      entries: { main: { workspace: "/new" }, zoe: { workspace: "/ws-zoe" } },
    });
  });

  test("writeAgents keeps the legacy array when that is the shape in use", () => {
    const cfgObj: Record<string, unknown> = { agents: { list: [{ id: "main" }] } };
    writeAgents(cfgObj, [{ id: "main", workspace: "/ws" }]);
    expect(cfgObj.agents).toEqual({ list: [{ id: "main", workspace: "/ws" }] });
  });

  test("writeAgents removes a stale legacy array when writing entries", () => {
    // OpenClaw migrates a leftover agents.list back over agents.entries, so it must go.
    const cfgObj: Record<string, unknown> = { agents: { entries: {}, list: [{ id: "stale" }] } };
    writeAgents(cfgObj, [{ id: "main" }]);
    expect((cfgObj.agents as Record<string, unknown>).list).toBeUndefined();
    expect((cfgObj.agents as { entries: Record<string, unknown> }).entries.main).toEqual({});
  });

  test("readAgents/writeAgents round-trip preserves nested settings", () => {
    const cfgObj: Record<string, unknown> = {
      agents: {
        entries: {
          main: { identity: { name: "Seven" }, model: { primary: "openai/gpt-5.6-sol" }, tools: { profile: "full" } },
        },
      },
    };
    const before = JSON.stringify(cfgObj.agents);
    writeAgents(cfgObj, readAgents(cfgObj));
    expect(JSON.stringify(cfgObj.agents)).toBe(before);
  });

  test("readDefaultAgentId prefers agents.defaults.systemAgent.agentId", () => {
    expect(
      readDefaultAgentId({ agents: { defaults: { systemAgent: { agentId: "main" } }, entries: { main: {} } } })
    ).toBe("main");
  });

  test("readDefaultAgentId falls back to a legacy default marker", () => {
    expect(readDefaultAgentId({ agents: { list: [{ id: "a" }, { id: "b", default: true }] } })).toBe("b");
  });

  test("readDefaultAgentId is undefined when nothing marks a default", () => {
    expect(readDefaultAgentId({ agents: { entries: { main: {} } } })).toBeUndefined();
  });

  test("writeDefaultAgentId records systemAgent for the entries shape", () => {
    const cfgObj: Record<string, unknown> = { agents: { entries: { main: {}, zoe: {} } } };
    writeDefaultAgentId(cfgObj, "main");
    expect(cfgObj.agents).toMatchObject({ defaults: { systemAgent: { agentId: "main" } } });
    // No per-entry marker in this shape.
    expect((cfgObj.agents as { entries: Record<string, Record<string, unknown>> }).entries.main.default).toBeUndefined();
  });

  test("writeDefaultAgentId sets exactly one marker for the legacy shape", () => {
    const cfgObj: Record<string, unknown> = { agents: { list: [{ id: "a", default: true }, { id: "main" }] } };
    writeDefaultAgentId(cfgObj, "main");
    expect((cfgObj.agents as { list: Array<Record<string, unknown>> }).list).toEqual([
      { id: "a", default: false },
      { id: "main", default: true },
    ]);
  });

  test("writeDefaultAgentId preserves other keys under agents.defaults", () => {
    const cfgObj: Record<string, unknown> = {
      agents: { defaults: { workspace: "/ws", systemAgent: { other: 1 } }, entries: { main: {} } },
    };
    writeDefaultAgentId(cfgObj, "main");
    expect(cfgObj.agents).toMatchObject({
      defaults: { workspace: "/ws", systemAgent: { other: 1, agentId: "main" } },
    });
  });
});
