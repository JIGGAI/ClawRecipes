import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { handleInstallSkill, handleInstallMarketplaceRecipe } from "../src/handlers/install";

vi.mock("../src/lib/recipes", () => ({
  loadRecipeById: vi.fn(),
}));
vi.mock("../src/lib/skill-install", () => ({
  detectMissingSkills: vi.fn(),
}));

import { loadRecipeById } from "../src/lib/recipes";
import { detectMissingSkills } from "../src/lib/skill-install";

describe("install handler", () => {
  let workspaceRoot: string;

  beforeEach(async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), "install-handler-"));
    workspaceRoot = path.join(base, "workspace");
    await fs.mkdir(workspaceRoot, { recursive: true });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(path.dirname(workspaceRoot), { recursive: true, force: true }).catch(() => {});
  });

  const mkApi = () =>
    ({
      config: {
        agents: { defaults: { workspace: workspaceRoot } },
        plugins: { entries: { recipes: { config: {} } } },
      },
    }) as any;

  describe("handleInstallSkill", () => {
    test("returns recipe null when loadRecipeById throws", async () => {
      vi.mocked(loadRecipeById).mockRejectedValue(new Error("Recipe not found"));
      vi.mocked(detectMissingSkills).mockResolvedValue(["slug-from-options"]);
      const api = mkApi();
      await fs.mkdir(path.resolve(workspaceRoot, "..", "skills"), { recursive: true });
      const origTTY = process.stdin.isTTY;
      Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
      try {
        const result = await handleInstallSkill(api, { idOrSlug: "some-slug", yes: true });
        expect(result.ok).toBe(false);
        expect(result.needCli).toBe(true);
        expect(result.missing).toContain("slug-from-options");
      } finally {
        Object.defineProperty(process.stdin, "isTTY", { value: origTTY, configurable: true });
      }
    });

    test("throws when both --global and --agent-id provided", async () => {
      vi.mocked(loadRecipeById).mockResolvedValue({ frontmatter: { id: "r" }, md: "" } as any);
      const api = mkApi();
      await expect(
        handleInstallSkill(api, { idOrSlug: "x", global: true, agentId: "a" })
      ).rejects.toThrow("Use only one of");
    });

    test("throws when --agent-id is empty after trim", async () => {
      const api = mkApi();
      await expect(
        handleInstallSkill(api, { idOrSlug: "x", agentId: "   " })
      ).rejects.toThrow("--agent-id cannot be empty");
    });

    test("throws when --team-id is empty", async () => {
      const api = mkApi();
      await expect(
        handleInstallSkill(api, { idOrSlug: "x", teamId: "   " })
      ).rejects.toThrow("--team-id cannot be empty");
    });

    test("returns nothing to install when recipe has no skills", async () => {
      vi.mocked(loadRecipeById).mockResolvedValue({
        frontmatter: { id: "r", requiredSkills: [], optionalSkills: [] },
        md: "",
      } as any);
      const api = mkApi();
      await fs.mkdir(path.resolve(workspaceRoot, "..", "skills"), { recursive: true });
      const result = await handleInstallSkill(api, { idOrSlug: "r" });
      expect(result.ok).toBe(true);
      expect((result as any).note).toBe("Nothing to install.");
      expect((result as any).installed).toEqual([]);
    });

    test("returns alreadyInstalled when nothing missing", async () => {
      vi.mocked(loadRecipeById).mockResolvedValue({
        frontmatter: { id: "r", requiredSkills: ["a", "b"] },
        md: "",
      } as any);
      vi.mocked(detectMissingSkills).mockResolvedValue([]);
      const api = mkApi();
      await fs.mkdir(path.resolve(workspaceRoot, "..", "skills"), { recursive: true });
      const result = await handleInstallSkill(api, { idOrSlug: "r" });
      expect(result.ok).toBe(true);
      expect((result as any).alreadyInstalled).toEqual(["a", "b"]);
    });

    test("returns non-interactive when !yes and !TTY", async () => {
      vi.mocked(loadRecipeById).mockResolvedValue({
        frontmatter: { id: "r", requiredSkills: ["x"] },
        md: "",
      } as any);
      vi.mocked(detectMissingSkills).mockResolvedValue(["x"]);
      const api = mkApi();
      await fs.mkdir(path.resolve(workspaceRoot, "..", "skills"), { recursive: true });
      const origTTY = process.stdin.isTTY;
      Object.defineProperty(process.stdin, "isTTY", { value: false, configurable: true });
      try {
        const result = await handleInstallSkill(api, { idOrSlug: "r", yes: false });
        expect(result.ok).toBe(false);
        expect((result as any).aborted).toBe("non-interactive");
      } finally {
        Object.defineProperty(process.stdin, "isTTY", { value: origTTY, configurable: true });
      }
    });

    test("returns user-declined when promptYesNo returns false", async () => {
      vi.mocked(loadRecipeById).mockResolvedValue({
        frontmatter: { id: "r", requiredSkills: ["x"] },
        md: "",
      } as any);
      vi.mocked(detectMissingSkills).mockResolvedValue(["x"]);
      const promptMod = await import("../src/lib/prompt");
      vi.spyOn(promptMod, "promptYesNo").mockResolvedValue(false);
      const api = mkApi();
      await fs.mkdir(path.resolve(workspaceRoot, "..", "skills"), { recursive: true });
      const origTTY = process.stdin.isTTY;
      Object.defineProperty(process.stdin, "isTTY", { value: true, configurable: true });
      try {
        const result = await handleInstallSkill(api, { idOrSlug: "r", yes: false });
        expect(result.ok).toBe(false);
        expect((result as any).aborted).toBe("user-declined");
      } finally {
        Object.defineProperty(process.stdin, "isTTY", { value: origTTY, configurable: true });
      }
    });

    test("returns needCli when yes and missing skills (skips prompt)", async () => {
      vi.mocked(loadRecipeById).mockResolvedValue({
        frontmatter: { id: "r", requiredSkills: ["skill-a"] },
        md: "",
      } as any);
      vi.mocked(detectMissingSkills).mockResolvedValue(["skill-a"]);
      const api = mkApi();
      await fs.mkdir(path.resolve(workspaceRoot, "..", "skills"), { recursive: true });
      const result = await handleInstallSkill(api, { idOrSlug: "r", yes: true });
      expect(result.ok).toBe(false);
      expect(result.needCli).toBe(true);
      expect(result.missing).toEqual(["skill-a"]);
      expect(result.installCommands).toBeDefined();
      expect(result.installCommands!.some((c) => c.includes("skill-a"))).toBe(true);
    });

    test("uses agent scope when agentId provided", async () => {
      vi.mocked(loadRecipeById).mockResolvedValue({
        frontmatter: { id: "r", requiredSkills: ["s"] },
        md: "",
      } as any);
      vi.mocked(detectMissingSkills).mockResolvedValue(["s"]);
      const api = mkApi();
      const agentSkillsDir = path.resolve(workspaceRoot, "..", "workspace-my-agent", "skills");
      await fs.mkdir(agentSkillsDir, { recursive: true });
      const result = await handleInstallSkill(api, { idOrSlug: "r", agentId: "my-agent", yes: true });
      expect(result.installDir).toBe(agentSkillsDir);
    });

    test("uses team scope when teamId provided", async () => {
      vi.mocked(loadRecipeById).mockResolvedValue({
        frontmatter: { id: "r", requiredSkills: ["s"] },
        md: "",
      } as any);
      vi.mocked(detectMissingSkills).mockResolvedValue(["s"]);
      const api = mkApi();
      const teamSkillsDir = path.resolve(workspaceRoot, "..", "workspace-my-team", "skills");
      await fs.mkdir(teamSkillsDir, { recursive: true });
      const result = await handleInstallSkill(api, { idOrSlug: "r", teamId: "my-team", yes: true });
      expect(result.installDir).toBe(teamSkillsDir);
    });
  });

  describe("handleInstallMarketplaceRecipe", () => {
    test("writes recipe and returns ok", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn()
          .mockResolvedValueOnce({
            ok: true,
            json: () =>
              Promise.resolve({ ok: true, recipe: { sourceUrl: "https://cdn.example.com/r.md" } }),
          })
          .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("# My Recipe\n\nContent") })
      );
      const api = mkApi();
      const recipesDir = path.join(workspaceRoot, "recipes");
      await fs.mkdir(recipesDir, { recursive: true });
      const result = await handleInstallMarketplaceRecipe(api, {
        slug: "my-recipe",
        registryBase: "https://registry.example.com",
      });
      expect(result.ok).toBe(true);
      expect(result.slug).toBe("my-recipe");
      expect(result.wrote).toBe(path.join(recipesDir, "my-recipe.md"));
      const content = await fs.readFile(result.wrote, "utf8");
      expect(content).toContain("# My Recipe");
    });
  });
});
