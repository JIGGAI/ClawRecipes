import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

let mockQuestionResponse = "y";
vi.mock("node:readline/promises", () => ({
  createInterface: () => ({
    question: () => Promise.resolve(mockQuestionResponse),
    close: () => {},
  }),
}));

import { promptConfirmWithPlan, promptYesNo } from "../src/lib/prompt";

describe("prompt", () => {
  let origTTY: boolean | undefined;

  beforeEach(() => {
    origTTY = process.stdin.isTTY;
  });

  afterEach(() => {
    Object.defineProperty(process.stdin, "isTTY", { value: origTTY, configurable: true });
    vi.restoreAllMocks();
  });

  describe("promptYesNo", () => {
    test("returns false when stdin is not TTY", async () => {
      Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
      const result = await promptYesNo("test");
      expect(result).toBe(false);
    });

    test("returns true when TTY and user answers y", async () => {
      mockQuestionResponse = "y";
      Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
      const result = await promptYesNo("header");
      expect(result).toBe(true);
    });

    test("returns false when TTY and user answers n", async () => {
      mockQuestionResponse = "n";
      Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
      const result = await promptYesNo("header");
      expect(result).toBe(false);
    });

    test("returns true when TTY and user answers yes", async () => {
      mockQuestionResponse = "yes";
      Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
      const result = await promptYesNo("header");
      expect(result).toBe(true);
    });
  });

  describe("promptConfirmWithPlan", () => {
    test("returns true when options.yes and TTY", async () => {
      Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
      const result = await promptConfirmWithPlan({ a: 1 }, "Continue?", { yes: true });
      expect(result).toBe(true);
    });

    test("returns true when options.yes and !TTY", async () => {
      Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
      const result = await promptConfirmWithPlan({ a: 1 }, "Continue?", { yes: true });
      expect(result).toBe(true);
    });

    test("returns false when !TTY and no yes", async () => {
      Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
      const result = await promptConfirmWithPlan({ a: 1 }, "Continue?", {});
      expect(result).toBe(false);
    });

    test("prompts and returns true when TTY, no yes, user answers y", async () => {
      mockQuestionResponse = "y";
      Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const result = await promptConfirmWithPlan({ plan: "data" }, "Proceed?", {});
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify({ plan: { plan: "data" } }, null, 2));
    });
  });
});
