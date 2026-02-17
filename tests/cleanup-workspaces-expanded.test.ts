import { describe, expect, test } from "vitest";
import {
  DEFAULT_ALLOWED_PREFIXES,
  DEFAULT_PROTECTED_TEAM_IDS,
  isEligibleTeamId,
  parseTeamIdFromWorkspaceDirName,
} from "../src/lib/cleanup-workspaces";

describe("cleanup-workspaces (pure functions)", () => {
  describe("parseTeamIdFromWorkspaceDirName", () => {
    test("extracts teamId from workspace-<id> format", () => {
      expect(parseTeamIdFromWorkspaceDirName("workspace-smoke-123-team")).toBe("smoke-123-team");
      expect(parseTeamIdFromWorkspaceDirName("workspace-qa-abc-team")).toBe("qa-abc-team");
      expect(parseTeamIdFromWorkspaceDirName("workspace-development-team")).toBe("development-team");
    });
    test("returns null for non-workspace names", () => {
      expect(parseTeamIdFromWorkspaceDirName("other")).toBeNull();
      expect(parseTeamIdFromWorkspaceDirName("workspace-")).toBeNull();
    });
  });

  describe("isEligibleTeamId", () => {
    test("rejects teamId that does not end with -team", () => {
      expect(isEligibleTeamId({ teamId: "smoke-123", prefixes: ["smoke-"], protectedTeamIds: [] })).toEqual({
        ok: false,
        reason: "teamId does not end with -team",
      });
    });

    test("rejects protected teamIds", () => {
      expect(
        isEligibleTeamId({
          teamId: "development-team",
          prefixes: ["smoke-"],
          protectedTeamIds: ["development-team"],
        })
      ).toEqual({ ok: false, reason: "protected teamId" });

      expect(
        isEligibleTeamId({
          teamId: "development-team-team",
          prefixes: ["smoke-"],
          protectedTeamIds: ["development-team"],
        })
      ).toEqual({ ok: false, reason: "protected teamId" });
    });

    test("rejects teamId without allowed prefix", () => {
      expect(
        isEligibleTeamId({
          teamId: "random-team",
          prefixes: ["smoke-", "qa-", "tmp-", "test-"],
          protectedTeamIds: [],
        })
      ).toEqual({
        ok: false,
        reason: "teamId does not start with an allowed prefix (smoke-, qa-, tmp-, test-)",
      });
    });

    test("accepts eligible teamId", () => {
      expect(
        isEligibleTeamId({
          teamId: "smoke-123-team",
          prefixes: ["smoke-"],
          protectedTeamIds: ["development-team"],
        })
      ).toEqual({ ok: true });

      expect(
        isEligibleTeamId({
          teamId: "qa-abc-team",
          prefixes: [...DEFAULT_ALLOWED_PREFIXES],
          protectedTeamIds: [...DEFAULT_PROTECTED_TEAM_IDS],
        })
      ).toEqual({ ok: true });
    });
  });
});
