export type RecipesConfig = {
  workspaceRecipesDir?: string;
  workspaceAgentsDir?: string;
  workspaceSkillsDir?: string;
  workspaceTeamsDir?: string;
  autoInstallMissingSkills?: boolean;
  confirmAutoInstall?: boolean;
  cronInstallation?: "off" | "prompt" | "on";
};

export type RequiredRecipesConfig = Required<RecipesConfig>;

function extractPluginRecipesConfig(config: {
  plugins?: { entries?: { recipes?: { config?: RecipesConfig }; [k: string]: unknown } };
}): RecipesConfig {
  return (config?.plugins?.entries?.["recipes"]?.config ?? config?.plugins?.entries?.recipes?.config ?? {}) as RecipesConfig;
}

const DEFAULT_RECIPES_CONFIG: RequiredRecipesConfig = {
  workspaceRecipesDir: "recipes",
  workspaceAgentsDir: "agents",
  workspaceSkillsDir: "skills",
  workspaceTeamsDir: "teams",
  autoInstallMissingSkills: false,
  confirmAutoInstall: true,
  cronInstallation: "prompt",
};

/**
 * Get recipes plugin config with defaults.
 * @param config - OpenClaw config (plugins.entries.recipes.config)
 * @returns RequiredRecipesConfig with all keys defined
 */
export function getRecipesConfig(config: {
  plugins?: { entries?: { recipes?: { config?: RecipesConfig }; [k: string]: unknown } };
}): RequiredRecipesConfig {
  const cfg = extractPluginRecipesConfig(config);
  return {
    workspaceRecipesDir: cfg.workspaceRecipesDir ?? DEFAULT_RECIPES_CONFIG.workspaceRecipesDir,
    workspaceAgentsDir: cfg.workspaceAgentsDir ?? DEFAULT_RECIPES_CONFIG.workspaceAgentsDir,
    workspaceSkillsDir: cfg.workspaceSkillsDir ?? DEFAULT_RECIPES_CONFIG.workspaceSkillsDir,
    workspaceTeamsDir: cfg.workspaceTeamsDir ?? DEFAULT_RECIPES_CONFIG.workspaceTeamsDir,
    autoInstallMissingSkills: cfg.autoInstallMissingSkills ?? DEFAULT_RECIPES_CONFIG.autoInstallMissingSkills,
    confirmAutoInstall: cfg.confirmAutoInstall ?? DEFAULT_RECIPES_CONFIG.confirmAutoInstall,
    cronInstallation: cfg.cronInstallation ?? DEFAULT_RECIPES_CONFIG.cronInstallation,
  };
}
