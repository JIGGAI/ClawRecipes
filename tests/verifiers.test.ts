import { describe, expect, test } from "vitest";
import {
  verifyJsonParse,
  verifyRequiredFields,
  verifyRegex,
  verifyLength,
  verifyEnum,
  verifyTemporalEdge,
  verifyArrayItems,
  all,
  any,
} from "../src/lib/workflows/verifiers";

describe("verifiers/verifyJsonParse", () => {
  test("parses valid JSON", () => {
    const r = verifyJsonParse('{"a":1}');
    expect(r.ok).toBe(true);
    expect(r.details?.parsed).toEqual({ a: 1 });
  });

  test("fails on invalid JSON", () => {
    const r = verifyJsonParse("not json");
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/invalid JSON/);
  });

  test("fails on non-string input", () => {
    // @ts-expect-error intentional
    const r = verifyJsonParse(42);
    expect(r.ok).toBe(false);
  });
});

describe("verifiers/verifyRequiredFields", () => {
  test("passes when all required fields present", () => {
    const r = verifyRequiredFields({ a: 1, b: "x" }, ["a", "b"]);
    expect(r.ok).toBe(true);
  });

  test("fails and reports missing fields", () => {
    const r = verifyRequiredFields({ a: 1, b: "" }, ["a", "b", "c"]);
    expect(r.ok).toBe(false);
    expect(r.details?.missing).toEqual(["b", "c"]);
  });

  test("rejects arrays and null", () => {
    expect(verifyRequiredFields([], ["a"]).ok).toBe(false);
    expect(verifyRequiredFields(null, ["a"]).ok).toBe(false);
  });

  test("treats null and undefined as missing but 0 and false as present", () => {
    const r = verifyRequiredFields({ a: 0, b: false, c: null }, ["a", "b", "c"]);
    expect(r.ok).toBe(false);
    expect(r.details?.missing).toEqual(["c"]);
  });
});

describe("verifiers/verifyRegex", () => {
  test("passes on match", () => {
    expect(verifyRegex("abc123", /^[a-z]+\d+$/).ok).toBe(true);
  });
  test("fails on mismatch", () => {
    const r = verifyRegex("ABC", /^[a-z]+$/);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/does not match/);
  });
  test("rejects non-string input", () => {
    // @ts-expect-error intentional
    expect(verifyRegex(123, /./).ok).toBe(false);
  });
});

describe("verifiers/verifyLength", () => {
  test("passes within range", () => {
    expect(verifyLength("hello", 1, 10).ok).toBe(true);
  });
  test("fails when too short", () => {
    expect(verifyLength("", 1, 10).ok).toBe(false);
  });
  test("fails when too long", () => {
    expect(verifyLength("hello", 1, 3).ok).toBe(false);
  });
  test("accepts Infinity as no upper bound", () => {
    expect(verifyLength("x".repeat(10_000), 1, Infinity).ok).toBe(true);
  });
});

describe("verifiers/verifyEnum", () => {
  test("passes when value in set", () => {
    expect(verifyEnum("a", ["a", "b", "c"]).ok).toBe(true);
  });
  test("fails when value not in set", () => {
    const r = verifyEnum("z", ["a", "b", "c"]);
    expect(r.ok).toBe(false);
    expect(r.details?.allowed).toEqual(["a", "b", "c"]);
  });
});

describe("verifiers/verifyTemporalEdge", () => {
  test("passes with only valid_from", () => {
    expect(verifyTemporalEdge({ valid_from: "2026-01-01" }).ok).toBe(true);
  });

  test("passes with valid_from <= valid_until", () => {
    expect(
      verifyTemporalEdge({ valid_from: "2026-01-01", valid_until: "2026-06-01" }).ok,
    ).toBe(true);
  });

  test("fails when valid_until precedes valid_from", () => {
    const r = verifyTemporalEdge({
      valid_from: "2026-06-01",
      valid_until: "2026-01-01",
    });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/before/);
  });

  test("fails on unparseable dates", () => {
    const r = verifyTemporalEdge({ valid_from: "not-a-date" });
    expect(r.ok).toBe(false);
  });

  test("accepts epoch millis", () => {
    const r = verifyTemporalEdge({ valid_from: 1_700_000_000_000, valid_until: 1_800_000_000_000 });
    expect(r.ok).toBe(true);
  });

  test("ignores empty valid_until", () => {
    expect(verifyTemporalEdge({ valid_from: "2026-01-01", valid_until: "" }).ok).toBe(true);
  });
});

