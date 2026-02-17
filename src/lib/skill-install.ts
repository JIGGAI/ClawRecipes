import path from "node:path";
import type { RequiredRecipesConfig } from "./config";
import { fileExists } from "./fs-utils";

/** Build install commands for missing skills (cd workspace + npx clawhub install). */
export function skillInstallCommands(cfg: RequiredRecipesConfig, skills: string[]): string[] {
  const lines = [
    `cd "${"$WORKSPACE"}"  # set WORKSPACE=~/.openclaw/workspace`,
    ...skills.map((s) => `npx clawhub@latest install ${s}`),
  ];
  return lines;
}

/** Return skill IDs that don't have a directory under installDir. */
export async function detectMissingSkills(installDir: string, skills: string[]): Promise<string[]> {
  const missing: string[] = [];
  for (const s of skills) {
    const p = path.join(installDir, s);
    if (!(await fileExists(p))) missing.push(s);
  }
  return missing;
}
