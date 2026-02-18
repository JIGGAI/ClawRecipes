import path from "node:path";
import { fileExists } from "./fs-utils";
import { MAX_RECIPE_ID_AUTO_INCREMENT } from "./constants";

export type PickRecipeIdOpts = {
  baseId: string;
  recipesDir: string;
  overwriteRecipe: boolean;
  autoIncrement: boolean;
  /** Returns true if the id is taken (by workspace file or built-in recipe). */
  isTaken: (id: string) => Promise<boolean>;
  /** When overwriteRecipe but id is taken by non-workspace source (agent only). */
  overwriteRecipeError?: (baseId: string) => string;
  /** Suggestion strings for the "id exists" error. */
  getSuggestions: (baseId: string) => string[];
  /** Format the "id exists" error message. */
  getConflictError: (baseId: string, suggestions: string[]) => string;
};

/**
 * Pick an available recipe id, applying overwrite/auto-increment semantics.
 * Shared by agent and team scaffold handlers.
 */
export async function pickRecipeId(opts: PickRecipeIdOpts): Promise<string> {
  const { baseId, recipesDir, overwriteRecipe, autoIncrement, isTaken, getSuggestions, getConflictError } = opts;

  if (!(await isTaken(baseId))) return baseId;

  if (overwriteRecipe) {
    const basePath = path.join(recipesDir, `${baseId}.md`);
    if (!(await fileExists(basePath)) && opts.overwriteRecipeError) {
      throw new Error(opts.overwriteRecipeError(baseId));
    }
    return baseId;
  }

  if (autoIncrement) {
    let n = 2;
    while (n < MAX_RECIPE_ID_AUTO_INCREMENT) {
      const candidate = `${baseId}-${n}`;
      if (!(await isTaken(candidate))) return candidate;
      n += 1;
    }
    throw new Error(`No available recipe id found for ${baseId} (tried up to -999)`);
  }

  const suggestions = getSuggestions(baseId);
  throw new Error(getConflictError(baseId, suggestions));
}
