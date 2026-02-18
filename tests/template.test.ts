import { describe, expect, test } from "vitest";
import { renderTemplate } from "../src/lib/template";

describe("template", () => {
  test("replaces {{key}} with vars value", () => {
    expect(renderTemplate("Hello {{name}}!", { name: "World" })).toBe("Hello World!");
  });
  test("replaces multiple placeholders", () => {
    expect(
      renderTemplate("{{a}} and {{b}}", { a: "one", b: "two" })
    ).toBe("one and two");
  });
  test("uses empty string for missing key", () => {
    expect(renderTemplate("Hello {{missing}}!", {})).toBe("Hello !");
  });
  test("handles key with dots and hyphens", () => {
    expect(renderTemplate("{{foo.bar-baz}}", { "foo.bar-baz": "ok" })).toBe("ok");
  });
});
