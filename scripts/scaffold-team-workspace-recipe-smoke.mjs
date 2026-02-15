#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const die = (msg) => {
  console.error(`\n[workspace-recipe-smoke] ERROR: ${msg}`);
  process.exitCode = 1;
};

const run = (cmd, args, opts = {}) => {
  const res = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (res.status !== 0) {
    const stderr = String(res.stderr ?? "").trim();
    const stdout = String(res.stdout ?? "").trim();
    throw new Error(
      `Command failed (exit=${res.status}): ${cmd} ${args.join(" ")}\n` +
        (stdout ? `stdout:\n${stdout}\n` : "") +
        (stderr ? `stderr:\n${stderr}\n` : "")
    );
  }
  return { stdout: String(res.stdout ?? ""), stderr: String(res.stderr ?? "") };
};

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const fileExists = async (p) => {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
};

async function main() {
  const ts = Date.now();
  const recipeId = process.env.RECIPE_ID || "product-team";
  const teamId = `smoke-workspace-recipe-${ts}-team`;

  const wsOut = run("openclaw", ["config", "get", "agents.defaults.workspace"]).stdout.trim();
  assert(wsOut, "agents.defaults.workspace not set");

  const recipesDir = path.join(wsOut, "recipes");
  const expectedRecipeId = teamId; // default behavior: recipe id defaults to teamId
  const recipePath = path.join(recipesDir, `${expectedRecipeId}.md`);

  console.log(`[workspace-recipe-smoke] recipeId=${recipeId}`);
  console.log(`[workspace-recipe-smoke] teamId=${teamId}`);
  console.log(`[workspace-recipe-smoke] recipePath=${recipePath}`);

  let scaffoldOk = false;
  try {
    // Use --overwrite to keep behavior consistent with other smoke scripts.
    // We do not pass --overwrite-recipe; the file should be created if missing.
    run("openclaw", ["recipes", "scaffold-team", recipeId, "-t", teamId, "--overwrite"]);
    scaffoldOk = true;

    assert(await fileExists(recipePath), `Missing workspace recipe at ${recipePath}`);

    const raw = await fs.readFile(recipePath, "utf8");
    assert(raw.startsWith("---\n"), "Recipe markdown must start with YAML frontmatter");
    assert(raw.includes(`\nid: ${expectedRecipeId}\n`) || raw.includes(`\nid: \"${expectedRecipeId}\"\n`), `frontmatter.id must equal ${expectedRecipeId}`);

    console.log("[workspace-recipe-smoke] OK");
  } finally {
    // Best-effort cleanup: remove team workspace dir and generated recipe file.
    // Team dir is sibling of workspace: ~/.openclaw/workspace-<teamId>
    if (scaffoldOk) {
      const teamDir = path.resolve(wsOut, "..", `workspace-${teamId}`);
      try {
        await fs.rm(teamDir, { recursive: true, force: true });
        console.log(`[workspace-recipe-smoke] cleaned up ${teamDir}`);
      } catch (e) {
        console.error(`[workspace-recipe-smoke] cleanup failed (teamDir): ${e instanceof Error ? e.message : String(e)}`);
      }
      try {
        await fs.rm(recipePath, { force: true });
        console.log(`[workspace-recipe-smoke] cleaned up ${recipePath}`);
      } catch (e) {
        console.error(`[workspace-recipe-smoke] cleanup failed (recipePath): ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }
}

main().catch((e) => {
  die(e instanceof Error ? e.message : String(e));
});
