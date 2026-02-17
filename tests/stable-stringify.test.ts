import { describe, expect, test } from "vitest";
import { stableStringify } from "../src/lib/stable-stringify";

describe("stableStringify", () => {
  test("sorts object keys deterministically", () => {
    const a = { z: 1, a: 2, m: 3 };
    const b = { m: 3, a: 2, z: 1 };
    expect(stableStringify(a)).toBe(stableStringify(b));
    expect(stableStringify(a)).toBe('{"a":2,"m":3,"z":1}');
  });

  test("handles arrays", () => {
    expect(stableStringify([3, 1, 2])).toBe("[3,1,2]");
    expect(stableStringify([{ b: 1, a: 2 }])).toBe('[{"a":2,"b":1}]');
  });

  test("handles circular references", () => {
    const c: Record<string, unknown> = { x: 1 };
    c.self = c;
    expect(stableStringify(c)).toBe('{"self":"[Circular]","x":1}');
  });

  test("handles nested objects", () => {
    const obj = { outer: { inner: { z: 1, a: 2 } } };
    expect(stableStringify(obj)).toBe('{"outer":{"inner":{"a":2,"z":1}}}');
  });

  test("primitives pass through", () => {
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(42)).toBe("42");
    expect(stableStringify("hi")).toBe('"hi"');
  });
});
