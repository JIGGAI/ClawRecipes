import { describe, expect, test } from "vitest";
import { getRecipesConfig } from "../src/lib/config";

describe("config", () => {
  test("returns defaults when no config", () => {
    const cfg = getRecipesConfig({});
    expect(cfg.workspaceRecipesDir).toBe("recipes");
    expect(cfg.workspaceAgentsDir).toBe("agents");
    expect(cfg.cronInstallation).toBe("prompt");
    expect(cfg.autoInstallMissingSkills).toBe(false);
  });
  test("uses entries.recipes.config", () => {
    const cfg = getRecipesConfig({
      plugins: {
        entries: {
          recipes: {
            config: { workspaceRecipesDir: "custom", cronInstallation: "on" },
          },
        },
      },
    });
    expect(cfg.workspaceRecipesDir).toBe("custom");
    expect(cfg.cronInstallation).toBe("on");
  });
});