describe("verifiers/verifyArrayItems", () => {
  test("passes when all items pass", () => {
    const r = verifyArrayItems(["a", "b"], (v) =>
      typeof v === "string" ? { ok: true, verifier: "str", errors: [] } : { ok: false, verifier: "str", errors: ["not string"] },
    );
    expect(r.ok).toBe(true);
    expect(r.details?.count).toBe(2);
  });

  test("fails on empty array by default", () => {
    const r = verifyArrayItems([], () => ({ ok: true, verifier: "x", errors: [] }));
    expect(r.ok).toBe(false);
  });

  test("allowEmpty option permits empty array", () => {
    const r = verifyArrayItems(
      [],
      () => ({ ok: true, verifier: "x", errors: [] }),
      { allowEmpty: true },
    );
    expect(r.ok).toBe(true);
  });

  test("aggregates errors with indices", () => {
    const r = verifyArrayItems([1, "b", 3], (v) =>
      typeof v === "string"
        ? { ok: true, verifier: "str", errors: [] }
        : { ok: false, verifier: "str", errors: ["not string"] },
    );
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual(["[0] not string", "[2] not string"]);
  });

  test("rejects non-array input", () => {
    const r = verifyArrayItems("nope", () => ({ ok: true, verifier: "x", errors: [] }));
    expect(r.ok).toBe(false);
  });
});

describe("verifiers/compose", () => {
  test("all() passes when every child passes", () => {
    const r = all([
      verifyLength("hi", 1, 10),
      verifyRegex("hi", /^[a-z]+$/),
    ]);
    expect(r.ok).toBe(true);
  });

  test("all() aggregates errors from all failing children", () => {
    const r = all([
      verifyLength("", 1, 10),
      verifyRegex("ABC", /^[a-z]+$/),
    ]);
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBe(2);
  });

  test("any() passes when at least one child passes", () => {
    const r = any([
      verifyLength("", 1, 10),
      verifyRegex("abc", /^[a-z]+$/),
    ]);
    expect(r.ok).toBe(true);
  });

  test("any() fails when all children fail", () => {
    const r = any([
      verifyLength("", 1, 10),
      verifyRegex("ABC", /^[a-z]+$/),
    ]);
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBe(2);
  });

  test("any() fails on empty verifier list", () => {
    expect(any([]).ok).toBe(false);
  });
});

describe("verifiers/graph-extraction integration", () => {
  test("validates a plausible extraction output", () => {
    const extraction = {
      entities: [
        { name: "Alice", type: "Person" },
        { name: "Project X", type: "Project" },
      ],
      edges: [
        { source: "Alice", target: "Project X", relation: "works_on", valid_from: "2026-01-01" },
      ],
    };
    const r = all([
      verifyRequiredFields(extraction, ["entities", "edges"]),
      verifyArrayItems(extraction.entities, (item) =>
        verifyRequiredFields(item, ["name", "type"]),
      ),
      verifyArrayItems(extraction.edges, (item) => {
        const e = item as Record<string, unknown>;
        return all([
          verifyRequiredFields(e, ["source", "target", "relation"]),
          verifyTemporalEdge(e),
        ]);
      }),
    ]);
    expect(r.ok).toBe(true);
  });

  test("catches inverted temporal edge in graph extraction", () => {
    const extraction = {
      entities: [{ name: "Alice", type: "Person" }],
      edges: [
        {
          source: "Alice",
          target: "Company X",
          relation: "works_at",
          valid_from: "2026-06-01",
          valid_until: "2026-01-01",
        },
      ],
    };
    const r = all([
      verifyRequiredFields(extraction, ["entities", "edges"]),
      verifyArrayItems(extraction.edges, (item) => verifyTemporalEdge(item as Record<string, unknown>)),
    ]);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /before/.test(e))).toBe(true);
  });
});
